use ariadne::{Config, Label, Report, ReportKind, Source};
use swc_common::{collections::AHashMap, FileName, Span};

use crate::ParsedModule;

#[derive(Debug, Clone)]
pub enum DiagnosticMessage {
    UnmatchedPathParameter(String),
    CoercerDepthExceeded,
    CannotSerializeType,
    TsQualifiedNameNotSupported,
    TsInterfaceExtendsNotSupported,
    InternalErrorPleaseReport,
    TsTypeParametersNotSupported,
    RestParamMustBeTypeAnnotated,
    RestParamMustBeLabelAnnotated,
    ParameterPatternNotSupported,
    CouldNotUnderstandRestParameter,
    RestParameterMustBeTuple,
}

#[derive(Debug, Clone)]
pub struct Diagnostic {
    pub message: DiagnosticMessage,
    pub file_name: FileName,
    pub span: Span,
}
pub fn print_errors(
    errors: Vec<Diagnostic>,
    bundler_files: &AHashMap<FileName, ParsedModule>,
    project_root: &str,
) {
    for err in errors {
        let file = &bundler_files.get(&err.file_name).unwrap().module.fm;
        let src_id = &err.file_name.to_string();
        let src_id = &src_id.replace(project_root, "");

        let lo = err.span.lo.0 as usize - 1;
        Report::build(ReportKind::Error, src_id, lo)
            .with_config(Config::default().with_color(false))
            .with_label(
                Label::new((src_id, lo..(err.span.hi.0 as usize - 1)))
                    .with_message(format!("{:?}", err.message)),
            )
            .finish()
            .print((src_id, Source::from(file.src.as_str())))
            .unwrap();
    }
}
