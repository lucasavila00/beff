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
    fn record_number_literal_keys() {
        let from = r#"
    type A = Record<1 | 2, string>;
    type B = Partial<Record<1 | 2, string>>;
    type C = Record<1 | "a", string>;
    type D = Record<1.5 | -3, string>;
    type E = { [K in 1 | 2]: K };
    parse.buildParsers<{ A: A, B: B, C: C, D: D, E: E }>();
  "#;
        insta::assert_snapshot!(print_types(from), @r#"
        type A = { "1": string, "2": string };

        type B = { "1"?: string, "2"?: string };

        type C = { "1": string, "a": string };

        type D = { "-3": string, "1.5": string };

        type E = { "1": 1, "2": 2 };


        type BuiltParsers = {
          A: A,
          B: B,
          C: C,
          D: D,
          E: E,
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
        insta::assert_snapshot!(print_types(from), @"
        type K = number;

        type T = Array<string>;


        type BuiltParsers = {
          K: K,
        }
        ");
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

        type T = (number | { "a": string });


        type BuiltParsers = {
          K: K,
        }
        "#);
    }

    #[test]
    fn intersection_of_objects_still_compiles() {
        let from = r#"
    type A = { a: string };
    type T = A & { b: number };
    type S = Date & Date;
    parse.buildParsers<{ T: T, S: S }>();
  "#;
        insta::assert_snapshot!(print_types(from), @r#"
        type A = { "a": string };

        type S = (Date);

        type T = ({ "b": number } & A);


        type BuiltParsers = {
          S: S,
          T: T,
        }
        "#);
    }
}
