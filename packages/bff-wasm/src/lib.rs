#[macro_use]
extern crate lazy_static;

mod imports_visitor;
mod utils;

use std::collections::HashSet;
use std::{cell::RefCell, collections::HashMap};

use crate::imports_visitor::ImportsVisitor;
use anyhow::anyhow;
use anyhow::Result;
use bff_core::diag::Diagnostic;
use bff_core::emit::emit_module;
use bff_core::printer::ToModule;
use bff_core::{parse::load_source_file, BundleResult, ParsedModule, ParsedModuleLocals};
use js_sys::Array;
use log::Level;
use swc_common::{FileName, Globals, SourceMap, GLOBALS};
use swc_ecma_visit::Visit;
use wasm_bindgen::{prelude::wasm_bindgen, JsValue};

struct Bundler {
    pub files: HashMap<FileName, ParsedModule>,
    pub import_stack: HashSet<String>,
    pub known_files: HashSet<String>,
}

impl Bundler {
    pub fn new() -> Bundler {
        Bundler {
            files: HashMap::new(),
            import_stack: HashSet::new(),
            known_files: HashSet::new(),
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
    fn resolve_import(current_file: &str, specifier: &str) -> Option<String>;
}

fn parse_source_file_inner(file_name: &str, content: &str) -> Result<()> {
    let cm: SourceMap = SourceMap::default();
    let file_name = FileName::Real(file_name.into());
    let source_file = cm.new_source_file(file_name, content.to_owned());

    GLOBALS.set(&SWC_GLOBALS, || {
        BUNDLER.with(|b| {
            let mut bundler = b.borrow_mut();
            log::info!("RUST: Received file {source_file:?}");
            let (module, comments) =
                load_source_file(&source_file).expect("should be able to load source file");
            let mut v = ImportsVisitor::from_file(module.fm.name.clone());
            v.visit_module(&module.module);

            let imports = v
                .imports
                .values()
                .into_iter()
                .map(|x| x.file_name.to_string())
                .collect::<HashSet<String>>();
            log::info!("RUST: Needs imports {imports:?}");

            let imports = imports
                .into_iter()
                .filter(|x| !bundler.known_files.contains(x))
                .collect::<Vec<String>>();

            bundler.import_stack.extend(imports);

            let mut locals = ParsedModuleLocals::new();
            locals.visit_module(&module.module);
            let name = module.fm.name.clone();

            bundler.files.insert(
                name,
                ParsedModule {
                    module,
                    imports: v.imports,
                    type_exports: v.type_exports,
                    comments,
                    locals,
                },
            );
        });
    });

    Ok(())
}

#[wasm_bindgen]
pub fn parse_source_file(file_name: &str, content: &str) {
    parse_source_file_inner(file_name, content).unwrap();
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
    log::info!("{errors:?}")
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

fn read_files_to_import_inner() -> JsValue {
    BUNDLER.with(|b| {
        let values = &b.borrow().import_stack;
        JsValue::from(
            values
                .iter()
                .map(|x| JsValue::from_str(&x))
                .collect::<Array>(),
        )
    })
}

#[wasm_bindgen]
pub fn read_files_to_import() -> JsValue {
    read_files_to_import_inner()
}

fn clear_files_to_import_inner() {
    BUNDLER.with(|b| {
        let mut bundler = b.borrow_mut();
        bundler.import_stack.clear();
    })
}
#[wasm_bindgen]
pub fn clear_files_to_import() {
    clear_files_to_import_inner()
}
