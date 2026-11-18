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
  BaseRefRuntype,
  registerStringFormatter,
  registerNumberFormatter,
  buildParserFromRuntype,
  generateHashFromString,
  TypedArrayRuntype,
  MapRuntype,
  SetRuntype,
  NumberKeyRuntype,
} from "@beff/client/codegen-v2";

class RefRuntype extends BaseRefRuntype  {
  getNamedRuntypes() {
    return namedRuntypes;
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
const direct_hoist_0 = new TypeofRuntype(undefined, "string");
const direct_hoist_1 = new RefRuntype(undefined, "AliasToString");
const direct_hoist_2 = new RefRuntype(undefined, "AliasToNumber");
const direct_hoist_3 = new RefRuntype(undefined, "AliasToBoolean");
const direct_hoist_4 = new RefRuntype(undefined, "AliasToNull");
const direct_hoist_5 = new RefRuntype(undefined, "AliasToAny");
const direct_hoist_6 = new RefRuntype(undefined, "AliasToConst");
const direct_hoist_7 = new RefRuntype(undefined, "TestHoist");
const direct_hoist_8 = new RefRuntype(undefined, "NestedOrder");
const direct_hoist_9 = new RefRuntype(undefined, "BeforeRequired");
const direct_hoist_10 = new RefRuntype(undefined, "AfterRequired");
const direct_hoist_11 = new RefRuntype(undefined, "R");
const direct_hoist_12 = new RefRuntype(undefined, "R2");
const direct_hoist_13 = new RefRuntype(undefined, "R3");
const direct_hoist_14 = new RefRuntype(undefined, "R4");
const direct_hoist_15 = new RefRuntype(undefined, "R5");
const direct_hoist_16 = new RefRuntype(undefined, "Meta");
const direct_hoist_17 = new RefRuntype(undefined, "Meta2");
const direct_hoist_18 = new RefRuntype(undefined, "KnownConstants");
const direct_hoist_19 = new RefRuntype(undefined, "NumberKeys");
const direct_hoist_20 = new RefRuntype(undefined, "NumberIndex");
const direct_hoist_21 = new RefRuntype(undefined, "NumberOrTemplateKeys");
const direct_hoist_22 = new NullishRuntype(undefined, "undefined");
const direct_hoist_23 = new AnyOfRuntype(undefined, [
    direct_hoist_22,
    direct_hoist_0
]);
const direct_hoist_24 = new NullishRuntype(undefined, "void");
const direct_hoist_25 = new AnyOfRuntype(undefined, [
    direct_hoist_24,
    direct_hoist_0
]);
const direct_hoist_26 = new NullishRuntype(undefined, "null");
const direct_hoist_27 = new AnyOfRuntype(undefined, [
    direct_hoist_26,
    direct_hoist_0
]);
const direct_hoist_28 = new ObjectRuntype(undefined, {
    "a": direct_hoist_0,
    "b": direct_hoist_23,
    "c": direct_hoist_25,
    "d": direct_hoist_27,
    "e": direct_hoist_0
}, []);
const direct_hoist_29 = new AnyRuntype(undefined);
const direct_hoist_30 = new TypeofRuntype(undefined, "boolean");
const direct_hoist_31 = new ConstRuntype(undefined, "constant value");
const direct_hoist_32 = new TypeofRuntype(undefined, "number");
const direct_hoist_33 = new ObjectRuntype(undefined, {
    "a": direct_hoist_0,
    "b": direct_hoist_23,
    "c": direct_hoist_25,
    "d": direct_hoist_27,
    "e": new OptionalFieldRuntype(direct_hoist_0)
}, []);
const direct_hoist_34 = new AnyOfConstsRuntype(undefined, [
    "blue",
    "red"
]);
const direct_hoist_35 = new ArrayRuntype(undefined, direct_hoist_0);
const direct_hoist_36 = new ObjectRuntype(undefined, {
    "BAR_OPTION": direct_hoist_34,
    "BAZ_VALUES": direct_hoist_35,
    "FOO_VALUE": direct_hoist_0
}, []);
const direct_hoist_37 = new RegexRuntype(undefined, /^(alpha_entity_)(.*)$/, "`alpha_entity_${string}`");
const direct_hoist_38 = new RegexRuntype(undefined, /^(beta-entity-)(.*)$/, "`beta-entity-${string}`");
const direct_hoist_39 = new AnyOfRuntype(undefined, [
    direct_hoist_37,
    direct_hoist_38
]);
const direct_hoist_40 = new ObjectRuntype(undefined, {
    "alpha": new OptionalFieldRuntype(direct_hoist_0),
    "beta": new OptionalFieldRuntype(direct_hoist_0)
}, [
    {
        "key": direct_hoist_39,
        "value": new OptionalFieldRuntype(direct_hoist_0)
    }
]);
const direct_hoist_41 = new ObjectRuntype(undefined, {
    "alpha": direct_hoist_0,
    "beta": direct_hoist_0
}, [
    {
        "key": direct_hoist_39,
        "value": direct_hoist_0
    }
]);
const direct_hoist_42 = new ConstRuntype(undefined, "alpha");
const direct_hoist_43 = new ConstRuntype(undefined, "beta");
const direct_hoist_44 = new AnyOfRuntype(undefined, [
    direct_hoist_42,
    direct_hoist_37,
    direct_hoist_43,
    direct_hoist_38
]);
const direct_hoist_45 = new ObjectRuntype(undefined, {
    "a": direct_hoist_32,
    "b": direct_hoist_32
}, []);
const direct_hoist_46 = new ObjectRuntype(undefined, {
    "label": direct_hoist_0,
    "outer": direct_hoist_45
}, []);
const direct_hoist_47 = new ObjectRuntype(undefined, {}, [
    {
        "key": new NumberKeyRuntype(undefined),
        "value": direct_hoist_30
    }
]);
const direct_hoist_48 = new ObjectRuntype(undefined, {}, [
    {
        "key": new NumberKeyRuntype(undefined),
        "value": direct_hoist_0
    }
]);
const direct_hoist_49 = new RegexRuntype(undefined, /^(x_)(.*)$/, "`x_${string}`");
const direct_hoist_50 = new ObjectRuntype(undefined, {}, [
    {
        "key": new AnyOfRuntype(undefined, [
            new NumberKeyRuntype(undefined),
            direct_hoist_49
        ]),
        "value": direct_hoist_0
    }
]);
const direct_hoist_51 = new ObjectRuntype(undefined, {
    "a": direct_hoist_32,
    "b": direct_hoist_32
}, [
    {
        "key": direct_hoist_49,
        "value": direct_hoist_32
    }
]);
const direct_hoist_52 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_32),
    "b": new OptionalFieldRuntype(direct_hoist_32)
}, []);
const direct_hoist_53 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_49,
        "value": direct_hoist_32
    }
]);
const direct_hoist_54 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_49,
        "value": new OptionalFieldRuntype(direct_hoist_32)
    }
]);
const direct_hoist_55 = new ObjectRuntype(undefined, {
    "a": direct_hoist_35,
    "b": direct_hoist_35
}, []);
const namedRuntypes = {
    "AfterRequired": direct_hoist_28,
    "AliasToAny": direct_hoist_29,
    "AliasToBoolean": direct_hoist_30,
    "AliasToConst": direct_hoist_31,
    "AliasToNull": direct_hoist_26,
    "AliasToNumber": direct_hoist_32,
    "AliasToString": direct_hoist_0,
    "BeforeRequired": direct_hoist_33,
    "KnownConstants": direct_hoist_36,
    "Meta": direct_hoist_40,
    "Meta2": direct_hoist_41,
    "MetaKey": direct_hoist_44,
    "NestedOrder": direct_hoist_46,
    "NumberIndex": direct_hoist_47,
    "NumberKeys": direct_hoist_48,
    "NumberOrTemplateKeys": direct_hoist_50,
    "R": direct_hoist_51,
    "R2": direct_hoist_45,
    "R3": direct_hoist_52,
    "R4": direct_hoist_53,
    "R5": direct_hoist_54,
    "TestHoist": direct_hoist_55
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
    "NestedOrder": direct_hoist_8,
    "BeforeRequired": direct_hoist_9,
    "AfterRequired": direct_hoist_10,
    "R": direct_hoist_11,
    "R2": direct_hoist_12,
    "R3": direct_hoist_13,
    "R4": direct_hoist_14,
    "R5": direct_hoist_15,
    "Meta": direct_hoist_16,
    "Meta2": direct_hoist_17,
    "KnownConstants": direct_hoist_18,
    "NumberKeys": direct_hoist_19,
    "NumberIndex": direct_hoist_20,
    "NumberOrTemplateKeys": direct_hoist_21
};

export default { buildParsers };