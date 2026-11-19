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
const direct_hoist_0 = reference(registry, "UsesGenericWrapper");
const direct_hoist_1 = reference(registry, "GenericWrapper_string");
const direct_hoist_2 = string();
const direct_hoist_3 = boolean();
const direct_hoist_4 = union([
    direct_hoist_3,
    direct_hoist_2
]);
const direct_hoist_5 = object({
    other: direct_hoist_1,
    value: direct_hoist_2,
    value2: direct_hoist_4
});
const direct_hoist_6 = reference(registry, "GenericWrapper_number");
const direct_hoist_7 = number();
const direct_hoist_8 = union([
    direct_hoist_3,
    direct_hoist_7
]);
const direct_hoist_9 = object({
    other: direct_hoist_6,
    value: direct_hoist_7,
    value2: direct_hoist_8
});
const direct_hoist_10 = object({
    wrappedNumber: direct_hoist_6,
    wrappedString: direct_hoist_1
});
define(registry, {
    GenericWrapper_string: direct_hoist_5,
    GenericWrapper_number: direct_hoist_9,
    UsesGenericWrapper: direct_hoist_10
});
const buildParsersInput = {
    UsesGenericWrapper: direct_hoist_0
};

export default { buildParsers };