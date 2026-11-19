//@ts-nocheck

Object.defineProperty(exports, "__esModule", {
  value: true
});
    
"use strict";

const {
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
} = require("@beff/client/codegen-v2");

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
const direct_hoist_0 = string();
const direct_hoist_1 = number();
const direct_hoist_2 = boolean();
const direct_hoist_3 = nullType();
const direct_hoist_4 = undefinedType();
const direct_hoist_5 = any();
const direct_hoist_6 = object({}, [
    {
        key: union([
            direct_hoist_0,
            numberKey()
        ]),
        value: direct_hoist_5
    }
]);
const direct_hoist_7 = array(direct_hoist_5);
const direct_hoist_8 = reference(registry, "T1");
const direct_hoist_9 = reference(registry, "DocumentedPayload");
const direct_hoist_10 = reference(registry, "T2");
const direct_hoist_11 = reference(registry, "T3");
const direct_hoist_12 = reference(registry, "InvalidSchemaWithDate");
const direct_hoist_13 = reference(registry, "InvalidSchemaWithBigInt");
const direct_hoist_14 = reference(registry, "DiscriminatedUnion");
const direct_hoist_15 = reference(registry, "RecursiveTree");
const direct_hoist_16 = reference(registry, "SemVer");
const direct_hoist_17 = reference(registry, "NonEmptyString");
const direct_hoist_18 = reference(registry, "ValidCurrency");
const direct_hoist_19 = reference(registry, "EmptyClosedRecord");
const direct_hoist_20 = reference(registry, "OptionalNullishInput");
const direct_hoist_21 = reference(registry, "ToolInput");
const direct_hoist_22 = literal("a1");
const direct_hoist_23 = literal("a");
const direct_hoist_24 = object({
    a1: direct_hoist_0,
    a11: optional(direct_hoist_0),
    subType: direct_hoist_22,
    type: direct_hoist_23
});
const direct_hoist_25 = literal("a2");
const direct_hoist_26 = object({
    a2: direct_hoist_0,
    subType: direct_hoist_25,
    type: direct_hoist_23
});
const direct_hoist_27 = discriminatedUnion("subType", {
    a1: direct_hoist_24,
    a2: direct_hoist_26
}, [
    direct_hoist_24,
    direct_hoist_26
]);
const direct_hoist_28 = literal("b");
const direct_hoist_29 = object({
    type: direct_hoist_28,
    value: direct_hoist_1
});
const direct_hoist_30 = discriminatedUnion("type", {
    a: direct_hoist_27,
    b: direct_hoist_29
}, [
    direct_hoist_24,
    direct_hoist_26,
    direct_hoist_29
]);
const direct_hoist_31 = withDescription(string(), "Stable payload id.");
const direct_hoist_32 = withDescription(number(), "Optional retry count.");
const direct_hoist_33 = withDescription(object({
    id: direct_hoist_31,
    retries: optional(direct_hoist_32)
}), "Documented payload for flat JSON Schema.");
const direct_hoist_34 = never();
const direct_hoist_35 = object({}, [
    {
        key: direct_hoist_0,
        value: direct_hoist_34
    }
]);
const direct_hoist_36 = bigint();
const direct_hoist_37 = object({
    x: direct_hoist_36
});
const direct_hoist_38 = date();
const direct_hoist_39 = object({
    x: direct_hoist_38
});
const direct_hoist_40 = tuple([
    direct_hoist_0
], direct_hoist_0);
const direct_hoist_41 = union([
    direct_hoist_3,
    direct_hoist_4,
    direct_hoist_1
]);
const direct_hoist_42 = union([
    direct_hoist_3,
    direct_hoist_4,
    direct_hoist_0
]);
const direct_hoist_43 = object({
    limit: optional(direct_hoist_41),
    value: optional(direct_hoist_42)
});
const direct_hoist_44 = array(direct_hoist_15);
const direct_hoist_45 = object({
    children: direct_hoist_44,
    value: direct_hoist_1
});
const direct_hoist_46 = regex(/^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}.${number}.${number}`");
const direct_hoist_47 = object({
    a: direct_hoist_0,
    b: direct_hoist_1
});
const direct_hoist_48 = object({
    t1: direct_hoist_8
});
const direct_hoist_49 = array(direct_hoist_10);
const direct_hoist_50 = object({
    t2Array: direct_hoist_49
});
const direct_hoist_51 = literal("stock_picker");
const direct_hoist_52 = object({
    key: direct_hoist_51
});
const direct_hoist_53 = reference(registry, "ToolEnvelope");
const direct_hoist_54 = reference(registry, "WorkflowInput");
const direct_hoist_55 = intersection([
    direct_hoist_53,
    direct_hoist_54
]);
const direct_hoist_56 = stringWithFormat([
    "ValidCurrency"
]);
const direct_hoist_57 = object({
    evaluationEndDate: direct_hoist_0,
    evaluationStartDate: direct_hoist_0,
    optionalNote: optional(direct_hoist_0),
    trainingEndDate: direct_hoist_0
});
define(registry, {
    DiscriminatedUnion: direct_hoist_30,
    DocumentedPayload: direct_hoist_33,
    EmptyClosedRecord: direct_hoist_35,
    InvalidSchemaWithBigInt: direct_hoist_37,
    InvalidSchemaWithDate: direct_hoist_39,
    NonEmptyString: direct_hoist_40,
    OptionalNullishInput: direct_hoist_43,
    RecursiveTree: direct_hoist_45,
    SemVer: direct_hoist_46,
    T1: direct_hoist_47,
    T2: direct_hoist_48,
    T3: direct_hoist_50,
    ToolEnvelope: direct_hoist_52,
    ToolInput: direct_hoist_55,
    ValidCurrency: direct_hoist_56,
    WorkflowInput: direct_hoist_57
});
const buildParsersInput = {
    string: direct_hoist_0,
    number: direct_hoist_1,
    boolean: direct_hoist_2,
    null: direct_hoist_3,
    undefined: direct_hoist_4,
    object: direct_hoist_6,
    anyArray: direct_hoist_7,
    any: direct_hoist_5,
    T1: direct_hoist_8,
    DocumentedPayload: direct_hoist_9,
    T2: direct_hoist_10,
    T3: direct_hoist_11,
    InvalidSchemaWithDate: direct_hoist_12,
    InvalidSchemaWithBigInt: direct_hoist_13,
    DiscriminatedUnion: direct_hoist_14,
    RecursiveTree: direct_hoist_15,
    SemVer: direct_hoist_16,
    NonEmptyString: direct_hoist_17,
    ValidCurrency: direct_hoist_18,
    EmptyClosedRecord: direct_hoist_19,
    OptionalNullishInput: direct_hoist_20,
    ToolInput: direct_hoist_21
};

exports.default = { buildParsers };