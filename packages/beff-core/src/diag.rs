use anyhow::{anyhow, Result};
use core::fmt;
use std::{rc::Rc, sync::Arc};
use swc_common::{BytePos, Loc, SourceMap, Span};

use crate::{BffFileName, ParsedModule};

#[derive(Debug, Clone)]
pub enum DiagnosticInfoMessage {
    InvalidIdentifierInPatternNoExplodeAllowed,
    CloseBlockMustEndPattern,
    OpenBlockMustStartPattern,
    StarPatternMustBeUsedWithUse,
    CannotUseQualifiedTypeWithTypeParameters,
    CannotUseStarAsType,
    CannotUseTsTypeAsQualified,
    CannotUseTsInterfaceAsQualified,
    DecoderMustHaveTypeAnnotation,
    CannotGetQualifiedTypeFromFile,
    TwoCallsToBuildParsers,
    CannotSerializeNamespace,
    CannotResolveSomethingOfOtherFile,
    InvalidUsageOfStringFormatTypeParameter,
    CannotResolveNamespaceType,
    ShouldNotResolveTsInterfaceDeclAsNamespace,
    ShouldNotResolveTsTypeAsNamespace,
    DecoderShouldBeObjectWithTypesAndNames,
    TooManyTypeParamsOnDecoder,
    TooFewTypeParamsOnDecoder,
    GenericDecoderIsNotSupported,
    InvalidDecoderKey,
    InvalidDecoderProperty,
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
    PatternMustBeComputedKeyOrString,
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
    CannotResolveLocalType,
}

#[allow(clippy::inherent_to_string)]
impl DiagnosticInfoMessage {
    pub fn to_string(self) -> String {
        match self {
            DiagnosticInfoMessage::CannotResolveLocalType => {
                "Cannot resolve local type".to_string()
            }
            DiagnosticInfoMessage::KeywordNonSerializableToJsonSchema
            | DiagnosticInfoMessage::PropertyNonSerializableToJsonSchema
            | DiagnosticInfoMessage::BigIntNonSerializableToJsonSchema
            | DiagnosticInfoMessage::TemplateNonSerializableToJsonSchema
            | DiagnosticInfoMessage::DuplicatedRestNonSerializableToJsonSchema
            | DiagnosticInfoMessage::TypeConstructNonSerializableToJsonSchema => {
                "Type cannot be converted to JSON schema".to_string()
            }
            DiagnosticInfoMessage::ThisRefersToSomethingThatCannotBeSerialized(this) => {
                format!("`{this}` cannot be converted to JSON schema")
            }
            DiagnosticInfoMessage::CannotUnderstandTsIndexedAccessType => {
                "Indexed access types are not supported on schemas".to_string()
            }
            DiagnosticInfoMessage::ComplexPathParameterNotSupported => {
                "This type is too complex for a path parameter".to_string()
            }
            DiagnosticInfoMessage::ContextInvalidAtThisPosition => {
                "Context can only be used as the first parameter".to_string()
            }
            DiagnosticInfoMessage::ContextParameterMustBeFirst => {
                "This cannot be the first parameter, Context must be the first parameter"
                    .to_string()
            }
            DiagnosticInfoMessage::TsInterfaceExtendsNotSupported => {
                "Interface extends are not supported on schemas".to_string()
            }
            DiagnosticInfoMessage::TypeParameterApplicationNotSupported => {
                "Type parameter application is not supported on schemas".to_string()
            }
            DiagnosticInfoMessage::UnknownJsDocTagOfTypeUnknown(tag)
            | DiagnosticInfoMessage::UnknownJsDocTagOnRouter(tag)
            | DiagnosticInfoMessage::UnknownJsDocTagOnEndpoint(tag) => {
                format!("Jsdoc tag '{tag}' cannot be converted to OpenAPI")
            }
            DiagnosticInfoMessage::JsDocsParameterDescriptionHasTags => {
                "Jsdoc parameter description cannot have tags".to_string()
            }
            DiagnosticInfoMessage::UnmatchedPathParameter(param) => {
                format!("Path parameter `{param}` is not being used in the function parameters")
            }
            DiagnosticInfoMessage::RestParamMustBeLabelAnnotated => {
                "There is a parameter without name".to_string()
            }
            DiagnosticInfoMessage::CannotParseJsDocExportDefault => {
                "Failed to parse Js Docs of the default export".to_string()
            }
            DiagnosticInfoMessage::JsDocDescriptionRestIsNotEmpty => {
                "Failed to parse Js Docs descriptions, rest is not empty".to_string()
            }
            DiagnosticInfoMessage::JsDocsDescriptionCouldNotBeParsed => {
                "Failed to parse Js Docs descriptions".to_string()
            }
            DiagnosticInfoMessage::PropSpreadIsNotSupportedOnMethodMap => {
                "Spread props are not supported on method maps".to_string()
            }
            DiagnosticInfoMessage::OptionalTypeIsNotSupported => {
                "Optional types are not supported at this position".to_string()
            }
            DiagnosticInfoMessage::PropShouldHaveTypeAnnotation => {
                "Property should have a type annotation".to_string()
            }
            DiagnosticInfoMessage::PropKeyShouldBeIdent => {
                "Property name should be an identifier".to_string()
            }
            DiagnosticInfoMessage::CannotParseJsDocEndpoint => {
                "Failed to parse Js Docs of the endpoint".to_string()
            }
            DiagnosticInfoMessage::TooManyCommentsJsDoc => {
                "Failed to parse Js Docs. Only one comment is allowed".to_string()
            }
            DiagnosticInfoMessage::CannotResolveTypeReferenceOnConverting(name) => {
                format!("Failed to resolve type reference '{name}' when converting to schema")
            }
            DiagnosticInfoMessage::CannotResolveTypeReferenceOnExtracting(name) => {
                format!("Failed to resolve type reference '{name}' when extracting")
            }
            DiagnosticInfoMessage::HandlerCannotHaveTypeParameters => {
                "Handler cannot have type parameters".to_string()
            }
            DiagnosticInfoMessage::HandlerMustAnnotateReturnType => {
                "Handler must annotate return type".to_string()
            }
            DiagnosticInfoMessage::CouldNotResolveIdentifierOnPathParamTuple => {
                "Could not resolve identifier on path parameter tuple".to_string()
            }
            DiagnosticInfoMessage::TsTypeParametersNotSupportedOnTuple => {
                "Type parameters are not supported on tuples".to_string()
            }
            DiagnosticInfoMessage::RestParamMustBeTypeAnnotated => {
                "Rest parameter must be type annotated".to_string()
            }
            DiagnosticInfoMessage::ParameterPatternNotSupported => {
                "Parameter pattern is not supported".to_string()
            }
            DiagnosticInfoMessage::CouldNotUnderstandRestParameter => {
                "Could not understand rest parameter".to_string()
            }
            DiagnosticInfoMessage::RestParameterMustBeTuple => {
                "Rest parameter must be a tuple".to_string()
            }
            DiagnosticInfoMessage::CouldNotFindDefaultExport => {
                "Could not find default export".to_string()
            }
            DiagnosticInfoMessage::MustBeComputedKeyWithMethodAndPatternMustBeString => {
                "Pattern cannot be identified through a tuple".to_string()
            }
            DiagnosticInfoMessage::RestOnRouterDefaultExportNotSupportedYet => {
                "Rest on router default export is not supported yet".to_string()
            }
            DiagnosticInfoMessage::HandlerCannotBeGenerator => {
                "Handler cannot be a generator".to_string()
            }
            DiagnosticInfoMessage::ParameterIdentMustHaveTypeAnnotation => {
                "Parameter identifier must have a type annotation".to_string()
            }
            DiagnosticInfoMessage::InferringTwoParamsAsRequestBody => {
                "Inferring two parameters as request body".to_string()
            }
            DiagnosticInfoMessage::TooManyParamsOnLibType => {
                "Too many parameters on lib type".to_string()
            }
            DiagnosticInfoMessage::TwoDifferentTypesWithTheSameName => {
                "Two different types with the same name".to_string()
            }
            DiagnosticInfoMessage::TemplateMustBeOfSingleString => {
                "Template must be of a single string".to_string()
            }
            DiagnosticInfoMessage::CannotFindFileWhenConvertingToSchema(f) => {
                let name = f.0;
                format!("Cannot find file '{name}' when converting to schema")
            }
            DiagnosticInfoMessage::CannotFindTypeExportWhenConvertingToSchema(exp) => {
                format!("Cannot find type export '{exp}' when converting to schema")
            }
            DiagnosticInfoMessage::NotAnObjectWithMethodKind => {
                "Not an object with method kind".to_string()
            }
            DiagnosticInfoMessage::NotAnHttpMethod => "Not an HTTP method".to_string(),
            e => {
                format!("Unknown error: {e:?}")
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

impl fmt::Display for DiagnosticParentMessage {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            DiagnosticParentMessage::CannotConvertToSchema => {
                write!(f, "Exposing a type that cannot be converted to JSON schema")
            }
            DiagnosticParentMessage::ComplexPathParam => {
                write!(f, "Complex path parameter")
            }
            DiagnosticParentMessage::InvalidContextPosition => {
                write!(f, "Invalid context usage")
            }
        }
    }
}

#[derive(Clone, Debug)]
pub struct FullLocation {
    pub file_name: BffFileName,
    pub loc_lo: Loc,
    pub loc_hi: Loc,
}

impl FullLocation {
    pub fn to_diag(self, message: DiagnosticInfoMessage) -> Diagnostic {
        self.to_info(message).to_diag(None)
    }
    pub fn to_info(self, message: DiagnosticInfoMessage) -> DiagnosticInformation {
        DiagnosticInformation {
            message,
            loc: Location::Full(self),
        }
    }
    pub fn located<T>(self, value: T) -> Located<T> {
        Located { value, loc: self }
    }
}

#[derive(Clone, Debug)]
pub struct UnknownLocation {
    pub current_file: BffFileName,
}

#[derive(Clone, Debug)]
pub enum Location {
    Full(FullLocation),
    Unknown(UnknownLocation),
}

#[derive(Debug, Clone)]
pub struct Located<T> {
    pub value: T,
    pub loc: FullLocation,
}

impl Location {
    pub fn build(
        file: Option<Rc<ParsedModule>>,
        span: &Span,
        current_file: &BffFileName,
    ) -> Location {
        match file {
            Some(file) => {
                let (loc_lo, loc_hi) =
                    span_to_loc(span, &file.module.source_map, file.module.fm.end_pos);
                Location::Full(FullLocation {
                    file_name: file.module.bff_fname.clone(),
                    loc_lo,
                    loc_hi,
                })
            }
            None => Location::Unknown(UnknownLocation {
                current_file: current_file.clone(),
            }),
        }
    }

    pub fn to_info(self, message: DiagnosticInfoMessage) -> DiagnosticInformation {
        DiagnosticInformation { message, loc: self }
    }

    pub fn expect_full(self) -> FullLocation {
        match self {
            Location::Full(loc) => loc,
            Location::Unknown(_) => panic!("Expected full location"),
        }
    }

    pub fn unknown(current_file: &BffFileName) -> Location {
        Location::Unknown(UnknownLocation {
            current_file: current_file.clone(),
        })
    }

    pub fn result_full(self) -> Result<FullLocation> {
        match self {
            Location::Full(loc) => Ok(loc),
            Location::Unknown(loc) => Err(anyhow!("Expected full location, got {:?}", loc)),
        }
    }
}

#[derive(Clone, Debug)]
pub struct DiagnosticInformation {
    pub message: DiagnosticInfoMessage,
    pub loc: Location,
}

impl DiagnosticInformation {
    pub fn to_diag(self, parent_big_message: Option<DiagnosticParentMessage>) -> Diagnostic {
        Diagnostic {
            parent_big_message,
            cause: self,
            related_information: None,
        }
    }
}

#[derive(Debug)]
pub struct Diagnostic {
    pub parent_big_message: Option<DiagnosticParentMessage>,
    pub cause: DiagnosticInformation,
    pub related_information: Option<Vec<DiagnosticInformation>>,
}

fn span_to_loc(span: &Span, source_map: &Arc<SourceMap>, curr_file_end: BytePos) -> (Loc, Loc) {
    if span.lo.0 == 0 || span.hi.0 == 0 {
        let lo = source_map.lookup_char_pos(BytePos(1));
        let hi = source_map.lookup_char_pos(curr_file_end);
        return (lo, hi);
    }
    let lo = source_map.lookup_char_pos(span.lo);
    let hi = source_map.lookup_char_pos(span.hi);
    (lo, hi)
}
