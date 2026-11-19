use std::collections::{BTreeMap, BTreeSet};

use anyhow::{Ok, Result};
use swc_common::DUMMY_SP;
use swc_common::SourceMap;
use swc_common::SyntaxContext;
use swc_common::{FilePathMapping, sync::Lrc};
use swc_ecma_ast::Module;
use swc_ecma_ast::{
    ArrayLit, BindingIdent, CallExpr, Callee, ComputedPropName, Decl, Expr, ExprOrSpread, ExprStmt,
    Ident, IdentName, KeyValueProp, Lit, ModuleItem, ObjectLit, Pat, Prop, PropName, PropOrSpread,
    Regex, Stmt, Str, VarDecl, VarDeclKind, VarDeclarator,
};
use swc_ecma_codegen::Config;
use swc_ecma_codegen::{Emitter, text_writer::JsWriter};

use crate::NameIndex;
use crate::RuntypeUUID;
use crate::ast::json::Json;
use crate::ast::runtype::CustomFormat;
use crate::ast::runtype::DebugPrintCtx;
use crate::ast::runtype::TplLitTypeItem;
use crate::parser_extractor::ParserExtractResult;
use crate::{
    NamedSchema,
    ast::runtype::{
        IndexedProperty, Optionality, Runtype, RuntypeConst, RuntypeKind, RuntypeMetadata,
        TplLitType, TypedArrayKind,
    },
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

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
struct PrintableRuntypeKey {
    metadata: RuntypeMetadata,
    kind: PrintableRuntypeKindKey,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
enum PrintableOptionalityKey {
    Optional(PrintableRuntypeKey),
    Required(PrintableRuntypeKey),
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
struct PrintableIndexedPropertyKey {
    key: PrintableRuntypeKey,
    value: PrintableOptionalityKey,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
enum PrintableRuntypeKindKey {
    Null,
    Undefined,
    Void,
    Boolean,
    String,
    Number,
    Any,
    AnyArrayLike,
    StringWithFormat(CustomFormat),
    NumberWithFormat(CustomFormat),
    TplLitType(TplLitType),
    Object {
        vs: BTreeMap<String, PrintableOptionalityKey>,
        indexed_properties: Option<Box<PrintableIndexedPropertyKey>>,
    },
    Array(Box<PrintableRuntypeKey>),
    Tuple {
        prefix_items: Vec<PrintableRuntypeKey>,
        items: Option<Box<PrintableRuntypeKey>>,
    },
    Ref(RuntypeUUID),
    AnyOf(BTreeSet<PrintableRuntypeKey>),
    AllOf(BTreeSet<PrintableRuntypeKey>),
    Const(RuntypeConst),
    Never,
    StNot(Box<PrintableRuntypeKey>),
    Function,
    Date,
    BigInt,
    TypedArray(TypedArrayKind),
    Map(Box<PrintableRuntypeKey>, Box<PrintableRuntypeKey>),
    Set(Box<PrintableRuntypeKey>),
}

impl PrintableRuntypeKey {
    fn from_runtype(schema: &Runtype) -> Self {
        Self {
            metadata: schema.metadata.clone(),
            kind: PrintableRuntypeKindKey::from_kind(&schema.kind),
        }
    }
}

impl PrintableOptionalityKey {
    fn from_optionality(optionality: &Optionality<Runtype>) -> Self {
        match optionality {
            Optionality::Optional(schema) => {
                Self::Optional(PrintableRuntypeKey::from_runtype(schema))
            }
            Optionality::Required(schema) => {
                Self::Required(PrintableRuntypeKey::from_runtype(schema))
            }
        }
    }
}

impl PrintableIndexedPropertyKey {
    fn from_indexed_property(indexed_property: &IndexedProperty) -> Self {
        Self {
            key: PrintableRuntypeKey::from_runtype(&indexed_property.key),
            value: PrintableOptionalityKey::from_optionality(&indexed_property.value),
        }
    }
}

impl PrintableRuntypeKindKey {
    fn from_kind(kind: &RuntypeKind) -> Self {
        match kind {
            RuntypeKind::Null => Self::Null,
            RuntypeKind::Undefined => Self::Undefined,
            RuntypeKind::Void => Self::Void,
            RuntypeKind::Boolean => Self::Boolean,
            RuntypeKind::String => Self::String,
            RuntypeKind::Number => Self::Number,
            RuntypeKind::Any => Self::Any,
            RuntypeKind::AnyArrayLike => Self::AnyArrayLike,
            RuntypeKind::StringWithFormat(format) => Self::StringWithFormat(format.clone()),
            RuntypeKind::NumberWithFormat(format) => Self::NumberWithFormat(format.clone()),
            RuntypeKind::TplLitType(tpl_lit_type) => Self::TplLitType(tpl_lit_type.clone()),
            RuntypeKind::Object {
                vs,
                indexed_properties,
            } => Self::Object {
                vs: vs
                    .iter()
                    .map(|(key, value)| {
                        (
                            key.clone(),
                            PrintableOptionalityKey::from_optionality(value),
                        )
                    })
                    .collect(),
                indexed_properties: indexed_properties
                    .as_ref()
                    .map(|it| Box::new(PrintableIndexedPropertyKey::from_indexed_property(it))),
            },
            RuntypeKind::Array(item) => {
                Self::Array(Box::new(PrintableRuntypeKey::from_runtype(item)))
            }
            RuntypeKind::Tuple {
                prefix_items,
                items,
            } => Self::Tuple {
                prefix_items: prefix_items
                    .iter()
                    .map(PrintableRuntypeKey::from_runtype)
                    .collect(),
                items: items
                    .as_ref()
                    .map(|it| Box::new(PrintableRuntypeKey::from_runtype(it))),
            },
            RuntypeKind::Ref(name) => Self::Ref(name.clone()),
            RuntypeKind::AnyOf(vs) => {
                Self::AnyOf(vs.iter().map(PrintableRuntypeKey::from_runtype).collect())
            }
            RuntypeKind::AllOf(vs) => {
                Self::AllOf(vs.iter().map(PrintableRuntypeKey::from_runtype).collect())
            }
            RuntypeKind::Const(value) => Self::Const(value.clone()),
            RuntypeKind::Never => Self::Never,
            RuntypeKind::StNot(inner) => {
                Self::StNot(Box::new(PrintableRuntypeKey::from_runtype(inner)))
            }
            RuntypeKind::Function => Self::Function,
            RuntypeKind::Date => Self::Date,
            RuntypeKind::BigInt => Self::BigInt,
            RuntypeKind::TypedArray(kind) => Self::TypedArray(*kind),
            RuntypeKind::Map(key, value) => Self::Map(
                Box::new(PrintableRuntypeKey::from_runtype(key)),
                Box::new(PrintableRuntypeKey::from_runtype(value)),
            ),
            RuntypeKind::Set(value) => {
                Self::Set(Box::new(PrintableRuntypeKey::from_runtype(value)))
            }
        }
    }
}

struct PrintContext {
    hoisted: BTreeMap<PrintableRuntypeKey, (usize, Expr)>,
    all_names: NameIndex,
    type_with_args_names: BTreeMap<RuntypeUUID, String>,
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

/// The named schemas, with maps to find them by name and by schema.
/// The names are unique: `extend_components` reports a duplicate name as a diagnostic.
struct NamedSchemas<'a> {
    list: &'a [NamedSchema],
    by_name: BTreeMap<&'a RuntypeUUID, &'a Runtype>,
    // The first name of each schema.
    by_schema: BTreeMap<&'a Runtype, &'a RuntypeUUID>,
}

impl<'a> NamedSchemas<'a> {
    fn new(list: &'a [NamedSchema]) -> Self {
        let mut by_name = BTreeMap::new();
        let mut by_schema = BTreeMap::new();
        for it in list {
            by_name.insert(&it.name, &it.schema);
            by_schema.entry(&it.schema).or_insert(&it.name);
        }
        NamedSchemas {
            list,
            by_name,
            by_schema,
        }
    }
}

fn identifier(name: &str) -> Ident {
    Ident {
        span: DUMMY_SP,
        sym: name.into(),
        optional: false,
        ctxt: SyntaxContext::empty(),
    }
}

fn call(function: &str, args: Vec<Expr>) -> Expr {
    Expr::Call(CallExpr {
        ctxt: SyntaxContext::empty(),
        span: DUMMY_SP,
        callee: Callee::Expr(Expr::Ident(identifier(function)).into()),
        args: args
            .into_iter()
            .map(|arg| ExprOrSpread {
                spread: None,
                expr: Box::new(arg),
            })
            .collect(),
        type_args: None,
    })
}

// A call to a builder of the runtime. A type with a description is wrapped in `withDescription`.
fn builder(function: &str, args: Vec<Expr>, original_runtype: &Runtype) -> Expr {
    let node = call(function, args);
    match original_runtype.metadata.description.as_ref() {
        Some(description) => call("withDescription", vec![node, string_lit(description)]),
        None => node,
    }
}

fn is_identifier(key: &str) -> bool {
    let mut chars = key.chars();
    chars
        .next()
        .is_some_and(|c| c.is_ascii_alphabetic() || c == '_' || c == '$')
        && chars.all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '$')
}

// A non-computed "__proto__" key in an object literal sets the prototype instead of
// creating an own property, so that key is emitted as a computed key.
fn object_lit_key(key: String) -> PropName {
    if key == "__proto__" {
        return PropName::Computed(ComputedPropName {
            span: DUMMY_SP,
            expr: Box::new(string_lit(&key)),
        });
    }
    if is_identifier(&key) {
        return PropName::Ident(IdentName {
            span: DUMMY_SP,
            sym: key.into(),
        });
    }
    PropName::Str(Str {
        span: DUMMY_SP,
        value: key.into(),
        raw: None,
    })
}

fn object_lit(props: Vec<(String, Expr)>) -> Expr {
    Expr::Object(ObjectLit {
        span: DUMMY_SP,
        props: props
            .into_iter()
            .map(|(key, value)| {
                PropOrSpread::Prop(
                    Prop::KeyValue(KeyValueProp {
                        key: object_lit_key(key),
                        value: value.into(),
                    })
                    .into(),
                )
            })
            .collect(),
    })
}

fn string_lit(s: &str) -> Expr {
    Expr::Lit(Lit::Str(Str {
        span: DUMMY_SP,
        value: s.into(),
        raw: None,
    }))
}

fn array_lit(elems: Vec<Expr>) -> Expr {
    Expr::Array(ArrayLit {
        span: DUMMY_SP,
        elems: elems
            .into_iter()
            .map(|it| {
                Some(ExprOrSpread {
                    spread: None,
                    expr: it.into(),
                })
            })
            .collect(),
    })
}

// `registry` has the named types of the module. The bundled code declares it.
fn registry() -> Expr {
    Expr::Ident(identifier("registry"))
}

fn ref_runtype(to: &RuntypeUUID, ctx: &mut PrintContext, original_runtype: &Runtype) -> Expr {
    builder(
        "reference",
        vec![registry(), string_lit(&ctx.print_rt_name(to))],
        original_runtype,
    )
}

fn no_args_runtype(function: &str, original_runtype: &Runtype) -> Expr {
    builder(function, vec![], original_runtype)
}

fn formats_runtype(
    constructor: &str,
    first: &String,
    rest: &[String],
    original_runtype: &Runtype,
) -> Expr {
    let vs_arr = array_lit(
        std::iter::once(first)
            .chain(rest.iter())
            .map(|it| string_lit(it))
            .collect(),
    );
    builder(constructor, vec![vs_arr], original_runtype)
}

// Object keys are always strings. A `number` key is printed as a runtype
// that accepts numeric strings.
fn print_index_key(key: &Runtype, named_schemas: &NamedSchemas, ctx: &mut PrintContext) -> Expr {
    match &key.kind {
        RuntypeKind::Number => no_args_runtype("numberKey", key),
        RuntypeKind::AnyOf(vs) if vs.iter().any(|it| matches!(it.kind, RuntypeKind::Number)) => {
            let exprs = vs
                .iter()
                .map(|it| print_index_key(it, named_schemas, ctx))
                .collect();
            builder("union", vec![array_lit(exprs)], key)
        }
        _ => print_runtype(key, named_schemas, ctx),
    }
}

fn runtype_union_or_intersection(
    constructor: &str,
    vs: &BTreeSet<Runtype>,
    named_schemas: &NamedSchemas,
    ctx: &mut PrintContext,
    original_runtype: &Runtype,
) -> Expr {
    let exprs = vs
        .iter()
        .map(|schema| print_runtype(schema, named_schemas, ctx))
        .collect::<Vec<Expr>>();
    builder(constructor, vec![array_lit(exprs)], original_runtype)
}

fn extract_union(it: &Runtype, named_schemas: &NamedSchemas) -> Vec<Runtype> {
    match &it.kind {
        RuntypeKind::AnyOf(vs) => vs
            .iter()
            .flat_map(|it| extract_union(it, named_schemas))
            .collect(),
        RuntypeKind::Ref(r) => {
            let v = named_schemas
                .by_name
                .get(r)
                .expect("everything should be resolved by now");
            extract_union(v, named_schemas)
        }
        RuntypeKind::Never => vec![],
        _ => vec![it.clone()],
    }
}

fn maybe_named_ref(schema: &Runtype, named_schemas: &NamedSchemas) -> Option<Runtype> {
    named_schemas
        .by_schema
        .get(schema)
        .map(|name| Runtype::ref_((*name).clone()))
}

fn runtype_any_of_discriminated(
    original_runtype: &Runtype,
    flat_values_set: &BTreeSet<Runtype>,
    discriminator: String,
    discriminator_strings_set: BTreeSet<String>,
    object_vs: Vec<BTreeMap<String, Optionality<Runtype>>>,
    named_schemas: &NamedSchemas,
    ctx: &mut PrintContext,
) -> Expr {
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

    let mapping_obj = object_lit(
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
                    maybe_named_ref(&cases[0], named_schemas).unwrap_or_else(|| cases[0].clone())
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

    let flat_values_schema = flat_values
        .iter()
        .map(|it| {
            let schema = maybe_named_ref(it, named_schemas).unwrap_or_else(|| it.clone());
            print_runtype(&schema, named_schemas, ctx)
        })
        .collect::<Vec<_>>();

    let flat_values_schema_arr = array_lit(flat_values_schema);

    builder(
        "discriminatedUnion",
        vec![disc, mapping_obj, flat_values_schema_arr],
        original_runtype,
    )
}

fn maybe_runtype_any_of_discriminated(
    original_runtype: &Runtype,
    flat_values: &BTreeSet<Runtype>,
    named_schemas: &NamedSchemas,
    ctx: &mut PrintContext,
) -> Option<Expr> {
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
    named_schemas: &NamedSchemas,
) -> Option<BTreeMap<String, Optionality<Runtype>>> {
    match &schema.kind {
        RuntypeKind::Object {
            vs,
            indexed_properties,
        } if indexed_properties.is_none() => Some(vs.clone()),
        RuntypeKind::Ref(r) => named_schemas
            .by_name
            .get(r)
            .and_then(|it| extract_object_shape(it, named_schemas)),
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
    named_schemas: &NamedSchemas,
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
    named_schemas: &NamedSchemas,
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

fn string_const_union(schema: &Runtype, named_schemas: &NamedSchemas) -> Option<BTreeSet<String>> {
    extract_union(schema, named_schemas)
        .into_iter()
        .map(|it| it.extract_single_string_const())
        .collect()
}

fn maybe_runtype_any_of_consts(
    original_runtype: &Runtype,
    flat_values_set: &BTreeSet<Runtype>,
    ctx: &mut PrintContext,
) -> Option<Expr> {
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
        let consts: Vec<Expr> = flat_values
            .iter()
            .map(|it| match it.extract_single_string_const() {
                Some(s) => Json::String(s).into_expr(),
                None => match &it.kind {
                    RuntypeKind::Const(c) => c.clone().into_json().into_expr(),
                    _ => unreachable!(),
                },
            })
            .collect();

        return Some(builder(
            "literals",
            vec![array_lit(consts)],
            original_runtype,
        ));
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
    call("optional", vec![inner])
}

fn print_runtype(schema: &Runtype, named_schemas: &NamedSchemas, ctx: &mut PrintContext) -> Expr {
    let hoist_key = PrintableRuntypeKey::from_runtype(schema);
    if let Some((var_name, _)) = ctx.hoisted.get(&hoist_key) {
        return hoist_identifier(*var_name);
    }

    let out = match &schema.kind {
        RuntypeKind::String => no_args_runtype("string", schema),
        RuntypeKind::Boolean => no_args_runtype("boolean", schema),
        RuntypeKind::Number => no_args_runtype("number", schema),
        RuntypeKind::Function => no_args_runtype("functionType", schema),
        RuntypeKind::Ref(to) => ref_runtype(to, ctx, schema),
        RuntypeKind::Any => no_args_runtype("any", schema),
        RuntypeKind::Never => no_args_runtype("never", schema),
        RuntypeKind::Const(c) => {
            builder("literal", vec![c.clone().into_json().into_expr()], schema)
        }
        RuntypeKind::StringWithFormat(CustomFormat(first, rest)) => {
            formats_runtype("stringWithFormat", first, rest, schema)
        }
        RuntypeKind::NumberWithFormat(CustomFormat(first, rest)) => {
            formats_runtype("numberWithFormat", first, rest, schema)
        }
        RuntypeKind::Date => no_args_runtype("date", schema),
        RuntypeKind::BigInt => no_args_runtype("bigint", schema),
        RuntypeKind::TypedArray(kind) => builder(
            "typedArray",
            vec![Json::String(kind.js_name().to_string()).into_expr()],
            schema,
        ),
        RuntypeKind::TplLitType(t) => match t.0.as_slice() {
            [TplLitTypeItem::StringConst(c)] => {
                builder("literal", vec![Json::String(c.clone()).into_expr()], schema)
            }
            _ => builder(
                "regex",
                vec![
                    Expr::Lit(Lit::Regex(Regex {
                        span: DUMMY_SP,
                        exp: t.regex_expr().into(),
                        flags: "".into(),
                    })),
                    string_lit(&t.describe()),
                ],
                schema,
            ),
        },
        RuntypeKind::AnyArrayLike => {
            let item_validator = print_runtype(&Runtype::any(), named_schemas, ctx);
            builder("array", vec![item_validator], schema)
        }
        RuntypeKind::StNot(_) => {
            unreachable!("should not create decoders for semantic types")
        }
        RuntypeKind::Array(json_schema) => {
            let item_validator = print_runtype(json_schema, named_schemas, ctx);
            builder("array", vec![item_validator], schema)
        }
        RuntypeKind::Map(k, v) => {
            let key_validator = print_runtype(k, named_schemas, ctx);
            let value_validator = print_runtype(v, named_schemas, ctx);
            builder("map", vec![key_validator, value_validator], schema)
        }
        RuntypeKind::Set(v) => {
            let item_validator = print_runtype(v, named_schemas, ctx);
            builder("set", vec![item_validator], schema)
        }
        RuntypeKind::AllOf(vs) => {
            runtype_union_or_intersection("intersection", vs, named_schemas, ctx, schema)
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
                runtype_union_or_intersection("union", vs, named_schemas, ctx, schema)
            }
        }
        RuntypeKind::Tuple {
            prefix_items,
            items,
        } => {
            let prefix_item_validators = prefix_items
                .iter()
                .map(|it| print_runtype(it, named_schemas, ctx))
                .collect::<Vec<Expr>>();
            let prefix_arr = array_lit(prefix_item_validators);

            let mut args = vec![prefix_arr];
            if let Some(item_schema) = items {
                args.push(print_runtype(item_schema, named_schemas, ctx));
            }

            builder("tuple", args, schema)
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

            let indexed_properties_props: Vec<Expr> = indexed_properties
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

            let mut args = vec![object_lit(mapped.into_iter().collect())];
            if !indexed_properties_props.is_empty() {
                args.push(array_lit(indexed_properties_props));
            }

            builder("object", args, schema)
        }
        RuntypeKind::Null => no_args_runtype("nullType", schema),
        RuntypeKind::Undefined => no_args_runtype("undefinedType", schema),
        RuntypeKind::Void => no_args_runtype("voidType", schema),
    };

    let new_id = ctx.hoisted.len();
    ctx.hoisted.insert(hoist_key, (new_id, out.clone()));
    hoist_identifier(new_id)
}

fn build_parsers_input(
    decs: &[BuiltDecoder],
    named_schemas: &NamedSchemas,
    ctx: &mut PrintContext,
) -> Expr {
    let mut validator_exprs: Vec<(String, Expr)> = vec![];
    for decoder in decs {
        let validator = print_runtype(&decoder.schema, named_schemas, ctx);
        validator_exprs.push((decoder.exported_name.clone(), validator));
    }

    object_lit(validator_exprs)
}

fn named_runtypes(named_schemas: &NamedSchemas, ctx: &mut PrintContext) -> Expr {
    let mut validator_exprs: Vec<(RuntypeUUID, Expr)> = vec![];
    for named_schema in named_schemas.list {
        let validator = print_runtype(&named_schema.schema, named_schemas, ctx);
        validator_exprs.push((named_schema.name.clone(), validator));
    }
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
        let named_schemas = NamedSchemas::new(&self.validators);
        let all_names = NameIndex::new(named_schemas.list.iter().map(|it| &it.name));
        let mut hoisted = PrintContext {
            hoisted: BTreeMap::new(),
            all_names,
            type_with_args_names: BTreeMap::new(),
        };

        let build_parsers_input: ModuleItem = const_decl(
            "buildParsersInput",
            build_parsers_input(&built_parsers, &named_schemas, &mut hoisted),
        );

        let define_named_runtypes = ModuleItem::Stmt(Stmt::Expr(ExprStmt {
            span: DUMMY_SP,
            expr: call(
                "define",
                vec![registry(), named_runtypes(&named_schemas, &mut hoisted)],
            )
            .into(),
        }));

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
                define_named_runtypes,
                build_parsers_input,
            ])
            .collect();

        Ok(emit_module_items(module_items)?)
    }
}
