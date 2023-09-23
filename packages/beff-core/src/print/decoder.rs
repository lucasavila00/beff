use std::collections::BTreeSet;

use crate::{
    ast::json_schema::{JsonSchema, Optionality},
    swc_builder::SwcBuilder,
};
use swc_common::DUMMY_SP;
use swc_ecma_ast::{
    ArrayLit, ArrowExpr, BindingIdent, BlockStmt, BlockStmtOrExpr, Bool, CallExpr, Callee, Expr,
    ExprOrSpread, Function, Ident, KeyValueProp, Lit, MemberExpr, MemberProp, Null, ObjectLit,
    Param, ParenExpr, Pat, Prop, PropName, PropOrSpread, ReturnStmt, Stmt, Str,
};

use super::expr::ToExpr;

struct DecoderFnGenerator {}

impl DecoderFnGenerator {
    fn decode_call(fn_name: &str, required: bool) -> Expr {
        Self::decode_call_extra(fn_name, required, vec![])
    }
    fn base_args(required: bool) -> Vec<ExprOrSpread> {
        vec![
            ExprOrSpread {
                spread: None,
                expr: SwcBuilder::ident_expr("ctx").into(),
            },
            ExprOrSpread {
                spread: None,
                expr: SwcBuilder::ident_expr("input").into(),
            },
            ExprOrSpread {
                spread: None,
                expr: Expr::Lit(Lit::Bool(Bool {
                    span: DUMMY_SP,
                    value: required,
                }))
                .into(),
            },
        ]
    }

    fn decode_call_extra(fn_name: &str, required: bool, extra: Vec<Expr>) -> Expr {
        Expr::Call(CallExpr {
            span: DUMMY_SP,
            callee: Callee::Expr(
                Expr::Ident(Ident {
                    span: DUMMY_SP,
                    sym: fn_name.into(),
                    optional: false,
                })
                .into(),
            ),
            args: Self::base_args(required)
                .into_iter()
                .chain(extra.into_iter().map(|it| ExprOrSpread {
                    spread: None,
                    expr: it.into(),
                }))
                .collect(),
            type_args: None,
        })
    }

    fn decode_ref(schema_ref: &str, required: bool) -> Expr {
        let decoder_ref_fn = Expr::Member(MemberExpr {
            span: DUMMY_SP,
            obj: Expr::Ident(Ident {
                span: DUMMY_SP,
                sym: "validators".into(),
                optional: false,
            })
            .into(),
            prop: MemberProp::Ident(Ident {
                span: DUMMY_SP,
                sym: schema_ref.clone().into(),
                optional: false,
            }),
        });

        Expr::Call(CallExpr {
            span: DUMMY_SP,
            callee: Callee::Expr(decoder_ref_fn.into()),
            args: Self::base_args(required),
            type_args: None,
        })
    }

    fn make_cb(extra: Expr) -> Expr {
        Expr::Arrow(ArrowExpr {
            span: DUMMY_SP,
            params: vec![
                Pat::Ident(BindingIdent {
                    id: Ident {
                        span: DUMMY_SP,
                        sym: "ctx".into(),
                        optional: false,
                    },
                    type_ann: None,
                }),
                Pat::Ident(BindingIdent {
                    id: Ident {
                        span: DUMMY_SP,
                        sym: "input".into(),
                        optional: false,
                    },
                    type_ann: None,
                }),
            ],
            body: BlockStmtOrExpr::Expr(
                Expr::Paren(ParenExpr {
                    span: DUMMY_SP,
                    expr: extra.into(),
                })
                .into(),
            )
            .into(),
            is_async: false,
            is_generator: false,
            type_params: None,
            return_type: None,
        })
    }

    fn decode_union_or_intersection(
        decoder_name: &str,
        required: bool,
        vs: &BTreeSet<JsonSchema>,
    ) -> Expr {
        let els_expr: Vec<Expr> = vs
            .iter()
            .map(|it| Self::decode_expr(it, required))
            .collect();
        Self::decode_call_extra(
            decoder_name,
            required,
            vec![Expr::Array(ArrayLit {
                span: DUMMY_SP,
                elems: els_expr
                    .into_iter()
                    .map(|it| {
                        Some(ExprOrSpread {
                            spread: None,
                            expr: Self::make_cb(it).into(),
                        })
                    })
                    .collect(),
            })],
        )
    }

    fn decode_expr(schema: &JsonSchema, required: bool) -> Expr {
        match schema {
            JsonSchema::Error => unreachable!("should not print if schema had error"),
            JsonSchema::StNever => todo!(),
            JsonSchema::StUnknown => todo!(),
            JsonSchema::StNot(_) => todo!(),
            JsonSchema::AnyObject => todo!(),
            JsonSchema::AnyArrayLike => todo!(),
            JsonSchema::OpenApiResponseRef(_) => unreachable!("will not decode error schema"),
            JsonSchema::Null => Self::decode_call("decodeNull", required),
            JsonSchema::Boolean => Self::decode_call("decodeBoolean", required),
            JsonSchema::String => Self::decode_call("decodeString", required),
            JsonSchema::Number => Self::decode_call("decodeNumber", required),
            JsonSchema::Any => Self::decode_call("decodeAny", required),
            JsonSchema::StringWithFormat(format) => Self::decode_call_extra(
                "decodeStringWithFormat",
                required,
                vec![Expr::Lit(Lit::Str(Str {
                    span: DUMMY_SP,
                    value: format.to_string().into(),
                    raw: None,
                }))
                .into()],
            ),
            JsonSchema::Ref(r_name) => Self::decode_ref(r_name, required),
            JsonSchema::Object(vs) => Self::decode_call_extra(
                "decodeObject",
                required,
                vec![Expr::Object(ObjectLit {
                    span: DUMMY_SP,
                    props: vs
                        .iter()
                        .map(|(key, value)| {
                            PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                                key: PropName::Str(Str {
                                    span: DUMMY_SP,
                                    value: key.clone().into(),
                                    raw: None,
                                }),
                                value: Box::new(Self::make_cb(match value {
                                    Optionality::Optional(schema) => {
                                        Self::decode_expr(schema, false)
                                    }
                                    Optionality::Required(schema) => {
                                        Self::decode_expr(schema, true)
                                    }
                                })),
                            })))
                        })
                        .collect(),
                })],
            ),
            JsonSchema::Array(ty) => Self::decode_call_extra(
                "decodeArray",
                required,
                vec![Self::make_cb(Self::decode_expr(ty, true))],
            ),
            JsonSchema::Tuple {
                prefix_items,
                items,
            } => Self::decode_call_extra(
                "decodeTuple",
                required,
                vec![
                    Expr::Object(ObjectLit {
                        span: DUMMY_SP,
                        props: vec![PropOrSpread::Prop(
                            Prop::KeyValue(KeyValueProp {
                                key: PropName::Ident(Ident {
                                    span: DUMMY_SP,
                                    sym: "prefix".into(),
                                    optional: false,
                                }),
                                value: Box::new(Expr::Array(ArrayLit {
                                    span: DUMMY_SP,
                                    elems: prefix_items
                                        .iter()
                                        .map(|it| {
                                            Some(ExprOrSpread {
                                                spread: None,
                                                expr: Self::make_cb(Self::decode_expr(it, true))
                                                    .into(),
                                            })
                                        })
                                        .collect(),
                                })),
                            })
                            .into(),
                        )],
                    }),
                    Expr::Object(ObjectLit {
                        span: DUMMY_SP,
                        props: vec![PropOrSpread::Prop(
                            Prop::KeyValue(KeyValueProp {
                                key: PropName::Ident(Ident {
                                    span: DUMMY_SP,
                                    sym: "items".into(),
                                    optional: false,
                                }),
                                value: Box::new(match items {
                                    Some(v) => Self::decode_expr(v, true),
                                    None => Expr::Lit(Lit::Null(Null { span: DUMMY_SP })),
                                }),
                            })
                            .into(),
                        )],
                    }),
                ],
            ),
            JsonSchema::AnyOf(vs) => {
                Self::decode_union_or_intersection("decodeAnyOf", required, vs)
            }
            JsonSchema::AllOf(vs) => {
                Self::decode_union_or_intersection("decodeAllOf", required, vs)
            }
            JsonSchema::Const(json) => {
                Self::decode_call_extra("decodeConst", required, vec![json.clone().to_expr()])
            }
            JsonSchema::Codec(format) => Self::decode_call_extra(
                "decodeCodec",
                required,
                vec![Expr::Lit(Lit::Str(Str {
                    span: DUMMY_SP,
                    value: format.to_string().into(),
                    raw: None,
                }))
                .into()],
            ),
        }
    }

    fn fn_decoder_from_schema(&mut self, schema: &JsonSchema, required: bool) -> Function {
        let mut stmts = vec![];

        stmts.push(Stmt::Return(ReturnStmt {
            span: DUMMY_SP,
            arg: Some(Box::new(Self::decode_expr(schema, required))),
        }));
        Function {
            params: vec![
                Param {
                    span: DUMMY_SP,
                    decorators: vec![],
                    pat: Pat::Ident(BindingIdent {
                        id: Ident {
                            span: DUMMY_SP,
                            sym: "ctx".into(),
                            optional: false,
                        },
                        type_ann: None,
                    }),
                },
                Param {
                    span: DUMMY_SP,
                    decorators: vec![],
                    pat: Pat::Ident(BindingIdent {
                        id: SwcBuilder::input_ident(),
                        type_ann: None,
                    }),
                },
            ],
            decorators: vec![],
            span: DUMMY_SP,
            body: BlockStmt {
                span: DUMMY_SP,
                stmts,
            }
            .into(),
            is_async: false,
            is_generator: false,
            type_params: None,
            return_type: None,
        }
    }
}
#[must_use]
pub fn from_schema(
    schema: &JsonSchema,
    _name_to_report_err: &Option<String>,
    required: bool,
) -> Function {
    DecoderFnGenerator {}.fn_decoder_from_schema(schema, required)
}
