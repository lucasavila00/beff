use std::rc::Rc;

use crate::ast::{json::N, runtype::TplLitTypeItem};

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
    Boolean = 1 << 1,
    Number = 1 << 2,
    String = 1 << 3,
    Null = 1 << 4,
    Mapping = 1 << 5,
    Void = 1 << 6,
    List = 1 << 7,
    Function = 1 << 8,
    MappedRecord = 1 << 9,
    BigInt = 1 << 10,
    Date = 1 << 11,
}

pub const VAL: u32 = 1 << 1
    | 1 << 2
    | 1 << 3
    | 1 << 4
    | 1 << 5
    | 1 << 6
    | 1 << 7
    | 1 << 8
    | 1 << 9
    | 1 << 10
    | 1 << 11;

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
            SubTypeTag::MappedRecord,
            SubTypeTag::BigInt,
            SubTypeTag::Date,
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
pub struct CustomFormat(pub String, pub Vec<String>);

impl CustomFormat {
    fn is_subtype(&self, other: &CustomFormat) -> bool {
        let CustomFormat(f1, args1) = self;
        let CustomFormat(f2, args2) = other;
        // f1 == f2 and args2 is a prefix of args1
        if f1 != f2 {
            return false;
        }
        if args2.len() > args1.len() {
            return false;
        }
        for (a1, a2) in args1.iter().zip(args2.iter()) {
            if a1 != a2 {
                return false;
            }
        }
        true
    }
}

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd, Clone)]
pub enum StringLitOrFormat {
    Lit(String),
    Format(CustomFormat),
    Tpl(Vec<TplLitTypeItem>),
}

trait SubtypeCheck {
    fn is_subtype(&self, other: &Self) -> bool;
}

impl SubtypeCheck for StringLitOrFormat {
    fn is_subtype(&self, other: &StringLitOrFormat) -> bool {
        match (self, other) {
            (StringLitOrFormat::Format(a), StringLitOrFormat::Format(b)) => a.is_subtype(b),
            _ => self == other,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum NumberRepresentationOrFormat {
    Lit(NumberRepresentation),
    Format(CustomFormat),
}

impl SubtypeCheck for NumberRepresentationOrFormat {
    fn is_subtype(&self, other: &NumberRepresentationOrFormat) -> bool {
        match (self, other) {
            (NumberRepresentationOrFormat::Format(a), NumberRepresentationOrFormat::Format(b)) => {
                a.is_subtype(b)
            }
            _ => self == other,
        }
    }
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

fn sub_vec_union<K: SubtypeCheck + Clone + Ord>(v1: &[K], v2: &[K]) -> Vec<K> {
    let mut acc = vec![];

    // Process items from v1
    'outer: for v1_item in v1 {
        for v2_item in v2 {
            if v1_item.is_subtype(v2_item) {
                acc.push(v2_item.clone());
                continue 'outer;
            } else if v2_item.is_subtype(v1_item) {
                acc.push(v1_item.clone());
                continue 'outer;
            } else {
                continue;
            }
        }
        acc.push(v1_item.clone());
    }

    // Process items from v2 that don't have a subtype relationship with any item in v1
    'outer2: for v2_item in v2 {
        for v1_item in v1 {
            if v2_item.is_subtype(v1_item) || v1_item.is_subtype(v2_item) {
                continue 'outer2;
            }
        }
        acc.push(v2_item.clone());
    }

    acc.sort();
    acc
}

fn sub_vec_intersect<K: SubtypeCheck + Clone + PartialEq + Ord>(v1: &[K], v2: &[K]) -> Vec<K> {
    let mut acc = vec![];

    // For each item in v1, check if there's a compatible item in v2
    for v1_item in v1 {
        for v2_item in v2 {
            if v1_item == v2_item {
                // Exact match
                acc.push(v1_item.clone());
            } else if v1_item.is_subtype(v2_item) {
                // v1_item is more specific than v2_item, so v1_item is in the intersection
                acc.push(v1_item.clone());
            } else if v2_item.is_subtype(v1_item) {
                // v2_item is more specific than v1_item, so v2_item is in the intersection
                acc.push(v2_item.clone());
            }
        }
    }

    // Remove duplicates and keep only the most specific items
    let mut deduped_acc = vec![];
    for item in acc {
        let mut should_add = true;
        let mut indices_to_remove = vec![];

        for (idx, existing_item) in deduped_acc.iter().enumerate() {
            if item == *existing_item {
                // exact duplicate
                should_add = false;
                break;
            } else if item.is_subtype(existing_item) {
                // item is more specific, remove existing_item
                indices_to_remove.push(idx);
            } else if existing_item.is_subtype(&item) {
                // existing_item is more specific, don't add item
                should_add = false;
                break;
            }
        }

        // Remove items that are less specific than the current item
        for &idx in indices_to_remove.iter().rev() {
            deduped_acc.remove(idx);
        }

        if should_add {
            deduped_acc.push(item);
        }
    }
    deduped_acc.sort();
    deduped_acc
}
fn sub_vec_diff<K: SubtypeCheck + Clone + Ord>(v1: &[K], v2: &[K]) -> Vec<K> {
    let mut acc = vec![];

    'outer: for v1_item in v1 {
        for v2_item in v2 {
            if v1_item.is_subtype(v2_item) {
                continue 'outer;
            }
        }
        acc.push(v1_item.clone());
    }

    acc.sort();
    acc
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
                (true, true) => SubType::number_subtype(true, sub_vec_intersect(v1, v2)).into(),
                (false, false) => SubType::number_subtype(false, sub_vec_union(v1, v2)).into(),
                (true, false) => SubType::number_subtype(true, sub_vec_diff(v1, v2)).into(),
                (false, true) => SubType::number_subtype(true, sub_vec_diff(v2, v1)).into(),
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
                (true, true) => SubType::string_subtype(true, sub_vec_intersect(v1, v2)).into(),
                (false, false) => SubType::string_subtype(false, sub_vec_union(v1, v2)).into(),
                (true, false) => SubType::string_subtype(true, sub_vec_diff(v1, v2)).into(),
                (false, true) => SubType::string_subtype(true, sub_vec_diff(v2, v1)).into(),
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
                (true, true) => SubType::number_subtype(true, sub_vec_union(v1, v2)).into(),
                (false, false) => SubType::number_subtype(false, sub_vec_intersect(v1, v2)).into(),
                (true, false) => SubType::number_subtype(false, sub_vec_diff(v2, v1)).into(),
                (false, true) => SubType::number_subtype(false, sub_vec_diff(v1, v2)).into(),
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
                (true, true) => SubType::string_subtype(true, sub_vec_union(v1, v2)).into(),
                (false, false) => SubType::string_subtype(false, sub_vec_intersect(v1, v2)).into(),
                (true, false) => SubType::string_subtype(false, sub_vec_diff(v2, v1)).into(),
                (false, true) => SubType::string_subtype(false, sub_vec_diff(v1, v2)).into(),
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_string_is_subtype() {
        let user_id = StringLitOrFormat::Format(CustomFormat("user_id".into(), vec![]));
        let read_authorized_user_id = StringLitOrFormat::Format(CustomFormat(
            "user_id".into(),
            vec!["read_auhtorized".to_string()],
        ));
        let write_authorized_user_id = StringLitOrFormat::Format(CustomFormat(
            "user_id".into(),
            vec![
                "read_auhtorized".to_string(),
                "write_authorized".to_string(),
            ],
        ));

        assert!(read_authorized_user_id.is_subtype(&user_id));
        assert!(!user_id.is_subtype(&read_authorized_user_id));

        assert!(write_authorized_user_id.is_subtype(&user_id));
        assert!(!user_id.is_subtype(&write_authorized_user_id));

        assert!(write_authorized_user_id.is_subtype(&read_authorized_user_id));
        assert!(!read_authorized_user_id.is_subtype(&write_authorized_user_id));
    }

    #[test]
    fn test_string_subtype_diff() {
        let user_id = StringLitOrFormat::Format(CustomFormat("user_id".into(), vec![]));
        let read_authorized_user_id = StringLitOrFormat::Format(CustomFormat(
            "user_id".into(),
            vec!["read_auhtorized".to_string()],
        ));
        let write_authorized_user_id = StringLitOrFormat::Format(CustomFormat(
            "user_id".into(),
            vec![
                "read_auhtorized".to_string(),
                "write_authorized".to_string(),
            ],
        ));

        let v1 = vec![
            user_id.clone(),
            read_authorized_user_id.clone(),
            write_authorized_user_id.clone(),
        ];
        let v2 = vec![read_authorized_user_id.clone()];

        let diff = sub_vec_diff(&v1, &v2);
        assert_eq!(diff.len(), 1);
        assert_eq!(diff[0], user_id);
    }

    #[test]
    fn test_string_subtype_intersect() {
        let user_id = StringLitOrFormat::Format(CustomFormat("user_id".into(), vec![]));
        let read_authorized_user_id = StringLitOrFormat::Format(CustomFormat(
            "user_id".into(),
            vec!["read_auhtorized".to_string()],
        ));

        let v1 = vec![user_id.clone(), read_authorized_user_id.clone()];
        let v2 = vec![read_authorized_user_id.clone()];

        // Only `read_authorized_user_id` should be present in the intersection,
        // because it is the only value in both vectors according to the `is_subtype` logic.
        let intersect = sub_vec_intersect(&v1, &v2);
        assert_eq!(intersect.len(), 1);
        assert_eq!(intersect[0], read_authorized_user_id);
        assert!(intersect.contains(&read_authorized_user_id));
    }

    #[test]
    fn test_string_subtype_format_intersect_comprehensive() {
        let user_id = StringLitOrFormat::Format(CustomFormat("user_id".into(), vec![]));
        let read_authorized_user_id = StringLitOrFormat::Format(CustomFormat(
            "user_id".into(),
            vec!["read_auhtorized".to_string()],
        ));
        let write_authorized_user_id = StringLitOrFormat::Format(CustomFormat(
            "user_id".into(),
            vec![
                "read_auhtorized".to_string(),
                "write_authorized".to_string(),
            ],
        ));

        // Test intersection where v2 has more specific types
        let v1 = vec![user_id.clone()];
        let v2 = vec![read_authorized_user_id.clone()];
        let v3 = vec![write_authorized_user_id.clone()];

        let intersect = sub_vec_intersect(&v1, &v2);

        assert_eq!(intersect.len(), 1);
        assert!(intersect.contains(&read_authorized_user_id));

        let intersect_more = sub_vec_intersect(&v1, &v3);
        assert_eq!(intersect_more.len(), 1);
        assert!(intersect_more.contains(&write_authorized_user_id));

        // Test intersection with no overlap
        let other_format = StringLitOrFormat::Format(CustomFormat("other_id".into(), vec![]));
        let v1 = vec![user_id.clone()];
        let v2 = vec![other_format.clone()];

        let intersect2 = sub_vec_intersect(&v1, &v2);
        assert_eq!(intersect2.len(), 0);
    }

    #[test]
    fn test_string_subtype_union() {
        let user_id = StringLitOrFormat::Format(CustomFormat("user_id".into(), vec![]));
        let read_authorized_user_id = StringLitOrFormat::Format(CustomFormat(
            "user_id".into(),
            vec!["read_auhtorized".to_string()],
        ));
        let write_authorized_user_id = StringLitOrFormat::Format(CustomFormat(
            "user_id".into(),
            vec![
                "read_auhtorized".to_string(),
                "write_authorized".to_string(),
            ],
        ));

        let v1 = vec![read_authorized_user_id.clone()];
        let v2 = vec![user_id.clone()];

        let union = sub_vec_union(&v1, &v2);
        assert_eq!(union.len(), 1);
        assert!(union.contains(&user_id));

        let v3 = vec![write_authorized_user_id.clone()];
        let union2 = sub_vec_union(&v1, &v3);
        assert_eq!(union2.len(), 1);
        assert!(union2.contains(&read_authorized_user_id));
    }

    #[test]
    fn test_string_subtype_union2() {
        let a_const = StringLitOrFormat::Lit("a".into());
        let b_const = StringLitOrFormat::Lit("b".into());

        let v1 = vec![a_const.clone()];
        let v2 = vec![b_const.clone()];

        let union = sub_vec_union(&v1, &v2);
        assert_eq!(union.len(), 2);
        assert!(union.contains(&a_const));
        assert!(union.contains(&b_const));
    }
}
