use super::{
    bdd::{Atom, Bdd, ListAtomic},
    semtype::{SemType, SemTypeContext},
    subtype::{NumberRepresentationOrFormat, ProperSubtype, StringLitOrFormat, SubTypeTag},
};
use crate::{
    NamedSchema, RuntypeName,
    ast::runtype::{
        CustomFormat, IndexedProperty, Optionality, Runtype, RuntypeConst, TplLitTypeItem,
    },
    subtyping::{
        bdd::MappingAtomicType,
        dnf::{Conjunction, bdd_to_dnf},
        subtype::VoidUndefinedSubtype,
    },
};
use std::{
    collections::{BTreeMap, BTreeSet},
    rc::Rc,
};

pub enum SchemaMemo {
    Schema(Runtype),
    Undefined(RuntypeName),
}

pub struct SemTypeResolverContext<'a>(pub &'a mut SemTypeContext);

struct SchemerContext<'a, 'b> {
    ctx: SemTypeResolverContext<'a>,

    schemer_memo: BTreeMap<Rc<SemType>, SchemaMemo>,
    validators: Vec<NamedSchema>,

    recursive_validators: BTreeSet<RuntypeName>,
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

    fn mapping_atom_schema(&mut self, mt: &Rc<MappingAtomicType>) -> anyhow::Result<Runtype> {
        let mut acc: Vec<(String, Optionality<Runtype>)> = vec![];

        for (k, v) in mt.vs.iter() {
            let schema = self.convert_to_schema(v, None)?;
            let ty = if v.has_optional() {
                schema.optional()
            } else {
                schema.required()
            };
            acc.push((k.clone(), ty));
        }

        let mut indexed_properties_acc = None;

        if let Some(it) = &mt.indexed_properties {
            let k = self.convert_to_schema(&it.key, None)?;
            let schema = self.convert_to_schema(&it.value, None)?;
            let ty = if it.value.has_optional() {
                schema.optional()
            } else {
                schema.required()
            };
            indexed_properties_acc = Some(Box::new(IndexedProperty { key: k, value: ty }));
        }

        Ok(Runtype::Object {
            vs: BTreeMap::from_iter(acc),
            indexed_properties: indexed_properties_acc,
        })
    }

    fn mapping_conjunction_to_schema(&mut self, clause: &Conjunction) -> anyhow::Result<Runtype> {
        let mut acc = vec![];

        for atom in &clause.positive {
            let mt = match atom {
                Atom::Mapping(a) => self.ctx.0.get_mapping_atomic(*a).clone(),
                _ => unreachable!(),
            };
            let explained_sts = self.mapping_atom_schema(&mt)?;
            acc.push(explained_sts);
        }
        for atom in &clause.negative {
            let mt = match atom {
                Atom::Mapping(a) => self.ctx.0.get_mapping_atomic(*a).clone(),
                _ => unreachable!(),
            };
            let explained_sts = self.mapping_atom_schema(&mt)?;
            acc.push(Runtype::StNot(Box::new(explained_sts)));
        }

        Ok(Runtype::AllOf(acc.into_iter().collect()))
    }

    fn mapping_to_schema(&mut self, bdd: &Rc<Bdd>) -> anyhow::Result<Runtype> {
        let dnf = bdd_to_dnf(bdd);
        let mut acc = vec![];

        // The DNF is a disjunction (OR/union) of conjunctions (AND/intersect)
        for clause in dnf.iter() {
            let conj = self.mapping_conjunction_to_schema(clause)?;
            acc.push(conj);
        }

        Ok(Runtype::AnyOf(acc.into_iter().collect()))
    }

    fn list_atom_schema(&mut self, mt: &Rc<ListAtomic>) -> anyhow::Result<Runtype> {
        if mt.prefix_items.is_empty() {
            if mt.items.is_any() {
                return Ok(Runtype::AnyArrayLike);
            }
            return Ok(Runtype::Array(Box::new(
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
        Ok(Runtype::Tuple {
            prefix_items,
            items,
        })
    }

    fn list_conjunction_to_schema(&mut self, clause: &Conjunction) -> anyhow::Result<Runtype> {
        let mut acc = vec![];

        for atom in &clause.positive {
            let lt = match atom {
                Atom::List(a) => self.ctx.0.get_list_atomic(*a).clone(),
                _ => unreachable!(),
            };

            let explained_sts = self.list_atom_schema(&lt)?;
            acc.push(explained_sts);
        }
        for atom in &clause.negative {
            let lt = match atom {
                Atom::List(a) => self.ctx.0.get_list_atomic(*a).clone(),
                _ => unreachable!(),
            };

            let explained_sts = self.list_atom_schema(&lt)?;
            acc.push(Runtype::StNot(Box::new(explained_sts)));
        }

        Ok(Runtype::AllOf(acc.into_iter().collect()))
    }

    fn list_to_schema(&mut self, bdd: &Rc<Bdd>) -> anyhow::Result<Runtype> {
        let dnf = bdd_to_dnf(bdd);
        let mut acc = vec![];

        // The DNF is a disjunction (OR/union) of conjunctions (AND/intersect)
        for clause in dnf.iter() {
            let conj = self.list_conjunction_to_schema(clause)?;
            acc.push(conj);
        }

        Ok(Runtype::AnyOf(acc.into_iter().collect()))
    }

    fn convert_to_schema_no_cache(&mut self, ty: &SemType) -> anyhow::Result<Runtype> {
        if ty.all == 0 && ty.subtype_data.is_empty() {
            return Ok(Runtype::Never);
        }

        let mut acc = BTreeSet::new();

        for t in SubTypeTag::all() {
            if (ty.all & t.code()) != 0 {
                match t {
                    SubTypeTag::Null => {
                        acc.insert(Runtype::Null);
                    }
                    SubTypeTag::Boolean => {
                        acc.insert(Runtype::Boolean);
                    }
                    SubTypeTag::Number => {
                        acc.insert(Runtype::Number);
                    }
                    SubTypeTag::String => {
                        acc.insert(Runtype::String);
                    }
                    SubTypeTag::OptionalProp => {
                        acc.insert(Runtype::Null);
                    }
                    SubTypeTag::Mapping => {
                        acc.insert(Runtype::any_object());
                    }
                    SubTypeTag::List => {
                        acc.insert(Runtype::AnyArrayLike);
                    }
                    SubTypeTag::Function => {
                        acc.insert(Runtype::Function);
                    }
                    SubTypeTag::BigInt => {
                        acc.insert(Runtype::BigInt);
                    }
                    SubTypeTag::Date => {
                        acc.insert(Runtype::Date);
                    }
                    SubTypeTag::VoidUndefined => {
                        acc.insert(Runtype::Undefined);
                    }
                };
            }
        }

        for s in &ty.subtype_data {
            match s.as_ref() {
                ProperSubtype::Boolean(v) => {
                    acc.insert(Runtype::Const(RuntypeConst::Bool(*v)));
                }
                ProperSubtype::Number { allowed, values } => {
                    for h in values {
                        match h {
                            NumberRepresentationOrFormat::Lit(n) => {
                                acc.insert(maybe_not(
                                    Runtype::Const(RuntypeConst::Number(n.clone())),
                                    !allowed,
                                ));
                            }
                            NumberRepresentationOrFormat::Format(CustomFormat(first, rest)) => {
                                acc.insert(maybe_not(
                                    Runtype::NumberWithFormat(CustomFormat(
                                        first.clone(),
                                        rest.clone(),
                                    )),
                                    !allowed,
                                ));
                            }
                        }
                    }
                }
                ProperSubtype::String { allowed, values } => {
                    for h in values {
                        match h {
                            StringLitOrFormat::Format(CustomFormat(first, rest)) => {
                                acc.insert(maybe_not(
                                    Runtype::StringWithFormat(CustomFormat(
                                        first.clone(),
                                        rest.clone(),
                                    )),
                                    !allowed,
                                ));
                            }
                            StringLitOrFormat::Tpl(items) => {
                                //
                                match items.0.first() {
                                    Some(TplLitTypeItem::StringConst(c)) => acc.insert(maybe_not(
                                        Runtype::single_string_const(c),
                                        !allowed,
                                    )),
                                    _ => acc.insert(maybe_not(
                                        Runtype::TplLitType(items.clone()),
                                        !allowed,
                                    )),
                                };
                            }
                        }
                    }
                }
                ProperSubtype::Mapping(bdd) => {
                    let mapping_ty = self.mapping_to_schema(bdd)?;
                    acc.insert(mapping_ty);
                }
                ProperSubtype::List(bdd) => {
                    acc.insert(self.list_to_schema(bdd)?);
                }
                ProperSubtype::VoidUndefined {
                    allowed,
                    values: value,
                } => {
                    for v in value {
                        match v {
                            VoidUndefinedSubtype::Void => {
                                acc.insert(maybe_not(Runtype::Void, !allowed));
                            }
                            VoidUndefinedSubtype::Undefined => {
                                acc.insert(maybe_not(Runtype::Undefined, !allowed));
                            }
                        }
                    }
                }
            };
        }

        Ok(Runtype::any_of(acc.into_iter().collect()))
    }
    pub fn convert_to_schema(
        &mut self,
        ty: &Rc<SemType>,
        name: Option<&RuntypeName>,
    ) -> anyhow::Result<Runtype> {
        let new_name = match name {
            Some(n) => n.clone(),
            None => {
                *self.counter += 1;
                RuntypeName::SemtypeRecursiveGenerated(*self.counter)
            }
        };
        if let Some(mater) = self.schemer_memo.get(ty) {
            match mater {
                SchemaMemo::Schema(mater) => return Ok(mater.clone()),
                SchemaMemo::Undefined(ref_name) => {
                    self.recursive_validators.insert(ref_name.clone());
                    return Ok(Runtype::Ref(ref_name.clone()));
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

pub fn semtype_to_runtypes(
    ctx: &mut SemTypeContext,
    ty: &Rc<SemType>,
    name: &RuntypeName,
    counter: &mut usize,
) -> anyhow::Result<(NamedSchema, Vec<NamedSchema>)> {
    let mut schemer = SchemerContext::new(ctx, counter);
    let out = schemer.convert_to_schema(ty, Some(name))?;
    let vs: Vec<NamedSchema> = schemer
        .validators
        .into_iter()
        .filter(|it| schemer.recursive_validators.contains(&it.name))
        .collect();

    let vs = vs.into_iter().filter(|it| &it.name != name).collect();
    Ok((
        NamedSchema {
            name: name.clone(),
            schema: out,
        },
        vs,
    ))
}
fn maybe_not(it: Runtype, add_not: bool) -> Runtype {
    if add_not {
        Runtype::StNot(Box::new(it))
    } else {
        it
    }
}
