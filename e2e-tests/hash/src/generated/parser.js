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
  NumberKeyRuntype,
  GeneratedRuntype,
  isObj,
  discKey,
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
const direct_hoist_0 = new RefRuntype(undefined, "StringCodec");
const direct_hoist_1 = new RefRuntype(undefined, "NumberCodec");
const direct_hoist_2 = new RefRuntype(undefined, "BooleanCodec");
const direct_hoist_3 = new RefRuntype(undefined, "StringArrayCodec");
const direct_hoist_4 = new RefRuntype(undefined, "UndefinedCodec");
const direct_hoist_5 = new RefRuntype(undefined, "NullCodec");
const direct_hoist_6 = new RefRuntype(undefined, "AnyCodec");
const direct_hoist_7 = new RefRuntype(undefined, "UnknownCodec");
const direct_hoist_8 = new RefRuntype(undefined, "VoidCodec");
const direct_hoist_9 = new RefRuntype(undefined, "ObjCodec");
const direct_hoist_10 = new RefRuntype(undefined, "ObjCodec2");
const direct_hoist_11 = new RefRuntype(undefined, "RecursiveA");
const direct_hoist_12 = new RefRuntype(undefined, "RecursiveB");
const direct_hoist_13 = new RefRuntype(undefined, "MutualA1");
const direct_hoist_14 = new RefRuntype(undefined, "MutualB1");
const direct_hoist_15 = new RefRuntype(undefined, "MutualA2");
const direct_hoist_16 = new RefRuntype(undefined, "MutualB2");
const direct_hoist_17 = new AnyRuntype(undefined);
const direct_hoist_18 = new TypeofRuntype(undefined, "boolean");
const direct_hoist_19 = new TypeofRuntype(undefined, "string");
const direct_hoist_20 = new ObjectRuntype(undefined, {
    "next": new OptionalFieldRuntype(direct_hoist_14),
    "value": direct_hoist_19
}, []);
const direct_hoist_21 = new ObjectRuntype(undefined, {
    "next": new OptionalFieldRuntype(direct_hoist_16),
    "value": direct_hoist_19
}, []);
const direct_hoist_22 = new ObjectRuntype(undefined, {
    "next": new OptionalFieldRuntype(direct_hoist_13),
    "value": direct_hoist_19
}, []);
const direct_hoist_23 = new ObjectRuntype(undefined, {
    "next": new OptionalFieldRuntype(direct_hoist_15),
    "value": direct_hoist_19
}, []);
const direct_hoist_24 = new NullishRuntype(undefined, "null");
const direct_hoist_25 = new TypeofRuntype(undefined, "number");
const direct_hoist_26 = new ObjectRuntype(undefined, {
    "a": direct_hoist_19,
    "b": direct_hoist_25
}, []);
const direct_hoist_27 = new ObjectRuntype(undefined, {
    "next": new OptionalFieldRuntype(direct_hoist_11),
    "value": direct_hoist_19
}, []);
const direct_hoist_28 = new ObjectRuntype(undefined, {
    "next": new OptionalFieldRuntype(direct_hoist_12),
    "value": direct_hoist_19
}, []);
const direct_hoist_29 = new ArrayRuntype(undefined, direct_hoist_19);
const direct_hoist_30 = new NullishRuntype(undefined, "undefined");
const direct_hoist_31 = new NullishRuntype(undefined, "void");
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
    "StringArrayCodec": new GeneratedRuntype(direct_hoist_3, v29),
    "UndefinedCodec": direct_hoist_4,
    "NullCodec": direct_hoist_5,
    "AnyCodec": direct_hoist_6,
    "UnknownCodec": direct_hoist_7,
    "VoidCodec": direct_hoist_8,
    "ObjCodec": new GeneratedRuntype(direct_hoist_9, v26),
    "ObjCodec2": new GeneratedRuntype(direct_hoist_10, v26),
    "RecursiveA": new GeneratedRuntype(direct_hoist_11, v27),
    "RecursiveB": new GeneratedRuntype(direct_hoist_12, v28),
    "MutualA1": new GeneratedRuntype(direct_hoist_13, v20),
    "MutualB1": new GeneratedRuntype(direct_hoist_14, v22),
    "MutualA2": new GeneratedRuntype(direct_hoist_15, v21),
    "MutualB2": new GeneratedRuntype(direct_hoist_16, v23)
};
function v20(c,i){return isObj(i)&&(i.next==null||v22(c,i.next))&&typeof i.value=="string"&&direct_hoist_20.noExtraKeys(c,i)}
function v21(c,i){return isObj(i)&&(i.next==null||v23(c,i.next))&&typeof i.value=="string"&&direct_hoist_21.noExtraKeys(c,i)}
function v22(c,i){return isObj(i)&&(i.next==null||v20(c,i.next))&&typeof i.value=="string"&&direct_hoist_22.noExtraKeys(c,i)}
function v23(c,i){return isObj(i)&&(i.next==null||v21(c,i.next))&&typeof i.value=="string"&&direct_hoist_23.noExtraKeys(c,i)}
function v26(c,i){return isObj(i)&&typeof i.a=="string"&&typeof i.b=="number"&&direct_hoist_26.noExtraKeys(c,i)}
function v27(c,i){return isObj(i)&&(i.next==null||v27(c,i.next))&&typeof i.value=="string"&&direct_hoist_27.noExtraKeys(c,i)}
function v28(c,i){return isObj(i)&&(i.next==null||v28(c,i.next))&&typeof i.value=="string"&&direct_hoist_28.noExtraKeys(c,i)}
function v29(c,i){if(!Array.isArray(i))return false;for(let k=0;k<i.length;k++)if(!(typeof i[k]=="string"))return false;return true}

export default { buildParsers };