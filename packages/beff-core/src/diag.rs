use std::{rc::Rc, sync::Arc};
use swc_common::{BytePos, Loc, SourceMap, Span};

use crate::{BffFileName, ModuleItemAddress, ParsedModule, RuntypeUUID};

#[derive(Debug, Clone)]
pub(crate) enum DiagnosticInfoMessage {
    TypeArgumentCountMismatch,
    CannotUseValueInTypePosition,
    CannotUseTypeInValuePosition,
    CannotUseInterfaceInValuePosition,
    ExpressionIsNotAType,
    TupleRestTypeMustBeArray,
    CannotUseStarImportInTypePosition,
    CannotUseTypeInQualifiedTypePosition,
    CannotUseInterfaceInQualifiedTypePosition,
    PickNeedsString,
    EnumItemShouldBeFromEnumType,
    SetShouldHaveOneTypeArgument,
    MapShouldHaveTwoTypeArguments,
    PartialShouldHaveTwoTypeArguments,
    RequiredShouldHaveTwoTypeArguments,
    ReadonlyShouldHaveOneTypeArgument,
    InvalidNumberOfTypeParametersForArray,
    ObjectHasConflictingKeyValueInIntersection,
    IntersectionWithBuiltInType {
        intersection: String,
        built_in: String,
        other_is_object: bool,
    },
    EnumMemberNotFound,
    CannotResolveRefToTplLit,
    TypeOfJSXTextNotSupported,
    TypeOfRegexNotSupported,
    TypeofObjectUnsupportedPropNum,
    TypeofObjectUnsupportedPropComputed,
    TypeofObjectUnsupportedPropBigInt,
    TypeofObjectUnsupportedSpread,
    TypeofObjectUnsupportedProp,
    TypeofPrivateNameNotSupported,
    TplLitTypeNonStringNonNumberNonBoolean,
    NestedTplLitToTplLit,
    ExcludeShouldHaveTwoTypeArguments,
    ExpectedTuple,
    ExpectedArray,
    RestFoundOnExtractObject,
    ShouldHaveObjectAsTypeArgument,
    CannotResolveRefInExtractUnion(RuntypeUUID),
    PickShouldHaveStringOrStringArrayAsTypeArgument,
    PickShouldHaveTwoTypeArguments,
    ExtendsShouldBeIdent,
    OmitShouldHaveTwoTypeArguments,
    OmitShouldHaveStringAsTypeArgument,
    IndexSignatureNonSerializable,
    MultipleIndexSignaturesNotSupported,
    AnyhowError(String),
    EnumMemberNoInit,
    TypeQueryArgsNotSupported,
    CustomStringIsNotRegistered,
    CustomNumberIsNotRegistered,
    InvalidUsageOfNumberFormatExtendsTypeParameter,
    BaseOfNumberFormatExtendsShouldBeNumberFormat,
    CannotNotFindBaseOfNumberFormatExtends,
    DecoderMustHaveTypeAnnotation,
    TwoCallsToBuildParsers,
    InvalidUsageOfStringFormatTypeParameter,
    BaseOfStringFormatExtendsShouldBeStringFormat,
    CannotNotFindBaseOfStringFormatExtends,
    InvalidUsageOfStringFormatExtendsTypeParameter,
    InvalidUsageOfNumberFormatTypeParameter,
    DecoderShouldBeObjectWithTypesAndNames,
    TooManyTypeParamsOnDecoder,
    TooFewTypeParamsOnDecoder,
    InvalidDecoderKey,
    InvalidDecoderProperty,
    KeywordNonSerializable,
    PropertyNonSerializable,
    RecordShouldHaveTwoTypeArguments,
    DuplicatedRestNonSerializable,
    UniqueNonSerializable,
    ThisTypeNonSerializable,
    TsInferTypeNonSerializable,
    TsTypePredicateNonSerializable,
    OptionalTypeIsNotSupported,
    PropShouldHaveTypeAnnotation,
    PropKeyShouldBeIdent,
    CannotResolveTypeReferenceOnExtracting(RuntypeUUID),
    TwoDifferentTypesWithTheSameName(RuntypeUUID),
    NoConstraintInMappedType,
    NoTypeAnnotationInMappedType,
    CannotConvertExpr,
    MappedTypeMinusNotSupported,
    CannotNotResolveType(ModuleItemAddress),
    CannotNotResolveValue(ModuleItemAddress),
    CannotNotFindFile(BffFileName),
    CannotResolveImport(String),
}

#[allow(clippy::inherent_to_string)]
impl DiagnosticInfoMessage {
    pub(crate) fn to_string(&self) -> String {
        match self {
            DiagnosticInfoMessage::KeywordNonSerializable => {
                "This keyword cannot be extracted".to_string()
            }
            DiagnosticInfoMessage::PropertyNonSerializable => {
                "This property cannot be extracted".to_string()
            }
            DiagnosticInfoMessage::DuplicatedRestNonSerializable => {
                "This rest parameter cannot be extracted".to_string()
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
                let name = name.diag_print();
                format!("Failed to resolve type reference '{name}' when extracting")
            }
            DiagnosticInfoMessage::TwoDifferentTypesWithTheSameName(name) => {
                let name= name.diag_print();
                format!("This includes two different types with the same name '{name}'")
            }
            DiagnosticInfoMessage::DecoderMustHaveTypeAnnotation => {
                "Decoder must have type annotation".to_string()
            }
            DiagnosticInfoMessage::TwoCallsToBuildParsers => {
                "buildParser can only be called once".to_string()
            }
            DiagnosticInfoMessage::InvalidUsageOfStringFormatTypeParameter => {
                "Invalid usage of string format type parameter".to_string()
            }
            DiagnosticInfoMessage::InvalidUsageOfNumberFormatTypeParameter => {
                "Invalid usage of number format type parameter".to_string()
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
            DiagnosticInfoMessage::InvalidDecoderKey => "Invalid decoder key".to_string(),
            DiagnosticInfoMessage::InvalidDecoderProperty => "Invalid decoder property".to_string(),
            DiagnosticInfoMessage::CustomStringIsNotRegistered => {
                "Custom string format is not registered".to_string()
            }
            DiagnosticInfoMessage::CustomNumberIsNotRegistered => {
                "Custom number format is not registered".to_string()
            }
            DiagnosticInfoMessage::TypeQueryArgsNotSupported => {
                "Type query args are not supported".to_string()
            }
            DiagnosticInfoMessage::EnumMemberNoInit => "Enum must have initializer".to_string(),
            DiagnosticInfoMessage::RecordShouldHaveTwoTypeArguments => {
                "Record should have two type arguments".to_string()
            }
            DiagnosticInfoMessage::AnyhowError(err) => {
                format!("Internal Error: {err}")
            }
            DiagnosticInfoMessage::IndexSignatureNonSerializable => {
                "Index signature cannot be extracted - Use Record<x,y>".to_string()
            }
            DiagnosticInfoMessage::OmitShouldHaveTwoTypeArguments => {
                "Omit should have two type arguments".to_string()
            }
            DiagnosticInfoMessage::OmitShouldHaveStringAsTypeArgument => {
                "Omit should have string as type argument".to_string()
            }
            DiagnosticInfoMessage::ExtendsShouldBeIdent => {
                "Extends should be an identifier".to_string()
            }
            DiagnosticInfoMessage::PickShouldHaveTwoTypeArguments => {
                "Pick should have two type arguments".to_string()
            }
            DiagnosticInfoMessage::PickNeedsString => {
                "Pick should have string as type argument".to_string()
            }
            DiagnosticInfoMessage::PickShouldHaveStringOrStringArrayAsTypeArgument => {
                "Pick should have string or string array as type argument".to_string()
            }
            DiagnosticInfoMessage::UniqueNonSerializable => {
                "Unique cannot be extracted".to_string()
            }
            DiagnosticInfoMessage::ThisTypeNonSerializable => {
                "'This' type cannot be extracted".to_string()
            }
            DiagnosticInfoMessage::TsInferTypeNonSerializable => {
                "Infer type cannot be extracted".to_string()
            }
            DiagnosticInfoMessage::TsTypePredicateNonSerializable => {
                "Type predicate cannot be extracted".to_string()
            }
            DiagnosticInfoMessage::NoConstraintInMappedType => {
                "No constraint in mapped type".to_string()
            }
            DiagnosticInfoMessage::NoTypeAnnotationInMappedType => {
                "No type annotation in mapped type".to_string()
            }
            DiagnosticInfoMessage::CannotConvertExpr => {
                "Cannot convert expression".to_string()
            }
            DiagnosticInfoMessage::MappedTypeMinusNotSupported => {
                "Mapped type minus is not supported".to_string()
            }
            DiagnosticInfoMessage::CannotResolveRefInExtractUnion(r) => {
                let name =r.diag_print();
                format!("Cannot resolve ref '{name}' in extract union")
            }
            DiagnosticInfoMessage::ShouldHaveObjectAsTypeArgument => {
                "Should have object as type argument".to_string()
            }
            DiagnosticInfoMessage::RestFoundOnExtractObject => {
                "Rest found on extract object".to_string()
            }
            DiagnosticInfoMessage::ExpectedArray => "Expected an array".to_string(),
            DiagnosticInfoMessage::ExpectedTuple => "Expected a tuple".to_string(),
            DiagnosticInfoMessage::ExcludeShouldHaveTwoTypeArguments => {
                "Exclude should have two type arguments".to_string()
            }
            DiagnosticInfoMessage::TplLitTypeNonStringNonNumberNonBoolean => {
                "Template literal type must be a string, number, or boolean".to_string()
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
            DiagnosticInfoMessage::CannotResolveRefToTplLit => {
                "Cannot resolve ref to template literal".to_string()
            }
            DiagnosticInfoMessage::EnumMemberNotFound => "Enum member not found".to_string(),
            DiagnosticInfoMessage::ObjectHasConflictingKeyValueInIntersection => {
                "Object has conflicting key value in intersection".to_string()
            }
            DiagnosticInfoMessage::IntersectionWithBuiltInType {
                intersection,
                built_in,
                other_is_object,
            } => {
                let (other, other_value) = if *other_is_object {
                    ("an object type", "a plain object")
                } else {
                    ("a different type", "a value of a different type")
                };
                format!(
                    "`{intersection}`: Beff does not support an intersection of {built_in} with {other}. \
                    A {built_in} value cannot also be {other_value}, so Beff cannot validate or parse it."
                )
            }
            DiagnosticInfoMessage::InvalidUsageOfStringFormatExtendsTypeParameter => {
                "Invalid usage of string format extends type parameter".to_string()
            }
            DiagnosticInfoMessage::BaseOfStringFormatExtendsShouldBeStringFormat => {
                "Base of string format extends should be string format".to_string()
            }
            DiagnosticInfoMessage::CannotNotFindBaseOfStringFormatExtends => {
                "Cannot find base of string format extends".to_string()
            }
            DiagnosticInfoMessage::InvalidUsageOfNumberFormatExtendsTypeParameter => {
                "Invalid usage of number format extends type parameter".to_string()
            }
            DiagnosticInfoMessage::BaseOfNumberFormatExtendsShouldBeNumberFormat => {
                "Base of number format extends should be number format".to_string()
            }
            DiagnosticInfoMessage::CannotNotFindBaseOfNumberFormatExtends => {
                "Cannot find base of number format extends".to_string()
            }
            DiagnosticInfoMessage::NestedTplLitToTplLit => {
                "Nested template literal types are not supported when converting to template literal".to_string()
            }
            DiagnosticInfoMessage::CannotNotResolveValue(module_item_address) => {
                let name = module_item_address.diag_print();
                format!("Cannot resolve value '{name}'")
            }
            DiagnosticInfoMessage::CannotNotResolveType(module_item_address) => {
                let name = module_item_address.diag_print();
                format!("Cannot resolve type '{name}'")
            },
            DiagnosticInfoMessage::CannotNotFindFile(file) => {
                format!("Cannot find file '{file}'")
            }
            DiagnosticInfoMessage::InvalidNumberOfTypeParametersForArray => {
                "Invalid number of type parameters for Array".to_string()
            }
            DiagnosticInfoMessage::RequiredShouldHaveTwoTypeArguments => {
                "Required should have two type arguments".to_string()
            }
            DiagnosticInfoMessage::ReadonlyShouldHaveOneTypeArgument => {
                "Readonly should have one type argument".to_string()
            }
            DiagnosticInfoMessage::PartialShouldHaveTwoTypeArguments => {
                "Partial should have two type arguments".to_string()
            }
            DiagnosticInfoMessage::EnumItemShouldBeFromEnumType => {
                "Enum item should be from enum type".to_string()
            }
            DiagnosticInfoMessage::CannotUseInterfaceInQualifiedTypePosition => {
                "Cannot use interface in qualified type position".to_string()
            }
            DiagnosticInfoMessage::CannotUseTypeInQualifiedTypePosition => {
                "Cannot use type in qualified type position".to_string()
            }
            DiagnosticInfoMessage::CannotUseStarImportInTypePosition => {
                "Cannot use star import in type position".to_string()
            }
            DiagnosticInfoMessage::TupleRestTypeMustBeArray => {
                "Rest type in tuple must be an array type".to_string()
            }
            DiagnosticInfoMessage::ExpressionIsNotAType => {
                "Expression is not a type".to_string()
            }
            DiagnosticInfoMessage::CannotUseTypeInValuePosition => {
                "Cannot use type in value position".to_string()
            }
            DiagnosticInfoMessage::CannotUseInterfaceInValuePosition => {
                "Cannot use interface in value position".to_string()
            }
            DiagnosticInfoMessage::CannotUseValueInTypePosition => {
                "Cannot use value in type position".to_string()
            }
            DiagnosticInfoMessage::CannotResolveImport(at) => {
                format!("Cannot resolve import '{at}'")
            }
            DiagnosticInfoMessage::TypeArgumentCountMismatch => {
                "Type argument count mismatch".to_string()
            }
            DiagnosticInfoMessage::MultipleIndexSignaturesNotSupported => {
                "Multiple index signatures are not supported".to_string()
            }
            DiagnosticInfoMessage::SetShouldHaveOneTypeArgument =>{
                "Set should have one type argument".to_string()
            }
            DiagnosticInfoMessage::MapShouldHaveTwoTypeArguments => {
                "Map should have 2 type arguments".to_string()
            }
        }
    }
}

#[derive(Clone, Debug)]
pub(crate) struct FullLocation {
    pub file_name: BffFileName,
    pub loc_lo: Loc,
    pub loc_hi: Loc,
    pub offset_lo: usize,
    pub offset_hi: usize,
}

#[derive(Clone, Debug)]
pub(crate) struct UnknownLocation {
    pub current_file: BffFileName,
}

#[derive(Clone, Debug)]
pub(crate) enum Location {
    Full(FullLocation),
    Unknown(UnknownLocation),
}

impl Location {
    pub(crate) fn build(
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

    pub(crate) fn into_info(self, message: DiagnosticInfoMessage) -> DiagnosticInformation {
        DiagnosticInformation { message, loc: self }
    }
}

#[derive(Clone, Debug)]
pub struct DiagnosticInformation {
    pub(crate) message: DiagnosticInfoMessage,
    pub(crate) loc: Location,
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
