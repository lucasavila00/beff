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

const RequiredStringFormats = [];
const RequiredNumberFormats = [];
const direct_hoist_0 = new RefRuntype(undefined, "UsesGenericWrapper");
const direct_hoist_1 = new RefRuntype(undefined, "GenericWrapper_string");
const direct_hoist_2 = new TypeofRuntype(undefined, "string");
const direct_hoist_3 = new TypeofRuntype(undefined, "boolean");
const direct_hoist_4 = new AnyOfRuntype(undefined, [
    direct_hoist_3,
    direct_hoist_2
]);
const direct_hoist_5 = new ObjectRuntype(undefined, {
    "other": direct_hoist_1,
    "value": direct_hoist_2,
    "value2": direct_hoist_4
}, []);
const direct_hoist_6 = new RefRuntype(undefined, "GenericWrapper_number");
const direct_hoist_7 = new TypeofRuntype(undefined, "number");
const direct_hoist_8 = new AnyOfRuntype(undefined, [
    direct_hoist_3,
    direct_hoist_7
]);
const direct_hoist_9 = new ObjectRuntype(undefined, {
    "other": direct_hoist_6,
    "value": direct_hoist_7,
    "value2": direct_hoist_8
}, []);
const direct_hoist_10 = new ObjectRuntype(undefined, {
    "wrappedNumber": direct_hoist_6,
    "wrappedString": direct_hoist_1
}, []);
const namedRuntypes = {
    "GenericWrapper_string": direct_hoist_5,
    "GenericWrapper_number": direct_hoist_9,
    "UsesGenericWrapper": direct_hoist_10
};
const buildParsersInput = {
    "UsesGenericWrapper": new GeneratedRuntype(direct_hoist_0, v10)
};
function v5(c,i){return isObj(i)&&v5(c,i.other)&&typeof i.value=="string"&&(typeof i.value2=="boolean"||typeof i.value2=="string")&&direct_hoist_5.noExtraKeys(c,i)}
function v9(c,i){return isObj(i)&&v9(c,i.other)&&typeof i.value=="number"&&(typeof i.value2=="boolean"||typeof i.value2=="number")&&direct_hoist_9.noExtraKeys(c,i)}
function v10(c,i){return isObj(i)&&v9(c,i.wrappedNumber)&&v5(c,i.wrappedString)&&direct_hoist_10.noExtraKeys(c,i)}

export default { buildParsers };