#[cfg(test)]
mod tests {
    use beff_core::test_tools::{failure, failure_multifile};

    #[test]
    fn type_ref() {
        let from = r#"
    parse.buildParsers<{ UserId: UserId }>();
  "#;
        insta::assert_snapshot!(failure(from),@r"
        Error: Could not resolve addressed value 'entry.ts::UserId'
           ╭─[entry.ts:2:35]
           │
         2 │     parse.buildParsers<{ UserId: UserId }>();
           │                                   ───┬──  
           │                                      ╰──── Could not resolve addressed value 'entry.ts::UserId'
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
        Error: Could not resolve addressed value 't.ts::UserId'
           ╭─[t.ts:2:38]
           │
         2 │                     export type X = UserId;
           │                                      ───┬──  
           │                                         ╰──── Could not resolve addressed value 't.ts::UserId'
        ───╯
        ");
    }
}
