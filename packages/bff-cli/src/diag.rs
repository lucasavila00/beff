use ariadne::{Config, Label, Report, ReportKind, Source};
use bff_core::diag::Diagnostic;
use swc_common::{collections::AHashMap, FileName};

use crate::ParsedModule;

pub fn print_errors(
    errors: Vec<Diagnostic>,
    bundler_files: &AHashMap<FileName, ParsedModule>,
    project_root: &str,
) {
    for err in errors {
        let name = &err.file_name;
        let file = &bundler_files.get(&name);
        match file {
            Some(file) => {
                let file = &file.module.fm;
                let src_id = &err.file_name.to_string();
                let src_id = &src_id.replace(project_root, "");

                let mut lo = err.span.lo.0 as usize;
                let mut hi = err.span.hi.0 as usize;
                if lo == 0 || hi == 0 {
                    hi = file.src.len()
                } else {
                    lo = lo - 1;
                    hi = hi - 1;
                }

                Report::build(ReportKind::Error, src_id, lo)
                    .with_config(Config::default().with_color(false))
                    .with_label(
                        Label::new((src_id, lo..hi)).with_message(format!("{:?}", err.message)),
                    )
                    .finish()
                    .eprint((src_id, Source::from(file.src.as_str())))
                    .expect("should be able to report errors");
            }
            None => {
                log::error!("Could not file file {name} and there was an error to print about it")
            }
        }
    }
}
