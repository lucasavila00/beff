#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum BooleanSubtype {
    Top,
    Bot,
    Bool(bool),
}
impl BooleanSubtype {
    pub fn new_bot() -> BooleanSubtype {
        BooleanSubtype::Bot
    }

    pub fn new_top() -> BooleanSubtype {
        BooleanSubtype::Top
    }
    pub fn is_bot(&self) -> bool {
        matches!(self, BooleanSubtype::Bot)
    }
    pub fn is_top(&self) -> bool {
        matches!(self, BooleanSubtype::Top)
    }

    pub fn complement(&self) -> BooleanSubtype {
        match self {
            BooleanSubtype::Bot => BooleanSubtype::Top,
            BooleanSubtype::Top => BooleanSubtype::Bot,
            BooleanSubtype::Bool(b) => BooleanSubtype::Bool(!b),
        }
    }

    pub fn diff(&self, other: &BooleanSubtype) -> BooleanSubtype {
        match (&self, &other) {
            (BooleanSubtype::Bot, _) => BooleanSubtype::Bot,
            (BooleanSubtype::Top, other) => other.complement(),
            (BooleanSubtype::Bool(_), BooleanSubtype::Top) => BooleanSubtype::Bot,
            (BooleanSubtype::Bool(a), BooleanSubtype::Bot) => BooleanSubtype::Bool(*a),
            (BooleanSubtype::Bool(a), BooleanSubtype::Bool(b)) => {
                if a == b {
                    BooleanSubtype::Bot
                } else {
                    BooleanSubtype::Bool(*a)
                }
            }
        }
    }

    pub fn union(&self, boolean: &BooleanSubtype) -> BooleanSubtype {
        match (self, boolean) {
            (BooleanSubtype::Bot, _) => boolean.clone(),
            (_, BooleanSubtype::Bot) => self.clone(),
            (BooleanSubtype::Top, _) => BooleanSubtype::Top,
            (_, BooleanSubtype::Top) => BooleanSubtype::Top,
            (BooleanSubtype::Bool(a), BooleanSubtype::Bool(b)) => {
                if a == b {
                    BooleanSubtype::Bool(*a)
                } else {
                    BooleanSubtype::Top
                }
            }
        }
    }

    pub fn intersect(&self, boolean: &BooleanSubtype) -> BooleanSubtype {
        match (self, boolean) {
            (BooleanSubtype::Bot, _) => BooleanSubtype::Bot,
            (_, BooleanSubtype::Bot) => BooleanSubtype::Bot,
            (BooleanSubtype::Top, other) => (*other).clone(),
            (_, BooleanSubtype::Top) => self.clone(),
            (BooleanSubtype::Bool(a), BooleanSubtype::Bool(b)) => {
                if a == b {
                    BooleanSubtype::Bool(*a)
                } else {
                    BooleanSubtype::Bot
                }
            }
        }
    }
}
