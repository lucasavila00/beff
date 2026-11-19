//@ts-nocheck

"use strict";

import {
  string,
  number,
  boolean,
  functionType,
  numberKey,
  any,
  nullType,
  undefinedType,
  voidType,
  never,
  literal,
  literals,
  regex,
  date,
  bigint,
  typedArray,
  stringWithFormat,
  numberWithFormat,
  tuple,
  intersection,
  union,
  array,
  map,
  set,
  discriminatedUnion,
  optional,
  object,
  reference,
  withDescription,
  define,
  registerStringFormatter,
  registerNumberFormatter,
  buildParserFromRuntype,
} from "@beff/client/codegen-v2";

const registry = new Map();

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
const direct_hoist_0 = reference(registry, "User");
const direct_hoist_1 = literals([
    "ADMIN",
    "USER"
]);
const direct_hoist_2 = regex(/^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(x)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}x${number}`");
const direct_hoist_3 = reference(registry, "AccessLevel");
const direct_hoist_4 = reference(registry, "AvatarSize");
const direct_hoist_5 = functionType();
const direct_hoist_6 = array(direct_hoist_0);
const direct_hoist_7 = string();
const direct_hoist_8 = object({
    accessLevel: direct_hoist_3,
    avatarSize: direct_hoist_4,
    extra: direct_hoist_5,
    friends: direct_hoist_6,
    name: direct_hoist_7
});
define(registry, {
    AccessLevel: direct_hoist_1,
    AvatarSize: direct_hoist_2,
    User: direct_hoist_8
});
const buildParsersInput = {
    User: direct_hoist_0
};

export default { buildParsers };