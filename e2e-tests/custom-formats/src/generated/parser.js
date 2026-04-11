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
const direct_hoist_0 = new RefRuntype("ValidCurrency");
const direct_hoist_1 = new RefRuntype("ShortCode");
const direct_hoist_2 = new RefRuntype("UserId");
const direct_hoist_3 = new RefRuntype("ReadAuthorizedUserId");
const direct_hoist_4 = new RefRuntype("WriteAuthorizedUserId");
const direct_hoist_5 = new RefRuntype("StringParentNoMsg");
const direct_hoist_6 = new RefRuntype("StringChildNoMsg");
const direct_hoist_7 = new RefRuntype("StringParentMsgOnly");
const direct_hoist_8 = new RefRuntype("StringParentMsgOnlyChild");
const direct_hoist_9 = new RefRuntype("StringChildMsgParent");
const direct_hoist_10 = new RefRuntype("StringChildMsg");
const direct_hoist_11 = new RefRuntype("StringBothMsgParent");
const direct_hoist_12 = new RefRuntype("StringBothMsgChild");
const direct_hoist_13 = new RefRuntype("NonInfiniteNumber");
const direct_hoist_14 = new RefRuntype("NegativeNumber");
const direct_hoist_15 = new RefRuntype("NonNegativeNumber");
const direct_hoist_16 = new RefRuntype("Rate");
const direct_hoist_17 = new RefRuntype("NumberParentNoMsg");
const direct_hoist_18 = new RefRuntype("NumberChildNoMsg");
const direct_hoist_19 = new RefRuntype("NumberParentMsgOnly");
const direct_hoist_20 = new RefRuntype("NumberParentMsgOnlyChild");
const direct_hoist_21 = new RefRuntype("NumberChildMsgParent");
const direct_hoist_22 = new RefRuntype("NumberChildMsg");
const direct_hoist_23 = new RefRuntype("NumberBothMsgParent");
const direct_hoist_24 = new RefRuntype("NumberBothMsgChild");
const direct_hoist_25 = new NumberWithFormatRuntype([
    "NegativeNumber"
]);
const direct_hoist_26 = new NumberWithFormatRuntype([
    "NonInfiniteNumber"
]);
const direct_hoist_27 = new NumberWithFormatRuntype([
    "NonInfiniteNumber",
    "NonNegativeNumber"
]);
const direct_hoist_28 = new NumberWithFormatRuntype([
    "NumberBothMsgParent",
    "NumberBothMsgChild"
]);
const direct_hoist_29 = new NumberWithFormatRuntype([
    "NumberBothMsgParent"
]);
const direct_hoist_30 = new NumberWithFormatRuntype([
    "NumberChildMsgParent",
    "NumberChildMsg"
]);
const direct_hoist_31 = new NumberWithFormatRuntype([
    "NumberChildMsgParent"
]);
const direct_hoist_32 = new NumberWithFormatRuntype([
    "NumberParentNoMsg",
    "NumberChildNoMsg"
]);
const direct_hoist_33 = new NumberWithFormatRuntype([
    "NumberParentMsgOnly"
]);
const direct_hoist_34 = new NumberWithFormatRuntype([
    "NumberParentMsgOnly",
    "NumberParentMsgOnlyChild"
]);
const direct_hoist_35 = new NumberWithFormatRuntype([
    "NumberParentNoMsg"
]);
const direct_hoist_36 = new NumberWithFormatRuntype([
    "NonInfiniteNumber",
    "NonNegativeNumber",
    "Rate"
]);
const direct_hoist_37 = new StringWithFormatRuntype([
    "UserId",
    "ReadAuthorizedUserId"
]);
const direct_hoist_38 = new StringWithFormatRuntype([
    "ShortCode"
]);
const direct_hoist_39 = new StringWithFormatRuntype([
    "StringBothMsgParent",
    "StringBothMsgChild"
]);
const direct_hoist_40 = new StringWithFormatRuntype([
    "StringBothMsgParent"
]);
const direct_hoist_41 = new StringWithFormatRuntype([
    "StringChildMsgParent",
    "StringChildMsg"
]);
const direct_hoist_42 = new StringWithFormatRuntype([
    "StringChildMsgParent"
]);
const direct_hoist_43 = new StringWithFormatRuntype([
    "StringParentNoMsg",
    "StringChildNoMsg"
]);
const direct_hoist_44 = new StringWithFormatRuntype([
    "StringParentMsgOnly"
]);
const direct_hoist_45 = new StringWithFormatRuntype([
    "StringParentMsgOnly",
    "StringParentMsgOnlyChild"
]);
const direct_hoist_46 = new StringWithFormatRuntype([
    "StringParentNoMsg"
]);
const direct_hoist_47 = new StringWithFormatRuntype([
    "UserId"
]);
const direct_hoist_48 = new StringWithFormatRuntype([
    "ValidCurrency"
]);
const direct_hoist_49 = new StringWithFormatRuntype([
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