use crate::sub::{CFMemo, ListAtomic, Ty, CF};
use std::{
    cmp::Ordering,
    collections::{BTreeMap, BTreeSet},
    rc::Rc,
};

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

    pub fn intersect(self: &Rc<Bdd>, b2: &Rc<Bdd>) -> Rc<Bdd> {
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
    pub fn union(self: &Rc<Bdd>, b2: &Rc<Bdd>) -> Rc<Bdd> {
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
    pub fn diff(self: &Rc<Bdd>, b2: &Rc<Bdd>) -> Rc<Bdd> {
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
    pub fn complement(self: &Rc<Bdd>) -> Rc<Bdd> {
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
#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd)]
pub enum Evidence {
    BitmapNull,
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

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd, Clone)]
pub struct ListEvidence {
    pub prefix_items: Vec<Rc<Evidence>>,
    pub items: Option<Rc<Evidence>>,
}

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd, Clone)]
pub enum ProperSubtypeEvidence {
    Boolean(bool),
    String { allowed: bool, values: Vec<String> },
    List(Rc<ListEvidence>),
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

pub struct TC {
    pub list_definitions: Vec<Option<Rc<ListAtomic>>>,
    pub list_memo: BTreeMap<Bdd, BddMemoEmptyRef>,

    pub seen: BTreeMap<Ty, CFMemo>,
    pub recursive_seen: BTreeSet<usize>,
    pub to_export: Vec<(usize, CF)>,
}
impl TC {
    pub fn new() -> Self {
        Self {
            list_definitions: vec![],
            list_memo: BTreeMap::new(),
            seen: BTreeMap::new(),
            recursive_seen: BTreeSet::new(),
            to_export: vec![],
        }
    }
    pub fn get_list_atomic(&self, idx: usize) -> Rc<ListAtomic> {
        self.list_definitions
            .get(idx)
            .expect("should exist")
            .as_ref()
            .expect("should exist")
            .clone()
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

type BddPredicate = fn(
    pos: &Option<Rc<Conjunction>>,
    neg: &Option<Rc<Conjunction>>,
    builder: &mut TC,
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
    builder: &mut TC,
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

pub fn list_is_empty(bdd: &Rc<Bdd>, builder: &mut TC) -> ProperSubtypeEvidenceResult {
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

fn list_formula_is_empty(
    pos: &Option<Rc<Conjunction>>,
    neg: &Option<Rc<Conjunction>>,
    builder: &mut TC,
) -> ProperSubtypeEvidenceResult {
    let mut prefix_items = vec![];
    let mut items = Rc::new(Ty::new_top());

    match pos {
        None => {}
        Some(pos_atom) => {
            // combine all the positive tuples using intersection
            let lt = match pos_atom.atom.as_ref() {
                Atom::List(a) => builder.get_list_atomic(*a).clone(),
                _ => unreachable!(),
            };
            prefix_items.clone_from(&lt.prefix_items);
            items = lt.rest.clone();

            let mut p = pos_atom.next.clone();

            while let Some(ref some_p) = p {
                let d = &some_p.atom;
                let lt = match d.as_ref() {
                    Atom::List(a) => builder.get_list_atomic(*a).clone(),
                    _ => unreachable!(),
                };
                let new_len = std::cmp::max(prefix_items.len(), lt.prefix_items.len());
                if prefix_items.len() < new_len {
                    if lt.rest.is_bot() {
                        return ProperSubtypeEvidenceResult::IsEmpty;
                    }
                    for _i in prefix_items.len()..new_len {
                        prefix_items.push(lt.rest.clone());
                    }
                }
                for i in 0..lt.prefix_items.len() {
                    prefix_items[i] = prefix_items[i].intersect(&lt.prefix_items[i]).into();
                }
                if lt.prefix_items.len() < new_len {
                    if lt.rest.is_bot() {
                        return ProperSubtypeEvidenceResult::IsEmpty;
                    }
                    for i in lt.prefix_items.len()..new_len {
                        prefix_items[i] = prefix_items[i].intersect(&lt.rest).into();
                    }
                }
                items = items.intersect(&lt.rest).into();
                p.clone_from(&some_p.next.clone());
            }

            for m in prefix_items.iter() {
                if let EvidenceResult::IsEmpty = m.is_empty_evidence() {
                    return ProperSubtypeEvidenceResult::IsEmpty;
                }
            }
        }
    }
    match list_inhabited(&mut prefix_items, &items, neg, builder) {
        ListInhabited::Yes(e, prefix) => {
            let prefix2 = prefix
                .into_iter()
                .map(|it| match it.is_empty_evidence() {
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

enum ListInhabited {
    Yes(Option<Rc<Evidence>>, Vec<Rc<Ty>>),
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
    prefix_items: &mut Vec<Rc<Ty>>,
    items: &Rc<Ty>,
    neg: &Option<Rc<Conjunction>>,
    builder: &mut TC,
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
                if items.is_bot() {
                    return list_inhabited(prefix_items, items, &neg.next, builder);
                }
                for _i in len..neg_len {
                    prefix_items.push(items.clone());
                }
                len = neg_len;
            } else if neg_len < len && nt.rest.is_bot() {
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
                    nt.rest.clone()
                };
                let d = Rc::new(prefix_items[i].diff(&ntm));
                if !d.is_bot() {
                    let mut s = prefix_items.clone();
                    s[i] = d;
                    if let ListInhabited::Yes(a, _b) =
                        list_inhabited(&mut s, items, &neg.next, builder)
                    {
                        return ListInhabited::Yes(a, s.clone());
                    }
                }
            }

            let diff = items.diff(&nt.rest);
            if let EvidenceResult::Evidence(e) = diff.is_empty_evidence() {
                return ListInhabited::Yes(Some(e.into()), prefix_items.clone());
            }

            // This is correct for length 0, because we know that the length of the
            // negative is 0, and [] - [] is empty.
            ListInhabited::No
        }
    }
}
