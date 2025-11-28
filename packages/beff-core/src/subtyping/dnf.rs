use crate::subtyping::mapping::mapping_is_empty_impl;
use crate::subtyping::IsEmptyStatus;
use crate::subtyping::{
    bdd::{Atom, Bdd, BddOps},
    semtype::{BddMemoEmptyRef, MemoEmpty, SemTypeContext},
};
use anyhow::Result;
use std::rc::Rc;

// A DNF is a disjunction (OR) of Conjunctions
// An empty DNF represents false (bottom, never)
pub type Dnf = Vec<Conjunction>;

// A Conjunction is an AND of positive atoms and negated atoms
// Represents: (atom1 AND atom2 ...) AND (NOT atom3 AND NOT atom4 ...)
#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd, Clone)]
pub struct Conjunction {
    pub positive: Vec<Atom>,
    pub negative: Vec<Atom>,
}

// pub fn bdd_to_dnf(bdd: &Rc<Bdd>) -> Dnf {
//     bdd_to_dnf_impl(Vec::new(), Vec::new(), Vec::new(), bdd)
// }

// fn bdd_to_dnf_impl(acc: Dnf, pos: Vec<Atom>, neg: Vec<Atom>, bdd: &Rc<Bdd>) -> Dnf {
//     match bdd.as_ref() {
//         Bdd::True => {
//             let mut new_acc = acc;
//             new_acc.push(Conjunction {
//                 positive: pos,
//                 negative: neg,
//             });
//             new_acc
//         }
//         Bdd::False => acc,
//         Bdd::Node {
//             atom: lit,
//             left: c,
//             middle: u,
//             right: d,
//         } => {
//             // U is a bdd in itself, we accumulate its lines first
//             let acc = bdd_to_dnf_impl(acc, pos.clone(), neg.clone(), u);
//             // C-part
//             let mut new_pos = pos.clone();
//             new_pos.push(*lit);
//             let acc = bdd_to_dnf_impl(acc, new_pos, neg.clone(), c);
//             // D-part
//             let mut new_neg = neg.clone();
//             new_neg.push(*lit);
//             bdd_to_dnf_impl(acc, pos, new_neg, d)
//         }
//     }
// }

pub fn bdd_to_dnf(bdd: &Rc<Bdd>) -> Dnf {
    let mut acc = Vec::new();
    let mut pos = Vec::new();
    let mut neg = Vec::new();

    bdd_to_dnf_recursive(bdd, &mut pos, &mut neg, &mut acc);
    acc
}

fn bdd_to_dnf_recursive(bdd: &Bdd, pos: &mut Vec<Atom>, neg: &mut Vec<Atom>, acc: &mut Dnf) {
    match bdd {
        Bdd::True => {
            // Found a valid path: snapshot the current constraints
            // This is the ONLY place where allocation happens
            acc.push(Conjunction {
                positive: pos.clone(),
                negative: neg.clone(),
            });
        }
        Bdd::False => {
            // Dead end: do nothing
        }
        Bdd::Node {
            atom,
            left,
            middle,
            right,
        } => {
            // 1. Middle (Union): Independent of 'atom'
            // Path constraints (pos/neg) remain unchanged
            bdd_to_dnf_recursive(middle, pos, neg, acc);

            // 2. Left (Conjunction): 'atom' is TRUE
            pos.push(*atom); // Cheap copy
            bdd_to_dnf_recursive(left, pos, neg, acc);
            pos.pop(); // Backtrack

            // 3. Right (Difference): 'atom' is FALSE
            neg.push(*atom); // Cheap copy
            bdd_to_dnf_recursive(right, pos, neg, acc);
            neg.pop(); // Backtrack
        }
    }
}

pub fn dnf_to_bdd(dnf: &Dnf) -> Rc<Bdd> {
    let mut bdd = Rc::new(Bdd::False);
    for conj in dnf {
        let mut conj_bdd = Rc::new(Bdd::True);
        for pos in &conj.positive {
            let atom_bdd = Rc::new(Bdd::from_atom(*pos));
            conj_bdd = conj_bdd.intersect(&atom_bdd);
        }
        for neg in &conj.negative {
            let atom_bdd = Rc::new(Bdd::from_atom(*neg));
            let not_atom_bdd = Rc::new(atom_bdd.complement());
            conj_bdd = conj_bdd.intersect(&not_atom_bdd);
        }
        bdd = bdd.union(&conj_bdd);
    }
    bdd
}

fn mapping_is_empty_handle_recusrsion(
    dnf: Rc<Dnf>,
    ctx: &mut SemTypeContext,
) -> Result<IsEmptyStatus> {
    // use memoization to handle recursive types
    match ctx.mapping_memo_dnf.get(&dnf) {
        Some(mm) => match &mm.0 {
            MemoEmpty::True => return Ok(IsEmptyStatus::IsEmpty),
            MemoEmpty::False(ev) => return Ok(*ev),
            MemoEmpty::Undefined => {
                // we got a loop
                return Ok(IsEmptyStatus::IsEmpty);
            }
        },
        None => {
            ctx.mapping_memo_dnf
                .insert(dnf.clone(), BddMemoEmptyRef(MemoEmpty::Undefined));
        }
    }

    let is_empty = mapping_is_empty_impl(dnf.clone(), ctx)?;
    ctx.mapping_memo_dnf
        .get_mut(&dnf)
        .expect("bdd should be cached by now")
        .0 = MemoEmpty::from_bool(&is_empty);
    Ok(is_empty)
}

pub fn dnf_mapping_is_empty(bdd: &Rc<Bdd>, ctx: &mut SemTypeContext) -> Result<IsEmptyStatus> {
    let dnf = Rc::new(bdd_to_dnf(bdd));
    mapping_is_empty_handle_recusrsion(dnf, ctx)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bdd_to_dnf() {
        let a = Atom::List(0);
        let b = Atom::List(1);

        let bdd = Rc::new(Bdd::Node {
            atom: a,
            left: Rc::new(Bdd::False),
            middle: Rc::new(Bdd::Node {
                atom: b,
                left: Rc::new(Bdd::True),
                middle: Rc::new(Bdd::False),
                right: Rc::new(Bdd::False),
            }),
            right: Rc::new(Bdd::True),
        });

        let dnf = bdd_to_dnf(&bdd);
        let out = vec![
            Conjunction {
                positive: vec![Atom::List(1).into()],
                negative: vec![],
            },
            Conjunction {
                positive: vec![],
                negative: vec![Atom::List(0).into()],
            },
        ];

        assert_eq!(dnf, out);

        let bdd2 = dnf_to_bdd(&dnf);
        assert_eq!(*bdd, *bdd2);
    }

    #[test]
    fn test_dnf_mapping_is_empty() {
        let empty = Rc::new(Bdd::False);
        let result = dnf_mapping_is_empty(&empty, &mut SemTypeContext::new()).unwrap();
        assert!(result.is_empty());
    }
}
