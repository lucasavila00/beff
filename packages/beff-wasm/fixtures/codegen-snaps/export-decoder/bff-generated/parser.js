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

const RequiredStringFormats = ["password","StartsWithA"];
const RequiredNumberFormats = [];
const direct_hoist_0 = reference(registry, "User");
const direct_hoist_1 = array(direct_hoist_0);
const direct_hoist_2 = reference(registry, "NotPublic");
const direct_hoist_3 = reference(registry, "StartsWithA");
const direct_hoist_4 = reference(registry, "Password");
const direct_hoist_5 = literal(123.456);
const direct_hoist_6 = literal(123);
const direct_hoist_7 = reference(registry, "UnionNested");
const direct_hoist_8 = literals([
    1,
    2
]);
const direct_hoist_9 = literals([
    2,
    3
]);
const direct_hoist_10 = literals([
    4,
    5
]);
const direct_hoist_11 = literals([
    5,
    6
]);
const direct_hoist_12 = string();
const direct_hoist_13 = object({
    a: direct_hoist_12
});
const direct_hoist_14 = stringWithFormat([
    "password"
]);
const direct_hoist_15 = stringWithFormat([
    "StartsWithA"
]);
const direct_hoist_16 = literals([
    1,
    2,
    3,
    4,
    5,
    6
]);
const direct_hoist_17 = number();
const direct_hoist_18 = object({
    age: direct_hoist_17,
    name: direct_hoist_12
});
define(registry, {
    A: direct_hoist_8,
    B: direct_hoist_9,
    D: direct_hoist_10,
    E: direct_hoist_11,
    NotPublic: direct_hoist_13,
    Password: direct_hoist_14,
    StartsWithA: direct_hoist_15,
    UnionNested: direct_hoist_16,
    User: direct_hoist_18
});
const buildParsersInput = {
    User: direct_hoist_0,
    Users: direct_hoist_1,
    NotPublicRenamed: direct_hoist_2,
    StartsWithA: direct_hoist_3,
    Password: direct_hoist_4,
    float: direct_hoist_5,
    int: direct_hoist_6,
    union: direct_hoist_7
};

export default { buildParsers };