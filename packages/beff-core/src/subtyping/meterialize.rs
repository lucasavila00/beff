use std::{collections::BTreeMap, rc::Rc};

use crate::{
    ast::json::N,
    subtyping::subtype::{ProperSubtype, StringLitOrFormat, SubTypeTag},
};

use super::{
    bdd::{Atom, Bdd, ListAtomic, MappingAtomic},
    semtype::{SemType, SemTypeContext, SemTypeOps},
};

pub struct SemTypeResolverContext<'a>(pub &'a mut SemTypeContext);

impl<'a> SemTypeResolverContext<'a> {
    fn intersect_list_atomics(&mut self, it: Vec<Rc<ListAtomic>>) -> Rc<ListAtomic> {
        let items = it
            .iter()
            .map(|it| it.items.clone())
            .fold(Rc::new(SemType::new_unknown()), |acc, it| {
                acc.intersect(&it)
            });

        let mut prefix_items: Vec<Rc<SemType>> = vec![];
        let max_len = it.iter().map(|it| it.prefix_items.len()).max().unwrap_or(0);
        for i in 0..max_len {
            let mut acc = Rc::new(SemType::new_unknown());

            for atom in &it {
                if i < atom.prefix_items.len() {
                    acc = acc.intersect(&atom.prefix_items[i]);
                }
            }

            prefix_items.push(acc);
        }

        Rc::new(ListAtomic {
            items,
            prefix_items,
        })
    }

    fn intersect_mapping_atomics(&mut self, it: Vec<Rc<MappingAtomic>>) -> Rc<MappingAtomic> {
        // for atom in it {
        //     let mp = self.0.mapping_definition(atom.clone());
        //     let st = Rc::new(mp);

        //     let is_empty = st.is_empty(&mut self.0);
        //     if !is_empty {
        //         return atom;
        //     }
        // }
        // todo!()
        let mut acc: MappingAtomic = BTreeMap::new();

        for atom in it {
            for (k, v) in atom.iter() {
                let old_v = acc
                    .get(k)
                    .map(|it| it.clone())
                    .unwrap_or_else(|| Rc::new(SemType::new_unknown()));

                let v = old_v.intersect(v);

                acc.insert(k.clone(), v);
            }
        }

        Rc::new(acc)
    }

    fn mapping_atomic_complement(it: Rc<MappingAtomic>) -> Rc<MappingAtomic> {
        let acc = it
            .iter()
            .map(|(k, v)| (k.clone(), v.complement()))
            .collect();
        Rc::new(acc)
    }

    fn to_schema_mapping_node_bdd_vec(
        &mut self,
        atom: &Rc<Atom>,
        left: &Rc<Bdd>,
        middle: &Rc<Bdd>,
        right: &Rc<Bdd>,
    ) -> Vec<Rc<MappingAtomic>> {
        let mt = match atom.as_ref() {
            Atom::Mapping(a) => self.0.get_mapping_atomic(*a).clone(),
            _ => unreachable!(),
        };

        let mut acc: Vec<Rc<MappingAtomic>> = vec![];

        match left.as_ref() {
            Bdd::True => {
                acc.push(mt.clone());
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
                let ty = vec![mt.clone()]
                    .into_iter()
                    .chain(self.to_schema_mapping_node_bdd_vec(atom, left, middle, right));

                acc.push(self.intersect_mapping_atomics(ty.collect()));
            }
        };

        match middle.as_ref() {
            Bdd::False => {
                // noop
            }
            Bdd::True | Bdd::Node { .. } => {
                acc.extend(self.to_schema_mapping_bdd_vec(middle));
            }
        }
        match right.as_ref() {
            Bdd::True => {
                acc.push(Self::mapping_atomic_complement(mt.clone()));
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
                let ty = vec![Self::mapping_atomic_complement(mt.clone())]
                    .into_iter()
                    .chain(self.to_schema_mapping_node_bdd_vec(atom, left, middle, right));

                acc.push(self.intersect_mapping_atomics(ty.collect()));
            }
        }
        return acc;
    }
    pub fn to_schema_mapping_bdd_vec(&mut self, bdd: &Rc<Bdd>) -> Vec<Rc<MappingAtomic>> {
        match bdd.as_ref() {
            Bdd::True => todo!(),
            Bdd::False => todo!(),
            Bdd::Node {
                atom,
                left,
                middle,
                right,
            } => self.to_schema_mapping_node_bdd_vec(atom, left, middle, right),
        }
    }

    fn list_atomic_complement(it: Rc<ListAtomic>) -> Rc<ListAtomic> {
        let items = it.items.complement();
        let prefix_items = it.prefix_items.iter().map(|it| it.complement()).collect();
        Rc::new(ListAtomic {
            items,
            prefix_items,
        })
    }

    fn to_schema_list_node_bdd_vec(
        &mut self,
        atom: &Rc<Atom>,
        left: &Rc<Bdd>,
        middle: &Rc<Bdd>,
        right: &Rc<Bdd>,
    ) -> Vec<Rc<ListAtomic>> {
        let mt = match atom.as_ref() {
            Atom::List(a) => self.0.get_list_atomic(*a).clone(),
            _ => unreachable!(),
        };

        let mut acc: Vec<Rc<ListAtomic>> = vec![];

        match left.as_ref() {
            Bdd::True => {
                acc.push(mt.clone());
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
                let ty = vec![mt.clone()]
                    .into_iter()
                    .chain(self.to_schema_list_node_bdd_vec(atom, left, middle, right));

                acc.push(self.intersect_list_atomics(ty.collect()));
            }
        };

        match middle.as_ref() {
            Bdd::False => {
                // noop
            }
            Bdd::True | Bdd::Node { .. } => {
                acc.extend(self.to_schema_list_bdd_vec(middle));
            }
        }
        match right.as_ref() {
            Bdd::True => {
                acc.push(Self::list_atomic_complement(mt.clone()));
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
                let ty = vec![Self::list_atomic_complement(mt.clone())]
                    .into_iter()
                    .chain(self.to_schema_list_node_bdd_vec(atom, left, middle, right));

                acc.push(self.intersect_list_atomics(ty.collect()));
            }
        }
        return acc;
    }
    pub fn to_schema_list_bdd_vec(&mut self, bdd: &Rc<Bdd>) -> Vec<Rc<ListAtomic>> {
        match bdd.as_ref() {
            Bdd::True => {
                // vec![Rc::new(ListAtomic {
                //     prefix_items: vec![],
                //     items: Rc::new(SemType::new_unknown()),
                // })]
                todo!()
            }
            Bdd::False => {
                vec![Rc::new(ListAtomic {
                    prefix_items: vec![],
                    items: Rc::new(SemType::new_never()),
                })]
            }
            Bdd::Node {
                atom,
                left,
                middle,
                right,
            } => self.to_schema_list_node_bdd_vec(atom, left, middle, right),
        }
    }
}

pub enum MaterMemo {
    Mater(Mater),
    Undefined,
}

pub struct MaterializationContext<'a> {
    ctx: SemTypeResolverContext<'a>,

    pub materialize_memo: BTreeMap<Rc<SemType>, MaterMemo>,
}
impl<'a> MaterializationContext<'a> {
    pub fn new(ctx: &'a mut SemTypeContext) -> Self {
        Self {
            ctx: SemTypeResolverContext(ctx),
            materialize_memo: BTreeMap::new(),
        }
    }

    fn list_atom_mater(&mut self, mt: &Rc<ListAtomic>) -> Mater {
        let items = self.materialize(&mt.items);
        let prefix_items = mt
            .prefix_items
            .iter()
            .map(|x| self.materialize(x))
            .collect();
        Mater::Array {
            items: Box::new(items),
            prefix_items,
        }
    }

    fn mapping_atom_mater(&mut self, mt: &Rc<MappingAtomic>) -> Mater {
        let mut acc: Vec<(String, Mater)> = vec![];

        for (k, v) in mt.iter() {
            let ty = self.materialize(v);
            acc.push((k.clone(), ty));
            // let ty = if v.has_void() {
            //     schema.optional()
            // } else {
            //     schema.required()
            // };
        }

        Mater::Object(BTreeMap::from_iter(acc))
    }

    fn materialize_mapping(&mut self, bdd: &Rc<Bdd>) -> Mater {
        let vs = self.ctx.to_schema_mapping_bdd_vec(bdd);
        for v in vs {
            let is_never = v.iter().all(|it| it.1.is_never());
            if is_never {
                continue;
            }
            return self.mapping_atom_mater(&v);
        }
        return Mater::Never;
    }
    fn materialize_list(&mut self, bdd: &Rc<Bdd>) -> Mater {
        let vs = self.ctx.to_schema_list_bdd_vec(bdd);
        for v in vs {
            let is_never = v.items.is_never() && v.prefix_items.iter().all(|it| it.is_never());
            if is_never {
                continue;
            }
            return self.list_atom_mater(&v);
        }
        return Mater::Never;
        // todo!()
    }

    pub fn materialize(&mut self, ty: &Rc<SemType>) -> Mater {
        if let Some(mater) = self.materialize_memo.get(ty) {
            match mater {
                MaterMemo::Mater(mater) => return mater.clone(),
                MaterMemo::Undefined => {
                    return Mater::Recursive;
                }
            }
        } else {
            self.materialize_memo
                .insert(ty.clone(), MaterMemo::Undefined);
        }
        let mater = self.materialize_no_cache(ty);
        self.materialize_memo
            .insert(ty.clone(), MaterMemo::Mater(mater.clone()));
        mater
    }
    fn materialize_no_cache(&mut self, ty: &Rc<SemType>) -> Mater {
        if ty.all == 0 && ty.subtype_data.is_empty() {
            return Mater::Never;
        }

        for s in &ty.subtype_data {
            match s.as_ref() {
                ProperSubtype::String { allowed, values } => {
                    if !allowed {
                        return Mater::StringLiteral("Izr1mn6edP0HLrWu".into());
                    }
                    match values.split_first() {
                        Some((h, _t)) => match h {
                            StringLitOrFormat::Lit(st) => return Mater::StringLiteral(st.clone()),
                            StringLitOrFormat::Format(fmt) => {
                                return Mater::StringWithFormat(fmt.clone())
                            }
                        },
                        None => unreachable!("string values cannot be empty"),
                    }
                }
                ProperSubtype::Number { allowed, values } => {
                    if !allowed {
                        return Mater::NumberLiteral(N::parse_int(4773992856));
                    }
                    match values.split_first() {
                        Some((h, _t)) => return Mater::NumberLiteral(h.clone()),
                        None => unreachable!("number values cannot be empty"),
                    }
                }
                ProperSubtype::Boolean(v) => return Mater::BooleanLiteral(*v),
                ProperSubtype::Mapping(bdd) => return self.materialize_mapping(bdd),
                ProperSubtype::List(bdd) => return self.materialize_list(bdd),
            }
        }

        for t in SubTypeTag::all() {
            if (ty.all & t.code()) != 0 {
                match t {
                    SubTypeTag::Null => return Mater::Null,
                    SubTypeTag::Boolean => return Mater::Boolean,
                    SubTypeTag::Number => return Mater::Number,
                    SubTypeTag::String => return Mater::String,
                    SubTypeTag::Void => return Mater::Void,
                    SubTypeTag::Mapping => unreachable!("we do not allow creation of all mappings"),
                    SubTypeTag::List => unreachable!("we do not allow creation of all arrays"),
                }
            }
        }

        unreachable!("should have been materialized")
    }
}

#[derive(PartialEq, Eq, Debug, Clone)]
pub enum Mater {
    // special
    Never,
    Unknown,
    Void,
    Recursive,

    // json
    Null,
    Boolean,
    Number,
    String,
    StringWithFormat(String),
    StringLiteral(String),
    NumberLiteral(N),
    BooleanLiteral(bool),
    Array {
        items: Box<Mater>,
        prefix_items: Vec<Mater>,
    },
    Object(BTreeMap<String, Mater>),
}

impl Mater {
    pub fn is_never(&self) -> bool {
        matches!(self, Mater::Never)
    }
}
