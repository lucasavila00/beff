use core::fmt;

use crate::ast::{
    js::Js,
    json::{Json, ToJson, ToJsonKv},
    json_schema::JsonSchema,
};
fn clear_description(it: String) -> String {
    // split by newlines
    // remove leading spaces and *
    // trim

    let lines = it.split('\n').collect::<Vec<_>>();

    let remove_from_start: &[_] = &[' ', '*'];
    lines
        .into_iter()
        .map(|it| it.trim_start_matches(remove_from_start))
        .map(|it| it.trim())
        .collect::<Vec<_>>()
        .join("\n")
}
fn resolve_schema(schema: JsonSchema, components: &Vec<Validator>) -> JsonSchema {
    match schema {
        JsonSchema::Ref(name) => match components.iter().find(|it| it.name == name) {
            Some(def) => resolve_schema(def.schema.clone(), components),
            None => unreachable!("everything should be resolved when printing"),
        },
        _ => schema,
    }
}

pub fn build_coercer(schema: JsonSchema, components: &Vec<Validator>) -> Js {
    Js::Coercer(resolve_schema(schema, components))
}

#[derive(Debug)]
pub struct Info {
    pub title: Option<String>,
    pub description: Option<String>,
    pub version: Option<String>,
}

impl ToJson for Info {
    fn to_json(self) -> Json {
        let mut v = vec![];
        if let Some(desc) = self.description {
            v.push(("description".into(), Json::String(clear_description(desc))));
        }
        v.push((
            "title".into(),
            Json::String(self.title.unwrap_or("No title".to_owned())),
        ));
        v.push((
            "version".into(),
            Json::String(self.version.unwrap_or("0.0.0".to_owned())),
        ));
        Json::object(v)
    }
}
#[derive(Debug)]
pub enum ParameterIn {
    Query,
    Header,
    Path,
}

impl fmt::Display for ParameterIn {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            ParameterIn::Query => write!(f, "query"),
            ParameterIn::Header => write!(f, "header"),
            ParameterIn::Path => write!(f, "path"),
        }
    }
}

#[derive(Debug)]
pub struct ParameterObject {
    pub name: String,
    pub in_: ParameterIn,
    pub description: Option<String>,
    pub required: bool,
    pub schema: JsonSchema,
}
impl ToJson for ParameterObject {
    fn to_json(self) -> Json {
        let mut v = vec![];
        v.push(("name".into(), Json::String(self.name)));
        v.push(("in".into(), Json::String(self.in_.to_string())));
        if let Some(desc) = self.description {
            v.push(("description".into(), Json::String(clear_description(desc))));
        }
        v.push(("required".into(), Json::Bool(self.required)));
        v.push(("schema".into(), self.schema.to_json()));
        Json::object(v)
    }
}

#[derive(Debug)]
pub struct JsonRequestBody {
    pub description: Option<String>,
    pub schema: JsonSchema,
    pub required: bool,
}

impl ToJson for JsonRequestBody {
    fn to_json(self) -> Json {
        let mut v = vec![];
        if let Some(desc) = self.description {
            v.push(("description".into(), Json::String(clear_description(desc))));
        }
        v.push(("required".into(), Json::Bool(self.required)));
        let content = Json::object(vec![(
            "application/json".into(),
            Json::object(vec![("schema".into(), self.schema.to_json())]),
        )]);
        v.push(("content".into(), content));
        Json::object(v)
    }
}

#[derive(Debug)]
pub struct OperationObject {
    pub summary: Option<String>,
    pub description: Option<String>,
    pub parameters: Vec<ParameterObject>,
    pub json_response_body: JsonSchema,
    pub json_request_body: Option<JsonRequestBody>,
}
fn error_response_ref(code: &str, reference: &str) -> (String, Json) {
    (
        code.into(),
        JsonSchema::OpenApiResponseRef(reference.to_owned()).to_json(),
    )
}

impl ToJson for OperationObject {
    fn to_json(self) -> Json {
        let mut v = vec![];
        if let Some(summary) = self.summary {
            v.push(("summary".into(), Json::String(summary)));
        }
        if let Some(desc) = self.description {
            v.push(("description".into(), Json::String(clear_description(desc))));
        }
        if let Some(body) = self.json_request_body {
            v.push(("requestBody".into(), body.to_json()));
        }
        v.push((
            "parameters".into(),
            Json::Array(self.parameters.into_iter().map(ToJson::to_json).collect()),
        ));
        v.push((
            "responses".into(),
            Json::object(vec![
                (
                    "200".into(),
                    Json::object(vec![
                        (
                            "description".into(),
                            Json::String("Successful Operation".into()),
                        ),
                        (
                            "content".into(),
                            Json::object(vec![(
                                "application/json".into(),
                                Json::object(vec![(
                                    "schema".into(),
                                    self.json_response_body.to_json(),
                                )]),
                            )]),
                        ),
                    ]),
                ),
                error_response_ref("422", "DecodeError"),
                error_response_ref("500", "UnexpectedError"),
            ]),
        ));

        Json::object(v)
    }
}

#[derive(Debug)]
pub struct ApiPath {
    pub pattern: String,
    pub get: Option<OperationObject>,
    pub post: Option<OperationObject>,
    pub put: Option<OperationObject>,
    pub delete: Option<OperationObject>,
    pub patch: Option<OperationObject>,
    pub options: Option<OperationObject>,
}

impl ApiPath {
    #[must_use]
    pub fn from_pattern(pattern: &str) -> Self {
        Self {
            pattern: pattern.into(),
            get: None,
            post: None,
            put: None,
            delete: None,
            patch: None,
            options: None,
        }
    }
}

impl ToJsonKv for ApiPath {
    fn to_json_kv(self) -> Vec<(String, Json)> {
        let mut v = vec![];
        if let Some(get) = self.get {
            v.push(("get".into(), get.to_json()));
        }
        if let Some(post) = self.post {
            v.push(("post".into(), post.to_json()));
        }
        if let Some(put) = self.put {
            v.push(("put".into(), put.to_json()));
        }
        if let Some(delete) = self.delete {
            v.push(("delete".into(), delete.to_json()));
        }
        if let Some(patch) = self.patch {
            v.push(("patch".into(), patch.to_json()));
        }
        if let Some(options) = self.options {
            v.push(("options".into(), options.to_json()));
        }
        if v.is_empty() {
            return vec![];
        }
        vec![(self.pattern.clone(), Json::object(v))]
    }
}
#[derive(Debug, Clone)]
pub struct Validator {
    pub name: String,
    pub schema: JsonSchema,
}
impl ToJsonKv for Validator {
    fn to_json_kv(self) -> Vec<(String, Json)> {
        vec![(self.name.clone(), self.schema.to_json())]
    }
}

#[derive(Debug)]
pub struct OpenApi {
    pub info: Info,
    pub paths: Vec<ApiPath>,
    pub components: Vec<String>,
}
