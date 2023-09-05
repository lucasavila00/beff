#[cfg(test)]
mod tests {
    use beff_core::{
        ast::{json::Json, json_schema::JsonSchema},
        open_api_ast::Validator,
    };

    #[test]
    fn mappings4() {
        let definitions = vec![Validator {
            name: "User".into(),
            schema: JsonSchema::object(vec![
                ("id".into(), JsonSchema::String.required()),
                (
                    "bestFriend".into(),
                    JsonSchema::Ref("User".into()).optional(),
                ),
            ]),
        }];

        let t1 = JsonSchema::object(vec![
            ("a".into(), JsonSchema::String.required()),
            ("b".into(), JsonSchema::Ref("User".into()).required()),
        ]);
        let t2 = JsonSchema::object(vec![
            ("a".into(), JsonSchema::String.required()),
            ("b".into(), JsonSchema::Ref("User".into()).optional()),
        ]);

        let res = t1.is_sub_type(&t2, &definitions).unwrap();
        assert!(res);
        let res = t2.is_sub_type(&t1, &definitions).unwrap();
        assert!(!res);
    }

    #[test]
    fn mappings3() {
        let definitions = vec![];

        let t1 = JsonSchema::object(vec![("a".into(), JsonSchema::String.required())]);
        let t2 = JsonSchema::object(vec![("a".into(), JsonSchema::String.optional())]);

        let res = t1.is_sub_type(&t2, &definitions).unwrap();
        assert!(res);
        let res = t2.is_sub_type(&t1, &definitions).unwrap();
        assert!(!res);
    }
    #[test]
    fn mappings2() {
        let definitions = vec![];

        let t1 = JsonSchema::object(vec![
            (
                "a".into(),
                JsonSchema::Const(Json::String("abc".into())).required(),
            ),
            (
                "b".into(),
                JsonSchema::Const(Json::String("def".into())).required(),
            ),
        ]);
        let t2 = JsonSchema::object(vec![("a".into(), JsonSchema::String.required())]);

        let res = t1.is_sub_type(&t2, &definitions).unwrap();
        assert!(res);
        let res = t2.is_sub_type(&t1, &definitions).unwrap();
        assert!(!res);
    }
    #[test]
    fn mappings() {
        let definitions = vec![];

        let t1 = JsonSchema::object(vec![(
            "a".into(),
            JsonSchema::Const(Json::String("abc".into())).required(),
        )]);
        let t2 = JsonSchema::object(vec![("a".into(), JsonSchema::String.required())]);

        let res = t1.is_sub_type(&t2, &definitions).unwrap();
        assert!(res);
        let res = t2.is_sub_type(&t1, &definitions).unwrap();
        assert!(!res);
    }
    #[test]
    fn it_works() {
        let definitions = vec![];

        let t1 = JsonSchema::Null;
        let t2 = JsonSchema::Null;
        let res = t1.is_sub_type(&t2, &definitions).unwrap();
        assert!(res);

        let t1 = JsonSchema::String;
        let t2 = JsonSchema::String;
        let res = t1.is_sub_type(&t2, &definitions).unwrap();
        assert!(res);

        let t1 = JsonSchema::Number;
        let t2 = JsonSchema::Number;
        let res = t1.is_sub_type(&t2, &definitions).unwrap();
        assert!(res);

        let t1 = JsonSchema::Const(Json::Null);
        let t2 = JsonSchema::Null;
        let res = t1.is_sub_type(&t2, &definitions).unwrap();
        assert!(res);

        let t1 = JsonSchema::Const(Json::String("abc".into()));
        let t2 = JsonSchema::String;
        let res = t1.is_sub_type(&t2, &definitions).unwrap();
        assert!(res);

        let res = t2.is_sub_type(&t1, &definitions).unwrap();
        assert!(!res);

        let t1 = JsonSchema::String;
        let t2 = JsonSchema::any_of(vec![JsonSchema::String, JsonSchema::Number]);
        let res = t1.is_sub_type(&t2, &definitions).unwrap();
        assert!(res);
        let res = t2.is_sub_type(&t1, &definitions).unwrap();
        assert!(!res);

        let t1 = JsonSchema::Boolean;
        let t2 = JsonSchema::any_of(vec![
            JsonSchema::Const(Json::Bool(true)),
            JsonSchema::Const(Json::Bool(false)),
        ]);
        let res = t1.is_sub_type(&t2, &definitions).unwrap();
        assert!(res);
        let res = t2.is_sub_type(&t1, &definitions).unwrap();
        assert!(res);

        let t1 = JsonSchema::StringWithFormat("password".into());
        let t2 = JsonSchema::String;
        let res = t1.is_sub_type(&t2, &definitions).unwrap();
        assert!(res);

        let res = t2.is_sub_type(&t1, &definitions).unwrap();
        assert!(!res);
    }
}
