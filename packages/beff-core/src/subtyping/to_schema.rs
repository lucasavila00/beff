use std::{
    collections::{BTreeMap, BTreeSet},
    rc::Rc,
};

use anyhow::bail;

use crate::{
    ast::json_schema::{JsonSchema, JsonSchemaConst, Optionality},
    NamedSchema,
};

use super::{
    bdd::{Atom, Bdd, ListAtomic},
    semtype::{MappingAtomicType, SemType, SemTypeContext, SemTypeOps},
    subtype::{NumberRepresentationOrFormat, ProperSubtype, StringLitOrFormat, SubTypeTag},
};

pub enum SchemaMemo {
    Schema(JsonSchema),
    Undefined(String),
}

pub struct SemTypeResolverContext<'a>(pub &'a mut SemTypeContext);

impl SemTypeResolverContext<'_> {
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
    ) -> anyhow::Result<Vec<Rc<ListAtomic>>> {
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
                    .chain(self.convert_to_schema_list_node_bdd_vec(atom, left, middle, right)?);

                acc.push(Self::intersect_list_atomics(ty.collect()));
            }
        };

        match middle.as_ref() {
            Bdd::False => {
                // noop
            }
            Bdd::True | Bdd::Node { .. } => {
                acc.extend(self.to_schema_list_bdd_vec(middle)?);
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
                    .chain(self.convert_to_schema_list_node_bdd_vec(atom, left, middle, right)?);

                acc.push(Self::intersect_list_atomics(ty.collect()));
            }
        }
        Ok(acc)
    }
    pub fn to_schema_list_bdd_vec(&mut self, bdd: &Rc<Bdd>) -> anyhow::Result<Vec<Rc<ListAtomic>>> {
        match bdd.as_ref() {
            Bdd::True => {
                // vec![Rc::new(ListAtomic {
                //     prefix_items: vec![],
                //     items: Rc::new(SemType::new_unknown()),
                // })]
                bail!("to_schema_list_bdd_vec - true should not be here")
            }
            Bdd::False => Ok(vec![Rc::new(ListAtomic {
                prefix_items: vec![],
                items: Rc::new(SemType::new_never()),
            })]),
            Bdd::Node {
                atom,
                left,
                middle,
                right,
            } => self.convert_to_schema_list_node_bdd_vec(atom, left, middle, right),
        }
    }
}

struct SchemerContext<'a, 'b> {
    ctx: SemTypeResolverContext<'a>,

    schemer_memo: BTreeMap<Rc<SemType>, SchemaMemo>,
    validators: Vec<NamedSchema>,

    recursive_validators: BTreeSet<String>,
    counter: &'b mut usize,
}

impl<'a, 'b> SchemerContext<'a, 'b> {
    fn new(ctx: &'a mut SemTypeContext, counter: &'b mut usize) -> Self {
        Self {
            ctx: SemTypeResolverContext(ctx),
            validators: vec![],
            schemer_memo: BTreeMap::new(),
            recursive_validators: BTreeSet::new(),
            counter,
        }
    }

    fn mapping_atom_schema(&mut self, mt: &Rc<MappingAtomicType>) -> anyhow::Result<JsonSchema> {
        let mut acc: Vec<(String, Optionality<JsonSchema>)> = vec![];

        for (k, v) in mt.vs.iter() {
            let schema = self.convert_to_schema(v, None)?;
            let ty = if v.has_void() {
                schema.optional()
            } else {
                schema.required()
            };
            acc.push((k.clone(), ty));
        }

        let rest = if mt.rest.is_empty(self.ctx.0) {
            bail!("rest should not be empty, all records are open")
        } else if mt.rest.is_any() {
            None
        } else {
            let schema = self.convert_to_schema(&mt.rest, None)?;
            Some(Box::new(schema))
        };

        Ok(JsonSchema::Object {
            vs: BTreeMap::from_iter(acc),
            rest,
        })
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
    ) -> anyhow::Result<JsonSchema> {
        let mt = match atom.as_ref() {
            Atom::Mapping(a) => self.ctx.0.get_mapping_atomic(*a).clone(),
            _ => unreachable!(),
        };

        let explained_sts = self.mapping_atom_schema(&mt)?;

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
                    self.convert_to_schema_mapping_node(atom, left, middle, right)?
                ]);
                acc.push(JsonSchema::all_of(ty.collect()));
            }
        };
        match middle.as_ref() {
            Bdd::False => {
                // noop
            }
            Bdd::True | Bdd::Node { .. } => {
                acc.push(self.convert_to_schema_mapping(middle)?);
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
                    self.convert_to_schema_mapping_node(atom, left, middle, right)?,
                ]);
                acc.push(ty)
            }
        }
        Ok(JsonSchema::any_of(acc))
    }

    fn convert_to_schema_mapping(&mut self, bdd: &Rc<Bdd>) -> anyhow::Result<JsonSchema> {
        match bdd.as_ref() {
            Bdd::True => {
                bail!("convert_to_schema_mapping - true should not be here")
            }
            Bdd::False => {
                bail!("convert_to_schema_mapping - false should not be here")
            }
            Bdd::Node {
                atom,
                left,
                middle,
                right,
            } => self.convert_to_schema_mapping_node(atom, left, middle, right),
        }
    }

    fn list_atom_schema(&mut self, mt: &Rc<ListAtomic>) -> anyhow::Result<JsonSchema> {
        if mt.prefix_items.is_empty() {
            if mt.items.is_any() {
                return Ok(JsonSchema::AnyArrayLike);
            }
            return Ok(JsonSchema::Array(Box::new(
                self.convert_to_schema(&mt.items, None)?,
            )));
        }

        let prefix_items = mt
            .prefix_items
            .iter()
            .map(|it| self.convert_to_schema(it, None))
            .collect::<anyhow::Result<Vec<_>>>()?;

        let items = if mt.items.is_never() {
            None
        } else {
            Some(Box::new(self.convert_to_schema(&mt.items, None)?))
        };
        Ok(JsonSchema::Tuple {
            prefix_items,
            items,
        })
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
    ) -> anyhow::Result<JsonSchema> {
        let lt = match atom.as_ref() {
            Atom::List(a) => self.ctx.0.get_list_atomic(*a).clone(),
            _ => unreachable!(),
        };

        let explained_sts = self.list_atom_schema(&lt)?;

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
                    self.convert_to_schema_list_node(atom, left, middle, right)?
                ]);
                acc.push(JsonSchema::all_of(ty.collect()));
            }
        };

        match middle.as_ref() {
            Bdd::False => {
                // noop
            }
            Bdd::True | Bdd::Node { .. } => {
                acc.push(self.convert_to_schema_list(middle)?);
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
                    self.convert_to_schema_list_node(atom, left, middle, right)?,
                ]);
                acc.push(ty)
            }
        }
        Ok(JsonSchema::any_of(acc))
    }
    fn convert_to_schema_list(&mut self, bdd: &Rc<Bdd>) -> anyhow::Result<JsonSchema> {
        match bdd.as_ref() {
            Bdd::True => {
                bail!("convert_to_schema_list - true should not be here")
            }
            Bdd::False => {
                bail!("convert_to_schema_list - false should not be here")
            }
            Bdd::Node {
                atom,
                left,
                middle,
                right,
            } => self.convert_to_schema_list_node(atom, left, middle, right),
        }
    }

    fn convert_to_schema_no_cache(&mut self, ty: &SemType) -> anyhow::Result<JsonSchema> {
        if ty.all == 0 && ty.subtype_data.is_empty() {
            return Ok(JsonSchema::StNever);
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
                        acc.insert(JsonSchema::Null);
                    }
                    SubTypeTag::Mapping => {
                        acc.insert(JsonSchema::object(vec![], Some(JsonSchema::Any.into())));
                    }
                    SubTypeTag::List => {
                        acc.insert(JsonSchema::AnyArrayLike);
                    }
                    SubTypeTag::Function => {
                        acc.insert(JsonSchema::Function);
                    }
                };
            }
        }

        for s in &ty.subtype_data {
            match s.as_ref() {
                ProperSubtype::Boolean(v) => {
                    acc.insert(JsonSchema::Const(JsonSchemaConst::Bool(*v)));
                }
                ProperSubtype::Number { allowed, values } => {
                    for h in values {
                        match h {
                            NumberRepresentationOrFormat::Lit(n) => {
                                acc.insert(maybe_not(
                                    JsonSchema::Const(JsonSchemaConst::Number(n.clone())),
                                    !allowed,
                                ));
                            }
                            NumberRepresentationOrFormat::Format(fmt) => {
                                acc.insert(maybe_not(
                                    JsonSchema::NumberWithFormat(fmt.clone()),
                                    !allowed,
                                ));
                            }
                        }
                    }
                }
                ProperSubtype::String { allowed, values } => {
                    for h in values {
                        match h {
                            StringLitOrFormat::Lit(st) => {
                                acc.insert(maybe_not(
                                    JsonSchema::Const(JsonSchemaConst::String(st.clone())),
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
                            StringLitOrFormat::Tpl(items) => {
                                acc.insert(maybe_not(
                                    JsonSchema::TplLitType(items.clone()),
                                    !allowed,
                                ));
                            }
                        }
                    }
                }
                ProperSubtype::Mapping(bdd) => {
                    let mapping_ty = self.convert_to_schema_mapping(bdd)?;
                    acc.insert(mapping_ty);
                }
                ProperSubtype::List(bdd) => {
                    acc.insert(self.convert_to_schema_list(bdd)?);
                }
            };
        }

        Ok(JsonSchema::any_of(acc.into_iter().collect()))
    }
    pub fn convert_to_schema(
        &mut self,
        ty: &Rc<SemType>,
        name: Option<&str>,
    ) -> anyhow::Result<JsonSchema> {
        let new_name = match name {
            Some(n) => n.to_string(),
            None => {
                *self.counter += 1;
                format!("t_{}", self.counter)
            }
        };
        if let Some(mater) = self.schemer_memo.get(ty) {
            match mater {
                SchemaMemo::Schema(mater) => return Ok(mater.clone()),
                SchemaMemo::Undefined(ref_name) => {
                    self.recursive_validators.insert(ref_name.clone());
                    return Ok(JsonSchema::Ref(ref_name.into()));
                }
            }
        } else {
            self.schemer_memo
                .insert(ty.clone(), SchemaMemo::Undefined(new_name.clone()));
        }
        let schema = self.convert_to_schema_no_cache(ty)?;
        self.schemer_memo
            .insert(ty.clone(), SchemaMemo::Schema(schema.clone()));
        self.validators.push(NamedSchema {
            name: new_name,
            schema: schema.clone(),
        });

        Ok(schema)
    }
}

pub fn to_validators(
    ctx: &mut SemTypeContext,
    ty: &Rc<SemType>,
    name: &str,
    counter: &mut usize,
) -> anyhow::Result<(NamedSchema, Vec<NamedSchema>)> {
    let mut schemer = SchemerContext::new(ctx, counter);
    let out = schemer.convert_to_schema(ty, Some(name))?;
    let vs: Vec<NamedSchema> = schemer
        .validators
        .into_iter()
        .filter(|it| schemer.recursive_validators.contains(&it.name))
        .collect();

    let vs = vs.into_iter().filter(|it| it.name != name).collect();
    Ok((
        NamedSchema {
            name: name.into(),
            schema: out,
        },
        vs,
    ))
}
fn maybe_not(it: JsonSchema, add_not: bool) -> JsonSchema {
    if add_not {
        JsonSchema::StNot(Box::new(it))
    } else {
        it
    }
}
