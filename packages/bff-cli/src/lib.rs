#![warn(clippy::pedantic)]

pub mod diag;
pub mod writer;

use anyhow::anyhow;
use anyhow::Context;
use anyhow::Result;
use bff_core::parse::Loader;
use bff_core::BffModuleData;
use bff_core::BundleResult;
use bff_core::ImportReference;
use bff_core::ParsedModule;
use bff_core::ParsedModuleLocals;
use bff_core::TypeExport;
use std::collections::HashMap;
use swc_atoms::JsWord;
use swc_bundler::Resolve;
use swc_common::{
    collections::{AHashMap, AHashSet},
    sync::Lrc,
    FileName, Globals, SourceMap, SyntaxContext, GLOBALS,
};
use swc_ecma_ast::Decl;
use swc_ecma_ast::ExportDecl;
use swc_ecma_ast::{
    ImportDecl, ImportNamedSpecifier, ImportSpecifier, TsInterfaceDecl, TsTypeAliasDecl,
};
use swc_ecma_loader::resolvers::node::NodeModulesResolver;
use swc_ecma_loader::TargetEnv;
use swc_ecma_visit::Visit;
use swc_node_comments::SwcComments;

pub struct ImportsVisitor<'a> {
    imports: HashMap<(JsWord, SyntaxContext), ImportReference>,
    type_exports: HashMap<JsWord, TypeExport>,
    current_file: FileName,
    resolver: &'a NodeModulesResolver,
}

impl<'a> Visit for ImportsVisitor<'a> {
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

        for x in &node.specifiers {
            match x {
                ImportSpecifier::Named(ImportNamedSpecifier { local, .. }) => {
                    let k = (local.sym.clone(), local.span.ctxt);

                    let v = self.resolver.resolve(&self.current_file, &module_specifier);

                    match v {
                        Ok(v) => {
                            // let x = FileName::Real(v.to_string().into());
                            self.imports.insert(k, ImportReference { file_name: v });
                        }
                        Err(err) => {
                            let k = local.sym.to_string();
                            log::info!("Failed to load module that contains '{k}'. Module specifier: '{module_specifier}'. ERROR: {}", err);
                            err.chain()
                                .skip(1)
                                .for_each(|cause| log::info!("because: {}", cause));
                        }
                    }
                }
                ImportSpecifier::Default(_) => todo!(),
                ImportSpecifier::Namespace(_) => todo!(),
            }
        }
    }
}

pub struct Bundler {
    pub files: AHashMap<FileName, ParsedModule>,
}
impl Default for Bundler {
    fn default() -> Self {
        Self::new()
    }
}
impl Bundler {
    #[must_use]
    pub fn new() -> Self {
        Bundler {
            files: AHashMap::default(),
        }
    }
    fn load_file(path: &FileName) -> Result<(BffModuleData, SwcComments)> {
        log::debug!("loading file: {:?}", path);

        Loader {
            cm: Lrc::new(SourceMap::default()),
        }
        .load(path)
        .context(format!("Could not load file {:?}", &path))
    }
    /// # Errors
    ///
    /// Will return `Err` if ...
    pub fn bundle(&mut self, entry_point: FileName) -> Result<BundleResult> {
        let mut stack = vec![entry_point.clone()];
        let mut visited = AHashSet::default();
        let globals = Globals::new();

        let mut bundle_error = None;
        GLOBALS.set(&globals, || {
            let r = NodeModulesResolver::new(TargetEnv::Node, HashMap::default(), true);

            while let Some(path) = stack.pop() {
                if !visited.insert(path.clone()) {
                    continue;
                }
                let module = Self::load_file(&path);
                match module {
                    Ok((module, comments)) => {
                        let mut v = ImportsVisitor {
                            imports: HashMap::new(),
                            type_exports: HashMap::new(),
                            current_file: module.fm.name.clone(),
                            resolver: &r,
                        };
                        v.visit_module(&module.module);
                        let imports = v.imports.values().collect::<Vec<_>>();
                        stack.extend(imports.iter().map(|x| x.file_name.clone()));
                        let mut locals = ParsedModuleLocals {
                            type_aliases: HashMap::new(),
                            interfaces: HashMap::new(),
                        };
                        locals.visit_module(&module.module);
                        self.files.insert(
                            path,
                            ParsedModule {
                                module,
                                imports: v.imports,
                                type_exports: v.type_exports,
                                comments,
                                locals,
                            },
                        );
                    }
                    Err(err) => {
                        bundle_error = Some(err);
                        break;
                    }
                }
            }
        });

        if let Some(err) = bundle_error {
            return Err(err);
        }

        log::debug!("loaded {:?} files", self.files.len());
        let file = self.files.get(&entry_point);
        match file {
            Some(file) => {
                let extract_result = bff_core::api_extractor::extract_schema(&self.files, file);
                Ok(BundleResult {
                    open_api: extract_result.open_api,
                    errors: extract_result.errors,
                    entry_point: entry_point.to_string().into(),
                    handlers: extract_result.handlers,
                    entry_file_name: entry_point,
                    components: extract_result.components,
                })
            }
            None => Err(anyhow!("Could not find entry point: {:?}", entry_point)),
        }
    }
}
