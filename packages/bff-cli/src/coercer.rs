use crate::diag::{Diagnostic, DiagnosticMessage};
use swc_common::{FileName, Span, DUMMY_SP};
use swc_ecma_ast::{
    ArrayLit, BindingIdent, BlockStmt, CallExpr, Callee, Expr, ExprOrSpread, FnExpr, Function,
    Ident, KeyValueProp, ObjectLit, Param, Pat, Prop, PropName, PropOrSpread, ReturnStmt, Stmt,
};

use crate::{
    open_api_ast::{Definition, JsonSchema, Optionality},
    swc_builder::SwcBuilder,
};

fn schema_ref_callee_coerce(schema_ref: &str) -> Callee {
    let decoder_ref_fn = Ident {
        span: DUMMY_SP,
        sym: format!("coerce_{schema_ref}").into(),
        optional: false,
    };
    Callee::Expr(Expr::Ident(decoder_ref_fn).into())
}
fn coerce_primitive(value: Expr, p: &str) -> Expr {
    Expr::Call(CallExpr {
        span: DUMMY_SP,
        callee: schema_ref_callee_coerce(p),
        args: vec![ExprOrSpread {
            spread: None,
            expr: value.into(),
        }],
        type_args: None,
    })
}
fn coerce_array(values: Vec<Expr>) -> Expr {
    Expr::Call(CallExpr {
        span: DUMMY_SP,
        callee: schema_ref_callee_coerce("array"),
        args: values
            .into_iter()
            .map(|value| ExprOrSpread {
                spread: None,
                expr: value.into(),
            })
            .collect(),
        type_args: None,
    })
}

fn coerce_object(value: Expr, kvs: Vec<(String, Expr)>) -> Expr {
    let args = vec![
        ExprOrSpread {
            spread: None,
            expr: value.into(),
        },
        ExprOrSpread {
            spread: None,
            expr: Expr::Object(ObjectLit {
                span: DUMMY_SP,
                props: kvs
                    .into_iter()
                    .map(|(k, v)| {
                        PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                            key: PropName::Ident(Ident {
                                span: DUMMY_SP,
                                sym: k.into(),
                                optional: false,
                            }),
                            value: Box::new(v),
                        })))
                    })
                    .collect(),
            })
            .into(),
        },
    ];
    Expr::Call(CallExpr {
        span: DUMMY_SP,
        callee: schema_ref_callee_coerce("object"),
        args,
        type_args: None,
    })
}

fn coerce_tuple(value: Expr, items: Vec<Expr>, rest: Option<Expr>) -> Expr {
    let mut props = vec![PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
        key: PropName::Ident(Ident {
            span: DUMMY_SP,
            sym: "fixed".into(),
            optional: false,
        }),
        value: Expr::Array(ArrayLit {
            span: DUMMY_SP,
            elems: items
                .into_iter()
                .map(|it| {
                    Some(ExprOrSpread {
                        spread: None,
                        expr: Box::new(it),
                    })
                })
                .collect(),
        })
        .into(),
    })))];
    if let Some(rest) = rest {
        props.push(PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
            key: PropName::Ident(Ident {
                span: DUMMY_SP,
                sym: "rest".into(),
                optional: false,
            }),
            value: Box::new(rest),
        }))));
    }
    let args = vec![
        ExprOrSpread {
            spread: None,
            expr: value.into(),
        },
        ExprOrSpread {
            spread: None,
            expr: Expr::Object(ObjectLit {
                span: DUMMY_SP,
                props,
            })
            .into(),
        },
    ];
    Expr::Call(CallExpr {
        span: DUMMY_SP,
        callee: schema_ref_callee_coerce("tuple"),
        args,
        type_args: None,
    })
}
struct CoercerFnGenerator<'a> {
    components: &'a Vec<Definition>,
    errors: Vec<Diagnostic>,
    file_name: &'a FileName,
    span: Span,
}
impl<'a> CoercerFnGenerator<'a> {
    fn check_depth(&mut self, depth: usize) {
        if depth > 0 {
            self.errors.push(Diagnostic {
                message: DiagnosticMessage::CoercerDepthExceeded,
                file_name: self.file_name.clone(),
                span: self.span,
            });
        }
    }
    fn coerce_schema(&mut self, schema: &JsonSchema, value_ref: &Expr, depth: usize) -> Expr {
        match schema {
            JsonSchema::Null | JsonSchema::Const(_) | JsonSchema::Any => value_ref.clone(),
            JsonSchema::Boolean => coerce_primitive(value_ref.clone(), "boolean"),
            JsonSchema::String => coerce_primitive(value_ref.clone(), "string"),
            JsonSchema::Number => coerce_primitive(value_ref.clone(), "number"),
            JsonSchema::Integer => coerce_primitive(value_ref.clone(), "bigint"),
            JsonSchema::Array(values) => {
                self.check_depth(depth);
                coerce_array(vec![
                    value_ref.clone(),
                    Expr::Fn(FnExpr {
                        ident: None,
                        function: self.fn_coercer_from_schema(values, depth + 1).into(),
                    }),
                ])
            }
            JsonSchema::Object { values } => {
                self.check_depth(depth);
                coerce_object(
                    value_ref.clone(),
                    values
                        .iter()
                        .map(|(k, v)| {
                            (
                                k.clone(),
                                match v {
                                    Optionality::Optional(v) | Optionality::Required(v) => {
                                        Expr::Fn(FnExpr {
                                            ident: None,
                                            function: self
                                                .fn_coercer_from_schema(v, depth + 1)
                                                .into(),
                                        })
                                    }
                                },
                            )
                        })
                        .collect(),
                )
            }

            JsonSchema::Tuple {
                prefix_items,
                items,
            } => {
                self.check_depth(depth);
                coerce_tuple(
                    value_ref.clone(),
                    prefix_items
                        .iter()
                        .map(|it| {
                            Expr::Fn(FnExpr {
                                ident: None,
                                function: self.fn_coercer_from_schema(it, depth + 1).into(),
                            })
                        })
                        .collect(),
                    items.as_ref().map(|it| {
                        Expr::Fn(FnExpr {
                            ident: None,
                            function: self.fn_coercer_from_schema(it, depth + 1).into(),
                        })
                    }),
                )
            }

            JsonSchema::Ref(schema_ref) => {
                let ty = self
                    .components
                    .iter()
                    .find(|it| it.name == *schema_ref)
                    .unwrap();
                self.coerce_schema(&ty.schema, value_ref, depth)
            }

            JsonSchema::AnyOf(vs) => Expr::Call(CallExpr {
                span: DUMMY_SP,
                callee: schema_ref_callee_coerce("union"),
                args: vec![ExprOrSpread {
                    spread: None,
                    expr: value_ref.clone().into(),
                }]
                .into_iter()
                .chain(vs.iter().map(|it| {
                    ExprOrSpread {
                        spread: None,
                        expr: Expr::Fn(FnExpr {
                            ident: None,
                            function: self.fn_coercer_from_schema(it, depth).into(),
                        })
                        .into(),
                    }
                }))
                .collect(),
                type_args: None,
            }),
            JsonSchema::AllOf(vs) => Expr::Call(CallExpr {
                span: DUMMY_SP,
                callee: schema_ref_callee_coerce("intersection"),
                args: vec![ExprOrSpread {
                    spread: None,
                    expr: value_ref.clone().into(),
                }]
                .into_iter()
                .chain(vs.iter().map(|it| {
                    ExprOrSpread {
                        spread: None,
                        expr: Expr::Fn(FnExpr {
                            ident: None,
                            function: self.fn_coercer_from_schema(it, depth).into(),
                        })
                        .into(),
                    }
                }))
                .collect(),
                type_args: None,
            }),
        }
    }
    fn fn_coercer_from_schema(&mut self, schema: &JsonSchema, depth: usize) -> Function {
        let input = SwcBuilder::input_expr();
        let stmts = vec![Stmt::Return(ReturnStmt {
            span: DUMMY_SP,
            arg: Some(Box::new(self.coerce_schema(schema, &input, depth))),
        })];

        Function {
            params: vec![Param {
                span: DUMMY_SP,
                decorators: vec![],
                pat: Pat::Ident(BindingIdent {
                    id: SwcBuilder::input_ident(),
                    type_ann: None,
                }),
            }],
            decorators: vec![],
            span: DUMMY_SP,
            body: BlockStmt {
                span: DUMMY_SP,
                stmts,
            }
            .into(),
            is_async: false,
            is_generator: false,
            type_params: None,
            return_type: None,
        }
    }
}
#[must_use]
pub fn from_schema(
    schema: &JsonSchema,
    components: &Vec<Definition>,
    file_name: &FileName,
    span: Span,
) -> (Function, Vec<Diagnostic>) {
    let mut gen = CoercerFnGenerator {
        components,
        errors: vec![],
        file_name,
        span,
    };
    let func = gen.fn_coercer_from_schema(schema, 0);
    (func, gen.errors)
}
