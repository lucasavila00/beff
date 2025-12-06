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
const direct_hoist_0 = new RefRuntype("UsesGenericWrapper");
const direct_hoist_1 = new RefRuntype("GenericWrapper_string");
const direct_hoist_2 = new TypeofRuntype("string");
const direct_hoist_3 = new TypeofRuntype("boolean");
const direct_hoist_4 = new AnyOfRuntype([
    direct_hoist_3,
    direct_hoist_2
]);
const direct_hoist_5 = new ObjectRuntype({
    "other": direct_hoist_1,
    "value": direct_hoist_2,
    "value2": direct_hoist_4
}, []);
const direct_hoist_6 = new RefRuntype("GenericWrapper_number");
const direct_hoist_7 = new TypeofRuntype("number");
const direct_hoist_8 = new AnyOfRuntype([
    direct_hoist_3,
    direct_hoist_7
]);
const direct_hoist_9 = new ObjectRuntype({
    "other": direct_hoist_6,
    "value": direct_hoist_7,
    "value2": direct_hoist_8
}, []);
const direct_hoist_10 = new ObjectRuntype({
    "wrappedNumber": direct_hoist_6,
    "wrappedString": direct_hoist_1
}, []);
const namedRuntypes = {
    "GenericWrapper_string": direct_hoist_5,
    "GenericWrapper_number": direct_hoist_9,
    "UsesGenericWrapper": direct_hoist_10
};
const buildParsersInput = {
    "UsesGenericWrapper": direct_hoist_0
};

export default { buildParsers };