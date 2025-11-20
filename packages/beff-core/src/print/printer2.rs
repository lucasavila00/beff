use anyhow::{anyhow, Ok, Result};
use serde::{Deserialize, Serialize};
use swc_common::DUMMY_SP;
use swc_ecma_ast::{
    BindingIdent, Decl, Expr, ExprOrSpread, Ident, KeyValueProp, Lit, MemberExpr, MemberProp,
    ModuleItem, NewExpr, ObjectLit, Pat, Prop, PropName, PropOrSpread, Stmt, Str, VarDecl,
    VarDeclKind, VarDeclarator,
};

use crate::{
    ast::json_schema::JsonSchema, emit::emit_module, parser_extractor::BuiltDecoder, ExtractResult,
    NamedSchema,
};

#[derive(Serialize, Deserialize)]
pub struct WritableModulesV2 {
    pub js_built_parsers: String,
}
pub trait ToWritableParser {
    fn to_module_v2(self) -> Result<WritableModulesV2>;
}

pub fn const_decl(name: &str, init: Expr) -> ModuleItem {
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

fn validator_for_schema(schema: &JsonSchema) -> Expr {
    match schema {
        JsonSchema::String => typeof_impl("string"),
        JsonSchema::Boolean => typeof_impl("boolean"),
        JsonSchema::Number => typeof_impl("number"),
        JsonSchema::Ref(to) => ref_impl(to),
        JsonSchema::Null => todo!(),
        JsonSchema::Any => todo!(),
        JsonSchema::AnyArrayLike => todo!(),
        JsonSchema::StringWithFormat(_) => todo!(),
        JsonSchema::StringFormatExtends(items) => todo!(),
        JsonSchema::NumberWithFormat(_) => todo!(),
        JsonSchema::NumberFormatExtends(items) => todo!(),
        JsonSchema::TplLitType(tpl_lit_type_items) => todo!(),
        JsonSchema::Object { vs, rest } => todo!(),
        JsonSchema::MappedRecord { key, rest } => todo!(),
        JsonSchema::Array(json_schema) => todo!(),
        JsonSchema::Tuple {
            prefix_items,
            items,
        } => todo!(),
        JsonSchema::AnyOf(btree_set) => todo!(),
        JsonSchema::AllOf(btree_set) => todo!(),
        JsonSchema::Const(json_schema_const) => todo!(),
        JsonSchema::Codec(codec_name) => todo!(),
        JsonSchema::StNever => todo!(),
        JsonSchema::StNot(json_schema) => todo!(),
        JsonSchema::Function => todo!(),
    }
}

fn build_parsers_input(decs: &[BuiltDecoder], hoisted: &mut Vec<ModuleItem>) -> Expr {
    let mut validator_exprs: Vec<(String, Expr)> = vec![];
    for decoder in decs {
        let validator = validator_for_schema(&decoder.schema);
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

impl ToWritableParser for ExtractResult {
    fn to_module_v2(self) -> Result<WritableModulesV2> {
        let built_parsers = self.parser.built_decoders.unwrap_or_default();
        let named_schemas = merge_named_schema(&self.parser.validators)?;

        let mut hoisted = vec![];

        let build_parsers_input = const_decl(
            "buildValidatorsInput",
            build_parsers_input(&built_parsers, &mut hoisted),
        );

        let js_built_parsers = emit_module(
            hoisted
                .into_iter()
                .chain(
                    vec![
                        //
                        build_parsers_input,
                    ]
                    .into_iter(),
                )
                .collect(),
            "\n",
        )?;

        Ok(WritableModulesV2 { js_built_parsers })
    }
}
