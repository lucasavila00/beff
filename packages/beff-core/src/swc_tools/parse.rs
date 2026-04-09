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

fn ts_syntax_for_file(bff_fname: &BffFileName) -> TsSyntax {
    let name = bff_fname.as_str();
    if name.ends_with(".tsx") {
        TsSyntax {
            tsx: true,
            ..Default::default()
        }
    } else if name.ends_with(".d.ts") {
        TsSyntax {
            dts: true,
            ..Default::default()
        }
    } else {
        TsSyntax::default()
    }
}

#[allow(clippy::arc_with_non_send_sync)]
pub fn parse_with_swc(
    fm: &Rc<SourceFile>,
    cm: SourceMap,
    bff_fname: &BffFileName,
) -> Result<(BffModuleData, SwcComments)> {
    let comments: SwcComments = SwcComments::default();
    let module = parse_file_as_module(
        fm,
        Syntax::Typescript(ts_syntax_for_file(bff_fname)),
        EsVersion::latest(),
        Some(&comments),
        &mut vec![],
    )
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

#[cfg(test)]
mod tests {
    use super::*;
    use swc_common::{FileName, GLOBALS, Globals};

    fn parse_ok(file_name: &str, content: &str) -> bool {
        let bff_fname = BffFileName::new(file_name.to_string());
        GLOBALS.set(&Globals::new(), || {
            let cm = SourceMap::default();
            let fm = cm.new_source_file(
                FileName::Real(file_name.to_string().into()).into(),
                content.to_owned(),
            );
            parse_with_swc(&fm, cm, &bff_fname).is_ok()
        })
    }

    #[test]
    fn test_ts_file_parses() {
        assert!(parse_ok("types.ts", "export type Foo = { name: string };",));
    }

    #[test]
    fn test_tsx_file_parses_jsx() {
        // JSX content requires tsx mode — would fail in plain .ts
        assert!(parse_ok("component.tsx", "const el = <div>hello</div>;",));
    }

    #[test]
    fn test_ts_file_rejects_jsx() {
        // Without tsx mode, JSX is a parse error
        assert!(!parse_ok("component.ts", "const el = <div>hello</div>;",));
    }

    #[test]
    fn test_dts_file_parses() {
        assert!(parse_ok(
            "types.d.ts",
            "export type DtsUser = { id: string; name: string };",
        ));
    }
}
