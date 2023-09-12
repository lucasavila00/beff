use crate::{
    ast::json_schema::JsonSchema,
    open_api_ast::{HTTPMethod, OpenApi, OperationObject, Validator},
    subtyping::{
        semtype::{Mater, SemTypeContext, SemTypeOps},
        ToSemType,
    },
};
use anyhow::Result;

#[derive(Debug)]
pub enum BreakingChange {
    PathRemoved,
    MethodRemoved(HTTPMethod),
    ResponseBodyBreakingChange(IsNotSubtype),
    ParamBreakingChange {
        param_name: String,
        err: IsNotSubtype,
    },
    RequiredParamAdded {
        param_name: String,
    },
    RequestBodyBreakingChange(IsNotSubtype),
    AddedNonOptionalRequestBody,
}

#[derive(Debug)]

struct SchemaReference<'a> {
    schema: &'a JsonSchema,
    validators: &'a [&'a Validator],
    required: bool,
}

#[derive(Debug)]
pub struct IsNotSubtype {
    sub_type: JsonSchema,
    super_type: JsonSchema,

    sub_type_mater: Mater,
    super_type_mater: Mater,
    diff: Mater,
}

enum SubTypeCheckResult {
    IsSubtype,
    IsNotSubtype(IsNotSubtype),
}

impl<'a> SchemaReference<'a> {
    fn is_sub_type(&self, sup: &SchemaReference) -> Result<SubTypeCheckResult> {
        let sub = self;
        let mut builder = SemTypeContext::new();
        let mut sub_st = sub.schema.to_sub_type(sub.validators, &mut builder)?;
        if !sub.required {
            sub_st = SemTypeContext::optional(sub_st);
        }
        let mut sup_st = sup.schema.to_sub_type(sup.validators, &mut builder)?;
        if !sup.required {
            sup_st = SemTypeContext::optional(sup_st);
        }
        match sub_st.is_subtype(&sup_st, &mut builder) {
            true => Ok(SubTypeCheckResult::IsSubtype),
            false => Ok(SubTypeCheckResult::IsNotSubtype(IsNotSubtype {
                sub_type: sub.schema.clone(),
                super_type: sup.schema.clone(),
                sub_type_mater: builder.materialize(&sub_st),
                super_type_mater: builder.materialize(&sup_st),
                diff: builder.materialize(&sub_st.diff(&sup_st)),
            })),
        }
    }
}

fn is_op_safe_to_change(
    from: &OperationObject,
    to: &OperationObject,
    from_validators: &[&Validator],
    to_validators: &[&Validator],
) -> Result<Vec<BreakingChange>> {
    let mut acc = vec![];

    let from_response = SchemaReference {
        schema: &from.json_response_body,
        validators: from_validators,
        required: true,
    };
    let to_response = SchemaReference {
        schema: &to.json_response_body,
        validators: to_validators,
        required: true,
    };
    if let SubTypeCheckResult::IsNotSubtype(i) =
        // the new response must extend the previous one
        to_response.is_sub_type(&from_response)?
    {
        acc.push(BreakingChange::ResponseBodyBreakingChange(i))
    }

    let adding_params = to
        .parameters
        .iter()
        .filter(|it| !from.parameters.iter().any(|it2| it2.name == it.name))
        .collect::<Vec<_>>();

    for param in adding_params {
        if param.required {
            acc.push(BreakingChange::RequiredParamAdded {
                param_name: param.name.to_string(),
            })
        }
    }

    for from_param in &from.parameters {
        let to_param = to.parameters.iter().find(|it| it.name == from_param.name);
        match to_param {
            Some(to_param) => {
                let from_param_ref = SchemaReference {
                    schema: &from_param.schema,
                    validators: from_validators,
                    required: from_param.required,
                };
                let to_param_ref = SchemaReference {
                    schema: &to_param.schema,
                    validators: to_validators,
                    required: to_param.required,
                };
                if let SubTypeCheckResult::IsNotSubtype(err) =
                    // the previous param must extend the new one
                    from_param_ref.is_sub_type(&to_param_ref)?
                {
                    acc.push(BreakingChange::ParamBreakingChange {
                        param_name: from_param.name.to_string(),
                        err,
                    })
                }
            }
            None => {
                // it is ok to remove a parameter
            }
        }
    }

    if let (None, Some(t)) = (&from.json_request_body, &to.json_request_body) {
        if t.required {
            acc.push(BreakingChange::AddedNonOptionalRequestBody)
        }
    }
    if let (Some(f), Some(t)) = (&from.json_request_body, &to.json_request_body) {
        let from_req_body = SchemaReference {
            schema: &f.schema,
            validators: from_validators,
            required: f.required,
        };
        let to_req_body = SchemaReference {
            schema: &t.schema,
            validators: to_validators,
            required: t.required,
        };
        if let SubTypeCheckResult::IsNotSubtype(i) =
            // the previous param must extend the new one
            from_req_body.is_sub_type(&to_req_body)?
        {
            acc.push(BreakingChange::RequestBodyBreakingChange(i))
        }
    }

    Ok(acc)
}

#[derive(Debug)]
pub struct OpenApiBreakingChange {
    change: BreakingChange,
    path: String,
    method: Option<HTTPMethod>,
}

impl BreakingChange {
    pub fn wrap_path(self, path: String) -> OpenApiBreakingChange {
        OpenApiBreakingChange {
            change: self,
            path,
            method: None,
        }
    }
    pub fn wrap(self, path: String, method: HTTPMethod) -> OpenApiBreakingChange {
        OpenApiBreakingChange {
            change: self,
            path,
            method: Some(method),
        }
    }
}

pub fn is_safe_to_change_to(
    from: &OpenApi,
    to: &OpenApi,
    from_validators: &[&Validator],
    to_validators: &[&Validator],
) -> Result<Vec<OpenApiBreakingChange>> {
    let mut acc: Vec<OpenApiBreakingChange> = vec![];

    for from_path in &from.paths {
        let to_path = to
            .paths
            .iter()
            .find(|it| it.parsed_pattern.raw == from_path.parsed_pattern.raw);

        match to_path {
            Some(to_path) => {
                for (http_method, from_op_object) in &from_path.methods {
                    match to_path.methods.get(http_method) {
                        Some(to_operation_object) => acc.extend(
                            is_op_safe_to_change(
                                from_op_object,
                                to_operation_object,
                                from_validators,
                                to_validators,
                            )?
                            .into_iter()
                            .map(|it| it.wrap(to_path.parsed_pattern.raw.clone(), *http_method)),
                        ),
                        None => acc.push(
                            BreakingChange::MethodRemoved(http_method.clone())
                                .wrap(to_path.parsed_pattern.raw.clone(), *http_method),
                        ),
                    }
                }
            }
            None => acc
                .push(BreakingChange::PathRemoved.wrap_path(from_path.parsed_pattern.raw.clone())),
        }
    }
    Ok(acc)
}
