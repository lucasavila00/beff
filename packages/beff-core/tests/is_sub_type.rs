#[cfg(test)]
mod tests {

    use beff_core::{
        ast::json_schema::{JsonSchema, JsonSchemaConst},
        subtyping::{
            semtype::{SemTypeContext, SemTypeOps},
            ToSemType,
        },
        Validator,
    };

    pub fn is_sub_type(
        a: &JsonSchema,
        b: &JsonSchema,
        a_validators: &[&Validator],
        b_validators: &[&Validator],
        ctx: &mut SemTypeContext,
    ) -> bool {
        let a = a.to_sem_type(a_validators, ctx).unwrap();
        let b = b.to_sem_type(b_validators, ctx).unwrap();
        return a.is_subtype(&b, ctx);
    }

    fn schema_is_sub_type(
        a: &JsonSchema,
        b: &JsonSchema,
        a_validators: &[&Validator],
        b_validators: &[&Validator],
    ) -> bool {
        let mut ctx = SemTypeContext::new();
        return is_sub_type(a, b, a_validators, b_validators, &mut ctx);
    }

    #[test]
    fn ref2() {
        let definitions = vec![Validator {
            name: "User".into(),
            schema: JsonSchema::object(
                vec![
                    ("id".into(), JsonSchema::String.required()),
                    (
                        "bestFriend".into(),
                        JsonSchema::Ref("User".into()).required(),
                    ),
                ],
                JsonSchema::Any.into(),
            ),
        }];

        let t1 = JsonSchema::Ref("User".into());
        let t2 = JsonSchema::object(
            vec![
                ("id".into(), JsonSchema::String.required()),
                ("bestFriend".into(), JsonSchema::Null.required()),
            ],
            JsonSchema::Any.into(),
        );

        let res = schema_is_sub_type(
            &t1,
            &t2,
            &definitions.iter().collect::<Vec<&Validator>>(),
            &definitions.iter().collect::<Vec<&Validator>>(),
        );
        assert!(res);
        let res = schema_is_sub_type(
            &t2,
            &t1,
            &definitions.iter().collect::<Vec<&Validator>>(),
            &definitions.iter().collect::<Vec<&Validator>>(),
        );
        assert!(!res);
    }
    #[test]
    fn ref1() {
        let definitions = vec![Validator {
            name: "User".into(),
            schema: JsonSchema::object(
                vec![
                    ("id".into(), JsonSchema::String.required()),
                    (
                        "bestFriend".into(),
                        JsonSchema::Ref("User".into()).optional(),
                    ),
                ],
                JsonSchema::Any.into(),
            ),
        }];

        let t1 = JsonSchema::Ref("User".into());
        let t2 = JsonSchema::object(
            vec![
                ("id".into(), JsonSchema::String.required()),
                (
                    "bestFriend".into(),
                    JsonSchema::Ref("User".into()).optional(),
                ),
            ],
            JsonSchema::Any.into(),
        );

        let res = schema_is_sub_type(
            &t1,
            &t2,
            &definitions.iter().collect::<Vec<&Validator>>(),
            &definitions.iter().collect::<Vec<&Validator>>(),
        );
        assert!(res);
        let res = schema_is_sub_type(
            &t2,
            &t1,
            &definitions.iter().collect::<Vec<&Validator>>(),
            &definitions.iter().collect::<Vec<&Validator>>(),
        );
        assert!(res);
    }
    #[test]
    fn ref3() {
        let definitions = vec![Validator {
            name: "User".into(),
            schema: JsonSchema::object(
                vec![
                    ("id".into(), JsonSchema::String.required()),
                    (
                        "bestFriend".into(),
                        JsonSchema::Ref("User".into()).optional(),
                    ),
                ],
                JsonSchema::Any.into(),
            ),
        }];

        let t1 = JsonSchema::Ref("User".into());
        let t2 = JsonSchema::object(
            vec![
                ("id".into(), JsonSchema::Number.required()),
                (
                    "bestFriend".into(),
                    JsonSchema::Ref("User".into()).optional(),
                ),
            ],
            JsonSchema::Any.into(),
        );

        let res = schema_is_sub_type(
            &t1,
            &t2,
            &definitions.iter().collect::<Vec<&Validator>>(),
            &definitions.iter().collect::<Vec<&Validator>>(),
        );
        assert!(!res);
        let res = schema_is_sub_type(
            &t2,
            &t1,
            &definitions.iter().collect::<Vec<&Validator>>(),
            &definitions.iter().collect::<Vec<&Validator>>(),
        );
        assert!(!res);
    }

    #[test]
    fn mappings4() {
        let definitions = vec![Validator {
            name: "User".into(),
            schema: JsonSchema::object(
                vec![
                    ("id".into(), JsonSchema::String.required()),
                    (
                        "bestFriend".into(),
                        JsonSchema::Ref("User".into()).optional(),
                    ),
                ],
                JsonSchema::Any.into(),
            ),
        }];

        let t1 = JsonSchema::object(
            vec![
                ("a".into(), JsonSchema::String.required()),
                ("b".into(), JsonSchema::Ref("User".into()).required()),
            ],
            JsonSchema::Any.into(),
        );
        let t2 = JsonSchema::object(
            vec![
                ("a".into(), JsonSchema::String.required()),
                ("b".into(), JsonSchema::Ref("User".into()).optional()),
            ],
            JsonSchema::Any.into(),
        );

        let res = schema_is_sub_type(
            &t1,
            &t2,
            &definitions.iter().collect::<Vec<&Validator>>(),
            &definitions.iter().collect::<Vec<&Validator>>(),
        );
        assert!(res);
        let res = schema_is_sub_type(
            &t2,
            &t1,
            &definitions.iter().collect::<Vec<&Validator>>(),
            &definitions.iter().collect::<Vec<&Validator>>(),
        );
        assert!(!res);
    }

    #[test]
    fn mappings3() {
        let definitions = vec![];

        let t1 = JsonSchema::object(
            vec![("a".into(), JsonSchema::String.required())],
            JsonSchema::Any.into(),
        );
        let t2 = JsonSchema::object(
            vec![("a".into(), JsonSchema::String.optional())],
            JsonSchema::Any.into(),
        );

        let res = schema_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);
        let res = schema_is_sub_type(&t2, &t1, &definitions, &definitions);
        assert!(!res);
    }
    #[test]
    fn mappings2() {
        let definitions = vec![];

        let t1 = JsonSchema::object(
            vec![
                (
                    "a".into(),
                    JsonSchema::Const(JsonSchemaConst::String("abc".into())).required(),
                ),
                (
                    "b".into(),
                    JsonSchema::Const(JsonSchemaConst::String("def".into())).required(),
                ),
            ],
            JsonSchema::Any.into(),
        );
        let t2 = JsonSchema::object(
            vec![("a".into(), JsonSchema::String.required())],
            JsonSchema::Any.into(),
        );

        let res = schema_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);
        let res = schema_is_sub_type(&t2, &t1, &definitions, &definitions);
        assert!(!res);
    }
    #[test]
    fn mappings() {
        let definitions = vec![];

        let t1 = JsonSchema::object(
            vec![(
                "a".into(),
                JsonSchema::Const(JsonSchemaConst::String("abc".into())).required(),
            )],
            JsonSchema::Any.into(),
        );
        let t2 = JsonSchema::object(
            vec![("a".into(), JsonSchema::String.required())],
            JsonSchema::Any.into(),
        );

        let res = schema_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);
        let res = schema_is_sub_type(&t2, &t1, &definitions, &definitions);
        assert!(!res);
    }
    #[test]
    fn array2() {
        let definitions = vec![];

        let t1 = JsonSchema::Array(JsonSchema::Const(JsonSchemaConst::String("abc".into())).into());
        let t2 = JsonSchema::Array(JsonSchema::String.into());

        let res = schema_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);
        let res = schema_is_sub_type(&t2, &t1, &definitions, &definitions);
        assert!(!res);
    }

    #[test]
    fn array() {
        let definitions = vec![];

        let t1 = JsonSchema::Array(JsonSchema::String.into());
        let t2 = JsonSchema::Array(JsonSchema::String.into());

        let res = schema_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);
        let res = schema_is_sub_type(&t2, &t1, &definitions, &definitions);
        assert!(res);
    }
    #[test]
    fn array_and_tuple() {
        let definitions = vec![];

        let t1 = JsonSchema::Tuple {
            prefix_items: vec![JsonSchema::String.into()],
            items: None,
        };
        let t2 = JsonSchema::Array(JsonSchema::String.into());

        let res = schema_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);
        let res = schema_is_sub_type(&t2, &t1, &definitions, &definitions);
        assert!(!res);
    }
    #[test]
    fn it_works() {
        let definitions = vec![];

        let t1 = JsonSchema::Null;
        let t2 = JsonSchema::Null;
        let res = schema_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);

        let t1 = JsonSchema::String;
        let t2 = JsonSchema::String;
        let res = schema_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);

        let t1 = JsonSchema::Number;
        let t2 = JsonSchema::Number;
        let res = schema_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);

        let t1 = JsonSchema::Const(JsonSchemaConst::Null);
        let t2 = JsonSchema::Null;
        let res = schema_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);

        let t1 = JsonSchema::Const(JsonSchemaConst::String("abc".into()));
        let t2 = JsonSchema::String;
        let res = schema_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);

        let res = schema_is_sub_type(&t2, &t1, &definitions, &definitions);
        assert!(!res);

        let t1 = JsonSchema::String;
        let t2 = JsonSchema::any_of(vec![JsonSchema::String, JsonSchema::Number]);
        let res = schema_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);
        let res = schema_is_sub_type(&t2, &t1, &definitions, &definitions);
        assert!(!res);

        let t1 = JsonSchema::Boolean;
        let t2 = JsonSchema::any_of(vec![
            JsonSchema::Const(JsonSchemaConst::Bool(true)),
            JsonSchema::Const(JsonSchemaConst::Bool(false)),
        ]);
        let res = schema_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);
        let res = schema_is_sub_type(&t2, &t1, &definitions, &definitions);
        assert!(res);

        let t1 = JsonSchema::StringWithFormat("password".into());
        let t2 = JsonSchema::String;
        let res = schema_is_sub_type(&t1, &t2, &definitions, &definitions);
        assert!(res);

        let res = schema_is_sub_type(&t2, &t1, &definitions, &definitions);
        assert!(!res);
    }
}
