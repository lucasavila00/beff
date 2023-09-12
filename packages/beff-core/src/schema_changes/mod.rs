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
    ResponseBodyBreakingChange {
        super_type: Mater,
        sub_type: Mater,
        diff: Mater,
    },
    // ParamBreakingChange {
    //     param_name: String,
    // },
    // RequiredParamAdded {
    //     param_name: String,
    // },
    // RequestBodyBreakingChange,
    // AddedNonOptionalRequestBody,
}

#[derive(Debug)]

struct SchemaReference<'a> {
    schema: &'a JsonSchema,
    validators: &'a [&'a Validator],
    required: bool,
}

enum SubTypeCheckResult {
    IsSubtype,
    IsNotSubtype {
        sub_type: Mater,
        super_type: Mater,
        diff: Mater,
    },
}

impl<'a> SchemaReference<'a> {
    fn is_sub_type(&self, sup: &SchemaReference) -> Result<SubTypeCheckResult> {
        dbg!("SchemaReference::is_sub_type");
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
        dbg!("created sts");
        match sub_st.is_subtype(&sup_st, &mut builder) {
            true => Ok(SubTypeCheckResult::IsSubtype),
            false => Ok(SubTypeCheckResult::IsNotSubtype {
                sub_type: builder.materialize(&sub_st),
                super_type: builder.materialize(&sup_st),
                diff: builder.materialize(&sub_st.diff(&sup_st)),
            }),
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
    if let SubTypeCheckResult::IsNotSubtype {
        super_type,
        sub_type,
        diff,
    } =
        // the new response must extend the previous one
        to_response.is_sub_type(&from_response)?
    {
        acc.push(BreakingChange::ResponseBodyBreakingChange {
            super_type,
            sub_type,
            diff,
        })
    }

    // let adding_params = to
    //     .parameters
    //     .iter()
    //     .filter(|it| !from.parameters.iter().any(|it2| it2.name == it.name))
    //     .collect::<Vec<_>>();

    // for param in adding_params {
    //     if param.required {
    //         acc.push(
    //             BreakingChange::RequiredParamAdded {
    //                 param_name: param.name.to_string(),
    //             }
    //             .wrap(),
    //         )
    //     }
    // }

    // for from_param in &from.parameters {
    //     let to_param = to.parameters.iter().find(|it| it.name == from_param.name);
    //     match to_param {
    //         Some(to_param) => {
    //             let from_param_ref = SchemaReference {
    //                 schema: &from_param.schema,
    //                 validators: from_validators,
    //                 required: from_param.required,
    //             };
    //             let to_param_ref = SchemaReference {
    //                 schema: &to_param.schema,
    //                 validators: to_validators,
    //                 required: to_param.required,
    //             };
    //             let param_ok = schema_is_sub_type(&to_param_ref, &from_param_ref)?;

    //             if !param_ok {
    //                 acc.push(
    //                     BreakingChange::ParamBreakingChange {
    //                         param_name: from_param.name.clone(),
    //                     }
    //                     .wrap(),
    //                 )
    //             }
    //         }
    //         None => {
    //             // it is ok to remove a parameter
    //         }
    //     }
    // }

    // if let (None, Some(t)) = (&from.json_request_body, &to.json_request_body) {
    //     if t.required {
    //         acc.push(BreakingChange::AddedNonOptionalRequestBody.wrap())
    //     }
    // }
    // if let (Some(f), Some(t)) = (&from.json_request_body, &to.json_request_body) {
    //     let from_req_body = SchemaReference {
    //         schema: &f.schema,
    //         validators: from_validators,
    //         required: f.required,
    //     };
    //     let to_req_body = SchemaReference {
    //         schema: &t.schema,
    //         validators: to_validators,
    //         required: t.required,
    //     };
    //     let req_body_ok = schema_is_sub_type(&to_req_body, &from_req_body)?;

    //     if !req_body_ok {
    //         acc.push(BreakingChange::RequestBodyBreakingChange.wrap())
    //     }
    // }

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
