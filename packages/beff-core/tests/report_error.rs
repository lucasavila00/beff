#[cfg(test)]
mod tests {
    use ariadne::{Config, Label, Report, ReportKind, Source};
    use std::{collections::BTreeSet, rc::Rc};

    use beff_core::{
        diag::{self, DiagnosticInformation},
        import_resolver::{parse_and_bind, FsModuleResolver},
        BeffUserSettings, BffFileName, EntryPoints, ExtractResult, FileManager, ParsedModule,
    };
    use swc_common::{Globals, GLOBALS};
    struct TestFileManager {
        pub f: Rc<ParsedModule>,
    }

    impl FileManager for TestFileManager {
        fn get_or_fetch_file(&mut self, _name: &BffFileName) -> Option<Rc<ParsedModule>> {
            Some(self.f.clone())
        }

        fn get_existing_file(&self, _name: &BffFileName) -> Option<Rc<ParsedModule>> {
            Some(self.f.clone())
        }
    }

    struct TestResolver {}
    impl FsModuleResolver for TestResolver {
        fn resolve_import(&mut self, _module_specifier: &str) -> Option<BffFileName> {
            None
        }
    }
    fn parse_str(content: &str) -> Rc<ParsedModule> {
        let mut resolver = TestResolver {};
        let file_name = BffFileName::new("file.ts".into());
        GLOBALS.set(&Globals::new(), || {
            let res = parse_and_bind(&mut resolver, &file_name, &content);
            res.unwrap()
        })
    }
    fn parse_api(it: &str) -> ExtractResult {
        let f = parse_str(it);
        let mut man = TestFileManager { f };
        let entry = EntryPoints {
            router_entry_point: Some(BffFileName::new("file.ts".into())),
            parser_entry_point: None,
            settings: BeffUserSettings {
                custom_formats: BTreeSet::new(),
            },
        };
        beff_core::extract(&mut man, entry)
    }

    fn print_one_rel_info(from: &str, d: &DiagnosticInformation) -> String {
        let mut buf: Vec<u8> = vec![];

        let mut e = Report::build(ReportKind::Advice, (), 0)
            .with_config(Config::default().with_color(false));

        match &d.loc {
            diag::Location::Full(loc) => {
                e = e.with_label(
                    Label::new(loc.offset_lo - 1..loc.offset_hi - 1)
                        .with_message(d.message.to_string()),
                );
            }
            diag::Location::Unknown(_) => todo!(),
        }

        e.finish().write(Source::from(from), &mut buf).unwrap();

        String::from_utf8_lossy(&buf).to_string()
    }
    fn print_related_info(from: &str, d: &Option<Vec<DiagnosticInformation>>) -> String {
        match d {
            Some(vs) => vs
                .iter()
                .map(|it| print_one_rel_info(from, it))
                .collect::<Vec<_>>()
                .join("\n"),
            None => "".to_owned(),
        }
    }
    fn print_diag(from: &str, d: &diag::Diagnostic) -> String {
        let mut buf: Vec<u8> = vec![];

        let mut e = Report::build(ReportKind::Error, (), 0)
            .with_config(Config::default().with_color(false))
            .with_message(
                d.parent_big_message
                    .as_ref()
                    .map(|it| it.to_string())
                    .unwrap_or("~~~".to_string()),
            );

        match &d.cause.loc {
            diag::Location::Full(loc) => {
                e = e.with_label(
                    Label::new(loc.offset_lo - 1..loc.offset_hi - 1)
                        .with_message(d.cause.message.to_string()),
                );
            }
            diag::Location::Unknown(_) => todo!(),
        }

        e.finish().write(Source::from(from), &mut buf).unwrap();

        String::from_utf8_lossy(&buf).to_string()
            + print_related_info(from, &d.related_information).as_str()
    }

    fn fail(from: &str) -> String {
        let p = parse_api(from);
        let errors = p.errors();
        assert!(!errors.is_empty());
        errors
            .iter()
            .map(|it| print_diag(from, it))
            .collect::<Vec<_>>()
            .join("\n")
    }
    fn ok(from: &str) {
        let p = parse_api(from);
        let errors = p.errors();
        assert!(errors.is_empty());
    }

    #[test]
    fn fail_typeof_keyof_access() {
        let from = r#"
    const a1 = {a: 1};
    const a2 = {a: 1} as const;
    export default {
        "/no_const": {
            get: (): (typeof a1)['b'] => impl()
        },
        "/yes_const": {
            get: (): (typeof a2)['b'] => impl()
        }
    }
    "#;

        insta::assert_snapshot!(fail(from));
    }
    #[test]
    fn fail_tpl_rest() {
        let from = r#"
    type A = ['a','b','c', ]
    type B = A[100]
    export default {
        "/hello": {
            get: (): B => impl()
        }
    }
    "#;

        insta::assert_snapshot!(fail(from));
    }
    #[test]
    fn fail_access_union_arr() {
        let from = r#"
    type A = [{tag:"a"}|{tag:"b"}]
    type B = A[number]["tag"] & number
    export default {
        "/hello": {
            get: (): B => impl()
        }
    }
    "#;

        insta::assert_snapshot!(fail(from));
    }
    #[test]
    fn fail1() {
        let from = r#"
    type A = STRING;
    export default {
        "/hello": {
            get: (): A => impl()
        }
    }
    "#;
        insta::assert_snapshot!(fail(from));
    }

    #[test]
    fn fail2() {
        let from = r#"
    type A = () => void;
    type B = A;
    export default {
        "/hello": {
            get: (): B => impl()
        }
    }
    "#;
        insta::assert_snapshot!(fail(from));
    }
    #[test]
    fn fail3() {
        let from = r#"
    export default {
        "/hello":1
    }
    "#;
        insta::assert_snapshot!(fail(from));
    }

    #[test]
    fn fail4() {
        let from = r#"
    export default 1
    "#;
        insta::assert_snapshot!(fail(from));
    }
    #[test]
    fn fail5() {
        let from = r#"
    type A = string;
    export default A
    "#;
        insta::assert_snapshot!(fail(from));
    }
    #[test]
    fn fail6() {
        let from = r#"
    interface A {
        a: string
    }
    export default A
    "#;
        insta::assert_snapshot!(fail(from));
    }
    #[test]
    fn ok1() {
        let from = r#"
    const a = {
        b: {}
    }
    export default a.b
    "#;
        ok(from)
    }
    #[test]
    fn fail_path_param_optional() {
        let from = r#"
    
    export default {
        "/{a}": {
            get: (c:Ctx, a?: string): string => {
                return 'ok'
            }
        }
    }
    "#;
        insta::assert_snapshot!(fail(from));
    }
}
