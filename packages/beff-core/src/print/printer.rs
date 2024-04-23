use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use swc_common::DUMMY_SP;
use swc_ecma_ast::{
    BindingIdent, Decl, Expr, FnDecl, FnExpr, Ident, KeyValueProp, ModuleItem, ObjectLit, Pat,
    Prop, PropName, PropOrSpread, Stmt, Str, VarDecl, VarDeclKind, VarDeclarator,
};

use crate::ast::json::{Json, ToJson, ToJsonKv};
use crate::ast::json_schema::JsonSchema;
use crate::emit::emit_module;
use crate::open_api_ast::{OpenApi, Validator};
use crate::parser_extractor::BuiltDecoder;
use crate::print::decoder;
use crate::ExtractResult;

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
pub fn open_api_to_json(it: OpenApi, components: &[Validator]) -> Json {
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
    pub js_built_parsers: Option<String>,
    pub json_schema: Option<String>,
}

pub trait ToWritableModules {
    fn to_module(self) -> Result<WritableModules>;
}
fn build_decoders_expr(decs: &[BuiltDecoder], validators: &Vec<Validator>) -> Expr {
    let mut exprs: Vec<_> = decs
        .iter()
        .map(|decoder| {
            (
                decoder.exported_name.clone(),
                Expr::Fn(FnExpr {
                    ident: None,
                    function: decoder::from_schema(&decoder.schema, validators).into(),
                }),
            )
        })
        .collect();

    exprs.sort_by(|(a, _), (b, _)| a.cmp(b));

    Expr::Object(ObjectLit {
        span: DUMMY_SP,
        props: exprs
            .into_iter()
            .map(|(key, value)| {
                PropOrSpread::Prop(
                    Prop::KeyValue(KeyValueProp {
                        key: PropName::Str(Str {
                            span: DUMMY_SP,
                            value: key.into(),
                            raw: None,
                        }),
                        value: value.into(),
                    })
                    .into(),
                )
            })
            .collect(),
    })
}

fn merge_validator(parser: Option<&Vec<Validator>>) -> Result<Vec<Validator>> {
    let mut acc: Vec<Validator> = vec![];

    if let Some(parser) = parser {
        for d in parser {
            let found = acc.iter_mut().find(|x| x.name == d.name);
            if let Some(found) = found {
                if found.schema != d.schema {
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

        let validators = merge_validator(self.parser.as_ref().map(|it| &it.validators))?;

        for comp in &validators {
            validator_names.push(comp.name.clone());
            let decoder_fn = decoder::from_schema(&comp.schema, &validators);
            let decoder_fn_decl = ModuleItem::Stmt(Stmt::Decl(Decl::Fn(FnDecl {
                ident: Ident {
                    span: DUMMY_SP,
                    sym: ("Decode".to_string() + comp.name.as_str()).into(),
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
                    .clone()
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
                                sym: ("Decode".to_string() + it.as_str()).into(),
                                optional: false,
                            })
                            .into(),
                        })))
                    })
                    .collect(),
            }),
        ));

        let js_validators = emit_module(stmt_validators, "\n")?;
        let json_schema = None;
        let mut js_built_parsers = None;

        if let Some(parser) = self.parser {
            let decoders_expr =
                build_decoders_expr(&parser.built_decoders.unwrap_or_default(), &validators);
            let built_st = const_decl("buildParsersInput", decoders_expr);
            js_built_parsers = Some(emit_module(vec![built_st], "\n")?);
        }

        Ok(WritableModules {
            js_validators,
            js_built_parsers,
            json_schema,
        })
    }
}
