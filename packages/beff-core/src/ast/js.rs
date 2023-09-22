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
    Decoder {
        name_on_errors: Option<String>,
        schema: JsonSchema,
        required: bool,
    },
    Coercer(JsonSchema),
    Expr(Expr),
}
impl Js {
    pub fn object(vs: Vec<(String, Js)>) -> Self {
        Self::Object(vs.into_iter().collect())
    }

    pub fn named_decoder(name: String, schema: JsonSchema, required: bool) -> Self {
        Self::Decoder {
            name_on_errors: Some(name),
            schema,
            required,
        }
    }
    pub fn anon_decoder(schema: JsonSchema, required: bool) -> Self {
        Self::Decoder {
            name_on_errors: None,
            schema,
            required,
        }
    }
    pub fn to_string(self) -> String {
        let expr = self.to_expr();

        emit_module(
            vec![ModuleItem::Stmt(Stmt::Expr(ExprStmt {
                span: DUMMY_SP,
                expr: Box::new(expr),
            }))],
            "\n",
        )
        .unwrap()
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
