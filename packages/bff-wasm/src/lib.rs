#[macro_use]
extern crate lazy_static;

mod imports_visitor;
mod utils;

use std::collections::HashSet;
use std::rc::Rc;
use std::sync::Arc;
use std::{cell::RefCell, collections::HashMap};

use crate::imports_visitor::ImportsVisitor;
use anyhow::anyhow;
use anyhow::Result;
use bff_core::api_extractor::FileManager;
use bff_core::diag::Diagnostic;
use bff_core::emit::emit_module;
use bff_core::printer::ToModule;
use bff_core::{parse::load_source_file, BundleResult, ParsedModule, ParsedModuleLocals};
use log::Level;
use serde::{Deserialize, Serialize};
use swc_common::{FileName, Globals, SourceMap, GLOBALS};
use swc_ecma_visit::Visit;
use wasm_bindgen::prelude::wasm_bindgen;
use wasm_bindgen::JsValue;
struct Bundler {
    pub files: HashMap<FileName, Rc<ParsedModule>>,
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
pub fn init() {
    console_log::init_with_level(Level::Debug).expect("should be able to log");
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

struct LazyFileManager<'a> {
    pub files: &'a mut HashMap<FileName, Rc<ParsedModule>>,
    pub known_files: HashSet<String>,
}

fn parse_file_content(
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

impl<'a> FileManager for LazyFileManager<'a> {
    fn get_file(&mut self, name: &FileName) -> Option<Rc<ParsedModule>> {
        if let Some(it) = self.files.get(name) {
            return Some(it.clone());
        }
        let content = read_file_content(name.to_string().as_str())?;
        let file_name = FileName::Real(name.to_string().into());

        let res = parse_file_content(file_name, &content);
        match res {
            Ok((f, imports)) => {
                self.known_files.extend(imports);
                self.files.insert(name.clone(), f.clone());
                Some(f)
            }
            Err(_) => None,
        }
    }

    fn get_existing_file(&self, name: &FileName) -> Option<Rc<ParsedModule>> {
        self.files.get(name).map(|opt| opt.clone())
    }
}

fn get_bundle_result(file_name: &str) -> Result<BundleResult> {
    GLOBALS.set(&SWC_GLOBALS, || {
        BUNDLER.with(|b| {
            let mut b = b.borrow_mut();
            let entry_point = FileName::Real(file_name.into());
            let known_files = b.known_files.clone();
            let mut man = LazyFileManager {
                files: &mut b.files,
                known_files: known_files,
            };
            let extract_result = bff_core::api_extractor::extract_schema(&mut man, &entry_point);
            Ok(BundleResult {
                open_api: extract_result.open_api,
                errors: extract_result.errors,
                entry_point: entry_point.to_string().into(),
                handlers: extract_result.handlers,
                entry_file_name: entry_point,
                components: extract_result.components,
            })
        })
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
pub fn bundle_to_string(file_name: &str) -> Option<String> {
    match bundle_to_string_inner(file_name) {
        Ok(s) => Some(s),
        Err(_) => None,
    }
}

#[derive(Serialize, Deserialize)]
struct BundleDiagnosticItem {
    message: String,
    file_name: String,

    line_lo: usize,
    col_lo: usize,
    line_hi: usize,
    col_hi: usize,
}
#[derive(Serialize, Deserialize)]
struct BundleDiagnostic {
    diagnostics: Vec<BundleDiagnosticItem>,
}

fn to_bundle_diag(x: Diagnostic) -> BundleDiagnosticItem {
    BundleDiagnosticItem {
        message: format!("{:?}", x.message),
        file_name: x.file_name.to_string(),
        col_hi: x.loc_hi.col.0,
        col_lo: x.loc_lo.col.0,
        line_hi: x.loc_hi.line,
        line_lo: x.loc_lo.line,
    }
}

fn bundle_to_diagnostics_inner(file_name: &str) -> Result<BundleDiagnostic> {
    let res = get_bundle_result(file_name)?;
    if res.errors.is_empty() {
        let (_ast, write_errs) = res.to_module();

        return Ok(BundleDiagnostic {
            diagnostics: write_errs.into_iter().map(to_bundle_diag).collect(),
        });
    }
    return Ok(BundleDiagnostic {
        diagnostics: res.errors.into_iter().map(to_bundle_diag).collect(),
    });
}

#[wasm_bindgen]
pub fn bundle_to_diagnostics(file_name: &str) -> JsValue {
    let v = bundle_to_diagnostics_inner(file_name);
    match v {
        Ok(v) => serde_wasm_bindgen::to_value(&v).unwrap(),
        Err(_) => JsValue::null(),
    }
}

fn update_file_content_inner(file_name: &str, content: &str) {
    let file_name = FileName::Real(file_name.to_string().into());
    let res = GLOBALS.set(&SWC_GLOBALS, || {
        parse_file_content(file_name.clone(), &content)
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
#[wasm_bindgen]
pub fn update_file_content(file_name: &str, content: &str) {
    update_file_content_inner(file_name, content)
}
