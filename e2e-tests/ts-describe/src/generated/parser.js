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

const RequiredStringFormats = ["ValidCurrency","CompactId"];
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
const direct_hoist_11 = new RefRuntype(undefined, "T2");
const direct_hoist_12 = new RefRuntype(undefined, "T3");
const direct_hoist_13 = new RefRuntype(undefined, "InvalidSchemaWithDate");
const direct_hoist_14 = new RefRuntype(undefined, "InvalidSchemaWithBigInt");
const direct_hoist_15 = new RefRuntype(undefined, "DiscriminatedUnion");
const direct_hoist_16 = new RefRuntype(undefined, "RecursiveTree");
const direct_hoist_17 = new RefRuntype(undefined, "SemVer");
const direct_hoist_18 = new RefRuntype(undefined, "NonEmptyString");
const direct_hoist_19 = new RefRuntype(undefined, "ValidCurrency");
const direct_hoist_20 = new RefRuntype(undefined, "DocumentedSearchInput");
const direct_hoist_21 = new RefRuntype(undefined, "HierarchySelection");
const direct_hoist_22 = new RefRuntype(undefined, "ReusesRef");
const direct_hoist_23 = new RefRuntype(undefined, "UsesGenericWrapper");
const direct_hoist_24 = new RefRuntype(undefined, "StringWrapped");
const direct_hoist_25 = new RefRuntype(undefined, "NumberWrapped");
const direct_hoist_26 = new RefRuntype(undefined, "UsesWrappeds");
const direct_hoist_27 = new RefRuntype(undefined, "UsesWrappedsComplex");
const direct_hoist_28 = new RefRuntype(undefined, "UsesWrappedsComplexRef");
const direct_hoist_29 = new ObjectRuntype(undefined, {
    "a": direct_hoist_2
}, []);
const direct_hoist_30 = new StringWithFormatRuntype({
    "description": "CompactId represents a formatted identifier\nwhile keeping generated schemas small."
}, [
    "CompactId"
]);
const direct_hoist_31 = new ObjectRuntype(undefined, {
    "value": direct_hoist_2
}, []);
const direct_hoist_32 = new ObjectRuntype(undefined, {
    "value": direct_hoist_0
}, []);
const direct_hoist_33 = new ObjectRuntype(undefined, {
    "value": direct_hoist_1
}, []);
const direct_hoist_34 = new ObjectRuntype(undefined, {
    "value": direct_hoist_29
}, []);
const direct_hoist_35 = new RefRuntype(undefined, "ABool");
const direct_hoist_36 = new ObjectRuntype(undefined, {
    "value": direct_hoist_35
}, []);
const direct_hoist_37 = new ConstRuntype(undefined, "a1");
const direct_hoist_38 = new ConstRuntype(undefined, "a");
const direct_hoist_39 = new ObjectRuntype(undefined, {
    "a1": direct_hoist_0,
    "a11": new OptionalFieldRuntype(direct_hoist_0),
    "subType": direct_hoist_37,
    "type": direct_hoist_38
}, []);
const direct_hoist_40 = new ConstRuntype(undefined, "a2");
const direct_hoist_41 = new ObjectRuntype(undefined, {
    "a2": direct_hoist_0,
    "subType": direct_hoist_40,
    "type": direct_hoist_38
}, []);
const direct_hoist_42 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_39,
    direct_hoist_41
], "subType", {
    "a1": direct_hoist_39,
    "a2": direct_hoist_41
}, {
    "a1": direct_hoist_39,
    "a2": direct_hoist_41
});
const direct_hoist_43 = new ConstRuntype(undefined, "b");
const direct_hoist_44 = new ObjectRuntype(undefined, {
    "type": direct_hoist_43,
    "value": direct_hoist_1
}, []);
const direct_hoist_45 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_39,
    direct_hoist_41,
    direct_hoist_44
], "type", {
    "a": direct_hoist_42,
    "b": direct_hoist_44
}, {
    "a": direct_hoist_42,
    "b": direct_hoist_44
});
const direct_hoist_46 = new TypeofRuntype({
    "description": "Stable payload id."
}, "string");
const direct_hoist_47 = new TypeofRuntype({
    "description": "Optional retry count."
}, "number");
const direct_hoist_48 = new ObjectRuntype({
    "description": "Documented payload for TypeScript descriptions."
}, {
    "id": direct_hoist_46,
    "retries": new OptionalFieldRuntype(direct_hoist_47)
}, []);
const direct_hoist_49 = new AnyOfRuntype({
    "description": "Optional numeric cursor for paged lookup."
}, [
    direct_hoist_4,
    direct_hoist_1
]);
const direct_hoist_50 = new RefRuntype(undefined, "CompactId");
const direct_hoist_51 = new ObjectRuntype(undefined, {
    "cursor": direct_hoist_49,
    "item": direct_hoist_50
}, []);
const direct_hoist_52 = new RefRuntype(undefined, "GenericWrapper_string");
const direct_hoist_53 = new AnyOfRuntype(undefined, [
    direct_hoist_2,
    direct_hoist_0
]);
const direct_hoist_54 = new ObjectRuntype(undefined, {
    "other": direct_hoist_52,
    "value": direct_hoist_0,
    "value2": direct_hoist_53
}, []);
const direct_hoist_55 = new RefRuntype(undefined, "GenericWrapper_number");
const direct_hoist_56 = new AnyOfRuntype(undefined, [
    direct_hoist_2,
    direct_hoist_1
]);
const direct_hoist_57 = new ObjectRuntype(undefined, {
    "other": direct_hoist_55,
    "value": direct_hoist_1,
    "value2": direct_hoist_56
}, []);
const direct_hoist_58 = new ConstRuntype(undefined, "entityId");
const direct_hoist_59 = new RefRuntype(undefined, "EntityId");
const direct_hoist_60 = new ObjectRuntype({
    "description": "A selectable hierarchy entry that resolves to a list of target entities."
}, {
    "_tag": direct_hoist_58,
    "entityId": direct_hoist_59
}, []);
const direct_hoist_61 = new BigIntRuntype(undefined);
const direct_hoist_62 = new ObjectRuntype(undefined, {
    "x": direct_hoist_61
}, []);
const direct_hoist_63 = new DateRuntype(undefined);
const direct_hoist_64 = new ObjectRuntype(undefined, {
    "x": direct_hoist_63
}, []);
const direct_hoist_65 = new TupleRuntype(undefined, [
    direct_hoist_0
], direct_hoist_0);
const direct_hoist_66 = new RefRuntype(undefined, "DataWrapper_number");
const direct_hoist_67 = new ArrayRuntype(undefined, direct_hoist_16);
const direct_hoist_68 = new ObjectRuntype(undefined, {
    "children": direct_hoist_67,
    "value": direct_hoist_1
}, []);
const direct_hoist_69 = new ObjectRuntype(undefined, {
    "a": direct_hoist_12,
    "b": direct_hoist_12
}, []);
const direct_hoist_70 = new RegexRuntype(undefined, /(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "`${number}.${number}.${number}`");
const direct_hoist_71 = new RefRuntype(undefined, "DataWrapper_string");
const direct_hoist_72 = new ObjectRuntype(undefined, {
    "a": direct_hoist_0,
    "b": direct_hoist_1
}, []);
const direct_hoist_73 = new ObjectRuntype(undefined, {
    "t1": direct_hoist_9
}, []);
const direct_hoist_74 = new ArrayRuntype(undefined, direct_hoist_11);
const direct_hoist_75 = new ObjectRuntype(undefined, {
    "t2Array": direct_hoist_74
}, []);
const direct_hoist_76 = new ObjectRuntype(undefined, {
    "wrappedNumber": direct_hoist_55,
    "wrappedString": direct_hoist_52
}, []);
const direct_hoist_77 = new RefRuntype(undefined, "DataWrapper_boolean");
const direct_hoist_78 = new ObjectRuntype(undefined, {
    "x1": direct_hoist_24,
    "x2": direct_hoist_25,
    "x3": direct_hoist_77,
    "x4": direct_hoist_24,
    "x5": direct_hoist_25,
    "x6": direct_hoist_77
}, []);
const direct_hoist_79 = new RefRuntype(undefined, "DataWrapper_instance_5");
const direct_hoist_80 = new ObjectRuntype(undefined, {
    "x3": direct_hoist_79,
    "x6": direct_hoist_79
}, []);
const direct_hoist_81 = new RefRuntype(undefined, "DataWrapper_ABool");
const direct_hoist_82 = new ObjectRuntype(undefined, {
    "x3": direct_hoist_81,
    "x6": direct_hoist_81
}, []);
const direct_hoist_83 = new StringWithFormatRuntype(undefined, [
    "ValidCurrency"
]);
const namedRuntypes = {
    "ABool": direct_hoist_29,
    "CompactId": direct_hoist_30,
    "DataWrapper_boolean": direct_hoist_31,
    "DataWrapper_string": direct_hoist_32,
    "DataWrapper_number": direct_hoist_33,
    "DataWrapper_instance_5": direct_hoist_34,
    "DataWrapper_ABool": direct_hoist_36,
    "DiscriminatedUnion": direct_hoist_45,
    "DocumentedPayload": direct_hoist_48,
    "DocumentedSearchInput": direct_hoist_51,
    "EntityId": direct_hoist_0,
    "GenericWrapper_string": direct_hoist_54,
    "GenericWrapper_number": direct_hoist_57,
    "HierarchySelection": direct_hoist_60,
    "InvalidSchemaWithBigInt": direct_hoist_62,
    "InvalidSchemaWithDate": direct_hoist_64,
    "NonEmptyString": direct_hoist_65,
    "NumberWrapped": direct_hoist_66,
    "RecursiveTree": direct_hoist_68,
    "ReusesRef": direct_hoist_69,
    "SemVer": direct_hoist_70,
    "StringWrapped": direct_hoist_71,
    "T1": direct_hoist_72,
    "T2": direct_hoist_73,
    "T3": direct_hoist_75,
    "UsesGenericWrapper": direct_hoist_76,
    "UsesWrappeds": direct_hoist_78,
    "UsesWrappedsComplex": direct_hoist_80,
    "UsesWrappedsComplexRef": direct_hoist_82,
    "ValidCurrency": direct_hoist_83
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
    "T2": direct_hoist_11,
    "T3": direct_hoist_12,
    "InvalidSchemaWithDate": direct_hoist_13,
    "InvalidSchemaWithBigInt": direct_hoist_14,
    "DiscriminatedUnion": direct_hoist_15,
    "RecursiveTree": direct_hoist_16,
    "SemVer": direct_hoist_17,
    "NonEmptyString": direct_hoist_18,
    "ValidCurrency": direct_hoist_19,
    "DocumentedSearchInput": direct_hoist_20,
    "HierarchySelection": direct_hoist_21,
    "ReusesRef": direct_hoist_22,
    "UsesGenericWrapper": direct_hoist_23,
    "StringWrapped": direct_hoist_24,
    "NumberWrapped": direct_hoist_25,
    "UsesWrappeds": direct_hoist_26,
    "UsesWrappedsComplex": direct_hoist_27,
    "UsesWrappedsComplexRef": direct_hoist_28
};

export default { buildParsers };