use std::collections::{BTreeMap, BTreeSet};

use anyhow::{Ok, Result, anyhow};

use crate::NameIndex;
use crate::RuntypeUUID;
use crate::ast::runtype::CustomFormat;
use crate::ast::runtype::DebugPrintCtx;
use crate::ast::runtype::TplLitTypeItem;
use crate::parser_extractor::ParserExtractResult;
use crate::{
    NamedSchema,
    ast::runtype::{Optionality, Runtype, RuntypeConst, RuntypeKind},
    parser_extractor::BuiltDecoder,
};

struct PrintContext {
    // The printed text of each hoisted runtype, and the number of its `direct_hoist_N` name.
    // The children of a runtype are printed as hoisted names, so the text is short.
    hoisted: BTreeMap<String, usize>,
    all_names: NameIndex,
    type_with_args_names: BTreeMap<RuntypeUUID, String>,
    inlined: BTreeSet<RuntypeUUID>,
}

impl PrintContext {
    pub(crate) fn print_rt_name(&mut self, name: &RuntypeUUID) -> String {
        let mut ctx = DebugPrintCtx {
            all_names: &self.all_names,
            type_with_args_names: &mut self.type_with_args_names,
        };
        name.print_name_for_js_codegen(&mut ctx)
    }
}

fn const_decl(name: &str, init: &str) -> String {
    format!("const {name}={init};\n")
}

/// Any type with the same name must be identical
fn validate_type_uniqueness(parser: &[NamedSchema]) -> Result<Vec<NamedSchema>> {
    let mut acc: Vec<NamedSchema> = vec![];
    let mut index: BTreeMap<&RuntypeUUID, usize> = BTreeMap::new();

    for d in parser {
        if let Some(&i) = index.get(&d.name) {
            if acc[i].schema != d.schema {
                // TODO: emit proper diag here?
                // or merge before?
                return Err(anyhow!("Two different types with the same name"));
            }
        } else {
            index.insert(&d.name, acc.len());
            acc.push(d.clone());
        }
    }
    Ok(acc)
}

fn new_runtime_class(constructor: &str, args: Vec<String>) -> String {
    format!("new {constructor}({})", args.join(","))
}

fn new_runtype_class(constructor: &str, mut args: Vec<String>, original_runtype: &Runtype) -> String {
    args.insert(0, runtype_metadata_arg(original_runtype));

    new_runtime_class(constructor, args)
}

fn is_ascii_identifier(key: &str) -> bool {
    let mut chars = key.chars();
    chars
        .next()
        .is_some_and(|c| c.is_ascii_alphabetic() || c == '_' || c == '$')
        && chars.all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '$')
}

// A non-computed "__proto__" key in an object literal sets the prototype instead of
// creating an own property, so that key is emitted as a computed key.
fn object_lit_key(key: &str) -> String {
    if key == "__proto__" {
        return format!("[{}]", string_lit(key));
    }
    if is_ascii_identifier(key) {
        return key.to_string();
    }
    string_lit(key)
}

fn object_lit(props: Vec<(String, String)>) -> String {
    let props = props
        .into_iter()
        .map(|(key, value)| format!("{}:{value}", object_lit_key(&key)))
        .collect::<Vec<_>>();
    format!("{{{}}}", props.join(","))
}

fn runtype_metadata_arg(schema: &Runtype) -> String {
    match schema.metadata.description.as_ref() {
        Some(description) => object_lit(vec![("description".to_string(), string_lit(description))]),
        None => "undefined".to_string(),
    }
}

/// A double-quoted JavaScript string literal.
fn string_lit(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 2);
    out.push('"');
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            // Line terminators that are legal in a string literal only since ES2019.
            '\u{2028}' => out.push_str("\\u2028"),
            '\u{2029}' => out.push_str("\\u2029"),
            c if c.is_ascii_control() => out.push_str(&format!("\\x{:02x}", c as u32)),
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

fn const_lit(c: &RuntypeConst) -> String {
    match c {
        RuntypeConst::Bool(v) => v.to_string(),
        RuntypeConst::Number(n) => n.to_js_string(),
    }
}

fn array_lit(elems: Vec<String>) -> String {
    format!("[{}]", elems.join(","))
}

fn typeof_runtype(t: &str, original_runtype: &Runtype) -> String {
    new_runtype_class(
        "TypeofRuntype",
        vec![
            //
            string_lit(t),
        ],
        original_runtype,
    )
}

fn ref_runtype(to: &RuntypeUUID, ctx: &mut PrintContext, original_runtype: &Runtype) -> String {
    new_runtype_class(
        "RefRuntype",
        vec![
            //
            string_lit(&ctx.print_rt_name(to)),
        ],
        original_runtype,
    )
}

fn no_args_runtype(class_name: &str, original_runtype: &Runtype) -> String {
    new_runtype_class(
        class_name,
        vec![
            //
        ],
        original_runtype,
    )
}

fn formats_runtype(
    constructor: &str,
    first: &String,
    rest: &[String],
    original_runtype: &Runtype,
) -> String {
    let vs_arr = array_lit(
        std::iter::once(first)
            .chain(rest.iter())
            .map(|it| string_lit(it))
            .collect(),
    );
    new_runtype_class(constructor, vec![vs_arr], original_runtype)
}

// Object keys are always strings. A `number` key is printed as a runtype
// that accepts numeric strings.
fn print_index_key(key: &Runtype, named_schemas: &[NamedSchema], ctx: &mut PrintContext) -> String {
    match &key.kind {
        RuntypeKind::Number => no_args_runtype("NumberKeyRuntype", key),
        RuntypeKind::AnyOf(vs) if vs.iter().any(|it| matches!(it.kind, RuntypeKind::Number)) => {
            let exprs = vs
                .iter()
                .map(|it| print_index_key(it, named_schemas, ctx))
                .collect();
            new_runtype_class("AnyOfRuntype", vec![array_lit(exprs)], key)
        }
        _ => print_runtype(key, named_schemas, ctx),
    }
}

fn runtype_union_or_intersection(
    constructor: &str,
    vs: &BTreeSet<Runtype>,
    named_schemas: &[NamedSchema],
    ctx: &mut PrintContext,
    original_runtype: &Runtype,
) -> String {
    let exprs = vs
        .iter()
        .map(|schema| print_runtype(schema, named_schemas, ctx))
        .collect::<Vec<String>>();
    new_runtype_class(constructor, vec![array_lit(exprs)], original_runtype)
}

fn extract_union(it: &Runtype, named_schemas: &[NamedSchema]) -> Vec<Runtype> {
    match &it.kind {
        RuntypeKind::AnyOf(vs) => vs
            .iter()
            .flat_map(|it| extract_union(it, named_schemas))
            .collect(),
        RuntypeKind::Ref(r) => {
            let v = named_schemas
                .iter()
                .find(|it| it.name == *r)
                .expect("everything should be resolved by now");
            extract_union(&v.schema, named_schemas)
        }
        RuntypeKind::Never => vec![],
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
        .map(|named_schema| Runtype::ref_(named_schema.name.clone()))
}

fn runtype_any_of_discriminated(
    original_runtype: &Runtype,
    flat_values_set: &BTreeSet<Runtype>,
    discriminator: String,
    discriminator_strings_set: BTreeSet<String>,
    object_vs: Vec<BTreeMap<String, Optionality<Runtype>>>,
    named_schemas: &[NamedSchema],
    ctx: &mut PrintContext,
) -> String {
    let mut flat_values = flat_values_set.iter().cloned().collect::<Vec<Runtype>>();
    let dbg_ctx = DebugPrintCtx {
        all_names: &ctx.all_names,
        type_with_args_names: &mut ctx.type_with_args_names,
    };
    flat_values.sort_by_key(|it| it.debug_print(&dbg_ctx));

    let mut discriminator_strings = discriminator_strings_set
        .into_iter()
        .collect::<Vec<String>>();
    discriminator_strings.sort();

    let disc = string_lit(&discriminator);

    // The variants for each discriminator value, in variant order.
    let mut variants_by_key: BTreeMap<String, Vec<&BTreeMap<String, Optionality<Runtype>>>> =
        BTreeMap::new();
    for vs in &object_vs {
        let value = vs
            .get(&discriminator)
            .expect("we already checked the discriminator exists")
            .inner();
        let keys = extract_union(value, named_schemas)
            .into_iter()
            .filter_map(|it| it.extract_single_string_const())
            .collect::<BTreeSet<_>>();
        for key in keys {
            variants_by_key.entry(key).or_default().push(vs);
        }
    }

    let schema_mapping_obj = object_lit(
        discriminator_strings
            .iter()
            .map(|current_key| {
                let cases = variants_by_key
                    .get(current_key)
                    .into_iter()
                    .flatten()
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

                (
                    current_key.clone(),
                    print_runtype(&schema, named_schemas, ctx),
                )
            })
            .collect(),
    );

    // The validation mapping is printed from the same cases as the schema mapping.
    let mapping_obj = schema_mapping_obj.clone();

    let flat_values_schema = flat_values
        .iter()
        .map(|it| {
            let schema = maybe_named_ref(it, named_schemas, ctx).unwrap_or_else(|| it.clone());
            print_runtype(&schema, named_schemas, ctx)
        })
        .collect::<Vec<_>>();

    let flat_values_schema_arr = array_lit(flat_values_schema);

    new_runtype_class(
        "AnyOfDiscriminatedRuntype",
        vec![
            flat_values_schema_arr,
            disc.clone(),
            mapping_obj,
            schema_mapping_obj,
        ],
        original_runtype,
    )
}

fn maybe_runtype_any_of_discriminated(
    original_runtype: &Runtype,
    flat_values: &BTreeSet<Runtype>,
    named_schemas: &[NamedSchema],
    ctx: &mut PrintContext,
) -> Option<String> {
    let object_vs = flat_values
        .iter()
        .map(|it| extract_object_shape(it, named_schemas))
        .collect::<Option<Vec<_>>>();

    if let Some(object_vs) = object_vs {
        // Each key once, in the order it first appears.
        let mut keys = vec![];
        let mut seen_keys = BTreeSet::new();
        for vs in &object_vs {
            for key in vs.keys() {
                if seen_keys.insert(key) {
                    keys.push(key.clone());
                }
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
                    })
                    .collect::<BTreeSet<_>>();
                let equal_in_all = values.len() == 1;
                if !equal_in_all {
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
                            original_runtype,
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
    match &schema.kind {
        RuntypeKind::Object {
            vs,
            indexed_properties,
        } if indexed_properties.is_none() => Some(vs.clone()),
        RuntypeKind::Ref(r) => named_schemas
            .iter()
            .find(|it| it.name == *r)
            .and_then(|it| extract_object_shape(&it.schema, named_schemas)),
        RuntypeKind::AllOf(vs) => {
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
    original_runtype: &Runtype,
    flat_values_set: &BTreeSet<Runtype>,
    ctx: &mut PrintContext,
) -> Option<String> {
    let mut flat_values = flat_values_set.iter().cloned().collect::<Vec<Runtype>>();
    let dbg_ctx = DebugPrintCtx {
        all_names: &ctx.all_names,
        type_with_args_names: &mut ctx.type_with_args_names,
    };

    flat_values.sort_by_key(|it| it.debug_print(&dbg_ctx));

    let all_consts = flat_values.iter().all(|it| {
        it.extract_single_string_const().is_some() || matches!(it.kind, RuntypeKind::Const(_))
    });
    if all_consts {
        let consts: Vec<String> = flat_values
            .iter()
            .map(|it| match it.extract_single_string_const() {
                Some(s) => string_lit(&s),
                None => match &it.kind {
                    RuntypeKind::Const(c) => const_lit(c),
                    _ => unreachable!(),
                },
            })
            .collect();

        return Some(new_runtype_class(
            "AnyOfConstsRuntype",
            vec![array_lit(consts)],
            original_runtype,
        ));
    }
    None
}

fn hoist_name(name: usize) -> String {
    format!("direct_hoist_{}", name)
}
fn optionality_wrapper(inner: String) -> String {
    new_runtime_class("OptionalFieldRuntype", vec![inner])
}

fn print_runtype(schema: &Runtype, named_schemas: &[NamedSchema], ctx: &mut PrintContext) -> String {
    let out = match &schema.kind {
        RuntypeKind::String => typeof_runtype("string", schema),
        RuntypeKind::Boolean => typeof_runtype("boolean", schema),
        RuntypeKind::Number => typeof_runtype("number", schema),
        RuntypeKind::Function => typeof_runtype("function", schema),
        RuntypeKind::Ref(to) => ref_runtype(to, ctx, schema),
        RuntypeKind::Any => no_args_runtype("AnyRuntype", schema),
        RuntypeKind::Never => no_args_runtype("NeverRuntype", schema),
        RuntypeKind::Const(c) => new_runtype_class("ConstRuntype", vec![const_lit(c)], schema),
        RuntypeKind::StringWithFormat(CustomFormat(first, rest)) => {
            formats_runtype("StringWithFormatRuntype", first, rest, schema)
        }
        RuntypeKind::NumberWithFormat(CustomFormat(first, rest)) => {
            formats_runtype("NumberWithFormatRuntype", first, rest, schema)
        }
        RuntypeKind::Date => no_args_runtype("DateRuntype", schema),
        RuntypeKind::BigInt => no_args_runtype("BigIntRuntype", schema),
        RuntypeKind::TypedArray(kind) => new_runtype_class(
            "TypedArrayRuntype",
            vec![string_lit(kind.js_name())],
            schema,
        ),
        RuntypeKind::TplLitType(t) => match t.0.as_slice() {
            [TplLitTypeItem::StringConst(c)] => {
                new_runtype_class("ConstRuntype", vec![string_lit(c)], schema)
            }
            _ => new_runtype_class(
                "RegexRuntype",
                vec![format!("/{}/", t.regex_expr()), string_lit(&t.describe())],
                schema,
            ),
        },
        RuntypeKind::AnyArrayLike => {
            let item_validator = print_runtype(&Runtype::any(), named_schemas, ctx);
            new_runtype_class("ArrayRuntype", vec![item_validator], schema)
        }
        RuntypeKind::StNot(_) => {
            unreachable!("should not create decoders for semantic types")
        }
        RuntypeKind::Array(json_schema) => {
            let item_validator = print_runtype(json_schema, named_schemas, ctx);
            new_runtype_class("ArrayRuntype", vec![item_validator], schema)
        }
        RuntypeKind::Map(k, v) => {
            let key_validator = print_runtype(k, named_schemas, ctx);
            let value_validator = print_runtype(v, named_schemas, ctx);
            new_runtype_class("MapRuntype", vec![key_validator, value_validator], schema)
        }
        RuntypeKind::Set(v) => {
            let item_validator = print_runtype(v, named_schemas, ctx);
            new_runtype_class("SetRuntype", vec![item_validator], schema)
        }
        RuntypeKind::AllOf(vs) => {
            runtype_union_or_intersection("AllOfRuntype", vs, named_schemas, ctx, schema)
        }
        RuntypeKind::AnyOf(vs) => {
            if vs.is_empty() {
                panic!("empty anyOf is not allowed")
            }

            let flat_values = vs
                .iter()
                .flat_map(|it: &Runtype| extract_union(it, named_schemas))
                .collect::<BTreeSet<_>>();

            if let Some(consts) = maybe_runtype_any_of_consts(schema, &flat_values, ctx) {
                consts
            } else if let Some(discriminated) =
                maybe_runtype_any_of_discriminated(schema, &flat_values, named_schemas, ctx)
            {
                discriminated
            } else {
                runtype_union_or_intersection("AnyOfRuntype", vs, named_schemas, ctx, schema)
            }
        }
        RuntypeKind::Tuple {
            prefix_items,
            items,
        } => {
            let prefix_item_validators = prefix_items
                .iter()
                .map(|it| print_runtype(it, named_schemas, ctx))
                .collect::<Vec<String>>();
            let prefix_arr = array_lit(prefix_item_validators);

            let items = match items {
                Some(item_schema) => print_runtype(item_schema, named_schemas, ctx),
                None => "null".to_string(),
            };

            new_runtype_class("TupleRuntype", vec![prefix_arr, items], schema)
        }
        RuntypeKind::Object {
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

            let indexed_properties_props: Vec<String> = indexed_properties
                .iter()
                .map(|it| {
                    let value_rt = match &it.value {
                        Optionality::Optional(schema) => {
                            optionality_wrapper(print_runtype(schema, named_schemas, ctx))
                        }
                        Optionality::Required(schema) => print_runtype(schema, named_schemas, ctx),
                    };

                    object_lit(vec![
                        (
                            "key".to_string(),
                            print_index_key(&it.key, named_schemas, ctx),
                        ),
                        ("value".to_string(), value_rt),
                    ])
                })
                .collect();

            let obj_validator = object_lit(mapped.into_iter().collect());

            let indexed_properties_arr = array_lit(indexed_properties_props);

            new_runtype_class(
                "ObjectRuntype",
                vec![obj_validator, indexed_properties_arr],
                schema,
            )
        }
        RuntypeKind::Null => new_runtype_class("NullishRuntype", vec![string_lit("null")], schema),
        RuntypeKind::Undefined => {
            new_runtype_class("NullishRuntype", vec![string_lit("undefined")], schema)
        }
        RuntypeKind::Void => new_runtype_class("NullishRuntype", vec![string_lit("void")], schema),
    };

    // Runtypes that print the same text share one hoisted constant.
    let new_id = ctx.hoisted.len();
    hoist_name(*ctx.hoisted.entry(out).or_insert(new_id))
}

fn build_parsers_input(
    decs: &[BuiltDecoder],
    named_schemas: &[NamedSchema],
    ctx: &mut PrintContext,
) -> String {
    let mut validator_exprs: Vec<(String, String)> = vec![];
    for decoder in decs {
        let validator = print_runtype(&decoder.schema, named_schemas, ctx);
        validator_exprs.push((decoder.exported_name.clone(), validator));
    }

    object_lit(validator_exprs)
}

fn named_runtypes(named_schemas: &[NamedSchema], ctx: &mut PrintContext) -> String {
    let mut validator_exprs: Vec<(RuntypeUUID, String)> = vec![];
    for named_schema in named_schemas {
        let validator = print_runtype(&named_schema.schema, named_schemas, ctx);
        validator_exprs.push((named_schema.name.clone(), validator));
    }
    // filter out the inlined ones
    let validator_exprs: Vec<(RuntypeUUID, String)> = validator_exprs
        .into_iter()
        .filter(|(name, _)| !ctx.inlined.contains(name))
        .collect();

    object_lit(
        validator_exprs
            .into_iter()
            .map(|(key, value)| (ctx.print_rt_name(&key), value))
            .collect(),
    )
}

impl ParserExtractResult {
    pub fn emit_code(self) -> Result<String> {
        let built_parsers = self.built_decoders.unwrap_or_default();
        let named_schemas = validate_type_uniqueness(&self.validators)?;
        let all_names = NameIndex::new(named_schemas.iter().map(|it| &it.name));
        let mut hoisted = PrintContext {
            hoisted: BTreeMap::new(),
            all_names,
            type_with_args_names: BTreeMap::new(),
            inlined: BTreeSet::new(),
        };

        let build_parsers_input = const_decl(
            "buildParsersInput",
            &build_parsers_input(&built_parsers, &named_schemas, &mut hoisted),
        );

        let build_named_parsers_input = const_decl(
            "namedRuntypes",
            &named_runtypes(&named_schemas, &mut hoisted),
        );

        let mut sorted_direct_hoisted_values = hoisted.hoisted.into_iter().collect::<Vec<_>>();
        sorted_direct_hoisted_values.sort_by_key(|it| it.1);

        let mut code = String::new();
        for (text, id) in sorted_direct_hoisted_values {
            code.push_str(&const_decl(&hoist_name(id), &text));
        }
        code.push_str(&build_named_parsers_input);
        code.push_str(&build_parsers_input);

        Ok(code)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn string_lit_escapes() {
        assert_eq!(string_lit("a"), r#""a""#);
        assert_eq!(string_lit(r#"it's "q""#), r#""it's \"q\"""#);
        assert_eq!(string_lit("a\\b"), r#""a\\b""#);
        assert_eq!(string_lit("a\nb\r\tc"), r#""a\nb\r\tc""#);
        assert_eq!(string_lit("\u{0}1\u{8}\u{b}\u{1f}\u{7f}"), r#""\x001\x08\x0b\x1f\x7f""#);
        assert_eq!(string_lit("\u{2028}\u{2029}"), "\"\\u2028\\u2029\"");
        assert_eq!(string_lit("é ${x} `😀` */ </script>"), "\"é ${x} `😀` */ </script>\"");
    }

    #[test]
    fn object_lit_keys() {
        let key = |k: &str| object_lit(vec![(k.to_string(), "0".to_string())]);
        assert_eq!(key("a_$1"), "{a_$1:0}");
        assert_eq!(key("class"), "{class:0}");
        assert_eq!(key("__proto__"), r#"{["__proto__"]:0}"#);
        assert_eq!(key(""), r#"{"":0}"#);
        assert_eq!(key("1"), r#"{"1":0}"#);
        assert_eq!(key("1a"), r#"{"1a":0}"#);
        assert_eq!(key("a-b"), r#"{"a-b":0}"#);
        assert_eq!(key("a\"b"), r#"{"a\"b":0}"#);
        assert_eq!(key("é"), r#"{"é":0}"#);
    }

    #[test]
    fn const_lit_numbers() {
        let num = |n: f64| const_lit(&RuntypeConst::parse_f64(n));
        assert_eq!(num(0.0), "0");
        assert_eq!(num(-0.0), "0");
        assert_eq!(num(-1.0), "-1");
        assert_eq!(num(1.5), "1.5");
        assert_eq!(num(-0.5), "-0.5");
        assert_eq!(num(0.000001), "0.000001");
        assert_eq!(num(9007199254740992.0), "9007199254740992");
        assert_eq!(const_lit(&RuntypeConst::Bool(true)), "true");
    }
}
