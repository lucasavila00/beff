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
use anyhow::anyhow;
use anyhow::Result;
use std::collections::HashMap;
use std::rc::Rc;
use swc_atoms::JsWord;
use swc_common::SourceMap;
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
            self.imports
                .insert(k, Rc::new(ImportReference::Star { file_name: v }));
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
                self.symbol_exports.insert(
                    id.sym.clone(),
                    Rc::new(SymbolExport::TsInterfaceDecl(Rc::new(*n.clone()))),
                );
            }
            Decl::TsTypeAlias(a) => {
                let TsTypeAliasDecl { id, type_ann, .. } = &**a;
                self.symbol_exports.insert(
                    id.sym.clone(),
                    Rc::new(SymbolExport::TsType {
                        ty: Rc::new(*type_ann.clone()),
                        name: id.sym.clone(),
                    }),
                );
            }
            Decl::Var(decl) => {
                for it in &decl.decls {
                    if let Some(expr) = &it.init {
                        match &it.name {
                            Pat::Ident(it) => {
                                let name = it.sym.clone();
                                let export = Rc::new(SymbolExport::ValueExpr {
                                    expr: Rc::new(*expr.clone()),
                                    name: name.clone(),
                                });
                                self.symbol_exports.insert(name, export);
                            }
                            _ => {}
                        }
                    }
                }
            }
            Decl::TsModule(_) | Decl::Using(_) | Decl::Class(_) | Decl::Fn(_) | Decl::TsEnum(_) => {
            }
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
                                    self.symbol_exports.insert(
                                        id.sym.clone(),
                                        Rc::new(SymbolExport::StarOfOtherFile(
                                            ImportReference::Star {
                                                file_name: file_name.clone(),
                                            }
                                            .into(),
                                        )),
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
                                    self.symbol_exports.insert(
                                        name,
                                        Rc::new(SymbolExport::SomethingOfOtherFile(
                                            id.sym.clone(),
                                            file_name.clone(),
                                        )),
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
    let (module, comments) = parse_with_swc(&source_file, cm, &file_name)?;
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
        if let Some(alias) = locals.content.type_aliases.get(&k) {
            symbol_exports.insert(
                renamed.clone(),
                Rc::new(SymbolExport::TsType {
                    ty: alias.clone(),
                    name: k.0,
                }),
            );
            continue;
        }
        if let Some(intf) = locals.content.interfaces.get(&k) {
            symbol_exports.insert(
                renamed,
                Rc::new(SymbolExport::TsInterfaceDecl(intf.clone())),
            );
            continue;
        }
        if let Some(import) = v.imports.get(&k) {
            match &**import {
                ImportReference::Named { orig, file_name } => {
                    let it = Rc::new(SymbolExport::SomethingOfOtherFile(
                        orig.as_ref().clone(),
                        file_name.clone(),
                    ));
                    symbol_exports.insert(renamed, it);
                    continue;
                }
                ImportReference::Star { .. } => {
                    symbol_exports.insert(
                        renamed,
                        Rc::new(SymbolExport::StarOfOtherFile(import.clone())),
                    );

                    continue;
                }
                ImportReference::Default { .. } => {
                    continue;
                }
            }
        }

        return Err(anyhow!(
            "Could not resolve export {name:?} in file {file_name:?}",
            name = &unresolved.name,
            file_name = file_name
        ));
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
