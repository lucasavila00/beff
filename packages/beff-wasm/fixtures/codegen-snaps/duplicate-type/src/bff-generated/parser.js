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
const direct_hoist_0 = reference(registry, "UserObj");
const direct_hoist_1 = reference(registry, "UserList");
const direct_hoist_2 = string();
const direct_hoist_3 = object({
    a: direct_hoist_2
});
const direct_hoist_4 = reference(registry, "parser_ts__User");
const direct_hoist_5 = object({
    x: direct_hoist_4
});
const direct_hoist_6 = number();
const direct_hoist_7 = object({
    b: direct_hoist_6
});
const direct_hoist_8 = reference(registry, "types_ts__User");
const direct_hoist_9 = array(direct_hoist_8);
define(registry, {
    parser_ts__User: direct_hoist_3,
    UserObj: direct_hoist_5,
    types_ts__User: direct_hoist_7,
    UserList: direct_hoist_9
});
const buildParsersInput = {
    UserObj: direct_hoist_0,
    UserList: direct_hoist_1
};

export default { buildParsers };