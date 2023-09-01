use std::{rc::Rc, sync::Arc};

use swc_common::{BytePos, Loc, SourceMap, Span};

#[derive(Debug, Clone)]
pub enum DiagnosticInfoMessage {
    CannotParseJsDocExportDefault,
    JsDocDescriptionRestIsNotEmpty,
    JsDocsParameterDescriptionHasTags,
    DescriptionCouldNotBeParsed,
    KeywordNonSerializableToJsonSchema,
    PropertyNonSerializableToJsonSchema,
    BigIntNonSerializableToJsonSchema,
    TemplateNonSerializableToJsonSchema,
    DuplicatedRestNonSerializableToJsonSchema,
    TypeConstructNonSerializableToJsonSchema,
    CannotUnderstandTsIndexedAccessType,
    ContextInvalidAtThisPosition,
    ContextParameterMustBeFirst,
    InvalidHofParam,
    PropSpreadIsNotSupported,
    OptionalTypeIsNotSupported,
    PropShouldHaveTypeAnnotation,
    PropKeyShouldBeIdent,
    UnknownJsDocTagOfTypeUnknown(String),
    UnknownJsDocTagOnEndpoint(String),
    UnknownJsDocTagOnRouter(String),
    UnknownJsDocTagItem,
    CannotParseJsDocEndpoint,
    TooManyCommentsJsDoc,
    CannotResolveTypeReferenceOnConverting(String),
    CannotResolveTypeReferenceOnExtracting(String),
    HandlerCannotHaveTypeParameters,
    HandlerMustAnnotateReturnType,
    UnmatchedPathParameter(String),
    CoercerDepthExceeded,
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
    ThisRefersToSomethingThatCannotBeSerialized(String),
    NoMessageConvertedFromDiagInfo,
    TypeParameterApplicationNotSupported,
}
impl DiagnosticInfoMessage {
    pub fn to_string(self) -> String {
        match self {
            DiagnosticInfoMessage::KeywordNonSerializableToJsonSchema
            | DiagnosticInfoMessage::PropertyNonSerializableToJsonSchema
            | DiagnosticInfoMessage::BigIntNonSerializableToJsonSchema
            | DiagnosticInfoMessage::TemplateNonSerializableToJsonSchema
            | DiagnosticInfoMessage::DuplicatedRestNonSerializableToJsonSchema
            | DiagnosticInfoMessage::TypeConstructNonSerializableToJsonSchema => {
                format!("Type cannot be converted to JSON schema")
            }
            DiagnosticInfoMessage::ThisRefersToSomethingThatCannotBeSerialized(this) => {
                format!("{this} cannot be converted to JSON schema")
            }
            DiagnosticInfoMessage::CannotUnderstandTsIndexedAccessType => {
                format!("Indexed access types are not supported on schemas")
            }
            DiagnosticInfoMessage::ComplexPathParameterNotSupported => {
                format!("This type is too complex for a path parameter")
            }
            DiagnosticInfoMessage::ContextInvalidAtThisPosition => {
                format!("Context can only be used as the first parameter")
            }
            DiagnosticInfoMessage::ContextParameterMustBeFirst => {
                format!("This cannot be the first parameter, Context must be the first parameter")
            }
            DiagnosticInfoMessage::TsInterfaceExtendsNotSupported => {
                format!("Interface extends are not supported on schemas")
            }
            DiagnosticInfoMessage::TypeParameterApplicationNotSupported => {
                format!("Type parameter application is not supported on schemas")
            }
            DiagnosticInfoMessage::UnknownJsDocTagOfTypeUnknown(tag)
            | DiagnosticInfoMessage::UnknownJsDocTagOnRouter(tag)
            | DiagnosticInfoMessage::UnknownJsDocTagOnEndpoint(tag) => {
                format!("Jsdoc tag '{tag}' cannot be converted to OpenAPI")
            }
            DiagnosticInfoMessage::JsDocsParameterDescriptionHasTags => {
                format!("Jsdoc parameter description cannot have tags")
            }
            DiagnosticInfoMessage::UnmatchedPathParameter(param) => {
                format!("Path parameter `{param}` is not being used in the function parameters")
            }
            _ => format!("{:?}", self),
        }
    }
}
#[derive(Debug, Clone)]
pub enum DiagnosticParentMessage {
    CannotConvertToSchema,
    ComplexPathParam,
    InvalidContextPosition,
}
impl DiagnosticParentMessage {
    // TODO: link to docs for each
    pub fn to_string(self) -> String {
        match self {
            DiagnosticParentMessage::CannotConvertToSchema => {
                format!("Exposing a type that cannot be converted to JSON schema")
            }
            DiagnosticParentMessage::ComplexPathParam => {
                format!("Complex path parameter")
            }
            DiagnosticParentMessage::InvalidContextPosition => {
                format!("Invalid context usage")
            }
        }
    }
}
#[derive(Clone)]
pub enum DiagnosticInformation {
    KnownFile {
        message: DiagnosticInfoMessage,
        file_name: Rc<String>,
        loc_lo: Loc,
        loc_hi: Loc,
    },
    UnknownFile {
        message: DiagnosticInfoMessage,
        current_file: Rc<String>,
    },
}

impl DiagnosticInformation {
    pub fn to_diag(self, message: Option<DiagnosticParentMessage>) -> Diagnostic {
        match self {
            DiagnosticInformation::KnownFile { .. } => Diagnostic {
                message,
                cause: self,
                related_information: None,
            },
            DiagnosticInformation::UnknownFile { .. } => Diagnostic {
                cause: self,
                related_information: None,
                message,
            },
        }
    }
}

pub struct Diagnostic {
    pub message: Option<DiagnosticParentMessage>,
    pub cause: DiagnosticInformation,
    pub related_information: Option<Vec<DiagnosticInformation>>,
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
