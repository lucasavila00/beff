use std::sync::Arc;

use jsdoc::ast::{Tag, TagItem};
use swc_common::{BytePos, Loc, SourceMap, Span};

#[derive(Debug, Clone)]
pub enum DiagnosticMessage {
    PropSpreadIsNotSupported,
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
    NotAnHttpMethod,
}

pub enum Diagnostic {
    KnownFile {
        message: DiagnosticMessage,
        file_name: String,
        span: Span,
        loc_lo: Loc,
        loc_hi: Loc,
    },
    UnknownFile {
        message: DiagnosticMessage,
        current_file: String,
    },
}

pub fn span_to_loc(span: &Span, source_map: &Arc<SourceMap>, curr_file_end: BytePos) -> (Loc, Loc) {
    if span.lo.0 == 0 || span.hi.0 == 0 {
        let lo = source_map.lookup_char_pos(BytePos(1));
        let hi = source_map.lookup_char_pos(curr_file_end);
        return (lo, hi);
    }
    let lo = source_map.lookup_char_pos(span.lo);
    let hi = source_map.lookup_char_pos(span.hi);
    (lo, hi)
}
