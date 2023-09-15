use beff_core::{
    ast::json::Json,
    open_api_ast::{OpenApi, OpenApiParser, Validator},
    schema_changes::{is_safe_to_change_to, MdReport, OpenApiBreakingChange},
};
// use log::Level;
use wasm_bindgen::prelude::wasm_bindgen;
mod utils;

fn parse_json(it: &str) -> (OpenApi, Vec<Validator>) {
    let from_str = serde_json::from_str::<serde_json::Value>(&it).unwrap();

    let from_serde = Json::from_serde(&from_str);
    let mut parser = OpenApiParser::new();
    parser.process(&from_serde).unwrap();
    (parser.api, parser.components)
}

fn print_errors(errors: &[OpenApiBreakingChange]) -> String {
    errors
        .iter()
        .flat_map(|it| it.print_report())
        .collect::<Vec<MdReport>>()
        .into_iter()
        .map(|it| it.print())
        .collect::<Vec<String>>()
        .join("\n\n")
}

#[wasm_bindgen]
pub fn compare_schemas(from: &str, to: &str) -> String {
    let (from_api, from_vals) = parse_json(from);
    let (to_api, to_vals) = parse_json(to);

    let errors = is_safe_to_change_to(
        &from_api,
        &to_api,
        &from_vals.iter().collect::<Vec<_>>(),
        &to_vals.iter().collect::<Vec<_>>(),
    )
    .unwrap();

    print_errors(&errors)
}
#[wasm_bindgen]
pub fn init(verbose: bool) {
    // let log_level = if verbose { Level::Debug } else { Level::Info };
    // console_log::init_with_level(log_level).expect("should be able to log");
    // utils::set_panic_hook();
}
