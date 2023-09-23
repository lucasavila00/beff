#[cfg(test)]
mod tests {
    use std::{collections::BTreeSet, rc::Rc};

    use beff_core::{
        ast::json::Json,
        import_resolver::{parse_and_bind, FsModuleResolver},
        open_api_ast::{OpenApi, OpenApiParser, Validator},
        print::printer::open_api_to_json,
        schema_changes::{is_safe_to_change_to, MdReport, OpenApiBreakingChange},
        BeffUserSettings, BffFileName, EntryPoints, FileManager, ParsedModule,
    };
    use similar_asserts::assert_eq;
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
            settings: BeffUserSettings {
                custom_formats: BTreeSet::new(),
            },
        };
        let res = beff_core::extract(&mut man, entry);
        let res = res.router.unwrap();
        assert!(res.errors.is_empty(), "{:?}", res.errors);
        (res.open_api, res.validators)
    }

    fn test_safe(from: &str, to: &str) -> Vec<OpenApiBreakingChange> {
        let (from_api, from_validators) = parse_api(from);
        let (to_api, to_validators) = parse_api(to);
        let errors = is_safe_to_change_to(
            &from_api,
            &to_api,
            &from_validators.iter().collect::<Vec<_>>(),
            &to_validators.iter().collect::<Vec<_>>(),
        )
        .unwrap();
        errors
    }

    fn print_errors(from: &str, to: &str, errors: &[OpenApiBreakingChange]) -> String {
        let errs = errors
            .iter()
            .flat_map(|it| it.print_report())
            .collect::<Vec<MdReport>>()
            .into_iter()
            .map(|it| it.print())
            .collect::<Vec<String>>()
            .join("\n\n");

        format!("from:\n{}\nto:\n{}\n\n{}", from, to, errs)
    }

    #[test]
    fn json_roundtrip() {
        let from = r#"
        type A = string;
        export default {
            "/hello/{n}": {
                delete: (c:Ctx,n:string, a: 1, b: {c:2}, z: Header<string>): A => impl(),
                post: (c:Ctx,n:string,): ["a1", {a:number[]}]|["a2", {b:boolean[]}] => impl(),
                put: (c:Ctx,n:string,): ["a1", {a:number}]|["a2", {a?:string}] => impl()
            }
        }
        "#;
        let (from_api, from_validators) = parse_api(from);
        let str = open_api_to_json(from_api, &from_validators).to_string();
        let from_str = serde_json::from_str::<serde_json::Value>(&str).unwrap();
        let from_serde = Json::from_serde(&from_str);
        let mut parser = OpenApiParser::new();
        parser.process(&from_serde).unwrap();
        let str2 = open_api_to_json(parser.api, &parser.components).to_string();

        assert_eq!(str, str2);
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
        insta::assert_snapshot!(print_errors(from, to, &errors));
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
        insta::assert_snapshot!(print_errors(from, to, &errors));
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
        insta::assert_snapshot!(print_errors(from, to, &errors));
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
        insta::assert_snapshot!(print_errors(from, to, &errors));
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
        insta::assert_snapshot!(print_errors(from, to, &errors));
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
        insta::assert_snapshot!(print_errors(from, to, &errors));
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
        insta::assert_snapshot!(print_errors(from, to, &errors));
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
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }

    #[test]
    fn ok_nothing() {
        let from = r#"
        export default {
            "/hello": {
                get: ():string  => {
                    return "world";
                }
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: ():string => {
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
                get: (c:Ctx, a: "a"|"b") :string => {
                    return "world";
                }
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (c:Ctx, a: "a") :string => {
                    return "world";
                }
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }
    #[test]
    fn fail_param_2() {
        let from = r#"
        type A = "a"|"b";
        export default {
            "/hello": {
                get: (c:Ctx, a: A):A => impl()
            }
        }
        "#;

        let to = r#"
        type A = "a";
        export default {
            "/hello": {
                get: (c:Ctx, a: A):A => impl()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }
    #[test]
    fn fail_body_1() {
        let from = r#"
        type A = "a";
        export default {
            "/hello": {
                get: (c:Ctx, a: A):A => impl()
            }
        }
        "#;

        let to = r#"
        type A = "a"|"b";
        export default {
            "/hello": {
                get: (c:Ctx, a: A):A => impl()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }

    #[test]
    fn ok_from_any() {
        let from = r#"
        export default {
            "/hello": {
                get: () :any => todo()
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
        assert!(errors.is_empty());
    }
    #[test]
    fn fail_to_any() {
        let from = r#"
        export default {
            "/hello": {
                get: ():1 => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: ():any => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }

    #[test]
    fn fail_disc_union() {
        let from = r#"
        export default {
            "/hello": {
                get: ():  {ok:false, data: number} => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): {ok:false, data: boolean} => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }

    #[test]
    fn fail_disc_union2() {
        let from = r#"
        export default {
            "/hello": {
                get: (): {ok: true, data: string} | {ok:false, data: number} => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): {ok: true, data: string} | {ok:false, data: boolean} => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }
    #[test]
    fn fail_disc_union3() {
        let from = r#"
        export default {
            "/hello": {
                get: (): {ok: true, data: string} | {ok:false, data: number} => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): {ok: true, data: string} | {data: number} => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }
    #[test]
    fn fail_mapping_diff() {
        let from = r#"
        export default {
            "/hello": {
                get: (): {a:string, b: boolean} => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): {a:string, b?: boolean} => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }

    #[test]
    fn fail_disc_union_arr() {
        let from = r#"
        export default {
            "/hello": {
                get: (): ["a1", number]|["a2", string] => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): ["a1", number]|["a2", boolean] => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }
    #[test]
    fn fail_disc_union_arr2() {
        let from = r#"
        export default {
            "/hello": {
                get: (): ["a1", number]|["a2", "asd"] => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): ["a1", number]|["a2", string] => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }
    #[test]
    fn fail_disc_union_arr3() {
        let from = r#"
        export default {
            "/hello": {
                get: (): ["a1", {a:number}]|["a2", {a:string}] => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): ["a1", {a:number}]|["a2", {a:boolean}] => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }
    #[test]
    fn fail_disc_union_arr4() {
        let from = r#"
        export default {
            "/hello": {
                get: (): ["a1", number]|["a2", string] => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): ["a1", number]|["a3", string] => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }
    #[test]
    fn fail_disc_union_arr5() {
        let from = r#"
        export default {
            "/hello": {
                get: (): ["a1", {a:number}]|["a2", {a:string}] => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): ["a1", {a:number}]|["a2", {a?:string}] => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }
    #[test]
    fn fail_disc_union_arr6() {
        let from = r#"
        export default {
            "/hello": {
                get: (): ["a1", {a:number[]}]|["a2", {a:string[]}] => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): ["a1", {a:number[]}]|["a2", {a?:string[]}] => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }
    #[test]
    fn fail_disc_union_arr61() {
        let from = r#"
        export default {
            "/hello": {
                get: (): ["a2", {a:string[]}]|["a1", {a:number[]}] => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): ["a1", {a:number[]}]|["a2", {a?:string[]}] => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }
    #[test]
    fn fail_disc_union_arr62() {
        let from = r#"
        export default {
            "/hello": {
                get: (): ["a2", {a:string[]}]|["a1", {a:number[]}] => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): ["a2", {a?:string[]}]|["a1", {a:number[]}] => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }
    #[test]
    fn fail_disc_union_arr7() {
        let from = r#"
        export default {
            "/hello": {
                get: (): ["a1",] |["a2", {a:string[]}] => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): ["a1",]|["a2", {a?:string[]}] => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }
    #[test]
    fn fail_min_1() {
        let from = r#"
        export default {
            "/hello": {
                get: (): ["a2", {a:string[]}] => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): ["a2", {a?:string[]}] => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }
    #[test]
    fn fail_min_2() {
        let from = r#"
        export default {
            "/hello": {
                get: (): {a:string[]} => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: ():  {a?:string[]} => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }
    #[test]
    fn fail_min_21() {
        let from = r#"
        export default {
            "/hello": {
                get: (): {a:string[]} => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: ():  {a:number|(string[])} => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }
    #[test]
    fn fail_min_3() {
        let from = r#"
        export default {
            "/hello": {
                get: (): {a:string} => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: ():  {a?:string} => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }

    #[test]
    fn fail_num() {
        let from = r#"
        export default {
            "/hello": {
                get: (): 555 => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): number => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }

    #[test]
    fn fail_num2() {
        let from = r#"
        export default {
            "/hello": {
                get: (): [555] => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): [number] => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }
    #[test]
    fn fail_num21() {
        let from = r#"
        export default {
            "/hello": {
                get: (): [555,555] => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): [number,number] => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }
    #[test]
    fn fail_num3() {
        let from = r#"
        export default {
            "/hello": {
                get: (): 555[] => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): number[] => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }
    #[test]
    fn fail_num4() {
        let from = r#"
        export default {
            "/hello": {
                get: (): {a: 555} => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): {a: number} => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }
    #[test]
    fn fail_num5() {
        let from = r#"
        export default {
            "/hello": {
                get: (): {a?: 555} => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): {a?: number} => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }

    #[test]
    fn fail_disc_union_arr63() {
        let from = r#"
        export default {
            "/hello": {
                get: (): ["a1", {a:number[]}]|["a2", {a:boolean[]}] => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): ["a1", {a:number[]}]|["a2", {b:boolean[]}] => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }
    #[test]
    fn fail_disc_union_arr64() {
        let from = r#"
        export default {
            "/hello": {
                get: (): false[] => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): boolean[] => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }
    #[test]
    fn fail_disc_union_arr631() {
        let from = r#"
        export default {
            "/hello": {
                get: (): ["a1", {a:['a3',number]}]|["a2", {a:boolean[]}] => todo()
            }
        }
        "#;

        let to = r#"
        export default {
            "/hello": {
                get: (): ["a1", {a:['a4',number]}]|["a2", {a:boolean[]}] => todo()
            }
        }
        "#;
        let errors = test_safe(from, to);
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }

    #[test]
    fn ok_typeof() {
        let from = r#"
        type A = 'b';
        
        export default {
            "/hello": {
                get: (): A => impl()
            }
        }
        "#;

        let to = r#"
        const valueB = "b" as const;
        type B = typeof valueB;
        
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
    fn ok_typeof2() {
        let from = r#"
        type A = 1;
        
        export default {
            "/hello": {
                get: (): A => impl()
            }
        }
        "#;

        let to = r#"
        const valueB = 1 as const;
        type B = typeof valueB;
        
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
    fn ok_typeof3() {
        let from = r#"
        type A = true;
        
        export default {
            "/hello": {
                get: (): A => impl()
            }
        }
        "#;

        let to = r#"
        const valueB = true as const;
        type B = typeof valueB;
        
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
    fn ok_typeof4() {
        let from = r#"
        type A = ["a"];
        
        export default {
            "/hello": {
                get: (): A => impl()
            }
        }
        "#;

        let to = r#"
        const valueB = ["a"] as const;
        type B = typeof valueB;
        
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
    fn ok_typeof5() {
        let from = r#"
        type A = {a: 1}
        
        export default {
            "/hello": {
                get: (): A => impl()
            }
        }
        "#;

        let to = r#"
        const valueB = {a:1} as const;
        type B = typeof valueB;
        
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
    fn fail_typeof() {
        let from = r#"
        const valueB = "b" as const;
        type B = typeof valueB;
        
        export default {
            "/hello": {
                get: (): B => impl()
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
        assert!(!errors.is_empty());
        insta::assert_snapshot!(print_errors(from, to, &errors));
    }
}
