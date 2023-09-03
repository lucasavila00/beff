#[macro_use]
extern crate lazy_static;

mod parse_file;
mod utils;
mod wasm_diag;

use anyhow::anyhow;
use anyhow::Result;
use beff_core::api_extractor::{self, ExtractResult, FileManager};
use beff_core::diag::Diagnostic;
use beff_core::parse_file_content;
use beff_core::printer::ToWritableModules;
use beff_core::printer::WritableModules;
use beff_core::BffFileName;
use beff_core::ParsedModule;
use log::Level;
use parse_file::WasmImportsResolver;
use std::collections::HashSet;
use std::rc::Rc;
use std::{cell::RefCell, collections::HashMap};
use swc_common::{Globals, GLOBALS};
use wasm_bindgen::prelude::wasm_bindgen;
use wasm_bindgen::JsValue;
use wasm_diag::WasmDiagnostic;

struct Bundler {
    pub files: HashMap<BffFileName, Rc<ParsedModule>>,
    pub known_files: HashSet<BffFileName>,
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
pub fn bundle_to_string(file_name: &str) -> JsValue {
    match bundle_to_string_inner(file_name) {
        Ok(s) => serde_wasm_bindgen::to_value(&s).expect("should be able to serialize bundle"),
        Err(_) => JsValue::null(),
    }
}

#[wasm_bindgen]
pub fn bundle_to_diagnostics(file_name: &str) -> JsValue {
    let v = bundle_to_diagnostics_inner(file_name);
    serde_wasm_bindgen::to_value(&v).expect("should be able to serialize diagnostics")
}
#[wasm_bindgen]
pub fn update_file_content(file_name: &str, content: &str) {
    update_file_content_inner(file_name, content)
}

struct LazyFileManager<'a> {
    pub files: &'a mut HashMap<BffFileName, Rc<ParsedModule>>,
    pub known_files: HashSet<BffFileName>,
}

impl<'a> FileManager for LazyFileManager<'a> {
    fn get_or_fetch_file(&mut self, file_name: &BffFileName) -> Option<Rc<ParsedModule>> {
        if let Some(it) = self.files.get(file_name) {
            return Some(it.clone());
        }
        let content = read_file_content(file_name.to_string().as_str())?;

        let mut resolver = WasmImportsResolver::new(file_name.clone());
        let res = parse_file_content(&mut resolver, file_name, &content);
        match res {
            Ok((f, imports)) => {
                self.known_files.extend(imports);
                self.files.insert(file_name.clone(), f.clone());
                Some(f)
            }
            Err(_) => None,
        }
    }

    fn get_existing_file(&self, name: &BffFileName) -> Option<Rc<ParsedModule>> {
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
            api_extractor::extract_schema(&mut man, BffFileName::new(entry_point))
        })
    })
}
fn print_errors(errors: Vec<Diagnostic>) {
    let v = WasmDiagnostic::from_diagnostics(errors);
    let v = serde_wasm_bindgen::to_value(&v).expect("should be able to serialize");
    emit_diagnostic(v)
}

fn bundle_to_string_inner(file_name: &str) -> Result<WritableModules> {
    let res = run_extraction(file_name);
    if res.errors.is_empty() {
        return Ok(res.to_module()?);
    }
    print_errors(res.errors);
    Err(anyhow!("Failed to bundle"))
}

fn bundle_to_diagnostics_inner(file_name: &str) -> WasmDiagnostic {
    WasmDiagnostic::from_diagnostics(run_extraction(file_name).errors)
}

fn update_file_content_inner(file_name: &str, content: &str) {
    let file_name = BffFileName::new(file_name.to_string());
    let res = GLOBALS.set(&SWC_GLOBALS, || {
        let mut resolver = WasmImportsResolver::new(file_name.clone());
        parse_file_content(&mut resolver, &file_name, content)
    });
    match res {
        Ok((f, imports)) => BUNDLER.with(|b| {
            let mut b = b.borrow_mut();
            b.known_files.extend(imports);
            b.files.insert(file_name, f);
        }),
        Err(_) => {}
    }
}
