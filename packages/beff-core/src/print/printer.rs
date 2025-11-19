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
}

pub trait ToWritableModules {
    fn to_module(self) -> Result<WritableModules>;
}

pub struct DecodersCode {
    pub validator: Expr,
    pub parser: Expr,
    pub reporter: Expr,
    pub schema: Expr,
    pub describe: Expr,
}

fn build_decoders(
    decs: &[BuiltDecoder],
    validators: &Vec<NamedSchema>,
    hoisted: &mut Vec<ModuleItem>,
) -> DecodersCode {
    let mut validator_exprs: Vec<_> = vec![];
    let mut parser_exprs: Vec<_> = vec![];
    let mut report_exprs: Vec<_> = vec![];
    let mut schema_exprs: Vec<(String, Expr)> = vec![];
    let mut describe_exprs: Vec<(String, Expr)> = vec![];
    for decoder in decs {
        let mut local_hoisted = vec![];
        let SchemaCode {
            validator,
            parser,
            reporter,
            schema,
            describe,
        } = decoder::validator_for_schema(
            &decoder.schema,
            validators,
            &mut local_hoisted,
            &decoder.exported_name,
        );
        validator_exprs.push((decoder.exported_name.clone(), validator));
        parser_exprs.push((decoder.exported_name.clone(), parser));
        report_exprs.push((decoder.exported_name.clone(), reporter));
        schema_exprs.push((decoder.exported_name.clone(), schema));
        describe_exprs.push((decoder.exported_name.clone(), describe));

        hoisted.extend(local_hoisted.into_iter());
    }

    validator_exprs.sort_by(|(a, _), (b, _)| a.cmp(b));
    parser_exprs.sort_by(|(a, _), (b, _)| a.cmp(b));
    report_exprs.sort_by(|(a, _), (b, _)| a.cmp(b));
    schema_exprs.sort_by(|(a, _), (b, _)| a.cmp(b));

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

    let schema = Expr::Object(ObjectLit {
        span: DUMMY_SP,
        props: schema_exprs
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
    let describe = Expr::Object(ObjectLit {
        span: DUMMY_SP,
        props: describe_exprs
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
        schema,
        describe,
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
                schema,
                describe,
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

            let schema_fn_decl = ModuleItem::Stmt(Stmt::Decl(Decl::Fn(FnDecl {
                ident: Ident {
                    span: DUMMY_SP,
                    sym: format!("Schema{}", comp.name).into(),
                    optional: false,
                },
                declare: false,
                function: schema.into(),
            })));
            stmt_named_schemas.push(schema_fn_decl);

            let describe_fn_decl = ModuleItem::Stmt(Stmt::Decl(Decl::Fn(FnDecl {
                ident: Ident {
                    span: DUMMY_SP,
                    sym: format!("Describe{}", comp.name).into(),
                    optional: false,
                },
                declare: false,
                function: describe.into(),
            })));
            stmt_named_schemas.push(describe_fn_decl);

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
                                sym: format!("Report{}", it).into(),
                                optional: false,
                            })
                            .into(),
                        })))
                    })
                    .collect(),
            }),
        ));
        stmt_named_schemas.push(const_decl(
            "schemas",
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
                                sym: format!("Schema{}", it).into(),
                                optional: false,
                            })
                            .into(),
                        })))
                    })
                    .collect(),
            }),
        ));
        stmt_named_schemas.push(const_decl(
            "describers",
            Expr::Object(ObjectLit {
                span: DUMMY_SP,
                props: schema_names
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
                                sym: format!("Describe{}", it).into(),
                                optional: false,
                            })
                            .into(),
                        })))
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
                schema,
                describe,
            } = build_decoders(&decoders, &named_schemas, &mut parser_hoisted);
            let build_validators_input = const_decl("buildValidatorsInput", validator);
            let build_parsers_input = const_decl("buildParsersInput", parser);
            let build_reporters_input = const_decl("buildReportersInput", reporter);
            let build_schema_input = const_decl("buildSchemaInput", schema);
            let build_describe_input = const_decl("buildDescribeInput", describe);

            js_built_parsers = Some(emit_module(
                parser_hoisted
                    .into_iter()
                    .chain(
                        vec![
                            build_validators_input,
                            build_parsers_input,
                            build_reporters_input,
                            build_schema_input,
                            build_describe_input,
                        ]
                        .into_iter(),
                    )
                    .collect(),
                "\n",
            )?);
        }

        Ok(WritableModules {
            js_validators,
            js_built_parsers,
        })
    }
}
