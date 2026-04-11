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

const RequiredStringFormats = ["ValidCurrency","ShortCode","UserId","ReadAuthorizedUserId","WriteAuthorizedUserId"];
const RequiredNumberFormats = ["NonInfiniteNumber","NegativeNumber","NonNegativeNumber","Rate"];
const direct_hoist_0 = new RefRuntype("ValidCurrency");
const direct_hoist_1 = new RefRuntype("ShortCode");
const direct_hoist_2 = new RefRuntype("UserId");
const direct_hoist_3 = new RefRuntype("ReadAuthorizedUserId");
const direct_hoist_4 = new RefRuntype("WriteAuthorizedUserId");
const direct_hoist_5 = new RefRuntype("NonInfiniteNumber");
const direct_hoist_6 = new RefRuntype("NegativeNumber");
const direct_hoist_7 = new RefRuntype("NonNegativeNumber");
const direct_hoist_8 = new RefRuntype("Rate");
const direct_hoist_9 = new NumberWithFormatRuntype([
    "NegativeNumber"
]);
const direct_hoist_10 = new NumberWithFormatRuntype([
    "NonInfiniteNumber"
]);
const direct_hoist_11 = new NumberWithFormatRuntype([
    "NonInfiniteNumber",
    "NonNegativeNumber"
]);
const direct_hoist_12 = new NumberWithFormatRuntype([
    "NonInfiniteNumber",
    "NonNegativeNumber",
    "Rate"
]);
const direct_hoist_13 = new StringWithFormatRuntype([
    "UserId",
    "ReadAuthorizedUserId"
]);
const direct_hoist_14 = new StringWithFormatRuntype([
    "ShortCode"
]);
const direct_hoist_15 = new StringWithFormatRuntype([
    "UserId"
]);
const direct_hoist_16 = new StringWithFormatRuntype([
    "ValidCurrency"
]);
const direct_hoist_17 = new StringWithFormatRuntype([
    "UserId",
    "ReadAuthorizedUserId",
    "WriteAuthorizedUserId"
]);
const namedRuntypes = {
    "NegativeNumber": direct_hoist_9,
    "NonInfiniteNumber": direct_hoist_10,
    "NonNegativeNumber": direct_hoist_11,
    "Rate": direct_hoist_12,
    "ReadAuthorizedUserId": direct_hoist_13,
    "ShortCode": direct_hoist_14,
    "UserId": direct_hoist_15,
    "ValidCurrency": direct_hoist_16,
    "WriteAuthorizedUserId": direct_hoist_17
};
const buildParsersInput = {
    "ValidCurrency": direct_hoist_0,
    "ShortCode": direct_hoist_1,
    "UserId": direct_hoist_2,
    "ReadAuthorizedUserId": direct_hoist_3,
    "WriteAuthorizedUserId": direct_hoist_4,
    "NonInfiniteNumber": direct_hoist_5,
    "NegativeNumber": direct_hoist_6,
    "NonNegativeNumber": direct_hoist_7,
    "Rate": direct_hoist_8
};

export default { buildParsers };