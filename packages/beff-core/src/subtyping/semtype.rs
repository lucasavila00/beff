use crate::subtyping::evidence::Evidence;

use super::{
    bdd::{
        keyof, list_indexed_access, mapping_indexed_access, Atom, Bdd, ListAtomic, MappingAtomic,
    },
    evidence::{EvidenceResult, ProperSubtypeEvidenceResult},
    subtype::{
        BasicTypeBitSet, BasicTypeCode, NumberRepresentation, ProperSubtype, ProperSubtypeOps,
        StringLitOrFormat, SubType, SubTypeTag, VAL,
    },
};
use std::{collections::BTreeMap, rc::Rc};

struct SubTypePairIterator {
    i1: usize,
    i2: usize,
    t1: Rc<SemType>,
    t2: Rc<SemType>,
    bits: BasicTypeBitSet,
}

impl SubTypePairIterator {
    fn include(&self, code: BasicTypeCode) -> bool {
        (self.bits & code) != 0
    }
}

impl Iterator for SubTypePairIterator {
    type Item = (Option<Rc<ProperSubtype>>, Option<Rc<ProperSubtype>>);

    fn next(&mut self) -> Option<Self::Item> {
        loop {
            if self.i1 >= self.t1.subtype_data.len() {
                if self.i2 >= self.t2.subtype_data.len() {
                    break;
                }
                let data2 = self.t2.subtype_data.get(self.i2).expect("should exist");
                self.i2 += 1;
                if self.include(data2.to_code()) {
                    return Some((None, Some(data2.clone())));
                }
            } else if self.i2 >= self.t2.subtype_data.len() {
                let data1 = self.t1.subtype_data.get(self.i1).expect("should exist");
                self.i1 += 1;
                if self.include(data1.to_code()) {
                    return Some((Some(data1.clone()), None));
                }
            } else {
                let data1 = self.t1.subtype_data.get(self.i1).expect("should exist");
                let data2 = self.t2.subtype_data.get(self.i2).expect("should exist");

                let code1 = data1.to_code();
                let code2 = data2.to_code();

                match code1.cmp(&code2) {
                    std::cmp::Ordering::Equal => {
                        self.i1 += 1;
                        self.i2 += 1;
                        if self.include(code1) {
                            return Some((Some(data1.clone()), Some(data2.clone())));
                        }
                    }
                    std::cmp::Ordering::Less => {
                        self.i1 += 1;
                        if self.include(code1) {
                            return Some((Some(data1.clone()), None));
                        }
                    }
                    std::cmp::Ordering::Greater => {
                        self.i2 += 1;
                        if self.include(code2) {
                            return Some((None, Some(data2.clone())));
                        }
                    }
                }
            }
        }

        None
    }
}

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd)]
pub struct ComplexSemType {
    pub all: BasicTypeBitSet,
    // some: BasicTypeBitSet,
    pub subtype_data: Vec<Rc<ProperSubtype>>,
}

pub type SemType = ComplexSemType;

pub trait SemTypeOps {
    fn is_empty(&self, ctx: &mut SemTypeContext) -> bool;
    fn is_empty_evidence(&self, ctx: &mut SemTypeContext) -> EvidenceResult;
    fn intersect(&self, t2: &Rc<SemType>) -> Rc<SemType>;
    fn union(&self, t2: &Rc<SemType>) -> Rc<SemType>;
    fn diff(&self, t2: &Rc<SemType>) -> Rc<SemType>;
    fn complement(&self) -> Rc<SemType>;
    fn is_subtype(&self, t2: &Rc<SemType>, ctx: &mut SemTypeContext) -> bool;
    fn is_same_type(&self, t2: &Rc<SemType>, ctx: &mut SemTypeContext) -> bool;
}

impl SemTypeOps for Rc<SemType> {
    fn is_empty_evidence(&self, builder: &mut SemTypeContext) -> EvidenceResult {
        if self.all != 0 {
            for i in SubTypeTag::all() {
                if (self.all & i.code()) != 0 {
                    return Evidence::All(i).to_result();
                }
            }
            unreachable!("should have found a tag")
        }
        for st in self.subtype_data.iter() {
            match st.is_empty_evidence(builder) {
                ProperSubtypeEvidenceResult::IsEmpty => {}
                ProperSubtypeEvidenceResult::Evidence(st) => {
                    return Evidence::Proper(st).to_result()
                }
            }
        }
        EvidenceResult::IsEmpty
    }
    fn is_empty(&self, builder: &mut SemTypeContext) -> bool {
        matches!(self.is_empty_evidence(builder), EvidenceResult::IsEmpty)
    }

    fn intersect(&self, t2: &Rc<SemType>) -> Rc<SemType> {
        let t1 = self;
        let all = t1.all & t2.all;
        let some = (t1.some_as_bitset() | t1.all) & (t2.some_as_bitset() | t2.all);

        let some = some & !all;

        if some == 0 {
            return SemType::new_basic(all).into();
        }
        let mut subtypes: Vec<Rc<ProperSubtype>> = vec![];

        let iter = SubTypePairIterator {
            i1: 0,
            i2: 0,
            t1: t1.clone(),
            t2: t2.clone(),
            bits: some,
        };

        for (data1, data2) in iter {
            let data = match (data1, data2) {
                (Some(data1), None) => Some(Rc::new(SubType::Proper(data1))),
                (None, Some(data2)) => Some(Rc::new(SubType::Proper(data2))),
                (Some(data1), Some(data2)) => Some(data1.intersect(&data2)),
                _ => None,
            };

            if let Some(data) = data {
                if let SubType::Proper(data) = &*data {
                    subtypes.push(data.clone());
                }
            }
        }

        SemType::new_complex(all, subtypes).into()
    }

    fn union(&self, t2: &Rc<SemType>) -> Rc<SemType> {
        let t1 = self;
        let mut all = t1.all | t2.all;
        let some = (t1.some_as_bitset() | t2.some_as_bitset()) & !all;

        let some = some & !all;

        if some == 0 {
            return SemType::new_basic(all).into();
        }
        let mut subtypes: Vec<Rc<ProperSubtype>> = vec![];

        let iter = SubTypePairIterator {
            i1: 0,
            i2: 0,
            t1: t1.clone(),
            t2: t2.clone(),
            bits: some,
        };

        for (data1, data2) in iter {
            let data = match (data1, data2) {
                (Some(data1), None) => Some(Rc::new(SubType::Proper(data1))),
                (None, Some(data2)) => Some(Rc::new(SubType::Proper(data2))),
                (Some(data1), Some(data2)) => Some(data1.union(&data2)),
                _ => None,
            };
            if let Some(data) = data {
                match &*data {
                    SubType::True(tag) => all |= tag.code(),
                    SubType::Proper(data) => subtypes.push(data.clone()),
                    _ => {}
                }
            }
        }

        SemType::new_complex(all, subtypes).into()
    }

    fn diff(&self, t2: &Rc<SemType>) -> Rc<SemType> {
        let t1 = self;

        let mut all = t1.all & !(t2.all | t2.some_as_bitset());
        let mut some = (t1.all | t1.some_as_bitset()) & !(t2.all);
        some &= !all;
        if some == 0 {
            return SemType::new_basic(all).into();
        }
        let mut subtypes: Vec<Rc<ProperSubtype>> = vec![];

        let iter = SubTypePairIterator {
            i1: 0,
            i2: 0,
            t1: t1.clone(),
            t2: t2.clone(),
            bits: some,
        };

        for (data1, data2) in iter {
            let data = match (data1, data2) {
                (None, Some(data2)) => Some(Rc::new(SubType::Proper(data2.complement()))),
                (Some(data1), None) => Some(Rc::new(SubType::Proper(data1))),
                (Some(data1), Some(data2)) => Some(data1.diff(&data2)),
                _ => None,
            };

            if let Some(data) = data {
                match &*data {
                    SubType::True(tag) => all |= tag.code(),
                    SubType::Proper(data) => subtypes.push(data.clone()),
                    _ => {}
                }
            }
        }

        SemType::new_complex(all, subtypes).into()
    }

    fn complement(&self) -> Rc<SemType> {
        Rc::new(SemTypeContext::unknown()).diff(self)
    }

    fn is_subtype(&self, t2: &Rc<SemType>, ctx: &mut SemTypeContext) -> bool {
        self.diff(t2).is_empty(ctx)
    }

    fn is_same_type(&self, t2: &Rc<SemType>, ctx: &mut SemTypeContext) -> bool {
        self.is_subtype(t2, ctx) && t2.is_subtype(self, ctx)
    }
}

impl SemType {
    pub fn has_void(&self) -> bool {
        (self.all & SubTypeTag::Void.code()) != 0
    }

    pub fn is_never(&self) -> bool {
        self.all == 0 && self.subtype_data.is_empty()
    }
    pub fn is_any(&self) -> bool {
        self.all == VAL
    }
    pub fn new_basic(all: BasicTypeBitSet) -> SemType {
        SemType {
            all,
            subtype_data: vec![],
        }
    }

    fn some_as_bitset(&self) -> BasicTypeBitSet {
        let mut some = 0;
        for subtype in self.subtype_data.iter() {
            some |= subtype.to_code();
        }
        some
    }

    pub fn new_complex(all: BasicTypeBitSet, subtypes: Vec<Rc<ProperSubtype>>) -> SemType {
        SemType {
            all,
            subtype_data: subtypes,
        }
    }

    pub fn new_never() -> SemType {
        SemType {
            all: 0,
            subtype_data: vec![],
        }
    }
    pub fn new_unknown() -> SemType {
        SemType {
            all: VAL,
            subtype_data: vec![],
        }
    }
}

#[derive(Debug, Clone)]
pub enum MemoEmpty {
    True,
    False(ProperSubtypeEvidenceResult),
    Undefined,
}

impl MemoEmpty {
    pub fn from_bool(b: &ProperSubtypeEvidenceResult) -> MemoEmpty {
        match b {
            ProperSubtypeEvidenceResult::IsEmpty => MemoEmpty::True,
            ProperSubtypeEvidenceResult::Evidence(_) => MemoEmpty::False(b.clone()),
        }
    }
}

#[derive(Clone, Debug)]
pub struct BddMemoEmptyRef(pub MemoEmpty);

#[derive(Debug)]

pub struct MappingAtomicType {
    pub vs: Rc<MappingAtomic>,
    pub rest: Rc<SemType>,
}

pub struct SemTypeContext {
    pub mapping_definitions: Vec<Option<Rc<MappingAtomicType>>>,
    pub mapping_memo: BTreeMap<Bdd, BddMemoEmptyRef>,

    pub list_definitions: Vec<Option<Rc<ListAtomic>>>,
    pub list_memo: BTreeMap<Bdd, BddMemoEmptyRef>,

    pub mapping_json_schema_ref_memo: BTreeMap<String, usize>,
    pub list_json_schema_ref_memo: BTreeMap<String, usize>,
}
impl Default for SemTypeContext {
    fn default() -> Self {
        Self::new()
    }
}

impl SemTypeContext {
    pub fn get_mapping_atomic(&self, idx: usize) -> Rc<MappingAtomicType> {
        self.mapping_definitions
            .get(idx)
            .expect("should exist")
            .as_ref()
            .expect("should exist")
            .clone()
    }
    pub fn get_list_atomic(&self, idx: usize) -> Rc<ListAtomic> {
        self.list_definitions
            .get(idx)
            .expect("should exist")
            .as_ref()
            .expect("should exist")
            .clone()
    }

    pub fn new() -> SemTypeContext {
        SemTypeContext {
            list_definitions: vec![],
            mapping_definitions: vec![],
            mapping_memo: BTreeMap::new(),
            list_memo: BTreeMap::new(),
            mapping_json_schema_ref_memo: BTreeMap::new(),
            list_json_schema_ref_memo: BTreeMap::new(),
        }
    }
    pub fn number_const(value: NumberRepresentation) -> SemType {
        SemType::new_complex(
            0x0,
            vec![ProperSubtype::Number {
                allowed: true,
                values: vec![value],
            }
            .into()],
        )
    }

    pub fn string_const(value: StringLitOrFormat) -> SemType {
        SemType::new_complex(
            0x0,
            vec![ProperSubtype::String {
                allowed: true,
                values: vec![value],
            }
            .into()],
        )
    }
    pub fn mapping_definition_from_idx(idx: usize) -> SemType {
        SemType::new_complex(
            0x0,
            vec![ProperSubtype::Mapping(Bdd::from_atom(Atom::Mapping(idx)).into()).into()],
        )
    }
    pub fn mapping_definition(&mut self, vs: Rc<MappingAtomic>, rest: Rc<SemType>) -> SemType {
        let idx = self.mapping_definitions.len();
        self.mapping_definitions.push(Some(
            MappingAtomicType {
                vs: vs.clone(),
                rest,
            }
            .into(),
        ));

        Self::mapping_definition_from_idx(idx)
    }
    pub fn list_definition_from_idx(idx: usize) -> SemType {
        SemType::new_complex(
            0x0,
            vec![ProperSubtype::List(Bdd::from_atom(Atom::List(idx)).into()).into()],
        )
    }
    pub fn list_definition(&mut self, vs: Rc<ListAtomic>) -> SemType {
        let idx = self.list_definitions.len();
        self.list_definitions.push(Some(vs.clone()));

        Self::list_definition_from_idx(idx)
    }
    pub fn array(&mut self, v: Rc<SemType>) -> SemType {
        let atom = ListAtomic {
            prefix_items: vec![],
            items: v,
        };
        self.list_definition(Rc::new(atom))
    }
    pub fn tuple(&mut self, prefix_items: Vec<Rc<SemType>>, items: Option<Rc<SemType>>) -> SemType {
        let atom = ListAtomic {
            prefix_items,
            // todo: should be unknown?
            items: items.unwrap_or(Self::never().into()),
        };
        self.list_definition(Rc::new(atom))
    }
    pub fn boolean_const(value: bool) -> SemType {
        SemType::new_complex(0x0, vec![ProperSubtype::Boolean(value).into()])
    }
    pub fn boolean() -> SemType {
        SemType::new_basic(SubTypeTag::Boolean.code())
    }
    pub fn number() -> SemType {
        SemType::new_basic(SubTypeTag::Number.code())
    }
    pub fn string() -> SemType {
        SemType::new_basic(SubTypeTag::String.code())
    }
    pub fn null() -> SemType {
        SemType::new_basic(SubTypeTag::Null.code())
    }
    pub fn void() -> SemType {
        SemType::new_basic(SubTypeTag::Void.code())
    }
    pub fn optional(it: Rc<SemType>) -> Rc<SemType> {
        let t2 = Self::void();
        Rc::new(it).union(&Rc::new(t2))
    }
    pub fn never() -> SemType {
        SemType::new_never()
    }
    pub fn unknown() -> SemType {
        SemType::new_unknown()
    }

    fn get_complex_sub_type_data(s: &Vec<Rc<ProperSubtype>>, tag: SubTypeTag) -> SubType {
        for t in s {
            match (t.as_ref(), &tag) {
                (ProperSubtype::Number { .. }, SubTypeTag::Number)
                | (ProperSubtype::String { .. }, SubTypeTag::String)
                | (ProperSubtype::Mapping(_), SubTypeTag::Mapping)
                | (ProperSubtype::List(_), SubTypeTag::List)
                | (ProperSubtype::Boolean(_), SubTypeTag::Boolean) => {
                    return SubType::Proper(t.clone())
                }
                _ => {}
            }
        }
        SubType::False(tag)
    }
    pub fn sub_type_data(s: Rc<SemType>, tag: SubTypeTag) -> SubType {
        if (s.all & tag.code()) > 0 {
            return SubType::True(tag);
        }
        Self::get_complex_sub_type_data(&s.subtype_data, tag)
    }

    pub fn number_sub_type(s: Rc<SemType>) -> SubType {
        Self::sub_type_data(s, SubTypeTag::Number)
    }
    pub fn string_sub_type(s: Rc<SemType>) -> SubType {
        Self::sub_type_data(s, SubTypeTag::String)
    }

    pub fn indexed_access(
        &mut self,
        obj_st: Rc<SemType>,
        idx_st: Rc<SemType>,
    ) -> anyhow::Result<Rc<SemType>> {
        let list_result = list_indexed_access(self, obj_st.clone(), idx_st.clone())?;
        if list_result.is_empty(self) {
            return mapping_indexed_access(self, obj_st, idx_st);
        }
        Ok(list_result)
    }

    pub fn keyof(&mut self, st: Rc<SemType>) -> anyhow::Result<Rc<SemType>> {
        keyof(self, st)
    }
}
