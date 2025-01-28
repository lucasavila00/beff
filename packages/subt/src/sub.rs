use std::{
    collections::BTreeMap,
    fmt::Display,
    rc::Rc,
    sync::{Arc, Mutex},
};

use bitfield_struct::bitfield;

use crate::bdd::{
    list_is_empty, Atom, Bdd, Evidence, EvidenceResult, ProperSubtypeEvidence,
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

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
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

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
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
pub struct MappingAtomic(BTreeMap<String, Ty>);
impl MappingAtomic {
    pub fn new() -> Self {
        MappingAtomic(BTreeMap::new())
    }

    fn to_cf(&self, tag: &MappingSubtypeTag) -> CF {
        let fields = self.0.iter().map(|(k, v)| (k.clone(), v.to_cf())).collect();
        CF::Mapping {
            fields,
            tag: tag.clone(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum MappingSubtypeTag {
    Open,
    Closed,
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
pub struct MappingSubtype(Vec<MappingSubtypeItem>);

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
    fn is_top(&self) -> bool {
        self.is_same_type(&Self::new_top())
    }
    fn complement(&self) -> MappingSubtype {
        Self::new_top().diff(self)
    }

    fn is_subtype(&self, other: &MappingSubtype) -> bool {
        self.diff(other).is_bot()
    }
    fn is_same_type(&self, other: &MappingSubtype) -> bool {
        self.is_subtype(other) && other.is_subtype(self)
    }

    fn diff(&self, other: &MappingSubtype) -> MappingSubtype {
        let dnf1 = self;
        let dnf2 = other;
        dnf2.0
            .iter()
            .fold(dnf1.clone(), |dnf1, it: &MappingSubtypeItem| {
                // # Optimization: we are removing an open map with one field.
                if it.tag == MappingSubtypeTag::Open && it.fields.0.len() == 1 && it.negs.is_empty()
                {
                    let field2 = &it.fields.0;

                    return dnf1.0.iter().fold(
                        MappingSubtype(vec![]),
                        |acc,
                         MappingSubtypeItem {
                             tag: tag1,
                             fields: fields1,
                             negs: negs1,
                         }| {
                            match field2.into_iter().collect::<Vec<_>>().split_first() {
                                None => unreachable!(),
                                Some(((key, value), _rest)) => {
                                    //
                                    let f =
                                        fields1.0.get(*key).cloned().unwrap_or_else(
                                            || match tag1 {
                                                MappingSubtypeTag::Open => Ty::new_top(),
                                                MappingSubtypeTag::Closed => Ty::new_bot(),
                                            },
                                        );
                                    let t_diff = f.diff(value);
                                    if t_diff.is_bot() {
                                        acc
                                    } else {
                                        MappingSubtype(
                                            vec![MappingSubtypeItem {
                                                tag: tag1.clone(),
                                                fields: MappingAtomic(
                                                    fields1
                                                        .0
                                                        .clone()
                                                        .into_iter()
                                                        .chain(vec![((*key).to_owned(), t_diff)])
                                                        .collect(),
                                                ),
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
                        //         acc = [{tag1, fields1, [{tag2, fields2} | negs1]} | acc]
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
                                    Err(()) => acc,
                                }
                            },
                        )
                    },
                )
            })
    }

    fn union(&self, other: &MappingSubtype) -> MappingSubtype {
        MappingSubtype(vec_union(&self.0, &other.0))
    }

    fn intersect(&self, other: &MappingSubtype) -> MappingSubtype {
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
                        //
                        let entry = MappingSubtypeItem {
                            tag,
                            fields,
                            negs: vec_union(negs1, negs2),
                        };

                        // # Imagine a, b, c, where a is closed and b and c are open with
                        // # no keys in common. The result in both cases will be a and we
                        // # want to avoid adding duplicates, especially as intersection
                        // # is a cartesian product.
                        if acc.contains(&entry) {
                            continue;
                        }
                        acc.push(entry);
                    }
                    Err(()) => return MappingSubtype(acc),
                }
            }
        }
        MappingSubtype(acc)
    }

    fn is_bot(&self) -> bool {
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
                        //          # Keys that are present in the negative map, but not in the positive one
                        let l = if is_map_key(fields, neg_key) {
                            true
                        } else {
                            //          # The key is not shared between positive and negative maps,
                            //          # if the negative type is optional, then there may be a value in common
                            match tag {
                                MappingSubtypeTag::Closed => return is_optional_static(neg_type),
                                //          # There may be value in common
                                MappingSubtypeTag::Open => {
                                    let diff = Ty::new_top().diff(neg_type);
                                    diff.is_bot()
                                        || Self::is_bot_impl(
                                            tag,
                                            &MappingAtomic(
                                                fields
                                                    .0
                                                    .clone()
                                                    .into_iter()
                                                    .chain(vec![(neg_key.clone(), diff)])
                                                    .collect(),
                                            ),
                                            negs,
                                        )
                                }
                            }
                        };
                        l && fields.0.iter().all(|(key, typ)| {
                            //
                            if neg_fields.0.is_empty() {
                                todo!()
                            } else {
                                let diff = Ty::new_top().diff(neg_type);
                                diff.is_bot()
                                    || Self::is_bot_impl(
                                        tag,
                                        &MappingAtomic(
                                            fields
                                                .0
                                                .clone()
                                                .into_iter()
                                                .chain(vec![(key.clone(), diff)])
                                                .collect(),
                                        ),
                                        negs,
                                    )
                            }
                        })
                    }))
                    || Self::is_bot_impl(tag, fields, negs)

                //     defp map_empty?(tag, fields, [{neg_tag, neg_fields} | negs]) do
                //     (Enum.all?(neg_fields, fn {neg_key, neg_type} ->
                //        cond do
                //          # Keys that are present in the negative map, but not in the positive one
                //          is_map_key(fields, neg_key) ->
                //            true

                //          # The key is not shared between positive and negative maps,
                //          # if the negative type is optional, then there may be a value in common
                //          tag == :closed ->
                //            is_optional_static(neg_type)

                //          # There may be value in common
                //          tag == :open ->
                //            diff = difference(term_or_optional(), neg_type)
                //            empty?(diff) or map_empty?(tag, Map.put(fields, neg_key, diff), negs)
                //        end
                //      end) and
                //        Enum.all?(fields, fn {key, type} ->
                //          case neg_fields do
                //            %{^key => neg_type} ->
                //              diff = difference(type, neg_type)
                //              empty?(diff) or map_empty?(tag, Map.put(fields, key, diff), negs)

                //            %{} ->
                //              cond do
                //                neg_tag == :open ->
                //                  true

                //                neg_tag == :closed and not is_optional_static(type) ->
                //                  false

                //                true ->
                //                  # an absent key in a open negative map can be ignored
                //                  diff = difference(type, tag_to_type(neg_tag))
                //                  empty?(diff) or map_empty?(tag, Map.put(fields, key, diff), negs)
                //              end
                //          end
                //        end)) or map_empty?(tag, fields, negs)
                //   end
            }
        }
    }

    fn to_cf(&self) -> CF {
        if self.is_top() {
            return CF::MappingTop;
        }

        let mut acc: Vec<CF> = vec![];

        for it in &self.0 {
            let mut acc2 = vec![];
            acc2.push(it.fields.to_cf(&it.tag));

            for n in &it.negs {
                acc2.push(CF::not(n.fields.to_cf(&it.tag)));
            }

            acc.push(CF::and(acc2));
        }

        CF::or(acc)
    }
}

fn is_optional_static(neg_type: &Ty) -> bool {
    todo!()
}

fn is_map_key(fields: &MappingAtomic, k: &str) -> bool {
    fields.0.contains_key(k)
}

fn map_literal_intersection(
    tag1: &MappingSubtypeTag,
    pos1: &MappingAtomic,
    tag2: &MappingSubtypeTag,
    pos2: &MappingAtomic,
) -> Result<MappingSubtypeItemNeg, ()> {
    match (tag1, pos1, tag2, pos2) {
        // Both open: the result is open.
        (MappingSubtypeTag::Open, map1, MappingSubtypeTag::Open, map2) => {
            let new_fields = symmetrical_merge(map1, map2, |_, type1, type2| {
                non_empty_intersection(type1, type2)
            });
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
            });

            if new_fields.0.len() < map1.0.len() || new_fields.0.len() < map2.0.len() {
                return Err(());
            }

            Ok(MappingSubtypeItemNeg {
                tag: MappingSubtypeTag::Closed,
                fields: new_fields,
            })
        }

        _ => {
            dbg!(tag1, pos1, tag2, pos2);
            todo!()
        }
    }
}

fn symmetrical_intersection(
    map1: &MappingAtomic,
    map2: &MappingAtomic,
    intersect: impl Fn(&str, &Ty, &Ty) -> Ty,
) -> MappingAtomic {
    let mut acc: Vec<(String, Ty)> = vec![];

    for (key, v1) in map1.0.iter() {
        match map2.0.get(key) {
            Some(v2) => {
                acc.push((key.clone(), intersect(key, v1, v2)));
            }
            None => {}
        }
    }

    MappingAtomic(acc.into_iter().collect())
}

fn non_empty_intersection(type1: &Ty, type2: &Ty) -> Ty {
    todo!()
}

fn symmetrical_merge(
    map1: &MappingAtomic,
    map2: &MappingAtomic,
    merge: impl Fn(&str, &Ty, &Ty) -> Ty,
) -> MappingAtomic {
    let mut acc = map1.0.clone();

    for (key, v1) in map2.0.iter() {
        match acc.get(key) {
            Some(v2) => {
                acc.insert(key.clone(), merge(key, v1, v2));
            }
            None => {
                acc.insert(key.clone(), v1.clone());
            }
        }
    }

    MappingAtomic(acc)
}

fn map_literal_intersection_loop(
    split_first: Option<(&(&String, &Ty), &[(&String, &Ty)])>,
    acc: &MappingAtomic,
) -> Result<MappingSubtypeItemNeg, ()> {
    match split_first {
        Some(_) => todo!(),
        None => Ok(MappingSubtypeItemNeg {
            tag: MappingSubtypeTag::Closed,
            fields: acc.clone(),
        }),
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

#[derive(Debug, Clone)]
pub enum CF {
    Or(Vec<CF>),
    And(Vec<CF>),
    Not(Box<CF>),
    Null,
    BoolTop,
    StringTop,
    ListTop,
    BoolConst(bool),
    StringConst(String),
    Ref(usize),
    Bot,
    List {
        prefix: Vec<CF>,
        rest: Box<CF>,
    },
    Mapping {
        tag: MappingSubtypeTag,
        fields: BTreeMap<String, CF>,
    },
    MappingTop,
}

impl CF {
    pub fn is_bot(&self) -> bool {
        matches!(self, CF::Bot)
    }
    pub fn or(v: Vec<CF>) -> CF {
        // flatten ors
        let mut acc: Vec<CF> = vec![];
        for d in v {
            match d {
                CF::Or(v) => acc.extend(v),
                d => acc.push(d),
            }
        }
        // filter all bots
        let acc: Vec<CF> = acc.into_iter().filter(|d| !matches!(d, CF::Bot)).collect();
        // if len 0, return bot
        if acc.is_empty() {
            return CF::Bot;
        }

        // if len 1, return just it
        if acc.len() == 1 {
            acc.into_iter().next().unwrap()
        } else {
            CF::Or(acc)
        }
    }
    pub fn and(v: Vec<CF>) -> CF {
        // if len 1, return just it
        if v.len() == 1 {
            v.into_iter().next().unwrap()
        } else {
            CF::And(v)
        }
    }
    pub fn not(v: CF) -> CF {
        CF::Not(Box::new(v))
    }
    pub fn null() -> CF {
        CF::Null
    }
    pub fn bool_top() -> CF {
        CF::BoolTop
    }
    pub fn string_top() -> CF {
        CF::StringTop
    }
    pub fn list_top() -> CF {
        CF::ListTop
    }

    pub fn string_const(v: String) -> CF {
        CF::StringConst(v)
    }
    pub fn bool_const(v: bool) -> CF {
        CF::BoolConst(v)
    }
    pub fn bot() -> CF {
        CF::Bot
    }
    pub fn list(prefix: Vec<CF>, rest: CF) -> CF {
        CF::List {
            prefix,
            rest: Box::new(rest),
        }
    }

    pub fn display_impl(&self, wrap: bool) -> String {
        match self {
            CF::Or(vec) => {
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
            CF::And(vec) => {
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
            CF::Not(dnf) => {
                format!("!({})", dnf.display_impl(false))
            }
            CF::StringConst(it) => format!("'{}'", it),
            CF::BoolConst(it) => it.to_string(),
            CF::Bot => "⊥".to_owned(),
            CF::List { prefix, rest } => {
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
                if rest.is_bot() {
                    return format!("tuple[{}]", prefix);
                }
                let mut rest_part = "".to_owned();
                if !rest.is_bot() {
                    rest_part = rest_part + rest.display_impl(true).as_str() + "...";
                    if !prefix.is_empty() {
                        prefix = prefix + ", ";
                    }
                }
                format!("list[{}{}]", prefix, rest_part)
            }
            CF::Null => "null".to_owned(),
            CF::BoolTop => "boolean".to_owned(),
            CF::StringTop => "string".to_owned(),
            CF::ListTop => "list".to_owned(),
            CF::Ref(r) => format!("ref({})", r),
            CF::Mapping { fields, tag } => {
                let mut acc = vec![];
                for (k, v) in fields {
                    acc.push(format!("{}: {}", k, v.display_impl(true)));
                }
                match tag {
                    MappingSubtypeTag::Open => {
                        if acc.is_empty() {
                            "mapping".to_owned()
                        } else {
                            format!("{{{}}}", acc.join(", "))
                        }
                    }
                    MappingSubtypeTag::Closed => {
                        if acc.is_empty() {
                            "⊥".to_owned()
                        } else {
                            format!("{{|{}|}}", acc.join(", "))
                        }
                    }
                }
            }
            CF::MappingTop => "mapping".to_owned(),
        }
    }
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

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

        assert!(!c1.is_bot());
        assert!(!c1.is_top());

        let c2 = c1.complement();

        assert!(!c2.is_bot());
        assert!(!c2.is_top());
        assert!(c2.is_same_type(&b));
    }

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
        insta::assert_snapshot!(unionized, @"null | boolean | string | mapping | list");
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

        insta::assert_snapshot!(complement, @"null | boolean | string | {b: (null | string | mapping | list)} | list");

        let back = complement.complement();
        insta::assert_snapshot!(back, @"{b: boolean}");
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
        insta::assert_snapshot!(l, @"[]boolean");

        let complement = l.complement();
        insta::assert_snapshot!(complement, @"null | boolean | string | mapping | !([]boolean)");

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
        insta::assert_snapshot!(complement, @"null | boolean | string | mapping | (!([]boolean) & !([]string))");

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
        insta::assert_snapshot!(complement, @"null | boolean | string | mapping | (!([]boolean) & !([]string))");
        let u1 = complement.union(&l1);
        insta::assert_snapshot!(u1, @"null | boolean | string | mapping | []boolean | (!([]boolean) & !([]string))");
        assert!(!u1.is_top());

        let unionized = u1.union(&l2);
        insta::assert_snapshot!(unionized, @"null | boolean | string | mapping | []boolean | []string | (!([]boolean) & !([]string))");
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
        insta::assert_snapshot!(complement, @"null | boolean | string | mapping | !([]([]boolean | []string))");

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
        insta::assert_snapshot!(complement, @"null | string | mapping | !(tuple[boolean, (boolean | tuple[boolean, ref(0)])])");

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
