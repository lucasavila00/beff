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
    fn type_query_args() {
        let from = r#"
        type User<T> = { id: T };
        type UserId = typeof User<string>;
    parse.buildParsers<{ UserId: UserId }>();
  "#;
        insta::assert_snapshot!(failure(from),@r"
        Error: Type query args are not supported
           ╭─[entry.ts:3:24]
           │
         3 │         type UserId = typeof User<string>;
           │                       ─────────┬─────────  
           │                                ╰─────────── Type query args are not supported
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
    fn import_type_generic() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    type User<T> = { id: T };
                    export default User;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    export type T = typeof import("./t")<string>;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        Error: Type query args are not supported
           ╭─[entry.ts:2:38]
           │
         2 │                     export type T = typeof import("./t")<string>;
           │                                     ──────────────┬─────────────  
           │                                                   ╰─────────────── Type query args are not supported
        ───╯
        "#);
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

    #[test]
    fn type_alias_as_value() {
        insta::assert_snapshot!(failure(r#"
            type A = string;
            const v = A;
            export type T = typeof v;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        Error: Cannot resolve value 'entry.ts::A'
           ╭─[entry.ts:3:24]
           │
         3 │             const v = A;
           │                       ┬  
           │                       ╰── Cannot resolve value 'entry.ts::A'
        ───╯
        ");
    }

    #[test]
    fn typeof_namespace_type_export() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    export type T = string;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    export type T = typeof Ns.T;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        Error: Cannot resolve value 't.ts::T'
           ╭─[entry.ts:3:38]
           │
         3 │                     export type T = typeof Ns.T;
           │                                     ─────┬─────  
           │                                          ╰─────── Cannot resolve value 't.ts::T'
        ───╯
        ");
    }

    #[test]
    fn typeof_namespace_interface_export() {
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
                    import * as Ns from "./t";
                    export type T = typeof Ns.I;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        Error: Cannot resolve value 't.ts::I'
           ╭─[entry.ts:3:38]
           │
         3 │                     export type T = typeof Ns.I;
           │                                     ─────┬─────  
           │                                          ╰─────── Cannot resolve value 't.ts::I'
        ───╯
        ");
    }

    #[test]
    fn import_default_missing_in_file() {
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
    fn type_alias_to_value_export() {
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
                    import { A } from "./t";
                    export type T = A;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        Error: Cannot resolve type 't.ts::A'
           ╭─[entry.ts:2:31]
           │
         2 │                     import { A } from "./t";
           │                              ┬  
           │                              ╰── Cannot resolve type 't.ts::A'
        ───╯
        "#);
    }

    #[test]
    fn value_alias_to_type_export() {
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
    fn value_alias_to_interface_export() {
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
    fn typeof_import_non_existent() {
        insta::assert_snapshot!(failure(r#"
            export type T = typeof import("./non-existent");
            parse.buildParsers<{ T: T }>();
        "#), @r#"
        Error: Cannot find file 'non-existent.ts'
           ╭─[entry.ts:2:30]
           │
         2 │             export type T = typeof import("./non-existent");
           │                             ───────────────┬───────────────  
           │                                            ╰───────────────── Cannot find file 'non-existent.ts'
        ───╯
        "#);
    }

    #[test]
    fn type_alias_as_namespace() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    export type T = {};
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    type X = Ns.T.Sub;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]), @r"
        Error: Cannot use type in qualified type position
           ╭─[entry.ts:3:31]
           │
         3 │                     type X = Ns.T.Sub;
           │                              ──┬─  
           │                                ╰─── Cannot use type in qualified type position
        ───╯
        ");
    }

    #[test]
    fn interface_as_namespace() {
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
                    import * as Ns from "./t";
                    type X = Ns.I.Sub;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]), @r"
        Error: Cannot use interface in qualified type position
           ╭─[entry.ts:3:31]
           │
         3 │                     type X = Ns.I.Sub;
           │                              ──┬─  
           │                                ╰─── Cannot use interface in qualified type position
        ───╯
        ");
    }

    #[test]
    fn value_as_namespace_in_type_pos() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    export const A = {};
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    type X = Ns.A.Sub;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]), @r"
        Error: Cannot resolve type 't.ts::A'
           ╭─[entry.ts:3:31]
           │
         3 │                     type X = Ns.A.Sub;
           │                              ──┬─  
           │                                ╰─── Cannot resolve type 't.ts::A'
        ───╯
        ");
    }

    #[test]
    fn value_import_resolves_to_type() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    export type T = string;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { T } from "./t";
                    const x = T;
                    parse.buildParsers<{ x: typeof x }>();
                "#
            )
        ]), @r#"
        Error: Cannot resolve value 't.ts::T'
           ╭─[entry.ts:2:31]
           │
         2 │                     import { T } from "./t";
           │                              ┬  
           │                              ╰── Cannot resolve value 't.ts::T'
        ───╯
        "#);
    }

    #[test]
    fn value_import_resolves_to_interface() {
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
                    const x = I;
                    parse.buildParsers<{ x: typeof x }>();
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
    fn class_is_not_supported() {
        let from = r#"
        class C {}
    parse.buildParsers<{ C: C }>();
  "#;
        insta::assert_snapshot!(failure(from),@r"
        Error: Cannot resolve type 'entry.ts::C'
           ╭─[entry.ts:3:30]
           │
         3 │     parse.buildParsers<{ C: C }>();
           │                             ┬  
           │                             ╰── Cannot resolve type 'entry.ts::C'
        ───╯
        ");
    }
    #[test]
    fn class_is_not_supported2() {
        let from = r#"
        class C {}
    parse.buildParsers<{ C: typeof C }>();
  "#;
        insta::assert_snapshot!(failure(from),@r"
        Error: Cannot resolve value 'entry.ts::C'
           ╭─[entry.ts:3:30]
           │
         3 │     parse.buildParsers<{ C: typeof C }>();
           │                             ────┬───  
           │                                 ╰───── Cannot resolve value 'entry.ts::C'
        ───╯
        ");
    }

    #[test]
    fn qualified_value_as_type() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    export const A = { Sub: 1 };
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    type T = Ns.A.Sub;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        Error: Cannot resolve type 't.ts::A'
           ╭─[entry.ts:3:31]
           │
         3 │                     type T = Ns.A.Sub;
           │                              ──┬─  
           │                                ╰─── Cannot resolve type 't.ts::A'
        ───╯
        ");
    }

    #[test]
    fn qualified_type_as_value() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    export type T = {};
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    const x = Ns.T;
                    parse.buildParsers<{ x: typeof x }>();
                "#
            )
        ]), @r"
        Error: Cannot resolve value 't.ts::T'
           ╭─[entry.ts:3:32]
           │
         3 │                     const x = Ns.T;
           │                               ──┬─  
           │                                 ╰─── Cannot resolve value 't.ts::T'
        ───╯
        ");
    }

    #[test]
    fn qualified_interface_as_value() {
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
                    import * as Ns from "./t";
                    const x = Ns.I;
                    parse.buildParsers<{ x: typeof x }>();
                "#
            )
        ]), @r"
        Error: Cannot resolve value 't.ts::I'
           ╭─[entry.ts:3:32]
           │
         3 │                     const x = Ns.I;
           │                               ──┬─  
           │                                 ╰─── Cannot resolve value 't.ts::I'
        ───╯
        ");
    }

    #[test]
    fn import_type_non_existent() {
        insta::assert_snapshot!(failure(r#"
            type T = import("./non-existent");
            parse.buildParsers<{ T: T }>();
        "#), @r#"
        Error: Cannot find file 'non-existent.ts'
           ╭─[entry.ts:2:23]
           │
         2 │             type T = import("./non-existent");
           │                      ────────────┬───────────  
           │                                  ╰───────────── Cannot find file 'non-existent.ts'
        ───╯
        "#);
    }

    #[test]
    fn import_default_expr_as_type() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    export default { a: 1 };
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import D from "./t";
                    type T = D;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        Error: Expression is not a type
           ╭─[t.ts:2:22]
           │
         2 │                     export default { a: 1 };
           │                     ────────────┬───────────  
           │                                 ╰───────────── Expression is not a type
        ───╯
        ");
    }

    #[test]
    fn import_default_none_as_type() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    export const a = 1;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import D from "./t";
                    type T = D;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        Error: Cannot resolve type 't.ts::default'
           ╭─[entry.ts:2:29]
           │
         2 │                     import D from "./t";
           │                            ┬  
           │                            ╰── Cannot resolve type 't.ts::default'
        ───╯
        "#);
    }

    #[test]
    fn import_default_missing_export() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    export const a = 1;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import D from "./t";
                    parse.buildParsers<{ D: typeof D }>();
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
    fn value_as_type() {
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
                    import { A } from "./t";
                    export type T = A;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        Error: Cannot resolve type 't.ts::A'
           ╭─[entry.ts:2:31]
           │
         2 │                     import { A } from "./t";
           │                              ┬  
           │                              ╰── Cannot resolve type 't.ts::A'
        ───╯
        "#);
    }

    #[test]
    fn import_type_unresolved() {
        insta::assert_snapshot!(failure(r#"
            type T = import("./missing").T;
            parse.buildParsers<{ T: T }>();
        "#), @r#"
        Error: Cannot find file 'missing.ts'
           ╭─[entry.ts:2:23]
           │
         2 │             type T = import("./missing").T;
           │                      ──────────┬──────────  
           │                                ╰──────────── Cannot find file 'missing.ts'
        ───╯
        "#);
    }

    #[test]
    fn typeof_import_unresolved() {
        insta::assert_snapshot!(failure(r#"
            type T = typeof import("./missing");
            parse.buildParsers<{ T: T }>();
        "#), @r#"
        Error: Cannot find file 'missing.ts'
           ╭─[entry.ts:2:23]
           │
         2 │             type T = typeof import("./missing");
           │                      ─────────────┬────────────  
           │                                   ╰────────────── Cannot find file 'missing.ts'
        ───╯
        "#);
    }

    #[test]
    fn value_export_as_type() {
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
                    import { A } from "./t";
                    type T = A;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        Error: Cannot resolve type 't.ts::A'
           ╭─[entry.ts:2:31]
           │
         2 │                     import { A } from "./t";
           │                              ┬  
           │                              ╰── Cannot resolve type 't.ts::A'
        ───╯
        "#);
    }

    #[test]
    fn declare_const_as_type() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    export declare const A: number;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A } from "./t";
                    type T = A;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        Error: Cannot resolve type 't.ts::A'
           ╭─[entry.ts:2:31]
           │
         2 │                     import { A } from "./t";
           │                              ┬  
           │                              ╰── Cannot resolve type 't.ts::A'
        ───╯
        "#);
    }

    #[test]
    fn qualified_declare_const_as_type() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    export declare const A: { B: number };
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    type T = Ns.A;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        Error: Cannot resolve type 't.ts::A'
           ╭─[entry.ts:3:31]
           │
         3 │                     type T = Ns.A;
           │                              ──┬─  
           │                                ╰─── Cannot resolve type 't.ts::A'
        ───╯
        ");
    }

    #[test]
    fn type_export_as_value() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    export type T = string;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { T } from "./t";
                    const x = T;
                    parse.buildParsers<{ x: typeof x }>();
                "#
            )
        ]), @r#"
        Error: Cannot resolve value 't.ts::T'
           ╭─[entry.ts:2:31]
           │
         2 │                     import { T } from "./t";
           │                              ┬  
           │                              ╰── Cannot resolve value 't.ts::T'
        ───╯
        "#);
    }

    #[test]
    fn export_renamed_default_value_as_type() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    const A = 1;
                    export { A as default };
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import D from "./t";
                    type T = D;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        Error: Cannot use value in type position
           ╭─[entry.ts:3:31]
           │
         3 │                     type T = D;
           │                              ┬  
           │                              ╰── Cannot use value in type position
        ───╯
        ");
    }

    #[test]
    fn export_renamed_default_type_as_value() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    type A = string;
                    export { A as default };
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import D from "./t";
                    const x = D;
                    parse.buildParsers<{ x: typeof x }>();
                "#
            )
        ]), @r"
        Error: Cannot use type in value position
           ╭─[entry.ts:3:32]
           │
         3 │                     const x = D;
           │                               ┬  
           │                               ╰── Cannot use type in value position
        ───╯
        ");
    }

    #[test]
    fn export_renamed_default_interface_as_value() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "t.ts",
                r#"
                    interface I {}
                    export { I as default };
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import D from "./t";
                    const x = D;
                    parse.buildParsers<{ x: typeof x }>();
                "#
            )
        ]), @r"
        Error: Cannot use interface in value position
           ╭─[entry.ts:3:32]
           │
         3 │                     const x = D;
           │                               ┬  
           │                               ╰── Cannot use interface in value position
        ───╯
        ");
    }

    #[test]
    fn export_star_as_ns_used_as_type() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "other.ts",
                r#"
                    export const A = 1;
                "#,
            ),
            (
                "t.ts",
                r#"
                    export * as Ns from "./other";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { Ns } from "./t";
                    type T = Ns;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        Error: Cannot use star import in type position
           ╭─[entry.ts:2:31]
           │
         2 │                     import { Ns } from "./t";
           │                              ─┬  
           │                               ╰── Cannot use star import in type position
        ───╯
        "#);
    }

    #[test]
    fn typeof_import_unresolved_with_qualifier() {
        insta::assert_snapshot!(failure(r#"
            type T = typeof import("./mock_could_not_resolve").A;
            parse.buildParsers<{ T: T }>();
        "#), @r#"
        Error: Cannot resolve import './mock_could_not_resolve'
           ╭─[entry.ts:2:23]
           │
         2 │             type T = typeof import("./mock_could_not_resolve").A;
           │                      ─────────────────────┬─────────────────────  
           │                                           ╰─────────────────────── Cannot resolve import './mock_could_not_resolve'
        ───╯
        "#);
    }

    #[test]
    fn type_import_unresolved_with_qualifier() {
        insta::assert_snapshot!(failure(r#"
            type T =  import("./mock_could_not_resolve").A;
            parse.buildParsers<{ T: T }>();
        "#), @r#"
        Error: Cannot resolve import './mock_could_not_resolve'
           ╭─[entry.ts:2:24]
           │
         2 │             type T =  import("./mock_could_not_resolve").A;
           │                       ──────────────────┬─────────────────  
           │                                         ╰─────────────────── Cannot resolve import './mock_could_not_resolve'
        ───╯
        "#);
    }
    #[test]
    fn reexport_value_as_type_via_named_export() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "val.ts",
                r#"
                    export const A = 1;
                "#,
            ),
            (
                "t.ts",
                r#"
                    export { A } from "./val";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A } from "./t";
                    type T = A;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        Error: Cannot resolve type 'val.ts::A'
           ╭─[entry.ts:2:31]
           │
         2 │                     import { A } from "./t";
           │                              ┬  
           │                              ╰── Cannot resolve type 'val.ts::A'
        ───╯
        "#);
    }

    #[test]
    fn reexport_declare_const_as_type_via_named_export() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "val.ts",
                r#"
                    export declare const A: number;
                "#,
            ),
            (
                "t.ts",
                r#"
                    export { A } from "./val";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A } from "./t";
                    type T = A;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        Error: Cannot resolve type 'val.ts::A'
           ╭─[entry.ts:2:31]
           │
         2 │                     import { A } from "./t";
           │                              ┬  
           │                              ╰── Cannot resolve type 'val.ts::A'
        ───╯
        "#);
    }

    #[test]
    fn reexport_value_as_qualified_type() {
        insta::assert_snapshot!(failure_multifile(&[
            (
                "val.ts",
                r#"
                    export const A = { B: 1 };
                "#,
            ),
            (
                "t.ts",
                r#"
                    export { A } from "./val";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    type T = Ns.A.B;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        Error: Cannot resolve type 'val.ts::A'
           ╭─[entry.ts:3:31]
           │
         3 │                     type T = Ns.A.B;
           │                              ──┬─  
           │                                ╰─── Cannot resolve type 'val.ts::A'
        ───╯
        ");
    }
}
