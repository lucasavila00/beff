use super::json::N;
use crate::ast::json::Json;
use crate::subtyping::semtype::SemTypeContext;
use crate::subtyping::semtype::SemTypeOps;
use crate::subtyping::ToSemType;
use crate::NamedSchema;
use anyhow::anyhow;
use anyhow::Result;
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
}

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd, Clone)]
pub struct CustomFormat(pub String, pub Vec<String>);

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd, Clone)]
pub struct TplLitType(pub Vec<TplLitTypeItem>);

impl TplLitType {
    pub fn describe(&self) -> String {
        self.0
            .iter()
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
                        .map(|it| TplLitType(vec![it.clone()]).describe())
                        .collect::<Vec<_>>()
                        .join(" | ");
                    format!("({})", values)
                }
            })
            .collect()
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
pub enum Runtype {
    Null,
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
    // semantic types
    StNever,
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

    pub fn debug_print(&self) -> String {
        match self {
            Runtype::Null => "null".to_string(),
            Runtype::Boolean => "boolean".to_string(),
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
            Runtype::TplLitType(tpl_lit_type_items) => {
                format!("`{}`", tpl_lit_type_items.describe())
            }
            Runtype::Const(runtype_const) => runtype_const.clone().to_json().debug_print(),
            Runtype::Date => "Date".to_string(),
            Runtype::BigInt => "bigint".to_string(),
            Runtype::StNever => "never".to_string(),
            Runtype::StNot(runtype) => {
                let inner = runtype.debug_print();
                format!("Not<{}>", inner)
            }
            Runtype::Function => "Function".to_string(),
            Runtype::Ref(r) => r.clone(),
            Runtype::Array(runtype) => {
                let inner = runtype.debug_print();
                format!("Array<{}>", inner)
            }
            Runtype::Tuple {
                prefix_items,
                items,
            } => {
                let mut acc = vec![];

                for it in prefix_items.iter() {
                    acc.push(it.debug_print());
                }
                if let Some(items) = items.as_ref() {
                    acc.push(format!("...{}", items.debug_print()));
                }

                let args = acc.join(", ");
                format!("[{}]", args)
            }
            Runtype::AnyOf(btree_set) => {
                let inner = btree_set
                    .iter()
                    .map(|it| it.debug_print())
                    .collect::<Vec<_>>()
                    .join(" | ");

                format!("({})", inner)
            }
            Runtype::AllOf(btree_set) => {
                let inner = btree_set
                    .iter()
                    .map(|it| it.debug_print())
                    .collect::<Vec<_>>()
                    .join(" & ");

                format!("({})", inner)
            }
            Runtype::MappedRecord { key, rest } => {
                let k = key.debug_print();
                let r = rest.debug_print();
                format!("Record<{}, {}>", k, r)
            }
            Runtype::Object { vs, rest } => {
                let mut acc = vec![];

                for (k, v) in vs.iter() {
                    match v {
                        Optionality::Optional(it) => {
                            let v = it.debug_print();
                            acc.push(format!("\"{}\"?: {}", k, v));
                        }
                        Optionality::Required(it) => {
                            let v = it.debug_print();
                            acc.push(format!("\"{}\": {}", k, v));
                        }
                    };
                }
                if let Some(rest) = rest.as_ref() {
                    let r = rest.debug_print();
                    acc.push(format!("[key: string]: {}", r));
                }

                let args = acc.join(", ");
                format!("{{ {} }}", args)
            }
        }
    }
}
