#[cfg(test)]
mod tests {
    use beff_core::test_tools::print_types;

    #[test]
    fn map_parsing() {
        let from = r#"

    type UserMap = Map<string, number>
    parse.buildParsers<{ UserMap: UserMap }>();

  "#;
        insta::assert_snapshot!(print_types(from), @"
        type UserMap = Map<string, number>;


        type BuiltParsers = {
          UserMap: UserMap,
        }
        ");
    }

    #[test]
    fn set_parsing() {
        let from = r#"

    type UserSet = Set<string>
    parse.buildParsers<{ UserSet: UserSet }>();

  "#;
        insta::assert_snapshot!(print_types(from), @"
        type UserSet = Set<string>;


        type BuiltParsers = {
          UserSet: UserSet,
        }
        ");
    }
}
