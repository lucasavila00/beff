use super::{expr::ToExpr, printer::const_decl};
use crate::{
    ast::json_schema::{JsonSchema, JsonSchemaConst, Optionality, TplLitTypeItem},
    NamedSchema,
};
use std::collections::{BTreeMap, BTreeSet};
use swc_common::DUMMY_SP;
use swc_ecma_ast::{
    ArrayLit, ArrowExpr, AssignExpr, AssignOp, BindingIdent, BlockStmt, BlockStmtOrExpr, Bool,
    CallExpr, Callee, ComputedPropName, Decl, Expr, ExprOrSpread, ExprStmt, Function, Ident,
    IfStmt, KeyValueProp, Lit, MemberExpr, MemberProp, ModuleItem, NewExpr, Null, ObjectLit, Param,
    ParenExpr, Pat, Prop, PropName, PropOrSpread, Regex, ReturnStmt, Stmt, Str, UnaryExpr, UnaryOp,
    VarDecl, VarDeclKind, VarDeclarator,
};
struct SwcBuilder;

impl SwcBuilder {
    #[must_use]
    pub fn input_ident() -> Ident {
        Ident {
            span: DUMMY_SP,
            sym: "input".into(),
            optional: false,
        }
    }

    #[must_use]
    pub fn ident_expr(name: &str) -> Expr {
        Expr::Ident(Ident {
            span: DUMMY_SP,
            sym: name.into(),
            optional: false,
        })
    }
}

struct DecoderFnGenerator<'a> {
    named_schemas: &'a Vec<NamedSchema>,
    name: String,
}

impl DecoderFnGenerator<'_> {
    fn extract_union(&self, it: &JsonSchema) -> Vec<JsonSchema> {
        match it {
            JsonSchema::AnyOf(vs) => vs.iter().flat_map(|it| self.extract_union(it)).collect(),
            JsonSchema::Ref(r) => {
                let v = self
                    .named_schemas
                    .iter()
                    .find(|it| it.name == *r)
                    .expect("everything should be resolved by now");
                self.extract_union(&v.schema)
            }
            _ => vec![it.clone()],
        }
    }

    fn decode_any_of_discriminated(
        &self,
        flat_values: &BTreeSet<JsonSchema>,
        discriminator: String,
        discriminator_strings: BTreeSet<String>,
        object_vs: Vec<&BTreeMap<String, Optionality<JsonSchema>>>,
        hoisted: &mut Vec<ModuleItem>,
    ) -> SchemaCode {
        let mut acc = BTreeMap::new();
        for current_key in discriminator_strings {
            let mut cases = vec![];
            for vs in object_vs.iter() {
                let value = vs
                    .get(&discriminator)
                    .expect("we already checked the discriminator exists")
                    .inner();

                let all_values = self.extract_union(value);
                for s in all_values {
                    if let JsonSchema::Const(JsonSchemaConst::String(s)) = s {
                        if s == current_key {
                            let new_obj_vs: Vec<(String, Optionality<JsonSchema>)> = vs
                                .iter()
                                // .filter(|it| it.0 != &discriminator)
                                .map(|it| (it.0.clone(), it.1.clone()))
                                .collect();
                            let new_obj = JsonSchema::object(new_obj_vs, None);
                            cases.push(new_obj);
                        }
                    }
                }
            }
            let schema = JsonSchema::any_of(cases);

            let schema_code = self.generate_schema_code(&schema, hoisted);

            acc.insert(current_key, schema_code);
        }
        let disc = Expr::Lit(Lit::Str(Str {
            span: DUMMY_SP,
            value: discriminator.clone().into(),
            raw: None,
        }));

        let validators_obj = Expr::Object(ObjectLit {
            span: DUMMY_SP,
            props: acc
                .iter()
                .map(|(key, value)| {
                    PropOrSpread::Prop(
                        Prop::KeyValue(KeyValueProp {
                            key: PropName::Str(Str {
                                span: DUMMY_SP,
                                value: key.clone().into(),
                                raw: None,
                            }),
                            value: value.validator.clone().into(),
                        })
                        .into(),
                    )
                })
                .collect(),
        });

        let parsers_obj = Expr::Object(ObjectLit {
            span: DUMMY_SP,
            props: acc
                .iter()
                .map(|(key, value)| {
                    PropOrSpread::Prop(
                        Prop::KeyValue(KeyValueProp {
                            key: PropName::Str(Str {
                                span: DUMMY_SP,
                                value: key.clone().into(),
                                raw: None,
                            }),
                            value: value.parser.clone().into(),
                        })
                        .into(),
                    )
                })
                .collect(),
        });

        let reporters_obj = Expr::Object(ObjectLit {
            span: DUMMY_SP,
            props: acc
                .iter()
                .map(|(key, value)| {
                    PropOrSpread::Prop(
                        Prop::KeyValue(KeyValueProp {
                            key: PropName::Str(Str {
                                span: DUMMY_SP,
                                value: key.clone().into(),
                                raw: None,
                            }),
                            value: value.reporter.clone().into(),
                        })
                        .into(),
                    )
                })
                .collect(),
        });

        let flat_values_schema = flat_values
            .iter()
            .map(|it| self.generate_schema_code(it, hoisted).schema)
            .collect::<Vec<_>>();

        let flat_values_schema_arr = Expr::Array(ArrayLit {
            span: DUMMY_SP,
            elems: flat_values_schema
                .into_iter()
                .map(|it| {
                    Some(ExprOrSpread {
                        spread: None,
                        expr: it.into(),
                    })
                })
                .collect(),
        });
        let flat_values_describe = flat_values
            .iter()
            .map(|it| self.generate_schema_code(it, hoisted).describe)
            .collect::<Vec<_>>();

        let flat_values_describe_arr = Expr::Array(ArrayLit {
            span: DUMMY_SP,
            elems: flat_values_describe
                .into_iter()
                .map(|it| {
                    Some(ExprOrSpread {
                        spread: None,
                        expr: it.into(),
                    })
                })
                .collect(),
        });
        self.dynamic_schema_code(
            "AnyOfDiscriminated",
            hoisted,
            vec![disc.clone(), validators_obj],
            vec![disc.clone(), parsers_obj],
            vec![disc.clone(), reporters_obj],
            vec![flat_values_schema_arr],
            vec![flat_values_describe_arr],
        )
    }
    fn maybe_decode_any_of_discriminated(
        &self,
        flat_values: &BTreeSet<JsonSchema>,
        hoisted: &mut Vec<ModuleItem>,
    ) -> Option<SchemaCode> {
        let all_objects_without_rest = flat_values
            .iter()
            .all(|it| matches!(it, JsonSchema::Object { rest: None, .. }));

        let object_vs = flat_values
            .iter()
            .filter_map(|it| match it {
                JsonSchema::Object { vs, rest: _ } => Some(vs),
                _ => None,
            })
            .collect::<Vec<_>>();
        if all_objects_without_rest {
            let mut keys = vec![];
            for vs in &object_vs {
                for key in vs.keys() {
                    keys.push(key.clone());
                }
            }

            for discriminator in keys {
                let contained_in_all = object_vs.iter().all(|it| it.contains_key(&discriminator));

                if contained_in_all {
                    let equal_in_all = object_vs
                        .iter()
                        .map(|it| it.get(&discriminator).unwrap().clone())
                        .collect::<BTreeSet<_>>()
                        .len()
                        == 1;
                    if !equal_in_all {
                        let values = object_vs
                            .iter()
                            .map(|it| {
                                it.get(&discriminator)
                                    .expect("we already checked the discriminator exists")
                                    .clone()
                            })
                            .collect::<BTreeSet<_>>();

                        let all_required = values
                            .iter()
                            .all(|it| matches!(it, Optionality::Required(_)));

                        if !all_required {
                            continue;
                        }

                        let discriminator_values = values
                            .iter()
                            .map(|it| match it {
                                Optionality::Required(schema) => schema.clone(),
                                _ => unreachable!(),
                            })
                            .collect::<BTreeSet<_>>();
                        let flat_discriminator_values = discriminator_values
                            .iter()
                            .flat_map(|it| self.extract_union(it))
                            .collect::<BTreeSet<_>>();

                        let all_string_consts = flat_discriminator_values
                            .iter()
                            .all(|it| matches!(it, JsonSchema::Const(JsonSchemaConst::String(_))));

                        if all_string_consts {
                            let discriminator_strings: BTreeSet<String> = flat_discriminator_values
                                .iter()
                                .map(|it| match it {
                                    JsonSchema::Const(JsonSchemaConst::String(s)) => s.clone(),
                                    _ => unreachable!(),
                                })
                                .collect::<BTreeSet<_>>();

                            return Some(self.decode_any_of_discriminated(
                                flat_values,
                                discriminator,
                                discriminator_strings,
                                object_vs,
                                hoisted,
                            ));
                        }
                    }
                }
            }
        }
        None
    }

    fn maybe_decode_any_of_consts(
        &self,
        flat_values: &BTreeSet<JsonSchema>,
        hoisted: &mut Vec<ModuleItem>,
    ) -> Option<SchemaCode> {
        let all_consts = flat_values
            .iter()
            .all(|it| matches!(it, JsonSchema::Const(_)));
        if all_consts {
            let consts: Vec<Expr> = flat_values
                .iter()
                .map(|it| match it {
                    JsonSchema::Const(json) => json.clone().to_json().to_expr(),
                    _ => unreachable!(),
                })
                .collect();

            let consts = Expr::Array(ArrayLit {
                span: DUMMY_SP,
                elems: consts
                    .into_iter()
                    .map(|it| {
                        Some(ExprOrSpread {
                            spread: None,
                            expr: it.into(),
                        })
                    })
                    .collect(),
            });

            return Some(self.static_schema_code(hoisted, "AnyOfConstsDecoder", vec![consts]));
        }
        None
    }
    fn decode_any_of(
        &self,
        vs: &BTreeSet<JsonSchema>,
        hoisted: &mut Vec<ModuleItem>,
    ) -> SchemaCode {
        if vs.is_empty() {
            panic!("empty anyOf is not allowed")
        }

        let flat_values = vs
            .iter()
            .flat_map(|it: &JsonSchema| self.extract_union(it))
            .collect::<BTreeSet<_>>();

        if let Some(consts) = self.maybe_decode_any_of_consts(&flat_values, hoisted) {
            return consts;
        }

        if let Some(discriminated) = self.maybe_decode_any_of_discriminated(&flat_values, hoisted) {
            return discriminated;
        }

        self.decode_union_or_intersection("AnyOf", vs, hoisted)
    }

    fn primitive_schema_code(t: &str) -> SchemaCode {
        SchemaCode {
            validator: SwcBuilder::ident_expr(format!("validate{}", t).to_string().as_str()),
            parser: SwcBuilder::ident_expr(
                // format!("parse{}", t).to_string().as_str()
                "parseIdentity",
            ),
            reporter: SwcBuilder::ident_expr(format!("report{}", t).to_string().as_str()),
            schema: SwcBuilder::ident_expr(format!("schema{}", t).to_string().as_str()),
            describe: SwcBuilder::ident_expr(format!("describe{}", t).to_string().as_str()),
        }
    }
    fn ref_schema_code(&self, schema_ref: &str, hoisted: &mut Vec<ModuleItem>) -> SchemaCode {
        let validator = Expr::Member(MemberExpr {
            span: DUMMY_SP,
            obj: Expr::Ident(Ident {
                span: DUMMY_SP,
                sym: "validators".into(),
                optional: false,
            })
            .into(),
            prop: MemberProp::Ident(Ident {
                span: DUMMY_SP,
                sym: schema_ref.into(),
                optional: false,
            }),
        });
        let parser = Expr::Member(MemberExpr {
            span: DUMMY_SP,
            obj: Expr::Ident(Ident {
                span: DUMMY_SP,
                sym: "parsers".into(),
                optional: false,
            })
            .into(),
            prop: MemberProp::Ident(Ident {
                span: DUMMY_SP,
                sym: schema_ref.into(),
                optional: false,
            }),
        });
        let reporter = Expr::Member(MemberExpr {
            span: DUMMY_SP,
            obj: Expr::Ident(Ident {
                span: DUMMY_SP,
                sym: "reporters".into(),
                optional: false,
            })
            .into(),
            prop: MemberProp::Ident(Ident {
                span: DUMMY_SP,
                sym: schema_ref.into(),
                optional: false,
            }),
        });
        let schema = Expr::Member(MemberExpr {
            span: DUMMY_SP,
            obj: Expr::Ident(Ident {
                span: DUMMY_SP,
                sym: "schemas".into(),
                optional: false,
            })
            .into(),
            prop: MemberProp::Ident(Ident {
                span: DUMMY_SP,
                sym: schema_ref.into(),
                optional: false,
            }),
        });

        let ctx_deps_name = Expr::Member(MemberExpr {
            span: DUMMY_SP,
            obj: Expr::Member(MemberExpr {
                span: DUMMY_SP,
                obj: Expr::Ident(Ident {
                    span: DUMMY_SP,
                    sym: "ctx".into(),
                    optional: false,
                })
                .into(),
                prop: MemberProp::Ident(Ident {
                    span: DUMMY_SP,
                    sym: "deps".into(),
                    optional: false,
                }),
            })
            .into(),
            prop: MemberProp::Computed(ComputedPropName {
                span: DUMMY_SP,
                expr: Expr::Lit(Lit::Str(Str {
                    span: DUMMY_SP,
                    value: schema_ref.into(),
                    raw: None,
                }))
                .into(),
            }),
        });

        let describe = Expr::Member(MemberExpr {
            span: DUMMY_SP,
            obj: Expr::Ident(Ident {
                span: DUMMY_SP,
                sym: "describers".into(),
                optional: false,
            })
            .into(),
            prop: MemberProp::Ident(Ident {
                span: DUMMY_SP,
                sym: schema_ref.into(),
                optional: false,
            }),
        });

        let hoisted_describe_fn = self.hoist_expr(
            hoisted,
            Expr::Arrow(ArrowExpr {
                span: DUMMY_SP,
                params: vec![
                    Pat::Ident(BindingIdent {
                        id: Ident {
                            span: DUMMY_SP,
                            sym: "ctx".into(),
                            optional: false,
                        },
                        type_ann: None,
                    }),
                    Pat::Ident(BindingIdent {
                        id: SwcBuilder::input_ident(),
                        type_ann: None,
                    }),
                ],
                body: BlockStmtOrExpr::BlockStmt(BlockStmt {
                    span: DUMMY_SP,
                    stmts: vec![
                        //
                        Stmt::If(IfStmt {
                            span: DUMMY_SP,
                            test: ctx_deps_name.clone().into(),
                            cons: Stmt::Block(BlockStmt {
                                span: DUMMY_SP,
                                stmts: vec![
                                    // return the name if the deps includes it
                                    Stmt::Return(ReturnStmt {
                                        span: DUMMY_SP,
                                        arg: Some(Box::new(Expr::Lit(Lit::Str(schema_ref.into())))),
                                    }),
                                ],
                            })
                            .into(),
                            alt: None,
                        }),
                        Stmt::Expr(ExprStmt {
                            span: DUMMY_SP,
                            expr: Box::new(Expr::Assign(AssignExpr {
                                span: DUMMY_SP,
                                op: AssignOp::Assign,
                                left: swc_ecma_ast::PatOrExpr::Expr(ctx_deps_name.clone().into()),
                                right: Expr::Lit(Lit::Bool(Bool {
                                    span: DUMMY_SP,
                                    value: true,
                                }))
                                .into(),
                            })),
                        }),
                        Stmt::Expr(ExprStmt {
                            span: DUMMY_SP,
                            expr: Box::new(Expr::Assign(AssignExpr {
                                span: DUMMY_SP,
                                op: AssignOp::Assign,
                                left: swc_ecma_ast::PatOrExpr::Expr(ctx_deps_name.clone().into()),
                                right: Expr::Call(CallExpr {
                                    span: DUMMY_SP,
                                    callee: Callee::Expr(describe.into()),
                                    args: vec![
                                        Expr::Ident(Ident {
                                            span: DUMMY_SP,
                                            sym: "ctx".into(),
                                            optional: false,
                                        })
                                        .into(),
                                        ExprOrSpread {
                                            spread: None,
                                            expr: SwcBuilder::input_ident().into(),
                                        },
                                    ],
                                    type_args: None,
                                })
                                .into(),
                            })),
                        }),
                        Stmt::Return(ReturnStmt {
                            span: DUMMY_SP,
                            arg: Some(Box::new(Expr::Lit(Lit::Str(schema_ref.into())))),
                        }),
                    ],
                })
                .into(),
                is_async: false,
                is_generator: false,
                type_params: None,
                return_type: None,
            }),
        );

        SchemaCode {
            validator,
            parser,
            reporter,
            schema,
            describe: hoisted_describe_fn,
        }
    }
    fn bound_method(method_name: &str, hoisted_expr: &Expr) -> Expr {
        let member = Expr::Member(MemberExpr {
            span: DUMMY_SP,
            obj: hoisted_expr.clone().into(),
            prop: MemberProp::Ident(Ident {
                span: DUMMY_SP,
                sym: method_name.into(),
                optional: false,
            }),
        });
        let bind_member = Expr::Member(MemberExpr {
            span: DUMMY_SP,
            obj: member.into(),
            prop: MemberProp::Ident(Ident {
                span: DUMMY_SP,
                sym: "bind".into(),
                optional: false,
            }),
        });
        Expr::Call(CallExpr {
            span: DUMMY_SP,
            callee: Callee::Expr(bind_member.into()),
            args: vec![hoisted_expr.clone().into()],
            type_args: None,
        })
    }
    fn hoist_expr(&self, hoisted: &mut Vec<ModuleItem>, to_hoist: Expr) -> Expr {
        let hoist_count = hoisted.len();
        let var_name = format!("hoisted_{}_{}", &self.name, hoist_count);
        let new_statement = const_decl(&var_name, to_hoist);
        hoisted.push(new_statement);

        Expr::Ident(Ident {
            span: DUMMY_SP,
            sym: var_name.into(),
            optional: false,
        })
    }
    fn static_schema_code(
        &self,
        hoisted: &mut Vec<ModuleItem>,
        class: &str,
        args: Vec<Expr>,
    ) -> SchemaCode {
        let new_expr = Expr::New(NewExpr {
            span: DUMMY_SP,
            callee: Box::new(SwcBuilder::ident_expr(class)),
            args: Some(
                args.into_iter()
                    .map(|it| ExprOrSpread {
                        spread: None,
                        expr: it.into(),
                    })
                    .collect(),
            ),
            type_args: None,
        });

        let hoisted_expr = self.hoist_expr(hoisted, new_expr);
        let bound_validate = Self::bound_method(&format!("validate{}", class), &hoisted_expr);
        let bound_parse = Self::bound_method(&format!("parse{}", class), &hoisted_expr);
        let bound_reporter = Self::bound_method(&format!("report{}", class), &hoisted_expr);
        let bound_schema = Self::bound_method(&format!("schema{}", class), &hoisted_expr);
        let bound_describe = Self::bound_method(&format!("describe{}", class), &hoisted_expr);

        SchemaCode {
            validator: bound_validate,
            parser: bound_parse,
            reporter: bound_reporter,
            schema: bound_schema,
            describe: bound_describe,
        }
    }

    #[allow(clippy::too_many_arguments)]
    fn dynamic_schema_code(
        &self,
        name: &str,
        hoisted: &mut Vec<ModuleItem>,
        validator_args: Vec<Expr>,
        parser_args: Vec<Expr>,
        reporter_args: Vec<Expr>,
        schema_args: Vec<Expr>,
        describe_args: Vec<Expr>,
    ) -> SchemaCode {
        let validator_fn_name = format!("{}Validator", name);

        let new_val_expr = Expr::New(NewExpr {
            span: DUMMY_SP,
            callee: Box::new(SwcBuilder::ident_expr(&validator_fn_name)),
            args: Some(
                validator_args
                    .into_iter()
                    .map(|it| ExprOrSpread {
                        spread: None,
                        expr: it.into(),
                    })
                    .collect(),
            ),
            type_args: None,
        });
        let bound_validate = Self::bound_method(
            &format!("validate{}", validator_fn_name),
            &self.hoist_expr(hoisted, new_val_expr),
        );

        let parser_fn_name = format!("{}Parser", name);
        let new_parser_expr = Expr::New(NewExpr {
            span: DUMMY_SP,
            callee: Box::new(SwcBuilder::ident_expr(&parser_fn_name)),
            args: Some(
                parser_args
                    .into_iter()
                    .map(|it| ExprOrSpread {
                        spread: None,
                        expr: it.into(),
                    })
                    .collect(),
            ),
            type_args: None,
        });
        let bound_parse = Self::bound_method(
            &format!("parse{}", parser_fn_name),
            &self.hoist_expr(hoisted, new_parser_expr),
        );

        let reporter_fn_name = format!("{}Reporter", name);
        let new_reporter_expr = Expr::New(NewExpr {
            span: DUMMY_SP,
            callee: Box::new(SwcBuilder::ident_expr(&reporter_fn_name)),
            args: Some(
                reporter_args
                    .into_iter()
                    .map(|it| ExprOrSpread {
                        spread: None,
                        expr: it.into(),
                    })
                    .collect(),
            ),
            type_args: None,
        });
        let bound_reporter = Self::bound_method(
            &format!("report{}", reporter_fn_name),
            &self.hoist_expr(hoisted, new_reporter_expr),
        );

        let schema_fn_name = format!("{}Schema", name);
        let new_schema_expr = Expr::New(NewExpr {
            span: DUMMY_SP,
            callee: Box::new(SwcBuilder::ident_expr(&schema_fn_name)),
            args: Some(
                schema_args
                    .into_iter()
                    .map(|it| ExprOrSpread {
                        spread: None,
                        expr: it.into(),
                    })
                    .collect(),
            ),
            type_args: None,
        });
        let bound_schema = Self::bound_method(
            &format!("schema{}", schema_fn_name),
            &self.hoist_expr(hoisted, new_schema_expr),
        );

        let describe_fn_name = format!("{}Describe", name);
        let new_describe_expr = Expr::New(NewExpr {
            span: DUMMY_SP,
            callee: Box::new(SwcBuilder::ident_expr(&describe_fn_name)),
            args: Some(
                describe_args
                    .into_iter()
                    .map(|it| ExprOrSpread {
                        spread: None,
                        expr: it.into(),
                    })
                    .collect(),
            ),
            type_args: None,
        });

        let bound_describe = Self::bound_method(
            &format!("describe{}", describe_fn_name),
            &self.hoist_expr(hoisted, new_describe_expr),
        );

        SchemaCode {
            validator: bound_validate,
            parser: bound_parse,
            reporter: bound_reporter,
            schema: bound_schema,
            describe: bound_describe,
        }
    }
    fn decode_union_or_intersection(
        &self,
        decoder_name: &str,
        vs: &BTreeSet<JsonSchema>,
        hoisted: &mut Vec<ModuleItem>,
    ) -> SchemaCode {
        let mut validators: Vec<Expr> = vec![];
        let mut parsers: Vec<Expr> = vec![];
        let mut reporters: Vec<Expr> = vec![];
        let mut schemas: Vec<Expr> = vec![];
        let mut describes: Vec<Expr> = vec![];

        for v in vs {
            let SchemaCode {
                validator: val,
                parser: par,
                reporter: rep,
                schema: s,
                describe: d,
            } = self.generate_schema_code(v, hoisted);
            validators.push(val);
            parsers.push(par);
            reporters.push(rep);
            schemas.push(s);
            describes.push(d);
        }

        let validators_arr = self.hoist_expr(
            hoisted,
            Expr::Array(ArrayLit {
                span: DUMMY_SP,
                elems: validators
                    .into_iter()
                    .map(|it| {
                        Some(ExprOrSpread {
                            spread: None,
                            expr: it.into(),
                        })
                    })
                    .collect(),
            }),
        );

        let schemas_arr = self.hoist_expr(
            hoisted,
            Expr::Array(ArrayLit {
                span: DUMMY_SP,
                elems: schemas
                    .into_iter()
                    .map(|it| {
                        Some(ExprOrSpread {
                            spread: None,
                            expr: it.into(),
                        })
                    })
                    .collect(),
            }),
        );

        let describes_arr = self.hoist_expr(
            hoisted,
            Expr::Array(ArrayLit {
                span: DUMMY_SP,
                elems: describes
                    .into_iter()
                    .map(|it| {
                        Some(ExprOrSpread {
                            spread: None,
                            expr: it.into(),
                        })
                    })
                    .collect(),
            }),
        );

        self.dynamic_schema_code(
            decoder_name,
            hoisted,
            vec![validators_arr.clone()],
            vec![
                validators_arr.clone(),
                Expr::Array(ArrayLit {
                    span: DUMMY_SP,
                    elems: parsers
                        .into_iter()
                        .map(|it| {
                            Some(ExprOrSpread {
                                spread: None,
                                expr: it.into(),
                            })
                        })
                        .collect(),
                }),
            ],
            vec![
                validators_arr,
                Expr::Array(ArrayLit {
                    span: DUMMY_SP,
                    elems: reporters
                        .into_iter()
                        .map(|it| {
                            Some(ExprOrSpread {
                                spread: None,
                                expr: it.into(),
                            })
                        })
                        .collect(),
                }),
            ],
            vec![schemas_arr],
            vec![describes_arr],
        )
    }
    fn string_with_formats_decoder(
        &self,
        hoisted: &mut Vec<ModuleItem>,
        vs: &[String],
    ) -> SchemaCode {
        self.static_schema_code(
            hoisted,
            "StringWithFormatsDecoder",
            vs.iter()
                .map(|it| {
                    Expr::Lit(Lit::Str(Str {
                        span: DUMMY_SP,
                        value: it.to_string().into(),
                        raw: None,
                    }))
                })
                .collect(),
        )
    }
    fn number_with_formats_decoder(
        &self,
        hoisted: &mut Vec<ModuleItem>,
        vs: &[String],
    ) -> SchemaCode {
        self.static_schema_code(
            hoisted,
            "NumberWithFormatsDecoder",
            vs.iter()
                .map(|it| {
                    Expr::Lit(Lit::Str(Str {
                        span: DUMMY_SP,
                        value: it.to_string().into(),
                        raw: None,
                    }))
                })
                .collect(),
        )
    }

    fn generate_schema_code(
        &self,
        schema: &JsonSchema,
        hoisted: &mut Vec<ModuleItem>,
    ) -> SchemaCode {
        let call = match schema {
            JsonSchema::StNot(_) => {
                unreachable!("should not create decoders for semantic types")
            }
            JsonSchema::AnyArrayLike => {
                self.generate_schema_code(&JsonSchema::Array(JsonSchema::Any.into()), hoisted)
            }
            JsonSchema::String => Self::primitive_schema_code("String"),
            JsonSchema::StNever => Self::primitive_schema_code("Never"),
            JsonSchema::Null => Self::primitive_schema_code("Null"),
            JsonSchema::Boolean => Self::primitive_schema_code("Boolean"),
            JsonSchema::Number => Self::primitive_schema_code("Number"),
            JsonSchema::Function => Self::primitive_schema_code("Function"),
            JsonSchema::Any => Self::primitive_schema_code("Any"),
            JsonSchema::Ref(r_name) => self.ref_schema_code(r_name, hoisted),
            JsonSchema::StringWithFormat(format) => {
                self.string_with_formats_decoder(hoisted, std::slice::from_ref(format))
            }
            JsonSchema::StringFormatExtends(vs) => self.string_with_formats_decoder(hoisted, vs),
            JsonSchema::NumberWithFormat(format) => {
                self.number_with_formats_decoder(hoisted, std::slice::from_ref(format))
            }
            JsonSchema::NumberFormatExtends(vs) => self.number_with_formats_decoder(hoisted, vs),
            JsonSchema::Const(json) => self.static_schema_code(
                hoisted,
                "ConstDecoder",
                vec![json.clone().to_json().to_expr()],
            ),
            JsonSchema::Codec(format) => self.static_schema_code(
                hoisted,
                "CodecDecoder",
                vec![Expr::Lit(Lit::Str(Str {
                    span: DUMMY_SP,
                    value: format.to_string().into(),
                    raw: None,
                }))],
            ),
            JsonSchema::TplLitType(items) => {
                let mut regex_exp = String::new();

                for item in items {
                    regex_exp.push_str(&item.regex_expr());
                }

                self.static_schema_code(
                    hoisted,
                    "RegexDecoder",
                    vec![
                        Expr::Lit(Lit::Regex(Regex {
                            span: DUMMY_SP,
                            exp: regex_exp.into(),
                            flags: "".into(),
                        })),
                        Expr::Lit(Lit::Str(Str {
                            span: DUMMY_SP,
                            value: TplLitTypeItem::describe_vec(items).into(),
                            raw: None,
                        })),
                    ],
                )
            }
            JsonSchema::Array(ty) => {
                let SchemaCode {
                    validator: inner_val,
                    parser: inner_parser,
                    reporter: inner_reporter,
                    schema: inner_schema,
                    describe: inner_describe,
                } = self.generate_schema_code(ty, hoisted);
                let inner_val = self.hoist_expr(hoisted, inner_val);
                self.dynamic_schema_code(
                    "Array",
                    hoisted,
                    vec![inner_val.clone()],
                    vec![inner_parser],
                    vec![inner_val, inner_reporter],
                    vec![inner_schema],
                    vec![inner_describe],
                )
            }
            JsonSchema::MappedRecord { key, rest } => {
                let SchemaCode {
                    validator: key_validator,
                    parser: key_parser,
                    reporter: key_reporter,
                    schema: key_schema,
                    describe: key_describe,
                } = self.generate_schema_code(key, hoisted);
                let SchemaCode {
                    validator: rest_validator,
                    parser: rest_parser,
                    reporter: rest_reporter,
                    schema: rest_schema,
                    describe: rest_describe,
                } = self.generate_schema_code(rest, hoisted);
                let key_validator = self.hoist_expr(hoisted, key_validator);
                let rest_validator = self.hoist_expr(hoisted, rest_validator);
                self.dynamic_schema_code(
                    "MappedRecord",
                    hoisted,
                    vec![key_validator.clone(), rest_validator.clone()],
                    vec![key_parser, rest_parser],
                    vec![key_validator, rest_validator, key_reporter, rest_reporter],
                    vec![key_schema, rest_schema],
                    vec![key_describe, rest_describe],
                )
            }
            JsonSchema::Tuple {
                prefix_items,
                items,
            } => {
                let mut prefix_validators: Vec<Expr> = vec![];
                let mut prefix_parsers: Vec<Expr> = vec![];
                let mut prefix_reporters: Vec<Expr> = vec![];
                let mut prefix_schemas: Vec<Expr> = vec![];
                let mut prefix_describes: Vec<Expr> = vec![];
                let mut item_validator = Expr::Lit(Lit::Null(Null { span: DUMMY_SP }));
                let mut item_parser = Expr::Lit(Lit::Null(Null { span: DUMMY_SP }));
                let mut item_reporter = Expr::Lit(Lit::Null(Null { span: DUMMY_SP }));
                let mut item_schema = Expr::Lit(Lit::Null(Null { span: DUMMY_SP }));
                let mut item_describe = Expr::Lit(Lit::Null(Null { span: DUMMY_SP }));
                for p in prefix_items {
                    let SchemaCode {
                        validator: val,
                        parser: par,
                        reporter: rep,
                        schema: s,
                        describe: d,
                    } = self.generate_schema_code(p, hoisted);
                    prefix_validators.push(val);
                    prefix_parsers.push(par);
                    prefix_reporters.push(rep);
                    prefix_schemas.push(s);
                    prefix_describes.push(d);
                }
                if let Some(items) = items {
                    let SchemaCode {
                        validator: val,
                        parser: par,
                        reporter: rep,
                        schema: s,
                        describe: d,
                    } = self.generate_schema_code(items, hoisted);
                    item_validator = val;
                    item_parser = par;
                    item_reporter = rep;
                    item_schema = s;
                    item_describe = d;
                }
                let prefix_val_arr = Expr::Array(ArrayLit {
                    span: DUMMY_SP,
                    elems: prefix_validators
                        .into_iter()
                        .map(|it| {
                            Some(ExprOrSpread {
                                spread: None,
                                expr: it.into(),
                            })
                        })
                        .collect(),
                });
                let prefix_parser_arr = Expr::Array(ArrayLit {
                    span: DUMMY_SP,
                    elems: prefix_parsers
                        .into_iter()
                        .map(|it| {
                            Some(ExprOrSpread {
                                spread: None,
                                expr: it.into(),
                            })
                        })
                        .collect(),
                });
                let prefix_reporter_arr = Expr::Array(ArrayLit {
                    span: DUMMY_SP,
                    elems: prefix_reporters
                        .into_iter()
                        .map(|it| {
                            Some(ExprOrSpread {
                                spread: None,
                                expr: it.into(),
                            })
                        })
                        .collect(),
                });
                let prefix_schema_arr = Expr::Array(ArrayLit {
                    span: DUMMY_SP,
                    elems: prefix_schemas
                        .into_iter()
                        .map(|it| {
                            Some(ExprOrSpread {
                                spread: None,
                                expr: it.into(),
                            })
                        })
                        .collect(),
                });
                let prefix_describe_arr = Expr::Array(ArrayLit {
                    span: DUMMY_SP,
                    elems: prefix_describes
                        .into_iter()
                        .map(|it| {
                            Some(ExprOrSpread {
                                spread: None,
                                expr: it.into(),
                            })
                        })
                        .collect(),
                });

                let prefix_val_arr = self.hoist_expr(hoisted, prefix_val_arr);
                let item_validator = self.hoist_expr(hoisted, item_validator);
                self.dynamic_schema_code(
                    "Tuple",
                    hoisted,
                    vec![prefix_val_arr.clone(), item_validator.clone()],
                    vec![prefix_parser_arr, item_parser],
                    vec![
                        prefix_val_arr,
                        item_validator,
                        prefix_reporter_arr,
                        item_reporter,
                    ],
                    vec![prefix_schema_arr, item_schema],
                    vec![prefix_describe_arr, item_describe],
                )
            }

            JsonSchema::Object { vs, rest } => {
                let mut validator_rest = Expr::Lit(Lit::Null(Null { span: DUMMY_SP }));
                let mut parser_rest = Expr::Lit(Lit::Null(Null { span: DUMMY_SP }));
                let mut reporter_rest = Expr::Lit(Lit::Null(Null { span: DUMMY_SP }));
                let mut schema_rest = Expr::Lit(Lit::Null(Null { span: DUMMY_SP }));
                let mut describe_rest = Expr::Lit(Lit::Null(Null { span: DUMMY_SP }));

                let mut mapped = BTreeMap::new();

                for (k, v) in vs.iter() {
                    let r = match v {
                        Optionality::Optional(schema) => {
                            let nullable_schema = &JsonSchema::any_of(
                                vec![JsonSchema::Null, schema.clone()].into_iter().collect(),
                            );
                            self.generate_schema_code(nullable_schema, hoisted)
                        }
                        Optionality::Required(schema) => self.generate_schema_code(schema, hoisted),
                    };
                    mapped.insert(k.clone(), r);
                }

                let obj_validator = Expr::Object(ObjectLit {
                    span: DUMMY_SP,
                    props: mapped
                        .iter()
                        .map(|(key, value)| {
                            PropOrSpread::Prop(
                                Prop::KeyValue(KeyValueProp {
                                    key: PropName::Str(Str {
                                        span: DUMMY_SP,
                                        value: key.clone().into(),
                                        raw: None,
                                    }),
                                    value: value.validator.clone().into(),
                                })
                                .into(),
                            )
                        })
                        .collect(),
                });
                let obj_schema = Expr::Object(ObjectLit {
                    span: DUMMY_SP,
                    props: mapped
                        .iter()
                        .map(|(key, value)| {
                            PropOrSpread::Prop(
                                Prop::KeyValue(KeyValueProp {
                                    key: PropName::Str(Str {
                                        span: DUMMY_SP,
                                        value: key.clone().into(),
                                        raw: None,
                                    }),
                                    value: value.schema.clone().into(),
                                })
                                .into(),
                            )
                        })
                        .collect(),
                });

                let obj_describe = Expr::Object(ObjectLit {
                    span: DUMMY_SP,
                    props: mapped
                        .iter()
                        .map(|(key, value)| {
                            PropOrSpread::Prop(
                                Prop::KeyValue(KeyValueProp {
                                    key: PropName::Str(Str {
                                        span: DUMMY_SP,
                                        value: key.clone().into(),
                                        raw: None,
                                    }),
                                    value: value.describe.clone().into(),
                                })
                                .into(),
                            )
                        })
                        .collect(),
                });

                let obj_parser = Expr::Object(ObjectLit {
                    span: DUMMY_SP,
                    props: mapped
                        .iter()
                        .map(|(key, value)| {
                            PropOrSpread::Prop(
                                Prop::KeyValue(KeyValueProp {
                                    key: PropName::Str(Str {
                                        span: DUMMY_SP,
                                        value: key.clone().into(),
                                        raw: None,
                                    }),
                                    value: value.parser.clone().into(),
                                })
                                .into(),
                            )
                        })
                        .collect(),
                });

                let obj_reporter = Expr::Object(ObjectLit {
                    span: DUMMY_SP,
                    props: mapped
                        .iter()
                        .map(|(key, value)| {
                            PropOrSpread::Prop(
                                Prop::KeyValue(KeyValueProp {
                                    key: PropName::Str(Str {
                                        span: DUMMY_SP,
                                        value: key.clone().into(),
                                        raw: None,
                                    }),
                                    value: value.reporter.clone().into(),
                                })
                                .into(),
                            )
                        })
                        .collect(),
                });

                if let Some(rest) = rest {
                    let SchemaCode {
                        validator: val,
                        parser: par,
                        reporter: rep,
                        schema: s,
                        describe: d,
                    } = self.generate_schema_code(rest, hoisted);
                    validator_rest = val;
                    parser_rest = par;
                    reporter_rest = rep;
                    schema_rest = s;
                    describe_rest = d;
                }

                let obj_validator = self.hoist_expr(hoisted, obj_validator);
                let obj_schema = self.hoist_expr(hoisted, obj_schema);
                let obj_describe = self.hoist_expr(hoisted, obj_describe);
                let obj_describe = self.hoist_expr(hoisted, obj_describe);
                let validator_rest = self.hoist_expr(hoisted, validator_rest);

                self.dynamic_schema_code(
                    "Object",
                    hoisted,
                    vec![obj_validator.clone(), validator_rest.clone()],
                    vec![obj_parser, parser_rest],
                    vec![obj_validator, validator_rest, obj_reporter, reporter_rest],
                    vec![obj_schema, schema_rest],
                    vec![obj_describe, describe_rest],
                )
            }
            JsonSchema::AnyOf(vs) => self.decode_any_of(vs, hoisted),
            JsonSchema::AllOf(vs) => self.decode_union_or_intersection("AllOf", vs, hoisted),
        };

        call
    }
}

pub struct SchemaCode {
    pub validator: Expr,
    pub parser: Expr,
    pub reporter: Expr,
    pub schema: Expr,
    pub describe: Expr,
}

#[must_use]
pub fn validator_for_schema(
    schema: &JsonSchema,
    named_schemas: &Vec<NamedSchema>,
    hoisted: &mut Vec<ModuleItem>,
    name: &str,
) -> SchemaCode {
    DecoderFnGenerator {
        named_schemas,
        name: name.to_owned(),
    }
    .generate_schema_code(schema, hoisted)
}

pub struct SchemaCodeFunctions {
    pub validator: Function,
    pub parser: Function,
    pub reporter: Function,
    pub schema: Function,
    pub describe: Function,
}

#[must_use]
pub fn func_validator_for_schema(
    schema: &JsonSchema,
    named_schemas: &Vec<NamedSchema>,
    hoisted: &mut Vec<ModuleItem>,
    name: &str,
) -> SchemaCodeFunctions {
    let SchemaCode {
        validator,
        parser,
        reporter,
        schema,
        describe,
    } = validator_for_schema(schema, named_schemas, hoisted, name);

    let validator_fn = Function {
        params: vec![
            Param {
                span: DUMMY_SP,
                decorators: vec![],
                pat: Pat::Ident(BindingIdent {
                    id: Ident {
                        span: DUMMY_SP,
                        sym: "ctx".into(),
                        optional: false,
                    },
                    type_ann: None,
                }),
            },
            Param {
                span: DUMMY_SP,
                decorators: vec![],
                pat: Pat::Ident(BindingIdent {
                    id: SwcBuilder::input_ident(),
                    type_ann: None,
                }),
            },
        ],
        decorators: vec![],
        span: DUMMY_SP,
        body: BlockStmt {
            span: DUMMY_SP,
            stmts: vec![Stmt::Return(ReturnStmt {
                span: DUMMY_SP,
                arg: Some(Box::new(Expr::Call(CallExpr {
                    span: DUMMY_SP,
                    callee: Callee::Expr(Box::new(Expr::Paren(ParenExpr {
                        span: DUMMY_SP,
                        expr: validator.into(),
                    }))),
                    args: vec![
                        ExprOrSpread {
                            spread: None,
                            expr: SwcBuilder::ident_expr("ctx").into(),
                        },
                        ExprOrSpread {
                            spread: None,
                            expr: SwcBuilder::ident_expr("input").into(),
                        },
                    ],
                    type_args: None,
                }))),
            })],
        }
        .into(),
        is_async: false,
        is_generator: false,
        type_params: None,
        return_type: None,
    };

    let parser_fn = Function {
        params: vec![
            Param {
                span: DUMMY_SP,
                decorators: vec![],
                pat: Pat::Ident(BindingIdent {
                    id: Ident {
                        span: DUMMY_SP,
                        sym: "ctx".into(),
                        optional: false,
                    },
                    type_ann: None,
                }),
            },
            Param {
                span: DUMMY_SP,
                decorators: vec![],
                pat: Pat::Ident(BindingIdent {
                    id: SwcBuilder::input_ident(),
                    type_ann: None,
                }),
            },
        ],
        decorators: vec![],
        span: DUMMY_SP,
        body: BlockStmt {
            span: DUMMY_SP,
            stmts: vec![Stmt::Return(ReturnStmt {
                span: DUMMY_SP,
                arg: Some(Box::new(Expr::Call(CallExpr {
                    span: DUMMY_SP,
                    callee: Callee::Expr(Box::new(Expr::Paren(ParenExpr {
                        span: DUMMY_SP,
                        expr: parser.into(),
                    }))),
                    args: vec![
                        ExprOrSpread {
                            spread: None,
                            expr: SwcBuilder::ident_expr("ctx").into(),
                        },
                        ExprOrSpread {
                            spread: None,
                            expr: SwcBuilder::ident_expr("input").into(),
                        },
                    ],
                    type_args: None,
                }))),
            })],
        }
        .into(),
        is_async: false,
        is_generator: false,
        type_params: None,
        return_type: None,
    };

    let reporter_fn = Function {
        params: vec![
            Param {
                span: DUMMY_SP,
                decorators: vec![],
                pat: Pat::Ident(BindingIdent {
                    id: Ident {
                        span: DUMMY_SP,
                        sym: "ctx".into(),
                        optional: false,
                    },
                    type_ann: None,
                }),
            },
            Param {
                span: DUMMY_SP,
                decorators: vec![],
                pat: Pat::Ident(BindingIdent {
                    id: SwcBuilder::input_ident(),
                    type_ann: None,
                }),
            },
        ],
        decorators: vec![],
        span: DUMMY_SP,
        body: BlockStmt {
            span: DUMMY_SP,
            stmts: vec![Stmt::Return(ReturnStmt {
                span: DUMMY_SP,
                arg: Some(Box::new(Expr::Call(CallExpr {
                    span: DUMMY_SP,
                    callee: Callee::Expr(Box::new(Expr::Paren(ParenExpr {
                        span: DUMMY_SP,
                        expr: reporter.into(),
                    }))),
                    args: vec![
                        ExprOrSpread {
                            spread: None,
                            expr: SwcBuilder::ident_expr("ctx").into(),
                        },
                        ExprOrSpread {
                            spread: None,
                            expr: SwcBuilder::ident_expr("input").into(),
                        },
                    ],
                    type_args: None,
                }))),
            })],
        }
        .into(),
        is_async: false,
        is_generator: false,
        type_params: None,
        return_type: None,
    };

    let ctx_seen_name = Expr::Member(MemberExpr {
        span: DUMMY_SP,
        obj: Expr::Member(MemberExpr {
            span: DUMMY_SP,
            obj: Expr::Ident(Ident {
                span: DUMMY_SP,
                sym: "ctx".into(),
                optional: false,
            })
            .into(),
            prop: MemberProp::Ident(Ident {
                span: DUMMY_SP,
                sym: "seen".into(),
                optional: false,
            }),
        })
        .into(),
        prop: MemberProp::Computed(ComputedPropName {
            span: DUMMY_SP,
            expr: Expr::Lit(Lit::Str(Str {
                span: DUMMY_SP,
                value: name.into(),
                raw: None,
            }))
            .into(),
        }),
    });

    let schema_fn = Function {
        params: vec![
            Param {
                span: DUMMY_SP,
                decorators: vec![],
                pat: Pat::Ident(BindingIdent {
                    id: Ident {
                        span: DUMMY_SP,
                        sym: "ctx".into(),
                        optional: false,
                    },
                    type_ann: None,
                }),
            },
            Param {
                span: DUMMY_SP,
                decorators: vec![],
                pat: Pat::Ident(BindingIdent {
                    id: SwcBuilder::input_ident(),
                    type_ann: None,
                }),
            },
        ],
        decorators: vec![],
        span: DUMMY_SP,
        body: BlockStmt {
            span: DUMMY_SP,
            stmts: vec![
                Stmt::If(IfStmt {
                    span: DUMMY_SP,
                    test: ctx_seen_name.clone().into(),
                    cons: Stmt::Block(BlockStmt {
                        span: DUMMY_SP,
                        stmts: vec![
                            // return empty object (any) on second time a recursive type is seen
                            Stmt::Return(ReturnStmt {
                                span: DUMMY_SP,
                                arg: Some(Box::new(Expr::Object(ObjectLit {
                                    span: DUMMY_SP,
                                    props: vec![],
                                }))),
                            }),
                        ],
                    })
                    .into(),
                    alt: None,
                }),
                Stmt::Expr(ExprStmt {
                    span: DUMMY_SP,
                    expr: Box::new(Expr::Assign(AssignExpr {
                        span: DUMMY_SP,
                        op: AssignOp::Assign,
                        left: swc_ecma_ast::PatOrExpr::Expr(ctx_seen_name.clone().into()),
                        right: Expr::Lit(Lit::Bool(Bool {
                            span: DUMMY_SP,
                            value: true,
                        }))
                        .into(),
                    })),
                }),
                Stmt::Decl(Decl::Var(
                    VarDecl {
                        span: DUMMY_SP,
                        kind: VarDeclKind::Var,
                        declare: false,
                        decls: vec![VarDeclarator {
                            span: DUMMY_SP,
                            name: Pat::Ident(BindingIdent {
                                type_ann: None,
                                id: Ident {
                                    span: DUMMY_SP,
                                    sym: "tmp".into(),
                                    optional: false,
                                },
                            }),
                            init: Some(Box::new(Expr::Call(CallExpr {
                                span: DUMMY_SP,
                                callee: Callee::Expr(Box::new(Expr::Paren(ParenExpr {
                                    span: DUMMY_SP,
                                    expr: schema.into(),
                                }))),
                                args: vec![ExprOrSpread {
                                    spread: None,
                                    expr: SwcBuilder::ident_expr("ctx").into(),
                                }],
                                type_args: None,
                            }))),
                            definite: false,
                        }],
                    }
                    .into(),
                )),
                Stmt::Expr(ExprStmt {
                    span: DUMMY_SP,
                    expr: Expr::Unary(UnaryExpr {
                        span: DUMMY_SP,
                        op: UnaryOp::Delete,
                        arg: ctx_seen_name.into(),
                    })
                    .into(),
                }),
                Stmt::Return(ReturnStmt {
                    span: DUMMY_SP,
                    arg: Some(Box::new(Expr::Ident(Ident {
                        span: DUMMY_SP,
                        sym: "tmp".into(),
                        optional: false,
                    }))),
                }),
            ],
        }
        .into(),
        is_async: false,
        is_generator: false,
        type_params: None,
        return_type: None,
    };

    let describe_fn = Function {
        params: vec![
            Param {
                span: DUMMY_SP,
                decorators: vec![],
                pat: Pat::Ident(BindingIdent {
                    id: Ident {
                        span: DUMMY_SP,
                        sym: "ctx".into(),
                        optional: false,
                    },
                    type_ann: None,
                }),
            },
            Param {
                span: DUMMY_SP,
                decorators: vec![],
                pat: Pat::Ident(BindingIdent {
                    id: SwcBuilder::input_ident(),
                    type_ann: None,
                }),
            },
        ],
        decorators: vec![],
        span: DUMMY_SP,
        body: BlockStmt {
            span: DUMMY_SP,
            stmts: vec![Stmt::Return(ReturnStmt {
                span: DUMMY_SP,
                arg: Some(Box::new(Expr::Call(CallExpr {
                    span: DUMMY_SP,
                    callee: Callee::Expr(Box::new(Expr::Paren(ParenExpr {
                        span: DUMMY_SP,
                        expr: describe.into(),
                    }))),
                    args: vec![ExprOrSpread {
                        spread: None,
                        expr: SwcBuilder::ident_expr("ctx").into(),
                    }],
                    type_args: None,
                }))),
            })],
        }
        .into(),
        is_async: false,
        is_generator: false,
        type_params: None,
        return_type: None,
    };
    SchemaCodeFunctions {
        validator: validator_fn,
        parser: parser_fn,
        reporter: reporter_fn,
        schema: schema_fn,
        describe: describe_fn,
    }
}
