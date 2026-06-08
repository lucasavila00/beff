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

const RequiredStringFormats = ["ValidCurrency","ShortCode","UserId","ReadAuthorizedUserId","WriteAuthorizedUserId","StringParentNoMsg","StringChildNoMsg","StringParentMsgOnly","StringParentMsgOnlyChild","StringChildMsgParent","StringChildMsg","StringBothMsgParent","StringBothMsgChild"];
const RequiredNumberFormats = ["NonInfiniteNumber","NegativeNumber","NonNegativeNumber","Rate","NumberParentNoMsg","NumberChildNoMsg","NumberParentMsgOnly","NumberParentMsgOnlyChild","NumberChildMsgParent","NumberChildMsg","NumberBothMsgParent","NumberBothMsgChild"];
const direct_hoist_0 = new RefRuntype(undefined, "ValidCurrency");
const direct_hoist_1 = new RefRuntype(undefined, "ShortCode");
const direct_hoist_2 = new RefRuntype(undefined, "UserId");
const direct_hoist_3 = new RefRuntype(undefined, "ReadAuthorizedUserId");
const direct_hoist_4 = new RefRuntype(undefined, "WriteAuthorizedUserId");
const direct_hoist_5 = new RefRuntype(undefined, "StringParentNoMsg");
const direct_hoist_6 = new RefRuntype(undefined, "StringChildNoMsg");
const direct_hoist_7 = new RefRuntype(undefined, "StringParentMsgOnly");
const direct_hoist_8 = new RefRuntype(undefined, "StringParentMsgOnlyChild");
const direct_hoist_9 = new RefRuntype(undefined, "StringChildMsgParent");
const direct_hoist_10 = new RefRuntype(undefined, "StringChildMsg");
const direct_hoist_11 = new RefRuntype(undefined, "StringBothMsgParent");
const direct_hoist_12 = new RefRuntype(undefined, "StringBothMsgChild");
const direct_hoist_13 = new RefRuntype(undefined, "NonInfiniteNumber");
const direct_hoist_14 = new RefRuntype(undefined, "NegativeNumber");
const direct_hoist_15 = new RefRuntype(undefined, "NonNegativeNumber");
const direct_hoist_16 = new RefRuntype(undefined, "Rate");
const direct_hoist_17 = new RefRuntype(undefined, "NumberParentNoMsg");
const direct_hoist_18 = new RefRuntype(undefined, "NumberChildNoMsg");
const direct_hoist_19 = new RefRuntype(undefined, "NumberParentMsgOnly");
const direct_hoist_20 = new RefRuntype(undefined, "NumberParentMsgOnlyChild");
const direct_hoist_21 = new RefRuntype(undefined, "NumberChildMsgParent");
const direct_hoist_22 = new RefRuntype(undefined, "NumberChildMsg");
const direct_hoist_23 = new RefRuntype(undefined, "NumberBothMsgParent");
const direct_hoist_24 = new RefRuntype(undefined, "NumberBothMsgChild");
const direct_hoist_25 = new NumberWithFormatRuntype(undefined, [
    "NegativeNumber"
]);
const direct_hoist_26 = new NumberWithFormatRuntype(undefined, [
    "NonInfiniteNumber"
]);
const direct_hoist_27 = new NumberWithFormatRuntype(undefined, [
    "NonInfiniteNumber",
    "NonNegativeNumber"
]);
const direct_hoist_28 = new NumberWithFormatRuntype(undefined, [
    "NumberBothMsgParent",
    "NumberBothMsgChild"
]);
const direct_hoist_29 = new NumberWithFormatRuntype(undefined, [
    "NumberBothMsgParent"
]);
const direct_hoist_30 = new NumberWithFormatRuntype(undefined, [
    "NumberChildMsgParent",
    "NumberChildMsg"
]);
const direct_hoist_31 = new NumberWithFormatRuntype(undefined, [
    "NumberChildMsgParent"
]);
const direct_hoist_32 = new NumberWithFormatRuntype(undefined, [
    "NumberParentNoMsg",
    "NumberChildNoMsg"
]);
const direct_hoist_33 = new NumberWithFormatRuntype(undefined, [
    "NumberParentMsgOnly"
]);
const direct_hoist_34 = new NumberWithFormatRuntype(undefined, [
    "NumberParentMsgOnly",
    "NumberParentMsgOnlyChild"
]);
const direct_hoist_35 = new NumberWithFormatRuntype(undefined, [
    "NumberParentNoMsg"
]);
const direct_hoist_36 = new NumberWithFormatRuntype(undefined, [
    "NonInfiniteNumber",
    "NonNegativeNumber",
    "Rate"
]);
const direct_hoist_37 = new StringWithFormatRuntype(undefined, [
    "UserId",
    "ReadAuthorizedUserId"
]);
const direct_hoist_38 = new StringWithFormatRuntype(undefined, [
    "ShortCode"
]);
const direct_hoist_39 = new StringWithFormatRuntype(undefined, [
    "StringBothMsgParent",
    "StringBothMsgChild"
]);
const direct_hoist_40 = new StringWithFormatRuntype(undefined, [
    "StringBothMsgParent"
]);
const direct_hoist_41 = new StringWithFormatRuntype(undefined, [
    "StringChildMsgParent",
    "StringChildMsg"
]);
const direct_hoist_42 = new StringWithFormatRuntype(undefined, [
    "StringChildMsgParent"
]);
const direct_hoist_43 = new StringWithFormatRuntype(undefined, [
    "StringParentNoMsg",
    "StringChildNoMsg"
]);
const direct_hoist_44 = new StringWithFormatRuntype(undefined, [
    "StringParentMsgOnly"
]);
const direct_hoist_45 = new StringWithFormatRuntype(undefined, [
    "StringParentMsgOnly",
    "StringParentMsgOnlyChild"
]);
const direct_hoist_46 = new StringWithFormatRuntype(undefined, [
    "StringParentNoMsg"
]);
const direct_hoist_47 = new StringWithFormatRuntype(undefined, [
    "UserId"
]);
const direct_hoist_48 = new StringWithFormatRuntype(undefined, [
    "ValidCurrency"
]);
const direct_hoist_49 = new StringWithFormatRuntype(undefined, [
    "UserId",
    "ReadAuthorizedUserId",
    "WriteAuthorizedUserId"
]);
const namedRuntypes = {
    "NegativeNumber": direct_hoist_25,
    "NonInfiniteNumber": direct_hoist_26,
    "NonNegativeNumber": direct_hoist_27,
    "NumberBothMsgChild": direct_hoist_28,
    "NumberBothMsgParent": direct_hoist_29,
    "NumberChildMsg": direct_hoist_30,
    "NumberChildMsgParent": direct_hoist_31,
    "NumberChildNoMsg": direct_hoist_32,
    "NumberParentMsgOnly": direct_hoist_33,
    "NumberParentMsgOnlyChild": direct_hoist_34,
    "NumberParentNoMsg": direct_hoist_35,
    "Rate": direct_hoist_36,
    "ReadAuthorizedUserId": direct_hoist_37,
    "ShortCode": direct_hoist_38,
    "StringBothMsgChild": direct_hoist_39,
    "StringBothMsgParent": direct_hoist_40,
    "StringChildMsg": direct_hoist_41,
    "StringChildMsgParent": direct_hoist_42,
    "StringChildNoMsg": direct_hoist_43,
    "StringParentMsgOnly": direct_hoist_44,
    "StringParentMsgOnlyChild": direct_hoist_45,
    "StringParentNoMsg": direct_hoist_46,
    "UserId": direct_hoist_47,
    "ValidCurrency": direct_hoist_48,
    "WriteAuthorizedUserId": direct_hoist_49
};
const buildParsersInput = {
    "ValidCurrency": direct_hoist_0,
    "ShortCode": direct_hoist_1,
    "UserId": direct_hoist_2,
    "ReadAuthorizedUserId": direct_hoist_3,
    "WriteAuthorizedUserId": direct_hoist_4,
    "StringParentNoMsg": direct_hoist_5,
    "StringChildNoMsg": direct_hoist_6,
    "StringParentMsgOnly": direct_hoist_7,
    "StringParentMsgOnlyChild": direct_hoist_8,
    "StringChildMsgParent": direct_hoist_9,
    "StringChildMsg": direct_hoist_10,
    "StringBothMsgParent": direct_hoist_11,
    "StringBothMsgChild": direct_hoist_12,
    "NonInfiniteNumber": direct_hoist_13,
    "NegativeNumber": direct_hoist_14,
    "NonNegativeNumber": direct_hoist_15,
    "Rate": direct_hoist_16,
    "NumberParentNoMsg": direct_hoist_17,
    "NumberChildNoMsg": direct_hoist_18,
    "NumberParentMsgOnly": direct_hoist_19,
    "NumberParentMsgOnlyChild": direct_hoist_20,
    "NumberChildMsgParent": direct_hoist_21,
    "NumberChildMsg": direct_hoist_22,
    "NumberBothMsgParent": direct_hoist_23,
    "NumberBothMsgChild": direct_hoist_24
};

export default { buildParsers };