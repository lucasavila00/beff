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
const direct_hoist_12 = new TypeofRuntype("string");
const direct_hoist_13 = new ObjectRuntype({
    "city": direct_hoist_12,
    "street": direct_hoist_12
}, []);
const direct_hoist_14 = new ObjectRuntype({
    "source": direct_hoist_12
}, []);
const direct_hoist_15 = new ObjectRuntype({
    "metadata": direct_hoist_14,
    "user": direct_hoist_1
}, []);
const direct_hoist_16 = new ObjectRuntype({
    "user": direct_hoist_1
}, []);
const direct_hoist_17 = new ConstRuntype(true);
const direct_hoist_18 = new NullishRuntype("null");
const direct_hoist_19 = new ConstRuntype(3);
const direct_hoist_20 = new ConstRuntype("ok");
const direct_hoist_21 = new ObjectRuntype({
    "enabled": direct_hoist_17,
    "nullable": direct_hoist_18,
    "retries": direct_hoist_19,
    "status": direct_hoist_20
}, []);
const direct_hoist_22 = new AnyOfConstsRuntype([
    200,
    201
]);
const direct_hoist_23 = new AnyOfConstsRuntype([
    false,
    true
]);
const direct_hoist_24 = new ConstRuntype("fallback");
const direct_hoist_25 = new ConstRuntype(0);
const direct_hoist_26 = new AnyOfRuntype([
    direct_hoist_18,
    direct_hoist_24,
    direct_hoist_25
]);
const direct_hoist_27 = new AnyOfConstsRuntype([
    "admin",
    "member"
]);
const direct_hoist_28 = new ObjectRuntype({
    "code": direct_hoist_22,
    "enabled": direct_hoist_23,
    "mixed": direct_hoist_26,
    "role": direct_hoist_27
}, []);
const direct_hoist_29 = new ConstRuntype("primary");
const direct_hoist_30 = new AnyOfRuntype([
    direct_hoist_18,
    direct_hoist_24,
    direct_hoist_29
]);
const direct_hoist_31 = new AnyOfRuntype([
    direct_hoist_18,
    direct_hoist_12
]);
const direct_hoist_32 = new ObjectRuntype({
    "maybeEnum": direct_hoist_30,
    "maybeText": direct_hoist_31,
    "onlyNull": direct_hoist_18
}, []);
const direct_hoist_33 = new AnyRuntype();
const direct_hoist_34 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_12,
        "value": direct_hoist_33
    }
]);
const direct_hoist_35 = new ObjectRuntype({
    "payload": direct_hoist_34
}, []);
const direct_hoist_36 = new ObjectRuntype({
    "previous": new OptionalFieldRuntype(direct_hoist_7),
    "root": direct_hoist_6
}, []);
const direct_hoist_37 = new ArrayRuntype(direct_hoist_6);
const direct_hoist_38 = new ObjectRuntype({
    "children": direct_hoist_37,
    "value": direct_hoist_12
}, []);
const direct_hoist_39 = new ArrayRuntype(direct_hoist_1);
const direct_hoist_40 = new ObjectRuntype({
    "items": direct_hoist_39,
    "primaryAddress": direct_hoist_0
}, []);
const direct_hoist_41 = new ObjectRuntype({
    "address": direct_hoist_0,
    "id": direct_hoist_12
}, []);
const direct_hoist_42 = new ObjectRuntype({
    "displayName": direct_hoist_12
}, []);
const direct_hoist_43 = new ObjectRuntype({
    "address": direct_hoist_0,
    "id": direct_hoist_12,
    "profile": direct_hoist_42
}, []);
const namedRuntypes = {
    "Address": direct_hoist_13,
    "CreateUserRequest": direct_hoist_15,
    "CreateUserResponse": direct_hoist_16,
    "OpenApiCompatConstPayload": direct_hoist_21,
    "OpenApiCompatEnumPayload": direct_hoist_28,
    "OpenApiCompatOptionalizedPayload": direct_hoist_32,
    "OpenApiCompatRecordPayload": direct_hoist_35,
    "RecursiveEnvelope": direct_hoist_36,
    "RecursiveTree": direct_hoist_38,
    "SearchUsersResponse": direct_hoist_40,
    "UpdateUserRequest": direct_hoist_41,
    "User": direct_hoist_43
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
    "OpenApiCompatOptionalizedPayload": direct_hoist_11
};

exports.default = { buildParsers };