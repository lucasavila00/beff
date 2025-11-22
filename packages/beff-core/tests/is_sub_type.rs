#[cfg(test)]
mod tests {

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
        let res = rt_is_sub_type(&nevert, &t1, &definitions, &definitions);
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
        let res = rt_is_sub_type(&nevert, &t1, &definitions, &definitions);
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
}
