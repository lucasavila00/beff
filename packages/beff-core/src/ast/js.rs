use std::collections::BTreeMap;

use swc_common::DUMMY_SP;
use swc_ecma_ast::{CallExpr, Callee, Expr, ExprStmt, Ident, ModuleItem, Stmt};

use crate::{
    ast::{json::Json, json_schema::JsonSchema},
    emit::emit_module,
    print::expr::ToExpr,
    subtyping::semtype::Mater,
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

        emit_module(vec![ModuleItem::Stmt(Stmt::Expr(ExprStmt {
            span: DUMMY_SP,
            expr: Box::new(expr),
        }))])
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

pub trait ToJsBorrow {
    fn to_js_borrow(&self) -> Js;
}

fn call_expr(name: &str) -> Expr {
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
        args: vec![],
        type_args: None,
    })
}

impl ToJsBorrow for Mater {
    fn to_js_borrow(&self) -> Js {
        match self {
            Mater::Never => Js::Expr(call_expr("never")),
            Mater::Unknown => todo!(),
            Mater::Void => todo!(),
            Mater::Recursive => Js::Expr(call_expr("recursion")),
            Mater::Null => todo!(),
            Mater::Bool => Js::Bool(true),
            Mater::Number => todo!(),
            Mater::String => Js::String("abc".into()),
            Mater::StringWithFormat(_) => todo!(),
            Mater::StringLiteral(st) => Js::String(st.clone()),
            Mater::NumberLiteral(n) => Js::Number(n.clone()),
            Mater::BooleanLiteral(_) => todo!(),
            Mater::Array {
                items,
                prefix_items,
            } => {
                let mut acc = vec![];
                for item in prefix_items.iter() {
                    acc.push(item.to_js_borrow());
                }
                if !items.is_never() {
                    acc.push(items.to_js_borrow());
                }
                Js::Array(acc)
            }
            Mater::Object(vs) => {
                let mut acc = BTreeMap::new();
                for (k, v) in vs.iter() {
                    acc.insert(k.clone(), v.to_js_borrow());
                }
                Js::Object(acc)
            }
        }
    }
}
