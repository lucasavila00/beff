#[cfg(test)]
mod tests {
    use beff_core::test_tools::{print_cgen, print_types, print_types_multifile};

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
    fn interface_generic() {
        let from = r#"

    interface User<T> { id: T }
    type UserStringId = User<string>;
    parse.buildParsers<{ UserStringId: UserStringId }>();

  "#;
        insta::assert_snapshot!(print_types(from), @r#"
        type User__string__ = { "id": string };

        type UserStringId = User__string__;


        type BuiltParsers = {
          UserStringId: UserStringId,
        }
        "#);
    }

    #[test]
    fn interface_extends_generic() {
        let from = r#"

    interface Identified<T> { id: T }

    interface Dated<T> {
      createdAt: T;
      updatedAt: T;
    }

    interface UserWithData extends Identified<string>, Dated<Date> {
      data: string;
    }
    parse.buildParsers<{ UserWithData: UserWithData }>();

  "#;
        insta::assert_snapshot!(print_types(from), @r#"
        type Dated__Date__ = { "createdAt": Date, "updatedAt": Date };

        type Identified__string__ = { "id": string };

        type UserWithData = { "createdAt": Date, "data": string, "id": string, "updatedAt": Date };


        type BuiltParsers = {
          UserWithData: UserWithData,
        }
        "#);
    }

    #[test]
    fn interface_extends_generic_recursive() {
        let from = r#"

    interface Identified<T> { id: T, next: Identified<T> | null }

    interface Dated<T> {
      createdAt: T;
      updatedAt: T;
      next: Dated<T> | null;
    }

    interface UserWithData<D> extends Identified<string>, Dated<Date> {
      data: D;
      next: UserWithData<D> | null;
    }
    parse.buildParsers<{ UserWithData: UserWithData<{x: boolean}> }>();

  "#;
        insta::assert_snapshot!(print_types(from), @r#"
        type Dated__Date__ = { "createdAt": Date, "next": (null | Dated__Date__), "updatedAt": Date };

        type Identified__string__ = { "id": string, "next": (null | Identified__string__) };

        type UserWithData_____x___boolean____ = ({ "data": { "x": boolean }, "next": (null | UserWithData_____x___boolean____) } & Dated__Date__ & Identified__string__);


        type BuiltParsers = {
          UserWithData: UserWithData_____x___boolean____,
        }
        "#);
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

    #[test]
    fn export_default_value() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export default "hello";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import D from "./t";
                    type T = typeof D;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        type T = string;


        type BuiltParsers = {
          T: T,
        }
        ");
    }

    #[test]
    fn re_export_star_value() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    export const A = "abc" as const;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export * from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A } from "./b";
                    parse.buildParsers<{ A: typeof A }>();
                "#
            )
        ]), @r#"
        type BuiltParsers = {
          A: "abc",
        }
        "#);
    }

    #[test]
    fn enum_member_value_access() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export enum E { A = "a" }
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { E } from "./t";
                    parse.buildParsers<{ E: E }>();
                "#
            )
        ]), @r#"
        type E = "a";


        type BuiltParsers = {
          E: E,
        }
        "#);
    }

    #[test]
    fn namespace_import_value_access() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export const A = "a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    parse.buildParsers<{ A: typeof Ns.A }>();
                "#
            )
        ]), @r"
        type BuiltParsers = {
          A: string,
        }
        ");
    }

    #[test]
    fn typeof_object_literal_key() {
        insta::assert_snapshot!(print_types(r#"
            const obj = { a: "hello" };
            export type T = typeof obj["a"];
            parse.buildParsers<{ T: T }>();
        "#), @r"
        type T = string;


        type BuiltParsers = {
          T: T,
        }
        ");
    }

    #[test]
    fn tuple_rest() {
        insta::assert_snapshot!(print_types(r#"
            export type T = [string, ...number[]];
            parse.buildParsers<{ T: T }>();
        "#), @r"
        type T = [string, ...number];


        type BuiltParsers = {
          T: T,
        }
        ");
    }

    #[test]
    fn import_type_qualifier() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export type A = string;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    export type T = import("./t").A;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        type T = A;

        type A = string;


        type BuiltParsers = {
          T: T,
        }
        ");
    }

    #[test]
    fn circular_type_alias() {
        insta::assert_snapshot!(print_types(r#"
            type T = T;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        type T = T;


        type BuiltParsers = {
          T: T,
        }
        ");
    }
    #[test]
    fn import_default_type() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export type A = string;
                    export default A;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import T from "./t";
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        type A = string;


        type BuiltParsers = {
          T: A,
        }
        ");
    }

    #[test]
    fn import_type_no_qualifier() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export type A = string;
                    export default A;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    type T = import("./t");
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        type T = string;


        type BuiltParsers = {
          T: T,
        }
        ");
    }

    #[test]
    fn typeof_import_no_qualifier() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export default "abc" as const;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    export type T = typeof import("./t");
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        type T = "abc";


        type BuiltParsers = {
          T: T,
        }
        "#);
    }

    #[test]
    fn typeof_object_literal_prop() {
        insta::assert_snapshot!(print_types(r#"
            const obj = { a: "hello" };
            export type T = typeof obj.a;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        type T = string;


        type BuiltParsers = {
          T: T,
        }
        ");
    }

    #[test]
    fn export_default_object() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export default { a: "hello" };
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import D from "./t";
                    type T = typeof D.a;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        type T = string;


        type BuiltParsers = {
          T: T,
        }
        ");
    }

    #[test]
    fn typeof_enum_in_namespace() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export enum E { A = "a" }
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    export type T = typeof Ns.E;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        type T = "a";


        type BuiltParsers = {
          T: T,
        }
        "#);
    }

    #[test]
    fn typeof_nested_object_literal_prop() {
        insta::assert_snapshot!(print_types(r#"
            const obj = { a: { b: "hello" } };
            export type T = typeof obj.a.b;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        type T = string;


        type BuiltParsers = {
          T: T,
        }
        ");
    }

    #[test]
    fn typeof_nested_object_literal_prop_as_const1() {
        insta::assert_snapshot!(print_types(r#"
            const obj = { a: { b: "hello" as const } };
            export type T = typeof obj.a.b;
            parse.buildParsers<{ T: T }>();
        "#), @r#"
        type T = "hello";


        type BuiltParsers = {
          T: T,
        }
        "#);
    }
    #[test]
    fn typeof_nested_object_literal_prop_as_const2() {
        insta::assert_snapshot!(print_types(r#"
            const obj = { a: { b: "hello"  } as const };
            export type T = typeof obj.a.b;
            parse.buildParsers<{ T: T }>();
        "#), @r#"
        type T = "hello";


        type BuiltParsers = {
          T: T,
        }
        "#);
    }
    #[test]
    fn typeof_nested_object_literal_prop_as_const3() {
        insta::assert_snapshot!(print_types(r#"
            const obj = { a: { b: "hello"  }  }as const ;
            export type T = typeof obj.a.b;
            parse.buildParsers<{ T: T }>();
        "#), @r#"
        type T = "hello";


        type BuiltParsers = {
          T: T,
        }
        "#);
    }

    #[test]
    fn typeof_nested_object_literal_prop_cgen() {
        insta::assert_snapshot!(print_cgen(r#"
            const obj = { a: { b: "hello" } };
            export type T = typeof obj.a.b;
            parse.buildParsers<{ T: T }>();
        "#), @r#"
        const direct_hoist_0 = new RefRuntype("T");
        const direct_hoist_1 = new TypeofRuntype("string");
        const namedRuntypes = {
            "T": direct_hoist_1
        };
        const buildParsersInput = {
            "T": direct_hoist_0
        };
        "#);
    }

    #[test]
    fn qualified_access_type_alias() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export type A = string;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    export type T = Ns.A;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        type T = A;

        type A = string;


        type BuiltParsers = {
          T: T,
        }
        ");
    }

    #[test]
    fn qualified_access_interface() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export interface I { a: string }
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    export type T = Ns.I;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        type T = I;

        type I = { "a": string };


        type BuiltParsers = {
          T: T,
        }
        "#);
    }

    #[test]
    fn typeof_qualified_export_const() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export const C = "c";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    export type T = typeof Ns.C;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        type T = string;


        type BuiltParsers = {
          T: T,
        }
        ");
    }

    #[test]
    fn typeof_qualified_reexport() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    export const A = "a";
                "#,
            ),
            (
                "t.ts",
                r#"
                    export { A } from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    export type T = typeof Ns.A;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        type T = string;


        type BuiltParsers = {
          T: T,
        }
        ");
    }
    #[test]
    fn qualified_access_on_enum() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export enum E { A = "a" }
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { E } from "./t";
                    parse.buildParsers<{ T: typeof E.A }>();
                "#
            )
        ]), @r#"
        type BuiltParsers = {
          T: "a",
        }
        "#);
    }

    #[test]
    fn typeof_on_type_decl_property() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export declare const A: { b: string };
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A } from "./t";
                    type T = typeof A.b;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        type T = string;


        type BuiltParsers = {
          T: T,
        }
        ");
    }

    #[test]
    fn re_export_named_value_qualified() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    export const A = { b: "hello" } as const;
                "#,
            ),
            (
                "t.ts",
                r#"
                    export { A } from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    type T = typeof Ns.A.b;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        type T = "hello";


        type BuiltParsers = {
          T: T,
        }
        "#);
    }

    #[test]
    fn re_export_star_type() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    export type T = string;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export * from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { T } from "./b";
                    type X = T;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]), @r"
        type T = string;

        type X = T;


        type BuiltParsers = {
          X: X,
        }
        ");
    }

    #[test]
    fn typeof_import_qualifier() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export const A = "a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    type T = typeof import("./t").A;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        type T = string;


        type BuiltParsers = {
          T: T,
        }
        ");
    }

    #[test]
    fn qualified_enum_as_value() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export enum E { A = "a" }
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    const x = Ns.E;
                    parse.buildParsers<{ x: typeof x }>();
                "#
            )
        ]), @r#"
        type BuiltParsers = {
          x: "a",
        }
        "#);
    }

    #[test]
    fn typeof_qualified_local_declared_value() {
        insta::assert_snapshot!(print_types(r#"
            declare const A: { b: string };
            type T = typeof A.b;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        type T = string;


        type BuiltParsers = {
          T: T,
        }
        ");
    }

    #[test]
    fn value_walker_import_star() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export const A = "a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    const x = Ns;
                    type T = typeof x.A;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        type T = string;


        type BuiltParsers = {
          T: T,
        }
        ");
    }

    #[test]
    fn namespace_as_value() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export const A = "a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    const v = Ns;
                    export type T = typeof v;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        type T = { "A": string };


        type BuiltParsers = {
          T: T,
        }
        "#);
    }

    #[test]
    fn namespace_as_value_ref() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export const A = 1;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    const v = Ns;
                    export type T = typeof v;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        type T = { "A": number };


        type BuiltParsers = {
          T: T,
        }
        "#);
    }

    #[test]
    fn star_import_as_value() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export const A = 1;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    const V = Ns;
                    parse.buildParsers<{ V: typeof V }>();
                "#
            )
        ]), @r#"
        type BuiltParsers = {
          V: { "A": number },
        }
        "#);
    }

    #[test]
    fn qualified_declare_const() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export declare const A: { b: string };
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    type T = typeof Ns.A.b;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r"
        type T = string;


        type BuiltParsers = {
          T: T,
        }
        ");
    }
    #[test]
    fn import_star_as_value() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export const A = 1;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    const x = Ns;
                    parse.buildParsers<{ x: typeof x }>();
                "#
            )
        ]), @r#"
        type BuiltParsers = {
          x: { "A": number },
        }
        "#);
    }
    #[test]
    fn typeof_qualified_value_expr_deeper_failure() {
        insta::assert_snapshot!(print_types(r#"
            const obj = {a:{b:{c:{d:{x: 123}}}}}
            export type T = typeof obj.a.b.c.d.e;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        type T = never;


        type BuiltParsers = {
          T: T,
        }
        ");
    }
    #[test]
    fn typeof_qualified_value_expr_deep_failure() {
        insta::assert_snapshot!(print_types(r#"
            const obj = { a: { b: 1 } };
            export type T = typeof obj.a.c;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        type T = never;


        type BuiltParsers = {
          T: T,
        }
        ");
    }
    #[test]
    fn typeof_keyed_access_on_non_object() {
        insta::assert_snapshot!(print_types(r#"
            const A = 1;
            export type T = typeof A["a"];
            parse.buildParsers<{ T: T }>();
        "#), @r"
        type T = never;


        type BuiltParsers = {
          T: T,
        }
        ");
    }
    #[test]
    fn typeof_keyed_access_missing_key() {
        insta::assert_snapshot!(print_types(r#"
            const A = { x: 1 };
            export type T = typeof A["y"];
            parse.buildParsers<{ T: T }>();
        "#), @r"
        type T = never;


        type BuiltParsers = {
          T: T,
        }
        ");
    }
    #[test]
    fn access_property_on_primitive() {
        insta::assert_snapshot!(print_types(r#"
            const A = 1;
            export type T = typeof A.B;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        type T = never;


        type BuiltParsers = {
          T: T,
        }
        ");
    }
    #[test]
    fn access_missing_property_on_object() {
        insta::assert_snapshot!(print_types(r#"
            const A = { x: 1 };
            export type T = typeof A.y;
            parse.buildParsers<{ T: T }>();
        "#), @r"
        type T = never;


        type BuiltParsers = {
          T: T,
        }
        ");
    }

    #[test]
    fn reexport_star_as_value() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "other.ts",
                r#"
                    export const A = 1;
                "#,
            ),
            (
                "t.ts",
                r#"
                    export * as Ns from "./other";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { Ns } from "./t";
                    const x = Ns;
                    parse.buildParsers<{ x: typeof x }>();
                "#
            )
        ]), @r#"
        type BuiltParsers = {
          x: { "A": number },
        }
        "#);
    }

    #[test]
    fn import_star_as_value_direct() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export const A = 1;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Ns from "./t";
                    parse.buildParsers<{ x: typeof Ns }>();
                "#
            )
        ]), @r#"
        type BuiltParsers = {
          x: { "A": number },
        }
        "#);
    }
    #[test]
    fn import_type_generic() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export type User<T> = { id: T };
                "#,
            ),
            (
                "entry.ts",
                r#"
                    export type T = import("./t").User<string>;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        type T = User__string__;

        type User__string__ = { "id": string };


        type BuiltParsers = {
          T: T,
        }
        "#);
    }
    #[test]
    fn import_type_generic2() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    type User<T> = { id: T };
                    export default User;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    export type T = import("./t")<string>;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]), @r#"
        type T = { "id": string };


        type BuiltParsers = {
          T: T,
        }
        "#);
    }
}
