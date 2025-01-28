use std::{
    collections::BTreeMap,
    fmt::Display,
    rc::Rc,
    sync::{Arc, Mutex},
};

use bitfield_struct::bitfield;

use crate::{
    bdd::{
        list_is_empty, Atom, Bdd, Evidence, EvidenceResult, ProperSubtypeEvidence,
        ProperSubtypeEvidenceResult, TC,
    },
    boolean::BooleanSubtype,
    cf::CF,
    mapping::{MappingAtomic, MappingSubtype, MappingSubtypeItem, MappingSubtypeTag},
    string::StringSubtype,
};

pub fn vec_union<K: PartialEq + Clone + Ord>(v1: &[K], v2: &[K]) -> Vec<K> {
    let mut values: Vec<K> = v1.iter().cloned().chain(v2.iter().cloned()).collect();
    values.sort();
    values.dedup();
    values
}

pub fn vec_intersect<K: PartialEq + Clone + Ord>(v1: &[K], v2: &[K]) -> Vec<K> {
    v1.iter().filter(|v| v2.contains(v)).cloned().collect()
}

pub fn vec_diff<K: PartialEq + Clone + Ord>(v1: &[K], v2: &[K]) -> Vec<K> {
    v1.iter().filter(|v| !v2.contains(v)).cloned().collect()
}

thread_local! {
    static SEMTYPE_CTX: Arc<Mutex<TC>> = Arc::new(Mutex::new(TC::new()));
}

fn local_ctx() -> Arc<Mutex<TC>> {
    SEMTYPE_CTX.with(|ctx| ctx.clone())
}

#[derive(Debug)]

pub enum CFMemo {
    Schema(CF),
    Undefined(usize),
}

#[bitfield(u8)]
#[derive(PartialEq, Eq, PartialOrd, Ord)]
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

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct Ty {
    pub bitmap: BitMap,
    pub boolean: BooleanSubtype,
    pub string: StringSubtype,
    pub list: Rc<Bdd>,
    pub mapping: MappingSubtype,
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
            mapping: MappingSubtype::new_bot(),
        }
    }
    pub fn new_top() -> Ty {
        Self {
            bitmap: BitMap::new_top(),
            boolean: BooleanSubtype::new_top(),
            string: StringSubtype::new_top(),
            list: Bdd::True.into(),
            mapping: MappingSubtype::new_top(),
        }
    }

    pub fn new_null() -> Self {
        Self {
            bitmap: BitMap::new_bot().with_null(true),
            boolean: BooleanSubtype::new_bot(),
            string: StringSubtype::new_bot(),
            list: Bdd::False.into(),
            mapping: MappingSubtype::new_bot(),
        }
    }

    pub fn new_bool_top() -> Self {
        Self {
            bitmap: BitMap::new_bot(),
            boolean: BooleanSubtype::new_top(),
            string: StringSubtype::new_bot(),
            list: Bdd::False.into(),
            mapping: MappingSubtype::new_bot(),
        }
    }

    pub fn new_bool(b: bool) -> Self {
        Self {
            bitmap: BitMap::new_bot(),
            boolean: BooleanSubtype::Bool(b),
            string: StringSubtype::new_bot(),
            list: Bdd::False.into(),
            mapping: MappingSubtype::new_bot(),
        }
    }

    pub fn new_string_top() -> Self {
        Self {
            bitmap: BitMap::new_bot(),
            boolean: BooleanSubtype::new_bot(),
            string: StringSubtype::new_top(),
            list: Bdd::False.into(),
            mapping: MappingSubtype::new_bot(),
        }
    }

    pub fn new_strings(v: Vec<String>) -> Self {
        Self {
            bitmap: BitMap::new_bot(),
            boolean: BooleanSubtype::new_bot(),
            string: StringSubtype::Pos(v),
            list: Bdd::False.into(),
            mapping: MappingSubtype::new_bot(),
        }
    }

    pub fn new_list_top() -> Self {
        Self {
            bitmap: BitMap::new_bot(),
            boolean: BooleanSubtype::new_bot(),
            string: StringSubtype::new_bot(),
            list: Bdd::True.into(),
            mapping: MappingSubtype::new_bot(),
        }
    }

    pub fn list_def_len() -> usize {
        local_ctx().lock().unwrap().list_definitions.len()
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

    pub fn new_parametric_list(t: Ty) -> Self {
        let pos = Self::insert_list_atomic(vec![], t);
        Self {
            bitmap: BitMap::new_bot(),
            boolean: BooleanSubtype::new_bot(),
            string: StringSubtype::new_bot(),
            list: Bdd::from_atom(Atom::List(pos)).into(),
            mapping: MappingSubtype::new_bot(),
        }
    }

    pub fn new_tuple(prefix: Vec<Ty>) -> Self {
        let pos = Self::insert_list_atomic(prefix, Ty::new_bot());
        Self {
            bitmap: BitMap::new_bot(),
            boolean: BooleanSubtype::new_bot(),
            string: StringSubtype::new_bot(),
            list: Bdd::from_atom(Atom::List(pos)).into(),
            mapping: MappingSubtype::new_bot(),
        }
    }

    pub fn new_parametric_list_from_pos(pos: usize) -> Self {
        Self {
            bitmap: BitMap::new_bot(),
            boolean: BooleanSubtype::new_bot(),
            string: StringSubtype::new_bot(),
            list: Bdd::from_atom(Atom::List(pos)).into(),
            mapping: MappingSubtype::new_bot(),
        }
    }

    pub fn new_mapping(kvs: BTreeMap<String, Ty>) -> Self {
        Self {
            bitmap: BitMap::new_bot(),
            boolean: BooleanSubtype::new_bot(),
            string: StringSubtype::new_bot(),
            list: Bdd::False.into(),
            mapping: MappingSubtype(vec![MappingSubtypeItem {
                tag: MappingSubtypeTag::Open,
                fields: MappingAtomic(kvs),
                negs: vec![],
            }]),
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

        if !self.mapping.is_bot() {
            return EvidenceResult::Evidence(Evidence::Proper(ProperSubtypeEvidence::Mapping));
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
            mapping: self.mapping.complement(),
        }
    }

    pub fn diff(&self, b: &Ty) -> Ty {
        let all_bitmap = self.bitmap.into_bits() & !b.bitmap.into_bits();
        Ty {
            bitmap: BitMap::from_bits(all_bitmap),
            boolean: self.boolean.diff(&b.boolean),
            string: self.string.diff(&b.string),
            list: self.list.diff(&b.list),
            mapping: self.mapping.diff(&b.mapping),
        }
    }
    pub fn union(&self, b: &Ty) -> Ty {
        Ty {
            bitmap: BitMap::from_bits(self.bitmap.into_bits() | b.bitmap.into_bits()),
            boolean: self.boolean.union(&b.boolean),
            string: self.string.union(&b.string),
            list: self.list.union(&b.list),
            mapping: self.mapping.union(&b.mapping),
        }
    }

    pub fn intersect(&self, b: &Ty) -> Ty {
        Ty {
            bitmap: BitMap::from_bits(self.bitmap.into_bits() & b.bitmap.into_bits()),
            boolean: self.boolean.intersect(&b.boolean),
            string: self.string.intersect(&b.string),
            list: self.list.intersect(&b.list),
            mapping: self.mapping.intersect(&b.mapping),
        }
    }
    pub fn to_cf(&self) -> CF {
        let new_name = local_ctx().lock().unwrap().seen.len();
        let mut rec_seen = None;
        {
            let ctx = local_ctx();
            let mut guard = ctx.lock().unwrap();
            let seen = &mut guard.seen;
            match seen.get(self).clone() {
                Some(CFMemo::Schema(cf)) => return cf.clone(),
                Some(CFMemo::Undefined(name)) => {
                    rec_seen = Some(name.clone());
                }
                None => {
                    seen.insert(self.clone(), CFMemo::Undefined(new_name));
                }
            }
        }

        if let Some(name) = rec_seen {
            let ctx = local_ctx();
            let mut guard = ctx.lock().unwrap();
            guard.recursive_seen.insert(name.clone());
            return CF::Ref(name.clone());
        }
        let ty = self.to_cf_no_recursive_check();

        local_ctx()
            .lock()
            .unwrap()
            .seen
            .insert(self.clone(), CFMemo::Schema(ty.clone()));

        {
            let ctx = local_ctx();
            let mut guard = ctx.lock().unwrap();

            if guard.recursive_seen.contains(&new_name) {
                guard.to_export.push((new_name.clone(), ty.clone()));
                return CF::Ref(new_name);
            }
        }

        ty
    }
    pub fn to_cf_no_recursive_check(&self) -> CF {
        let mut acc: Vec<CF> = vec![];

        if self.bitmap.null() {
            acc.push(CF::null());
        }

        match self.boolean {
            BooleanSubtype::Top => {
                acc.push(CF::bool_top());
            }
            BooleanSubtype::Bot => {}
            BooleanSubtype::Bool(v) => {
                acc.push(CF::bool_const(v));
            }
        }

        match &self.string {
            StringSubtype::Pos(vec) => {
                for v in vec {
                    acc.push(CF::string_const(v.clone()));
                }
            }
            StringSubtype::Neg(vec) => {
                if vec.is_empty() {
                    acc.push(CF::string_top());
                } else {
                    acc.push(CF::and(
                        vec.iter()
                            .map(|v| CF::not(CF::string_const(v.clone())))
                            .collect(),
                    ));
                }
            }
        }

        // match &self.mapping {}
        // acc.push(format!("mapping: {:?}", self.mapping));
        if !self.mapping.is_bot() {
            // acc.push(CF::MappingSomething(self.mapping., ()));
            acc.push(self.mapping.to_cf());
        }

        acc.push(self.list_to_cf());

        CF::or(acc)
    }
    pub fn display_inner(&self) -> String {
        self.to_cf().display_impl(false)
    }

    fn list_to_cf(&self) -> CF {
        Self::display_list_bdd_cf(&self.list)
    }

    fn display_list_bdd_cf(it: &Rc<Bdd>) -> CF {
        match it.as_ref() {
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
                acc.push(Self::display_list_bdd_cf(middle));
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
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use super::*;

    #[test]
    fn mapping_tests21() {
        let bool_ty = Ty::new_bool_top();
        let l1 = Ty::new_mapping(vec![("a".to_string(), bool_ty)].into_iter().collect());

        let string_ty = Ty::new_string_top();
        let l2 = Ty::new_mapping(vec![("a".to_string(), string_ty)].into_iter().collect());

        let u = l1.union(&l2);

        let complement = u.complement();
        insta::assert_snapshot!(complement, @"null | boolean | string | {a: (null | (mapping & !(⊥) & !(⊥)) | list)} | list");
        let u1 = complement.union(&l1);
        insta::assert_snapshot!(u1, @"null | boolean | string | {a: boolean} | {a: (null | (mapping & !(⊥) & !(⊥)) | list)} | list");
        assert!(!u1.is_top());

        let unionized = u1.union(&l2);
        insta::assert_snapshot!(unionized, @"null | boolean | string | {a: boolean} | {a: string} | {a: (null | (mapping & !(⊥) & !(⊥)) | list)} | list");
        assert!(unionized.is_top());
    }

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
    fn test_mapping() {
        let m = Ty::new_mapping(BTreeMap::new());
        assert!(!m.is_bot());
        assert!(!m.is_top());

        insta::assert_snapshot!(m, @"mapping");
    }

    #[test]
    fn test_mapping_with_items() {
        let mut kvs = BTreeMap::new();
        kvs.insert("b".to_string(), Ty::new_bool_top());
        let m = Ty::new_mapping(kvs);
        assert!(!m.is_bot());
        assert!(!m.is_top());

        insta::assert_snapshot!(m, @"{b: boolean}");

        let complement = m.complement();
        assert!(!complement.is_bot());

        insta::assert_snapshot!(complement, @"null | boolean | string | {b: (null | string | (mapping & !(⊥)) | list)} | list");

        let back = complement.complement();
        insta::assert_snapshot!(back, @"{b: boolean}");
        assert!(back.is_same_type(&m));
    }
    #[test]
    fn test_mapping_with_items2() {
        let mut kvs = BTreeMap::new();
        kvs.insert("b".to_string(), Ty::new_bool_top());
        let m = Ty::new_mapping(kvs).union(&Ty::new_bool_top());
        assert!(!m.is_bot());
        assert!(!m.is_top());

        insta::assert_snapshot!(m, @"boolean | {b: boolean}");

        let complement = m.complement();
        assert!(!complement.is_bot());

        insta::assert_snapshot!(complement, @"null | string | ({b: (null | string | (mapping & !(⊥)) | list)} & !(⊥)) | list");

        let back = complement.complement();
        insta::assert_snapshot!(back, @"boolean | (mapping & !({b: (null | string | (mapping & !(⊥)) | list)}))");
        assert!(back.is_same_type(&m));
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
        insta::assert_snapshot!(c, @"null | false | string | (mapping & !(⊥)) | list");

        let back = c.complement();
        assert!(back.is_same_type(&a));
        insta::assert_snapshot!(back, @"true");

        let all = c.union(&a);
        insta::assert_snapshot!(all, @"null | boolean | string | (mapping & !(⊥)) | list");

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
        insta::assert_snapshot!(c, @"null | boolean | !('a') | (mapping & !(⊥)) | list");

        let back = c.complement();
        assert!(back.is_same_type(&a));
        insta::assert_snapshot!(back, @"'a'");

        let all = c.union(&a);
        insta::assert_snapshot!(all, @"null | boolean | string | (mapping & !(⊥)) | list");

        assert!(all.is_top());
    }

    #[test]
    fn null_test() {
        let a = Ty::new_null();
        insta::assert_snapshot!(a, @"null");

        let c = a.complement();
        insta::assert_snapshot!(c, @"boolean | string | (mapping & !(⊥)) | list");

        let back = c.complement();
        assert!(back.is_same_type(&a));
        insta::assert_snapshot!(back, @"null");

        let all = c.union(&a);
        insta::assert_snapshot!(all, @"null | boolean | string | (mapping & !(⊥)) | list");

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
        insta::assert_snapshot!(i, @"⊥");
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
        insta::assert_snapshot!(sub1, @"null | false | string | (mapping & !(⊥)) | list");

        let t_complement = t.complement();
        let sub2 = sub1.diff(&t_complement);
        assert!(sub2.is_bot());
    }

    #[test]
    fn empty_test_string() {
        let top = Ty::new_top();
        let t = Ty::new_strings(vec!["a".to_string()]);
        let sub1 = top.diff(&t);
        insta::assert_snapshot!(sub1, @"null | boolean | !('a') | (mapping & !(⊥)) | list");

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
        insta::assert_snapshot!(complement, @"null | boolean | string | (mapping & !(⊥)) | !([]boolean)");

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
        insta::assert_snapshot!(complement, @"null | boolean | string | (mapping & !(⊥)) | (!([]boolean) & !([]string))");

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
        insta::assert_snapshot!(complement, @"null | boolean | string | (mapping & !(⊥)) | (!([]boolean) & !([]string))");
        let u1 = complement.union(&l1);
        insta::assert_snapshot!(u1, @"null | boolean | string | (mapping & !(⊥)) | []boolean | (!([]boolean) & !([]string))");
        assert!(!u1.is_top());

        let unionized = u1.union(&l2);
        insta::assert_snapshot!(unionized, @"null | boolean | string | (mapping & !(⊥)) | []boolean | []string | (!([]boolean) & !([]string))");
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
        insta::assert_snapshot!(complement, @"null | boolean | string | (mapping & !(⊥)) | !([]([]boolean | []string))");

        let and_back_again = complement.complement();
        insta::assert_snapshot!(and_back_again, @"[]([]boolean | []string)");
        assert!(and_back_again.is_same_type(&u));
    }

    #[test]
    fn tuple_print() {
        let bool_ty = Ty::new_bool_top();
        let l = Ty::new_tuple(vec![bool_ty.clone()]);
        insta::assert_snapshot!(l, @"tuple[boolean]");
    }
    #[test]
    fn recursive_list() {
        let bool_ty = Ty::new_bool_top();

        let idx = Ty::list_def_len();

        let l1atom = Ty::insert_list_atomic(
            vec![
                bool_ty.clone(),
                bool_ty.union(&Ty::new_parametric_list_from_pos(idx)),
            ],
            Ty::new_bot(),
        );
        let l1 = bool_ty.union(&Ty::new_parametric_list_from_pos(l1atom));
        // type T = boolean | tuple[boolean, T]
        insta::assert_snapshot!(l1, @"ref(0)");

        let complement = l1.complement();
        insta::assert_snapshot!(complement, @"null | string | (mapping & !(⊥)) | !(tuple[boolean, (boolean | tuple[boolean, ref(0)])])");

        let mut acc = BTreeMap::new();
        for (name, cf) in local_ctx().lock().unwrap().to_export.clone() {
            acc.insert(name, cf.display_impl(false));
        }

        insta::assert_debug_snapshot!(acc, @r###"
        {
            0: "boolean | tuple[boolean, ref(0)]",
        }
        "###);
    }
}
