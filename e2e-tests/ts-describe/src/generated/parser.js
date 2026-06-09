//@ts-nocheck

"use strict";

import {
  TypeofRuntype,
  AnyRuntype,
  NullishRuntype,
  NeverRuntype,
  ConstRuntype,
  RegexRuntype,
  DateRuntype,
  BigIntRuntype,
  StringWithFormatRuntype,
  NumberWithFormatRuntype,
  AnyOfConstsRuntype,
  TupleRuntype,
  AllOfRuntype,
  AnyOfRuntype,
  ArrayRuntype,
  AnyOfDiscriminatedRuntype,
  ObjectRuntype,
  OptionalFieldRuntype,
  BaseRefRuntype,
  registerStringFormatter,
  registerNumberFormatter,
  buildParserFromRuntype,
  generateHashFromString,
  TypedArrayRuntype,
  MapRuntype,
  SetRuntype,
} from "@beff/client/codegen-v2";

class RefRuntype extends BaseRefRuntype  {
  getNamedRuntypes() {
    return namedRuntypes;
  }
}

const buildParsers = (args) => {
  const stringFormats = args?.stringFormats ?? {};
  for (const k of RequiredStringFormats) {
    if (stringFormats[k] == null) {
      throw new Error(`Missing custom format ${k}`);
    }
  }
  Object.keys(stringFormats).forEach((k) => {
    const v = stringFormats[k];
    registerStringFormatter(k, v);
  });
  const numberFormats = args?.numberFormats ?? {};
  for (const k of RequiredNumberFormats) {
    if (numberFormats[k] == null) {
      throw new Error(`Missing custom format ${k}`);
    }
  }
  Object.keys(numberFormats).forEach((k) => {
    const v = numberFormats[k];
    registerNumberFormatter(k, v);
  });
  let acc = {};
  for (const k of Object.keys(buildParsersInput)) {
    const it = buildParserFromRuntype(buildParsersInput[k], k, false);
    acc[k] = it;
  }
  return acc;
};

const RequiredStringFormats = ["ValidCurrency","CompactId","JsdocReusableToken"];
const RequiredNumberFormats = [];
const direct_hoist_0 = new TypeofRuntype(undefined, "string");
const direct_hoist_1 = new TypeofRuntype(undefined, "number");
const direct_hoist_2 = new TypeofRuntype(undefined, "boolean");
const direct_hoist_3 = new NullishRuntype(undefined, "null");
const direct_hoist_4 = new NullishRuntype(undefined, "undefined");
const direct_hoist_5 = new AnyRuntype(undefined);
const direct_hoist_6 = new AnyOfRuntype(undefined, [
    direct_hoist_0,
    direct_hoist_1
]);
const direct_hoist_7 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_6,
        "value": direct_hoist_5
    }
]);
const direct_hoist_8 = new ArrayRuntype(undefined, direct_hoist_5);
const direct_hoist_9 = new RefRuntype(undefined, "T1");
const direct_hoist_10 = new RefRuntype(undefined, "DocumentedPayload");
const direct_hoist_11 = new RefRuntype(undefined, "DocumentedResult");
const direct_hoist_12 = new RefRuntype(undefined, "JsdocSingleLineAlias");
const direct_hoist_13 = new RefRuntype(undefined, "JsdocMultilineObject");
const direct_hoist_14 = new RefRuntype(undefined, "JsdocMemberOnlyObject");
const direct_hoist_15 = new RefRuntype(undefined, "JsdocNestedObject");
const direct_hoist_16 = new RefRuntype(undefined, "JsdocReferencesDocumentedAlias");
const direct_hoist_17 = new RefRuntype(undefined, "JsdocUnionVariant");
const direct_hoist_18 = new RefRuntype(undefined, "JsdocIgnoredCommentObject");
const direct_hoist_19 = new RefRuntype(undefined, "JsdocAfterUnrelatedValue");
const direct_hoist_20 = new RefRuntype(undefined, "T2");
const direct_hoist_21 = new RefRuntype(undefined, "T3");
const direct_hoist_22 = new RefRuntype(undefined, "InvalidSchemaWithDate");
const direct_hoist_23 = new RefRuntype(undefined, "InvalidSchemaWithBigInt");
const direct_hoist_24 = new RefRuntype(undefined, "DiscriminatedUnion");
const direct_hoist_25 = new RefRuntype(undefined, "RecursiveTree");
const direct_hoist_26 = new RefRuntype(undefined, "SemVer");
const direct_hoist_27 = new RefRuntype(undefined, "NonEmptyString");
const direct_hoist_28 = new RefRuntype(undefined, "ValidCurrency");
const direct_hoist_29 = new RefRuntype(undefined, "DocumentedSearchInput");
const direct_hoist_30 = new RefRuntype(undefined, "HierarchySelection");
const direct_hoist_31 = new RefRuntype(undefined, "ReusesRef");
const direct_hoist_32 = new RefRuntype(undefined, "UsesGenericWrapper");
const direct_hoist_33 = new RefRuntype(undefined, "StringWrapped");
const direct_hoist_34 = new RefRuntype(undefined, "NumberWrapped");
const direct_hoist_35 = new RefRuntype(undefined, "UsesWrappeds");
const direct_hoist_36 = new RefRuntype(undefined, "UsesWrappedsComplex");
const direct_hoist_37 = new RefRuntype(undefined, "UsesWrappedsComplexRef");
const direct_hoist_38 = new ObjectRuntype(undefined, {
    "a": direct_hoist_2
}, []);
const direct_hoist_39 = new StringWithFormatRuntype({
    "description": "CompactId represents a formatted identifier\nwhile keeping generated schemas small."
}, [
    "CompactId"
]);
const direct_hoist_40 = new ObjectRuntype(undefined, {
    "value": direct_hoist_2
}, []);
const direct_hoist_41 = new ObjectRuntype(undefined, {
    "value": direct_hoist_0
}, []);
const direct_hoist_42 = new ObjectRuntype(undefined, {
    "value": direct_hoist_1
}, []);
const direct_hoist_43 = new ObjectRuntype(undefined, {
    "value": direct_hoist_38
}, []);
const direct_hoist_44 = new RefRuntype(undefined, "ABool");
const direct_hoist_45 = new ObjectRuntype(undefined, {
    "value": direct_hoist_44
}, []);
const direct_hoist_46 = new ConstRuntype(undefined, "a1");
const direct_hoist_47 = new ConstRuntype(undefined, "a");
const direct_hoist_48 = new ObjectRuntype(undefined, {
    "a1": direct_hoist_0,
    "a11": new OptionalFieldRuntype(direct_hoist_0),
    "subType": direct_hoist_46,
    "type": direct_hoist_47
}, []);
const direct_hoist_49 = new ConstRuntype(undefined, "a2");
const direct_hoist_50 = new ObjectRuntype(undefined, {
    "a2": direct_hoist_0,
    "subType": direct_hoist_49,
    "type": direct_hoist_47
}, []);
const direct_hoist_51 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_48,
    direct_hoist_50
], "subType", {
    "a1": direct_hoist_48,
    "a2": direct_hoist_50
}, {
    "a1": direct_hoist_48,
    "a2": direct_hoist_50
});
const direct_hoist_52 = new ConstRuntype(undefined, "b");
const direct_hoist_53 = new ObjectRuntype(undefined, {
    "type": direct_hoist_52,
    "value": direct_hoist_1
}, []);
const direct_hoist_54 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_48,
    direct_hoist_50,
    direct_hoist_53
], "type", {
    "a": direct_hoist_51,
    "b": direct_hoist_53
}, {
    "a": direct_hoist_51,
    "b": direct_hoist_53
});
const direct_hoist_55 = new TypeofRuntype({
    "description": "Stable payload id."
}, "string");
const direct_hoist_56 = new TypeofRuntype({
    "description": "Optional retry count."
}, "number");
const direct_hoist_57 = new ObjectRuntype({
    "description": "Documented payload for TypeScript descriptions."
}, {
    "id": direct_hoist_55,
    "retries": new OptionalFieldRuntype(direct_hoist_56)
}, []);
const direct_hoist_58 = new AnyOfRuntype({
    "description": "Optional display label."
}, [
    direct_hoist_3,
    direct_hoist_0
]);
const direct_hoist_59 = new TypeofRuntype({
    "description": "Stable lookup key."
}, "string");
const direct_hoist_60 = new ObjectRuntype({
    "description": "Documented result with nullable and required fields."
}, {
    "alpha": direct_hoist_58,
    "beta": direct_hoist_59
}, []);
const direct_hoist_61 = new AnyOfRuntype({
    "description": "Optional numeric cursor for paged lookup."
}, [
    direct_hoist_4,
    direct_hoist_1
]);
const direct_hoist_62 = new RefRuntype(undefined, "CompactId");
const direct_hoist_63 = new ObjectRuntype(undefined, {
    "cursor": direct_hoist_61,
    "item": direct_hoist_62
}, []);
const direct_hoist_64 = new RefRuntype(undefined, "GenericWrapper_string");
const direct_hoist_65 = new AnyOfRuntype(undefined, [
    direct_hoist_2,
    direct_hoist_0
]);
const direct_hoist_66 = new ObjectRuntype(undefined, {
    "other": direct_hoist_64,
    "value": direct_hoist_0,
    "value2": direct_hoist_65
}, []);
const direct_hoist_67 = new RefRuntype(undefined, "GenericWrapper_number");
const direct_hoist_68 = new AnyOfRuntype(undefined, [
    direct_hoist_2,
    direct_hoist_1
]);
const direct_hoist_69 = new ObjectRuntype(undefined, {
    "other": direct_hoist_67,
    "value": direct_hoist_1,
    "value2": direct_hoist_68
}, []);
const direct_hoist_70 = new ConstRuntype(undefined, "entityId");
const direct_hoist_71 = new RefRuntype(undefined, "EntityId");
const direct_hoist_72 = new ObjectRuntype({
    "description": "A selectable hierarchy entry that resolves to a list of target entities."
}, {
    "_tag": direct_hoist_70,
    "entityId": direct_hoist_71
}, []);
const direct_hoist_73 = new BigIntRuntype(undefined);
const direct_hoist_74 = new ObjectRuntype(undefined, {
    "x": direct_hoist_73
}, []);
const direct_hoist_75 = new DateRuntype(undefined);
const direct_hoist_76 = new ObjectRuntype(undefined, {
    "x": direct_hoist_75
}, []);
const direct_hoist_77 = new ObjectRuntype(undefined, {
    "line": direct_hoist_1,
    "plain": direct_hoist_0
}, []);
const direct_hoist_78 = new AnyOfRuntype({
    "description": "Nullable first field."
}, [
    direct_hoist_3,
    direct_hoist_0
]);
const direct_hoist_79 = new TypeofRuntype({
    "description": "Required second field."
}, "string");
const direct_hoist_80 = new TypeofRuntype({
    "description": "Optional third field."
}, "number");
const direct_hoist_81 = new ObjectRuntype(undefined, {
    "alpha": direct_hoist_78,
    "beta": direct_hoist_79,
    "gamma": new OptionalFieldRuntype(direct_hoist_80)
}, []);
const direct_hoist_82 = new TypeofRuntype({
    "description": "First documented field."
}, "string");
const direct_hoist_83 = new TypeofRuntype({
    "description": "Second documented field."
}, "number");
const direct_hoist_84 = new ObjectRuntype({
    "description": "Anonymous multiline object.\n\nKeeps an intentional blank line."
}, {
    "first": direct_hoist_82,
    "second": direct_hoist_83
}, []);
const direct_hoist_85 = new TypeofRuntype({
    "description": "Inner enabled flag."
}, "boolean");
const direct_hoist_86 = new ObjectRuntype({
    "description": "Nested value."
}, {
    "enabled": direct_hoist_85
}, []);
const direct_hoist_87 = new ObjectRuntype(undefined, {
    "nested": direct_hoist_86
}, []);
const direct_hoist_88 = new RefRuntype(undefined, "JsdocReusableToken");
const direct_hoist_89 = new ObjectRuntype(undefined, {
    "token": direct_hoist_88
}, []);
const direct_hoist_90 = new StringWithFormatRuntype({
    "description": "Reusable documented token."
}, [
    "JsdocReusableToken"
]);
const direct_hoist_91 = new TypeofRuntype({
    "description": "Anonymous single-line alias."
}, "string");
const direct_hoist_92 = new ConstRuntype(undefined, "left");
const direct_hoist_93 = new TypeofRuntype({
    "description": "Left variant value."
}, "string");
const direct_hoist_94 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_92,
    "value": direct_hoist_93
}, []);
const direct_hoist_95 = new TypeofRuntype({
    "description": "Right variant count."
}, "number");
const direct_hoist_96 = new ConstRuntype(undefined, "right");
const direct_hoist_97 = new ObjectRuntype(undefined, {
    "count": direct_hoist_95,
    "kind": direct_hoist_96
}, []);
const direct_hoist_98 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_97,
    direct_hoist_94
], "kind", {
    "left": direct_hoist_94,
    "right": direct_hoist_97
}, {
    "left": direct_hoist_94,
    "right": direct_hoist_97
});
const direct_hoist_99 = new TupleRuntype(undefined, [
    direct_hoist_0
], direct_hoist_0);
const direct_hoist_100 = new RefRuntype(undefined, "DataWrapper_number");
const direct_hoist_101 = new ArrayRuntype(undefined, direct_hoist_25);
const direct_hoist_102 = new ObjectRuntype(undefined, {
    "children": direct_hoist_101,
    "value": direct_hoist_1
}, []);
const direct_hoist_103 = new ObjectRuntype(undefined, {
    "a": direct_hoist_21,
    "b": direct_hoist_21
}, []);
const direct_hoist_104 = new RegexRuntype(undefined, /(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "`${number}.${number}.${number}`");
const direct_hoist_105 = new RefRuntype(undefined, "DataWrapper_string");
const direct_hoist_106 = new ObjectRuntype(undefined, {
    "a": direct_hoist_0,
    "b": direct_hoist_1
}, []);
const direct_hoist_107 = new ObjectRuntype(undefined, {
    "t1": direct_hoist_9
}, []);
const direct_hoist_108 = new ArrayRuntype(undefined, direct_hoist_20);
const direct_hoist_109 = new ObjectRuntype(undefined, {
    "t2Array": direct_hoist_108
}, []);
const direct_hoist_110 = new ObjectRuntype(undefined, {
    "wrappedNumber": direct_hoist_67,
    "wrappedString": direct_hoist_64
}, []);
const direct_hoist_111 = new RefRuntype(undefined, "DataWrapper_boolean");
const direct_hoist_112 = new ObjectRuntype(undefined, {
    "x1": direct_hoist_33,
    "x2": direct_hoist_34,
    "x3": direct_hoist_111,
    "x4": direct_hoist_33,
    "x5": direct_hoist_34,
    "x6": direct_hoist_111
}, []);
const direct_hoist_113 = new RefRuntype(undefined, "DataWrapper_instance_5");
const direct_hoist_114 = new ObjectRuntype(undefined, {
    "x3": direct_hoist_113,
    "x6": direct_hoist_113
}, []);
const direct_hoist_115 = new RefRuntype(undefined, "DataWrapper_ABool");
const direct_hoist_116 = new ObjectRuntype(undefined, {
    "x3": direct_hoist_115,
    "x6": direct_hoist_115
}, []);
const direct_hoist_117 = new StringWithFormatRuntype(undefined, [
    "ValidCurrency"
]);
const namedRuntypes = {
    "ABool": direct_hoist_38,
    "CompactId": direct_hoist_39,
    "DataWrapper_boolean": direct_hoist_40,
    "DataWrapper_string": direct_hoist_41,
    "DataWrapper_number": direct_hoist_42,
    "DataWrapper_instance_5": direct_hoist_43,
    "DataWrapper_ABool": direct_hoist_45,
    "DiscriminatedUnion": direct_hoist_54,
    "DocumentedPayload": direct_hoist_57,
    "DocumentedResult": direct_hoist_60,
    "DocumentedSearchInput": direct_hoist_63,
    "EntityId": direct_hoist_0,
    "GenericWrapper_string": direct_hoist_66,
    "GenericWrapper_number": direct_hoist_69,
    "HierarchySelection": direct_hoist_72,
    "InvalidSchemaWithBigInt": direct_hoist_74,
    "InvalidSchemaWithDate": direct_hoist_76,
    "JsdocAfterUnrelatedValue": direct_hoist_0,
    "JsdocIgnoredCommentObject": direct_hoist_77,
    "JsdocMemberOnlyObject": direct_hoist_81,
    "JsdocMultilineObject": direct_hoist_84,
    "JsdocNestedObject": direct_hoist_87,
    "JsdocReferencesDocumentedAlias": direct_hoist_89,
    "JsdocReusableToken": direct_hoist_90,
    "JsdocSingleLineAlias": direct_hoist_91,
    "JsdocUnionVariant": direct_hoist_98,
    "NonEmptyString": direct_hoist_99,
    "NumberWrapped": direct_hoist_100,
    "RecursiveTree": direct_hoist_102,
    "ReusesRef": direct_hoist_103,
    "SemVer": direct_hoist_104,
    "StringWrapped": direct_hoist_105,
    "T1": direct_hoist_106,
    "T2": direct_hoist_107,
    "T3": direct_hoist_109,
    "UsesGenericWrapper": direct_hoist_110,
    "UsesWrappeds": direct_hoist_112,
    "UsesWrappedsComplex": direct_hoist_114,
    "UsesWrappedsComplexRef": direct_hoist_116,
    "ValidCurrency": direct_hoist_117
};
const buildParsersInput = {
    "string": direct_hoist_0,
    "number": direct_hoist_1,
    "boolean": direct_hoist_2,
    "null": direct_hoist_3,
    "undefined": direct_hoist_4,
    "object": direct_hoist_7,
    "anyArray": direct_hoist_8,
    "any": direct_hoist_5,
    "T1": direct_hoist_9,
    "DocumentedPayload": direct_hoist_10,
    "DocumentedResult": direct_hoist_11,
    "JsdocSingleLineAlias": direct_hoist_12,
    "JsdocMultilineObject": direct_hoist_13,
    "JsdocMemberOnlyObject": direct_hoist_14,
    "JsdocNestedObject": direct_hoist_15,
    "JsdocReferencesDocumentedAlias": direct_hoist_16,
    "JsdocUnionVariant": direct_hoist_17,
    "JsdocIgnoredCommentObject": direct_hoist_18,
    "JsdocAfterUnrelatedValue": direct_hoist_19,
    "T2": direct_hoist_20,
    "T3": direct_hoist_21,
    "InvalidSchemaWithDate": direct_hoist_22,
    "InvalidSchemaWithBigInt": direct_hoist_23,
    "DiscriminatedUnion": direct_hoist_24,
    "RecursiveTree": direct_hoist_25,
    "SemVer": direct_hoist_26,
    "NonEmptyString": direct_hoist_27,
    "ValidCurrency": direct_hoist_28,
    "DocumentedSearchInput": direct_hoist_29,
    "HierarchySelection": direct_hoist_30,
    "ReusesRef": direct_hoist_31,
    "UsesGenericWrapper": direct_hoist_32,
    "StringWrapped": direct_hoist_33,
    "NumberWrapped": direct_hoist_34,
    "UsesWrappeds": direct_hoist_35,
    "UsesWrappedsComplex": direct_hoist_36,
    "UsesWrappedsComplexRef": direct_hoist_37
};

export default { buildParsers };