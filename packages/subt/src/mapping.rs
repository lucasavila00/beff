use std::collections::BTreeMap;

use crate::{
    cf::CF,
    sub::{vec_union, Ty},
};

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct MappingAtomic(pub BTreeMap<String, Ty>);
impl MappingAtomic {
    pub fn new() -> Self {
        MappingAtomic(BTreeMap::new())
    }

    fn to_cf(&self, tag: &MappingSubtypeTag) -> CF {
        let fields: BTreeMap<String, CF> =
            self.0.iter().map(|(k, v)| (k.clone(), v.to_cf())).collect();

        if fields.is_empty() {
            match tag {
                MappingSubtypeTag::Open => CF::MappingTop,
                MappingSubtypeTag::Closed => CF::Bot,
            }
        } else {
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
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum MappingSubtypeTag {
    Open,
    Closed,
}

impl MappingSubtypeTag {
    pub fn to_type(&self) -> Ty {
        match self {
            MappingSubtypeTag::Open => Ty::new_top(),
            MappingSubtypeTag::Closed => Ty::new_null(),
        }
    }
}
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct MappingSubtypeItemNeg {
    pub tag: MappingSubtypeTag,
    pub fields: MappingAtomic,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct MappingSubtypeItem {
    pub tag: MappingSubtypeTag,
    pub fields: MappingAtomic,
    pub negs: Vec<MappingSubtypeItemNeg>,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct MappingSubtype(pub Vec<MappingSubtypeItem>);

struct IsEmptyEarlyStop;

impl MappingSubtype {
    pub fn new_bot() -> Self {
        MappingSubtype(vec![MappingSubtypeItem {
            tag: MappingSubtypeTag::Closed,
            fields: MappingAtomic::new(),
            negs: vec![],
        }])
    }

    pub fn new_top() -> Self {
        MappingSubtype(vec![MappingSubtypeItem {
            tag: MappingSubtypeTag::Open,
            fields: MappingAtomic::new(),
            negs: vec![],
        }])
    }
    pub fn is_top(&self) -> bool {
        self.is_same_type(&Self::new_top())
    }
    pub fn complement(&self) -> MappingSubtype {
        Self::new_top().diff(self)
    }

    pub fn is_subtype(&self, other: &MappingSubtype) -> bool {
        self.diff(other).is_bot()
    }
    pub fn is_same_type(&self, other: &MappingSubtype) -> bool {
        self.is_subtype(other) && other.is_subtype(self)
    }

    pub fn diff(&self, other: &MappingSubtype) -> MappingSubtype {
        let dnf1 = self;
        let dnf2 = other;
        dnf2.0
            .iter()
            .fold(dnf1.clone(), |dnf1, it: &MappingSubtypeItem| {
                // Optimization: we are removing an open map with one field.
                if it.tag == MappingSubtypeTag::Open && it.fields.0.len() == 1 && it.negs.is_empty()
                {
                    let fields2 = &it.fields.0;

                    return dnf1.0.iter().fold(
                        MappingSubtype(vec![]),
                        |acc,
                         MappingSubtypeItem {
                             tag: tag1,
                             fields: fields1,
                             negs: negs1,
                         }| {
                            match fields2.into_iter().collect::<Vec<_>>().split_first() {
                                None => unreachable!(),
                                Some(((key, value), _rest)) => {
                                    let from_fields = fields1
                                        .0
                                        .get(*key)
                                        .cloned()
                                        .unwrap_or_else(|| tag1.to_type());

                                    let t_diff = from_fields.diff(value);
                                    if t_diff.is_bot() {
                                        acc
                                    } else {
                                        MappingSubtype(
                                            vec![MappingSubtypeItem {
                                                tag: tag1.clone(),
                                                fields: fields1.put((*key).to_owned(), t_diff),
                                                negs: negs1.clone(),
                                            }]
                                            .into_iter()
                                            .chain(acc.0.iter().cloned())
                                            .collect(),
                                        )
                                    }
                                }
                            }
                        },
                    );
                }
                let tag2 = &it.tag;
                let fields2 = &it.fields;
                let negs2 = &it.negs;

                dnf1.0.iter().fold(
                    MappingSubtype(vec![]),
                    |acc,
                     MappingSubtypeItem {
                         tag: tag1,
                         fields: fields1,
                         negs: negs1,
                     }| {
                        let acc: Vec<MappingSubtypeItem> = vec![MappingSubtypeItem {
                            tag: tag1.clone(),
                            fields: fields1.clone(),
                            negs: vec![MappingSubtypeItemNeg {
                                tag: tag2.clone(),
                                fields: fields2.clone(),
                            }]
                            .into_iter()
                            .chain(negs1.iter().cloned())
                            .collect(),
                        }]
                        .into_iter()
                        .chain(acc.0.iter().cloned())
                        .collect();

                        negs2.iter().fold(
                            MappingSubtype(acc),
                            |acc,
                             MappingSubtypeItemNeg {
                                 tag: neg_tag2,
                                 fields: neg_fields2,
                             }| {
                                match map_literal_intersection(
                                    &tag1,
                                    &fields1,
                                    &neg_tag2,
                                    &neg_fields2,
                                ) {
                                    Ok(MappingSubtypeItemNeg { tag, fields }) => MappingSubtype(
                                        vec![MappingSubtypeItem {
                                            tag,
                                            fields,
                                            negs: negs1.clone(),
                                        }]
                                        .into_iter()
                                        .chain(acc.0.iter().cloned())
                                        .collect(),
                                    ),
                                    Err(IsEmptyEarlyStop) => acc,
                                }
                            },
                        )
                    },
                )
            })
    }

    pub fn union(&self, other: &MappingSubtype) -> MappingSubtype {
        MappingSubtype(vec_union(&self.0, &other.0))
    }

    pub fn intersect(&self, other: &MappingSubtype) -> MappingSubtype {
        let dnf1 = &self.0;
        let dnf2 = &other.0;

        let mut acc = vec![];
        for MappingSubtypeItem {
            tag: tag1,
            fields: pos1,
            negs: negs1,
        } in dnf1
        {
            for MappingSubtypeItem {
                tag: tag2,
                fields: pos2,
                negs: negs2,
            } in dnf2
            {
                match map_literal_intersection(tag1, pos1, tag2, pos2) {
                    Ok(MappingSubtypeItemNeg { tag, fields }) => {
                        let entry = MappingSubtypeItem {
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
                    Err(IsEmptyEarlyStop) => return MappingSubtype(acc),
                }
            }
        }
        MappingSubtype(acc)
    }

    pub fn is_bot(&self) -> bool {
        self.0
            .iter()
            .all(|it| Self::is_bot_impl(&it.tag, &it.fields, &it.negs))
    }

    fn is_bot_impl(
        tag: &MappingSubtypeTag,
        fields: &MappingAtomic,
        negs: &[MappingSubtypeItemNeg],
    ) -> bool {
        match negs.split_first() {
            None => {
                if fields.0.is_empty() {
                    // empty map, it's empty if map is closed
                    *tag == MappingSubtypeTag::Closed
                } else {
                    fields.0.values().any(|it| it.is_bot())
                }
            }
            Some((
                MappingSubtypeItemNeg {
                    tag: neg_tag,
                    fields: neg_fields,
                },
                negs,
            )) => {
                // we have a negative 'all' erasing everything
                if *neg_tag == MappingSubtypeTag::Open && neg_fields.0.is_empty() {
                    return true;
                }
                // an open map can never be erased by a closed one, as the open one would have an 'infinite' part
                // and the closed one wouldn't
                if *tag == MappingSubtypeTag::Open && *neg_tag == MappingSubtypeTag::Closed {
                    return Self::is_bot_impl(&MappingSubtypeTag::Open, fields, negs);
                }

                (neg_fields
                    .0
                    .iter()
                    .all(|(neg_key, neg_type): (&String, &Ty)| {
                        //
                        // Keys that are present in the negative map, but not in the positive one
                        let l = if is_map_key(fields, neg_key) {
                            true
                        } else {
                            // The key is not shared between positive and negative maps,
                            // if the negative type is optional, then there may be a value in common
                            match tag {
                                MappingSubtypeTag::Closed => return is_optional_static(neg_type),
                                // There may be value in common
                                MappingSubtypeTag::Open => {
                                    let diff = Ty::new_top().diff(neg_type);
                                    diff.is_bot()
                                        || Self::is_bot_impl(
                                            tag,
                                            &fields.put(neg_key.clone(), diff),
                                            negs,
                                        )
                                }
                            }
                        };
                        l && fields.0.iter().all(|(key, typ)| {
                            if neg_fields.0.is_empty() {
                                if *neg_tag == MappingSubtypeTag::Open {
                                    true
                                } else if *neg_tag == MappingSubtypeTag::Closed
                                    && !is_optional_static(typ)
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
                            } else {
                                let diff = Ty::new_top().diff(neg_type);
                                diff.is_bot()
                                    || Self::is_bot_impl(tag, &fields.put(key.clone(), diff), negs)
                            }
                        })
                    }))
                    || Self::is_bot_impl(tag, fields, negs)
            }
        }
    }

    pub fn to_cf(&self) -> CF {
        // if self.is_top() {
        //     return CF::MappingTop;
        // }

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

fn is_map_key(fields: &MappingAtomic, k: &str) -> bool {
    fields.0.contains_key(k)
}

fn map_literal_intersection(
    tag1: &MappingSubtypeTag,
    pos1: &MappingAtomic,
    tag2: &MappingSubtypeTag,
    pos2: &MappingAtomic,
) -> Result<MappingSubtypeItemNeg, IsEmptyEarlyStop> {
    match (tag1, pos1, tag2, pos2) {
        // Both open: the result is open.
        (MappingSubtypeTag::Open, map1, MappingSubtypeTag::Open, map2) => {
            let new_fields = symmetrical_merge(map1, map2, |_, type1, type2| {
                non_empty_intersection(type1, type2)
            })?;
            Ok(MappingSubtypeItemNeg {
                tag: MappingSubtypeTag::Open,
                fields: new_fields,
            })
        }

        // Open and closed: result is closed, all fields from open should be in closed, except not_set ones.
        (MappingSubtypeTag::Open, open, MappingSubtypeTag::Closed, closed)
        | (MappingSubtypeTag::Closed, closed, MappingSubtypeTag::Open, open) => {
            let kvs = open.0.iter().collect::<Vec<_>>();
            let split_first = kvs.split_first();
            map_literal_intersection_loop(split_first, closed)
        }

        (MappingSubtypeTag::Closed, map1, MappingSubtypeTag::Closed, map2) => {
            let new_fields = symmetrical_intersection(map1, map2, |_, type1, type2| {
                non_empty_intersection(type1, type2)
            })?;

            if new_fields.0.len() < map1.0.len() || new_fields.0.len() < map2.0.len() {
                return Err(IsEmptyEarlyStop);
            }

            Ok(MappingSubtypeItemNeg {
                tag: MappingSubtypeTag::Closed,
                fields: new_fields,
            })
        }
    }
}

fn symmetrical_intersection(
    map1: &MappingAtomic,
    map2: &MappingAtomic,
    intersect: impl Fn(&str, &Ty, &Ty) -> Result<Ty, IsEmptyEarlyStop>,
) -> Result<MappingAtomic, IsEmptyEarlyStop> {
    let mut acc: Vec<(String, Ty)> = vec![];

    for (key, v1) in map1.0.iter() {
        match map2.0.get(key) {
            Some(v2) => {
                acc.push((key.clone(), intersect(key, v1, v2)?));
            }
            None => {}
        }
    }

    Ok(MappingAtomic(acc.into_iter().collect()))
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
    map1: &MappingAtomic,
    map2: &MappingAtomic,
    merge: impl Fn(&str, &Ty, &Ty) -> Result<Ty, IsEmptyEarlyStop>,
) -> Result<MappingAtomic, IsEmptyEarlyStop> {
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

    Ok(MappingAtomic(acc))
}

fn map_literal_intersection_loop(
    split_first: Option<(&(&String, &Ty), &[(&String, &Ty)])>,
    acc: &MappingAtomic,
) -> Result<MappingSubtypeItemNeg, IsEmptyEarlyStop> {
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
        None => Ok(MappingSubtypeItemNeg {
            tag: MappingSubtypeTag::Closed,
            fields: acc.clone(),
        }),
    }
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mapping_subtype() {
        let top = MappingSubtype::new_top();
        let bot = MappingSubtype::new_bot();

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
        let b = MappingSubtype(vec![MappingSubtypeItem {
            tag: MappingSubtypeTag::Open,
            fields: MappingAtomic(
                vec![("b".to_string(), Ty::new_bool_top())]
                    .into_iter()
                    .collect(),
            ),
            negs: vec![],
        }]);

        assert!(!b.is_bot());
        assert!(!b.is_top());

        let c1 = b.complement();
        insta::assert_snapshot!(c1.to_cf().display_impl(false), @"{b: (null | string | (mapping & !(⊥)) | list)}");

        assert!(!c1.is_bot());
        assert!(!c1.is_top());

        let c2 = c1.complement();
        insta::assert_snapshot!(c2.to_cf().display_impl(false), @"{b: boolean}");

        assert!(!c2.is_bot());
        assert!(!c2.is_top());
        assert!(c2.is_same_type(&b));
    }
}
