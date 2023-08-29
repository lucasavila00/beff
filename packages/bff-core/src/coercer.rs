use crate::open_api_ast::{Definition, JsonSchema};
use crate::swc_builder::SwcBuilder;
use swc_common::DUMMY_SP;
use swc_ecma_ast::{
    BindingIdent, BlockStmt, CallExpr, Callee, Expr, ExprOrSpread, FnExpr, Function, Ident, Param,
    Pat, ReturnStmt, Stmt,
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

struct CoercerFnGenerator<'a> {
    components: &'a Vec<Definition>,
}
impl<'a> CoercerFnGenerator<'a> {
    fn coerce_schema(&mut self, schema: &JsonSchema, value_ref: &Expr, depth: usize) -> Expr {
        match schema {
            JsonSchema::Null | JsonSchema::Const(_) | JsonSchema::Any => value_ref.clone(),
            JsonSchema::Boolean => coerce_primitive(value_ref.clone(), "boolean"),
            JsonSchema::String => coerce_primitive(value_ref.clone(), "string"),
            JsonSchema::Number => coerce_primitive(value_ref.clone(), "number"),
            JsonSchema::Array(_) | JsonSchema::Object { .. } | JsonSchema::Tuple { .. } => {
                unreachable!("should be on request body, no coercion needed")
            }

            JsonSchema::Ref(schema_ref) => {
                let ty = self
                    .components
                    .iter()
                    .find(|it| it.name == *schema_ref)
                    .expect("should be resolved by this point");
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
pub fn from_schema(schema: &JsonSchema, components: &Vec<Definition>) -> Function {
    CoercerFnGenerator { components }.fn_coercer_from_schema(schema, 0)
}
