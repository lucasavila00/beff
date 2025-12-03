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

const RequiredStringFormats = ["ValidCurrency"];
const RequiredNumberFormats = [];
const direct_hoist_0 = new TypeofRuntype("string");
const direct_hoist_1 = new TypeofRuntype("number");
const direct_hoist_2 = new TypeofRuntype("boolean");
const direct_hoist_3 = new NullishRuntype("null");
const direct_hoist_4 = new NullishRuntype("undefined");
const direct_hoist_5 = new AnyRuntype();
const direct_hoist_6 = new AnyOfRuntype([
    direct_hoist_0,
    direct_hoist_1
]);
const direct_hoist_7 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_6,
        "value": direct_hoist_5
    }
]);
const direct_hoist_8 = new ArrayRuntype(direct_hoist_5);
const direct_hoist_9 = new RefRuntype("T1");
const direct_hoist_10 = new RefRuntype("T2");
const direct_hoist_11 = new RefRuntype("T3");
const direct_hoist_12 = new RefRuntype("InvalidSchemaWithDate");
const direct_hoist_13 = new RefRuntype("InvalidSchemaWithBigInt");
const direct_hoist_14 = new RefRuntype("DiscriminatedUnion");
const direct_hoist_15 = new RefRuntype("RecursiveTree");
const direct_hoist_16 = new RefRuntype("SemVer");
const direct_hoist_17 = new RefRuntype("NonEmptyString");
const direct_hoist_18 = new RefRuntype("ValidCurrency");
const direct_hoist_19 = new RefRuntype("ReusesRef");
const direct_hoist_20 = new RefRuntype("UsesGenericWrapper");
const direct_hoist_21 = new RefRuntype("StringWrapped");
const direct_hoist_22 = new RefRuntype("NumberWrapped");
const direct_hoist_23 = new RefRuntype("UsesWrappeds");
const direct_hoist_24 = new RefRuntype("UsesWrappedsComplex");
const direct_hoist_25 = new RefRuntype("UsesWrappedsComplexRef");
const direct_hoist_26 = new ObjectRuntype({
    "a": direct_hoist_2
}, []);
const direct_hoist_27 = new ObjectRuntype({
    "value": direct_hoist_2
}, []);
const direct_hoist_28 = new ObjectRuntype({
    "value": direct_hoist_0
}, []);
const direct_hoist_29 = new ObjectRuntype({
    "value": direct_hoist_1
}, []);
const direct_hoist_30 = new ObjectRuntype({
    "value": direct_hoist_26
}, []);
const direct_hoist_31 = new RefRuntype("ABool");
const direct_hoist_32 = new ObjectRuntype({
    "value": direct_hoist_31
}, []);
const direct_hoist_33 = new ConstRuntype("a1");
const direct_hoist_34 = new ConstRuntype("a");
const direct_hoist_35 = new ObjectRuntype({
    "a1": direct_hoist_0,
    "a11": new OptionalFieldRuntype(direct_hoist_0),
    "subType": direct_hoist_33,
    "type": direct_hoist_34
}, []);
const direct_hoist_36 = new ConstRuntype("a2");
const direct_hoist_37 = new ObjectRuntype({
    "a2": direct_hoist_0,
    "subType": direct_hoist_36,
    "type": direct_hoist_34
}, []);
const direct_hoist_38 = new AnyOfDiscriminatedRuntype([
    direct_hoist_35,
    direct_hoist_37
], "subType", {
    "a1": direct_hoist_35,
    "a2": direct_hoist_37
});
const direct_hoist_39 = new ConstRuntype("b");
const direct_hoist_40 = new ObjectRuntype({
    "type": direct_hoist_39,
    "value": direct_hoist_1
}, []);
const direct_hoist_41 = new AnyOfDiscriminatedRuntype([
    direct_hoist_35,
    direct_hoist_37,
    direct_hoist_40
], "type", {
    "a": direct_hoist_38,
    "b": direct_hoist_40
});
const direct_hoist_42 = new RefRuntype("GenericWrapper_string");
const direct_hoist_43 = new AnyOfRuntype([
    direct_hoist_2,
    direct_hoist_0
]);
const direct_hoist_44 = new ObjectRuntype({
    "other": direct_hoist_42,
    "value": direct_hoist_0,
    "value2": direct_hoist_43
}, []);
const direct_hoist_45 = new RefRuntype("GenericWrapper_number");
const direct_hoist_46 = new AnyOfRuntype([
    direct_hoist_2,
    direct_hoist_1
]);
const direct_hoist_47 = new ObjectRuntype({
    "other": direct_hoist_45,
    "value": direct_hoist_1,
    "value2": direct_hoist_46
}, []);
const direct_hoist_48 = new BigIntRuntype();
const direct_hoist_49 = new ObjectRuntype({
    "x": direct_hoist_48
}, []);
const direct_hoist_50 = new DateRuntype();
const direct_hoist_51 = new ObjectRuntype({
    "x": direct_hoist_50
}, []);
const direct_hoist_52 = new TupleRuntype([
    direct_hoist_0
], direct_hoist_0);
const direct_hoist_53 = new RefRuntype("DataWrapper_number");
const direct_hoist_54 = new ArrayRuntype(direct_hoist_15);
const direct_hoist_55 = new ObjectRuntype({
    "children": direct_hoist_54,
    "value": direct_hoist_1
}, []);
const direct_hoist_56 = new ObjectRuntype({
    "a": direct_hoist_11,
    "b": direct_hoist_11
}, []);
const direct_hoist_57 = new RegexRuntype(/(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "`${number}.${number}.${number}`");
const direct_hoist_58 = new RefRuntype("DataWrapper_string");
const direct_hoist_59 = new ObjectRuntype({
    "a": direct_hoist_0,
    "b": direct_hoist_1
}, []);
const direct_hoist_60 = new ObjectRuntype({
    "t1": direct_hoist_9
}, []);
const direct_hoist_61 = new ArrayRuntype(direct_hoist_10);
const direct_hoist_62 = new ObjectRuntype({
    "t2Array": direct_hoist_61
}, []);
const direct_hoist_63 = new ObjectRuntype({
    "wrappedNumber": direct_hoist_45,
    "wrappedString": direct_hoist_42
}, []);
const direct_hoist_64 = new RefRuntype("DataWrapper_boolean");
const direct_hoist_65 = new ObjectRuntype({
    "x1": direct_hoist_21,
    "x2": direct_hoist_22,
    "x3": direct_hoist_64,
    "x4": direct_hoist_21,
    "x5": direct_hoist_22,
    "x6": direct_hoist_64
}, []);
const direct_hoist_66 = new RefRuntype("DataWrapper_instance_5");
const direct_hoist_67 = new ObjectRuntype({
    "x3": direct_hoist_66,
    "x6": direct_hoist_66
}, []);
const direct_hoist_68 = new RefRuntype("DataWrapper_ABool");
const direct_hoist_69 = new ObjectRuntype({
    "x3": direct_hoist_68,
    "x6": direct_hoist_68
}, []);
const direct_hoist_70 = new StringWithFormatRuntype([
    "ValidCurrency"
]);
const namedRuntypes = {
    "ABool": direct_hoist_26,
    "DataWrapper_boolean": direct_hoist_27,
    "DataWrapper_string": direct_hoist_28,
    "DataWrapper_number": direct_hoist_29,
    "DataWrapper_instance_5": direct_hoist_30,
    "DataWrapper_ABool": direct_hoist_32,
    "DiscriminatedUnion": direct_hoist_41,
    "GenericWrapper_string": direct_hoist_44,
    "GenericWrapper_number": direct_hoist_47,
    "InvalidSchemaWithBigInt": direct_hoist_49,
    "InvalidSchemaWithDate": direct_hoist_51,
    "NonEmptyString": direct_hoist_52,
    "NumberWrapped": direct_hoist_53,
    "RecursiveTree": direct_hoist_55,
    "ReusesRef": direct_hoist_56,
    "SemVer": direct_hoist_57,
    "StringWrapped": direct_hoist_58,
    "T1": direct_hoist_59,
    "T2": direct_hoist_60,
    "T3": direct_hoist_62,
    "UsesGenericWrapper": direct_hoist_63,
    "UsesWrappeds": direct_hoist_65,
    "UsesWrappedsComplex": direct_hoist_67,
    "UsesWrappedsComplexRef": direct_hoist_69,
    "ValidCurrency": direct_hoist_70
};
const buildParsersInput = {
    "string": direct_hoist_0,
    "number": direct_hoist_1,
    "boolean": direct_hoist_2,
    "null": direct_hoist_3,
    "undefined": direct_hoist_4,
    "object": direct_hoist_7,
    "anyArray": direct_hoist_8,
    "any": direct_hoist_5,
    "T1": direct_hoist_9,
    "T2": direct_hoist_10,
    "T3": direct_hoist_11,
    "InvalidSchemaWithDate": direct_hoist_12,
    "InvalidSchemaWithBigInt": direct_hoist_13,
    "DiscriminatedUnion": direct_hoist_14,
    "RecursiveTree": direct_hoist_15,
    "SemVer": direct_hoist_16,
    "NonEmptyString": direct_hoist_17,
    "ValidCurrency": direct_hoist_18,
    "ReusesRef": direct_hoist_19,
    "UsesGenericWrapper": direct_hoist_20,
    "StringWrapped": direct_hoist_21,
    "NumberWrapped": direct_hoist_22,
    "UsesWrappeds": direct_hoist_23,
    "UsesWrappedsComplex": direct_hoist_24,
    "UsesWrappedsComplexRef": direct_hoist_25
};

export default { buildParsers };