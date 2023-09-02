use std::sync::Arc;

use swc_common::{BytePos, Loc, SourceMap, Span};

use crate::BffFileName;

#[derive(Debug, Clone)]
pub enum DiagnosticInfoMessage {
    CannotParseJsDocExportDefault,
    JsDocDescriptionRestIsNotEmpty,
    JsDocsParameterDescriptionHasTags,
    JsDocsDescriptionCouldNotBeParsed,
    KeywordNonSerializableToJsonSchema,
    PropertyNonSerializableToJsonSchema,
    BigIntNonSerializableToJsonSchema,
    TemplateNonSerializableToJsonSchema,
    DuplicatedRestNonSerializableToJsonSchema,
    TypeConstructNonSerializableToJsonSchema,
    CannotUnderstandTsIndexedAccessType,
    ContextInvalidAtThisPosition,
    ContextParameterMustBeFirst,
    PropSpreadIsNotSupportedOnMethodMap,
    OptionalTypeIsNotSupported,
    PropShouldHaveTypeAnnotation,
    PropKeyShouldBeIdent,
    UnknownJsDocTagOfTypeUnknown(String),
    UnknownJsDocTagOnEndpoint(String),
    UnknownJsDocTagOnRouter(String),
    CannotParseJsDocEndpoint,
    TooManyCommentsJsDoc,
    CannotResolveTypeReferenceOnConverting(String),
    CannotResolveTypeReferenceOnExtracting(String),
    HandlerCannotHaveTypeParameters,
    HandlerMustAnnotateReturnType,
    UnmatchedPathParameter(String),
    CouldNotResolveIdentifierOnPathParamTuple,
    TsInterfaceExtendsNotSupported,
    TsTypeParametersNotSupportedOnTuple,
    RestParamMustBeTypeAnnotated,
    RestParamMustBeLabelAnnotated,
    ParameterPatternNotSupported,
    CouldNotUnderstandRestParameter,
    RestParameterMustBeTuple,
    CouldNotFindDefaultExport,
    ComplexPathParameterNotSupported,
    PatternMustBeComputedKey,
    MustBeComputedKeyWithMethodAndPatternMustBeString,
    RestOnRouterDefaultExportNotSupportedYet,
    HandlerCannotBeGenerator,
    ParameterIdentMustHaveTypeAnnotation,
    InferringTwoParamsAsRequestBody,
    TooManyParamsOnLibType,
    TwoDifferentTypesWithTheSameName,
    TemplateMustBeOfSingleString,
    CannotFindFileWhenConvertingToSchema(BffFileName),
    CannotFindTypeExportWhenConvertingToSchema(String),
    NotAnObjectWithMethodKind,
    NotAnHttpMethod,
    ThisRefersToSomethingThatCannotBeSerialized(String),
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
            DiagnosticInfoMessage::RestParamMustBeLabelAnnotated => {
                format!("There is a parameter without name")
            }
            DiagnosticInfoMessage::CannotParseJsDocExportDefault => {
                format!("Failed to parse Js Docs of the default export")
            }
            DiagnosticInfoMessage::JsDocDescriptionRestIsNotEmpty => {
                format!("Failed to parse Js Docs descriptions, rest is not empty")
            }
            DiagnosticInfoMessage::JsDocsDescriptionCouldNotBeParsed => {
                format!("Failed to parse Js Docs descriptions")
            }
            DiagnosticInfoMessage::PropSpreadIsNotSupportedOnMethodMap => {
                format!("Spread props are not supported on method maps")
            }
            DiagnosticInfoMessage::OptionalTypeIsNotSupported => {
                format!("Optional types are not supported at this position")
            }
            DiagnosticInfoMessage::PropShouldHaveTypeAnnotation => {
                format!("Property should have a type annotation")
            }
            DiagnosticInfoMessage::PropKeyShouldBeIdent => {
                format!("Property name should be an identifier")
            }
            DiagnosticInfoMessage::CannotParseJsDocEndpoint => {
                format!("Failed to parse Js Docs of the endpoint")
            }
            DiagnosticInfoMessage::TooManyCommentsJsDoc => {
                format!("Failed to parse Js Docs. Only one comment is allowed")
            }
            DiagnosticInfoMessage::CannotResolveTypeReferenceOnConverting(name) => {
                format!("Failed to resolve type reference '{name}' when converting to schema")
            }
            DiagnosticInfoMessage::CannotResolveTypeReferenceOnExtracting(name) => {
                format!("Failed to resolve type reference '{name}' when extracting")
            }
            DiagnosticInfoMessage::HandlerCannotHaveTypeParameters => {
                format!("Handler cannot have type parameters")
            }
            DiagnosticInfoMessage::HandlerMustAnnotateReturnType => {
                format!("Handler must annotate return type")
            }
            DiagnosticInfoMessage::CouldNotResolveIdentifierOnPathParamTuple => {
                format!("Could not resolve identifier on path parameter tuple")
            }
            DiagnosticInfoMessage::TsTypeParametersNotSupportedOnTuple => {
                format!("Type parameters are not supported on tuples")
            }
            DiagnosticInfoMessage::RestParamMustBeTypeAnnotated => {
                format!("Rest parameter must be type annotated")
            }
            DiagnosticInfoMessage::ParameterPatternNotSupported => {
                format!("Parameter pattern is not supported")
            }
            DiagnosticInfoMessage::CouldNotUnderstandRestParameter => {
                format!("Could not understand rest parameter")
            }
            DiagnosticInfoMessage::RestParameterMustBeTuple => {
                format!("Rest parameter must be a tuple")
            }
            DiagnosticInfoMessage::CouldNotFindDefaultExport => {
                format!("Could not find default export")
            }
            DiagnosticInfoMessage::PatternMustBeComputedKey => {
                format!("Pattern must be a computed key")
            }
            DiagnosticInfoMessage::MustBeComputedKeyWithMethodAndPatternMustBeString => {
                format!("Pattern cannot be identified through a tuple")
            }
            DiagnosticInfoMessage::RestOnRouterDefaultExportNotSupportedYet => {
                format!("Rest on router default export is not supported yet")
            }
            DiagnosticInfoMessage::HandlerCannotBeGenerator => {
                format!("Handler cannot be a generator")
            }
            DiagnosticInfoMessage::ParameterIdentMustHaveTypeAnnotation => {
                format!("Parameter identifier must have a type annotation")
            }
            DiagnosticInfoMessage::InferringTwoParamsAsRequestBody => {
                format!("Inferring two parameters as request body")
            }
            DiagnosticInfoMessage::TooManyParamsOnLibType => {
                format!("Too many parameters on lib type")
            }
            DiagnosticInfoMessage::TwoDifferentTypesWithTheSameName => {
                format!("Two different types with the same name")
            }
            DiagnosticInfoMessage::TemplateMustBeOfSingleString => {
                format!("Template must be of a single string")
            }
            DiagnosticInfoMessage::CannotFindFileWhenConvertingToSchema(f) => {
                let name = f.0;
                format!("Cannot find file '{name}' when converting to schema")
            }
            DiagnosticInfoMessage::CannotFindTypeExportWhenConvertingToSchema(exp) => {
                format!("Cannot find type export '{exp}' when converting to schema")
            }
            DiagnosticInfoMessage::NotAnObjectWithMethodKind => {
                format!("Not an object with method kind")
            }
            DiagnosticInfoMessage::NotAnHttpMethod => {
                format!("Not an HTTP method")
            }
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
        file_name: BffFileName,
        loc_lo: Loc,
        loc_hi: Loc,
    },
    UnfoundFile {
        message: DiagnosticInfoMessage,
        current_file: BffFileName,
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
            DiagnosticInformation::UnfoundFile { .. } => Diagnostic {
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
