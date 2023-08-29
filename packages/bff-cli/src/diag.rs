use ariadne::{Config, Label, Report, ReportKind, Source};
use jsdoc::ast::{Tag, TagItem};
use swc_common::{collections::AHashMap, FileName, Span};

use crate::ParsedModule;

#[derive(Debug, Clone)]
pub enum DiagnosticMessage {
    OptionalTypeIsNotSupported,
    PropShouldHaveTypeAnnotation,
    PropKeyShouldBeIdent,
    UnknownJsDocTagOfTypeUnknown(String),
    UnknownJsDocTag(Tag),
    UnknownJsDocTagItem(TagItem),
    CannotParseJsDoc,
    CannotResolveTypeReferenceOnConverting(String),
    CannotResolveTypeReferenceOnExtracting(String),
    HandlerCannotHaveTypeParameters,
    HandlerMustAnnotateReturnType,
    UnmatchedPathParameter(String),
    CoercerDepthExceeded,
    CannotSerializeType,
    TsQualifiedNameNotSupported,
    CouldNotResolveIdentifierOnPathParamTuple,
    TsInterfaceExtendsNotSupported,
    TsTypeParametersNotSupported,
    RestParamMustBeTypeAnnotated,
    RestParamMustBeLabelAnnotated,
    ParameterPatternNotSupported,
    CouldNotUnderstandRestParameter,
    RestParameterMustBeTuple,
    CouldNotFindDefaultExport,
    ComplexPathParameterNotSupported,
    HandlerMustBeAKeyValuePairWithStringAndFunction,
    MustBeComputedKey,
    MustBeComputedKeyWithMethodAndPatternMustBeString,
    InvalidPatternPrefix,
    RestOnRouterDefaultExportNotSupportedYet,
    HandlerCannotBeGenerator,
    ParameterIdentMustHaveTypeAnnotation,
    InferringTwoParamsAsRequestBody,
    TooManyParamsOnLibType,
    TwoDifferentTypesWithTheSameName,
    TemplateMustBeOfSingleString,
    CannotFindFileWhenConvertingToSchema(String),
    CannotFindTypeExportWhenConvertingToSchema(String),
    NotAnObjectWithMethodKind,
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
