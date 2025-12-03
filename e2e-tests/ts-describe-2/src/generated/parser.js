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
  registerStringFormatter,
  registerNumberFormatter,
  buildParserFromRuntype,
  generateHashFromString,
} from "@beff/client/codegen-v2";


class RefRuntype  {
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
const direct_hoist_0 = new RefRuntype("BeforeRequired");
const direct_hoist_1 = new RefRuntype("KeyofBeforeRequired");
const direct_hoist_2 = new RefRuntype("AfterRequired");
const direct_hoist_3 = new RefRuntype("KeyofAfterRequired");
const direct_hoist_4 = new RefRuntype("SomeString");
const direct_hoist_5 = new RefRuntype("SomeChar");
const direct_hoist_6 = new TypeofRuntype("string");
const direct_hoist_7 = new NullishRuntype("undefined");
const direct_hoist_8 = new AnyOfRuntype([
    direct_hoist_7,
    direct_hoist_6
]);
const direct_hoist_9 = new NullishRuntype("void");
const direct_hoist_10 = new AnyOfRuntype([
    direct_hoist_9,
    direct_hoist_6
]);
const direct_hoist_11 = new NullishRuntype("null");
const direct_hoist_12 = new AnyOfRuntype([
    direct_hoist_11,
    direct_hoist_6
]);
const direct_hoist_13 = new ObjectRuntype({
    "a": direct_hoist_6,
    "b": direct_hoist_8,
    "c": direct_hoist_10,
    "d": direct_hoist_12,
    "e": direct_hoist_6
}, []);
const direct_hoist_14 = new ObjectRuntype({
    "a": direct_hoist_6,
    "b": direct_hoist_8,
    "c": direct_hoist_10,
    "d": direct_hoist_12,
    "e": new OptionalFieldRuntype(direct_hoist_6)
}, []);
const direct_hoist_15 = new AnyOfConstsRuntype([
    "a",
    "b",
    "c",
    "d",
    "e"
]);
const namedRuntypes = {
    "AfterRequired": direct_hoist_13,
    "BeforeRequired": direct_hoist_14,
    "KeyofAfterRequired": direct_hoist_15,
    "KeyofBeforeRequired": direct_hoist_15,
    "SomeChar": direct_hoist_6,
    "SomeString": direct_hoist_6
};
const buildParsersInput = {
    "BeforeRequired": direct_hoist_0,
    "KeyofBeforeRequired": direct_hoist_1,
    "AfterRequired": direct_hoist_2,
    "KeyofAfterRequired": direct_hoist_3,
    "SomeString": direct_hoist_4,
    "SomeChar": direct_hoist_5
};

export default { buildParsers };