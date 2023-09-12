#[cfg(test)]
mod tests {
    use std::{collections::BTreeMap, rc::Rc};

    use beff_core::{
        ast::{json::Json, json_schema::JsonSchema},
        diag::FullLocation,
        open_api_ast::{
            ApiPath, HTTPMethod, Info, OpenApi, OperationObject, ParsedPattern, Validator,
        },
        schema_changes::is_safe_to_change_to,
        BffFileName,
    };
    use swc_common::{BytePos, CharPos, FileName, Loc, SourceFile};

    fn loc() -> FullLocation {
        let f = SourceFile::new(
            FileName::Real("test".into()),
            false,
            FileName::Real("test".into()),
            "test".into(),
            BytePos(1),
        );
        let loc = FullLocation {
            file_name: BffFileName::new("test".into()),
            loc_lo: Loc {
                file: Rc::new(f.clone()),
                line: 0,
                col: CharPos(0),
                col_display: 0,
            },
            loc_hi: Loc {
                file: Rc::new(f),
                line: 0,
                col: CharPos(0),
                col_display: 0,
            },
        };

        loc
    }

    #[test]
    fn return_check() {
        let definitions = vec![];

        let info = Info {
            title: None,
            description: None,
            version: None,
        };

        let mut s1_methods: BTreeMap<HTTPMethod, OperationObject> = BTreeMap::new();
        s1_methods.insert(
            HTTPMethod::Get,
            OperationObject {
                method_prop_span: loc(),
                summary: None,
                description: None,
                parameters: vec![],
                json_response_body: JsonSchema::Const(Json::String("abc".into())),
                json_request_body: None,
            },
        );

        let s1 = OpenApi {
            info: info.clone(),
            paths: vec![ApiPath {
                parsed_pattern: ParsedPattern {
                    loc: loc(),
                    raw: "/".into(),
                    path_params: vec![],
                },
                methods: s1_methods,
            }],
            components: vec![],
        };

        let mut s2_methods = BTreeMap::new();
        s2_methods.insert(
            HTTPMethod::Get,
            OperationObject {
                method_prop_span: loc(),
                summary: None,
                description: None,
                parameters: vec![],
                json_response_body: JsonSchema::String,
                json_request_body: None,
            },
        );
        let s2 = OpenApi {
            info,
            paths: vec![ApiPath {
                parsed_pattern: ParsedPattern {
                    loc: loc(),
                    raw: "/".into(),
                    path_params: vec![],
                },
                methods: s2_methods,
            }],
            components: vec![],
        };

        let v1 = definitions.iter().collect::<Vec<&Validator>>();

        let errors = is_safe_to_change_to(&s1, &s2, &v1, &v1).unwrap();
        assert!(errors.is_empty());

        let errors = is_safe_to_change_to(&s2, &s1, &v1, &v1).unwrap();
        dbg!(&errors);
        assert!(!errors.is_empty())
    }
}
