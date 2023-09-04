use core::fmt;

use indexmap::IndexMap;

#[derive(Debug, Clone, PartialEq)]
pub enum Json {
    Null,
    Bool(bool),
    Number(f64),
    String(String),
    Array(Vec<Json>),
    Object(IndexMap<String, Json>),
}

impl Json {
    #[must_use]

    pub fn object(vs: Vec<(String, Json)>) -> Self {
        Self::Object(vs.into_iter().collect())
    }

    pub fn to_serde(&self) -> serde_json::Value {
        match self {
            Json::Null => serde_json::Value::Null,
            Json::Bool(b) => serde_json::Value::Bool(*b),
            Json::Number(n) => serde_json::Value::Number(
                serde_json::Number::from_f64(*n)
                    .expect("should be possible to convert f64 to json number"),
            ),
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
            serde_json::Value::Number(v) => Json::Number(v.as_f64().unwrap()),
            serde_json::Value::String(st) => Json::String(st.clone()),
            serde_json::Value::Array(vs) => Json::Array(vs.iter().map(Json::from_serde).collect()),
            serde_json::Value::Object(vs) => Json::Object(
                vs.iter()
                    .map(|(k, v)| (k.clone(), Json::from_serde(v)))
                    .collect(),
            ),
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

pub trait ToJson {
    fn to_json(self) -> Json;
}

pub trait ToJsonKv {
    fn to_json_kv(self) -> Vec<(String, Json)>;
}
