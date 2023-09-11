use crate::{
    ast::json_schema::JsonSchema,
    open_api_ast::{HTTPMethod, OpenApi, OperationObject, Validator},
    subtyping::{
        semtype::{SemTypeContext, SemTypeOps},
        ToSemType,
    },
};
use anyhow::Result;

#[derive(Debug)]
pub enum BreakingChange {
    PathRemoved,
    MethodRemoved(HTTPMethod),
    ResponseBodyBreakingChange,
    ParamBreakingChange { param_name: String },
    RequestBodyBreakingChange,
}

impl BreakingChange {
    pub fn wrap(self) -> OpenApiBreakingChange {
        OpenApiBreakingChange::new(self)
    }
}
#[derive(Debug)]
pub struct OpenApiBreakingChange {
    pub change: BreakingChange,
}

impl OpenApiBreakingChange {
    pub fn new(change: BreakingChange) -> OpenApiBreakingChange {
        OpenApiBreakingChange { change }
    }
}

struct SchemaReference<'a> {
    schema: &'a JsonSchema,
    validators: &'a [&'a Validator],
    required: bool,
}
fn is_sub_type(
    a: &SchemaReference,
    b: &SchemaReference,
    builder: &mut SemTypeContext,
) -> Result<bool> {
    let mut a_st = a.schema.to_sub_type(a.validators, builder)?;
    if !a.required {
        a_st = SemTypeContext::optional(a_st);
    }
    let mut b_st = b.schema.to_sub_type(b.validators, builder)?;
    if !b.required {
        b_st = SemTypeContext::optional(b_st);
    }
    return Ok(a_st.is_subtype(&b_st, builder));
}

fn schema_is_sub_type(a: &SchemaReference, b: &SchemaReference) -> Result<bool> {
    let mut builder = SemTypeContext::new();
    return is_sub_type(a, b, &mut builder);
}

fn is_op_safe_to_change(
    from: &OperationObject,
    to: &OperationObject,
    from_validators: &[&Validator],
    to_validators: &[&Validator],
) -> Result<Vec<OpenApiBreakingChange>> {
    let mut acc = vec![];

    let a_response = SchemaReference {
        schema: &from.json_response_body.value,
        validators: from_validators,
        required: true,
    };
    let b_response = SchemaReference {
        schema: &to.json_response_body.value,
        validators: to_validators,
        required: true,
    };
    let response_ok = schema_is_sub_type(&a_response, &b_response)?;

    if !response_ok {
        acc.push(BreakingChange::ResponseBodyBreakingChange.wrap())
    }

    // TODO: check for additions of parameters, must be optional

    for from_param in &from.parameters {
        let to_param = to.parameters.iter().find(|it| it.name == from_param.name);
        match to_param {
            Some(to_param) => {
                let from_param_ref = SchemaReference {
                    schema: &from_param.schema.value,
                    validators: from_validators,
                    required: from_param.required,
                };
                let to_param_ref = SchemaReference {
                    schema: &to_param.schema.value,
                    validators: to_validators,
                    required: to_param.required,
                };
                let param_ok = schema_is_sub_type(&to_param_ref, &from_param_ref)?;

                if !param_ok {
                    acc.push(
                        BreakingChange::ParamBreakingChange {
                            param_name: from_param.name.clone(),
                        }
                        .wrap(),
                    )
                }
            }
            None => {
                // it is ok to remove a parameter
            }
        }
    }

    // TODO: check for additions of request body, must be optional

    if let (Some(f), Some(t)) = (&from.json_request_body, &to.json_request_body) {
        let from_req_body = SchemaReference {
            schema: &f.schema.value,
            validators: from_validators,
            required: f.required,
        };
        let to_req_body = SchemaReference {
            schema: &t.schema.value,
            validators: to_validators,
            required: t.required,
        };
        let req_body_ok = schema_is_sub_type(&to_req_body, &from_req_body)?;

        if !req_body_ok {
            acc.push(BreakingChange::RequestBodyBreakingChange.wrap())
        }
    }

    Ok(acc)
}

pub fn is_safe_to_change_to(
    from: &OpenApi,
    to: &OpenApi,
    from_validators: &[&Validator],
    to_validators: &[&Validator],
) -> Result<Vec<OpenApiBreakingChange>> {
    let mut acc: Vec<OpenApiBreakingChange> = vec![];

    for path in &from.paths {
        let to_path = to
            .paths
            .iter()
            .find(|it| it.parsed_pattern.raw == path.parsed_pattern.raw);

        match to_path {
            Some(to_path) => {
                for (http_method, operation_object) in &path.methods {
                    match to_path.methods.get(http_method) {
                        Some(to_operation_object) => acc.extend(is_op_safe_to_change(
                            operation_object,
                            to_operation_object,
                            from_validators,
                            to_validators,
                        )?),
                        None => acc.push(BreakingChange::MethodRemoved(http_method.clone()).wrap()),
                    }
                }
            }
            None => acc.push(BreakingChange::PathRemoved.wrap()),
        }
    }
    Ok(acc)
}
