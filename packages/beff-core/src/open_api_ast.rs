use crate::{
    ast::{
        js::Js,
        json::{Json, ToJson, ToJsonKv},
        json_schema::JsonSchema,
    },
    diag::{Diagnostic, DiagnosticInfoMessage, FullLocation},
};
use anyhow::Result;
use core::fmt;
use std::collections::BTreeMap;

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
            Some(def) => resolve_schema(def.schema.clone(), components),
            None => unreachable!("everything should be resolved when printing"),
        },
        _ => schema,
    }
}

pub fn build_coercer(schema: JsonSchema, components: &Vec<Validator>) -> Js {
    Js::Coercer(resolve_schema(schema, components))
}

#[derive(Debug, Clone)]
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

#[derive(Debug, Clone, Copy, Eq, PartialEq, PartialOrd, Ord)]
pub enum HTTPMethod {
    Get,
    Post,
    Put,
    Delete,
    Patch,
    Options,
}

impl HTTPMethod {
    pub fn all() -> Vec<HTTPMethod> {
        vec![
            HTTPMethod::Get,
            HTTPMethod::Post,
            HTTPMethod::Put,
            HTTPMethod::Delete,
            HTTPMethod::Patch,
            HTTPMethod::Options,
        ]
    }
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
    pub loc: Option<FullLocation>,
    pub raw: String,
    pub path_params: Vec<String>,
}
impl ApiPath {
    fn validate_pattern(key: &str) -> Option<DiagnosticInfoMessage> {
        // only allow simple openapi patterns, no explode
        // disallow `/{param}asd/`
        let blocks = key.split('/').collect::<Vec<_>>();

        for block in blocks {
            // if block contains '{' or '}' assert these are at the start and end
            let contains_block_delim = block.contains('{') || block.contains('}');
            if contains_block_delim {
                let is_at_start = block.starts_with('{');

                if !is_at_start {
                    let err = DiagnosticInfoMessage::OpenBlockMustStartPattern;
                    return Some(err);
                }

                let is_at_end = block.ends_with('}');

                if !is_at_end {
                    let err = DiagnosticInfoMessage::CloseBlockMustEndPattern;
                    return Some(err);
                }

                let content = block.trim_start_matches('{').trim_end_matches('}');
                let is_valid_js_identifier =
                    content.chars().all(|c| c.is_alphanumeric() || c == '_');

                if !is_valid_js_identifier {
                    let err = DiagnosticInfoMessage::InvalidIdentifierInPatternNoExplodeAllowed;
                    return Some(err);
                }
            }
        }

        None
    }
    pub fn parse_raw_pattern_str(
        key: &str,
        locs: Option<FullLocation>,
    ) -> Result<ParsedPattern, DiagnosticInfoMessage> {
        let path_params = parse_pattern_params(key);
        match Self::validate_pattern(key) {
            Some(d) => Err(d),
            None => Ok(ParsedPattern {
                raw: key.to_string(),
                path_params,
                loc: locs,
            }),
        }
    }

    fn validate_pattern_was_consumed(&self, method_prop_span: &FullLocation) -> Vec<Diagnostic> {
        let mut acc = vec![];

        for (k, v) in &self.methods {
            for path_param in &self.parsed_pattern.path_params {
                let found = v.parameters.iter().find(|it| it.name == *path_param);
                if found.is_none() {
                    let err = method_prop_span.clone().to_diag(
                        DiagnosticInfoMessage::UnmatchedPathParameter(path_param.to_string(), *k),
                    );
                    acc.push(err);
                }
            }
        }
        acc
    }

    pub fn validate(&self, method_prop_span: &FullLocation) -> Vec<Diagnostic> {
        self.validate_pattern_was_consumed(method_prop_span)
            .into_iter()
            .collect()
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
        vec![(self.parsed_pattern.raw.clone(), Json::object(v))]
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

pub struct OpenApiParser {
    pub api: OpenApi,
    pub components: Vec<Validator>,
}

impl OpenApiParser {
    pub fn new() -> OpenApiParser {
        OpenApiParser {
            api: OpenApi {
                info: Info {
                    title: None,
                    description: None,
                    version: None,
                },
                paths: vec![],
                components: vec![],
            },
            components: vec![],
        }
    }

    fn parse_schemas(&mut self, components: &Json) -> Result<()> {
        match components {
            Json::Object(vs) => {
                for (name, schema) in vs {
                    let schema = JsonSchema::from_json(schema)?;
                    self.components.push(Validator {
                        name: name.clone(),
                        schema,
                    });
                }
            }
            _ => panic!(),
        }
        Ok(())
    }

    fn parse_op_object(it: &Json) -> Result<OperationObject> {
        match it {
            Json::Object(vs) => {
                let json_response_body = vs
                    .get("responses")
                    .and_then(|it| match it {
                        Json::Object(v) => v.get("200"),
                        _ => None,
                    })
                    .and_then(|it| match it {
                        Json::Object(v) => v.get("content"),
                        _ => None,
                    })
                    .and_then(|it| match it {
                        Json::Object(v) => v.get("application/json"),
                        _ => None,
                    })
                    .and_then(|it| match it {
                        Json::Object(v) => v.get("schema"),
                        _ => None,
                    })
                    .unwrap();

                let json_parameters = vs
                    .get("parameters")
                    .and_then(|it| match it {
                        Json::Array(v) => Some(v.clone()),
                        _ => None,
                    })
                    .unwrap_or(vec![]);

                let mut parameters = vec![];

                for p in json_parameters {
                    match p {
                        Json::Object(vs) => {
                            let in_ = vs
                                .get("in")
                                .and_then(|it| match it {
                                    Json::String(st) => Some(st.clone()),
                                    _ => None,
                                })
                                .unwrap();
                            let name = vs
                                .get("name")
                                .and_then(|it| match it {
                                    Json::String(st) => Some(st.clone()),
                                    _ => None,
                                })
                                .unwrap();
                            let required = vs
                                .get("required")
                                .and_then(|it| match it {
                                    Json::Bool(st) => Some(st.clone()),
                                    _ => None,
                                })
                                .unwrap();
                            let schema = vs
                                .get("schema")
                                .map(|it| JsonSchema::from_json(it).unwrap())
                                .unwrap();
                            match in_.as_str() {
                                "query" => parameters.push(ParameterObject {
                                    name,
                                    in_: ParameterIn::Query,
                                    description: None,
                                    required,
                                    schema,
                                }),
                                "path" => parameters.push(ParameterObject {
                                    name,
                                    in_: ParameterIn::Path,
                                    description: None,
                                    required,
                                    schema,
                                }),
                                "header" => parameters.push(ParameterObject {
                                    name,
                                    in_: ParameterIn::Header,
                                    description: None,
                                    required,
                                    schema,
                                }),
                                _ => panic!(),
                            }
                        }
                        _ => panic!(),
                    }
                }

                let json_request_body_schema = vs
                    .get("requestBody")
                    .and_then(|it| match it {
                        Json::Object(v) => v.get("content"),
                        _ => None,
                    })
                    .and_then(|it| match it {
                        Json::Object(v) => v.get("application/json"),
                        _ => None,
                    })
                    .and_then(|it| match it {
                        Json::Object(v) => v.get("schema"),
                        _ => None,
                    })
                    .map(|it| JsonSchema::from_json(it).unwrap());

                let json_request_body = match json_request_body_schema {
                    Some(schema) => {
                        let required = vs
                            .get("requestBody")
                            .and_then(|it| match it {
                                Json::Object(v) => v.get("required"),
                                _ => None,
                            })
                            .and_then(|it| match it {
                                Json::Bool(v) => Some(*v),
                                _ => None,
                            })
                            .unwrap();

                        Some(JsonRequestBody {
                            description: None,
                            schema,
                            required,
                        })
                    }
                    None => None,
                };

                return Ok(OperationObject {
                    summary: None,
                    description: None,
                    parameters,
                    json_response_body: JsonSchema::from_json(json_response_body)?,
                    json_request_body,
                });
            }
            _ => panic!(),
        }
    }
    fn parse_op_object_map(it: &Json) -> Result<Vec<(HTTPMethod, OperationObject)>> {
        let mut acc = vec![];
        match it {
            Json::Object(vs) => {
                for method in HTTPMethod::all() {
                    let op_obj = vs.get(&method.to_string());
                    if let Some(op_obj) = op_obj {
                        let op_obj = Self::parse_op_object(op_obj)?;
                        acc.push((method, op_obj));
                    }
                }
            }
            _ => panic!(),
        }

        Ok(acc)
    }

    fn parse_paths(&mut self, components: &Json) -> Result<()> {
        match components {
            Json::Object(vs) => {
                for (name, op_obj) in vs {
                    let acc = Self::parse_op_object_map(op_obj)?;
                    let api_path = ApiPath {
                        parsed_pattern: ApiPath::parse_raw_pattern_str(&name, None).unwrap(),
                        methods: BTreeMap::from_iter(acc),
                    };
                    self.api.paths.push(api_path);
                }
            }
            _ => panic!(),
        }
        Ok(())
    }
    pub fn process(&mut self, it: &Json) -> Result<()> {
        match it {
            Json::Null => todo!(),
            Json::Bool(_) => todo!(),
            Json::Number(_) => todo!(),
            Json::String(_) => todo!(),
            Json::Array(_) => todo!(),
            Json::Object(vs) => {
                let schemas = vs.get("components").and_then(|it| match it {
                    Json::Object(v) => v.get("schemas"),
                    _ => None,
                });
                if let Some(schemas) = schemas {
                    self.parse_schemas(schemas)?;
                }
                if let Some(paths) = vs.get("paths") {
                    self.parse_paths(paths)?;
                }
            }
        }

        self.api.components = self.components.iter().map(|it| it.name.clone()).collect();
        Ok(())
    }
}
