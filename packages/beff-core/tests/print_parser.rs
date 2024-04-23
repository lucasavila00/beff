#[cfg(test)]
mod tests {
    use std::{collections::BTreeSet, rc::Rc};

    use beff_core::{
        import_resolver::{parse_and_bind, FsModuleResolver},
        open_api_ast::OpenApi,
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
            res.expect("failed to parse")
        })
    }
    fn parse_api(it: &str) -> ExtractResult {
        let f = parse_str(it);
        let mut man = TestFileManager { f };
        let entry = EntryPoints {
            parser_entry_point: Some(BffFileName::new("file.ts".into())),
            settings: BeffUserSettings {
                custom_formats: BTreeSet::from_iter(vec!["password".to_string()]),
            },
        };
        beff_core::extract(&mut man, entry)
    }

    fn ok(from: &str) -> String {
        let p = parse_api(from);
        let errors = p.errors();

        if !errors.is_empty() {
            panic!("errors: {:?}", errors);
        }
        match p.parser {
            Some(v) => OpenApi::as_typescript_string_(
                &v.validators.iter().collect::<Vec<_>>(),
                &v.built_decoders.as_ref().unwrap_or(&vec![]),
            ),
            None => panic!(),
        }
    }

    #[test]
    fn ok_either() {
        let from = r#"
    /**
     * @category model
     * @since 2.0.0
     */
    type Left<E1> = {
         _tag: 'Left',
         left: E1,
    }
    /**
     * @category model
     * @since 2.0.0
     */
    type Right<A1> = {
         _tag: 'Right',
         right: A1,
    }
    /**
     * @category model
     * @since 2.0.0
     */
    type Either<E, A> = Left<E> | Right<A>

    parse.buildParsers<{ A: Either<string, number> }>();

  "#;
        insta::assert_snapshot!(ok(from));
    }
    #[test]
    fn ok_omit() {
        let from = r#"

    type User = {
        name: string,
        age: number,
        email: string,
    }
    parse.buildParsers<{ A: Omit<User, 'age'> }>();

  "#;
        insta::assert_snapshot!(ok(from));
    }
    #[test]
    fn ok_pick() {
        let from = r#"

    type User = {
        name: string,
        age: number,
        email: string,
    }
    parse.buildParsers<{ A: Pick<User, 'age'> }>();

  "#;
        insta::assert_snapshot!(ok(from));
    }
    #[test]
    fn ok_omit2() {
        let from = r#"

    type User = {
        name: string,
        age: number,
        email: string,
    }
    parse.buildParsers<{ A: Omit<User, 'age'|'email'> }>();

  "#;
        insta::assert_snapshot!(ok(from));
    }
    #[test]
    fn ok_partial() {
        let from = r#"

    type User = {
        name: string,
        age: number,
        email: string,
    }
    parse.buildParsers<{ A: Partial<User> }>();

  "#;
        insta::assert_snapshot!(ok(from));
    }
    #[test]
    fn ok_object() {
        insta::assert_snapshot!(ok(r#"
        parse.buildParsers<{ A: Object }>();
      "#));
    }
    #[test]
    fn ok_required() {
        insta::assert_snapshot!(ok(r#"

        type MaybeUser = {
            name?: string,
            age?: number,
        }
        parse.buildParsers<{ A: Required<MaybeUser> }>();
      "#));
    }
    #[test]
    fn ok_interface_extends() {
        insta::assert_snapshot!(ok(r#"

        interface User {
            name: string,
            age: number,
        }
        interface Admin extends User {
            role: string,
        }
        parse.buildParsers<{ Admin: Admin }>();
      "#));
    }
    #[test]
    fn ok_repro() {
        insta::assert_snapshot!(ok(r#"
        export type Settings = {
            a: string;
            level: "a" | "b";
            d: {
                tag: "d";
            };
        };
          
        export type SettingsUpdate = Settings["a" | "level" | "d"];
        parse.buildParsers<{ SettingsUpdate: SettingsUpdate }>();
      "#));
    }
    #[test]
    fn ok_mapped_type() {
        insta::assert_snapshot!(ok(r#"
        export type Mapped = {
            [K in "a" | "b"]: {
                value: K;
            };
        };
        parse.buildParsers<{ Mapped: Mapped }>();
      "#));
    }
    #[test]
    fn ok_mapped_type_optional() {
        insta::assert_snapshot!(ok(r#"
        export type Mapped = {
            [K in "a" | "b"]?: {
                value: K;
            };
        };
        parse.buildParsers<{ Mapped: Mapped }>();
      "#));
    }
    #[test]
    fn ok_mapped_type_repro() {
        insta::assert_snapshot!(ok(r#"
        type Obj = { a: string } & {d: string}
        type MappedKeys = keyof Obj;
        parse.buildParsers<{ MappedKeys: MappedKeys }>();
      "#));
    }
}
