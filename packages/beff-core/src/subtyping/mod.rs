use std::rc::Rc;

use crate::ast::json::Json;
use crate::ast::json_schema::Optionality;
use crate::{ast::json_schema::JsonSchema, open_api_ast::Validator};

use self::bdd::MappingAtomic;
use self::semtype::{SemType, SemTypeContext, SemTypeOps};
use self::subtype::StringLitOrFormat;
pub mod bdd;
pub mod semtype;
pub mod subtype;
use anyhow::anyhow;
use anyhow::Result;

struct ToSemTypeConverter<'a> {
    validators: &'a [&'a Validator],
}

impl<'a> ToSemTypeConverter<'a> {
    fn new(validators: &'a [&'a Validator]) -> Self {
        Self { validators }
    }

    fn get_reference(&self, name: &str) -> Result<&JsonSchema> {
        for validator in self.validators {
            if validator.name == name {
                return Ok(&validator.schema);
            }
        }
        return Err(anyhow!("reference not found: {}", name));
    }

    fn to_sem_type(
        &self,
        schema: &JsonSchema,
        builder: &mut SemTypeContext,
    ) -> Result<Rc<SemType>> {
        match schema {
            JsonSchema::Ref(name) => {
                let schema = self.get_reference(name)?;
                if let JsonSchema::Object(vs) = schema {
                    match builder.json_schema_ref_memo.get(name) {
                        Some(idx) => {
                            let ty = Rc::new(SemTypeContext::mapping_definition_from_idx(*idx));
                            return Ok(ty);
                        }
                        None => {
                            let idx = builder.mapping_definitions.len();
                            builder.json_schema_ref_memo.insert(name.to_string(), idx);
                            builder.mapping_definitions.push(None);
                            let vs: MappingAtomic = vs
                                .iter()
                                .map(|(k, v)| match v {
                                    Optionality::Optional(v) => self
                                        .to_sem_type(v, builder)
                                        .map(|v| (k.clone(), SemTypeContext::optional(v))),
                                    Optionality::Required(v) => {
                                        self.to_sem_type(v, builder).map(|v| (k.clone(), v))
                                    }
                                })
                                .collect::<Result<_>>()?;
                            builder.mapping_definitions[idx] = Some(Rc::new(vs));
                            let ty = Rc::new(SemTypeContext::mapping_definition_from_idx(idx));
                            return Ok(ty);
                        }
                    }
                };
                let ty = self.to_sem_type(schema, builder)?;
                Ok(ty)
            }
            JsonSchema::AnyOf(vs) => {
                let mut acc = Rc::new(SemTypeContext::never());
                for v in vs {
                    acc = acc.union(&self.to_sem_type(v, builder)?);
                }
                Ok(acc)
            }
            JsonSchema::AllOf(vs) => {
                let mut acc = Rc::new(SemTypeContext::never());
                for v in vs {
                    acc = acc.intersect(&self.to_sem_type(v, builder)?);
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
            JsonSchema::Object(vs) => {
                let vs = vs
                    .iter()
                    .map(|(k, v)| match v {
                        Optionality::Optional(v) => self
                            .to_sem_type(v, builder)
                            .map(|v| (k.clone(), SemTypeContext::optional(v))),
                        Optionality::Required(v) => {
                            self.to_sem_type(v, builder).map(|v| (k.clone(), v))
                        }
                    })
                    .collect::<Result<_>>()?;
                Ok(builder.mapping_definition(vs).into())
            }
            JsonSchema::Array(items) => {
                let items = self.to_sem_type(items, builder)?;
                Ok(builder.array(items).into())
            }
            JsonSchema::Tuple {
                prefix_items,
                items,
            } => {
                let items = match items {
                    Some(items) => Some(self.to_sem_type(items, builder)?),
                    None => None,
                };
                let prefix_items = prefix_items
                    .iter()
                    .map(|v| self.to_sem_type(v, builder))
                    .collect::<Result<_>>()?;
                Ok(builder.tuple(prefix_items, items).into())
            }
            JsonSchema::Const(cons) => match cons {
                Json::Null => Ok(SemTypeContext::null().into()),
                Json::Bool(b) => Ok(SemTypeContext::boolean_const(*b).into()),
                Json::String(s) => {
                    Ok(SemTypeContext::string_const(StringLitOrFormat::Lit(s.clone())).into())
                }
                Json::Number(n) => Ok(SemTypeContext::number_const(n.clone()).into()),
                Json::Array(_) => unreachable!("array cannot be used as a type const"),
                Json::Object(_) => unreachable!("object cannot be used as a type const"),
            },
            JsonSchema::Error => unreachable!("should not be part of semantic types"),
            JsonSchema::OpenApiResponseRef(_) => {
                unreachable!("should not be part of semantic types")
            }
        }
    }
}

pub trait ToSemType {
    fn to_sub_type(
        &self,
        validators: &[&Validator],
        ctx: &mut SemTypeContext,
    ) -> Result<Rc<SemType>>;
}

impl ToSemType for JsonSchema {
    fn to_sub_type(
        &self,
        validators: &[&Validator],
        ctx: &mut SemTypeContext,
    ) -> Result<Rc<SemType>> {
        ToSemTypeConverter::new(validators).to_sem_type(self, ctx)
    }
}
