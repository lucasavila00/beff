use std::path::PathBuf;

use crate::emit::emit_module;
use dprint_plugin_typescript::{
    configuration::{ConfigurationBuilder, QuoteStyle},
    *,
};
use swc_common::DUMMY_SP;
use swc_ecma_ast::{Decl, Ident, ModuleItem, Stmt, TsType, TsTypeAliasDecl};

pub fn print_ts_types(vs: Vec<(String, TsType)>) -> String {
    let codes = vs
        .iter()
        .map(|(name, ty)| {
            emit_module(
                vec![ModuleItem::Stmt(Stmt::Decl(Decl::TsTypeAlias(Box::new(
                    TsTypeAliasDecl {
                        span: DUMMY_SP,
                        declare: false,
                        id: Ident {
                            span: DUMMY_SP,
                            sym: name.clone().into(),
                            optional: false,
                        },
                        type_params: None,
                        type_ann: Box::new(ty.clone()),
                    },
                ))))],
                "",
            )
            .unwrap()
        })
        .collect::<Vec<String>>()
        .join("\n");

    let config = ConfigurationBuilder::new()
        .line_width(80)
        .quote_style(QuoteStyle::PreferDouble)
        .build();

    format_text(&PathBuf::from("f.ts"), &codes, &config)
        .expect("Could not parse(1)...")
        .expect("Could not parse(2)...")
}
