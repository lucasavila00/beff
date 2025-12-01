#[cfg(test)]
mod tests {
    use beff_core::test_tools::failure_multifile;

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
    fn star_import_as_value() {
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
                    const V = Ns;
                    parse.buildParsers<{ V: typeof V }>();
                "#
            )
        ]), @r"
        Error: Cannot use star import in value position
           ╭─[entry.ts:3:32]
           │
         3 │                     const V = Ns;
           │                               ─┬  
           │                                ╰── Cannot use star import in value position
        ───╯
        ");
    }
}
