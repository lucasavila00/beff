use std::collections::BTreeSet;

use swc_common::DUMMY_SP;
use swc_ecma_ast::{
    ArrayLit, ArrowExpr, BindingIdent, BlockStmt, BlockStmtOrExpr, CallExpr, Callee,
    ComputedPropName, Expr, ExprOrSpread, Function, Ident, KeyValueProp, Lit, MemberExpr,
    MemberProp, Number, ObjectLit, Param, ParenExpr, Pat, Prop, PropName, PropOrSpread, ReturnStmt,
    Stmt, Str,
};

use crate::ast::json_schema::JsonSchema;

fn base_args(input_expr: Expr) -> Vec<ExprOrSpread> {
    vec![ExprOrSpread {
        spread: None,
        expr: input_expr.into(),
    }]
}

fn encode_ref(schema_ref: &str, input_expr: Expr) -> Expr {
    let decoder_ref_fn = Expr::Member(MemberExpr {
        span: DUMMY_SP,
        obj: Expr::Ident(Ident {
            span: DUMMY_SP,
            sym: "encoders".into(),
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
        args: base_args(input_expr),
        type_args: None,
    })
}
fn make_cb(extra: Expr) -> Expr {
    Expr::Arrow(ArrowExpr {
        span: DUMMY_SP,
        params: vec![Pat::Ident(BindingIdent {
            id: Ident {
                span: DUMMY_SP,
                sym: "input".into(),
                optional: false,
            },
            type_ann: None,
        })],
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

fn union_intersection(name: &str, vs: &BTreeSet<JsonSchema>, input_expr: Expr) -> Expr {
    Expr::Call(CallExpr {
        span: DUMMY_SP,
        callee: Callee::Expr(
            Expr::Ident(Ident {
                span: DUMMY_SP,
                sym: name.into(),
                optional: false,
            })
            .into(),
        ),
        args: vec![
            ExprOrSpread {
                spread: None,
                expr: Expr::Array(ArrayLit {
                    span: DUMMY_SP,
                    elems: vs
                        .iter()
                        .map(|it| {
                            Some(ExprOrSpread {
                                spread: None,
                                expr: make_cb(encode_expr(it, new_input_expr())).into(),
                            })
                        })
                        .collect(),
                })
                .into(),
            },
            ExprOrSpread {
                spread: None,
                expr: input_expr.clone().into(),
            },
        ],
        type_args: None,
    })
}
fn encode_expr(schema: &JsonSchema, input_expr: Expr) -> Expr {
    match schema {
        JsonSchema::Null
        | JsonSchema::Boolean
        | JsonSchema::String
        | JsonSchema::Number
        | JsonSchema::Any
        | JsonSchema::Error
        | JsonSchema::Const(_)
        | JsonSchema::StringWithFormat(_) => input_expr.clone(),
        JsonSchema::Ref(schema_ref) => encode_ref(schema_ref, input_expr),
        JsonSchema::Object(vs) => Expr::Object(ObjectLit {
            span: DUMMY_SP,
            props: vs
                .iter()
                .map(|(key_string, value)| {
                    let key = PropName::Ident(Ident {
                        span: DUMMY_SP,
                        sym: key_string.clone().into(),
                        optional: false,
                    });
                    let member_expr = Expr::Member(MemberExpr {
                        span: DUMMY_SP,
                        obj: input_expr.clone().into(),
                        prop: MemberProp::Ident(Ident {
                            span: DUMMY_SP,
                            sym: key_string.clone().into(),
                            optional: false,
                        }),
                    });
                    let value = encode_expr(value.inner(), member_expr);
                    PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                        key,
                        value: Box::new(value),
                    })))
                })
                .collect(),
        }),
        JsonSchema::Array(ty) => {
            let arr_dot_map = Expr::Member(MemberExpr {
                span: DUMMY_SP,
                obj: input_expr.clone().into(),
                prop: MemberProp::Ident(Ident {
                    span: DUMMY_SP,
                    sym: "map".into(),
                    optional: false,
                }),
            });

            let arr_dot_map_dot_call = Expr::Call(CallExpr {
                span: DUMMY_SP,
                callee: Callee::Expr(arr_dot_map.into()),
                args: vec![ExprOrSpread {
                    spread: None,
                    expr: make_cb(encode_expr(ty, new_input_expr())).into(),
                }],
                type_args: None,
            });
            arr_dot_map_dot_call
        }
        JsonSchema::Tuple {
            prefix_items,
            items,
        } => {
            let prefix_len = prefix_items.len();
            Expr::Array(ArrayLit {
                span: DUMMY_SP,
                elems: prefix_items
                    .iter()
                    .enumerate()
                    .map(|(idx, it)| {
                        let input_idx = input_expr.clone();
                        let input_idx = Expr::Member(MemberExpr {
                            span: DUMMY_SP,
                            obj: input_idx.into(),
                            prop: MemberProp::Computed(ComputedPropName {
                                span: DUMMY_SP,
                                expr: Expr::Lit(Lit::Num(Number {
                                    span: DUMMY_SP,
                                    value: idx as f64,
                                    raw: None,
                                }))
                                .into(),
                            }),
                        });
                        Some(ExprOrSpread {
                            spread: None,
                            expr: encode_expr(it, input_idx).into(),
                        })
                    })
                    .chain(items.iter().map(|it| {
                        let arr_slice = Expr::Member(MemberExpr {
                            span: DUMMY_SP,
                            obj: input_expr.clone().into(),
                            prop: MemberProp::Ident(Ident {
                                span: DUMMY_SP,
                                sym: "slice".into(),
                                optional: false,
                            }),
                        });

                        let arr_slice_prefix_len = Expr::Call(CallExpr {
                            span: DUMMY_SP,
                            callee: Callee::Expr(arr_slice.into()),
                            args: vec![ExprOrSpread {
                                spread: None,
                                expr: Expr::Lit(Lit::Num(Number {
                                    span: DUMMY_SP,
                                    value: prefix_len as f64,
                                    raw: None,
                                }))
                                .into(),
                            }],
                            type_args: None,
                        });

                        Some(ExprOrSpread {
                            spread: Some(DUMMY_SP),
                            expr: Expr::Paren(ParenExpr {
                                span: DUMMY_SP,
                                expr: encode_expr(
                                    &JsonSchema::Array(it.clone()),
                                    arr_slice_prefix_len,
                                )
                                .into(),
                            })
                            .into(),
                        })
                    }))
                    .collect(),
            })
        }
        JsonSchema::AnyOf(vs) => union_intersection("encodeAnyOf", vs, input_expr),
        JsonSchema::AllOf(vs) => union_intersection("encodeAllOf", vs, input_expr),
        // JsonSchema::Codec(codec_name) => input_expr.clone(),
        JsonSchema::Codec(codec_name) => Expr::Call(CallExpr {
            span: DUMMY_SP,
            callee: Callee::Expr(
                Expr::Ident(Ident {
                    span: DUMMY_SP,
                    sym: "encodeCodec".into(),
                    optional: false,
                })
                .into(),
            ),
            args: vec![
                ExprOrSpread {
                    spread: None,
                    expr: Expr::Lit(Lit::Str(Str {
                        span: DUMMY_SP,
                        value: codec_name.to_string().into(),
                        raw: None,
                    }))
                    .into(),
                },
                ExprOrSpread {
                    spread: None,
                    expr: input_expr.clone().into(),
                },
            ],
            type_args: None,
        }),
        // todo
        JsonSchema::OpenApiResponseRef(_) => todo!(),
        JsonSchema::AnyObject => todo!(),
        JsonSchema::AnyArrayLike => todo!(),
        JsonSchema::StNever => todo!(),
        JsonSchema::StUnknown => todo!(),
        JsonSchema::StNot(_) => todo!(),
    }
}

fn input_ident() -> Ident {
    Ident {
        span: DUMMY_SP,
        sym: "input".into(),
        optional: false,
    }
}

fn new_input_expr() -> Expr {
    Expr::Ident(input_ident())
}

fn fn_encoder_from_schema(schema: &JsonSchema) -> Function {
    let mut stmts = vec![];

    let input_expr = new_input_expr();

    stmts.push(Stmt::Return(ReturnStmt {
        span: DUMMY_SP,
        arg: Some(Box::new(encode_expr(schema, input_expr))),
    }));
    Function {
        params: vec![Param {
            span: DUMMY_SP,
            decorators: vec![],
            pat: Pat::Ident(BindingIdent {
                id: input_ident(),
                type_ann: None,
            }),
        }],
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

#[must_use]
pub fn from_schema(schema: &JsonSchema) -> Function {
    fn_encoder_from_schema(schema)
}
