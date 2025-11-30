#[cfg(test)]
mod tests {
    use beff_core::test_tools::failure;

    #[test]
    fn type_ref() {
        let from = r#"
    parse.buildParsers<{ UserId: UserId }>();
  "#;
        insta::assert_snapshot!(failure(from));
    }
}
