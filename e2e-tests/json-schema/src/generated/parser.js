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
const direct_hoist_10 = new RefRuntype(undefined, "T2");
const direct_hoist_11 = new RefRuntype(undefined, "T3");
const direct_hoist_12 = new RefRuntype(undefined, "InvalidSchemaWithDate");
const direct_hoist_13 = new RefRuntype(undefined, "InvalidSchemaWithBigInt");
const direct_hoist_14 = new RefRuntype(undefined, "DiscriminatedUnion");
const direct_hoist_15 = new RefRuntype(undefined, "RecursiveTree");
const direct_hoist_16 = new RefRuntype(undefined, "SemVer");
const direct_hoist_17 = new RefRuntype(undefined, "NonEmptyString");
const direct_hoist_18 = new RefRuntype(undefined, "ValidCurrency");
const direct_hoist_19 = new RefRuntype(undefined, "EmptyClosedRecord");
const direct_hoist_20 = new RefRuntype(undefined, "OptionalNullishInput");
const direct_hoist_21 = new RefRuntype(undefined, "ToolInput");
const direct_hoist_22 = new ConstRuntype(undefined, "a1");
const direct_hoist_23 = new ConstRuntype(undefined, "a");
const direct_hoist_24 = new ObjectRuntype(undefined, {
    "a1": direct_hoist_0,
    "a11": new OptionalFieldRuntype(direct_hoist_0),
    "subType": direct_hoist_22,
    "type": direct_hoist_23
}, []);
const direct_hoist_25 = new ConstRuntype(undefined, "a2");
const direct_hoist_26 = new ObjectRuntype(undefined, {
    "a2": direct_hoist_0,
    "subType": direct_hoist_25,
    "type": direct_hoist_23
}, []);
const direct_hoist_27 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_24,
    direct_hoist_26
], "subType", {
    "a1": direct_hoist_24,
    "a2": direct_hoist_26
}, {
    "a1": direct_hoist_24,
    "a2": direct_hoist_26
});
const direct_hoist_28 = new ConstRuntype(undefined, "b");
const direct_hoist_29 = new ObjectRuntype(undefined, {
    "type": direct_hoist_28,
    "value": direct_hoist_1
}, []);
const direct_hoist_30 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_24,
    direct_hoist_26,
    direct_hoist_29
], "type", {
    "a": direct_hoist_27,
    "b": direct_hoist_29
}, {
    "a": direct_hoist_27,
    "b": direct_hoist_29
});
const direct_hoist_31 = new NeverRuntype(undefined);
const direct_hoist_32 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_0,
        "value": direct_hoist_31
    }
]);
const direct_hoist_33 = new BigIntRuntype(undefined);
const direct_hoist_34 = new ObjectRuntype(undefined, {
    "x": direct_hoist_33
}, []);
const direct_hoist_35 = new DateRuntype(undefined);
const direct_hoist_36 = new ObjectRuntype(undefined, {
    "x": direct_hoist_35
}, []);
const direct_hoist_37 = new TupleRuntype(undefined, [
    direct_hoist_0
], direct_hoist_0);
const direct_hoist_38 = new AnyOfRuntype(undefined, [
    direct_hoist_3,
    direct_hoist_4,
    direct_hoist_1
]);
const direct_hoist_39 = new AnyOfRuntype(undefined, [
    direct_hoist_3,
    direct_hoist_4,
    direct_hoist_0
]);
const direct_hoist_40 = new ObjectRuntype(undefined, {
    "limit": new OptionalFieldRuntype(direct_hoist_38),
    "value": new OptionalFieldRuntype(direct_hoist_39)
}, []);
const direct_hoist_41 = new ArrayRuntype(undefined, direct_hoist_15);
const direct_hoist_42 = new ObjectRuntype(undefined, {
    "children": direct_hoist_41,
    "value": direct_hoist_1
}, []);
const direct_hoist_43 = new RegexRuntype(undefined, /(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "`${number}.${number}.${number}`");
const direct_hoist_44 = new ObjectRuntype(undefined, {
    "a": direct_hoist_0,
    "b": direct_hoist_1
}, []);
const direct_hoist_45 = new ObjectRuntype(undefined, {
    "t1": direct_hoist_9
}, []);
const direct_hoist_46 = new ArrayRuntype(undefined, direct_hoist_10);
const direct_hoist_47 = new ObjectRuntype(undefined, {
    "t2Array": direct_hoist_46
}, []);
const direct_hoist_48 = new ConstRuntype(undefined, "stock_picker");
const direct_hoist_49 = new ObjectRuntype(undefined, {
    "key": direct_hoist_48
}, []);
const direct_hoist_50 = new RefRuntype(undefined, "ToolEnvelope");
const direct_hoist_51 = new RefRuntype(undefined, "WorkflowInput");
const direct_hoist_52 = new AllOfRuntype(undefined, [
    direct_hoist_50,
    direct_hoist_51
]);
const direct_hoist_53 = new StringWithFormatRuntype(undefined, [
    "ValidCurrency"
]);
const direct_hoist_54 = new ObjectRuntype(undefined, {
    "evaluationEndDate": direct_hoist_0,
    "evaluationStartDate": direct_hoist_0,
    "optionalNote": new OptionalFieldRuntype(direct_hoist_0),
    "trainingEndDate": direct_hoist_0
}, []);
const namedRuntypes = {
    "DiscriminatedUnion": direct_hoist_30,
    "EmptyClosedRecord": direct_hoist_32,
    "InvalidSchemaWithBigInt": direct_hoist_34,
    "InvalidSchemaWithDate": direct_hoist_36,
    "NonEmptyString": direct_hoist_37,
    "OptionalNullishInput": direct_hoist_40,
    "RecursiveTree": direct_hoist_42,
    "SemVer": direct_hoist_43,
    "T1": direct_hoist_44,
    "T2": direct_hoist_45,
    "T3": direct_hoist_47,
    "ToolEnvelope": direct_hoist_49,
    "ToolInput": direct_hoist_52,
    "ValidCurrency": direct_hoist_53,
    "WorkflowInput": direct_hoist_54
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
    "EmptyClosedRecord": direct_hoist_19,
    "OptionalNullishInput": direct_hoist_20,
    "ToolInput": direct_hoist_21
};

exports.default = { buildParsers };