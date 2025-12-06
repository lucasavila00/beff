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
const direct_hoist_0 = new RefRuntype("User");
const direct_hoist_1 = new AnyOfConstsRuntype([
    "ADMIN",
    "USER"
]);
const direct_hoist_2 = new RegexRuntype(/(\d+(\.\d+)?)(x)(\d+(\.\d+)?)/, "`${number}x${number}`");
const direct_hoist_3 = new RefRuntype("AccessLevel");
const direct_hoist_4 = new RefRuntype("AvatarSize");
const direct_hoist_5 = new TypeofRuntype("function");
const direct_hoist_6 = new ArrayRuntype(direct_hoist_0);
const direct_hoist_7 = new TypeofRuntype("string");
const direct_hoist_8 = new ObjectRuntype({
    "accessLevel": direct_hoist_3,
    "avatarSize": direct_hoist_4,
    "extra": direct_hoist_5,
    "friends": direct_hoist_6,
    "name": direct_hoist_7
}, []);
const namedRuntypes = {
    "AccessLevel": direct_hoist_1,
    "AvatarSize": direct_hoist_2,
    "User": direct_hoist_8
};
const buildParsersInput = {
    "User": direct_hoist_0
};

export default { buildParsers };