use std::{
    cmp::Ordering,
    collections::{BTreeMap, BTreeSet},
    rc::Rc,
};

use crate::subtyping::semtype::SemTypeContext;

use super::{
    evidence::{
        Evidence, EvidenceResult, ListEvidence, MappingEvidence, ProperSubtypeEvidence,
        ProperSubtypeEvidenceResult,
    },
    semtype::{BddMemoEmptyRef, MemoEmpty, SemType, SemTypeOps},
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
        } => {
            let a = bdd_every(
                left,
                &and(atom.clone(), pos.clone()),
                neg,
                predicate,
                builder,
            );

            let b = bdd_every(middle, pos, neg, predicate, builder);
            let c = bdd_every(
                right,
                pos,
                &and(atom.clone(), neg.clone()),
                predicate,
                builder,
            );

            and_evidence(a, and_evidence(b, c))
        }
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
            .map(|it| it.clone())
            .unwrap_or_else(|| Rc::new(SemTypeContext::unknown()));
        let type2 = m2
            .get(*name)
            .map(|it| it.clone())
            .unwrap_or_else(|| Rc::new(SemTypeContext::unknown()));
        let t = type1.intersect(&type2);
        if t.is_never() {
            return None;
        }
        acc.push((name.to_string(), t))
    }
    return Some(Rc::new(MappingAtomic::from_iter(acc)));
}

fn mapping_inhabited(
    pos: Rc<MappingAtomic>,
    neg_list: &Option<Rc<Conjunction>>,
    builder: &mut SemTypeContext,
) -> bool {
    match neg_list {
        None => true,
        Some(neg_list) => {
            let neg = match &*neg_list.atom {
                Atom::Mapping(a) => builder.get_mapping_atomic(*a),
                _ => unreachable!(),
            };

            let pos_names = BTreeSet::from_iter(pos.keys());
            let neg_names = BTreeSet::from_iter(neg.keys());

            let all_names = pos_names.union(&neg_names).collect::<BTreeSet<_>>();

            for name in all_names.iter() {
                let pos_type = pos
                    .get(**name)
                    .map(|it| it.clone())
                    .unwrap_or_else(|| Rc::new(SemTypeContext::unknown()));
                let neg_type = neg
                    .get(**name)
                    .map(|it| it.clone())
                    .unwrap_or_else(|| Rc::new(SemTypeContext::unknown()));
                if pos_type.is_never() || neg_type.is_never() {
                    return mapping_inhabited(pos, &neg_list.next, builder);
                }
            }
            for name in all_names {
                let pos_type = pos
                    .get(*name)
                    .map(|it| it.clone())
                    .unwrap_or_else(|| Rc::new(SemTypeContext::unknown()));
                let neg_type = neg
                    .get(*name)
                    .map(|it| it.clone())
                    .unwrap_or_else(|| Rc::new(SemTypeContext::unknown()));

                let d = pos_type.diff(&neg_type);
                if !d.is_empty(builder) {
                    let mut mt = pos.as_ref().clone();
                    mt.insert(name.to_string(), d);
                    if mapping_inhabited(Rc::new(mt), &neg_list.next, builder) {
                        return true;
                    }
                }
            }

            return false;
        }
    }
}

fn mapping_formula_is_empty(
    pos_list: &Option<Rc<Conjunction>>,
    neg_list: &Option<Rc<Conjunction>>,
    builder: &mut SemTypeContext,
) -> ProperSubtypeEvidenceResult {
    let mut combined: Rc<MappingAtomic> = Rc::new(BTreeMap::new());
    let mut combined_evidence: MappingEvidence = BTreeMap::new();
    match pos_list {
        None => {}
        Some(pos_atom) => {
            match pos_atom.atom.as_ref() {
                Atom::Mapping(a) => combined = builder.get_mapping_atomic(*a).clone(),
                _ => unreachable!(),
            };
            let mut p = pos_atom.next.clone();
            while let Some(some_p) = p {
                let p_atom = match &*some_p.atom {
                    Atom::Mapping(a) => builder.get_mapping_atomic(*a),
                    _ => unreachable!(),
                };
                let m = intersect_mapping(combined.clone(), p_atom.clone());
                match m {
                    None => return ProperSubtypeEvidenceResult::IsEmpty,
                    Some(m) => combined = m,
                }
                p = some_p.next.clone();
            }
            for (k, t) in combined.iter() {
                match t.is_empty_evidence(builder) {
                    EvidenceResult::Evidence(e) => {
                        combined_evidence.insert(k.clone(), Rc::new(e));
                    }
                    EvidenceResult::IsEmpty => return ProperSubtypeEvidenceResult::IsEmpty,
                }
            }
        }
    }
    let is_empty = !mapping_inhabited(combined.clone(), neg_list, builder);
    if is_empty {
        return ProperSubtypeEvidenceResult::IsEmpty;
    }
    return ProperSubtypeEvidence::Mapping(combined_evidence.into()).to_result();
}
pub fn mapping_is_empty(
    bdd: &Rc<Bdd>,
    builder: &mut SemTypeContext,
) -> ProperSubtypeEvidenceResult {
    match builder.mapping_memo.get(&bdd) {
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
    builder.mapping_memo.get_mut(&bdd).unwrap().0 = MemoEmpty::from_bool(&is_empty);
    is_empty
}
enum ListInhabited {
    YesNoEvidence,
    Yes(Evidence),
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
        None => return ListInhabited::YesNoEvidence,
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
                // let ntm = i < neg_len ? nt.prefix_items[i] : nt.items;
                let ntm = if i < neg_len {
                    nt.prefix_items[i].clone()
                } else {
                    nt.items.clone()
                };
                let d = prefix_items[i].diff(&ntm);
                if !d.is_empty(builder) {
                    let mut s = prefix_items.clone();
                    s[i] = d;
                    match list_inhabited(&mut s, items, &neg.next, builder) {
                        ListInhabited::Yes(e) => return ListInhabited::Yes(e),
                        ListInhabited::YesNoEvidence => return ListInhabited::YesNoEvidence,
                        ListInhabited::No => {}
                    }
                }
            }

            let diff = items.diff(&nt.items);
            match diff.is_empty_evidence(builder) {
                EvidenceResult::Evidence(e) => return ListInhabited::Yes(e),
                EvidenceResult::IsEmpty => {}
            }
            // if !diff.is_empty(builder) {
            //     return ListInhabited::Yes;
            // }

            // This is correct for length 0, because we know that the length of the
            // negative is 0, and [] - [] is empty.
            return ListInhabited::No;
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

    let mut prefix_items_evidence = vec![];

    match pos {
        None => {}
        Some(pos_atom) => {
            // combine all the positive tuples using intersection
            let lt = match pos_atom.atom.as_ref() {
                Atom::List(a) => builder.get_list_atomic(*a).clone(),
                _ => unreachable!(),
            };
            prefix_items = lt.prefix_items.clone();
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
                p = some_p.next.clone();
            }

            for m in prefix_items.iter() {
                match m.is_empty_evidence(builder) {
                    EvidenceResult::Evidence(e) => {
                        prefix_items_evidence.push(Rc::new(e));
                    }
                    EvidenceResult::IsEmpty => return ProperSubtypeEvidenceResult::IsEmpty,
                }
            }
        }
    }
    match list_inhabited(&mut prefix_items, &items, neg, builder) {
        ListInhabited::Yes(e) => {
            let list_evidence = ListEvidence {
                prefix_items: prefix_items_evidence,
                items: Some(Rc::new(e)),
            };
            return ProperSubtypeEvidence::List(Rc::new(list_evidence)).to_result();
        }
        ListInhabited::YesNoEvidence => {
            let list_evidence = ListEvidence {
                prefix_items: prefix_items_evidence,
                items: None,
            };
            return ProperSubtypeEvidence::List(Rc::new(list_evidence)).to_result();
        }
        ListInhabited::No => return ProperSubtypeEvidenceResult::IsEmpty,
    }
}
pub fn list_is_empty(bdd: &Rc<Bdd>, builder: &mut SemTypeContext) -> ProperSubtypeEvidenceResult {
    match builder.list_memo.get(&bdd) {
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
    builder.list_memo.get_mut(&bdd).unwrap().0 = MemoEmpty::from_bool(&is_empty);
    is_empty
}
