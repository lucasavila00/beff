use super::json::N;
use crate::NamedSchema;
use crate::RuntypeName;
use crate::ast::json::Json;
use crate::subtyping::ToSemType;
use crate::subtyping::semtype::SemTypeContext;
use crate::subtyping::semtype::SemTypeOps;
use anyhow::Result;
use anyhow::anyhow;
use std::collections::BTreeMap;
use std::collections::BTreeSet;

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
    Bool(bool),
    Number(N),
}

impl RuntypeConst {
    pub fn to_json(self) -> Json {
        match self {
            RuntypeConst::Bool(b) => Json::Bool(b),
            RuntypeConst::Number(n) => Json::Number(n),
        }
    }
    pub fn from_json(it: &Json) -> Result<Self> {
        match it {
            Json::Bool(b) => Ok(RuntypeConst::Bool(*b)),
            Json::Number(n) => Ok(RuntypeConst::Number(n.clone())),
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
}

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd, Clone)]
pub struct CustomFormat(pub String, pub Vec<String>);

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd, Clone)]
pub struct TplLitType(pub Vec<TplLitTypeItem>);

impl TplLitType {
    pub fn describe(&self) -> String {
        match self.0.as_slice() {
            [TplLitTypeItem::StringConst(single_str)] => {
                let inner = single_str.clone();
                format!("\"{}\"", inner)
            }
            _ => {
                let inner = self
                    .0
                    .iter()
                    .map(|it| match it {
                        TplLitTypeItem::String => "${string}".to_string(),
                        TplLitTypeItem::Number => "${number}".to_string(),
                        TplLitTypeItem::Boolean => "${boolean}".to_string(),
                        TplLitTypeItem::StringConst(v) => v.clone(),
                        TplLitTypeItem::OneOf(values) => {
                            let mut values = values.iter().collect::<Vec<_>>();
                            values.sort();
                            let values = values
                                .into_iter()
                                .map(|it| TplLitType(vec![it.clone()]).describe())
                                .collect::<Vec<_>>()
                                .join(" | ");
                            format!("({})", values)
                        }
                    })
                    .collect::<String>();
                format!("`{}`", inner)
            }
        }
    }
    pub fn regex_expr(&self) -> String {
        let mut regex_exp = String::new();

        for item in &self.0 {
            regex_exp.push_str(&item.regex_expr());
        }
        regex_exp
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct IndexedProperty {
    pub key: Runtype,
    pub value: Optionality<Runtype>,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum Runtype {
    Null,
    Undefined,
    Void,
    Boolean,
    String,
    Number,
    Any,
    AnyArrayLike,
    StringWithFormat(CustomFormat),
    NumberWithFormat(CustomFormat),
    TplLitType(TplLitType),
    Object {
        vs: BTreeMap<String, Optionality<Runtype>>,
        indexed_properties: Option<Box<IndexedProperty>>,
    },
    Array(Box<Runtype>),
    Tuple {
        prefix_items: Vec<Runtype>,
        items: Option<Box<Runtype>>,
    },
    Ref(RuntypeName),

    AnyOf(BTreeSet<Runtype>),
    AllOf(BTreeSet<Runtype>),
    Const(RuntypeConst),
    // semantic types
    Never,
    StNot(Box<Runtype>),
    Function,
    Date,
    BigInt,
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
pub struct DebugPrintCtx<'a> {
    pub all_names: &'a [&'a RuntypeName],
}
impl Runtype {
    pub fn as_string_const(&self) -> Option<&str> {
        match self {
            Runtype::TplLitType(TplLitType(items)) => match items.as_slice() {
                [TplLitTypeItem::StringConst(s)] => Some(s),
                _ => None,
            },
            _ => None,
        }
    }
    pub fn object(vs: Vec<(String, Optionality<Runtype>)>) -> Self {
        Self::Object {
            vs: vs.into_iter().collect(),
            indexed_properties: None,
        }
    }
    pub fn record(key: Runtype, value: Optionality<Runtype>) -> Self {
        Self::Object {
            vs: BTreeMap::new(),
            indexed_properties: Some(Box::new(IndexedProperty { key, value })),
        }
    }
    pub fn any_object() -> Runtype {
        let mut vs = BTreeSet::new();
        vs.insert(Runtype::Number);
        vs.insert(Runtype::String);
        Runtype::record(Runtype::AnyOf(vs), Optionality::Required(Runtype::Any))
    }
    pub fn extract_single_string_const(&self) -> Option<String> {
        match self {
            Runtype::TplLitType(TplLitType(items)) => match items.as_slice() {
                [TplLitTypeItem::StringConst(s)] => Some(s.clone()),
                _ => None,
            },
            _ => None,
        }
    }

    pub fn single_string_const(it: &str) -> Self {
        Runtype::TplLitType(TplLitType(vec![TplLitTypeItem::StringConst(
            it.to_string(),
        )]))
    }

    pub fn required(self) -> Optionality<Runtype> {
        Optionality::Required(self)
    }
    pub fn optional(self) -> Optionality<Runtype> {
        Optionality::Optional(self)
    }

    pub fn any_of(vs: Vec<Runtype>) -> Self {
        match vs.len() {
            0 => Runtype::Never,
            1 => vs.into_iter().next().expect("we just checked len"),
            _ => UnionMerger::schema(vs),
        }
    }
    pub fn all_of(all_of_items: Vec<Runtype>) -> Self {
        match all_of_items.len() {
            1 => all_of_items
                .into_iter()
                .next()
                .expect("we just checked len"),
            _ => {
                let mut obj_kvs: Vec<(String, Optionality<Runtype>)> = vec![];
                let mut all_objects = true;
                let mut rest_is_empty = true;

                for v in all_of_items.iter() {
                    match v {
                        Runtype::Object {
                            vs,
                            indexed_properties,
                        } => {
                            if !indexed_properties.is_none() {
                                rest_is_empty = false;
                                break;
                            }

                            // if it has the key but type is not the same, it is a conflict
                            let has_conflicts = obj_kvs.iter().any(|(k, v)| match vs.get(k) {
                                Some(other_v) => other_v != v,
                                None => false,
                            });

                            if has_conflicts {
                                return Self::AllOf(BTreeSet::from_iter(all_of_items));
                            }

                            obj_kvs.extend(vs.iter().map(|it| (it.0.clone(), it.1.clone())));
                        }
                        _ => {
                            all_objects = false;
                            break;
                        }
                    }
                }

                if rest_is_empty && all_objects && all_of_items.len() > 1 {
                    Runtype::object(obj_kvs)
                } else {
                    Self::AllOf(BTreeSet::from_iter(all_of_items))
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
                let is_empty = semantic.is_empty(ctx)?;
                if is_empty {
                    return Ok(Runtype::Never);
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
                let mut new_vs = vec![];
                for v in vs.into_iter() {
                    let is_empty = v.1.is_empty(ctx)?;
                    if is_empty {
                        continue;
                    }
                    new_vs.push(v.0);
                }

                let vs = new_vs
                    .into_iter()
                    .map(|it| it.remove_nots_of_intersections_and_empty_of_union(validators, ctx))
                    .collect::<Result<Vec<_>>>()?;
                Ok(Runtype::any_of(vs))
            }
            v => Ok(v),
        }
    }

    pub fn debug_print(&self, ctx: &DebugPrintCtx) -> String {
        match self {
            Runtype::Undefined => "undefined".to_string(),
            Runtype::Null => "null".to_string(),
            Runtype::Boolean => "boolean".to_string(),
            Runtype::Void => "void".to_string(),
            Runtype::String => "string".to_string(),
            Runtype::Number => "number".to_string(),
            Runtype::Any => "any".to_string(),
            Runtype::AnyArrayLike => "Array<any>".to_string(),
            Runtype::StringWithFormat(CustomFormat(first, rest)) => {
                let mut acc = format!("StringFormat<\"{}\">", first);

                for it in rest.iter() {
                    acc = format!("StringFormatExtends<{}, \"{}\">", acc, it);
                }

                acc
            }
            Runtype::NumberWithFormat(CustomFormat(first, rest)) => {
                let mut acc = format!("NumberFormat<\"{}\">", first);

                for it in rest.iter() {
                    acc = format!("NumberFormatExtends<{}, \"{}\">", acc, it);
                }

                acc
            }
            Runtype::TplLitType(tpl_lit_type_items) => tpl_lit_type_items.describe(),
            Runtype::Const(runtype_const) => runtype_const.clone().to_json().debug_print(),
            Runtype::Date => "Date".to_string(),
            Runtype::BigInt => "bigint".to_string(),
            Runtype::Never => "never".to_string(),
            Runtype::StNot(runtype) => {
                let inner = runtype.debug_print(ctx);
                format!("Not<{}>", inner)
            }
            Runtype::Function => "Function".to_string(),
            Runtype::Ref(r) => r.debug_print(ctx.all_names),
            Runtype::Array(runtype) => {
                let inner = runtype.debug_print(ctx);
                format!("Array<{}>", inner)
            }
            Runtype::Tuple {
                prefix_items,
                items,
            } => {
                let mut acc = vec![];

                for it in prefix_items.iter() {
                    acc.push(it.debug_print(ctx));
                }
                if let Some(items) = items.as_ref() {
                    acc.push(format!("...{}", items.debug_print(ctx)));
                }

                let args = acc.join(", ");
                format!("[{}]", args)
            }
            Runtype::AnyOf(btree_set) => {
                let inner = btree_set
                    .iter()
                    .map(|it| it.debug_print(ctx))
                    .collect::<Vec<_>>()
                    .join(" | ");

                format!("({})", inner)
            }
            Runtype::AllOf(btree_set) => {
                let inner = btree_set
                    .iter()
                    .map(|it| it.debug_print(ctx))
                    .collect::<Vec<_>>()
                    .join(" & ");

                format!("({})", inner)
            }
            Runtype::Object {
                vs,
                indexed_properties,
            } => {
                let mut acc = vec![];

                for (k, v) in vs.iter() {
                    let value = v.inner().debug_print(ctx);
                    let optionality = if v.is_required() { "" } else { "?" };
                    acc.push(format!("\"{}\"{}: {}", k, optionality, value));
                }
                for indexed_property in indexed_properties.iter() {
                    let key = indexed_property.key.debug_print(ctx);
                    let value = indexed_property.value.inner().debug_print(ctx);
                    let optionality = if indexed_property.value.is_required() {
                        ""
                    } else {
                        "?"
                    };
                    acc.push(format!("[key{}: {}]: {}", optionality, key, value));
                }

                let args = acc.join(", ");
                format!("{{ {} }}", args)
            }
        }
    }
}
