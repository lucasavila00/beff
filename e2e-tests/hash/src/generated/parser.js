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

const RequiredStringFormats = ["ValidCurrency"];
const RequiredNumberFormats = [];
const direct_hoist_0 = reference(registry, "StringCodec");
const direct_hoist_1 = reference(registry, "NumberCodec");
const direct_hoist_2 = reference(registry, "BooleanCodec");
const direct_hoist_3 = reference(registry, "StringArrayCodec");
const direct_hoist_4 = reference(registry, "UndefinedCodec");
const direct_hoist_5 = reference(registry, "NullCodec");
const direct_hoist_6 = reference(registry, "AnyCodec");
const direct_hoist_7 = reference(registry, "UnknownCodec");
const direct_hoist_8 = reference(registry, "VoidCodec");
const direct_hoist_9 = reference(registry, "ObjCodec");
const direct_hoist_10 = reference(registry, "ObjCodec2");
const direct_hoist_11 = reference(registry, "RecursiveA");
const direct_hoist_12 = reference(registry, "RecursiveB");
const direct_hoist_13 = reference(registry, "MutualA1");
const direct_hoist_14 = reference(registry, "MutualB1");
const direct_hoist_15 = reference(registry, "MutualA2");
const direct_hoist_16 = reference(registry, "MutualB2");
const direct_hoist_17 = any();
const direct_hoist_18 = boolean();
const direct_hoist_19 = string();
const direct_hoist_20 = object({
    next: optional(direct_hoist_14),
    value: direct_hoist_19
});
const direct_hoist_21 = object({
    next: optional(direct_hoist_16),
    value: direct_hoist_19
});
const direct_hoist_22 = object({
    next: optional(direct_hoist_13),
    value: direct_hoist_19
});
const direct_hoist_23 = object({
    next: optional(direct_hoist_15),
    value: direct_hoist_19
});
const direct_hoist_24 = nullType();
const direct_hoist_25 = number();
const direct_hoist_26 = object({
    a: direct_hoist_19,
    b: direct_hoist_25
});
const direct_hoist_27 = object({
    next: optional(direct_hoist_11),
    value: direct_hoist_19
});
const direct_hoist_28 = object({
    next: optional(direct_hoist_12),
    value: direct_hoist_19
});
const direct_hoist_29 = array(direct_hoist_19);
const direct_hoist_30 = undefinedType();
const direct_hoist_31 = voidType();
define(registry, {
    AnyCodec: direct_hoist_17,
    BooleanCodec: direct_hoist_18,
    MutualA1: direct_hoist_20,
    MutualA2: direct_hoist_21,
    MutualB1: direct_hoist_22,
    MutualB2: direct_hoist_23,
    NullCodec: direct_hoist_24,
    NumberCodec: direct_hoist_25,
    ObjCodec: direct_hoist_26,
    ObjCodec2: direct_hoist_26,
    RecursiveA: direct_hoist_27,
    RecursiveB: direct_hoist_28,
    StringArrayCodec: direct_hoist_29,
    StringCodec: direct_hoist_19,
    UndefinedCodec: direct_hoist_30,
    UnknownCodec: direct_hoist_17,
    VoidCodec: direct_hoist_31
});
const buildParsersInput = {
    StringCodec: direct_hoist_0,
    NumberCodec: direct_hoist_1,
    BooleanCodec: direct_hoist_2,
    StringArrayCodec: direct_hoist_3,
    UndefinedCodec: direct_hoist_4,
    NullCodec: direct_hoist_5,
    AnyCodec: direct_hoist_6,
    UnknownCodec: direct_hoist_7,
    VoidCodec: direct_hoist_8,
    ObjCodec: direct_hoist_9,
    ObjCodec2: direct_hoist_10,
    RecursiveA: direct_hoist_11,
    RecursiveB: direct_hoist_12,
    MutualA1: direct_hoist_13,
    MutualB1: direct_hoist_14,
    MutualA2: direct_hoist_15,
    MutualB2: direct_hoist_16
};

export default { buildParsers };