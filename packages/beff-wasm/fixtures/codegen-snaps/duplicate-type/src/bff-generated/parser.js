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
const direct_hoist_0 = new RefRuntype("UserObj");
const direct_hoist_1 = new RefRuntype("UserList");
const direct_hoist_2 = new TypeofRuntype("string");
const direct_hoist_3 = new ObjectRuntype({
    "a": direct_hoist_2
}, []);
const direct_hoist_4 = new RefRuntype("parser_ts__User");
const direct_hoist_5 = new ObjectRuntype({
    "x": direct_hoist_4
}, []);
const direct_hoist_6 = new TypeofRuntype("number");
const direct_hoist_7 = new ObjectRuntype({
    "b": direct_hoist_6
}, []);
const direct_hoist_8 = new RefRuntype("types_ts__User");
const direct_hoist_9 = new ArrayRuntype(direct_hoist_8);
const namedRuntypes = {
    "parser_ts__User": direct_hoist_3,
    "UserObj": direct_hoist_5,
    "types_ts__User": direct_hoist_7,
    "UserList": direct_hoist_9
};
const buildParsersInput = {
    "UserObj": direct_hoist_0,
    "UserList": direct_hoist_1
};

export default { buildParsers };