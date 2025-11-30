#[cfg(test)]
mod tests {
    use beff_core::test_tools::failure;

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
}
