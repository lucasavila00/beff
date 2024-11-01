use crate::parse::parse_with_swc;
use crate::BffFileName;
use crate::ImportReference;
use crate::ParsedModule;
use crate::ParsedModuleLocals;
use crate::ParserOfModuleLocals;
use crate::SymbolExport;
use crate::SymbolExportDefault;
use crate::SymbolsExportsModule;
use crate::UnresolvedExport;
use anyhow::Result;
use std::collections::HashMap;
use std::rc::Rc;
use swc_atoms::JsWord;
use swc_common::SourceMap;
use swc_common::Spanned;
use swc_common::{FileName, SyntaxContext};
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
use swc_ecma_ast::{
    ImportDecl, ImportNamedSpecifier, ImportSpecifier, TsInterfaceDecl, TsTypeAliasDecl,
};
use swc_ecma_visit::Visit;

pub trait FsModuleResolver {
    fn resolve_import(&mut self, module_specifier: &str) -> Option<BffFileName>;
}
pub struct ImportsVisitor<'a, R: FsModuleResolver> {
    pub resolver: &'a mut R,
    pub imports: HashMap<(JsWord, SyntaxContext), Rc<ImportReference>>,
    pub symbol_exports: SymbolsExportsModule,
    pub current_file: BffFileName,
    pub unresolved_exports: Vec<UnresolvedExport>,
    pub export_default: Option<Rc<SymbolExportDefault>>,
}
impl<'a, R: FsModuleResolver> ImportsVisitor<'a, R> {
    pub fn from_file(current_file: BffFileName, resolver: &'a mut R) -> ImportsVisitor<'a, R> {
        ImportsVisitor {
            imports: HashMap::new(),
            symbol_exports: SymbolsExportsModule::new(),
            current_file,
            unresolved_exports: Vec::new(),
            resolver,
            export_default: None,
        }
    }
    fn resolve_import(&mut self, module_specifier: &str) -> Option<BffFileName> {
        self.resolver.resolve_import(module_specifier)
    }

    fn insert_import_named(&mut self, local: &Ident, module_specifier: &str, orig: &JsWord) {
        let k = (local.sym.clone(), local.span.ctxt);
        let v = self.resolve_import(module_specifier);

        if let Some(v) = v {
            self.imports.insert(
                k,
                Rc::new(ImportReference::Named {
                    orig: Rc::new(orig.clone()),
                    file_name: v,
                    span: local.span,
                }),
            );
        }
    }
    fn insert_import_default(&mut self, local: &Ident, module_specifier: &str) {
        let k = (local.sym.clone(), local.span.ctxt);
        let v = self.resolve_import(module_specifier);

        if let Some(v) = v {
            self.imports
                .insert(k, Rc::new(ImportReference::Default { file_name: v }));
        }
    }
    fn insert_import_star(&mut self, local: &Ident, module_specifier: &str) {
        let k = (local.sym.clone(), local.span.ctxt);
        let v = self.resolve_import(module_specifier);

        if let Some(v) = v {
            self.imports.insert(
                k,
                Rc::new(ImportReference::Star {
                    file_name: v,
                    span: local.span,
                }),
            );
        }
    }
}

impl<'a, R: FsModuleResolver> Visit for ImportsVisitor<'a, R> {
    fn visit_export_default_expr(&mut self, n: &ExportDefaultExpr) {
        self.export_default = Some(
            SymbolExportDefault {
                symbol_export: Rc::new(*n.expr.clone()),
                span: n.span,
                file_name: self.current_file.clone(),
            }
            .into(),
        );
    }

    fn visit_export_decl(&mut self, n: &ExportDecl) {
        match &n.decl {
            Decl::TsInterface(n) => {
                let TsInterfaceDecl { id, .. } = &**n;
                self.symbol_exports.insert_type(
                    id.sym.clone(),
                    Rc::new(SymbolExport::TsInterfaceDecl {
                        decl: Rc::new(*n.clone()),
                        span: n.span,
                        original_file: self.current_file.clone(),
                    }),
                );
            }
            Decl::TsEnum(decl) => {
                let TsEnumDecl { id, .. } = &**decl;
                self.symbol_exports.insert_type(
                    id.sym.clone(),
                    Rc::new(SymbolExport::TsEnumDecl {
                        decl: Rc::new(*decl.clone()),
                        span: decl.span,
                        original_file: self.current_file.clone(),
                    }),
                );
                self.symbol_exports.insert_value(
                    id.sym.clone(),
                    Rc::new(SymbolExport::TsEnumDecl {
                        decl: Rc::new(*decl.clone()),
                        span: decl.span,
                        original_file: self.current_file.clone(),
                    }),
                );
            }
            Decl::TsTypeAlias(a) => {
                let TsTypeAliasDecl {
                    id,
                    type_ann,
                    type_params,
                    span,
                    ..
                } = &**a;
                self.symbol_exports.insert_type(
                    id.sym.clone(),
                    Rc::new(SymbolExport::TsType {
                        ty: Rc::new(*type_ann.clone()),
                        name: id.sym.clone(),
                        params: type_params.as_ref().map(|it| it.as_ref().clone().into()),
                        span: *span,
                        original_file: self.current_file.clone(),
                    }),
                );
            }
            Decl::Var(var_decl) => {
                for it in &var_decl.decls {
                    if let Some(expr) = &it.init {
                        if let Pat::Ident(it) = &it.name {
                            let name = it.sym.clone();
                            let export = Rc::new(SymbolExport::ValueExpr {
                                expr: Rc::new(*expr.clone()),
                                name: name.clone(),
                                span: it.span,
                                original_file: self.current_file.clone(),
                            });
                            self.symbol_exports.insert_value(name, export);
                        }
                    }

                    if var_decl.declare {
                        if let Pat::Ident(it) = &it.name {
                            if let Some(ann) = &it.type_ann {
                                let name = it.sym.clone();
                                let export = Rc::new(SymbolExport::ExprDecl {
                                    ty: Rc::new(*ann.type_ann.clone()),
                                    name: name.clone(),
                                    span: it.span,
                                    original_file: self.current_file.clone(),
                                });
                                self.symbol_exports.insert_value(name, export);
                            }
                        }
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
                            if let ModuleExportName::Ident(id) = name {
                                if let Some(file_name) = self.resolve_import(&src.value) {
                                    self.symbol_exports.insert_unknown(
                                        id.sym.clone(),
                                        Rc::new(SymbolExport::StarOfOtherFile {
                                            reference: ImportReference::Star {
                                                file_name: file_name.clone(),
                                                span: id.span,
                                            }
                                            .into(),
                                            span: id.span,
                                        }),
                                    )
                                }
                            }
                        }
                        ExportSpecifier::Named(ExportNamedSpecifier { orig, exported, .. }) => {
                            if let ModuleExportName::Ident(id) = orig {
                                let name = match exported {
                                    Some(ModuleExportName::Ident(ex)) => ex.sym.clone(),
                                    Some(ModuleExportName::Str(st)) => st.value.clone(),
                                    None => id.sym.clone(),
                                };
                                if let Some(file_name) = self.resolve_import(&src.value) {
                                    self.symbol_exports.insert_unknown(
                                        name,
                                        Rc::new(SymbolExport::SomethingOfOtherFile {
                                            something: id.sym.clone(),
                                            file: file_name.clone(),
                                            span: id.span,
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
                                    Some(ModuleExportName::Ident(ex)) => ex.sym.clone(),
                                    Some(ModuleExportName::Str(st)) => st.value.clone(),
                                    None => id.sym.clone(),
                                };
                                self.unresolved_exports.push(UnresolvedExport {
                                    name: id.sym.clone(),
                                    span: id.span.ctxt,
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
        if let Some(file_name) = self.resolve_import(&n.src.value) {
            self.symbol_exports.extend(file_name);
        }
    }
    fn visit_import_decl(&mut self, node: &ImportDecl) {
        let module_specifier = node.src.value.to_string();

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
        FileName::Real(file_name.to_string().into()),
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
        let k = (unresolved.name.clone(), unresolved.span);
        if let Some((params, ty)) = locals.content.type_aliases.get(&k) {
            symbol_exports.insert_type(
                renamed.clone(),
                Rc::new(SymbolExport::TsType {
                    ty: ty.clone(),
                    name: k.0,
                    params: params.clone(),
                    span: ty.span(),
                    original_file: file_name.clone(),
                }),
            );
            continue;
        }

        if let Some(enum_) = locals.content.enums.get(&k) {
            symbol_exports.insert_type(
                renamed,
                Rc::new(SymbolExport::TsEnumDecl {
                    decl: enum_.clone(),
                    span: enum_.span(),
                    original_file: file_name.clone(),
                }),
            );
            continue;
        }

        if let Some(intf) = locals.content.interfaces.get(&k) {
            symbol_exports.insert_type(
                renamed,
                Rc::new(SymbolExport::TsInterfaceDecl {
                    decl: intf.clone(),
                    span: intf.span(),
                    original_file: file_name.clone(),
                }),
            );
            continue;
        }
        if let Some(import) = v.imports.get(&k) {
            match &**import {
                ImportReference::Named { orig, span, .. } => {
                    let it = Rc::new(SymbolExport::SomethingOfOtherFile {
                        something: orig.as_ref().clone(),
                        file: file_name.clone(),
                        span: *span,
                    });
                    symbol_exports.insert_unknown(renamed, it);
                    continue;
                }
                ImportReference::Star { span, .. } => {
                    symbol_exports.insert_unknown(
                        renamed,
                        Rc::new(SymbolExport::StarOfOtherFile {
                            reference: import.clone(),
                            span: *span,
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
        export_default: v.export_default,
    });
    Ok(f)
}
