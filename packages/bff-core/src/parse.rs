use std::rc::Rc;
use std::sync::Arc;

use anyhow::Result;
use swc_common::errors::{EmitterWriter, Handler};
use swc_common::{Mark, SourceFile, SourceMap};
use swc_ecma_ast::EsVersion;
use swc_node_comments::SwcComments;

use crate::BffModuleData;
use swc_ecma_parser::TsConfig;
use swc_ecma_parser::{parse_file_as_module, Syntax};

use anyhow::anyhow;
use swc_ecma_transforms_base::resolver;

use swc_ecma_visit::FoldWith;
pub fn load_source_file(
    fm: &Rc<SourceFile>,
    cm: &Arc<SourceMap>,
) -> Result<(BffModuleData, SwcComments)> {
    let unresolved_mark = Mark::new();
    let top_level_mark = Mark::new();
    let comments: SwcComments = SwcComments::default();
    // TODO: recovered errors?
    let module = parse_file_as_module(
        &fm,
        Syntax::Typescript(TsConfig::default()),
        EsVersion::latest(),
        Some(&comments),
        &mut vec![],
    )
    .map(|module| module.fold_with(&mut resolver(unresolved_mark, top_level_mark, true)))
    .map_err(|err| {
        let emt = EmitterWriter::new(Box::new(std::io::stderr()), None, false, true);
        let handler = Handler::with_emitter(true, false, Box::new(emt));
        err.into_diagnostic(&handler).emit();
        anyhow!("Failed to parse or resolve module: {:?}", fm)
    })?;

    Ok((
        BffModuleData {
            fm: Arc::new(fm.as_ref().clone()),
            module,
            source_map: cm.clone(),
        },
        comments,
    ))
}
