#[cfg(test)]
mod tests {
    use std::{
        collections::{BTreeMap, BTreeSet},
        rc::Rc,
    };

    use beff_core::{
        import_resolver::{parse_and_bind, FsModuleResolver},
        parser_extractor::ParserExtractResult,
        BeffUserSettings, BffFileName, EntryPoints, FileManager, ParsedModule,
    };
    use swc_common::{Globals, GLOBALS};
    struct TestFileManager {
        pub fs: BTreeMap<BffFileName, Rc<ParsedModule>>,
    }

    impl FileManager for TestFileManager {
        fn get_or_fetch_file(&mut self, name: &BffFileName) -> Option<Rc<ParsedModule>> {
            self.fs.get(name).cloned()
        }

        fn get_existing_file(&self, name: &BffFileName) -> Option<Rc<ParsedModule>> {
            self.fs.get(name).cloned()
        }
    }

    struct TestResolver {}
    impl FsModuleResolver for TestResolver {
        fn resolve_import(&mut self, module_specifier: &str) -> Option<BffFileName> {
            dbg!(module_specifier);
            todo!()
        }
    }
    fn parse_module(content: &str) -> Rc<ParsedModule> {
        let mut resolver = TestResolver {};
        let file_name = BffFileName::new("file.ts".into());
        GLOBALS.set(&Globals::new(), || {
            let res = parse_and_bind(&mut resolver, &file_name, content);
            res.expect("failed to parse")
        })
    }
    fn parse_modules(fs: &[(&str, &str)]) -> BTreeMap<BffFileName, Rc<ParsedModule>> {
        let mut map = BTreeMap::new();
        for (name, content) in fs {
            let file_name = BffFileName::new((*name).into());
            let parsed = parse_module(content);
            map.insert(file_name, parsed);
        }
        map
    }
    fn extract_types(fs: &[(&str, &str)]) -> ParserExtractResult {
        let mut man = TestFileManager {
            fs: parse_modules(fs),
        };
        let entry = EntryPoints {
            parser_entry_point: BffFileName::new("file.ts".into()),
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
                frontend: beff_core::FrontendVersion::V2,
            },
        };
        beff_core::extract(&mut man, entry)
    }

    fn print_types(from: &str) -> String {
        let p = extract_types(&[("file.ts", from)]);
        let errors = &p.errors;

        if !errors.is_empty() {
            panic!("errors: {:?}", errors);
        }
        p.debug_print()
    }
    fn print_types_multifile(fs: &[(&str, &str)]) -> String {
        let p = extract_types(fs);
        let errors = &p.errors;

        if !errors.is_empty() {
            panic!("errors: {:?}", errors);
        }
        p.debug_print()
    }

    #[test]
    fn type_ref() {
        let from = r#"

    type UserId = string;
    parse.buildParsers<{ UserId: UserId }>();

  "#;
        insta::assert_snapshot!(print_types(from));
    }
}
