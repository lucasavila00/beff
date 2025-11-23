use std::{
    cmp::Ordering,
    collections::{BTreeMap, BTreeSet},
    rc::Rc,
};

use anyhow::bail;

use crate::{
    ast::{
        json::N,
        runtype::{CustomFormat, TplLitType, TplLitTypeItem},
    },
    subtyping::{semtype::SemTypeContext, subtype::NumberRepresentationOrFormat},
};

use super::{
    evidence::{
        Evidence, EvidenceResult, ListEvidence, ProperSubtypeEvidence, ProperSubtypeEvidenceResult,
    },
    semtype::{BddMemoEmptyRef, MappingAtomicType, MemoEmpty, SemType, SemTypeOps},
    subtype::{ProperSubtype, StringLitOrFormat, SubType, SubTypeTag},
};

pub type MappingAtomic = BTreeMap<String, Rc<SemType>>;

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd, Clone)]
pub struct ListAtomic {
    pub prefix_items: Vec<Rc<SemType>>,
    pub items: Rc<SemType>,
}

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd)]
pub enum Atom {
    Mapping(usize),
    List(usize),
}

fn atom_cmp(a: &Atom, b: &Atom) -> Ordering {
    a.cmp(b)
}

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd, Clone)]
pub enum Bdd {
    True,
    False,
    Node {
        atom: Rc<Atom>,
        left: Rc<Bdd>,
        middle: Rc<Bdd>,
        right: Rc<Bdd>,
    },
}

impl Bdd {
    pub fn from_atom(atom: Atom) -> Bdd {
        Bdd::Node {
            atom: atom.into(),
            left: Bdd::True.into(),
            middle: Bdd::False.into(),
            right: Bdd::False.into(),
        }
    }

    pub fn from_node(atom: Rc<Atom>, left: Rc<Bdd>, middle: Rc<Bdd>, right: Rc<Bdd>) -> Rc<Bdd> {
        if *middle == Bdd::True {
            return Bdd::True.into();
        }
        if left == right {
            return left.union(&middle);
        }
        Rc::new(Bdd::Node {
            atom,
            left,
            middle,
            right,
        })
    }
}

pub trait BddOps {
    fn intersect(&self, b2: &Rc<Bdd>) -> Rc<Bdd>;
    fn union(&self, b2: &Rc<Bdd>) -> Rc<Bdd>;
    fn diff(&self, b2: &Rc<Bdd>) -> Rc<Bdd>;
    fn complement(&self) -> Rc<Bdd>;
}

impl BddOps for Rc<Bdd> {
    fn intersect(&self, b2: &Rc<Bdd>) -> Rc<Bdd> {
        let b1 = self;

        if *b1 == *b2 {
            return self.clone();
        }

        match (&**b1, &**b2) {
            (Bdd::True, _) => b2.clone(),
            (Bdd::False, _) => Bdd::False.into(),
            (_, Bdd::True) => b1.clone(),
            (_, Bdd::False) => Bdd::False.into(),
            (
                Bdd::Node {
                    atom: b1_atom,
                    left: b1_left,
                    middle: b1_middle,
                    right: b1_right,
                },
                Bdd::Node {
                    atom: b2_atom,
                    left: b2_left,
                    middle: b2_middle,
                    right: b2_right,
                },
            ) => match atom_cmp(b1_atom, b2_atom) {
                Ordering::Less => Bdd::from_node(
                    b1_atom.clone(),
                    b1_left.intersect(b2),
                    b1_middle.intersect(b2),
                    b1_right.intersect(b2),
                ),
                Ordering::Greater => Bdd::from_node(
                    b2_atom.clone(),
                    b1.intersect(b2_left),
                    b1.intersect(b2_middle),
                    b1.intersect(b2_right),
                ),
                Ordering::Equal => Bdd::from_node(
                    b1_atom.clone(),
                    b1_left
                        .union(b1_middle)
                        .intersect(&b2_left.union(b2_middle)),
                    Bdd::False.into(),
                    b1_right
                        .union(b1_middle)
                        .intersect(&b2_right.union(b2_middle)),
                ),
            },
        }
    }

    fn union(&self, b2: &Rc<Bdd>) -> Rc<Bdd> {
        let b1 = self;
        if **b1 == **b2 {
            return self.clone();
        }

        match (&**b1, &**b2) {
            (Bdd::True, _) => Bdd::True.into(),
            (Bdd::False, _) => b2.clone(),
            (_, Bdd::True) => Bdd::True.into(),
            (_, Bdd::False) => b1.clone(),
            (
                Bdd::Node {
                    atom: b1_atom,
                    left: b1_left,
                    middle: b1_middle,
                    right: b1_right,
                },
                Bdd::Node {
                    atom: b2_atom,
                    left: b2_left,
                    middle: b2_middle,
                    right: b2_right,
                },
            ) => match atom_cmp(b1_atom, b2_atom) {
                Ordering::Less => Bdd::from_node(
                    b1_atom.clone(),
                    b1_left.clone(),
                    b1_middle.union(b2),
                    b1_right.clone(),
                ),
                Ordering::Greater => Bdd::from_node(
                    b2_atom.clone(),
                    b2_left.clone(),
                    b1.union(b2_middle),
                    b2_right.clone(),
                ),
                Ordering::Equal => Bdd::from_node(
                    b1_atom.clone(),
                    b1_left.union(b2_left),
                    b1_middle.union(b2_middle),
                    b1_right.union(b2_right),
                ),
            },
        }
    }

    fn diff(&self, b2: &Rc<Bdd>) -> Rc<Bdd> {
        let b1 = self;
        if *b1 == *b2 {
            return Bdd::False.into();
        }

        match (&**b1, &**b2) {
            (_, Bdd::True) => Bdd::False.into(),
            (_, Bdd::False) => b1.clone(),
            (Bdd::True, _) => b2.complement(),
            (Bdd::False, _) => Bdd::False.into(),
            (
                Bdd::Node {
                    atom: b1_atom,
                    left: b1_left,
                    middle: b1_middle,
                    right: b1_right,
                },
                Bdd::Node {
                    atom: b2_atom,
                    left: b2_left,
                    middle: b2_middle,
                    right: b2_right,
                },
            ) => match atom_cmp(b1_atom, b2_atom) {
                Ordering::Less => Bdd::from_node(
                    b1_atom.clone(),
                    b1_left.union(b1_middle).diff(b2),
                    Bdd::False.into(),
                    b1_right.union(b1_middle).diff(b2),
                ),
                Ordering::Greater => Bdd::from_node(
                    b2_atom.clone(),
                    b1.diff(&b2_left.union(b2_middle)),
                    Bdd::False.into(),
                    b1.diff(&b2_right.union(b2_middle)),
                ),
                Ordering::Equal => Bdd::from_node(
                    b1_atom.clone(),
                    b1_left.union(b1_middle).diff(&b2_left.union(b2_middle)),
                    Bdd::False.into(),
                    b1_right.union(b1_middle).diff(&b2_right.union(b2_middle)),
                ),
            },
        }
    }

    fn complement(&self) -> Rc<Bdd> {
        match &**self {
            Bdd::True => Bdd::False.into(),
            Bdd::False => Bdd::True.into(),
            Bdd::Node {
                atom,
                left,
                middle,
                right,
            } => {
                if **right == Bdd::False {
                    return Bdd::from_node(
                        atom.clone(),
                        Bdd::False.into(),
                        left.union(middle).complement(),
                        middle.complement(),
                    );
                } else if **left == Bdd::False {
                    return Bdd::from_node(
                        atom.clone(),
                        middle.complement(),
                        right.union(middle).complement(),
                        Bdd::False.into(),
                    );
                } else if **middle == Bdd::False {
                    return Bdd::from_node(
                        atom.clone(),
                        left.complement(),
                        left.union(right).complement(),
                        right.complement(),
                    );
                }
                Bdd::from_node(
                    atom.clone(),
                    left.union(middle).complement(),
                    Bdd::False.into(),
                    right.union(middle).complement(),
                )
            }
        }
    }
}

#[derive(Debug)]
struct Conjunction {
    atom: Rc<Atom>,
    next: Option<Rc<Conjunction>>,
}
fn and(atom: Rc<Atom>, next: Option<Rc<Conjunction>>) -> Option<Rc<Conjunction>> {
    Some(Rc::new(Conjunction { atom, next }))
}

// type BddPredicate function(TypeCheckContext tc, Conjunction? pos, Conjunction? neg) returns boolean;

type BddPredicate = fn(
    pos: &Option<Rc<Conjunction>>,
    neg: &Option<Rc<Conjunction>>,
    builder: &mut SemTypeContext,
) -> ProperSubtypeEvidenceResult;

fn and_evidence(
    a: ProperSubtypeEvidenceResult,
    b: ProperSubtypeEvidenceResult,
) -> ProperSubtypeEvidenceResult {
    match (&a, b) {
        // short circuit "false"
        (ProperSubtypeEvidenceResult::Evidence(_), _) => a,

        // true and next == next
        (ProperSubtypeEvidenceResult::IsEmpty, next) => next,
    }
}

// A Bdd represents a disjunction of conjunctions of atoms, where each atom is either positive or
// negative (negated). Each path from the root to a leaf that is true represents one of the conjunctions
// We walk the tree, accumulating the positive and negative conjunctions for a path as we go.
// When we get to a leaf that is true, we apply the predicate to the accumulated conjunctions.
fn bdd_every(
    bdd: &Rc<Bdd>,
    pos: &Option<Rc<Conjunction>>,
    neg: &Option<Rc<Conjunction>>,
    predicate: BddPredicate,
    builder: &mut SemTypeContext,
) -> ProperSubtypeEvidenceResult {
    match &**bdd {
        Bdd::False => ProperSubtypeEvidenceResult::IsEmpty,
        Bdd::True => predicate(pos, neg, builder),
        Bdd::Node {
            atom,
            left,
            middle,
            right,
        } => and_evidence(
            bdd_every(
                right,
                pos,
                &and(atom.clone(), neg.clone()),
                predicate,
                builder,
            ),
            and_evidence(
                bdd_every(middle, pos, neg, predicate, builder),
                bdd_every(
                    left,
                    &and(atom.clone(), pos.clone()),
                    neg,
                    predicate,
                    builder,
                ),
            ),
        ),
    }
}
fn intersect_mapping(m1: Rc<MappingAtomic>, m2: Rc<MappingAtomic>) -> Option<Rc<MappingAtomic>> {
    let m1_names = BTreeSet::from_iter(m1.keys());
    let m2_names = BTreeSet::from_iter(m2.keys());
    let all_names = m1_names.union(&m2_names).collect::<BTreeSet<_>>();
    let mut acc = vec![];
    for name in all_names {
        let type1 = m1
            .get(*name)
            .cloned()
            .unwrap_or_else(|| Rc::new(SemTypeContext::unknown()));
        let type2 = m2
            .get(*name)
            .cloned()
            .unwrap_or_else(|| Rc::new(SemTypeContext::unknown()));
        let t = type1.intersect(&type2);
        if t.is_never() {
            return None;
        }
        acc.push((name.to_string(), t))
    }
    Some(Rc::new(MappingAtomic::from_iter(acc)))
}

enum MappingInhabited {
    Yes(Rc<MappingAtomic>),
    No,
}

fn mapping_inhabited(
    pos: Rc<MappingAtomic>,
    neg_list: &Option<Rc<Conjunction>>,
    builder: &mut SemTypeContext,
) -> MappingInhabited {
    match neg_list {
        None => MappingInhabited::Yes(pos.clone()),
        Some(neg_list) => {
            let neg = match &*neg_list.atom {
                Atom::Mapping(a) => builder.get_mapping_atomic(*a),
                _ => unreachable!(),
            };

            // TODO: fixme, add rest support
            let neg = &neg.vs;

            let pos_names = BTreeSet::from_iter(pos.keys());
            let neg_names = BTreeSet::from_iter(neg.keys());

            let all_names = pos_names.union(&neg_names).collect::<BTreeSet<_>>();

            for name in all_names.iter() {
                let pos_type = pos
                    .get(**name)
                    .cloned()
                    .unwrap_or_else(|| Rc::new(SemTypeContext::unknown()));
                let neg_type = neg
                    .get(**name)
                    .cloned()
                    .unwrap_or_else(|| Rc::new(SemTypeContext::unknown()));
                if pos_type.is_never() || neg_type.is_never() {
                    return mapping_inhabited(pos, &neg_list.next, builder);
                }
            }
            for name in all_names {
                let pos_type = pos
                    .get(*name)
                    .cloned()
                    .unwrap_or_else(|| Rc::new(SemTypeContext::unknown()));
                let neg_type = neg
                    .get(*name)
                    .cloned()
                    .unwrap_or_else(|| Rc::new(SemTypeContext::unknown()));

                let d = pos_type.diff(&neg_type);
                if !d.is_empty(builder) {
                    let mut mt = pos.as_ref().clone();
                    mt.insert(name.to_string(), d);
                    if let MappingInhabited::Yes(a) =
                        mapping_inhabited(Rc::new(mt), &neg_list.next, builder)
                    {
                        return MappingInhabited::Yes(a);
                    }
                }
            }

            MappingInhabited::No
        }
    }
}

fn mapping_formula_is_empty(
    pos_list: &Option<Rc<Conjunction>>,
    neg_list: &Option<Rc<Conjunction>>,
    builder: &mut SemTypeContext,
) -> ProperSubtypeEvidenceResult {
    let mut combined: Rc<MappingAtomic> = Rc::new(BTreeMap::new());
    match pos_list {
        None => {}
        Some(pos_atom) => {
            match pos_atom.atom.as_ref() {
                // TODO: fixme, add rest support
                Atom::Mapping(a) => combined = builder.get_mapping_atomic(*a).vs.clone(),
                _ => unreachable!(),
            };
            let mut p = pos_atom.next.clone();
            while let Some(ref some_p) = p {
                let p_atom = match &*some_p.atom {
                    Atom::Mapping(a) => builder.get_mapping_atomic(*a),
                    _ => unreachable!(),
                };
                // TODO: fixme, add rest support
                let m = intersect_mapping(combined.clone(), p_atom.vs.clone());
                match m {
                    None => return ProperSubtypeEvidenceResult::IsEmpty,
                    Some(m) => combined = m,
                }
                p.clone_from(&some_p.next.clone());
            }
            for t in combined.values() {
                if let EvidenceResult::IsEmpty = t.is_empty_evidence(builder) {
                    return ProperSubtypeEvidenceResult::IsEmpty;
                }
            }
        }
    }
    match mapping_inhabited(combined.clone(), neg_list, builder) {
        MappingInhabited::No => ProperSubtypeEvidenceResult::IsEmpty,
        MappingInhabited::Yes(ev) => {
            let ev2 = ev
                .iter()
                .map(|(k, it)| match it.is_empty_evidence(builder) {
                    EvidenceResult::Evidence(e) => (k.clone(), Rc::new(e)),
                    EvidenceResult::IsEmpty => {
                        unreachable!("mapping_inhabited should have returned false")
                    }
                })
                .collect::<Vec<_>>();

            ProperSubtypeEvidence::Mapping(BTreeMap::from_iter(ev2).into()).to_result()
        }
    }
}

pub fn mapping_is_empty(
    bdd: &Rc<Bdd>,
    builder: &mut SemTypeContext,
) -> ProperSubtypeEvidenceResult {
    match builder.mapping_memo.get(bdd) {
        Some(mm) => match &mm.0 {
            MemoEmpty::True => return ProperSubtypeEvidenceResult::IsEmpty,
            MemoEmpty::False(ev) => return ev.clone(),
            MemoEmpty::Undefined => {
                // we got a loop
                return ProperSubtypeEvidenceResult::IsEmpty;
            }
        },
        None => {
            builder
                .mapping_memo
                .insert((**bdd).clone(), BddMemoEmptyRef(MemoEmpty::Undefined));
        }
    }

    let is_empty = bdd_every(bdd, &None, &None, mapping_formula_is_empty, builder);
    builder
        .mapping_memo
        .get_mut(bdd)
        .expect("bdd should be cached by now")
        .0 = MemoEmpty::from_bool(&is_empty);
    is_empty
}
enum ListInhabited {
    Yes(Option<Rc<Evidence>>, Vec<Rc<SemType>>),
    No,
}
// This function returns true if there is a list shape v such that
// is in the type described by `members` and `rest`, and
// for each tuple t in `neg`, v is not in t.
// `neg` represents a set of negated list types.
// Precondition is that each of `members` is not empty.
// This is formula Phi' in section 7.3.1 of Alain Frisch's PhD thesis,
// generalized to tuples of arbitrary length.
fn list_inhabited(
    prefix_items: &mut Vec<Rc<SemType>>,
    items: &Rc<SemType>,
    neg: &Option<Rc<Conjunction>>,
    builder: &mut SemTypeContext,
) -> ListInhabited {
    match neg {
        None => ListInhabited::Yes(None, prefix_items.clone()),
        Some(neg) => {
            let mut len = prefix_items.len();
            let nt = match &*neg.atom {
                Atom::List(a) => builder.get_list_atomic(*a),
                _ => unreachable!(),
            };
            let neg_len = nt.prefix_items.len();
            if len < neg_len {
                if items.is_never() {
                    return list_inhabited(prefix_items, items, &neg.next, builder);
                }
                for _i in len..neg_len {
                    prefix_items.push(items.clone());
                }
                len = neg_len;
            } else if neg_len < len && nt.items.is_never() {
                return list_inhabited(prefix_items, items, &neg.next, builder);
            }

            // now we have nt.members.length() <= len

            // This is the heart of the algorithm.
            // For [v0, v1] not to be in [t0,t1], there are two possibilities
            // (1) v0 is not in t0, or
            // (2) v1 is not in t1
            // Case (1)
            // For v0 to be in s0 but not t0, d0 must not be empty.
            // We must then find a [v0,v1] satisfying the remaining negated tuples,
            // such that v0 is in d0.
            // SemType d0 = diff(s[0], t[0]);
            // if !isEmpty(tc, d0) && tupleInhabited(tc, [d0, s[1]], neg.rest) {
            //     return true;
            // }
            // Case (2)
            // For v1 to be in s1 but not t1, d1 must not be empty.
            // We must then find a [v0,v1] satisfying the remaining negated tuples,
            // such that v1 is in d1.
            // SemType d1 = diff(s[1], t[1]);
            // return !isEmpty(tc, d1) &&  tupleInhabited(tc, [s[0], d1], neg.rest);
            // We can generalize this to tuples of arbitrary length.

            for i in 0..len {
                let ntm = if i < neg_len {
                    nt.prefix_items[i].clone()
                } else {
                    nt.items.clone()
                };
                let d = prefix_items[i].diff(&ntm);
                if !d.is_empty(builder) {
                    let mut s = prefix_items.clone();
                    s[i] = d;
                    if let ListInhabited::Yes(a, _b) =
                        list_inhabited(&mut s, items, &neg.next, builder)
                    {
                        return ListInhabited::Yes(a, s.clone());
                    }
                }
            }

            let diff = items.diff(&nt.items);
            if let EvidenceResult::Evidence(e) = diff.is_empty_evidence(builder) {
                return ListInhabited::Yes(Some(e.into()), prefix_items.clone());
            }

            // This is correct for length 0, because we know that the length of the
            // negative is 0, and [] - [] is empty.
            ListInhabited::No
        }
    }
}

fn list_formula_is_empty(
    pos: &Option<Rc<Conjunction>>,
    neg: &Option<Rc<Conjunction>>,
    builder: &mut SemTypeContext,
) -> ProperSubtypeEvidenceResult {
    let mut prefix_items = vec![];
    let mut items = Rc::new(SemTypeContext::unknown());

    match pos {
        None => {}
        Some(pos_atom) => {
            // combine all the positive tuples using intersection
            let lt = match pos_atom.atom.as_ref() {
                Atom::List(a) => builder.get_list_atomic(*a).clone(),
                _ => unreachable!(),
            };
            prefix_items.clone_from(&lt.prefix_items);
            items = lt.items.clone();

            let mut p = pos_atom.next.clone();

            while let Some(ref some_p) = p {
                let d = &some_p.atom;
                let lt = match d.as_ref() {
                    Atom::List(a) => builder.get_list_atomic(*a).clone(),
                    _ => unreachable!(),
                };
                let new_len = std::cmp::max(prefix_items.len(), lt.prefix_items.len());
                if prefix_items.len() < new_len {
                    if lt.items.is_never() {
                        return ProperSubtypeEvidenceResult::IsEmpty;
                    }
                    for _i in prefix_items.len()..new_len {
                        prefix_items.push(lt.items.clone());
                    }
                }
                for i in 0..lt.prefix_items.len() {
                    prefix_items[i] = prefix_items[i].intersect(&lt.prefix_items[i]);
                }
                if lt.prefix_items.len() < new_len {
                    if lt.items.is_never() {
                        return ProperSubtypeEvidenceResult::IsEmpty;
                    }
                    for i in lt.prefix_items.len()..new_len {
                        prefix_items[i] = prefix_items[i].intersect(&lt.items);
                    }
                }
                items = items.intersect(&lt.items);
                p.clone_from(&some_p.next.clone());
            }

            for m in prefix_items.iter() {
                if let EvidenceResult::IsEmpty = m.is_empty_evidence(builder) {
                    return ProperSubtypeEvidenceResult::IsEmpty;
                }
            }
        }
    }
    match list_inhabited(&mut prefix_items, &items, neg, builder) {
        ListInhabited::Yes(e, prefix) => {
            let prefix2 = prefix
                .into_iter()
                .map(|it| match it.is_empty_evidence(builder) {
                    EvidenceResult::Evidence(e) => Rc::new(e),
                    EvidenceResult::IsEmpty => {
                        unreachable!("list_inhabited should have returned false")
                    }
                })
                .collect::<Vec<_>>();
            let list_evidence = ListEvidence {
                prefix_items: prefix2,
                items: e,
            };
            ProperSubtypeEvidence::List(Rc::new(list_evidence)).to_result()
        }

        ListInhabited::No => ProperSubtypeEvidenceResult::IsEmpty,
    }
}
pub fn list_is_empty(bdd: &Rc<Bdd>, builder: &mut SemTypeContext) -> ProperSubtypeEvidenceResult {
    match builder.list_memo.get(bdd) {
        Some(mm) => match &mm.0 {
            MemoEmpty::True => return ProperSubtypeEvidenceResult::IsEmpty,
            MemoEmpty::False(ev) => return ev.clone(),
            MemoEmpty::Undefined => {
                // we got a loop
                return ProperSubtypeEvidenceResult::IsEmpty;
            }
        },
        None => {
            builder
                .list_memo
                .insert((**bdd).clone(), BddMemoEmptyRef(MemoEmpty::Undefined));
        }
    }

    let is_empty = bdd_every(bdd, &None, &None, list_formula_is_empty, builder);
    builder
        .list_memo
        .get_mut(bdd)
        .expect("bdd should be cached by now")
        .0 = MemoEmpty::from_bool(&is_empty);
    is_empty
}

pub fn bdd_mapping_member_type_inner(
    ctx: &SemTypeContext,
    b: Rc<Bdd>,
    key: MappingStrKey,
    accum: Rc<SemType>,
) -> anyhow::Result<Rc<SemType>> {
    match b.as_ref() {
        Bdd::True => Ok(accum),
        Bdd::False => Ok(SemTypeContext::never().into()),
        Bdd::Node {
            atom,
            left,
            middle,
            right,
        } => {
            let b_atom_type = match atom.as_ref() {
                Atom::Mapping(a) => ctx.get_mapping_atomic(*a),
                _ => unreachable!(),
            };
            let a = mapping_member_type_inner(b_atom_type.clone(), key.clone())?;
            let a = a.intersect(&accum);
            let a = bdd_mapping_member_type_inner(ctx, left.clone(), key.clone(), a.clone())?;

            let b = bdd_mapping_member_type_inner(ctx, middle.clone(), key.clone(), accum.clone())?;
            let c = bdd_mapping_member_type_inner(ctx, right.clone(), key, accum.clone())?;

            Ok(a.union(&b.union(&c)))
        }
    }
}

#[derive(Debug, Clone)]
pub enum MappingStrKey {
    Str { allowed: bool, values: Vec<String> },
    True,
}

fn mapping_atomic_applicable_member_types_inner(
    atomic: Rc<MappingAtomicType>,
    key: MappingStrKey,
) -> anyhow::Result<Vec<Rc<SemType>>> {
    match key {
        MappingStrKey::Str { allowed, values } => {
            if !allowed {
                return Ok(vec![]);
            }
            let mut member_types = vec![];
            for (k, ty) in atomic.vs.iter() {
                let mut found = false;

                for l in &values {
                    if l == k {
                        found = true;
                        break;
                    }
                }

                if found {
                    member_types.push(ty.clone());
                }
            }

            let is_subtype = member_types.len() == atomic.vs.len();
            if !is_subtype {
                for v in &atomic.indexed_properties {
                    if v.key.is_all_strings() {
                        member_types.push(v.value.clone());
                    }
                }
            }

            Ok(member_types)
        }
        MappingStrKey::True => {
            let mut vs: Vec<Rc<SemType>> = atomic.vs.values().cloned().collect();

            for v in &atomic.indexed_properties {
                if v.key.is_all_strings() {
                    vs.push(v.value.clone());
                }
            }
            Ok(vs)
        }
    }
}

fn mapping_member_type_inner(
    atomic: Rc<MappingAtomicType>,
    key: MappingStrKey,
) -> anyhow::Result<Rc<SemType>> {
    let mut member_type: Option<Rc<SemType>> = None;

    for ty in mapping_atomic_applicable_member_types_inner(atomic, key)? {
        match member_type {
            Some(mt) => {
                member_type = Some(mt.union(&ty));
            }
            None => {
                member_type = Some(ty);
            }
        }
    }

    match member_type {
        Some(it) => Ok(it),
        None => Ok(SemTypeContext::void().into()),
    }
}

fn bdd_mapped_record_member_type_inner_val(
    ctx: &mut SemTypeContext,
    b: Rc<Bdd>,
    idx_st: Rc<SemType>,
    accum: Rc<SemType>,
) -> Rc<SemType> {
    match b.as_ref() {
        Bdd::True => accum,
        Bdd::False => SemTypeContext::never().into(),
        Bdd::Node {
            atom,
            left,
            middle,
            right,
        } => {
            let b_atom_type = match atom.as_ref() {
                Atom::Mapping(a) => ctx.get_mapping_atomic(*a),
                _ => unreachable!(),
            };
            let mut found = None;
            for p in &b_atom_type.indexed_properties {
                let key_is_subtype = idx_st.is_subtype(&p.key, ctx);
                if key_is_subtype {
                    found = Some(p);
                    break;
                }
            }
            // if the key type does not intersect the key, then skip this branch
            let a = match found {
                None => {
                    return SemTypeContext::never().into();
                }
                Some(p) => p.value.clone(),
            };
            let a = a.intersect(&accum);
            let a = bdd_mapped_record_member_type_inner_val(ctx, left.clone(), idx_st.clone(), a);

            let b = bdd_mapped_record_member_type_inner_val(
                ctx,
                middle.clone(),
                idx_st.clone(),
                accum.clone(),
            );
            let c = bdd_mapped_record_member_type_inner_val(
                ctx,
                right.clone(),
                idx_st.clone(),
                accum.clone(),
            );

            a.union(&b.union(&c))
        }
    }
}

// This computes the spec operation called "member type of K in T",
// for when T is a subtype of mapping, and K is either `string` or a singleton string.
// This is what Castagna calls projection.
pub fn mapping_indexed_access(
    ctx: &mut SemTypeContext,
    obj_st: Rc<SemType>,
    idx_st: Rc<SemType>,
) -> anyhow::Result<Rc<SemType>> {
    //     if t is BasicTypeBitSet {
    //         return (t & MAPPING) != 0 ? VAL : UNDEF;
    //     }

    let b = SemTypeContext::sub_type_data(obj_st, SubTypeTag::Mapping);
    match b {
        SubType::False(_) => Ok(SemTypeContext::never().into()),
        SubType::True(_) => {
            bail!("not a mapping - true")
        }
        SubType::Proper(p) => {
            let bdd = match p.as_ref() {
                ProperSubtype::Mapping(bdd) => bdd,
                _ => {
                    bail!("not a mapping - proper")
                }
            };
            let idx_clone = idx_st.clone();
            let string_key: Option<MappingStrKey> = match SemTypeContext::string_sub_type(idx_st) {
                SubType::False(_) => None,
                SubType::True(_) => Some(MappingStrKey::True),
                SubType::Proper(proper) => match proper.as_ref() {
                    ProperSubtype::String { allowed, values } => {
                        let mut consts = vec![];
                        let mut all_string_const = true;
                        for v in values {
                            match v {
                                StringLitOrFormat::Format(_custom_format) => {
                                    all_string_const = false;
                                }
                                StringLitOrFormat::Tpl(tpl_lit_type) => {
                                    match tpl_lit_type.0.as_slice() {
                                        [TplLitTypeItem::StringConst(s)] => {
                                            consts.push(s.clone());
                                        }
                                        _ => {
                                            all_string_const = false;
                                        }
                                    }
                                }
                            }
                        }
                        if all_string_const {
                            Some(MappingStrKey::Str {
                                allowed: *allowed,
                                values: consts,
                            })
                        } else {
                            None
                        }
                    }
                    _ => unreachable!("should be string"),
                },
            };
            match string_key {
                Some(sk) => bdd_mapping_member_type_inner(
                    ctx,
                    bdd.clone(),
                    sk,
                    SemTypeContext::unknown().into(),
                ),
                None => Ok(bdd_mapped_record_member_type_inner_val(
                    ctx,
                    bdd.clone(),
                    idx_clone,
                    SemTypeContext::unknown().into(),
                )),
            }
        }
    }
}

#[derive(Debug, Clone)]
pub enum ListNumberKey {
    N { allowed: bool, values: Vec<N> },
    True,
}

fn int_subtype_contains(allowed: bool, values: &Vec<N>, it: usize) -> bool {
    if !allowed {
        for v in values {
            let i = v.to_f64() as i64;
            if i == (it as i64) {
                return false;
            }
        }
        return true;
    }
    for v in values {
        let i = v.to_f64() as i64;
        if i == (it as i64) {
            return true;
        }
    }
    false
}
fn int_subtype_max(allowed: bool, values: &Vec<N>) -> i64 {
    if !allowed {
        return -1;
    }
    let mut max = -1;
    for it in values {
        let i = it.to_f64() as i64;
        if i > max {
            max = i;
        }
    }
    max
}

fn list_atomic_member_type_at_inner(
    prefix_items: &[Rc<SemType>],
    items: &Rc<SemType>,
    key: ListNumberKey,
) -> Rc<SemType> {
    match key {
        ListNumberKey::N { allowed, values } => {
            let mut m = Rc::new(SemTypeContext::never());
            let init_len = prefix_items.len();

            if init_len > 0 {
                for (i, v) in prefix_items.iter().enumerate() {
                    if int_subtype_contains(allowed, &values, i) {
                        m = m.union(v);
                    }
                }
            }
            if init_len == 0 || int_subtype_max(allowed, &values) > (init_len as i64) - 1 {
                m = m.union(items);
            }
            m
        }
        ListNumberKey::True => {
            let mut m = items.clone();
            for it in prefix_items.iter() {
                m = m.union(it);
            }
            m
        }
    }
}

fn list_atomic_member_type_inner(atomic: Rc<ListAtomic>, key: ListNumberKey) -> Rc<SemType> {
    list_atomic_member_type_at_inner(&atomic.prefix_items, &atomic.items, key)
}

fn list_member_type_inner_val(atomic: Rc<ListAtomic>, key: ListNumberKey) -> Rc<SemType> {
    let a = list_atomic_member_type_inner(atomic, key);
    a.diff(&Rc::new(SemTypeContext::void()))
}

fn bdd_list_member_type_inner_val(
    ctx: &SemTypeContext,
    b: Rc<Bdd>,
    key: ListNumberKey,
    accum: Rc<SemType>,
) -> Rc<SemType> {
    match b.as_ref() {
        Bdd::True => accum,
        Bdd::False => SemTypeContext::never().into(),
        Bdd::Node {
            atom,
            left,
            middle,
            right,
        } => {
            let b_atom_type = match atom.as_ref() {
                Atom::List(a) => ctx.get_list_atomic(*a),
                _ => unreachable!(),
            };
            let a = list_member_type_inner_val(b_atom_type, key.clone());
            let a = a.intersect(&accum);
            let a = bdd_list_member_type_inner_val(ctx, left.clone(), key.clone(), a.clone());

            let b = bdd_list_member_type_inner_val(ctx, middle.clone(), key.clone(), accum.clone());
            let c = bdd_list_member_type_inner_val(ctx, right.clone(), key, accum.clone());

            a.union(&b.union(&c))
        }
    }
}

// This computes the spec operation called "member type of K in T",
// for the case when T is a subtype of list, and K is either `int` or a singleton int.
// This is what Castagna calls projection.
// We will extend this to allow `key` to be a SemType, which will turn into an IntSubtype.
// If `t` is not a list, NEVER is returned
pub fn list_indexed_access(
    ctx: &SemTypeContext,
    obj_st: Rc<SemType>,
    idx_st: Rc<SemType>,
) -> anyhow::Result<Rc<SemType>> {
    //     if t is BasicTypeBitSet {
    //         return (t & LIST) != 0 ? VAL : NEVER;
    //     }

    let k: ListNumberKey = match SemTypeContext::number_sub_type(idx_st) {
        SubType::False(_) => return Ok(SemTypeContext::never().into()),
        SubType::True(_) => ListNumberKey::True,
        SubType::Proper(proper) => match proper.as_ref() {
            ProperSubtype::Number { allowed, values } => {
                let mut acc = vec![];
                for v in values {
                    match v {
                        NumberRepresentationOrFormat::Lit(n) => acc.push(n.clone()),
                        NumberRepresentationOrFormat::Format(CustomFormat(first, rest)) => {
                            bail!(
                                "format cannot be used as list index: {},{}",
                                first,
                                rest.join(",")
                            )
                        }
                    }
                }

                ListNumberKey::N {
                    allowed: *allowed,
                    values: acc,
                }
            }
            _ => unreachable!("should be string"),
        },
    };
    let b = SemTypeContext::sub_type_data(obj_st, SubTypeTag::List);

    match b {
        SubType::False(_) => Ok(SemTypeContext::never().into()),
        SubType::True(_) => {
            bail!("not a list - true")
        }
        SubType::Proper(p) => {
            let bdd = match p.as_ref() {
                ProperSubtype::List(bdd) => bdd,
                _ => {
                    bail!("not a list - proper")
                }
            };
            Ok(bdd_list_member_type_inner_val(
                ctx,
                bdd.clone(),
                k,
                SemTypeContext::unknown().into(),
            ))
        }
    }
}

pub fn to_bdd_atoms(it: &Rc<Bdd>) -> Vec<Rc<Atom>> {
    match it.as_ref() {
        Bdd::True => vec![],
        Bdd::False => vec![],
        Bdd::Node {
            atom,
            left,
            middle,
            right,
        } => {
            let mut acc = vec![atom.clone()];
            acc.extend(to_bdd_atoms(left));
            acc.extend(to_bdd_atoms(middle));
            acc.extend(to_bdd_atoms(right));
            acc
        }
    }
}
pub fn keyof(ctx: &mut SemTypeContext, st: Rc<SemType>) -> anyhow::Result<Rc<SemType>> {
    let mut acc = Rc::new(SemTypeContext::never());

    for it in &st.subtype_data {
        match it.as_ref() {
            ProperSubtype::Mapping(it) => {
                for atom in to_bdd_atoms(it) {
                    if let Atom::Mapping(a) = atom.as_ref() {
                        let a = ctx.get_mapping_atomic(*a);

                        for k in a.vs.keys() {
                            let key_ty =
                                Rc::new(SemTypeContext::string_const(StringLitOrFormat::Tpl(
                                    TplLitType(vec![TplLitTypeItem::StringConst(k.clone())]),
                                )));
                            let ty_at_key =
                                mapping_indexed_access(ctx, st.clone(), key_ty.clone())?;
                            if !ty_at_key.is_empty(ctx) {
                                acc = acc.union(&key_ty)
                            }
                        }
                    };
                }
            }
            ProperSubtype::List(_) => {
                let idx_st = Rc::new(SemTypeContext::number());
                let ty_at_key = list_indexed_access(ctx, st.clone(), idx_st.clone())?;
                if !ty_at_key.is_empty(ctx) {
                    acc = acc.union(&idx_st)
                }
            }
            _ => (),
        }
    }
    Ok(acc)
}
