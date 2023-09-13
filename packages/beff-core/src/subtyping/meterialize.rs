use std::{collections::BTreeMap, rc::Rc};

use crate::{
    ast::json::N,
    subtyping::subtype::{StringLitOrFormat, SubTypeTag},
};

use super::{
    evidence::{Evidence, ListEvidence, MappingEvidence, ProperSubtypeEvidence},
    semtype::{SemType, SemTypeContext},
};

pub struct SemTypeResolverContext<'a>(pub &'a mut SemTypeContext);

pub enum MaterMemo {
    Mater(Mater),
    Undefined,
}

pub struct MaterializationContext {
    pub materialize_memo: BTreeMap<Rc<SemType>, MaterMemo>,
}
impl MaterializationContext {
    pub fn new() -> Self {
        Self {
            materialize_memo: BTreeMap::new(),
        }
    }

    fn materialize_tag(t: &SubTypeTag) -> Mater {
        match t {
            SubTypeTag::Null => return Mater::Null,
            SubTypeTag::Boolean => return Mater::Boolean,
            SubTypeTag::Number => return Mater::Number,
            SubTypeTag::String => return Mater::String,
            SubTypeTag::Void => return Mater::Void,
            SubTypeTag::Mapping => unreachable!("we do not allow creation of all mappings"),
            SubTypeTag::List => unreachable!("we do not allow creation of all arrays"),
        }
    }
    fn mapping_evidence_mater(&mut self, mt: &Rc<MappingEvidence>) -> Mater {
        let mut acc: Vec<(String, Mater)> = vec![];

        for (k, v) in mt.iter() {
            let ty = self.materialize_ev(v);
            acc.push((k.clone(), ty));
            // let ty = if v.has_void() {
            //     schema.optional()
            // } else {
            //     schema.required()
            // };
        }

        Mater::Object(BTreeMap::from_iter(acc))
    }
    fn list_evidence_mater(&mut self, mt: &Rc<ListEvidence>) -> Mater {
        let items = match &mt.items {
            Some(it) => self.materialize_ev(&it),
            None => Mater::Never,
        };
        let prefix_items = mt
            .prefix_items
            .iter()
            .map(|x| self.materialize_ev(x))
            .collect();
        Mater::Array {
            items: Box::new(items),
            prefix_items,
        }
    }

    pub fn materialize_ev(&mut self, ty: &Evidence) -> Mater {
        match ty {
            Evidence::All(t) => Self::materialize_tag(t),
            Evidence::Proper(s) => match s {
                ProperSubtypeEvidence::Boolean(v) => return Mater::BooleanLiteral(*v),
                ProperSubtypeEvidence::Number { allowed, values } => {
                    if !allowed {
                        return Mater::NumberLiteral(N::parse_int(4773992856));
                    }
                    match values.split_first() {
                        Some((h, _t)) => return Mater::NumberLiteral(h.clone()),
                        None => unreachable!("number values cannot be empty"),
                    }
                }
                ProperSubtypeEvidence::String { allowed, values } => {
                    if !allowed {
                        return Mater::StringLiteral("Izr1mn6edP0HLrWu".into());
                    }
                    match values.split_first() {
                        Some((h, _t)) => match h {
                            StringLitOrFormat::Lit(st) => return Mater::StringLiteral(st.clone()),
                            StringLitOrFormat::Format(fmt) => {
                                return Mater::StringWithFormat(fmt.clone())
                            }
                        },
                        None => unreachable!("string values cannot be empty"),
                    }
                }
                ProperSubtypeEvidence::List(lt) => self.list_evidence_mater(lt),
                ProperSubtypeEvidence::Mapping(mt) => self.mapping_evidence_mater(mt),
            },
        }
    }
}

#[derive(PartialEq, Eq, Debug, Clone)]
pub enum Mater {
    // special
    Never,
    Unknown,
    Void,
    Recursive,

    // json
    Null,
    Boolean,
    Number,
    String,
    StringWithFormat(String),
    StringLiteral(String),
    NumberLiteral(N),
    BooleanLiteral(bool),
    Array {
        items: Box<Mater>,
        prefix_items: Vec<Mater>,
    },
    Object(BTreeMap<String, Mater>),
}

impl Mater {
    pub fn is_never(&self) -> bool {
        matches!(self, Mater::Never)
    }
}
