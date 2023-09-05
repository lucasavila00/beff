use std::{cmp::Ordering, rc::Rc};

use super::semtype::{SemType, SemTypeOps};

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd)]
pub enum Atom {
    Function(Rc<SemType>, Rc<SemType>),
    List(Rc<SemType>),
}

fn atom_cmp(a: &Atom, b: &Atom) -> Ordering {
    a.cmp(b)
}

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd)]
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

struct Conjunction {
    atom: Rc<Atom>,
    next: Option<Rc<Conjunction>>,
}
fn and(atom: Rc<Atom>, next: Option<Rc<Conjunction>>) -> Option<Rc<Conjunction>> {
    Some(Rc::new(Conjunction { atom, next }))
}

fn function_theta(t0: &Rc<SemType>, t1: &Rc<SemType>, pos: &Option<Rc<Conjunction>>) -> bool {
    match pos {
        None => t0.is_empty() || t1.is_empty(),
        Some(pos) => {
            if let Atom::Function(s0, s1) = &*pos.atom {
                return (t0.is_subtype(s0) || function_theta(&s0.diff(&t0), s1, &pos.next))
                    && (t1.is_subtype(&s1.complement())
                        || function_theta(s0, &s1.intersect(&t1), &pos.next));
            }
            panic!("pos is not a function")
        }
    }
}

fn function_bdd_is_empty(
    bdd: &Rc<Bdd>,
    s: Rc<SemType>,
    pos: &Option<Rc<Conjunction>>,
    neg: &Option<Rc<Conjunction>>,
) -> bool {
    match &**bdd {
        Bdd::False => true,
        Bdd::True => match neg {
            None => false,
            Some(neg) => {
                if let Atom::Function(t0, t1) = &*neg.atom {
                    return (t0.is_subtype(&s) && function_theta(t0, &t1.complement(), &pos))
                        || function_bdd_is_empty(&Bdd::True.into(), s, pos, &neg.next);
                }
                panic!("neg is not a function")
            }
        },
        Bdd::Node {
            atom,
            left,
            middle,
            right,
        } => {
            if let Atom::Function(sd, _sr) = &**atom {
                return function_bdd_is_empty(
                    left,
                    s.union(sd),
                    &and(atom.clone(), pos.clone()),
                    neg,
                ) && function_bdd_is_empty(middle, s.clone(), pos, neg)
                    && function_bdd_is_empty(right, s, pos, &and(atom.clone(), neg.clone()));
            }
            panic!("atom is not a function");
        }
    }
}

pub fn function_is_empty(bdd: &Rc<Bdd>) -> bool {
    // todo: memoization to handle recursive function
    return function_bdd_is_empty(bdd, SemType::new_never().into(), &None, &None);
}
