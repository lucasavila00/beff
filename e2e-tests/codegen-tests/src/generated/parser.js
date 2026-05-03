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
const direct_hoist_0 = new TypeofRuntype("string");
const direct_hoist_1 = new RefRuntype("AliasToString");
const direct_hoist_2 = new RefRuntype("AliasToNumber");
const direct_hoist_3 = new RefRuntype("AliasToBoolean");
const direct_hoist_4 = new RefRuntype("AliasToNull");
const direct_hoist_5 = new RefRuntype("AliasToAny");
const direct_hoist_6 = new RefRuntype("AliasToConst");
const direct_hoist_7 = new RefRuntype("TestHoist");
const direct_hoist_8 = new RefRuntype("NestedOrder");
const direct_hoist_9 = new RefRuntype("BeforeRequired");
const direct_hoist_10 = new RefRuntype("AfterRequired");
const direct_hoist_11 = new RefRuntype("R");
const direct_hoist_12 = new RefRuntype("R2");
const direct_hoist_13 = new RefRuntype("R3");
const direct_hoist_14 = new RefRuntype("R4");
const direct_hoist_15 = new RefRuntype("R5");
const direct_hoist_16 = new RefRuntype("Meta");
const direct_hoist_17 = new RefRuntype("Meta2");
const direct_hoist_18 = new NullishRuntype("undefined");
const direct_hoist_19 = new AnyOfRuntype([
    direct_hoist_18,
    direct_hoist_0
]);
const direct_hoist_20 = new NullishRuntype("void");
const direct_hoist_21 = new AnyOfRuntype([
    direct_hoist_20,
    direct_hoist_0
]);
const direct_hoist_22 = new NullishRuntype("null");
const direct_hoist_23 = new AnyOfRuntype([
    direct_hoist_22,
    direct_hoist_0
]);
const direct_hoist_24 = new ObjectRuntype({
    "a": direct_hoist_0,
    "b": direct_hoist_19,
    "c": direct_hoist_21,
    "d": direct_hoist_23,
    "e": direct_hoist_0
}, []);
const direct_hoist_25 = new AnyRuntype();
const direct_hoist_26 = new TypeofRuntype("boolean");
const direct_hoist_27 = new ConstRuntype("constant value");
const direct_hoist_28 = new TypeofRuntype("number");
const direct_hoist_29 = new ObjectRuntype({
    "a": direct_hoist_0,
    "b": direct_hoist_19,
    "c": direct_hoist_21,
    "d": direct_hoist_23,
    "e": new OptionalFieldRuntype(direct_hoist_0)
}, []);
const direct_hoist_30 = new RegexRuntype(/(alpha_entity_)(.*)/, "`alpha_entity_${string}`");
const direct_hoist_31 = new RegexRuntype(/(beta-entity-)(.*)/, "`beta-entity-${string}`");
const direct_hoist_32 = new AnyOfRuntype([
    direct_hoist_30,
    direct_hoist_31
]);
const direct_hoist_33 = new ObjectRuntype({
    "alpha": new OptionalFieldRuntype(direct_hoist_0),
    "beta": new OptionalFieldRuntype(direct_hoist_0)
}, [
    {
        "key": direct_hoist_32,
        "value": new OptionalFieldRuntype(direct_hoist_0)
    }
]);
const direct_hoist_34 = new ObjectRuntype({
    "alpha": direct_hoist_0,
    "beta": direct_hoist_0
}, [
    {
        "key": direct_hoist_32,
        "value": direct_hoist_0
    }
]);
const direct_hoist_35 = new ConstRuntype("alpha");
const direct_hoist_36 = new ConstRuntype("beta");
const direct_hoist_37 = new AnyOfRuntype([
    direct_hoist_35,
    direct_hoist_30,
    direct_hoist_36,
    direct_hoist_31
]);
const direct_hoist_38 = new ObjectRuntype({
    "a": direct_hoist_28,
    "b": direct_hoist_28
}, []);
const direct_hoist_39 = new ObjectRuntype({
    "label": direct_hoist_0,
    "outer": direct_hoist_38
}, []);
const direct_hoist_40 = new RegexRuntype(/(x_)(.*)/, "`x_${string}`");
const direct_hoist_41 = new ObjectRuntype({
    "a": direct_hoist_28,
    "b": direct_hoist_28
}, [
    {
        "key": direct_hoist_40,
        "value": direct_hoist_28
    }
]);
const direct_hoist_42 = new ObjectRuntype({
    "a": new OptionalFieldRuntype(direct_hoist_28),
    "b": new OptionalFieldRuntype(direct_hoist_28)
}, []);
const direct_hoist_43 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_40,
        "value": direct_hoist_28
    }
]);
const direct_hoist_44 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_40,
        "value": new OptionalFieldRuntype(direct_hoist_28)
    }
]);
const direct_hoist_45 = new ArrayRuntype(direct_hoist_0);
const direct_hoist_46 = new ObjectRuntype({
    "a": direct_hoist_45,
    "b": direct_hoist_45
}, []);
const namedRuntypes = {
    "AfterRequired": direct_hoist_24,
    "AliasToAny": direct_hoist_25,
    "AliasToBoolean": direct_hoist_26,
    "AliasToConst": direct_hoist_27,
    "AliasToNull": direct_hoist_22,
    "AliasToNumber": direct_hoist_28,
    "AliasToString": direct_hoist_0,
    "BeforeRequired": direct_hoist_29,
    "Meta": direct_hoist_33,
    "Meta2": direct_hoist_34,
    "MetaKey": direct_hoist_37,
    "NestedOrder": direct_hoist_39,
    "R": direct_hoist_41,
    "R2": direct_hoist_38,
    "R3": direct_hoist_42,
    "R4": direct_hoist_43,
    "R5": direct_hoist_44,
    "TestHoist": direct_hoist_46
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
    "Meta2": direct_hoist_17
};

export default { buildParsers };