use std::collections::{BTreeMap, BTreeSet};

use anyhow::{anyhow, Ok, Result};
use serde::{Deserialize, Serialize};
use swc_common::DUMMY_SP;
use swc_ecma_ast::{
    ArrayLit, BindingIdent, Decl, Expr, ExprOrSpread, Ident, KeyValueProp, Lit, ModuleItem,
    NewExpr, Null, ObjectLit, Pat, Prop, PropName, PropOrSpread, Regex, Stmt, Str, VarDecl,
    VarDeclKind, VarDeclarator,
};

use crate::{
    ast::json_schema::{CodecName, JsonSchema, JsonSchemaConst, Optionality, TplLitTypeItem},
    emit::emit_module,
    parser_extractor::BuiltDecoder,
    print::expr::ToExpr,
    ExtractResult, NamedSchema,
};

type HoistedMap = BTreeMap<JsonSchema, (String, Expr)>;

#[derive(Serialize, Deserialize)]
pub struct WritableModulesV2 {
    pub js_built_parsers: String,
}
pub trait ToWritableParser {
    fn to_module_v2(self) -> Result<WritableModulesV2>;
}

fn const_decl(name: &str, init: Expr) -> ModuleItem {
    ModuleItem::Stmt(Stmt::Decl(Decl::Var(
        VarDecl {
            span: DUMMY_SP,
            kind: VarDeclKind::Const,
            declare: false,
            decls: vec![VarDeclarator {
                span: DUMMY_SP,
                name: Pat::Ident(BindingIdent {
                    id: Ident {
                        span: DUMMY_SP,
                        sym: name.into(),
                        optional: false,
                    },
                    type_ann: None,
                }),
                init: Some(Box::new(init)),
                definite: false,
            }],
        }
        .into(),
    )))
}

fn merge_named_schema(parser: &[NamedSchema]) -> Result<Vec<NamedSchema>> {
    let mut acc: Vec<NamedSchema> = vec![];

    for d in parser {
        let found = acc.iter_mut().find(|x| x.name == d.name);
        if let Some(found) = found {
            if found.schema != d.schema {
                // TODO: emit proper diag here?
                // or merge before?
                return Err(anyhow!("Two different types with the same name"));
            }
        } else {
            acc.push(d.clone());
        }
    }
    Ok(acc)
}

fn identifier(name: &str) -> Ident {
    Ident {
        span: DUMMY_SP,
        sym: name.into(),
        optional: false,
    }
}

fn new_class_impl(constructor: &str, args: Vec<Expr>) -> Expr {
    Expr::New(NewExpr {
        span: DUMMY_SP,
        callee: Expr::Ident(identifier(constructor)).into(),
        args: Some(
            args.into_iter()
                .map(|arg| ExprOrSpread {
                    spread: None,
                    expr: Box::new(arg),
                })
                .collect(),
        ),
        type_args: None,
    })
}

fn string_lit(s: &str) -> Expr {
    Expr::Lit(Lit::Str(Str {
        span: DUMMY_SP,
        value: s.into(),
        raw: None,
    }))
}

fn typeof_impl(t: &str) -> Expr {
    new_class_impl(
        "ParserTypeOfImpl",
        vec![
            //
            string_lit(t),
        ],
    )
}

fn ref_impl(to: &str) -> Expr {
    new_class_impl(
        "ParserRefImpl",
        vec![
            //
            string_lit(to),
        ],
    )
}

fn no_args_parser(class_name: &str) -> Expr {
    new_class_impl(
        class_name,
        vec![
            //
        ],
    )
}
fn formats_decoder(constructor: &str, vs: &[String]) -> Expr {
    let vs_arr = Expr::Array(ArrayLit {
        span: DUMMY_SP,
        elems: vs
            .iter()
            .map(|it| {
                Some(ExprOrSpread {
                    spread: None,
                    expr: Expr::Lit(Lit::Str(Str {
                        span: DUMMY_SP,
                        value: it.clone().into(),
                        raw: None,
                    }))
                    .into(),
                })
            })
            .collect(),
    });
    new_class_impl(constructor, vec![vs_arr])
}

fn decode_union_or_intersection(
    constructor: &str,
    vs: &BTreeSet<JsonSchema>,
    named_schemas: &[NamedSchema],
    hoisted: &mut HoistedMap,
) -> Expr {
    let exprs = vs
        .iter()
        .map(|schema| validator_for_schema(schema, named_schemas, hoisted))
        .collect::<Vec<Expr>>();
    let arr = Expr::Array(ArrayLit {
        span: DUMMY_SP,
        elems: exprs
            .into_iter()
            .map(|it| {
                Some(ExprOrSpread {
                    spread: None,
                    expr: it.into(),
                })
            })
            .collect(),
    });
    new_class_impl(constructor, vec![arr])
}

fn extract_union(it: &JsonSchema, named_schemas: &[NamedSchema]) -> Vec<JsonSchema> {
    match it {
        JsonSchema::AnyOf(vs) => vs
            .iter()
            .flat_map(|it| extract_union(it, named_schemas))
            .collect(),
        JsonSchema::Ref(r) => {
            let v = named_schemas
                .iter()
                .find(|it| it.name == *r)
                .expect("everything should be resolved by now");
            extract_union(&v.schema, named_schemas)
        }
        _ => vec![it.clone()],
    }
}

fn decode_any_of_discriminated(
    flat_values: &BTreeSet<JsonSchema>,
    discriminator: String,
    discriminator_strings: BTreeSet<String>,
    object_vs: Vec<&BTreeMap<String, Optionality<JsonSchema>>>,
    named_schemas: &[NamedSchema],
    hoisted: &mut HoistedMap,
) -> Expr {
    let mut acc = BTreeMap::new();
    for current_key in discriminator_strings {
        let mut cases = vec![];
        for vs in object_vs.iter() {
            let value = vs
                .get(&discriminator)
                .expect("we already checked the discriminator exists")
                .inner();

            let all_values = extract_union(value, named_schemas);
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

        let schema_code = validator_for_schema(&schema, named_schemas, hoisted);

        acc.insert(current_key, schema_code);
    }
    let disc = Expr::Lit(Lit::Str(Str {
        span: DUMMY_SP,
        value: discriminator.clone().into(),
        raw: None,
    }));

    let mapping_obj = Expr::Object(ObjectLit {
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
                        value: value.clone().into(),
                    })
                    .into(),
                )
            })
            .collect(),
    });

    let flat_values_schema = flat_values
        .iter()
        .map(|it| validator_for_schema(it, named_schemas, hoisted))
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

    new_class_impl(
        "ParserAnyOfDiscriminatedImpl",
        vec![flat_values_schema_arr, disc.clone(), mapping_obj],
    )
}

fn maybe_decode_any_of_discriminated(
    flat_values: &BTreeSet<JsonSchema>,
    named_schemas: &[NamedSchema],
    hoisted: &mut HoistedMap,
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
                        .flat_map(|it| extract_union(it, named_schemas))
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

                        return Some(decode_any_of_discriminated(
                            flat_values,
                            discriminator,
                            discriminator_strings,
                            object_vs,
                            named_schemas,
                            hoisted,
                        ));
                    }
                }
            }
        }
    }
    None
}

fn maybe_decode_any_of_consts(flat_values: &BTreeSet<JsonSchema>) -> Option<Expr> {
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

        return Some(new_class_impl("ParserAnyOfConstsImpl", vec![consts]));
    }
    None
}

fn should_hoist(schema: &JsonSchema) -> bool {
    // hoist only what has no inner schemas
    match schema {
        JsonSchema::String
        | JsonSchema::Boolean
        | JsonSchema::Number
        | JsonSchema::Function
        | JsonSchema::Ref(_)
        | JsonSchema::Null
        | JsonSchema::Any
        | JsonSchema::StringFormatExtends(_)
        | JsonSchema::NumberFormatExtends(_)
        | JsonSchema::StNever
        | JsonSchema::Const(_)
        | JsonSchema::Codec(_) => true,
        _ => false,
    }
}

fn validator_for_schema(
    schema: &JsonSchema,
    named_schemas: &[NamedSchema],
    hoisted: &mut HoistedMap,
) -> Expr {
    let found = hoisted.get(schema);
    if let Some((var_name, _)) = found {
        return Expr::Ident(identifier(var_name));
    }

    let out = match schema {
        JsonSchema::String => typeof_impl("string"),
        JsonSchema::Boolean => typeof_impl("boolean"),
        JsonSchema::Number => typeof_impl("number"),
        JsonSchema::Function => typeof_impl("function"),
        JsonSchema::Ref(to) => ref_impl(to),
        JsonSchema::Null => no_args_parser("ParserNullImpl"),
        JsonSchema::Any => no_args_parser("ParserAnyImpl"),
        JsonSchema::StNever => no_args_parser("ParserNeverImpl"),
        JsonSchema::Const(json_schema_const) => new_class_impl(
            "ParserConstImpl",
            vec![json_schema_const.clone().to_json().to_expr()],
        ),
        JsonSchema::StringWithFormat(base) => {
            formats_decoder("ParserStringWithFormatImpl", std::slice::from_ref(base))
        }
        JsonSchema::StringFormatExtends(items) => {
            formats_decoder("ParserStringWithFormatImpl", items)
        }
        JsonSchema::NumberWithFormat(base) => {
            formats_decoder("ParserNumberWithFormatImpl", std::slice::from_ref(base))
        }
        JsonSchema::NumberFormatExtends(items) => {
            formats_decoder("ParserNumberWithFormatImpl", items)
        }
        JsonSchema::Codec(codec_name) => match codec_name {
            CodecName::ISO8061 => no_args_parser("ParserDateImpl"),
            CodecName::BigInt => no_args_parser("ParserBigIntImpl"),
        },
        JsonSchema::TplLitType(items) => {
            let mut regex_exp = String::new();

            for item in items {
                regex_exp.push_str(&item.regex_expr());
            }

            new_class_impl(
                "ParserRegexImpl",
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
        JsonSchema::AnyArrayLike => validator_for_schema(
            &JsonSchema::Array(JsonSchema::Any.into()),
            named_schemas,
            hoisted,
        ),
        JsonSchema::StNot(_) => {
            unreachable!("should not create decoders for semantic types")
        }
        JsonSchema::Array(json_schema) => {
            let item_validator = validator_for_schema(json_schema, named_schemas, hoisted);
            new_class_impl("ParserArrayImpl", vec![item_validator])
        }
        JsonSchema::MappedRecord { key, rest } => {
            let key_validator = validator_for_schema(key, named_schemas, hoisted);
            let rest_validator = validator_for_schema(rest, named_schemas, hoisted);
            new_class_impl(
                "ParserMappedRecordImpl",
                vec![key_validator, rest_validator],
            )
        }
        JsonSchema::AllOf(vs) => {
            decode_union_or_intersection("ParserAllOfImpl", vs, named_schemas, hoisted)
        }
        JsonSchema::AnyOf(vs) => {
            if vs.is_empty() {
                panic!("empty anyOf is not allowed")
            }

            let flat_values = vs
                .iter()
                .flat_map(|it: &JsonSchema| extract_union(it, named_schemas))
                .collect::<BTreeSet<_>>();

            if let Some(consts) = maybe_decode_any_of_consts(&flat_values) {
                return consts;
            }

            if let Some(discriminated) =
                maybe_decode_any_of_discriminated(&flat_values, named_schemas, hoisted)
            {
                return discriminated;
            }

            decode_union_or_intersection("ParserAnyOfImpl", vs, named_schemas, hoisted)
        }
        JsonSchema::Tuple {
            prefix_items,
            items,
        } => {
            let prefix_item_validators = prefix_items
                .iter()
                .map(|it| validator_for_schema(it, named_schemas, hoisted))
                .collect::<Vec<Expr>>();
            let prefix_arr = Expr::Array(ArrayLit {
                span: DUMMY_SP,
                elems: prefix_item_validators
                    .into_iter()
                    .map(|it| {
                        Some(ExprOrSpread {
                            spread: None,
                            expr: it.into(),
                        })
                    })
                    .collect(),
            });

            let items = match items {
                Some(item_schema) => validator_for_schema(item_schema, named_schemas, hoisted),
                None => Expr::Lit(Lit::Null(Null { span: DUMMY_SP })),
            };

            new_class_impl("ParserTupleImpl", vec![prefix_arr, items])
        }
        JsonSchema::Object { vs, rest } => {
            let mut mapped = BTreeMap::new();
            for (k, v) in vs.iter() {
                let r = match v {
                    Optionality::Optional(schema) => {
                        let nullable_schema = &JsonSchema::any_of(
                            vec![JsonSchema::Null, schema.clone()].into_iter().collect(),
                        );
                        validator_for_schema(nullable_schema, named_schemas, hoisted)
                    }
                    Optionality::Required(schema) => {
                        validator_for_schema(schema, named_schemas, hoisted)
                    }
                };
                mapped.insert(k.clone(), r);
            }

            let rest = match rest {
                Some(item_schema) => validator_for_schema(item_schema, named_schemas, hoisted),
                None => Expr::Lit(Lit::Null(Null { span: DUMMY_SP })),
            };
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
                                value: value.clone().into(),
                            })
                            .into(),
                        )
                    })
                    .collect(),
            });
            new_class_impl("ParserObjectImpl", vec![obj_validator, rest])
        }
    };
    if should_hoist(schema) {
        let new_id = format!("hoisted_{}", hoisted.len());
        hoisted.insert(schema.clone(), (new_id.clone(), out.clone()));
        Expr::Ident(identifier(&new_id))
    } else {
        out
    }
}

fn build_parsers_input(
    decs: &[BuiltDecoder],
    named_schemas: &[NamedSchema],
    hoisted: &mut HoistedMap,
) -> Expr {
    let mut validator_exprs: Vec<(String, Expr)> = vec![];
    for decoder in decs {
        let validator = validator_for_schema(&decoder.schema, named_schemas, hoisted);
        validator_exprs.push((decoder.exported_name.clone(), validator));
    }

    Expr::Object(ObjectLit {
        span: DUMMY_SP,
        props: validator_exprs
            .into_iter()
            .map(|(key, value)| {
                PropOrSpread::Prop(
                    Prop::KeyValue(KeyValueProp {
                        key: PropName::Str(Str {
                            span: DUMMY_SP,
                            value: key.into(),
                            raw: None,
                        }),
                        value: value.into(),
                    })
                    .into(),
                )
            })
            .collect(),
    })
}

fn build_named_parsers(named_schemas: &[NamedSchema], hoisted: &mut HoistedMap) -> Expr {
    let mut validator_exprs: Vec<(String, Expr)> = vec![];
    for named_schema in named_schemas {
        let validator = validator_for_schema(&named_schema.schema, named_schemas, hoisted);
        validator_exprs.push((named_schema.name.clone(), validator));
    }

    Expr::Object(ObjectLit {
        span: DUMMY_SP,
        props: validator_exprs
            .into_iter()
            .map(|(key, value)| {
                PropOrSpread::Prop(
                    Prop::KeyValue(KeyValueProp {
                        key: PropName::Str(Str {
                            span: DUMMY_SP,
                            value: key.into(),
                            raw: None,
                        }),
                        value: value.into(),
                    })
                    .into(),
                )
            })
            .collect(),
    })
}

impl ToWritableParser for ExtractResult {
    fn to_module_v2(self) -> Result<WritableModulesV2> {
        let mut hoisted: BTreeMap<JsonSchema, (String, Expr)> = BTreeMap::new();

        let built_parsers = self.parser.built_decoders.unwrap_or_default();
        let named_schemas = merge_named_schema(&self.parser.validators)?;

        let build_parsers_input = const_decl(
            "buildValidatorsInput",
            build_parsers_input(&built_parsers, &named_schemas, &mut hoisted),
        );

        let build_named_parsers_input = const_decl(
            "namedParsers",
            build_named_parsers(&named_schemas, &mut hoisted),
        );

        let mut sorted_hoisted_values = hoisted.into_values().collect::<Vec<_>>();
        sorted_hoisted_values.sort_by_key(|it| it.0.clone());

        let hoisted_decls: Vec<ModuleItem> = sorted_hoisted_values
            .into_iter()
            .map(|(id, expr)| const_decl(&id, expr))
            .collect();

        let js_built_parsers = emit_module(
            hoisted_decls
                .into_iter()
                .chain(vec![
                    //
                    build_named_parsers_input,
                    build_parsers_input,
                ])
                .collect(),
            "\n",
        )?;

        Ok(WritableModulesV2 { js_built_parsers })
    }
}
