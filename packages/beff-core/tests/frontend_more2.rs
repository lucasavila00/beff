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
    #[test]
    fn bug_repro1() {
        let from = r#"

    type DateDebugData = Record<string, string>;
    type DateDebugDataKey = keyof DateDebugData;
    parse.buildParsers<{ DateDebugData: DateDebugData , DateDebugDataKey: DateDebugDataKey}>();

  "#;
        insta::assert_snapshot!(print_types(from), @"
        type DateDebugData = { [key: string]: string };

        type DateDebugDataKey = string;


        type BuiltParsers = {
          DateDebugData: DateDebugData,
          DateDebugDataKey: DateDebugDataKey,
        }
        ");
    }
}
