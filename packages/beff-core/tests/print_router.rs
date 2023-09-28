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
                custom_formats: BTreeSet::from_iter(vec!["password".to_string()]),
            },
        };
        beff_core::extract(&mut man, entry)
    }

    fn ok(from: &str) -> String {
        let p = parse_api(from);
        let errors = p.errors();

        if !errors.is_empty() {
            panic!("errors: {:?}", errors);
        }
        match p.router {
            Some(v) => v
                .open_api
                .as_typescript_string(&v.validators.iter().collect::<Vec<_>>()),
            None => panic!(),
        }
    }

    #[test]
    fn ok_either() {
        let from = r#"
    /**
     * @category model
     * @since 2.0.0
     */
    type Left<E1> = {
         _tag: 'Left',
         left: E1,
    }
    /**
     * @category model
     * @since 2.0.0
     */
    type Right<A1> = {
         _tag: 'Right',
         right: A1,
    }
    /**
     * @category model
     * @since 2.0.0
     */
    type Either<E, A> = Left<E> | Right<A>

    export default {
      "/hello": {
          get: (): Either<string, number> => impl()
      }
    }
  "#;
        insta::assert_snapshot!(ok(from));
    }
    #[test]
    fn ok_either_interface() {
        let from = r#"
    /**
     * @category model
     * @since 2.0.0
     */
    interface Left<E1> {
         _tag: 'Left',
         left: E1,
    }
    /**
     * @category model
     * @since 2.0.0
     */
    interface Right<A2> {
         _tag: 'Right',
         right: A2,
    }
    /**
     * @category model
     * @since 2.0.0
     */
    type Either<E, A> = Left<E> | Right<A>

    export default {
      "/hello": {
          get: (): Either<string, number> => impl()
      }
    }
  "#;
        insta::assert_snapshot!(ok(from));
    }

    #[test]
    fn ok_template() {
        let from = r#"
    type A<E, A> = {
        e:E,a:A
    }
    export default {
      "/hello": {
          get: (): A<string, number> => impl()
      }
    }
  "#;
        insta::assert_snapshot!(ok(from));
    }
    #[test]
    fn ok_any_array() {
        let from = r#"
    export default {
        "/hello": {
            get: (): Array => impl()
        }
    }
    "#;

        insta::assert_snapshot!(ok(from));
    }
    #[test]
    fn ok_no_simplify_unions() {
        let from = r#"
    type A = "a"| "b"| "c";
    type B = "a"| "b"| "d" | "e";
    export default {
        "/hello": {
            get: (): A|B => impl()
        }
    }
    "#;

        insta::assert_snapshot!(ok(from));
    }
    #[test]
    fn ok_simplify_unions() {
        let from = r#"
    type A = ("a"| "b"| "c")|("a"| "b"| "d" | "e");
    export default {
        "/hello": {
            get: (): A => impl()
        }
    }
    "#;

        insta::assert_snapshot!(ok(from));
    }

    #[test]
    fn ok_interface_name() {
        let from = r#"
    interface B {
        a: string
    }
    export default {
        "/hello": {
            get: (): B => impl()
        }
    }
    "#;

        insta::assert_snapshot!(ok(from));
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

    #[test]
    fn ok_access_syntatically() {
        let from = r#"
    type Tags = "a" | "b"
    type A = {tag:Tags}
    type B = {t:A["tag"]}
    export default {
        "/hello": {
            get: (): B => impl()
        }
    }
    "#;

        insta::assert_snapshot!(ok(from));
    }

    #[test]
    fn ok_access_union_arr() {
        let from = r#"
    type A = [{tag:"a"}|{tag:"b"}]
    type B = A[number]["tag"] & string
    export default {
        "/hello": {
            get: (): B => impl()
        }
    }
    "#;

        insta::assert_snapshot!(ok(from));
    }

    #[test]
    fn ok_typeof_keyof() {
        let from = r#"
    const a1 = {a: 1};
    const a2 = {a: 1} as const;
    export default {
        "/no_const": {
            get: (): typeof a1 => impl()
        },
        "/yes_const": {
            get: (): typeof a2 => impl()
        }
    }
    "#;

        insta::assert_snapshot!(ok(from));
    }
    #[test]
    fn ok_typeof_keyof_access() {
        let from = r#"
    const a1 = {a: 1};
    const a2 = {a: 1} as const;
    export default {
        "/no_const": {
            get: (): (typeof a1)['a'] => impl()
        },
        "/yes_const": {
            get: (): (typeof a2)['a'] => impl()
        }
    }
    "#;

        insta::assert_snapshot!(ok(from));
    }

    #[test]
    fn ok_typeof_keyof_no_const() {
        let from = r#"
    const A = {
        a: "x",
        b: "y"
    }
    type A = (typeof A)[keyof typeof A]
    export default {
    
        "/it": {
            get: (): A => impl()
        }
    }
    "#;

        insta::assert_snapshot!(ok(from));
    }
    #[test]
    fn ok_typeof_keyof_as_const() {
        let from = r#"
    const A = {
        a: "x",
        b: "y"
    } as const
    type A = (typeof A)[keyof typeof A]
    export default {
    
        "/it": {
            get: (): A => impl()
        }
    }
    "#;

        insta::assert_snapshot!(ok(from));
    }

    #[test]
    fn ok_typeof_keyof_as_const_arr() {
        let from = r#"
    const A = {
        a: ["x"],
        b: ["y"]
    } as const
    type A = (typeof A)[keyof typeof A]
    export default {
    
        "/it": {
            get: (): A => impl()
        }
    }
    "#;

        insta::assert_snapshot!(ok(from));
    }
    #[test]
    fn ok_typeof_keyof_as_const_arr_indexed() {
        let from = r#"
    const A = {
        a: ["x"],
        b: ["y"]
    } as const
    type A = (typeof A)[keyof typeof A]
    type B = A[keyof A]
    export default {
    
        "/it": {
            get: (): B => impl()
        }
    }
    "#;

        insta::assert_snapshot!(ok(from));
    }

    #[test]
    fn ok_tpl() {
        let from = r#"
    type A = ['a','b','c']
    type B = A[1]
    export default {
        "/hello": {
            get: (): B => impl()
        }
    }
    "#;

        insta::assert_snapshot!(ok(from));
    }

    #[test]
    fn ok_tpl_rest() {
        let from = r#"
    type A = ['a','b','c', ...string[]]
    type B = A[100]
    export default {
        "/hello": {
            get: (): B => impl()
        }
    }
    "#;

        insta::assert_snapshot!(ok(from));
    }
    #[test]
    fn ok_date() {
        let from = r#"
    type A = Date
    export default {
        "/hello": {
            get: (): A => impl()
        }
    }
    "#;

        insta::assert_snapshot!(ok(from));
    }
    #[test]
    fn ok_fmt() {
        let from = r#"
    type A = StringFormat<"password">
    export default {
        "/hello": {
            get: (): A => impl()
        }
    }
    "#;

        insta::assert_snapshot!(ok(from));
    }
    #[test]
    fn ok_typeof_bigint() {
        let from = r#"
    const a = 1n as const;
    type A = typeof a;
    export default {
        "/hello": {
            get: (): A => impl()
        }
    }
    "#;

        insta::assert_snapshot!(ok(from));
    }
}
