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
    fn is_never(&self) -> bool;
    fn sub_complement(&self) -> SubtypeResult<Self>;
    fn sub_diff(&self, other: &Self) -> SubtypeResult<Self>;
    fn sub_intersect(&self, other: &Self) -> SubtypeResult<Self>;
    fn sub_union(&self, other: &Self) -> SubtypeResult<Self>;
}

impl SubOps for bool {
    fn sub_complement(&self) -> SubtypeResult<Self> {
        SubtypeResult::Proper((!self).into())
    }
    fn sub_diff(&self, other: &Self) -> SubtypeResult<Self> {
        if self == other {
            SubtypeResult::Bot
        } else {
            SubtypeResult::Proper(self.clone().into())
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

    fn is_never(&self) -> bool {
        false
    }
}

#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub struct StringSubtype {
    pub allowed: bool,
    pub values: Vec<String>,
}

impl StringSubtype {
    pub fn to_subtype_result(self) -> SubtypeResult<StringSubtype> {
        if self.values.is_empty() {
            if self.allowed {
                SubtypeResult::Bot
            } else {
                SubtypeResult::Top
            }
        } else {
            SubtypeResult::Proper(self.into())
        }
    }
}

impl SubOps for StringSubtype {
    fn sub_complement(&self) -> SubtypeResult<Self> {
        StringSubtype {
            allowed: !self.allowed,
            values: self.values.clone(),
        }
        .to_subtype_result()
    }
    fn sub_diff(&self, other: &Self) -> SubtypeResult<Self> {
        match other.sub_complement() {
            SubtypeResult::Top => todo!(),
            SubtypeResult::Bot => todo!(),
            SubtypeResult::Proper(i) => self.sub_intersect(&i),
        }
        // self.sub_intersect(&other.sub_complement())
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

    fn is_never(&self) -> bool {
        self.values.is_empty()
    }
}

#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub struct ListSubtypeAtom {
    pub rest: Ty,
}

impl ListSubtypeAtom {
    fn display(&self) -> String {
        // let prefix_parts = self
        //     .prefix
        //     .iter()
        //     .map(|p| p.display())
        //     .collect::<Vec<String>>();

        let mut rest = self.rest.display();
        if !rest.is_empty() {
            rest = format!("{}...", rest);
        }

        // let prefix = if prefix_parts.is_empty() {
        //     "".to_owned()
        // } else {
        //     let comma = if rest.is_empty() { "" } else { ", " };
        //     format!("{}{}", prefix_parts.join(", "), comma)
        // };
        format!(
            "list[{}]",
            // prefix,
            rest
        )
    }
}

#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub struct ListDnf {
    pub pos: ListSubtypeAtom,
    pub neg: Vec<ListSubtypeAtom>,
}
impl ListDnf {
    fn is_never(&self) -> bool {
        todo!()
    }
}

#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub struct ListSubtype {
    pub items: Vec<ListDnf>,
}

impl ListSubtype {
    pub fn new_parametric_list(ty: Ty) -> Self {
        ListSubtype {
            items: vec![ListDnf {
                pos: ListSubtypeAtom { rest: ty },
                neg: vec![],
            }],
        }
    }
    pub fn new_closed_tuple(prefix: Vec<Ty>) -> Self {
        todo!()
    }
    pub fn new_open_tuple(prefix: Vec<Ty>, rest: Ty) -> Self {
        todo!()
    }
    fn display(&self) -> String {
        let mut outer: Vec<String> = vec![];
        for it in &self.items {
            let mut inner: Vec<String> = vec![];

            inner.push(it.pos.display());

            for n in &it.neg {
                inner.push(format!("!{}", n.display()));
            }

            if inner.len() > 1 {
                outer.push(format!("({})", inner.join(" & ")));
            } else {
                outer.push(inner.join(" & "));
            }
        }

        outer.join(" | ")
    }
}

impl SubOps for ListSubtype {
    fn sub_complement(&self) -> SubtypeResult<Self> {
        let mut items = vec![];

        let mut positives = vec![];
        for it in &self.items {
            positives.push(it.pos.clone());
            for it in &it.neg {
                items.push(ListDnf {
                    pos: it.clone(),
                    neg: vec![],
                });
            }
        }

        let dnf = ListDnf {
            pos: ListSubtypeAtom {
                rest: TC::new_unknown(),
            },
            neg: positives,
        };
        items.push(dnf);

        SubtypeResult::Proper(ListSubtype { items }.into())
    }

    fn sub_intersect(&self, other: &Self) -> SubtypeResult<Self> {
        todo!()
    }

    fn is_never(&self) -> bool {
        // is never if all items are never
        self.items.iter().all(|it| {
            //
            it.is_never()
        })
    }

    fn sub_union(&self, other: &Self) -> SubtypeResult<Self> {
        SubtypeResult::Proper(
            ListSubtype {
                items: vec_union(&self.items, &other.items),
            }
            .into(),
        )
    }
    fn sub_diff(&self, other: &Self) -> SubtypeResult<Self> {
        // match other.sub_complement() {
        //     SubtypeResult::Top => todo!(),
        //     SubtypeResult::Bot => todo!(),
        //     SubtypeResult::Proper(_) => todo!(),
        // }
        // // self.sub_intersect(&other.sub_complement())
        todo!()
    }
}

#[bitfield(u8)]
#[derive(PartialEq, Eq, PartialOrd, Ord)]
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

#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Debug)]
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

    pub fn is_never(&self) -> bool {
        self.boolean.is_none()
            && match &self.string {
                None => true,
                Some(s) => s.is_never(),
            }
            && match &self.list {
                None => true,
                Some(s) => s.is_never(),
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
            (None, Some(b)) => {
                match b.sub_complement() {
                    SubtypeResult::Top => todo!(),
                    SubtypeResult::Bot => todo!(),
                    i @ SubtypeResult::Proper(_) => i,
                }
                // SubtypeResult::Proper(b.sub_complement().into())
            }
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

#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub struct Ty {
    pub all: TypeBitSet,
    pub subtype_data: SubtypeData,
}

impl Ty {
    pub fn is_unknown(&self) -> bool {
        self.is_same_type(&TC::new_unknown())
    }

    fn some_as_bitset(&self) -> TypeBitSet {
        self.subtype_data.some_as_bitset()
    }

    pub fn is_never(&self) -> bool {
        if self.all.into_bits() != 0 {
            return false;
        }

        self.subtype_data.is_never()
    }

    pub fn complement(&self) -> Ty {
        TC::new_unknown().diff(&self)
    }
    pub fn is_subtype(&self, b: &Ty) -> bool {
        let d = self.diff(b);
        d.is_never()
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
                    "(string - ({}))",
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
        self.display_impl(false)
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
            subtype_data: SubtypeData::new_empty()
                .with_list(ListSubtype::new_parametric_list(rest)),
        }
    }
    pub fn new_closed_tuple(prefix: Vec<Ty>) -> Ty {
        Ty {
            all: TypeBitSet::new(),
            subtype_data: SubtypeData::new_empty().with_list(ListSubtype::new_closed_tuple(prefix)),
        }
    }

    pub fn new_open_tuple(prefix: Vec<Ty>, rest: Ty) -> Ty {
        Ty {
            all: TypeBitSet::new(),
            subtype_data: SubtypeData::new_empty()
                .with_list(ListSubtype::new_open_tuple(prefix, rest)),
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

        insta::assert_snapshot!(a.display(), @"boolean");
        insta::assert_snapshot!(b.display(), @"number");
        insta::assert_snapshot!(c.display(), @"boolean | number");

        insta::assert_snapshot!(c.diff(&a).display(), @"number");
        insta::assert_snapshot!(b.diff(&a).display(), @"number");
    }

    #[test]
    fn bool_const0() {
        let a = TC::new_bool_const(true);
        insta::assert_snapshot!(a.display(), @"true");

        let c = a.complement();
        insta::assert_snapshot!(c.display(), @"number | string | null | list | map | function | false");

        let all = c.union(&a);
        insta::assert_snapshot!(all.display(), @"boolean | number | string | null | list | map | function");

        assert!(all.is_unknown());
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

        insta::assert_snapshot!(t.display(), @"true");
        insta::assert_snapshot!(f.display(), @"false");
        insta::assert_snapshot!(b.display(), @"boolean");

        insta::assert_snapshot!(b.diff(&t).display(), @"false");

        assert!(t.intersect(&f).is_never());

        assert!(b.is_same_type(&TC::new_boolean()));

        assert!(b.intersect(&t).is_same_type(&t));
        assert!(b.intersect(&f).is_same_type(&f));
    }

    #[test]
    fn string_const0() {
        let a = TC::new_string_const(vec!["a".to_string()]);
        insta::assert_snapshot!(a.display(), @"'a'");

        let c = a.complement();
        insta::assert_snapshot!(c.display(), @"boolean | number | null | list | map | function | (string - ('a'))");

        let all = c.union(&a);
        insta::assert_snapshot!(all.display(), @"boolean | number | string | null | list | map | function");

        assert!(all.is_unknown());
    }
    #[test]
    fn string_const() {
        let a = TC::new_string_const(vec!["a".to_string()]);
        insta::assert_snapshot!(a.display(), @"'a'");

        let b = TC::new_string_const(vec!["b".to_string()]);
        insta::assert_snapshot!(b.display(), @"'b'");

        let u = a.union(&b);
        insta::assert_snapshot!(u.display(), @"'a' | 'b'");

        let au = a.intersect(&u);
        insta::assert_snapshot!(au.display(), @"'a'");

        let i = a.intersect(&b);
        insta::assert_snapshot!(i.display(), @"");
        assert!(i.is_never());

        let d = a.diff(&b);
        insta::assert_snapshot!(d.display(), @"'a'");

        let e = u.diff(&a);
        insta::assert_snapshot!(e.display(), @"'b'");
    }

    #[test]
    fn string_and_bool_const() {
        let t = TC::new_bool_const(true);
        let a = TC::new_string_const(vec!["a".to_string()]);

        let u = t.union(&a);

        insta::assert_snapshot!(u.display(), @"true | 'a'");
    }

    #[test]
    fn bool_and_string() {
        let b = TC::new_boolean();

        let t = TC::new_bool_const(true);

        let a = TC::new_string_const(vec!["a".to_string()]);

        let u = b.union(&a).union(&t);

        insta::assert_snapshot!(u.display(), @"boolean | 'a'");
    }

    #[test]
    fn empty_test_bool() {
        let top = TC::new_unknown();
        let t = TC::new_bool_const(true);
        let sub1 = top.diff(&t);
        insta::assert_snapshot!(sub1.display(), @"number | string | null | list | map | function | false");

        let t_complement = t.complement();
        let sub2 = sub1.diff(&t_complement);
        assert!(sub2.is_never());
    }

    #[test]
    fn empty_test_string() {
        let top = TC::new_unknown();
        let t = TC::new_string_const(vec!["a".to_string()]);
        let sub1 = top.diff(&t);
        insta::assert_snapshot!(sub1.display(), @"boolean | number | null | list | map | function | (string - ('a'))");

        let t_complement = t.complement();
        let sub2 = sub1.diff(&t_complement);
        assert!(sub2.is_never());

        let all = sub1.union(&t);
        assert!(all.is_unknown());
    }

    // #[test]
    // fn tuple2() {
    //     let b = TC::new_boolean();
    //     let t1 = TC::new_parametric_list(b.clone());
    //     insta::assert_snapshot!(t1.display(), @"list[boolean...]");
    //     let n = TC::new_number();
    //     let t2 = TC::new_parametric_list(n.clone());
    //     insta::assert_snapshot!(t2.display(), @"list[number...]");

    //     let union = t1.union(&t2);
    //     insta::assert_snapshot!(union.display(), @"list[boolean...] | list[number...]");
    //     assert!(!union.is_unknown());

    //     let union_complement1 = union.complement();
    //     insta::assert_snapshot!(union_complement1.display(), @"boolean | number | string | null | map | function | (list[boolean | number | string | null | list | map | function...] & !list[boolean...] & !list[number...])");
    //     assert!(!union_complement1.is_unknown());

    //     let and_back_again = union_complement1.complement();
    //     insta::assert_snapshot!(and_back_again.display(), @"list[boolean...] | list[number...] | (list[boolean | number | string | null | list | map | function...] & !list[boolean | number | string | null | list | map | function...])");

    //     let union_complement2 = and_back_again.complement();
    //     insta::assert_snapshot!(union_complement2.display(), @"boolean | number | string | null | map | function | list[boolean | number | string | null | list | map | function...] | (list[boolean | number | string | null | list | map | function...] & !list[boolean...] & !list[number...] & !list[boolean | number | string | null | list | map | function...])");

    //     let all_again0 = union_complement1.union(&t1);
    //     insta::assert_snapshot!(all_again0.display(), @"boolean | number | string | null | map | function | list[boolean...] | (list[boolean | number | string | null | list | map | function...] & !list[boolean...] & !list[number...])");
    //     assert!(!all_again0.is_unknown());

    //     let all_again = union_complement1.union(&t1).union(&t2);
    //     insta::assert_snapshot!(all_again.display(), @"boolean | number | string | null | map | function | list[boolean...] | list[number...] | (list[boolean | number | string | null | list | map | function...] & !list[boolean...] & !list[number...])");
    //     // assert!(all_again.is_unknown());
    // }

    // #[test]
    // fn tuple() {
    //     let b = TC::new_boolean();
    //     let t1 = TC::new_closed_tuple(vec![b.clone()]);
    //     insta::assert_snapshot!(t1.display(), @"list[boolean]");

    //     let i1comp = t1.complement();
    //     insta::assert_snapshot!(i1comp.display(), @"boolean | number | string | null | map | function | (list - list[boolean])");

    //     let t2 = TC::new_closed_tuple(vec![b.clone(), b.clone()]);
    //     insta::assert_snapshot!(t2.display(), @"list[boolean, boolean]");
    // }
    // #[test]
    // fn list_of_bool() {
    //     let b = TC::new_boolean();
    //     let l = TC::new_list_top();

    //     let u = b.union(&l);

    //     insta::assert_snapshot!(u.display(), @"boolean | list");

    //     let list_bools = TC::new_parametric_list(b.clone());
    //     insta::assert_snapshot!(list_bools.display(), @"list[boolean...]");
    //     insta::assert_snapshot!(list_bools.complement().display(), @"boolean | number | string | null | map | function | (list - list[boolean...])");

    //     let list_nulls = TC::new_parametric_list(TC::new_null());
    //     let u = list_bools.union(&list_nulls);
    //     insta::assert_snapshot!(u.display(), @"list[boolean...] | list[null...]");

    //     let intersected = u.intersect(&list_bools);
    //     insta::assert_snapshot!(intersected.display(), @"list[boolean...]");

    //     let diffed = u.diff(&list_bools);
    //     insta::assert_snapshot!(diffed.display(), @"list[null...]");
    // }

    // #[test]
    // fn list_of_bool_diff() {
    //     let b = TC::new_boolean();
    //     let list_bools = TC::new_parametric_list(b.clone());

    //     let list_nulls = TC::new_parametric_list(TC::new_null());

    //     let u = list_bools.union(&list_nulls);
    //     insta::assert_snapshot!(u.display(), @"list[boolean...] | list[null...]");

    //     let diffed = u.diff(&list_bools);
    //     insta::assert_snapshot!(diffed.display(), @"list[null...]");
    //     assert!(!diffed.is_never());

    //     let diffed2 = diffed.diff(&list_nulls);
    //     assert!(diffed2.is_never());

    //     let diffed3 = diffed.diff(&TC::new_list_top());
    //     assert!(diffed3.is_never());
    // }

    // #[test]
    // fn empty_test_list() {
    //     let top = TC::new_unknown();

    //     let t = TC::new_parametric_list(TC::new_bool_const(true));
    //     let sub1 = top.diff(&t);
    //     insta::assert_snapshot!(sub1.display(), @"boolean | number | string | null | map | function | (list - list[true...])");

    //     let t_complement = t.complement();
    //     let sub2 = sub1.diff(&t_complement);
    //     assert!(sub2.is_never());
    // }
    // #[test]
    // fn empty_test_tuple() {
    //     let top = TC::new_unknown();

    //     let t = TC::new_closed_tuple(vec![TC::new_null(), TC::new_string()]);
    //     let sub1 = top.diff(&t);
    //     insta::assert_snapshot!(sub1.display(), @"boolean | number | string | null | map | function | (list - list[null, string])");

    //     let t_complement = t.complement();
    //     let sub2 = sub1.diff(&t_complement);
    //     assert!(sub2.is_never());
    // }
    // #[test]
    // fn empty_test_open_tuple() {
    //     let top = TC::new_unknown();

    //     let t = TC::new_open_tuple(vec![TC::new_string()], TC::new_string());
    //     let sub1 = top.diff(&t);
    //     insta::assert_snapshot!(sub1.display(), @"boolean | number | string | null | map | function | (list - list[string, string...])");

    //     let t_complement = t.complement();
    //     let sub2 = sub1.diff(&t_complement);
    //     assert!(sub2.is_never());
    // }
    // #[test]
    // fn intersect_test_list() {
    //     let a = TC::new_closed_tuple(vec![TC::new_string()]);
    //     insta::assert_snapshot!(a.display(), @"list[string]");

    //     let intersection = a.intersect(&a);
    //     insta::assert_snapshot!(intersection.display(), @"list[string]");

    //     assert!(intersection.is_same_type(&a));
    // }
    // #[test]
    // fn intersect_test_list2() {
    //     let a = TC::new_closed_tuple(vec![TC::new_string()]);
    //     let b = TC::new_closed_tuple(vec![TC::new_number()]);
    //     let c = a.union(&b);
    //     insta::assert_snapshot!(c.display(), @"list[number] | list[string]");

    //     let intersection = c.intersect(&c);
    //     insta::assert_snapshot!(intersection.display(), @"list[number] | list[string]");

    //     let intersection_complement = intersection.complement();
    //     insta::assert_snapshot!(intersection_complement.display(), @"boolean | number | string | null | map | function | (list - list[number]) | (list - list[string])");

    //     assert!(intersection.is_same_type(&c));
    // }
}
