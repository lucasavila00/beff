use crate::ast::json::Json;
use crate::emit::emit_module;
use crate::parser_extractor::BuiltDecoder;
use crate::print::decoder;
use crate::ExtractResult;
use crate::NamedSchema;
use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use swc_common::DUMMY_SP;
use swc_ecma_ast::{
    BindingIdent, Decl, Expr, FnDecl, Ident, KeyValueProp, ModuleItem, ObjectLit, Pat, Prop,
    PropName, PropOrSpread, Stmt, Str, VarDecl, VarDeclKind, VarDeclarator,
};

use super::decoder::SchemaCode;
use super::decoder::SchemaCodeFunctions;

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

pub struct DecodersCode {
    pub validator: Expr,
    pub parser: Expr,
    pub reporter: Expr,
}

fn build_decoders(
    decs: &[BuiltDecoder],
    validators: &Vec<NamedSchema>,
    hoisted: &mut Vec<ModuleItem>,
) -> DecodersCode {
    let mut validator_exprs: Vec<_> = vec![];
    let mut parser_exprs: Vec<_> = vec![];
    let mut report_exprs: Vec<_> = vec![];
    for decoder in decs {
        let SchemaCode {
            validator,
            parser,
            reporter,
        } = decoder::validator_for_schema(
            &decoder.schema,
            validators,
            hoisted,
            &decoder.exported_name,
        );
        validator_exprs.push((decoder.exported_name.clone(), validator));
        parser_exprs.push((decoder.exported_name.clone(), parser));
        report_exprs.push((decoder.exported_name.clone(), reporter));
    }

    validator_exprs.sort_by(|(a, _), (b, _)| a.cmp(b));
    parser_exprs.sort_by(|(a, _), (b, _)| a.cmp(b));
    report_exprs.sort_by(|(a, _), (b, _)| a.cmp(b));

    let validator = Expr::Object(ObjectLit {
        span: DUMMY_SP,
        props: validator_exprs
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
    });

    let parser = Expr::Object(ObjectLit {
        span: DUMMY_SP,
        props: parser_exprs
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
    });

    let reporter = Expr::Object(ObjectLit {
        span: DUMMY_SP,
        props: report_exprs
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
    });

    DecodersCode {
        validator,
        parser,
        reporter,
    }
}

fn merge_named_schema(parser: Option<&Vec<NamedSchema>>) -> Result<Vec<NamedSchema>> {
    let mut acc: Vec<NamedSchema> = vec![];

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
        let mut stmt_named_schemas = vec![];

        let mut schema_names = vec![];
        let mut hoisted: Vec<ModuleItem> = vec![];

        let named_schemas = merge_named_schema(self.parser.as_ref().map(|it| &it.validators))?;

        for comp in &named_schemas {
            schema_names.push(comp.name.clone());
            let mut local_hoisted = vec![];
            let SchemaCodeFunctions {
                validator,
                parser,
                reporter,
            } = decoder::func_validator_for_schema(
                &comp.schema,
                &named_schemas,
                &mut local_hoisted,
                &comp.name,
            );
            let validator_fn_decl = ModuleItem::Stmt(Stmt::Decl(Decl::Fn(FnDecl {
                ident: Ident {
                    span: DUMMY_SP,
                    sym: format!("Validate{}", comp.name).into(),
                    optional: false,
                },
                declare: false,
                function: validator.into(),
            })));
            stmt_named_schemas.push(validator_fn_decl);

            let parser_fn_decl = ModuleItem::Stmt(Stmt::Decl(Decl::Fn(FnDecl {
                ident: Ident {
                    span: DUMMY_SP,
                    sym: format!("Parse{}", comp.name).into(),
                    optional: false,
                },
                declare: false,
                function: parser.into(),
            })));
            stmt_named_schemas.push(parser_fn_decl);

            let reporter_fn_decl = ModuleItem::Stmt(Stmt::Decl(Decl::Fn(FnDecl {
                ident: Ident {
                    span: DUMMY_SP,
                    sym: format!("Report{}", comp.name).into(),
                    optional: false,
                },
                declare: false,
                function: reporter.into(),
            })));
            stmt_named_schemas.push(reporter_fn_decl);

            hoisted.extend(local_hoisted.into_iter());
        }

        stmt_named_schemas.push(const_decl(
            "validators",
            Expr::Object(ObjectLit {
                span: DUMMY_SP,
                props: schema_names
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
        stmt_named_schemas.push(const_decl(
            "parsers",
            Expr::Object(ObjectLit {
                span: DUMMY_SP,
                props: schema_names
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
                                sym: format!("Parse{}", it).into(),
                                optional: false,
                            })
                            .into(),
                        })))
                    })
                    .collect(),
            }),
        ));

        stmt_named_schemas.push(const_decl(
            "reporters",
            Expr::Object(ObjectLit {
                span: DUMMY_SP,
                props: schema_names
                    .into_iter()
                    .map(|it| {
                        PropOrSpread::Prop(
                            Box::new(Prop::KeyValue(KeyValueProp {
                                key: PropName::Ident(Ident {
                                    span: DUMMY_SP,
                                    sym: it.clone().into(),
                                    optional: false,
                                }),
                                value: Expr::Ident(Ident {
                                    span: DUMMY_SP,
                                    sym: format!("Report{}", it).into(),
                                    optional: false,
                                })
                                .into(),
                            })),
                        )
                    })
                    .collect(),
            }),
        ));

        let js_validators = emit_module(
            stmt_named_schemas
                .into_iter()
                .chain(hoisted.into_iter())
                .collect(),
            "\n",
        )?;

        let mut js_built_parsers = None;

        if let Some(parser) = self.parser {
            let mut parser_hoisted = vec![];
            let decoders = parser.built_decoders.unwrap_or_default();

            let DecodersCode {
                validator,
                parser,
                reporter,
            } = build_decoders(&decoders, &named_schemas, &mut parser_hoisted);
            let build_validators_input = const_decl("buildValidatorsInput", validator);
            let build_parsers_input = const_decl("buildParsersInput", parser);
            let build_reporters_input = const_decl("buildReportersInput", reporter);

            js_built_parsers = Some(emit_module(
                parser_hoisted
                    .into_iter()
                    .chain(
                        vec![
                            build_validators_input,
                            build_parsers_input,
                            build_reporters_input,
                        ]
                        .into_iter(),
                    )
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
                    .map(|it| BuiltDecoder::to_json_kv(it, &named_schemas))
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
