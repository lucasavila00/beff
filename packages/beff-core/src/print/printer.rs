use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use swc_common::DUMMY_SP;
use swc_ecma_ast::{
    BindingIdent, Decl, Expr, FnDecl, Ident, KeyValueProp, ModuleItem, ObjectLit, Pat, Prop,
    PropName, PropOrSpread, Stmt, VarDecl, VarDeclKind, VarDeclarator,
};

use crate::api_extractor::{
    operation_parameter_in_path_or_query_or_body, FunctionParameterIn, HandlerParameter,
    PathHandlerMap,
};
use crate::ast::js::Js;
use crate::ast::json::{Json, ToJson, ToJsonKv};
use crate::ast::json_schema::JsonSchema;
use crate::emit::emit_module;
use crate::open_api_ast::{build_coercer, OpenApi, ParsedPattern, Validator};
use crate::parser_extractor::BuiltDecoder;
use crate::print::decoder;
use crate::ExtractResult;

use super::expr::ToExpr;

fn error_response_schema() -> JsonSchema {
    JsonSchema::object(vec![("message".to_string(), JsonSchema::String.required())])
}

fn error_response(code: &str, description: &str) -> (String, Json) {
    (
        code.into(),
        Json::object(vec![
            ("description".into(), Json::String(description.into())),
            (
                "content".into(),
                Json::object(vec![(
                    "application/json".into(),
                    Json::object(vec![("schema".into(), error_response_schema().to_json())]),
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
            Json::object(
                it.paths
                    .into_iter()
                    .flat_map(ToJsonKv::to_json_kv)
                    .collect(),
            ),
        ),
        (
            "components".into(),
            Json::object(vec![
                (
                    "schemas".into(),
                    Json::object(
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
                    Json::object(vec![
                        error_response("DecodeError", "Invalid parameters or request body"),
                        error_response("UnexpectedError", "Unexpected Error"),
                    ]),
                ),
            ]),
        ),
    ];
    Json::object(v)
}

fn param_to_server_js(
    name: &str,
    param: HandlerParameter,
    pattern: &ParsedPattern,
    components: &Vec<Validator>,
) -> Js {
    match param {
        HandlerParameter::PathOrQueryOrBody {
            schema, required, ..
        } => {
            match operation_parameter_in_path_or_query_or_body(
                name,
                pattern,
                &schema.value,
                components,
            ) {
                FunctionParameterIn::Path => Js::object(vec![
                    ("type".into(), Js::String("path".into())),
                    ("name".into(), Js::String(name.to_string())),
                    ("required".into(), Js::Bool(required)),
                    (
                        "validator".into(),
                        Js::named_decoder(name.to_string(), schema.value.clone(), required),
                    ),
                    ("coercer".into(), build_coercer(schema.value, components)),
                ]),
                FunctionParameterIn::Query => Js::object(vec![
                    ("type".into(), Js::String("query".into())),
                    ("name".into(), Js::String(name.to_string())),
                    ("required".into(), Js::Bool(required)),
                    (
                        "validator".into(),
                        Js::named_decoder(name.to_string(), schema.value.clone(), required),
                    ),
                    ("coercer".into(), build_coercer(schema.value, components)),
                ]),
                FunctionParameterIn::Body => Js::object(vec![
                    ("type".into(), Js::String("body".into())),
                    ("name".into(), Js::String(name.to_string())),
                    ("required".into(), Js::Bool(required)),
                    (
                        "validator".into(),
                        Js::named_decoder(
                            "requestBody".to_string(),
                            schema.value.clone(),
                            required,
                        ),
                    ),
                ]),
                FunctionParameterIn::InvalidComplexPathParameter => {
                    unreachable!("will fail when extracting the json schema")
                }
            }
        }
        HandlerParameter::Header {
            schema, required, ..
        } => {
            Js::object(vec![
                //
                ("type".into(), Js::String("header".to_string())),
                ("name".into(), Js::String(name.to_string())),
                ("required".into(), Js::Bool(required)),
                (
                    "validator".into(),
                    Js::named_decoder(name.to_string(), schema.value.clone(), required),
                ),
                ("coercer".into(), build_coercer(schema.value, components)),
            ])
        }
        HandlerParameter::Context(_) => {
            Js::object(vec![("type".into(), Js::String("context".into()))])
        }
    }
}

fn param_to_client_js(
    name: &str,
    param: HandlerParameter,
    pattern: &ParsedPattern,
    components: &Vec<Validator>,
) -> Js {
    match param {
        HandlerParameter::PathOrQueryOrBody {
            schema, required, ..
        } => {
            match operation_parameter_in_path_or_query_or_body(
                name,
                pattern,
                &schema.value,
                components,
            ) {
                FunctionParameterIn::Path => Js::object(vec![
                    ("type".into(), Js::String("path".into())),
                    ("name".into(), Js::String(name.to_string())),
                    ("required".into(), Js::Bool(required)),
                ]),
                FunctionParameterIn::Query => Js::object(vec![
                    ("type".into(), Js::String("query".into())),
                    ("name".into(), Js::String(name.to_string())),
                    ("required".into(), Js::Bool(required)),
                ]),
                FunctionParameterIn::Body => Js::object(vec![
                    ("type".into(), Js::String("body".into())),
                    ("name".into(), Js::String(name.to_string())),
                    ("required".into(), Js::Bool(required)),
                ]),
                FunctionParameterIn::InvalidComplexPathParameter => {
                    unreachable!("will fail when extracting the json schema")
                }
            }
        }
        HandlerParameter::Header { required, .. } => {
            Js::object(vec![
                //
                ("type".into(), Js::String("header".to_string())),
                ("name".into(), Js::String(name.to_string())),
                ("required".into(), Js::Bool(required)),
            ])
        }
        HandlerParameter::Context(_) => {
            Js::object(vec![("type".into(), Js::String("context".into()))])
        }
    }
}
fn handlers_to_server_js(items: Vec<PathHandlerMap>, components: &Vec<Validator>) -> Js {
    Js::Array(
        items
            .into_iter()
            .flat_map(|it| {
                it.handlers
                    .into_iter()
                    .map(|handler| {
                        let decoder_name = format!("responseBody");
                        Js::object(vec![
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
                                            param_to_server_js(
                                                &name,
                                                param,
                                                &it.pattern,
                                                components,
                                            )
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
                                Js::named_decoder(decoder_name, handler.return_type.value, true),
                            ),
                        ])
                    })
                    .collect::<Vec<_>>()
            })
            .collect(),
    )
}

fn handlers_to_client_js(items: Vec<PathHandlerMap>, components: &Vec<Validator>) -> Js {
    Js::Array(
        items
            .into_iter()
            .flat_map(|it| {
                it.handlers
                    .into_iter()
                    .map(|handler| {
                        Js::object(vec![
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
                                            param_to_client_js(
                                                &name,
                                                param,
                                                &it.pattern,
                                                components,
                                            )
                                        })
                                        .collect(),
                                ),
                            ),
                            (
                                "pattern".into(),
                                Js::String(it.pattern.open_api_pattern.clone()),
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

#[derive(Serialize, Deserialize)]
pub struct WritableModules {
    pub js_validators: String,
    pub js_server_meta: Option<String>,
    pub js_client_meta: Option<String>,
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
                    Js::anon_decoder(it.schema.clone(), true),
                )
            })
            .collect(),
    )
}

fn merge_validator(
    router: Option<&Vec<Validator>>,
    parser: Option<&Vec<Validator>>,
) -> Result<Vec<Validator>> {
    let mut acc = vec![];
    if let Some(router) = router {
        acc.extend(router.iter().cloned());
    }
    if let Some(parser) = parser {
        for d in parser {
            let found = acc.iter_mut().find(|x| x.name == d.name);
            if let Some(found) = found {
                if found.schema.value != d.schema.value {
                    // TODO: emit proper diag here?
                    // or merge before?
                    return Err(anyhow!("Two different types with the same name"));
                }
            } else {
                acc.push(d.clone());
            }
        }
    }
    Ok(acc)
}
impl ToWritableModules for ExtractResult {
    fn to_module(self) -> Result<WritableModules> {
        let mut stmt_validators = vec![];

        let mut validator_names = vec![];

        let validators = merge_validator(
            self.router.as_ref().map(|it| &it.validators),
            self.parser.as_ref().map(|it| &it.validators),
        )?;

        for comp in &validators {
            validator_names.push(comp.name.clone());
            let decoder_fn =
                decoder::from_schema(&comp.schema.value, &Some(comp.name.clone()), true);
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
        let mut js_client_meta = None;

        if let Some(router) = self.router {
            let meta_expr = handlers_to_server_js(router.routes.clone(), &validators).to_expr();
            let js_server_data = vec![const_decl("meta", meta_expr)];

            js_server_meta = Some(emit_module(js_server_data)?);
            json_schema = Some(open_api_to_json(router.open_api, &validators).to_string());

            let meta_expr = handlers_to_client_js(router.routes, &validators).to_expr();
            let js_client_data = vec![const_decl("meta", meta_expr)];
            js_client_meta = Some(emit_module(js_client_data)?);
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
            js_client_meta,
            json_schema,
        })
    }
}
