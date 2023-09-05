use crate::ast::json::{Json, ToJson};
use anyhow::anyhow;
use anyhow::Result;
use indexmap::IndexMap;

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

    fn parse_string(vs: &IndexMap<String, Json>) -> Result<Self> {
        match vs.get("format") {
            Some(Json::String(format)) => Ok(JsonSchema::StringWithFormat(format.clone())),
            _ => Ok(JsonSchema::String),
        }
    }
    fn parse_object(vs: &IndexMap<String, Json>) -> Result<Self> {
        let props = vs
            .get("properties")
            .ok_or(anyhow!("object must have properties field"))?;
        let props = match props {
            Json::Object(props) => props,
            _ => return Err(anyhow!("properties must be an object")),
        };

        let required = vs
            .get("required")
            .ok_or(anyhow!("object must have required field"))?;

        let required = match required {
            Json::Array(required) => required
                .iter()
                .map(|it| match it {
                    Json::String(s) => Ok(s.clone()),
                    _ => Err(anyhow!("required must be an array of strings")),
                })
                .collect::<Result<Vec<_>>>()?,
            _ => return Err(anyhow!("required must be an array")),
        };

        let props = props
            .into_iter()
            .map(|(k, v)| {
                JsonSchema::from_json(v).map(|v| match required.iter().find(|it| *it == k) {
                    Some(_) => (k.clone(), v.required()),
                    None => (k.clone(), v.optional()),
                })
            })
            .collect::<Result<_>>()?;

        Ok(JsonSchema::object(props))
    }

    fn parse_array(vs: &IndexMap<String, Json>) -> Result<Self> {
        // if it has prefixItems or minItems or maxItems it is tuple

        let has_extra_props = vs.iter().any(|(k, _v)| k != "type" && k != "items");

        if has_extra_props {
            let prefix_items = match vs.get("prefixItems") {
                Some(its) => match its {
                    Json::Array(vs) => vs
                        .iter()
                        .map(|it| JsonSchema::from_json(it))
                        .collect::<Result<Vec<_>>>()?,
                    _ => return Err(anyhow!("prefix_items must be an array")),
                },
                _ => vec![],
            };

            let items = match vs.get("items") {
                Some(it) => Some(Box::new(JsonSchema::from_json(it)?)),
                None => None,
            };

            Ok(JsonSchema::Tuple {
                prefix_items,
                items,
            })
        } else {
            let typ = vs
                .get("items")
                .ok_or(anyhow!("array must have items field"))?;
            return Ok(JsonSchema::Array(JsonSchema::from_json(typ)?.into()));
        }
    }

    pub fn from_json(it: &Json) -> Result<Self> {
        match it {
            Json::Object(vs) => {
                if let Some(cons) = vs.get("const") {
                    return Ok(JsonSchema::Const(cons.clone()));
                }

                if let Some(reference) = vs.get("$ref") {
                    let reference = match reference {
                        Json::String(st) => st.clone(),
                        _ => return Err(anyhow!("reference must be a string")),
                    };
                    let schemas_prefix = "#/components/schemas/";
                    if reference.starts_with(schemas_prefix) {
                        return Ok(JsonSchema::Ref(reference.replace(schemas_prefix, "")));
                    }
                    let responses_prefix = "#/components/responses/";
                    if reference.starts_with(responses_prefix) {
                        return Ok(JsonSchema::OpenApiResponseRef(
                            reference.replace(responses_prefix, ""),
                        ));
                    }

                    return Err(anyhow!("invalid reference {reference:?}"));
                }

                let typ = vs.get("type");
                match typ {
                    Some(typ) => match typ {
                        Json::String(typ) => match typ.as_str() {
                            "null" => Ok(JsonSchema::Null),
                            "string" => Self::parse_string(vs),
                            "boolean" => Ok(JsonSchema::Boolean),
                            "number" => Ok(JsonSchema::Number),
                            "object" => Self::parse_object(vs),
                            "array" => Self::parse_array(vs),
                            _ => Err(anyhow!("unknown type: {}", typ)),
                        },
                        _ => Err(anyhow!("type must be a string")),
                    },
                    None => Ok(JsonSchema::Any),
                }
            }
            _ => Err(anyhow!("JsonSchema must be an object")),
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
