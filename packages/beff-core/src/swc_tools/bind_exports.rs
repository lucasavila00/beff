use crate::Anchor;
use crate::BffFileName;
use crate::ImportReference;
use crate::ParsedModule;
use crate::ParsedModuleLocals;
use crate::SymbolsExportsModule;
use crate::UnresolvedExport;
use crate::swc_tools::SymbolExport;
use crate::swc_tools::SymbolExportDefault;
use crate::swc_tools::bind_locals::ParserOfModuleLocals;
use crate::swc_tools::parse::parse_with_swc;
use anyhow::Result;
use std::collections::HashMap;
use std::rc::Rc;
use swc_common::FileName;
use swc_common::SourceMap;
use swc_common::Spanned;
use swc_ecma_ast::Decl;
use swc_ecma_ast::ExportAll;
use swc_ecma_ast::ExportDecl;
use swc_ecma_ast::ExportDefaultExpr;
use swc_ecma_ast::ExportNamedSpecifier;
use swc_ecma_ast::ExportNamespaceSpecifier;
use swc_ecma_ast::ExportSpecifier;
use swc_ecma_ast::Ident;
use swc_ecma_ast::ImportDefaultSpecifier;
use swc_ecma_ast::ImportStarAsSpecifier;
use swc_ecma_ast::ModuleExportName;
use swc_ecma_ast::NamedExport;
use swc_ecma_ast::Pat;
use swc_ecma_ast::TsEnumDecl;
use swc_ecma_ast::{ImportDecl, ImportNamedSpecifier, ImportSpecifier, TsInterfaceDecl};
use swc_ecma_visit::Visit;

pub trait FsModuleResolver {
    fn resolve_import(
        &mut self,
        current_file: BffFileName,
        module_specifier: &str,
    ) -> Option<BffFileName>;
}
pub struct ImportsVisitor<'a, R: FsModuleResolver> {
    pub resolver: &'a mut R,
    pub imports: HashMap<String, Rc<ImportReference>>,
    pub symbol_exports: SymbolsExportsModule,
    pub current_file: BffFileName,
    pub unresolved_exports: Vec<UnresolvedExport>,
}
impl<'a, R: FsModuleResolver> ImportsVisitor<'a, R> {
    pub fn from_file(current_file: BffFileName, resolver: &'a mut R) -> ImportsVisitor<'a, R> {
        ImportsVisitor {
            imports: HashMap::new(),
            symbol_exports: SymbolsExportsModule::new(),
            current_file,
            unresolved_exports: Vec::new(),
            resolver,
        }
    }
    fn resolve_import(&mut self, module_specifier: &str) -> Option<BffFileName> {
        self.resolver
            .resolve_import(self.current_file.clone(), module_specifier)
    }

    fn insert_import_named(&mut self, local: &Ident, module_specifier: &str, orig: &str) {
        let v = self.resolve_import(module_specifier);

        if let Some(v) = v {
            self.imports.insert(
                local.sym.to_string(),
                Rc::new(ImportReference::Named {
                    original_name: Rc::new(orig.to_string()),
                    file_name: v,
                    import_statement_anchor: Anchor::new(self.current_file.clone(), local.span),
                }),
            );
        }
    }
    fn insert_import_default(&mut self, local: &Ident, module_specifier: &str) {
        let v = self.resolve_import(module_specifier);

        if let Some(v) = v {
            self.imports.insert(
                local.sym.to_string(),
                Rc::new(ImportReference::Default {
                    file_name: v,
                    import_statement_anchor: Anchor::new(self.current_file.clone(), local.span),
                }),
            );
        }
    }
    fn insert_import_star(&mut self, local: &Ident, module_specifier: &str) {
        let v = self.resolve_import(module_specifier);

        if let Some(v) = v {
            self.imports.insert(
                local.sym.to_string(),
                Rc::new(ImportReference::Star {
                    file_name: v,
                    import_statement_anchor: Anchor::new(self.current_file.clone(), local.span),
                }),
            );
        }
    }
}

impl<R: FsModuleResolver> Visit for ImportsVisitor<'_, R> {
    fn visit_export_default_expr(&mut self, n: &ExportDefaultExpr) {
        self.symbol_exports.set_default_export(
            SymbolExportDefault::Expr {
                export_expr: Rc::new(*n.expr.clone()),
                anchor: Anchor::new(self.current_file.clone(), n.span),
            }
            .into(),
        );
    }

    fn visit_export_decl(&mut self, n: &ExportDecl) {
        match &n.decl {
            Decl::TsInterface(n) => {
                let TsInterfaceDecl { id, .. } = &**n;
                self.symbol_exports.insert_type(
                    id.sym.to_string(),
                    Rc::new(SymbolExport::TsInterfaceDecl {
                        decl: Rc::new(*n.clone()),
                        original_file: self.current_file.clone(),
                    }),
                );
            }
            Decl::TsEnum(decl) => {
                let TsEnumDecl { id, .. } = &**decl;
                self.symbol_exports.insert_type(
                    id.sym.to_string(),
                    Rc::new(SymbolExport::TsEnumDecl {
                        decl: Rc::new(*decl.clone()),
                        original_file: self.current_file.clone(),
                    }),
                );
                self.symbol_exports.insert_value(
                    id.sym.to_string(),
                    Rc::new(SymbolExport::TsEnumDecl {
                        decl: Rc::new(*decl.clone()),
                        original_file: self.current_file.clone(),
                    }),
                );
            }
            Decl::TsTypeAlias(alias) => {
                self.symbol_exports.insert_type(
                    alias.id.sym.to_string(),
                    Rc::new(SymbolExport::TsType {
                        decl: Rc::new(*alias.clone()),
                        original_file: self.current_file.clone(),
                        name: alias.id.sym.to_string(),
                    }),
                );
            }
            Decl::Var(var_decl) => {
                for it in &var_decl.decls {
                    if let Some(expr) = &it.init
                        && let Pat::Ident(it) = &it.name
                    {
                        let name = it.sym.clone();
                        let export = Rc::new(SymbolExport::ValueExpr {
                            expr: Rc::new(*expr.clone()),
                            name: name.to_string(),
                            span: it.span,
                            original_file: self.current_file.clone(),
                        });
                        self.symbol_exports.insert_value(it.sym.to_string(), export);
                    }

                    if var_decl.declare
                        && let Pat::Ident(it) = &it.name
                        && let Some(ann) = &it.type_ann
                    {
                        let name = it.sym.clone();
                        let export = Rc::new(SymbolExport::ExprDecl {
                            ty: Rc::new(*ann.type_ann.clone()),
                            name: name.to_string(),
                            span: it.span,
                            original_file: self.current_file.clone(),
                        });
                        self.symbol_exports.insert_value(it.sym.to_string(), export);
                    }
                }
            }

            Decl::TsModule(_) | Decl::Using(_) | Decl::Class(_) | Decl::Fn(_) => {}
        }
    }

    fn visit_named_export(&mut self, n: &NamedExport) {
        match &n.src {
            Some(src) => {
                //
                for s in &n.specifiers {
                    match s {
                        ExportSpecifier::Default(_) => {}
                        ExportSpecifier::Namespace(ExportNamespaceSpecifier { name, .. }) => {
                            if let ModuleExportName::Ident(id) = name
                                && let Some(file_name) =
                                    self.resolve_import(&src.value.to_string_lossy())
                            {
                                self.symbol_exports.insert_unknown(
                                    id.sym.to_string(),
                                    Rc::new(SymbolExport::StarOfOtherFile {
                                        reference: ImportReference::Star {
                                            file_name: file_name.clone(),
                                            import_statement_anchor: Anchor::new(
                                                self.current_file.clone(),
                                                id.span,
                                            ),
                                        }
                                        .into(),
                                    }),
                                )
                            }
                        }
                        ExportSpecifier::Named(ExportNamedSpecifier { orig, exported, .. }) => {
                            if let ModuleExportName::Ident(id) = orig {
                                let name = match exported {
                                    Some(ModuleExportName::Ident(ex)) => ex.sym.clone().to_string(),
                                    Some(ModuleExportName::Str(st)) => {
                                        st.value.clone().to_string_lossy().to_string()
                                    }
                                    None => id.sym.clone().to_string(),
                                };
                                if let Some(file_name) =
                                    self.resolve_import(&src.value.to_string_lossy())
                                {
                                    self.symbol_exports.insert_unknown(
                                        name.to_string(),
                                        Rc::new(SymbolExport::SomethingOfOtherFile {
                                            something: id.sym.to_string(),
                                            file: file_name.clone(),
                                        }),
                                    )
                                }
                            }
                        }
                    }
                }
            }
            None => {
                for s in &n.specifiers {
                    match s {
                        ExportSpecifier::Default(_) => {}
                        ExportSpecifier::Namespace(_) => {
                            unreachable!("cannot be namespace without source")
                        }
                        ExportSpecifier::Named(ExportNamedSpecifier { orig, exported, .. }) => {
                            if let ModuleExportName::Ident(id) = orig {
                                let renamed = match exported {
                                    Some(ModuleExportName::Ident(ex)) => ex.sym.to_string(),
                                    Some(ModuleExportName::Str(st)) => {
                                        st.value.to_string_lossy().to_string()
                                    }
                                    None => id.sym.to_string(),
                                };
                                self.unresolved_exports.push(UnresolvedExport {
                                    name: id.sym.to_string(),
                                    span: id.span,
                                    renamed,
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    fn visit_export_all(&mut self, n: &ExportAll) {
        if let Some(file_name) = self.resolve_import(&n.src.value.to_string_lossy()) {
            self.symbol_exports.extend(file_name);
        }
    }
    fn visit_import_decl(&mut self, node: &ImportDecl) {
        let module_specifier = node.src.value.to_string_lossy();

        for x in &node.specifiers {
            match x {
                ImportSpecifier::Named(ImportNamedSpecifier {
                    local, imported, ..
                }) => match imported {
                    Some(imported) => match imported {
                        ModuleExportName::Ident(renamed) => {
                            self.insert_import_named(local, &module_specifier, &renamed.sym)
                        }
                        ModuleExportName::Str(_) => {}
                    },
                    None => self.insert_import_named(local, &module_specifier, &local.sym),
                },
                ImportSpecifier::Namespace(ImportStarAsSpecifier { local, .. }) => {
                    self.insert_import_star(local, &module_specifier)
                }
                ImportSpecifier::Default(ImportDefaultSpecifier { local, .. }) => {
                    self.insert_import_default(local, &module_specifier)
                }
            }
        }
    }
}

pub fn parse_and_bind<R: FsModuleResolver>(
    resolver: &mut R,
    file_name: &BffFileName,
    content: &str,
) -> Result<Rc<ParsedModule>> {
    log::debug!("RUST: Parsing file {file_name:?}");
    let cm: SourceMap = SourceMap::default();
    let source_file = cm.new_source_file(
        FileName::Real(file_name.to_string().into()).into(),
        content.to_owned(),
    );
    let (module, comments) = parse_with_swc(&source_file, cm, file_name)?;

    let mut v = ImportsVisitor::from_file(BffFileName::new(module.fm.name.to_string()), resolver);
    v.visit_module(&module.module);

    let mut locals = ParserOfModuleLocals {
        content: ParsedModuleLocals::new(),
    };
    locals.visit_module(&module.module);
    locals.visit_module_item_list(&module.module.body);

    let mut symbol_exports = v.symbol_exports;
    for unresolved in v.unresolved_exports {
        let renamed = unresolved.renamed;
        let js_word = unresolved.name.clone();
        let k = unresolved.name.to_string();
        if let Some(ts_type) = locals.content.type_aliases.get(&k) {
            symbol_exports.insert_type(
                renamed.to_string(),
                Rc::new(SymbolExport::TsType {
                    decl: ts_type.clone(),
                    original_file: file_name.clone(),
                    name: k,
                }),
            );
            continue;
        }

        if let Some(enum_) = locals.content.enums.get(&k) {
            symbol_exports.insert_type(
                renamed.to_string(),
                Rc::new(SymbolExport::TsEnumDecl {
                    decl: enum_.clone(),
                    original_file: file_name.clone(),
                }),
            );
            continue;
        }

        if let Some(intf) = locals.content.interfaces.get(&k) {
            symbol_exports.insert_type(
                renamed.to_string(),
                Rc::new(SymbolExport::TsInterfaceDecl {
                    decl: intf.clone(),
                    original_file: file_name.clone(),
                }),
            );
            continue;
        }

        if let Some(v) = locals.content.exprs.get(&k) {
            symbol_exports.insert_value(
                renamed.to_string(),
                Rc::new(SymbolExport::ValueExpr {
                    expr: v.clone(),
                    name: js_word.clone(),
                    span: v.span(),
                    original_file: file_name.clone(),
                }),
            );
            continue;
        }

        if let Some(v) = locals.content.exprs_decls.get(&k) {
            symbol_exports.insert_value(
                renamed.to_string(),
                Rc::new(SymbolExport::ExprDecl {
                    ty: v.clone(),
                    name: js_word.clone(),
                    span: v.span(),
                    original_file: file_name.clone(),
                }),
            );
            continue;
        }

        if let Some(import) = v.imports.get(&k) {
            match &**import {
                ImportReference::Named {
                    original_name: orig,
                    ..
                } => {
                    let it = Rc::new(SymbolExport::SomethingOfOtherFile {
                        something: orig.as_ref().to_string(),
                        file: file_name.clone(),
                    });
                    symbol_exports.insert_unknown(renamed.to_string(), it);
                    continue;
                }
                ImportReference::Star { .. } => {
                    symbol_exports.insert_unknown(
                        renamed.to_string(),
                        Rc::new(SymbolExport::StarOfOtherFile {
                            reference: import.clone(),
                        }),
                    );
                }

                ImportReference::Default { .. } => {
                    continue;
                }
            }
        }
    }

    let f = Rc::new(ParsedModule {
        module,
        symbol_exports,
        imports: v.imports,
        comments,
        locals: locals.content,
    });
    Ok(f)
}
