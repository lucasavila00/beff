use core::fmt;
use std::collections::BTreeMap;
use std::collections::BTreeSet;

use crate::ast::json::Json;
use crate::subtyping::semtype::SemTypeContext;
use crate::subtyping::semtype::SemTypeOps;
use crate::subtyping::ToSemType;
use crate::Validator;
use anyhow::anyhow;
use anyhow::Result;
use swc_common::DUMMY_SP;
use swc_ecma_ast::BindingIdent;
use swc_ecma_ast::Bool;
use swc_ecma_ast::Ident;
use swc_ecma_ast::Str;
use swc_ecma_ast::TsArrayType;
use swc_ecma_ast::TsEntityName;
use swc_ecma_ast::TsFnParam;
use swc_ecma_ast::TsIndexSignature;
use swc_ecma_ast::TsIntersectionType;
use swc_ecma_ast::TsKeywordType;
use swc_ecma_ast::TsKeywordTypeKind;
use swc_ecma_ast::TsLit;
use swc_ecma_ast::TsLitType;
use swc_ecma_ast::TsParenthesizedType;
use swc_ecma_ast::TsPropertySignature;
use swc_ecma_ast::TsRestType;
use swc_ecma_ast::TsTupleElement;
use swc_ecma_ast::TsTupleType;
use swc_ecma_ast::TsType;
use swc_ecma_ast::TsTypeAnn;
use swc_ecma_ast::TsTypeElement;
use swc_ecma_ast::TsTypeLit;
use swc_ecma_ast::TsTypeParamInstantiation;
use swc_ecma_ast::TsTypeRef;
use swc_ecma_ast::TsUnionOrIntersectionType;
use swc_ecma_ast::TsUnionType;

use super::json::N;

#[derive(Debug, PartialEq, Eq, Clone, PartialOrd, Ord)]
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
    pub fn to_required(self) -> Optionality<T> {
        match self {
            Optionality::Optional(t) => Optionality::Required(t),
            Optionality::Required(t) => Optionality::Required(t),
        }
    }
    pub fn to_optional(self) -> Optionality<T> {
        match self {
            Optionality::Optional(t) => Optionality::Optional(t),
            Optionality::Required(t) => Optionality::Optional(t),
        }
    }
}

impl Optionality<JsonSchema> {
    pub fn negated(self) -> Optionality<JsonSchema> {
        match self {
            Optionality::Optional(it) => JsonSchema::StNot(it.into()).optional(),
            Optionality::Required(it) => JsonSchema::StNot(it.into()).required(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum JsonSchemaConst {
    Null,
    Bool(bool),
    Number(N),
    String(String),
}

impl JsonSchemaConst {
    pub fn to_json(self) -> Json {
        match self {
            JsonSchemaConst::Null => Json::Null,
            JsonSchemaConst::Bool(b) => Json::Bool(b),
            JsonSchemaConst::Number(n) => Json::Number(n),
            JsonSchemaConst::String(s) => Json::String(s),
        }
    }
    pub fn from_json(it: &Json) -> Result<Self> {
        match it {
            Json::Null => Ok(JsonSchemaConst::Null),
            Json::Bool(b) => Ok(JsonSchemaConst::Bool(*b)),
            Json::Number(n) => Ok(JsonSchemaConst::Number(n.clone())),
            Json::String(s) => Ok(JsonSchemaConst::String(s.clone())),
            _ => Err(anyhow!("not a const")),
        }
    }
    pub fn parse_int(it: i64) -> Self {
        Self::Number(N::parse_int(it))
    }
    pub fn parse_f64(value: f64) -> JsonSchemaConst {
        Self::Number(N::parse_f64(value))
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum JsonSchema {
    Null,
    Boolean,
    String,
    Number,
    Any,
    AnyArrayLike,
    StringWithFormat(String),
    Object {
        vs: BTreeMap<String, Optionality<JsonSchema>>,
        rest: Option<Box<JsonSchema>>,
    },
    Array(Box<JsonSchema>),
    Tuple {
        prefix_items: Vec<JsonSchema>,
        items: Option<Box<JsonSchema>>,
    },
    Ref(String),

    // todo: remove this, handle it outside of json schema
    AnyOf(BTreeSet<JsonSchema>),
    AllOf(BTreeSet<JsonSchema>),
    Const(JsonSchemaConst),
    Codec(CodecName),
    // semantic types
    StNever,
    StNot(Box<JsonSchema>),
}

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd, Clone)]
pub enum CodecName {
    ISO8061,
    BigInt,
}

impl fmt::Display for CodecName {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let extra = match self {
            CodecName::ISO8061 => "ISO8061",
            CodecName::BigInt => "BigInt",
        };
        let e = "Codec::".to_string() + extra;
        write!(f, "{}", e)
    }
}

struct UnionMerger(BTreeSet<JsonSchema>);

impl UnionMerger {
    fn new() -> Self {
        Self(BTreeSet::new())
    }
    fn consume(&mut self, vs: Vec<JsonSchema>) {
        for it in vs.into_iter() {
            match it {
                JsonSchema::AnyOf(vs) => self.consume(vs.into_iter().collect()),
                _ => {
                    self.0.insert(it);
                }
            }
        }
    }

    pub fn schema(vs: Vec<JsonSchema>) -> JsonSchema {
        let mut acc = Self::new();
        acc.consume(vs);
        JsonSchema::AnyOf(acc.0)
    }
}

impl JsonSchema {
    pub fn object(
        vs: Vec<(String, Optionality<JsonSchema>)>,
        rest: Option<Box<JsonSchema>>,
    ) -> Self {
        Self::Object {
            vs: vs.into_iter().collect(),
            rest,
        }
    }

    pub fn required(self) -> Optionality<JsonSchema> {
        Optionality::Required(self)
    }
    pub fn optional(self) -> Optionality<JsonSchema> {
        Optionality::Optional(self)
    }

    pub fn any_of(vs: Vec<JsonSchema>) -> Self {
        match vs.len() {
            1 => vs.into_iter().next().expect("we just checked len"),
            _ => UnionMerger::schema(vs),
        }
    }
    pub fn all_of(vs: Vec<JsonSchema>) -> Self {
        match vs.len() {
            1 => vs.into_iter().next().expect("we just checked len"),
            _ => {
                let mut obj_kvs: Vec<(String, Optionality<JsonSchema>)> = vec![];
                let mut all_objects = true;
                let mut rest_is_none = true;

                for v in vs.iter() {
                    match v {
                        JsonSchema::Object { vs, rest } => {
                            if rest.is_some() {
                                rest_is_none = false;
                                break;
                            }
                            obj_kvs.extend(vs.iter().map(|it| (it.0.clone(), it.1.clone())));
                        }
                        _ => {
                            all_objects = false;
                            break;
                        }
                    }
                }

                if rest_is_none && all_objects && vs.len() > 1 {
                    JsonSchema::object(obj_kvs, None)
                } else {
                    Self::AllOf(BTreeSet::from_iter(vs))
                }
            }
        }
    }

    pub fn remove_nots_of_intersections_and_empty_of_union(
        self,
        validators: &[&Validator],
        ctx: &mut SemTypeContext,
    ) -> JsonSchema {
        match self {
            JsonSchema::AllOf(vs) => {
                let semantic = JsonSchema::AllOf(vs.clone())
                    .to_sem_type(validators, ctx)
                    .unwrap();
                let is_empty = semantic.is_empty(ctx);
                if is_empty {
                    return JsonSchema::StNever;
                }

                let vs = vs
                    .into_iter()
                    .map(|it| it.remove_nots_of_intersections_and_empty_of_union(validators, ctx))
                    .filter(|it| !matches!(it, JsonSchema::StNot(_)))
                    .collect();
                JsonSchema::all_of(vs)
            }
            JsonSchema::AnyOf(vs) => {
                let vs: Vec<JsonSchema> = vs
                    .into_iter()
                    .filter(|it| {
                        let semantic = it.to_sem_type(validators, ctx).unwrap();
                        let is_empty = semantic.is_empty(ctx);
                        !is_empty
                    })
                    .collect();

                let vs = vs
                    .into_iter()
                    .map(|it| it.remove_nots_of_intersections_and_empty_of_union(validators, ctx))
                    .collect();
                JsonSchema::any_of(vs)
            }
            v => v,
        }
    }
}
// impl ToJson for JsonSchema {
//     #[allow(clippy::cast_precision_loss)]
//     fn to_json(self) -> Json {
//         match self {
//             JsonSchema::String => {
//                 Json::object(vec![("type".into(), Json::String("string".into()))])
//             }
//             JsonSchema::StringWithFormat(format) => Json::object(vec![
//                 ("type".into(), Json::String("string".into())),
//                 ("format".into(), Json::String(format)),
//             ]),
//             JsonSchema::Codec(format) => Json::object(vec![
//                 ("type".into(), Json::String("string".into())),
//                 ("format".into(), Json::String(format.to_string())),
//             ]),

//             JsonSchema::Object { vs: values, rest } => {
//                 let mut vs = vec![
//                     //
//                     ("type".into(), Json::String("object".into())),
//                     (
//                         "required".into(),
//                         //
//                         Json::Array(
//                             values
//                                 .iter()
//                                 .filter(|(_k, v)| v.is_required())
//                                 .map(|(k, _v)| Json::String(k.clone()))
//                                 .collect(),
//                         ),
//                     ),
//                     (
//                         "properties".into(),
//                         //
//                         Json::Object(
//                             values
//                                 .into_iter()
//                                 .map(|(k, v)| (k, v.inner_move().to_json()))
//                                 .collect(),
//                         ),
//                     ),
//                 ];

//                 if let Some(rest) = rest {
//                     vs.push(("additionalProperties".into(), rest.to_json()));
//                 }
//                 Json::object(vs)
//             }
//             JsonSchema::Array(typ) => {
//                 Json::object(vec![
//                     //
//                     ("type".into(), Json::String("array".into())),
//                     ("items".into(), (*typ).to_json()),
//                 ])
//             }
//             JsonSchema::Boolean => {
//                 Json::object(vec![("type".into(), Json::String("boolean".into()))])
//             }
//             JsonSchema::Number => {
//                 Json::object(vec![("type".into(), Json::String("number".into()))])
//             }
//             JsonSchema::Any => Json::object(vec![]),
//             JsonSchema::Ref(reference) => Json::object(vec![(
//                 "$ref".into(),
//                 Json::String(format!("#/components/schemas/{reference}")),
//             )]),
//             JsonSchema::OpenApiResponseRef(reference) => Json::object(vec![(
//                 "$ref".into(),
//                 Json::String(format!("#/components/responses/{reference}")),
//             )]),
//             JsonSchema::Null => Json::object(vec![("type".into(), Json::String("null".into()))]),
//             JsonSchema::AnyOf(types) => {
//                 let all_literals = types.iter().all(|it| matches!(it, JsonSchema::Const(_)));
//                 if all_literals {
//                     let vs = types
//                         .into_iter()
//                         .map(|it| match it {
//                             JsonSchema::Const(e) => e.to_json(),
//                             _ => unreachable!("should have been caught by all_literals check"),
//                         })
//                         .collect();
//                     Json::object(vec![("enum".into(), Json::Array(vs))])
//                 } else {
//                     let vs = types.into_iter().map(ToJson::to_json).collect();
//                     Json::object(vec![("anyOf".into(), Json::Array(vs))])
//                 }
//             }
//             JsonSchema::AllOf(types) => Json::object(vec![(
//                 "allOf".into(),
//                 Json::Array(types.into_iter().map(ToJson::to_json).collect()),
//             )]),

//             JsonSchema::Tuple {
//                 prefix_items,
//                 items,
//             } => {
//                 let mut v = vec![
//                     //
//                     ("type".into(), Json::String("array".into())),
//                 ];
//                 let len_f = prefix_items.len();
//                 if !prefix_items.is_empty() {
//                     v.push((
//                         "prefixItems".into(),
//                         Json::Array(prefix_items.into_iter().map(ToJson::to_json).collect()),
//                     ));
//                 }
//                 if let Some(ty) = items {
//                     v.push(("items".into(), ty.to_json()));
//                 } else {
//                     v.push(("minItems".into(), Json::parse_int(len_f as i64)));
//                     v.push(("maxItems".into(), Json::parse_int(len_f as i64)));
//                 }
//                 Json::object(v)
//             }
//             JsonSchema::Const(val) => Json::object(vec![("const".into(), val.to_json())]),
//             JsonSchema::AnyArrayLike => JsonSchema::Array(JsonSchema::Any.into()).to_json(),
//             JsonSchema::StNever | JsonSchema::StNot(_) => {
//                 unreachable!("semantic types should not be converted to json")
//             }
//         }
//     }
// }

pub struct JsonFlatConverter<'a> {
    seen_refs: BTreeSet<String>,
    validators: &'a [Validator],
}

impl<'a> JsonFlatConverter<'a> {
    pub fn new(validators: &'a [Validator]) -> Self {
        Self {
            seen_refs: BTreeSet::new(),
            validators,
        }
    }

    #[allow(clippy::cast_precision_loss)]
    pub fn to_json_flat(&mut self, schema: JsonSchema) -> Json {
        match schema {
            JsonSchema::String => {
                Json::object(vec![("type".into(), Json::String("string".into()))])
            }
            JsonSchema::StringWithFormat(format) => Json::object(vec![
                ("type".into(), Json::String("string".into())),
                ("format".into(), Json::String(format)),
            ]),
            JsonSchema::Codec(format) => Json::object(vec![
                ("type".into(), Json::String("string".into())),
                ("format".into(), Json::String(format.to_string())),
            ]),

            JsonSchema::Object { vs: values, rest } => {
                let mut vs = vec![
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
                                .map(|(k, v)| (k, self.to_json_flat(v.inner_move())))
                                .collect(),
                        ),
                    ),
                ];

                if let Some(rest) = rest {
                    vs.push(("additionalProperties".into(), self.to_json_flat(*rest)));
                } else {
                    vs.push(("additionalProperties".into(), Json::Bool(false)));
                }
                Json::object(vs)
            }
            JsonSchema::Array(typ) => {
                Json::object(vec![
                    //
                    ("type".into(), Json::String("array".into())),
                    ("items".into(), self.to_json_flat(*typ)),
                ])
            }
            JsonSchema::Boolean => {
                Json::object(vec![("type".into(), Json::String("boolean".into()))])
            }
            JsonSchema::Number => {
                Json::object(vec![("type".into(), Json::String("number".into()))])
            }
            JsonSchema::Any => Json::object(vec![]),
            JsonSchema::Ref(reference) => {
                if self.seen_refs.contains(&reference) {
                    // recursive type, let's return "ANY"
                    return Json::object(vec![]);
                }
                let validator = self
                    .validators
                    .iter()
                    .find(|it| it.name == reference)
                    .expect("reference should be in validators");
                self.seen_refs.insert(reference.clone());
                let schema = validator.schema.clone();
                let json = self.to_json_flat(schema);
                self.seen_refs.remove(&reference);
                json
            }

            JsonSchema::Null => Json::object(vec![("type".into(), Json::String("null".into()))]),
            JsonSchema::AnyOf(types) => {
                let all_literals = types.iter().all(|it| matches!(it, JsonSchema::Const(_)));
                if all_literals {
                    let vs: Vec<Json> = types
                        .into_iter()
                        .map(|it| match it {
                            JsonSchema::Const(e) => e.to_json(),
                            _ => unreachable!("should have been caught by all_literals check"),
                        })
                        .collect();

                    let all_strings = vs.iter().all(|it| matches!(it, Json::String(_)));
                    if all_strings {
                        Json::object(vec![
                            ("enum".into(), Json::Array(vs)),
                            ("type".into(), Json::String("string".into())),
                        ])
                    } else {
                        Json::object(vec![("enum".into(), Json::Array(vs))])
                    }
                } else {
                    let vs = types.into_iter().map(|it| self.to_json_flat(it)).collect();
                    Json::object(vec![("anyOf".into(), Json::Array(vs))])
                }
            }
            JsonSchema::AllOf(types) => Json::object(vec![(
                "allOf".into(),
                Json::Array(types.into_iter().map(|it| self.to_json_flat(it)).collect()),
            )]),

            JsonSchema::Tuple {
                prefix_items,
                items,
            } => {
                let mut v = vec![
                    //
                    ("type".into(), Json::String("array".into())),
                ];
                let len_f = prefix_items.len();
                if !prefix_items.is_empty() {
                    v.push((
                        "prefixItems".into(),
                        Json::Array(
                            prefix_items
                                .into_iter()
                                .map(|it| self.to_json_flat(it))
                                .collect(),
                        ),
                    ));
                }
                if let Some(ty) = items {
                    v.push(("items".into(), self.to_json_flat(*ty)));
                } else {
                    v.push(("minItems".into(), Json::parse_int(len_f as i64)));
                    v.push(("maxItems".into(), Json::parse_int(len_f as i64)));
                }
                Json::object(v)
            }
            JsonSchema::Const(val) => Json::object(vec![("const".into(), val.to_json())]),
            JsonSchema::AnyArrayLike => {
                self.to_json_flat(JsonSchema::Array(JsonSchema::Any.into()))
            }
            JsonSchema::StNever | JsonSchema::StNot(_) => {
                unreachable!("semantic types should not be converted to json")
            }
        }
    }
}

fn ts_brand(brand: &str) -> TsType {
    // string & { __brand: "brand" }
    TsType::TsUnionOrIntersectionType(TsUnionOrIntersectionType::TsIntersectionType(
        TsIntersectionType {
            span: DUMMY_SP,
            types: vec![
                Box::new(TsType::TsKeywordType(TsKeywordType {
                    span: DUMMY_SP,
                    kind: TsKeywordTypeKind::TsStringKeyword,
                })),
                Box::new(TsType::TsTypeLit(TsTypeLit {
                    span: DUMMY_SP,
                    members: vec![TsTypeElement::TsPropertySignature(TsPropertySignature {
                        span: DUMMY_SP,
                        readonly: false,
                        key: "brand".into(),
                        computed: false,
                        optional: false,
                        init: None,
                        params: vec![],
                        type_ann: Some(Box::new(TsTypeAnn {
                            span: DUMMY_SP,
                            type_ann: Box::new(TsType::TsLitType(TsLitType {
                                span: DUMMY_SP,
                                lit: TsLit::Str(Str {
                                    span: DUMMY_SP,
                                    value: brand.into(),
                                    raw: None,
                                }),
                            })),
                        })),
                        type_params: None,
                    })],
                })),
            ],
        },
    ))
}

impl JsonSchema {
    pub fn to_ts_type(&self) -> TsType {
        match self {
            JsonSchema::Null => TsType::TsKeywordType(TsKeywordType {
                span: DUMMY_SP,
                kind: TsKeywordTypeKind::TsNullKeyword,
            }),
            JsonSchema::Boolean => TsType::TsKeywordType(TsKeywordType {
                span: DUMMY_SP,
                kind: TsKeywordTypeKind::TsBooleanKeyword,
            }),
            JsonSchema::String => TsType::TsKeywordType(TsKeywordType {
                span: DUMMY_SP,
                kind: TsKeywordTypeKind::TsStringKeyword,
            }),
            JsonSchema::Number => TsType::TsKeywordType(TsKeywordType {
                span: DUMMY_SP,
                kind: TsKeywordTypeKind::TsNumberKeyword,
            }),
            JsonSchema::Any => TsType::TsKeywordType(TsKeywordType {
                span: DUMMY_SP,
                kind: TsKeywordTypeKind::TsAnyKeyword,
            }),
            JsonSchema::Object { vs, rest } => {
                let mut members: Vec<TsTypeElement> = vs
                    .iter()
                    .map(|(k, v)| {
                        TsTypeElement::TsPropertySignature(TsPropertySignature {
                            span: DUMMY_SP,
                            readonly: false,
                            key: k.clone().into(),
                            computed: false,
                            optional: !v.is_required(),
                            init: None,
                            params: vec![],
                            type_ann: Some(Box::new(TsTypeAnn {
                                span: DUMMY_SP,
                                type_ann: v.inner().to_ts_type().into(),
                            })),
                            type_params: None,
                        })
                    })
                    .collect();

                if let Some(rest) = rest {
                    let rest = TsTypeElement::TsIndexSignature(TsIndexSignature {
                        span: DUMMY_SP,
                        readonly: false,
                        params: vec![TsFnParam::Ident(BindingIdent {
                            id: Ident {
                                span: DUMMY_SP,
                                sym: "key".into(),
                                optional: false,
                            },
                            // string type always
                            type_ann: Some(
                                TsTypeAnn {
                                    span: DUMMY_SP,
                                    type_ann: TsType::TsKeywordType(TsKeywordType {
                                        span: DUMMY_SP,
                                        kind: TsKeywordTypeKind::TsStringKeyword,
                                    })
                                    .into(),
                                }
                                .into(),
                            ),
                        })],
                        type_ann: Some(
                            TsTypeAnn {
                                span: DUMMY_SP,
                                type_ann: rest.to_ts_type().into(),
                            }
                            .into(),
                        ),
                        is_static: false,
                    });
                    members.push(rest);
                }

                TsType::TsTypeLit(TsTypeLit {
                    span: DUMMY_SP,
                    members,
                })
            }
            JsonSchema::Array(ty) => {
                let ty = ty.to_ts_type();
                TsType::TsTypeRef(TsTypeRef {
                    span: DUMMY_SP,
                    type_name: Ident {
                        span: DUMMY_SP,
                        sym: "Array".into(),
                        optional: false,
                    }
                    .into(),
                    type_params: Some(Box::new(TsTypeParamInstantiation {
                        span: DUMMY_SP,
                        params: vec![ty.into()],
                    })),
                })
            }
            JsonSchema::Tuple {
                prefix_items,
                items,
            } => {
                let mut elem_types: Vec<TsTupleElement> = vec![];
                for it in prefix_items {
                    let ty = it.to_ts_type();
                    let ty = TsTupleElement {
                        span: DUMMY_SP,
                        label: None,
                        ty: ty.into(),
                    };
                    elem_types.push(ty);
                }
                if let Some(items) = items {
                    let ty = items.to_ts_type();
                    let ty = TsType::TsRestType(TsRestType {
                        span: DUMMY_SP,
                        type_ann: Box::new(TsType::TsArrayType(TsArrayType {
                            span: DUMMY_SP,
                            elem_type: Box::new(ty),
                        })),
                    });
                    let ty = TsTupleElement {
                        span: DUMMY_SP,
                        label: None,
                        ty: ty.into(),
                    };
                    elem_types.push(ty);
                }
                TsType::TsTupleType(TsTupleType {
                    span: DUMMY_SP,
                    elem_types,
                })
            }
            JsonSchema::Ref(name) => TsType::TsTypeRef(TsTypeRef {
                span: DUMMY_SP,
                type_name: TsEntityName::Ident(Ident {
                    span: DUMMY_SP,
                    sym: name.clone().into(),
                    optional: false,
                }),
                type_params: None,
            }),
            JsonSchema::StringWithFormat(fmt) => ts_brand(fmt),
            JsonSchema::Codec(c) => match c {
                CodecName::ISO8061 => TsType::TsTypeRef(TsTypeRef {
                    span: DUMMY_SP,
                    type_name: TsEntityName::Ident(Ident {
                        span: DUMMY_SP,
                        sym: "Date".into(),
                        optional: false,
                    }),
                    type_params: None,
                }),
                CodecName::BigInt => TsType::TsKeywordType(TsKeywordType {
                    span: DUMMY_SP,
                    kind: TsKeywordTypeKind::TsBigIntKeyword,
                }),
            },

            JsonSchema::AnyOf(vs) =>
            // TsType::TsUnionOrIntersectionType(
            //     TsUnionOrIntersectionType::TsUnionType(TsUnionType {
            //         span: DUMMY_SP,
            //         types: vs.iter().map(|it| Box::new(it.to_ts_type())).collect(),
            //     }),
            // ),
            {
                match vs.len() {
                    0 => TsType::TsKeywordType(TsKeywordType {
                        span: DUMMY_SP,
                        kind: TsKeywordTypeKind::TsVoidKeyword,
                    }),
                    _ => TsType::TsParenthesizedType(TsParenthesizedType {
                        span: DUMMY_SP,
                        type_ann: TsType::TsUnionOrIntersectionType(
                            TsUnionOrIntersectionType::TsUnionType(TsUnionType {
                                span: DUMMY_SP,
                                types: vs.iter().map(|it| Box::new(it.to_ts_type())).collect(),
                            }),
                        )
                        .into(),
                    }),
                }
            }
            JsonSchema::AllOf(vs) =>
            // TsType::TsUnionOrIntersectionType(
            //     TsUnionOrIntersectionType::TsIntersectionType(TsIntersectionType {
            //         span: DUMMY_SP,
            //         types: vs.iter().map(|it| Box::new(it.to_ts_type())).collect(),
            //     }),
            // ),
            {
                match vs.len() {
                    0 => TsType::TsKeywordType(TsKeywordType {
                        span: DUMMY_SP,
                        kind: TsKeywordTypeKind::TsVoidKeyword,
                    }),
                    _ => TsType::TsParenthesizedType(TsParenthesizedType {
                        span: DUMMY_SP,
                        type_ann: TsType::TsUnionOrIntersectionType(
                            TsUnionOrIntersectionType::TsIntersectionType(TsIntersectionType {
                                span: DUMMY_SP,
                                types: vs.iter().map(|it| Box::new(it.to_ts_type())).collect(),
                            }),
                        )
                        .into(),
                    }),
                }
            }
            JsonSchema::Const(v) => match v {
                JsonSchemaConst::Null => TsType::TsKeywordType(TsKeywordType {
                    span: DUMMY_SP,
                    kind: TsKeywordTypeKind::TsNullKeyword,
                }),
                JsonSchemaConst::Bool(b) => TsType::TsLitType(TsLitType {
                    span: DUMMY_SP,
                    lit: TsLit::Bool(Bool {
                        span: DUMMY_SP,
                        value: *b,
                    }),
                }),
                JsonSchemaConst::Number(n) => TsType::TsLitType(TsLitType {
                    span: DUMMY_SP,
                    lit: TsLit::Number(swc_ecma_ast::Number {
                        span: DUMMY_SP,
                        value: n.to_f64(),
                        raw: None,
                    }),
                }),
                JsonSchemaConst::String(v) => TsType::TsLitType(TsLitType {
                    span: DUMMY_SP,
                    lit: TsLit::Str(Str {
                        span: DUMMY_SP,
                        value: v.clone().into(),
                        raw: None,
                    }),
                }),
            },
            JsonSchema::StNever => TsType::TsKeywordType(TsKeywordType {
                span: DUMMY_SP,
                kind: TsKeywordTypeKind::TsNeverKeyword,
            }),
            JsonSchema::StNot(v) => TsType::TsTypeRef(TsTypeRef {
                span: DUMMY_SP,
                type_name: Ident {
                    span: DUMMY_SP,
                    sym: "Not".into(),
                    optional: false,
                }
                .into(),
                type_params: Some(Box::new(TsTypeParamInstantiation {
                    span: DUMMY_SP,
                    params: vec![
                        // TsType::TsKeywordType(TsKeywordType {
                        //     span: DUMMY_SP,
                        //     kind: TsKeywordTypeKind::TsUnknownKeyword,
                        // })
                        // .into(),
                        v.to_ts_type().into(),
                    ],
                })),
            }),
            JsonSchema::AnyArrayLike => TsType::TsTypeRef(TsTypeRef {
                span: DUMMY_SP,
                type_name: Ident {
                    span: DUMMY_SP,
                    sym: "Array".into(),
                    optional: false,
                }
                .into(),
                type_params: None,
            }),
        }
    }
}
