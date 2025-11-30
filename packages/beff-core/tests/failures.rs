#[cfg(test)]
mod tests {
    use beff_core::test_tools::{failure, failure_multifile};

    #[test]
    fn type_ref() {
        let from = r#"
    parse.buildParsers<{ UserId: UserId }>();
  "#;
        insta::assert_snapshot!(failure(from),@r"
        Error: Cannot resolve type 'entry.ts::UserId'
           ╭─[entry.ts:2:35]
           │
         2 │     parse.buildParsers<{ UserId: UserId }>();
           │                                  ───┬──  
           │                                     ╰──── Cannot resolve type 'entry.ts::UserId'
        ───╯
        ");
    }
    #[test]
    fn type_ref_multifile() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    export type X = UserId;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { X } from "./t";
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]),@r"
        Error: Cannot resolve type 't.ts::UserId'
           ╭─[t.ts:2:38]
           │
         2 │                     export type X = UserId;
           │                                     ───┬──  
           │                                        ╰──── Cannot resolve type 't.ts::UserId'
        ───╯
        ");
    }

    #[test]
    fn import_named_none() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    export const A = "a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { B } from "./t";
                    export type T = typeof B;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        Error: Cannot resolve value 't.ts::B'
           ╭─[entry.ts:2:31]
           │
         2 │                     import { B } from "./t";
           │                              ┬  
           │                              ╰── Cannot resolve value 't.ts::B'
        ───╯
        "#);
    }

    #[test]
    fn import_default_none() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    export const A = "a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import D from "./t";
                    export type T = typeof D;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        Error: Cannot resolve value 't.ts::default'
           ╭─[entry.ts:2:29]
           │
         2 │                     import D from "./t";
           │                            ┬  
           │                            ╰── Cannot resolve value 't.ts::default'
        ───╯
        "#);
    }

    #[test]
    fn type_as_value() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    export type A = string;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A } from "./t";
                    const v = A;
                    export type T = typeof v;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        Error: Cannot resolve value 't.ts::A'
           ╭─[entry.ts:2:31]
           │
         2 │                     import { A } from "./t";
           │                              ┬  
           │                              ╰── Cannot resolve value 't.ts::A'
        ───╯
        "#);
    }

    #[test]
    fn qualified_type_on_interface() {
        insta::assert_snapshot!(failure(r#"
            interface I { a: string }
            export type T = I.a;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        Error: Cannot use interface in qualified type position
           ╭─[entry.ts:3:30]
           │
         3 │             export type T = I.a;
           │                             ┬  
           │                             ╰── Cannot use interface in qualified type position
        ───╯
        ");
    }

    #[test]
    fn qualified_type_on_type_alias() {
        insta::assert_snapshot!(failure(r#"
            type A = { a: string };
            export type T = A.a;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        Error: Cannot use type in qualified type position
           ╭─[entry.ts:3:30]
           │
         3 │             export type T = A.a;
           │                             ┬  
           │                             ╰── Cannot use type in qualified type position
        ───╯
        ");
    }

    #[test]
    fn interface_as_value() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    export interface I {}
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { I } from "./t";
                    const v = I;
                    export type T = typeof v;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        Error: Cannot resolve value 't.ts::I'
           ╭─[entry.ts:2:31]
           │
         2 │                     import { I } from "./t";
           │                              ┬  
           │                              ╰── Cannot resolve value 't.ts::I'
        ───╯
        "#);
    }

    #[test]
    fn namespace_as_type() {
        insta::assert_snapshot!(failure_multifile(&[
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
                    export type T = Ns;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        Error: Cannot use star import in type position
           ╭─[entry.ts:3:38]
           │
         3 │                     export type T = Ns;
           │                                     ─┬  
           │                                      ╰── Cannot use star import in type position
        ───╯
        ");
    }

    #[test]
    fn namespace_as_value() {
        insta::assert_snapshot!(failure_multifile(&[
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
                    const v = Ns;
                    export type T = typeof v;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        Error: Cannot use star import in value position
           ╭─[entry.ts:3:32]
           │
         3 │                     const v = Ns;
           │                               ─┬  
           │                                ╰── Cannot use star import in value position
        ───╯
        ");
    }

    #[test]
    fn access_property_on_primitive() {
        insta::assert_snapshot!(failure(r#"
            const A = 1;
            export type T = typeof A.B;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        Error: Keyed access results in 'never' type
           ╭─[entry.ts:3:30]
           │
         3 │             export type T = typeof A.B;
           │                             ─────┬────  
           │                                  ╰────── Keyed access results in 'never' type
        ───╯
        ");
    }

    #[test]
    fn import_star_missing_export() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    export const A = 1;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    export type T = typeof Ns.B;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        Error: Cannot resolve value 't.ts::B'
           ╭─[entry.ts:3:38]
           │
         3 │                     export type T = typeof Ns.B;
           │                                     ─────┬─────  
           │                                          ╰─────── Cannot resolve value 't.ts::B'
        ───╯
        ");
    }

    #[test]
    fn qualified_access_on_value_in_type_position() {
        insta::assert_snapshot!(failure(r#"
            const A = {};
            export type T = A.B;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        Error: Cannot resolve type 'entry.ts::A'
           ╭─[entry.ts:3:30]
           │
         3 │             export type T = A.B;
           │                             ┬  
           │                             ╰── Cannot resolve type 'entry.ts::A'
        ───╯
        ");
    }
    #[test]
    fn access_missing_property_on_object() {
        insta::assert_snapshot!(failure(r#"
            const A = { x: 1 };
            export type T = typeof A.y;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        Error: Keyed access results in 'never' type
           ╭─[entry.ts:3:30]
           │
         3 │             export type T = typeof A.y;
           │                             ─────┬────  
           │                                  ╰────── Keyed access results in 'never' type
        ───╯
        ");
    }

    #[test]
    fn qualified_access_on_type_in_typeof_position() {
        insta::assert_snapshot!(failure(r#"
            type A = { b: string };
            export type T = typeof A.b;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        Error: Cannot resolve value 'entry.ts::A'
           ╭─[entry.ts:3:37]
           │
         3 │             export type T = typeof A.b;
           │                                    ┬  
           │                                    ╰── Cannot resolve value 'entry.ts::A'
        ───╯
        ");
    }

    #[test]
    fn import_type_missing_named() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    export type A = string;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    export type T = import("./t").B;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        Error: Cannot resolve type 't.ts::B'
           ╭─[entry.ts:2:38]
           │
         2 │                     export type T = import("./t").B;
           │                                     ───────┬───────  
           │                                            ╰───────── Cannot resolve type 't.ts::B'
        ───╯
        "#);
    }

    #[test]
    fn import_type_on_value() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    export const A = 1;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    export type T = import("./t").A;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        Error: Cannot resolve type 't.ts::A'
           ╭─[entry.ts:2:38]
           │
         2 │                     export type T = import("./t").A;
           │                                     ───────┬───────  
           │                                            ╰───────── Cannot resolve type 't.ts::A'
        ───╯
        "#);
    }

    #[test]
    fn nested_resolution_error_array() {
        insta::assert_snapshot!(failure(r#"
            type T = Missing[];
            parse.buildParsers<{ T: T }>();
        "#), @r"
        Error: Cannot resolve type 'entry.ts::Missing'
           ╭─[entry.ts:2:23]
           │
         2 │             type T = Missing[];
           │                      ───┬───  
           │                         ╰───── Cannot resolve type 'entry.ts::Missing'
        ───╯
        ");
    }

    #[test]
    fn nested_resolution_error_tuple() {
        insta::assert_snapshot!(failure(r#"
            type T = [string, Missing];
            parse.buildParsers<{ T: T }>();
        "#), @r"
        Error: Cannot resolve type 'entry.ts::Missing'
           ╭─[entry.ts:2:32]
           │
         2 │             type T = [string, Missing];
           │                               ───┬───  
           │                                  ╰───── Cannot resolve type 'entry.ts::Missing'
        ───╯
        ");
    }

    #[test]
    fn nested_resolution_error_object() {
        insta::assert_snapshot!(failure(r#"
            type T = { a: Missing };
            parse.buildParsers<{ T: T }>();
        "#), @r"
        Error: Cannot resolve type 'entry.ts::Missing'
           ╭─[entry.ts:2:28]
           │
         2 │             type T = { a: Missing };
           │                           ───┬───  
           │                              ╰───── Cannot resolve type 'entry.ts::Missing'
        ───╯
        ");
    }

    #[test]
    fn nested_resolution_error_union() {
        insta::assert_snapshot!(failure(r#"
            type T = string | Missing;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        Error: Cannot resolve type 'entry.ts::Missing'
           ╭─[entry.ts:2:32]
           │
         2 │             type T = string | Missing;
           │                               ───┬───  
           │                                  ╰───── Cannot resolve type 'entry.ts::Missing'
        ───╯
        ");
    }

    #[test]
    fn nested_resolution_error_intersection() {
        insta::assert_snapshot!(failure(r#"
            type T = string & Missing;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        Error: Cannot resolve type 'entry.ts::Missing'
           ╭─[entry.ts:2:32]
           │
         2 │             type T = string & Missing;
           │                               ───┬───  
           │                                  ╰───── Cannot resolve type 'entry.ts::Missing'
        ───╯
        ");
    }

    #[test]
    fn nested_resolution_error_generic() {
        insta::assert_snapshot!(failure(r#"
            type Box<T> = { item: T };
            type T = Box<Missing>;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        Error: Cannot resolve type 'entry.ts::Missing'
           ╭─[entry.ts:3:27]
           │
         3 │             type T = Box<Missing>;
           │                          ───┬───  
           │                             ╰───── Cannot resolve type 'entry.ts::Missing'
        ───╯
        ");
    }

    #[test]
    fn extends_resolution_error() {
        insta::assert_snapshot!(failure(r#"
            interface I extends Missing {}
            type T = I;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        Error: Cannot resolve type 'entry.ts::Missing'
           ╭─[entry.ts:2:34]
           │
         2 │             interface I extends Missing {}
           │                                 ───┬───  
           │                                    ╰───── Cannot resolve type 'entry.ts::Missing'
        ───╯
        ");
    }

    #[test]
    fn local_value_not_found() {
        insta::assert_snapshot!(failure(r#"
            const v = Missing;
            export type T = typeof v;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        Error: Cannot resolve value 'entry.ts::Missing'
           ╭─[entry.ts:2:24]
           │
         2 │             const v = Missing;
           │                       ───┬───  
           │                          ╰───── Cannot resolve value 'entry.ts::Missing'
        ───╯
        ");
    }

    #[test]
    fn qualified_access_on_interface_in_typeof_position() {
        insta::assert_snapshot!(failure(r#"
            interface I { a: string }
            export type T = typeof I.a;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        Error: Cannot resolve value 'entry.ts::I'
           ╭─[entry.ts:3:37]
           │
         3 │             export type T = typeof I.a;
           │                                    ┬  
           │                                    ╰── Cannot resolve value 'entry.ts::I'
        ───╯
        ");
    }

    #[test]
    fn typeof_import_no_qualifier() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    export const A = "a";
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
        Error: Cannot resolve value 't.ts::default'
           ╭─[entry.ts:2:38]
           │
         2 │                     export type T = typeof import("./t");
           │                                     ──────────┬─────────  
           │                                               ╰─────────── Cannot resolve value 't.ts::default'
        ───╯
        "#);
    }

    #[test]
    fn tuple_rest_not_array() {
        insta::assert_snapshot!(failure(r#"
            type T = [string, ...number];
            parse.buildParsers<{ T: T }>();
        "#), @r"
        Error: Rest type in tuple must be an array type
           ╭─[entry.ts:2:23]
           │
         2 │             type T = [string, ...number];
           │                      ─────────┬─────────  
           │                               ╰─────────── Rest type in tuple must be an array type
        ───╯
        ");
    }

    // #[test]
    // fn typeof_keyed_access_on_non_object() {
    //     insta::assert_snapshot!(failure(r#"
    //         const A = 1;
    //         export type T = typeof A["a"];
    //         parse.buildParsers<{ T: T }>();
    //     "#), @r"");
    // }

    // #[test]
    // fn typeof_keyed_access_missing_key() {
    //     insta::assert_snapshot!(failure(r#"
    //         const A = { x: 1 };
    //         export type T = typeof A["y"];
    //         parse.buildParsers<{ T: T }>();
    //     "#), @r"");
    // }
}
