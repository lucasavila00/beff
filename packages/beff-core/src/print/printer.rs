use std::collections::{BTreeMap, BTreeSet};

use anyhow::{Ok, Result, anyhow};
use swc_common::DUMMY_SP;
use swc_common::SourceMap;
use swc_common::SyntaxContext;
use swc_common::{FilePathMapping, sync::Lrc};
use swc_ecma_ast::Module;
use swc_ecma_ast::{
    ArrayLit, BindingIdent, Decl, Expr, ExprOrSpread, Ident, KeyValueProp, Lit, ModuleItem,
    NewExpr, Null, ObjectLit, Pat, Prop, PropName, PropOrSpread, Regex, Stmt, Str, VarDecl,
    VarDeclKind, VarDeclarator,
};
use swc_ecma_codegen::Config;
use swc_ecma_codegen::{Emitter, text_writer::JsWriter};

use crate::RuntypeUUID;
use crate::ast::json::Json;
use crate::ast::runtype::CustomFormat;
use crate::ast::runtype::DebugPrintCtx;
use crate::ast::runtype::TplLitTypeItem;
use crate::parser_extractor::ParserExtractResult;
use crate::{
    BeffUserSettings,
    NamedSchema,
    ast::runtype::{Optionality, Runtype},
    parser_extractor::BuiltDecoder,
};

fn emit_module_items(body: Vec<ModuleItem>) -> Result<String> {
    let ast = Module {
        span: DUMMY_SP,
        body,
        shebang: None,
    };
    let cm = Lrc::new(SourceMap::new(FilePathMapping::empty()));

    let code = {
        let mut buf = vec![];

        {
            let mut emitter = Emitter {
                cfg: Config::default(),
                cm: cm.clone(),
                comments: None,
                wr: JsWriter::new(cm, "\n", &mut buf, None),
            };

            emitter.emit_module(&ast)?;
        }

        String::from_utf8_lossy(&buf).to_string()
    };

    Ok(code)
}

struct PrintContext {
    settings: BeffUserSettings,
    hoisted: BTreeMap<Runtype, (usize, Expr)>,
    all_names: Vec<RuntypeUUID>,
    type_with_args_names: BTreeMap<RuntypeUUID, String>,
    inlined: BTreeSet<RuntypeUUID>,
}

impl PrintContext {
    pub fn print_rt_name(&mut self, name: &RuntypeUUID) -> String {
        let mut ctx = DebugPrintCtx {
            all_names: &self.all_names.iter().collect::<Vec<_>>(),
            type_with_args_names: &mut self.type_with_args_names,
        };
        name.print_name_for_js_codegen(&mut ctx)
    }
}

fn const_decl(name: &str, init: Expr) -> ModuleItem {
    ModuleItem::Stmt(Stmt::Decl(Decl::Var(
        VarDecl {
            span: DUMMY_SP,
            ctxt: SyntaxContext::empty(),
            kind: VarDeclKind::Const,
            declare: false,
            decls: vec![VarDeclarator {
                span: DUMMY_SP,
                name: Pat::Ident(BindingIdent {
                    id: Ident {
                        span: DUMMY_SP,
                        sym: name.into(),
                        optional: false,
                        ctxt: SyntaxContext::empty(),
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
        ctxt: SyntaxContext::empty(),
    }
}

fn new_runtype_class(constructor: &str, args: Vec<Expr>) -> Expr {
    Expr::New(NewExpr {
        ctxt: SyntaxContext::empty(),
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

fn ref_runtype(to: &RuntypeUUID, ctx: &mut PrintContext) -> Expr {
    new_runtype_class(
        "RefRuntype",
        vec![
            //
            string_lit(&ctx.print_rt_name(to)),
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

fn string_format_error_message(
    settings: &BeffUserSettings,
    first: &String,
    rest: &[String],
) -> Option<String> {
    rest.iter()
        .rev()
        .chain(std::iter::once(first))
        .find_map(|format| settings.string_format_error_message(format).map(str::to_string))
}

fn number_format_error_message(
    settings: &BeffUserSettings,
    first: &String,
    rest: &[String],
) -> Option<String> {
    rest.iter()
        .rev()
        .chain(std::iter::once(first))
        .find_map(|format| settings.number_format_error_message(format).map(str::to_string))
}

fn formats_array(first: &String, rest: &[String]) -> Expr {
    Expr::Array(ArrayLit {
        span: DUMMY_SP,
        elems: std::iter::once(first)
            .chain(rest.iter())
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
    })
}

fn formats_runtype(constructor: &str, first: &String, rest: &[String]) -> Expr {
    let vs_arr = formats_array(first, rest);
    new_runtype_class(constructor, vec![vs_arr])
}

fn runtype_union_or_intersection(
    constructor: &str,
    vs: &BTreeSet<Runtype>,
    named_schemas: &[NamedSchema],
    ctx: &mut PrintContext,
) -> Expr {
    let mut sorted_vs = vs.iter().cloned().collect::<Vec<Runtype>>();
    let dbg_ctx = DebugPrintCtx {
        all_names: &ctx.all_names.iter().collect::<Vec<_>>(),
        type_with_args_names: &mut ctx.type_with_args_names,
    };
    sorted_vs.sort_by_key(|it| it.debug_print(&dbg_ctx));

    let exprs = vs
        .iter()
        .map(|schema| print_runtype(schema, named_schemas, ctx))
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

fn extract_union(it: &Runtype, named_schemas: &[NamedSchema]) -> Vec<Runtype> {
    match it {
        Runtype::AnyOf(vs) => vs
            .iter()
            .flat_map(|it| extract_union(it, named_schemas))
            .collect(),
        Runtype::Ref(r) => {
            let v = named_schemas
                .iter()
                .find(|it| it.name == *r)
                .expect("everything should be resolved by now");
            extract_union(&v.schema, named_schemas)
        }
        Runtype::Never => vec![],
        _ => vec![it.clone()],
    }
}

fn maybe_named_ref(
    schema: &Runtype,
    named_schemas: &[NamedSchema],
    ctx: &PrintContext,
) -> Option<Runtype> {
    named_schemas
        .iter()
        .find(|named_schema| {
            !ctx.inlined.contains(&named_schema.name) && named_schema.schema == *schema
        })
        .map(|named_schema| Runtype::Ref(named_schema.name.clone()))
}

fn runtype_any_of_discriminated(
    flat_values_set: &BTreeSet<Runtype>,
    discriminator: String,
    discriminator_strings_set: BTreeSet<String>,
    object_vs: Vec<BTreeMap<String, Optionality<Runtype>>>,
    named_schemas: &[NamedSchema],
    ctx: &mut PrintContext,
) -> Expr {
    let mut flat_values = flat_values_set.iter().cloned().collect::<Vec<Runtype>>();
    let dbg_ctx = DebugPrintCtx {
        all_names: &ctx.all_names.iter().collect::<Vec<_>>(),
        type_with_args_names: &mut ctx.type_with_args_names,
    };
    flat_values.sort_by_key(|it| it.debug_print(&dbg_ctx));

    let mut discriminator_strings = discriminator_strings_set
        .into_iter()
        .collect::<Vec<String>>();
    discriminator_strings.sort();

    let disc = Expr::Lit(Lit::Str(Str {
        span: DUMMY_SP,
        value: discriminator.clone().into(),
        raw: None,
    }));

    let schema_mapping_obj = Expr::Object(ObjectLit {
        span: DUMMY_SP,
        props: discriminator_strings
            .iter()
            .map(|current_key| {
                let cases = object_vs
                    .iter()
                    .filter(|vs| {
                        let value = vs
                            .get(&discriminator)
                            .expect("we already checked the discriminator exists")
                            .inner();

                        extract_union(value, named_schemas)
                            .into_iter()
                            .filter_map(|it| it.extract_single_string_const())
                            .any(|it| it == *current_key)
                    })
                    .map(|vs| {
                        Runtype::object(vs.iter().map(|it| (it.0.clone(), it.1.clone())).collect())
                    })
                    .collect::<Vec<_>>();
                let schema = if cases.len() == 1 {
                    maybe_named_ref(&cases[0], named_schemas, ctx)
                        .unwrap_or_else(|| cases[0].clone())
                } else {
                    Runtype::any_of(cases)
                };

                PropOrSpread::Prop(
                    Prop::KeyValue(KeyValueProp {
                        key: PropName::Str(Str {
                            span: DUMMY_SP,
                            value: current_key.clone().into(),
                            raw: None,
                        }),
                        value: print_runtype(&schema, named_schemas, ctx).into(),
                    })
                    .into(),
                )
            })
            .collect(),
    });

    let mapping_obj = Expr::Object(ObjectLit {
        span: DUMMY_SP,
        props: discriminator_strings
            .iter()
            .map(|current_key| {
                let cases = object_vs
                    .iter()
                    .filter(|vs| {
                        let value = vs
                            .get(&discriminator)
                            .expect("we already checked the discriminator exists")
                            .inner();

                        extract_union(value, named_schemas)
                            .into_iter()
                            .filter_map(|it| it.extract_single_string_const())
                            .any(|it| it == *current_key)
                    })
                    .map(|vs| {
                        Runtype::object(vs.iter().map(|it| (it.0.clone(), it.1.clone())).collect())
                    })
                    .collect::<Vec<_>>();
                let schema = if cases.len() == 1 {
                    maybe_named_ref(&cases[0], named_schemas, ctx)
                        .unwrap_or_else(|| cases[0].clone())
                } else {
                    Runtype::any_of(cases)
                };

                PropOrSpread::Prop(
                    Prop::KeyValue(KeyValueProp {
                        key: PropName::Str(Str {
                            span: DUMMY_SP,
                            value: current_key.clone().into(),
                            raw: None,
                        }),
                        value: print_runtype(&schema, named_schemas, ctx).into(),
                    })
                    .into(),
                )
            })
            .collect(),
    });

    let flat_values_schema = flat_values
        .iter()
        .map(|it| {
            let schema = maybe_named_ref(it, named_schemas, ctx).unwrap_or_else(|| it.clone());
            print_runtype(&schema, named_schemas, ctx)
        })
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
        vec![
            flat_values_schema_arr,
            disc.clone(),
            mapping_obj,
            schema_mapping_obj,
        ],
    )
}

fn maybe_runtype_any_of_discriminated(
    flat_values: &BTreeSet<Runtype>,
    named_schemas: &[NamedSchema],
    ctx: &mut PrintContext,
) -> Option<Expr> {
    let object_vs = flat_values
        .iter()
        .map(|it| extract_object_shape(it, named_schemas))
        .collect::<Option<Vec<_>>>();

    if let Some(object_vs) = object_vs {
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
                        .all(|it| it.extract_single_string_const().is_some());

                    if all_string_consts {
                        let discriminator_strings: BTreeSet<String> = flat_discriminator_values
                            .iter()
                            .map(|it| {
                                it.extract_single_string_const()
                                    .expect("we already checked")
                            })
                            .collect::<BTreeSet<_>>();

                        return Some(runtype_any_of_discriminated(
                            flat_values,
                            discriminator,
                            discriminator_strings,
                            object_vs,
                            named_schemas,
                            ctx,
                        ));
                    }
                }
            }
        }
    }
    None
}

fn extract_object_shape(
    schema: &Runtype,
    named_schemas: &[NamedSchema],
) -> Option<BTreeMap<String, Optionality<Runtype>>> {
    match schema {
        Runtype::Object {
            vs,
            indexed_properties,
        } if indexed_properties.is_none() => Some(vs.clone()),
        Runtype::Ref(r) => named_schemas
            .iter()
            .find(|it| it.name == *r)
            .and_then(|it| extract_object_shape(&it.schema, named_schemas)),
        Runtype::AllOf(vs) => {
            let mut acc = BTreeMap::new();

            for schema in vs {
                let extracted = extract_object_shape(schema, named_schemas)?;

                for (key, value) in &extracted {
                    if let Some(existing) = acc.get(key)
                        && existing != value
                    {
                        let merged = merge_object_property_shapes(existing, value, named_schemas)?;
                        acc.insert(key.clone(), merged);
                    }
                }

                for (key, value) in extracted {
                    acc.entry(key).or_insert(value);
                }
            }

            Some(acc)
        }
        _ => None,
    }
}

fn merge_object_property_shapes(
    left: &Optionality<Runtype>,
    right: &Optionality<Runtype>,
    named_schemas: &[NamedSchema],
) -> Option<Optionality<Runtype>> {
    if left == right {
        return Some(left.clone());
    }

    match (left, right) {
        (Optionality::Required(left), Optionality::Required(right)) => {
            narrower_schema(left, right, named_schemas).map(Optionality::Required)
        }
        _ => None,
    }
}

fn narrower_schema(
    left: &Runtype,
    right: &Runtype,
    named_schemas: &[NamedSchema],
) -> Option<Runtype> {
    let left_values = string_const_union(left, named_schemas)?;
    let right_values = string_const_union(right, named_schemas)?;

    if left_values.is_subset(&right_values) {
        Some(left.clone())
    } else if right_values.is_subset(&left_values) {
        Some(right.clone())
    } else {
        None
    }
}

fn string_const_union(schema: &Runtype, named_schemas: &[NamedSchema]) -> Option<BTreeSet<String>> {
    extract_union(schema, named_schemas)
        .into_iter()
        .map(|it| it.extract_single_string_const())
        .collect()
}

fn maybe_runtype_any_of_consts(
    flat_values_set: &BTreeSet<Runtype>,
    ctx: &mut PrintContext,
) -> Option<Expr> {
    let mut flat_values = flat_values_set.iter().cloned().collect::<Vec<Runtype>>();
    let dbg_ctx = DebugPrintCtx {
        all_names: &ctx.all_names.iter().collect::<Vec<_>>(),
        type_with_args_names: &mut ctx.type_with_args_names,
    };

    flat_values.sort_by_key(|it| it.debug_print(&dbg_ctx));

    let all_consts = flat_values
        .iter()
        .all(|it| it.extract_single_string_const().is_some() || matches!(it, Runtype::Const(_)));
    if all_consts {
        let consts: Vec<Expr> = flat_values
            .iter()
            .map(|it| match it.extract_single_string_const() {
                Some(s) => Json::String(s).to_expr(),
                None => match it {
                    Runtype::Const(c) => c.clone().to_json().to_expr(),
                    _ => unreachable!(),
                },
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

fn hoist_name(name: usize) -> String {
    format!("direct_hoist_{}", name)
}
fn hoist_identifier(name: usize) -> Expr {
    Expr::Ident(identifier(&hoist_name(name)))
}

fn optionality_wrapper(inner: Expr) -> Expr {
    new_runtype_class("OptionalFieldRuntype", vec![inner])
}

fn print_runtype(schema: &Runtype, named_schemas: &[NamedSchema], ctx: &mut PrintContext) -> Expr {
    let found_direct = ctx.hoisted.get(schema);
    if let Some((var_name, _)) = found_direct {
        return hoist_identifier(*var_name);
    }

    let out = match schema {
        Runtype::String => typeof_runtype("string"),
        Runtype::Boolean => typeof_runtype("boolean"),
        Runtype::Number => typeof_runtype("number"),
        Runtype::Function => typeof_runtype("function"),
        Runtype::Ref(to) => ref_runtype(to, ctx),
        Runtype::Any => no_args_runtype("AnyRuntype"),
        Runtype::Never => no_args_runtype("NeverRuntype"),
        Runtype::Const(c) => new_runtype_class("ConstRuntype", vec![c.clone().to_json().to_expr()]),
        Runtype::StringWithFormat(CustomFormat(first, rest)) => match string_format_error_message(
            &ctx.settings,
            first,
            rest,
        ) {
            Some(error_message) => new_runtype_class(
                "StringWithFormatRuntype",
                vec![formats_array(first, rest), string_lit(&error_message)],
            ),
            None => formats_runtype("StringWithFormatRuntype", first, rest),
        },
        Runtype::NumberWithFormat(CustomFormat(first, rest)) => {
            match number_format_error_message(&ctx.settings, first, rest) {
                Some(error_message) => new_runtype_class(
                    "NumberWithFormatRuntype",
                    vec![formats_array(first, rest), string_lit(&error_message)],
                ),
                None => formats_runtype("NumberWithFormatRuntype", first, rest),
            }
        }
        Runtype::Date => no_args_runtype("DateRuntype"),
        Runtype::BigInt => no_args_runtype("BigIntRuntype"),
        Runtype::TypedArray(kind) => new_runtype_class(
            "TypedArrayRuntype",
            vec![Json::String(kind.js_name().to_string()).to_expr()],
        ),
        Runtype::TplLitType(t) => match t.0.as_slice() {
            [TplLitTypeItem::StringConst(c)] => {
                new_runtype_class("ConstRuntype", vec![Json::String(c.clone()).to_expr()])
            }
            _ => new_runtype_class(
                "RegexRuntype",
                vec![
                    Expr::Lit(Lit::Regex(Regex {
                        span: DUMMY_SP,
                        exp: t.regex_expr().into(),
                        flags: "".into(),
                    })),
                    Expr::Lit(Lit::Str(Str {
                        span: DUMMY_SP,
                        value: t.describe().into(),
                        raw: None,
                    })),
                ],
            ),
        },
        Runtype::AnyArrayLike => {
            print_runtype(&Runtype::Array(Runtype::Any.into()), named_schemas, ctx)
        }
        Runtype::StNot(_) => {
            unreachable!("should not create decoders for semantic types")
        }
        Runtype::Array(json_schema) => {
            let item_validator = print_runtype(json_schema, named_schemas, ctx);
            new_runtype_class("ArrayRuntype", vec![item_validator])
        }
        Runtype::Map(k, v) => {
            let key_validator = print_runtype(k, named_schemas, ctx);
            let value_validator = print_runtype(v, named_schemas, ctx);
            new_runtype_class("MapRuntype", vec![key_validator, value_validator])
        }
        Runtype::Set(v) => {
            let item_validator = print_runtype(v, named_schemas, ctx);
            new_runtype_class("SetRuntype", vec![item_validator])
        }
        Runtype::AllOf(vs) => runtype_union_or_intersection("AllOfRuntype", vs, named_schemas, ctx),
        Runtype::AnyOf(vs) => {
            if vs.is_empty() {
                panic!("empty anyOf is not allowed")
            }

            let flat_values = vs
                .iter()
                .flat_map(|it: &Runtype| extract_union(it, named_schemas))
                .collect::<BTreeSet<_>>();

            if let Some(consts) = maybe_runtype_any_of_consts(&flat_values, ctx) {
                consts
            } else if let Some(discriminated) =
                maybe_runtype_any_of_discriminated(&flat_values, named_schemas, ctx)
            {
                discriminated
            } else {
                runtype_union_or_intersection("AnyOfRuntype", vs, named_schemas, ctx)
            }
        }
        Runtype::Tuple {
            prefix_items,
            items,
        } => {
            let prefix_item_validators = prefix_items
                .iter()
                .map(|it| print_runtype(it, named_schemas, ctx))
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
                Some(item_schema) => print_runtype(item_schema, named_schemas, ctx),
                None => Expr::Lit(Lit::Null(Null { span: DUMMY_SP })),
            };

            new_runtype_class("TupleRuntype", vec![prefix_arr, items])
        }
        Runtype::Object {
            vs,
            indexed_properties,
        } => {
            let mut mapped = BTreeMap::new();
            for (k, v) in vs.iter() {
                let r = match v {
                    Optionality::Optional(schema) => {
                        optionality_wrapper(print_runtype(schema, named_schemas, ctx))
                    }
                    Optionality::Required(schema) => print_runtype(schema, named_schemas, ctx),
                };
                mapped.insert(k.clone(), r);
            }

            let indexed_properties_props: Vec<Expr> = indexed_properties
                .iter()
                .map(|it| {
                    let value_rt = match &it.value {
                        Optionality::Optional(schema) => {
                            let nullable_schema = &Runtype::any_of(
                                vec![Runtype::Null, schema.clone()].into_iter().collect(),
                            );
                            print_runtype(nullable_schema, named_schemas, ctx)
                        }
                        Optionality::Required(schema) => print_runtype(schema, named_schemas, ctx),
                    };

                    Expr::Object(ObjectLit {
                        span: DUMMY_SP,
                        props: vec![
                            //
                            PropOrSpread::Prop(
                                Prop::KeyValue(KeyValueProp {
                                    key: PropName::Str(Str {
                                        span: DUMMY_SP,
                                        value: "key".into(),
                                        raw: None,
                                    }),
                                    value: print_runtype(&it.key, named_schemas, ctx).into(),
                                })
                                .into(),
                            ),
                            PropOrSpread::Prop(
                                Prop::KeyValue(KeyValueProp {
                                    key: PropName::Str(Str {
                                        span: DUMMY_SP,
                                        value: "value".into(),
                                        raw: None,
                                    }),
                                    value: value_rt.into(),
                                })
                                .into(),
                            ),
                        ],
                    })
                })
                .collect();

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

            let indexed_properties_arr = Expr::Array(ArrayLit {
                span: DUMMY_SP,
                elems: indexed_properties_props
                    .into_iter()
                    .map(|it| {
                        Some(ExprOrSpread {
                            spread: None,
                            expr: it.into(),
                        })
                    })
                    .collect(),
            });

            new_runtype_class("ObjectRuntype", vec![obj_validator, indexed_properties_arr])
        }
        Runtype::Null => new_runtype_class("NullishRuntype", vec![string_lit("null")]),
        Runtype::Undefined => new_runtype_class("NullishRuntype", vec![string_lit("undefined")]),
        Runtype::Void => new_runtype_class("NullishRuntype", vec![string_lit("void")]),
    };

    let new_id = ctx.hoisted.len();
    ctx.hoisted.insert(schema.clone(), (new_id, out.clone()));
    hoist_identifier(new_id)
}

fn build_parsers_input(
    decs: &[BuiltDecoder],
    named_schemas: &[NamedSchema],
    ctx: &mut PrintContext,
) -> Expr {
    let mut validator_exprs: Vec<(String, Expr)> = vec![];
    for decoder in decs {
        let validator = print_runtype(&decoder.schema, named_schemas, ctx);
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

fn named_runtypes(named_schemas: &[NamedSchema], ctx: &mut PrintContext) -> Expr {
    let mut validator_exprs: Vec<(RuntypeUUID, Expr)> = vec![];
    for named_schema in named_schemas {
        let validator = print_runtype(&named_schema.schema, named_schemas, ctx);
        validator_exprs.push((named_schema.name.clone(), validator));
    }
    // filter out the inlined ones
    let validator_exprs: Vec<(RuntypeUUID, Expr)> = validator_exprs
        .into_iter()
        .filter(|(name, _)| !ctx.inlined.contains(name))
        .collect();

    Expr::Object(ObjectLit {
        span: DUMMY_SP,
        props: validator_exprs
            .into_iter()
            .map(|(key, value)| {
                PropOrSpread::Prop(
                    Prop::KeyValue(KeyValueProp {
                        key: PropName::Str(Str {
                            span: DUMMY_SP,
                            value: ctx.print_rt_name(&key).into(),
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

impl ParserExtractResult {
    pub fn emit_code(self) -> Result<String> {
        let built_parsers = self.built_decoders.unwrap_or_default();
        let named_schemas = validate_type_uniqueness(&self.validators)?;
        let all_names = named_schemas
            .iter()
            .map(|it| it.name.clone())
            .collect::<Vec<RuntypeUUID>>();
        let mut hoisted = PrintContext {
            settings: self.settings,
            hoisted: BTreeMap::new(),
            all_names,
            type_with_args_names: BTreeMap::new(),
            inlined: BTreeSet::new(),
        };

        let build_parsers_input: ModuleItem = const_decl(
            "buildParsersInput",
            build_parsers_input(&built_parsers, &named_schemas, &mut hoisted),
        );

        let build_named_parsers_input = const_decl(
            "namedRuntypes",
            named_runtypes(&named_schemas, &mut hoisted),
        );

        let mut sorted_direct_hoisted_values = hoisted.hoisted.into_values().collect::<Vec<_>>();
        sorted_direct_hoisted_values.sort_by_key(|it| it.0);

        let hoisted_direct_decls: Vec<ModuleItem> = sorted_direct_hoisted_values
            .into_iter()
            .map(|(id, expr)| const_decl(&hoist_name(id), expr))
            .collect();

        let module_items = hoisted_direct_decls
            .into_iter()
            .chain(vec![
                //
                build_named_parsers_input,
                build_parsers_input,
            ])
            .collect();

        Ok(emit_module_items(module_items)?)
    }
}
