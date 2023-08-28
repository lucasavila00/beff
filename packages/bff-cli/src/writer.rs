use anyhow::Result;
use std::path::Path;
use std::{fs, path::PathBuf};
use swc_common::SourceMap;
use swc_common::{sync::Lrc, FilePathMapping};
use swc_ecma_ast::Module;
use swc_ecma_codegen::Config;
use swc_ecma_codegen::{text_writer::JsWriter, Emitter};

fn meta_js_file_content(ast: &Module, no_shared_runtime: bool) -> Result<String> {
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

            emitter.emit_module(ast)?;
        }

        String::from_utf8_lossy(&buf).to_string()
    };
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
