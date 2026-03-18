#[cfg(test)]
mod tests {
    use beff_core::test_tools::print_types;

    #[test]
    fn map_parsing() {
        let from = r#"

    type UserMap = Map<string, number>
    parse.buildParsers<{ UserMap: UserMap }>();

  "#;
        insta::assert_snapshot!(print_types(from), @r"");
    }

    #[test]
    fn set_parsing() {
        let from = r#"

    type UserSet = Set<string>
    parse.buildParsers<{ UserSet: UserSet }>();

  "#;
        insta::assert_snapshot!(print_types(from), @r"");
    }
}
