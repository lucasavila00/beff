use anyhow::Result;
use swc_common::SourceMap;
use swc_common::{sync::Lrc, FilePathMapping};
use swc_ecma_ast::Module;
use swc_ecma_codegen::Config;
use swc_ecma_codegen::{text_writer::JsWriter, Emitter};

pub fn emit_module(ast: &Module) -> Result<String> {
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

    return Ok(code);
}
