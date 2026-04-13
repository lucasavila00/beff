//@ts-nocheck

Object.defineProperty(exports, "__esModule", {
  value: true
});
    
"use strict";

const {
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
} = require("@beff/client/codegen-v2");

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
const direct_hoist_0 = new TypeofRuntype("string");
const direct_hoist_1 = new TypeofRuntype("number");
const direct_hoist_2 = new TypeofRuntype("boolean");
const direct_hoist_3 = new NullishRuntype("null");
const direct_hoist_4 = new NullishRuntype("undefined");
const direct_hoist_5 = new AnyRuntype();
const direct_hoist_6 = new AnyOfRuntype([
    direct_hoist_0,
    direct_hoist_1
]);
const direct_hoist_7 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_6,
        "value": direct_hoist_5
    }
]);
const direct_hoist_8 = new ArrayRuntype(direct_hoist_5);
const direct_hoist_9 = new RefRuntype("T1");
const direct_hoist_10 = new RefRuntype("T2");
const direct_hoist_11 = new RefRuntype("T3");
const direct_hoist_12 = new RefRuntype("InvalidSchemaWithDate");
const direct_hoist_13 = new RefRuntype("InvalidSchemaWithBigInt");
const direct_hoist_14 = new RefRuntype("DiscriminatedUnion");
const direct_hoist_15 = new RefRuntype("RecursiveTree");
const direct_hoist_16 = new RefRuntype("SemVer");
const direct_hoist_17 = new RefRuntype("NonEmptyString");
const direct_hoist_18 = new RefRuntype("ValidCurrency");
const direct_hoist_19 = new RefRuntype("EmptyClosedRecord");
const direct_hoist_20 = new ConstRuntype("a1");
const direct_hoist_21 = new ConstRuntype("a");
const direct_hoist_22 = new ObjectRuntype({
    "a1": direct_hoist_0,
    "a11": new OptionalFieldRuntype(direct_hoist_0),
    "subType": direct_hoist_20,
    "type": direct_hoist_21
}, []);
const direct_hoist_23 = new ConstRuntype("a2");
const direct_hoist_24 = new ObjectRuntype({
    "a2": direct_hoist_0,
    "subType": direct_hoist_23,
    "type": direct_hoist_21
}, []);
const direct_hoist_25 = new AnyOfDiscriminatedRuntype([
    direct_hoist_22,
    direct_hoist_24
], "subType", {
    "a1": direct_hoist_22,
    "a2": direct_hoist_24
}, {
    "a1": direct_hoist_22,
    "a2": direct_hoist_24
});
const direct_hoist_26 = new ConstRuntype("b");
const direct_hoist_27 = new ObjectRuntype({
    "type": direct_hoist_26,
    "value": direct_hoist_1
}, []);
const direct_hoist_28 = new AnyOfDiscriminatedRuntype([
    direct_hoist_22,
    direct_hoist_24,
    direct_hoist_27
], "type", {
    "a": direct_hoist_25,
    "b": direct_hoist_27
}, {
    "a": direct_hoist_25,
    "b": direct_hoist_27
});
const direct_hoist_29 = new NeverRuntype();
const direct_hoist_30 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_0,
        "value": direct_hoist_29
    }
]);
const direct_hoist_31 = new BigIntRuntype();
const direct_hoist_32 = new ObjectRuntype({
    "x": direct_hoist_31
}, []);
const direct_hoist_33 = new DateRuntype();
const direct_hoist_34 = new ObjectRuntype({
    "x": direct_hoist_33
}, []);
const direct_hoist_35 = new TupleRuntype([
    direct_hoist_0
], direct_hoist_0);
const direct_hoist_36 = new ArrayRuntype(direct_hoist_15);
const direct_hoist_37 = new ObjectRuntype({
    "children": direct_hoist_36,
    "value": direct_hoist_1
}, []);
const direct_hoist_38 = new RegexRuntype(/(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "`${number}.${number}.${number}`");
const direct_hoist_39 = new ObjectRuntype({
    "a": direct_hoist_0,
    "b": direct_hoist_1
}, []);
const direct_hoist_40 = new ObjectRuntype({
    "t1": direct_hoist_9
}, []);
const direct_hoist_41 = new ArrayRuntype(direct_hoist_10);
const direct_hoist_42 = new ObjectRuntype({
    "t2Array": direct_hoist_41
}, []);
const direct_hoist_43 = new StringWithFormatRuntype([
    "ValidCurrency"
]);
const namedRuntypes = {
    "DiscriminatedUnion": direct_hoist_28,
    "EmptyClosedRecord": direct_hoist_30,
    "InvalidSchemaWithBigInt": direct_hoist_32,
    "InvalidSchemaWithDate": direct_hoist_34,
    "NonEmptyString": direct_hoist_35,
    "RecursiveTree": direct_hoist_37,
    "SemVer": direct_hoist_38,
    "T1": direct_hoist_39,
    "T2": direct_hoist_40,
    "T3": direct_hoist_42,
    "ValidCurrency": direct_hoist_43
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
    "T2": direct_hoist_10,
    "T3": direct_hoist_11,
    "InvalidSchemaWithDate": direct_hoist_12,
    "InvalidSchemaWithBigInt": direct_hoist_13,
    "DiscriminatedUnion": direct_hoist_14,
    "RecursiveTree": direct_hoist_15,
    "SemVer": direct_hoist_16,
    "NonEmptyString": direct_hoist_17,
    "ValidCurrency": direct_hoist_18,
    "EmptyClosedRecord": direct_hoist_19
};

exports.default = { buildParsers };