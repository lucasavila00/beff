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
const direct_hoist_6 = new TypeofRuntype("string");
const direct_hoist_7 = new ObjectRuntype({
    "city": direct_hoist_6,
    "street": direct_hoist_6
}, []);
const direct_hoist_8 = new ObjectRuntype({
    "source": direct_hoist_6
}, []);
const direct_hoist_9 = new ObjectRuntype({
    "metadata": direct_hoist_8,
    "user": direct_hoist_1
}, []);
const direct_hoist_10 = new ObjectRuntype({
    "user": direct_hoist_1
}, []);
const direct_hoist_11 = new ArrayRuntype(direct_hoist_1);
const direct_hoist_12 = new ObjectRuntype({
    "items": direct_hoist_11,
    "primaryAddress": direct_hoist_0
}, []);
const direct_hoist_13 = new ObjectRuntype({
    "address": direct_hoist_0,
    "id": direct_hoist_6
}, []);
const direct_hoist_14 = new ObjectRuntype({
    "displayName": direct_hoist_6
}, []);
const direct_hoist_15 = new ObjectRuntype({
    "address": direct_hoist_0,
    "id": direct_hoist_6,
    "profile": direct_hoist_14
}, []);
const namedRuntypes = {
    "Address": direct_hoist_7,
    "CreateUserRequest": direct_hoist_9,
    "CreateUserResponse": direct_hoist_10,
    "SearchUsersResponse": direct_hoist_12,
    "UpdateUserRequest": direct_hoist_13,
    "User": direct_hoist_15
};
const buildParsersInput = {
    "Address": direct_hoist_0,
    "User": direct_hoist_1,
    "CreateUserRequest": direct_hoist_2,
    "CreateUserResponse": direct_hoist_3,
    "UpdateUserRequest": direct_hoist_4,
    "SearchUsersResponse": direct_hoist_5
};

exports.default = { buildParsers };