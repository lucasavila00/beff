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

const RequiredStringFormats = ["ValidCurrency","UserId","ReadAuthorizedUserId","WriteAuthorizedUserId"];
const RequiredNumberFormats = ["NonInfiniteNumber","NonNegativeNumber","Rate"];
const direct_hoist_0 = new RefRuntype("ValidCurrency");
const direct_hoist_1 = new RefRuntype("UserId");
const direct_hoist_2 = new RefRuntype("ReadAuthorizedUserId");
const direct_hoist_3 = new RefRuntype("WriteAuthorizedUserId");
const direct_hoist_4 = new RefRuntype("NonInfiniteNumber");
const direct_hoist_5 = new RefRuntype("NonNegativeNumber");
const direct_hoist_6 = new RefRuntype("Rate");
const direct_hoist_7 = new NumberWithFormatRuntype([
    "NonInfiniteNumber"
], "expected a finite number");
const direct_hoist_8 = new NumberWithFormatRuntype([
    "NonInfiniteNumber",
    "NonNegativeNumber"
], "expected a non-negative number");
const direct_hoist_9 = new NumberWithFormatRuntype([
    "NonInfiniteNumber",
    "NonNegativeNumber",
    "Rate"
], "expected a valid rate");
const direct_hoist_10 = new StringWithFormatRuntype([
    "UserId",
    "ReadAuthorizedUserId"
], "expected a readable user id");
const direct_hoist_11 = new StringWithFormatRuntype([
    "UserId"
], "expected a valid user id");
const direct_hoist_12 = new StringWithFormatRuntype([
    "ValidCurrency"
], "expected a valid ISO currency code");
const direct_hoist_13 = new StringWithFormatRuntype([
    "UserId",
    "ReadAuthorizedUserId",
    "WriteAuthorizedUserId"
], "expected a writable user id");
const namedRuntypes = {
    "NonInfiniteNumber": direct_hoist_7,
    "NonNegativeNumber": direct_hoist_8,
    "Rate": direct_hoist_9,
    "ReadAuthorizedUserId": direct_hoist_10,
    "UserId": direct_hoist_11,
    "ValidCurrency": direct_hoist_12,
    "WriteAuthorizedUserId": direct_hoist_13
};
const buildParsersInput = {
    "ValidCurrency": direct_hoist_0,
    "UserId": direct_hoist_1,
    "ReadAuthorizedUserId": direct_hoist_2,
    "WriteAuthorizedUserId": direct_hoist_3,
    "NonInfiniteNumber": direct_hoist_4,
    "NonNegativeNumber": direct_hoist_5,
    "Rate": direct_hoist_6
};

export default { buildParsers };