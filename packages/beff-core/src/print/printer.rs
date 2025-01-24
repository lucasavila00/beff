use crate::ast::json::Json;
use crate::emit::emit_module;
use crate::parser_extractor::BuiltDecoder;
use crate::print::decoder;
use crate::ExtractResult;
use crate::Validator;
use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use swc_common::DUMMY_SP;
use swc_ecma_ast::{
    BindingIdent, Decl, Expr, FnDecl, Ident, KeyValueProp, ModuleItem, ObjectLit, Pat, Prop,
    PropName, PropOrSpread, Stmt, Str, VarDecl, VarDeclKind, VarDeclarator,
};

pub fn const_decl(name: &str, init: Expr) -> ModuleItem {
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
fn build_validators_expr(
    decs: &[BuiltDecoder],
    validators: &Vec<Validator>,
    hoisted: &mut Vec<ModuleItem>,
) -> Expr {
    let mut exprs: Vec<_> = decs
        .iter()
        .map(|decoder| {
            (
                decoder.exported_name.clone(),
                decoder::validator_for_schema(
                    &decoder.schema,
                    validators,
                    hoisted,
                    &decoder.exported_name,
                ),
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
        let mut hoisted: Vec<ModuleItem> = vec![];

        let validators = merge_validator(self.parser.as_ref().map(|it| &it.validators))?;

        for comp in &validators {
            validator_names.push(comp.name.clone());
            let mut local_hoisted = vec![];
            let decoder_fn = decoder::func_validator_for_schema(
                &comp.schema,
                &validators,
                &mut local_hoisted,
                &comp.name,
            );
            let decoder_fn_decl = ModuleItem::Stmt(Stmt::Decl(Decl::Fn(FnDecl {
                ident: Ident {
                    span: DUMMY_SP,
                    sym: format!("Validate{}", comp.name).into(),
                    optional: false,
                },
                declare: false,
                function: decoder_fn.into(),
            })));
            stmt_validators.push(decoder_fn_decl);
            hoisted.extend(local_hoisted.into_iter());
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
                                sym: format!("Validate{}", it).into(),
                                optional: false,
                            })
                            .into(),
                        })))
                    })
                    .collect(),
            }),
        ));

        let js_validators = emit_module(
            stmt_validators
                .into_iter()
                .chain(hoisted.into_iter())
                .collect(),
            "\n",
        )?;

        let mut js_built_parsers = None;

        if let Some(parser) = self.parser {
            let mut parser_hoisted = vec![];
            let decoders = parser.built_decoders.unwrap_or_default();

            let validators_expr =
                build_validators_expr(&decoders, &validators, &mut parser_hoisted);
            let build_validators_input = const_decl("buildValidatorsInput", validators_expr);

            js_built_parsers = Some(emit_module(
                parser_hoisted
                    .into_iter()
                    .chain(vec![build_validators_input].into_iter())
                    .collect(),
                "\n",
            )?);
        }

        let mut json_schema = None;
        if let Some(schema) = self.schema {
            let decoders = schema.built_decoders.unwrap_or_default();
            let json_schema_obj = Json::object(
                decoders
                    .iter()
                    .map(|it| BuiltDecoder::to_json_kv(it, &validators))
                    .collect::<Result<Vec<Vec<(String, Json)>>>>()?
                    .into_iter()
                    .flatten()
                    .collect(),
            );
            // schema
            json_schema = Some(json_schema_obj.to_string());
        }
        Ok(WritableModules {
            js_validators,
            js_built_parsers,
            json_schema,
        })
    }
}
