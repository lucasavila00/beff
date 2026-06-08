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

const RequiredStringFormats = ["ValidCurrency"];
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
const direct_hoist_20 = new RefRuntype(undefined, "ReusesRef");
const direct_hoist_21 = new RefRuntype(undefined, "UsesGenericWrapper");
const direct_hoist_22 = new RefRuntype(undefined, "StringWrapped");
const direct_hoist_23 = new RefRuntype(undefined, "NumberWrapped");
const direct_hoist_24 = new RefRuntype(undefined, "UsesWrappeds");
const direct_hoist_25 = new RefRuntype(undefined, "UsesWrappedsComplex");
const direct_hoist_26 = new RefRuntype(undefined, "UsesWrappedsComplexRef");
const direct_hoist_27 = new ObjectRuntype(undefined, {
    "a": direct_hoist_2
}, []);
const direct_hoist_28 = new ObjectRuntype(undefined, {
    "value": direct_hoist_2
}, []);
const direct_hoist_29 = new ObjectRuntype(undefined, {
    "value": direct_hoist_0
}, []);
const direct_hoist_30 = new ObjectRuntype(undefined, {
    "value": direct_hoist_1
}, []);
const direct_hoist_31 = new ObjectRuntype(undefined, {
    "value": direct_hoist_27
}, []);
const direct_hoist_32 = new RefRuntype(undefined, "ABool");
const direct_hoist_33 = new ObjectRuntype(undefined, {
    "value": direct_hoist_32
}, []);
const direct_hoist_34 = new ConstRuntype(undefined, "a1");
const direct_hoist_35 = new ConstRuntype(undefined, "a");
const direct_hoist_36 = new ObjectRuntype(undefined, {
    "a1": direct_hoist_0,
    "a11": new OptionalFieldRuntype(direct_hoist_0),
    "subType": direct_hoist_34,
    "type": direct_hoist_35
}, []);
const direct_hoist_37 = new ConstRuntype(undefined, "a2");
const direct_hoist_38 = new ObjectRuntype(undefined, {
    "a2": direct_hoist_0,
    "subType": direct_hoist_37,
    "type": direct_hoist_35
}, []);
const direct_hoist_39 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_36,
    direct_hoist_38
], "subType", {
    "a1": direct_hoist_36,
    "a2": direct_hoist_38
}, {
    "a1": direct_hoist_36,
    "a2": direct_hoist_38
});
const direct_hoist_40 = new ConstRuntype(undefined, "b");
const direct_hoist_41 = new ObjectRuntype(undefined, {
    "type": direct_hoist_40,
    "value": direct_hoist_1
}, []);
const direct_hoist_42 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_36,
    direct_hoist_38,
    direct_hoist_41
], "type", {
    "a": direct_hoist_39,
    "b": direct_hoist_41
}, {
    "a": direct_hoist_39,
    "b": direct_hoist_41
});
const direct_hoist_43 = new TypeofRuntype({
    "description": "Stable payload id."
}, "string");
const direct_hoist_44 = new TypeofRuntype({
    "description": "Optional retry count."
}, "number");
const direct_hoist_45 = new ObjectRuntype({
    "description": "Documented payload for TypeScript descriptions."
}, {
    "id": direct_hoist_43,
    "retries": new OptionalFieldRuntype(direct_hoist_44)
}, []);
const direct_hoist_46 = new RefRuntype(undefined, "GenericWrapper_string");
const direct_hoist_47 = new AnyOfRuntype(undefined, [
    direct_hoist_2,
    direct_hoist_0
]);
const direct_hoist_48 = new ObjectRuntype(undefined, {
    "other": direct_hoist_46,
    "value": direct_hoist_0,
    "value2": direct_hoist_47
}, []);
const direct_hoist_49 = new RefRuntype(undefined, "GenericWrapper_number");
const direct_hoist_50 = new AnyOfRuntype(undefined, [
    direct_hoist_2,
    direct_hoist_1
]);
const direct_hoist_51 = new ObjectRuntype(undefined, {
    "other": direct_hoist_49,
    "value": direct_hoist_1,
    "value2": direct_hoist_50
}, []);
const direct_hoist_52 = new BigIntRuntype(undefined);
const direct_hoist_53 = new ObjectRuntype(undefined, {
    "x": direct_hoist_52
}, []);
const direct_hoist_54 = new DateRuntype(undefined);
const direct_hoist_55 = new ObjectRuntype(undefined, {
    "x": direct_hoist_54
}, []);
const direct_hoist_56 = new TupleRuntype(undefined, [
    direct_hoist_0
], direct_hoist_0);
const direct_hoist_57 = new RefRuntype(undefined, "DataWrapper_number");
const direct_hoist_58 = new ArrayRuntype(undefined, direct_hoist_16);
const direct_hoist_59 = new ObjectRuntype(undefined, {
    "children": direct_hoist_58,
    "value": direct_hoist_1
}, []);
const direct_hoist_60 = new ObjectRuntype(undefined, {
    "a": direct_hoist_12,
    "b": direct_hoist_12
}, []);
const direct_hoist_61 = new RegexRuntype(undefined, /(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "`${number}.${number}.${number}`");
const direct_hoist_62 = new RefRuntype(undefined, "DataWrapper_string");
const direct_hoist_63 = new ObjectRuntype(undefined, {
    "a": direct_hoist_0,
    "b": direct_hoist_1
}, []);
const direct_hoist_64 = new ObjectRuntype(undefined, {
    "t1": direct_hoist_9
}, []);
const direct_hoist_65 = new ArrayRuntype(undefined, direct_hoist_11);
const direct_hoist_66 = new ObjectRuntype(undefined, {
    "t2Array": direct_hoist_65
}, []);
const direct_hoist_67 = new ObjectRuntype(undefined, {
    "wrappedNumber": direct_hoist_49,
    "wrappedString": direct_hoist_46
}, []);
const direct_hoist_68 = new RefRuntype(undefined, "DataWrapper_boolean");
const direct_hoist_69 = new ObjectRuntype(undefined, {
    "x1": direct_hoist_22,
    "x2": direct_hoist_23,
    "x3": direct_hoist_68,
    "x4": direct_hoist_22,
    "x5": direct_hoist_23,
    "x6": direct_hoist_68
}, []);
const direct_hoist_70 = new RefRuntype(undefined, "DataWrapper_instance_5");
const direct_hoist_71 = new ObjectRuntype(undefined, {
    "x3": direct_hoist_70,
    "x6": direct_hoist_70
}, []);
const direct_hoist_72 = new RefRuntype(undefined, "DataWrapper_ABool");
const direct_hoist_73 = new ObjectRuntype(undefined, {
    "x3": direct_hoist_72,
    "x6": direct_hoist_72
}, []);
const direct_hoist_74 = new StringWithFormatRuntype(undefined, [
    "ValidCurrency"
]);
const namedRuntypes = {
    "ABool": direct_hoist_27,
    "DataWrapper_boolean": direct_hoist_28,
    "DataWrapper_string": direct_hoist_29,
    "DataWrapper_number": direct_hoist_30,
    "DataWrapper_instance_5": direct_hoist_31,
    "DataWrapper_ABool": direct_hoist_33,
    "DiscriminatedUnion": direct_hoist_42,
    "DocumentedPayload": direct_hoist_45,
    "GenericWrapper_string": direct_hoist_48,
    "GenericWrapper_number": direct_hoist_51,
    "InvalidSchemaWithBigInt": direct_hoist_53,
    "InvalidSchemaWithDate": direct_hoist_55,
    "NonEmptyString": direct_hoist_56,
    "NumberWrapped": direct_hoist_57,
    "RecursiveTree": direct_hoist_59,
    "ReusesRef": direct_hoist_60,
    "SemVer": direct_hoist_61,
    "StringWrapped": direct_hoist_62,
    "T1": direct_hoist_63,
    "T2": direct_hoist_64,
    "T3": direct_hoist_66,
    "UsesGenericWrapper": direct_hoist_67,
    "UsesWrappeds": direct_hoist_69,
    "UsesWrappedsComplex": direct_hoist_71,
    "UsesWrappedsComplexRef": direct_hoist_73,
    "ValidCurrency": direct_hoist_74
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
    "ReusesRef": direct_hoist_20,
    "UsesGenericWrapper": direct_hoist_21,
    "StringWrapped": direct_hoist_22,
    "NumberWrapped": direct_hoist_23,
    "UsesWrappeds": direct_hoist_24,
    "UsesWrappedsComplex": direct_hoist_25,
    "UsesWrappedsComplexRef": direct_hoist_26
};

export default { buildParsers };