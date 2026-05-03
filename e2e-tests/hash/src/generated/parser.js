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
const direct_hoist_0 = new RefRuntype("StringCodec");
const direct_hoist_1 = new RefRuntype("NumberCodec");
const direct_hoist_2 = new RefRuntype("BooleanCodec");
const direct_hoist_3 = new RefRuntype("StringArrayCodec");
const direct_hoist_4 = new RefRuntype("UndefinedCodec");
const direct_hoist_5 = new RefRuntype("NullCodec");
const direct_hoist_6 = new RefRuntype("AnyCodec");
const direct_hoist_7 = new RefRuntype("UnknownCodec");
const direct_hoist_8 = new RefRuntype("VoidCodec");
const direct_hoist_9 = new RefRuntype("ObjCodec");
const direct_hoist_10 = new RefRuntype("ObjCodec2");
const direct_hoist_11 = new RefRuntype("RecursiveA");
const direct_hoist_12 = new RefRuntype("RecursiveB");
const direct_hoist_13 = new RefRuntype("MutualA1");
const direct_hoist_14 = new RefRuntype("MutualB1");
const direct_hoist_15 = new RefRuntype("MutualA2");
const direct_hoist_16 = new RefRuntype("MutualB2");
const direct_hoist_17 = new AnyRuntype();
const direct_hoist_18 = new TypeofRuntype("boolean");
const direct_hoist_19 = new TypeofRuntype("string");
const direct_hoist_20 = new ObjectRuntype({
    "next": new OptionalFieldRuntype(direct_hoist_14),
    "value": direct_hoist_19
}, []);
const direct_hoist_21 = new ObjectRuntype({
    "next": new OptionalFieldRuntype(direct_hoist_16),
    "value": direct_hoist_19
}, []);
const direct_hoist_22 = new ObjectRuntype({
    "next": new OptionalFieldRuntype(direct_hoist_13),
    "value": direct_hoist_19
}, []);
const direct_hoist_23 = new ObjectRuntype({
    "next": new OptionalFieldRuntype(direct_hoist_15),
    "value": direct_hoist_19
}, []);
const direct_hoist_24 = new NullishRuntype("null");
const direct_hoist_25 = new TypeofRuntype("number");
const direct_hoist_26 = new ObjectRuntype({
    "a": direct_hoist_19,
    "b": direct_hoist_25
}, []);
const direct_hoist_27 = new ObjectRuntype({
    "next": new OptionalFieldRuntype(direct_hoist_11),
    "value": direct_hoist_19
}, []);
const direct_hoist_28 = new ObjectRuntype({
    "next": new OptionalFieldRuntype(direct_hoist_12),
    "value": direct_hoist_19
}, []);
const direct_hoist_29 = new ArrayRuntype(direct_hoist_19);
const direct_hoist_30 = new NullishRuntype("undefined");
const direct_hoist_31 = new NullishRuntype("void");
const namedRuntypes = {
    "AnyCodec": direct_hoist_17,
    "BooleanCodec": direct_hoist_18,
    "MutualA1": direct_hoist_20,
    "MutualA2": direct_hoist_21,
    "MutualB1": direct_hoist_22,
    "MutualB2": direct_hoist_23,
    "NullCodec": direct_hoist_24,
    "NumberCodec": direct_hoist_25,
    "ObjCodec": direct_hoist_26,
    "ObjCodec2": direct_hoist_26,
    "RecursiveA": direct_hoist_27,
    "RecursiveB": direct_hoist_28,
    "StringArrayCodec": direct_hoist_29,
    "StringCodec": direct_hoist_19,
    "UndefinedCodec": direct_hoist_30,
    "UnknownCodec": direct_hoist_17,
    "VoidCodec": direct_hoist_31
};
const buildParsersInput = {
    "StringCodec": direct_hoist_0,
    "NumberCodec": direct_hoist_1,
    "BooleanCodec": direct_hoist_2,
    "StringArrayCodec": direct_hoist_3,
    "UndefinedCodec": direct_hoist_4,
    "NullCodec": direct_hoist_5,
    "AnyCodec": direct_hoist_6,
    "UnknownCodec": direct_hoist_7,
    "VoidCodec": direct_hoist_8,
    "ObjCodec": direct_hoist_9,
    "ObjCodec2": direct_hoist_10,
    "RecursiveA": direct_hoist_11,
    "RecursiveB": direct_hoist_12,
    "MutualA1": direct_hoist_13,
    "MutualB1": direct_hoist_14,
    "MutualA2": direct_hoist_15,
    "MutualB2": direct_hoist_16
};

export default { buildParsers };