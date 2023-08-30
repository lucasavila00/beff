#[macro_use]
extern crate lazy_static;

mod imports_visitor;
mod utils;

use crate::imports_visitor::ImportsVisitor;
use crate::imports_visitor::UnresolvedImportReference;
use anyhow::anyhow;
use anyhow::Result;
use bff_core::diag::Diagnostic;
use bff_core::emit::emit_module;
use bff_core::printer::ToModule;
use bff_core::BffModuleData;
use bff_core::ImportReference;
use bff_core::TypeExport;
use bff_core::{parse::load_source_file, BundleResult, ParsedModule, ParsedModuleLocals};
use log::Level;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::{cell::RefCell, collections::HashMap};
use swc_atoms::JsWord;
use swc_common::SyntaxContext;
use swc_common::{FileName, Globals, SourceMap, GLOBALS};
use swc_ecma_visit::Visit;
use swc_node_comments::SwcComments;
use wasm_bindgen::{prelude::wasm_bindgen, JsValue};

struct Bundler {
    pub files: HashMap<FileName, ParsedModule>,
}

impl Bundler {
    pub fn new() -> Bundler {
        Bundler {
            files: HashMap::new(),
        }
    }
}
lazy_static! {
    static ref SWC_GLOBALS: Globals = Globals::new();
}

thread_local! {
    static BUNDLER: RefCell<Bundler> = RefCell::new(Bundler::new());
}

#[wasm_bindgen]
pub fn init() {
    console_log::init_with_level(Level::Debug).expect("should be able to log");
    utils::set_panic_hook();
}

#[wasm_bindgen]
extern "C" {
    async fn resolve_imports(data: JsValue) -> JsValue;
}

fn first_pass_parse(
    file_name: &str,
    content: &str,
) -> (
    BffModuleData,
    SwcComments,
    HashMap<JsWord, TypeExport>,
    HashMap<(JsWord, SyntaxContext), UnresolvedImportReference>,
) {
    let cm: SourceMap = SourceMap::default();
    let file_name = FileName::Real(file_name.into());
    let source_file = cm.new_source_file(file_name, content.to_owned());

    GLOBALS.set(&SWC_GLOBALS, || {
        log::info!("RUST: Received file {source_file:?}");
        let (module, comments) =
            load_source_file(&source_file).expect("should be able to load source file");
        let mut v = ImportsVisitor::from_file(module.fm.name.clone());
        v.visit_module(&module.module);
        let imports = v.imports;
        (module, comments, v.type_exports, imports)
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct UnresolvedPacket {
    pub references: Vec<UnresolvedImportReference>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
struct ResolvedPacket {
    pub resolved: Vec<Option<String>>,
}

async fn get_finalized_imports(
    imports: HashMap<(JsWord, SyntaxContext), UnresolvedImportReference>,
) -> Result<HashMap<(JsWord, SyntaxContext), ImportReference>> {
    let imports_set = imports
        .iter()
        .map(|(_, v)| v.clone())
        .collect::<HashSet<UnresolvedImportReference>>();
    let data: Vec<UnresolvedImportReference> = imports_set.into_iter().collect();
    log::info!("RUST: Needs imports {data:?}");
    let packed = UnresolvedPacket { references: data };
    let r = resolve_imports(serde_wasm_bindgen::to_value(&packed).unwrap()).await;
    let res_data: ResolvedPacket = serde_wasm_bindgen::from_value(r).unwrap();

    let resolved_lookup = res_data
        .resolved
        .into_iter()
        .zip(packed.references.into_iter())
        .map(|(resolved, unresolved)| (unresolved, resolved))
        .collect::<HashMap<UnresolvedImportReference, Option<String>>>();

    let h: HashMap<(JsWord, SyntaxContext), ImportReference> = imports
        .into_iter()
        .flat_map(|(k, v)| {
            let val = resolved_lookup.get(&v).unwrap();
            match val {
                Some(resolved) => Some((
                    k,
                    ImportReference {
                        file_name: FileName::Real(resolved.into()),
                    },
                )),
                None => None,
            }
        })
        .collect();

    return Ok(h);
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ReadResultPacket {
    next_files: Vec<String>,
}
async fn parse_source_file_inner(file_name: &str, content: &str) -> Result<JsValue> {
    let (module, comments, t_exports, imports) = first_pass_parse(file_name, content);
    let finalized_imports = get_finalized_imports(imports).await?;

    let next_files = BUNDLER.with(|b| {
        let b = b.borrow();
        finalized_imports
            .values()
            .filter(|x| !b.files.contains_key(&x.file_name))
            .map(|x| x.file_name.to_string())
            .collect::<Vec<String>>()
    });
    BUNDLER.with(|b| {
        let mut bundler = b.borrow_mut();
        let mut locals = ParsedModuleLocals::new();
        locals.visit_module(&module.module);
        let name = module.fm.name.clone();

        bundler.files.insert(
            name,
            ParsedModule {
                module,
                imports: finalized_imports,
                type_exports: t_exports,
                comments,
                locals,
            },
        );
    });

    let packed = ReadResultPacket { next_files };

    Ok(serde_wasm_bindgen::to_value(&packed).unwrap())
}

#[wasm_bindgen]
pub async fn parse_source_file(file_name: &str, content: &str) -> JsValue {
    parse_source_file_inner(file_name, content).await.unwrap()
}

fn get_bundle_result(file_name: &str) -> Result<BundleResult> {
    BUNDLER.with(|b| {
        let b = b.borrow();
        let entry_point = FileName::Real(file_name.into());
        let file = b.files.get(&entry_point);
        match file {
            Some(file) => {
                let extract_result = bff_core::api_extractor::extract_schema(&b.files, file);
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
    })
}
fn print_errors(
    errors: Vec<Diagnostic>,
    // bundler_files: &HashMap<FileName, ParsedModule>,
    // project_root: &str,
) {
    log::info!("ERRR: {errors:?}")
}
fn bundle_to_string_inner(file_name: &str) -> Result<String> {
    let res = get_bundle_result(file_name)?;
    if res.errors.is_empty() {
        let (ast, write_errs) = res.to_module();
        if write_errs.is_empty() {
            return emit_module(&ast);
        }
        print_errors(write_errs);
        return Err(anyhow!("Failed to write bundle"));
    }
    print_errors(res.errors);
    Err(anyhow!("Failed to bundle"))
}

#[wasm_bindgen]
pub fn bundle_to_string(file_name: &str) -> String {
    bundle_to_string_inner(file_name).unwrap()
}
