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
                frontend: beff_core::FrontendVersion::V2,
            },
        };
        beff_core::extract(&mut man, entry)
    }

    fn print_types(from: &str) -> String {
        let p = extract_types(&[("entry.ts", from)]);
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

    #[test]
    fn typeof_local() {
        let from = r#"

    const abc = "abc" as const;
    type X = typeof abc;
    parse.buildParsers<{ X: X }>();

  "#;
        insta::assert_snapshot!(print_types(from));
    }

    #[test]
    fn type_ref_multifile() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    export type X = string;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { X } from "./t";
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn typeof_multifile() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    export const abc = "abc" as const;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { abc } from "./t";
                    type X = typeof abc;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn typeof_multifile_default_export() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    export default "abc" as const;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import abc from "./t";
                    type X = typeof abc;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn exort_default_type_ref() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    type Y = string;
                    export default Y;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import Y from "./t";
                    type X = Y;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn exort_default_value_identifier() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    const Y1 = "abc" as const;
                    export default Y1;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import Y2 from "./t";
                    type Z = typeof Y2;
                    parse.buildParsers<{  Z: Z }>();
                "#
            )
        ]));
    }

    #[test]
    fn exort_default_value_identifier_same_name() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    const Y = "abc" as const;
                    export default Y;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import Y from "./t";
                    type Z = typeof Y;
                    parse.buildParsers<{  Z: Z }>();
                "#
            )
        ]));
    }

    #[test]
    fn exort_default_type_and_value() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    type Y = number;
                    const Y = "abc" as const;
                    export default Y;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import Y from "./t";
                    type X = Y;
                    type Z = typeof Y;
                    parse.buildParsers<{ X: X, Z: Z }>();
                "#
            )
        ]));
    }

    #[test]
    fn typeof_export_from_other_file() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "a.ts",
                r#"
                    export const abc = "abc" as const;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export { abc } from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { abc } from "./b";
                    type X = typeof abc;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn type_export_from_other_file() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "a.ts",
                r#"
                    export type abc = "abc";
                "#,
            ),
            (
                "b.ts",
                r#"
                    export { abc } from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { abc } from "./b";
                    type X = abc;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn type_snd_value_export_from_other_file() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "a.ts",
                r#"
                    export type abc = "abc";
                    export const abc = 123 as const;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export { abc } from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { abc } from "./b";
                    type X = abc;
                    type Y = typeof abc;
                    parse.buildParsers<{ X: X, Y: Y }>();
                "#
            )
        ]));
    }

    #[test]
    fn import_star_type() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    export type Y1 = string;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Y2 from "./t";
                    type Z = Y2.Y1;
                    parse.buildParsers<{ Z: Z }>();
                "#
            )
        ]));
    }

    #[test]
    fn export_star_type_from_other_file() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "a.ts",
                r#"
                    export type Y1 = string;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export * from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { Y1 } from "./b";
                    type Z = Y1;
                    parse.buildParsers<{ Z: Z }>();
                "#
            )
        ]));
    }

    #[test]
    fn import_star_type_from_other_file() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "a.ts",
                r#"
                    export type Y1 = string;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export * from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Y2 from "./b";
                    type Z = Y2.Y1;
                    parse.buildParsers<{ Z: Z }>();
                "#
            )
        ]));
    }

    #[test]
    fn import_star_value() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    export const Y1 = "abc" as const;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Y2 from "./t";
                    type Z = typeof Y2.Y1;
                    parse.buildParsers<{ Z: Z }>();
                "#
            )
        ]));
    }

    #[test]
    fn named_export_with_renaming() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    const A = "a" as const;
                    export { A as B };
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { B } from "./t";
                    type X = typeof B;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn named_import_with_renaming() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    export const A = "a" as const;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A as B } from "./t";
                    type X = typeof B;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn re_export_with_renaming() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "a.ts",
                r#"
                    export const A = "a" as const;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export { A as B } from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { B } from "./b";
                    type X = typeof B;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn namespace_re_export() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "a.ts",
                r#"
                    export const A = "a" as const;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export * as ns from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { ns } from "./b";
                    type X = typeof ns.A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn combined_default_and_named_import() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    export const A = "a" as const;
                    const D = "d" as const;
                    export default D;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import D, { A } from "./t";
                    type X = typeof D;
                    type Y = typeof A;
                    parse.buildParsers<{ X: X, Y: Y }>();
                "#
            )
        ]));
    }

    #[test]
    fn combined_default_and_namespace_import() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    export const A = "a" as const;
                    const D = "d" as const;
                    export default D;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import D, * as ns from "./t";
                    type X = typeof D;
                    type Y = typeof ns.A;
                    parse.buildParsers<{ X: X, Y: Y }>();
                "#
            )
        ]));
    }

    #[test]
    fn nested_qualified_type_access() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "c.ts",
                r#"
                    export type C = string;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export * as B from "./c";
                "#,
            ),
            (
                "a.ts",
                r#"
                    export * as A from "./b";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A } from "./a";
                    type X = A.B.C;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn nested_qualified_value_access() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "c.ts",
                r#"
                    export const C = "c" as const;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export * as B from "./c";
                "#,
            ),
            (
                "a.ts",
                r#"
                    export * as A from "./b";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A } from "./a";
                    type X = typeof A.B.C;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn import_star_nested_access() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "c.ts",
                r#"
                    export type C = string;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export * as B from "./c";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as A from "./b";
                    type X = A.B.C;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn import_star_nested_value_access() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "c.ts",
                r#"
                    export const C = "c" as const;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export * as B from "./c";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as A from "./b";
                    type X = typeof A.B.C;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn namespace_export_type_and_value_collision() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export type A = string;
                    export const A = "value" as const;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as NS from "./t";
                    type T = NS.A;
                    type V = typeof NS.A;
                    parse.buildParsers<{ T: T, V: V }>();
                "#
            )
        ]));
    }

    #[test]
    fn re_export_named_as_default() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    export const A = "a" as const;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export { A as default } from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import A from "./b";
                    type X = typeof A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn re_export_default_as_named() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    export default "a" as const;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export { default as A } from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A } from "./b";
                    type X = typeof A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn re_export_named_type_as_default() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    export type A = "a";
                "#,
            ),
            (
                "b.ts",
                r#"
                    export { A as default } from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import A from "./b";
                    type X = A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn re_export_default_type_as_named() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    type A = "a";
                    export default A;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export { default as A } from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A } from "./b";
                    type X = A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn export_star_aggregation() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    export type A = "a";
                "#,
            ),
            (
                "b.ts",
                r#"
                    export type B = "b";
                "#,
            ),
            (
                "all.ts",
                r#"
                    export * from "./a";
                    export * from "./b";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A, B } from "./all";
                    type X = A;
                    type Y = B;
                    parse.buildParsers<{ X: X, Y: Y }>();
                "#
            )
        ]));
    }

    #[test]
    fn circular_dependency_imports_unused() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    import { B } from "./b";
                    export type A = string;
                "#,
            ),
            (
                "b.ts",
                r#"
                    import { A } from "./a";
                    export type B = string;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A } from "./a";
                    type X = A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn export_multi_variable_decl() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export const A = "a" as const, B = "b" as const;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A, B } from "./t";
                    type X = typeof A;
                    type Y = typeof B;
                    parse.buildParsers<{ X: X, Y: Y }>();
                "#
            )
        ]));
    }

    #[test]
    fn typeof_declare_local() {
        let from = r#"
    declare const abc: "abc";
    type X = typeof abc;
    parse.buildParsers<{ X: X }>();

  "#;
        insta::assert_snapshot!(print_types(from));
    }

    #[test]
    fn export_multi_variable_ts_decl() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export declare const A: "a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A } from "./t";
                    type X = typeof A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    // #[test]
    // fn interface_export() {
    //     insta::assert_snapshot!(print_types_multifile(&[
    //         //
    //         (
    //             "t.ts",
    //             r#"
    //                 export interface I { a: string; }
    //             "#,
    //         ),
    //         (
    //             "entry.ts",
    //             r#"
    //                 import { I } from "./t";
    //                 type X = I;
    //                 parse.buildParsers<{ X: X }>();
    //             "#
    //         )
    //     ]));
    // }

    // #[test]
    // fn enum_export() {
    //     insta::assert_snapshot!(print_types_multifile(&[
    //         //
    //         (
    //             "t.ts",
    //             r#"
    //                 export enum E { A = "a" }
    //             "#,
    //         ),
    //         (
    //             "entry.ts",
    //             r#"
    //                 import { E } from "./t";
    //                 type X = E;
    //                 parse.buildParsers<{ X: X }>();
    //             "#
    //         )
    //     ]));
    // }

    // #[test]
    // fn import_type_syntax() {
    //     insta::assert_snapshot!(print_types_multifile(&[
    //         (
    //             "t.ts",
    //             r#"
    //                 export type A = string;
    //             "#,
    //         ),
    //         (
    //             "entry.ts",
    //             r#"
    //                 type X = import("./t").A;
    //                 parse.buildParsers<{ X: X }>();
    //             "#
    //         )
    //     ]));
    // }

    // #[test]
    // fn typeof_import_syntax() {
    //     insta::assert_snapshot!(print_types_multifile(&[
    //         (
    //             "t.ts",
    //             r#"
    //                 export const A = "a" as const;
    //             "#,
    //         ),
    //         (
    //             "entry.ts",
    //             r#"
    //                 type X = typeof import("./t").A;
    //                 parse.buildParsers<{ X: X }>();
    //             "#
    //         )
    //     ]));
    // }
}
