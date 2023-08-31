use jsdoc::ast::{Tag, TagItem};
use swc_common::{Loc, Span};

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
    pub file_name: String,
    pub span: Span,
    pub loc_lo: Loc,
    pub loc_hi: Loc,
}
