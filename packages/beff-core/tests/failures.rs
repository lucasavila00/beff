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

    // #[test]
    // fn namespace_as_type() {
    //     insta::assert_snapshot!(failure_multifile(&[
    //         (
    //             "t.ts",
    //             r#"
    //                 export const A = "a";
    //             "#,
    //         ),
    //         (
    //             "entry.ts",
    //             r#"
    //                 import * as Ns from "./t";
    //                 export type T = Ns;
    //                 parse.buildParsers<{ T: T }>();
    //             "#
    //         )
    //     ]), @r"
    //     Error: Cannot use star import in type position
    //        ╭─[entry.ts:3:38]
    //        │
    //      3 │                     export type T = Ns;
    //        │                                     ─┬
    //        │                                      ╰── Cannot use star import in type position
    //     ───╯
    //     ");
    // }

    // #[test]
    // fn namespace_as_value() {
    //     insta::assert_snapshot!(failure_multifile(&[
    //         (
    //             "t.ts",
    //             r#"
    //                 export const A = "a";
    //             "#,
    //         ),
    //         (
    //             "entry.ts",
    //             r#"
    //                 import * as Ns from "./t";
    //                 const v = Ns;
    //                 export type T = typeof v;
    //                 parse.buildParsers<{ T: T }>();
    //             "#
    //         )
    //     ]), @r"");
    // }

    // #[test]
    // fn access_property_on_primitive() {
    //     insta::assert_snapshot!(failure(r#"
    //         const A = 1;
    //         export type T = typeof A.B;
    //         parse.buildParsers<{ T: T }>();
    //     "#), @r"");
    // }

    // #[test]
    // fn access_missing_property_on_object() {
    //     insta::assert_snapshot!(failure(r#"
    //         const A = { x: 1 };
    //         export type T = typeof A.y;
    //         parse.buildParsers<{ T: T }>();
    //     "#), @r"");
    // }
}
