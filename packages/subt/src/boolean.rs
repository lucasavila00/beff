#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum BooleanTy {
    Top,
    Bot,
    Bool(bool),
}
impl BooleanTy {
    pub fn new_bot() -> BooleanTy {
        BooleanTy::Bot
    }

    pub fn new_top() -> BooleanTy {
        BooleanTy::Top
    }
    pub fn is_bot(&self) -> bool {
        matches!(self, BooleanTy::Bot)
    }
    pub fn is_top(&self) -> bool {
        matches!(self, BooleanTy::Top)
    }

    pub fn complement(&self) -> BooleanTy {
        match self {
            BooleanTy::Bot => BooleanTy::Top,
            BooleanTy::Top => BooleanTy::Bot,
            BooleanTy::Bool(b) => BooleanTy::Bool(!b),
        }
    }

    pub fn diff(&self, other: &BooleanTy) -> BooleanTy {
        match (&self, &other) {
            (BooleanTy::Bot, _) => BooleanTy::Bot,
            (BooleanTy::Top, other) => other.complement(),
            (BooleanTy::Bool(_), BooleanTy::Top) => BooleanTy::Bot,
            (BooleanTy::Bool(a), BooleanTy::Bot) => BooleanTy::Bool(*a),
            (BooleanTy::Bool(a), BooleanTy::Bool(b)) => {
                if a == b {
                    BooleanTy::Bot
                } else {
                    BooleanTy::Bool(*a)
                }
            }
        }
    }

    pub fn union(&self, boolean: &BooleanTy) -> BooleanTy {
        match (self, boolean) {
            (BooleanTy::Bot, _) => boolean.clone(),
            (_, BooleanTy::Bot) => self.clone(),
            (BooleanTy::Top, _) => BooleanTy::Top,
            (_, BooleanTy::Top) => BooleanTy::Top,
            (BooleanTy::Bool(a), BooleanTy::Bool(b)) => {
                if a == b {
                    BooleanTy::Bool(*a)
                } else {
                    BooleanTy::Top
                }
            }
        }
    }

    pub fn intersect(&self, boolean: &BooleanTy) -> BooleanTy {
        match (self, boolean) {
            (BooleanTy::Bot, _) => BooleanTy::Bot,
            (_, BooleanTy::Bot) => BooleanTy::Bot,
            (BooleanTy::Top, other) => (*other).clone(),
            (_, BooleanTy::Top) => self.clone(),
            (BooleanTy::Bool(a), BooleanTy::Bool(b)) => {
                if a == b {
                    BooleanTy::Bool(*a)
                } else {
                    BooleanTy::Bot
                }
            }
        }
    }
}
