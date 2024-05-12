#[cfg(test)]
mod tests {
    use std::{collections::BTreeSet, rc::Rc};

    use beff_core::{
        import_resolver::{parse_and_bind, FsModuleResolver},
        parser_extractor::BuiltDecoder,
        print::printer::ToWritableModules,
        schema_changes::print_ts_types,
        BeffUserSettings, BffFileName, EntryPoints, ExtractResult, FileManager, ParsedModule,
        Validator,
    };
    use swc_common::{Globals, GLOBALS};
    use swc_ecma_ast::TsType;
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
            let res = parse_and_bind(&mut resolver, &file_name, content);
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
    fn as_typescript_string_(validators: &[&Validator], built_decoders: &[BuiltDecoder]) -> String {
        let mut vs: Vec<(String, TsType)> = vec![];

        let mut sorted_validators = validators.iter().collect::<Vec<_>>();
        sorted_validators.sort_by(|a, b| a.name.cmp(&b.name));

        for v in sorted_validators {
            vs.push((v.name.clone(), v.schema.to_ts_type()));
        }

        let mut sorted_decoders = built_decoders.iter().collect::<Vec<_>>();
        sorted_decoders.sort_by(|a, b| a.exported_name.cmp(&b.exported_name));

        for v in sorted_decoders {
            vs.push((v.exported_name.clone(), v.schema.to_ts_type()));
        }

        print_ts_types(vs)
    }
    fn ok(from: &str) -> String {
        let p = parse_api(from);
        let errors = p.errors();

        if !errors.is_empty() {
            panic!("errors: {:?}", errors);
        }
        match p.parser {
            Some(v) => as_typescript_string_(
                &v.validators.iter().collect::<Vec<_>>(),
                v.built_decoders.as_ref().unwrap_or(&vec![]),
            ),
            None => panic!(),
        }
    }

    fn decoder(from: &str) -> String {
        let p = parse_api(from);
        let errors = p.errors();

        if !errors.is_empty() {
            panic!("errors: {:?}", errors);
        }
        match p.parser {
            Some(v) => {
                let res = ExtractResult { parser: Some(v) };
                let m = res.to_module().unwrap();
                m.js_validators
            }
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
    fn ok_partial2() {
        let from = r#"

    type User2 ={enabled: boolean} &Partial< {
        name: string,
        age: number,
        email: string,
    }>
    parse.buildParsers<{ A: User2 }>();

  "#;
        insta::assert_snapshot!(ok(from));
    }
    #[test]
    fn ok_partial3() {
        let from = r#"

    type User2 ={enabled: boolean} &Partial< {
        name: string,
        age: number,
        email: string,
    }>

    type ObjWithUsers = {enabled: boolean} & Partial<{a2: User2}>
    parse.buildParsers<{ A: ObjWithUsers }>();

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
    #[test]
    fn ok_record_access() {
        insta::assert_snapshot!(ok(r#"
        export type Extra = Record<string, string>;
        type ExtraValue = Extra[string];

        parse.buildParsers<{ ExtraValue: ExtraValue }>();
      "#));
    }
    #[test]
    fn ok_record_union() {
        insta::assert_snapshot!(ok(r#"
        export type Extra = Record<'a'|'b', string>;

        parse.buildParsers<{ Extra: Extra }>();
      "#));
    }
    #[test]
    fn ok_array_spread() {
        insta::assert_snapshot!(ok(r#"
        const Arr1 = ["a", "b"] as const
        const Arr2 = [...Arr1, "c"] as const

        type Arr2C = typeof Arr2[number];

        parse.buildParsers<{ Arr2C: Arr2C }>();
      "#));
    }
    #[test]
    fn ok_array_spread_declare() {
        insta::assert_snapshot!(ok(r#"
        declare const Arr1 = ["a", "b"] as const
        declare const Arr2 = [...Arr1, "c"] as const

        type Arr2C = typeof Arr2[number];

        parse.buildParsers<{ Arr2C: Arr2C }>();
      "#));
    }
    #[test]
    fn ok_array_spread_declare2() {
        insta::assert_snapshot!(ok(r#"
        declare const AllArr1: ["a", "b"] 
        type Arr1 = typeof AllArr1[number];
        parse.buildParsers<{ Arr1: Arr1 }>();
      "#));
    }
    #[test]
    fn ok_array_spread_declare3() {
        insta::assert_snapshot!(ok(r#"
        export declare const AllArr1: ["a", "b"] 
        type Arr1 = typeof AllArr1[number];
        parse.buildParsers<{ Arr1: Arr1 }>();
      "#));
    }
    #[test]
    fn ok_array_spread2() {
        insta::assert_snapshot!(ok(r#"
        export const Arr1 = ["a", "b"] as const
        export type Arr1 = typeof Arr1[number]
        export const Arr2 = [...Arr1, "c"] as const

        type Arr2C = typeof Arr2[number];

        parse.buildParsers<{ Arr2C: Arr2C }>();
      "#));
    }
    #[test]
    fn ok_enum_member() {
        insta::assert_snapshot!(ok(r#"
        export enum Enum {
            A = "a",
            B = "b",
        }
        export type X = Enum.A

        parse.buildParsers<{ X: X }>();
      "#));
    }
    #[test]
    fn ok_enum_member2() {
        insta::assert_snapshot!(ok(r#"
        enum Enum {
            A = "a",
            B = "b",
        }
        type X = Enum.A

        parse.buildParsers<{ X: X }>();
      "#));
    }
    #[test]
    fn ok_discriminated_union() {
        insta::assert_snapshot!(decoder(
            r#"
        export type DiscriminatedUnion4 =
            | {
                type: "a";
                a: {
                  subType: "a1";
                  a1: string;
                };
              }
            | {
                type: "a";
                a: {
                  subType: "a2";
                  a2: string;
                };
              };
        parse.buildParsers<{ DiscriminatedUnion4: DiscriminatedUnion4 }>();
      "#
        ));
    }
    #[test]
    fn ok_exclude() {
        insta::assert_snapshot!(ok(r#"
        type A = "a" | "b";

        type B = "b" | "c";

        type X = Exclude<A, B>;

        parse.buildParsers<{ X: X }>();
      "#));
    }
    #[test]
    fn ok_exclude2() {
        insta::assert_snapshot!(ok(r#"
        type Shape =
        | { kind: "circle"; radius: number }
        | { kind: "square"; x: number }
        | { kind: "triangle"; x: number; y: number };
       
        type T3 = Exclude<Shape, { kind: "circle" }>
        parse.buildParsers<{ T3: T3 }>();
      "#));
    }
    #[test]
    fn ok_repro_3() {
        insta::assert_snapshot!(ok(r#"
      
        export interface IY {
            a: string
        }
        export interface IX {
            sizes?: IY;
        }
        // type IX2 = Required<IX>
        type T3 = IX[keyof IX]
        parse.buildParsers<{ T3: T3 }>();
      "#));
    }
    #[test]
    fn ok_recursive_tuple() {
        insta::assert_snapshot!(ok(r#"
        export type IX = [string, IX]
        type IX2 = IX[0]
        parse.buildParsers<{ IX2: IX2 }>();
      "#));
    }
    #[test]
    fn ok_conditional_type() {
        insta::assert_snapshot!(ok(r#"
        export type IX<T> = T extends true ? number : string
        type IX2 = IX<true>
        type IX3 = IX<false>
        parse.buildParsers<{ IX2: IX2, IX3: IX3 }>();
      "#));
    }
    #[test]
    fn ok_tpl_lit1() {
        insta::assert_snapshot!(ok(r#"
        export type IX = `a${string}b${number}c`
        parse.buildParsers<{ IX: IX }>();
      "#));
    }
}
