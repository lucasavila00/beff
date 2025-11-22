use core::fmt;
use std::collections::BTreeMap;
use std::collections::BTreeSet;

use crate::ast::json::Json;
use crate::subtyping::semtype::SemTypeContext;
use crate::subtyping::semtype::SemTypeOps;
use crate::subtyping::ToSemType;
use crate::NamedSchema;
use anyhow::anyhow;
use anyhow::Result;
use swc_common::DUMMY_SP;
use swc_ecma_ast::BindingIdent;
use swc_ecma_ast::Bool;
use swc_ecma_ast::Ident;
use swc_ecma_ast::Str;
use swc_ecma_ast::TplElement;
use swc_ecma_ast::TsArrayType;
use swc_ecma_ast::TsEntityName;
use swc_ecma_ast::TsFnParam;
use swc_ecma_ast::TsFnType;
use swc_ecma_ast::TsIndexSignature;
use swc_ecma_ast::TsIntersectionType;
use swc_ecma_ast::TsKeywordType;
use swc_ecma_ast::TsKeywordTypeKind;
use swc_ecma_ast::TsLit;
use swc_ecma_ast::TsLitType;
use swc_ecma_ast::TsParenthesizedType;
use swc_ecma_ast::TsPropertySignature;
use swc_ecma_ast::TsRestType;
use swc_ecma_ast::TsTplLitType;
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

impl Optionality<Runtype> {
    pub fn negated(self) -> Optionality<Runtype> {
        match self {
            Optionality::Optional(it) => Runtype::StNot(it.into()).optional(),
            Optionality::Required(it) => Runtype::StNot(it.into()).required(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum RuntypeConst {
    Null,
    Bool(bool),
    Number(N),
    String(String),
}

impl RuntypeConst {
    pub fn to_json(self) -> Json {
        match self {
            RuntypeConst::Null => Json::Null,
            RuntypeConst::Bool(b) => Json::Bool(b),
            RuntypeConst::Number(n) => Json::Number(n),
            RuntypeConst::String(s) => Json::String(s),
        }
    }
    pub fn from_json(it: &Json) -> Result<Self> {
        match it {
            Json::Null => Ok(RuntypeConst::Null),
            Json::Bool(b) => Ok(RuntypeConst::Bool(*b)),
            Json::Number(n) => Ok(RuntypeConst::Number(n.clone())),
            Json::String(s) => Ok(RuntypeConst::String(s.clone())),
            _ => Err(anyhow!("not a const")),
        }
    }
    pub fn parse_int(it: i64) -> Self {
        Self::Number(N::parse_int(it))
    }
    pub fn parse_f64(value: f64) -> RuntypeConst {
        Self::Number(N::parse_f64(value))
    }
}

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd, Clone)]
pub enum TplLitTypeItem {
    String,
    Number,
    Boolean,
    StringConst(String),
    Quasis(String),
    OneOf(BTreeSet<TplLitTypeItem>),
}

fn escape_regex(lit: &str) -> String {
    // match the exact string

    lit.replace('\\', "\\\\")
        .replace('(', "\\(")
        .replace(')', "\\)")
        .replace('[', "\\[")
        .replace(']', "\\]")
        .replace('{', "\\{")
        .replace('}', "\\}")
        .replace('.', "\\.")
        .replace('*', "\\*")
        .replace('+', "\\+")
        .replace('?', "\\?")
        .replace('|', "\\|")
        .replace('^', "\\^")
        .replace('$', "\\$")
        .replace('/', "\\/")
}

impl TplLitTypeItem {
    pub fn one_of(vs: Vec<TplLitTypeItem>) -> TplLitTypeItem {
        let vs = vs.into_iter().collect::<BTreeSet<_>>();
        if vs.len() == 1 {
            vs.into_iter().next().expect("we just checked len")
        } else {
            TplLitTypeItem::OneOf(vs)
        }
    }

    pub fn regex_expr(&self) -> String {
        match self {
            TplLitTypeItem::String => "(.*)".to_string(),
            TplLitTypeItem::Number => r"(\d+(\.\d+)?)".to_string(),
            TplLitTypeItem::Boolean => "(true|false)".to_string(),
            TplLitTypeItem::Quasis(lit) => {
                if lit.is_empty() {
                    return "".to_string();
                }
                let escaped_lit = escape_regex(lit);
                format!("({})", escaped_lit)
            }
            TplLitTypeItem::OneOf(vs) => {
                let mut vs = vs.iter().collect::<Vec<_>>();
                vs.sort();
                let vs = vs
                    .into_iter()
                    .map(|it| it.regex_expr())
                    .filter(|it| !it.is_empty())
                    .collect::<Vec<_>>();
                let vs = vs.join("|");
                format!("({})", vs)
            }
            TplLitTypeItem::StringConst(lit) => {
                if lit.is_empty() {
                    return "".to_string();
                }
                let escaped_lit = escape_regex(lit);
                format!("({})", escaped_lit)
            }
        }
    }

    pub fn describe_vec(vs: &[Self]) -> String {
        vs.iter()
            .map(|it| match it {
                TplLitTypeItem::String => "${string}".to_string(),
                TplLitTypeItem::Number => "${number}".to_string(),
                TplLitTypeItem::Boolean => "${boolean}".to_string(),
                TplLitTypeItem::StringConst(v) => {
                    format!("\"{}\"", v)
                }
                TplLitTypeItem::Quasis(s) => s.clone(),
                TplLitTypeItem::OneOf(values) => {
                    let mut values = values.iter().collect::<Vec<_>>();
                    values.sort();
                    let values = values
                        .into_iter()
                        .map(|it| Self::describe_vec(std::slice::from_ref(it)))
                        .collect::<Vec<_>>()
                        .join(" | ");
                    format!("({})", values)
                }
            })
            .collect()
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum Runtype {
    Null,
    Boolean,
    String,
    Number,
    Any,
    AnyArrayLike,
    StringWithFormat(String),
    StringFormatExtends(Vec<String>),
    NumberWithFormat(String),
    NumberFormatExtends(Vec<String>),
    TplLitType(Vec<TplLitTypeItem>),
    Object {
        vs: BTreeMap<String, Optionality<Runtype>>,
        rest: Option<Box<Runtype>>,
    },
    MappedRecord {
        key: Box<Runtype>,
        rest: Box<Runtype>,
    },
    Array(Box<Runtype>),
    Tuple {
        prefix_items: Vec<Runtype>,
        items: Option<Box<Runtype>>,
    },
    Ref(String),

    AnyOf(BTreeSet<Runtype>),
    AllOf(BTreeSet<Runtype>),
    Const(RuntypeConst),
    Codec(CodecName),
    // semantic types
    StNever,
    StNot(Box<Runtype>),
    Function,
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

struct UnionMerger(BTreeSet<Runtype>);

impl UnionMerger {
    fn new() -> Self {
        Self(BTreeSet::new())
    }
    fn consume(&mut self, vs: Vec<Runtype>) {
        for it in vs.into_iter() {
            match it {
                Runtype::AnyOf(vs) => self.consume(vs.into_iter().collect()),
                _ => {
                    self.0.insert(it);
                }
            }
        }
    }

    pub fn schema(vs: Vec<Runtype>) -> Runtype {
        let mut acc = Self::new();
        acc.consume(vs);
        Runtype::AnyOf(acc.0)
    }
}

impl Runtype {
    pub fn object(vs: Vec<(String, Optionality<Runtype>)>, rest: Option<Box<Runtype>>) -> Self {
        Self::Object {
            vs: vs.into_iter().collect(),
            rest,
        }
    }

    pub fn required(self) -> Optionality<Runtype> {
        Optionality::Required(self)
    }
    pub fn optional(self) -> Optionality<Runtype> {
        Optionality::Optional(self)
    }

    pub fn any_of(vs: Vec<Runtype>) -> Self {
        match vs.len() {
            0 => Runtype::StNever,
            1 => vs.into_iter().next().expect("we just checked len"),
            _ => UnionMerger::schema(vs),
        }
    }
    pub fn all_of(vs: Vec<Runtype>) -> Self {
        match vs.len() {
            1 => vs.into_iter().next().expect("we just checked len"),
            _ => {
                let mut obj_kvs: Vec<(String, Optionality<Runtype>)> = vec![];
                let mut all_objects = true;
                let mut rest_is_none = true;

                for v in vs.iter() {
                    match v {
                        Runtype::Object { vs, rest } => {
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
                    Runtype::object(obj_kvs, None)
                } else {
                    Self::AllOf(BTreeSet::from_iter(vs))
                }
            }
        }
    }

    pub fn remove_nots_of_intersections_and_empty_of_union(
        self,
        validators: &[&NamedSchema],
        ctx: &mut SemTypeContext,
    ) -> anyhow::Result<Runtype> {
        match self {
            Runtype::AllOf(vs) => {
                let semantic = Runtype::AllOf(vs.clone()).to_sem_type(validators, ctx)?;
                let is_empty = semantic.is_empty(ctx);
                if is_empty {
                    return Ok(Runtype::StNever);
                }

                let vs = vs
                    .into_iter()
                    .map(|it| it.remove_nots_of_intersections_and_empty_of_union(validators, ctx))
                    .collect::<Result<Vec<_>>>()?;

                let vs = vs
                    .into_iter()
                    .filter(|it| !matches!(it, Runtype::StNot(_)))
                    .collect();
                Ok(Runtype::all_of(vs))
            }
            Runtype::AnyOf(vs) => {
                let vs = vs
                    .into_iter()
                    .map(|it| it.to_sem_type(validators, ctx).map(|r| (it, r)))
                    .collect::<Result<Vec<_>>>()?;
                let vs: Vec<Runtype> = vs
                    .into_iter()
                    .filter(|(_, semantic)| {
                        let is_empty = semantic.is_empty(ctx);
                        !is_empty
                    })
                    .map(|(it, _)| it)
                    .collect();

                let vs = vs
                    .into_iter()
                    .map(|it| it.remove_nots_of_intersections_and_empty_of_union(validators, ctx))
                    .collect::<Result<Vec<_>>>()?;
                Ok(Runtype::any_of(vs))
            }
            v => Ok(v),
        }
    }
}

fn ts_string_brands(brands: &[String]) -> TsType {
    let mut members = vec![];

    for (idx, brand) in brands.iter().enumerate() {
        let n = idx + 1;
        let member = TsTypeElement::TsPropertySignature(TsPropertySignature {
            span: DUMMY_SP,
            readonly: false,
            key: format!("__customType{n}").into(),
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
                        value: brand.clone().into(),
                        raw: None,
                    }),
                })),
            })),
            type_params: None,
        });
        members.push(member);
    }

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
                    members,
                })),
            ],
        },
    ))
}

fn ts_number_brands(brands: &[String]) -> TsType {
    let mut members = vec![];

    for (idx, brand) in brands.iter().enumerate() {
        let n = idx + 1;
        let member = TsTypeElement::TsPropertySignature(TsPropertySignature {
            span: DUMMY_SP,
            readonly: false,
            key: format!("__customType{n}").into(),
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
                        value: brand.clone().into(),
                        raw: None,
                    }),
                })),
            })),
            type_params: None,
        });
        members.push(member);
    }

    TsType::TsUnionOrIntersectionType(TsUnionOrIntersectionType::TsIntersectionType(
        TsIntersectionType {
            span: DUMMY_SP,
            types: vec![
                Box::new(TsType::TsKeywordType(TsKeywordType {
                    span: DUMMY_SP,
                    kind: TsKeywordTypeKind::TsNumberKeyword,
                })),
                Box::new(TsType::TsTypeLit(TsTypeLit {
                    span: DUMMY_SP,
                    members,
                })),
            ],
        },
    ))
}
impl Runtype {
    pub fn to_ts_type(&self) -> TsType {
        match self {
            Runtype::Null => TsType::TsKeywordType(TsKeywordType {
                span: DUMMY_SP,
                kind: TsKeywordTypeKind::TsNullKeyword,
            }),
            Runtype::Boolean => TsType::TsKeywordType(TsKeywordType {
                span: DUMMY_SP,
                kind: TsKeywordTypeKind::TsBooleanKeyword,
            }),
            Runtype::String => TsType::TsKeywordType(TsKeywordType {
                span: DUMMY_SP,
                kind: TsKeywordTypeKind::TsStringKeyword,
            }),
            Runtype::Number => TsType::TsKeywordType(TsKeywordType {
                span: DUMMY_SP,
                kind: TsKeywordTypeKind::TsNumberKeyword,
            }),
            Runtype::Any => TsType::TsKeywordType(TsKeywordType {
                span: DUMMY_SP,
                kind: TsKeywordTypeKind::TsAnyKeyword,
            }),
            Runtype::Object { vs, rest } => {
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
            Runtype::Array(ty) => {
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
            Runtype::Tuple {
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
            Runtype::Ref(name) => TsType::TsTypeRef(TsTypeRef {
                span: DUMMY_SP,
                type_name: TsEntityName::Ident(Ident {
                    span: DUMMY_SP,
                    sym: name.clone().into(),
                    optional: false,
                }),
                type_params: None,
            }),
            Runtype::StringWithFormat(fmt) => ts_string_brands(std::slice::from_ref(fmt)),
            Runtype::StringFormatExtends(vs) => ts_string_brands(vs),
            Runtype::NumberWithFormat(fmt) => ts_number_brands(std::slice::from_ref(fmt)),
            Runtype::NumberFormatExtends(vs) => ts_number_brands(vs),
            Runtype::Codec(c) => match c {
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
            Runtype::AnyOf(vs) =>
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
            Runtype::AllOf(vs) =>
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
            Runtype::Const(v) => match v {
                RuntypeConst::Null => TsType::TsKeywordType(TsKeywordType {
                    span: DUMMY_SP,
                    kind: TsKeywordTypeKind::TsNullKeyword,
                }),
                RuntypeConst::Bool(b) => TsType::TsLitType(TsLitType {
                    span: DUMMY_SP,
                    lit: TsLit::Bool(Bool {
                        span: DUMMY_SP,
                        value: *b,
                    }),
                }),
                RuntypeConst::Number(n) => TsType::TsLitType(TsLitType {
                    span: DUMMY_SP,
                    lit: TsLit::Number(swc_ecma_ast::Number {
                        span: DUMMY_SP,
                        value: n.to_f64(),
                        raw: None,
                    }),
                }),
                RuntypeConst::String(v) => TsType::TsLitType(TsLitType {
                    span: DUMMY_SP,
                    lit: TsLit::Str(Str {
                        span: DUMMY_SP,
                        value: v.clone().into(),
                        raw: None,
                    }),
                }),
            },
            Runtype::StNever => TsType::TsKeywordType(TsKeywordType {
                span: DUMMY_SP,
                kind: TsKeywordTypeKind::TsNeverKeyword,
            }),
            Runtype::StNot(v) => TsType::TsTypeRef(TsTypeRef {
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
            Runtype::AnyArrayLike => TsType::TsTypeRef(TsTypeRef {
                span: DUMMY_SP,
                type_name: Ident {
                    span: DUMMY_SP,
                    sym: "Array".into(),
                    optional: false,
                }
                .into(),
                type_params: None,
            }),
            Runtype::TplLitType(items) => {
                let mut types: Vec<Box<TsType>> = vec![];
                let mut quasis: Vec<TplElement> = vec![];

                for item in items {
                    match item {
                        TplLitTypeItem::String => {
                            types.push(
                                TsType::TsKeywordType(TsKeywordType {
                                    span: DUMMY_SP,
                                    kind: TsKeywordTypeKind::TsStringKeyword,
                                })
                                .into(),
                            );
                        }
                        TplLitTypeItem::Number => {
                            types.push(
                                TsType::TsKeywordType(TsKeywordType {
                                    span: DUMMY_SP,
                                    kind: TsKeywordTypeKind::TsNumberKeyword,
                                })
                                .into(),
                            );
                        }
                        TplLitTypeItem::Boolean => {
                            types.push(
                                TsType::TsKeywordType(TsKeywordType {
                                    span: DUMMY_SP,
                                    kind: TsKeywordTypeKind::TsBooleanKeyword,
                                })
                                .into(),
                            );
                        }
                        TplLitTypeItem::Quasis(str) => {
                            quasis.push(TplElement {
                                span: DUMMY_SP,
                                tail: false,
                                raw: str.clone().into(),
                                cooked: Some(str.clone().into()),
                            });
                        }
                        TplLitTypeItem::OneOf(vs) => {
                            // do not recurse
                            let mut types2: Vec<Box<TsType>> = vec![];

                            for v in vs {
                                match v {
                                    TplLitTypeItem::String => {
                                        types2.push(
                                            TsType::TsKeywordType(TsKeywordType {
                                                span: DUMMY_SP,
                                                kind: TsKeywordTypeKind::TsStringKeyword,
                                            })
                                            .into(),
                                        );
                                    }
                                    TplLitTypeItem::Number => {
                                        types2.push(
                                            TsType::TsKeywordType(TsKeywordType {
                                                span: DUMMY_SP,
                                                kind: TsKeywordTypeKind::TsNumberKeyword,
                                            })
                                            .into(),
                                        );
                                    }
                                    TplLitTypeItem::Boolean => {
                                        types2.push(
                                            TsType::TsKeywordType(TsKeywordType {
                                                span: DUMMY_SP,
                                                kind: TsKeywordTypeKind::TsBooleanKeyword,
                                            })
                                            .into(),
                                        );
                                    }
                                    TplLitTypeItem::StringConst(v) => {
                                        types2.push(
                                            TsType::TsLitType(TsLitType {
                                                span: DUMMY_SP,
                                                lit: TsLit::Str(Str {
                                                    span: DUMMY_SP,
                                                    value: v.clone().into(),
                                                    raw: None,
                                                }),
                                            })
                                            .into(),
                                        );
                                    }
                                    TplLitTypeItem::Quasis(_) => unreachable!(),
                                    TplLitTypeItem::OneOf(_) => unreachable!(),
                                }
                            }

                            types.push(
                                TsType::TsUnionOrIntersectionType(
                                    TsUnionOrIntersectionType::TsUnionType(TsUnionType {
                                        span: DUMMY_SP,
                                        types: types2,
                                    }),
                                )
                                .into(),
                            );
                        }
                        TplLitTypeItem::StringConst(v) => {
                            types.push(
                                TsType::TsLitType(TsLitType {
                                    span: DUMMY_SP,
                                    lit: TsLit::Str(Str {
                                        span: DUMMY_SP,
                                        value: v.clone().into(),
                                        raw: None,
                                    }),
                                })
                                .into(),
                            );
                        }
                    }
                }
                TsType::TsLitType(TsLitType {
                    span: DUMMY_SP,
                    lit: TsLit::Tpl(TsTplLitType {
                        span: DUMMY_SP,
                        types,
                        quasis,
                    }),
                })
            }
            Runtype::Function => TsType::TsFnOrConstructorType(
                swc_ecma_ast::TsFnOrConstructorType::TsFnType(TsFnType {
                    span: DUMMY_SP,
                    params: vec![],
                    type_params: None,
                    type_ann: TsTypeAnn {
                        span: DUMMY_SP,
                        type_ann: TsType::TsKeywordType(TsKeywordType {
                            span: DUMMY_SP,
                            kind: TsKeywordTypeKind::TsVoidKeyword,
                        })
                        .into(),
                    }
                    .into(),
                }),
            ),
            Runtype::MappedRecord { key, rest } => {
                let k = key.to_ts_type();
                let v = rest.to_ts_type();
                // Record<k, v>
                TsType::TsTypeRef(TsTypeRef {
                    span: DUMMY_SP,
                    type_name: Ident {
                        span: DUMMY_SP,
                        sym: "Record".into(),
                        optional: false,
                    }
                    .into(),
                    type_params: Some(Box::new(TsTypeParamInstantiation {
                        span: DUMMY_SP,
                        params: vec![k.into(), v.into()],
                    })),
                })
            }
        }
    }
}
