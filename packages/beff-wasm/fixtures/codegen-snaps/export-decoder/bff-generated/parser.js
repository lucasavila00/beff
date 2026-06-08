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

const RequiredStringFormats = ["password","StartsWithA"];
const RequiredNumberFormats = [];
const direct_hoist_0 = new RefRuntype(undefined, "User");
const direct_hoist_1 = new ArrayRuntype(undefined, direct_hoist_0);
const direct_hoist_2 = new RefRuntype(undefined, "NotPublic");
const direct_hoist_3 = new RefRuntype(undefined, "StartsWithA");
const direct_hoist_4 = new RefRuntype(undefined, "Password");
const direct_hoist_5 = new ConstRuntype(undefined, 123.456);
const direct_hoist_6 = new ConstRuntype(undefined, 123);
const direct_hoist_7 = new RefRuntype(undefined, "UnionNested");
const direct_hoist_8 = new AnyOfConstsRuntype(undefined, [
    1,
    2
]);
const direct_hoist_9 = new AnyOfConstsRuntype(undefined, [
    2,
    3
]);
const direct_hoist_10 = new AnyOfConstsRuntype(undefined, [
    4,
    5
]);
const direct_hoist_11 = new AnyOfConstsRuntype(undefined, [
    5,
    6
]);
const direct_hoist_12 = new TypeofRuntype(undefined, "string");
const direct_hoist_13 = new ObjectRuntype(undefined, {
    "a": direct_hoist_12
}, []);
const direct_hoist_14 = new StringWithFormatRuntype(undefined, [
    "password"
]);
const direct_hoist_15 = new StringWithFormatRuntype(undefined, [
    "StartsWithA"
]);
const direct_hoist_16 = new AnyOfConstsRuntype(undefined, [
    1,
    2,
    3,
    4,
    5,
    6
]);
const direct_hoist_17 = new TypeofRuntype(undefined, "number");
const direct_hoist_18 = new ObjectRuntype(undefined, {
    "age": direct_hoist_17,
    "name": direct_hoist_12
}, []);
const namedRuntypes = {
    "A": direct_hoist_8,
    "B": direct_hoist_9,
    "D": direct_hoist_10,
    "E": direct_hoist_11,
    "NotPublic": direct_hoist_13,
    "Password": direct_hoist_14,
    "StartsWithA": direct_hoist_15,
    "UnionNested": direct_hoist_16,
    "User": direct_hoist_18
};
const buildParsersInput = {
    "User": direct_hoist_0,
    "Users": direct_hoist_1,
    "NotPublicRenamed": direct_hoist_2,
    "StartsWithA": direct_hoist_3,
    "Password": direct_hoist_4,
    "float": direct_hoist_5,
    "int": direct_hoist_6,
    "union": direct_hoist_7
};

export default { buildParsers };