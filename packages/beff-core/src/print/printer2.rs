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
    ast::{
        js::Js,
        json::N,
        json_schema::{CodecName, JsonSchema, JsonSchemaConst, Optionality, TplLitTypeItem},
    },
    emit::emit_module,
    parser_extractor::BuiltDecoder,
    print::expr::ToExpr,
    ExtractResult, NamedSchema,
};

type SeenCounter = BTreeMap<JsonSchema, i32>;
struct HoistedMap {
    direct: BTreeMap<JsonSchema, (String, Expr)>,
    indirect: BTreeMap<JsonSchema, (i32, Expr)>,
    seen: SeenCounter,
}

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

/// Any type with the same name must be identical
fn validate_type_uniqueness(parser: &[NamedSchema]) -> Result<Vec<NamedSchema>> {
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

fn new_runtype_class(constructor: &str, args: Vec<Expr>) -> Expr {
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

fn typeof_runtype(t: &str) -> Expr {
    new_runtype_class(
        "TypeofRuntype",
        vec![
            //
            string_lit(t),
        ],
    )
}

fn ref_runtype(to: &str) -> Expr {
    new_runtype_class(
        "RefRuntype",
        vec![
            //
            string_lit(to),
        ],
    )
}

fn no_args_runtype(class_name: &str) -> Expr {
    new_runtype_class(
        class_name,
        vec![
            //
        ],
    )
}
fn formats_runtype(constructor: &str, vs: &[String]) -> Expr {
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
    new_runtype_class(constructor, vec![vs_arr])
}

fn runtype_union_or_intersection(
    constructor: &str,
    vs: &BTreeSet<JsonSchema>,
    named_schemas: &[NamedSchema],
    hoisted: &mut HoistedMap,
) -> Expr {
    let exprs = vs
        .iter()
        .map(|schema| schema_to_runtype(schema, named_schemas, hoisted))
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
    new_runtype_class(constructor, vec![arr])
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
        JsonSchema::StNever => vec![],
        _ => vec![it.clone()],
    }
}

fn runtype_any_of_discriminated(
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

        let schema_code = schema_to_runtype(&schema, named_schemas, hoisted);

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
        .map(|it| schema_to_runtype(it, named_schemas, hoisted))
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

    new_runtype_class(
        "AnyOfDiscriminatedRuntype",
        vec![flat_values_schema_arr, disc.clone(), mapping_obj],
    )
}

fn maybe_runtype_any_of_discriminated(
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

                        return Some(runtype_any_of_discriminated(
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

fn maybe_runtype_any_of_consts(flat_values: &BTreeSet<JsonSchema>) -> Option<Expr> {
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

        return Some(new_runtype_class("AnyOfConstsRuntype", vec![consts]));
    }
    None
}

fn should_hoist_direct(schema: &JsonSchema) -> bool {
    // hoist only what has no inner schemas
    matches!(
        schema,
        JsonSchema::StringWithFormat(_)
            | JsonSchema::StringFormatExtends(_)
            | JsonSchema::NumberWithFormat(_)
            | JsonSchema::NumberFormatExtends(_)
            | JsonSchema::AnyArrayLike
            | JsonSchema::Any
            | JsonSchema::Number
            | JsonSchema::String
            | JsonSchema::Boolean
            | JsonSchema::StNever
            | JsonSchema::Function
            | JsonSchema::Codec(_)
            | JsonSchema::TplLitType(_)
            | JsonSchema::Ref(_)
            | JsonSchema::Const(_)
            | JsonSchema::Null
    )
}

fn i32_literal(id: i32) -> Expr {
    Js::Number(N::parse_int(id as i64)).to_expr()
}
fn hoisted_indirect_runtype(id: i32) -> Expr {
    new_runtype_class("HoistedRuntype", vec![i32_literal(id)])
}
fn schema_to_runtype(
    schema: &JsonSchema,
    named_schemas: &[NamedSchema],
    hoisted: &mut HoistedMap,
) -> Expr {
    if should_hoist_direct(schema) {
        let found_direct = hoisted.direct.get(schema);
        if let Some((var_name, _)) = found_direct {
            return Expr::Ident(identifier(var_name));
        }
    } else {
        let found_indirect = hoisted.indirect.get(schema);
        if let Some((var_name, _)) = found_indirect {
            return hoisted_indirect_runtype(*var_name);
        }
    }

    let out = match schema {
        JsonSchema::String => typeof_runtype("string"),
        JsonSchema::Boolean => typeof_runtype("boolean"),
        JsonSchema::Number => typeof_runtype("number"),
        JsonSchema::Function => typeof_runtype("function"),
        JsonSchema::Ref(to) => ref_runtype(to),
        JsonSchema::Null => no_args_runtype("NullRuntype"),
        JsonSchema::Any => no_args_runtype("AnyRuntype"),
        JsonSchema::StNever => no_args_runtype("NeverRuntype"),
        JsonSchema::Const(json_schema_const) => new_runtype_class(
            "ConstRuntype",
            vec![json_schema_const.clone().to_json().to_expr()],
        ),
        JsonSchema::StringWithFormat(base) => {
            formats_runtype("StringWithFormatRuntype", std::slice::from_ref(base))
        }
        JsonSchema::StringFormatExtends(items) => formats_runtype("StringWithFormatRuntype", items),
        JsonSchema::NumberWithFormat(base) => {
            formats_runtype("NumberWithFormatRuntype", std::slice::from_ref(base))
        }
        JsonSchema::NumberFormatExtends(items) => formats_runtype("NumberWithFormatRuntype", items),
        JsonSchema::Codec(codec_name) => match codec_name {
            CodecName::ISO8061 => no_args_runtype("DateRuntype"),
            CodecName::BigInt => no_args_runtype("BigIntRuntype"),
        },
        JsonSchema::TplLitType(items) => {
            let mut regex_exp = String::new();

            for item in items {
                regex_exp.push_str(&item.regex_expr());
            }

            new_runtype_class(
                "RegexRuntype",
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
        JsonSchema::AnyArrayLike => schema_to_runtype(
            &JsonSchema::Array(JsonSchema::Any.into()),
            named_schemas,
            hoisted,
        ),
        JsonSchema::StNot(_) => {
            unreachable!("should not create decoders for semantic types")
        }
        JsonSchema::Array(json_schema) => {
            let item_validator = schema_to_runtype(json_schema, named_schemas, hoisted);
            new_runtype_class("ArrayRuntype", vec![item_validator])
        }
        JsonSchema::MappedRecord { key, rest } => {
            let key_validator = schema_to_runtype(key, named_schemas, hoisted);
            let rest_validator = schema_to_runtype(rest, named_schemas, hoisted);
            new_runtype_class("MappedRecordRuntype", vec![key_validator, rest_validator])
        }
        JsonSchema::AllOf(vs) => {
            runtype_union_or_intersection("AllOfRuntype", vs, named_schemas, hoisted)
        }
        JsonSchema::AnyOf(vs) => {
            if vs.is_empty() {
                panic!("empty anyOf is not allowed")
            }

            let flat_values = vs
                .iter()
                .flat_map(|it: &JsonSchema| extract_union(it, named_schemas))
                .collect::<BTreeSet<_>>();

            if let Some(consts) = maybe_runtype_any_of_consts(&flat_values) {
                consts
            } else if let Some(discriminated) =
                maybe_runtype_any_of_discriminated(&flat_values, named_schemas, hoisted)
            {
                discriminated
            } else {
                runtype_union_or_intersection("AnyOfRuntype", vs, named_schemas, hoisted)
            }
        }
        JsonSchema::Tuple {
            prefix_items,
            items,
        } => {
            let prefix_item_validators = prefix_items
                .iter()
                .map(|it| schema_to_runtype(it, named_schemas, hoisted))
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
                Some(item_schema) => schema_to_runtype(item_schema, named_schemas, hoisted),
                None => Expr::Lit(Lit::Null(Null { span: DUMMY_SP })),
            };

            new_runtype_class("TupleRuntype", vec![prefix_arr, items])
        }
        JsonSchema::Object { vs, rest } => {
            let mut mapped = BTreeMap::new();
            for (k, v) in vs.iter() {
                let r = match v {
                    Optionality::Optional(schema) => {
                        let nullable_schema = &JsonSchema::any_of(
                            vec![JsonSchema::Null, schema.clone()].into_iter().collect(),
                        );
                        schema_to_runtype(nullable_schema, named_schemas, hoisted)
                    }
                    Optionality::Required(schema) => {
                        schema_to_runtype(schema, named_schemas, hoisted)
                    }
                };
                mapped.insert(k.clone(), r);
            }

            let rest = match rest {
                Some(item_schema) => schema_to_runtype(item_schema, named_schemas, hoisted),
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
            new_runtype_class("ObjectRuntype", vec![obj_validator, rest])
        }
    };

    let seen_counter = hoisted.seen.get(schema).cloned().unwrap_or(0);
    if seen_counter <= 1 {
        out
    } else {
        if should_hoist_direct(schema) {
            let new_id = format!("direct_hoist_{}", hoisted.direct.len());
            hoisted
                .direct
                .insert(schema.clone(), (new_id.clone(), out.clone()));
            Expr::Ident(identifier(&new_id))
        } else {
            let new_id = hoisted.indirect.len() as i32;
            hoisted
                .indirect
                .insert(schema.clone(), (new_id, out.clone()));
            hoisted_indirect_runtype(new_id)
        }
    }
}

fn build_parsers_input(
    decs: &[BuiltDecoder],
    named_schemas: &[NamedSchema],
    hoisted: &mut HoistedMap,
) -> Expr {
    let mut validator_exprs: Vec<(String, Expr)> = vec![];
    for decoder in decs {
        let validator = schema_to_runtype(&decoder.schema, named_schemas, hoisted);
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

fn named_runtypes(named_schemas: &[NamedSchema], hoisted: &mut HoistedMap) -> Expr {
    let mut validator_exprs: Vec<(String, Expr)> = vec![];
    for named_schema in named_schemas {
        let validator = schema_to_runtype(&named_schema.schema, named_schemas, hoisted);
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

fn calculate_schema_seen(schema: &JsonSchema, seen: &mut SeenCounter) {
    let count = seen.entry(schema.clone()).or_insert(0);
    *count += 1;

    match schema {
        JsonSchema::StringWithFormat(_)
        | JsonSchema::StringFormatExtends(_)
        | JsonSchema::NumberWithFormat(_)
        | JsonSchema::NumberFormatExtends(_)
        | JsonSchema::AnyArrayLike
        | JsonSchema::Any
        | JsonSchema::Number
        | JsonSchema::String
        | JsonSchema::Boolean
        | JsonSchema::StNever
        | JsonSchema::Function
        | JsonSchema::Codec(_)
        | JsonSchema::TplLitType(_)
        | JsonSchema::Ref(_)
        | JsonSchema::Const(_)
        | JsonSchema::Null => {}
        JsonSchema::Object { vs, rest } => {
            for v in vs.values() {
                match v {
                    Optionality::Optional(v) => calculate_schema_seen(v, seen),
                    Optionality::Required(v) => calculate_schema_seen(v, seen),
                }
            }
            if let Some(rest_schema) = rest {
                calculate_schema_seen(rest_schema, seen);
            }
        }
        JsonSchema::MappedRecord { key, rest } => {
            calculate_schema_seen(key, seen);
            calculate_schema_seen(rest, seen);
        }
        JsonSchema::Array(json_schema) => {
            calculate_schema_seen(json_schema, seen);
        }
        JsonSchema::Tuple {
            prefix_items,
            items,
        } => {
            for item in prefix_items {
                calculate_schema_seen(item, seen);
            }
            if let Some(items_schema) = items {
                calculate_schema_seen(items_schema, seen);
            }
        }
        JsonSchema::AnyOf(btree_set) | JsonSchema::AllOf(btree_set) => {
            for v in btree_set {
                calculate_schema_seen(v, seen);
            }
        }
        JsonSchema::StNot(json_schema) => {
            calculate_schema_seen(json_schema, seen);
        }
    }
}

fn calculate_named_schemas_seen(named_schemas: &[NamedSchema], seen: &mut SeenCounter) {
    for named_schema in named_schemas {
        calculate_schema_seen(&named_schema.schema, seen);
    }
}

impl ToWritableParser for ExtractResult {
    fn to_module_v2(self) -> Result<WritableModulesV2> {
        let mut seen: SeenCounter = BTreeMap::new();

        let built_parsers = self.parser.built_decoders.unwrap_or_default();
        let named_schemas = validate_type_uniqueness(&self.parser.validators)?;

        calculate_named_schemas_seen(&named_schemas, &mut seen);

        let mut hoisted = HoistedMap {
            direct: BTreeMap::new(),
            indirect: BTreeMap::new(),
            seen,
        };

        let build_parsers_input: ModuleItem = const_decl(
            "buildParsersInput",
            build_parsers_input(&built_parsers, &named_schemas, &mut hoisted),
        );

        let build_named_parsers_input = const_decl(
            "namedRuntypes",
            named_runtypes(&named_schemas, &mut hoisted),
        );

        let mut sorted_indirect_hoisted_values = hoisted.indirect.into_values().collect::<Vec<_>>();
        sorted_indirect_hoisted_values.sort_by_key(|it| it.0);

        let hoisted_indirect_arr = const_decl(
            "hoistedIndirect",
            Expr::Array(ArrayLit {
                span: DUMMY_SP,
                elems: sorted_indirect_hoisted_values
                    .into_iter()
                    .map(|(_id, expr)| {
                        Some(ExprOrSpread {
                            spread: None,
                            expr: expr.into(),
                        })
                    })
                    .collect(),
            }),
        );

        let mut sorted_direct_hoisted_values = hoisted.direct.into_values().collect::<Vec<_>>();
        sorted_direct_hoisted_values.sort_by_key(|it| it.0.clone());

        let hoisted_direct_decls: Vec<ModuleItem> = sorted_direct_hoisted_values
            .into_iter()
            .map(|(id, expr)| const_decl(&id, expr))
            .collect();

        let js_built_parsers = emit_module(
            hoisted_direct_decls
                .into_iter()
                .chain(vec![
                    //
                    hoisted_indirect_arr,
                    build_named_parsers_input,
                    build_parsers_input,
                ])
                .collect(),
            "\n",
        )?;

        Ok(WritableModulesV2 { js_built_parsers })
    }
}
