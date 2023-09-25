#[cfg(test)]
mod tests {
    use std::{collections::BTreeSet, rc::Rc};

    use beff_core::{
        import_resolver::{parse_and_bind, FsModuleResolver},
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
            let res = parse_and_bind(&mut resolver, &file_name, &content);
            res.unwrap()
        })
    }
    fn parse_api(it: &str) -> ExtractResult {
        let f = parse_str(it);
        let mut man = TestFileManager { f };
        let entry = EntryPoints {
            router_entry_point: Some(BffFileName::new("file.ts".into())),
            parser_entry_point: None,
            settings: BeffUserSettings {
                custom_formats: BTreeSet::new(),
            },
        };
        beff_core::extract(&mut man, entry)
    }

    fn ok(from: &str) -> String {
        let p = parse_api(from);
        let errors = p.errors();
        assert!(errors.is_empty());
        match p.router {
            Some(v) => v
                .open_api
                .as_typescript_string(&v.validators.iter().collect::<Vec<_>>()),
            None => panic!(),
        }
    }

    #[test]
    fn ok_access_union() {
        let from = r#"
    type A = {tag:"a"}|{tag:"b"}
    type B = A["tag"]
    export default {
        "/hello": {
            get: (): B => impl()
        }
    }
    "#;

        insta::assert_snapshot!(ok(from));
    }
}
