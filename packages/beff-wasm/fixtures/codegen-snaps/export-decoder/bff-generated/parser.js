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

const RequiredStringFormats = ["password","StartsWithA"];
const RequiredNumberFormats = [];
const direct_hoist_0 = new RefRuntype("User");
const direct_hoist_1 = new ArrayRuntype(direct_hoist_0);
const direct_hoist_2 = new RefRuntype("NotPublic");
const direct_hoist_3 = new RefRuntype("StartsWithA");
const direct_hoist_4 = new RefRuntype("Password");
const direct_hoist_5 = new ConstRuntype(123.456);
const direct_hoist_6 = new ConstRuntype(123);
const direct_hoist_7 = new RefRuntype("UnionNested");
const direct_hoist_8 = new AnyOfConstsRuntype([
    1,
    2
]);
const direct_hoist_9 = new AnyOfConstsRuntype([
    2,
    3
]);
const direct_hoist_10 = new AnyOfConstsRuntype([
    4,
    5
]);
const direct_hoist_11 = new AnyOfConstsRuntype([
    5,
    6
]);
const direct_hoist_12 = new TypeofRuntype("string");
const direct_hoist_13 = new ObjectRuntype({
    "a": direct_hoist_12
}, []);
const direct_hoist_14 = new StringWithFormatRuntype([
    "password"
]);
const direct_hoist_15 = new StringWithFormatRuntype([
    "StartsWithA"
]);
const direct_hoist_16 = new AnyOfConstsRuntype([
    1,
    2,
    3,
    4,
    5,
    6
]);
const direct_hoist_17 = new TypeofRuntype("number");
const direct_hoist_18 = new ObjectRuntype({
    "age": direct_hoist_17,
    "name": direct_hoist_12
}, []);
const namedRuntypes = {
    "A": direct_hoist_8,
    "B": direct_hoist_9,
    "D": direct_hoist_10,
    "E": direct_hoist_11,
    "NotPublic": direct_hoist_13,
    "Password": direct_hoist_14,
    "StartsWithA": direct_hoist_15,
    "UnionNested": direct_hoist_16,
    "User": direct_hoist_18
};
const buildParsersInput = {
    "User": direct_hoist_0,
    "Users": direct_hoist_1,
    "NotPublicRenamed": direct_hoist_2,
    "StartsWithA": direct_hoist_3,
    "Password": direct_hoist_4,
    "float": direct_hoist_5,
    "int": direct_hoist_6,
    "union": direct_hoist_7
};

export default { buildParsers };