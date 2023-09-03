use anyhow::Result;
use serde::{Deserialize, Serialize};
use swc_common::DUMMY_SP;
use swc_ecma_ast::{
    ArrayLit, BindingIdent, Bool, Decl, Expr, ExprOrSpread, FnDecl, FnExpr, Ident, KeyValueProp,
    Lit, ModuleItem, Null, Number, ObjectLit, Pat, Prop, PropName, PropOrSpread, Stmt, Str,
    VarDecl, VarDeclKind, VarDeclarator,
};

use crate::api_extractor::{
    operation_parameter_in_path_or_query_or_body, FunctionParameterIn, HandlerParameter,
    ParsedPattern, PathHandlerMap,
};
use crate::emit::emit_module;
use crate::open_api_ast::{self, Js, Json, JsonSchema, OpenApi, Validator};
use crate::parser_extractor::BuiltDecoder;
use crate::print::decoder;
use crate::ExtractResult;

pub trait ToExpr {
    fn to_expr(self) -> Expr;
}
impl ToExpr for Json {
    fn to_expr(self) -> Expr {
        match self {
            Json::Null => Expr::Lit(Lit::Null(Null { span: DUMMY_SP })),
            Json::Bool(v) => Expr::Lit(Lit::Bool(Bool {
                span: DUMMY_SP,
                value: v,
            })),
            Json::Number(n) => Expr::Lit(Lit::Num(Number {
                span: DUMMY_SP,
                value: n,
                raw: None,
            })),
            Json::String(v) => Expr::Lit(Lit::Str(Str {
                span: DUMMY_SP,
                value: v.into(),
                raw: None,
            })),
            Json::Array(els) => Expr::Array(ArrayLit {
                span: DUMMY_SP,
                elems: els
                    .into_iter()
                    .map(|it| {
                        Some(ExprOrSpread {
                            spread: None,
                            expr: Box::new(it.to_expr()),
                        })
                    })
                    .collect(),
            }),
            Json::Object(kvs) => Expr::Object(ObjectLit {
                span: DUMMY_SP,
                props: kvs
                    .into_iter()
                    .map(|(key, value)| {
                        PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                            key: PropName::Str(Str {
                                span: DUMMY_SP,
                                value: key.into(),
                                raw: None,
                            }),
                            value: Box::new(value.to_expr()),
                        })))
                    })
                    .collect(),
            }),
        }
    }
}

trait ToJson {
    fn to_json(self) -> Json;
}
trait ToJsonKv {
    fn to_json_kv(self) -> Vec<(String, Json)>;
}

impl ToJson for JsonSchema {
    #[allow(clippy::cast_precision_loss)]
    fn to_json(self) -> Json {
        match self {
            JsonSchema::String => {
                Json::Object(vec![("type".into(), Json::String("string".into()))])
            }
            JsonSchema::StringWithFormat(format) => Json::Object(vec![
                ("type".into(), Json::String("string".into())),
                ("format".into(), Json::String(format)),
            ]),
            JsonSchema::Object { values } => {
                Json::Object(vec![
                    //
                    ("type".into(), Json::String("object".into())),
                    (
                        "required".into(),
                        //
                        Json::Array(
                            values
                                .iter()
                                .filter(|(_k, v)| v.is_required())
                                .map(|(k, _v)| Json::String(k.clone()))
                                .collect(),
                        ),
                    ),
                    (
                        "properties".into(),
                        //
                        Json::Object(
                            values
                                .into_iter()
                                .map(|(k, v)| (k, v.inner_move().to_json()))
                                .collect(),
                        ),
                    ),
                ])
            }
            JsonSchema::Array(typ) => {
                Json::Object(vec![
                    //
                    ("type".into(), Json::String("array".into())),
                    ("items".into(), (*typ).to_json()),
                ])
            }
            JsonSchema::Boolean => {
                Json::Object(vec![("type".into(), Json::String("boolean".into()))])
            }
            JsonSchema::Number => {
                Json::Object(vec![("type".into(), Json::String("number".into()))])
            }
            JsonSchema::Any => Json::Object(vec![]),
            JsonSchema::Ref(reference) => Json::Object(vec![(
                "$ref".into(),
                Json::String(format!("#/components/schemas/{reference}")),
            )]),
            JsonSchema::OpenApiResponseRef(reference) => Json::Object(vec![(
                "$ref".into(),
                Json::String(format!("#/components/responses/{reference}")),
            )]),
            JsonSchema::Null => Json::Object(vec![("type".into(), Json::String("null".into()))]),
            JsonSchema::AnyOf(types) => {
                let all_literals = types.iter().all(|it| matches!(it, JsonSchema::Const(_)));
                if all_literals {
                    let vs = types
                        .into_iter()
                        .map(|it| match it {
                            JsonSchema::Const(e) => e,
                            _ => unreachable!("should have been caught by all_literals check"),
                        })
                        .collect();
                    Json::Object(vec![("enum".into(), Json::Array(vs))])
                } else {
                    let vs = types.into_iter().map(ToJson::to_json).collect();
                    Json::Object(vec![("anyOf".into(), Json::Array(vs))])
                }
            }
            JsonSchema::AllOf(types) => Json::Object(vec![(
                "allOf".into(),
                Json::Array(types.into_iter().map(ToJson::to_json).collect()),
            )]),

            JsonSchema::Tuple {
                prefix_items,
                items,
            } => {
                let mut v = vec![
                    //
                    ("type".into(), Json::String("array".into())),
                ];
                let len_f = prefix_items.len() as f64;
                if !prefix_items.is_empty() {
                    v.push((
                        "prefixItems".into(),
                        Json::Array(prefix_items.into_iter().map(ToJson::to_json).collect()),
                    ));
                }
                if let Some(ty) = items {
                    v.push(("items".into(), ty.to_json()));
                } else {
                    v.push(("minItems".into(), Json::Number(len_f)));
                    v.push(("maxItems".into(), Json::Number(len_f)));
                }
                Json::Object(v)
            }
            JsonSchema::Const(val) => Json::Object(vec![("const".into(), val)]),
            JsonSchema::Error => unreachable!("should not call print if schema had error"),
        }
    }
}
impl ToJson for open_api_ast::ParameterObject {
    fn to_json(self) -> Json {
        let mut v = vec![];
        v.push(("name".into(), Json::String(self.name)));
        v.push(("in".into(), Json::String(self.in_.to_string())));
        if let Some(desc) = self.description {
            v.push(("description".into(), Json::String(desc)));
        }
        v.push(("required".into(), Json::Bool(self.required)));
        v.push(("schema".into(), self.schema.to_json()));
        Json::Object(v)
    }
}
impl ToJson for open_api_ast::JsonRequestBody {
    fn to_json(self) -> Json {
        let mut v = vec![];
        if let Some(desc) = self.description {
            v.push(("description".into(), Json::String(desc)));
        }
        v.push(("required".into(), Json::Bool(self.required)));
        let content = Json::Object(vec![(
            "application/json".into(),
            Json::Object(vec![("schema".into(), self.schema.to_json())]),
        )]);
        v.push(("content".into(), content));
        Json::Object(v)
    }
}

fn error_response_ref(code: &str, reference: &str) -> (String, Json) {
    (
        code.into(),
        JsonSchema::OpenApiResponseRef(reference.to_owned()).to_json(),
    )
}
impl ToJson for open_api_ast::OperationObject {
    fn to_json(self) -> Json {
        let mut v = vec![];
        if let Some(summary) = self.summary {
            v.push(("summary".into(), Json::String(summary)));
        }
        if let Some(desc) = self.description {
            v.push(("description".into(), Json::String(desc)));
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
            Json::Object(vec![
                (
                    "200".into(),
                    Json::Object(vec![
                        (
                            "description".into(),
                            Json::String("Successful Operation".into()),
                        ),
                        (
                            "content".into(),
                            Json::Object(vec![(
                                "application/json".into(),
                                Json::Object(vec![(
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

        Json::Object(v)
    }
}

impl ToJsonKv for open_api_ast::ApiPath {
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
        vec![(self.pattern.clone(), Json::Object(v))]
    }
}
impl ToJsonKv for open_api_ast::Validator {
    fn to_json_kv(self) -> Vec<(String, Json)> {
        vec![(self.name.clone(), self.schema.to_json())]
    }
}
impl ToJson for open_api_ast::Info {
    fn to_json(self) -> Json {
        let mut v = vec![];
        if let Some(desc) = self.description {
            v.push(("description".into(), Json::String(desc)));
        }
        v.push((
            "title".into(),
            Json::String(self.title.unwrap_or("No title".to_owned())),
        ));
        v.push((
            "version".into(),
            Json::String(self.version.unwrap_or("0.0.0".to_owned())),
        ));
        Json::Object(v)
    }
}

fn error_response_schema() -> JsonSchema {
    JsonSchema::Object {
        values: vec![("message".to_string(), JsonSchema::String.required())],
    }
}

fn error_response(code: &str, description: &str) -> (String, Json) {
    (
        code.into(),
        Json::Object(vec![
            ("description".into(), Json::String(description.into())),
            (
                "content".into(),
                Json::Object(vec![(
                    "application/json".into(),
                    Json::Object(vec![("schema".into(), error_response_schema().to_json())]),
                )]),
            ),
        ]),
    )
}

fn open_api_to_json(it: OpenApi, components: &[Validator]) -> Json {
    let v = vec![
        //
        ("openapi".into(), Json::String("3.1.0".into())),
        ("info".into(), it.info.to_json()),
        (
            "paths".into(),
            Json::Object(
                it.paths
                    .into_iter()
                    .flat_map(ToJsonKv::to_json_kv)
                    .collect(),
            ),
        ),
        (
            "components".into(),
            Json::Object(vec![
                (
                    "schemas".into(),
                    Json::Object(
                        it.components
                            .into_iter()
                            .map(|name| {
                                components
                                    .iter()
                                    .find(|it| it.name == name)
                                    .expect("everything should be resolved by now")
                            })
                            .flat_map(|it| ToJsonKv::to_json_kv(it.clone()))
                            .collect(),
                    ),
                ),
                (
                    "responses".into(),
                    Json::Object(vec![
                        error_response("DecodeError", "Invalid parameters or request body"),
                        error_response("UnexpectedError", "Unexpected Error"),
                    ]),
                ),
            ]),
        ),
    ];
    Json::Object(v)
}

fn param_to_js(
    name: &str,
    param: HandlerParameter,
    pattern: &ParsedPattern,
    components: &Vec<Validator>,
) -> Js {
    match param {
        HandlerParameter::PathOrQueryOrBody {
            schema, required, ..
        } => {
            match operation_parameter_in_path_or_query_or_body(name, pattern, &schema, components) {
                FunctionParameterIn::Path => Js::Object(vec![
                    ("type".into(), Js::String("path".into())),
                    ("name".into(), Js::String(name.to_string())),
                    ("required".into(), Js::Bool(required)),
                    (
                        "validator".into(),
                        Js::named_decoder(name.to_string(), schema.clone()),
                    ),
                    ("coercer".into(), Js::coercer(schema, components)),
                ]),
                FunctionParameterIn::Query => Js::Object(vec![
                    ("type".into(), Js::String("query".into())),
                    ("name".into(), Js::String(name.to_string())),
                    ("required".into(), Js::Bool(required)),
                    (
                        "validator".into(),
                        Js::named_decoder(name.to_string(), schema.clone()),
                    ),
                    ("coercer".into(), Js::coercer(schema, components)),
                ]),
                FunctionParameterIn::Body => Js::Object(vec![
                    ("type".into(), Js::String("body".into())),
                    ("name".into(), Js::String(name.to_string())),
                    ("required".into(), Js::Bool(required)),
                    (
                        "validator".into(),
                        Js::named_decoder("requestBody".to_string(), schema.clone()),
                    ),
                ]),
                FunctionParameterIn::InvalidComplexPathParameter => {
                    unreachable!("will fail when extracting the json schema")
                }
            }
        }
        HandlerParameter::HeaderOrCookie {
            kind,
            schema,
            required,
            ..
        } => {
            Js::Object(vec![
                //
                ("type".into(), Js::String(kind.to_string())),
                ("name".into(), Js::String(name.to_string())),
                ("required".into(), Js::Bool(required)),
                (
                    "validator".into(),
                    Js::named_decoder(name.to_string(), schema.clone()),
                ),
                ("coercer".into(), Js::coercer(schema, components)),
            ])
        }
        HandlerParameter::Context(_) => {
            Js::Object(vec![("type".into(), Js::String("context".into()))])
        }
    }
}

fn handlers_to_js(items: Vec<PathHandlerMap>, components: &Vec<Validator>) -> Js {
    Js::Array(
        items
            .into_iter()
            .flat_map(|it| {
                it.handlers
                    .into_iter()
                    .map(|handler| {
                        let ptn = &it.pattern.open_api_pattern;
                        let kind = handler.method_kind.to_string().to_uppercase();
                        let decoder_name = format!("[{kind}] {ptn}.response_body");
                        Js::Object(vec![
                            (
                                "method_kind".into(),
                                Js::String(handler.method_kind.to_string()),
                            ),
                            (
                                "params".into(),
                                Js::Array(
                                    handler
                                        .parameters
                                        .into_iter()
                                        .map(|(name, param)| {
                                            param_to_js(&name, param, &it.pattern, components)
                                        })
                                        .collect(),
                                ),
                            ),
                            (
                                "pattern".into(),
                                Js::String(it.pattern.open_api_pattern.clone()),
                            ),
                            (
                                "return_validator".into(),
                                Js::named_decoder(decoder_name, handler.return_type),
                            ),
                        ])
                    })
                    .collect::<Vec<_>>()
            })
            .collect(),
    )
}

fn const_decl(name: &str, init: Expr) -> ModuleItem {
    ModuleItem::Stmt(Stmt::Decl(Decl::Var(
        VarDecl {
            span: DUMMY_SP,
            kind: VarDeclKind::Const,
            declare: false,
            decls: vec![VarDeclarator {
                span: DUMMY_SP,
                name: Pat::Ident(BindingIdent {
                    id: Ident {
                        span: DUMMY_SP,
                        sym: name.into(),
                        optional: false,
                    },
                    type_ann: None,
                }),
                init: Some(Box::new(init)),
                definite: false,
            }],
        }
        .into(),
    )))
}

impl ToExpr for Js {
    fn to_expr(self) -> Expr {
        match self {
            Js::Decoder {
                name_on_errors,
                schema,
            } => Expr::Fn(FnExpr {
                ident: None,
                function: decoder::from_schema(&schema, &name_on_errors).into(),
            }),
            Js::Coercer(schema) => {
                let func = crate::print::coercer::from_schema(&schema);
                Expr::Fn(FnExpr {
                    ident: None,
                    function: func.into(),
                })
            }
            Js::Null => Json::Null.to_expr(),
            Js::Bool(it) => Json::Bool(it).to_expr(),
            Js::Number(it) => Json::Number(it).to_expr(),
            Js::String(it) => Json::String(it).to_expr(),
            Js::Array(els) => Expr::Array(ArrayLit {
                span: DUMMY_SP,
                elems: els
                    .into_iter()
                    .map(|it| {
                        Some(ExprOrSpread {
                            spread: None,
                            expr: Box::new(it.to_expr()),
                        })
                    })
                    .collect(),
            }),
            Js::Object(kvs) => Expr::Object(ObjectLit {
                span: DUMMY_SP,
                props: kvs
                    .into_iter()
                    .map(|(key, value)| {
                        PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                            key: PropName::Str(Str {
                                span: DUMMY_SP,
                                value: key.into(),
                                raw: None,
                            }),
                            value: Box::new(value.to_expr()),
                        })))
                    })
                    .collect(),
            }),
            Js::Expr(expr) => expr,
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct WritableModules {
    pub js_validators: String,
    pub js_server_meta: Option<String>,
    pub js_built_parsers: Option<String>,
    pub json_schema: Option<String>,
}

pub trait ToWritableModules {
    fn to_module(self) -> Result<WritableModules>;
}
fn build_decoders_expr(decs: &[BuiltDecoder]) -> Js {
    Js::Object(
        decs.iter()
            .map(|it| {
                (
                    it.exported_name.clone(),
                    Js::anon_decoder(it.schema.clone()),
                )
            })
            .collect(),
    )
}
impl ToWritableModules for ExtractResult {
    fn to_module(self) -> Result<WritableModules> {
        let mut stmt_validators = vec![];

        let mut validator_names = vec![];

        let validators = self
            .parser
            .as_ref()
            .map(|it| it.validators.clone())
            .or(self.router.as_ref().map(|it| it.validators.clone()))
            .unwrap_or(vec![]);

        for comp in &validators {
            validator_names.push(comp.name.clone());
            let decoder_fn = decoder::from_schema(&comp.schema, &Some(comp.name.clone()));
            let decoder_fn_decl = ModuleItem::Stmt(Stmt::Decl(Decl::Fn(FnDecl {
                ident: Ident {
                    span: DUMMY_SP,
                    sym: comp.name.clone().into(),
                    optional: false,
                },
                declare: false,
                function: decoder_fn.into(),
            })));
            stmt_validators.push(decoder_fn_decl);
        }

        stmt_validators.push(const_decl(
            "validators",
            Expr::Object(ObjectLit {
                span: DUMMY_SP,
                props: validator_names
                    .into_iter()
                    .map(|it| {
                        PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                            key: PropName::Ident(Ident {
                                span: DUMMY_SP,
                                sym: it.clone().into(),
                                optional: false,
                            }),
                            value: Expr::Ident(Ident {
                                span: DUMMY_SP,
                                sym: it.into(),
                                optional: false,
                            })
                            .into(),
                        })))
                    })
                    .collect(),
            }),
        ));

        let js_validators = emit_module(stmt_validators)?;
        let mut json_schema = None;
        let mut js_built_parsers = None;
        let mut js_server_meta = None;

        if let Some(router) = self.router {
            let meta_expr = handlers_to_js(router.handlers, &validators).to_expr();
            let js_server_data = vec![const_decl("meta", meta_expr)];

            js_server_meta = Some(emit_module(js_server_data)?);
            json_schema = Some(open_api_to_json(router.open_api, &validators).to_string());
        }
        if let Some(parser) = self.parser {
            let build_decoders_expr =
                build_decoders_expr(&parser.built_decoders.unwrap_or_default());
            let built_st = const_decl("buildParsersInput", (build_decoders_expr).to_expr());
            js_built_parsers = Some(emit_module(vec![built_st])?);
        }

        Ok(WritableModules {
            js_validators,
            js_server_meta,
            js_built_parsers,
            json_schema,
        })
    }
}
