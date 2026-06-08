use super::json::N;
use crate::NamedSchema;
use crate::RuntypeUUID;
use crate::ast::json::Json;
use crate::subtyping::ToSemType;
use crate::subtyping::semtype::SemTypeContext;
use crate::subtyping::semtype::SemTypeOps;
use anyhow::Result;
use anyhow::anyhow;
use std::cmp::Ordering;
use std::collections::BTreeMap;
use std::collections::BTreeSet;
use std::hash::Hash;
use std::hash::Hasher;

#[derive(Debug, PartialEq, Eq, Clone, PartialOrd, Ord, Hash)]
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
            Optionality::Optional(it) => Runtype::st_not(it.into()).optional(),
            Optionality::Required(it) => Runtype::st_not(it.into()).required(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
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

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd, Clone, Copy)]
pub enum TypedArrayKind {
    Uint8Array,
    Uint8ClampedArray,
    Uint16Array,
    Uint32Array,
    Int8Array,
    Int16Array,
    Int32Array,
    Float32Array,
    Float64Array,
    BigInt64Array,
    BigUint64Array,
}

impl TypedArrayKind {
    pub fn js_name(&self) -> &'static str {
        match self {
            TypedArrayKind::Uint8Array => "Uint8Array",
            TypedArrayKind::Uint8ClampedArray => "Uint8ClampedArray",
            TypedArrayKind::Uint16Array => "Uint16Array",
            TypedArrayKind::Uint32Array => "Uint32Array",
            TypedArrayKind::Int8Array => "Int8Array",
            TypedArrayKind::Int16Array => "Int16Array",
            TypedArrayKind::Int32Array => "Int32Array",
            TypedArrayKind::Float32Array => "Float32Array",
            TypedArrayKind::Float64Array => "Float64Array",
            TypedArrayKind::BigInt64Array => "BigInt64Array",
            TypedArrayKind::BigUint64Array => "BigUint64Array",
        }
    }

    pub fn all() -> Vec<TypedArrayKind> {
        vec![
            TypedArrayKind::Uint8Array,
            TypedArrayKind::Uint8ClampedArray,
            TypedArrayKind::Uint16Array,
            TypedArrayKind::Uint32Array,
            TypedArrayKind::Int8Array,
            TypedArrayKind::Int16Array,
            TypedArrayKind::Int32Array,
            TypedArrayKind::Float32Array,
            TypedArrayKind::Float64Array,
            TypedArrayKind::BigInt64Array,
            TypedArrayKind::BigUint64Array,
        ]
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Default)]
pub struct RuntypeMetadata {
    pub description: Option<String>,
}

#[derive(Debug, Clone)]
pub struct Runtype {
    pub kind: RuntypeKind,
    pub metadata: RuntypeMetadata,
}

impl PartialEq for Runtype {
    fn eq(&self, other: &Self) -> bool {
        self.kind == other.kind
    }
}

impl Eq for Runtype {}

impl PartialOrd for Runtype {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for Runtype {
    fn cmp(&self, other: &Self) -> Ordering {
        self.kind.cmp(&other.kind)
    }
}

impl Hash for Runtype {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.kind.hash(state);
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct IndexedProperty {
    pub key: Runtype,
    pub value: Optionality<Runtype>,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum RuntypeKind {
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
    Ref(RuntypeUUID),

    AnyOf(BTreeSet<Runtype>),
    AllOf(BTreeSet<Runtype>),
    Const(RuntypeConst),
    // semantic types
    Never,
    StNot(Box<Runtype>),
    Function,
    Date,
    BigInt,
    TypedArray(TypedArrayKind),
    Map(Box<Runtype>, Box<Runtype>),
    Set(Box<Runtype>),
}

impl Runtype {
    pub const fn new(kind: RuntypeKind) -> Self {
        Self {
            kind,
            metadata: RuntypeMetadata { description: None },
        }
    }

    pub fn with_description(mut self, description: String) -> Self {
        self.metadata.description = Some(description);
        self
    }

    pub const fn null() -> Self {
        Self::new(RuntypeKind::Null)
    }
    pub const fn undefined() -> Self {
        Self::new(RuntypeKind::Undefined)
    }
    pub const fn void() -> Self {
        Self::new(RuntypeKind::Void)
    }
    pub const fn boolean() -> Self {
        Self::new(RuntypeKind::Boolean)
    }
    pub const fn string() -> Self {
        Self::new(RuntypeKind::String)
    }
    pub const fn number() -> Self {
        Self::new(RuntypeKind::Number)
    }
    pub const fn any() -> Self {
        Self::new(RuntypeKind::Any)
    }
    pub const fn any_array_like() -> Self {
        Self::new(RuntypeKind::AnyArrayLike)
    }
    pub const fn never() -> Self {
        Self::new(RuntypeKind::Never)
    }
    pub const fn function() -> Self {
        Self::new(RuntypeKind::Function)
    }
    pub const fn date() -> Self {
        Self::new(RuntypeKind::Date)
    }
    pub const fn bigint() -> Self {
        Self::new(RuntypeKind::BigInt)
    }
    pub fn string_with_format(format: CustomFormat) -> Self {
        Self::new(RuntypeKind::StringWithFormat(format))
    }
    pub fn number_with_format(format: CustomFormat) -> Self {
        Self::new(RuntypeKind::NumberWithFormat(format))
    }
    pub fn tpl_lit_type(tpl: TplLitType) -> Self {
        Self::new(RuntypeKind::TplLitType(tpl))
    }
    pub fn array(item: Box<Runtype>) -> Self {
        Self::new(RuntypeKind::Array(item))
    }
    pub fn tuple(prefix_items: Vec<Runtype>, items: Option<Box<Runtype>>) -> Self {
        Self::new(RuntypeKind::Tuple {
            prefix_items,
            items,
        })
    }
    pub fn ref_(name: RuntypeUUID) -> Self {
        Self::new(RuntypeKind::Ref(name))
    }
    pub fn const_(value: RuntypeConst) -> Self {
        Self::new(RuntypeKind::Const(value))
    }
    pub fn st_not(inner: Box<Runtype>) -> Self {
        Self::new(RuntypeKind::StNot(inner))
    }
    pub fn typed_array(kind: TypedArrayKind) -> Self {
        Self::new(RuntypeKind::TypedArray(kind))
    }
    pub fn map(key: Box<Runtype>, value: Box<Runtype>) -> Self {
        Self::new(RuntypeKind::Map(key, value))
    }
    pub fn set(value: Box<Runtype>) -> Self {
        Self::new(RuntypeKind::Set(value))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn runtype_metadata_does_not_affect_semantic_identity() {
        let left = Runtype::string().with_description("left".to_string());
        let right = Runtype::string().with_description("right".to_string());

        assert_eq!(left, right);

        let mut set = BTreeSet::new();
        set.insert(left);
        set.insert(right);
        assert_eq!(set.len(), 1);
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
                Runtype {
                    kind: RuntypeKind::AnyOf(vs),
                    ..
                } => self.consume(vs.into_iter().collect()),
                other => {
                    self.0.insert(other);
                }
            }
        }
    }

    pub fn schema(vs: Vec<Runtype>) -> Runtype {
        let mut acc = Self::new();
        acc.consume(vs);
        Runtype::new(RuntypeKind::AnyOf(acc.0))
    }
}
pub struct DebugPrintCtx<'a> {
    pub all_names: &'a [&'a RuntypeUUID],
    pub type_with_args_names: &'a mut BTreeMap<RuntypeUUID, String>,
}
impl Runtype {
    pub fn as_string_const(&self) -> Option<&str> {
        match &self.kind {
            RuntypeKind::TplLitType(TplLitType(items)) => match items.as_slice() {
                [TplLitTypeItem::StringConst(s)] => Some(s),
                _ => None,
            },
            _ => None,
        }
    }
    pub fn object(vs: Vec<(String, Optionality<Runtype>)>) -> Self {
        Self::new(RuntypeKind::Object {
            vs: vs.into_iter().collect(),
            indexed_properties: None,
        })
    }
    pub fn record(key: Runtype, value: Optionality<Runtype>) -> Self {
        Self::new(RuntypeKind::Object {
            vs: BTreeMap::new(),
            indexed_properties: Some(Box::new(IndexedProperty { key, value })),
        })
    }
    pub fn any_object() -> Runtype {
        let mut vs = BTreeSet::new();
        vs.insert(Runtype::number());
        vs.insert(Runtype::string());
        Runtype::record(
            Runtype::new(RuntypeKind::AnyOf(vs)),
            Optionality::Required(Runtype::any()),
        )
    }
    pub fn extract_single_string_const(&self) -> Option<String> {
        match &self.kind {
            RuntypeKind::TplLitType(TplLitType(items)) => match items.as_slice() {
                [TplLitTypeItem::StringConst(s)] => Some(s.clone()),
                _ => None,
            },
            _ => None,
        }
    }

    pub fn single_string_const(it: &str) -> Self {
        Runtype::tpl_lit_type(TplLitType(vec![TplLitTypeItem::StringConst(
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
            0 => Runtype::never(),
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
                    match &v.kind {
                        RuntypeKind::Object {
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
                                return Self::new(RuntypeKind::AllOf(BTreeSet::from_iter(
                                    all_of_items,
                                )));
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
                    Self::new(RuntypeKind::AllOf(BTreeSet::from_iter(all_of_items)))
                }
            }
        }
    }

    pub fn remove_nots_of_intersections_and_empty_of_union(
        self,
        validators: &[&NamedSchema],
        ctx: &mut SemTypeContext,
    ) -> anyhow::Result<Runtype> {
        match self.kind {
            RuntypeKind::AllOf(vs) => {
                let semantic =
                    Runtype::new(RuntypeKind::AllOf(vs.clone())).to_sem_type(validators, ctx)?;
                let is_empty = semantic.is_empty(ctx)?;
                if is_empty {
                    return Ok(Runtype::never());
                }

                let vs = vs
                    .into_iter()
                    .map(|it| it.remove_nots_of_intersections_and_empty_of_union(validators, ctx))
                    .collect::<Result<Vec<_>>>()?;

                let vs = vs
                    .into_iter()
                    .filter(|it| !matches!(it.kind, RuntypeKind::StNot(_)))
                    .collect();
                Ok(Runtype::all_of(vs))
            }
            RuntypeKind::AnyOf(vs) => {
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
            v => Ok(Runtype::new(v)),
        }
    }

    pub fn debug_print(&self, ctx: &DebugPrintCtx) -> String {
        match &self.kind {
            RuntypeKind::Undefined => "undefined".to_string(),
            RuntypeKind::Null => "null".to_string(),
            RuntypeKind::Boolean => "boolean".to_string(),
            RuntypeKind::Void => "void".to_string(),
            RuntypeKind::String => "string".to_string(),
            RuntypeKind::Number => "number".to_string(),
            RuntypeKind::Any => "any".to_string(),
            RuntypeKind::AnyArrayLike => "Array<any>".to_string(),
            RuntypeKind::StringWithFormat(CustomFormat(first, rest)) => {
                let mut acc = format!("StringFormat<\"{}\">", first);

                for it in rest.iter() {
                    acc = format!("StringFormatExtends<{}, \"{}\">", acc, it);
                }

                acc
            }
            RuntypeKind::NumberWithFormat(CustomFormat(first, rest)) => {
                let mut acc = format!("NumberFormat<\"{}\">", first);

                for it in rest.iter() {
                    acc = format!("NumberFormatExtends<{}, \"{}\">", acc, it);
                }

                acc
            }
            RuntypeKind::TplLitType(tpl_lit_type_items) => tpl_lit_type_items.describe(),
            RuntypeKind::Const(runtype_const) => runtype_const.clone().to_json().debug_print(),
            RuntypeKind::Date => "Date".to_string(),
            RuntypeKind::BigInt => "bigint".to_string(),
            RuntypeKind::TypedArray(kind) => kind.js_name().to_string(),
            RuntypeKind::Never => "never".to_string(),
            RuntypeKind::StNot(runtype) => {
                let inner = runtype.debug_print(ctx);
                format!("Not<{}>", inner)
            }
            RuntypeKind::Function => "Function".to_string(),
            RuntypeKind::Ref(r) => r.debug_print(ctx),
            RuntypeKind::Array(runtype) => {
                let inner = runtype.debug_print(ctx);
                format!("Array<{}>", inner)
            }
            RuntypeKind::Set(runtype) => {
                let inner = runtype.debug_print(ctx);
                format!("Set<{}>", inner)
            }
            RuntypeKind::Map(k, v) => {
                let k = k.debug_print(ctx);
                let v = v.debug_print(ctx);
                format!("Map<{}, {}>", k, v)
            }
            RuntypeKind::Tuple {
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
            RuntypeKind::AnyOf(btree_set) => {
                let inner = btree_set
                    .iter()
                    .map(|it| it.debug_print(ctx))
                    .collect::<Vec<_>>()
                    .join(" | ");

                format!("({})", inner)
            }
            RuntypeKind::AllOf(btree_set) => {
                let inner = btree_set
                    .iter()
                    .map(|it| it.debug_print(ctx))
                    .collect::<Vec<_>>()
                    .join(" & ");

                format!("({})", inner)
            }
            RuntypeKind::Object {
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
