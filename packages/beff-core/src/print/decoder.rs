use super::{expr::ToExpr, printer::const_decl};
use crate::{
    ast::json_schema::{JsonSchema, Optionality, TplLitTypeItem},
    NamedSchema,
};
use std::collections::{BTreeMap, BTreeSet};
use swc_common::DUMMY_SP;
use swc_ecma_ast::{
    ArrayLit, BindingIdent, BlockStmt, CallExpr, Callee, Expr, ExprOrSpread, Function, Ident,
    KeyValueProp, Lit, MemberExpr, MemberProp, ModuleItem, NewExpr, Null, ObjectLit, Param,
    ParenExpr, Pat, Prop, PropName, PropOrSpread, Regex, ReturnStmt, Stmt, Str,
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
    // fn extract_union(&self, it: &JsonSchema) -> Vec<JsonSchema> {
    //     match it {
    //         JsonSchema::AnyOf(vs) => vs.iter().flat_map(|it| self.extract_union(it)).collect(),
    //         JsonSchema::Ref(r) => {
    //             let v = self
    //                 .named_schemas
    //                 .iter()
    //                 .find(|it| it.name == *r)
    //                 .expect("everything should be resolved by now");
    //             self.extract_union(&v.schema)
    //         }
    //         _ => vec![it.clone()],
    //     }
    // }

    // fn decode_any_of_discriminated(
    //     &self,

    //     discriminator: String,
    //     discriminator_strings: BTreeSet<String>,
    //     object_vs: Vec<&BTreeMap<String, Optionality<JsonSchema>>>,
    //     hoisted: &mut Vec<ModuleItem>,
    // ) -> Expr {
    //     let mut acc = BTreeMap::new();
    //     for current_key in discriminator_strings {
    //         let mut cases = vec![];
    //         for vs in object_vs.iter() {
    //             let value = vs
    //                 .get(&discriminator)
    //                 .expect("we already checked the discriminator exists")
    //                 .inner();

    //             let all_values = self.extract_union(value);
    //             for s in all_values {
    //                 if let JsonSchema::Const(JsonSchemaConst::String(s)) = s {
    //                     if s == current_key {
    //                         let new_obj_vs: Vec<(String, Optionality<JsonSchema>)> = vs
    //                             .iter()
    //                             .filter(|it| it.0 != &discriminator)
    //                             .map(|it| (it.0.clone(), it.1.clone()))
    //                             .collect();
    //                         let new_obj = JsonSchema::object(new_obj_vs, None);
    //                         cases.push(new_obj);
    //                     }
    //                 }
    //             }
    //         }
    //         let schema = JsonSchema::any_of(cases);

    //         acc.insert(current_key, schema);
    //     }

    //     let extra_obj = Expr::Object(ObjectLit {
    //         span: DUMMY_SP,
    //         props: acc
    //             .iter()
    //             .map(|(key, value)| {
    //                 PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
    //                     key: PropName::Str(Str {
    //                         span: DUMMY_SP,
    //                         value: key.clone().into(),
    //                         raw: None,
    //                     }),
    //                     value: Box::new(self.decode_expr(value, hoisted)),
    //                 })))
    //             })
    //             .collect(),
    //     });
    //     self.new_hoisted_decoder(
    //         hoisted,
    //         "AnyOfDiscriminatedDecoder",
    //         vec![
    //             Expr::Lit(Lit::Str(Str {
    //                 span: DUMMY_SP,
    //                 value: discriminator.clone().into(),
    //                 raw: None,
    //             })),
    //             extra_obj,
    //         ],
    //     )
    // }
    // fn maybe_decode_any_of_discriminated(
    //     &self,
    //     flat_values: &BTreeSet<JsonSchema>,

    //     hoisted: &mut Vec<ModuleItem>,
    // ) -> Option<Expr> {
    //     let all_objects_without_rest = flat_values
    //         .iter()
    //         .all(|it| matches!(it, JsonSchema::Object { rest: None, .. }));

    //     let object_vs = flat_values
    //         .iter()
    //         .filter_map(|it| match it {
    //             JsonSchema::Object { vs, rest: _ } => Some(vs),
    //             _ => None,
    //         })
    //         .collect::<Vec<_>>();
    //     if all_objects_without_rest {
    //         let mut keys = vec![];
    //         for vs in &object_vs {
    //             for key in vs.keys() {
    //                 keys.push(key.clone());
    //             }
    //         }

    //         for discriminator in keys {
    //             let contained_in_all = object_vs.iter().all(|it| it.contains_key(&discriminator));
    //             if contained_in_all {
    //                 let values = object_vs
    //                     .iter()
    //                     .map(|it| {
    //                         it.get(&discriminator)
    //                             .expect("we already checked the discriminator exists")
    //                             .clone()
    //                     })
    //                     .collect::<BTreeSet<_>>();

    //                 let all_required = values
    //                     .iter()
    //                     .all(|it| matches!(it, Optionality::Required(_)));

    //                 if !all_required {
    //                     continue;
    //                 }

    //                 let discriminator_values = values
    //                     .iter()
    //                     .map(|it| match it {
    //                         Optionality::Required(schema) => schema.clone(),
    //                         _ => unreachable!(),
    //                     })
    //                     .collect::<BTreeSet<_>>();
    //                 let flat_discriminator_values = discriminator_values
    //                     .iter()
    //                     .flat_map(|it| self.extract_union(it))
    //                     .collect::<BTreeSet<_>>();

    //                 let all_string_consts = flat_discriminator_values
    //                     .iter()
    //                     .all(|it| matches!(it, JsonSchema::Const(JsonSchemaConst::String(_))));

    //                 if all_string_consts {
    //                     let discriminator_strings: BTreeSet<String> = flat_discriminator_values
    //                         .iter()
    //                         .map(|it| match it {
    //                             JsonSchema::Const(JsonSchemaConst::String(s)) => s.clone(),
    //                             _ => unreachable!(),
    //                         })
    //                         .collect::<BTreeSet<_>>();

    //                     return Some(self.decode_any_of_discriminated(
    //                         discriminator,
    //                         discriminator_strings,
    //                         object_vs,
    //                         hoisted,
    //                     ));
    //                 }
    //             }
    //         }
    //     }
    //     None
    // }

    // fn maybe_decode_any_of_consts(
    //     &self,
    //     flat_values: &BTreeSet<JsonSchema>,

    //     hoisted: &mut Vec<ModuleItem>,
    // ) -> Option<Expr> {
    //     let all_consts = flat_values
    //         .iter()
    //         .all(|it| matches!(it, JsonSchema::Const(_)));
    //     if all_consts {
    //         let consts: Vec<Expr> = flat_values
    //             .iter()
    //             .map(|it| match it {
    //                 JsonSchema::Const(json) => json.clone().to_json().to_expr(),
    //                 _ => unreachable!(),
    //             })
    //             .collect();

    //         let consts = Expr::Array(ArrayLit {
    //             span: DUMMY_SP,
    //             elems: consts
    //                 .into_iter()
    //                 .map(|it| {
    //                     Some(ExprOrSpread {
    //                         spread: None,
    //                         expr: it.into(),
    //                     })
    //                 })
    //                 .collect(),
    //         });

    //         return Some(self.new_hoisted_decoder(hoisted, "AnyOfConstsDecoder", vec![consts]));
    //     }
    //     None
    // }
    fn decode_any_of(
        &self,
        vs: &BTreeSet<JsonSchema>,
        hoisted: &mut Vec<ModuleItem>,
    ) -> SchemaCode {
        if vs.is_empty() {
            panic!("empty anyOf is not allowed")
        }

        // let flat_values = vs
        //     .iter()
        //     .flat_map(|it: &JsonSchema| self.extract_union(it))
        //     .collect::<BTreeSet<_>>();

        // if let Some(consts) = self.maybe_decode_any_of_consts(&flat_values, hoisted) {
        //     return consts;
        // }

        // if let Some(discriminated) = self.maybe_decode_any_of_discriminated(&flat_values, hoisted) {
        //     return discriminated;
        // }

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
        }
    }
    fn ref_schema_code(schema_ref: &str) -> SchemaCode {
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

        SchemaCode {
            validator,
            parser,
            reporter,
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

        SchemaCode {
            validator: bound_validate,
            parser: bound_parse,
            reporter: bound_reporter,
        }
    }

    fn dynamic_schema_code(
        &self,
        name: &str,
        hoisted: &mut Vec<ModuleItem>,
        validator_args: Vec<Expr>,
        parser_args: Vec<Expr>,
        reporter_args: Vec<Expr>,
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

        SchemaCode {
            validator: bound_validate,
            parser: bound_parse,
            reporter: bound_reporter,
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

        for v in vs {
            let SchemaCode {
                validator: val,
                parser: par,
                reporter: rep,
            } = self.generate_schema_code(v, hoisted);
            validators.push(val);
            parsers.push(par);
            reporters.push(rep);
        }

        let validators_arr = Expr::Array(ArrayLit {
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
        });

        self.dynamic_schema_code(
            decoder_name,
            hoisted,
            vec![validators_arr.clone()],
            vec![
                validators_arr,
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
            vec![Expr::Array(ArrayLit {
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
            })],
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
            JsonSchema::Ref(r_name) => Self::ref_schema_code(r_name),
            JsonSchema::StringWithFormat(format) => self.static_schema_code(
                hoisted,
                "StringWithFormatDecoder",
                vec![Expr::Lit(Lit::Str(Str {
                    span: DUMMY_SP,
                    value: format.to_string().into(),
                    raw: None,
                }))],
            ),
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
                } = self.generate_schema_code(ty, hoisted);
                self.dynamic_schema_code(
                    "Array",
                    hoisted,
                    vec![inner_val],
                    vec![inner_parser],
                    vec![inner_reporter],
                )
            }
            JsonSchema::Tuple {
                prefix_items,
                items,
            } => {
                let mut prefix_validators: Vec<Expr> = vec![];
                let mut prefix_parsers: Vec<Expr> = vec![];
                let mut prefix_reporters: Vec<Expr> = vec![];
                let mut item_validator = Expr::Lit(Lit::Null(Null { span: DUMMY_SP }));
                let mut item_parser = Expr::Lit(Lit::Null(Null { span: DUMMY_SP }));
                let mut item_reporter = Expr::Lit(Lit::Null(Null { span: DUMMY_SP }));
                for p in prefix_items {
                    let SchemaCode {
                        validator: val,
                        parser: par,
                        reporter: rep,
                    } = self.generate_schema_code(p, hoisted);
                    prefix_validators.push(val);
                    prefix_parsers.push(par);
                    prefix_reporters.push(rep);
                }
                if let Some(items) = items {
                    let SchemaCode {
                        validator: val,
                        parser: par,
                        reporter: rep,
                    } = self.generate_schema_code(items, hoisted);
                    item_validator = val;
                    item_parser = par;
                    item_reporter = rep;
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
                self.dynamic_schema_code(
                    "Tuple",
                    hoisted,
                    vec![prefix_val_arr, item_validator],
                    vec![prefix_parser_arr, item_parser],
                    vec![prefix_reporter_arr, item_reporter],
                )
            }
            JsonSchema::Object { vs, rest } => {
                let mut validator_rest = Expr::Lit(Lit::Null(Null { span: DUMMY_SP }));
                let mut parser_rest = Expr::Lit(Lit::Null(Null { span: DUMMY_SP }));
                let mut reporter_rest = Expr::Lit(Lit::Null(Null { span: DUMMY_SP }));

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
                    } = self.generate_schema_code(rest, hoisted);
                    validator_rest = val;
                    parser_rest = par;
                    reporter_rest = rep;
                }

                self.dynamic_schema_code(
                    "Object",
                    hoisted,
                    vec![obj_validator, validator_rest],
                    vec![obj_parser, parser_rest],
                    vec![obj_reporter, reporter_rest],
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
}

#[must_use]
pub fn validator_for_schema(
    schema: &JsonSchema,
    named_schemas: &Vec<NamedSchema>,
    hoisted: &mut Vec<ModuleItem>,
    name: &str,
) -> SchemaCode {
    DecoderFnGenerator {
        named_schemas: named_schemas,
        name: name.to_owned(),
    }
    .generate_schema_code(schema, hoisted)
}

pub struct SchemaCodeFunctions {
    pub validator: Function,
    pub parser: Function,
    pub reporter: Function,
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

    SchemaCodeFunctions {
        validator: validator_fn,
        parser: parser_fn,
        reporter: reporter_fn,
    }
}
