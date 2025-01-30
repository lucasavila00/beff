use std::collections::BTreeMap;

use crate::{
    cf::CF,
    sub::{vec_union, Ty},
};

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct MappingKV(pub BTreeMap<String, Ty>);
impl MappingKV {
    pub fn new() -> Self {
        MappingKV(BTreeMap::new())
    }

    fn to_cf(&self, tag: &MappingTag) -> CF {
        if self.0.is_empty() && tag == &MappingTag::Open {
            CF::MappingTop
        } else {
            let fields: BTreeMap<String, CF> =
                self.0.iter().map(|(k, v)| (k.clone(), v.to_cf())).collect();
            CF::Mapping {
                fields,
                tag: tag.clone(),
            }
        }
    }

    fn put(&self, k: String, v: Ty) -> Self {
        let mut new = self.clone();
        new.0.insert(k, v);
        new
    }
    fn put_mut(&mut self, k: String, v: Ty) {
        self.0.insert(k, v);
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum MappingTag {
    Open,
    Closed,
}

impl MappingTag {
    pub fn to_type(&self) -> Ty {
        match self {
            MappingTag::Open => Ty::new_top(),
            MappingTag::Closed => Ty::new_null(),
        }
    }
}
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct MappingItemNeg {
    pub tag: MappingTag,
    pub fields: MappingKV,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct MappingItem {
    pub tag: MappingTag,
    pub fields: MappingKV,
    pub negs: Vec<MappingItemNeg>,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct MappingTy(pub Vec<MappingItem>);

struct IsEmptyEarlyStop;

impl MappingTy {
    pub fn new_bot() -> Self {
        MappingTy(vec![])
    }

    pub fn new_top() -> Self {
        MappingTy(vec![MappingItem {
            tag: MappingTag::Open,
            fields: MappingKV::new(),
            negs: vec![],
        }])
    }

    pub fn new_empty_map() -> Self {
        MappingTy(vec![MappingItem {
            tag: MappingTag::Closed,
            fields: MappingKV::new(),
            negs: vec![],
        }])
    }
    pub fn is_top(&self) -> bool {
        self.is_same_type(&Self::new_top())
    }
    pub fn complement(&self) -> MappingTy {
        Self::new_top().diff(self)
    }

    pub fn is_subtype(&self, other: &MappingTy) -> bool {
        self.diff(other).is_bot()
    }
    pub fn is_same_type(&self, other: &MappingTy) -> bool {
        self.is_subtype(other) && other.is_subtype(self)
    }
    fn diff_map_one_field(dnf1: Vec<MappingItem>, key: &str, value: &Ty) -> Vec<MappingItem> {
        let mut acc = vec![];

        for it in dnf1 {
            let MappingItem {
                tag: tag1,
                fields: mut fields1,
                negs: negs1,
            } = it;

            let from_fields = fields1
                .0
                .get(key)
                .cloned()
                .unwrap_or_else(|| tag1.to_type());

            let t_diff = from_fields.diff(value);
            fields1.put_mut(key.to_owned(), t_diff.clone());
            if !t_diff.is_bot() {
                acc.push(MappingItem {
                    tag: tag1,
                    fields: fields1,
                    negs: negs1,
                });
            }
        }

        acc
    }

    pub fn diff(&self, other: &MappingTy) -> MappingTy {
        let mut dnf1_acc = self.0.clone();

        for it in other.0.iter() {
            // Optimization: we are removing an open map with one field.
            if it.tag == MappingTag::Open && it.fields.0.len() == 1 && it.negs.is_empty() {
                let (key, ty) = it.fields.0.iter().next().unwrap();
                dnf1_acc = Self::diff_map_one_field(dnf1_acc, key, ty);
                continue;
            }
            let tag2 = &it.tag;
            let fields2 = &it.fields;
            let negs2 = &it.negs;

            let mut acc: Vec<MappingItem> = vec![];

            let dnf1_acc_content = std::mem::take(&mut dnf1_acc);

            for MappingItem {
                tag: tag1,
                fields: fields1,
                negs: negs1,
            } in dnf1_acc_content.into_iter()
            {
                let mut negs_new = vec![MappingItemNeg {
                    tag: tag2.clone(),
                    fields: fields2.clone(),
                }];
                negs_new.extend(negs1.clone());
                let is_empty = Self::is_bot_impl(&tag1, &fields1, &negs_new);
                if !is_empty {
                    acc.push(MappingItem {
                        tag: tag1.clone(),
                        fields: fields1.clone(),
                        negs: negs_new,
                    });
                }

                for MappingItemNeg {
                    tag: neg_tag2,
                    fields: neg_fields2,
                } in negs2.iter()
                {
                    if let Ok(MappingItemNeg { tag, fields }) =
                        map_literal_intersection(&tag1, &fields1, &neg_tag2, &neg_fields2)
                    {
                        acc.push(MappingItem {
                            tag,
                            fields,
                            negs: negs1.clone(),
                        });
                    }
                }
            }

            dnf1_acc = acc;
        }

        MappingTy(dnf1_acc)
    }

    pub fn union(&self, other: &MappingTy) -> MappingTy {
        let mut acc = vec_union(&self.0, &other.0);
        acc.retain(|it| !Self::is_bot_impl(&it.tag, &it.fields, &it.negs));
        MappingTy(acc)
    }

    pub fn intersect(&self, other: &MappingTy) -> MappingTy {
        let dnf1 = &self.0;
        let dnf2 = &other.0;

        let mut acc = vec![];
        for MappingItem {
            tag: tag1,
            fields: pos1,
            negs: negs1,
        } in dnf1
        {
            for MappingItem {
                tag: tag2,
                fields: pos2,
                negs: negs2,
            } in dnf2
            {
                if let Ok(MappingItemNeg { tag, fields }) =
                    map_literal_intersection(tag1, pos1, tag2, pos2)
                {
                    let entry = MappingItem {
                        tag,
                        fields,
                        negs: vec_union(negs1, negs2),
                    };

                    // Imagine a, b, c, where a is closed and b and c are open with
                    // no keys in common. The result in both cases will be a and we
                    // want to avoid adding duplicates, especially as intersection
                    // is a cartesian product.
                    if acc.contains(&entry) {
                        continue;
                    }
                    acc.push(entry);
                }
            }
        }
        MappingTy(acc)
    }

    pub fn is_bot(&self) -> bool {
        self.0
            .iter()
            .all(|it| Self::is_bot_impl(&it.tag, &it.fields, &it.negs))
    }

    fn is_bot_impl(tag: &MappingTag, fields: &MappingKV, negs: &[MappingItemNeg]) -> bool {
        match negs.split_first() {
            // No negations, so not empty unless there's an empty type
            None => fields.0.values().any(|it| it.is_bot()),
            Some((
                MappingItemNeg {
                    tag: neg_tag,
                    fields: neg_fields,
                },
                negs,
            )) => {
                // we have a negative 'all' erasing everything
                if *neg_tag == MappingTag::Open && neg_fields.0.is_empty() {
                    return true;
                }
                // an open map can never be erased by a closed one, as the open one would have an 'infinite' part
                // and the closed one wouldn't
                if *tag == MappingTag::Open && *neg_tag == MappingTag::Closed {
                    return Self::is_bot_impl(&MappingTag::Open, fields, negs);
                }

                ((neg_fields
                    .0
                    .iter()
                    .all(|(neg_key, neg_type): (&String, &Ty)| {
                        // Keys that are present in the negative map, but not in the positive one
                        if fields.0.contains_key(neg_key) {
                            true
                        } else {
                            // The key is not shared between positive and negative maps,
                            // if the negative type is optional, then there may be a value in common
                            match tag {
                                MappingTag::Closed => is_optional_static(neg_type),
                                // There may be value in common
                                MappingTag::Open => {
                                    let diff = Ty::new_top().diff(neg_type);
                                    diff.is_bot()
                                        || Self::is_bot_impl(
                                            tag,
                                            &fields.put(neg_key.clone(), diff),
                                            negs,
                                        )
                                }
                            }
                        }
                    }))
                    && fields.0.iter().all(|(key, typ)| {
                        match neg_fields.0.get(key) {
                            Some(neg_type) => {
                                let diff = typ.diff(neg_type);
                                diff.is_bot()
                                    || Self::is_bot_impl(tag, &fields.put(key.clone(), diff), negs)
                            }
                            None => {
                                if *neg_tag == MappingTag::Open {
                                    true
                                } else if *neg_tag == MappingTag::Closed && !is_optional_static(typ)
                                {
                                    false
                                } else {
                                    // an absent key in a open negative map can be ignored
                                    let diff = typ.diff(&tag.to_type());
                                    diff.is_bot()
                                        || Self::is_bot_impl(
                                            tag,
                                            &fields.put(key.clone(), diff),
                                            negs,
                                        )
                                }
                            }
                        }
                    }))
                    || Self::is_bot_impl(tag, fields, negs)
            }
        }
    }

    pub fn to_cf(&self) -> CF {
        let mut acc: Vec<CF> = vec![];

        for it in &self.0 {
            let mut acc2 = vec![];
            acc2.push(it.fields.to_cf(&it.tag));

            for n in &it.negs {
                match n.fields.to_cf(&n.tag) {
                    //     CF::Bot => {}
                    it => {
                        acc2.push(CF::not(it));
                    }
                }
            }

            acc.push(CF::and(acc2));
        }

        CF::or(acc)
    }
}

fn is_optional_static(neg_type: &Ty) -> bool {
    // it is optional if it includes null
    // TODO: create optional type?
    neg_type.bitmap.null()
}

fn map_literal_intersection(
    tag1: &MappingTag,
    pos1: &MappingKV,
    tag2: &MappingTag,
    pos2: &MappingKV,
) -> Result<MappingItemNeg, IsEmptyEarlyStop> {
    match (tag1, pos1, tag2, pos2) {
        // Both open: the result is open.
        (MappingTag::Open, map1, MappingTag::Open, map2) => {
            let new_fields = symmetrical_merge(map1, map2, |_, type1, type2| {
                non_empty_intersection(type1, type2)
            })?;
            Ok(MappingItemNeg {
                tag: MappingTag::Open,
                fields: new_fields,
            })
        }

        // Open and closed: result is closed, all fields from open should be in closed, except not_set ones.
        (MappingTag::Open, open, MappingTag::Closed, closed)
        | (MappingTag::Closed, closed, MappingTag::Open, open) => {
            let kvs = open.0.iter().collect::<Vec<_>>();
            let split_first = kvs.split_first();
            map_literal_intersection_loop(split_first, closed)
        }

        (MappingTag::Closed, map1, MappingTag::Closed, map2) => {
            let new_fields = symmetrical_intersection(map1, map2, |_, type1, type2| {
                non_empty_intersection(type1, type2)
            })?;

            if new_fields.0.len() < map1.0.len() || new_fields.0.len() < map2.0.len() {
                return Err(IsEmptyEarlyStop);
            }

            Ok(MappingItemNeg {
                tag: MappingTag::Closed,
                fields: new_fields,
            })
        }
    }
}

fn symmetrical_intersection(
    map1: &MappingKV,
    map2: &MappingKV,
    intersect: impl Fn(&str, &Ty, &Ty) -> Result<Ty, IsEmptyEarlyStop>,
) -> Result<MappingKV, IsEmptyEarlyStop> {
    let mut acc: Vec<(String, Ty)> = vec![];

    for (key, v1) in map1.0.iter() {
        match map2.0.get(key) {
            Some(v2) => {
                acc.push((key.clone(), intersect(key, v1, v2)?));
            }
            None => {}
        }
    }

    Ok(MappingKV(acc.into_iter().collect()))
}

fn non_empty_intersection(type1: &Ty, type2: &Ty) -> Result<Ty, IsEmptyEarlyStop> {
    let typ = type1.intersect(type2);
    if typ.is_bot() {
        Err(IsEmptyEarlyStop)
    } else {
        Ok(typ)
    }
}

fn symmetrical_merge(
    map1: &MappingKV,
    map2: &MappingKV,
    merge: impl Fn(&str, &Ty, &Ty) -> Result<Ty, IsEmptyEarlyStop>,
) -> Result<MappingKV, IsEmptyEarlyStop> {
    let mut acc = map1.0.clone();

    for (key, v1) in map2.0.iter() {
        match acc.get(key) {
            Some(v2) => {
                acc.insert(key.clone(), merge(key, v1, v2)?);
            }
            None => {
                acc.insert(key.clone(), v1.clone());
            }
        }
    }

    Ok(MappingKV(acc))
}

fn map_literal_intersection_loop(
    split_first: Option<(&(&String, &Ty), &[(&String, &Ty)])>,
    acc: &MappingKV,
) -> Result<MappingItemNeg, IsEmptyEarlyStop> {
    match split_first {
        Some(((key, type1), iterator)) => {
            match acc.0.get(&**key) {
                Some(type2) => {
                    //
                    let acc = acc.put((*key).clone(), non_empty_intersection(type1, type2)?);
                    map_literal_intersection_loop(iterator.split_first(), &acc)
                }
                None => {
                    // If the key is optional in the open map, we can ignore it
                    //         case type1 do
                    //           %{optional: 1} -> :maps.next(iterator) |> map_literal_intersection_loop(acc)
                    //           _ -> throw(:empty)
                    //         end
                    todo!()
                }
            }
        }
        None => Ok(MappingItemNeg {
            tag: MappingTag::Closed,
            fields: acc.clone(),
        }),
    }
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mapping_ty() {
        let bot = MappingTy::new_bot();
        assert!(bot.is_bot());
        insta::assert_snapshot!(bot.to_cf().display_impl(false), @"⊥");

        let top = MappingTy::new_top();
        assert!(!top.is_bot());
        insta::assert_snapshot!(top.to_cf().display_impl(false), @"mapping");

        let empty = MappingTy::new_empty_map();
        assert!(!empty.is_bot());
        assert!(!empty.is_top());
        insta::assert_snapshot!(empty.to_cf().display_impl(false), @"{||}");
    }

    #[test]
    fn mapping_subtype() {
        let top = MappingTy::new_top();
        let bot = MappingTy::new_bot();

        assert!(bot.is_bot());
        assert!(!bot.is_top());

        assert!(!top.is_bot());
        assert!(top.is_top());

        let u = top.union(&bot);
        assert!(u.is_top());

        let i = top.intersect(&bot);
        assert!(i.is_bot());

        let i2 = top.intersect(&top);
        assert_eq!(i2, top);

        let d = top.diff(&bot);
        assert!(d.is_top());

        let d2 = bot.diff(&top);
        assert!(d2.is_bot());
    }
    #[test]
    fn mapping_subtype2() {
        let b = MappingTy(vec![MappingItem {
            tag: MappingTag::Open,
            fields: MappingKV(
                vec![("b".to_string(), Ty::new_bool_top())]
                    .into_iter()
                    .collect(),
            ),
            negs: vec![],
        }]);

        let c1 = b.complement();
        insta::assert_snapshot!(c1.to_cf().display_impl(false), @"{b: (null | string | mapping | list)}");

        let c2 = c1.complement();
        insta::assert_snapshot!(c2.to_cf().display_impl(false), @"{b: boolean}");

        assert!(c2.is_same_type(&b));
    }
    #[test]
    fn mapping_subtype3() {
        let t = MappingTy::new_top();
        insta::assert_snapshot!(t.to_cf().display_impl(false), @"mapping");

        let b = MappingTy(vec![MappingItem {
            tag: MappingTag::Open,
            fields: MappingKV(
                vec![("b".to_string(), Ty::new_bool_top())]
                    .into_iter()
                    .collect(),
            ),
            negs: vec![],
        }]);

        let c1 = t.diff(&b);
        insta::assert_snapshot!(c1.to_cf().display_impl(false), @"{b: (null | string | mapping | list)}");
    }
    #[test]
    fn mapping_subtype310() {
        let a = MappingTy(vec![MappingItem {
            tag: MappingTag::Open,
            fields: MappingKV(
                vec![("a".to_string(), Ty::new_string_top())]
                    .into_iter()
                    .collect(),
            ),
            negs: vec![],
        }]);
        insta::assert_snapshot!(a.diff(&a).to_cf().display_impl(false), @"⊥");
        assert!(a.is_same_type(&a));

        let u = a.union(&a);
        insta::assert_snapshot!(u.to_cf().display_impl(false), @"{a: string}");
        insta::assert_snapshot!(u.diff(&u).to_cf().display_impl(false), @"⊥");
        assert!(u.is_same_type(&u));
    }
    #[test]
    fn mapping_subtype31() {
        let a = MappingTy(vec![MappingItem {
            tag: MappingTag::Open,
            fields: MappingKV(
                vec![
                    ("a".to_string(), Ty::new_string_top()),
                    ("b".to_string(), Ty::new_bool_top()),
                ]
                .into_iter()
                .collect(),
            ),
            negs: vec![],
        }]);
        insta::assert_snapshot!(a.diff(&a).to_cf().display_impl(false), @"⊥");

        assert!(a.diff(&a).is_bot());

        assert!(a.is_same_type(&a));

        insta::assert_snapshot!(a.to_cf().display_impl(false), @"{a: string, b: boolean}");

        let c1 = a.complement();

        insta::assert_snapshot!(c1.to_cf().display_impl(false), @"mapping & !({a: string, b: boolean})");

        let c2 = c1.complement();

        insta::assert_snapshot!(c2.to_cf().display_impl(false), @"{a: string, b: boolean}");

        assert!(c2.is_same_type(&a));
    }
    #[test]
    fn mapping_subtype4() {
        let a = MappingTy(vec![MappingItem {
            tag: MappingTag::Open,
            fields: MappingKV(
                vec![("a".to_string(), Ty::new_string_top())]
                    .into_iter()
                    .collect(),
            ),
            negs: vec![],
        }]);

        let b = MappingTy(vec![MappingItem {
            tag: MappingTag::Open,
            fields: MappingKV(
                vec![("b".to_string(), Ty::new_bool_top())]
                    .into_iter()
                    .collect(),
            ),
            negs: vec![],
        }]);

        let m2 = a.union(&b);
        insta::assert_snapshot!(m2.to_cf().display_impl(false), @"{a: string} | {b: boolean}");

        let complement = m2.complement();

        insta::assert_snapshot!(complement.to_cf().display_impl(false), @"{a: (null | boolean | mapping | list), b: (null | string | mapping | list)}");

        let back = complement.complement();

        insta::assert_snapshot!(back.to_cf().display_impl(false), @"mapping & !({a: (null | boolean | mapping | list), b: (null | string | mapping | list)})");

        assert!(back.is_same_type(&m2));

        let u1 = complement.union(&a);

        assert!(!u1.is_bot());

        insta::assert_snapshot!(u1.to_cf().display_impl(false), @"{a: string} | {a: (null | boolean | mapping | list), b: (null | string | mapping | list)}");

        let u2 = u1.union(&b);

        insta::assert_snapshot!(u2.to_cf().display_impl(false), @"{a: string} | {a: (null | boolean | mapping | list), b: (null | string | mapping | list)} | {b: boolean}");

        assert!(!u2.is_bot());
        assert!(u2.is_top());
    }
}
