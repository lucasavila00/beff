use std::{collections::BTreeMap, rc::Rc};

use super::subtype::{NumberRepresentation, StringLitOrFormat, SubTypeTag};

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd, Clone)]
pub enum ProperSubtypeEvidence {
    Boolean(bool),
    Number {
        allowed: bool,
        values: Vec<NumberRepresentation>,
    },
    String {
        allowed: bool,
        values: Vec<StringLitOrFormat>,
    },
    List(Rc<ListEvidence>),
    Mapping(Rc<MappingEvidence>),
}
pub type MappingEvidence = BTreeMap<String, Rc<Evidence>>;
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
