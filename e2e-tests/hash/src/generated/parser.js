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

const RequiredStringFormats = ["ValidCurrency"];
const RequiredNumberFormats = [];
const direct_hoist_0 = new RefRuntype("StringCodec");
const direct_hoist_1 = new RefRuntype("NumberCodec");
const direct_hoist_2 = new RefRuntype("BooleanCodec");
const direct_hoist_3 = new RefRuntype("StringArrayCodec");
const direct_hoist_4 = new RefRuntype("UndefinedCodec");
const direct_hoist_5 = new RefRuntype("NullCodec");
const direct_hoist_6 = new RefRuntype("AnyCodec");
const direct_hoist_7 = new RefRuntype("UnknownCodec");
const direct_hoist_8 = new RefRuntype("VoidCodec");
const direct_hoist_9 = new RefRuntype("ObjCodec");
const direct_hoist_10 = new RefRuntype("ObjCodec2");
const direct_hoist_11 = new AnyRuntype();
const direct_hoist_12 = new TypeofRuntype("boolean");
const direct_hoist_13 = new NullishRuntype("null");
const direct_hoist_14 = new TypeofRuntype("number");
const direct_hoist_15 = new TypeofRuntype("string");
const direct_hoist_16 = new ObjectRuntype({
    "a": direct_hoist_15,
    "b": direct_hoist_14
}, []);
const direct_hoist_17 = new ArrayRuntype(direct_hoist_15);
const direct_hoist_18 = new NullishRuntype("undefined");
const direct_hoist_19 = new NullishRuntype("void");
const namedRuntypes = {
    "AnyCodec": direct_hoist_11,
    "BooleanCodec": direct_hoist_12,
    "NullCodec": direct_hoist_13,
    "NumberCodec": direct_hoist_14,
    "ObjCodec": direct_hoist_16,
    "ObjCodec2": direct_hoist_16,
    "StringArrayCodec": direct_hoist_17,
    "StringCodec": direct_hoist_15,
    "UndefinedCodec": direct_hoist_18,
    "UnknownCodec": direct_hoist_11,
    "VoidCodec": direct_hoist_19
};
const buildParsersInput = {
    "StringCodec": direct_hoist_0,
    "NumberCodec": direct_hoist_1,
    "BooleanCodec": direct_hoist_2,
    "StringArrayCodec": direct_hoist_3,
    "UndefinedCodec": direct_hoist_4,
    "NullCodec": direct_hoist_5,
    "AnyCodec": direct_hoist_6,
    "UnknownCodec": direct_hoist_7,
    "VoidCodec": direct_hoist_8,
    "ObjCodec": direct_hoist_9,
    "ObjCodec2": direct_hoist_10
};

export default { buildParsers };