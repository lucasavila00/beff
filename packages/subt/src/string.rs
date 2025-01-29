use crate::sub::{vec_diff, vec_intersect, vec_union};

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum StringTy {
    Pos(Vec<String>),
    Neg(Vec<String>),
}
impl StringTy {
    pub fn new_bot() -> StringTy {
        StringTy::Pos(Vec::new())
    }

    pub fn new_top() -> StringTy {
        StringTy::Neg(Vec::new())
    }

    pub fn is_bot(&self) -> bool {
        match self {
            StringTy::Pos(v) => v.is_empty(),
            StringTy::Neg(_) => false,
        }
    }

    pub fn is_top(&self) -> bool {
        match self {
            StringTy::Pos(_) => false,
            StringTy::Neg(v) => v.is_empty(),
        }
    }

    pub fn diff(&self, other: &StringTy) -> StringTy {
        self.intersect(&other.complement())
    }
    pub fn intersect(&self, other: &StringTy) -> StringTy {
        match (self, other) {
            (StringTy::Pos(v1), StringTy::Pos(v2)) => StringTy::Pos(vec_intersect(v1, v2)),
            (StringTy::Neg(v1), StringTy::Neg(v2)) => StringTy::Neg(vec_union(v1, v2)),
            (StringTy::Pos(v1), StringTy::Neg(v2)) => StringTy::Pos(vec_diff(v1, v2)),
            (StringTy::Neg(v1), StringTy::Pos(v2)) => StringTy::Pos(vec_diff(v2, v1)),
        }
    }
    pub fn union(&self, other: &StringTy) -> StringTy {
        match (self, other) {
            (StringTy::Pos(v1), StringTy::Pos(v2)) => StringTy::Pos(vec_union(v1, v2)),
            (StringTy::Neg(v1), StringTy::Neg(v2)) => StringTy::Neg(vec_intersect(v1, v2)),
            (StringTy::Pos(v1), StringTy::Neg(v2)) => StringTy::Neg(vec_diff(v2, v1)),
            (StringTy::Neg(v1), StringTy::Pos(v2)) => StringTy::Neg(vec_diff(v1, v2)),
        }
    }
    pub fn complement(&self) -> StringTy {
        match self {
            StringTy::Pos(p) => StringTy::Neg(p.clone()),
            StringTy::Neg(n) => StringTy::Pos(n.clone()),
        }
    }
}
