#[cfg(test)]
mod tests {
    use beff_core::test_tools::{print_types, print_types_multifile};

    #[test]
    fn type_ref() {
        let from = r#"

    type UserId = string;
    parse.buildParsers<{ UserId: UserId }>();

  "#;
        insta::assert_snapshot!(print_types(from), @r"
        type UserId = string;


        type BuiltParsers = {
          UserId: UserId,
        }
        ");
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
        ]), @r"
        type X = string;


        type BuiltParsers = {
          X: X,
        }
        ");
    }

    #[test]
    fn export_default_value() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export default "hello";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import D from "./t";
                    type T = typeof D;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        type T = string;


        type BuiltParsers = {
          T: T,
        }
        ");
    }

    #[test]
    fn re_export_star_value() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    export const A = "abc" as const;
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
                    import { A } from "./b";
                    parse.buildParsers<{ A: typeof A }>();
                "#
            )
        ]), @r#"
        type BuiltParsers = {
          A: "abc",
        }
        "#);
    }

    #[test]
    fn enum_member_value_access() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export enum E { A = "a" }
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { E } from "./t";
                    parse.buildParsers<{ E: E }>();
                "#
            )
        ]), @r#"
        type E = "a";


        type BuiltParsers = {
          E: E,
        }
        "#);
    }

    #[test]
    fn namespace_import_value_access() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export const A = "a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    parse.buildParsers<{ A: typeof Ns.A }>();
                "#
            )
        ]), @r"
        type BuiltParsers = {
          A: string,
        }
        ");
    }

    #[test]
    fn typeof_object_literal_key() {
        insta::assert_snapshot!(print_types(r#"
            const obj = { a: "hello" };
            export type T = typeof obj["a"];
            parse.buildParsers<{ T: T }>();
        "#), @r"
        type T = string;


        type BuiltParsers = {
          T: T,
        }
        ");
    }

    #[test]
    fn tuple_rest() {
        insta::assert_snapshot!(print_types(r#"
            export type T = [string, ...number[]];
            parse.buildParsers<{ T: T }>();
        "#), @r"
        type T = [string, ...number];


        type BuiltParsers = {
          T: T,
        }
        ");
    }

    #[test]
    fn import_type_qualifier() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export type A = string;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    export type T = import("./t").A;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        type T = A;

        type A = string;


        type BuiltParsers = {
          T: T,
        }
        ");
    }

    #[test]
    fn access_missing_property_on_object() {
        insta::assert_snapshot!(print_types(r#"
            const A = { x: 1 };
            export type T = typeof A.y;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        type T = undefined;


        type BuiltParsers = {
          T: T,
        }
        ");
    }
}
