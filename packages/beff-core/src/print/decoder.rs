use super::{expr::ToExpr, printer::const_decl};
use crate::{
    ast::json_schema::{JsonSchema, JsonSchemaConst, Optionality, TplLitTypeItem},
    Validator,
};
use std::collections::{BTreeMap, BTreeSet};
use swc_common::DUMMY_SP;
use swc_ecma_ast::{
    ArrayLit, ArrowExpr, BindingIdent, BlockStmt, BlockStmtOrExpr, CallExpr, Callee, Expr,
    ExprOrSpread, Function, Ident, KeyValueProp, Lit, MemberExpr, MemberProp, ModuleItem, NewExpr,
    Null, ObjectLit, Param, ParenExpr, Pat, Prop, PropName, PropOrSpread, Regex, ReturnStmt, Stmt,
    Str,
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
    validators: &'a Vec<Validator>,
    name: String,
}

impl DecoderFnGenerator<'_> {
    fn base_args() -> Vec<ExprOrSpread> {
        vec![
            ExprOrSpread {
                spread: None,
                expr: SwcBuilder::ident_expr("ctx").into(),
            },
            ExprOrSpread {
                spread: None,
                expr: SwcBuilder::ident_expr("input").into(),
            },
        ]
    }

    fn decode_call_extra(fn_name: &str, extra: Vec<Expr>) -> Expr {
        Expr::Call(CallExpr {
            span: DUMMY_SP,
            callee: Callee::Expr(
                Expr::Ident(Ident {
                    span: DUMMY_SP,
                    sym: fn_name.into(),
                    optional: false,
                })
                .into(),
            ),
            args: Self::base_args()
                .into_iter()
                .chain(extra.into_iter().map(|it| ExprOrSpread {
                    spread: None,
                    expr: it.into(),
                }))
                .collect(),
            type_args: None,
        })
    }

    fn decode_ref(schema_ref: &str) -> Expr {
        let decoder_ref_fn = Expr::Member(MemberExpr {
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

        Expr::Call(CallExpr {
            span: DUMMY_SP,
            callee: Callee::Expr(decoder_ref_fn.into()),
            args: Self::base_args(),
            type_args: None,
        })
    }

    fn make_cb(body: Expr) -> Expr {
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
                    id: Ident {
                        span: DUMMY_SP,
                        sym: "input".into(),
                        optional: false,
                    },
                    type_ann: None,
                }),
            ],
            body: BlockStmtOrExpr::Expr(
                Expr::Paren(ParenExpr {
                    span: DUMMY_SP,
                    expr: body.into(),
                })
                .into(),
            )
            .into(),
            is_async: false,
            is_generator: false,
            type_params: None,
            return_type: None,
        })
    }

    fn decode_union_or_intersection(
        &self,
        decoder_name: &str,
        vs: &BTreeSet<JsonSchema>,
        hoisted: &mut Vec<ModuleItem>,
    ) -> Expr {
        let els_expr: Vec<Expr> = vs.iter().map(|it| self.decode_expr(it, hoisted)).collect();

        Self::decode_call_extra(
            decoder_name,
            vec![self.hoist_expr(
                hoisted,
                Expr::Array(ArrayLit {
                    span: DUMMY_SP,
                    elems: els_expr
                        .into_iter()
                        .map(|it| {
                            Some(ExprOrSpread {
                                spread: None,
                                expr: it.into(),
                            })
                        })
                        .collect(),
                }),
            )],
        )
    }
    fn extract_union(&self, it: &JsonSchema) -> Vec<JsonSchema> {
        match it {
            JsonSchema::AnyOf(vs) => vs.iter().flat_map(|it| self.extract_union(it)).collect(),
            JsonSchema::Ref(r) => {
                let v = self
                    .validators
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

        discriminator: String,
        discriminator_strings: BTreeSet<String>,
        object_vs: Vec<&BTreeMap<String, Optionality<JsonSchema>>>,
        hoisted: &mut Vec<ModuleItem>,
    ) -> Expr {
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
                                .filter(|it| it.0 != &discriminator)
                                .map(|it| (it.0.clone(), it.1.clone()))
                                .collect();
                            let new_obj = JsonSchema::object(new_obj_vs, None);
                            cases.push(new_obj);
                        }
                    }
                }
            }
            let schema = JsonSchema::any_of(cases);

            acc.insert(current_key, schema);
        }

        let extra_obj = Expr::Object(ObjectLit {
            span: DUMMY_SP,
            props: acc
                .iter()
                .map(|(key, value)| {
                    PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                        key: PropName::Str(Str {
                            span: DUMMY_SP,
                            value: key.clone().into(),
                            raw: None,
                        }),
                        value: Box::new(self.decode_expr(value, hoisted)),
                    })))
                })
                .collect(),
        });

        Self::decode_call_extra(
            "decodeAnyOfDiscriminated",
            vec![
                Expr::Lit(Lit::Str(Str {
                    span: DUMMY_SP,
                    value: discriminator.clone().into(),
                    raw: None,
                })),
                self.hoist_expr(hoisted, extra_obj),
            ],
        )
    }
    fn maybe_decode_any_of_discriminated(
        &self,
        flat_values: &BTreeSet<JsonSchema>,

        hoisted: &mut Vec<ModuleItem>,
    ) -> Option<Expr> {
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
                            discriminator,
                            discriminator_strings,
                            object_vs,
                            hoisted,
                        ));
                    }
                }
            }
        }
        None
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

    fn decode_bound(hoisted: Expr) -> Expr {
        let member = Expr::Member(MemberExpr {
            span: DUMMY_SP,
            obj: hoisted.clone().into(),
            prop: MemberProp::Ident(Ident {
                span: DUMMY_SP,
                sym: "decode".into(),
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
            args: vec![hoisted.into()],
            type_args: None,
        })
    }

    fn new_hoisted_decoder(
        &self,
        hoisted: &mut Vec<ModuleItem>,
        class: &str,
        args: Vec<Expr>,
    ) -> Expr {
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
        let hoisted = self.hoist_expr(hoisted, new_expr);
        hoisted
    }

    fn maybe_decode_any_of_consts(
        &self,
        flat_values: &BTreeSet<JsonSchema>,

        hoisted: &mut Vec<ModuleItem>,
    ) -> Option<Expr> {
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

            let consts = self.hoist_expr(
                hoisted,
                Expr::Array(ArrayLit {
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
                }),
            );
            return Some(Self::decode_call_extra("decodeAnyOfConsts", vec![consts]));
        }
        None
    }
    fn decode_any_of(&self, vs: &BTreeSet<JsonSchema>, hoisted: &mut Vec<ModuleItem>) -> Expr {
        if vs.is_empty() {
            panic!("empty anyOf is not allowed")
        }

        let flat_values = vs
            .iter()
            .flat_map(|it| self.extract_union(it))
            .collect::<BTreeSet<_>>();

        if let Some(consts) = self.maybe_decode_any_of_consts(&flat_values, hoisted) {
            return consts;
        }

        if let Some(discriminated) = self.maybe_decode_any_of_discriminated(&flat_values, hoisted) {
            return discriminated;
        }

        self.decode_union_or_intersection("decodeAnyOf", vs, hoisted)
    }

    fn decode_expr(&self, schema: &JsonSchema, hoisted: &mut Vec<ModuleItem>) -> Expr {
        let call = match schema {
            JsonSchema::StNot(_) => {
                unreachable!("should not create decoders for semantic types")
            }

            JsonSchema::StNever => SwcBuilder::ident_expr("decodeNever"),
            JsonSchema::AnyArrayLike => {
                Self::make_cb(self.decode_expr(&JsonSchema::Array(JsonSchema::Any.into()), hoisted))
            }
            JsonSchema::Null => SwcBuilder::ident_expr("decodeNull"),
            JsonSchema::Boolean => SwcBuilder::ident_expr("decodeBoolean"),
            JsonSchema::String => SwcBuilder::ident_expr("decodeString"),
            JsonSchema::Number => SwcBuilder::ident_expr("decodeNumber"),
            JsonSchema::Any => SwcBuilder::ident_expr("decodeAny"),
            JsonSchema::StringWithFormat(format) => Self::make_cb(Self::decode_call_extra(
                "decodeStringWithFormat",
                vec![Expr::Lit(Lit::Str(Str {
                    span: DUMMY_SP,
                    value: format.to_string().into(),
                    raw: None,
                }))],
            )),
            JsonSchema::Ref(r_name) => Self::make_cb(Self::decode_ref(r_name)),
            JsonSchema::Object { vs, rest } => {
                let obj_to_hoist = Expr::Object(ObjectLit {
                    span: DUMMY_SP,
                    props: vs
                        .iter()
                        .map(|(key, value)| {
                            PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                                key: PropName::Str(Str {
                                    span: DUMMY_SP,
                                    value: key.clone().into(),
                                    raw: None,
                                }),
                                value: Box::new(match value {
                                    Optionality::Optional(schema) => {
                                        let nullable_schema = &JsonSchema::AnyOf(
                                            vec![JsonSchema::Null, schema.clone()]
                                                .into_iter()
                                                .collect(),
                                        );
                                        self.decode_expr(nullable_schema, hoisted)
                                    }
                                    Optionality::Required(schema) => {
                                        self.decode_expr(schema, hoisted)
                                    }
                                }),
                            })))
                        })
                        .collect(),
                });

                let mut extra = vec![self.hoist_expr(hoisted, obj_to_hoist)];
                if let Some(rest) = rest {
                    let rest = self.decode_expr(rest, hoisted);
                    extra.push(rest);
                }
                Self::make_cb(Self::decode_call_extra("decodeObject", extra))
            }
            JsonSchema::Array(ty) => {
                let decoding = self.decode_expr(ty, hoisted);

                Self::decode_bound(self.new_hoisted_decoder(
                    hoisted,
                    "ArrayDecoder",
                    vec![decoding],
                ))
            }
            JsonSchema::Tuple {
                prefix_items,
                items,
            } => {
                let tpl_extra = Expr::Object(ObjectLit {
                    span: DUMMY_SP,
                    props: vec![
                        PropOrSpread::Prop(
                            Prop::KeyValue(KeyValueProp {
                                key: PropName::Ident(Ident {
                                    span: DUMMY_SP,
                                    sym: "prefix".into(),
                                    optional: false,
                                }),
                                value: Box::new(Expr::Array(ArrayLit {
                                    span: DUMMY_SP,
                                    elems: prefix_items
                                        .iter()
                                        .map(|it| {
                                            Some(ExprOrSpread {
                                                spread: None,
                                                expr: self.decode_expr(it, hoisted).into(),
                                            })
                                        })
                                        .collect(),
                                })),
                            })
                            .into(),
                        ),
                        PropOrSpread::Prop(
                            Prop::KeyValue(KeyValueProp {
                                key: PropName::Ident(Ident {
                                    span: DUMMY_SP,
                                    sym: "items".into(),
                                    optional: false,
                                }),
                                value: Box::new(match items {
                                    Some(v) => self.decode_expr(v, hoisted),
                                    None => Expr::Lit(Lit::Null(Null { span: DUMMY_SP })),
                                }),
                            })
                            .into(),
                        ),
                    ],
                });

                Self::decode_bound(self.new_hoisted_decoder(
                    hoisted,
                    "TupleDecoder",
                    vec![tpl_extra],
                ))
            }
            JsonSchema::AnyOf(vs) => Self::make_cb(self.decode_any_of(vs, hoisted)),
            JsonSchema::AllOf(vs) => {
                Self::make_cb(self.decode_union_or_intersection("decodeAllOf", vs, hoisted))
            }
            JsonSchema::Const(json) => Self::decode_bound(self.new_hoisted_decoder(
                hoisted,
                "ConstDecoder",
                vec![json.clone().to_json().to_expr()],
            )),
            JsonSchema::Codec(format) => Self::decode_bound(self.new_hoisted_decoder(
                hoisted,
                "CodecDecoder",
                vec![Expr::Lit(Lit::Str(Str {
                    span: DUMMY_SP,
                    value: format.to_string().into(),
                    raw: None,
                }))],
            )),
            JsonSchema::TplLitType(items) => {
                let mut regex_exp = String::new();

                for item in items {
                    regex_exp.push_str(&item.regex_expr());
                }

                Self::decode_bound(self.new_hoisted_decoder(
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
                ))
            }
            JsonSchema::Function => SwcBuilder::ident_expr("decodeFunction"),
        };

        call
    }

    fn fn_decoder_from_schema(
        &mut self,
        schema: &JsonSchema,
        hoisted: &mut Vec<ModuleItem>,
    ) -> Function {
        Function {
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
                            expr: Box::new(self.decode_expr(schema, hoisted)),
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
        }
    }
}
#[must_use]
pub fn from_schema(
    schema: &JsonSchema,
    validators: &Vec<Validator>,
    hoisted: &mut Vec<ModuleItem>,
    name: &str,
) -> Function {
    DecoderFnGenerator {
        validators,
        name: name.to_owned(),
    }
    .fn_decoder_from_schema(schema, hoisted)
}
