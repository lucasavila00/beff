use crate::ast::json::{Json, N};

use super::{
    bdd::{Atom, Bdd, ListAtomic, MappingAtomic},
    subtype::{
        BasicTypeBitSet, BasicTypeCode, NumberRepresentation, ProperSubtype, ProperSubtypeOps,
        StringLitOrFormat, SubType, SubTypeTag,
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
        return (self.bits & code) != 0;
    }
}

impl Iterator for SubTypePairIterator {
    type Item = (Option<Rc<ProperSubtype>>, Option<Rc<ProperSubtype>>);

    fn next(&mut self) -> Option<Self::Item> {
        if self.i1 >= self.t1.subtype_data.len() {
            if self.i2 >= self.t2.subtype_data.len() {
                return None;
            }
            let data2 = self.t2.subtype_data.get(self.i2).unwrap();
            self.i2 += 1;
            if self.include(data2.to_code()) {
                return Some((None, Some(data2.clone())));
            }
        } else if self.i2 >= self.t2.subtype_data.len() {
            let data1 = self.t1.subtype_data.get(self.i1).unwrap();
            self.i1 += 1;
            if self.include(data1.to_code()) {
                return Some((Some(data1.clone()), None));
            }
        } else {
            let data1 = self.t1.subtype_data.get(self.i1).unwrap();
            let data2 = self.t2.subtype_data.get(self.i2).unwrap();
            let code1 = data1.to_code();
            let code2 = data2.to_code();
            if code1 == code2 {
                self.i1 += 1;
                self.i2 += 1;
                if self.include(code1) {
                    return Some((Some(data1.clone()), Some(data2.clone())));
                }
            } else if code1 < code2 {
                self.i1 += 1;
                if self.include(code1) {
                    return Some((Some(data1.clone()), None));
                }
            } else {
                self.i2 += 1;
                if self.include(code2) {
                    return Some((None, Some(data2.clone())));
                }
            }
        }

        return None;
    }
}

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd)]
pub struct ComplexSemType {
    all: BasicTypeBitSet,
    // some: BasicTypeBitSet,
    subtype_data: Vec<Rc<ProperSubtype>>,
}

pub type SemType = ComplexSemType;

pub trait SemTypeOps {
    fn is_empty(&self, ctx: &mut SemTypeContext) -> bool;
    fn intersect(&self, t2: &Rc<SemType>) -> Rc<SemType>;
    fn union(&self, t2: &Rc<SemType>) -> Rc<SemType>;
    fn diff(&self, t2: &Rc<SemType>) -> Rc<SemType>;
    fn complement(&self) -> Rc<SemType>;
    fn is_subtype(&self, t2: &Rc<SemType>, ctx: &mut SemTypeContext) -> bool;
    fn is_same_type(&self, t2: &Rc<SemType>, ctx: &mut SemTypeContext) -> bool;
}

impl SemTypeOps for Rc<SemType> {
    fn is_empty(&self, builder: &mut SemTypeContext) -> bool {
        if self.all != 0 {
            // includes all of one or more basic types
            return false;
        }
        for st in self.subtype_data.iter() {
            if !st.is_empty(builder) {
                return false;
            }
        }
        return true;
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

        let mut iter = SubTypePairIterator {
            i1: 0,
            i2: 0,
            t1: t1.clone(),
            t2: t2.clone(),
            bits: some,
        };

        while let Some((data1, data2)) = iter.next() {
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

        return SemType::new_complex(all, subtypes).into();
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

        let mut iter = SubTypePairIterator {
            i1: 0,
            i2: 0,
            t1: t1.clone(),
            t2: t2.clone(),
            bits: some,
        };

        while let Some((data1, data2)) = iter.next() {
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

        return SemType::new_complex(all, subtypes).into();
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

        let mut iter = SubTypePairIterator {
            i1: 0,
            i2: 0,
            t1: t1.clone(),
            t2: t2.clone(),
            bits: some,
        };

        while let Some((data1, data2)) = iter.next() {
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

        return SemType::new_complex(all, subtypes).into();
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
    pub fn is_never(&self) -> bool {
        self.all == 0 && self.subtype_data.is_empty()
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
        return some;
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
            // todo
            all: 1 << 1 | 1 << 2 | 1 << 3 | 1 << 4 | 1 << 5 | 1 << 6 | 1 << 7 | 1 << 8,
            subtype_data: vec![],
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub enum MemoEmpty {
    True,
    False,
    Undefined,
}

impl MemoEmpty {
    pub fn from_bool(b: bool) -> MemoEmpty {
        if b {
            MemoEmpty::True
        } else {
            MemoEmpty::False
        }
    }
}

#[derive(Clone, Copy, Debug)]
pub struct BddMemoEmptyRef(pub MemoEmpty);

pub enum MaterMemo {
    Mater(Mater),
    Undefined(usize),
}

pub struct SemTypeContext {
    pub mapping_definitions: Vec<Option<Rc<MappingAtomic>>>,
    pub mapping_memo: BTreeMap<Bdd, BddMemoEmptyRef>,

    pub list_definitions: Vec<Option<Rc<ListAtomic>>>,
    pub list_memo: BTreeMap<Bdd, BddMemoEmptyRef>,

    pub json_schema_ref_memo: BTreeMap<String, usize>,

    pub materialize_memo: BTreeMap<Rc<SemType>, MaterMemo>,
}
impl SemTypeContext {
    pub fn get_mapping_atomic(&self, idx: usize) -> Rc<MappingAtomic> {
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
            json_schema_ref_memo: BTreeMap::new(),
            materialize_memo: BTreeMap::new(),
        }
    }
    pub fn number_const(value: NumberRepresentation) -> SemType {
        return SemType::new_complex(
            0x0,
            vec![ProperSubtype::Number {
                allowed: true,
                values: vec![value],
            }
            .into()],
        );
    }

    pub fn string_const(value: StringLitOrFormat) -> SemType {
        return SemType::new_complex(
            0x0,
            vec![ProperSubtype::String {
                allowed: true,
                values: vec![value],
            }
            .into()],
        );
    }
    pub fn mapping_definition_from_idx(idx: usize) -> SemType {
        return SemType::new_complex(
            0x0,
            vec![ProperSubtype::Mapping(Bdd::from_atom(Atom::Mapping(idx)).into()).into()],
        );
    }
    pub fn mapping_definition(&mut self, vs: MappingAtomic) -> SemType {
        let idx = self.mapping_definitions.len();
        self.mapping_definitions.push(Some(vs.clone().into()));

        return Self::mapping_definition_from_idx(idx);
    }
    pub fn list_definition_from_idx(idx: usize) -> SemType {
        return SemType::new_complex(
            0x0,
            vec![ProperSubtype::List(Bdd::from_atom(Atom::List(idx)).into()).into()],
        );
    }
    pub fn list_definition(&mut self, vs: ListAtomic) -> SemType {
        let idx = self.list_definitions.len();
        self.list_definitions.push(Some(vs.clone().into()));

        return Self::list_definition_from_idx(idx);
    }
    pub fn array(&mut self, v: Rc<SemType>) -> SemType {
        let atom = ListAtomic {
            prefix_items: vec![],
            items: v,
        };
        return self.list_definition(atom);
    }
    pub fn tuple(&mut self, prefix_items: Vec<Rc<SemType>>, items: Option<Rc<SemType>>) -> SemType {
        let atom = ListAtomic {
            prefix_items,
            // todo: should be unknown?
            items: items.unwrap_or(Self::never().into()),
        };
        return self.list_definition(atom);
    }
    pub fn boolean_const(value: bool) -> SemType {
        return SemType::new_complex(0x0, vec![ProperSubtype::Boolean(value).into()]);
    }
    pub fn boolean() -> SemType {
        return SemType::new_basic(SubTypeTag::Boolean.code());
    }
    pub fn number() -> SemType {
        return SemType::new_basic(SubTypeTag::Number.code());
    }
    pub fn string() -> SemType {
        return SemType::new_basic(SubTypeTag::String.code());
    }
    pub fn null() -> SemType {
        return SemType::new_basic(SubTypeTag::Null.code());
    }
    pub fn void() -> SemType {
        return SemType::new_basic(SubTypeTag::Void.code());
    }
    pub fn optional(it: Rc<SemType>) -> Rc<SemType> {
        let t2 = Self::void();
        return Rc::new(it).union(&Rc::new(t2));
    }
    pub fn never() -> SemType {
        return SemType::new_never();
    }
    pub fn unknown() -> SemType {
        return SemType::new_unknown();
    }
}

#[derive(Debug, Clone)]
enum TupleAcc {
    Values(Vec<Rc<SemType>>),
    Unknown,
    Never,
}
impl SemTypeContext {
    fn materialize_list_items(
        &self,
        items_ty: &Rc<SemType>,
        left: &Rc<Bdd>,
        middle: &Rc<Bdd>,
        right: &Rc<Bdd>,
    ) -> Rc<SemType> {
        let mut acc = Rc::new(SemType::new_never());

        let left_mater = self.materialize_list_bdd_items(left);
        let ty = left_mater.intersect(&items_ty);
        acc = acc.union(&ty);

        let middle_meter = self.materialize_list_bdd_items(middle);
        acc = acc.union(&middle_meter);

        let right_mater = self.materialize_list_bdd_items(right);
        let not_items_ty = items_ty.complement();
        let ty = not_items_ty.intersect(&right_mater);
        acc = acc.union(&ty);

        acc
    }

    fn materialize_list_bdd_items(&self, bdd: &Rc<Bdd>) -> Rc<SemType> {
        match bdd.as_ref() {
            Bdd::True => Self::unknown().into(),
            Bdd::False => Self::never().into(),
            Bdd::Node {
                atom,
                left,
                middle,
                right,
            } => self.materialize_list_node_items(atom, left, middle, right),
        }
    }

    fn materialize_list_node_items(
        &self,
        atom: &Rc<Atom>,
        left: &Rc<Bdd>,
        middle: &Rc<Bdd>,
        right: &Rc<Bdd>,
    ) -> Rc<SemType> {
        let lt = match atom.as_ref() {
            Atom::List(a) => self.get_list_atomic(*a).clone(),
            _ => unreachable!(),
        };
        let items_ty = &lt.items;
        self.materialize_list_items(items_ty, left, middle, right)
    }

    fn materialize_list_bdd_prefixes(&self, bdd: &Rc<Bdd>) -> TupleAcc {
        match bdd.as_ref() {
            Bdd::True => TupleAcc::Unknown,
            Bdd::False => TupleAcc::Never,
            Bdd::Node {
                atom,
                left,
                middle,
                right,
            } => self.materialize_list_node_prefixes(atom, left, middle, right),
        }
    }
    fn union_list_prefixes(&self, a: &TupleAcc, b: &TupleAcc) -> TupleAcc {
        match (a, b) {
            (TupleAcc::Never, other) | (other, TupleAcc::Never) => other.clone(),
            (TupleAcc::Unknown, _) | (_, TupleAcc::Unknown) => TupleAcc::Unknown,
            (TupleAcc::Values(a), TupleAcc::Values(b)) => {
                let max_len = std::cmp::max(a.len(), b.len());
                let mut acc = vec![];
                for i in 0..max_len {
                    let a_ty = a
                        .get(i)
                        .map(|it| it.clone())
                        .unwrap_or(Self::never().into());
                    let b_ty = b
                        .get(i)
                        .map(|it| it.clone())
                        .unwrap_or(Self::never().into());
                    let ty = a_ty.union(&b_ty);
                    acc.push(ty);
                }

                TupleAcc::Values(acc)
            }
        }
    }

    fn intersect_list_prefixes(&self, a: &TupleAcc, b: &TupleAcc) -> TupleAcc {
        match (a, b) {
            (TupleAcc::Never, _) | (_, TupleAcc::Never) => TupleAcc::Never,
            (TupleAcc::Unknown, other) | (other, TupleAcc::Unknown) => other.clone(),
            (TupleAcc::Values(a), TupleAcc::Values(b)) => {
                let max_len = std::cmp::max(a.len(), b.len());
                let mut acc = vec![];
                for i in 0..max_len {
                    let a_ty = a
                        .get(i)
                        .map(|it| it.clone())
                        .unwrap_or(Self::unknown().into());
                    let b_ty = b
                        .get(i)
                        .map(|it| it.clone())
                        .unwrap_or(Self::unknown().into());
                    let ty = a_ty.intersect(&b_ty);
                    acc.push(ty);
                }

                TupleAcc::Values(acc)
            }
        }
    }

    fn complement_list_prefixes(&self, a: &TupleAcc) -> TupleAcc {
        match a {
            TupleAcc::Values(vs) => TupleAcc::Values(vs.iter().map(|x| x.complement()).collect()),
            TupleAcc::Unknown => TupleAcc::Never,
            TupleAcc::Never => TupleAcc::Unknown,
        }
    }
    fn materialize_list_prefixes(
        &self,
        items_ty: &TupleAcc,
        left: &Rc<Bdd>,
        middle: &Rc<Bdd>,
        right: &Rc<Bdd>,
    ) -> TupleAcc {
        let mut acc = TupleAcc::Never;

        let left_mater = self.materialize_list_bdd_prefixes(left);
        let ty = self.intersect_list_prefixes(&left_mater, items_ty);
        acc = self.union_list_prefixes(&acc, &ty);

        let middle_meter = self.materialize_list_bdd_prefixes(middle);
        acc = self.union_list_prefixes(&acc, &middle_meter);

        let right_mater = self.materialize_list_bdd_prefixes(right);
        let not_items_ty = self.complement_list_prefixes(items_ty);
        let ty = self.intersect_list_prefixes(&not_items_ty, &right_mater);
        acc = self.union_list_prefixes(&acc, &ty);

        acc
    }

    fn materialize_list_node_prefixes(
        &self,
        atom: &Rc<Atom>,
        left: &Rc<Bdd>,
        middle: &Rc<Bdd>,
        right: &Rc<Bdd>,
    ) -> TupleAcc {
        let lt = match atom.as_ref() {
            Atom::List(a) => self.get_list_atomic(*a).clone(),
            _ => unreachable!(),
        };
        let prefix_items = &lt.prefix_items;
        self.materialize_list_prefixes(&TupleAcc::Values(prefix_items.clone()), left, middle, right)
    }
}

#[derive(Clone)]
enum MappingAcc {
    Values(Vec<(String, Rc<SemType>)>),
    Unknown,
    Never,
}

impl SemTypeContext {
    fn intersect_mapping(&self, a: &MappingAcc, b: &MappingAcc) -> MappingAcc {
        match (a, b) {
            (MappingAcc::Never, _) | (_, MappingAcc::Never) => MappingAcc::Never,
            (MappingAcc::Unknown, other) | (other, MappingAcc::Unknown) => other.clone(),
            (MappingAcc::Values(a), MappingAcc::Values(b)) => {
                let mut acc = BTreeMap::new();
                for (k, v) in a.iter() {
                    let v2 = acc
                        .get(k)
                        .map(|it: &Rc<ComplexSemType>| it.clone())
                        .unwrap_or_else(|| Rc::new(Self::unknown()));
                    let ty = v.intersect(&v2);
                    acc.insert(k.clone(), ty);
                }
                for (k, v) in b.iter() {
                    let v2 = acc
                        .get(k)
                        .map(|it: &Rc<ComplexSemType>| it.clone())
                        .unwrap_or_else(|| Rc::new(Self::unknown()));
                    let ty = v.intersect(&v2);
                    acc.insert(k.clone(), ty);
                }
                MappingAcc::Values(acc.into_iter().collect())
            }
        }
    }
    fn union_mapping(&self, a: &MappingAcc, b: &MappingAcc) -> MappingAcc {
        match (a, b) {
            (MappingAcc::Never, other) | (other, MappingAcc::Never) => other.clone(),
            (MappingAcc::Unknown, _) | (_, MappingAcc::Unknown) => MappingAcc::Unknown,
            (MappingAcc::Values(a), MappingAcc::Values(b)) => {
                let mut acc = BTreeMap::new();
                for (k, v) in a.iter() {
                    let v2 = acc
                        .get(k)
                        .map(|it: &Rc<ComplexSemType>| it.clone())
                        .unwrap_or_else(|| Rc::new(Self::never()));
                    let ty = v.union(&v2);
                    acc.insert(k.clone(), ty);
                }
                for (k, v) in b.iter() {
                    let v2 = acc
                        .get(k)
                        .map(|it: &Rc<ComplexSemType>| it.clone())
                        .unwrap_or_else(|| Rc::new(Self::never()));
                    let ty = v.union(&v2);
                    acc.insert(k.clone(), ty);
                }
                MappingAcc::Values(acc.into_iter().collect())
            }
        }
    }
    fn complement_mapping(&self, a: &MappingAcc) -> MappingAcc {
        match a {
            MappingAcc::Values(vs) => MappingAcc::Values(
                vs.iter()
                    .map(|(k, v)| (k.clone(), v.complement()))
                    .collect::<Vec<_>>(),
            ),
            MappingAcc::Unknown => MappingAcc::Never,
            MappingAcc::Never => MappingAcc::Unknown,
        }
    }
    fn materialize_mapping_bdd(&self, bdd: &Rc<Bdd>) -> MappingAcc {
        match bdd.as_ref() {
            Bdd::True => MappingAcc::Unknown,
            Bdd::False => MappingAcc::Never,
            Bdd::Node {
                atom,
                left,
                middle,
                right,
            } => self.materialize_mapping_node(atom, left, middle, right),
        }
    }
    fn materialize_mapping_node_vec(
        &self,
        items_ty: &MappingAcc,
        left: &Rc<Bdd>,
        middle: &Rc<Bdd>,
        right: &Rc<Bdd>,
    ) -> MappingAcc {
        let mut acc = MappingAcc::Never;

        let left_mater = self.materialize_mapping_bdd(left);
        let ty = self.intersect_mapping(&left_mater, items_ty);
        acc = self.union_mapping(&acc, &ty);

        let middle_meter = self.materialize_mapping_bdd(middle);
        acc = self.union_mapping(&acc, &middle_meter);

        let right_mater = self.materialize_mapping_bdd(right);
        let not_items_ty = self.complement_mapping(items_ty);
        let ty = self.intersect_mapping(&not_items_ty, &right_mater);
        acc = self.union_mapping(&acc, &ty);

        acc
    }

    fn materialize_mapping_node(
        &self,
        atom: &Rc<Atom>,
        left: &Rc<Bdd>,
        middle: &Rc<Bdd>,
        right: &Rc<Bdd>,
    ) -> MappingAcc {
        let mt = match atom.as_ref() {
            Atom::Mapping(a) => self.get_mapping_atomic(*a).clone(),
            _ => unreachable!(),
        };
        let mt = MappingAcc::Values(mt.iter().map(|(k, v)| (k.clone(), v.clone())).collect());
        self.materialize_mapping_node_vec(&mt, left, middle, right)
    }
    fn materialize_mapping(&mut self, bdd: &Rc<Bdd>) -> Mater {
        match bdd.as_ref() {
            Bdd::True => todo!(),
            Bdd::False => Mater::Never,
            Bdd::Node {
                atom,
                left,
                middle,
                right,
            } => {
                let acc = self.materialize_mapping_node(atom, left, middle, right);
                match acc {
                    MappingAcc::Values(acc) => {
                        let acc: Vec<(String, Mater)> = acc
                            .into_iter()
                            .map(|(k, v)| (k, self.materialize(&v)))
                            .collect();
                        Mater::Object(BTreeMap::from_iter(acc))
                    }
                    MappingAcc::Unknown => todo!(),
                    MappingAcc::Never => Mater::Never,
                }
            }
        }
    }

    fn materialize_list(&mut self, bdd: &Rc<Bdd>) -> Mater {
        match bdd.as_ref() {
            Bdd::True => todo!(),
            Bdd::False => Mater::Never,
            Bdd::Node {
                atom,
                left,
                middle,
                right,
            } => {
                let ty = self.materialize_list_node_items(atom, left, middle, right);
                let prefixes = self.materialize_list_node_prefixes(atom, left, middle, right);
                match prefixes {
                    TupleAcc::Values(vs) => Mater::Array {
                        items: self.materialize(&ty).into(),
                        prefix_items: vs.iter().map(|x| self.materialize(x)).collect(),
                    },
                    TupleAcc::Unknown => {
                        todo!()
                    }
                    TupleAcc::Never => Mater::Never,
                }
            }
        }
    }

    pub fn materialize(&mut self, ty: &Rc<SemType>) -> Mater {
        if let Some(mater) = self.materialize_memo.get(ty) {
            match mater {
                MaterMemo::Mater(mater) => return mater.clone(),
                MaterMemo::Undefined(d) => {
                    if *d > 0 {
                        return Mater::Recursive;
                    } else {
                        self.materialize_memo
                            .insert(ty.clone(), MaterMemo::Undefined(d + 1));
                    }
                }
            }
        } else {
            self.materialize_memo
                .insert(ty.clone(), MaterMemo::Undefined(0));
        }
        let mater = self.materialize_no_cache(ty);
        self.materialize_memo
            .insert(ty.clone(), MaterMemo::Mater(mater.clone()));
        mater
    }
    fn materialize_no_cache(&mut self, ty: &SemType) -> Mater {
        if ty.all == 0 && ty.subtype_data.is_empty() {
            return Mater::Never;
        }

        for t in SubTypeTag::all() {
            if (ty.all & t.code()) != 0 {
                match t {
                    SubTypeTag::Null => return Mater::Null,
                    SubTypeTag::Boolean => return Mater::Bool,
                    SubTypeTag::Number => return Mater::Number,
                    SubTypeTag::String => return Mater::String,
                    SubTypeTag::Void => return Mater::Void,
                    SubTypeTag::Mapping => unreachable!("we do not allow creation of all mappings"),
                    SubTypeTag::List => unreachable!("we do not allow creation of all arrays"),
                }
            }
        }

        for s in &ty.subtype_data {
            match s.as_ref() {
                ProperSubtype::Boolean(v) => return Mater::BooleanLiteral(*v),
                ProperSubtype::Number { allowed, values } => {
                    if !allowed {
                        return Mater::NumberLiteral(N::parse_int(4773992856));
                    }
                    match values.split_first() {
                        Some((h, _t)) => return Mater::NumberLiteral(h.clone()),
                        None => unreachable!("number values cannot be empty"),
                    }
                }
                ProperSubtype::String { allowed, values } => {
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
                ProperSubtype::Mapping(bdd) => return self.materialize_mapping(bdd),
                ProperSubtype::List(bdd) => return self.materialize_list(bdd),
            }
        }

        unreachable!("should have been materialized")
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
    Bool,
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
    pub fn to_json(&self) -> Json {
        match self {
            Mater::Never => Json::String("~never~".into()),
            Mater::Unknown => todo!(),
            Mater::Void => todo!(),
            Mater::Recursive => Json::String("~recursive~".into()),
            Mater::Null => todo!(),
            Mater::Bool => Json::Bool(true),
            Mater::Number => todo!(),
            Mater::String => Json::String("abc".into()),
            Mater::StringWithFormat(_) => todo!(),
            Mater::StringLiteral(st) => Json::String(st.clone()),
            Mater::NumberLiteral(n) => Json::Number(n.clone()),
            Mater::BooleanLiteral(_) => todo!(),
            Mater::Array {
                items,
                prefix_items,
            } => {
                let mut acc = vec![];
                for item in prefix_items.iter() {
                    acc.push(item.to_json());
                }
                if !items.is_never() {
                    acc.push(items.to_json());
                }
                Json::Array(acc)
            }
            Mater::Object(vs) => {
                let mut acc = BTreeMap::new();
                for (k, v) in vs.iter() {
                    acc.insert(k.clone(), v.to_json());
                }
                Json::Object(acc)
            }
        }
    }
}
