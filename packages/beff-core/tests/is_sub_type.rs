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
}
