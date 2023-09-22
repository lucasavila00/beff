use crate::parse::parse_with_swc;
use crate::BffFileName;
use crate::ImportReference;
use crate::ParsedModule;
use crate::ParsedModuleLocals;
use crate::ParserOfModuleLocals;
use crate::TypeExport;
use crate::TypeExportsModule;
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
use swc_ecma_ast::ExportNamedSpecifier;
use swc_ecma_ast::ExportNamespaceSpecifier;
use swc_ecma_ast::ExportSpecifier;
use swc_ecma_ast::Ident;
use swc_ecma_ast::ImportDefaultSpecifier;
use swc_ecma_ast::ImportStarAsSpecifier;
use swc_ecma_ast::ModuleExportName;
use swc_ecma_ast::NamedExport;
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
    pub type_exports: TypeExportsModule,
    pub current_file: BffFileName,
    pub unresolved_exports: Vec<UnresolvedExport>,
}
impl<'a, R: FsModuleResolver> ImportsVisitor<'a, R> {
    pub fn from_file(current_file: BffFileName, resolver: &'a mut R) -> ImportsVisitor<'a, R> {
        ImportsVisitor {
            imports: HashMap::new(),
            type_exports: TypeExportsModule::new(),
            current_file,
            unresolved_exports: Vec::new(),
            resolver,
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
    fn visit_export_decl(&mut self, n: &ExportDecl) {
        match &n.decl {
            Decl::TsInterface(n) => {
                let TsInterfaceDecl { id, .. } = &**n;
                self.type_exports.insert(
                    id.sym.clone(),
                    Rc::new(TypeExport::TsInterfaceDecl(Rc::new(*n.clone()))),
                );
            }
            Decl::TsTypeAlias(a) => {
                let TsTypeAliasDecl { id, type_ann, .. } = &**a;
                self.type_exports.insert(
                    id.sym.clone(),
                    Rc::new(TypeExport::TsType {
                        ty: Rc::new(*type_ann.clone()),
                        name: id.sym.clone(),
                    }),
                );
            }
            Decl::TsModule(_)
            | Decl::Using(_)
            | Decl::Class(_)
            | Decl::Fn(_)
            | Decl::TsEnum(_)
            | Decl::Var(_) => {}
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
                                    self.type_exports.insert(
                                        id.sym.clone(),
                                        Rc::new(TypeExport::StarOfOtherFile(
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
                                    self.type_exports.insert(
                                        name,
                                        Rc::new(TypeExport::SomethingOfOtherFile(
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
            self.type_exports.extend(file_name);
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

    let mut type_exports = v.type_exports;
    for unresolved in v.unresolved_exports {
        let renamed = unresolved.renamed;
        let k = (unresolved.name.clone(), unresolved.span);
        if let Some(alias) = locals.content.type_aliases.get(&k) {
            type_exports.insert(
                renamed.clone(),
                Rc::new(TypeExport::TsType {
                    ty: alias.clone(),
                    name: k.0,
                }),
            );
            continue;
        }
        if let Some(intf) = locals.content.interfaces.get(&k) {
            type_exports.insert(renamed, Rc::new(TypeExport::TsInterfaceDecl(intf.clone())));
            continue;
        }
        if let Some(import) = v.imports.get(&k) {
            match &**import {
                ImportReference::Named { orig, file_name } => {
                    let it = Rc::new(TypeExport::SomethingOfOtherFile(
                        orig.as_ref().clone(),
                        file_name.clone(),
                    ));
                    type_exports.insert(renamed, it);
                    continue;
                }
                ImportReference::Star { .. } => {
                    type_exports.insert(
                        renamed,
                        Rc::new(TypeExport::StarOfOtherFile(import.clone())),
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
        type_exports,
        imports: v.imports,
        comments,
        locals: locals.content,
    });
    Ok(f)
}
