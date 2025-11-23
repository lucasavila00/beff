use std::collections::{BTreeMap, BTreeSet};

use anyhow::{anyhow, Ok, Result};
use swc_common::SourceMap;
use swc_common::DUMMY_SP;
use swc_common::{sync::Lrc, FilePathMapping};
use swc_ecma_ast::Module;
use swc_ecma_ast::{
    ArrayLit, BindingIdent, Decl, Expr, ExprOrSpread, Ident, KeyValueProp, Lit, ModuleItem,
    NewExpr, Null, ObjectLit, Pat, Prop, PropName, PropOrSpread, Regex, Stmt, Str, VarDecl,
    VarDeclKind, VarDeclarator,
};
use swc_ecma_codegen::Config;
use swc_ecma_codegen::{text_writer::JsWriter, Emitter};

use crate::ast::json::Json;
use crate::ast::runtype::CustomFormat;
use crate::ast::runtype::TplLitTypeItem;
use crate::parser_extractor::ParserExtractResult;
use crate::{
    ast::runtype::{Optionality, Runtype},
    parser_extractor::BuiltDecoder,
    NamedSchema,
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

type SeenCounter = BTreeMap<Runtype, i32>;

struct HoistedMap {
    direct: BTreeMap<Runtype, (usize, Expr)>,
    seen: SeenCounter,
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
fn formats_runtype(constructor: &str, first: &String, rest: &[String]) -> Expr {
    let vs_arr = Expr::Array(ArrayLit {
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
    });
    new_runtype_class(constructor, vec![vs_arr])
}

fn runtype_union_or_intersection(
    constructor: &str,
    vs: &BTreeSet<Runtype>,
    named_schemas: &[NamedSchema],
    hoisted: &mut HoistedMap,
) -> Expr {
    let exprs = vs
        .iter()
        .map(|schema| print_runtype(schema, named_schemas, hoisted))
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
        Runtype::StNever => vec![],
        _ => vec![it.clone()],
    }
}

fn runtype_any_of_discriminated(
    flat_values: &BTreeSet<Runtype>,
    discriminator: String,
    discriminator_strings: BTreeSet<String>,
    object_vs: Vec<&BTreeMap<String, Optionality<Runtype>>>,
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
                if let Some(s) = s.extract_single_string_const() {
                    if s == current_key {
                        let new_obj_vs: Vec<(String, Optionality<Runtype>)> = vs
                            .iter()
                            // .filter(|it| it.0 != &discriminator)
                            .map(|it| (it.0.clone(), it.1.clone()))
                            .collect();
                        let new_obj = Runtype::object(new_obj_vs, None);
                        cases.push(new_obj);
                    }
                }
            }
        }
        let schema = Runtype::any_of(cases);

        let schema_code = print_runtype(&schema, named_schemas, hoisted);

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
        .map(|it| print_runtype(it, named_schemas, hoisted))
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
    flat_values: &BTreeSet<Runtype>,
    named_schemas: &[NamedSchema],
    hoisted: &mut HoistedMap,
) -> Option<Expr> {
    let all_objects_without_rest = flat_values
        .iter()
        .all(|it| matches!(it, Runtype::Object { rest: None, .. }));

    let object_vs = flat_values
        .iter()
        .filter_map(|it| match it {
            Runtype::Object { vs, rest: _ } => Some(vs),
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
                            hoisted,
                        ));
                    }
                }
            }
        }
    }
    None
}

fn maybe_runtype_any_of_consts(flat_values: &BTreeSet<Runtype>) -> Option<Expr> {
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

fn print_runtype(
    schema: &Runtype,
    named_schemas: &[NamedSchema],
    hoisted: &mut HoistedMap,
) -> Expr {
    let found_direct = hoisted.direct.get(schema);
    if let Some((var_name, _)) = found_direct {
        return hoist_identifier(*var_name);
    }

    let out = match schema {
        Runtype::String => typeof_runtype("string"),
        Runtype::Boolean => typeof_runtype("boolean"),
        Runtype::Number => typeof_runtype("number"),
        Runtype::Function => typeof_runtype("function"),
        Runtype::Ref(to) => ref_runtype(to),
        Runtype::Null => no_args_runtype("NullRuntype"),
        Runtype::Any => no_args_runtype("AnyRuntype"),
        Runtype::StNever => no_args_runtype("NeverRuntype"),
        Runtype::Const(c) => new_runtype_class("ConstRuntype", vec![c.clone().to_json().to_expr()]),
        Runtype::StringWithFormat(CustomFormat(first, rest)) => {
            formats_runtype("StringWithFormatRuntype", first, rest)
        }
        Runtype::NumberWithFormat(CustomFormat(first, rest)) => {
            formats_runtype("NumberWithFormatRuntype", first, rest)
        }
        Runtype::Date => no_args_runtype("DateRuntype"),
        Runtype::BigInt => no_args_runtype("BigIntRuntype"),
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
            print_runtype(&Runtype::Array(Runtype::Any.into()), named_schemas, hoisted)
        }
        Runtype::StNot(_) => {
            unreachable!("should not create decoders for semantic types")
        }
        Runtype::Array(json_schema) => {
            let item_validator = print_runtype(json_schema, named_schemas, hoisted);
            new_runtype_class("ArrayRuntype", vec![item_validator])
        }
        Runtype::MappedRecord { key, rest } => {
            let key_validator = print_runtype(key, named_schemas, hoisted);
            let rest_validator = print_runtype(rest, named_schemas, hoisted);
            new_runtype_class("MappedRecordRuntype", vec![key_validator, rest_validator])
        }
        Runtype::AllOf(vs) => {
            runtype_union_or_intersection("AllOfRuntype", vs, named_schemas, hoisted)
        }
        Runtype::AnyOf(vs) => {
            if vs.is_empty() {
                panic!("empty anyOf is not allowed")
            }

            let flat_values = vs
                .iter()
                .flat_map(|it: &Runtype| extract_union(it, named_schemas))
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
        Runtype::Tuple {
            prefix_items,
            items,
        } => {
            let prefix_item_validators = prefix_items
                .iter()
                .map(|it| print_runtype(it, named_schemas, hoisted))
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
                Some(item_schema) => print_runtype(item_schema, named_schemas, hoisted),
                None => Expr::Lit(Lit::Null(Null { span: DUMMY_SP })),
            };

            new_runtype_class("TupleRuntype", vec![prefix_arr, items])
        }
        Runtype::Object { vs, rest } => {
            let mut mapped = BTreeMap::new();
            for (k, v) in vs.iter() {
                let r = match v {
                    Optionality::Optional(schema) => {
                        let nullable_schema = &Runtype::any_of(
                            vec![Runtype::Null, schema.clone()].into_iter().collect(),
                        );
                        print_runtype(nullable_schema, named_schemas, hoisted)
                    }
                    Optionality::Required(schema) => print_runtype(schema, named_schemas, hoisted),
                };
                mapped.insert(k.clone(), r);
            }

            let rest = match rest {
                Some(item_schema) => print_runtype(item_schema, named_schemas, hoisted),
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
        let new_id = hoisted.direct.len();
        hoisted.direct.insert(schema.clone(), (new_id, out.clone()));
        hoist_identifier(new_id)
    }
}

fn build_parsers_input(
    decs: &[BuiltDecoder],
    named_schemas: &[NamedSchema],
    hoisted: &mut HoistedMap,
) -> Expr {
    let mut validator_exprs: Vec<(String, Expr)> = vec![];
    for decoder in decs {
        let validator = print_runtype(&decoder.schema, named_schemas, hoisted);
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
        let validator = print_runtype(&named_schema.schema, named_schemas, hoisted);
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

fn calculate_schema_seen(schema: &Runtype, seen: &mut SeenCounter) {
    let count = seen.entry(schema.clone()).or_insert(0);
    *count += 1;

    match schema {
        Runtype::StringWithFormat(_)
        | Runtype::NumberWithFormat(_)
        | Runtype::AnyArrayLike
        | Runtype::Any
        | Runtype::Number
        | Runtype::String
        | Runtype::Boolean
        | Runtype::StNever
        | Runtype::Function
        | Runtype::Date
        | Runtype::BigInt
        | Runtype::TplLitType(_)
        | Runtype::Ref(_)
        | Runtype::Const(_)
        | Runtype::Null => {}
        Runtype::Object { vs, rest } => {
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
        Runtype::MappedRecord { key, rest } => {
            calculate_schema_seen(key, seen);
            calculate_schema_seen(rest, seen);
        }
        Runtype::Array(json_schema) => {
            calculate_schema_seen(json_schema, seen);
        }
        Runtype::Tuple {
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
        Runtype::AnyOf(btree_set) | Runtype::AllOf(btree_set) => {
            for v in btree_set {
                calculate_schema_seen(v, seen);
            }
        }
        Runtype::StNot(json_schema) => {
            calculate_schema_seen(json_schema, seen);
        }
    }
}

fn calculate_named_schemas_seen(named_schemas: &[NamedSchema], seen: &mut SeenCounter) {
    for named_schema in named_schemas {
        calculate_schema_seen(&named_schema.schema, seen);
    }
}

impl ParserExtractResult {
    pub fn emit_code(self) -> Result<String> {
        let mut seen: SeenCounter = BTreeMap::new();
        let built_parsers = self.built_decoders.unwrap_or_default();
        let named_schemas = validate_type_uniqueness(&self.validators)?;
        calculate_named_schemas_seen(&named_schemas, &mut seen);
        let mut hoisted = HoistedMap {
            direct: BTreeMap::new(),
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

        let mut sorted_direct_hoisted_values = hoisted.direct.into_values().collect::<Vec<_>>();
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
