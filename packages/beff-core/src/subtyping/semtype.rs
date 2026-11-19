use crate::{
    RuntypeUUID,
    ast::runtype::TypedArrayKind,
    subtyping::{
        IsEmptyStatus,
        bdd::{IndexedPropertiesAtomic, MappingAtomicType},
        dnf::Dnf,
        subtype::{NumberRepresentationOrFormat, VoidUndefinedSubtype},
    },
};
use anyhow::Result;

use super::{
    bdd::{Atom, Bdd, ListAtomic, keyof, list_indexed_access, mapping_indexed_access},
    subtype::{
        BasicTypeBitSet, BasicTypeCode, ProperSubtype, ProperSubtypeOps, StringLitOrFormat,
        SubType, SubTypeTag, VAL,
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
pub(crate) struct ComplexSemType {
    pub all: BasicTypeBitSet,
    // some: BasicTypeBitSet,
    pub subtype_data: Vec<Rc<ProperSubtype>>,
}

pub(crate) type SemType = ComplexSemType;

pub(crate) trait SemTypeOps {
    fn is_empty(&self, ctx: &mut SemTypeContext) -> Result<bool>;
    fn is_empty_status(&self, ctx: &mut SemTypeContext) -> Result<IsEmptyStatus>;
    fn intersect(&self, t2: &Rc<SemType>) -> Result<Rc<SemType>>;
    fn union(&self, t2: &Rc<SemType>) -> Result<Rc<SemType>>;
    fn diff(&self, t2: &Rc<SemType>) -> Result<Rc<SemType>>;
    fn complement(&self) -> Result<Rc<SemType>>;
    fn is_subtype(&self, t2: &Rc<SemType>, ctx: &mut SemTypeContext) -> Result<bool>;
    fn is_same_type(&self, t2: &Rc<SemType>, ctx: &mut SemTypeContext) -> Result<bool>;
}

impl SemTypeOps for Rc<SemType> {
    fn is_empty_status(&self, builder: &mut SemTypeContext) -> Result<IsEmptyStatus> {
        if self.all != 0 {
            for i in SubTypeTag::all() {
                if (self.all & i.code()) != 0 {
                    return Ok(IsEmptyStatus::NotEmpty);
                }
            }
            unreachable!("should have found a tag")
        }
        for st in self.subtype_data.iter() {
            match st.is_empty_status(builder)? {
                IsEmptyStatus::IsEmpty => {}
                IsEmptyStatus::NotEmpty => return Ok(IsEmptyStatus::NotEmpty),
            }
        }
        Ok(IsEmptyStatus::IsEmpty)
    }
    fn is_empty(&self, builder: &mut SemTypeContext) -> Result<bool> {
        Ok(matches!(
            self.is_empty_status(builder)?,
            IsEmptyStatus::IsEmpty
        ))
    }

    fn intersect(&self, t2: &Rc<SemType>) -> Result<Rc<SemType>> {
        let t1 = self;
        let all = t1.all & t2.all;
        let some = (t1.some_as_bitset() | t1.all) & (t2.some_as_bitset() | t2.all);

        let some = some & !all;

        if some == 0 {
            return Ok(SemType::new_basic(all).into());
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
                (Some(data1), Some(data2)) => Some(data1.intersect(&data2)?),
                _ => None,
            };

            if let Some(data) = data
                && let SubType::Proper(data) = &*data
            {
                subtypes.push(data.clone());
            }
        }

        Ok(SemType::new_complex(all, subtypes).into())
    }

    fn union(&self, t2: &Rc<SemType>) -> Result<Rc<SemType>> {
        let t1 = self;
        let mut all = t1.all | t2.all;
        let some = (t1.some_as_bitset() | t2.some_as_bitset()) & !all;

        let some = some & !all;

        if some == 0 {
            return Ok(SemType::new_basic(all).into());
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
                (Some(data1), Some(data2)) => Some(data1.union(&data2)?),
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

        Ok(SemType::new_complex(all, subtypes).into())
    }

    fn diff(&self, t2: &Rc<SemType>) -> Result<Rc<SemType>> {
        let t1 = self;

        let mut all = t1.all & !(t2.all | t2.some_as_bitset());
        let mut some = (t1.all | t1.some_as_bitset()) & !(t2.all);
        some &= !all;
        if some == 0 {
            return Ok(SemType::new_basic(all).into());
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
                (Some(data1), Some(data2)) => Some(data1.diff(&data2)?),
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

        Ok(SemType::new_complex(all, subtypes).into())
    }

    fn complement(&self) -> Result<Rc<SemType>> {
        Rc::new(SemTypeContext::unknown()).diff(self)
    }

    fn is_subtype(&self, t2: &Rc<SemType>, ctx: &mut SemTypeContext) -> Result<bool> {
        self.diff(t2)?.is_empty(ctx)
    }

    fn is_same_type(&self, t2: &Rc<SemType>, ctx: &mut SemTypeContext) -> Result<bool> {
        Ok(self.is_subtype(t2, ctx)? && t2.is_subtype(self, ctx)?)
    }
}

impl SemType {
    pub(crate) fn has_optional(&self) -> bool {
        (self.all & SubTypeTag::OptionalProp.code()) != 0
    }
    pub(crate) fn is_subtype_of_string(&self) -> bool {
        let only_string_sub = self.all == 0
            && self
                .subtype_data
                .iter()
                .any(|it| it.tag() == SubTypeTag::String);
        let is_string = (self.all & SubTypeTag::String.code()) != 0;

        is_string || only_string_sub
    }

    pub(crate) fn is_subtype_of_number(&self) -> bool {
        let only_number_sub = self.all == 0
            && self
                .subtype_data
                .iter()
                .any(|it| it.tag() == SubTypeTag::Number);
        let is_number = (self.all & SubTypeTag::Number.code()) != 0;

        is_number || only_number_sub
    }

    pub(crate) fn is_all_strings(&self) -> bool {
        self.all == SubTypeTag::String.code()
    }

    pub(crate) fn is_never(&self) -> bool {
        self.all == 0 && self.subtype_data.is_empty()
    }
    pub(crate) fn is_any(&self) -> bool {
        self.all == VAL
    }
    pub(crate) fn new_basic(all: BasicTypeBitSet) -> SemType {
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

    pub(crate) fn new_complex(all: BasicTypeBitSet, subtypes: Vec<Rc<ProperSubtype>>) -> SemType {
        SemType {
            all,
            subtype_data: subtypes,
        }
    }

    pub(crate) fn new_never() -> SemType {
        SemType {
            all: 0,
            subtype_data: vec![],
        }
    }
    pub(crate) fn new_unknown() -> SemType {
        SemType {
            all: VAL,
            subtype_data: vec![],
        }
    }
}

#[derive(Debug, Clone)]
pub(crate) enum MemoEmpty {
    True,
    False(IsEmptyStatus),
    Undefined,
}

impl MemoEmpty {
    pub(crate) fn from_bool(b: &IsEmptyStatus) -> MemoEmpty {
        match b {
            IsEmptyStatus::IsEmpty => MemoEmpty::True,
            IsEmptyStatus::NotEmpty => MemoEmpty::False(*b),
        }
    }
}

#[derive(Clone, Debug)]
pub(crate) struct BddMemoEmptyRef(pub MemoEmpty);

pub(crate) struct SemTypeContext {
    pub mapping_definitions: Vec<Option<Rc<MappingAtomicType>>>,
    pub mapping_memo_dnf: BTreeMap<Rc<Dnf>, BddMemoEmptyRef>,

    pub list_definitions: Vec<Option<Rc<ListAtomic>>>,
    pub list_memo: BTreeMap<Bdd, BddMemoEmptyRef>,

    pub map_definitions: Vec<Option<Rc<MappingAtomicType>>>,

    pub set_definitions: Vec<Option<Rc<ListAtomic>>>,

    pub mapping_runtype_ref_memo: BTreeMap<RuntypeUUID, usize>,
    pub list_runtype_ref_memo: BTreeMap<RuntypeUUID, usize>,
    pub map_runtype_ref_memo: BTreeMap<RuntypeUUID, usize>,
    pub set_runtype_ref_memo: BTreeMap<RuntypeUUID, usize>,
}
impl Default for SemTypeContext {
    fn default() -> Self {
        Self::new()
    }
}

impl SemTypeContext {
    pub(crate) fn get_mapping_atomic(&self, idx: usize) -> Rc<MappingAtomicType> {
        self.mapping_definitions
            .get(idx)
            .expect("should exist")
            .as_ref()
            .expect("should exist")
            .clone()
    }
    pub(crate) fn get_map_atomic(&self, idx: usize) -> Rc<MappingAtomicType> {
        self.map_definitions
            .get(idx)
            .expect("should exist")
            .as_ref()
            .expect("should exist")
            .clone()
    }
    pub(crate) fn get_set_atomic(&self, idx: usize) -> Rc<ListAtomic> {
        self.set_definitions
            .get(idx)
            .expect("should exist")
            .as_ref()
            .expect("should exist")
            .clone()
    }
    pub(crate) fn get_list_atomic(&self, idx: usize) -> Rc<ListAtomic> {
        self.list_definitions
            .get(idx)
            .expect("should exist")
            .as_ref()
            .expect("should exist")
            .clone()
    }

    pub(crate) fn new() -> SemTypeContext {
        SemTypeContext {
            mapping_definitions: vec![],
            mapping_memo_dnf: BTreeMap::new(),
            list_definitions: vec![],
            list_memo: BTreeMap::new(),
            map_definitions: vec![],
            set_definitions: vec![],
            mapping_runtype_ref_memo: BTreeMap::new(),
            list_runtype_ref_memo: BTreeMap::new(),
            map_runtype_ref_memo: BTreeMap::new(),
            set_runtype_ref_memo: BTreeMap::new(),
        }
    }
    pub(crate) fn number_const(value: NumberRepresentationOrFormat) -> SemType {
        SemType::new_complex(
            0x0,
            vec![
                ProperSubtype::Number {
                    allowed: true,
                    values: vec![value],
                }
                .into(),
            ],
        )
    }

    pub(crate) fn string_const(value: StringLitOrFormat) -> SemType {
        SemType::new_complex(
            0x0,
            vec![
                ProperSubtype::String {
                    allowed: true,
                    values: vec![value],
                }
                .into(),
            ],
        )
    }
    pub(crate) fn mapping_definition_from_idx(idx: usize) -> SemType {
        SemType::new_complex(
            0x0,
            vec![ProperSubtype::Mapping(Bdd::from_atom(Atom::Mapping(idx)).into()).into()],
        )
    }

    pub(crate) fn mapping_definition(
        &mut self,
        vs: BTreeMap<String, Rc<SemType>>,
        indexed_properties: Option<IndexedPropertiesAtomic>,
    ) -> SemType {
        let idx = self.mapping_definitions.len();
        self.mapping_definitions.push(Some(
            MappingAtomicType {
                vs: vs.clone(),
                indexed_properties,
            }
            .into(),
        ));

        Self::mapping_definition_from_idx(idx)
    }

    pub(crate) fn list_definition_from_idx(idx: usize) -> SemType {
        SemType::new_complex(
            0x0,
            vec![ProperSubtype::List(Bdd::from_atom(Atom::List(idx)).into()).into()],
        )
    }
    pub(crate) fn list_definition(&mut self, vs: Rc<ListAtomic>) -> SemType {
        let idx = self.list_definitions.len();
        self.list_definitions.push(Some(vs.clone()));

        Self::list_definition_from_idx(idx)
    }
    pub(crate) fn array(&mut self, v: Rc<SemType>) -> SemType {
        let atom = ListAtomic {
            prefix_items: vec![],
            items: v,
        };
        self.list_definition(Rc::new(atom))
    }
    pub(crate) fn tuple(
        &mut self,
        prefix_items: Vec<Rc<SemType>>,
        items: Option<Rc<SemType>>,
    ) -> SemType {
        let atom = ListAtomic {
            prefix_items,
            // todo: should be unknown?
            items: items.unwrap_or(Self::never().into()),
        };
        self.list_definition(Rc::new(atom))
    }

    pub(crate) fn map_definition_from_idx(idx: usize) -> SemType {
        SemType::new_complex(
            0x0,
            vec![ProperSubtype::Map(Bdd::from_atom(Atom::Map(idx)).into()).into()],
        )
    }

    pub(crate) fn map_definition(
        &mut self,
        vs: BTreeMap<String, Rc<SemType>>,
        indexed_properties: Option<IndexedPropertiesAtomic>,
    ) -> SemType {
        let idx = self.map_definitions.len();
        self.map_definitions.push(Some(
            MappingAtomicType {
                vs: vs.clone(),
                indexed_properties,
            }
            .into(),
        ));

        Self::map_definition_from_idx(idx)
    }

    pub(crate) fn set_definition_from_idx(idx: usize) -> SemType {
        SemType::new_complex(
            0x0,
            vec![ProperSubtype::Set(Bdd::from_atom(Atom::Set(idx)).into()).into()],
        )
    }

    pub(crate) fn set_definition(&mut self, vs: Rc<ListAtomic>) -> SemType {
        let idx = self.set_definitions.len();
        self.set_definitions.push(Some(vs.clone()));

        Self::set_definition_from_idx(idx)
    }

    pub(crate) fn map(&mut self, k: Rc<SemType>, v: Rc<SemType>) -> SemType {
        let atom = MappingAtomicType {
            vs: BTreeMap::new(),
            indexed_properties: Some(IndexedPropertiesAtomic { key: k, value: v }),
        };
        self.map_definition(atom.vs, atom.indexed_properties)
    }

    pub(crate) fn set(&mut self, v: Rc<SemType>) -> SemType {
        let atom = ListAtomic {
            prefix_items: vec![],
            items: v,
        };
        self.set_definition(Rc::new(atom))
    }

    pub(crate) fn boolean_const(value: bool) -> SemType {
        SemType::new_complex(0x0, vec![ProperSubtype::Boolean(value).into()])
    }
    pub(crate) fn boolean() -> SemType {
        SemType::new_basic(SubTypeTag::Boolean.code())
    }
    pub(crate) fn number() -> SemType {
        SemType::new_basic(SubTypeTag::Number.code())
    }
    pub(crate) fn string() -> SemType {
        SemType::new_basic(SubTypeTag::String.code())
    }
    pub(crate) fn null() -> SemType {
        SemType::new_basic(SubTypeTag::Null.code())
    }
    pub(crate) fn undefined() -> SemType {
        SemType::new_complex(
            0x0,
            vec![
                ProperSubtype::VoidUndefined {
                    allowed: true,
                    values: vec![VoidUndefinedSubtype::Undefined],
                }
                .into(),
            ],
        )
    }
    pub(crate) fn void() -> SemType {
        SemType::new_complex(
            0x0,
            vec![
                ProperSubtype::VoidUndefined {
                    allowed: true,
                    values: vec![VoidUndefinedSubtype::Void],
                }
                .into(),
            ],
        )
    }
    pub(crate) fn optional_prop() -> SemType {
        SemType::new_basic(SubTypeTag::OptionalProp.code())
    }
    pub(crate) fn make_optional(it: Rc<SemType>) -> Result<Rc<SemType>> {
        let t2 = Self::optional_prop();
        Rc::new(it).union(&Rc::new(t2))
    }
    pub(crate) fn never() -> SemType {
        SemType::new_never()
    }
    pub(crate) fn unknown() -> SemType {
        SemType::new_unknown()
    }

    pub(crate) fn date() -> ComplexSemType {
        SemType::new_basic(SubTypeTag::Date.code())
    }
    pub(crate) fn bigint() -> ComplexSemType {
        SemType::new_basic(SubTypeTag::BigInt.code())
    }

    pub(crate) fn typed_array(kind: TypedArrayKind) -> ComplexSemType {
        SemType::new_complex(
            0x0,
            vec![
                ProperSubtype::TypedArray {
                    allowed: true,
                    values: vec![kind],
                }
                .into(),
            ],
        )
    }

    fn get_complex_sub_type_data(s: &Vec<Rc<ProperSubtype>>, tag: SubTypeTag) -> SubType {
        for t in s {
            match (t.as_ref(), &tag) {
                (ProperSubtype::Number { .. }, SubTypeTag::Number)
                | (ProperSubtype::String { .. }, SubTypeTag::String)
                | (ProperSubtype::Mapping(_), SubTypeTag::Mapping)
                | (ProperSubtype::List(_), SubTypeTag::List)
                | (ProperSubtype::Boolean(_), SubTypeTag::Boolean)
                | (ProperSubtype::TypedArray { .. }, SubTypeTag::TypedArray)
                | (ProperSubtype::Map(_), SubTypeTag::Map)
                | (ProperSubtype::Set(_), SubTypeTag::Set) => {
                    return SubType::Proper(t.clone());
                }
                _ => {}
            }
        }
        SubType::False
    }
    pub(crate) fn sub_type_data(s: Rc<SemType>, tag: SubTypeTag) -> SubType {
        if (s.all & tag.code()) > 0 {
            return SubType::True(tag);
        }
        Self::get_complex_sub_type_data(&s.subtype_data, tag)
    }

    pub(crate) fn number_sub_type(s: Rc<SemType>) -> SubType {
        Self::sub_type_data(s, SubTypeTag::Number)
    }
    pub(crate) fn string_sub_type(s: Rc<SemType>) -> SubType {
        Self::sub_type_data(s, SubTypeTag::String)
    }

    pub(crate) fn indexed_access(
        &mut self,
        obj_st: Rc<SemType>,
        idx_st: Rc<SemType>,
    ) -> anyhow::Result<Rc<SemType>> {
        let list_result = list_indexed_access(self, obj_st.clone(), idx_st.clone())?;
        let mapping_result = mapping_indexed_access(self, obj_st.clone(), idx_st.clone())?;
        let mut acc = list_result.union(&mapping_result)?;

        if idx_st.is_subtype_of_number() && obj_st.is_subtype_of_string() {
            acc = acc.union(&Rc::new(SemTypeContext::string()))?;
        }
        Ok(acc)
    }

    pub(crate) fn keyof(&mut self, st: Rc<SemType>) -> anyhow::Result<Rc<SemType>> {
        keyof(self, st)
    }
}
