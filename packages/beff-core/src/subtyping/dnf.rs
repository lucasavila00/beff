use crate::subtyping::{
    bdd::{intersect_mapping, Atom, Bdd, BddOps, MappingAtomicType},
    evidence::{MappingEvidence, ProperSubtypeEvidence, ProperSubtypeEvidenceResult},
    semtype::{BddMemoEmptyRef, MemoEmpty, SemTypeContext, SemTypeOps},
};
use anyhow::Result;
use std::{collections::BTreeMap, rc::Rc};
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
            let atom_bdd = Rc::new(Bdd::from_atom(pos.clone()));
            conj_bdd = conj_bdd.intersect(&atom_bdd);
        }
        for neg in &conj.negative {
            let atom_bdd = Rc::new(Bdd::from_atom(neg.clone()));
            let not_atom_bdd = Rc::new(atom_bdd.complement());
            conj_bdd = conj_bdd.intersect(&not_atom_bdd);
        }
        bdd = bdd.union(&conj_bdd);
    }
    bdd
}

enum IntersectionResult {
    Empty,
    Atomic(Rc<MappingAtomicType>),
}

fn non_empty_map_literals_intersection(
    pos: &[Atom],
    ctx: &mut SemTypeContext,
) -> Result<IntersectionResult> {
    let mut acc = Rc::new(MappingAtomicType::new());

    for atom in pos {
        let atom_type = match atom {
            Atom::Mapping(a) => ctx.get_mapping_atomic(*a),
            _ => unreachable!(),
        };

        match intersect_mapping(acc, atom_type, ctx)? {
            Some(v) => acc = v,
            None => return Ok(IntersectionResult::Empty),
        }
    }
    Ok(IntersectionResult::Atomic(acc))
}

fn mapping_atomic_type_is_empty(
    atom: Rc<MappingAtomicType>,
    neg: &[Atom],
    ctx: &mut SemTypeContext,
) -> Result<bool> {
    // first check if any field in atom is empty
    for (_k, v) in atom.vs.iter() {
        if v.is_empty(ctx)? {
            return Ok(true);
        }
    }

    todo!()
}

fn mapping_is_empty_impl(
    dnf: Rc<Dnf>,
    ctx: &mut SemTypeContext,
) -> Result<ProperSubtypeEvidenceResult> {
    let mut acc = vec![];
    for it in dnf.as_ref() {
        match non_empty_map_literals_intersection(&it.positive, ctx)? {
            IntersectionResult::Empty => acc.push(true),
            IntersectionResult::Atomic(a) => {
                let res = mapping_atomic_type_is_empty(a, &it.negative, ctx)?;
                acc.push(res);
            }
        }
    }
    let is_empty = acc.iter().all(|x| *x);

    Ok(if is_empty {
        ProperSubtypeEvidenceResult::IsEmpty
    } else {
        ProperSubtypeEvidenceResult::Evidence(ProperSubtypeEvidence::MappingDnf)
    })
}

fn mapping_is_empty(dnf: Rc<Dnf>, ctx: &mut SemTypeContext) -> Result<ProperSubtypeEvidenceResult> {
    // use memoization to handle recursive types
    match ctx.mapping_memo_dnf.get(&dnf) {
        Some(mm) => match &mm.0 {
            MemoEmpty::True => return Ok(ProperSubtypeEvidenceResult::IsEmpty),
            MemoEmpty::False(ev) => return Ok(ev.clone()),
            MemoEmpty::Undefined => {
                // we got a loop
                return Ok(ProperSubtypeEvidenceResult::IsEmpty);
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

pub fn dnf_mapping_is_empty(
    bdd: &Rc<Bdd>,
    ctx: &mut SemTypeContext,
) -> Result<ProperSubtypeEvidenceResult> {
    let dnf = Rc::new(bdd_to_dnf(bdd));
    mapping_is_empty(dnf, ctx)
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
    #[test]
    fn test_dnd_mapping_empty_trivial() {
        let st_string = Rc::new(SemTypeContext::string());

        let mut ctx = SemTypeContext::new();

        let idx = ctx.mapping_definitions.len();
        ctx.mapping_definitions.push(Some(
            MappingAtomicType {
                vs: vec![("a".to_string(), st_string.into())]
                    .into_iter()
                    .collect(),
                indexed_properties: None,
            }
            .into(),
        ));

        // This would be: A & ~A, which is obviously not inhabited
        let trivial_dnf = vec![Conjunction {
            positive: vec![Atom::Mapping(idx)],
            negative: vec![Atom::Mapping(idx)],
        }];

        let result = mapping_is_empty_impl(trivial_dnf.into(), &mut ctx).unwrap();

        assert!(result.is_empty());
    }
}
