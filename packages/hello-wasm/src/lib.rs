#[macro_use]
extern crate lazy_static;

mod imports_visitor;
mod utils;

use std::{cell::RefCell, collections::HashMap};

use anyhow::Result;
use bff_core::{parse::load_source_file, ParsedModule, ParsedModuleLocals};
use log::Level;
use swc_common::{FileName, Globals, SourceMap, GLOBALS};
use swc_ecma_visit::Visit;
use wasm_bindgen::prelude::wasm_bindgen;

use crate::imports_visitor::ImportsVisitor;

struct Bundler {
    pub files: HashMap<FileName, ParsedModule>,
    pub stack: Vec<FileName>,
}

impl Bundler {
    pub fn new() -> Bundler {
        Bundler {
            files: HashMap::new(),
            stack: Vec::new(),
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
            let (module, comments) =
                load_source_file(&source_file).expect("should be able to load source file");
            log::info!("{source_file:?}");
            let mut v = ImportsVisitor::from_file(module.fm.name.clone());
            v.visit_module(&module.module);
            let imports = v.imports.values().collect::<Vec<_>>();
            log::info!("{imports:?}");
            bundler
                .stack
                .extend(imports.iter().map(|x| x.file_name.clone()));

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
