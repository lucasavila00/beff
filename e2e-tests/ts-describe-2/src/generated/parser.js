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
const direct_hoist_0 = reference(registry, "BeforeRequired");
const direct_hoist_1 = reference(registry, "KeyofBeforeRequired");
const direct_hoist_2 = reference(registry, "AfterRequired");
const direct_hoist_3 = reference(registry, "KeyofAfterRequired");
const direct_hoist_4 = reference(registry, "SomeString");
const direct_hoist_5 = reference(registry, "SomeChar");
const direct_hoist_6 = string();
const direct_hoist_7 = undefinedType();
const direct_hoist_8 = union([
    direct_hoist_7,
    direct_hoist_6
]);
const direct_hoist_9 = voidType();
const direct_hoist_10 = union([
    direct_hoist_9,
    direct_hoist_6
]);
const direct_hoist_11 = nullType();
const direct_hoist_12 = union([
    direct_hoist_11,
    direct_hoist_6
]);
const direct_hoist_13 = object({
    a: direct_hoist_6,
    b: direct_hoist_8,
    c: direct_hoist_10,
    d: direct_hoist_12,
    e: direct_hoist_6
});
const direct_hoist_14 = object({
    a: direct_hoist_6,
    b: direct_hoist_8,
    c: direct_hoist_10,
    d: direct_hoist_12,
    e: optional(direct_hoist_6)
});
const direct_hoist_15 = literals([
    "a",
    "b",
    "c",
    "d",
    "e"
]);
define(registry, {
    AfterRequired: direct_hoist_13,
    BeforeRequired: direct_hoist_14,
    KeyofAfterRequired: direct_hoist_15,
    KeyofBeforeRequired: direct_hoist_15,
    SomeChar: direct_hoist_6,
    SomeString: direct_hoist_6
});
const buildParsersInput = {
    BeforeRequired: direct_hoist_0,
    KeyofBeforeRequired: direct_hoist_1,
    AfterRequired: direct_hoist_2,
    KeyofAfterRequired: direct_hoist_3,
    SomeString: direct_hoist_4,
    SomeChar: direct_hoist_5
};

export default { buildParsers };