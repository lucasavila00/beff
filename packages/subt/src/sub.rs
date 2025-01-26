use std::{
    fmt::Display,
    rc::Rc,
    sync::{Arc, Mutex},
};

use bitfield_struct::bitfield;

use crate::bdd::{
    list_is_empty, Atom, Bdd, Evidence, EvidenceResult, ListAtomic, ProperSubtypeEvidence,
    ProperSubtypeEvidenceResult, TC,
};

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

thread_local! {
    static SEMTYPE_CTX: Arc<Mutex<TC>> = Arc::new(Mutex::new(TC::new()));
}

fn local_ctx() -> Arc<Mutex<TC>> {
    SEMTYPE_CTX.with(|ctx| ctx.clone())
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
    pub fn is_bot(&self) -> bool {
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

#[derive(Debug)]
pub struct Ty {
    pub bitmap: BitMap,
    pub boolean: BooleanSubtype,
    pub string: StringSubtype,
    pub list: Rc<Bdd>,
}
impl Display for Ty {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.display_inner())
    }
}
impl Ty {
    pub fn new_bot() -> Self {
        Self {
            bitmap: BitMap::new_bot(),
            boolean: BooleanSubtype::new_bot(),
            string: StringSubtype::new_bot(),
            list: Bdd::False.into(),
        }
    }
    pub fn new_top() -> Ty {
        Self {
            bitmap: BitMap::new_top(),
            boolean: BooleanSubtype::new_top(),
            string: StringSubtype::new_top(),
            list: Bdd::True.into(),
        }
    }

    pub fn new_null() -> Self {
        Self {
            bitmap: BitMap::new_bot().with_null(true),
            boolean: BooleanSubtype::new_bot(),
            string: StringSubtype::new_bot(),
            list: Bdd::False.into(),
        }
    }

    pub fn new_bool_top() -> Self {
        Self {
            bitmap: BitMap::new_bot(),
            boolean: BooleanSubtype::new_top(),
            string: StringSubtype::new_bot(),
            list: Bdd::False.into(),
        }
    }

    pub fn new_bool(b: bool) -> Self {
        Self {
            bitmap: BitMap::new_bot(),
            boolean: BooleanSubtype::Bool(b),
            string: StringSubtype::new_bot(),
            list: Bdd::False.into(),
        }
    }

    pub fn new_string_top() -> Self {
        Self {
            bitmap: BitMap::new_bot(),
            boolean: BooleanSubtype::new_bot(),
            string: StringSubtype::new_top(),
            list: Bdd::False.into(),
        }
    }

    pub fn new_strings(v: Vec<String>) -> Self {
        Self {
            bitmap: BitMap::new_bot(),
            boolean: BooleanSubtype::new_bot(),
            string: StringSubtype::Pos(v),
            list: Bdd::False.into(),
        }
    }

    pub fn new_list_top() -> Self {
        Self {
            bitmap: BitMap::new_bot(),
            boolean: BooleanSubtype::new_bot(),
            string: StringSubtype::new_bot(),
            list: Bdd::True.into(),
        }
    }

    fn insert_list_atomic(items: Ty) -> usize {
        let c = local_ctx();
        let mut tc = c.lock().unwrap();

        let pos = tc.list_definitions.len();
        tc.list_definitions.push(Some(Rc::new(ListAtomic {
            prefix_items: vec![],
            items: items.into(),
        })));

        pos
    }

    pub fn new_parametric_list(t: Ty) -> Self {
        let pos = Self::insert_list_atomic(t);
        Self {
            bitmap: BitMap::new_bot(),
            boolean: BooleanSubtype::new_bot(),
            string: StringSubtype::new_bot(),
            list: Bdd::from_atom(Atom::List(pos)).into(),
        }
    }

    pub fn is_bot(&self) -> bool {
        matches!(self.is_empty_evidence(), EvidenceResult::IsEmpty)
    }
    pub fn is_empty_evidence(&self) -> EvidenceResult {
        if self.bitmap.into_bits() != 0 {
            if self.bitmap.null() {
                return Evidence::BitmapNull {}.to_result();
            }

            unreachable!("should have found a tag")
        }

        match &self.boolean {
            BooleanSubtype::Top => {
                return EvidenceResult::Evidence(Evidence::Proper(ProperSubtypeEvidence::Boolean(
                    true,
                )))
            }
            BooleanSubtype::Bot => {}
            BooleanSubtype::Bool(b) => {
                return EvidenceResult::Evidence(Evidence::Proper(ProperSubtypeEvidence::Boolean(
                    *b,
                )))
            }
        }
        if !self.string.is_bot() {
            return EvidenceResult::Evidence(Evidence::Proper(match &self.string {
                StringSubtype::Pos(vec) => ProperSubtypeEvidence::String {
                    allowed: true,
                    values: vec.clone(),
                },
                StringSubtype::Neg(vec) => ProperSubtypeEvidence::String {
                    allowed: false,
                    values: vec.clone(),
                },
            }));
        }
        if let ProperSubtypeEvidenceResult::Evidence(e) =
            list_is_empty(&self.list, &mut local_ctx().lock().unwrap())
        {
            return EvidenceResult::Evidence(Evidence::Proper(e));
        };

        return EvidenceResult::IsEmpty;
    }
    pub fn is_subtype(&self, b: &Ty) -> bool {
        self.diff(b).is_bot()
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
            list: self.list.complement(),
        }
    }

    pub fn diff(&self, b: &Ty) -> Ty {
        let all_bitmap = self.bitmap.into_bits() & !b.bitmap.into_bits();
        Ty {
            bitmap: BitMap::from_bits(all_bitmap),
            boolean: self.boolean.diff(&b.boolean),
            string: self.string.diff(&b.string),
            list: self.list.diff(&b.list),
        }
    }
    pub fn union(&self, b: &Ty) -> Ty {
        Ty {
            bitmap: BitMap::from_bits(self.bitmap.into_bits() | b.bitmap.into_bits()),
            boolean: self.boolean.union(&b.boolean),
            string: self.string.union(&b.string),
            list: self.list.union(&b.list),
        }
    }

    pub fn intersect(&self, b: &Ty) -> Ty {
        Ty {
            bitmap: BitMap::from_bits(self.bitmap.into_bits() & b.bitmap.into_bits()),
            boolean: self.boolean.intersect(&b.boolean),
            string: self.string.intersect(&b.string),
            list: self.list.intersect(&b.list),
        }
    }
    pub fn to_dnf(&self) -> Dnf {
        let mut acc: Vec<Dnf> = vec![];

        if self.bitmap.null() {
            acc.push(Dnf::null());
        }

        match self.boolean {
            BooleanSubtype::Top => {
                acc.push(Dnf::bool_top());
            }
            BooleanSubtype::Bot => {}
            BooleanSubtype::Bool(v) => {
                acc.push(Dnf::bool_const(v));
            }
        }

        match &self.string {
            StringSubtype::Pos(vec) => {
                for v in vec {
                    acc.push(Dnf::string_const(v.clone()));
                }
            }
            StringSubtype::Neg(vec) => {
                if vec.is_empty() {
                    acc.push(Dnf::string_top());
                } else {
                    acc.push(Dnf::and(
                        vec.iter()
                            .map(|v| Dnf::not(Dnf::string_const(v.clone())))
                            .collect(),
                    ));
                }
            }
        }

        acc.push(self.list_to_dnf());

        Dnf::or(acc)
    }
    pub fn display_inner(&self) -> String {
        self.to_dnf().display_impl(false)
    }

    fn list_to_dnf(&self) -> Dnf {
        Self::display_list_bdd_dnf(&self.list)
    }

    fn display_list_bdd_dnf(it: &Rc<Bdd>) -> Dnf {
        match it.as_ref() {
            Bdd::True => Dnf::list_top(),
            Bdd::False => Dnf::bot(),
            Bdd::Node {
                atom,
                left,
                middle,
                right,
            } => Self::display_list_bdd_node_dnf(atom, left, middle, right),
        }
    }
    fn display_list_bdd_node_dnf(
        atom: &Rc<Atom>,
        left: &Rc<Bdd>,
        middle: &Rc<Bdd>,
        right: &Rc<Bdd>,
    ) -> Dnf {
        let lt = {
            let c = local_ctx();
            let ctx = c.lock().unwrap();
            match atom.as_ref() {
                Atom::List(a) => ctx.get_list_atomic(*a).clone(),
                _ => unreachable!(),
            }
        };
        let explained_sts = lt.to_dnf();
        let mut acc: Vec<Dnf> = vec![];

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
                acc2.push(Self::display_list_bdd_node_dnf(atom, left, middle, right));

                acc.push(Dnf::and(acc2));
            }
        };

        match middle.as_ref() {
            Bdd::False => {
                // noop
            }
            Bdd::True | Bdd::Node { .. } => {
                acc.push(Self::display_list_bdd_dnf(middle));
            }
        }
        match right.as_ref() {
            Bdd::True => {
                acc.push(Dnf::not(explained_sts));
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
                    Dnf::not(explained_sts),
                    Self::display_list_bdd_node_dnf(atom, left, middle, right),
                ];

                acc.push(Dnf::and(ty));
            }
        }

        Dnf::or(acc)
    }
}

#[derive(Debug, Clone)]
pub enum Dnf {
    Or(Vec<Dnf>),
    And(Vec<Dnf>),
    Not(Box<Dnf>),
    Null,
    BoolTop,
    StringTop,
    ListTop,
    BoolConst(bool),
    StringConst(String),
    Bot,
    List { prefix: Vec<Dnf>, rest: Box<Dnf> },
}

impl Dnf {
    pub fn is_bot(&self) -> bool {
        matches!(self, Dnf::Bot)
    }
    pub fn or(v: Vec<Dnf>) -> Dnf {
        // flatten ors
        let mut acc: Vec<Dnf> = vec![];
        for d in v {
            match d {
                Dnf::Or(v) => acc.extend(v),
                d => acc.push(d),
            }
        }
        // filter all bots
        let acc: Vec<Dnf> = acc.into_iter().filter(|d| !matches!(d, Dnf::Bot)).collect();
        // if len 1, return just it
        if acc.len() == 1 {
            acc.into_iter().next().unwrap()
        } else {
            Dnf::Or(acc)
        }
    }
    pub fn and(v: Vec<Dnf>) -> Dnf {
        // if len 1, return just it
        if v.len() == 1 {
            v.into_iter().next().unwrap()
        } else {
            Dnf::And(v)
        }
    }
    pub fn not(v: Dnf) -> Dnf {
        Dnf::Not(Box::new(v))
    }
    pub fn null() -> Dnf {
        Dnf::Null
    }
    pub fn bool_top() -> Dnf {
        Dnf::BoolTop
    }
    pub fn string_top() -> Dnf {
        Dnf::StringTop
    }
    pub fn list_top() -> Dnf {
        Dnf::ListTop
    }

    pub fn string_const(v: String) -> Dnf {
        Dnf::StringConst(v)
    }
    pub fn bool_const(v: bool) -> Dnf {
        Dnf::BoolConst(v)
    }
    pub fn bot() -> Dnf {
        Dnf::Bot
    }
    pub fn list(prefix: Vec<Dnf>, rest: Dnf) -> Dnf {
        Dnf::List {
            prefix,
            rest: Box::new(rest),
        }
    }

    pub fn display_impl(&self, wrap: bool) -> String {
        match self {
            Dnf::Or(vec) => {
                let inner = vec
                    .iter()
                    .map(|d| d.display_impl(true))
                    .collect::<Vec<String>>()
                    .join(" | ");
                if wrap {
                    format!("({})", inner)
                } else {
                    inner
                }
            }
            Dnf::And(vec) => {
                let inner = vec
                    .iter()
                    .map(|d| d.display_impl(true))
                    .collect::<Vec<String>>()
                    .join(" & ");
                if wrap {
                    format!("({})", inner)
                } else {
                    inner
                }
            }
            Dnf::Not(dnf) => {
                format!("!({})", dnf.display_impl(false))
            }
            Dnf::StringConst(it) => format!("'{}'", it),
            Dnf::BoolConst(it) => it.to_string(),
            Dnf::Bot => "⊥".to_owned(),
            Dnf::List { prefix, rest } => {
                if prefix.is_empty() {
                    if !rest.is_bot() {
                        return format!("[]{}", rest.display_impl(true));
                    }
                }
                let mut prefix = prefix
                    .iter()
                    .map(|d| d.display_impl(true))
                    .collect::<Vec<String>>()
                    .join(", ");
                let mut rest_part = "".to_owned();
                if !rest.is_bot() {
                    rest_part = rest_part + rest.display_impl(true).as_str() + "...";
                    if !prefix.is_empty() {
                        prefix = prefix + ", ";
                    }
                }
                format!("list[{}{}]", prefix, rest_part)
            }
            Dnf::Null => "null".to_owned(),
            Dnf::BoolTop => "boolean".to_owned(),
            Dnf::StringTop => "string".to_owned(),
            Dnf::ListTop => "list".to_owned(),
        }
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
    fn test_list() {
        let l = Ty::new_list_top();
        assert!(!l.is_bot());
        assert!(!l.is_top());

        insta::assert_snapshot!(l, @"list");
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

        insta::assert_snapshot!(a, @"boolean");
        insta::assert_snapshot!(b, @"null");
        insta::assert_snapshot!(c, @"null | boolean");

        insta::assert_snapshot!(c.diff(&a), @"null");
        insta::assert_snapshot!(b.diff(&a), @"null");
    }

    #[test]
    fn bool_const0() {
        let a = Ty::new_bool(true);
        insta::assert_snapshot!(a, @"true");

        let c = a.complement();
        insta::assert_snapshot!(c, @"null | false | string | list");

        let back = c.complement();
        assert!(back.is_same_type(&a));
        insta::assert_snapshot!(back, @"true");

        let all = c.union(&a);
        insta::assert_snapshot!(all, @"null | boolean | string | list");

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

        insta::assert_snapshot!(t, @"true");
        insta::assert_snapshot!(f, @"false");
        insta::assert_snapshot!(b, @"boolean");

        insta::assert_snapshot!(b.diff(&t), @"false");

        assert!(t.intersect(&f).is_bot());

        assert!(b.is_same_type(&Ty::new_bool_top()));

        assert!(b.intersect(&t).is_same_type(&t));
        assert!(b.intersect(&f).is_same_type(&f));
    }

    #[test]
    fn string_const0() {
        let a = Ty::new_strings(vec!["a".to_string()]);
        insta::assert_snapshot!(a, @"'a'");

        let c = a.complement();
        insta::assert_snapshot!(c, @"null | boolean | !('a') | list");

        let back = c.complement();
        assert!(back.is_same_type(&a));
        insta::assert_snapshot!(back, @"'a'");

        let all = c.union(&a);
        insta::assert_snapshot!(all, @"null | boolean | string | list");

        assert!(all.is_top());
    }

    #[test]
    fn null_test() {
        let a = Ty::new_null();
        insta::assert_snapshot!(a, @"null");

        let c = a.complement();
        insta::assert_snapshot!(c, @"boolean | string | list");

        let back = c.complement();
        assert!(back.is_same_type(&a));
        insta::assert_snapshot!(back, @"null");

        let all = c.union(&a);
        insta::assert_snapshot!(all, @"null | boolean | string | list");

        assert!(all.is_top());
    }
    #[test]
    fn string_const() {
        let a = Ty::new_strings(vec!["a".to_string()]);
        insta::assert_snapshot!(a, @"'a'");

        let b = Ty::new_strings(vec!["b".to_string()]);
        insta::assert_snapshot!(b, @"'b'");

        let u = a.union(&b);
        insta::assert_snapshot!(u, @"'a' | 'b'");

        let au = a.intersect(&u);
        insta::assert_snapshot!(au, @"'a'");

        let i = a.intersect(&b);
        insta::assert_snapshot!(i, @"");
        assert!(i.is_bot());

        let d = a.diff(&b);
        insta::assert_snapshot!(d, @"'a'");

        let e = u.diff(&a);
        insta::assert_snapshot!(e, @"'b'");
    }

    #[test]
    fn string_and_bool_const() {
        let t = Ty::new_bool(true);
        let a = Ty::new_strings(vec!["a".to_string()]);

        let u = t.union(&a);

        insta::assert_snapshot!(u, @"true | 'a'");
    }

    #[test]
    fn bool_and_string() {
        let b = Ty::new_bool_top();

        let t = Ty::new_bool(true);

        let a = Ty::new_strings(vec!["a".to_string()]);

        let u = b.union(&a).union(&t);

        insta::assert_snapshot!(u, @"boolean | 'a'");
    }

    #[test]
    fn empty_test_bool() {
        let top = Ty::new_top();
        let t = Ty::new_bool(true);
        let sub1 = top.diff(&t);
        insta::assert_snapshot!(sub1, @"null | false | string | list");

        let t_complement = t.complement();
        let sub2 = sub1.diff(&t_complement);
        assert!(sub2.is_bot());
    }

    #[test]
    fn empty_test_string() {
        let top = Ty::new_top();
        let t = Ty::new_strings(vec!["a".to_string()]);
        let sub1 = top.diff(&t);
        insta::assert_snapshot!(sub1, @"null | boolean | !('a') | list");

        let t_complement = t.complement();
        let sub2 = sub1.diff(&t_complement);
        assert!(sub2.is_bot());

        let all = sub1.union(&t);
        assert!(all.is_top());
    }

    #[test]
    fn list_tests() {
        let bool_ty = Ty::new_bool_top();
        let l = Ty::new_parametric_list(bool_ty);
        insta::assert_snapshot!(l, @"[]boolean");

        let complement = l.complement();
        insta::assert_snapshot!(complement, @"null | boolean | string | !([]boolean)");

        let and_back_again = complement.complement();
        insta::assert_snapshot!(and_back_again, @"[]boolean");
        assert!(and_back_again.is_same_type(&l));
    }
    #[test]
    fn list_tests2() {
        let bool_ty = Ty::new_bool_top();
        let l1 = Ty::new_parametric_list(bool_ty);

        let string_ty = Ty::new_string_top();
        let l2 = Ty::new_parametric_list(string_ty);

        let u = l1.union(&l2);
        insta::assert_snapshot!(u, @"[]boolean | []string");

        let complement = u.complement();
        insta::assert_snapshot!(complement, @"null | boolean | string | (!([]boolean) & !([]string))");

        let and_back_again = complement.complement();
        insta::assert_snapshot!(and_back_again, @"[]boolean | []string");
        assert!(and_back_again.is_same_type(&u));
    }
    #[test]
    fn list_tests21() {
        let bool_ty = Ty::new_bool_top();
        let l1 = Ty::new_parametric_list(bool_ty);

        let string_ty = Ty::new_string_top();
        let l2 = Ty::new_parametric_list(string_ty);

        let u = l1.union(&l2);

        let complement = u.complement();
        insta::assert_snapshot!(complement, @"null | boolean | string | (!([]boolean) & !([]string))");
        let u1 = complement.union(&l1);
        insta::assert_snapshot!(u1, @"null | boolean | string | []boolean | (!([]boolean) & !([]string))");
        assert!(!u1.is_top());

        let unionized = u1.union(&l2);
        assert!(unionized.is_top());
    }
    #[test]
    fn list_tests3() {
        let bool_ty = Ty::new_bool_top();
        let l1 = Ty::new_parametric_list(bool_ty);

        let string_ty = Ty::new_string_top();
        let l2 = Ty::new_parametric_list(string_ty);

        let u = l1.union(&l2);
        let u = Ty::new_parametric_list(u);
        insta::assert_snapshot!(u, @"[]([]boolean | []string)");

        let complement = u.complement();
        insta::assert_snapshot!(complement, @"null | boolean | string | !([]([]boolean | []string))");

        let and_back_again = complement.complement();
        insta::assert_snapshot!(and_back_again, @"[]([]boolean | []string)");
        assert!(and_back_again.is_same_type(&u));
    }
}
