use anyhow::Result;
use bff_core::parse::load_source_file;
use bff_core::ParsedModule;
use bff_core::ParsedModuleLocals;
use bff_core::{ImportReference, TypeExport};
use std::collections::HashMap;
use std::collections::HashSet;
use std::rc::Rc;
use std::sync::Arc;
use swc_atoms::JsWord;
use swc_common::SourceMap;
use swc_common::{FileName, SyntaxContext};
use swc_ecma_ast::Decl;
use swc_ecma_ast::ExportDecl;
use swc_ecma_ast::{
    ImportDecl, ImportNamedSpecifier, ImportSpecifier, TsInterfaceDecl, TsTypeAliasDecl,
};
use swc_ecma_visit::Visit;
pub struct ImportsVisitor {
    pub imports: HashMap<(JsWord, SyntaxContext), ImportReference>,
    pub type_exports: HashMap<JsWord, TypeExport>,
    pub current_file: FileName,

    pub known_imports: HashSet<(String, String)>,
}

impl ImportsVisitor {
    pub fn from_file(current_file: FileName) -> ImportsVisitor {
        ImportsVisitor {
            imports: HashMap::new(),
            type_exports: HashMap::new(),
            current_file,
            known_imports: HashSet::new(),
        }
    }
}

impl Visit for ImportsVisitor {
    fn visit_export_decl(&mut self, n: &ExportDecl) {
        match &n.decl {
            Decl::TsInterface(n) => {
                let TsInterfaceDecl { id, .. } = &**n;
                self.type_exports
                    .insert(id.sym.clone(), TypeExport::TsInterfaceDecl(*n.clone()));
            }
            Decl::TsTypeAlias(a) => {
                let TsTypeAliasDecl { id, type_ann, .. } = &**a;
                self.type_exports
                    .insert(id.sym.clone(), TypeExport::TsType(*type_ann.clone()));
            }
            Decl::Using(_)
            | Decl::Class(_)
            | Decl::Fn(_)
            | Decl::TsEnum(_)
            | Decl::TsModule(_)
            | Decl::Var(_) => {}
        }
    }

    fn visit_import_decl(&mut self, node: &ImportDecl) {
        let module_specifier = node.src.value.to_string();

        if self
            .known_imports
            .contains(&(self.current_file.to_string(), module_specifier.clone()))
        {
            return;
        }

        for x in &node.specifiers {
            match x {
                ImportSpecifier::Named(ImportNamedSpecifier { local, .. }) => {
                    if self
                        .known_imports
                        .contains(&(self.current_file.to_string(), module_specifier.clone()))
                    {
                        return;
                    }
                    let k = (local.sym.clone(), local.span.ctxt);

                    let v = crate::resolve_import(
                        &self.current_file.to_string().as_str(),
                        &module_specifier,
                    );

                    match v {
                        Some(v) => {
                            self.known_imports
                                .insert((self.current_file.to_string(), module_specifier.clone()));
                            self.imports.insert(
                                k,
                                ImportReference {
                                    file_name: FileName::Real(v.into()),
                                },
                            );
                        }
                        None => {}
                    }
                }
                ImportSpecifier::Default(_) => { //todo fix me
                }
                ImportSpecifier::Namespace(_) => { //todo fix me
                }
            }
        }
    }
}

pub fn parse_file_content(
    file_name: FileName,
    content: &str,
) -> Result<(Rc<ParsedModule>, HashSet<String>)> {
    log::info!("RUST: Parsing file {file_name:?}");
    let cm: SourceMap = SourceMap::default();
    let source_file = cm.new_source_file(file_name, content.to_owned());
    let (module, comments) = load_source_file(&source_file, &Arc::new(cm))?;
    let mut v = ImportsVisitor::from_file(module.fm.name.clone());
    v.visit_module(&module.module);

    let imports: HashSet<String> = v
        .imports
        .values()
        .into_iter()
        .map(|x| x.file_name.to_string())
        .collect();

    let mut locals = ParsedModuleLocals::new();
    locals.visit_module(&module.module);

    let f = Rc::new(ParsedModule {
        module,
        imports: v.imports,
        type_exports: v.type_exports,
        comments,
        locals,
    });
    return Ok((f, imports));
}
