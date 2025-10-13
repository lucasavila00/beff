use std::rc::Rc;

use crate::ast::{
    json::N,
    json_schema::{CodecName, TplLitTypeItem},
};

use super::{
    bdd::{list_is_empty, mapped_record_is_empty, mapping_is_empty, Bdd, BddOps},
    evidence::{ProperSubtypeEvidence, ProperSubtypeEvidenceResult},
    semtype::SemTypeContext,
};

pub type BasicTypeCode = u32;
pub type BasicTypeBitSet = u32;
pub type NumberRepresentation = N;

#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug, PartialOrd, Ord)]

pub enum SubTypeTag {
    Boolean = 1 << 0x1,
    Number = 1 << 0x2,
    String = 1 << 0x3,
    Null = 1 << 0x4,
    Mapping = 1 << 0x5,
    Void = 1 << 0x6,
    List = 1 << 0x7,
    Function = 1 << 0x8,
    MappedRecord = 1 << 0x9,
}

pub const VAL: u32 = 1 << 1 | 1 << 2 | 1 << 3 | 1 << 4 | 1 << 5 | 1 << 6 | 1 << 7 | 1 << 8 | 1 << 9;

impl SubTypeTag {
    pub fn code(&self) -> BasicTypeCode {
        *self as u32
    }

    pub fn all() -> Vec<SubTypeTag> {
        // Order matters for decision at materialization time
        vec![
            SubTypeTag::String,
            SubTypeTag::Boolean,
            SubTypeTag::Number,
            SubTypeTag::Void,
            SubTypeTag::Null,
            SubTypeTag::Mapping,
            SubTypeTag::List,
            SubTypeTag::Function,
        ]
    }
}

#[derive(Debug)]
pub enum SubType {
    False(SubTypeTag),
    True(SubTypeTag),
    Proper(Rc<ProperSubtype>),
}

impl SubType {
    fn number_subtype(allowed: bool, values: Vec<NumberRepresentationOrFormat>) -> SubType {
        if values.is_empty() {
            if allowed {
                return SubType::False(SubTypeTag::Number);
            }
            return SubType::True(SubTypeTag::Number);
        }
        SubType::Proper(ProperSubtype::Number { allowed, values }.into())
    }
    fn string_subtype(allowed: bool, values: Vec<StringLitOrFormat>) -> SubType {
        if values.is_empty() {
            if allowed {
                return SubType::False(SubTypeTag::String);
            }
            return SubType::True(SubTypeTag::String);
        }
        SubType::Proper(ProperSubtype::String { allowed, values }.into())
    }
}

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd, Clone)]
pub enum StringLitOrFormat {
    Lit(String),
    Format(String),
    FormatExtends(Vec<String>),
    Codec(CodecName),
    Tpl(Vec<TplLitTypeItem>),
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum NumberRepresentationOrFormat {
    Lit(NumberRepresentation),
    Format(String),
    FormatExtends(Vec<String>),
}

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd)]
pub enum ProperSubtype {
    Boolean(bool),
    Number {
        allowed: bool,
        values: Vec<NumberRepresentationOrFormat>,
    },
    String {
        allowed: bool,
        values: Vec<StringLitOrFormat>,
    },
    Mapping(Rc<Bdd>),
    List(Rc<Bdd>),
    MappedRecord(Rc<Bdd>),
}

fn vec_union<K: PartialEq + Clone + Ord>(v1: &[K], v2: &[K]) -> Vec<K> {
    let mut values: Vec<K> = v1.iter().cloned().chain(v2.iter().cloned()).collect();
    values.sort();
    values.dedup();
    values
}

fn vec_intersect<K: PartialEq + Clone + Ord>(v1: &[K], v2: &[K]) -> Vec<K> {
    v1.iter().filter(|v| v2.contains(v)).cloned().collect()
}

fn vec_diff<K: PartialEq + Clone + Ord>(v1: &[K], v2: &[K]) -> Vec<K> {
    v1.iter().filter(|v| !v2.contains(v)).cloned().collect()
}

pub trait ProperSubtypeOps {
    // fn is_empty(&self, builder: &mut SemTypeContext) -> bool;
    fn is_empty_evidence(&self, builder: &mut SemTypeContext) -> ProperSubtypeEvidenceResult;
    fn intersect(&self, t2: &Rc<ProperSubtype>) -> Rc<SubType>;
    fn union(&self, t2: &Rc<ProperSubtype>) -> Rc<SubType>;
    fn diff(&self, t2: &Rc<ProperSubtype>) -> Rc<SubType>;
    fn complement(&self) -> Rc<ProperSubtype>;
}

impl ProperSubtypeOps for Rc<ProperSubtype> {
    fn is_empty_evidence(&self, builder: &mut SemTypeContext) -> ProperSubtypeEvidenceResult {
        match &**self {
            ProperSubtype::Boolean(b) => ProperSubtypeEvidence::Boolean(*b).to_result(),
            // Empty number sets don't use subtype representation.
            ProperSubtype::Number { allowed, values } => ProperSubtypeEvidence::Number {
                allowed: *allowed,
                values: values.clone(),
            }
            .to_result(),
            // Empty string sets don't use subtype representation.
            ProperSubtype::String { allowed, values } => ProperSubtypeEvidence::String {
                allowed: *allowed,
                values: values.clone(),
            }
            .to_result(),
            ProperSubtype::Mapping(bdd) => mapping_is_empty(bdd, builder),
            ProperSubtype::List(bdd) => list_is_empty(bdd, builder),
            ProperSubtype::MappedRecord(bdd) => mapped_record_is_empty(bdd, builder),
        }
    }

    fn intersect(&self, t2: &Rc<ProperSubtype>) -> Rc<SubType> {
        match (&**self, &**t2) {
            (ProperSubtype::Boolean(b1), ProperSubtype::Boolean(b2)) => {
                if b1 == b2 {
                    return SubType::Proper(self.clone()).into();
                }
                SubType::False(SubTypeTag::Boolean).into()
            }
            (
                ProperSubtype::Number {
                    allowed: a1,
                    values: v1,
                },
                ProperSubtype::Number {
                    allowed: a2,
                    values: v2,
                },
            ) => match (*a1, *a2) {
                (true, true) => SubType::number_subtype(true, vec_intersect(v1, v2)).into(),
                (false, false) => SubType::number_subtype(false, vec_union(v1, v2)).into(),
                (true, false) => SubType::number_subtype(true, vec_diff(v1, v2)).into(),
                (false, true) => SubType::number_subtype(true, vec_diff(v2, v1)).into(),
            },
            (
                ProperSubtype::String {
                    allowed: a1,
                    values: v1,
                },
                ProperSubtype::String {
                    allowed: a2,
                    values: v2,
                },
            ) => match (*a1, *a2) {
                (true, true) => SubType::string_subtype(true, vec_intersect(v1, v2)).into(),
                (false, false) => SubType::string_subtype(false, vec_union(v1, v2)).into(),
                (true, false) => SubType::string_subtype(true, vec_diff(v1, v2)).into(),
                (false, true) => SubType::string_subtype(true, vec_diff(v2, v1)).into(),
            },
            (ProperSubtype::Mapping(b1), ProperSubtype::Mapping(b2)) => {
                SubType::Proper(ProperSubtype::Mapping(b1.intersect(b2)).into()).into()
            }
            (ProperSubtype::List(b1), ProperSubtype::List(b2)) => {
                SubType::Proper(ProperSubtype::List(b1.intersect(b2)).into()).into()
            }
            _ => unreachable!("intersect should not compare types of different tags"),
        }
    }

    fn union(&self, t2: &Rc<ProperSubtype>) -> Rc<SubType> {
        match (&**self, &**t2) {
            (ProperSubtype::Boolean(b1), ProperSubtype::Boolean(b2)) => {
                if b1 == b2 {
                    return SubType::Proper(self.clone()).into();
                }
                SubType::True(SubTypeTag::Boolean).into()
            }
            (
                ProperSubtype::Number {
                    allowed: a1,
                    values: v1,
                },
                ProperSubtype::Number {
                    allowed: a2,
                    values: v2,
                },
            ) => match (*a1, *a2) {
                (true, true) => SubType::number_subtype(true, vec_union(v1, v2)).into(),
                (false, false) => SubType::number_subtype(false, vec_intersect(v1, v2)).into(),
                (true, false) => SubType::number_subtype(false, vec_diff(v2, v1)).into(),
                (false, true) => SubType::number_subtype(false, vec_diff(v1, v2)).into(),
            },
            (
                ProperSubtype::String {
                    allowed: a1,
                    values: v1,
                },
                ProperSubtype::String {
                    allowed: a2,
                    values: v2,
                },
            ) => match (*a1, *a2) {
                (true, true) => SubType::string_subtype(true, vec_union(v1, v2)).into(),
                (false, false) => SubType::string_subtype(false, vec_intersect(v1, v2)).into(),
                (true, false) => SubType::string_subtype(false, vec_diff(v2, v1)).into(),
                (false, true) => SubType::string_subtype(false, vec_diff(v1, v2)).into(),
            },
            (ProperSubtype::Mapping(b1), ProperSubtype::Mapping(b2)) => {
                SubType::Proper(ProperSubtype::Mapping(b1.union(b2)).into()).into()
            }
            (ProperSubtype::List(b1), ProperSubtype::List(b2)) => {
                SubType::Proper(ProperSubtype::List(b1.union(b2)).into()).into()
            }
            _ => unreachable!("union should not compare types of different tags"),
        }
    }

    fn diff(&self, t2: &Rc<ProperSubtype>) -> Rc<SubType> {
        match (&**self, &**t2) {
            (ProperSubtype::Boolean(b1), ProperSubtype::Boolean(b2)) => {
                if b1 == b2 {
                    return SubType::False(SubTypeTag::Boolean).into();
                }
                SubType::Proper(self.clone()).into()
            }
            (ProperSubtype::Mapping(b1), ProperSubtype::Mapping(b2)) => {
                SubType::Proper(ProperSubtype::Mapping(b1.diff(b2)).into()).into()
            }
            (ProperSubtype::List(b1), ProperSubtype::List(b2)) => {
                SubType::Proper(ProperSubtype::List(b1.diff(b2)).into()).into()
            }
            _ => self.intersect(&t2.complement()),
        }
    }

    fn complement(&self) -> Rc<ProperSubtype> {
        match &**self {
            ProperSubtype::Boolean(b) => ProperSubtype::Boolean(!b).into(),
            ProperSubtype::Number { allowed, values } => ProperSubtype::Number {
                allowed: !allowed,
                values: values.clone(),
            }
            .into(),
            ProperSubtype::String { allowed, values } => ProperSubtype::String {
                allowed: !allowed,
                values: values.clone(),
            }
            .into(),
            ProperSubtype::Mapping(bdd) => ProperSubtype::Mapping(bdd.complement()).into(),
            ProperSubtype::List(bdd) => ProperSubtype::List(bdd.complement()).into(),
            ProperSubtype::MappedRecord(bdd) => {
                ProperSubtype::MappedRecord(bdd.complement()).into()
            }
        }
    }
}

impl ProperSubtype {
    pub fn tag(&self) -> SubTypeTag {
        match self {
            ProperSubtype::Boolean(_) => SubTypeTag::Boolean,
            ProperSubtype::Number { .. } => SubTypeTag::Number,
            ProperSubtype::String { .. } => SubTypeTag::String,
            ProperSubtype::Mapping(_) => SubTypeTag::Mapping,
            ProperSubtype::List(_) => SubTypeTag::List,
            ProperSubtype::MappedRecord(_) => SubTypeTag::MappedRecord,
        }
    }
    pub fn to_code(&self) -> BasicTypeCode {
        self.tag().code()
    }
}
