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
const direct_hoist_1 = number();
const direct_hoist_2 = string();
const direct_hoist_3 = object({
    data1: direct_hoist_1,
    data2: direct_hoist_2
});
const direct_hoist_4 = object({}, [
    {
        key: direct_hoist_2,
        value: direct_hoist_2
    }
]);
const direct_hoist_5 = object({
    a: direct_hoist_2
});
define(registry, {
    User: direct_hoist_3,
    X: direct_hoist_4,
    Y: direct_hoist_5
});
const buildParsersInput = {
    User: direct_hoist_0
};

export default { buildParsers };