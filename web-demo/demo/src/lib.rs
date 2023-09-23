#[macro_use]
extern crate lazy_static;

mod utils;
use anyhow::Result;
use beff_core::import_resolver::parse_and_bind;
use beff_core::import_resolver::FsModuleResolver;
use beff_core::print::printer::{ToWritableModules, WritableModules};
use beff_core::wasm_diag::WasmDiagnostic;
use beff_core::BeffUserSettings;
use beff_core::BffFileName;
use beff_core::ParsedModule;
use beff_core::{EntryPoints, FileManager};
use log::Level;
use serde::Deserialize;
use serde::Serialize;
use std::collections::BTreeSet;
use std::rc::Rc;
use swc_common::{Globals, GLOBALS};
use wasm_bindgen::prelude::wasm_bindgen;
use wasm_bindgen::JsValue;

lazy_static! {
    static ref SWC_GLOBALS: Globals = Globals::new();
}

#[wasm_bindgen]
pub fn init(verbose: bool) {
    let log_level = if verbose { Level::Debug } else { Level::Info };
    console_log::init_with_level(log_level).expect("should be able to log");
    utils::set_panic_hook();
}

struct FakeFileManager {
    pub content: Option<Rc<ParsedModule>>,
}

impl FileManager for FakeFileManager {
    fn get_or_fetch_file(&mut self, _name: &BffFileName) -> Option<Rc<ParsedModule>> {
        self.content.clone()
    }

    fn get_existing_file(&self, _name: &BffFileName) -> Option<Rc<ParsedModule>> {
        self.content.clone()
    }
}

#[wasm_bindgen]
pub fn bundle_to_string(router_content: &str) -> JsValue {
    match bundle_to_string_inner(router_content) {
        Ok(s) => serde_wasm_bindgen::to_value(&s).expect("should be able to serialize bundle"),
        Err(e) => JsValue::from_str(&format!("Error: {}", e)),
    }
}
#[derive(Serialize, Deserialize)]
#[serde(tag = "_tag", content = "data")]

enum WritableResultOrDiagnostics {
    WritableModules(WritableModules),
    WasmDiagnostic(WasmDiagnostic),
}

pub struct FakeModuleResolver {}

impl FsModuleResolver for FakeModuleResolver {
    fn resolve_import(&mut self, _module_specifier: &str) -> Option<BffFileName> {
        None
    }
}
pub fn parse_content(content: &str) -> Result<Rc<ParsedModule>> {
    GLOBALS.set(&SWC_GLOBALS, || {
        let file_name = BffFileName::new("router.bff".to_string());
        let mut resolver = FakeModuleResolver {};
        parse_and_bind(&mut resolver, &file_name, &content)
    })
}

fn bundle_to_string_inner(router_content: &str) -> Result<WritableResultOrDiagnostics> {
    let entry: EntryPoints = EntryPoints {
        router_entry_point: Some(BffFileName::new("router.bff".to_string())),
        parser_entry_point: None,
        settings: BeffUserSettings {
            custom_formats: BTreeSet::new(),
        },
    };

    let mut man = FakeFileManager {
        content: Some(parse_content(router_content)?),
    };
    let res = beff_core::extract(&mut man, entry);

    let errors = res.errors();
    if errors.is_empty() {
        Ok(WritableResultOrDiagnostics::WritableModules(
            res.to_module()?,
        ))
    } else {
        Ok(WritableResultOrDiagnostics::WasmDiagnostic(
            WasmDiagnostic::from_diagnostics(errors),
        ))
    }
}
