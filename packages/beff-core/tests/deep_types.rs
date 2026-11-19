#[cfg(test)]
mod tests {
    use beff_core::test_tools::{failure, print_cgen, print_types};

    // `type R0 = { name: string; next: R1 }; type R1 = { name: string; next: R2 }; ...`
    fn chain(n: usize, last: &str) -> String {
        (0..n)
            .map(|i| {
                let next = if i + 1 == n {
                    last.to_string()
                } else {
                    format!("R{}", i + 1)
                };
                format!("type R{i} = {{ name: string; next: {next} }};\n")
            })
            .collect()
    }

    // A long chain of named types used to need native stack proportional to its length,
    // and overflowed it (#424).
    #[test]
    fn long_reference_chain() {
        let from = format!(
            "{}\nparse.buildParsers<{{ R0: R0 }}>();\n",
            chain(2000, "R0")
        );
        let out = print_cgen(&from);
        assert!(out.contains("R1999"));
    }

    // The kinds of the members of a union are computed without walking the chain.
    #[test]
    fn long_reference_chain_through_unions() {
        let types = chain(2000, "R0").replace(" };", " | null };");
        let out = print_cgen(&format!("{types}\nparse.buildParsers<{{ R0: R0 }}>();\n"));
        assert!(out.contains("R1999"));
        assert!(out.contains("\"nullish\": direct_hoist_2"), "{}", &out[..600]);
    }

    #[test]
    fn error_at_the_end_of_a_long_reference_chain() {
        let from = format!(
            "{}\nparse.buildParsers<{{ R0: R0 }}>();\n",
            chain(100, "Missing")
        );
        assert!(failure(&from).contains("Cannot resolve type 'entry.ts::Missing'"));
    }

    // `Base` is first reached deep in the chain, so its extraction is deferred,
    // and `keyof` and `Omit` need it before the chain is done.
    #[test]
    fn type_operators_on_a_type_first_reached_deep_in_a_chain() {
        let from = format!(
            r#"
            {}
            type Base = {{ a: string; b: number }};
            parse.buildParsers<{{ R0: R0; O: Omit<Base, "b">; K: keyof Base }}>();
            "#,
            chain(32, "Base")
        );
        let out = print_types(&from);
        assert!(out.contains(r#"K: ("a" | "b")"#), "{out}");
        assert!(out.contains(r#"O: { "a": string }"#), "{out}");
    }
}
