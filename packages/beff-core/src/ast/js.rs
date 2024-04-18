use core::fmt;
use std::collections::BTreeMap;

use swc_common::DUMMY_SP;
use swc_ecma_ast::{Expr, ExprStmt, ModuleItem, Stmt};

use crate::{
    ast::{json::Json, json_schema::JsonSchema},
    emit::emit_module,
    print::expr::ToExpr,
};

use super::json::N;

#[derive(Debug, Clone, PartialEq)]
pub enum Js {
    Null,
    Bool(bool),
    Number(N),
    String(String),
    Array(Vec<Js>),
    Object(BTreeMap<String, Js>),
    Decoder { schema: JsonSchema, required: bool },
    Expr(Expr),
}

impl fmt::Display for Js {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let expr = self.clone().to_expr();

        let e = emit_module(
            vec![ModuleItem::Stmt(Stmt::Expr(ExprStmt {
                span: DUMMY_SP,
                expr: Box::new(expr),
            }))],
            "\n",
        )
        .expect("failed to emit module");
        write!(f, "{}", e)
    }
}

impl Js {
    pub fn object(vs: Vec<(String, Js)>) -> Self {
        Self::Object(vs.into_iter().collect())
    }

    pub fn decoder(schema: JsonSchema, required: bool) -> Self {
        Self::Decoder { schema, required }
    }
}
pub trait ToJs {
    fn to_js(self) -> Js;
}

impl ToJs for Json {
    fn to_js(self) -> Js {
        match self {
            Json::Null => Js::Null,
            Json::Bool(b) => Js::Bool(b),
            Json::Number(n) => Js::Number(n),
            Json::String(s) => Js::String(s),
            Json::Array(arr) => Js::Array(arr.into_iter().map(Json::to_js).collect()),
            Json::Object(obj) => Js::Object(obj.into_iter().map(|(k, v)| (k, v.to_js())).collect()),
        }
    }
}
