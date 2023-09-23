use swc_common::DUMMY_SP;
use swc_ecma_ast::{
    ArrayLit, ArrowExpr, BindingIdent, BlockStmt, BlockStmtOrExpr, CallExpr, Callee, Expr,
    ExprOrSpread, Function, Ident, KeyValueProp, Lit, MemberExpr, MemberProp, ObjectLit, Param,
    ParenExpr, Pat, Prop, PropName, PropOrSpread, ReturnStmt, Stmt, Str,
};

use crate::ast::json_schema::JsonSchema;
fn input_ident() -> Ident {
    Ident {
        span: DUMMY_SP,
        sym: "input".into(),
        optional: false,
    }
}

fn input_expr() -> Expr {
    Expr::Ident(input_ident())
}

fn base_args() -> Vec<ExprOrSpread> {
    vec![ExprOrSpread {
        spread: None,
        expr: input_ident().into(),
    }]
}

fn encode_ref(schema_ref: &str) -> Expr {
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
        args: base_args(),
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
fn encode_expr(schema: &JsonSchema) -> Expr {
    match schema {
        JsonSchema::Null
        | JsonSchema::Boolean
        | JsonSchema::String
        | JsonSchema::Number
        | JsonSchema::Any
        | JsonSchema::Error
        | JsonSchema::Const(_)
        | JsonSchema::StringWithFormat(_) => input_expr(),
        JsonSchema::Ref(schema_ref) => encode_ref(schema_ref),
        JsonSchema::Object(vs) => Expr::Object(ObjectLit {
            span: DUMMY_SP,
            props: vs
                .iter()
                .map(|(key, value)| {
                    let key = PropName::Ident(Ident {
                        span: DUMMY_SP,
                        sym: key.clone().into(),
                        optional: false,
                    });
                    let value = encode_expr(value.inner());
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
                obj: input_expr().into(),
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
                    expr: make_cb(encode_expr(ty)).into(),
                }],
                type_args: None,
            });
            arr_dot_map_dot_call
        }
        JsonSchema::Tuple {
            prefix_items,
            items,
        } => Expr::Array(ArrayLit {
            span: DUMMY_SP,
            elems: prefix_items
                .iter()
                .map(|it| {
                    Some(ExprOrSpread {
                        spread: None,
                        expr: encode_expr(it).into(),
                    })
                })
                .chain(items.iter().map(|it| {
                    Some(ExprOrSpread {
                        spread: Some(DUMMY_SP),
                        expr: encode_expr(&JsonSchema::Array(it.clone())).into(),
                    })
                }))
                .collect(),
        }),
        JsonSchema::AnyOf(_) => Expr::Lit(Lit::Str(Str {
            span: DUMMY_SP,
            value: "todo".into(),
            raw: None,
        })),
        JsonSchema::AllOf(_) => Expr::Lit(Lit::Str(Str {
            span: DUMMY_SP,
            value: "todo".into(),
            raw: None,
        })),
        JsonSchema::Codec(codec_name) => match codec_name.inner() {
            "ISO8061" => {
                let to_iso_string_call = Expr::Call(CallExpr {
                    span: DUMMY_SP,
                    callee: Callee::Expr(
                        Expr::Member(MemberExpr {
                            span: DUMMY_SP,
                            obj: input_expr().into(),
                            prop: MemberProp::Ident(Ident {
                                span: DUMMY_SP,
                                sym: "toISOString".into(),
                                optional: false,
                            }),
                        })
                        .into(),
                    ),
                    args: vec![],
                    type_args: None,
                });
                to_iso_string_call
            }
            _ => todo!(),
        },
        // todo
        JsonSchema::OpenApiResponseRef(_) => todo!(),
        JsonSchema::AnyObject => todo!(),
        JsonSchema::AnyArrayLike => todo!(),
        JsonSchema::StNever => todo!(),
        JsonSchema::StUnknown => todo!(),
        JsonSchema::StNot(_) => todo!(),
    }
}
fn fn_encoder_from_schema(schema: &JsonSchema) -> Function {
    let mut stmts = vec![];

    stmts.push(Stmt::Return(ReturnStmt {
        span: DUMMY_SP,
        arg: Some(Box::new(encode_expr(schema))),
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
