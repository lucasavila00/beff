use anyhow::Result;
use bff_core::parse::load_source_file;
use bff_core::BffFileName;
use bff_core::ParsedModule;
use bff_core::ParsedModuleLocals;
use bff_core::TypeExportsModule;
use bff_core::{ImportReference, TypeExport};
use std::collections::HashMap;
use std::collections::HashSet;
use std::rc::Rc;
use std::sync::Arc;
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

struct ImportsVisitor {
    imports: HashMap<(JsWord, SyntaxContext), Rc<ImportReference>>,
    type_exports: TypeExportsModule,
    current_file: FileName,
    resolutions_cache: HashMap<String, Option<BffFileName>>,
    unresolved_exports: Vec<(JsWord, SyntaxContext)>,
}

impl ImportsVisitor {
    pub fn from_file(current_file: FileName) -> ImportsVisitor {
        ImportsVisitor {
            imports: HashMap::new(),
            type_exports: TypeExportsModule::new(),
            current_file,
            resolutions_cache: HashMap::new(),
            unresolved_exports: Vec::new(),
        }
    }
    fn resolve_import(&self, module_specifier: &str) -> Option<BffFileName> {
        match self.resolutions_cache.get(module_specifier) {
            Some(it) => it.clone(),
            None => {
                crate::resolve_import(&self.current_file.to_string().as_str(), &module_specifier)
                    .map(BffFileName::new)
            }
        }
    }

    fn insert_import_named(&mut self, local: &Ident, module_specifier: &str, orig: &JsWord) {
        let k = (local.sym.clone(), local.span.ctxt);
        let v = self.resolve_import(&module_specifier);
        self.resolutions_cache
            .insert(module_specifier.to_string(), v.clone());
        match v {
            Some(v) => {
                self.imports.insert(
                    k,
                    Rc::new(ImportReference::Named {
                        orig: Rc::new(orig.clone()),
                        file_name: v,
                    }),
                );
            }
            None => {}
        }
    }
    fn insert_import_default(&mut self, local: &Ident, module_specifier: &str) {
        let k = (local.sym.clone(), local.span.ctxt);
        let v = self.resolve_import(&module_specifier);
        self.resolutions_cache
            .insert(module_specifier.to_string(), v.clone());
        match v {
            Some(v) => {
                self.imports
                    .insert(k, Rc::new(ImportReference::Default { file_name: v }));
            }
            None => {}
        }
    }
    fn insert_import_star(&mut self, local: &Ident, module_specifier: &str) {
        let k = (local.sym.clone(), local.span.ctxt);
        let v = self.resolve_import(&module_specifier);
        self.resolutions_cache
            .insert(module_specifier.to_string(), v.clone());
        match v {
            Some(v) => {
                self.imports
                    .insert(k, Rc::new(ImportReference::Star { file_name: v }));
            }
            None => {}
        }
    }
}

impl Visit for ImportsVisitor {
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
            Decl::Using(_)
            | Decl::Class(_)
            | Decl::Fn(_)
            | Decl::TsEnum(_)
            | Decl::TsModule(_)
            | Decl::Var(_) => {}
        }
    }

    fn visit_named_export(&mut self, n: &NamedExport) {
        match &n.src {
            Some(src) => {
                //
                for s in &n.specifiers {
                    match s {
                        ExportSpecifier::Default(_) => todo!(),
                        ExportSpecifier::Namespace(ExportNamespaceSpecifier { name, .. }) => {
                            match name {
                                ModuleExportName::Ident(id) => {
                                    let file_name = self.resolve_import(&src.value).unwrap();
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
                                ModuleExportName::Str(_) => todo!(),
                            }
                        }
                        ExportSpecifier::Named(ExportNamedSpecifier { orig, exported, .. }) => {
                            match orig {
                                ModuleExportName::Ident(id) => {
                                    let name = match exported {
                                        Some(it) => match it {
                                            ModuleExportName::Ident(ex) => ex.sym.clone(),
                                            ModuleExportName::Str(_) => todo!(),
                                        },
                                        None => id.sym.clone(),
                                    };
                                    let file_name = self.resolve_import(&src.value).unwrap();
                                    self.type_exports.insert(
                                        name,
                                        Rc::new(TypeExport::SomethingOfOtherFile(
                                            id.sym.clone(),
                                            file_name.clone(),
                                        )),
                                    )
                                }
                                ModuleExportName::Str(_) => todo!(),
                            };
                        }
                    }
                }
            }
            None => {
                for s in &n.specifiers {
                    match s {
                        ExportSpecifier::Namespace(_) => todo!(),
                        ExportSpecifier::Default(_) => todo!(),
                        ExportSpecifier::Named(ExportNamedSpecifier { orig, exported, .. }) => {
                            assert!(exported.is_none());
                            match orig {
                                ModuleExportName::Ident(id) => {
                                    self.unresolved_exports.push((id.sym.clone(), id.span.ctxt));
                                }
                                ModuleExportName::Str(_) => todo!(),
                            }
                        }
                    }
                }
            }
        }
    }
    fn visit_export_all(&mut self, n: &ExportAll) {
        let file_name = self.resolve_import(&n.src.value).unwrap();
        self.type_exports.extend(file_name);
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
                        ModuleExportName::Str(_) => todo!(),
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

pub fn parse_file_content(
    file_name: &BffFileName,
    content: &str,
) -> Result<(Rc<ParsedModule>, HashSet<BffFileName>)> {
    log::debug!("RUST: Parsing file {file_name:?}");
    let cm: SourceMap = SourceMap::default();
    let source_file = cm.new_source_file(
        FileName::Real(file_name.to_string().into()),
        content.to_owned(),
    );
    let (module, comments) = load_source_file(&source_file, &Arc::new(cm))?;
    let mut v = ImportsVisitor::from_file(module.fm.name.clone());
    v.visit_module(&module.module);

    let imports: HashSet<BffFileName> = v
        .imports
        .values()
        .into_iter()
        .map(|x| x.file_name().clone())
        .collect();

    let mut locals = ParsedModuleLocals::new();
    locals.visit_module(&module.module);

    let mut type_exports = v.type_exports;
    for k in v.unresolved_exports {
        if let Some(alias) = locals.type_aliases.get(&k) {
            let (name, _) = k;
            type_exports.insert(
                name.clone(),
                Rc::new(TypeExport::TsType {
                    ty: alias.clone(),
                    name,
                }),
            );
            continue;
        }
        if let Some(intf) = locals.interfaces.get(&k) {
            type_exports.insert(k.0, Rc::new(TypeExport::TsInterfaceDecl(intf.clone())));
            continue;
        }
        if let Some(import) = v.imports.get(&k) {
            match &**import {
                ImportReference::Named { .. } => todo!(),
                ImportReference::Star { .. } => {
                    type_exports.insert(k.0, Rc::new(TypeExport::StarOfOtherFile(import.clone())));

                    continue;
                }
                ImportReference::Default { .. } => todo!(),
            }
        }

        panic!()
    }

    let f = Rc::new(ParsedModule {
        module,
        type_exports,
        imports: v.imports,
        comments,
        locals,
    });
    return Ok((f, imports));
}
