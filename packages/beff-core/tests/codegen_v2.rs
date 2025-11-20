#[cfg(test)]
mod tests {
    use std::{collections::BTreeSet, rc::Rc};

    use beff_core::{
        import_resolver::{parse_and_bind, FsModuleResolver},
        print::printer2::ToWritableParser,
        BeffUserSettings, BffFileName, EntryPoints, ExtractResult, FileManager, ParsedModule,
    };
    use swc_common::{Globals, GLOBALS};
    struct TestFileManager {
        pub f: Rc<ParsedModule>,
    }

    impl FileManager for TestFileManager {
        fn get_or_fetch_file(&mut self, _name: &BffFileName) -> Option<Rc<ParsedModule>> {
            Some(self.f.clone())
        }

        fn get_existing_file(&self, _name: &BffFileName) -> Option<Rc<ParsedModule>> {
            Some(self.f.clone())
        }
    }

    struct TestResolver {}
    impl FsModuleResolver for TestResolver {
        fn resolve_import(&mut self, _module_specifier: &str) -> Option<BffFileName> {
            None
        }
    }
    fn parse_str(content: &str) -> Rc<ParsedModule> {
        let mut resolver = TestResolver {};
        let file_name = BffFileName::new("file.ts".into());
        GLOBALS.set(&Globals::new(), || {
            let res = parse_and_bind(&mut resolver, &file_name, content);
            res.expect("failed to parse")
        })
    }
    fn parse_api(it: &str) -> ExtractResult {
        let f = parse_str(it);
        let mut man = TestFileManager { f };
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
            },
        };
        beff_core::extract(&mut man, entry)
    }

    fn decoder(from: &str) -> String {
        let p = parse_api(from);
        let errors = p.errors();

        if !errors.is_empty() {
            panic!("errors: {:?}", errors);
        }
        let res = ExtractResult { parser: p.parser };
        let m = res.to_module_v2().expect("should be able to emit module");
        m.js_built_parsers
    }

    #[test]
    fn ok_string_decoder() {
        insta::assert_snapshot!(decoder(
            r#"
        parse.buildParsers<{ Dec: string }>();
      "#
        ));
    }

    #[test]
    fn ok_string_alias_decoder() {
        insta::assert_snapshot!(decoder(
            r#"
        export type Alias = string;
        parse.buildParsers<{ Dec: Alias }>();
      "#
        ));
    }
}
