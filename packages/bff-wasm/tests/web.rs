//! Test suite for the Web and headless browsers.

#![cfg(target_arch = "wasm32")]

extern crate wasm_bindgen_test;
use hello_wasm::{init, parse_source_file};
use wasm_bindgen_test::*;

// wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn pass2() {
    let src = r#"
    const a = 1;
    "#;

    init();
    parse_source_file("a.ts", src);
    assert_eq!(1 + 1, 2);
}
