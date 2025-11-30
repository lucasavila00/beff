#[cfg(test)]
mod tests {
    use beff_core::test_tools::{print_types, print_types_multifile};

    #[test]
    fn type_ref() {
        let from = r#"

    type UserId = string;
    parse.buildParsers<{ UserId: UserId }>();

  "#;
        insta::assert_snapshot!(print_types(from));
    }
    #[test]
    fn builtin_type_ref() {
        let from = r#"

    type X = Array<string>;
    parse.buildParsers<{ X: X }>();

  "#;
        insta::assert_snapshot!(print_types(from));
    }
    #[test]
    fn typeof_local() {
        let from = r#"

    const abc = "abc" as const;
    type X = typeof abc;
    parse.buildParsers<{ X: X }>();

  "#;
        insta::assert_snapshot!(print_types(from));
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
        ]));
    }

    #[test]
    fn type_ref_reuse_edge_case() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t1.ts",
                r#"
                    type X1 = string;
                    export type Z = { a:X1 }
                    type X2 = boolean;
                    export { X2 as X1 };
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { X1, Z } from "./t1";
                    parse.buildParsers<{ X1: X1, Z: Z }>();
                "#
            )
        ]));
    }

    #[test]
    fn type_ref_reuse() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t1.ts",
                r#"
                    export type X1 = string;
                    export type Z = {a:X1}
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { X1, Z } from "./t1";
                    parse.buildParsers<{ X1: X1, Z: Z }>();
                "#
            )
        ]));
    }

    #[test]
    fn export_enum() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t1.ts",
                r#"
                export enum OtherEnum {
                    A = "a",
                    B = "b",
                }

                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { OtherEnum } from "./t1";
                    parse.buildParsers<{ OtherEnum: OtherEnum, OtherEnumA:OtherEnum.A }>();
                "#
            )
        ]));
    }

    #[test]
    fn type_ref_multifile_diff_name() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t1.ts",
                r#"
                    export type X1 = string;
                    export type Z = {a:X1}
                "#,
            ),
            (
                "t2.ts",
                r#"
                    export type X2 = boolean;
                    export type W = {a:X2}
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { X1, Z } from "./t1";
                    import { X2, W } from "./t2";
                    parse.buildParsers<{ X1: X1, Z: Z, X2: X2, W: W }>();
                "#
            )
        ]));
    }

    #[test]
    fn type_ref_multifile_same_name() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t1.ts",
                r#"
                    export type X = string;
                    export type Z = {a:X}
                "#,
            ),
            (
                "t2.ts",
                r#"
                    export type X = boolean;
                    export type W = {a:X}
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { X, Z } from "./t1";
                    import { X as X2, W } from "./t2";
                    parse.buildParsers<{ X: X, Z: Z, X2: X2, W: W }>();
                "#
            )
        ]));
    }
    #[test]
    fn type_ref_multifile_same_name_visibility_collision() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t1.ts",
                r#"
                    type X = string;
                    export type Z = X[];
                    type Y = number;
                    export { Y as X };
                "#,
            ),
            (
                "t2.ts",
                r#"
                    type X = boolean;
                    export type Z = X[];
                    type Y = null;
                    export { Y as X };
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { X, Z } from "./t1";
                    import { X as X2, Z as Z2 } from "./t2";
                    parse.buildParsers<{ X: X, Z: Z, X2: X2, Z2: Z2 }>();
                "#
            )
        ]));
    }

    #[test]
    fn typeof_multifile() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    export const abc = "abc" as const;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { abc } from "./t";
                    type X = typeof abc;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn typeof_multifile_default_export() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    export default "abc" as const;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import abc from "./t";
                    type X = typeof abc;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn exort_default_type_ref() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    type Y = string;
                    export default Y;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import Y from "./t";
                    type X = Y;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn exort_default_value_identifier() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    const Y1 = "abc" as const;
                    export default Y1;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import Y2 from "./t";
                    type Z = typeof Y2;
                    parse.buildParsers<{  Z: Z }>();
                "#
            )
        ]));
    }

    #[test]
    fn exort_default_value_identifier_same_name() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    const Y = "abc" as const;
                    export default Y;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import Y from "./t";
                    type Z = typeof Y;
                    parse.buildParsers<{  Z: Z }>();
                "#
            )
        ]));
    }

    #[test]
    fn exort_default_type_and_value() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    type Y = number;
                    const Y = "abc" as const;
                    export default Y;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import Y from "./t";
                    type X = Y;
                    type Z = typeof Y;
                    parse.buildParsers<{ X: X, Z: Z }>();
                "#
            )
        ]));
    }

    #[test]
    fn typeof_export_from_other_file() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "a.ts",
                r#"
                    export const abc = "abc" as const;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export { abc } from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { abc } from "./b";
                    type X = typeof abc;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn type_export_from_other_file() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "a.ts",
                r#"
                    export type abc = "abc";
                "#,
            ),
            (
                "b.ts",
                r#"
                    export { abc } from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { abc } from "./b";
                    type X = abc;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn type_snd_value_export_from_other_file() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "a.ts",
                r#"
                    export type abc = "abc";
                    export const abc = 123 as const;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export { abc } from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { abc } from "./b";
                    type X = abc;
                    type Y = typeof abc;
                    parse.buildParsers<{ X: X, Y: Y }>();
                "#
            )
        ]));
    }

    #[test]
    fn import_star_type() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    export type Y1 = string;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Y2 from "./t";
                    type Z = Y2.Y1;
                    parse.buildParsers<{ Z: Z }>();
                "#
            )
        ]));
    }

    #[test]
    fn export_star_type_from_other_file() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "a.ts",
                r#"
                    export type Y1 = string;
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
                    import { Y1 } from "./b";
                    type Z = Y1;
                    parse.buildParsers<{ Z: Z }>();
                "#
            )
        ]));
    }

    #[test]
    fn import_star_type_from_other_file() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "a.ts",
                r#"
                    export type Y1 = string;
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
                    import * as Y2 from "./b";
                    type Z = Y2.Y1;
                    parse.buildParsers<{ Z: Z }>();
                "#
            )
        ]));
    }

    #[test]
    fn import_star_value() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    export const Y1 = "abc" as const;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as Y2 from "./t";
                    type Z = typeof Y2.Y1;
                    parse.buildParsers<{ Z: Z }>();
                "#
            )
        ]));
    }

    #[test]
    fn named_export_with_renaming() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    const A = "a" as const;
                    export { A as B };
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { B } from "./t";
                    type X = typeof B;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn named_import_with_renaming() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    export const A = "a" as const;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A as B } from "./t";
                    type X = typeof B;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn re_export_with_renaming() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "a.ts",
                r#"
                    export const A = "a" as const;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export { A as B } from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { B } from "./b";
                    type X = typeof B;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn namespace_re_export() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "a.ts",
                r#"
                    export const A = "a" as const;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export * as ns from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { ns } from "./b";
                    type X = typeof ns.A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn combined_default_and_named_import() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    export const A = "a" as const;
                    const D = "d" as const;
                    export default D;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import D, { A } from "./t";
                    type X = typeof D;
                    type Y = typeof A;
                    parse.buildParsers<{ X: X, Y: Y }>();
                "#
            )
        ]));
    }

    #[test]
    fn combined_default_and_namespace_import() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    export const A = "a" as const;
                    const D = "d" as const;
                    export default D;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import D, * as ns from "./t";
                    type X = typeof D;
                    type Y = typeof ns.A;
                    parse.buildParsers<{ X: X, Y: Y }>();
                "#
            )
        ]));
    }

    #[test]
    fn nested_qualified_type_access() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "c.ts",
                r#"
                    export type C = string;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export * as B from "./c";
                "#,
            ),
            (
                "a.ts",
                r#"
                    export * as A from "./b";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A } from "./a";
                    type X = A.B.C;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn nested_qualified_value_access() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "c.ts",
                r#"
                    export const C = "c" as const;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export * as B from "./c";
                "#,
            ),
            (
                "a.ts",
                r#"
                    export * as A from "./b";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A } from "./a";
                    type X = typeof A.B.C;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn import_star_nested_access() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "c.ts",
                r#"
                    export type C = string;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export * as B from "./c";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as A from "./b";
                    type X = A.B.C;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn import_star_nested_value_access() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "c.ts",
                r#"
                    export const C = "c" as const;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export * as B from "./c";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as A from "./b";
                    type X = typeof A.B.C;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn namespace_export_type_and_value_collision() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export type A = string;
                    export const A = "value" as const;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as NS from "./t";
                    type T = NS.A;
                    type V = typeof NS.A;
                    parse.buildParsers<{ T: T, V: V }>();
                "#
            )
        ]));
    }

    #[test]
    fn re_export_named_as_default() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    export const A = "a" as const;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export { A as default } from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import A from "./b";
                    type X = typeof A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn re_export_default_as_named() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    export default "a" as const;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export { default as A } from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A } from "./b";
                    type X = typeof A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn re_export_named_type_as_default() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    export type A = "a";
                "#,
            ),
            (
                "b.ts",
                r#"
                    export { A as default } from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import A from "./b";
                    type X = A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn re_export_default_type_as_named() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    type A = "a";
                    export default A;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export { default as A } from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A } from "./b";
                    type X = A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn export_star_aggregation() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    export type A = "a";
                "#,
            ),
            (
                "b.ts",
                r#"
                    export type B = "b";
                "#,
            ),
            (
                "all.ts",
                r#"
                    export * from "./a";
                    export * from "./b";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A, B } from "./all";
                    type X = A;
                    type Y = B;
                    parse.buildParsers<{ X: X, Y: Y }>();
                "#
            )
        ]));
    }

    #[test]
    fn circular_dependency_imports_unused() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    import { B } from "./b";
                    export type A = string;
                "#,
            ),
            (
                "b.ts",
                r#"
                    import { A } from "./a";
                    export type B = string;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A } from "./a";
                    type X = A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn export_multi_variable_decl() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export const A = "a" as const, B = "b" as const;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A, B } from "./t";
                    type X = typeof A;
                    type Y = typeof B;
                    parse.buildParsers<{ X: X, Y: Y }>();
                "#
            )
        ]));
    }

    #[test]
    fn typeof_declare_local() {
        let from = r#"
    declare const abc: "abc";
    type X = typeof abc;
    parse.buildParsers<{ X: X }>();

  "#;
        insta::assert_snapshot!(print_types(from));
    }

    #[test]
    fn export_multi_variable_ts_decl() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export declare const A: "a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A } from "./t";
                    type X = typeof A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn qualified_access_via_named_reexport_of_namespace() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    export const A = "a" as const;
                "#,
            ),
            (
                "b.ts",
                r#"
                    import * as N from "./a";
                    export { N };
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { N } from "./b";
                    type X = typeof N.A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn qualified_access_via_default_reexport_of_namespace() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    export const A = "a" as const;
                "#,
            ),
            (
                "b.ts",
                r#"
                    import * as N from "./a";
                    export default N;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import N from "./b";
                    type X = typeof N.A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn import_type_only() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export type T = string;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import type { T } from "./t";
                    type X = T;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn export_type_only() {
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
                    export type { T } from "./a";
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
        ]));
    }

    #[test]
    fn import_inline_type() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export type T = string;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { type T } from "./t";
                    type X = T;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn export_inline_type() {
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
                    export { type T } from "./a";
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
        ]));
    }

    #[test]
    fn qualified_type_from_default_import() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    export type A = string;
                "#,
            ),
            (
                "b.ts",
                r#"
                    import * as N from "./a";
                    export default N;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import N from "./b";
                    type X = N.A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn qualified_type_from_default_import_renamed() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    export type A = string;
                "#,
            ),
            (
                "b.ts",
                r#"
                    import * as N from "./a";
                    export { N as default };
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import N from "./b";
                    type X = N.A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn export_star_conflict() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    export const X = "a" as const;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export const X = "b" as const;
                "#,
            ),
            (
                "all.ts",
                r#"
                    export * from "./a";
                    export * from "./b";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { X } from "./all";
                    type T = typeof X;
                    parse.buildParsers<{ T: T }>();
                "#
            )
        ]));
    }

    #[test]
    fn qualified_access_via_named_import_object() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export const N = { A: "a" as const };
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { N } from "./t";
                    type X = typeof N.A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn qualified_access_via_default_import_object() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    const Y = { A: "a" as const };
                    export default Y;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import N from "./t";
                    type X = typeof N.A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn import_type_literal_default() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export default "a" as const;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    type X = typeof import("./t").default;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn import_type_literal_named() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export type A = "a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    type X = import("./t").A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn re_export_default_as_default() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    export default "a" as const;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export { default } from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import A from "./b";
                    type X = typeof A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn export_namespace_as_default() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    export const A = "a" as const;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export * as default from "./a";
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import N from "./b";
                    type X = typeof N.A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn import_default_as_named() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export default "a" as const;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { default as A } from "./t";
                    type X = typeof A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn export_default_object_expression() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export default { A: "a" as const };
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import O from "./t";
                    type X = typeof O.A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn import_type_syntax() {
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
                    type X = import("./t").A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn typeof_import_syntax() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export const A = "a" as const;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    type X = typeof import("./t").A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn local_named_export_as_default() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    const A = "a" as const;
                    export { A as default };
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import D from "./t";
                    type X = typeof D;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn namespace_import_access_default() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    export default "d" as const;
                    export const A = "a" as const;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import * as ns from "./t";
                    type X = typeof ns.default;
                    type Y = typeof ns.A;
                    parse.buildParsers<{ X: X, Y: Y }>();
                "#
            )
        ]));
    }

    #[test]
    fn export_star_shadowed_by_local() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "a.ts",
                r#"
                    export const A = "shadowed" as const;
                "#,
            ),
            (
                "b.ts",
                r#"
                    export * from "./a";
                    export const A = "local" as const;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { A } from "./b";
                    type X = typeof A;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn import_type_of_default_export() {
        insta::assert_snapshot!(print_types_multifile(&[
            (
                "t.ts",
                r#"
                    type T = string;
                    export default T;
                "#,
            ),
            (
                "entry.ts",
                r#"
                    type X = import("./t").default;
                    parse.buildParsers<{ X: X }>();
                "#
            )
        ]));
    }

    #[test]
    fn recursive_local_type() {
        let from = r#"
    export type X = { a: X };
    parse.buildParsers<{ X: X }>();
    "#;
        insta::assert_snapshot!(print_types_multifile(&[("entry.ts", from)]));
    }

    #[test]
    fn date_builtin() {
        let from = r#"
    export type X = Date;
    parse.buildParsers<{ X: X }>();
    "#;
        insta::assert_snapshot!(print_types_multifile(&[("entry.ts", from)]));
    }
    #[test]
    fn array_builtin() {
        let from = r#"
    export type X = Array<string>;
    parse.buildParsers<{ X: X }>();
    "#;
        insta::assert_snapshot!(print_types_multifile(&[("entry.ts", from)]));
    }
    #[test]
    fn string_fmt_builtin() {
        let from = r#"
    export type X = StringFormat<"password">;
    parse.buildParsers<{ X: X }>();
    "#;
        insta::assert_snapshot!(print_types_multifile(&[("entry.ts", from)]));
    }
    #[test]
    fn string_fmt_extends_builtin() {
        let from = r#"
    export type User = StringFormat<"User">;
    export type ReadAuthorizedUser = StringFormatExtends<User, "ReadAuthorizedUser">;
    parse.buildParsers<{ User: User, ReadAuthorizedUser: ReadAuthorizedUser }>();
    "#;
        insta::assert_snapshot!(print_types_multifile(&[("entry.ts", from)]));
    }

    #[test]
    fn number_fmt_builtin() {
        let from = r#"
    export type X = NumberFormat<"Rate">;
    parse.buildParsers<{ X: X }>();
    "#;
        insta::assert_snapshot!(print_types_multifile(&[("entry.ts", from)]));
    }
    #[test]
    fn number_fmt_extends_builtin() {
        let from = r#"
    export type NonInfiniteNumber = NumberFormat<"NonInfiniteNumber">;
    export type Rate = NumberFormatExtends<NonInfiniteNumber, "Rate">;
    parse.buildParsers<{ NonInfiniteNumber: NonInfiniteNumber, Rate: Rate }>();
    "#;
        insta::assert_snapshot!(print_types_multifile(&[("entry.ts", from)]));
    }
    #[test]
    fn type_ref_obj() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    export type X = {a:string};
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { X } from "./t";
                    type Y = {b:number};
                    parse.buildParsers<{ X: X, Y: Y }>();
                "#
            )
        ]));
    }
    #[test]
    fn interface_ref_obj() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    export interface X { a: string; };
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { X } from "./t";
                    interface Y { b: number; };
                    parse.buildParsers<{ X: X, Y: Y }>();
                "#
            )
        ]));
    }

    #[test]
    fn interface_extends_obj() {
        insta::assert_snapshot!(print_types_multifile(&[
            //
            (
                "t.ts",
                r#"
                    export interface X0 { z: boolean; };
                    export interface X extends X0 { a: string; };
                "#,
            ),
            (
                "entry.ts",
                r#"
                    import { X , X0 } from "./t";
                    interface Y extends X0 { b: number; };
                    parse.buildParsers<{ X: X, Y: Y }>();
                "#
            )
        ]));
    }

    #[test]
    fn generic_type() {
        let from = r#"
    type W<T> = { a: T };
    type X = W<string>;
    parse.buildParsers<{ X: X }>();

  "#;
        insta::assert_snapshot!(print_types(from));
    }
    // #[test]
    // fn export_destructuring_array() {
    //     insta::assert_snapshot!(print_types_multifile(&[
    //         (
    //             "t.ts",
    //             r#"
    //                 export const [ A ] = ["a" as const];
    //             "#,
    //         ),
    //         (
    //             "entry.ts",
    //             r#"
    //                 import { A } from "./t";
    //                 type X = typeof A;
    //                 parse.buildParsers<{ X: X }>();
    //             "#
    //         )
    //     ]));
    // }

    // #[test]
    // fn export_destructuring_object() {
    //     insta::assert_snapshot!(print_types_multifile(&[
    //         (
    //             "t.ts",
    //             r#"
    //                 export const { A } = { A: "a" as const };
    //             "#,
    //         ),
    //         (
    //             "entry.ts",
    //             r#"
    //                 import { A } from "./t";
    //                 type X = typeof A;
    //                 parse.buildParsers<{ X: X }>();
    //             "#
    //         )
    //     ]));
    // }

    // #[test]
    // fn interface_export() {
    //     insta::assert_snapshot!(print_types_multifile(&[
    //         //
    //         (
    //             "t.ts",
    //             r#"
    //                 export interface I { a: string; }
    //             "#,
    //         ),
    //         (
    //             "entry.ts",
    //             r#"
    //                 import { I } from "./t";
    //                 type X = I;
    //                 parse.buildParsers<{ X: X }>();
    //             "#
    //         )
    //     ]));
    // }

    // #[test]
    // fn enum_export() {
    //     insta::assert_snapshot!(print_types_multifile(&[
    //         //
    //         (
    //             "t.ts",
    //             r#"
    //                 export enum E { A = "a" }
    //             "#,
    //         ),
    //         (
    //             "entry.ts",
    //             r#"
    //                 import { E } from "./t";
    //                 type X = E;
    //                 parse.buildParsers<{ X: X }>();
    //             "#
    //         )
    //     ]));
    // }
}
