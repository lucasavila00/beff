use std::rc::Rc;
use std::sync::Arc;

use anyhow::Result;
use swc_common::errors::{EmitterWriter, Handler};
use swc_common::{SourceFile, SourceMap};
use swc_ecma_ast::EsVersion;
use swc_node_comments::SwcComments;

use crate::{BffFileName, BffModuleData};
use swc_ecma_parser::{Syntax, TsSyntax, parse_file_as_module};

use anyhow::anyhow;

#[allow(clippy::arc_with_non_send_sync)]
pub fn parse_with_swc(
    fm: &Rc<SourceFile>,
    cm: SourceMap,
    bff_fname: &BffFileName,
) -> Result<(BffModuleData, SwcComments)> {
    //let unresolved_mark = Mark::new();
    //let top_level_mark = Mark::new();
    let comments: SwcComments = SwcComments::default();
    let module = parse_file_as_module(
        fm,
        Syntax::Typescript(TsSyntax::default()),
        EsVersion::latest(),
        Some(&comments),
        &mut vec![],
    )
    //.map(|module| module.fold_with(&mut resolver(unresolved_mark, top_level_mark, true)))
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
            source_map: Arc::new(cm),
            bff_fname: bff_fname.clone(),
        },
        comments,
    ))
}
