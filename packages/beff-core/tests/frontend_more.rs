#[cfg(test)]
mod tests {
    use beff_core::test_tools::{print_cgen, print_types, print_types_multifile};

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
    fn circular_type_alias() {
        insta::assert_snapshot!(print_types(r#"
            type T = T;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        type T = T;


        type BuiltParsers = {
          T: T,
        }
        ");
    }
    #[test]
    fn import_default_type() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export type A = string;
                    export default A;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import T from "./t";
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        type A = string;


        type BuiltParsers = {
          T: A,
        }
        ");
    }

    #[test]
    fn import_type_no_qualifier() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export type A = string;
                    export default A;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    type T = import("./t");
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
    fn typeof_import_no_qualifier() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export default "abc" as const;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    export type T = typeof import("./t");
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        type T = "abc";


        type BuiltParsers = {
          T: T,
        }
        "#);
    }

    #[test]
    fn typeof_object_literal_prop() {
        insta::assert_snapshot!(print_types(r#"
            const obj = { a: "hello" };
            export type T = typeof obj.a;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        type T = string;


        type BuiltParsers = {
          T: T,
        }
        ");
    }

    #[test]
    fn export_default_object() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export default { a: "hello" };
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import D from "./t";
                    type T = typeof D.a;
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
    fn typeof_enum_in_namespace() {
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
                    import * as Ns from "./t";
                    export type T = typeof Ns.E;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        type T = "a";


        type BuiltParsers = {
          T: T,
        }
        "#);
    }

    #[test]
    fn typeof_nested_object_literal_prop() {
        insta::assert_snapshot!(print_types(r#"
            const obj = { a: { b: "hello" } };
            export type T = typeof obj.a.b;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        type T = string;


        type BuiltParsers = {
          T: T,
        }
        ");
    }

    #[test]
    fn typeof_nested_object_literal_prop_as_const1() {
        insta::assert_snapshot!(print_types(r#"
            const obj = { a: { b: "hello" as const } };
            export type T = typeof obj.a.b;
            parse.buildParsers<{ T: T }>();
        "#), @r#"
        type T = "hello";


        type BuiltParsers = {
          T: T,
        }
        "#);
    }
    #[test]
    fn typeof_nested_object_literal_prop_as_const2() {
        insta::assert_snapshot!(print_types(r#"
            const obj = { a: { b: "hello"  } as const };
            export type T = typeof obj.a.b;
            parse.buildParsers<{ T: T }>();
        "#), @r#"
        type T = "hello";


        type BuiltParsers = {
          T: T,
        }
        "#);
    }
    #[test]
    fn typeof_nested_object_literal_prop_as_const3() {
        insta::assert_snapshot!(print_types(r#"
            const obj = { a: { b: "hello"  }  }as const ;
            export type T = typeof obj.a.b;
            parse.buildParsers<{ T: T }>();
        "#), @r#"
        type T = "hello";


        type BuiltParsers = {
          T: T,
        }
        "#);
    }

    #[test]
    fn typeof_nested_object_literal_prop_cgen() {
        insta::assert_snapshot!(print_cgen(r#"
            const obj = { a: { b: "hello" } };
            export type T = typeof obj.a.b;
            parse.buildParsers<{ T: T }>();
        "#), @r#"
        const namedRuntypes = {
            "T": new TypeofRuntype("string")
        };
        const buildParsersInput = {
            "T": new RefRuntype("T")
        };
        "#);
    }

    #[test]
    fn qualified_access_type_alias() {
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
                    import * as Ns from "./t";
                    export type T = Ns.A;
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
    fn qualified_access_interface() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export interface I { a: string }
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    export type T = Ns.I;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        type T = I;

        type I = { "a": string };


        type BuiltParsers = {
          T: T,
        }
        "#);
    }

    #[test]
    fn typeof_qualified_export_const() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export const C = "c";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    export type T = typeof Ns.C;
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
    fn typeof_qualified_reexport() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    export const A = "a";
                "#,
            ),
            (
                "t.ts",
                r#"
                    export { A } from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    export type T = typeof Ns.A;
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
    fn qualified_access_on_enum() {
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
                    parse.buildParsers<{ T: typeof E.A }>();
                "#
            )
        ]), @r#"
        type BuiltParsers = {
          T: "a",
        }
        "#);
    }
}
