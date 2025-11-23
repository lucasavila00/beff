#[cfg(test)]
mod tests {

    use std::collections::BTreeMap;

    use beff_core::{
        ast::runtype::{Runtype, RuntypeConst},
        subtyping::{
            semtype::{SemTypeContext, SemTypeOps},
            ToSemType,
        },
        NamedSchema,
    };

    pub fn is_sub_type(
        a: &Runtype,
        b: &Runtype,
        a_validators: &[&NamedSchema],
        b_validators: &[&NamedSchema],
        ctx: &mut SemTypeContext,
    ) -> bool {
        let a = a.to_sem_type(a_validators, ctx).expect("should work");
        let b = b.to_sem_type(b_validators, ctx).expect("should work");
        a.is_subtype(&b, ctx)
    }

    fn rt_is_sub_type(
        a: &Runtype,
        b: &Runtype,
        a_validators: &[&NamedSchema],
        b_validators: &[&NamedSchema],
    ) -> bool {
        let mut ctx = SemTypeContext::new();
        is_sub_type(a, b, a_validators, b_validators, &mut ctx)
    }

    #[test]
    fn ref2() {
        let definitions = [NamedSchema {
            name: "User".into(),
            schema: Runtype::object(
                vec![
                    ("id".into(), Runtype::String.required()),
                    ("bestFriend".into(), Runtype::Ref("User".into()).required()),
                ],
                None,
            ),
        }];

        let t1 = Runtype::Ref("User".into());
        let t2 = Runtype::object(
            vec![
                ("id".into(), Runtype::String.required()),
                ("bestFriend".into(), Runtype::Null.required()),
            ],
            None,
        );

        let res = rt_is_sub_type(
            &t1,
            &t2,
            &definitions.iter().collect::<Vec<&NamedSchema>>(),
            &definitions.iter().collect::<Vec<&NamedSchema>>(),
        );
        assert!(res);
        let res = rt_is_sub_type(
            &t2,
            &t1,
            &definitions.iter().collect::<Vec<&NamedSchema>>(),
            &definitions.iter().collect::<Vec<&NamedSchema>>(),
        );
        assert!(!res);
    }
    #[test]
    fn ref1() {
        let definitions = [NamedSchema {
            name: "User".into(),
            schema: Runtype::object(
                vec![
                    ("id".into(), Runtype::String.required()),
                    ("bestFriend".into(), Runtype::Ref("User".into()).optional()),
                ],
                None,
            ),
        }];

        let t1 = Runtype::Ref("User".into());
        let t2 = Runtype::object(
            vec![
                ("id".into(), Runtype::String.required()),
                ("bestFriend".into(), Runtype::Ref("User".into()).optional()),
            ],
            None,
        );

        let res = rt_is_sub_type(
            &t1,
            &t2,
            &definitions.iter().collect::<Vec<&NamedSchema>>(),
            &definitions.iter().collect::<Vec<&NamedSchema>>(),
        );
        assert!(res);
        let res = rt_is_sub_type(
            &t2,
            &t1,
            &definitions.iter().collect::<Vec<&NamedSchema>>(),
            &definitions.iter().collect::<Vec<&NamedSchema>>(),
        );
        assert!(res);
    }
    #[test]
    fn ref3() {
        let definitions = [NamedSchema {
            name: "User".into(),
            schema: Runtype::object(
                vec![
                    ("id".into(), Runtype::String.required()),
                    ("bestFriend".into(), Runtype::Ref("User".into()).optional()),
                ],
                None,
            ),
        }];

        let t1 = Runtype::Ref("User".into());
        let t2 = Runtype::object(
            vec![
                ("id".into(), Runtype::Number.required()),
                ("bestFriend".into(), Runtype::Ref("User".into()).optional()),
            ],
            None,
        );

        let res = rt_is_sub_type(
            &t1,
            &t2,
            &definitions.iter().collect::<Vec<&NamedSchema>>(),
            &definitions.iter().collect::<Vec<&NamedSchema>>(),
        );
        assert!(!res);
        let res = rt_is_sub_type(
            &t2,
            &t1,
            &definitions.iter().collect::<Vec<&NamedSchema>>(),
            &definitions.iter().collect::<Vec<&NamedSchema>>(),
        );
        assert!(!res);
    }

    #[test]
    fn mappings4() {
        let definitions = [NamedSchema {
            name: "User".into(),
            schema: Runtype::object(
                vec![
                    ("id".into(), Runtype::String.required()),
                    ("bestFriend".into(), Runtype::Ref("User".into()).optional()),
                ],
                None,
            ),
        }];

        let t1 = Runtype::object(
            vec![
                ("a".into(), Runtype::String.required()),
                ("b".into(), Runtype::Ref("User".into()).required()),
            ],
            None,
        );
        let t2 = Runtype::object(
            vec![
                ("a".into(), Runtype::String.required()),
                ("b".into(), Runtype::Ref("User".into()).optional()),
            ],
            None,
        );

        let res = rt_is_sub_type(
            &t1,
            &t2,
            &definitions.iter().collect::<Vec<&NamedSchema>>(),
            &definitions.iter().collect::<Vec<&NamedSchema>>(),
        );
        assert!(res);
        let res = rt_is_sub_type(
            &t2,
            &t1,
            &definitions.iter().collect::<Vec<&NamedSchema>>(),
            &definitions.iter().collect::<Vec<&NamedSchema>>(),
        );
        assert!(!res);
    }

    #[test]
    fn mappings3() {
        let definitions = vec![];

        let t1 = Runtype::object(vec![("a".into(), Runtype::String.required())], None);
        let t2 = Runtype::object(vec![("a".into(), Runtype::String.optional())], None);

        let res = rt_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);
        let res = rt_is_sub_type(&t2, &t1, &definitions, &definitions);
        assert!(!res);
    }
    #[test]
    fn mappings2() {
        let definitions = vec![];

        let t1 = Runtype::object(
            vec![
                (
                    "a".into(),
                    Runtype::Const(RuntypeConst::String("abc".into())).required(),
                ),
                (
                    "b".into(),
                    Runtype::Const(RuntypeConst::String("def".into())).required(),
                ),
            ],
            None,
        );
        let t2 = Runtype::object(vec![("a".into(), Runtype::String.required())], None);

        let res = rt_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);
        let res = rt_is_sub_type(&t2, &t1, &definitions, &definitions);
        assert!(!res);
    }
    #[test]
    fn mappings() {
        let definitions = vec![];

        let t1 = Runtype::object(
            vec![(
                "a".into(),
                Runtype::Const(RuntypeConst::String("abc".into())).required(),
            )],
            None,
        );
        let t2 = Runtype::object(vec![("a".into(), Runtype::String.required())], None);

        let res = rt_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);
        let res = rt_is_sub_type(&t2, &t1, &definitions, &definitions);
        assert!(!res);
    }
    #[test]
    fn array2() {
        let definitions = vec![];

        let t1 = Runtype::Array(Runtype::Const(RuntypeConst::String("abc".into())).into());
        let t2 = Runtype::Array(Runtype::String.into());

        let res = rt_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);
        let res = rt_is_sub_type(&t2, &t1, &definitions, &definitions);
        assert!(!res);
    }

    #[test]
    fn array() {
        let definitions = vec![];

        let t1 = Runtype::Array(Runtype::String.into());
        let t2 = Runtype::Array(Runtype::String.into());

        let res = rt_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);
        let res = rt_is_sub_type(&t2, &t1, &definitions, &definitions);
        assert!(res);
    }
    #[test]
    fn array_and_tuple() {
        let definitions = vec![];

        let t1 = Runtype::Tuple {
            prefix_items: vec![Runtype::String],
            items: None,
        };
        let t2 = Runtype::Array(Runtype::String.into());

        let res = rt_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);
        let res = rt_is_sub_type(&t2, &t1, &definitions, &definitions);
        assert!(!res);
    }
    #[test]
    fn it_works_for_date() {
        let definitions = vec![];

        let t1 = Runtype::Date;
        let t2 = Runtype::Date;
        let res = rt_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);

        let others = vec![
            Runtype::String,
            Runtype::Number,
            Runtype::Null,
            Runtype::Boolean,
        ];

        for other in others {
            let res = rt_is_sub_type(&t1, &other, &definitions, &definitions);
            assert!(!res);
            let res = rt_is_sub_type(&other, &t1, &definitions, &definitions);
            assert!(!res);
        }

        let anyt = Runtype::Any;

        // every type is subtype of any
        let res = rt_is_sub_type(&t1, &anyt, &definitions, &definitions);
        assert!(res);

        // no type is subtype of never
        let nevert = Runtype::StNever;
        let res = rt_is_sub_type(&t1, &nevert, &definitions, &definitions);
        assert!(!res);
    }

    #[test]
    fn it_works_for_bigint_and_any() {
        let definitions = vec![];

        let t1 = Runtype::BigInt;

        // any type is subtype of any
        let anyt = Runtype::Any;
        let res = rt_is_sub_type(&t1, &anyt, &definitions, &definitions);
        assert!(res);
    }
    #[test]
    fn it_works_for_bigint() {
        let definitions = vec![];

        let t1 = Runtype::BigInt;
        let t2 = Runtype::BigInt;
        let res = rt_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);

        let others = vec![
            Runtype::String,
            Runtype::Number,
            Runtype::Null,
            Runtype::Boolean,
        ];

        for other in others {
            let res = rt_is_sub_type(&t1, &other, &definitions, &definitions);
            assert!(!res);
            let res = rt_is_sub_type(&other, &t1, &definitions, &definitions);
            assert!(!res);
        }

        // any type is subtype of any
        let anyt = Runtype::Any;
        let res = rt_is_sub_type(&t1, &anyt, &definitions, &definitions);
        assert!(res);

        // no type is subtype of never
        let nevert = Runtype::StNever;
        let res = rt_is_sub_type(&t1, &nevert, &definitions, &definitions);
        assert!(!res);
    }

    #[test]
    fn it_works() {
        let definitions = vec![];

        let t1 = Runtype::Null;
        let t2 = Runtype::Null;
        let res = rt_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);

        let t1 = Runtype::String;
        let t2 = Runtype::String;
        let res = rt_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);

        let t1 = Runtype::Number;
        let t2 = Runtype::Number;
        let res = rt_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);

        let t1 = Runtype::Const(RuntypeConst::Null);
        let t2 = Runtype::Null;
        let res = rt_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);

        let t1 = Runtype::Const(RuntypeConst::String("abc".into()));
        let t2 = Runtype::String;
        let res = rt_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);

        let res = rt_is_sub_type(&t2, &t1, &definitions, &definitions);
        assert!(!res);

        let t1 = Runtype::String;
        let t2 = Runtype::any_of(vec![Runtype::String, Runtype::Number]);
        let res = rt_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);
        let res = rt_is_sub_type(&t2, &t1, &definitions, &definitions);
        assert!(!res);

        let t1 = Runtype::Boolean;
        let t2 = Runtype::any_of(vec![
            Runtype::Const(RuntypeConst::Bool(true)),
            Runtype::Const(RuntypeConst::Bool(false)),
        ]);
        let res = rt_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);
        let res = rt_is_sub_type(&t2, &t1, &definitions, &definitions);
        assert!(res);

        let t1 = Runtype::StringWithFormat("password".into(), vec![]);
        let t2 = Runtype::String;
        let res = rt_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);

        let res = rt_is_sub_type(&t2, &t1, &definitions, &definitions);
        assert!(!res);
    }

    #[test]
    fn string_format_subtyping() {
        let definitions = vec![];

        let user_id_type = Runtype::StringWithFormat("user_id".into(), vec![]);
        let post_id_type = Runtype::StringWithFormat("post_id".into(), vec![]);

        let res = rt_is_sub_type(&user_id_type, &Runtype::String, &definitions, &definitions);
        assert!(res);

        let res = rt_is_sub_type(&post_id_type, &Runtype::String, &definitions, &definitions);
        assert!(res);

        let res = rt_is_sub_type(&user_id_type, &post_id_type, &definitions, &definitions);
        assert!(!res);

        let authorized_user_id_type =
            Runtype::StringWithFormat("user_id".into(), vec!["authorized".into()]);
        let res = rt_is_sub_type(
            &authorized_user_id_type,
            &user_id_type,
            &definitions,
            &definitions,
        );
        assert!(res);
    }

    #[test]
    fn string_const_subtyping() {
        let definitions = vec![];

        let const_a = Runtype::Const(RuntypeConst::String("a".into()));
        let all_strings = Runtype::String;
        let mut ctx = SemTypeContext::new();

        let const_a_st = const_a
            .to_sem_type(&definitions, &mut ctx)
            .expect("should work");
        let all_strings_st = all_strings
            .to_sem_type(&definitions, &mut ctx)
            .expect("should work");

        let diff = const_a_st.diff(&all_strings_st);

        assert!(diff.is_never());

        let union = all_strings_st.union(&const_a_st);
        assert!(union.is_same_type(&all_strings_st, &mut ctx));
    }

    #[test]
    fn string_format_extends_subtyping() {
        let definitions = vec![];

        let user_id_type = Runtype::StringWithFormat("user_id".into(), vec![]);

        let read_authorized_user_id_type =
            Runtype::StringWithFormat("user_id".into(), vec!["read_authorized".into()]);

        let write_authorized_user_id_type = Runtype::StringWithFormat(
            "user_id".into(),
            vec!["read_authorized".into(), "write_authorized".into()],
        );

        let mut ctx = SemTypeContext::new();

        let user_id_sem_type = user_id_type
            .to_sem_type(&definitions, &mut ctx)
            .expect("should work");

        let read_authorized_user_id_sem_type = read_authorized_user_id_type
            .to_sem_type(&definitions, &mut ctx)
            .expect("should work");

        let write_authorized_user_id_sem_type = write_authorized_user_id_type
            .to_sem_type(&definitions, &mut ctx)
            .expect("should work");

        let diff1 = read_authorized_user_id_sem_type.diff(&user_id_sem_type);

        assert!(diff1.is_never());

        let diff2 = user_id_sem_type.diff(&read_authorized_user_id_sem_type);

        assert!(!diff2.is_never());

        let union = user_id_sem_type.union(&read_authorized_user_id_sem_type);
        assert!(union.is_same_type(&user_id_sem_type, &mut ctx));

        let intersection = user_id_sem_type.intersect(&read_authorized_user_id_sem_type);
        assert!(intersection.is_same_type(&read_authorized_user_id_sem_type, &mut ctx));

        let intersection2 = read_authorized_user_id_sem_type.intersect(&user_id_sem_type);
        assert!(intersection2.is_same_type(&read_authorized_user_id_sem_type, &mut ctx));

        let diff3 = write_authorized_user_id_sem_type.diff(&user_id_sem_type);
        assert!(diff3.is_never());

        let diff4 = user_id_sem_type.diff(&write_authorized_user_id_sem_type);
        assert!(!diff4.is_never());

        let diff5 = write_authorized_user_id_sem_type.diff(&read_authorized_user_id_sem_type);
        assert!(diff5.is_never());

        let diff6 = read_authorized_user_id_sem_type.diff(&write_authorized_user_id_sem_type);
        assert!(!diff6.is_never());

        let union2 = user_id_sem_type.union(&write_authorized_user_id_sem_type);
        assert!(union2.is_same_type(&user_id_sem_type, &mut ctx));

        let res = rt_is_sub_type(
            &read_authorized_user_id_type,
            &user_id_type,
            &definitions,
            &definitions,
        );
        assert!(res);

        let res = rt_is_sub_type(
            &user_id_type,
            &read_authorized_user_id_type,
            &definitions,
            &definitions,
        );
        assert!(!res);
    }

    #[test]
    fn all_types_have_basic_properties() {
        let all_basic_types = vec![
            Runtype::String,
            Runtype::Number,
            Runtype::Boolean,
            Runtype::Null,
            Runtype::BigInt,
            Runtype::Date,
            Runtype::AnyArrayLike,
            Runtype::Function,
            Runtype::Object {
                vs: BTreeMap::new(),
                rest: None,
            },
        ];

        for t0 in &all_basic_types {
            let definitions = vec![];

            let t1 = t0.clone();
            let t2 = t0.clone();
            let res = rt_is_sub_type(&t1, &t2, &definitions, &definitions);
            assert!(res);

            let others = all_basic_types
                .iter()
                .filter(|x| *x != t0)
                .cloned()
                .collect::<Vec<Runtype>>();

            for other in others {
                let res = rt_is_sub_type(&t1, &other, &definitions, &definitions);
                assert!(!res);
                let res = rt_is_sub_type(&other, &t1, &definitions, &definitions);
                assert!(!res);
            }

            // any type is subtype of any
            let anyt = Runtype::Any;
            let res = rt_is_sub_type(&t1, &anyt, &definitions, &definitions);
            assert!(res);

            // no type is subtype of never
            let nevert = Runtype::StNever;
            let res = rt_is_sub_type(&t1, &nevert, &definitions, &definitions);
            assert!(!res);
        }
    }

    #[test]
    fn string_format_complex_hierarchies() {
        let definitions = vec![];

        // Create a complex permission hierarchy
        let base_id = Runtype::StringWithFormat("resource_id".into(), vec![]);
        let read_id = Runtype::StringWithFormat("resource_id".into(), vec!["read".to_string()]);
        let write_id = Runtype::StringWithFormat(
            "resource_id".into(),
            vec!["read".to_string(), "write".to_string()],
        );
        let admin_id = Runtype::StringWithFormat(
            "resource_id".into(),
            vec!["read".to_string(), "write".to_string(), "admin".to_string()],
        );

        // Test the hierarchy: admin_id ⊆ write_id ⊆ read_id ⊆ base_id
        assert!(rt_is_sub_type(
            &admin_id,
            &write_id,
            &definitions,
            &definitions
        ));
        assert!(rt_is_sub_type(
            &admin_id,
            &read_id,
            &definitions,
            &definitions
        ));
        assert!(rt_is_sub_type(
            &admin_id,
            &base_id,
            &definitions,
            &definitions
        ));

        assert!(rt_is_sub_type(
            &write_id,
            &read_id,
            &definitions,
            &definitions
        ));
        assert!(rt_is_sub_type(
            &write_id,
            &base_id,
            &definitions,
            &definitions
        ));

        assert!(rt_is_sub_type(
            &read_id,
            &base_id,
            &definitions,
            &definitions
        ));

        // Reverse relationships should not hold
        assert!(!rt_is_sub_type(
            &base_id,
            &read_id,
            &definitions,
            &definitions
        ));
        assert!(!rt_is_sub_type(
            &read_id,
            &write_id,
            &definitions,
            &definitions
        ));
        assert!(!rt_is_sub_type(
            &write_id,
            &admin_id,
            &definitions,
            &definitions
        ));
    }

    #[test]
    fn string_format_cross_type_interactions() {
        let definitions = vec![];

        let user_id = Runtype::StringWithFormat("user_id".into(), vec![]);
        let post_id = Runtype::StringWithFormat("post_id".into(), vec![]);
        let user_read = Runtype::StringWithFormat("user_id".into(), vec!["read".to_string()]);
        let post_read = Runtype::StringWithFormat("post_id".into(), vec!["read".to_string()]);

        // Different base types should not be subtypes regardless of permissions
        assert!(!rt_is_sub_type(
            &user_id,
            &post_id,
            &definitions,
            &definitions
        ));
        assert!(!rt_is_sub_type(
            &post_id,
            &user_id,
            &definitions,
            &definitions
        ));
        assert!(!rt_is_sub_type(
            &user_read,
            &post_read,
            &definitions,
            &definitions
        ));
        assert!(!rt_is_sub_type(
            &post_read,
            &user_read,
            &definitions,
            &definitions
        ));
        assert!(!rt_is_sub_type(
            &user_read,
            &post_id,
            &definitions,
            &definitions
        ));
        assert!(!rt_is_sub_type(
            &post_read,
            &user_id,
            &definitions,
            &definitions
        ));

        // But both should be subtypes of general string
        assert!(rt_is_sub_type(
            &user_id,
            &Runtype::String,
            &definitions,
            &definitions
        ));
        assert!(rt_is_sub_type(
            &post_id,
            &Runtype::String,
            &definitions,
            &definitions
        ));
        assert!(rt_is_sub_type(
            &user_read,
            &Runtype::String,
            &definitions,
            &definitions
        ));
        assert!(rt_is_sub_type(
            &post_read,
            &Runtype::String,
            &definitions,
            &definitions
        ));
    }

    #[test]
    fn string_format_union_and_intersection_operations() {
        let definitions = vec![];
        let mut ctx = SemTypeContext::new();

        let base_id = Runtype::StringWithFormat("entity_id".into(), vec![]);
        let read_id = Runtype::StringWithFormat("entity_id".into(), vec!["read".to_string()]);
        let write_id = Runtype::StringWithFormat(
            "entity_id".into(),
            vec!["read".to_string(), "write".to_string()],
        );
        let other_base = Runtype::StringWithFormat("other_id".into(), vec![]);

        let base_sem = base_id
            .to_sem_type(&definitions, &mut ctx)
            .expect("should work");
        let read_sem = read_id
            .to_sem_type(&definitions, &mut ctx)
            .expect("should work");
        let write_sem = write_id
            .to_sem_type(&definitions, &mut ctx)
            .expect("should work");
        let other_sem = other_base
            .to_sem_type(&definitions, &mut ctx)
            .expect("should work");

        // Union of specific with general should be general
        let union_read_base = read_sem.union(&base_sem);
        assert!(union_read_base.is_same_type(&base_sem, &mut ctx));

        let union_write_base = write_sem.union(&base_sem);
        assert!(union_write_base.is_same_type(&base_sem, &mut ctx));

        // Intersection of specific with general should be specific
        let intersect_read_base = read_sem.intersect(&base_sem);
        assert!(intersect_read_base.is_same_type(&read_sem, &mut ctx));

        let intersect_write_base = write_sem.intersect(&base_sem);
        assert!(intersect_write_base.is_same_type(&write_sem, &mut ctx));

        // Union of unrelated formats should contain both
        let union_base_other = base_sem.union(&other_sem);
        assert!(!union_base_other.is_same_type(&base_sem, &mut ctx));
        assert!(!union_base_other.is_same_type(&other_sem, &mut ctx));

        // Intersection of unrelated formats should be never
        let intersect_base_other = base_sem.intersect(&other_sem);
        assert!(intersect_base_other.is_never());
    }

    #[test]
    fn string_format_with_literals() {
        let definitions = vec![];
        let mut ctx = SemTypeContext::new();

        let format_id = Runtype::StringWithFormat("id".into(), vec![]);
        let literal_abc = Runtype::Const(RuntypeConst::String("abc".into()));
        let literal_def = Runtype::Const(RuntypeConst::String("def".into()));

        let format_sem = format_id
            .to_sem_type(&definitions, &mut ctx)
            .expect("should work");
        let literal_abc_sem = literal_abc
            .to_sem_type(&definitions, &mut ctx)
            .expect("should work");
        let literal_def_sem = literal_def
            .to_sem_type(&definitions, &mut ctx)
            .expect("should work");

        // Literals should not be subtypes of formats (they're different string types)
        assert!(!literal_abc_sem.is_subtype(&format_sem, &mut ctx));
        assert!(!format_sem.is_subtype(&literal_abc_sem, &mut ctx));

        // Union should contain both
        let union = format_sem.union(&literal_abc_sem);
        assert!(!union.is_same_type(&format_sem, &mut ctx));
        assert!(!union.is_same_type(&literal_abc_sem, &mut ctx));

        // Intersection should be never
        let intersection = format_sem.intersect(&literal_abc_sem);
        assert!(intersection.is_never());

        // Union of two literals
        let literal_union = literal_abc_sem.union(&literal_def_sem);
        assert!(!literal_union.is_same_type(&literal_abc_sem, &mut ctx));
        assert!(!literal_union.is_same_type(&literal_def_sem, &mut ctx));
    }

    #[test]
    fn string_format_branching_permissions() {
        let definitions = vec![];

        // Create branching permission structure
        let base = Runtype::StringWithFormat("resource".into(), vec![]);
        let read_branch = Runtype::StringWithFormat("resource".into(), vec!["read".to_string()]);
        let write_branch = Runtype::StringWithFormat("resource".into(), vec!["write".to_string()]);
        let read_write = Runtype::StringWithFormat(
            "resource".into(),
            vec!["read".to_string(), "write".to_string()],
        );
        let write_read = Runtype::StringWithFormat(
            "resource".into(),
            vec!["write".to_string(), "read".to_string()],
        );

        // Both read_write and write_read should be subtypes of base
        assert!(rt_is_sub_type(
            &read_write,
            &base,
            &definitions,
            &definitions
        ));
        assert!(rt_is_sub_type(
            &write_read,
            &base,
            &definitions,
            &definitions
        ));

        // Order matters in the permissions - read_write should extend read_branch but not write_branch
        assert!(rt_is_sub_type(
            &read_write,
            &read_branch,
            &definitions,
            &definitions
        ));
        assert!(!rt_is_sub_type(
            &read_write,
            &write_branch,
            &definitions,
            &definitions
        ));

        // write_read should extend write_branch but not read_branch
        assert!(rt_is_sub_type(
            &write_read,
            &write_branch,
            &definitions,
            &definitions
        ));
        assert!(!rt_is_sub_type(
            &write_read,
            &read_branch,
            &definitions,
            &definitions
        ));

        // read_write and write_read should not be subtypes of each other
        assert!(!rt_is_sub_type(
            &read_write,
            &write_read,
            &definitions,
            &definitions
        ));
        assert!(!rt_is_sub_type(
            &write_read,
            &read_write,
            &definitions,
            &definitions
        ));
    }

    #[test]
    fn number_format_basic_operations() {
        let definitions = vec![];
        let mut ctx = SemTypeContext::new();

        let base_amount = Runtype::NumberWithFormat("amount".into(), vec![]);
        let usd_amount = Runtype::NumberWithFormat("amount".into(), vec!["USD".to_string()]);
        let precise_usd = Runtype::NumberWithFormat(
            "amount".into(),
            vec!["USD".to_string(), "precise".to_string()],
        );
        let other_format = Runtype::NumberWithFormat("price".into(), vec![]);

        // Test subtype relationships
        assert!(rt_is_sub_type(
            &usd_amount,
            &base_amount,
            &definitions,
            &definitions
        ));
        assert!(rt_is_sub_type(
            &precise_usd,
            &base_amount,
            &definitions,
            &definitions
        ));
        assert!(rt_is_sub_type(
            &precise_usd,
            &usd_amount,
            &definitions,
            &definitions
        ));

        assert!(!rt_is_sub_type(
            &base_amount,
            &usd_amount,
            &definitions,
            &definitions
        ));
        assert!(!rt_is_sub_type(
            &usd_amount,
            &precise_usd,
            &definitions,
            &definitions
        ));

        // Different base formats should not be subtypes
        assert!(!rt_is_sub_type(
            &usd_amount,
            &other_format,
            &definitions,
            &definitions
        ));
        assert!(!rt_is_sub_type(
            &other_format,
            &usd_amount,
            &definitions,
            &definitions
        ));

        // All should be subtypes of general number type
        assert!(rt_is_sub_type(
            &base_amount,
            &Runtype::Number,
            &definitions,
            &definitions
        ));
        assert!(rt_is_sub_type(
            &usd_amount,
            &Runtype::Number,
            &definitions,
            &definitions
        ));
        assert!(rt_is_sub_type(
            &precise_usd,
            &Runtype::Number,
            &definitions,
            &definitions
        ));

        // Test semantic operations
        let base_sem = base_amount
            .to_sem_type(&definitions, &mut ctx)
            .expect("should work");
        let usd_sem = usd_amount
            .to_sem_type(&definitions, &mut ctx)
            .expect("should work");
        let other_sem = other_format
            .to_sem_type(&definitions, &mut ctx)
            .expect("should work");

        // Union of specific with general should be general
        let union = usd_sem.union(&base_sem);
        assert!(union.is_same_type(&base_sem, &mut ctx));

        // Intersection of different formats should be never
        let intersection = base_sem.intersect(&other_sem);
        assert!(intersection.is_never());
    }

    #[test]
    fn number_format_with_literals() {
        let definitions = vec![];
        let mut ctx = SemTypeContext::new();

        let format_amount = Runtype::NumberWithFormat("amount".into(), vec![]);
        let literal_42 = Runtype::Const(RuntypeConst::Number(beff_core::ast::json::N::parse_f64(
            42.0,
        )));
        let literal_100 = Runtype::Const(RuntypeConst::Number(beff_core::ast::json::N::parse_f64(
            100.0,
        )));

        let format_sem = format_amount
            .to_sem_type(&definitions, &mut ctx)
            .expect("should work");
        let literal_42_sem = literal_42
            .to_sem_type(&definitions, &mut ctx)
            .expect("should work");
        let literal_100_sem = literal_100
            .to_sem_type(&definitions, &mut ctx)
            .expect("should work");

        // Literals should not be subtypes of formats
        assert!(!literal_42_sem.is_subtype(&format_sem, &mut ctx));
        assert!(!format_sem.is_subtype(&literal_42_sem, &mut ctx));

        // Union should contain both
        let union = format_sem.union(&literal_42_sem);
        assert!(!union.is_same_type(&format_sem, &mut ctx));
        assert!(!union.is_same_type(&literal_42_sem, &mut ctx));

        // Intersection should be never
        let intersection = format_sem.intersect(&literal_42_sem);
        assert!(intersection.is_never());

        // Union of two literals
        let literal_union = literal_42_sem.union(&literal_100_sem);
        assert!(!literal_union.is_same_type(&literal_42_sem, &mut ctx));
        assert!(!literal_union.is_same_type(&literal_100_sem, &mut ctx));
    }
}
