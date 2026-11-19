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
const direct_hoist_0 = new RefRuntype(undefined, "User");
const direct_hoist_1 = new AnyOfConstsRuntype(undefined, [
    "ADMIN",
    "USER"
]);
const direct_hoist_2 = new RegexRuntype(undefined, /^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(x)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}x${number}`");
const direct_hoist_3 = new RefRuntype(undefined, "AccessLevel");
const direct_hoist_4 = new RefRuntype(undefined, "AvatarSize");
const direct_hoist_5 = new TypeofRuntype(undefined, "function");
const direct_hoist_6 = new ArrayRuntype(undefined, direct_hoist_0);
const direct_hoist_7 = new TypeofRuntype(undefined, "string");
const direct_hoist_8 = new ObjectRuntype(undefined, {
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
    "User": new GeneratedRuntype(direct_hoist_0, v8)
};
function v6(c,i){if(!Array.isArray(i))return false;for(let k=0;k<i.length;k++)if(!(v8(c,i[k])))return false;return true}
function v8(c,i){return isObj(i)&&direct_hoist_1.validate(c,i.accessLevel)&&direct_hoist_2.validate(c,i.avatarSize)&&typeof i.extra=="function"&&v6(c,i.friends)&&typeof i.name=="string"&&direct_hoist_8.noExtraKeys(c,i)}

export default { buildParsers };