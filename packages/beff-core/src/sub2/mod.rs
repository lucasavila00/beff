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

pub enum SubtypeResult<T: ?Sized> {
    Top,
    Bot,
    Proper(Box<T>),
}

pub trait SubOps {
    fn sub_complement(&self) -> Self;
    fn sub_diff(&self, other: &Self) -> SubtypeResult<Self>;
    fn sub_intersect(&self, other: &Self) -> SubtypeResult<Self>;
    fn sub_union(&self, other: &Self) -> SubtypeResult<Self>;
}

impl SubOps for bool {
    fn sub_complement(&self) -> Self {
        !self
    }
    fn sub_diff(&self, other: &Self) -> SubtypeResult<Self> {
        if self == other {
            SubtypeResult::Bot
        } else {
            SubtypeResult::Proper(Box::new(*self))
        }
    }

    fn sub_intersect(&self, other: &Self) -> SubtypeResult<Self> {
        if self == other {
            SubtypeResult::Proper(self.clone().into())
        } else {
            SubtypeResult::Bot
        }
    }

    fn sub_union(&self, other: &Self) -> SubtypeResult<Self> {
        if self == other {
            SubtypeResult::Proper(self.clone().into())
        } else {
            SubtypeResult::Top
        }
    }
}

#[derive(Clone)]
pub struct StringSubtype {
    pub allowed: bool,
    pub values: Vec<String>,
}

impl StringSubtype {
    pub fn to_option(self) -> Option<StringSubtype> {
        if self.values.is_empty() {
            None
        } else {
            Some(self)
        }
    }

    pub fn to_subtype_result(self) -> SubtypeResult<StringSubtype> {
        if self.values.is_empty() {
            SubtypeResult::Bot
        } else {
            SubtypeResult::Proper(self.into())
        }
    }
}

impl SubOps for StringSubtype {
    fn sub_complement(&self) -> Self {
        StringSubtype {
            allowed: !self.allowed,
            values: self.values.clone(),
        }
    }
    fn sub_diff(&self, other: &Self) -> SubtypeResult<Self> {
        let StringSubtype {
            allowed: a1,
            values: v1,
        } = self;
        let StringSubtype {
            allowed: a2,
            values: v2,
        } = other;
        (match (a1, !a2) {
            (true, true) => StringSubtype {
                allowed: true,
                values: vec_intersect(v1, v2),
            },
            (false, false) => StringSubtype {
                allowed: false,
                values: vec_union(v1, v2),
            },
            (true, false) => StringSubtype {
                allowed: true,
                values: vec_diff(v1, v2),
            },
            (false, true) => StringSubtype {
                allowed: true,
                values: vec_diff(v2, v1),
            },
        })
        .to_subtype_result()
    }

    fn sub_intersect(&self, other: &Self) -> SubtypeResult<Self> {
        let StringSubtype {
            allowed: a1,
            values: v1,
        } = self;

        let StringSubtype {
            allowed: a2,
            values: v2,
        } = other;
        (match (*a1, *a2) {
            (true, true) => StringSubtype {
                allowed: true,
                values: vec_intersect(v1, v2),
            },
            (false, false) => StringSubtype {
                allowed: false,
                values: vec_union(v1, v2),
            },
            (true, false) => StringSubtype {
                allowed: true,
                values: vec_diff(v1, v2),
            },
            (false, true) => StringSubtype {
                allowed: true,
                values: vec_diff(v2, v1),
            },
        })
        .to_subtype_result()
    }

    fn sub_union(&self, other: &Self) -> SubtypeResult<Self> {
        let StringSubtype {
            allowed: a1,
            values: v1,
        } = self;

        let StringSubtype {
            allowed: a2,
            values: v2,
        } = other;
        (match (*a1, *a2) {
            (true, true) => StringSubtype {
                allowed: true,
                values: vec_union(v1, v2),
            },
            (false, false) => StringSubtype {
                allowed: false,
                values: vec_intersect(v1, v2),
            },
            (true, false) => StringSubtype {
                allowed: false,
                values: vec_diff(v2, v1),
            },
            (false, true) => StringSubtype {
                allowed: false,
                values: vec_diff(v1, v2),
            },
        })
        .to_subtype_result()
    }
}

#[derive(Clone)]
pub struct ListSubtype {}

impl ListSubtype {
    pub fn new_from_rest_ty(ty: Ty) -> Self {
        todo!()
    }

    fn is_empty(&self) -> bool {
        todo!()
    }

    fn display(&self) -> String {
        // let mut inner = vec![];
        // for i in &l.items {
        //     let r = i.rest.display_impl(false);
        //     inner.push(format!("list[{}]", r));
        // }

        // inner.join(" | ")

        todo!()
    }
}

impl SubOps for ListSubtype {
    fn sub_complement(&self) -> Self {
        todo!()
    }
    fn sub_diff(&self, other: &Self) -> SubtypeResult<Self> {
        todo!()
    }

    fn sub_intersect(&self, other: &Self) -> SubtypeResult<Self> {
        // SubtypeResult::Proper(
        //     ListSubtype {
        //         items: vec_intersect(&self.items, &other.items),
        //     }
        //     .into(),
        // )

        todo!()
    }

    fn sub_union(&self, other: &Self) -> SubtypeResult<Self> {
        // SubtypeResult::Proper(
        //     ListSubtype {
        //         items: vec_union(&self.items, &other.items),
        //     }
        //     .into(),
        // )
        todo!()
    }
}

#[bitfield(u8)]
#[derive(Eq, PartialEq)]
pub struct TypeBitSet {
    pub boolean: bool,
    pub number: bool,
    pub string: bool,
    pub null: bool,
    pub list: bool,
    pub map: bool,
    pub function: bool,
    pub _padding: bool,
}
impl TypeBitSet {
    pub fn new_every() -> Self {
        TypeBitSet::new()
            .with_boolean(true)
            .with_number(true)
            .with_string(true)
            .with_null(true)
            .with_list(true)
            .with_map(true)
            .with_function(true)
    }
    pub fn new_none() -> Self {
        TypeBitSet::new()
    }
}

#[derive(Clone)]
pub struct SubtypeData {
    pub boolean: Option<bool>,
    pub string: Option<StringSubtype>,
    pub list: Option<ListSubtype>,
}

impl SubtypeData {
    pub fn new_empty() -> Self {
        SubtypeData {
            boolean: None,
            string: None,
            list: None,
        }
    }

    pub fn is_empty(&self) -> bool {
        self.boolean.is_none()
            && match &self.string {
                None => true,
                Some(s) => s.values.is_empty(),
            }
            && match &self.list {
                None => true,
                Some(s) => s.is_empty(),
            }
    }

    pub fn some_as_bitset(&self) -> TypeBitSet {
        let mut some = TypeBitSet::new_none();

        if let Some(_) = self.boolean {
            some.set_boolean(true);
        }

        if let Some(_) = &self.string {
            some.set_string(true);
        }

        if let Some(_) = &self.list {
            some.set_list(true);
        }

        some
    }

    pub fn with_boolean(mut self, b: bool) -> Self {
        self.boolean = Some(b);
        self
    }

    pub fn with_string(mut self, s: StringSubtype) -> Self {
        self.string = Some(s);
        self
    }

    pub fn with_list(mut self, l: ListSubtype) -> Self {
        self.list = Some(l);
        self
    }

    fn diff<T: Clone + SubOps>(a: &Option<T>, b: &Option<T>) -> SubtypeResult<T> {
        match (&a, &b) {
            (Some(a), None) => SubtypeResult::Proper(a.clone().into()),
            (None, Some(b)) => SubtypeResult::Proper(b.sub_complement().into()),
            (Some(a), Some(b)) => a.sub_diff(b),
            (None, None) => SubtypeResult::Bot,
        }
    }

    fn intersect<T: Clone + SubOps>(a: &Option<T>, b: &Option<T>) -> SubtypeResult<T> {
        match (&a, &b) {
            (Some(a), None) => SubtypeResult::Proper(a.clone().into()),
            (None, Some(b)) => SubtypeResult::Proper(b.clone().into()),
            (Some(a), Some(b)) => a.sub_intersect(b),
            (None, None) => SubtypeResult::Bot,
        }
    }

    fn union<T: Clone + SubOps>(a: &Option<T>, b: &Option<T>) -> SubtypeResult<T> {
        match (&a, &b) {
            (None, None) => SubtypeResult::Bot,
            (Some(a), None) => SubtypeResult::Proper(a.clone().into()),
            (None, Some(b)) => SubtypeResult::Proper(b.clone().into()),
            (Some(a), Some(b)) => a.sub_union(b),
        }
    }

    pub fn diff_bool(&self, other: &Self) -> SubtypeResult<bool> {
        Self::diff(&self.boolean, &other.boolean)
    }
    pub fn diff_string(&self, other: &Self) -> SubtypeResult<StringSubtype> {
        Self::diff(&self.string, &other.string)
    }
    pub fn diff_list(&self, other: &Self) -> SubtypeResult<ListSubtype> {
        Self::diff(&self.list, &other.list)
    }

    pub fn intersect_bool(&self, other: &Self) -> SubtypeResult<bool> {
        Self::intersect(&self.boolean, &other.boolean)
    }
    pub fn intersect_string(&self, other: &Self) -> SubtypeResult<StringSubtype> {
        Self::intersect(&self.string, &other.string)
    }
    pub fn intersect_list(&self, other: &Self) -> SubtypeResult<ListSubtype> {
        Self::intersect(&self.list, &other.list)
    }

    pub fn union_bool(&self, other: &Self) -> SubtypeResult<bool> {
        Self::union(&self.boolean, &other.boolean)
    }
    pub fn union_string(&self, other: &Self) -> SubtypeResult<StringSubtype> {
        Self::union(&self.string, &other.string)
    }
    pub fn union_list(&self, other: &Self) -> SubtypeResult<ListSubtype> {
        Self::union(&self.list, &other.list)
    }
}

#[derive(Clone)]
pub struct Ty {
    pub all: TypeBitSet,
    pub subtype_data: SubtypeData,
}

impl Ty {
    pub fn is_never(&self) -> bool {
        self.all == TypeBitSet::new_none() && self.subtype_data.is_empty()
    }
    pub fn is_unknown(&self) -> bool {
        self.all == TypeBitSet::new_every()
    }

    fn some_as_bitset(&self) -> TypeBitSet {
        self.subtype_data.some_as_bitset()
    }

    pub fn is_empty(&self) -> bool {
        if self.all.into_bits() != 0 {
            return false;
        }

        self.subtype_data.is_empty()
    }

    pub fn complement(&self) -> Ty {
        TC::new_unknown().diff(&self)
    }
    pub fn is_subtype(&self, b: &Ty) -> bool {
        let d = self.diff(b);
        d.is_empty()
    }

    pub fn is_same_type(&self, b: &Ty) -> bool {
        self.is_subtype(b) && b.is_subtype(self)
    }
    pub fn intersect(&self, b: &Ty) -> Ty {
        let all = self.all.into_bits() & b.all.into_bits();

        let some = (self.some_as_bitset().into_bits() | self.all.into_bits())
            & (b.some_as_bitset().into_bits() | b.all.into_bits());

        let some = some & !all;

        if some == 0 {
            return Ty {
                all: TypeBitSet::from_bits(all),
                subtype_data: SubtypeData::new_empty(),
            };
        }

        let some = TypeBitSet::from_bits(some);

        let mut subtype_data = SubtypeData::new_empty();
        let mut all = TypeBitSet::from_bits(all);

        if some.boolean() {
            match self.subtype_data.intersect_bool(&b.subtype_data) {
                SubtypeResult::Top => {
                    all.set_boolean(true);
                }
                SubtypeResult::Bot => {
                    // pass
                }
                SubtypeResult::Proper(p) => {
                    subtype_data.boolean = Some(*p);
                }
            }
        }
        if some.string() {
            match self.subtype_data.intersect_string(&b.subtype_data) {
                SubtypeResult::Top => {
                    all.set_string(true);
                }
                SubtypeResult::Bot => {
                    // pass
                }
                SubtypeResult::Proper(p) => {
                    subtype_data.string = Some(*p);
                }
            }
        }

        if some.list() {
            match self.subtype_data.intersect_list(&b.subtype_data) {
                SubtypeResult::Top => {
                    all.set_list(true);
                }
                SubtypeResult::Bot => {
                    // pass
                }
                SubtypeResult::Proper(p) => {
                    subtype_data.list = Some(*p);
                }
            }
        }

        Ty {
            all: all,
            subtype_data,
        }
    }
    pub fn diff(&self, b: &Ty) -> Ty {
        let all = self.all.into_bits() & !(b.all.into_bits() | b.some_as_bitset().into_bits());
        let mut some =
            (self.all.into_bits() | self.some_as_bitset().into_bits()) & !(b.all.into_bits());

        some &= !all;
        if some == 0 {
            return Ty {
                all: TypeBitSet::from_bits(all),
                subtype_data: SubtypeData::new_empty(),
            };
        }

        let mut subtype_data = SubtypeData::new_empty();
        let mut all = TypeBitSet::from_bits(all);
        let some = TypeBitSet::from_bits(some);
        if some.boolean() {
            match self.subtype_data.diff_bool(&b.subtype_data) {
                SubtypeResult::Top => {
                    all.set_boolean(true);
                }
                SubtypeResult::Bot => {
                    // pass
                }
                SubtypeResult::Proper(p) => {
                    subtype_data.boolean = Some(*p);
                }
            }
        }

        if some.string() {
            match self.subtype_data.diff_string(&b.subtype_data) {
                SubtypeResult::Top => {
                    all.set_string(true);
                }
                SubtypeResult::Bot => {
                    // pass
                }
                SubtypeResult::Proper(p) => {
                    subtype_data.string = Some(*p);
                }
            }
        }

        if some.list() {
            match self.subtype_data.diff_list(&b.subtype_data) {
                SubtypeResult::Top => {
                    all.set_list(true);
                }
                SubtypeResult::Bot => {
                    // pass
                }
                SubtypeResult::Proper(p) => {
                    subtype_data.list = Some(*p);
                }
            }
        }
        Ty {
            all: all,
            subtype_data,
        }
    }

    pub fn union(&self, b: &Ty) -> Ty {
        let all = self.all.into_bits() | b.all.into_bits();
        let some = (self.some_as_bitset().into_bits() | b.some_as_bitset().into_bits()) & !all;

        if some == 0 {
            return Ty {
                all: TypeBitSet::from_bits(all),
                subtype_data: SubtypeData::new_empty(),
            };
        }

        let mut subtype_data = SubtypeData::new_empty();
        let mut all = TypeBitSet::from_bits(all);

        let some = TypeBitSet::from_bits(some);

        if some.boolean() {
            match self.subtype_data.union_bool(&b.subtype_data) {
                SubtypeResult::Top => {
                    all.set_boolean(true);
                }
                SubtypeResult::Bot => {
                    // pass
                }
                SubtypeResult::Proper(p) => {
                    subtype_data.boolean = Some(*p);
                }
            }
        }
        if some.string() {
            match self.subtype_data.union_string(&b.subtype_data) {
                SubtypeResult::Top => {
                    all.set_string(true);
                }
                SubtypeResult::Bot => {
                    // pass
                }
                SubtypeResult::Proper(p) => {
                    subtype_data.string = Some(*p);
                }
            }
        }
        if some.list() {
            match self.subtype_data.union_list(&b.subtype_data) {
                SubtypeResult::Top => {
                    all.set_list(true);
                }
                SubtypeResult::Bot => {
                    // pass
                }
                SubtypeResult::Proper(p) => {
                    subtype_data.list = Some(*p);
                }
            }
        }
        Ty {
            all: all,
            subtype_data,
        }
    }

    fn display_impl(&self, wrap: bool) -> String {
        let mut acc = vec![];

        if self.all.boolean() {
            acc.push("boolean".to_owned());
        }
        if self.all.number() {
            acc.push("number".to_owned());
        }
        if self.all.string() {
            acc.push("string".to_owned());
        }
        if self.all.null() {
            acc.push("null".to_owned());
        }
        if self.all.list() {
            acc.push("list".to_owned());
        }
        if self.all.map() {
            acc.push("map".to_owned());
        }
        if self.all.function() {
            acc.push("function".to_owned());
        }
        if let Some(b) = self.subtype_data.boolean {
            acc.push(if b {
                "true".to_owned()
            } else {
                "false".to_owned()
            });
        }

        if let Some(s) = &self.subtype_data.string {
            if !s.allowed {
                let joined = format!(
                    "!({})",
                    s.values
                        .iter()
                        .map(|v| format!("'{}'", v))
                        .collect::<Vec<String>>()
                        .join(" | ")
                );
                acc.push(joined);
            } else {
                acc.extend(s.values.iter().map(|v| format!("'{}'", v)));
            }
        }

        if let Some(l) = &self.subtype_data.list {
            acc.push(l.display());
        }

        let j = acc.join(" | ");
        if wrap {
            format!("({})", j)
        } else {
            j
        }
    }
    pub fn display(&self) -> String {
        self.display_impl(true)
    }
}

pub struct TC {}

impl TC {
    pub fn new_never() -> Ty {
        Ty {
            all: TypeBitSet::new(),
            subtype_data: SubtypeData::new_empty(),
        }
    }

    pub fn new_unknown() -> Ty {
        Ty {
            all: TypeBitSet::new_every(),
            subtype_data: SubtypeData::new_empty(),
        }
    }

    pub fn new_boolean() -> Ty {
        Ty {
            all: TypeBitSet::new().with_boolean(true),
            subtype_data: SubtypeData::new_empty(),
        }
    }

    pub fn new_bool_const(b: bool) -> Ty {
        Ty {
            all: TypeBitSet::new(),
            subtype_data: SubtypeData::new_empty().with_boolean(b),
        }
    }

    pub fn new_number() -> Ty {
        Ty {
            all: TypeBitSet::new().with_number(true),
            subtype_data: SubtypeData::new_empty(),
        }
    }

    pub fn new_string() -> Ty {
        Ty {
            all: TypeBitSet::new().with_string(true),
            subtype_data: SubtypeData::new_empty(),
        }
    }

    pub fn new_null() -> Ty {
        Ty {
            all: TypeBitSet::new().with_null(true),
            subtype_data: SubtypeData::new_empty(),
        }
    }

    pub fn new_list_top() -> Ty {
        Ty {
            all: TypeBitSet::new().with_list(true),
            subtype_data: SubtypeData::new_empty(),
        }
    }

    pub fn new_map() -> Ty {
        Ty {
            all: TypeBitSet::new().with_map(true),
            subtype_data: SubtypeData::new_empty(),
        }
    }

    pub fn new_function() -> Ty {
        Ty {
            all: TypeBitSet::new().with_function(true),
            subtype_data: SubtypeData::new_empty(),
        }
    }

    pub fn new_string_const(vec: Vec<String>) -> Ty {
        Ty {
            all: TypeBitSet::new(),
            subtype_data: SubtypeData::new_empty().with_string(StringSubtype {
                allowed: true,
                values: vec,
            }),
        }
    }

    pub fn new_parametric_list(rest: Ty) -> Ty {
        Ty {
            all: TypeBitSet::new(),
            subtype_data: SubtypeData::new_empty().with_list(ListSubtype::new_from_rest_ty(rest)),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_never() {
        let never = TC::new_never();
        assert!(never.is_never());
        assert!(!never.is_unknown());
    }

    #[test]
    fn test_boolean() {
        let boolean = TC::new_boolean();
        assert!(!boolean.is_never());
        assert!(!boolean.is_unknown());
    }

    #[test]
    fn test_unknown() {
        let unknown = TC::new_unknown();
        assert!(!unknown.is_never());
        assert!(unknown.is_unknown());
    }

    #[test]
    fn test_union() {
        let a = TC::new_boolean();
        let b = TC::new_number();
        let c = a.union(&b);
        assert!(!c.is_never());
        assert!(!c.is_unknown());

        assert!(a.is_subtype(&c));
        assert!(!c.is_subtype(&a));

        insta::assert_snapshot!(a.display(), @"(boolean)");
        insta::assert_snapshot!(b.display(), @"(number)");
        insta::assert_snapshot!(c.display(), @"(boolean | number)");

        insta::assert_snapshot!(c.diff(&a).display(), @"(number)");
        insta::assert_snapshot!(b.diff(&a).display(), @"(number)");
    }

    #[test]
    fn bool_const() {
        let t = TC::new_bool_const(true);
        let f = TC::new_bool_const(false);
        let b = t.union(&f);
        assert!(!b.is_never());
        assert!(!b.is_unknown());

        assert!(t.is_subtype(&b));
        assert!(f.is_subtype(&b));

        assert!(!b.is_subtype(&t));
        assert!(!b.is_subtype(&f));

        insta::assert_snapshot!(t.display(), @"(true)");
        insta::assert_snapshot!(f.display(), @"(false)");
        insta::assert_snapshot!(b.display(), @"(boolean)");

        insta::assert_snapshot!(b.diff(&t).display(), @"(false)");

        assert!(t.intersect(&f).is_never());

        assert!(b.is_same_type(&TC::new_boolean()));

        assert!(b.intersect(&t).is_same_type(&t));
        assert!(b.intersect(&f).is_same_type(&f));
    }

    #[test]
    fn string_const() {
        let a = TC::new_string_const(vec!["a".to_string()]);
        insta::assert_snapshot!(a.display(), @"('a')");

        let b = TC::new_string_const(vec!["b".to_string()]);
        insta::assert_snapshot!(b.display(), @"('b')");

        let u = a.union(&b);
        insta::assert_snapshot!(u.display(), @"('a' | 'b')");

        let au = a.intersect(&u);
        insta::assert_snapshot!(au.display(), @"('a')");

        let i = a.intersect(&b);
        insta::assert_snapshot!(i.display(), @"()");
        assert!(i.is_never());

        let d = a.diff(&b);
        insta::assert_snapshot!(d.display(), @"('a')");

        let e = u.diff(&a);
        insta::assert_snapshot!(e.display(), @"('b')");

        let c = a.complement();
        insta::assert_snapshot!(c.display(), @"(boolean | number | null | list | map | function | !('a'))");
    }

    #[test]
    fn string_and_bool_const() {
        let t = TC::new_bool_const(true);
        let a = TC::new_string_const(vec!["a".to_string()]);

        let u = t.union(&a);

        insta::assert_snapshot!(u.display(), @"(true | 'a')");
    }

    #[test]
    fn bool_and_string() {
        let b = TC::new_boolean();

        let t = TC::new_bool_const(true);

        let a = TC::new_string_const(vec!["a".to_string()]);

        let u = b.union(&a).union(&t);

        insta::assert_snapshot!(u.display(), @"(boolean | 'a')");
    }

    #[test]
    fn list_of_bool() {
        let b = TC::new_boolean();
        let l = TC::new_list_top();

        let u = b.union(&l);

        insta::assert_snapshot!(u.display(), @"(boolean | list)");

        let list_bools = TC::new_parametric_list(b.clone());
        insta::assert_snapshot!(list_bools.display(), @"(list[boolean])");

        let list_nulls = TC::new_parametric_list(TC::new_null());
        let u = list_bools.union(&list_nulls);
        insta::assert_snapshot!(u.display(), @"(list[boolean] | list[null])");

        let intersected = u.intersect(&list_bools);
        insta::assert_snapshot!(intersected.display(), @"(list[boolean])");

        let diffed = u.diff(&list_bools);
        insta::assert_snapshot!(diffed.display(), @"(list[null])");

        let complemented1 = list_bools.complement();
        insta::assert_snapshot!(complemented1.display(), @"");
    }
}
