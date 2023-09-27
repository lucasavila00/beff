use std::{
    collections::{BTreeMap, BTreeSet},
    rc::Rc,
};

use crate::{
    ast::{
        json::Json,
        json_schema::{JsonSchema, Optionality},
    },
    open_api_ast::Validator,
    subtyping::evidence::ProperSubtypeEvidence,
};

use super::{
    bdd::{Atom, Bdd, ListAtomic, MappingAtomic},
    evidence::Evidence,
    semtype::{SemType, SemTypeContext, SemTypeOps},
    subtype::{ProperSubtype, StringLitOrFormat, SubTypeTag},
};

pub enum SchemaMemo {
    Schema(JsonSchema),
    Undefined(String),
}

pub struct SemTypeResolverContext<'a>(pub &'a mut SemTypeContext);

impl<'a> SemTypeResolverContext<'a> {
    fn intersect_mapping_atomics(it: Vec<Rc<MappingAtomic>>) -> Rc<MappingAtomic> {
        let mut acc: MappingAtomic = MappingAtomic {
            kvs: BTreeMap::new(),
            rest: SemType::new_unknown().into(),
        };

        for atom in it {
            for (k, v) in atom.kvs.iter() {
                let old_v = acc
                    .kvs
                    .get(k)
                    .cloned()
                    .unwrap_or_else(|| Rc::new(SemType::new_unknown()));

                let v = old_v.intersect(v);

                acc.kvs.insert(k.clone(), v);

                acc.rest = acc.rest.intersect(&atom.rest);
            }
        }

        Rc::new(acc)
    }

    fn mapping_atomic_complement(it: Rc<MappingAtomic>) -> Rc<MappingAtomic> {
        let acc = it
            .kvs
            .iter()
            .map(|(k, v)| (k.clone(), v.complement()))
            .collect();
        let acc = MappingAtomic {
            kvs: acc,
            rest: it.rest.complement(),
        };
        Rc::new(acc)
    }

    fn convert_to_schema_mapping_node_bdd_vec(
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
                    .chain(self.convert_to_schema_mapping_node_bdd_vec(atom, left, middle, right));

                acc.push(Self::intersect_mapping_atomics(ty.collect()));
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
                    .chain(self.convert_to_schema_mapping_node_bdd_vec(atom, left, middle, right));

                acc.push(Self::intersect_mapping_atomics(ty.collect()));
            }
        }
        acc
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
            } => self.convert_to_schema_mapping_node_bdd_vec(atom, left, middle, right),
        }
    }

    fn intersect_list_atomics(it: Vec<Rc<ListAtomic>>) -> Rc<ListAtomic> {
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

    fn list_atomic_complement(it: Rc<ListAtomic>) -> Rc<ListAtomic> {
        let items = it.items.complement();
        let prefix_items = it.prefix_items.iter().map(|it| it.complement()).collect();
        Rc::new(ListAtomic {
            items,
            prefix_items,
        })
    }

    fn convert_to_schema_list_node_bdd_vec(
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
                    .chain(self.convert_to_schema_list_node_bdd_vec(atom, left, middle, right));

                acc.push(Self::intersect_list_atomics(ty.collect()));
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
                    .chain(self.convert_to_schema_list_node_bdd_vec(atom, left, middle, right));

                acc.push(Self::intersect_list_atomics(ty.collect()));
            }
        }
        acc
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
            } => self.convert_to_schema_list_node_bdd_vec(atom, left, middle, right),
        }
    }
}

struct SchemerContext<'a> {
    ctx: SemTypeResolverContext<'a>,

    schemer_memo: BTreeMap<Rc<SemType>, SchemaMemo>,
    validators: Vec<Validator>,

    recursive_validators: BTreeSet<String>,

    counter: usize,
}

impl<'a> SchemerContext<'a> {
    fn new(ctx: &'a mut SemTypeContext) -> Self {
        Self {
            ctx: SemTypeResolverContext(ctx),
            validators: vec![],
            schemer_memo: BTreeMap::new(),
            counter: 0,
            recursive_validators: BTreeSet::new(),
        }
    }

    fn mapping_atom_schema(&mut self, mt: &Rc<MappingAtomic>) -> JsonSchema {
        let mut acc: Vec<(String, Optionality<JsonSchema>)> = vec![];

        if mt.rest.is_any() {
            return JsonSchema::AnyObject;
        }

        for (k, v) in mt.kvs.iter() {
            let schema = self.convert_to_schema(v, None);
            let ty = if v.has_void() {
                schema.optional()
            } else {
                schema.required()
            };
            acc.push((k.clone(), ty));
        }

        JsonSchema::Object(BTreeMap::from_iter(acc))
    }

    // fn to_schema_mapping(&mut self, bdd: &Rc<Bdd>) -> JsonSchema {
    //     let vs = self.ctx.to_schema_mapping_bdd_vec(bdd);
    //     let vs = vs
    //         .into_iter()
    //         .map(|it| self.mapping_atom_schema(&it))
    //         .collect();
    //     return JsonSchema::any_of(vs);
    // }

    fn convert_to_schema_mapping_node(
        &mut self,
        atom: &Rc<Atom>,
        left: &Rc<Bdd>,
        middle: &Rc<Bdd>,
        right: &Rc<Bdd>,
    ) -> JsonSchema {
        let mt = match atom.as_ref() {
            Atom::Mapping(a) => self.ctx.0.get_mapping_atomic(*a).clone(),
            _ => unreachable!(),
        };

        let explained_sts = self.mapping_atom_schema(&mt);

        let mut acc = vec![];

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
                let ty = vec![explained_sts.clone()].into_iter().chain(vec![
                    self.convert_to_schema_mapping_node(atom, left, middle, right)
                ]);
                acc.push(JsonSchema::all_of(ty.collect()));
            }
        };

        match middle.as_ref() {
            Bdd::False => {
                // noop
            }
            Bdd::True | Bdd::Node { .. } => {
                acc.push(self.convert_to_schema_mapping(middle));
            }
        }
        match right.as_ref() {
            Bdd::True => {
                acc.push(JsonSchema::StNot(Box::new(explained_sts)));
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
                let ty = JsonSchema::all_of(vec![
                    JsonSchema::StNot(Box::new(explained_sts)),
                    self.convert_to_schema_mapping_node(atom, left, middle, right),
                ]);
                acc.push(ty)
            }
        }
        JsonSchema::any_of(acc)
    }

    fn convert_to_schema_mapping(&mut self, bdd: &Rc<Bdd>) -> JsonSchema {
        match bdd.as_ref() {
            Bdd::True => todo!(),
            Bdd::False => todo!(),
            Bdd::Node {
                atom,
                left,
                middle,
                right,
            } => self.convert_to_schema_mapping_node(atom, left, middle, right),
        }
    }

    fn list_atom_schema(&mut self, mt: &Rc<ListAtomic>) -> JsonSchema {
        if mt.prefix_items.is_empty() {
            if mt.items.is_any() {
                return JsonSchema::AnyArrayLike;
            }
            return JsonSchema::Array(Box::new(self.convert_to_schema(&mt.items, None)));
        }

        let prefix_items = mt
            .prefix_items
            .iter()
            .map(|it| self.convert_to_schema(it, None))
            .collect();

        let items = if mt.items.is_never() {
            None
        } else {
            Some(Box::new(self.convert_to_schema(&mt.items, None)))
        };
        JsonSchema::Tuple {
            prefix_items,
            items,
        }
    }

    // fn to_schema_list(&mut self, bdd: &Rc<Bdd>) -> JsonSchema {
    //     let vs = self.ctx.to_schema_list_bdd_vec(bdd);
    //     let vs = vs
    //         .into_iter()
    //         .map(|it| self.list_atom_schema(&it))
    //         .collect();
    //     return JsonSchema::any_of(vs);
    // }

    fn convert_to_schema_list_node(
        &mut self,
        atom: &Rc<Atom>,
        left: &Rc<Bdd>,
        middle: &Rc<Bdd>,
        right: &Rc<Bdd>,
    ) -> JsonSchema {
        let lt = match atom.as_ref() {
            Atom::List(a) => self.ctx.0.get_list_atomic(*a).clone(),
            _ => unreachable!(),
        };

        let explained_sts = self.list_atom_schema(&lt);

        let mut acc = vec![];

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
                let ty = vec![explained_sts.clone()].into_iter().chain(vec![
                    self.convert_to_schema_list_node(atom, left, middle, right)
                ]);
                acc.push(JsonSchema::all_of(ty.collect()));
            }
        };

        match middle.as_ref() {
            Bdd::False => {
                // noop
            }
            Bdd::True | Bdd::Node { .. } => {
                acc.push(self.convert_to_schema_list(middle));
            }
        }
        match right.as_ref() {
            Bdd::True => {
                acc.push(JsonSchema::StNot(Box::new(explained_sts)));
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
                let ty = JsonSchema::all_of(vec![
                    JsonSchema::StNot(Box::new(explained_sts)),
                    self.convert_to_schema_list_node(atom, left, middle, right),
                ]);
                acc.push(ty)
            }
        }
        JsonSchema::any_of(acc)
    }
    fn convert_to_schema_list(&mut self, bdd: &Rc<Bdd>) -> JsonSchema {
        match bdd.as_ref() {
            Bdd::True => todo!(),
            Bdd::False => todo!(),
            Bdd::Node {
                atom,
                left,
                middle,
                right,
            } => self.convert_to_schema_list_node(atom, left, middle, right),
        }
    }

    fn convert_to_schema_no_cache(&mut self, ty: &SemType) -> JsonSchema {
        if ty.all == 0 && ty.subtype_data.is_empty() {
            return JsonSchema::StNever;
        }

        let mut acc = BTreeSet::new();

        for t in SubTypeTag::all() {
            if (ty.all & t.code()) != 0 {
                match t {
                    SubTypeTag::Null => {
                        acc.insert(JsonSchema::Null);
                    }
                    SubTypeTag::Boolean => {
                        acc.insert(JsonSchema::Boolean);
                    }
                    SubTypeTag::Number => {
                        acc.insert(JsonSchema::Number);
                    }
                    SubTypeTag::String => {
                        acc.insert(JsonSchema::String);
                    }
                    SubTypeTag::Void => {
                        // noop
                    }
                    SubTypeTag::Mapping => {
                        acc.insert(JsonSchema::AnyObject);
                    }
                    SubTypeTag::List => {
                        acc.insert(JsonSchema::AnyArrayLike);
                    }
                };
            }
        }

        for s in &ty.subtype_data {
            match s.as_ref() {
                ProperSubtype::Boolean(v) => {
                    acc.insert(JsonSchema::Const(Json::Bool(*v)));
                }
                ProperSubtype::Number { allowed, values } => {
                    for h in values {
                        acc.insert(maybe_not(
                            JsonSchema::Const(Json::Number(h.clone())),
                            !allowed,
                        ));
                    }
                }
                ProperSubtype::String { allowed, values } => {
                    for h in values {
                        match h {
                            StringLitOrFormat::Lit(st) => {
                                acc.insert(maybe_not(
                                    JsonSchema::Const(Json::String(st.clone())),
                                    !allowed,
                                ));
                            }
                            StringLitOrFormat::Format(fmt) => {
                                acc.insert(maybe_not(
                                    JsonSchema::StringWithFormat(fmt.clone()),
                                    !allowed,
                                ));
                            }
                            StringLitOrFormat::Codec(fmt) => {
                                acc.insert(maybe_not(JsonSchema::Codec(fmt.clone()), !allowed));
                            }
                        }
                    }
                }
                ProperSubtype::Mapping(bdd) => {
                    acc.insert(self.convert_to_schema_mapping(bdd));
                }
                ProperSubtype::List(bdd) => {
                    acc.insert(self.convert_to_schema_list(bdd));
                }
            };
        }

        JsonSchema::any_of(acc.into_iter().collect())
    }
    pub fn convert_to_schema(&mut self, ty: &Rc<SemType>, name: Option<&str>) -> JsonSchema {
        let new_name = match name {
            Some(n) => n.to_string(),
            None => {
                self.counter += 1;
                format!("t_{}", self.counter)
            }
        };
        if let Some(mater) = self.schemer_memo.get(ty) {
            match mater {
                SchemaMemo::Schema(mater) => return mater.clone(),
                SchemaMemo::Undefined(ref_name) => {
                    self.recursive_validators.insert(ref_name.clone());
                    return JsonSchema::Ref(ref_name.into());
                }
            }
        } else {
            self.schemer_memo
                .insert(ty.clone(), SchemaMemo::Undefined(new_name.clone()));
        }
        let schema = self.convert_to_schema_no_cache(ty);
        self.schemer_memo
            .insert(ty.clone(), SchemaMemo::Schema(schema.clone()));
        self.validators.push(Validator {
            name: new_name,
            schema: schema.clone(),
        });

        schema
    }
}

pub fn to_validators(
    ctx: &mut SemTypeContext,
    ty: &Rc<SemType>,
    name: &str,
) -> (Validator, Vec<Validator>) {
    let mut schemer = SchemerContext::new(ctx);
    let out = schemer.convert_to_schema(ty, Some(name));
    let vs: Vec<Validator> = schemer
        .validators
        .into_iter()
        .filter(|it| schemer.recursive_validators.contains(&it.name))
        .collect();

    let vs = vs.into_iter().filter(|it| it.name != name).collect();
    (
        Validator {
            name: name.into(),
            schema: out,
        },
        vs,
    )
}
fn maybe_not(it: JsonSchema, add_not: bool) -> JsonSchema {
    if add_not {
        JsonSchema::StNot(Box::new(it))
    } else {
        it
    }
}
fn evidence_to_schema(ty: &Evidence) -> JsonSchema {
    match ty {
        Evidence::All(t) => match t {
            SubTypeTag::Boolean => JsonSchema::Boolean,
            SubTypeTag::Number => JsonSchema::Number,
            SubTypeTag::String => JsonSchema::String,
            SubTypeTag::Null => JsonSchema::Null,
            SubTypeTag::Mapping => JsonSchema::AnyObject,
            SubTypeTag::Void => JsonSchema::Ref("undefined".into()),
            SubTypeTag::List => JsonSchema::AnyArrayLike,
        },
        Evidence::Proper(p) => match p {
            ProperSubtypeEvidence::Boolean(b) => JsonSchema::Const(Json::Bool(*b)),
            ProperSubtypeEvidence::Number { allowed, values } => {
                let v = JsonSchema::AnyOf(
                    values
                        .iter()
                        .map(|it| JsonSchema::Const(Json::Number(it.clone())))
                        .collect(),
                );
                maybe_not(v, !allowed)
            }
            ProperSubtypeEvidence::String { allowed, values } => {
                let v = JsonSchema::AnyOf(
                    values
                        .iter()
                        .map(|it| match it {
                            StringLitOrFormat::Lit(lit) => {
                                JsonSchema::Const(Json::String(lit.clone()))
                            }
                            StringLitOrFormat::Format(fmt) => {
                                JsonSchema::StringWithFormat(fmt.clone())
                            }
                            StringLitOrFormat::Codec(fmt) => JsonSchema::Codec(fmt.clone()),
                        })
                        .collect(),
                );
                maybe_not(v, !allowed)
            }
            ProperSubtypeEvidence::List(ev) => {
                if ev.prefix_items.is_empty() {
                    match &ev.items {
                        Some(e) => JsonSchema::Array(Box::new(evidence_to_schema(e))),
                        None => JsonSchema::AnyArrayLike,
                    }
                } else {
                    JsonSchema::Tuple {
                        prefix_items: ev
                            .prefix_items
                            .iter()
                            .map(|it| evidence_to_schema(it))
                            .collect(),
                        items: ev.items.as_ref().map(|it| Box::new(evidence_to_schema(it))),
                    }
                }
            }
            ProperSubtypeEvidence::Mapping(vs) => JsonSchema::object(
                vs.iter()
                    .map(|(k, v)| (k.clone(), evidence_to_schema(v).required()))
                    .collect(),
            ),
        },
    }
}
pub fn to_validators_evidence(
    _ctx: &mut SemTypeContext,
    ty: &Evidence,
    name: &str,
) -> Vec<Validator> {
    let schema = evidence_to_schema(ty);
    vec![Validator {
        name: name.to_string(),
        schema,
    }]
}
