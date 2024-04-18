use swc_common::DUMMY_SP;
use swc_ecma_ast::{
    ArrayLit, Bool, Expr, ExprOrSpread, FnExpr, KeyValueProp, Lit, Null, Number, ObjectLit, Prop,
    PropName, PropOrSpread, Str,
};

use crate::ast::{js::Js, json::Json};

use super::decoder;

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
                value: n.to_f64(),
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

impl ToExpr for Js {
    fn to_expr(self) -> Expr {
        match self {
            Js::Decoder { schema, required } => Expr::Fn(FnExpr {
                ident: None,
                function: decoder::from_schema(&schema, required).into(),
            }),
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
