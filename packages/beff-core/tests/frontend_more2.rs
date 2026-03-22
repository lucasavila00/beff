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

    #[test]
    fn keyof_record_number() {
        let from = r#"
    type T = Record<number, string>;
    type K = keyof T;
    parse.buildParsers<{ K: K }>();
  "#;
        insta::assert_snapshot!(print_types(from), @r#"
        type K = number;

        type T = { [key: number]: string };


        type BuiltParsers = {
          K: K,
        }
        "#);
    }

    #[test]
    fn keyof_mixed_index_signature() {
        let from = r#"
    type T = { a: string, [k: string]: any };
    type K = keyof T;
    parse.buildParsers<{ K: K }>();
  "#;
        insta::assert_snapshot!(print_types(from), @r#"
        type K = string;

        type T = { "a": string, [key: string]: any };


        type BuiltParsers = {
          K: K,
        }
        "#);
    }

    #[test]
    fn keyof_union() {
        let from = r#"
    type T = { a: string, b: string } | { a: string, c: string };
    type K = keyof T;
    parse.buildParsers<{ K: K }>();
  "#;
        // In TS, keyof (A | B) = keyof A & keyof B
        insta::assert_snapshot!(print_types(from), @r#"
        type K = "a";

        type T = ({ "a": string, "b": string } | { "a": string, "c": string });


        type BuiltParsers = {
          K: K,
        }
        "#);
    }

    #[test]
    fn keyof_union_never() {
        let from = r#"
    type T = { a: string } | { b: string };
    type K = keyof T;
    parse.buildParsers<{ K: K }>();
  "#;
        insta::assert_snapshot!(print_types(from), @r#"
        type K = never;

        type T = ({ "a": string } | { "b": string });


        type BuiltParsers = {
          K: K,
        }
        "#);
    }

    #[test]
    fn keyof_intersection() {
        let from = r#"
    type T = { a: string } & { b: string };
    type K = keyof T;
    parse.buildParsers<{ K: K }>();
  "#;
        insta::assert_snapshot!(print_types(from), @r#"
        type K = ("a" | "b");

        type T = { "a": string, "b": string };


        type BuiltParsers = {
          K: K,
        }
        "#);
    }

    #[test]
    fn keyof_optional() {
        let from = r#"
    type T = { a?: string };
    type K = keyof T;
    parse.buildParsers<{ K: K }>();
  "#;
        insta::assert_snapshot!(print_types(from), @r#"
        type K = "a";

        type T = { "a"?: string };


        type BuiltParsers = {
          K: K,
        }
        "#);
    }

    #[test]
    fn keyof_array() {
        let from = r#"
    type T = string[];
    type K = keyof T;
    parse.buildParsers<{ K: K }>();
  "#;
        insta::assert_snapshot!(print_types(from), @r#"
        type K = number;

        type T = string[];


        type BuiltParsers = {
          K: K,
        }
        "#);
    }

    #[test]
    fn keyof_union_primitive() {
        let from = r#"
    type T = { a: string } | number;
    type K = keyof T;
    parse.buildParsers<{ K: K }>();
  "#;
        insta::assert_snapshot!(print_types(from), @r#"
        type K = never;

        type T = ({ "a": string } | number);


        type BuiltParsers = {
          K: K,
        }
        "#);
    }
}
