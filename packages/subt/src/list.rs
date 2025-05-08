use std::{
    rc::Rc,
    sync::{Arc, Mutex},
};

use crate::{
    bdd::{list_is_empty, Atom, Bdd, ProperSubtypeEvidenceResult, TC},
    cf::CF,
    sub::Ty,
};

#[derive(Debug)]
pub struct ListAtomic {
    pub prefix_items: Vec<Rc<Ty>>,
    pub rest: Rc<Ty>,
}

impl ListAtomic {
    pub fn to_cf(&self) -> CF {
        let rest = self.rest.to_cf();
        let prefix = self
            .prefix_items
            .iter()
            .map(|it| it.to_cf())
            .collect::<Vec<_>>();
        CF::list(prefix, rest)
    }
}
thread_local! {
    static SEMTYPE_CTX: Arc<Mutex<TC>> = Arc::new(Mutex::new(TC::new()));
}

fn local_ctx() -> Arc<Mutex<TC>> {
    SEMTYPE_CTX.with(|ctx| ctx.clone())
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct ListTy(pub Rc<Bdd>);

impl ListTy {
    pub fn new_bot() -> ListTy {
        ListTy(Bdd::False.into())
    }

    pub fn new_top() -> ListTy {
        ListTy(Bdd::True.into())
    }
    pub fn insert_list_atomic(prefix: Vec<Ty>, items: Ty) -> usize {
        let c = local_ctx();
        let mut tc = c.lock().unwrap();

        let pos = tc.list_definitions.len();
        tc.list_definitions.push(Some(Rc::new(ListAtomic {
            prefix_items: prefix.into_iter().map(|it| Rc::new(it)).collect(),
            rest: items.into(),
        })));

        pos
    }
    pub fn list_def_len() -> usize {
        local_ctx().lock().unwrap().list_definitions.len()
    }
    pub fn new_parametric_list(t: Ty) -> ListTy {
        let pos = Self::insert_list_atomic(vec![], t);
        ListTy(Bdd::from_atom(Atom::List(pos)).into())
    }

    pub fn new_tuple(prefix: Vec<Ty>) -> ListTy {
        let pos = Self::insert_list_atomic(prefix, Ty::new_bot());
        ListTy(Bdd::from_atom(Atom::List(pos)).into())
    }
    fn bff_to_cf(bdd: &Bdd) -> CF {
        match bdd {
            Bdd::True => CF::list_top(),
            Bdd::False => CF::bot(),
            Bdd::Node {
                atom,
                left,
                middle,
                right,
            } => Self::display_list_bdd_node_cf(atom, left, middle, right),
        }
    }
    pub fn to_cf(&self) -> CF {
        Self::bff_to_cf(&self.0)
    }
    fn display_list_bdd_node_cf(
        atom: &Rc<Atom>,
        left: &Rc<Bdd>,
        middle: &Rc<Bdd>,
        right: &Rc<Bdd>,
    ) -> CF {
        let lt = {
            let c = local_ctx();
            let ctx = c.lock().unwrap();
            match atom.as_ref() {
                Atom::List(a) => ctx.get_list_atomic(*a).clone(),
                _ => unreachable!(),
            }
        };
        let explained_sts = lt.to_cf();
        let mut acc: Vec<CF> = vec![];

        match left.as_ref() {
            Bdd::True => {
                acc.push(explained_sts.clone());
            }
            Bdd::False => {
                // noop
            }
            Bdd::Node {
                atom,
                left,
                middle,
                right,
            } => {
                let mut acc2 = vec![explained_sts.clone()];
                acc2.push(Self::display_list_bdd_node_cf(atom, left, middle, right));

                acc.push(CF::and(acc2));
            }
        };

        match middle.as_ref() {
            Bdd::False => {
                // noop
            }
            Bdd::True | Bdd::Node { .. } => {
                acc.push(Self::bff_to_cf(middle));
            }
        }
        match right.as_ref() {
            Bdd::True => {
                acc.push(CF::not(explained_sts));
            }
            Bdd::False => {
                // noop
            }
            Bdd::Node {
                atom,
                left,
                middle,
                right,
            } => {
                let ty = vec![
                    CF::not(explained_sts),
                    Self::display_list_bdd_node_cf(atom, left, middle, right),
                ];

                acc.push(CF::and(ty));
            }
        }

        CF::or(acc)
    }

    pub fn is_bot(&self) -> bool {
        matches!(
            list_is_empty(&self.0, &mut local_ctx().lock().unwrap()),
            ProperSubtypeEvidenceResult::IsEmpty
        )
    }
    pub fn complement(&self) -> ListTy {
        ListTy(self.0.complement())
    }
    pub fn diff(&self, other: &ListTy) -> ListTy {
        ListTy(self.0.diff(&other.0))
    }
    pub fn union(&self, other: &ListTy) -> ListTy {
        ListTy(self.0.union(&other.0))
    }
    pub fn intersect(&self, other: &ListTy) -> ListTy {
        ListTy(self.0.intersect(&other.0))
    }
}
