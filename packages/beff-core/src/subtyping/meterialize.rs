use std::{collections::BTreeMap, rc::Rc};

use crate::{
    ast::json::N,
    subtyping::subtype::{ProperSubtype, StringLitOrFormat, SubTypeTag},
};

use super::{
    bdd::{Atom, Bdd},
    semtype::{ComplexSemType, SemType, SemTypeContext, SemTypeOps},
};

#[derive(Debug, Clone)]
pub enum TupleAcc {
    Values(Vec<Rc<SemType>>),
    Unknown,
    Never,
}
#[derive(Clone)]
pub enum MappingAcc {
    Values(Vec<(String, Rc<SemType>)>),
    Unknown,
    Never,
}

pub enum MaterMemo {
    Mater(Mater),
    Undefined,
}

pub struct SemTypeResolverContext<'a>(pub &'a SemTypeContext);

impl<'a> SemTypeResolverContext<'a> {
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
            Bdd::True => SemTypeContext::unknown().into(),
            Bdd::False => SemTypeContext::never().into(),
            Bdd::Node {
                atom,
                left,
                middle,
                right,
            } => self.materialize_list_node_items(atom, left, middle, right),
        }
    }
    pub fn materialize_list_node_items(
        &self,
        atom: &Rc<Atom>,
        left: &Rc<Bdd>,
        middle: &Rc<Bdd>,
        right: &Rc<Bdd>,
    ) -> Rc<SemType> {
        let lt = match atom.as_ref() {
            Atom::List(a) => self.0.get_list_atomic(*a).clone(),
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
                        .unwrap_or(SemTypeContext::never().into());
                    let b_ty = b
                        .get(i)
                        .map(|it| it.clone())
                        .unwrap_or(SemTypeContext::never().into());
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
                        .unwrap_or(SemTypeContext::unknown().into());
                    let b_ty = b
                        .get(i)
                        .map(|it| it.clone())
                        .unwrap_or(SemTypeContext::unknown().into());
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

    pub fn materialize_list_node_prefixes(
        &self,
        atom: &Rc<Atom>,
        left: &Rc<Bdd>,
        middle: &Rc<Bdd>,
        right: &Rc<Bdd>,
    ) -> TupleAcc {
        let lt = match atom.as_ref() {
            Atom::List(a) => self.0.get_list_atomic(*a).clone(),
            _ => unreachable!(),
        };
        let prefix_items = &lt.prefix_items;
        self.materialize_list_prefixes(&TupleAcc::Values(prefix_items.clone()), left, middle, right)
    }

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
                        .unwrap_or_else(|| Rc::new(SemTypeContext::unknown()));
                    let ty = v.intersect(&v2);
                    acc.insert(k.clone(), ty);
                }
                for (k, v) in b.iter() {
                    let v2 = acc
                        .get(k)
                        .map(|it: &Rc<ComplexSemType>| it.clone())
                        .unwrap_or_else(|| Rc::new(SemTypeContext::unknown()));
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
                        .unwrap_or_else(|| Rc::new(SemTypeContext::never()));
                    let ty = v.union(&v2);
                    acc.insert(k.clone(), ty);
                }
                for (k, v) in b.iter() {
                    let v2 = acc
                        .get(k)
                        .map(|it: &Rc<ComplexSemType>| it.clone())
                        .unwrap_or_else(|| Rc::new(SemTypeContext::never()));
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
    fn materialize_mapping_node_acc(
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

    pub fn materialize_mapping_node(
        &self,
        atom: &Rc<Atom>,
        left: &Rc<Bdd>,
        middle: &Rc<Bdd>,
        right: &Rc<Bdd>,
    ) -> MappingAcc {
        let mt = match atom.as_ref() {
            Atom::Mapping(a) => self.0.get_mapping_atomic(*a).clone(),
            _ => unreachable!(),
        };
        let mt = MappingAcc::Values(mt.iter().map(|(k, v)| (k.clone(), v.clone())).collect());
        self.materialize_mapping_node_acc(&mt, left, middle, right)
    }
}
pub struct MaterializationContext<'a> {
    ctx: SemTypeResolverContext<'a>,

    pub materialize_memo: BTreeMap<Rc<SemType>, MaterMemo>,
}
impl<'a> MaterializationContext<'a> {
    pub fn new(ctx: &'a SemTypeContext) -> Self {
        Self {
            ctx: SemTypeResolverContext(ctx),
            materialize_memo: BTreeMap::new(),
        }
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
                let acc = self.ctx.materialize_mapping_node(atom, left, middle, right);
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
                let ty = self
                    .ctx
                    .materialize_list_node_items(atom, left, middle, right);
                let prefixes = self
                    .ctx
                    .materialize_list_node_prefixes(atom, left, middle, right);
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
                MaterMemo::Undefined => {
                    return Mater::Recursive;
                }
            }
        } else {
            self.materialize_memo
                .insert(ty.clone(), MaterMemo::Undefined);
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

        for s in &ty.subtype_data {
            match s.as_ref() {
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
                ProperSubtype::Number { allowed, values } => {
                    if !allowed {
                        return Mater::NumberLiteral(N::parse_int(4773992856));
                    }
                    match values.split_first() {
                        Some((h, _t)) => return Mater::NumberLiteral(h.clone()),
                        None => unreachable!("number values cannot be empty"),
                    }
                }
                ProperSubtype::Boolean(v) => return Mater::BooleanLiteral(*v),
                ProperSubtype::Mapping(bdd) => return self.materialize_mapping(bdd),
                ProperSubtype::List(bdd) => return self.materialize_list(bdd),
            }
        }

        for t in SubTypeTag::all() {
            if (ty.all & t.code()) != 0 {
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
