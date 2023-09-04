#[cfg(test)]
mod tests {
    use beff_core::ast::{
        json::{Json, ToJson},
        json_schema::JsonSchema,
    };

    #[test]
    fn it_works() {
        let schema = JsonSchema::Any;
        let json = schema.clone().to_json();
        let str = serde_json::to_string_pretty(&json.to_serde()).unwrap();

        let from_str = serde_json::from_str::<serde_json::Value>(&str).unwrap();
        let from_serde = Json::from_serde(&from_str);
        let from_json = JsonSchema::from_json(&from_serde);

        assert!(schema == from_json);
    }
}
