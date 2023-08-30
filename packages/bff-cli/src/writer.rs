use anyhow::Result;
use bff_core::emit::emit_module;
use std::path::Path;
use std::{fs, path::PathBuf};
use swc_ecma_ast::Module;

fn meta_js_file_content(ast: &Module, no_shared_runtime: bool) -> Result<String> {
    let code = emit_module(ast)?;
    let js_prefix = include_str!("./assets/runtime.js");
    let js_suffix = include_str!("./assets/runtime2.js");

    if no_shared_runtime {
        return Ok(code);
    }

    Ok([js_prefix, &code, js_suffix].join("\n"))
}

fn file_path(output_dir: &Path, file_name: &str) -> PathBuf {
    output_dir.join(file_name)
}

pub fn write_meta_js(output_dir: &Path, ast: &Module, no_shared_runtime: bool) -> Result<()> {
    let path = file_path(output_dir, "index.js");
    log::debug!("writing output to {:?} ", path);
    let content = meta_js_file_content(ast, no_shared_runtime)?;
    fs::write(path, content)?;
    Ok(())
}

pub fn write_meta_dts(output_dir: &Path, _ast: &Module) -> Result<()> {
    let dts = include_str!("./assets/runtime.d.ts");
    let path = file_path(output_dir, "index.d.ts");
    log::debug!("writing output to {:?} ", path);
    fs::write(path, dts)?;
    Ok(())
}

pub fn create_folder_of_not_exists(output_dir: &Path) -> Result<()> {
    if !output_dir.exists() {
        fs::create_dir_all(output_dir)?;
    }
    Ok(())
}

pub fn write_bundled_module(
    output_dir: &Path,
    ast: &Module,
    no_shared_runtime: bool,
) -> Result<()> {
    create_folder_of_not_exists(output_dir)?;
    write_meta_js(output_dir, ast, no_shared_runtime)?;
    write_meta_dts(output_dir, ast)?;
    Ok(())
}
