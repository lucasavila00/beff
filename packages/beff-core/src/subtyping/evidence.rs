use std::{collections::BTreeMap, rc::Rc};

use super::subtype::{NumberRepresentationOrFormat, StringLitOrFormat, SubTypeTag};

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd, Clone)]
pub enum ProperSubtypeEvidence {
    Boolean(bool),
    Number {
        allowed: bool,
        values: Vec<NumberRepresentationOrFormat>,
    },
    String {
        allowed: bool,
        values: Vec<StringLitOrFormat>,
    },
    List(Rc<ListEvidence>),
    MappingDnf,    // TODO: can we get evidence here?
    VoidUndefined, // TODO: can we get evidence here?
}

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd, Clone)]
pub struct IndexedPropertiesEvidence {
    pub key: Rc<Evidence>,
    pub value: Rc<Evidence>,
}

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd, Clone)]
pub struct MappingEvidence {
    pub vs: BTreeMap<String, Rc<Evidence>>,
    pub indexed_properties: Vec<IndexedPropertiesEvidence>,
}
#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd, Clone)]
pub struct ListEvidence {
    pub prefix_items: Vec<Rc<Evidence>>,
    pub items: Option<Rc<Evidence>>,
}

impl ProperSubtypeEvidence {
    pub fn to_result(self) -> ProperSubtypeEvidenceResult {
        ProperSubtypeEvidenceResult::Evidence(self)
    }
}

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd, Clone)]
pub enum ProperSubtypeEvidenceResult {
    IsEmpty,
    Evidence(ProperSubtypeEvidence),
}

impl ProperSubtypeEvidenceResult {
    pub fn is_empty(&self) -> bool {
        matches!(self, ProperSubtypeEvidenceResult::IsEmpty)
    }
}

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd)]
pub enum Evidence {
    All(SubTypeTag),
    Proper(ProperSubtypeEvidence),
}
impl Evidence {
    pub fn to_result(self) -> EvidenceResult {
        EvidenceResult::Evidence(self)
    }
}

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd)]
pub enum EvidenceResult {
    Evidence(Evidence),
    IsEmpty,
}
