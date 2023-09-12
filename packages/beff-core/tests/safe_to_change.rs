#[cfg(test)]
mod tests {
    use std::rc::Rc;

    use beff_core::{
        import_resolver::{parse_and_bind, FsModuleResolver},
        open_api_ast::{OpenApi, Validator},
        schema_changes::{is_safe_to_change_to, MdReport, OpenApiBreakingChange},
        BffFileName, EntryPoints, FileManager, ParsedModule,
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
    fn parse_api(it: &str) -> (OpenApi, Vec<Validator>) {
        let f = parse_str(it);
        let mut man = TestFileManager { f };
        let entry = EntryPoints {
            router_entry_point: Some(BffFileName::new("file.ts".into())),
            parser_entry_point: None,
        };
        let res = beff_core::extract(&mut man, entry);
        let res = res.router.unwrap();
        (res.open_api, res.validators)
    }

    fn test_safe(from: &str, to: &str) -> Vec<OpenApiBreakingChange> {
        let (from_api, from_vals) = parse_api(from);
        let (to_api, to_vals) = parse_api(to);
        let errors = is_safe_to_change_to(
            &from_api,
            &to_api,
            &from_vals.iter().collect::<Vec<_>>(),
            &to_vals.iter().collect::<Vec<_>>(),
        )
        .unwrap();
        errors
    }

    fn print_errors(errors: &[OpenApiBreakingChange]) -> String {
        errors
            .iter()
            .flat_map(|it| it.print_report())
            .collect::<Vec<MdReport>>()
            .into_iter()
            .map(|it| it.print())
            .collect::<Vec<String>>()
            .join("\n\n")
    }
    #[test]
    fn ok1() {
        let from = r#"
        type A = string;
        export default {
            "/hello": {
                get: (): A => impl()
            }
        }
        "#;

        let to = r#"
        type B = string;
        export default {
            "/hello": {
                get: (): B => impl()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(errors.is_empty());
    }

    #[test]
    fn ok2() {
        let from = r#"
        type A = string;
        type AObject = {p: A};
        export default {
            "/hello": {
                get: (): AObject => impl()
            }
        }
        "#;

        let to = r#"
        type B = string;
        type BObject = {p: B};
        export default {
            "/hello": {
                get: (): BObject => impl()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(errors.is_empty());
    }

    #[test]
    fn ok3() {
        let from = r#"
        type A = string;
        type AObject = {p: A, arr: AObject[]};
        export default {
            "/hello": {
                get: (): AObject => impl()
            }
        }
        "#;

        let to = r#"
        type B = string;
        type BObject = {p: B, arr: BObject[]};
        export default {
            "/hello": {
                get: (): BObject => impl()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(errors.is_empty());
    }
    #[test]
    fn ok4() {
        let from = r#"
        type A = string;
        type AObject = {p: A, arr: AObject[]};
        export default {
            "/hello": {
                get: (): AObject => impl()
            }
        }
        "#;

        let to = r#"
        type B = string;
        type BObject = {p: B, p2:B, arr: BObject[]};
        export default {
            "/hello": {
                get: (): BObject => impl()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(errors.is_empty());
    }

    #[test]
    fn fail_recursive() {
        let from = r#"
        type A = string;
        type AObject = {p: A, arr: AObject[]};
        export default {
            "/hello": {
                get: (): AObject => impl()
            }
        }
        "#;

        let to = r#"
        type B = string;
        type BObject = {p2: B, arr: BObject[]};
        export default {
            "/hello": {
                get: (): BObject => impl()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(&errors));
    }

    #[test]
    fn fail1() {
        let from = r#"
        export default {
            "/hello": {
                get: (): "world" => {
                    return "world";
                }
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): string => {
                    return "world";
                }
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(&errors));
    }

    #[test]
    fn fail2() {
        let from = r#"
        export default {
            "/hello": {
                get: (): "a"|"b" => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): "a"|"b"|"c" => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(&errors));
    }
    #[test]
    fn fail3() {
        let from = r#"
        export default {
            "/hello": {
                get: (): ("a"|"b")[] => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): ("a"|"b"|"c")[] => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(&errors));
    }
    #[test]
    fn fail4() {
        let from = r#"
        export default {
            "/hello": {
                get: (): ["a"|"b"] => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): ["a"|"b"|"c"] => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(&errors));
    }
    #[test]
    fn fail5() {
        let from = r#"
        export default {
            "/hello": {
                get: (): {p:"a"|"b"} => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): {p:"a"|"b"|"c"} => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(&errors));
    }
    #[test]
    fn fail6() {
        let from = r#"
        export default {
            "/hello": {
                get: (): ({p:"a"|"b"}&{a:1}) => todo(),
                post: (): ({p:"a"|"b",a:1}) => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): ({p:"a"|"b"|"c"}&{a:1}) => todo(),
                post: (): ({p:"a"|"b"|"c",a:1}) => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(&errors));
    }
    #[test]
    fn fail7() {
        let from = r#"
        export default {
            "/hello": {
                get: (): 1 => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): 2 => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(&errors));
    }

    #[test]
    fn ok_nothing() {
        let from = r#"
        export default {
            "/hello": {
                get: ()  => {
                    return "world";
                }
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: () => {
                    return "world";
                }
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(errors.is_empty());
    }

    #[test]
    fn fail_param_1() {
        let from = r#"
        export default {
            "/hello": {
                get: (c:Ctx, a: "a"|"b")  => {
                    return "world";
                }
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (c:Ctx, a: "a") => {
                    return "world";
                }
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(&errors));
    }
}
