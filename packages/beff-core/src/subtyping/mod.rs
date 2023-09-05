use std::rc::Rc;

use crate::ast::json::Json;
use crate::ast::json_schema::Optionality;
use crate::{ast::json_schema::JsonSchema, open_api_ast::Validator};

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

    fn to_sem_type(&self, schema: &JsonSchema) -> Result<Rc<SemType>> {
        match schema {
            JsonSchema::Ref(name) => self.to_sem_type(self.get_reference(name)?),
            JsonSchema::AnyOf(vs) => {
                let mut acc = Rc::new(SemTypeBuilder::never());
                for v in vs {
                    acc = acc.union(&self.to_sem_type(v)?);
                }
                Ok(acc)
            }
            JsonSchema::AllOf(vs) => {
                let mut acc = Rc::new(SemTypeBuilder::never());
                for v in vs {
                    acc = acc.intersect(&self.to_sem_type(v)?);
                }
                Ok(acc)
            }
            JsonSchema::Null => Ok(SemTypeBuilder::null().into()),
            JsonSchema::Boolean => Ok(SemTypeBuilder::boolean().into()),
            JsonSchema::String => Ok(SemTypeBuilder::string().into()),
            JsonSchema::Number => Ok(SemTypeBuilder::number().into()),
            JsonSchema::Any => Ok(SemTypeBuilder::any().into()),
            JsonSchema::StringWithFormat(s) => {
                Ok(SemTypeBuilder::string_const(StringLitOrFormat::Format(s.clone())).into())
            }
            JsonSchema::Object(vs) => Ok(SemTypeBuilder::mapping_definition(
                vs.iter()
                    .map(|(k, v)| match v {
                        Optionality::Optional(v) => self
                            .to_sem_type(v)
                            .map(|v| (k.clone(), SemTypeBuilder::optional(v))),
                        Optionality::Required(v) => self.to_sem_type(v).map(|v| (k.clone(), v)),
                    })
                    .collect::<Result<_>>()?,
            )
            .into()),
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
    fn to_sub_type(&self, validators: &Vec<Validator>) -> Result<Rc<SemType>>;
}

impl ToSemType for JsonSchema {
    fn to_sub_type(&self, validators: &Vec<Validator>) -> Result<Rc<SemType>> {
        ToSemTypeConverter::new(validators).to_sem_type(self)
    }
}

pub fn is_sub_type(a: &JsonSchema, b: &JsonSchema, validators: &Vec<Validator>) -> Result<bool> {
    let a = a.to_sub_type(validators)?;
    let b = b.to_sub_type(validators)?;
    return Ok(a.is_subtype(&b));
}
