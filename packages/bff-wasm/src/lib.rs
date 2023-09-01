#[macro_use]
extern crate lazy_static;

mod parse_file;
mod utils;
mod wasm_diag;

use anyhow::anyhow;
use anyhow::Result;
use bff_core::api_extractor::{self, ExtractResult, FileManager};
use bff_core::diag::Diagnostic;
use bff_core::emit::emit_module;
use bff_core::printer::ModuleType;
use bff_core::printer::ToModule;
use bff_core::ParsedModule;
use log::Level;
use parse_file::parse_file_content;
use std::collections::HashSet;
use std::rc::Rc;
use std::{cell::RefCell, collections::HashMap};
use swc_common::{Globals, GLOBALS};
use wasm_bindgen::prelude::wasm_bindgen;
use wasm_bindgen::JsValue;
use wasm_diag::WasmDiagnostic;

struct Bundler {
    pub files: HashMap<String, Rc<ParsedModule>>,
    pub known_files: HashSet<String>,
}

impl Bundler {
    pub fn new() -> Bundler {
        Bundler {
            files: HashMap::new(),
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
pub fn init(verbose: bool) {
    let log_level = if verbose { Level::Debug } else { Level::Info };
    console_log::init_with_level(log_level).expect("should be able to log");
    utils::set_panic_hook();
}

#[wasm_bindgen]
extern "C" {
    fn resolve_import(current_file: &str, specifier: &str) -> Option<String>;
}

#[wasm_bindgen]
extern "C" {
    fn read_file_content(file_name: &str) -> Option<String>;
}

#[wasm_bindgen]
extern "C" {
    fn emit_diagnostic(diag: JsValue);
}

#[wasm_bindgen]
pub fn bundle_to_string(file_name: &str, module_type: &str) -> Option<String> {
    match bundle_to_string_inner(file_name, module_type) {
        Ok(s) => Some(s),
        Err(_) => None,
    }
}

#[wasm_bindgen]
pub fn bundle_to_diagnostics(file_name: &str, module_type: &str) -> JsValue {
    let v = bundle_to_diagnostics_inner(file_name, module_type);
    serde_wasm_bindgen::to_value(&v).expect("should be able to serialize")
}
#[wasm_bindgen]
pub fn update_file_content(file_name: &str, content: &str) {
    update_file_content_inner(file_name, content)
}

struct LazyFileManager<'a> {
    pub files: &'a mut HashMap<String, Rc<ParsedModule>>,
    pub known_files: HashSet<String>,
}

impl<'a> FileManager for LazyFileManager<'a> {
    fn get_or_fetch_file(&mut self, file_name: &str) -> Option<Rc<ParsedModule>> {
        if let Some(it) = self.files.get(file_name) {
            return Some(it.clone());
        }
        let content = read_file_content(file_name.to_string().as_str())?;

        let res = parse_file_content(file_name, &content);
        match res {
            Ok((f, imports)) => {
                self.known_files.extend(imports);
                self.files.insert(file_name.to_string(), f.clone());
                Some(f)
            }
            Err(_) => None,
        }
    }

    fn get_existing_file(&self, name: &str) -> Option<Rc<ParsedModule>> {
        self.files.get(name).map(|opt| opt.clone())
    }
}

fn run_extraction(file_name: &str) -> ExtractResult {
    GLOBALS.set(&SWC_GLOBALS, || {
        BUNDLER.with(|b| {
            let mut b = b.borrow_mut();
            let entry_point: String = file_name.to_string();
            let known_files = b.known_files.clone();
            let mut man = LazyFileManager {
                files: &mut b.files,
                known_files,
            };
            api_extractor::extract_schema(&mut man, Rc::new(entry_point))
        })
    })
}
fn print_errors(errors: Vec<Diagnostic>) {
    let v = WasmDiagnostic::from_diagnostics(errors);
    let v = serde_wasm_bindgen::to_value(&v).expect("should be able to serialize");
    emit_diagnostic(v)
}

fn parse_module_type(module_type: &str) -> ModuleType {
    match module_type {
        "esm" => ModuleType::Esm,
        "cjs" => ModuleType::Cjs,
        _ => ModuleType::Esm,
    }
}

fn bundle_to_string_inner(file_name: &str, module_type: &str) -> Result<String> {
    let res = run_extraction(file_name);
    if res.errors.is_empty() {
        let (ast, write_errs) = res.to_module(parse_module_type(module_type));
        if write_errs.is_empty() {
            return emit_module(&ast);
        }
        print_errors(write_errs);
        return Err(anyhow!("Failed to write bundle"));
    }
    print_errors(res.errors);
    Err(anyhow!("Failed to bundle"))
}

fn bundle_to_diagnostics_inner(file_name: &str, module_type: &str) -> WasmDiagnostic {
    let res = run_extraction(file_name);
    if res.errors.is_empty() {
        let (_ast, write_errs) = res.to_module(parse_module_type(module_type));
        return WasmDiagnostic::from_diagnostics(write_errs);
    }
    return WasmDiagnostic::from_diagnostics(res.errors);
}

fn update_file_content_inner(file_name: &str, content: &str) {
    let res = GLOBALS.set(&SWC_GLOBALS, || parse_file_content(file_name, content));
    match res {
        Ok((f, imports)) => BUNDLER.with(|b| {
            let mut b = b.borrow_mut();
            b.known_files.extend(imports);
            b.files.insert(file_name.to_string(), f);
        }),
        Err(_) => {}
    }
}
