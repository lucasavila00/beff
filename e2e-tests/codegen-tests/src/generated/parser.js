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
const direct_hoist_0 = string();
const direct_hoist_1 = reference(registry, "AliasToString");
const direct_hoist_2 = reference(registry, "AliasToNumber");
const direct_hoist_3 = reference(registry, "AliasToBoolean");
const direct_hoist_4 = reference(registry, "AliasToNull");
const direct_hoist_5 = reference(registry, "AliasToAny");
const direct_hoist_6 = reference(registry, "AliasToConst");
const direct_hoist_7 = reference(registry, "TestHoist");
const direct_hoist_8 = reference(registry, "NestedOrder");
const direct_hoist_9 = reference(registry, "BeforeRequired");
const direct_hoist_10 = reference(registry, "AfterRequired");
const direct_hoist_11 = reference(registry, "R");
const direct_hoist_12 = reference(registry, "R2");
const direct_hoist_13 = reference(registry, "R3");
const direct_hoist_14 = reference(registry, "R4");
const direct_hoist_15 = reference(registry, "R5");
const direct_hoist_16 = reference(registry, "Meta");
const direct_hoist_17 = reference(registry, "Meta2");
const direct_hoist_18 = reference(registry, "KnownConstants");
const direct_hoist_19 = reference(registry, "NumberKeys");
const direct_hoist_20 = reference(registry, "NumberIndex");
const direct_hoist_21 = reference(registry, "NumberOrTemplateKeys");
const direct_hoist_22 = reference(registry, "DefaultTypeParams");
const direct_hoist_23 = reference(registry, "NumberLiteralKeys");
const direct_hoist_24 = reference(registry, "PartialNumberLiteralKeys");
const direct_hoist_25 = reference(registry, "MixedLiteralKeys");
const direct_hoist_26 = undefinedType();
const direct_hoist_27 = union([
    direct_hoist_26,
    direct_hoist_0
]);
const direct_hoist_28 = voidType();
const direct_hoist_29 = union([
    direct_hoist_28,
    direct_hoist_0
]);
const direct_hoist_30 = nullType();
const direct_hoist_31 = union([
    direct_hoist_30,
    direct_hoist_0
]);
const direct_hoist_32 = object({
    a: direct_hoist_0,
    b: direct_hoist_27,
    c: direct_hoist_29,
    d: direct_hoist_31,
    e: direct_hoist_0
});
const direct_hoist_33 = any();
const direct_hoist_34 = boolean();
const direct_hoist_35 = literal("constant value");
const direct_hoist_36 = number();
const direct_hoist_37 = object({
    a: direct_hoist_0,
    b: direct_hoist_27,
    c: direct_hoist_29,
    d: direct_hoist_31,
    e: optional(direct_hoist_0)
});
const direct_hoist_38 = object({
    v: direct_hoist_0
});
const direct_hoist_39 = object({
    v: direct_hoist_36
});
const direct_hoist_40 = object({
    a: direct_hoist_36,
    b: direct_hoist_0
});
const direct_hoist_41 = array(direct_hoist_34);
const direct_hoist_42 = object({
    a: direct_hoist_34,
    b: direct_hoist_41
});
const direct_hoist_43 = array(direct_hoist_36);
const direct_hoist_44 = object({
    a: direct_hoist_36,
    b: direct_hoist_43
});
const direct_hoist_45 = reference(registry, "DefaultG");
const direct_hoist_46 = reference(registry, "DefaultG_number");
const direct_hoist_47 = reference(registry, "DefaultH_number");
const direct_hoist_48 = reference(registry, "DefaultI_boolean");
const direct_hoist_49 = reference(registry, "DefaultP_number");
const direct_hoist_50 = object({
    g: direct_hoist_45,
    gn: direct_hoist_46,
    h: direct_hoist_47,
    i: direct_hoist_48,
    p: direct_hoist_49
});
const direct_hoist_51 = literals([
    "blue",
    "red"
]);
const direct_hoist_52 = array(direct_hoist_0);
const direct_hoist_53 = object({
    BAR_OPTION: direct_hoist_51,
    BAZ_VALUES: direct_hoist_52,
    FOO_VALUE: direct_hoist_0
});
const direct_hoist_54 = regex(/^(alpha_entity_)([\s\S]*)$/, "`alpha_entity_${string}`");
const direct_hoist_55 = regex(/^(beta-entity-)([\s\S]*)$/, "`beta-entity-${string}`");
const direct_hoist_56 = union([
    direct_hoist_54,
    direct_hoist_55
]);
const direct_hoist_57 = object({
    alpha: optional(direct_hoist_0),
    beta: optional(direct_hoist_0)
}, [
    {
        key: direct_hoist_56,
        value: optional(direct_hoist_0)
    }
]);
const direct_hoist_58 = object({
    alpha: direct_hoist_0,
    beta: direct_hoist_0
}, [
    {
        key: direct_hoist_56,
        value: direct_hoist_0
    }
]);
const direct_hoist_59 = literal("alpha");
const direct_hoist_60 = literal("beta");
const direct_hoist_61 = union([
    direct_hoist_59,
    direct_hoist_54,
    direct_hoist_60,
    direct_hoist_55
]);
const direct_hoist_62 = object({
    "1": direct_hoist_0,
    a: direct_hoist_0
});
const direct_hoist_63 = object({
    a: direct_hoist_36,
    b: direct_hoist_36
});
const direct_hoist_64 = object({
    label: direct_hoist_0,
    outer: direct_hoist_63
});
const direct_hoist_65 = object({}, [
    {
        key: numberKey(),
        value: direct_hoist_34
    }
]);
const direct_hoist_66 = object({}, [
    {
        key: numberKey(),
        value: direct_hoist_0
    }
]);
const direct_hoist_67 = object({
    "1": direct_hoist_0,
    "2": direct_hoist_0
});
const direct_hoist_68 = regex(/^(x_)([\s\S]*)$/, "`x_${string}`");
const direct_hoist_69 = object({}, [
    {
        key: union([
            numberKey(),
            direct_hoist_68
        ]),
        value: direct_hoist_0
    }
]);
const direct_hoist_70 = object({
    "1": optional(direct_hoist_0),
    "2": optional(direct_hoist_0)
});
const direct_hoist_71 = object({
    a: direct_hoist_36,
    b: direct_hoist_36
}, [
    {
        key: direct_hoist_68,
        value: direct_hoist_36
    }
]);
const direct_hoist_72 = object({
    a: optional(direct_hoist_36),
    b: optional(direct_hoist_36)
});
const direct_hoist_73 = object({}, [
    {
        key: direct_hoist_68,
        value: direct_hoist_36
    }
]);
const direct_hoist_74 = object({}, [
    {
        key: direct_hoist_68,
        value: optional(direct_hoist_36)
    }
]);
const direct_hoist_75 = object({
    a: direct_hoist_52,
    b: direct_hoist_52
});
define(registry, {
    AfterRequired: direct_hoist_32,
    AliasToAny: direct_hoist_33,
    AliasToBoolean: direct_hoist_34,
    AliasToConst: direct_hoist_35,
    AliasToNull: direct_hoist_30,
    AliasToNumber: direct_hoist_36,
    AliasToString: direct_hoist_0,
    BeforeRequired: direct_hoist_37,
    DefaultG: direct_hoist_38,
    DefaultG_number: direct_hoist_39,
    DefaultH_number: direct_hoist_40,
    DefaultI_boolean: direct_hoist_42,
    DefaultP_number: direct_hoist_44,
    DefaultTypeParams: direct_hoist_50,
    KnownConstants: direct_hoist_53,
    Meta: direct_hoist_57,
    Meta2: direct_hoist_58,
    MetaKey: direct_hoist_61,
    MixedLiteralKeys: direct_hoist_62,
    NestedOrder: direct_hoist_64,
    NumberIndex: direct_hoist_65,
    NumberKeys: direct_hoist_66,
    NumberLiteralKeys: direct_hoist_67,
    NumberOrTemplateKeys: direct_hoist_69,
    PartialNumberLiteralKeys: direct_hoist_70,
    R: direct_hoist_71,
    R2: direct_hoist_63,
    R3: direct_hoist_72,
    R4: direct_hoist_73,
    R5: direct_hoist_74,
    TestHoist: direct_hoist_75
});
const buildParsersInput = {
    Dec: direct_hoist_0,
    AliasToString: direct_hoist_1,
    AliasToNumber: direct_hoist_2,
    AliasToBoolean: direct_hoist_3,
    AliasToNull: direct_hoist_4,
    AliasToAny: direct_hoist_5,
    AliasToConst: direct_hoist_6,
    TestHoist: direct_hoist_7,
    NestedOrder: direct_hoist_8,
    BeforeRequired: direct_hoist_9,
    AfterRequired: direct_hoist_10,
    R: direct_hoist_11,
    R2: direct_hoist_12,
    R3: direct_hoist_13,
    R4: direct_hoist_14,
    R5: direct_hoist_15,
    Meta: direct_hoist_16,
    Meta2: direct_hoist_17,
    KnownConstants: direct_hoist_18,
    NumberKeys: direct_hoist_19,
    NumberIndex: direct_hoist_20,
    NumberOrTemplateKeys: direct_hoist_21,
    DefaultTypeParams: direct_hoist_22,
    NumberLiteralKeys: direct_hoist_23,
    PartialNumberLiteralKeys: direct_hoist_24,
    MixedLiteralKeys: direct_hoist_25
};

export default { buildParsers };