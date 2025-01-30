use std::{collections::BTreeMap, fmt::Display};

use bitfield_struct::bitfield;

use crate::{
    bdd::{Evidence, EvidenceResult, ProperSubtypeEvidence},
    boolean::BooleanTy,
    cf::CF,
    list::ListTy,
    mapping::{MappingItem, MappingKV, MappingTag, MappingTy},
    string::StringTy,
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

#[derive(Debug)]

pub enum CFMemo {
    Schema(CF),
    Undefined(usize),
}

#[bitfield(u8)]
#[derive(PartialEq, Eq, PartialOrd, Ord)]
pub struct TyBitmap {
    pub null: bool,

    #[bits(7)]
    pub _padding: usize,
}

impl TyBitmap {
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

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct Ty {
    pub bitmap: TyBitmap,
    pub boolean: BooleanTy,
    pub string: StringTy,
    pub list: ListTy,
    pub mapping: MappingTy,
}
impl Display for Ty {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.display_inner())
    }
}
impl Ty {
    pub fn new_bot() -> Self {
        Self {
            bitmap: TyBitmap::new_bot(),
            boolean: BooleanTy::new_bot(),
            string: StringTy::new_bot(),
            list: ListTy::new_bot(),
            mapping: MappingTy::new_bot(),
        }
    }
    pub fn new_top() -> Ty {
        Self {
            bitmap: TyBitmap::new_top(),
            boolean: BooleanTy::new_top(),
            string: StringTy::new_top(),
            list: ListTy::new_top(),
            mapping: MappingTy::new_top(),
        }
    }

    pub fn new_null() -> Self {
        Self {
            bitmap: TyBitmap::new_bot().with_null(true),
            boolean: BooleanTy::new_bot(),
            string: StringTy::new_bot(),
            list: ListTy::new_bot(),
            mapping: MappingTy::new_bot(),
        }
    }

    pub fn new_bool_top() -> Self {
        Self {
            bitmap: TyBitmap::new_bot(),
            boolean: BooleanTy::new_top(),
            string: StringTy::new_bot(),
            list: ListTy::new_bot(),
            mapping: MappingTy::new_bot(),
        }
    }

    pub fn new_bool(b: bool) -> Self {
        Self {
            bitmap: TyBitmap::new_bot(),
            boolean: BooleanTy::Bool(b),
            string: StringTy::new_bot(),
            list: ListTy::new_bot(),
            mapping: MappingTy::new_bot(),
        }
    }

    pub fn new_string_top() -> Self {
        Self {
            bitmap: TyBitmap::new_bot(),
            boolean: BooleanTy::new_bot(),
            string: StringTy::new_top(),
            list: ListTy::new_bot(),
            mapping: MappingTy::new_bot(),
        }
    }

    pub fn new_strings(v: Vec<String>) -> Self {
        Self {
            bitmap: TyBitmap::new_bot(),
            boolean: BooleanTy::new_bot(),
            string: StringTy::Pos(v),
            list: ListTy::new_bot(),
            mapping: MappingTy::new_bot(),
        }
    }

    pub fn new_list_top() -> Self {
        Self {
            bitmap: TyBitmap::new_bot(),
            boolean: BooleanTy::new_bot(),
            string: StringTy::new_bot(),
            list: ListTy::new_top(),
            mapping: MappingTy::new_bot(),
        }
    }

    pub fn new_parametric_list(t: Ty) -> Self {
        Self {
            bitmap: TyBitmap::new_bot(),
            boolean: BooleanTy::new_bot(),
            string: StringTy::new_bot(),
            list: ListTy::new_parametric_list(t),
            mapping: MappingTy::new_bot(),
        }
    }

    pub fn new_tuple(prefix: Vec<Ty>) -> Self {
        Self {
            bitmap: TyBitmap::new_bot(),
            boolean: BooleanTy::new_bot(),
            string: StringTy::new_bot(),
            list: ListTy::new_tuple(prefix),
            mapping: MappingTy::new_bot(),
        }
    }

    pub fn new_mapping(kvs: BTreeMap<String, Ty>) -> Self {
        Self {
            bitmap: TyBitmap::new_bot(),
            boolean: BooleanTy::new_bot(),
            string: StringTy::new_bot(),
            list: ListTy::new_bot(),
            mapping: MappingTy(vec![MappingItem {
                tag: MappingTag::Open,
                fields: MappingKV(kvs),
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
            BooleanTy::Top => {
                return EvidenceResult::Evidence(Evidence::Proper(ProperSubtypeEvidence::Boolean(
                    true,
                )))
            }
            BooleanTy::Bot => {}
            BooleanTy::Bool(b) => {
                return EvidenceResult::Evidence(Evidence::Proper(ProperSubtypeEvidence::Boolean(
                    *b,
                )))
            }
        }
        if !self.string.is_bot() {
            return EvidenceResult::Evidence(Evidence::Proper(match &self.string {
                StringTy::Pos(vec) => ProperSubtypeEvidence::String {
                    allowed: true,
                    values: vec.clone(),
                },
                StringTy::Neg(vec) => ProperSubtypeEvidence::String {
                    allowed: false,
                    values: vec.clone(),
                },
            }));
        }
        if !self.list.is_bot() {
            return EvidenceResult::Evidence(Evidence::Proper(ProperSubtypeEvidence::List));
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
            bitmap: TyBitmap::from_bits(all_bitmap),
            boolean: self.boolean.diff(&b.boolean),
            string: self.string.diff(&b.string),
            list: self.list.diff(&b.list),
            mapping: self.mapping.diff(&b.mapping),
        }
    }
    pub fn union(&self, b: &Ty) -> Ty {
        Ty {
            bitmap: TyBitmap::from_bits(self.bitmap.into_bits() | b.bitmap.into_bits()),
            boolean: self.boolean.union(&b.boolean),
            string: self.string.union(&b.string),
            list: self.list.union(&b.list),
            mapping: self.mapping.union(&b.mapping),
        }
    }

    pub fn intersect(&self, b: &Ty) -> Ty {
        Ty {
            bitmap: TyBitmap::from_bits(self.bitmap.into_bits() & b.bitmap.into_bits()),
            boolean: self.boolean.intersect(&b.boolean),
            string: self.string.intersect(&b.string),
            list: self.list.intersect(&b.list),
            mapping: self.mapping.intersect(&b.mapping),
        }
    }

    pub fn to_cf(&self) -> CF {
        let mut acc: Vec<CF> = vec![];

        if self.bitmap.null() {
            acc.push(CF::null());
        }

        match self.boolean {
            BooleanTy::Top => {
                acc.push(CF::bool_top());
            }
            BooleanTy::Bot => {}
            BooleanTy::Bool(v) => {
                acc.push(CF::bool_const(v));
            }
        }

        match &self.string {
            StringTy::Pos(vec) => {
                for v in vec {
                    acc.push(CF::string_const(v.clone()));
                }
            }
            StringTy::Neg(vec) => {
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

        if !self.mapping.is_bot() {
            acc.push(self.mapping.to_cf());
        }

        if !self.list.is_bot() {
            acc.push(self.list.to_cf());
        }

        CF::or(acc)
    }
    pub fn display_inner(&self) -> String {
        self.to_cf().display_impl(false)
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
        insta::assert_snapshot!(complement, @"null | boolean | string | {a: (null | mapping | list)} | list");
        let u1 = complement.union(&l1);
        insta::assert_snapshot!(u1, @"null | boolean | string | {a: boolean} | {a: (null | mapping | list)} | list");
        assert!(!u1.is_top());

        let unionized = u1.union(&l2);
        insta::assert_snapshot!(unionized, @"null | boolean | string | {a: boolean} | {a: string} | {a: (null | mapping | list)} | list");
        assert!(unionized.is_top());
    }

    #[test]
    fn boolean_subtype() {
        let top = BooleanTy::new_top();
        let bot = BooleanTy::new_bot();

        let t = BooleanTy::Bool(true);
        let f = BooleanTy::Bool(false);

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
        let top = StringTy::new_top();
        let bot = StringTy::new_bot();

        let p = StringTy::Pos(vec!["a".to_string(), "b".to_string()]);
        let n = StringTy::Neg(vec!["a".to_string(), "b".to_string()]);

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

        insta::assert_snapshot!(complement, @"null | boolean | string | {b: (null | string | mapping | list)} | list");

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

        insta::assert_snapshot!(complement, @"null | string | {b: (null | string | mapping | list)} | list");

        let back = complement.complement();
        insta::assert_snapshot!(back, @"boolean | {b: boolean}");
        assert!(back.is_same_type(&m));
    }

    #[test]
    fn test_mapping_with_items3() {
        let mut kvs = BTreeMap::new();
        kvs.insert("b".to_string(), Ty::new_bool_top());
        let m = Ty::new_mapping(kvs);

        let mut kvs2 = BTreeMap::new();
        kvs2.insert("a".to_string(), Ty::new_string_top());

        let m2 = Ty::new_mapping(kvs2);

        let u = m2.union(&m);
        insta::assert_snapshot!(u, @"{a: string} | {b: boolean}");

        let complement = u.complement();
        insta::assert_snapshot!(complement, @"null | boolean | string | {a: (null | boolean | mapping | list), b: (null | string | mapping | list)} | list");

        let back = complement.complement();
        insta::assert_snapshot!(back, @"mapping & !({a: (null | boolean | mapping | list), b: (null | string | mapping | list)})");

        assert!(back.is_same_type(&u));
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
        insta::assert_snapshot!(c, @"null | false | string | mapping | list");

        let back = c.complement();
        assert!(back.is_same_type(&a));
        insta::assert_snapshot!(back, @"true");

        let all = c.union(&a);
        insta::assert_snapshot!(all, @"null | boolean | string | mapping | list");

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
        insta::assert_snapshot!(c, @"null | boolean | !('a') | mapping | list");

        let back = c.complement();
        assert!(back.is_same_type(&a));
        insta::assert_snapshot!(back, @"'a'");

        let all = c.union(&a);
        insta::assert_snapshot!(all, @"null | boolean | string | mapping | list");

        assert!(all.is_top());
    }

    #[test]
    fn null_test() {
        let a = Ty::new_null();
        insta::assert_snapshot!(a, @"null");

        let c = a.complement();
        insta::assert_snapshot!(c, @"boolean | string | mapping | list");

        let back = c.complement();
        assert!(back.is_same_type(&a));
        insta::assert_snapshot!(back, @"null");

        let all = c.union(&a);
        insta::assert_snapshot!(all, @"null | boolean | string | mapping | list");

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
        insta::assert_snapshot!(sub1, @"null | false | string | mapping | list");

        let t_complement = t.complement();
        let sub2 = sub1.diff(&t_complement);
        assert!(sub2.is_bot());
    }

    #[test]
    fn empty_test_string() {
        let top = Ty::new_top();
        let t = Ty::new_strings(vec!["a".to_string()]);
        let sub1 = top.diff(&t);
        insta::assert_snapshot!(sub1, @"null | boolean | !('a') | mapping | list");

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
        insta::assert_snapshot!(l, @"[boolean...]");

        let complement = l.complement();
        insta::assert_snapshot!(complement, @"null | boolean | string | mapping | !([boolean...])");

        let and_back_again = complement.complement();
        insta::assert_snapshot!(and_back_again, @"[boolean...]");
        assert!(and_back_again.is_same_type(&l));
    }
    #[test]
    fn list_tests2() {
        let bool_ty = Ty::new_bool_top();
        let l1 = Ty::new_parametric_list(bool_ty);

        let string_ty = Ty::new_string_top();
        let l2 = Ty::new_parametric_list(string_ty);

        let u = l1.union(&l2);
        insta::assert_snapshot!(u, @"[boolean...] | [string...]");

        let complement = u.complement();
        insta::assert_snapshot!(complement, @"null | boolean | string | mapping | (!([boolean...]) & !([string...]))");

        let and_back_again = complement.complement();
        insta::assert_snapshot!(and_back_again, @"[boolean...] | [string...]");
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
        insta::assert_snapshot!(complement, @"null | boolean | string | mapping | (!([boolean...]) & !([string...]))");
        let u1 = complement.union(&l1);
        insta::assert_snapshot!(u1, @"null | boolean | string | mapping | [boolean...] | (!([boolean...]) & !([string...]))");
        assert!(!u1.is_top());

        let unionized = u1.union(&l2);
        insta::assert_snapshot!(unionized, @"null | boolean | string | mapping | [boolean...] | [string...] | (!([boolean...]) & !([string...]))");
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
        insta::assert_snapshot!(u, @"[([boolean...] | [string...])...]");

        let complement = u.complement();
        insta::assert_snapshot!(complement, @"null | boolean | string | mapping | !([([boolean...] | [string...])...])");

        let and_back_again = complement.complement();
        insta::assert_snapshot!(and_back_again, @"[([boolean...] | [string...])...]");
        assert!(and_back_again.is_same_type(&u));
    }

    #[test]
    fn tuple_print() {
        let bool_ty = Ty::new_bool_top();
        let l = Ty::new_tuple(vec![bool_ty.clone()]);
        insta::assert_snapshot!(l, @"[boolean]");
    }
    // #[test]
    // fn recursive_list() {
    //     let bool_ty = Ty::new_bool_top();

    //     let idx = Ty::list_def_len();

    //     let l1atom = Ty::insert_list_atomic(
    //         vec![
    //             bool_ty.clone(),
    //             bool_ty.union(&Ty::new_parametric_list_from_pos(idx)),
    //         ],
    //         Ty::new_bot(),
    //     );
    //     let l1 = bool_ty.union(&Ty::new_parametric_list_from_pos(l1atom));
    //     // type T = boolean | tuple[boolean, T]
    //     insta::assert_snapshot!(l1, @"ref(0)");

    //     let complement = l1.complement();
    //     insta::assert_snapshot!(complement, @"null | string | mapping | !(tuple[boolean, (boolean | tuple[boolean, ref(0)])])");

    //     let mut acc = BTreeMap::new();
    //     for (name, cf) in local_ctx().lock().unwrap().to_export.clone() {
    //         acc.insert(name, cf.display_impl(false));
    //     }

    //     insta::assert_debug_snapshot!(acc, @r###"
    //     {
    //         0: "boolean | tuple[boolean, ref(0)]",
    //     }
    //     "###);
    // }
}
