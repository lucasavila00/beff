//@ts-nocheck

Object.defineProperty(exports, "__esModule", {
  value: true
});
    
"use strict";

const {
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
} = require("@beff/client/codegen-v2");

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
const direct_hoist_0 = new RefRuntype("Address");
const direct_hoist_1 = new RefRuntype("User");
const direct_hoist_2 = new RefRuntype("CreateUserRequest");
const direct_hoist_3 = new RefRuntype("CreateUserResponse");
const direct_hoist_4 = new RefRuntype("UpdateUserRequest");
const direct_hoist_5 = new RefRuntype("SearchUsersResponse");
const direct_hoist_6 = new RefRuntype("RecursiveTree");
const direct_hoist_7 = new RefRuntype("RecursiveEnvelope");
const direct_hoist_8 = new RefRuntype("OpenApiCompatConstPayload");
const direct_hoist_9 = new RefRuntype("OpenApiCompatEnumPayload");
const direct_hoist_10 = new RefRuntype("OpenApiCompatRecordPayload");
const direct_hoist_11 = new RefRuntype("OpenApiCompatOptionalizedPayload");
const direct_hoist_12 = new RefRuntype("OpenApiCompatOptinal");
const direct_hoist_13 = new RefRuntype("OpenApiCompatDiscUnion");
const direct_hoist_14 = new RefRuntype("OpenApiCompatDiscUnionCron");
const direct_hoist_15 = new RefRuntype("OpenApiCompatDiscUnionEvent");
const direct_hoist_16 = new RefRuntype("OpenApiCompatDiscUnionAndNamedTypes");
const direct_hoist_17 = new TypeofRuntype("string");
const direct_hoist_18 = new ObjectRuntype({
    "city": direct_hoist_17,
    "street": direct_hoist_17
}, []);
const direct_hoist_19 = new ObjectRuntype({
    "source": direct_hoist_17
}, []);
const direct_hoist_20 = new ObjectRuntype({
    "metadata": direct_hoist_19,
    "user": direct_hoist_1
}, []);
const direct_hoist_21 = new ObjectRuntype({
    "user": direct_hoist_1
}, []);
const direct_hoist_22 = new ConstRuntype(true);
const direct_hoist_23 = new NullishRuntype("null");
const direct_hoist_24 = new ConstRuntype(3);
const direct_hoist_25 = new ConstRuntype("ok");
const direct_hoist_26 = new ObjectRuntype({
    "enabled": direct_hoist_22,
    "nullable": direct_hoist_23,
    "retries": direct_hoist_24,
    "status": direct_hoist_25
}, []);
const direct_hoist_27 = new ConstRuntype("CRON");
const direct_hoist_28 = new ObjectRuntype({
    "schedule": direct_hoist_17,
    "type": direct_hoist_27
}, []);
const direct_hoist_29 = new ConstRuntype("EVENT");
const direct_hoist_30 = new ObjectRuntype({
    "eventName": direct_hoist_17,
    "type": direct_hoist_29
}, []);
const direct_hoist_31 = new AnyOfDiscriminatedRuntype([
    direct_hoist_30,
    direct_hoist_28
], "type", {
    "CRON": direct_hoist_28,
    "EVENT": direct_hoist_30
}, {
    "CRON": direct_hoist_28,
    "EVENT": direct_hoist_30
});
const direct_hoist_32 = new AnyOfDiscriminatedRuntype([
    direct_hoist_30,
    direct_hoist_28
], "type", {
    "CRON": direct_hoist_28,
    "EVENT": direct_hoist_30
}, {
    "CRON": direct_hoist_28,
    "EVENT": direct_hoist_30
});
const direct_hoist_33 = new AnyOfConstsRuntype([
    200,
    201
]);
const direct_hoist_34 = new AnyOfConstsRuntype([
    false,
    true
]);
const direct_hoist_35 = new ConstRuntype("fallback");
const direct_hoist_36 = new ConstRuntype(0);
const direct_hoist_37 = new AnyOfRuntype([
    direct_hoist_23,
    direct_hoist_35,
    direct_hoist_36
]);
const direct_hoist_38 = new AnyOfConstsRuntype([
    "admin",
    "member"
]);
const direct_hoist_39 = new ObjectRuntype({
    "code": direct_hoist_33,
    "enabled": direct_hoist_34,
    "mixed": direct_hoist_37,
    "role": direct_hoist_38
}, []);
const direct_hoist_40 = new ObjectRuntype({
    "it": new OptionalFieldRuntype(direct_hoist_17)
}, []);
const direct_hoist_41 = new ConstRuntype("primary");
const direct_hoist_42 = new AnyOfRuntype([
    direct_hoist_23,
    direct_hoist_35,
    direct_hoist_41
]);
const direct_hoist_43 = new AnyOfRuntype([
    direct_hoist_23,
    direct_hoist_17
]);
const direct_hoist_44 = new NullishRuntype("undefined");
const direct_hoist_45 = new AnyOfRuntype([
    direct_hoist_44,
    direct_hoist_17
]);
const direct_hoist_46 = new ObjectRuntype({
    "maybeEnum": direct_hoist_42,
    "maybeText": direct_hoist_43,
    "onlyNull": direct_hoist_23,
    "optional": new OptionalFieldRuntype(direct_hoist_17),
    "orUndefined": direct_hoist_45
}, []);
const direct_hoist_47 = new AnyRuntype();
const direct_hoist_48 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_17,
        "value": direct_hoist_47
    }
]);
const direct_hoist_49 = new ObjectRuntype({
    "payload": direct_hoist_48
}, []);
const direct_hoist_50 = new ObjectRuntype({
    "previous": new OptionalFieldRuntype(direct_hoist_7),
    "root": direct_hoist_6
}, []);
const direct_hoist_51 = new ArrayRuntype(direct_hoist_6);
const direct_hoist_52 = new ObjectRuntype({
    "children": direct_hoist_51,
    "value": direct_hoist_17
}, []);
const direct_hoist_53 = new ArrayRuntype(direct_hoist_1);
const direct_hoist_54 = new ObjectRuntype({
    "items": direct_hoist_53,
    "primaryAddress": direct_hoist_0
}, []);
const direct_hoist_55 = new ObjectRuntype({
    "address": direct_hoist_0,
    "id": direct_hoist_17
}, []);
const direct_hoist_56 = new ObjectRuntype({
    "displayName": direct_hoist_17
}, []);
const direct_hoist_57 = new ObjectRuntype({
    "address": direct_hoist_0,
    "id": direct_hoist_17,
    "profile": direct_hoist_56
}, []);
const namedRuntypes = {
    "Address": direct_hoist_18,
    "CreateUserRequest": direct_hoist_20,
    "CreateUserResponse": direct_hoist_21,
    "OpenApiCompatConstPayload": direct_hoist_26,
    "OpenApiCompatDiscUnion": direct_hoist_31,
    "OpenApiCompatDiscUnionAndNamedTypes": direct_hoist_32,
    "OpenApiCompatDiscUnionCron": direct_hoist_28,
    "OpenApiCompatDiscUnionEvent": direct_hoist_30,
    "OpenApiCompatEnumPayload": direct_hoist_39,
    "OpenApiCompatOptinal": direct_hoist_40,
    "OpenApiCompatOptionalizedPayload": direct_hoist_46,
    "OpenApiCompatRecordPayload": direct_hoist_49,
    "RecursiveEnvelope": direct_hoist_50,
    "RecursiveTree": direct_hoist_52,
    "SearchUsersResponse": direct_hoist_54,
    "UpdateUserRequest": direct_hoist_55,
    "User": direct_hoist_57
};
const buildParsersInput = {
    "Address": direct_hoist_0,
    "User": direct_hoist_1,
    "CreateUserRequest": direct_hoist_2,
    "CreateUserResponse": direct_hoist_3,
    "UpdateUserRequest": direct_hoist_4,
    "SearchUsersResponse": direct_hoist_5,
    "RecursiveTree": direct_hoist_6,
    "RecursiveEnvelope": direct_hoist_7,
    "OpenApiCompatConstPayload": direct_hoist_8,
    "OpenApiCompatEnumPayload": direct_hoist_9,
    "OpenApiCompatRecordPayload": direct_hoist_10,
    "OpenApiCompatOptionalizedPayload": direct_hoist_11,
    "OpenApiCompatOptinal": direct_hoist_12,
    "OpenApiCompatDiscUnion": direct_hoist_13,
    "OpenApiCompatDiscUnionCron": direct_hoist_14,
    "OpenApiCompatDiscUnionEvent": direct_hoist_15,
    "OpenApiCompatDiscUnionAndNamedTypes": direct_hoist_16
};

exports.default = { buildParsers };