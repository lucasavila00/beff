#[cfg(test)]
mod tests {

    use beff_core::test_tools::{
        failure, print_cgen, print_cgen_multifile, print_types, print_types_multifile,
    };

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
    fn ok_partial_record_with_tpl_lit_keys() {
        let from = r#"
        type MetaKey =
            | "alpha"
            | "beta"
            | `alpha_entity_${string}`
            | `beta-entity-${string}`;

        type Meta = Partial<Record<MetaKey, string>>;

        parse.buildParsers<{ Meta: Meta }>();
    "#;
        insta::assert_snapshot!(print_types(from), @r#"
        type Meta = { "alpha"?: string, "beta"?: string, [key?: (`alpha_entity_${string}` | `beta-entity-${string}`)]: string };

        type MetaKey = ("alpha" | `alpha_entity_${string}` | "beta" | `beta-entity-${string}`);


        type BuiltParsers = {
          Meta: Meta,
        }
        "#);
    }
    #[test]
    fn ok_partial_record_string_key() {
        let from = r#"
        type Meta = Partial<Record<string, number>>;

        parse.buildParsers<{ Meta: Meta }>();
    "#;
        insta::assert_snapshot!(print_types(from), @r#"
        type Meta = { [key?: string]: number };


        type BuiltParsers = {
          Meta: Meta,
        }
        "#);
    }
    #[test]
    fn ok_partial_via_named_ref() {
        let from = r#"
        type MetaKey = `entity_${string}`;
        type MetaRecord = Record<MetaKey, string>;
        type Meta = Partial<MetaRecord>;

        parse.buildParsers<{ Meta: Meta }>();
    "#;
        insta::assert_snapshot!(print_types(from), @r#"
        type Meta = { [key?: `entity_${string}`]: string };

        type MetaKey = `entity_${string}`;

        type MetaRecord = { [key: `entity_${string}`]: string };


        type BuiltParsers = {
          Meta: Meta,
        }
        "#);
    }
    #[test]
    fn ok_readonly_record_across_files() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "entry.ts",
                r#"
                    import { CustomMetricMap } from "./metrics";

                    parse.buildParsers<{ CustomMetricMap: CustomMetricMap }>();
                "#,
            ),
            (
                "metrics.ts",
                r#"
                    export type SerializedMetricChain = {
                        id: string;
                        label: string;
                    };

                    export type CustomMetricMap = Readonly<Record<string, SerializedMetricChain>>;
                "#,
            ),
        ]), @r#"
        type CustomMetricMap = { [key: string]: SerializedMetricChain };

        type SerializedMetricChain = { "id": string, "label": string };


        type BuiltParsers = {
          CustomMetricMap: CustomMetricMap,
        }
        "#);
    }
    #[test]
    fn ok_partial_preserves_existing_optional() {
        let from = r#"
        type Base = { a: string; b?: number };
        type P = Partial<Base>;

        parse.buildParsers<{ P: P }>();
    "#;
        insta::assert_snapshot!(print_types(from), @r#"
        type Base = { "a": string, "b"?: number };

        type P = { "a"?: string, "b"?: number };


        type BuiltParsers = {
          P: P,
        }
        "#);
    }
    #[test]
    fn ok_record_mixed_literal_and_template_keys() {
        let from = r#"
        type MetaKey =
            | "alpha"
            | "beta"
            | `alpha_entity_${string}`
            | `beta-entity-${string}`;

        type Meta2 = Record<MetaKey, string>;

        parse.buildParsers<{ Meta2: Meta2 }>();
    "#;
        insta::assert_snapshot!(print_types(from), @r#"
        type Meta2 = { "alpha": string, "beta": string, [key: (`alpha_entity_${string}` | `beta-entity-${string}`)]: string };

        type MetaKey = ("alpha" | `alpha_entity_${string}` | "beta" | `beta-entity-${string}`);


        type BuiltParsers = {
          Meta2: Meta2,
        }
        "#);
    }
    #[test]
    fn ok_object_with_named_props_and_index_signature() {
        let from = r#"
        type R = { a: number, b: number, [key: `x_${string}`]: number };

        parse.buildParsers<{ R: R }>();
    "#;
        insta::assert_snapshot!(print_types(from), @r#"
        type R = { "a": number, "b": number, [key: `x_${string}`]: number };


        type BuiltParsers = {
          R: R,
        }
        "#);
    }
    #[test]
    fn ok_mapped_finite_required() {
        let from = r#"
        type R2 = { [K in 'a'|'b']: number };

        parse.buildParsers<{ R2: R2 }>();
    "#;
        insta::assert_snapshot!(print_types(from), @r#"
        type R2 = { "a": number, "b": number };


        type BuiltParsers = {
          R2: R2,
        }
        "#);
    }
    #[test]
    fn ok_mapped_finite_optional() {
        let from = r#"
        type R3 = { [K in 'a'|'b']?: number };

        parse.buildParsers<{ R3: R3 }>();
    "#;
        insta::assert_snapshot!(print_types(from), @r#"
        type R3 = { "a"?: number, "b"?: number };


        type BuiltParsers = {
          R3: R3,
        }
        "#);
    }
    #[test]
    fn ok_mapped_infinite_required() {
        let from = r#"
        type R4 = { [K in `x_${string}`]: number };

        parse.buildParsers<{ R4: R4 }>();
    "#;
        insta::assert_snapshot!(print_types(from), @r#"
        type R4 = { [key: `x_${string}`]: number };


        type BuiltParsers = {
          R4: R4,
        }
        "#);
    }
    #[test]
    fn ok_mapped_infinite_optional() {
        let from = r#"
        type R5 = { [K in `x_${string}`]?: number };

        parse.buildParsers<{ R5: R5 }>();
    "#;
        insta::assert_snapshot!(print_types(from), @r#"
        type R5 = { [key?: `x_${string}`]: number };


        type BuiltParsers = {
          R5: R5,
        }
        "#);
    }
    #[test]
    fn fail_partial_on_non_object() {
        let from = r#"
        type P = Partial<string>;

        parse.buildParsers<{ P: P }>();
    "#;
        insta::assert_snapshot!(failure(from), @r"
        Error: Should have object as type argument
           ╭─[entry.ts:2:19]
           │
         2 │         type P = Partial<string>;
           │                  ───────┬───────  
           │                         ╰───────── Should have object as type argument
        ───╯
        ");
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
        const h0=ref(R,"DiscriminatedUnion4");
        const h1=str();
        const h2=lit("a1");
        const h3=obj({a1:h1,subType:h2});
        const h4=lit("a");
        const h5=obj({a:h3,type:h4});
        const h6=lit("a2");
        const h7=obj({a2:h1,subType:h6});
        const h8=obj({a:h7,type:h4});
        const h9=union([h5,h8]);
        define(R,{DiscriminatedUnion4:h9});
        const buildParsersInput={DiscriminatedUnion4:h0};
        "#);
    }
    #[test]
    fn ok_discriminated_union_with_base_intersection() {
        insta::assert_snapshot!(print_cgen(
            r#"
        type WorkflowSourceBase = {
          id: string;
          workflowID: string;
          type: "CRON" | "EVENT";
          metadata: Record<string, unknown>;
          createdAt: string;
          updatedAt: string;
        };

        export type CronWorkflowSource = WorkflowSourceBase & {
          type: "CRON";
          cronExpression: string;
          eventName: string | undefined;
        };

        export type EventWorkflowSource = WorkflowSourceBase & {
          type: "EVENT";
          cronExpression: string | undefined;
          eventName: string;
        };

        export type WorkflowSource = CronWorkflowSource | EventWorkflowSource;

        parse.buildParsers<{ WorkflowSource: WorkflowSource }>();
      "#
        ), @r#"
        const h0=ref(R,"WorkflowSource");
        const h1=str();
        const h2=undef();
        const h3=union([h2,h1]);
        const h4=lit("CRON");
        const h5=obj({cronExpression:h1,eventName:h3,type:h4});
        const h6=ref(R,"WorkflowSourceBase");
        const h7=allOf([h5,h6]);
        const h8=lit("EVENT");
        const h9=obj({cronExpression:h3,eventName:h1,type:h8});
        const h10=allOf([h9,h6]);
        const h11=any();
        const h12=obj({},[{key:h1,value:h11}]);
        const h13=obj({createdAt:h1,cronExpression:h1,eventName:h3,id:h1,metadata:h12,type:h4,updatedAt:h1,workflowID:h1});
        const h14=obj({createdAt:h1,cronExpression:h3,eventName:h1,id:h1,metadata:h12,type:h8,updatedAt:h1,workflowID:h1});
        const h15=ref(R,"EventWorkflowSource");
        const h16=ref(R,"CronWorkflowSource");
        const h17=disc("type",{CRON:h13,EVENT:h14},[h15,h16]);
        const h18=lits(["CRON","EVENT"]);
        const h19=obj({createdAt:h1,id:h1,metadata:h12,type:h18,updatedAt:h1,workflowID:h1});
        define(R,{CronWorkflowSource:h7,EventWorkflowSource:h10,WorkflowSource:h17,WorkflowSourceBase:h19});
        const buildParsersInput={WorkflowSource:h0};
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
        const h0=ref(R,"Alias");
        const h1=str();
        define(R,{Alias:h1});
        const buildParsersInput={Dec:h0};
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
        const h0=ref(R,"Alias");
        const h1=str();
        const h2=arr(h1);
        define(R,{Alias:h2});
        const buildParsersInput={Dec:h0};
        "#);
    }

    #[test]
    fn ok_namespace_typeof_preserves_exported_const_annotations() {
        insta::assert_snapshot!(print_cgen_multifile(&[
            (
                "constants.ts",
                r#"
                    export const FOO_VALUE: string = "demo";
                    export const BAR_OPTION: "red" | "blue" = "red";
                    export const BAZ_VALUES: string[] = [];
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as constants from "./constants";

                    type KnownConstants = typeof constants;

                    parse.buildParsers<{ KnownConstants: KnownConstants }>();
                "#
            )
        ]), @r#"
        const h0=ref(R,"KnownConstants");
        const h1=lits(["blue","red"]);
        const h2=str();
        const h3=arr(h2);
        const h4=obj({BAR_OPTION:h1,BAZ_VALUES:h3,FOO_VALUE:h2});
        define(R,{KnownConstants:h4});
        const buildParsersInput={KnownConstants:h0};
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
        const h0=ref(R,"Alias");
        const h1=strFormat(["password"]);
        define(R,{Alias:h1});
        const buildParsersInput={Dec:h0};
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
        const h0=ref(R,"PassLenghts");
        const h1=num();
        const h2=strFormat(["password"]);
        const h3=obj({},[{key:h2,value:h1}]);
        define(R,{PassLenghts:h3,Password:h2});
        const buildParsersInput={PassLenghts:h0};
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
        const h0=ref(R,"PassLengthGet");
        const h1=num();
        const h2=strFormat(["password"]);
        const h3=obj({},[{key:h2,value:h1}]);
        define(R,{PassLenghts:h3,PassLengthGet:h1,Password:h2});
        const buildParsersInput={PassLengthGet:h0};
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
        const h0=ref(R,"NumberRecGet");
        const h1=str();
        const h2=obj({},[{key:numKey(),value:h1}]);
        define(R,{NumberRec:h2,NumberRecGet:h1});
        const buildParsersInput={NumberRecGet:h0};
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
        const h0=ref(R,"User");
        const h1=ref(R,"ReadAuthorizedUser");
        const h2=ref(R,"WriteAuthorizedUser");
        const h3=strFormat(["User","ReadAuthorizedUser"]);
        const h4=strFormat(["User"]);
        const h5=strFormat(["User","ReadAuthorizedUser","WriteAuthorizedUser"]);
        define(R,{ReadAuthorizedUser:h3,User:h4,WriteAuthorizedUser:h5});
        const buildParsersInput={User:h0,ReadAuthorizedUser:h1,WriteAuthorizedUser:h2};
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
        const h0=ref(R,"NonInfiniteNumber");
        const h1=ref(R,"NonNegativeNumber");
        const h2=ref(R,"Rate");
        const h3=numFormat(["NonInfiniteNumber"]);
        const h4=numFormat(["NonInfiniteNumber","NonNegativeNumber"]);
        const h5=numFormat(["NonInfiniteNumber","NonNegativeNumber","Rate"]);
        define(R,{NonInfiniteNumber:h3,NonNegativeNumber:h4,Rate:h5});
        const buildParsersInput={NonInfiniteNumber:h0,NonNegativeNumber:h1,Rate:h2};
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
        const h0=ref(R,"Alias");
        const h1=lit("some_string_const");
        define(R,{Alias:h1});
        const buildParsersInput={Dec:h0};
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
        const h0=ref(R,"Alias");
        const h1=date();
        define(R,{Alias:h1});
        const buildParsersInput={Dec:h0};
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
        const h0=ref(R,"Alias");
        const h1=regex(/^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(__)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/,"`${number}__${number}`");
        define(R,{Alias:h1});
        const buildParsersInput={Dec:h0};
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
        const h0=ref(R,"Alias");
        const h1=num();
        const h2=tuple([h1,h1]);
        define(R,{Alias:h2});
        const buildParsersInput={Dec:h0};
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
        const h0=ref(R,"Alias");
        const h1=str();
        const h2=obj({a:h1});
        define(R,{Alias:h2});
        const buildParsersInput={Dec:h0};
        "#);
    }
    #[test]
    fn ok_jsdoc_decoder_metadata() {
        insta::assert_snapshot!(print_cgen(
            r#"
        /** User payload. */
        export type Alias = {
            /** Stable user id. */
            id: string;
        }
        parse.buildParsers<{ Dec: Alias }>();
      "#
        ), @r#"
        const h0=ref(R,"Alias");
        const h1=doc(str(),"Stable user id.");
        const h2=doc(obj({id:h1}),"User payload.");
        define(R,{Alias:h2});
        const buildParsersInput={Dec:h0};
        "#);
    }
    #[test]
    fn ok_jsdoc_metadata_uses_nearest_comment() {
        insta::assert_snapshot!(print_cgen(
            r#"
        /** Old payload. */
        /** New payload. */
        export type Alias = string;
        parse.buildParsers<{ Dec: Alias }>();
      "#
        ), @r#"
        const h0=ref(R,"Alias");
        const h1=doc(str(),"New payload.");
        define(R,{Alias:h1});
        const buildParsersInput={Dec:h0};
        "#);
    }
    #[test]
    fn ok_jsdoc_metadata_ignores_non_adjacent_comment() {
        insta::assert_snapshot!(print_cgen(
            r#"
        /** Not the payload. */
        const unrelated = 1;
        export type Alias = string;
        parse.buildParsers<{ Dec: Alias }>();
      "#
        ), @r#"
        const h0=ref(R,"Alias");
        const h1=str();
        define(R,{Alias:h1});
        const buildParsersInput={Dec:h0};
        "#);
    }
    #[test]
    fn ok_jsdoc_metadata_ignores_non_jsdoc_comments() {
        insta::assert_snapshot!(print_cgen(
            r#"
        /* Plain block comment. */
        // Plain line comment.
        export type Alias = string;
        parse.buildParsers<{ Dec: Alias }>();
      "#
        ), @r#"
        const h0=ref(R,"Alias");
        const h1=str();
        define(R,{Alias:h1});
        const buildParsersInput={Dec:h0};
        "#);
    }
    #[test]
    fn ok_jsdoc_metadata_reads_export_declare_declarations() {
        insta::assert_snapshot!(print_cgen(
            r#"
        /** Declared alias. */
        export declare type Alias = string;

        /** Declared interface. */
        export declare interface Wrapper {
            value: Alias;
        }

        parse.buildParsers<{ Dec: Wrapper }>();
      "#
        ), @r#"
        const h0=ref(R,"Wrapper");
        const h1=doc(str(),"Declared alias.");
        const h2=ref(R,"Alias");
        const h3=doc(obj({value:h2}),"Declared interface.");
        define(R,{Alias:h1,Wrapper:h3});
        const buildParsersInput={Dec:h0};
        "#);
    }
    #[test]
    fn ok_jsdoc_metadata_reads_quoted_property_keys() {
        insta::assert_snapshot!(print_cgen(
            r#"
        export type Alias = {
            /** Quoted property. */
            "quoted-key": string;
        }
        parse.buildParsers<{ Dec: Alias }>();
      "#
        ), @r#"
        const h0=ref(R,"Alias");
        const h1=doc(str(),"Quoted property.");
        const h2=obj({"quoted-key":h1});
        define(R,{Alias:h2});
        const buildParsersInput={Dec:h0};
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
        const h0=ref(R,"Alias");
        const h1=str();
        const h2=num();
        const h3=union([h1,h2]);
        define(R,{Alias:h3});
        const buildParsersInput={Dec:h0};
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
        const h0=ref(R,"Alias");
        const h1=str();
        const h2=num();
        const h3=obj({a:h1,b:h2});
        define(R,{Alias:h3});
        const buildParsersInput={Dec:h0};
        "#);
    }
    #[test]
    fn ok_string_decoder2() {
        insta::assert_snapshot!(print_cgen(
            r#"
        parse.buildParsers<{ Dec: string }>();
      "#
        ), @"
        const h0=str();
        define(R,{});
        const buildParsersInput={Dec:h0};
        ");
    }

    #[test]
    fn ok_string_alias_decoder() {
        insta::assert_snapshot!(print_cgen(
            r#"
        export type Alias = string;
        parse.buildParsers<{ Dec: Alias }>();
      "#
        ), @r#"
        const h0=ref(R,"Alias");
        const h1=str();
        define(R,{Alias:h1});
        const buildParsersInput={Dec:h0};
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
        const h0=ref(R,"UsesGenericWrapper");
        const h1=nul();
        const h2=ref(R,"GenericWrapper_string");
        const h3=union([h1,h2]);
        const h4=str();
        const h5=bool();
        const h6=union([h5,h4]);
        const h7=obj({other:h3,value:h4,value2:h6});
        const h8=ref(R,"GenericWrapper_number");
        const h9=union([h1,h8]);
        const h10=num();
        const h11=union([h5,h10]);
        const h12=obj({other:h9,value:h10,value2:h11});
        const h13=obj({wrappedNumber:h8,wrappedString:h2});
        define(R,{GenericWrapper_string:h7,GenericWrapper_number:h12,UsesGenericWrapper:h13});
        const buildParsersInput={UsesGenericWrapper:h0};
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
        const h0=ref(R,"UsesGenericWrapper");
        const h1=ref(R,"GenericWrapper_string");
        const h2=str();
        const h3=bool();
        const h4=union([h3,h2]);
        const h5=obj({other:h1,value:h2,value2:h4});
        const h6=ref(R,"GenericWrapper_number");
        const h7=num();
        const h8=union([h3,h7]);
        const h9=obj({other:h6,value:h7,value2:h8});
        const h10=obj({wrappedNumber:h6,wrappedString:h1});
        define(R,{GenericWrapper_string:h5,GenericWrapper_number:h9,UsesGenericWrapper:h10});
        const buildParsersInput={UsesGenericWrapper:h0};
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
        const h0=ref(R,"UsesGenericWrapper");
        const h1=str();
        const h2=obj({value:h1});
        const h3=num();
        const h4=obj({value:h3});
        const h5=ref(R,"GenericWrapper_number");
        const h6=ref(R,"GenericWrapper_string");
        const h7=obj({wrappedNumber:h5,wrappedString:h6});
        define(R,{GenericWrapper_string:h2,GenericWrapper_number:h4,UsesGenericWrapper:h7});
        const buildParsersInput={UsesGenericWrapper:h0};
        "#);
    }

    #[test]
    fn ok_type_application_repro() {
        insta::assert_snapshot!(print_cgen(
            r#"
            export type LogicalOp = "AND" | "OR";

            export type EditableLogicalConditionsAst<T> = { _tag: "none" } | EditableLogicalConditionsAstLogicalOp<T>;
            export type EditableLogicalConditionsAstLogicalOp<T> = {
                _tag: "logical";
                op: LogicalOp;
                nodes: readonly EditableLogicalConditionsAstNode<T>[];
            };
            export type EditableLogicalConditionsAstNode<T> =
                | EditableLogicalConditionsAstLogicalOp<T>
                | EditableLogicalConditionsAstCustom<T>
                | {
                      _tag: "none";
                  };
            export type EditableLogicalConditionsAstCustom<T> = {
                _tag: "custom";
                data: T;
            };

            type X = EditableLogicalConditionsAst<string>;
            parse.buildParsers<{ X: X, }>();
      "#
        ), @r#"
        const h0=ref(R,"X");
        const h1=ref(R,"EditableLogicalConditionsAstLogicalOp_string");
        const h2=lit("none");
        const h3=obj({_tag:h2});
        const h4=disc("_tag",{logical:h1,none:h3},[h1,h3]);
        const h5=lit("custom");
        const h6=str();
        const h7=obj({_tag:h5,data:h6});
        const h8=lit("logical");
        const h9=ref(R,"EditableLogicalConditionsAstNode_string");
        const h10=arr(h9);
        const h11=ref(R,"LogicalOp");
        const h12=obj({_tag:h8,nodes:h10,op:h11});
        const h13=ref(R,"EditableLogicalConditionsAstCustom_string");
        const h14=disc("_tag",{custom:h13,logical:h1,none:h3},[h13,h1,h3]);
        const h15=lits(["AND","OR"]);
        const h16=ref(R,"EditableLogicalConditionsAst_string");
        define(R,{EditableLogicalConditionsAst_string:h4,EditableLogicalConditionsAstCustom_string:h7,EditableLogicalConditionsAstLogicalOp_string:h12,EditableLogicalConditionsAstNode_string:h14,LogicalOp:h15,X:h16});
        const buildParsersInput={X:h0};
        "#);
    }
    #[test]
    fn ok_generic_default_type_params() {
        let from = r#"
    type G<T = string> = { v: T };
    interface I<T = boolean> { v: T }
    type H<A, B = string> = { a: A, b: B };
    type P<A, B = A[]> = { a: A, b: B };
    interface Q<A, B = A[]> { a: A, b: B }
    parse.buildParsers<{
        G0: G,
        G1: G<number>,
        I0: I,
        H1: H<number>,
        H2: H<number, boolean>,
        P1: P<number>,
        Q1: Q<string>,
    }>();
  "#;
        insta::assert_snapshot!(print_types(from), @r#"
        type G = { "v": string };

        type G__number__ = { "v": number };

        type H__number__ = { "a": number, "b": string };

        type H__number_boolean__ = { "a": number, "b": boolean };

        type I = { "v": boolean };

        type P__number__ = { "a": number, "b": Array<number> };

        type Q__string__ = { "a": string, "b": Array<string> };


        type BuiltParsers = {
          G0: G,
          G1: G__number__,
          H1: H__number__,
          H2: H__number_boolean__,
          I0: I,
          P1: P__number__,
          Q1: Q__string__,
        }
        "#);
    }
    #[test]
    fn ok_proto_keys_are_computed() {
        let from = r#"
    type ProtoDiscriminated =
      | { kind: "toString"; a: string }
      | { kind: "__proto__"; c: boolean };
    type ProtoKeyObject = { __proto__: string; toString: number };
    type __proto__ = { a: string };
    parse.buildParsers<{ ProtoDiscriminated: ProtoDiscriminated, ProtoKeyObject: ProtoKeyObject, __proto__: __proto__ }>();
  "#;
        insta::assert_snapshot!(print_cgen(from), @r#"
        const h0=ref(R,"ProtoDiscriminated");
        const h1=ref(R,"ProtoKeyObject");
        const h2=ref(R,"__proto__");
        const h3=bool();
        const h4=lit("__proto__");
        const h5=obj({c:h3,kind:h4});
        const h6=str();
        const h7=lit("toString");
        const h8=obj({a:h6,kind:h7});
        const h9=disc("kind",{["__proto__"]:h5,toString:h8},[h8,h5]);
        const h10=num();
        const h11=obj({["__proto__"]:h6,toString:h10});
        const h12=obj({a:h6});
        define(R,{ProtoDiscriminated:h9,ProtoKeyObject:h11,["__proto__"]:h12});
        const buildParsersInput={ProtoDiscriminated:h0,ProtoKeyObject:h1,["__proto__"]:h2};
        "#);
    }
}
