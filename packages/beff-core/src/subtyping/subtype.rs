use crate::{
    ast::{
        json::N,
        runtype::{CustomFormat, TplLitType},
    },
    subtyping::dnf::dnf_mapping_is_empty,
};
use anyhow::{bail, Result};
use std::{collections::BTreeSet, rc::Rc};

use super::{
    bdd::{list_is_empty, Bdd, BddOps},
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
    OptionalProp = 1 << 6,
    List = 1 << 7,
    Function = 1 << 8,
    BigInt = 1 << 9,
    Date = 1 << 10,
    Undefined = 1 << 11,
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
            SubTypeTag::OptionalProp,
            SubTypeTag::Null,
            SubTypeTag::Mapping,
            SubTypeTag::List,
            SubTypeTag::Function,
            SubTypeTag::BigInt,
            SubTypeTag::Date,
            SubTypeTag::Undefined,
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

impl CustomFormat {
    fn is_subtype(&self, other: &CustomFormat) -> bool {
        let CustomFormat(f1, args1) = self;
        let CustomFormat(f2, args2) = other;

        let mut set1 = BTreeSet::new();
        set1.insert(f1);
        set1.extend(args1.iter());

        let mut set2 = BTreeSet::new();
        set2.insert(f2);
        set2.extend(args2.iter());

        // set2 is a subset of set1
        set2.is_subset(&set1)
    }
}

impl TplLitType {
    fn is_subtype(&self, other: &TplLitType) -> Result<bool> {
        match (self.0.as_slice(), other.0.as_slice()) {
            ([a], [b]) => Ok(a == b),
            _ => bail!(format!(
                "only single-item TplLitType subtype checks are supported",
            )),
        }
    }
}

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd, Clone)]
pub enum StringLitOrFormat {
    Format(CustomFormat),
    Tpl(TplLitType),
}

trait SubtypeCheck {
    fn is_subtype(&self, other: &Self) -> Result<bool>;
}

impl SubtypeCheck for StringLitOrFormat {
    fn is_subtype(&self, other: &StringLitOrFormat) -> Result<bool> {
        match (self, other) {
            (StringLitOrFormat::Format(a), StringLitOrFormat::Format(b)) => Ok(a.is_subtype(b)),
            (StringLitOrFormat::Tpl(a), StringLitOrFormat::Tpl(b)) => a.is_subtype(b),
            _ => Ok(self == other),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum NumberRepresentationOrFormat {
    Lit(NumberRepresentation),
    Format(CustomFormat),
}

impl SubtypeCheck for NumberRepresentationOrFormat {
    fn is_subtype(&self, other: &NumberRepresentationOrFormat) -> Result<bool> {
        match (self, other) {
            (NumberRepresentationOrFormat::Format(a), NumberRepresentationOrFormat::Format(b)) => {
                Ok(a.is_subtype(b))
            }
            _ => Ok(self == other),
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
}

fn sub_vec_union<K: SubtypeCheck + Clone + Ord>(v1: &[K], v2: &[K]) -> Result<Vec<K>> {
    let mut acc = vec![];

    // Process items from v1
    'outer: for v1_item in v1 {
        for v2_item in v2 {
            if v1_item.is_subtype(v2_item)? {
                acc.push(v2_item.clone());
                continue 'outer;
            } else if v2_item.is_subtype(v1_item)? {
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
            if v2_item.is_subtype(v1_item)? || v1_item.is_subtype(v2_item)? {
                continue 'outer2;
            }
        }
        acc.push(v2_item.clone());
    }

    acc.sort();
    Ok(acc)
}

fn sub_vec_intersect<K: SubtypeCheck + Clone + PartialEq + Ord>(
    v1: &[K],
    v2: &[K],
) -> Result<Vec<K>> {
    let mut acc = vec![];

    // For each item in v1, check if there's a compatible item in v2
    for v1_item in v1 {
        for v2_item in v2 {
            if v1_item == v2_item {
                // Exact match
                acc.push(v1_item.clone());
            } else if v1_item.is_subtype(v2_item)? {
                // v1_item is more specific than v2_item, so v1_item is in the intersection
                acc.push(v1_item.clone());
            } else if v2_item.is_subtype(v1_item)? {
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
            } else if item.is_subtype(existing_item)? {
                // item is more specific, remove existing_item
                indices_to_remove.push(idx);
            } else if existing_item.is_subtype(&item)? {
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
    Ok(deduped_acc)
}
fn sub_vec_diff<K: SubtypeCheck + Clone + Ord>(v1: &[K], v2: &[K]) -> Result<Vec<K>> {
    let mut acc = vec![];

    'outer: for v1_item in v1 {
        for v2_item in v2 {
            if v1_item.is_subtype(v2_item)? {
                continue 'outer;
            }
        }
        acc.push(v1_item.clone());
    }

    acc.sort();
    Ok(acc)
}

pub trait ProperSubtypeOps {
    // fn is_empty(&self, builder: &mut SemTypeContext) -> bool;
    fn is_empty_evidence(
        &self,
        builder: &mut SemTypeContext,
    ) -> Result<ProperSubtypeEvidenceResult>;
    fn intersect(&self, t2: &Rc<ProperSubtype>) -> Result<Rc<SubType>>;
    fn union(&self, t2: &Rc<ProperSubtype>) -> Result<Rc<SubType>>;
    fn diff(&self, t2: &Rc<ProperSubtype>) -> Result<Rc<SubType>>;
    fn complement(&self) -> Rc<ProperSubtype>;
}

impl ProperSubtypeOps for Rc<ProperSubtype> {
    fn is_empty_evidence(
        &self,
        builder: &mut SemTypeContext,
    ) -> Result<ProperSubtypeEvidenceResult> {
        match &**self {
            ProperSubtype::Boolean(b) => Ok(ProperSubtypeEvidence::Boolean(*b).to_result()),
            // Empty number sets don't use subtype representation.
            ProperSubtype::Number { allowed, values } => Ok(ProperSubtypeEvidence::Number {
                allowed: *allowed,
                values: values.clone(),
            }
            .to_result()),
            // Empty string sets don't use subtype representation.
            ProperSubtype::String { allowed, values } => Ok(ProperSubtypeEvidence::String {
                allowed: *allowed,
                values: values.clone(),
            }
            .to_result()),
            ProperSubtype::Mapping(bdd) => dnf_mapping_is_empty(bdd, builder),
            ProperSubtype::List(bdd) => list_is_empty(bdd, builder),
        }
    }

    fn intersect(&self, t2: &Rc<ProperSubtype>) -> Result<Rc<SubType>> {
        match (&**self, &**t2) {
            (ProperSubtype::Boolean(b1), ProperSubtype::Boolean(b2)) => {
                if b1 == b2 {
                    return Ok(SubType::Proper(self.clone()).into());
                }
                Ok(SubType::False(SubTypeTag::Boolean).into())
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
                (true, true) => {
                    Ok(SubType::number_subtype(true, sub_vec_intersect(v1, v2)?).into())
                }
                (false, false) => Ok(SubType::number_subtype(false, sub_vec_union(v1, v2)?).into()),
                (true, false) => Ok(SubType::number_subtype(true, sub_vec_diff(v1, v2)?).into()),
                (false, true) => Ok(SubType::number_subtype(true, sub_vec_diff(v2, v1)?).into()),
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
                (true, true) => {
                    Ok(SubType::string_subtype(true, sub_vec_intersect(v1, v2)?).into())
                }
                (false, false) => Ok(SubType::string_subtype(false, sub_vec_union(v1, v2)?).into()),
                (true, false) => Ok(SubType::string_subtype(true, sub_vec_diff(v1, v2)?).into()),
                (false, true) => Ok(SubType::string_subtype(true, sub_vec_diff(v2, v1)?).into()),
            },
            (ProperSubtype::Mapping(b1), ProperSubtype::Mapping(b2)) => {
                Ok(SubType::Proper(ProperSubtype::Mapping(b1.intersect(b2)).into()).into())
            }
            (ProperSubtype::List(b1), ProperSubtype::List(b2)) => {
                Ok(SubType::Proper(ProperSubtype::List(b1.intersect(b2)).into()).into())
            }
            _ => unreachable!("intersect should not compare types of different tags"),
        }
    }

    fn union(&self, t2: &Rc<ProperSubtype>) -> Result<Rc<SubType>> {
        match (&**self, &**t2) {
            (ProperSubtype::Boolean(b1), ProperSubtype::Boolean(b2)) => {
                if b1 == b2 {
                    return Ok(SubType::Proper(self.clone()).into());
                }
                Ok(SubType::True(SubTypeTag::Boolean).into())
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
                (true, true) => Ok(SubType::number_subtype(true, sub_vec_union(v1, v2)?).into()),
                (false, false) => {
                    Ok(SubType::number_subtype(false, sub_vec_intersect(v1, v2)?).into())
                }
                (true, false) => Ok(SubType::number_subtype(false, sub_vec_diff(v2, v1)?).into()),
                (false, true) => Ok(SubType::number_subtype(false, sub_vec_diff(v1, v2)?).into()),
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
                (true, true) => Ok(SubType::string_subtype(true, sub_vec_union(v1, v2)?).into()),
                (false, false) => {
                    Ok(SubType::string_subtype(false, sub_vec_intersect(v1, v2)?).into())
                }
                (true, false) => Ok(SubType::string_subtype(false, sub_vec_diff(v2, v1)?).into()),
                (false, true) => Ok(SubType::string_subtype(false, sub_vec_diff(v1, v2)?).into()),
            },
            (ProperSubtype::Mapping(b1), ProperSubtype::Mapping(b2)) => {
                Ok(SubType::Proper(ProperSubtype::Mapping(b1.union(b2)).into()).into())
            }
            (ProperSubtype::List(b1), ProperSubtype::List(b2)) => {
                Ok(SubType::Proper(ProperSubtype::List(b1.union(b2)).into()).into())
            }
            _ => unreachable!("union should not compare types of different tags"),
        }
    }

    fn diff(&self, t2: &Rc<ProperSubtype>) -> Result<Rc<SubType>> {
        match (&**self, &**t2) {
            (ProperSubtype::Boolean(b1), ProperSubtype::Boolean(b2)) => {
                if b1 == b2 {
                    return Ok(SubType::False(SubTypeTag::Boolean).into());
                }
                Ok(SubType::Proper(self.clone()).into())
            }
            (ProperSubtype::Mapping(b1), ProperSubtype::Mapping(b2)) => {
                Ok(SubType::Proper(ProperSubtype::Mapping(b1.diff(b2)).into()).into())
            }
            (ProperSubtype::List(b1), ProperSubtype::List(b2)) => {
                Ok(SubType::Proper(ProperSubtype::List(b1.diff(b2)).into()).into())
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
        }
    }
    pub fn to_code(&self) -> BasicTypeCode {
        self.tag().code()
    }
}

#[cfg(test)]
mod tests {
    use crate::ast::runtype::TplLitTypeItem;

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

        assert!(read_authorized_user_id.is_subtype(&user_id).unwrap());
        assert!(!user_id.is_subtype(&read_authorized_user_id).unwrap());

        assert!(write_authorized_user_id.is_subtype(&user_id).unwrap());
        assert!(!user_id.is_subtype(&write_authorized_user_id).unwrap());

        assert!(write_authorized_user_id
            .is_subtype(&read_authorized_user_id)
            .unwrap());
        assert!(!read_authorized_user_id
            .is_subtype(&write_authorized_user_id)
            .unwrap());
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

        let diff = sub_vec_diff(&v1, &v2).unwrap();
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
        let intersect = sub_vec_intersect(&v1, &v2).unwrap();
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

        let intersect = sub_vec_intersect(&v1, &v2).unwrap();

        assert_eq!(intersect.len(), 1);
        assert!(intersect.contains(&read_authorized_user_id));

        let intersect_more = sub_vec_intersect(&v1, &v3).unwrap();
        assert_eq!(intersect_more.len(), 1);
        assert!(intersect_more.contains(&write_authorized_user_id));

        // Test intersection with no overlap
        let other_format = StringLitOrFormat::Format(CustomFormat("other_id".into(), vec![]));
        let v1 = vec![user_id.clone()];
        let v2 = vec![other_format.clone()];

        let intersect2 = sub_vec_intersect(&v1, &v2).unwrap();
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

        let union = sub_vec_union(&v1, &v2).unwrap();
        assert_eq!(union.len(), 1);
        assert!(union.contains(&user_id));

        let v3 = vec![write_authorized_user_id.clone()];
        let union2 = sub_vec_union(&v1, &v3).unwrap();
        assert_eq!(union2.len(), 1);
        assert!(union2.contains(&read_authorized_user_id));
    }

    #[test]
    fn test_string_subtype_union2() {
        let a_const =
            StringLitOrFormat::Tpl(TplLitType(vec![TplLitTypeItem::StringConst("a".into())]));
        let b_const =
            StringLitOrFormat::Tpl(TplLitType(vec![TplLitTypeItem::StringConst("b".into())]));

        let v1 = vec![a_const.clone()];
        let v2 = vec![b_const.clone()];

        let union = sub_vec_union(&v1, &v2).unwrap();
        assert_eq!(union.len(), 2);
        assert!(union.contains(&a_const));
        assert!(union.contains(&b_const));
    }

    #[test]
    fn test_string_format_extends_complex() {
        let base_format = CustomFormat("resource_id".into(), vec![]);
        let read_format = CustomFormat("resource_id".into(), vec!["read".to_string()]);
        let write_format = CustomFormat(
            "resource_id".into(),
            vec!["read".to_string(), "write".to_string()],
        );
        let admin_format = CustomFormat(
            "resource_id".into(),
            vec!["read".to_string(), "write".to_string(), "admin".to_string()],
        );

        // Test subtype relationships
        assert!(read_format.is_subtype(&base_format));
        assert!(!base_format.is_subtype(&read_format));

        assert!(write_format.is_subtype(&base_format));
        assert!(write_format.is_subtype(&read_format));
        assert!(!read_format.is_subtype(&write_format));

        assert!(admin_format.is_subtype(&base_format));
        assert!(admin_format.is_subtype(&read_format));
        assert!(admin_format.is_subtype(&write_format));
        assert!(!write_format.is_subtype(&admin_format));
    }

    #[test]
    fn test_string_format_different_bases() {
        let user_id = CustomFormat("user_id".into(), vec![]);
        let post_id = CustomFormat("post_id".into(), vec![]);
        let user_read = CustomFormat("user_id".into(), vec!["read".to_string()]);
        let post_read = CustomFormat("post_id".into(), vec!["read".to_string()]);

        // Different base formats should not be subtypes of each other
        assert!(!user_id.is_subtype(&post_id));
        assert!(!post_id.is_subtype(&user_id));
        assert!(!user_read.is_subtype(&post_read));
        assert!(!post_read.is_subtype(&user_read));
        assert!(!user_read.is_subtype(&post_id));
        assert!(!post_read.is_subtype(&user_id));
    }

    #[test]
    fn test_string_literal_and_format_interaction() {
        let literal_a =
            StringLitOrFormat::Tpl(TplLitType(vec![TplLitTypeItem::StringConst("a".into())]));
        let literal_b =
            StringLitOrFormat::Tpl(TplLitType(vec![TplLitTypeItem::StringConst("b".into())]));
        let format_id = StringLitOrFormat::Format(CustomFormat("id".into(), vec![]));
        let format_read_id =
            StringLitOrFormat::Format(CustomFormat("id".into(), vec!["read".to_string()]));

        // Literals should not be subtypes of formats and vice versa
        assert!(!literal_a.is_subtype(&format_id).unwrap());
        assert!(!format_id.is_subtype(&literal_a).unwrap());
        assert!(!literal_b.is_subtype(&format_read_id).unwrap());
        assert!(!format_read_id.is_subtype(&literal_b).unwrap());

        // Literals should only be subtypes of identical literals
        assert!(literal_a.is_subtype(&literal_a).unwrap());
        assert!(!literal_a.is_subtype(&literal_b).unwrap());
    }

    // #[test]
    // fn test_string_template_types() {
    //     use crate::ast::runtype::TplLitTypeItem;

    //     let tpl1 = StringLitOrFormat::Tpl(TplLitType(vec![
    //         TplLitTypeItem::StringConst("hello_".into()),
    //         TplLitTypeItem::String,
    //     ]));
    //     let tpl2 = StringLitOrFormat::Tpl(TplLitType(vec![
    //         TplLitTypeItem::StringConst("hello_".into()),
    //         TplLitTypeItem::String,
    //     ]));
    //     let tpl3 = StringLitOrFormat::Tpl(TplLitType(vec![
    //         TplLitTypeItem::StringConst("hi_".into()),
    //         TplLitTypeItem::String,
    //     ]));

    //     // Identical template literals should be subtypes
    //     assert!(tpl1.is_subtype(&tpl2).unwrap());
    //     assert!(tpl2.is_subtype(&tpl1).unwrap());

    //     // Different template literals should not be subtypes
    //     assert!(!tpl1.is_subtype(&tpl3).unwrap());
    //     assert!(!tpl3.is_subtype(&tpl1).unwrap());
    // }

    #[test]
    fn test_string_format_edge_cases() {
        let empty_args1 = CustomFormat("format".into(), vec![]);
        let empty_args2 = CustomFormat("format".into(), vec![]);
        let single_arg = CustomFormat("format".into(), vec!["arg1".to_string()]);

        // Empty args should be identical
        assert!(empty_args1.is_subtype(&empty_args2));
        assert!(empty_args2.is_subtype(&empty_args1));

        // Single arg should extend empty args
        assert!(single_arg.is_subtype(&empty_args1));
        assert!(!empty_args1.is_subtype(&single_arg));
    }

    #[test]
    fn test_number_format_subtyping() {
        let base_number =
            NumberRepresentationOrFormat::Format(CustomFormat("amount".into(), vec![]));
        let currency_number = NumberRepresentationOrFormat::Format(CustomFormat(
            "amount".into(),
            vec!["USD".to_string()],
        ));
        let precise_currency = NumberRepresentationOrFormat::Format(CustomFormat(
            "amount".into(),
            vec!["USD".to_string(), "precise".to_string()],
        ));

        // Test subtype relationships
        assert!(currency_number.is_subtype(&base_number).unwrap());
        assert!(!base_number.is_subtype(&currency_number).unwrap());

        assert!(precise_currency.is_subtype(&base_number).unwrap());
        assert!(precise_currency.is_subtype(&currency_number).unwrap());
        assert!(!currency_number.is_subtype(&precise_currency).unwrap());
    }

    #[test]
    fn test_number_literal_and_format() {
        use crate::ast::json::N;

        let literal_42 = NumberRepresentationOrFormat::Lit(N::parse_int(42));
        let literal_100 = NumberRepresentationOrFormat::Lit(N::parse_int(100));
        let format_amount =
            NumberRepresentationOrFormat::Format(CustomFormat("amount".into(), vec![]));

        // Literals should not be subtypes of formats
        assert!(!literal_42.is_subtype(&format_amount).unwrap());
        assert!(!format_amount.is_subtype(&literal_42).unwrap());

        // Literals should only be subtypes of identical literals
        assert!(literal_42.is_subtype(&literal_42).unwrap());
        assert!(!literal_42.is_subtype(&literal_100).unwrap());
    }

    #[test]
    fn test_complex_string_operations() {
        let base = StringLitOrFormat::Format(CustomFormat("entity".into(), vec![]));
        let read =
            StringLitOrFormat::Format(CustomFormat("entity".into(), vec!["read".to_string()]));
        let write = StringLitOrFormat::Format(CustomFormat(
            "entity".into(),
            vec!["read".to_string(), "write".to_string()],
        ));
        let different_base = StringLitOrFormat::Format(CustomFormat("other".into(), vec![]));
        let literal = StringLitOrFormat::Tpl(TplLitType(vec![TplLitTypeItem::StringConst(
            "constant".into(),
        )]));

        let v1 = vec![base.clone(), read.clone(), write.clone()];
        let v2 = vec![read.clone(), different_base.clone()];
        let v3 = vec![literal.clone()];

        // Test union operations
        let union_1_2 = sub_vec_union(&v1, &v2).unwrap();
        assert!(union_1_2.contains(&base)); // Most general form should be in union
        assert!(union_1_2.contains(&different_base)); // Different base should be included

        // Test intersection operations
        let intersect_1_2 = sub_vec_intersect(&v1, &v2).unwrap();
        // The intersection should contain the write element, which is more specific than read
        // write (["read", "write"]) is a subtype of read (["read"]), so write is in the intersection
        assert!(intersect_1_2.contains(&write));
        assert_eq!(intersect_1_2.len(), 1); // Only one element should be in the intersection

        // Test difference operations
        let diff_1_2 = sub_vec_diff(&v1, &v2).unwrap();
        assert!(diff_1_2.contains(&base)); // base is in v1 but not subtype of anything in v2
        assert!(!diff_1_2.contains(&read)); // read is subtype of read in v2, so removed
        assert!(!diff_1_2.contains(&write)); // write is subtype of read in v2, so removed

        // Test union with literals
        let union_1_3 = sub_vec_union(&v1, &v3).unwrap();
        assert_eq!(union_1_3.len(), 4); // All elements should be preserved (no subtype relationships)
    }
}
