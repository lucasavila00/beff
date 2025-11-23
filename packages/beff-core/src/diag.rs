use anyhow::{anyhow, Result};
use core::fmt;
use std::{rc::Rc, sync::Arc};
use swc_common::{BytePos, Loc, SourceMap, Span};

use crate::{BffFileName, ParsedModule};

#[derive(Debug, Clone)]
pub enum DiagnosticInfoMessage {
    CannotHaveRecursiveGenericTypes,
    ObjectHasConflictingKeyValueInIntersection,
    CannotResolveNamedImport,
    EnumMemberNotFound,
    TplLitTypeUnsupported,
    TwoCallsToBuildSchemas,
    CannotResolveRefInJsonSchemaToTplLit,
    TypeOfJSXTextNotSupported,
    TypeOfRegexNotSupported,
    TypeofObjectUnsupportedPropNum,
    TypeofObjectUnsupportedPropComputed,
    TypeofObjectUnsupportedPropBigInt,
    TypeofObjectUnsupportedSpread,
    TypeofObjectUnsupportedProp,
    TypeofPrivateNameNotSupported,
    FoundTypeExpectedValueInSymbolExport,
    TypeOfStarNotSupported,
    TypeOfSomethingOfOtherFileNotSupported,
    CannotUseDefaultAsStar,
    CannotUseNamedAsStar,
    TypeOfTsBuiltinNotSupported,
    TypeofTsEnumNotSupported,
    TplLitTypeNonStringNonNumberNonBoolean,
    NestedTplLitInJsonSchemaToTplLit,
    ExcludeShouldHaveTwoTypeArguments,
    MissingArgumentsOnExclude,
    PartialShouldHaveOneTypeArgument,
    CannotUseExprDeclAsQualified,
    CannotResolveNamespaceTypeExprDecl,
    CannotResolveNamespaceTypeNamespaceSymbol,
    CannotResolveNamespaceTypeValueExpr,
    CannotResolveNamespaceTypeSomethingOfOtherFile,
    ExpectedTuple,
    ExpectedArray,
    SpreadShouldBeArray,
    RestFoundOnExtractObject,
    ShouldHaveObjectAsTypeArgument,
    RecordKeyUnionShouldBeOnlyStrings,
    CannotResolveRefInExtractUnion(String),
    PartialShouldHaveObjectAsTypeArgument,
    MissingArgumentsOnPartial,
    PickShouldHaveStringAsTypeArgument,
    PickShouldHaveStringOrStringArrayAsTypeArgument,
    MissingArgumentsOnOmit,
    MissingArgumentsOnPick,
    PickShouldHaveTwoTypeArguments,
    PickShouldHaveObjectAsTypeArgument,
    ExtendsShouldBeIdent,
    TypeArgsInExtendsUnsupported,
    RequiredShouldHaveObjectAsTypeArgument,
    MissingArgumentsOnRequired,
    OmitShouldHaveStringOrStringArrayAsTypeArgument,
    OmitShouldHaveTwoTypeArguments,
    OmitShouldHaveStringAsTypeArgument,
    OmitShouldHaveObjectAsTypeArgument,
    IndexSignatureNonSerializableToJsonSchema,
    AnyhowError(String),
    CannotResolveKey(String),
    CouldNotFindSomethingOfOtherFile(String),
    EnumMemberNoInit,
    TypeofImportNotSupported,
    NoArgumentInTypeApplication,
    ExportDefaultNotFound,
    PathMustStartWithDash,
    InvalidIndexedAccess,
    TypeQueryArgsNotSupported,
    FoundValueExpectedType,
    FoundTypeExpectedValue,
    CustomStringIsNotRegistered,
    CustomNumberIsNotRegistered,
    InvalidUsageOfNumberFormatExtendsTypeParameter,
    BaseOfNumberFormatExtendsShouldBeNumberFormat,
    CouldNotFindBaseOfNumberFormatExtends,
    GetMustNotHaveBody,
    InvalidIdentifierInPatternNoExplodeAllowed,
    CloseBlockMustEndPattern,
    OpenBlockMustStartPattern,
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
    BaseOfStringFormatExtendsShouldBeStringFormat,
    CouldNotFindBaseOfStringFormatExtends,
    InvalidUsageOfStringFormatExtendsTypeParameter,
    InvalidUsageOfNumberFormatTypeParameter,
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
    KeywordNonSerializableToJsonSchema,
    PropertyNonSerializableToJsonSchema,
    MissingArgumentsOnRecord,
    RecordShouldHaveTwoTypeArguments,
    DuplicatedRestNonSerializableToJsonSchema,
    UniqueNonSerializableToJsonSchema,
    ReadonlyNonSerializableToJsonSchema,
    ThisTypeNonSerializableToJsonSchema,
    TsFnOrConstructorTypeNonSerializableToJsonSchema,
    TsConditionalTypeNonSerializableToJsonSchema,
    TsInferTypeNonSerializableToJsonSchema,
    TsTypePredicateNonSerializableToJsonSchema,
    TsImportTypeNonSerializableToJsonSchema,
    OptionalTypeIsNotSupported,
    PropShouldHaveTypeAnnotation,
    PropKeyShouldBeIdent,
    CannotResolveTypeReferenceOnExtracting(String),
    TsInterfaceExtendsNotSupported,
    TwoDifferentTypesWithTheSameName(String),
    CannotFindFileWhenConvertingToSchema(BffFileName),
    ThisRefersToSomethingThatCannotBeSerialized(String),
    CannotResolveLocalSymbol(String),
    NoConstraintInMappedType,
    NonStringKeyInMappedType,
    NoTypeAnnotationInMappedType,
    CannotConvertExprToSchema,
    MappedTypeMinusNotSupported,
}

#[allow(clippy::inherent_to_string)]
impl DiagnosticInfoMessage {
    pub fn to_string(&self) -> String {
        match self {
            DiagnosticInfoMessage::ExportDefaultNotFound => "Export default not found".to_string(),
            DiagnosticInfoMessage::CannotResolveLocalSymbol(name) => {
                format!("Cannot find symbol '{name}'")
            }
            DiagnosticInfoMessage::KeywordNonSerializableToJsonSchema => {
                "This keyword cannot be converted to JSON schema".to_string()
            }
            DiagnosticInfoMessage::PropertyNonSerializableToJsonSchema => {
                "This property cannot be converted to JSON schema".to_string()
            }
            DiagnosticInfoMessage::DuplicatedRestNonSerializableToJsonSchema => {
                "This rest parameter cannot be converted to JSON schema".to_string()
            }
            DiagnosticInfoMessage::ThisRefersToSomethingThatCannotBeSerialized(this) => {
                format!("`{this}` cannot be converted to JSON schema")
            }
            DiagnosticInfoMessage::TsInterfaceExtendsNotSupported => {
                "Interface extends are not supported".to_string()
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
            DiagnosticInfoMessage::CannotResolveTypeReferenceOnExtracting(name) => {
                format!("Failed to resolve type reference '{name}' when extracting")
            }
            DiagnosticInfoMessage::TwoDifferentTypesWithTheSameName(name) => {
                format!("This includes two different types with the same name '{name}'")
            }
            DiagnosticInfoMessage::CannotFindFileWhenConvertingToSchema(f) => {
                let name = &f.0;
                format!("Cannot find file '{name}' when converting to schema")
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
            DiagnosticInfoMessage::InvalidUsageOfNumberFormatTypeParameter => {
                "Invalid usage of number format type parameter".to_string()
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
            DiagnosticInfoMessage::GetMustNotHaveBody => {
                "GET methods must not have a body".to_string()
            }
            DiagnosticInfoMessage::CustomStringIsNotRegistered => {
                "Custom string format is not registered".to_string()
            }
            DiagnosticInfoMessage::CustomNumberIsNotRegistered => {
                "Custom number format is not registered".to_string()
            }
            DiagnosticInfoMessage::FoundTypeExpectedValue => {
                "Found type, expected value".to_string()
            }
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
            DiagnosticInfoMessage::CannotResolveKey(key) => {
                format!("Cannot resolve key '{key}' of non-object")
            }
            DiagnosticInfoMessage::EnumMemberNoInit => "Enum must have initializer".to_string(),
            DiagnosticInfoMessage::CannotUseTsEnumAsQualified => {
                "Cannot use TS enum as qualified".to_string()
            }
            DiagnosticInfoMessage::ShouldNotResolveTsEnumAsNamespace => {
                "Should not resolve TS enum as namespace".to_string()
            }
            DiagnosticInfoMessage::MissingArgumentsOnRecord => {
                "Missing arguments on record".to_string()
            }
            DiagnosticInfoMessage::RecordShouldHaveTwoTypeArguments => {
                "Record should have two type arguments".to_string()
            }
            DiagnosticInfoMessage::AnyhowError(err) => {
                format!("Error: {err}")
            }
            DiagnosticInfoMessage::IndexSignatureNonSerializableToJsonSchema => {
                "Index signature cannot be converted to JSON schema - Use Record<x,y>".to_string()
            }
            DiagnosticInfoMessage::OmitShouldHaveTwoTypeArguments => {
                "Omit should have two type arguments".to_string()
            }
            DiagnosticInfoMessage::OmitShouldHaveObjectAsTypeArgument => {
                "Omit should have object as first type argument".to_string()
            }
            DiagnosticInfoMessage::OmitShouldHaveStringAsTypeArgument => {
                "Omit should have string as type argument".to_string()
            }
            DiagnosticInfoMessage::OmitShouldHaveStringOrStringArrayAsTypeArgument => {
                "Omit should have string or string array as type argument".to_string()
            }
            DiagnosticInfoMessage::RequiredShouldHaveObjectAsTypeArgument => {
                "Required should have object as type argument".to_string()
            }
            DiagnosticInfoMessage::MissingArgumentsOnRequired => {
                "Missing arguments on required".to_string()
            }
            DiagnosticInfoMessage::TypeArgsInExtendsUnsupported => {
                "Type arguments in extends are not supported".to_string()
            }
            DiagnosticInfoMessage::ExtendsShouldBeIdent => {
                "Extends should be an identifier".to_string()
            }
            DiagnosticInfoMessage::MissingArgumentsOnOmit => {
                "Missing arguments on omit".to_string()
            }
            DiagnosticInfoMessage::MissingArgumentsOnPick => {
                "Missing arguments on pick".to_string()
            }
            DiagnosticInfoMessage::PickShouldHaveTwoTypeArguments => {
                "Pick should have two type arguments".to_string()
            }
            DiagnosticInfoMessage::PickShouldHaveObjectAsTypeArgument => {
                "Pick should have object as type argument".to_string()
            }
            DiagnosticInfoMessage::PickShouldHaveStringAsTypeArgument => {
                "Pick should have string as type argument".to_string()
            }
            DiagnosticInfoMessage::PickShouldHaveStringOrStringArrayAsTypeArgument => {
                "Pick should have string or string array as type argument".to_string()
            }
            DiagnosticInfoMessage::PartialShouldHaveObjectAsTypeArgument => {
                "Partial should have object as type argument".to_string()
            }
            DiagnosticInfoMessage::MissingArgumentsOnPartial => {
                "Missing arguments on partial".to_string()
            }
            DiagnosticInfoMessage::UniqueNonSerializableToJsonSchema => {
                "Unique cannot be converted to JSON schema".to_string()
            }
            DiagnosticInfoMessage::ReadonlyNonSerializableToJsonSchema => {
                "Readonly cannot be converted to JSON schema".to_string()
            }
            DiagnosticInfoMessage::ThisTypeNonSerializableToJsonSchema => {
                "'This' type cannot be converted to JSON schema".to_string()
            }
            DiagnosticInfoMessage::TsFnOrConstructorTypeNonSerializableToJsonSchema => {
                "Function or constructor type cannot be converted to JSON schema".to_string()
            }
            DiagnosticInfoMessage::TsConditionalTypeNonSerializableToJsonSchema => {
                "Conditional type cannot be converted to JSON schema".to_string()
            }
            DiagnosticInfoMessage::TsInferTypeNonSerializableToJsonSchema => {
                "Infer type cannot be converted to JSON schema".to_string()
            }
            DiagnosticInfoMessage::TsTypePredicateNonSerializableToJsonSchema => {
                "Type predicate cannot be converted to JSON schema".to_string()
            }
            DiagnosticInfoMessage::TsImportTypeNonSerializableToJsonSchema => {
                "Import type cannot be converted to JSON schema".to_string()
            }
            DiagnosticInfoMessage::NoConstraintInMappedType => {
                "No constraint in mapped type".to_string()
            }
            DiagnosticInfoMessage::NonStringKeyInMappedType => {
                "Non-string key in mapped type".to_string()
            }
            DiagnosticInfoMessage::NoTypeAnnotationInMappedType => {
                "No type annotation in mapped type".to_string()
            }
            DiagnosticInfoMessage::CannotConvertExprToSchema => {
                "Cannot convert expression to JSON schema".to_string()
            }
            DiagnosticInfoMessage::MappedTypeMinusNotSupported => {
                "Mapped type minus is not supported".to_string()
            }
            DiagnosticInfoMessage::CannotResolveRefInExtractUnion(r) => {
                format!("Cannot resolve ref '{r}' in extract union")
            }
            DiagnosticInfoMessage::ShouldHaveObjectAsTypeArgument => {
                "Should have object as type argument".to_string()
            }
            DiagnosticInfoMessage::RestFoundOnExtractObject => {
                "Rest found on extract object".to_string()
            }
            DiagnosticInfoMessage::SpreadShouldBeArray => "Spread should be an array".to_string(),
            DiagnosticInfoMessage::ExpectedArray => "Expected an array".to_string(),
            DiagnosticInfoMessage::ExpectedTuple => "Expected a tuple".to_string(),
            DiagnosticInfoMessage::CannotResolveNamespaceTypeNamespaceSymbol => {
                "Cannot resolve namespace type namespace symbol".to_string()
            }
            DiagnosticInfoMessage::CannotResolveNamespaceTypeValueExpr => {
                "Cannot resolve namespace type value expression".to_string()
            }
            DiagnosticInfoMessage::CannotResolveNamespaceTypeSomethingOfOtherFile => {
                "Cannot resolve namespace type something of other file".to_string()
            }
            DiagnosticInfoMessage::CannotResolveNamespaceTypeExprDecl => {
                "Cannot resolve namespace type expression declaration".to_string()
            }
            DiagnosticInfoMessage::CannotUseExprDeclAsQualified => {
                "Cannot use expression declaration as qualified".to_string()
            }
            DiagnosticInfoMessage::PartialShouldHaveOneTypeArgument => {
                "Partial should have one type argument".to_string()
            }
            DiagnosticInfoMessage::MissingArgumentsOnExclude => {
                "Missing arguments on exclude".to_string()
            }
            DiagnosticInfoMessage::ExcludeShouldHaveTwoTypeArguments => {
                "Exclude should have two type arguments".to_string()
            }
            DiagnosticInfoMessage::TplLitTypeNonStringNonNumberNonBoolean => {
                "Template literal type must be a string, number, or boolean".to_string()
            }
            DiagnosticInfoMessage::TypeofTsEnumNotSupported => {
                "typeof on TS enum is not supported".to_string()
            }
            DiagnosticInfoMessage::TypeOfTsBuiltinNotSupported => {
                "typeof on TS builtin is not supported".to_string()
            }
            DiagnosticInfoMessage::CannotUseNamedAsStar => "Cannot use named as star".to_string(),
            DiagnosticInfoMessage::CannotUseDefaultAsStar => {
                "Cannot use default as star".to_string()
            }
            DiagnosticInfoMessage::TypeOfSomethingOfOtherFileNotSupported => {
                "typeof something of other file is not supported".to_string()
            }
            DiagnosticInfoMessage::TypeOfStarNotSupported => {
                "typeof * is not supported".to_string()
            }
            DiagnosticInfoMessage::FoundTypeExpectedValueInSymbolExport => {
                "Found type, expected value in symbol export".to_string()
            }
            DiagnosticInfoMessage::TypeofPrivateNameNotSupported => {
                "typeof on private name is not supported".to_string()
            }
            DiagnosticInfoMessage::TypeofObjectUnsupportedProp => {
                "typeof on object unsupported prop".to_string()
            }
            DiagnosticInfoMessage::TypeofObjectUnsupportedSpread => {
                "typeof on object unsupported spread".to_string()
            }
            DiagnosticInfoMessage::TypeofObjectUnsupportedPropBigInt => {
                "typeof on object unsupported prop BigInt".to_string()
            }
            DiagnosticInfoMessage::TypeofObjectUnsupportedPropComputed => {
                "typeof on object unsupported prop computed".to_string()
            }
            DiagnosticInfoMessage::TypeofObjectUnsupportedPropNum => {
                "typeof on object unsupported prop num".to_string()
            }
            DiagnosticInfoMessage::TypeOfRegexNotSupported => {
                "typeof on regex is not supported".to_string()
            }
            DiagnosticInfoMessage::TypeOfJSXTextNotSupported => {
                "typeof on JSX text is not supported".to_string()
            }
            DiagnosticInfoMessage::CannotResolveRefInJsonSchemaToTplLit => {
                "Cannot resolve ref in JSON schema to template literal".to_string()
            }
            DiagnosticInfoMessage::TwoCallsToBuildSchemas => {
                "buildSchemas can only be called once".to_string()
            }
            DiagnosticInfoMessage::TplLitTypeUnsupported => {
                "Template literal type is not supported".to_string()
            }
            DiagnosticInfoMessage::EnumMemberNotFound => "Enum member not found".to_string(),
            DiagnosticInfoMessage::CannotResolveNamedImport => {
                "Cannot resolve named import".to_string()
            }
            DiagnosticInfoMessage::ObjectHasConflictingKeyValueInIntersection => {
                "Object has conflicting key value in intersection".to_string()
            }
            DiagnosticInfoMessage::InvalidUsageOfStringFormatExtendsTypeParameter => {
                "Invalid usage of string format extends type parameter".to_string()
            }
            DiagnosticInfoMessage::BaseOfStringFormatExtendsShouldBeStringFormat => {
                "Base of string format extends should be string format".to_string()
            }
            DiagnosticInfoMessage::CouldNotFindBaseOfStringFormatExtends => {
                "Could not find base of string format extends".to_string()
            }
            DiagnosticInfoMessage::InvalidUsageOfNumberFormatExtendsTypeParameter => {
                "Invalid usage of number format extends type parameter".to_string()
            }
            DiagnosticInfoMessage::BaseOfNumberFormatExtendsShouldBeNumberFormat => {
                "Base of number format extends should be number format".to_string()
            }
            DiagnosticInfoMessage::CouldNotFindBaseOfNumberFormatExtends => {
                "Could not find base of number format extends".to_string()
            }
            DiagnosticInfoMessage::RecordKeyUnionShouldBeOnlyStrings => {
                "Record key union should only contain strings".to_string()
            }
            DiagnosticInfoMessage::CannotHaveRecursiveGenericTypes => {
                "Cannot have recursive generic types".to_string()
            }
            DiagnosticInfoMessage::NestedTplLitInJsonSchemaToTplLit => {
                "Nested template literal types are not supported when converting from JSON schema to template literal".to_string()
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
