use std::collections::BTreeSet;
use std::rc::Rc;

use crate::ast::json_schema::{JsonSchemaConst, Optionality};
use crate::subtyping::subtype::NumberRepresentationOrFormat;
use crate::{ast::json_schema::JsonSchema, NamedSchema};

use self::bdd::{ListAtomic, MappingAtomic};
use self::semtype::{ComplexSemType, MappingAtomicType, SemType, SemTypeContext, SemTypeOps};
use self::subtype::StringLitOrFormat;
pub mod bdd;
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

    fn get_reference(&self, name: &str) -> Result<&JsonSchema> {
        for validator in self.validators {
            if validator.name == name {
                return Ok(&validator.schema);
            }
        }
        Err(anyhow!("reference not found: {}", name))
    }

    fn convert_to_sem_type(
        &mut self,
        schema: &JsonSchema,
        builder: &mut SemTypeContext,
    ) -> Result<Rc<SemType>> {
        match schema {
            JsonSchema::Ref(name) => {
                let schema = self.get_reference(name)?.clone();

                // handle recursive types
                if let JsonSchema::Tuple {
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
                if let JsonSchema::Object { vs, rest } = schema {
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
                            let vs: MappingAtomic = vs
                                .iter()
                                .map(|(k, v)| match v {
                                    Optionality::Optional(v) => self
                                        .convert_to_sem_type(v, builder)
                                        .map(|v| (k.clone(), SemTypeContext::optional(v))),
                                    Optionality::Required(v) => {
                                        self.convert_to_sem_type(v, builder).map(|v| (k.clone(), v))
                                    }
                                })
                                .collect::<Result<_>>()?;
                            let rest = match rest {
                                Some(r) => self.convert_to_sem_type(&r, builder)?,
                                None => SemTypeContext::unknown().into(),
                            };

                            builder.mapping_definitions[idx] = Some(Rc::new(MappingAtomicType {
                                vs: vs.into(),
                                rest,
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
            JsonSchema::AnyOf(vs) => {
                let mut acc = Rc::new(SemTypeContext::never());
                for v in vs {
                    acc = acc.union(&self.convert_to_sem_type(v, builder)?);
                }
                Ok(acc)
            }
            JsonSchema::AllOf(vs) => {
                let mut acc = Rc::new(SemTypeContext::unknown());
                for v in vs {
                    let ty = self.convert_to_sem_type(v, builder)?;
                    acc = acc.intersect(&ty);
                }
                Ok(acc)
            }
            JsonSchema::Null => Ok(SemTypeContext::null().into()),
            JsonSchema::Boolean => Ok(SemTypeContext::boolean().into()),
            JsonSchema::String => Ok(SemTypeContext::string().into()),
            JsonSchema::Number => Ok(SemTypeContext::number().into()),
            JsonSchema::Any => Ok(SemTypeContext::unknown().into()),
            JsonSchema::StringWithFormat(s) => {
                Ok(SemTypeContext::string_const(StringLitOrFormat::Format(s.clone())).into())
            }
            JsonSchema::StringFormatExtends(vs) => Ok(SemTypeContext::string_const(
                StringLitOrFormat::FormatExtends(vs.clone()),
            )
            .into()),
            JsonSchema::NumberWithFormat(s) => Ok(SemTypeContext::number_const(
                NumberRepresentationOrFormat::Format(s.clone()),
            )
            .into()),
            JsonSchema::NumberFormatExtends(vs) => Ok(SemTypeContext::number_const(
                NumberRepresentationOrFormat::FormatExtends(vs.clone()),
            )
            .into()),
            JsonSchema::TplLitType(tpl) => {
                Ok(SemTypeContext::string_const(StringLitOrFormat::Tpl(tpl.clone())).into())
            }
            JsonSchema::Object { vs, rest } => {
                let vs = vs
                    .iter()
                    .map(|(k, v)| match v {
                        Optionality::Optional(v) => self
                            .convert_to_sem_type(v, builder)
                            .map(|v| (k.clone(), SemTypeContext::optional(v))),
                        Optionality::Required(v) => {
                            self.convert_to_sem_type(v, builder).map(|v| (k.clone(), v))
                        }
                    })
                    .collect::<Result<_>>()?;
                let rest = match rest {
                    Some(r) => self.convert_to_sem_type(r, builder)?,
                    None => SemTypeContext::unknown().into(),
                };
                Ok(builder.mapping_definition(Rc::new(vs), rest).into())
            }
            JsonSchema::MappedRecord { key, rest } => {
                let key_st = self.convert_to_sem_type(key, builder)?;
                let rest_st = self.convert_to_sem_type(rest, builder)?;
                Ok(builder.mapped_record_definition(key_st, rest_st).into())
            }
            JsonSchema::Array(items) => {
                let items = self.convert_to_sem_type(items, builder)?;
                Ok(builder.array(items).into())
            }
            JsonSchema::Tuple {
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
            JsonSchema::Const(cons) => match cons {
                JsonSchemaConst::Null => Ok(SemTypeContext::null().into()),
                JsonSchemaConst::Bool(b) => Ok(SemTypeContext::boolean_const(*b).into()),
                JsonSchemaConst::String(s) => {
                    Ok(SemTypeContext::string_const(StringLitOrFormat::Lit(s.clone())).into())
                }
                JsonSchemaConst::Number(n) => Ok(SemTypeContext::number_const(
                    NumberRepresentationOrFormat::Lit(n.clone()),
                )
                .into()),
            },
            JsonSchema::AnyArrayLike => {
                self.convert_to_sem_type(&JsonSchema::Array(JsonSchema::Any.into()), builder)
            }
            JsonSchema::Codec(s) => {
                Ok(SemTypeContext::string_const(StringLitOrFormat::Codec(s.clone())).into())
            }
            JsonSchema::StNever => Ok(SemTypeContext::never().into()),
            JsonSchema::StNot(it) => {
                let chd = self.convert_to_sem_type(it, builder)?;
                Ok(chd.complement())
            }
            JsonSchema::Function => Ok(SemTypeContext::function().into()),
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

impl ToSemType for JsonSchema {
    fn to_sem_type(
        &self,
        validators: &[&NamedSchema],
        ctx: &mut SemTypeContext,
    ) -> Result<Rc<SemType>> {
        ToSemTypeConverter::new(validators).convert_to_sem_type(self, ctx)
    }
}
