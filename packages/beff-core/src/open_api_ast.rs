use core::fmt;
use std::collections::BTreeMap;

use crate::{
    ast::{
        js::Js,
        json::{Json, ToJson, ToJsonKv},
        json_schema::JsonSchema,
    },
    diag::{Diagnostic, DiagnosticInfoMessage, FullLocation, Located},
};

fn clear_description(it: String) -> String {
    let lines = it.split('\n').collect::<Vec<_>>();
    let remove_from_start: &[_] = &[' ', '*'];
    lines
        .into_iter()
        .map(|it| it.trim_start_matches(remove_from_start))
        .map(|it| it.trim_end_matches(remove_from_start))
        .map(|it| it.trim())
        .collect::<Vec<_>>()
        .join("\n")
}
fn resolve_schema(schema: JsonSchema, components: &Vec<Validator>) -> JsonSchema {
    match schema {
        JsonSchema::Ref(name) => match components.iter().find(|it| it.name == name) {
            Some(def) => resolve_schema(def.schema.value.clone(), components),
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
    pub schema: Located<JsonSchema>,
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
        v.push(("schema".into(), self.schema.value.to_json()));
        Json::object(v)
    }
}

#[derive(Debug)]
pub struct JsonRequestBody {
    pub description: Option<String>,
    pub schema: Located<JsonSchema>,
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
            Json::object(vec![("schema".into(), self.schema.value.to_json())]),
        )]);
        v.push(("content".into(), content));
        Json::object(v)
    }
}

#[derive(Debug)]
pub struct OperationObject {
    pub method_prop_span: FullLocation,
    pub summary: Option<String>,
    pub description: Option<String>,
    pub parameters: Vec<ParameterObject>,
    pub json_response_body: Located<JsonSchema>,
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
                                    self.json_response_body.value.to_json(),
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

#[derive(Debug, Clone, Copy, Eq, PartialEq, PartialOrd, Ord)]
pub enum HTTPMethod {
    Get,
    Post,
    Put,
    Delete,
    Patch,
    Options,
}

impl fmt::Display for HTTPMethod {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            HTTPMethod::Get => write!(f, "get"),
            HTTPMethod::Post => write!(f, "post"),
            HTTPMethod::Put => write!(f, "put"),
            HTTPMethod::Delete => write!(f, "delete"),
            HTTPMethod::Patch => write!(f, "patch"),
            HTTPMethod::Options => write!(f, "options"),
        }
    }
}

#[derive(Debug)]
pub struct ApiPath {
    pub parsed_pattern: ParsedPattern,
    pub methods: BTreeMap<HTTPMethod, OperationObject>,
}

fn parse_pattern_params(pattern: &str) -> Vec<String> {
    // parse open api parameters from pattern
    let mut params = vec![];
    let chars = pattern.chars();
    let mut current = String::new();
    for c in chars {
        if c == '{' {
            current = String::new();
        } else if c == '}' {
            params.push(current.clone());
        } else {
            current.push(c);
        }
    }
    params
}
#[derive(Debug, Clone)]
pub struct ParsedPattern {
    pub loc: FullLocation,

    pub open_api_pattern: String,
    pub path_params: Vec<String>,
}
impl ApiPath {
    fn validate_pattern(key: &str, locs: &FullLocation) -> Option<Diagnostic> {
        // only allow simple openapi patterns, no explode
        // disallow `/{param}asd/`
        let blocks = key.split('/').collect::<Vec<_>>();

        for block in blocks {
            // if block contains '{' or '}' assert these are at the start and end
            let contains_block_delim = block.contains('{') || block.contains('}');
            if contains_block_delim {
                let is_at_start = block.starts_with('{');

                if !is_at_start {
                    let err = locs
                        .clone()
                        .to_diag(DiagnosticInfoMessage::OpenBlockMustStartPattern);
                    return Some(err);
                }

                let is_at_end = block.ends_with('}');

                if !is_at_end {
                    let err = locs
                        .clone()
                        .to_diag(DiagnosticInfoMessage::CloseBlockMustEndPattern);
                    return Some(err);
                }

                let content = block.trim_start_matches('{').trim_end_matches('}');
                let is_valid_js_identifier =
                    content.chars().all(|c| c.is_alphanumeric() || c == '_');

                if !is_valid_js_identifier {
                    let err = locs
                        .clone()
                        .to_diag(DiagnosticInfoMessage::InvalidIdentifierInPatternNoExplodeAllowed);
                    return Some(err);
                }
            }
        }

        None
    }
    pub fn parse_raw_pattern_str(
        key: &str,
        locs: FullLocation,
    ) -> Result<ParsedPattern, Diagnostic> {
        let path_params = parse_pattern_params(key);
        match Self::validate_pattern(key, &locs) {
            Some(d) => Err(d),
            None => Ok(ParsedPattern {
                open_api_pattern: key.to_string(),
                path_params,
                loc: locs,
            }),
        }
    }

    fn validate_pattern_was_consumed(&self) -> Vec<Diagnostic> {
        let mut acc = vec![];

        for (_k, v) in &self.methods {
            for path_param in &self.parsed_pattern.path_params {
                let found = v.parameters.iter().find(|it| it.name == *path_param);
                if found.is_none() {
                    let err = v.method_prop_span.clone().to_diag(
                        DiagnosticInfoMessage::UnmatchedPathParameter(path_param.to_string()),
                    );
                    acc.push(err);
                }
            }
        }
        acc
    }

    pub fn validate(&self) -> Vec<Diagnostic> {
        self.validate_pattern_was_consumed().into_iter().collect()
    }

    #[must_use]
    pub fn from_pattern(parsed_pattern: ParsedPattern) -> Self {
        Self {
            parsed_pattern,
            methods: BTreeMap::new(),
        }
    }
}

impl ToJsonKv for ApiPath {
    fn to_json_kv(self) -> Vec<(String, Json)> {
        let mut v = vec![];

        for (method, operation) in self.methods {
            v.push((method.to_string(), operation.to_json()));
        }

        if v.is_empty() {
            return vec![];
        }
        vec![(
            self.parsed_pattern.open_api_pattern.clone(),
            Json::object(v),
        )]
    }
}
#[derive(Debug, Clone)]
pub struct Validator {
    pub name: String,
    pub schema: Located<JsonSchema>,
}
impl ToJsonKv for Validator {
    fn to_json_kv(self) -> Vec<(String, Json)> {
        vec![(self.name.clone(), self.schema.value.to_json())]
    }
}

#[derive(Debug)]
pub struct OpenApi {
    pub info: Info,
    pub paths: Vec<ApiPath>,
    pub components: Vec<String>,
}
