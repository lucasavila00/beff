use indexmap::IndexMap;

use crate::ast::json::{Json, ToJson};

#[derive(Debug, PartialEq, Eq, Clone)]
pub enum Optionality<T> {
    Optional(T),
    Required(T),
}

impl<T> Optionality<T> {
    pub fn inner(&self) -> &T {
        match self {
            Optionality::Optional(t) | Optionality::Required(t) => t,
        }
    }
    pub fn inner_move(self) -> T {
        match self {
            Optionality::Optional(t) | Optionality::Required(t) => t,
        }
    }
    pub fn is_required(&self) -> bool {
        match self {
            Optionality::Optional(_) => false,
            Optionality::Required(_) => true,
        }
    }
}

#[derive(Debug, PartialEq, Clone)]
pub enum JsonSchema {
    Null,
    Boolean,
    String,
    StringWithFormat(String),
    Number,
    Any,
    Object(IndexMap<String, Optionality<JsonSchema>>),
    Array(Box<JsonSchema>),
    Tuple {
        prefix_items: Vec<JsonSchema>,
        items: Option<Box<JsonSchema>>,
    },
    Ref(String),
    OpenApiResponseRef(String),
    AnyOf(Vec<JsonSchema>),
    AllOf(Vec<JsonSchema>),
    Const(Json),
    Error,
}

impl JsonSchema {
    pub fn object(vs: Vec<(String, Optionality<JsonSchema>)>) -> Self {
        Self::Object(vs.into_iter().collect())
    }
    pub fn required(self) -> Optionality<JsonSchema> {
        Optionality::Required(self)
    }
    pub fn optional(self) -> Optionality<JsonSchema> {
        Optionality::Optional(self)
    }

    pub fn from_json(it: &Json) -> Self {
        match it {
            Json::Null => todo!(),
            Json::Bool(_) => todo!(),
            Json::Number(_) => todo!(),
            Json::String(_) => todo!(),
            Json::Array(_) => todo!(),
            Json::Object(_) => todo!(),
        }
    }
}

impl ToJson for JsonSchema {
    #[allow(clippy::cast_precision_loss)]
    fn to_json(self) -> Json {
        match self {
            JsonSchema::String => {
                Json::object(vec![("type".into(), Json::String("string".into()))])
            }
            JsonSchema::StringWithFormat(format) => Json::object(vec![
                ("type".into(), Json::String("string".into())),
                ("format".into(), Json::String(format)),
            ]),
            JsonSchema::Object(values) => {
                Json::object(vec![
                    //
                    ("type".into(), Json::String("object".into())),
                    (
                        "required".into(),
                        //
                        Json::Array(
                            values
                                .iter()
                                .filter(|(_k, v)| v.is_required())
                                .map(|(k, _v)| Json::String(k.clone()))
                                .collect(),
                        ),
                    ),
                    (
                        "properties".into(),
                        //
                        Json::Object(
                            values
                                .into_iter()
                                .map(|(k, v)| (k, v.inner_move().to_json()))
                                .collect(),
                        ),
                    ),
                ])
            }
            JsonSchema::Array(typ) => {
                Json::object(vec![
                    //
                    ("type".into(), Json::String("array".into())),
                    ("items".into(), (*typ).to_json()),
                ])
            }
            JsonSchema::Boolean => {
                Json::object(vec![("type".into(), Json::String("boolean".into()))])
            }
            JsonSchema::Number => {
                Json::object(vec![("type".into(), Json::String("number".into()))])
            }
            JsonSchema::Any => Json::object(vec![]),
            JsonSchema::Ref(reference) => Json::object(vec![(
                "$ref".into(),
                Json::String(format!("#/components/schemas/{reference}")),
            )]),
            JsonSchema::OpenApiResponseRef(reference) => Json::object(vec![(
                "$ref".into(),
                Json::String(format!("#/components/responses/{reference}")),
            )]),
            JsonSchema::Null => Json::object(vec![("type".into(), Json::String("null".into()))]),
            JsonSchema::AnyOf(types) => {
                let all_literals = types.iter().all(|it| matches!(it, JsonSchema::Const(_)));
                if all_literals {
                    let vs = types
                        .into_iter()
                        .map(|it| match it {
                            JsonSchema::Const(e) => e,
                            _ => unreachable!("should have been caught by all_literals check"),
                        })
                        .collect();
                    Json::object(vec![("enum".into(), Json::Array(vs))])
                } else {
                    let vs = types.into_iter().map(ToJson::to_json).collect();
                    Json::object(vec![("anyOf".into(), Json::Array(vs))])
                }
            }
            JsonSchema::AllOf(types) => Json::object(vec![(
                "allOf".into(),
                Json::Array(types.into_iter().map(ToJson::to_json).collect()),
            )]),

            JsonSchema::Tuple {
                prefix_items,
                items,
            } => {
                let mut v = vec![
                    //
                    ("type".into(), Json::String("array".into())),
                ];
                let len_f = prefix_items.len() as f64;
                if !prefix_items.is_empty() {
                    v.push((
                        "prefixItems".into(),
                        Json::Array(prefix_items.into_iter().map(ToJson::to_json).collect()),
                    ));
                }
                if let Some(ty) = items {
                    v.push(("items".into(), ty.to_json()));
                } else {
                    v.push(("minItems".into(), Json::Number(len_f)));
                    v.push(("maxItems".into(), Json::Number(len_f)));
                }
                Json::object(v)
            }
            JsonSchema::Const(val) => Json::object(vec![("const".into(), val)]),
            JsonSchema::Error => unreachable!("should not call print if schema had error"),
        }
    }
}
