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

const RequiredStringFormats = ["password","StartsWithA"];
const RequiredNumberFormats = [];
const direct_hoist_0 = new RefRuntype("User");
const direct_hoist_1 = new TypeofRuntype("number");
const direct_hoist_2 = new TypeofRuntype("string");
const direct_hoist_3 = new ObjectRuntype({
    "data1": direct_hoist_1,
    "data2": direct_hoist_2
}, []);
const direct_hoist_4 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_2,
        "value": direct_hoist_2
    }
]);
const direct_hoist_5 = new ObjectRuntype({
    "a": direct_hoist_2
}, []);
const namedRuntypes = {
    "User": direct_hoist_3,
    "X": direct_hoist_4,
    "Y": direct_hoist_5
};
const buildParsersInput = {
    "User": direct_hoist_0
};

export default { buildParsers };