use std::collections::{BTreeMap, BTreeSet};

use crate::{
    ast::json_schema::{JsonSchema, JsonSchemaConst, Optionality},
    Validator,
};
use swc_common::DUMMY_SP;
use swc_ecma_ast::{
    ArrayLit, ArrowExpr, AssignPat, BindingIdent, BlockStmt, BlockStmtOrExpr, Bool, CallExpr,
    Callee, Expr, ExprOrSpread, Function, Ident, KeyValueProp, Lit, MemberExpr, MemberProp, Null,
    ObjectLit, Param, ParenExpr, Pat, Prop, PropName, PropOrSpread, ReturnStmt, Stmt, Str,
};

use super::expr::ToExpr;
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

#[derive(Debug, Clone, Copy)]
enum Required {
    Known(bool),
    FromArgs,
}
struct DecoderFnGenerator<'a> {
    validators: &'a Vec<Validator>,
}

impl<'a> DecoderFnGenerator<'a> {
    fn decode_call(fn_name: &str, required: Required) -> Expr {
        Self::decode_call_extra(fn_name, required, vec![])
    }

    fn require_to_expr(required: Required) -> Expr {
        match required {
            Required::Known(v) => Expr::Lit(Lit::Bool(Bool {
                span: DUMMY_SP,
                value: v,
            })),
            Required::FromArgs => SwcBuilder::ident_expr("required"),
        }
    }
    fn base_args(required: Required) -> Vec<ExprOrSpread> {
        vec![
            ExprOrSpread {
                spread: None,
                expr: SwcBuilder::ident_expr("ctx").into(),
            },
            ExprOrSpread {
                spread: None,
                expr: SwcBuilder::ident_expr("input").into(),
            },
            ExprOrSpread {
                spread: None,
                expr: Self::require_to_expr(required).into(),
            },
        ]
    }

    fn decode_call_extra(fn_name: &str, required: Required, extra: Vec<Expr>) -> Expr {
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
            args: Self::base_args(required)
                .into_iter()
                .chain(extra.into_iter().map(|it| ExprOrSpread {
                    spread: None,
                    expr: it.into(),
                }))
                .collect(),
            type_args: None,
        })
    }

    fn decode_ref(schema_ref: &str, required: Required) -> Expr {
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
            args: Self::base_args(required),
            type_args: None,
        })
    }

    fn make_cb(extra: Expr) -> Expr {
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
                    expr: extra.into(),
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
        required: Required,
        vs: &BTreeSet<JsonSchema>,
    ) -> Expr {
        let els_expr: Vec<Expr> = vs.iter().map(|it| self.decode_expr(it, required)).collect();
        Self::decode_call_extra(
            decoder_name,
            required,
            vec![Expr::Array(ArrayLit {
                span: DUMMY_SP,
                elems: els_expr
                    .into_iter()
                    .map(|it| {
                        Some(ExprOrSpread {
                            spread: None,
                            expr: Self::make_cb(it).into(),
                        })
                    })
                    .collect(),
            })],
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
        required: Required,
        discriminator: String,
        discriminator_strings: BTreeSet<String>,
        object_vs: Vec<&BTreeMap<String, Optionality<JsonSchema>>>,
    ) -> Expr {
        let mut acc = BTreeMap::new();
        for current_key in discriminator_strings {
            let mut cases = vec![];
            for vs in object_vs.iter() {
                let value = vs.get(&discriminator).unwrap().inner();

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
                        value: Box::new(Self::make_cb(
                            self.decode_expr(value, Required::Known(true)),
                        )),
                    })))
                })
                .collect(),
        });

        return Self::decode_call_extra(
            "decodeAnyOfDiscriminated",
            required,
            vec![
                Expr::Lit(Lit::Str(Str {
                    span: DUMMY_SP,
                    value: discriminator.clone().into(),
                    raw: None,
                })),
                extra_obj,
            ],
        );
    }
    fn maybe_decode_any_of_discriminated(
        &self,
        flat_values: &BTreeSet<JsonSchema>,
        required: Required,
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
                        .map(|it| it.get(&discriminator).unwrap().clone())
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
                            required,
                            discriminator,
                            discriminator_strings,
                            object_vs,
                        ));
                    }
                }
            }
        }
        None
    }

    fn maybe_decode_any_of_consts(
        flat_values: &BTreeSet<JsonSchema>,
        required: Required,
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
            let consts = vec![Expr::Array(ArrayLit {
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
            })];
            return Some(Self::decode_call_extra(
                "decodeAnyOfConsts",
                required,
                consts,
            ));
        }
        None
    }
    fn decode_any_of(&self, vs: &BTreeSet<JsonSchema>, required: Required) -> Expr {
        if vs.is_empty() {
            panic!("empty anyOf is not allowed")
        }

        let flat_values = vs
            .iter()
            .flat_map(|it| self.extract_union(it))
            .collect::<BTreeSet<_>>();

        if let Some(consts) = Self::maybe_decode_any_of_consts(&flat_values, required) {
            return consts;
        }

        if let Some(discriminated) = self.maybe_decode_any_of_discriminated(&flat_values, required)
        {
            return discriminated;
        }

        self.decode_union_or_intersection("decodeAnyOf", required, vs)
    }

    fn decode_expr(&self, schema: &JsonSchema, required: Required) -> Expr {
        match schema {
            JsonSchema::StNever
            | JsonSchema::StUnknown
            | JsonSchema::StNot(_)
            | JsonSchema::StAnyObject => {
                unreachable!("should not create decoders for semantic types")
            }
            JsonSchema::AnyArrayLike => {
                self.decode_expr(&JsonSchema::Array(JsonSchema::Any.into()), required)
            }
            JsonSchema::OpenApiResponseRef(_) => unreachable!("will not decode error schema"),
            JsonSchema::Null => Self::decode_call("decodeNull", required),
            JsonSchema::Boolean => Self::decode_call("decodeBoolean", required),
            JsonSchema::String => Self::decode_call("decodeString", required),
            JsonSchema::Number => Self::decode_call("decodeNumber", required),
            JsonSchema::Any => Self::decode_call("decodeAny", required),
            JsonSchema::StringWithFormat(format) => Self::decode_call_extra(
                "decodeStringWithFormat",
                required,
                vec![Expr::Lit(Lit::Str(Str {
                    span: DUMMY_SP,
                    value: format.to_string().into(),
                    raw: None,
                }))],
            ),
            JsonSchema::Ref(r_name) => Self::decode_ref(r_name, required),
            JsonSchema::Object { vs, rest } => {
                let mut extra = vec![Expr::Object(ObjectLit {
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
                                value: Box::new(Self::make_cb(match value {
                                    Optionality::Optional(schema) => {
                                        self.decode_expr(schema, Required::Known(false))
                                    }
                                    Optionality::Required(schema) => {
                                        self.decode_expr(schema, Required::Known(true))
                                    }
                                })),
                            })))
                        })
                        .collect(),
                })];
                if let Some(rest) = rest {
                    let rest = self.decode_expr(rest, Required::Known(false));
                    extra.push(Self::make_cb(rest));
                }
                Self::decode_call_extra("decodeObject", required, extra)
            }
            JsonSchema::Array(ty) => Self::decode_call_extra(
                "decodeArray",
                required,
                vec![Self::make_cb(self.decode_expr(ty, Required::Known(true)))],
            ),
            JsonSchema::Tuple {
                prefix_items,
                items,
            } => Self::decode_call_extra(
                "decodeTuple",
                required,
                vec![Expr::Object(ObjectLit {
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
                                                expr: Self::make_cb(
                                                    self.decode_expr(it, Required::Known(true)),
                                                )
                                                .into(),
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
                                    Some(v) => {
                                        Self::make_cb(self.decode_expr(v, Required::Known(true)))
                                    }
                                    None => Expr::Lit(Lit::Null(Null { span: DUMMY_SP })),
                                }),
                            })
                            .into(),
                        ),
                    ],
                })],
            ),
            JsonSchema::AnyOf(vs) => self.decode_any_of(vs, required),
            JsonSchema::AllOf(vs) => self.decode_union_or_intersection("decodeAllOf", required, vs),
            JsonSchema::Const(json) => Self::decode_call_extra(
                "decodeConst",
                required,
                vec![json.clone().to_json().to_expr()],
            ),
            JsonSchema::Codec(format) => Self::decode_call_extra(
                "decodeCodec",
                required,
                vec![Expr::Lit(Lit::Str(Str {
                    span: DUMMY_SP,
                    value: format.to_string().into(),
                    raw: None,
                }))],
            ),
        }
    }

    fn fn_decoder_from_schema(&mut self, schema: &JsonSchema) -> Function {
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
                Param {
                    span: DUMMY_SP,
                    decorators: vec![],
                    pat: Pat::Assign(AssignPat {
                        span: DUMMY_SP,
                        left: Pat::Ident(BindingIdent {
                            id: Ident {
                                span: DUMMY_SP,
                                sym: "required".into(),
                                optional: false,
                            },
                            type_ann: None,
                        })
                        .into(),
                        right: Expr::Lit(Lit::Bool(Bool {
                            span: DUMMY_SP,
                            value: true,
                        }))
                        .into(),
                    }),
                },
            ],
            decorators: vec![],
            span: DUMMY_SP,
            body: BlockStmt {
                span: DUMMY_SP,
                stmts: vec![Stmt::Return(ReturnStmt {
                    span: DUMMY_SP,
                    arg: Some(Box::new(self.decode_expr(schema, Required::FromArgs))),
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
pub fn from_schema(schema: &JsonSchema, validators: &Vec<Validator>) -> Function {
    DecoderFnGenerator { validators }.fn_decoder_from_schema(schema)
}
