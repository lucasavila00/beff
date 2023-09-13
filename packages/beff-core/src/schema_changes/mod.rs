use std::collections::BTreeMap;

use crate::{
    ast::{
        js::Js,
        json::{Json, N},
        json_schema::JsonSchema,
    },
    emit::emit_module,
    open_api_ast::{HTTPMethod, OpenApi, OperationObject, Validator},
    subtyping::{
        meterialize::{Mater, MaterializationContext},
        semtype::{Evidence, SemTypeContext, SemTypeOps},
        to_schema::to_validators,
        ToSemType,
    },
};
use anyhow::Result;
use swc_common::DUMMY_SP;
use swc_ecma_ast::{
    CallExpr, Callee, Decl, Expr, Ident, ModuleItem, Stmt, TsType, TsTypeAliasDecl,
};

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
pub enum MdReport {
    Heading(String),
    Text(String),
    Json(Json),
    Js(Js),
    TsTypes(Vec<(String, TsType)>),
}

impl MdReport {
    pub fn print(&self) -> String {
        match self {
            MdReport::Heading(s) => format!("# {}", s),
            MdReport::Text(s) => s.clone(),
            MdReport::Json(j) => {
                let code = j.to_string();
                format!("```json\n{}\n```", code)
            }
            MdReport::Js(js) => {
                let code = js.clone().to_string();
                format!("```js\n{}```", code)
            }
            MdReport::TsTypes(vs) => {
                let codes = vs
                    .iter()
                    .map(|(name, ty)| {
                        emit_module(vec![ModuleItem::Stmt(Stmt::Decl(Decl::TsTypeAlias(
                            Box::new(TsTypeAliasDecl {
                                span: DUMMY_SP,
                                declare: false,
                                id: Ident {
                                    span: DUMMY_SP,
                                    sym: name.clone().into(),
                                    optional: false,
                                },
                                type_params: None,
                                type_ann: Box::new(ty.clone()),
                            }),
                        )))])
                        .unwrap()
                    })
                    .collect::<Vec<String>>()
                    .join("\n");
                format!("```ts\n{}```", codes)
            }
        }
    }
}

type Md = Vec<MdReport>;

fn print_validators(validators: &[&Validator]) -> Md {
    vec![MdReport::TsTypes(
        validators
            .iter()
            .map(|it| (it.name.clone(), it.schema.to_ts_type()))
            .collect(),
    )]
}

impl BreakingChange {
    pub fn print_report(&self) -> Md {
        match self {
            BreakingChange::PathRemoved => vec![MdReport::Text("Path removed".to_string())],
            // BreakingChange::MethodRemoved(_) => todo!(),
            BreakingChange::ResponseBodyBreakingChange(err) => {
                let v = diff_to_js(&err.diff, Some(&err.evidence_mater));
                vec![MdReport::Text("Response body is not compatible.".into())]
                    .into_iter()
                    .chain(print_validators(&err.super_type.iter().collect::<Vec<_>>()))
                    .chain(print_validators(&err.sub_type.iter().collect::<Vec<_>>()))
                    .chain(print_validators(&err.diff_type.iter().collect::<Vec<_>>()))
                    .chain(vec![
                        MdReport::Text(format!(
                            "Previous clients will not support this potential response:"
                        )),
                        MdReport::Js(v),
                        MdReport::Text(format!("diff:")),
                        MdReport::Js(diff_to_js(&err.diff, None)),
                        MdReport::Text(format!("evidence:")),
                        MdReport::Js(diff_to_js(&err.evidence_mater, None)),
                    ])
                    .collect()
            }
            BreakingChange::ParamBreakingChange { param_name, err } => {
                let v = diff_to_js(&err.diff, Some(&err.evidence_mater));
                vec![MdReport::Text(format!(
                    "Param `{}` is not compatible.",
                    param_name
                ))]
                .into_iter()
                .chain(print_validators(&err.sub_type.iter().collect::<Vec<_>>()))
                .chain(print_validators(&err.super_type.iter().collect::<Vec<_>>()))
                .chain(print_validators(&err.diff_type.iter().collect::<Vec<_>>()))
                .chain(vec![
                    MdReport::Text(format!(
                        "Param `{}` might be called with now unsupported value:",
                        param_name
                    )),
                    MdReport::Js(v),
                ])
                .collect()
            }
            // BreakingChange::RequiredParamAdded { param_name } => todo!(),
            // BreakingChange::RequestBodyBreakingChange(_) => todo!(),
            // BreakingChange::AddedNonOptionalRequestBody => todo!(),
            _ => todo!(),
        }
    }
}

#[derive(Debug)]

struct SchemaReference<'a> {
    schema: &'a JsonSchema,
    validators: &'a [&'a Validator],
    required: bool,
    name: String,
}

#[derive(Debug)]
pub struct IsNotSubtype {
    sub_type: Vec<Validator>,
    super_type: Vec<Validator>,
    diff_type: Vec<Validator>,

    // sub_type_mater: Mater,
    // super_type_mater: Mater,
    diff: Mater,
    // evidence: Evidence,
    evidence_mater: Mater,
}
fn call_expr(name: &str) -> Expr {
    Expr::Call(CallExpr {
        span: DUMMY_SP,
        callee: Callee::Expr(
            Expr::Ident(Ident {
                span: DUMMY_SP,
                sym: name.into(),
                optional: false,
            })
            .into(),
        ),
        args: vec![],
        type_args: None,
    })
}

fn diff_to_js(diff: &Mater, base: Option<&Mater>) -> Js {
    match diff {
        Mater::Never => match base {
            Some(v) => diff_to_js(v, None),
            None => Js::Expr(call_expr("never")),
        },
        Mater::Unknown => todo!(),
        Mater::Void => Js::Expr(Expr::Ident(Ident {
            span: DUMMY_SP,
            sym: "undefined".into(),
            optional: false,
        })),
        Mater::Recursive => Js::Expr(call_expr("recursion")),
        Mater::Null => Js::Null,
        Mater::Boolean => Js::Bool(true),
        Mater::Number => Js::Number(N::parse_int(123)),
        Mater::String => Js::String("abc".into()),
        Mater::StringWithFormat(_) => todo!(),
        Mater::StringLiteral(st) => Js::String(st.clone()),
        Mater::NumberLiteral(n) => Js::Number(n.clone()),
        Mater::BooleanLiteral(b) => Js::Bool(*b),
        Mater::Array {
            items,
            prefix_items,
        } => {
            let mut acc = vec![];
            for (idx, item) in prefix_items.iter().enumerate() {
                let base = match base {
                    Some(Mater::Array { prefix_items, .. }) => prefix_items.get(idx),
                    _ => None,
                };
                acc.push(diff_to_js(item, base));
            }
            if !items.is_never() {
                let base = match base {
                    Some(Mater::Array { items, .. }) => Some(items.as_ref()),
                    _ => None,
                };
                match items.as_ref() {
                    Mater::Recursive => {
                        // ignore recursion in array
                    }
                    _ => {
                        acc.push(diff_to_js(items, base));
                    }
                }
            }
            Js::Array(acc)
        }
        Mater::Object(vs) => {
            let mut acc = BTreeMap::new();
            for (k, v) in vs.iter() {
                let base = match base {
                    Some(Mater::Object(base)) => base.get(k),
                    _ => None,
                };
                acc.insert(k.clone(), diff_to_js(v, base));
            }
            Js::Object(acc)
        }
    }
}

#[derive(Debug)]
enum SubTypeCheckResult {
    IsSubtype,
    IsNotSubtype(IsNotSubtype),
}

impl<'a> SchemaReference<'a> {
    fn is_sub_type(&self, supe: &SchemaReference) -> Result<SubTypeCheckResult> {
        let sub = self;

        let mut builder = SemTypeContext::new();

        let mut sub_st = sub.schema.to_sub_type(sub.validators, &mut builder)?;
        if !sub.required {
            sub_st = SemTypeContext::optional(sub_st);
        }
        let mut supe_st = supe.schema.to_sub_type(supe.validators, &mut builder)?;
        if !supe.required {
            supe_st = SemTypeContext::optional(supe_st);
        }
        match sub_st.diff(&supe_st).is_empty_evidence(&mut builder) {
            Evidence::IsEmpty => Ok(SubTypeCheckResult::IsSubtype),
            // Evidence::All(_) => todo!(),
            // Evidence::Proper(_) => todo!(),
            evidence => {
                let sub_type = to_validators(&mut builder, &sub_st, &sub.name);
                let super_type = to_validators(&mut builder, &supe_st, &supe.name);
                let diff = sub_st.diff(&supe_st);
                let diff_type = to_validators(&mut builder, &diff, "Diff");
                let mut mater = MaterializationContext::new(&mut builder);
                Ok(SubTypeCheckResult::IsNotSubtype(IsNotSubtype {
                    sub_type,
                    super_type,
                    diff_type,
                    evidence_mater: mater.materialize_ev(&evidence),
                    // sub_type_mater: mater.materialize(&sub_st),
                    // super_type_mater: mater.materialize(&supe_st),
                    diff: mater.materialize(&diff),
                }))
            }
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
        name: "Old".to_string(),
    };
    let to_response = SchemaReference {
        schema: &to.json_response_body,
        validators: to_validators,
        required: true,
        name: "New".to_string(),
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
                    name: "Old".to_string(),
                };
                let to_param_ref = SchemaReference {
                    schema: &to_param.schema,
                    validators: to_validators,
                    required: to_param.required,
                    name: "New".to_string(),
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
            name: "Old".to_string(),
        };
        let to_req_body = SchemaReference {
            schema: &t.schema,
            validators: to_validators,
            required: t.required,
            name: "New".to_string(),
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

impl OpenApiBreakingChange {
    pub fn print_report(&self) -> Md {
        let m = match self.method {
            Some(method) => method.to_string().to_uppercase() + " ",
            None => "".to_owned(),
        };
        let path = format!("{}{}", m, self.path,);

        let error_desc = self.change.print_report();
        vec![MdReport::Heading(format!("Error at {path}:"))]
            .into_iter()
            .chain(error_desc)
            .collect()
    }
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
