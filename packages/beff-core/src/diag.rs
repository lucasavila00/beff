use anyhow::{anyhow, Result};
use core::fmt;
use std::{rc::Rc, sync::Arc};
use swc_common::{BytePos, Loc, SourceMap, Span};

use crate::{open_api_ast::HTTPMethod, BffFileName, ParsedModule};

#[derive(Debug, Clone)]
pub enum DiagnosticInfoMessage {
    CannotResolveKey(String),
    CouldNotFindSomethingOfOtherFile(String),
    EnumMemberNoInit,
    TypeofImportNotSupported,
    NoArgumentInTypeApplication,
    ThisShouldContainMethods,
    ExportDefaultNotFound,
    PathMustStartWithDash,
    PathParameterCannotBeOptional,
    InvalidIndexedAccess,
    TypeQueryArgsNotSupported,
    FoundValueExpectedType,
    CannotResolveValue,
    FoundTypeExpectedValue,
    CouldNotUnderstandThisPartOfTheRouter,
    CannotConvertToSubtype(String),
    IndexOutOfTupleRange(usize),
    CannotFindPropertyInObject(String),
    MustBeTsConstAssertion,
    CustomFormatIsNotRegistered,
    TypeMustNotBeEmpty,
    GetMustNotHaveBody,
    ReturnAnnotationIsRequired,
    CannotGetFullLocation,
    InvalidIdentifierInPatternNoExplodeAllowed,
    CloseBlockMustEndPattern,
    OpenBlockMustStartPattern,
    StarPatternMustBeUsedWithUse,
    CannotUseStarAsType,
    CannotUseTsTypeAsQualified,
    CannotUseTsInterfaceAsQualified,
    CannotUseTsEnumAsQualified,
    DecoderMustHaveTypeAnnotation,
    CannotGetQualifiedTypeFromFile(String),
    CannotGetQualifiedTypeFromFileRec(String),
    TwoCallsToBuildParsers,
    CannotResolveSomethingOfOtherFile(String),
    InvalidUsageOfStringFormatTypeParameter,
    CannotResolveNamespaceType,
    ShouldNotResolveTsInterfaceDeclAsNamespace,
    ShouldNotResolveTsTypeAsNamespace,
    ShouldNotResolveTsEnumAsNamespace,
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
    TemplateNonSerializableToJsonSchema,
    DuplicatedRestNonSerializableToJsonSchema,
    TypeConstructNonSerializableToJsonSchema,
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
    UnmatchedPathParameter(String, HTTPMethod),
    CouldNotResolveIdentifierOnPathParamTuple,
    TsInterfaceExtendsNotSupported,
    TsTypeParametersNotSupportedOnTuple,
    RestParamMustBeTypeAnnotated,
    ParameterPatternNotSupported,
    CouldNotUnderstandRestParameter,
    RestParameterMustBeTuple,
    CouldNotFindDefaultExport,
    ComplexPathParameterNotSupported,
    PatternMustBeComputedKeyOrString,
    MustBeComputedKeyWithMethodAndPatternMustBeString,
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
    CannotResolveLocalType(String),
    CannotResolveLocalSymbol(String),
    CannotResolveLocalExpr(String),
    CannotResolveLocalExprAccess(String),
}

#[allow(clippy::inherent_to_string)]
impl DiagnosticInfoMessage {
    pub fn to_string(&self) -> String {
        match self {
            DiagnosticInfoMessage::ThisShouldContainMethods => {
                "This should contain methods".to_string()
            }
            DiagnosticInfoMessage::ExportDefaultNotFound => {
                "Export default not found".to_string()
            }
            DiagnosticInfoMessage::CannotResolveLocalExprAccess(of) => {
                format!("Cannot resolve local expression access '{of}'")
            }
            DiagnosticInfoMessage::PathParameterCannotBeOptional => {
                "Path parameter cannot be optional".to_string()
            }
            DiagnosticInfoMessage::IndexOutOfTupleRange(idx) => {
                format!("Index out of tuple range: {}", idx)
            }
            DiagnosticInfoMessage::CannotResolveLocalType(name) => {
                format!("Cannot find type '{name}'")
            }
            DiagnosticInfoMessage::CannotResolveLocalExpr(name) => {
                format!("Cannot find name '{name}'")
            }
            DiagnosticInfoMessage::CannotResolveLocalSymbol(name) => {
                format!("Cannot find symbol '{name}'")
            }
            DiagnosticInfoMessage::KeywordNonSerializableToJsonSchema
            | DiagnosticInfoMessage::PropertyNonSerializableToJsonSchema
            | DiagnosticInfoMessage::TemplateNonSerializableToJsonSchema
            | DiagnosticInfoMessage::DuplicatedRestNonSerializableToJsonSchema
            | DiagnosticInfoMessage::TypeConstructNonSerializableToJsonSchema => {
                "This cannot be converted to JSON schema".to_string()
            }
            DiagnosticInfoMessage::ThisRefersToSomethingThatCannotBeSerialized(this) => {
                format!("`{this}` cannot be converted to JSON schema")
            }
            DiagnosticInfoMessage::ComplexPathParameterNotSupported => {
                "This type is too complex for a path parameter".to_string()
            }
            DiagnosticInfoMessage::ContextInvalidAtThisPosition => {
                "Context usage is not valid at this position.".to_string()
            }
            DiagnosticInfoMessage::ContextParameterMustBeFirst => {
                "Context must be the first parameter".to_string()
            }
            DiagnosticInfoMessage::TsInterfaceExtendsNotSupported => {
                "Interface extends are not supported".to_string()
            }
            DiagnosticInfoMessage::TypeParameterApplicationNotSupported => {
                "Type parameter application is not supported".to_string()
            }
            DiagnosticInfoMessage::UnknownJsDocTagOfTypeUnknown(tag)
            | DiagnosticInfoMessage::UnknownJsDocTagOnRouter(tag)
            | DiagnosticInfoMessage::UnknownJsDocTagOnEndpoint(tag) => {
                format!("Jsdoc tag '{tag}' cannot be converted to OpenAPI")
            }
            DiagnosticInfoMessage::JsDocsParameterDescriptionHasTags => {
                "Jsdoc parameter description cannot have tags".to_string()
            }
            DiagnosticInfoMessage::UnmatchedPathParameter(param, method) => {
                let method = method.to_string().to_uppercase();
                format!("Path parameter `{param}` is not being used in the function parameters of method `{method}`")
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
                "Must be computed key with method and pattern must be string".to_string()
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
                let name = &f.0;
                format!("Cannot find file '{name}' when converting to schema")
            }
            DiagnosticInfoMessage::CannotFindTypeExportWhenConvertingToSchema(exp) => {
                format!("Cannot find type export '{exp}' when converting to schema")
            }
            DiagnosticInfoMessage::NotAnObjectWithMethodKind => {
                "Not an object with method kind".to_string()
            }
            DiagnosticInfoMessage::NotAnHttpMethod => {
                "Not an HTTP method. Valid values are `get`, `post`, `put`, `delete`, `patch`, `options`".to_string()
            }
            DiagnosticInfoMessage::CannotGetFullLocation => {
                "Cannot get full location of the error".to_string()
            }
            DiagnosticInfoMessage::InvalidIdentifierInPatternNoExplodeAllowed => {
                "Invalid pattern content".to_string()
            }
            DiagnosticInfoMessage::CloseBlockMustEndPattern => {
                "Pattern must end with '}'".to_string()
            }
            DiagnosticInfoMessage::OpenBlockMustStartPattern => {
                "Pattern must start with '{'".to_string()
            }
            DiagnosticInfoMessage::StarPatternMustBeUsedWithUse => {
                "* patterns can contain only `use` handlers".to_string()
            }
            DiagnosticInfoMessage::CannotUseStarAsType => "Cannot use star as type".to_string(),
            DiagnosticInfoMessage::CannotUseTsTypeAsQualified => {
                "I cannot understand this type".to_string()
            }
            DiagnosticInfoMessage::CannotUseTsInterfaceAsQualified => {
                "I cannot understand this interface".to_string()
            }
            DiagnosticInfoMessage::DecoderMustHaveTypeAnnotation => {
                "Decoder must have type annotation".to_string()
            }
            DiagnosticInfoMessage::CannotGetQualifiedTypeFromFile(name) => {
                format!("Cannot find CannotGetQualifiedTypeFromFile type '{name}'")
            }
            DiagnosticInfoMessage::TwoCallsToBuildParsers => {
                "buildParser can only be called once".to_string()
            }
            DiagnosticInfoMessage::CannotResolveSomethingOfOtherFile(name) => {
                format!("Cannot find CannotResolveSomethingOfOtherFile type '{name}'")
            }
            DiagnosticInfoMessage::InvalidUsageOfStringFormatTypeParameter => {
                "Invalid usage of string format type parameter".to_string()
            }
            DiagnosticInfoMessage::CannotResolveNamespaceType => {
                "Cannot resolve namespace type".to_string()
            }
            DiagnosticInfoMessage::ShouldNotResolveTsInterfaceDeclAsNamespace => {
                "Should not resolve TS interface declaration as namespace".to_string()
            }
            DiagnosticInfoMessage::ShouldNotResolveTsTypeAsNamespace => {
                "Should not resolve TS type as namespace".to_string()
            }
            DiagnosticInfoMessage::DecoderShouldBeObjectWithTypesAndNames => {
                "Decoder should be object with types and names".to_string()
            }
            DiagnosticInfoMessage::TooManyTypeParamsOnDecoder => {
                "Too many type parameters on decoder".to_string()
            }
            DiagnosticInfoMessage::TooFewTypeParamsOnDecoder => {
                "Too few type parameters on decoder".to_string()
            }
            DiagnosticInfoMessage::GenericDecoderIsNotSupported => {
                "Generic decoder is not supported".to_string()
            }
            DiagnosticInfoMessage::InvalidDecoderKey => "Invalid decoder key".to_string(),
            DiagnosticInfoMessage::InvalidDecoderProperty => "Invalid decoder property".to_string(),
            DiagnosticInfoMessage::PatternMustBeComputedKeyOrString => {
                "Pattern must be computed key or string".to_string()
            }
            DiagnosticInfoMessage::ReturnAnnotationIsRequired => {
                "Return annotation is required".to_string()
            }
            DiagnosticInfoMessage::GetMustNotHaveBody => {
                "GET methods must not have a body".to_string()
            }
            DiagnosticInfoMessage::TypeMustNotBeEmpty => {
                "This type contains `never` and cannot be serialized".to_string()
            }
            DiagnosticInfoMessage::CustomFormatIsNotRegistered => {
                "Custom format is not registered".to_string()
            }
            DiagnosticInfoMessage::MustBeTsConstAssertion => {
                "Must be a TS const assertion".to_string()
            }
            DiagnosticInfoMessage::CannotFindPropertyInObject(prop) => {
                format!("Cannot find property '{prop}' in object")
            }
            DiagnosticInfoMessage::CannotConvertToSubtype(reason) => {
                format!("Cannot convert to subtype: {reason}")
            }
            DiagnosticInfoMessage::CouldNotUnderstandThisPartOfTheRouter => {
                "Could not understand this part of the router".to_string()
            }
            DiagnosticInfoMessage::FoundTypeExpectedValue => {
                "Found type, expected value".to_string()
            }
            DiagnosticInfoMessage::CannotResolveValue => "Cannot resolve value".to_string(),
            DiagnosticInfoMessage::FoundValueExpectedType => {
                "Found value, expected type".to_string()
            }
            DiagnosticInfoMessage::TypeQueryArgsNotSupported => {
                "Type query args are not supported".to_string()
            }
            DiagnosticInfoMessage::InvalidIndexedAccess => "Invalid indexed access".to_string(),
            DiagnosticInfoMessage::CannotGetQualifiedTypeFromFileRec(s) => {
                format!("Cannot get qualified type from recursive file: {s}")
            }
            DiagnosticInfoMessage::PathMustStartWithDash => {
                "Path must start with a dash".to_string()
            }
            DiagnosticInfoMessage::NoArgumentInTypeApplication => {
                "Missing this type argument".to_string()
            }
            DiagnosticInfoMessage::TypeofImportNotSupported => {
                "typeof import is not supported".to_string()
            }
            DiagnosticInfoMessage::CouldNotFindSomethingOfOtherFile(something) => {
                format!("Could not find '{something}' of other file")
            }
            DiagnosticInfoMessage::CannotResolveKey(key) =>{
                format!("Cannot resolve key '{key}' of non-object")
            }
            DiagnosticInfoMessage::EnumMemberNoInit => {
                "Enum must have initializer".to_string()
            }
            DiagnosticInfoMessage::CannotUseTsEnumAsQualified => {
                "Cannot use TS enum as qualified".to_string()
            }
            DiagnosticInfoMessage::ShouldNotResolveTsEnumAsNamespace => {
                "Should not resolve TS enum as namespace".to_string()
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
    pub offset_lo: usize,
    pub offset_hi: usize,
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
                    offset_lo: span.lo.0 as usize,
                    offset_hi: span.hi.0 as usize,
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
