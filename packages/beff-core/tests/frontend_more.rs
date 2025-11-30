#[cfg(test)]
mod tests {
    use beff_core::test_tools::{print_types, print_types_multifile};

    #[test]
    fn type_ref() {
        let from = r#"

    type UserId = string;
    parse.buildParsers<{ UserId: UserId }>();

  "#;
        insta::assert_snapshot!(print_types(from), @r"
        type UserId = string;


        type BuiltParsers = {
          UserId: UserId,
        }
        ");
    }

    #[test]
    fn type_ref_multifile() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    export type X = string;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { X } from "./t";
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]), @r"
        type X = string;


        type BuiltParsers = {
          X: X,
        }
        ");
    }
}
