use crate::{
    BeffUserSettings, BffFileName, EntryPoints, FileManager, ParsedModule,
    parser_extractor::ParserExtractResult,
    swc_tools::bind_exports::{FsModuleResolver, parse_and_bind},
};
use std::{
    collections::{BTreeMap, BTreeSet},
    rc::Rc,
};
use swc_common::{GLOBALS, Globals};

struct TestFileManager {
    pub fs: BTreeMap<BffFileName, Rc<ParsedModule>>,
}

fn mock_resolve_import(module_specifier: &str) -> Option<BffFileName> {
    // assert the module specifier is something like "./mod"
    let starts_with_dot = module_specifier.starts_with("./");
    if !starts_with_dot {
        panic!(
            "Only relative imports are supported in tests, got: {}",
            module_specifier
        );
    }
    let replaced = module_specifier.replace("./", "");
    Some(BffFileName::new(format!("{}.ts", replaced)))
}

impl FileManager for TestFileManager {
    fn get_or_fetch_file(&mut self, name: &BffFileName) -> Option<Rc<ParsedModule>> {
        self.fs.get(name).cloned()
    }

    fn get_existing_file(&self, name: &BffFileName) -> Option<Rc<ParsedModule>> {
        self.fs.get(name).cloned()
    }
    fn resolve_import(
        &mut self,
        _current_file: BffFileName,
        module_specifier: &str,
    ) -> Option<BffFileName> {
        mock_resolve_import(module_specifier)
    }
}

struct TestResolver {}
impl FsModuleResolver for TestResolver {
    fn resolve_import(
        &mut self,
        _current_file: BffFileName,
        module_specifier: &str,
    ) -> Option<BffFileName> {
        mock_resolve_import(module_specifier)
    }
}
fn parse_module(file_name: BffFileName, content: &str) -> Rc<ParsedModule> {
    let mut resolver = TestResolver {};
    GLOBALS.set(&Globals::new(), || {
        let res = parse_and_bind(&mut resolver, &file_name, content);
        res.expect("failed to parse")
    })
}
fn parse_modules(fs: &[(&str, &str)]) -> BTreeMap<BffFileName, Rc<ParsedModule>> {
    let mut map = BTreeMap::new();
    for (name, content) in fs {
        let file_name = BffFileName::new((*name).into());
        let parsed = parse_module(file_name.clone(), content);
        map.insert(file_name, parsed);
    }
    map
}
fn extract_types(fs: &[(&str, &str)]) -> ParserExtractResult {
    let mut man = TestFileManager {
        fs: parse_modules(fs),
    };
    let entry = EntryPoints {
        parser_entry_point: BffFileName::new("entry.ts".into()),
        settings: BeffUserSettings {
            string_formats: BTreeSet::from_iter(vec![
                "password".to_string(),
                "User".to_string(),
                "ReadAuthorizedUser".to_string(),
                "WriteAuthorizedUser".to_string(),
            ]),
            number_formats: BTreeSet::from_iter(vec![
                "age".to_string(),
                "NonInfiniteNumber".to_string(),
                "NonNegativeNumber".to_string(),
                "Rate".to_string(),
            ]),
        },
    };
    crate::extract(&mut man, entry)
}

pub fn print_types(from: &str) -> String {
    let p = extract_types(&[("entry.ts", from)]);
    let errors = &p.errors;

    if !errors.is_empty() {
        panic!("errors: {:?}", errors);
    }
    p.debug_print()
}
pub fn print_types_multifile(fs: &[(&str, &str)]) -> String {
    let p = extract_types(fs);
    let errors = &p.errors;

    if !errors.is_empty() {
        panic!("errors: {:?}", errors);
    }
    p.debug_print()
}
pub fn print_cgen(from: &str) -> String {
    let p = extract_types(&[("entry.ts", from)]);
    let errors = &p.errors;

    if !errors.is_empty() {
        panic!("errors: {:?}", errors);
    }
    p.emit_code().expect("should be able to emit module")
}

pub fn failure(from: &str) -> String {
    let p = extract_types(&[("entry.ts", from)]);
    let errors = &p.errors;

    if errors.is_empty() {
        panic!("expected errors, but none found");
    }
    let mut out = String::new();
    for err in errors {
        out.push_str(&format!("{:?}\n", err));
    }
    out
}
