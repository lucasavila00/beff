use bitfield_struct::bitfield;
fn vec_union<K: PartialEq + Clone + Ord>(v1: &[K], v2: &[K]) -> Vec<K> {
    let mut values: Vec<K> = v1.iter().cloned().chain(v2.iter().cloned()).collect();
    values.sort();
    values.dedup();
    values
}

fn vec_intersect<K: PartialEq + Clone + Ord>(v1: &[K], v2: &[K]) -> Vec<K> {
    v1.iter().filter(|v| v2.contains(v)).cloned().collect()
}

fn vec_diff<K: PartialEq + Clone + Ord>(v1: &[K], v2: &[K]) -> Vec<K> {
    v1.iter().filter(|v| !v2.contains(v)).cloned().collect()
}

#[bitfield(u8)]
pub struct BitMap {
    pub null: bool,

    #[bits(7)]
    pub _padding: usize,
}

impl BitMap {
    pub fn new_bot() -> Self {
        Self::new()
    }

    pub fn new_top() -> Self {
        Self::new().with_null(true)
    }

    pub fn is_bot(&self) -> bool {
        self.into_bits() == 0
    }

    pub fn complement(&self) -> Self {
        let mut new = self.clone();
        new.set_null(!self.null());
        new
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum BooleanSubtype {
    Top,
    Bot,
    Bool(bool),
}
impl BooleanSubtype {
    fn new_bot() -> BooleanSubtype {
        BooleanSubtype::Bot
    }

    fn new_top() -> BooleanSubtype {
        BooleanSubtype::Top
    }
    fn is_bot(&self) -> bool {
        matches!(self, BooleanSubtype::Bot)
    }
    pub fn is_top(&self) -> bool {
        matches!(self, BooleanSubtype::Top)
    }

    fn complement(&self) -> BooleanSubtype {
        match self {
            BooleanSubtype::Bot => BooleanSubtype::Top,
            BooleanSubtype::Top => BooleanSubtype::Bot,
            BooleanSubtype::Bool(b) => BooleanSubtype::Bool(!b),
        }
    }

    fn diff(&self, other: &BooleanSubtype) -> BooleanSubtype {
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

    fn union(&self, boolean: &BooleanSubtype) -> BooleanSubtype {
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

    fn intersect(&self, boolean: &BooleanSubtype) -> BooleanSubtype {
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

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum StringSubtype {
    Pos(Vec<String>),
    Neg(Vec<String>),
}
impl StringSubtype {
    fn new_bot() -> StringSubtype {
        StringSubtype::Pos(Vec::new())
    }

    fn new_top() -> StringSubtype {
        StringSubtype::Neg(Vec::new())
    }

    fn is_bot(&self) -> bool {
        match self {
            StringSubtype::Pos(v) => v.is_empty(),
            StringSubtype::Neg(_) => false,
        }
    }

    pub fn is_top(&self) -> bool {
        match self {
            StringSubtype::Pos(_) => false,
            StringSubtype::Neg(v) => v.is_empty(),
        }
    }

    fn diff(&self, other: &StringSubtype) -> StringSubtype {
        self.intersect(&other.complement())
    }
    fn intersect(&self, other: &StringSubtype) -> StringSubtype {
        match (self, other) {
            (StringSubtype::Pos(v1), StringSubtype::Pos(v2)) => {
                StringSubtype::Pos(vec_intersect(v1, v2))
            }
            (StringSubtype::Neg(v1), StringSubtype::Neg(v2)) => {
                StringSubtype::Neg(vec_union(v1, v2))
            }
            (StringSubtype::Pos(v1), StringSubtype::Neg(v2)) => {
                StringSubtype::Pos(vec_diff(v1, v2))
            }
            (StringSubtype::Neg(v1), StringSubtype::Pos(v2)) => {
                StringSubtype::Pos(vec_diff(v2, v1))
            }
        }
    }
    fn union(&self, other: &StringSubtype) -> StringSubtype {
        match (self, other) {
            (StringSubtype::Pos(v1), StringSubtype::Pos(v2)) => {
                StringSubtype::Pos(vec_union(v1, v2))
            }
            (StringSubtype::Neg(v1), StringSubtype::Neg(v2)) => {
                StringSubtype::Neg(vec_intersect(v1, v2))
            }
            (StringSubtype::Pos(v1), StringSubtype::Neg(v2)) => {
                StringSubtype::Neg(vec_diff(v2, v1))
            }
            (StringSubtype::Neg(v1), StringSubtype::Pos(v2)) => {
                StringSubtype::Neg(vec_diff(v1, v2))
            }
        }
    }
    fn complement(&self) -> StringSubtype {
        match self {
            StringSubtype::Pos(p) => StringSubtype::Neg(p.clone()),
            StringSubtype::Neg(n) => StringSubtype::Pos(n.clone()),
        }
    }
}

pub struct Ty {
    pub bitmap: BitMap,
    pub boolean: BooleanSubtype,
    pub string: StringSubtype,
}

impl Ty {
    pub fn new_bot() -> Self {
        Self {
            bitmap: BitMap::new_bot(),
            boolean: BooleanSubtype::new_bot(),
            string: StringSubtype::new_bot(),
        }
    }
    fn new_top() -> Ty {
        Self {
            bitmap: BitMap::new_top(),
            boolean: BooleanSubtype::new_top(),
            string: StringSubtype::new_top(),
        }
    }

    pub fn new_null() -> Self {
        Self {
            bitmap: BitMap::new_bot().with_null(true),
            boolean: BooleanSubtype::new_bot(),
            string: StringSubtype::new_bot(),
        }
    }

    pub fn new_bool_top() -> Self {
        Self {
            bitmap: BitMap::new_bot(),
            boolean: BooleanSubtype::new_top(),
            string: StringSubtype::new_bot(),
        }
    }

    pub fn new_bool(b: bool) -> Self {
        Self {
            bitmap: BitMap::new_bot(),
            boolean: BooleanSubtype::Bool(b),
            string: StringSubtype::new_bot(),
        }
    }

    pub fn new_string_top() -> Self {
        Self {
            bitmap: BitMap::new_bot(),
            boolean: BooleanSubtype::new_bot(),
            string: StringSubtype::new_top(),
        }
    }

    pub fn new_strings(v: Vec<String>) -> Self {
        Self {
            bitmap: BitMap::new_bot(),
            boolean: BooleanSubtype::new_bot(),
            string: StringSubtype::Pos(v),
        }
    }

    pub fn is_bot(&self) -> bool {
        self.bitmap.is_bot() && self.boolean.is_bot() && self.string.is_bot()
    }
    pub fn is_subtype(&self, b: &Ty) -> bool {
        let d = self.diff(b);
        d.is_bot()
    }

    pub fn is_same_type(&self, b: &Ty) -> bool {
        self.is_subtype(b) && b.is_subtype(self)
    }

    pub fn is_top(&self) -> bool {
        self.is_same_type(&Ty::new_top())
    }

    pub fn complement(&self) -> Ty {
        Ty {
            bitmap: self.bitmap.complement(),
            boolean: self.boolean.complement(),
            string: self.string.complement(),
        }
    }

    pub fn diff(&self, b: &Ty) -> Ty {
        let all_bitmap = self.bitmap.into_bits() & !b.bitmap.into_bits();
        Ty {
            bitmap: BitMap::from_bits(all_bitmap),
            boolean: self.boolean.diff(&b.boolean),
            string: self.string.diff(&b.string),
        }
    }
    pub fn union(&self, b: &Ty) -> Ty {
        Ty {
            bitmap: BitMap::from_bits(self.bitmap.into_bits() | b.bitmap.into_bits()),
            boolean: self.boolean.union(&b.boolean),
            string: self.string.union(&b.string),
        }
    }

    pub fn intersect(&self, b: &Ty) -> Ty {
        Ty {
            bitmap: BitMap::from_bits(self.bitmap.into_bits() & b.bitmap.into_bits()),
            boolean: self.boolean.intersect(&b.boolean),
            string: self.string.intersect(&b.string),
        }
    }

    pub fn display(&self) -> String {
        let mut acc = vec![];

        if self.bitmap.null() {
            acc.push("null".to_owned());
        }

        match self.boolean {
            BooleanSubtype::Top => {
                acc.push("boolean".to_owned());
            }
            BooleanSubtype::Bot => {}
            BooleanSubtype::Bool(v) => {
                if v {
                    acc.push("true".to_owned());
                } else {
                    acc.push("false".to_owned());
                }
            }
        }

        match &self.string {
            StringSubtype::Pos(vec) => {
                for v in vec {
                    acc.push(format!("'{}'", v));
                }
            }
            StringSubtype::Neg(vec) => {
                if vec.is_empty() {
                    acc.push("string".to_owned());
                } else {
                    let joined = format!(
                        "(string - ({}))",
                        vec.iter()
                            .map(|v| format!("'{}'", v))
                            .collect::<Vec<String>>()
                            .join(" | ")
                    );
                    acc.push(joined);
                }
            }
        }

        acc.join(" | ")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn boolean_subtype() {
        let top = BooleanSubtype::new_top();
        let bot = BooleanSubtype::new_bot();

        let t = BooleanSubtype::Bool(true);
        let f = BooleanSubtype::Bool(false);

        assert!(bot.is_bot());
        assert!(!bot.is_top());

        assert!(!top.is_bot());
        assert!(top.is_top());

        assert!(!t.is_bot());
        assert!(!t.is_top());

        assert!(!f.is_bot());
        assert!(!f.is_top());

        let u = t.union(&f);

        assert!(!u.is_bot());
        assert!(u.is_top());

        assert_eq!(u, top);

        let i = t.intersect(&f);
        assert_eq!(i, bot);

        let i2 = u.intersect(&f);
        assert_eq!(i2, f);

        let d = t.diff(&f);
        assert_eq!(d, t);

        let d2 = f.diff(&t);
        assert_eq!(d2, f);

        let d3 = t.diff(&top);
        assert_eq!(d3, bot);

        let d4 = f.diff(&top);
        assert_eq!(d4, bot);
    }

    #[test]
    fn string_subtype() {
        let top = StringSubtype::new_top();
        let bot = StringSubtype::new_bot();

        let p = StringSubtype::Pos(vec!["a".to_string(), "b".to_string()]);
        let n = StringSubtype::Neg(vec!["a".to_string(), "b".to_string()]);

        assert!(bot.is_bot());
        assert!(!bot.is_top());

        assert!(!top.is_bot());
        assert!(top.is_top());

        let u = p.union(&n);
        assert_eq!(u, top);

        let i = p.intersect(&n);
        assert!(i.is_bot());

        let i2 = p.intersect(&top);
        assert_eq!(i2, p);

        let i3 = n.intersect(&top);
        assert_eq!(i3, n);

        let d = p.diff(&n);
        assert_eq!(d, p);

        let d2 = n.diff(&p);
        assert_eq!(d2, n);

        let d3 = p.diff(&top);
        assert!(d3.is_bot());

        let d4 = n.diff(&top);
        assert!(d4.is_bot());
    }

    #[test]
    fn test_never() {
        let never = Ty::new_bot();
        assert!(never.is_bot());
        assert!(!never.is_top());
    }

    #[test]
    fn test_boolean() {
        let boolean = Ty::new_bool_top();
        assert!(!boolean.is_bot());
        assert!(!boolean.is_top());
    }

    #[test]
    fn test_unknown() {
        let unknown = Ty::new_top();
        assert!(!unknown.is_bot());
        assert!(unknown.is_top());
    }

    #[test]
    fn test_union() {
        let a = Ty::new_bool_top();
        let b = Ty::new_null();
        let c = a.union(&b);
        assert!(!c.is_bot());
        assert!(!c.is_top());

        assert!(a.is_subtype(&c));
        assert!(!c.is_subtype(&a));

        insta::assert_snapshot!(a.display(), @"boolean");
        insta::assert_snapshot!(b.display(), @"null");
        insta::assert_snapshot!(c.display(), @"null | boolean");

        insta::assert_snapshot!(c.diff(&a).display(), @"null");
        insta::assert_snapshot!(b.diff(&a).display(), @"null");
    }

    #[test]
    fn bool_const0() {
        let a = Ty::new_bool(true);
        insta::assert_snapshot!(a.display(), @"true");

        let c = a.complement();
        insta::assert_snapshot!(c.display(), @"null | false | string");

        let all = c.union(&a);
        insta::assert_snapshot!(all.display(), @"null | boolean | string");

        assert!(all.is_top());
    }
    #[test]
    fn bool_const() {
        let t = Ty::new_bool(true);
        let f = Ty::new_bool(false);
        let b = t.union(&f);
        assert!(!b.is_bot());
        assert!(!b.is_top());

        assert!(t.is_subtype(&b));
        assert!(f.is_subtype(&b));

        assert!(!b.is_subtype(&t));
        assert!(!b.is_subtype(&f));

        insta::assert_snapshot!(t.display(), @"true");
        insta::assert_snapshot!(f.display(), @"false");
        insta::assert_snapshot!(b.display(), @"boolean");

        insta::assert_snapshot!(b.diff(&t).display(), @"false");

        assert!(t.intersect(&f).is_bot());

        assert!(b.is_same_type(&Ty::new_bool_top()));

        assert!(b.intersect(&t).is_same_type(&t));
        assert!(b.intersect(&f).is_same_type(&f));
    }

    #[test]
    fn string_const0() {
        let a = Ty::new_strings(vec!["a".to_string()]);
        insta::assert_snapshot!(a.display(), @"'a'");

        let c = a.complement();
        insta::assert_snapshot!(c.display(), @"null | boolean | (string - ('a'))");

        let all = c.union(&a);
        insta::assert_snapshot!(all.display(), @"null | boolean | string");

        assert!(all.is_top());
    }
    #[test]
    fn string_const() {
        let a = Ty::new_strings(vec!["a".to_string()]);
        insta::assert_snapshot!(a.display(), @"'a'");

        let b = Ty::new_strings(vec!["b".to_string()]);
        insta::assert_snapshot!(b.display(), @"'b'");

        let u = a.union(&b);
        insta::assert_snapshot!(u.display(), @"'a' | 'b'");

        let au = a.intersect(&u);
        insta::assert_snapshot!(au.display(), @"'a'");

        let i = a.intersect(&b);
        insta::assert_snapshot!(i.display(), @"");
        assert!(i.is_bot());

        let d = a.diff(&b);
        insta::assert_snapshot!(d.display(), @"'a'");

        let e = u.diff(&a);
        insta::assert_snapshot!(e.display(), @"'b'");
    }

    #[test]
    fn string_and_bool_const() {
        let t = Ty::new_bool(true);
        let a = Ty::new_strings(vec!["a".to_string()]);

        let u = t.union(&a);

        insta::assert_snapshot!(u.display(), @"true | 'a'");
    }

    #[test]
    fn bool_and_string() {
        let b = Ty::new_bool_top();

        let t = Ty::new_bool(true);

        let a = Ty::new_strings(vec!["a".to_string()]);

        let u = b.union(&a).union(&t);

        insta::assert_snapshot!(u.display(), @"boolean | 'a'");
    }

    #[test]
    fn empty_test_bool() {
        let top = Ty::new_top();
        let t = Ty::new_bool(true);
        let sub1 = top.diff(&t);
        insta::assert_snapshot!(sub1.display(), @"null | false | string");

        let t_complement = t.complement();
        let sub2 = sub1.diff(&t_complement);
        assert!(sub2.is_bot());
    }

    #[test]
    fn empty_test_string() {
        let top = Ty::new_top();
        let t = Ty::new_strings(vec!["a".to_string()]);
        let sub1 = top.diff(&t);
        insta::assert_snapshot!(sub1.display(), @"null | boolean | (string - ('a'))");

        let t_complement = t.complement();
        let sub2 = sub1.diff(&t_complement);
        assert!(sub2.is_bot());

        let all = sub1.union(&t);
        assert!(all.is_top());
    }
}
