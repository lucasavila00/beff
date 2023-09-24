#[cfg(test)]
mod tests {
    use ariadne::{Config, Label, Report, ReportKind, Source};
    use std::{collections::BTreeSet, rc::Rc};

    use beff_core::{
        diag,
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
                    Label::new(loc.offset_lo..loc.offset_hi)
                        .with_message(d.cause.message.to_string()),
                );
            }
            diag::Location::Unknown(_) => todo!(),
        }

        if let Some(vs) = &d.related_information {
            for v in vs {
                match &v.loc {
                    diag::Location::Full(loc) => {
                        e = e.with_label(
                            Label::new(loc.offset_lo..loc.offset_hi)
                                .with_message(d.cause.message.to_string()),
                        );
                    }
                    diag::Location::Unknown(_) => todo!(),
                }
            }
        }

        e.finish().write(Source::from(from), &mut buf).unwrap();

        String::from_utf8_lossy(&buf).to_string()
    }

    fn parse_and_fail(from: &str) -> String {
        let p = parse_api(from);
        let errors = p.errors();
        assert!(!errors.is_empty());
        errors
            .iter()
            .map(|it| print_diag(from, it))
            .collect::<Vec<_>>()
            .join("\n")
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
        insta::assert_snapshot!(parse_and_fail(from));
    }
}
