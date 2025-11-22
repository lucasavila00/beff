use core::fmt;
use std::collections::BTreeMap;

use swc_common::DUMMY_SP;
use swc_ecma_ast::{
    ArrayLit, Bool, Expr, ExprOrSpread, KeyValueProp, Lit, Null, Number, ObjectLit, Prop, PropName,
    PropOrSpread, Str,
};

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct N {
    integral: i64,
    fractional: Option<i64>,
}

impl N {
    pub fn to_f64(&self) -> f64 {
        self.integral as f64 + self.fractional.unwrap_or(0) as f64 / 1_000_000_000.0
    }

    pub fn to_serde(&self) -> serde_json::Value {
        let v = if let Some(fractional) = self.fractional {
            serde_json::Number::from_f64(self.integral as f64 + fractional as f64 / 1_000_000_000.0)
                .expect("should be possible to convert f64 to json number")
        } else {
            serde_json::Number::from(self.integral)
        };
        serde_json::Value::Number(v)
    }

    pub fn parse_f64(it: f64) -> Self {
        if it.fract() == 0.0 {
            return Self::parse_int(it.trunc() as i64);
        }
        N {
            integral: it.trunc() as i64,
            fractional: Some((it.fract() * 1_000_000_000.0) as i64),
        }
    }
    pub fn parse_int(it: i64) -> Self {
        N {
            integral: it,
            fractional: None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum Json {
    Null,
    Bool(bool),
    Number(N),
    String(String),
    Array(Vec<Json>),
    Object(BTreeMap<String, Json>),
}

impl Json {
    pub fn parse_f64(it: f64) -> Self {
        Self::Number(N::parse_f64(it))
    }
    pub fn parse_int(it: i64) -> Self {
        Self::Number(N::parse_int(it))
    }

    pub fn number_serde(it: &serde_json::Number) -> Self {
        if let Some(it) = it.as_f64() {
            Self::parse_f64(it)
        } else if let Some(it) = it.as_u64() {
            Self::parse_int(it as i64)
        } else if let Some(it) = it.as_i64() {
            Self::parse_int(it)
        } else {
            unreachable!("should be possible to convert serde_json::Number to Json::Number")
        }
    }

    #[must_use]
    pub fn object(vs: Vec<(String, Json)>) -> Self {
        Self::Object(vs.into_iter().collect())
    }

    pub fn to_serde(&self) -> serde_json::Value {
        match self {
            Json::Null => serde_json::Value::Null,
            Json::Bool(b) => serde_json::Value::Bool(*b),
            Json::Number(n) => n.to_serde(),
            Json::String(s) => serde_json::Value::String(s.clone()),
            Json::Array(arr) => {
                serde_json::Value::Array(arr.iter().map(|it| it.to_serde()).collect::<Vec<_>>())
            }
            Json::Object(obj) => serde_json::Value::Object(
                obj.iter()
                    .map(|(k, v)| (k.clone(), v.to_serde()))
                    .collect::<serde_json::Map<_, _>>(),
            ),
        }
    }

    pub fn from_serde(it: &serde_json::Value) -> Json {
        match it {
            serde_json::Value::Null => Json::Null,
            serde_json::Value::Bool(v) => Json::Bool(*v),
            serde_json::Value::Number(v) => Json::number_serde(v),
            serde_json::Value::String(st) => Json::String(st.clone()),
            serde_json::Value::Array(vs) => Json::Array(vs.iter().map(Json::from_serde).collect()),
            serde_json::Value::Object(vs) => Json::Object(
                vs.iter()
                    .map(|(k, v)| (k.clone(), Json::from_serde(v)))
                    .collect(),
            ),
        }
    }

    pub fn to_expr(self) -> Expr {
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

impl fmt::Display for Json {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "{}",
            serde_json::to_string_pretty(&self.to_serde())
                .expect("should be possible to serialize json")
        )
    }
}
