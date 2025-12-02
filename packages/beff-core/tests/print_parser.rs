#[cfg(test)]
mod tests {

    use beff_core::test_tools::{print_cgen, print_types};

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
        insta::assert_snapshot!(print_types(from), @r#"
        type Either__string_number__ = (Left__string__ | Right__number__);

        type Left__string__ = { "_tag": "Left", "left": string };

        type Right__number__ = { "_tag": "Right", "right": number };


        type BuiltParsers = {
          A: Either__string_number__,
        }
        "#);
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
        insta::assert_snapshot!(print_types(from), @r#"
        type User = { "age": number, "email": string, "name": string };


        type BuiltParsers = {
          A: { "email": string, "name": string },
        }
        "#);
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
        insta::assert_snapshot!(print_types(from), @r#"
        type User = { "age": number, "email": string, "name": string };


        type BuiltParsers = {
          A: { "age": number },
        }
        "#);
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
        insta::assert_snapshot!(print_types(from), @r#"
        type User = { "age": number, "email": string, "name": string };


        type BuiltParsers = {
          A: { "name": string },
        }
        "#);
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
        insta::assert_snapshot!(print_types(from), @r#"
        type User = { "age": number, "email": string, "name": string };


        type BuiltParsers = {
          A: { "age"?: number, "email"?: string, "name"?: string },
        }
        "#);
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
        insta::assert_snapshot!(print_types(from), @r#"
        type User2 = { "age"?: number, "email"?: string, "enabled": boolean, "name"?: string };


        type BuiltParsers = {
          A: User2,
        }
        "#);
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
        insta::assert_snapshot!(print_types(from), @r#"
        type ObjWithUsers = { "a2"?: User2, "enabled": boolean };

        type User2 = { "age"?: number, "email"?: string, "enabled": boolean, "name"?: string };


        type BuiltParsers = {
          A: ObjWithUsers,
        }
        "#);
    }
    #[test]
    fn ok_object() {
        insta::assert_snapshot!(print_types(
            r#"
        parse.buildParsers<{ A: Object }>();
      "#
        ), @r"
        type BuiltParsers = {
          A: { [key: (string | number)]: any },
        }
        ");
    }
    #[test]
    fn ok_required() {
        insta::assert_snapshot!(print_types(
            r#"

        type MaybeUser = {
            name?: string,
            age?: number,
        }
        parse.buildParsers<{ A: Required<MaybeUser> }>();
      "#
        ), @r#"
        type MaybeUser = { "age"?: number, "name"?: string };


        type BuiltParsers = {
          A: { "age": number, "name": string },
        }
        "#);
    }
    #[test]
    fn ok_keyof_record() {
        insta::assert_snapshot!(print_types(
            r#"

        const a = {
          a: "a",
          x: "x",
          u: "u",
        };

        type A = keyof typeof a;

        const b = {
          b: "b",
          y: "y",
          u: "u",
        };

        type B = keyof typeof b;

        type C = A | B;

        type Rec = Record<C, string>;

        parse.buildParsers<{ C:C, Rec: Rec }>();
      "#
        ), @r#"
        type A = ("a" | "u" | "x");

        type B = ("b" | "u" | "y");

        type C = (A | B);

        type Rec = { "a": string, "b": string, "u": string, "x": string, "y": string };


        type BuiltParsers = {
          C: C,
          Rec: Rec,
        }
        "#);
    }

    #[test]
    fn ok_keyof_record2() {
        insta::assert_snapshot!(print_types(
            r#"

        const a = {
        };

        type A = keyof typeof a;

        const b = {
          b: "b",
          y: "y",
          u: "u",
        };

        type B = keyof typeof b;

        type C = A | B;

        type Rec = Record<C, string>;

        parse.buildParsers<{ C:C, Rec: Rec }>();
      "#
        ), @r#"
        type A = never;

        type B = ("b" | "u" | "y");

        type C = (A | B);

        type Rec = { "b": string, "u": string, "y": string };


        type BuiltParsers = {
          C: C,
          Rec: Rec,
        }
        "#);
    }

    #[test]
    fn ok_interface_extends() {
        insta::assert_snapshot!(print_types(
            r#"

        interface User {
            name: string,
            age: number,
        }
        interface Admin extends User {
            role: string,
        }
        parse.buildParsers<{ Admin: Admin }>();
      "#
        ), @r#"
        type Admin = { "age": number, "name": string, "role": string };

        type User = { "age": number, "name": string };


        type BuiltParsers = {
          Admin: Admin,
        }
        "#);
    }
    #[test]
    fn ok_repro() {
        insta::assert_snapshot!(print_types(
            r#"
        export type Settings = {
            a: string;
            level: "a" | "b";
            d: {
                tag: "d";
            };
        };
          
        export type SettingsUpdate = Settings["a" | "level" | "d"];
        parse.buildParsers<{ SettingsUpdate: SettingsUpdate }>();
      "#
        ), @r#"
        type Settings = { "a": string, "d": { "tag": "d" }, "level": ("a" | "b") };

        type SettingsUpdate = (string | "a" | "b" | { "tag": "d" });


        type BuiltParsers = {
          SettingsUpdate: SettingsUpdate,
        }
        "#);
    }
    #[test]
    fn ok_mapped_type() {
        insta::assert_snapshot!(print_types(
            r#"
        export type Mapped = {
            [K in "a" | "b"]: {
                value: K;
            };
        };
        parse.buildParsers<{ Mapped: Mapped }>();
      "#
        ), @r#"
        type Mapped = { "a": { "value": "a" }, "b": { "value": "b" } };


        type BuiltParsers = {
          Mapped: Mapped,
        }
        "#);
    }
    #[test]
    fn ok_mapped_type_optional() {
        insta::assert_snapshot!(print_types(
            r#"
        export type Mapped = {
            [K in "a" | "b"]?: {
                value: K;
            };
        };
        parse.buildParsers<{ Mapped: Mapped }>();
      "#
        ), @r#"
        type Mapped = { "a"?: { "value": "a" }, "b"?: { "value": "b" } };


        type BuiltParsers = {
          Mapped: Mapped,
        }
        "#);
    }
    #[test]
    fn ok_mapped_type_repro() {
        insta::assert_snapshot!(print_types(
            r#"
        type Obj = { a: string } & {d: string}
        type MappedKeys = keyof Obj;
        parse.buildParsers<{ MappedKeys: MappedKeys }>();
      "#
        ), @r#"
        type MappedKeys = ("a" | "d");

        type Obj = { "a": string, "d": string };


        type BuiltParsers = {
          MappedKeys: MappedKeys,
        }
        "#);
    }
    #[test]
    fn ok_record_access() {
        insta::assert_snapshot!(print_types(
            r#"
        export type Extra = Record<string, string>;
        type ExtraValue = Extra[string];

        parse.buildParsers<{ ExtraValue: ExtraValue }>();
      "#
        ), @r"
        type Extra = { [key: string]: string };

        type ExtraValue = string;


        type BuiltParsers = {
          ExtraValue: ExtraValue,
        }
        ");
    }
    #[test]
    fn ok_record_union() {
        insta::assert_snapshot!(print_types(
            r#"
        export type Extra = Record<'a'|'b', string>;

        parse.buildParsers<{ Extra: Extra }>();
      "#
        ), @r#"
        type Extra = { "a": string, "b": string };


        type BuiltParsers = {
          Extra: Extra,
        }
        "#);
    }
    #[test]
    fn ok_array_spread() {
        insta::assert_snapshot!(print_types(
            r#"
        const Arr1 = ["a", "b"] as const
        const Arr2 = [...Arr1, "c"] as const

        type Arr2C = typeof Arr2[number];

        parse.buildParsers<{ Arr2C: Arr2C }>();
      "#
        ), @r#"
        type Arr2C = ("a" | "b" | "c");


        type BuiltParsers = {
          Arr2C: Arr2C,
        }
        "#);
    }
    #[test]
    fn ok_array_spread_declare() {
        insta::assert_snapshot!(print_types(
            r#"
        declare const Arr1 = ["a", "b"] as const
        declare const Arr2 = [...Arr1, "c"] as const

        type Arr2C = typeof Arr2[number];

        parse.buildParsers<{ Arr2C: Arr2C }>();
      "#
        ), @r#"
        type Arr2C = ("a" | "b" | "c");


        type BuiltParsers = {
          Arr2C: Arr2C,
        }
        "#);
    }
    #[test]
    fn ok_array_spread_declare2() {
        insta::assert_snapshot!(print_types(
            r#"
        declare const AllArr1: ["a", "b"] 
        type Arr1 = typeof AllArr1[number];
        parse.buildParsers<{ Arr1: Arr1 }>();
      "#
        ), @r#"
        type Arr1 = ("a" | "b");


        type BuiltParsers = {
          Arr1: Arr1,
        }
        "#);
    }
    #[test]
    fn ok_array_spread_declare3() {
        insta::assert_snapshot!(print_types(
            r#"
        export declare const AllArr1: ["a", "b"] 
        type Arr1 = typeof AllArr1[number];
        parse.buildParsers<{ Arr1: Arr1 }>();
      "#
        ), @r#"
        type Arr1 = ("a" | "b");


        type BuiltParsers = {
          Arr1: Arr1,
        }
        "#);
    }
    #[test]
    fn ok_array_spread2() {
        insta::assert_snapshot!(print_types(
            r#"
        export const Arr1 = ["a", "b"] as const
        export type Arr1 = typeof Arr1[number]
        export const Arr2 = [...Arr1, "c"] as const

        type Arr2C = typeof Arr2[number];

        parse.buildParsers<{ Arr2C: Arr2C }>();
      "#
        ), @r#"
        type Arr2C = ("a" | "b" | "c");


        type BuiltParsers = {
          Arr2C: Arr2C,
        }
        "#);
    }
    #[test]
    fn ok_enum_member() {
        insta::assert_snapshot!(print_types(
            r#"
        export enum Enum {
            A = "a",
            B = "b",
        }
        export type X = Enum.A

        parse.buildParsers<{ X: X }>();
      "#
        ), @r#"
        type X = Enum__A;

        type Enum__A = "a";


        type BuiltParsers = {
          X: X,
        }
        "#);
    }
    #[test]
    fn ok_enum_member2() {
        insta::assert_snapshot!(print_types(
            r#"
        enum Enum {
            A = "a",
            B = "b",
        }
        type X = Enum.A

        parse.buildParsers<{ X: X }>();
      "#
        ), @r#"
        type X = Enum__A;

        type Enum__A = "a";


        type BuiltParsers = {
          X: X,
        }
        "#);
    }
    #[test]
    fn ok_discriminated_union() {
        insta::assert_snapshot!(print_cgen(
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
        ), @r#"
        const direct_hoist_0 = new TypeofRuntype("string");
        const direct_hoist_1 = new ConstRuntype("a");
        const namedRuntypes = {
            "DiscriminatedUnion4": new AnyOfRuntype([
                new ObjectRuntype({
                    "a": new ObjectRuntype({
                        "a1": direct_hoist_0,
                        "subType": new ConstRuntype("a1")
                    }, []),
                    "type": direct_hoist_1
                }, []),
                new ObjectRuntype({
                    "a": new ObjectRuntype({
                        "a2": direct_hoist_0,
                        "subType": new ConstRuntype("a2")
                    }, []),
                    "type": direct_hoist_1
                }, [])
            ])
        };
        const buildParsersInput = {
            "DiscriminatedUnion4": new RefRuntype("DiscriminatedUnion4")
        };
        "#);
    }
    #[test]
    fn ok_exclude() {
        insta::assert_snapshot!(print_types(
            r#"
        type A = "a" | "b";

        type B = "b" | "c";

        type X = Exclude<A, B>;

        parse.buildParsers<{ X: X }>();
      "#
        ), @r#"
        type A = ("a" | "b");

        type B = ("b" | "c");

        type X = "a";


        type BuiltParsers = {
          X: X,
        }
        "#);
    }
    #[test]
    fn ok_exclude2() {
        insta::assert_snapshot!(print_types(
            r#"
        type Shape =
        | { kind: "circle"; radius: number }
        | { kind: "square"; x: number }
        | { kind: "triangle"; x: number; y: number };
       
        type T3 = Exclude<Shape, { kind: "circle" }>
        parse.buildParsers<{ T3: T3 }>();
      "#
        ), @r#"
        type Shape = ({ "kind": "circle", "radius": number } | { "kind": "square", "x": number } | { "kind": "triangle", "x": number, "y": number });

        type T3 = ({ "kind": "square", "x": number } | { "kind": "triangle", "x": number, "y": number });


        type BuiltParsers = {
          T3: T3,
        }
        "#);
    }
    #[test]
    fn ok_repro_3() {
        insta::assert_snapshot!(print_types(
            r#"
      
        export interface IY {
            a: string
        }
        export interface IX {
            sizes?: IY;
        }
        // type IX2 = Required<IX>
        type T3 = IX[keyof IX]
        parse.buildParsers<{ T3: T3 }>();
      "#
        ), @r#"
        type IX = { "sizes"?: IY };

        type IY = { "a": string };

        type T3 = (null | IY);


        type BuiltParsers = {
          T3: T3,
        }
        "#);
    }
    #[test]
    fn ok_recursive_tuple() {
        insta::assert_snapshot!(print_types(
            r#"
        export type IX = [string, IX]
        type IX2 = IX[0]
        parse.buildParsers<{ IX2: IX2 }>();
      "#
        ), @r"
        type IX = [string, IX];

        type IX2 = string;


        type BuiltParsers = {
          IX2: IX2,
        }
        ");
    }
    #[test]
    fn ok_conditional_type() {
        insta::assert_snapshot!(print_types(
            r#"
        export type IX<T> = T extends true ? number : string
        type IX2 = IX<true>
        type IX3 = IX<false>
        parse.buildParsers<{ IX2: IX2, IX3: IX3 }>();
      "#
        ), @r"
        type IX__false__ = string;

        type IX__true__ = number;

        type IX2 = IX__true__;

        type IX3 = IX__false__;


        type BuiltParsers = {
          IX2: IX2,
          IX3: IX3,
        }
        ");
    }
    #[test]
    fn ok_tpl_lit1() {
        insta::assert_snapshot!(print_types(
            r#"
        export type IX = `a${string}b${number}c`
        parse.buildParsers<{ IX: IX }>();
      "#
        ), @r"
        type IX = `a${string}b${number}c`;


        type BuiltParsers = {
          IX: IX,
        }
        ");
    }
    #[test]
    fn ok_tpl_lit2() {
        insta::assert_snapshot!(print_types(
            r#"
        enum Abc {
            A = "A",
            B = "B",
        }
        export type IX = `${Abc}`
        parse.buildParsers<{ IX: IX }>();
      "#
        ), @r#"
        type Abc = ("A" | "B");

        type IX = `("A" | "B")`;


        type BuiltParsers = {
          IX: IX,
        }
        "#);
    }
    #[test]
    fn ok_repro4() {
        insta::assert_snapshot!(print_types(
            r#"
        export const a = "a" as const;
        export const b = "b" as const;
        
        export const AllTs = [a, b] as const;
        export type AllTs = (typeof AllTs)[number];
        
        parse.buildParsers<{ AllTs: AllTs }>();
      "#
        ), @r#"
        type AllTs = ("a" | "b");


        type BuiltParsers = {
          AllTs: AllTs,
        }
        "#);
    }
    #[test]
    fn ok_repro5() {
        insta::assert_snapshot!(print_types(
            r#"
        export const ABC = {a: "b", c: "d"} as const satisfies Record<string, string>;
        export type AllTs = (keyof typeof ABC);

        parse.buildParsers<{ AllTs: AllTs }>();
      "#
        ), @r#"
        type AllTs = ("a" | "c");


        type BuiltParsers = {
          AllTs: AllTs,
        }
        "#);
    }
    #[test]
    fn ok_repro6() {
        insta::assert_snapshot!(print_types(
            r#"
        const x = (it: string) => it;
        export const ABC = {a: `b`, c: `d${x("d")}d`};
        export type AllTs = (keyof typeof ABC);

        parse.buildParsers<{ AllTs: AllTs }>();
      "#
        ), @r#"
        type AllTs = ("a" | "c");


        type BuiltParsers = {
          AllTs: AllTs,
        }
        "#);
    }
    #[test]
    fn ok_repro7() {
        insta::assert_snapshot!(print_types(
            r#"
        const x = (it: string) => it;
        export const ABC = {a: `b`, c: `d${x("d")}d`} as const satisfies Record<string, string>;
        export type AllTs = (keyof typeof ABC);

        parse.buildParsers<{ AllTs: AllTs }>();
      "#
        ), @r#"
        type AllTs = ("a" | "c");


        type BuiltParsers = {
          AllTs: AllTs,
        }
        "#);
    }
    #[test]
    fn ok_repro8() {
        insta::assert_snapshot!(print_types(
            r#"
        const x = (it: string) => it;
        const def = "def";
        export const ABC = {a: `b`, c: `d${x("d")}d`, def ,} as const satisfies Record<string, string>;
        export type AllTs = (keyof typeof ABC);

        parse.buildParsers<{ AllTs: AllTs }>();
      "#
        ), @r#"
        type AllTs = ("a" | "c" | "def");


        type BuiltParsers = {
          AllTs: AllTs,
        }
        "#);
    }
    #[test]
    fn ok_repro9() {
        insta::assert_snapshot!(print_types(
            r#"
        export const ABC = {a: x=>x+1, } as const satisfies Record<string, string>;
        export type AllTs = (keyof typeof ABC);

        parse.buildParsers<{ AllTs: AllTs }>();
      "#
        ), @r#"
        type AllTs = "a";


        type BuiltParsers = {
          AllTs: AllTs,
        }
        "#);
    }
    #[test]
    fn ok_repro10() {
        insta::assert_snapshot!(print_types(
            r#"
        enum E {
          A="A",
          B="B"
        };
        export const ABC = {a: E.B, } as const satisfies Record<string, string>;
        export type AllTs = (keyof typeof ABC);

        parse.buildParsers<{ AllTs: AllTs }>();
      "#
        ), @r#"
        type AllTs = "a";


        type BuiltParsers = {
          AllTs: AllTs,
        }
        "#);
    }
    #[test]
    fn ok_repro11() {
        insta::assert_snapshot!(print_types(
            r#"
        enum E {
          A="A",
          B="B"
        };
        const val = E.B as const;
        export type AllTs = typeof val;

        parse.buildParsers<{ AllTs: AllTs }>();
      "#
        ), @r#"
        type AllTs = "B";


        type BuiltParsers = {
          AllTs: AllTs,
        }
        "#);
    }
    #[test]
    fn ok_repro12() {
        insta::assert_snapshot!(print_types(
            r#"
        const val = 1 + 1;
        export type AllTs = typeof val;

        parse.buildParsers<{ AllTs: AllTs }>();
      "#
        ), @r"
        type AllTs = number;


        type BuiltParsers = {
          AllTs: AllTs,
        }
        ");
    }
    #[test]
    fn ok_repro13() {
        insta::assert_snapshot!(print_types(
            r#"
        const val = {a: 1} as const;
        const spread = {...val, b: 2} as const;
        export type AllTs = typeof spread;

        parse.buildParsers<{ AllTs: AllTs }>();
      "#
        ), @r#"
        type AllTs = { "a": 1, "b": 2 };


        type BuiltParsers = {
          AllTs: AllTs,
        }
        "#);
    }
    #[test]
    fn ok_void() {
        insta::assert_snapshot!(print_types(
            r#"
        export type IX = void
        parse.buildParsers<{ IX: IX }>();
      "#
        ), @r"
        type IX = void;


        type BuiltParsers = {
          IX: IX,
        }
        ");
    }
    #[test]
    fn ok_object_builtin() {
        insta::assert_snapshot!(print_types(
            r#"
        export type IX = object
        parse.buildParsers<{ IX: IX }>();
      "#
        ), @r"
        type IX = { [key: (string | number)]: any };


        type BuiltParsers = {
          IX: IX,
        }
        ");
    }
    #[test]
    fn ok_never() {
        insta::assert_snapshot!(print_types(
            r#"
        export type ABC = {}
        export type KABC = keyof ABC

        export type DEF = {
            a: string
        }
        export type KDEF = keyof DEF

        export type K = KABC | KDEF

        parse.buildParsers<{ K: K }>();
      "#
        ), @r#"
        type ABC = {  };

        type DEF = { "a": string };

        type K = (KABC | KDEF);

        type KABC = never;

        type KDEF = "a";


        type BuiltParsers = {
          K: K,
        }
        "#);
    }
    #[test]
    fn ok_never2() {
        insta::assert_snapshot!(print_types(
            r#"
        export type ABC = {}
        export type KABC = keyof ABC
     
        parse.buildParsers<{ KABC: KABC }>();
      "#
        ), @r"
        type ABC = {  };

        type KABC = never;


        type BuiltParsers = {
          KABC: KABC,
        }
        ");
    }
    #[test]
    fn ok_omit_intersection() {
        insta::assert_snapshot!(print_types(
            r#"
        export type A = {a: string}
        export type B = {b: string}

        export type KABC = Omit<A & B, 'a'>
     
        parse.buildParsers<{ KABC: KABC }>();
      "#
        ), @r#"
        type A = { "a": string };

        type B = { "b": string };

        type KABC = { "b": string };


        type BuiltParsers = {
          KABC: KABC,
        }
        "#);
    }

    #[test]
    fn ok_string_decoder() {
        insta::assert_snapshot!(print_cgen(
            r#"
        export type Alias = string;
        parse.buildParsers<{ Dec: Alias }>();
      "#
        ), @r#"
        const namedRuntypes = {
            "Alias": new TypeofRuntype("string")
        };
        const buildParsersInput = {
            "Dec": new RefRuntype("Alias")
        };
        "#);
    }

    #[test]
    fn ok_array_decoder() {
        insta::assert_snapshot!(print_cgen(
            r#"
        export type Alias = string[];
        parse.buildParsers<{ Dec: Alias }>();
      "#
        ), @r#"
        const namedRuntypes = {
            "Alias": new ArrayRuntype(new TypeofRuntype("string"))
        };
        const buildParsersInput = {
            "Dec": new RefRuntype("Alias")
        };
        "#);
    }
    #[test]
    fn ok_string_with_fmt_decoder() {
        insta::assert_snapshot!(print_cgen(
            r#"
        export type Alias = StringFormat<"password">;
        parse.buildParsers<{ Dec: Alias }>();
      "#
        ), @r#"
        const namedRuntypes = {
            "Alias": new StringWithFormatRuntype([
                "password"
            ])
        };
        const buildParsersInput = {
            "Dec": new RefRuntype("Alias")
        };
        "#);
    }

    #[test]
    fn ok_string_with_fmt_record_decoder() {
        insta::assert_snapshot!(print_cgen(
            r#"
        export type Password = StringFormat<"password">;
        export type PassLenghts = Record<Password, number>;
        parse.buildParsers<{ PassLenghts: PassLenghts }>();
      "#
        ), @r#"
        const direct_hoist_0 = new StringWithFormatRuntype([
            "password"
        ]);
        const namedRuntypes = {
            "PassLenghts": new ObjectRuntype({}, [
                {
                    "key": direct_hoist_0,
                    "value": new TypeofRuntype("number")
                }
            ]),
            "Password": direct_hoist_0
        };
        const buildParsersInput = {
            "PassLenghts": new RefRuntype("PassLenghts")
        };
        "#);
    }

    #[test]
    fn ok_string_with_fmt_record_decoder_st() {
        insta::assert_snapshot!(print_cgen(
            r#"
        export type Password = StringFormat<"password">;
        export type PassLenghts = Record<Password, number>;
        export type PassLengthGet = PassLenghts[Password];
        parse.buildParsers<{ PassLengthGet: PassLengthGet }>();
      "#
        ), @r#"
        const direct_hoist_0 = new TypeofRuntype("number");
        const direct_hoist_1 = new StringWithFormatRuntype([
            "password"
        ]);
        const namedRuntypes = {
            "PassLenghts": new ObjectRuntype({}, [
                {
                    "key": direct_hoist_1,
                    "value": direct_hoist_0
                }
            ]),
            "PassLengthGet": direct_hoist_0,
            "Password": direct_hoist_1
        };
        const buildParsersInput = {
            "PassLengthGet": new RefRuntype("PassLengthGet")
        };
        "#);
    }

    #[test]
    fn ok_record_get() {
        insta::assert_snapshot!(print_cgen(
            r#"
        export type NumberRec = Record<number, string>;
        export type NumberRecGet = NumberRec[0];
        parse.buildParsers<{ NumberRecGet: NumberRecGet }>();
      "#
        ), @r#"
        const direct_hoist_0 = new TypeofRuntype("string");
        const namedRuntypes = {
            "NumberRec": new ObjectRuntype({}, [
                {
                    "key": new TypeofRuntype("number"),
                    "value": direct_hoist_0
                }
            ]),
            "NumberRecGet": direct_hoist_0
        };
        const buildParsersInput = {
            "NumberRecGet": new RefRuntype("NumberRecGet")
        };
        "#);
    }

    #[test]
    fn ok_string_with_fmt_extends_decoder() {
        insta::assert_snapshot!(print_cgen(
            r#"
        export type User = StringFormat<"User">;
        export type ReadAuthorizedUser = StringFormatExtends<User, "ReadAuthorizedUser">;
        export type WriteAuthorizedUser = StringFormatExtends<ReadAuthorizedUser, "WriteAuthorizedUser">;
        parse.buildParsers<{ User: User, ReadAuthorizedUser: ReadAuthorizedUser, WriteAuthorizedUser: WriteAuthorizedUser }>();
      "#
        ), @r#"
        const namedRuntypes = {
            "ReadAuthorizedUser": new StringWithFormatRuntype([
                "User",
                "ReadAuthorizedUser"
            ]),
            "User": new StringWithFormatRuntype([
                "User"
            ]),
            "WriteAuthorizedUser": new StringWithFormatRuntype([
                "User",
                "ReadAuthorizedUser",
                "WriteAuthorizedUser"
            ])
        };
        const buildParsersInput = {
            "User": new RefRuntype("User"),
            "ReadAuthorizedUser": new RefRuntype("ReadAuthorizedUser"),
            "WriteAuthorizedUser": new RefRuntype("WriteAuthorizedUser")
        };
        "#);
    }

    #[test]
    fn ok_number_with_fmt_extends_decoder() {
        insta::assert_snapshot!(print_cgen(
            r#"
        export type NonInfiniteNumber = NumberFormat<"NonInfiniteNumber">;
        export type NonNegativeNumber = NumberFormatExtends<NonInfiniteNumber, "NonNegativeNumber">;
        export type Rate = NumberFormatExtends<NonNegativeNumber, "Rate">;
        parse.buildParsers<{ NonInfiniteNumber: NonInfiniteNumber, NonNegativeNumber: NonNegativeNumber, Rate: Rate }>();
      "#
        ), @r#"
        const namedRuntypes = {
            "NonInfiniteNumber": new NumberWithFormatRuntype([
                "NonInfiniteNumber"
            ]),
            "NonNegativeNumber": new NumberWithFormatRuntype([
                "NonInfiniteNumber",
                "NonNegativeNumber"
            ]),
            "Rate": new NumberWithFormatRuntype([
                "NonInfiniteNumber",
                "NonNegativeNumber",
                "Rate"
            ])
        };
        const buildParsersInput = {
            "NonInfiniteNumber": new RefRuntype("NonInfiniteNumber"),
            "NonNegativeNumber": new RefRuntype("NonNegativeNumber"),
            "Rate": new RefRuntype("Rate")
        };
        "#);
    }

    #[test]
    fn print_number_with_fmt_extends_decoder() {
        insta::assert_snapshot!(print_types(
            r#"
        export type NonInfiniteNumber = NumberFormat<"NonInfiniteNumber">;
        export type NonNegativeNumber = NumberFormatExtends<NonInfiniteNumber, "NonNegativeNumber">;
        export type Rate = NumberFormatExtends<NonNegativeNumber, "Rate">;
        parse.buildParsers<{ NonInfiniteNumber: NonInfiniteNumber, NonNegativeNumber: NonNegativeNumber, Rate: Rate }>();
      "#
        ), @r#"
        type NonInfiniteNumber = NumberFormat<"NonInfiniteNumber">;

        type NonNegativeNumber = NumberFormatExtends<NumberFormat<"NonInfiniteNumber">, "NonNegativeNumber">;

        type Rate = NumberFormatExtends<NumberFormatExtends<NumberFormat<"NonInfiniteNumber">, "NonNegativeNumber">, "Rate">;


        type BuiltParsers = {
          NonInfiniteNumber: NonInfiniteNumber,
          NonNegativeNumber: NonNegativeNumber,
          Rate: Rate,
        }
        "#);
    }

    #[test]
    fn ok_const_decoder() {
        insta::assert_snapshot!(print_cgen(
            r#"
        export type Alias = "some_string_const"
        parse.buildParsers<{ Dec: Alias }>();
      "#
        ), @r#"
        const namedRuntypes = {
            "Alias": new ConstRuntype("some_string_const")
        };
        const buildParsersInput = {
            "Dec": new RefRuntype("Alias")
        };
        "#);
    }
    #[test]
    fn ok_codec_decoder() {
        insta::assert_snapshot!(print_cgen(
            r#"
        export type Alias = Date
        parse.buildParsers<{ Dec: Alias }>();
      "#
        ), @r#"
        const namedRuntypes = {
            "Alias": new DateRuntype()
        };
        const buildParsersInput = {
            "Dec": new RefRuntype("Alias")
        };
        "#);
    }
    #[test]
    fn ok_template_lit_decoder() {
        insta::assert_snapshot!(print_cgen(
            r#"
        export type Alias = `${number}__${number}`
        parse.buildParsers<{ Dec: Alias }>();
      "#
        ), @r#"
        const namedRuntypes = {
            "Alias": new RegexRuntype(/(\d+(\.\d+)?)(__)(\d+(\.\d+)?)/, "`${number}__${number}`")
        };
        const buildParsersInput = {
            "Dec": new RefRuntype("Alias")
        };
        "#);
    }
    #[test]
    fn ok_tuple_decoder() {
        insta::assert_snapshot!(print_cgen(
            r#"
        export type Alias = [number, number]
        parse.buildParsers<{ Dec: Alias }>();
      "#
        ), @r#"
        const direct_hoist_0 = new TypeofRuntype("number");
        const namedRuntypes = {
            "Alias": new TupleRuntype([
                direct_hoist_0,
                direct_hoist_0
            ], null)
        };
        const buildParsersInput = {
            "Dec": new RefRuntype("Alias")
        };
        "#);
    }
    #[test]
    fn ok_object_decoder() {
        insta::assert_snapshot!(print_cgen(
            r#"
        export type Alias = {a:string}
        parse.buildParsers<{ Dec: Alias }>();
      "#
        ), @r#"
        const namedRuntypes = {
            "Alias": new ObjectRuntype({
                "a": new TypeofRuntype("string")
            }, [])
        };
        const buildParsersInput = {
            "Dec": new RefRuntype("Alias")
        };
        "#);
    }
    #[test]
    fn ok_union_decoder() {
        insta::assert_snapshot!(print_cgen(
            r#"
        export type Alias = string | number
        parse.buildParsers<{ Dec: Alias }>();
      "#
        ), @r#"
        const namedRuntypes = {
            "Alias": new AnyOfRuntype([
                new TypeofRuntype("string"),
                new TypeofRuntype("number")
            ])
        };
        const buildParsersInput = {
            "Dec": new RefRuntype("Alias")
        };
        "#);
    }
    #[test]
    fn ok_intersection_decoder() {
        insta::assert_snapshot!(print_cgen(
            r#"
        export type Alias = {a:string} & {b:number}
        parse.buildParsers<{ Dec: Alias }>();
      "#
        ), @r#"
        const namedRuntypes = {
            "Alias": new ObjectRuntype({
                "a": new TypeofRuntype("string"),
                "b": new TypeofRuntype("number")
            }, [])
        };
        const buildParsersInput = {
            "Dec": new RefRuntype("Alias")
        };
        "#);
    }
    #[test]
    fn ok_string_decoder2() {
        insta::assert_snapshot!(print_cgen(
            r#"
        parse.buildParsers<{ Dec: string }>();
      "#
        ), @r#"
        const namedRuntypes = {};
        const buildParsersInput = {
            "Dec": new TypeofRuntype("string")
        };
        "#);
    }

    #[test]
    fn ok_string_alias_decoder() {
        insta::assert_snapshot!(print_cgen(
            r#"
        export type Alias = string;
        parse.buildParsers<{ Dec: Alias }>();
      "#
        ), @r#"
        const namedRuntypes = {
            "Alias": new TypeofRuntype("string")
        };
        const buildParsersInput = {
            "Dec": new RefRuntype("Alias")
        };
        "#);
    }

    #[test]
    fn ok_conditional_string_subtypes() {
        insta::assert_snapshot!(print_types(
            r#"
        type A = "a";
        type B = string;
        type C = A extends B ? true : false;
        type D = B extends A ? true : false;
        // expect C to be true and D to be false
        parse.buildParsers<{ C: C, D: D }>();
      "#
        ), @r#"
        type A = "a";

        type B = string;

        type C = true;

        type D = false;


        type BuiltParsers = {
          C: C,
          D: D,
        }
        "#);
    }
    #[test]
    fn ok_conditional_date_subtypes() {
        insta::assert_snapshot!(print_types(
            r#"
        type A = Date;
        type B = string;
        type C = A extends B ? true : false;
        type D = B extends A ? true : false;
        // expect C to be false and D to be false
        parse.buildParsers<{ C: C, D: D }>();
      "#
        ), @r"
        type A = Date;

        type B = string;

        type C = false;

        type D = false;


        type BuiltParsers = {
          C: C,
          D: D,
        }
        ");
    }
    #[test]
    fn ok_conditional_bigint_subtypes() {
        insta::assert_snapshot!(print_types(
            r#"
        type A = bigint;
        type B = string;
        type C = A extends B ? true : false;
        type D = B extends A ? true : false;
        // expect C to be false and D to be false
        parse.buildParsers<{ C: C, D: D }>();
      "#
        ), @r"
        type A = bigint;

        type B = string;

        type C = false;

        type D = false;


        type BuiltParsers = {
          C: C,
          D: D,
        }
        ");
    }

    #[test]
    fn ok_record_extends() {
        insta::assert_snapshot!(print_types(
            r#"
        export type Obj1 = {a:string}
        export type Obj2 = {a:string, b:string}
        export type Obj3 = Obj1 extends Obj2 ? true : false
        export type Obj4 = Obj2 extends Obj1 ? true : false
        // expect Obj3 to be false and Obj4 to be true
        parse.buildParsers<{ Obj3: Obj3, Obj4: Obj4 }>();
      "#
        ), @r#"
        type Obj1 = { "a": string };

        type Obj2 = { "a": string, "b": string };

        type Obj3 = false;

        type Obj4 = true;


        type BuiltParsers = {
          Obj3: Obj3,
          Obj4: Obj4,
        }
        "#);
    }
    #[test]
    fn ok_readonly_array() {
        insta::assert_snapshot!(print_types(
            r#"
        type T1 = readonly string[]
        type T2 = T1[number]
        type T3 = ReadonlyArray<number>
        type T4 = T3[number]
        parse.buildParsers<{ T1: T1, T2: T2, T3: T3, T4: T4 }>();
      "#
        ), @r"
        type T1 = Array<string>;

        type T2 = string;

        type T3 = Array<number>;

        type T4 = number;


        type BuiltParsers = {
          T1: T1,
          T2: T2,
          T3: T3,
          T4: T4,
        }
        ");
    }

    #[test]
    fn ok_recursive_generic_with_union_parser() {
        insta::assert_snapshot!(print_types(
            r#"
            type GenericWrapper<T> = {
              value: T;
              value2: T | boolean;
              other: null | GenericWrapper<T>;
            };

            type UsesGenericWrapper = {
              wrappedString: GenericWrapper<string>;
              wrappedNumber: GenericWrapper<number>;
            };

            parse.buildParsers<{ UsesGenericWrapper: UsesGenericWrapper }>();
      "#
        ), @r#"
        type GenericWrapper__string__ = { "other": (null | GenericWrapper__string__), "value": string, "value2": (boolean | string) };

        type GenericWrapper__number__ = { "other": (null | GenericWrapper__number__), "value": number, "value2": (boolean | number) };

        type UsesGenericWrapper = { "wrappedNumber": GenericWrapper__number__, "wrappedString": GenericWrapper__string__ };


        type BuiltParsers = {
          UsesGenericWrapper: UsesGenericWrapper,
        }
        "#);
    }

    #[test]
    fn ok_recursive_generic_parser() {
        insta::assert_snapshot!(print_types(
            r#"

            type GenericWrapper<T> = {
              value: T;
              value2: T | boolean;
              other: GenericWrapper<T>;
            };

            type UsesGenericWrapper = {
              wrappedString: GenericWrapper<string>;
              wrappedNumber: GenericWrapper<number>;
            };

            parse.buildParsers<{ UsesGenericWrapper: UsesGenericWrapper }>();
      "#
        ), @r#"
        type GenericWrapper__string__ = { "other": GenericWrapper__string__, "value": string, "value2": (boolean | string) };

        type GenericWrapper__number__ = { "other": GenericWrapper__number__, "value": number, "value2": (boolean | number) };

        type UsesGenericWrapper = { "wrappedNumber": GenericWrapper__number__, "wrappedString": GenericWrapper__string__ };


        type BuiltParsers = {
          UsesGenericWrapper: UsesGenericWrapper,
        }
        "#);
    }

    #[test]
    fn ok_recursive_generic_with_union() {
        insta::assert_snapshot!(print_cgen(
            r#"
            type GenericWrapper<T> = {
              value: T;
              value2: T | boolean;
              other: null | GenericWrapper<T>;
            };

            type UsesGenericWrapper = {
              wrappedString: GenericWrapper<string>;
              wrappedNumber: GenericWrapper<number>;
            };

            parse.buildParsers<{ UsesGenericWrapper: UsesGenericWrapper }>();
      "#
        ), @r#"
        const direct_hoist_0 = new NullishRuntype("null");
        const direct_hoist_1 = new TypeofRuntype("string");
        const direct_hoist_2 = new TypeofRuntype("boolean");
        const direct_hoist_3 = new TypeofRuntype("number");
        const namedRuntypes = {
            "GenericWrapper_string": new ObjectRuntype({
                "other": new AnyOfRuntype([
                    direct_hoist_0,
                    new RefRuntype("GenericWrapper_string")
                ]),
                "value": direct_hoist_1,
                "value2": new AnyOfRuntype([
                    direct_hoist_2,
                    direct_hoist_1
                ])
            }, []),
            "GenericWrapper_number": new ObjectRuntype({
                "other": new AnyOfRuntype([
                    direct_hoist_0,
                    new RefRuntype("GenericWrapper_number")
                ]),
                "value": direct_hoist_3,
                "value2": new AnyOfRuntype([
                    direct_hoist_2,
                    direct_hoist_3
                ])
            }, []),
            "UsesGenericWrapper": new ObjectRuntype({
                "wrappedNumber": new RefRuntype("GenericWrapper_number"),
                "wrappedString": new RefRuntype("GenericWrapper_string")
            }, [])
        };
        const buildParsersInput = {
            "UsesGenericWrapper": new RefRuntype("UsesGenericWrapper")
        };
        "#);
    }

    #[test]
    fn ok_recursive_generic() {
        insta::assert_snapshot!(print_cgen(
            r#"

            type GenericWrapper<T> = {
              value: T;
              value2: T | boolean;
              other: GenericWrapper<T>;
            };

            type UsesGenericWrapper = {
              wrappedString: GenericWrapper<string>;
              wrappedNumber: GenericWrapper<number>;
            };

            parse.buildParsers<{ UsesGenericWrapper: UsesGenericWrapper }>();
      "#
        ), @r#"
        const direct_hoist_0 = new TypeofRuntype("string");
        const direct_hoist_1 = new TypeofRuntype("boolean");
        const direct_hoist_2 = new TypeofRuntype("number");
        const namedRuntypes = {
            "GenericWrapper_string": new ObjectRuntype({
                "other": new RefRuntype("GenericWrapper_string"),
                "value": direct_hoist_0,
                "value2": new AnyOfRuntype([
                    direct_hoist_1,
                    direct_hoist_0
                ])
            }, []),
            "GenericWrapper_number": new ObjectRuntype({
                "other": new RefRuntype("GenericWrapper_number"),
                "value": direct_hoist_2,
                "value2": new AnyOfRuntype([
                    direct_hoist_1,
                    direct_hoist_2
                ])
            }, []),
            "UsesGenericWrapper": new ObjectRuntype({
                "wrappedNumber": new RefRuntype("GenericWrapper_number"),
                "wrappedString": new RefRuntype("GenericWrapper_string")
            }, [])
        };
        const buildParsersInput = {
            "UsesGenericWrapper": new RefRuntype("UsesGenericWrapper")
        };
        "#);
    }

    #[test]
    fn ok_type_application() {
        insta::assert_snapshot!(print_cgen(
            r#"

            type GenericWrapper<T> = {
              value: T;
            };

            type UsesGenericWrapper = {
              wrappedString: GenericWrapper<string>;
              wrappedNumber: GenericWrapper<number>;
            };

            parse.buildParsers<{ UsesGenericWrapper: UsesGenericWrapper }>();
      "#
        ), @r#"
        const namedRuntypes = {
            "UsesGenericWrapper": new ObjectRuntype({
                "wrappedNumber": new ObjectRuntype({
                    "value": new TypeofRuntype("number")
                }, []),
                "wrappedString": new ObjectRuntype({
                    "value": new TypeofRuntype("string")
                }, [])
            }, [])
        };
        const buildParsersInput = {
            "UsesGenericWrapper": new RefRuntype("UsesGenericWrapper")
        };
        "#);
    }
}
