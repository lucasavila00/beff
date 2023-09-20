#[macro_use]
extern crate lazy_static;

mod module_resolver;
mod utils;

use anyhow::anyhow;
use anyhow::Result;
use beff_core::diag::Diagnostic;
use beff_core::import_resolver::parse_and_bind;
use beff_core::print::printer::ToWritableModules;
use beff_core::print::printer::WritableModules;
use beff_core::wasm_diag::WasmDiagnostic;
use beff_core::BffFileName;
use beff_core::EntryPoints;
use beff_core::ExtractResult;
use beff_core::FileManager;
use beff_core::ParsedModule;
use log::Level;
use module_resolver::WasmModuleResolver;
use std::rc::Rc;
use std::{cell::RefCell, collections::HashMap};
use swc_common::{Globals, GLOBALS};
use wasm_bindgen::prelude::wasm_bindgen;
use wasm_bindgen::JsValue;

struct Bundler {
    pub files: HashMap<BffFileName, Rc<ParsedModule>>,
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
pub fn bundle_to_string(router_entry_point: &str, parser_entry_point: &str) -> JsValue {
    match bundle_to_string_inner(parse_entrypoints(router_entry_point, parser_entry_point)) {
        Ok(s) => serde_wasm_bindgen::to_value(&s).expect("should be able to serialize bundle"),
        Err(_) => JsValue::null(),
    }
}

#[wasm_bindgen]
pub fn bundle_to_diagnostics(router_entry_point: &str, parser_entry_point: &str) -> JsValue {
    let v = bundle_to_diagnostics_inner(parse_entrypoints(router_entry_point, parser_entry_point));
    serde_wasm_bindgen::to_value(&v).expect("should be able to serialize diagnostics")
}
#[wasm_bindgen]
pub fn update_file_content(file_name: &str, content: &str) {
    update_file_content_inner(file_name, content)
}
fn parse_entrypoints(router_entry_point: &str, parser_entry_point: &str) -> EntryPoints {
    let router_entry_point = if router_entry_point == "" {
        None
    } else {
        Some(BffFileName::new(router_entry_point.to_string()))
    };
    let parser_entry_point = if parser_entry_point == "" {
        None
    } else {
        Some(BffFileName::new(parser_entry_point.to_string()))
    };

    EntryPoints {
        router_entry_point,
        parser_entry_point,
    }
}
struct LazyFileManager<'a> {
    pub files: &'a mut HashMap<BffFileName, Rc<ParsedModule>>,
}

impl<'a> FileManager for LazyFileManager<'a> {
    fn get_or_fetch_file(&mut self, file_name: &BffFileName) -> Option<Rc<ParsedModule>> {
        if let Some(it) = self.files.get(file_name) {
            return Some(it.clone());
        }
        let content = read_file_content(file_name.to_string().as_str())?;

        let mut resolver = WasmModuleResolver::new(file_name.clone());
        let res = parse_and_bind(&mut resolver, file_name, &content);
        match res {
            Ok(f) => {
                self.files.insert(file_name.clone(), f.clone());
                Some(f)
            }
            Err(_) => None,
        }
    }

    fn get_existing_file(&self, name: &BffFileName) -> Option<Rc<ParsedModule>> {
        self.files.get(name).cloned()
    }
}

fn run_extraction(entry: EntryPoints) -> ExtractResult {
    GLOBALS.set(&SWC_GLOBALS, || {
        BUNDLER.with(|b| {
            let mut b = b.borrow_mut();
            let mut man = LazyFileManager {
                files: &mut b.files,
            };
            let res = beff_core::extract(&mut man, entry);
            // res.self_check_sem_types();
            res
        })
    })
}
fn print_errors(errors: Vec<&Diagnostic>) {
    let v = WasmDiagnostic::from_diagnostics(errors);
    let v = serde_wasm_bindgen::to_value(&v).expect("should be able to serialize");
    emit_diagnostic(v)
}

fn bundle_to_string_inner(entry: EntryPoints) -> Result<WritableModules> {
    let res = run_extraction(entry);
    let errs = res.errors();
    if errs.is_empty() {
        // let v = WasmDiagnostic::from_diagnostics(vec![]);
        // let v = serde_wasm_bindgen::to_value(&v).expect("should be able to serialize");
        // emit_diagnostic(v);
        return res.to_module();
    }
    print_errors(errs);
    Err(anyhow!("Failed to bundle"))
}

fn bundle_to_diagnostics_inner(entry: EntryPoints) -> WasmDiagnostic {
    WasmDiagnostic::from_diagnostics(run_extraction(entry).errors())
}

fn update_file_content_inner(file_name: &str, content: &str) {
    let file_name = BffFileName::new(file_name.to_string());
    let res = GLOBALS.set(&SWC_GLOBALS, || {
        let mut resolver = WasmModuleResolver::new(file_name.clone());
        parse_and_bind(&mut resolver, &file_name, content)
    });
    if let Ok(f) = res {
        BUNDLER.with(|b| {
            let mut b = b.borrow_mut();
            b.files.insert(file_name, f);
        })
    }
}
