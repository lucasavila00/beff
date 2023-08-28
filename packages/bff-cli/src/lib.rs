#![warn(clippy::pedantic)]
pub mod api_extractor;
pub mod coercer;
pub mod decoder;
pub mod diag;
pub mod open_api_ast;
pub mod printer;
pub mod swc_builder;
pub mod type_to_schema;
pub mod writer;

use crate::open_api_ast::OpenApi;
use anyhow::anyhow;
use anyhow::Context;
use anyhow::Result;
use api_extractor::FnHandler;
use diag::Diagnostic;
use open_api_ast::Definition;
use std::collections::HashMap;
use std::fmt::Debug;
use std::path::PathBuf;
use swc_atoms::JsWord;
use swc_bundler::{ModuleData, Resolve};
use swc_common::errors::EmitterWriter;
use swc_common::errors::Handler;
use swc_common::{
    collections::{AHashMap, AHashSet},
    sync::Lrc,
    FileName, Globals, Mark, SourceMap, SyntaxContext, GLOBALS,
};
use swc_ecma_ast::Decl;
use swc_ecma_ast::ExportDecl;
use swc_ecma_ast::{
    EsVersion, ImportDecl, ImportNamedSpecifier, ImportSpecifier, TsInterfaceDecl, TsType,
    TsTypeAliasDecl,
};
use swc_ecma_loader::{resolvers::node::NodeModulesResolver, TargetEnv};
use swc_ecma_parser::TsConfig;
use swc_ecma_parser::{parse_file_as_module, Syntax};
use swc_ecma_transforms_base::helpers::Helpers;
use swc_ecma_transforms_base::resolver;
use swc_ecma_visit::{FoldWith, Visit};
use swc_node_comments::SwcComments;

pub struct Loader {
    pub cm: Lrc<SourceMap>,
}

impl Loader {
    fn load(&self, f: &FileName) -> Result<(ModuleData, SwcComments)> {
        let fm = match f {
            FileName::Real(path) => self.cm.load_file(path)?,
            _ => unreachable!(),
        };
        let unresolved_mark = Mark::new();
        let top_level_mark = Mark::new();
        let comments: SwcComments = SwcComments::default();
        // TODO: recovered errors?
        let module = parse_file_as_module(
            &fm,
            Syntax::Typescript(TsConfig::default()),
            EsVersion::latest(),
            Some(&comments),
            &mut vec![],
        )
        .map(|module| module.fold_with(&mut resolver(unresolved_mark, top_level_mark, true)))
        .map_err(|err| {
            let emt = EmitterWriter::new(
                Box::new(std::io::stderr()),
                Some(self.cm.clone()),
                false,
                true,
            );
            let handler = Handler::with_emitter(true, false, Box::new(emt));

            err.into_diagnostic(&handler).emit();

            anyhow!("failed to parse module: {:?}", f)
        })?;

        Ok((
            ModuleData {
                fm,
                module,
                helpers: Helpers::default(),
            },
            comments,
        ))
    }
}

#[derive(Debug)]
pub struct ImportReference {
    file_name: FileName,
}
pub struct ImportsVisitor {
    imports: AHashMap<(JsWord, SyntaxContext), ImportReference>,
    type_exports: AHashMap<JsWord, TypeExport>,
    current_file: FileName,
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
        let resolver = NodeModulesResolver::new(TargetEnv::Node, HashMap::default(), true);

        for x in &node.specifiers {
            match x {
                ImportSpecifier::Named(ImportNamedSpecifier { local, .. }) => {
                    let k = (local.sym.clone(), local.span.ctxt);

                    let v = resolver.resolve(&self.current_file, &module_specifier);
                    match v {
                        Ok(v) => {
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

pub struct ParsedModuleLocals {
    pub type_aliases: AHashMap<(JsWord, SyntaxContext), TsType>,
    pub interfaces: AHashMap<(JsWord, SyntaxContext), TsInterfaceDecl>,
}

impl Visit for ParsedModuleLocals {
    fn visit_ts_type_alias_decl(&mut self, n: &TsTypeAliasDecl) {
        let TsTypeAliasDecl { id, type_ann, .. } = n;
        self.type_aliases
            .insert((id.sym.clone(), id.span.ctxt), *type_ann.clone());
    }
    fn visit_ts_interface_decl(&mut self, n: &TsInterfaceDecl) {
        let TsInterfaceDecl { id, .. } = n;
        self.interfaces
            .insert((id.sym.clone(), id.span.ctxt), n.clone());
    }
}

pub enum TypeExport {
    TsType(TsType),
    TsInterfaceDecl(TsInterfaceDecl),
}
pub struct ParsedModule {
    pub locals: ParsedModuleLocals,
    pub module: ModuleData,
    pub imports: AHashMap<(JsWord, SyntaxContext), ImportReference>,
    pub comments: SwcComments,
    pub type_exports: AHashMap<JsWord, TypeExport>,
}

#[derive(Debug)]
pub struct BundleResult {
    pub entry_point: PathBuf,
    pub entry_file_name: FileName,
    pub errors: Vec<Diagnostic>,
    pub open_api: OpenApi,
    pub handlers: Vec<FnHandler>,
    pub components: Vec<Definition>,
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
    fn load_file(path: &FileName) -> Result<(ModuleData, SwcComments)> {
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
            while let Some(path) = stack.pop() {
                if !visited.insert(path.clone()) {
                    continue;
                }
                let module = Self::load_file(&path);

                match module {
                    Ok((module, comments)) => {
                        let mut v = ImportsVisitor {
                            imports: AHashMap::default(),
                            type_exports: AHashMap::default(),
                            current_file: module.fm.name.clone(),
                        };
                        v.visit_module(&module.module);
                        let imports = v.imports.values().collect::<Vec<_>>();
                        stack.extend(imports.iter().map(|x| x.file_name.clone()));
                        let mut locals = ParsedModuleLocals {
                            type_aliases: AHashMap::default(),
                            interfaces: AHashMap::default(),
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
                let extract_result = api_extractor::extract_schema(&self.files, file);
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
