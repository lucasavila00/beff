use self::bdd::ListAtomic;
use self::semtype::{ComplexSemType, SemType, SemTypeContext, SemTypeOps};
use self::subtype::StringLitOrFormat;
use crate::ast::runtype::{CustomFormat, Optionality, RuntypeConst};
use crate::subtyping::bdd::{IndexedPropertiesAtomic, MappingAtomicType};
use crate::subtyping::subtype::NumberRepresentationOrFormat;
use crate::{ast::runtype::Runtype, NamedSchema};
use std::collections::{BTreeMap, BTreeSet};
use std::rc::Rc;
pub mod bdd;
pub mod dnf;
pub mod evidence;
pub mod semtype;
pub mod subtype;
pub mod to_schema;
use anyhow::Result;
use anyhow::{anyhow, bail};

struct ToSemTypeConverter<'a> {
    validators: &'a [&'a NamedSchema],
    seen_refs: BTreeSet<String>,
}

impl<'a> ToSemTypeConverter<'a> {
    fn new(validators: &'a [&'a NamedSchema]) -> Self {
        Self {
            validators,
            seen_refs: BTreeSet::new(),
        }
    }

    fn get_reference(&self, name: &str) -> Result<&Runtype> {
        for validator in self.validators {
            if validator.name == name {
                return Ok(&validator.schema);
            }
        }
        Err(anyhow!("reference not found: {}", name))
    }

    fn convert_to_sem_type(
        &mut self,
        schema: &Runtype,
        builder: &mut SemTypeContext,
    ) -> Result<Rc<SemType>> {
        match schema {
            Runtype::Ref(name) => {
                let schema = self.get_reference(name)?.clone();

                // handle recursive types
                if let Runtype::Tuple {
                    prefix_items,
                    items,
                } = schema
                {
                    match builder.list_json_schema_ref_memo.get(name) {
                        Some(idx) => {
                            let ty = Rc::new(SemTypeContext::mapping_definition_from_idx(*idx));
                            return Ok(ty);
                        }
                        None => {
                            let idx = builder.list_definitions.len();
                            builder
                                .list_json_schema_ref_memo
                                .insert(name.to_string(), idx);
                            builder.list_definitions.push(None);

                            let items = match items {
                                Some(items) => Some(self.convert_to_sem_type(&items, builder)?),
                                None => None,
                            };
                            let prefix_items: Vec<Rc<ComplexSemType>> = prefix_items
                                .iter()
                                .map(|v| self.convert_to_sem_type(v, builder))
                                .collect::<Result<_>>()?;

                            builder.list_definitions[idx] = Some(Rc::new(ListAtomic {
                                prefix_items,
                                // todo: should be unknown?
                                items: items.unwrap_or(SemTypeContext::never().into()),
                            }));

                            let ty = Rc::new(SemTypeContext::list_definition_from_idx(idx));

                            return Ok(ty);
                        }
                    }
                }
                // handle recursive types
                if let Runtype::Object {
                    vs,
                    indexed_properties,
                } = schema
                {
                    match builder.mapping_json_schema_ref_memo.get(name) {
                        Some(idx) => {
                            let ty = Rc::new(SemTypeContext::mapping_definition_from_idx(*idx));
                            return Ok(ty);
                        }
                        None => {
                            let idx = builder.mapping_definitions.len();
                            builder
                                .mapping_json_schema_ref_memo
                                .insert(name.to_string(), idx);
                            builder.mapping_definitions.push(None);
                            let vs: BTreeMap<String, Rc<SemType>> = vs
                                .iter()
                                .map(|(k, v)| match v {
                                    Optionality::Optional(v) => {
                                        self.convert_to_sem_type(v, builder).and_then(|v| {
                                            SemTypeContext::optional(v).map(|v| (k.clone(), v))
                                        })
                                    }
                                    Optionality::Required(v) => {
                                        self.convert_to_sem_type(v, builder).map(|v| (k.clone(), v))
                                    }
                                })
                                .collect::<Result<_>>()?;
                            let mut indexed_props_acc = None;
                            if let Some(it) = indexed_properties {
                                let v = match &it.value {
                                    Optionality::Optional(v) => self
                                        .convert_to_sem_type(v, builder)
                                        .and_then(SemTypeContext::optional)?,
                                    Optionality::Required(v) => {
                                        self.convert_to_sem_type(v, builder)?
                                    }
                                };
                                let k = self.convert_to_sem_type(&it.key, builder)?;
                                let t = IndexedPropertiesAtomic { key: k, value: v };
                                indexed_props_acc = Some(t);
                            }

                            builder.mapping_definitions[idx] = Some(Rc::new(MappingAtomicType {
                                vs,
                                indexed_properties: indexed_props_acc,
                            }));
                            let ty = Rc::new(SemTypeContext::mapping_definition_from_idx(idx));
                            return Ok(ty);
                        }
                    }
                };

                if self.seen_refs.contains(name) {
                    bail!("recursive type: {}", name)
                }

                self.seen_refs.insert(name.clone());
                let ty = self.convert_to_sem_type(&schema, builder);
                self.seen_refs.remove(name);
                Ok(ty?)
            }
            Runtype::AnyOf(vs) => {
                let mut acc = Rc::new(SemTypeContext::never());
                for v in vs {
                    acc = acc.union(&self.convert_to_sem_type(v, builder)?)?;
                }
                Ok(acc)
            }
            Runtype::AllOf(vs) => {
                let mut acc = Rc::new(SemTypeContext::unknown());
                for v in vs {
                    let ty = self.convert_to_sem_type(v, builder)?;
                    acc = acc.intersect(&ty)?;
                }
                Ok(acc)
            }
            Runtype::Null => Ok(SemTypeContext::null().into()),
            Runtype::Boolean => Ok(SemTypeContext::boolean().into()),
            Runtype::String => Ok(SemTypeContext::string().into()),
            Runtype::Number => Ok(SemTypeContext::number().into()),
            Runtype::Any => Ok(SemTypeContext::unknown().into()),
            Runtype::StringWithFormat(CustomFormat(first, rest)) => Ok(
                SemTypeContext::string_const(StringLitOrFormat::Format(CustomFormat(
                    first.clone(),
                    rest.clone(),
                )))
                .into(),
            ),
            Runtype::NumberWithFormat(CustomFormat(first, rest)) => Ok(
                SemTypeContext::number_const(NumberRepresentationOrFormat::Format(CustomFormat(
                    first.clone(),
                    rest.clone(),
                )))
                .into(),
            ),
            Runtype::TplLitType(tpl) => {
                Ok(SemTypeContext::string_const(StringLitOrFormat::Tpl(tpl.clone())).into())
            }
            Runtype::Object {
                vs,
                indexed_properties,
            } => {
                let vs = vs
                    .iter()
                    .map(|(k, v)| match v {
                        Optionality::Optional(v) => self
                            .convert_to_sem_type(v, builder)
                            .and_then(|v| SemTypeContext::optional(v).map(|v| (k.clone(), v))),
                        Optionality::Required(v) => {
                            self.convert_to_sem_type(v, builder).map(|v| (k.clone(), v))
                        }
                    })
                    .collect::<Result<_>>()?;
                let mut indexed_props_acc = None;
                if let Some(it) = indexed_properties {
                    let v = match &it.value {
                        Optionality::Optional(v) => self
                            .convert_to_sem_type(v, builder)
                            .and_then(SemTypeContext::optional)?,
                        Optionality::Required(v) => self.convert_to_sem_type(v, builder)?,
                    };
                    let k = self.convert_to_sem_type(&it.key, builder)?;
                    let t = IndexedPropertiesAtomic { key: k, value: v };
                    indexed_props_acc = Some(t);
                }

                Ok(builder.mapping_definition(vs, indexed_props_acc).into())
            }
            Runtype::Array(items) => {
                let items = self.convert_to_sem_type(items, builder)?;
                Ok(builder.array(items).into())
            }
            Runtype::Tuple {
                prefix_items,
                items,
            } => {
                let items = match items {
                    Some(items) => Some(self.convert_to_sem_type(items, builder)?),
                    None => None,
                };
                let prefix_items: Vec<Rc<ComplexSemType>> = prefix_items
                    .iter()
                    .map(|v| self.convert_to_sem_type(v, builder))
                    .collect::<Result<_>>()?;
                Ok(builder.tuple(prefix_items, items).into())
            }
            Runtype::Const(cons) => match cons {
                RuntypeConst::Bool(b) => Ok(SemTypeContext::boolean_const(*b).into()),
                RuntypeConst::Number(n) => Ok(SemTypeContext::number_const(
                    NumberRepresentationOrFormat::Lit(n.clone()),
                )
                .into()),
            },
            Runtype::AnyArrayLike => {
                self.convert_to_sem_type(&Runtype::Array(Runtype::Any.into()), builder)
            }
            Runtype::Date => Ok(SemTypeContext::date().into()),
            Runtype::BigInt => Ok(SemTypeContext::bigint().into()),
            Runtype::StNever => Ok(SemTypeContext::never().into()),
            Runtype::StNot(it) => {
                let chd = self.convert_to_sem_type(it, builder)?;
                Ok(chd.complement()?)
            }
            Runtype::Function => Ok(SemTypeContext::function().into()),
        }
    }
}

pub trait ToSemType {
    fn to_sem_type(
        &self,
        validators: &[&NamedSchema],
        ctx: &mut SemTypeContext,
    ) -> Result<Rc<SemType>>;
}

impl ToSemType for Runtype {
    fn to_sem_type(
        &self,
        validators: &[&NamedSchema],
        ctx: &mut SemTypeContext,
    ) -> Result<Rc<SemType>> {
        ToSemTypeConverter::new(validators).convert_to_sem_type(self, ctx)
    }
}
