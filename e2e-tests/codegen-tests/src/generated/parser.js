//@ts-nocheck

import { z } from "zod";
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
  registerStringFormatter,
  registerNumberFormatter,
  buildParserFromRuntype,
} from "@beff/client/codegen-v2";


export class RefRuntype  {
  refName
  constructor(refName) {
    this.refName = refName;
  }
  describe(ctx) {
    const name = this.refName;
    const to = namedRuntypes[this.refName];
    if (ctx.measure) {
      ctx.deps_counter[name] = (ctx.deps_counter[name] || 0) + 1;
      if (ctx.deps[name]) {
        return name;
      }
      ctx.deps[name] = true;
      ctx.deps[name] = to.describe(ctx);
      return name;
    } else {
      if (ctx.deps_counter[name] > 1) {
        if (!ctx.deps[name]) {
          ctx.deps[name] = true;
          ctx.deps[name] = to.describe(ctx);
        }
        return name;
      } else {
        return to.describe(ctx);
      }
    }
  }
  schema(ctx) {
    const name = this.refName;
    const to = namedRuntypes[this.refName];
    if (ctx.seen[name]) {
      return {};
    }
    ctx.seen[name] = true;
    var tmp = to.schema(ctx);
    delete ctx.seen[name];
    return tmp;
  }
  hash(ctx) {
    const name = this.refName;
    const to = namedRuntypes[this.refName];
    if (ctx.seen[name]) {
      return generateHashFromString(name);
    }
    ctx.seen[name] = true;
    var tmp = to.hash(ctx);
    delete ctx.seen[name];
    return tmp;
  }
  validate(ctx, input) {
    const to = namedRuntypes[this.refName];
    return to.validate(ctx, input);
  }
  parseAfterValidation(ctx, input) {
    const to = namedRuntypes[this.refName];
    return to.parseAfterValidation(ctx, input);
  }
  reportDecodeError(ctx, input) {
    const to = namedRuntypes[this.refName];
    return to.reportDecodeError(ctx, input);
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
const direct_hoist_0 = new TypeofRuntype("string");
const direct_hoist_1 = new RefRuntype("AliasToString");
const direct_hoist_2 = new RefRuntype("AliasToNumber");
const direct_hoist_3 = new RefRuntype("AliasToBoolean");
const direct_hoist_4 = new RefRuntype("AliasToNull");
const direct_hoist_5 = new RefRuntype("AliasToAny");
const direct_hoist_6 = new RefRuntype("AliasToConst");
const direct_hoist_7 = new RefRuntype("TestHoist");
const direct_hoist_8 = new RefRuntype("BeforeRequired");
const direct_hoist_9 = new RefRuntype("AfterRequired");
const direct_hoist_10 = new NullishRuntype("undefined");
const direct_hoist_11 = new AnyOfRuntype([
    direct_hoist_10,
    direct_hoist_0
]);
const direct_hoist_12 = new NullishRuntype("void");
const direct_hoist_13 = new AnyOfRuntype([
    direct_hoist_12,
    direct_hoist_0
]);
const direct_hoist_14 = new NullishRuntype("null");
const direct_hoist_15 = new AnyOfRuntype([
    direct_hoist_14,
    direct_hoist_0
]);
const direct_hoist_16 = new ObjectRuntype({
    "a": direct_hoist_0,
    "b": direct_hoist_11,
    "c": direct_hoist_13,
    "d": direct_hoist_15,
    "e": direct_hoist_0
}, []);
const direct_hoist_17 = new AnyRuntype();
const direct_hoist_18 = new TypeofRuntype("boolean");
const direct_hoist_19 = new ConstRuntype("constant value");
const direct_hoist_20 = new TypeofRuntype("number");
const direct_hoist_21 = new ObjectRuntype({
    "a": direct_hoist_0,
    "b": direct_hoist_11,
    "c": direct_hoist_13,
    "d": direct_hoist_15,
    "e": new OptionalFieldRuntype(direct_hoist_0)
}, []);
const direct_hoist_22 = new ArrayRuntype(direct_hoist_0);
const direct_hoist_23 = new ObjectRuntype({
    "a": direct_hoist_22,
    "b": direct_hoist_22
}, []);
const namedRuntypes = {
    "AfterRequired": direct_hoist_16,
    "AliasToAny": direct_hoist_17,
    "AliasToBoolean": direct_hoist_18,
    "AliasToConst": direct_hoist_19,
    "AliasToNull": direct_hoist_14,
    "AliasToNumber": direct_hoist_20,
    "AliasToString": direct_hoist_0,
    "BeforeRequired": direct_hoist_21,
    "TestHoist": direct_hoist_23
};
const buildParsersInput = {
    "Dec": direct_hoist_0,
    "AliasToString": direct_hoist_1,
    "AliasToNumber": direct_hoist_2,
    "AliasToBoolean": direct_hoist_3,
    "AliasToNull": direct_hoist_4,
    "AliasToAny": direct_hoist_5,
    "AliasToConst": direct_hoist_6,
    "TestHoist": direct_hoist_7,
    "BeforeRequired": direct_hoist_8,
    "AfterRequired": direct_hoist_9
};

export default { buildParsers };