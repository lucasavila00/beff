use std::rc::Rc;

use crate::ast::json::Json;
use crate::ast::json_schema::Optionality;
use crate::{ast::json_schema::JsonSchema, open_api_ast::Validator};

use self::bdd::MappingAtomic;
use self::semtype::{SemType, SemTypeBuilder, SemTypeOps};
use self::subtype::StringLitOrFormat;
pub mod bdd;
pub mod semtype;
pub mod subtype;
use anyhow::anyhow;
use anyhow::Result;

struct ToSemTypeConverter<'a> {
    validators: &'a Vec<Validator>,
}

impl<'a> ToSemTypeConverter<'a> {
    fn new(validators: &'a Vec<Validator>) -> Self {
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
        builder: &mut SemTypeBuilder,
    ) -> Result<Rc<SemType>> {
        match schema {
            JsonSchema::Ref(name) => {
                let schema = self.get_reference(name)?;
                if let JsonSchema::Object(vs) = schema {
                    match builder.json_schema_ref_memo.get(name) {
                        Some(idx) => {
                            let ty = Rc::new(SemTypeBuilder::mapping_definition_from_idx(*idx));
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
                                        .map(|v| (k.clone(), SemTypeBuilder::optional(v))),
                                    Optionality::Required(v) => {
                                        self.to_sem_type(v, builder).map(|v| (k.clone(), v))
                                    }
                                })
                                .collect::<Result<_>>()?;
                            builder.mapping_definitions[idx] = Some(Rc::new(vs));
                            let ty = Rc::new(SemTypeBuilder::mapping_definition_from_idx(idx));
                            return Ok(ty);
                        }
                    }
                };
                let ty = self.to_sem_type(schema, builder)?;
                Ok(ty)
            }
            JsonSchema::AnyOf(vs) => {
                let mut acc = Rc::new(SemTypeBuilder::never());
                for v in vs {
                    acc = acc.union(&self.to_sem_type(v, builder)?);
                }
                Ok(acc)
            }
            JsonSchema::AllOf(vs) => {
                let mut acc = Rc::new(SemTypeBuilder::never());
                for v in vs {
                    acc = acc.intersect(&self.to_sem_type(v, builder)?);
                }
                Ok(acc)
            }
            JsonSchema::Null => Ok(SemTypeBuilder::null().into()),
            JsonSchema::Boolean => Ok(SemTypeBuilder::boolean().into()),
            JsonSchema::String => Ok(SemTypeBuilder::string().into()),
            JsonSchema::Number => Ok(SemTypeBuilder::number().into()),
            JsonSchema::Any => Ok(SemTypeBuilder::unknown().into()),
            JsonSchema::StringWithFormat(s) => {
                Ok(SemTypeBuilder::string_const(StringLitOrFormat::Format(s.clone())).into())
            }
            JsonSchema::Object(vs) => {
                let vs = vs
                    .iter()
                    .map(|(k, v)| match v {
                        Optionality::Optional(v) => self
                            .to_sem_type(v, builder)
                            .map(|v| (k.clone(), SemTypeBuilder::optional(v))),
                        Optionality::Required(v) => {
                            self.to_sem_type(v, builder).map(|v| (k.clone(), v))
                        }
                    })
                    .collect::<Result<_>>()?;
                Ok(builder.mapping_definition(vs).into())
            }
            JsonSchema::Array(_) => todo!(),
            JsonSchema::Tuple {
                prefix_items,
                items,
            } => todo!(),
            JsonSchema::Const(cons) => match cons {
                Json::Null => Ok(SemTypeBuilder::null().into()),
                Json::Bool(b) => Ok(SemTypeBuilder::boolean_const(*b).into()),
                Json::String(s) => {
                    Ok(SemTypeBuilder::string_const(StringLitOrFormat::Lit(s.clone())).into())
                }
                Json::Number(n) => Ok(SemTypeBuilder::number_const(n.clone()).into()),
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

trait ToSemType {
    fn to_sub_type(
        &self,
        validators: &Vec<Validator>,
        builder: &mut SemTypeBuilder,
    ) -> Result<Rc<SemType>>;
}

impl ToSemType for JsonSchema {
    fn to_sub_type(
        &self,
        validators: &Vec<Validator>,
        builder: &mut SemTypeBuilder,
    ) -> Result<Rc<SemType>> {
        ToSemTypeConverter::new(validators).to_sem_type(self, builder)
    }
}

pub fn is_sub_type(
    a: &JsonSchema,
    b: &JsonSchema,
    validators: &Vec<Validator>,
    builder: &mut SemTypeBuilder,
) -> Result<bool> {
    let a = a.to_sub_type(validators, builder)?;
    let b = b.to_sub_type(validators, builder)?;
    return Ok(a.is_subtype(&b, builder));
}
