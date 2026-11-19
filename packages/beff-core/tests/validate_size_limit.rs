#[cfg(test)]
mod tests {
    use beff_core::test_tools::print_cgen_with_max_validate_function_size;

    const SOURCE: &str = r#"
    type Small = { a: string };
    type Big = { b: number, small: Small, list: { c: boolean }[] };
    parse.buildParsers<{ Small: Small, Big: Big }>();
    "#;

    fn generated_functions(max: usize) -> String {
        let code = print_cgen_with_max_validate_function_size(&[("entry.ts", SOURCE)], max);
        code.lines()
            .filter(|it| it.starts_with("function ") || it.contains("GeneratedRuntype"))
            .collect::<Vec<_>>()
            .join("\n")
    }

    #[test]
    fn zero_generates_nothing() {
        insta::assert_snapshot!(generated_functions(0), @"");
    }

    #[test]
    fn small_limit_generates_small_types_only() {
        insta::assert_snapshot!(generated_functions(100), @r#"
            "Small": new GeneratedRuntype(direct_hoist_0, v8),
        function v8(c,i){return isObj(i)&&typeof i.a=="string"&&direct_hoist_8.noExtraKeys(c,i)}
        "#);
    }

    #[test]
    fn large_limit_generates_everything() {
        insta::assert_snapshot!(generated_functions(usize::MAX), @r#"
            "Small": new GeneratedRuntype(direct_hoist_0, v8),
            "Big": new GeneratedRuntype(direct_hoist_1, v6)
        function v4(c,i){return isObj(i)&&typeof i.c=="boolean"&&direct_hoist_4.noExtraKeys(c,i)}
        function v5(c,i){if(!Array.isArray(i))return false;for(let k=0;k<i.length;k++)if(!(v4(c,i[k])))return false;return true}
        function v6(c,i){return isObj(i)&&typeof i.b=="number"&&v5(c,i.list)&&v8(c,i.small)&&direct_hoist_6.noExtraKeys(c,i)}
        function v8(c,i){return isObj(i)&&typeof i.a=="string"&&direct_hoist_8.noExtraKeys(c,i)}
        "#);
    }
}
