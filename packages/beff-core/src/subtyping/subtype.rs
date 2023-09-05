use std::rc::Rc;

use crate::ast::json::N;

use super::bdd::{mapping_is_empty, Bdd, BddOps};

pub type BasicTypeCode = u32;
pub type BasicTypeBitSet = u32;
pub type NumberRepresentation = N;

#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug)]

pub enum SubTypeTag {
    Boolean = 1 << 0x1,
    Number = 1 << 0x2,
    String = 1 << 0x3,
    Null = 1 << 0x4,
    Mapping = 1 << 0x5,
    Void = 1 << 0x6,
}

impl SubTypeTag {
    pub fn code(&self) -> BasicTypeCode {
        *self as u32
    }
}

#[derive(Debug)]
pub enum SubType {
    False(SubTypeTag),
    True(SubTypeTag),
    Proper(Rc<ProperSubtype>),
}

impl SubType {
    fn number_subtype(allowed: bool, values: Vec<NumberRepresentation>) -> SubType {
        if values.len() == 0 {
            if allowed {
                return SubType::False(SubTypeTag::Number);
            }
            return SubType::True(SubTypeTag::Number);
        }
        SubType::Proper(ProperSubtype::Number { allowed, values }.into())
    }
    fn string_subtype(allowed: bool, values: Vec<StringLitOrFormat>) -> SubType {
        if values.len() == 0 {
            if allowed {
                return SubType::False(SubTypeTag::String);
            }
            return SubType::True(SubTypeTag::String);
        }
        SubType::Proper(ProperSubtype::String { allowed, values }.into())
    }

    pub fn is_empty(&self) -> bool {
        match self {
            SubType::Proper(p) => p.is_empty(),
            SubType::False(_) => todo!(),
            SubType::True(_) => todo!(),
        }
    }
}

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd, Clone)]
pub enum StringLitOrFormat {
    Lit(String),
    Format(String),
}

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd)]
pub enum ProperSubtype {
    Boolean(bool),
    Number {
        allowed: bool,
        values: Vec<NumberRepresentation>,
    },
    String {
        allowed: bool,
        values: Vec<StringLitOrFormat>,
    },
    Mapping(Rc<Bdd>),
}

fn vec_union<K: PartialEq + Clone + Ord>(v1: &Vec<K>, v2: &Vec<K>) -> Vec<K> {
    let mut values: Vec<K> = v1.iter().cloned().chain(v2.iter().cloned()).collect();
    values.sort();
    values.dedup();
    return values;
}

fn vec_intersect<K: PartialEq + Clone + Ord>(v1: &Vec<K>, v2: &Vec<K>) -> Vec<K> {
    v1.iter().cloned().filter(|v| v2.contains(v)).collect()
}

fn vec_diff<K: PartialEq + Clone + Ord>(v1: &Vec<K>, v2: &Vec<K>) -> Vec<K> {
    v1.iter().cloned().filter(|v| !v2.contains(v)).collect()
}

pub trait ProperSubtypeOps {
    fn is_empty(&self) -> bool;
    fn intersect(&self, t2: &Rc<ProperSubtype>) -> Rc<SubType>;
    fn union(&self, t2: &Rc<ProperSubtype>) -> Rc<SubType>;
    fn diff(&self, t2: &Rc<ProperSubtype>) -> Rc<SubType>;
    fn complement(&self) -> Rc<ProperSubtype>;
}

impl ProperSubtypeOps for Rc<ProperSubtype> {
    fn is_empty(&self) -> bool {
        match &**self {
            ProperSubtype::Boolean(_) => false,
            // Empty number sets don't use subtype representation.
            ProperSubtype::Number { .. } => false,
            // Empty string sets don't use subtype representation.
            ProperSubtype::String { .. } => false,
            ProperSubtype::Mapping(bdd) => mapping_is_empty(bdd),
        }
    }

    fn intersect(&self, t2: &Rc<ProperSubtype>) -> Rc<SubType> {
        match (&**self, &**t2) {
            (ProperSubtype::Boolean(b1), ProperSubtype::Boolean(b2)) => {
                if b1 == b2 {
                    return SubType::Proper(self.clone()).into();
                }
                return SubType::False(SubTypeTag::Boolean).into();
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
            _ => panic!(),
        }
    }

    fn union(&self, t2: &Rc<ProperSubtype>) -> Rc<SubType> {
        match (&**self, &**t2) {
            (ProperSubtype::Boolean(b1), ProperSubtype::Boolean(b2)) => {
                if b1 == b2 {
                    return SubType::Proper(self.clone()).into();
                }
                return SubType::True(SubTypeTag::Boolean).into();
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
            _ => panic!(),
        }
    }

    fn diff(&self, t2: &Rc<ProperSubtype>) -> Rc<SubType> {
        match (&**self, &**t2) {
            (ProperSubtype::Boolean(b1), ProperSubtype::Boolean(b2)) => {
                if b1 == b2 {
                    return SubType::False(SubTypeTag::Boolean).into();
                }
                return SubType::Proper(self.clone()).into();
            }
            (ProperSubtype::Mapping(b1), ProperSubtype::Mapping(b2)) => {
                SubType::Proper(ProperSubtype::Mapping(b1.diff(b2)).into()).into()
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
        }
    }
    pub fn to_code(&self) -> BasicTypeCode {
        self.tag().code()
    }
}
