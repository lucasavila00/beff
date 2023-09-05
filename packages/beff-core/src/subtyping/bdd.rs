use std::{
    cmp::Ordering,
    collections::{BTreeMap, BTreeSet},
    rc::Rc,
};

use crate::subtyping::semtype::SemTypeBuilder;

use super::semtype::{BddMemoEmptyRef, MemoEmpty, SemType, SemTypeOps};

pub type MappingAtomic = BTreeMap<String, Rc<SemType>>;
#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd)]
pub enum Atom {
    // Function(Rc<SemType>, Rc<SemType>),
    Mapping(usize),
    // List(Rc<SemType>),
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
    builder: &mut SemTypeBuilder,
) -> bool;

// A Bdd represents a disjunction of conjunctions of atoms, where each atom is either positive or
// negative (negated). Each path from the root to a leaf that is true represents one of the conjunctions
// We walk the tree, accumulating the positive and negative conjunctions for a path as we go.
// When we get to a leaf that is true, we apply the predicate to the accumulated conjunctions.
fn bdd_every(
    bdd: &Rc<Bdd>,
    pos: &Option<Rc<Conjunction>>,
    neg: &Option<Rc<Conjunction>>,
    predicate: BddPredicate,
    builder: &mut SemTypeBuilder,
) -> bool {
    match &**bdd {
        Bdd::False => true,
        Bdd::True => predicate(pos, neg, builder),
        Bdd::Node {
            atom,
            left,
            middle,
            right,
        } => {
            bdd_every(
                left,
                &and(atom.clone(), pos.clone()),
                neg,
                predicate,
                builder,
            ) && bdd_every(middle, pos, neg, predicate, builder)
                && bdd_every(
                    right,
                    pos,
                    &and(atom.clone(), neg.clone()),
                    predicate,
                    builder,
                )
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
            .unwrap_or_else(|| Rc::new(SemTypeBuilder::any()));
        let type2 = m2
            .get(*name)
            .map(|it| it.clone())
            .unwrap_or_else(|| Rc::new(SemTypeBuilder::any()));
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
    builder: &mut SemTypeBuilder,
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
                    .unwrap_or_else(|| Rc::new(SemTypeBuilder::any()));
                let neg_type = neg
                    .get(**name)
                    .map(|it| it.clone())
                    .unwrap_or_else(|| Rc::new(SemTypeBuilder::any()));
                if pos_type.is_never() || neg_type.is_never() {
                    return mapping_inhabited(pos, &neg_list.next, builder);
                }
            }
            for name in all_names {
                let pos_type = pos
                    .get(*name)
                    .map(|it| it.clone())
                    .unwrap_or_else(|| Rc::new(SemTypeBuilder::any()));
                let neg_type = neg
                    .get(*name)
                    .map(|it| it.clone())
                    .unwrap_or_else(|| Rc::new(SemTypeBuilder::any()));

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
    builder: &mut SemTypeBuilder,
) -> bool {
    let mut combined: Rc<MappingAtomic> = Rc::new(BTreeMap::new());
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
                    None => return true,
                    Some(m) => combined = m,
                }
                p = some_p.next.clone();
            }
            for t in combined.values() {
                if t.is_empty(builder) {
                    return true;
                }
            }
        }
    }
    return !mapping_inhabited(combined, neg_list, builder);
}
pub fn mapping_is_empty(bdd: &Rc<Bdd>, builder: &mut SemTypeBuilder) -> bool {
    dbg!(&builder.mapping_definitions);
    dbg!(&bdd);

    match builder.mapping_memo.get(&bdd) {
        Some(mm) => match &mm.0 {
            MemoEmpty::True => return true,
            MemoEmpty::False => return false,

            MemoEmpty::Undefined => {
                // we got a loop
                return true;
            }
        },
        None => {
            builder
                .mapping_memo
                .insert((**bdd).clone(), BddMemoEmptyRef(MemoEmpty::Undefined));
        }
    }

    let is_empty = bdd_every(bdd, &None, &None, mapping_formula_is_empty, builder);
    builder.mapping_memo.get_mut(&bdd).unwrap().0 = MemoEmpty::from_bool(is_empty);
    is_empty
}
