#[cfg(test)]
mod tests {

    use beff_core::ast::{
        json::{Json, ToJson},
        json_schema::{JsonSchema, JsonSchemaConst},
    };

    #[test]
    fn it_works() {
        let schemas = vec![
            JsonSchema::Null,
            JsonSchema::Boolean,
            JsonSchema::String,
            JsonSchema::StringWithFormat("password".into()),
            JsonSchema::Number,
            JsonSchema::Any,
            JsonSchema::object(vec![]),
            JsonSchema::object(vec![
                ("foo".into(), JsonSchema::String.optional()),
                ("bar".into(), JsonSchema::Number.required()),
                (
                    "baz".into(),
                    JsonSchema::object(vec![
                        ("foo".into(), JsonSchema::String.optional()),
                        ("bar".into(), JsonSchema::Number.required()),
                        ("baz".into(), JsonSchema::Number.required()),
                    ])
                    .required(),
                ),
            ]),
            JsonSchema::Array(Box::new(JsonSchema::Number)),
            JsonSchema::Tuple {
                prefix_items: vec![],
                items: None,
            },
            JsonSchema::Tuple {
                prefix_items: vec![
                    JsonSchema::Array(Box::new(JsonSchema::Number)),
                    JsonSchema::object(vec![
                        ("foo".into(), JsonSchema::String.optional()),
                        ("bar".into(), JsonSchema::Number.required()),
                        ("baz".into(), JsonSchema::Number.required()),
                    ]),
                ],
                items: None,
            },
            JsonSchema::Tuple {
                prefix_items: vec![
                    JsonSchema::Array(Box::new(JsonSchema::Number)),
                    JsonSchema::object(vec![
                        ("foo".into(), JsonSchema::String.optional()),
                        ("bar".into(), JsonSchema::Number.required()),
                        ("baz".into(), JsonSchema::Number.required()),
                    ]),
                ],
                items: Some(Box::new(JsonSchema::object(vec![
                    ("foo".into(), JsonSchema::String.optional()),
                    ("bar".into(), JsonSchema::Number.required()),
                    ("baz".into(), JsonSchema::Number.required()),
                ]))),
            },
            JsonSchema::Ref("abc".into()),
            JsonSchema::OpenApiResponseRef("def".into()),
            JsonSchema::any_of(vec![]),
            JsonSchema::any_of(vec![JsonSchema::String, JsonSchema::Number]),
            JsonSchema::any_of(vec![
                JsonSchema::Const(JsonSchemaConst::Bool(false)),
                JsonSchema::Const(JsonSchemaConst::Bool(true)),
            ]),
            JsonSchema::all_of(vec![]),
            JsonSchema::all_of(vec![JsonSchema::String, JsonSchema::Number]),
            JsonSchema::Const(JsonSchemaConst::String("abc".into())),
            JsonSchema::Const(JsonSchemaConst::parse_int(123)),
        ];
        for schema in schemas {
            let json = schema.clone().to_json();
            let str = serde_json::to_string_pretty(&json.to_serde()).expect("failed to serialize");
            let from_str =
                serde_json::from_str::<serde_json::Value>(&str).expect("failed to parse");
            let from_serde = Json::from_serde(&from_str);
            let from_json = JsonSchema::from_json(&from_serde).expect("failed to json");
            assert_eq!(schema, from_json,);
        }
    }
}
