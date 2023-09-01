use std::sync::Arc;

use jsdoc::ast::{Tag, TagItem};
use swc_common::{BytePos, Loc, SourceMap, Span};

#[derive(Debug, Clone)]
pub enum DiagnosticInfoMessage {
    ContextInvalidAtThisPosition,
    ContextParameterMustBeFirst,
    InvalidHofParam,
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
    CannotConvertTypeToSchema,
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
}
impl DiagnosticInfoMessage {
    pub fn to_string(self) -> String {
        match self {
            DiagnosticInfoMessage::CannotConvertTypeToSchema => {
                format!("Type cannot be converted to JSON schema")
            }
            DiagnosticInfoMessage::ThisRefersToSomethingThatCannotBeSerialized(this) => {
                format!("{this} cannot be converted to JSON schema")
            }
            _ => format!("{:?}", self),
        }
    }
}
#[derive(Debug, Clone)]
pub enum DiagnosticMessage {
    NoMessage,
    CannotConvertToSchema,
}
impl DiagnosticMessage {
    pub fn to_string(self) -> String {
        match self {
            DiagnosticMessage::CannotConvertToSchema => {
                format!("Using a type that cannot be converted to JSON schema")
            }
            DiagnosticMessage::NoMessage => format!(""),
        }
    }
}
#[derive(Clone)]
pub enum DiagnosticInformation {
    KnownFile {
        message: DiagnosticInfoMessage,
        file_name: String,
        loc_lo: Loc,
        loc_hi: Loc,
    },
    UnknownFile {
        message: DiagnosticInfoMessage,
        current_file: String,
    },
}

impl DiagnosticInformation {
    pub fn to_diag(self) -> Diagnostic {
        match self {
            DiagnosticInformation::KnownFile { .. } => Diagnostic {
                message: DiagnosticMessage::NoMessage,
                cause: self,
                related_information: None,
            },
            DiagnosticInformation::UnknownFile { .. } => Diagnostic {
                cause: self,
                related_information: None,
                message: DiagnosticMessage::NoMessage,
            },
        }
    }
}

pub struct Diagnostic {
    pub message: DiagnosticMessage,
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
