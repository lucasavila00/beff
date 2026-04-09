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
const direct_hoist_13 = new TypeofRuntype("string");
const direct_hoist_14 = new ObjectRuntype({
    "city": direct_hoist_13,
    "street": direct_hoist_13
}, []);
const direct_hoist_15 = new ObjectRuntype({
    "source": direct_hoist_13
}, []);
const direct_hoist_16 = new ObjectRuntype({
    "metadata": direct_hoist_15,
    "user": direct_hoist_1
}, []);
const direct_hoist_17 = new ObjectRuntype({
    "user": direct_hoist_1
}, []);
const direct_hoist_18 = new ConstRuntype(true);
const direct_hoist_19 = new NullishRuntype("null");
const direct_hoist_20 = new ConstRuntype(3);
const direct_hoist_21 = new ConstRuntype("ok");
const direct_hoist_22 = new ObjectRuntype({
    "enabled": direct_hoist_18,
    "nullable": direct_hoist_19,
    "retries": direct_hoist_20,
    "status": direct_hoist_21
}, []);
const direct_hoist_23 = new AnyOfConstsRuntype([
    200,
    201
]);
const direct_hoist_24 = new AnyOfConstsRuntype([
    false,
    true
]);
const direct_hoist_25 = new ConstRuntype("fallback");
const direct_hoist_26 = new ConstRuntype(0);
const direct_hoist_27 = new AnyOfRuntype([
    direct_hoist_19,
    direct_hoist_25,
    direct_hoist_26
]);
const direct_hoist_28 = new AnyOfConstsRuntype([
    "admin",
    "member"
]);
const direct_hoist_29 = new ObjectRuntype({
    "code": direct_hoist_23,
    "enabled": direct_hoist_24,
    "mixed": direct_hoist_27,
    "role": direct_hoist_28
}, []);
const direct_hoist_30 = new ObjectRuntype({
    "it": new OptionalFieldRuntype(direct_hoist_13)
}, []);
const direct_hoist_31 = new ConstRuntype("primary");
const direct_hoist_32 = new AnyOfRuntype([
    direct_hoist_19,
    direct_hoist_25,
    direct_hoist_31
]);
const direct_hoist_33 = new AnyOfRuntype([
    direct_hoist_19,
    direct_hoist_13
]);
const direct_hoist_34 = new NullishRuntype("undefined");
const direct_hoist_35 = new AnyOfRuntype([
    direct_hoist_34,
    direct_hoist_13
]);
const direct_hoist_36 = new ObjectRuntype({
    "maybeEnum": direct_hoist_32,
    "maybeText": direct_hoist_33,
    "onlyNull": direct_hoist_19,
    "optional": new OptionalFieldRuntype(direct_hoist_13),
    "orUndefined": direct_hoist_35
}, []);
const direct_hoist_37 = new AnyRuntype();
const direct_hoist_38 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_13,
        "value": direct_hoist_37
    }
]);
const direct_hoist_39 = new ObjectRuntype({
    "payload": direct_hoist_38
}, []);
const direct_hoist_40 = new ObjectRuntype({
    "previous": new OptionalFieldRuntype(direct_hoist_7),
    "root": direct_hoist_6
}, []);
const direct_hoist_41 = new ArrayRuntype(direct_hoist_6);
const direct_hoist_42 = new ObjectRuntype({
    "children": direct_hoist_41,
    "value": direct_hoist_13
}, []);
const direct_hoist_43 = new ArrayRuntype(direct_hoist_1);
const direct_hoist_44 = new ObjectRuntype({
    "items": direct_hoist_43,
    "primaryAddress": direct_hoist_0
}, []);
const direct_hoist_45 = new ObjectRuntype({
    "address": direct_hoist_0,
    "id": direct_hoist_13
}, []);
const direct_hoist_46 = new ObjectRuntype({
    "displayName": direct_hoist_13
}, []);
const direct_hoist_47 = new ObjectRuntype({
    "address": direct_hoist_0,
    "id": direct_hoist_13,
    "profile": direct_hoist_46
}, []);
const namedRuntypes = {
    "Address": direct_hoist_14,
    "CreateUserRequest": direct_hoist_16,
    "CreateUserResponse": direct_hoist_17,
    "OpenApiCompatConstPayload": direct_hoist_22,
    "OpenApiCompatEnumPayload": direct_hoist_29,
    "OpenApiCompatOptinal": direct_hoist_30,
    "OpenApiCompatOptionalizedPayload": direct_hoist_36,
    "OpenApiCompatRecordPayload": direct_hoist_39,
    "RecursiveEnvelope": direct_hoist_40,
    "RecursiveTree": direct_hoist_42,
    "SearchUsersResponse": direct_hoist_44,
    "UpdateUserRequest": direct_hoist_45,
    "User": direct_hoist_47
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
    "OpenApiCompatOptinal": direct_hoist_12
};

exports.default = { buildParsers };