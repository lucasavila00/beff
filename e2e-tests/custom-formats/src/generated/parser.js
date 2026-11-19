//@ts-nocheck

"use strict";

import {
  string,
  number,
  boolean,
  functionType,
  numberKey,
  any,
  nullType,
  undefinedType,
  voidType,
  never,
  literal,
  literals,
  regex,
  date,
  bigint,
  typedArray,
  stringWithFormat,
  numberWithFormat,
  tuple,
  intersection,
  union,
  array,
  map,
  set,
  discriminatedUnion,
  optional,
  object,
  reference,
  withDescription,
  define,
  registerStringFormatter,
  registerNumberFormatter,
  buildParserFromRuntype,
} from "@beff/client/codegen-v2";

const registry = new Map();

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
const direct_hoist_0 = reference(registry, "ValidCurrency");
const direct_hoist_1 = reference(registry, "ShortCode");
const direct_hoist_2 = reference(registry, "UserId");
const direct_hoist_3 = reference(registry, "ReadAuthorizedUserId");
const direct_hoist_4 = reference(registry, "WriteAuthorizedUserId");
const direct_hoist_5 = reference(registry, "StringParentNoMsg");
const direct_hoist_6 = reference(registry, "StringChildNoMsg");
const direct_hoist_7 = reference(registry, "StringParentMsgOnly");
const direct_hoist_8 = reference(registry, "StringParentMsgOnlyChild");
const direct_hoist_9 = reference(registry, "StringChildMsgParent");
const direct_hoist_10 = reference(registry, "StringChildMsg");
const direct_hoist_11 = reference(registry, "StringBothMsgParent");
const direct_hoist_12 = reference(registry, "StringBothMsgChild");
const direct_hoist_13 = reference(registry, "NonInfiniteNumber");
const direct_hoist_14 = reference(registry, "NegativeNumber");
const direct_hoist_15 = reference(registry, "NonNegativeNumber");
const direct_hoist_16 = reference(registry, "Rate");
const direct_hoist_17 = reference(registry, "NumberParentNoMsg");
const direct_hoist_18 = reference(registry, "NumberChildNoMsg");
const direct_hoist_19 = reference(registry, "NumberParentMsgOnly");
const direct_hoist_20 = reference(registry, "NumberParentMsgOnlyChild");
const direct_hoist_21 = reference(registry, "NumberChildMsgParent");
const direct_hoist_22 = reference(registry, "NumberChildMsg");
const direct_hoist_23 = reference(registry, "NumberBothMsgParent");
const direct_hoist_24 = reference(registry, "NumberBothMsgChild");
const direct_hoist_25 = numberWithFormat([
    "NegativeNumber"
]);
const direct_hoist_26 = numberWithFormat([
    "NonInfiniteNumber"
]);
const direct_hoist_27 = numberWithFormat([
    "NonInfiniteNumber",
    "NonNegativeNumber"
]);
const direct_hoist_28 = numberWithFormat([
    "NumberBothMsgParent",
    "NumberBothMsgChild"
]);
const direct_hoist_29 = numberWithFormat([
    "NumberBothMsgParent"
]);
const direct_hoist_30 = numberWithFormat([
    "NumberChildMsgParent",
    "NumberChildMsg"
]);
const direct_hoist_31 = numberWithFormat([
    "NumberChildMsgParent"
]);
const direct_hoist_32 = numberWithFormat([
    "NumberParentNoMsg",
    "NumberChildNoMsg"
]);
const direct_hoist_33 = numberWithFormat([
    "NumberParentMsgOnly"
]);
const direct_hoist_34 = numberWithFormat([
    "NumberParentMsgOnly",
    "NumberParentMsgOnlyChild"
]);
const direct_hoist_35 = numberWithFormat([
    "NumberParentNoMsg"
]);
const direct_hoist_36 = numberWithFormat([
    "NonInfiniteNumber",
    "NonNegativeNumber",
    "Rate"
]);
const direct_hoist_37 = stringWithFormat([
    "UserId",
    "ReadAuthorizedUserId"
]);
const direct_hoist_38 = stringWithFormat([
    "ShortCode"
]);
const direct_hoist_39 = stringWithFormat([
    "StringBothMsgParent",
    "StringBothMsgChild"
]);
const direct_hoist_40 = stringWithFormat([
    "StringBothMsgParent"
]);
const direct_hoist_41 = stringWithFormat([
    "StringChildMsgParent",
    "StringChildMsg"
]);
const direct_hoist_42 = stringWithFormat([
    "StringChildMsgParent"
]);
const direct_hoist_43 = stringWithFormat([
    "StringParentNoMsg",
    "StringChildNoMsg"
]);
const direct_hoist_44 = stringWithFormat([
    "StringParentMsgOnly"
]);
const direct_hoist_45 = stringWithFormat([
    "StringParentMsgOnly",
    "StringParentMsgOnlyChild"
]);
const direct_hoist_46 = stringWithFormat([
    "StringParentNoMsg"
]);
const direct_hoist_47 = stringWithFormat([
    "UserId"
]);
const direct_hoist_48 = stringWithFormat([
    "ValidCurrency"
]);
const direct_hoist_49 = stringWithFormat([
    "UserId",
    "ReadAuthorizedUserId",
    "WriteAuthorizedUserId"
]);
define(registry, {
    NegativeNumber: direct_hoist_25,
    NonInfiniteNumber: direct_hoist_26,
    NonNegativeNumber: direct_hoist_27,
    NumberBothMsgChild: direct_hoist_28,
    NumberBothMsgParent: direct_hoist_29,
    NumberChildMsg: direct_hoist_30,
    NumberChildMsgParent: direct_hoist_31,
    NumberChildNoMsg: direct_hoist_32,
    NumberParentMsgOnly: direct_hoist_33,
    NumberParentMsgOnlyChild: direct_hoist_34,
    NumberParentNoMsg: direct_hoist_35,
    Rate: direct_hoist_36,
    ReadAuthorizedUserId: direct_hoist_37,
    ShortCode: direct_hoist_38,
    StringBothMsgChild: direct_hoist_39,
    StringBothMsgParent: direct_hoist_40,
    StringChildMsg: direct_hoist_41,
    StringChildMsgParent: direct_hoist_42,
    StringChildNoMsg: direct_hoist_43,
    StringParentMsgOnly: direct_hoist_44,
    StringParentMsgOnlyChild: direct_hoist_45,
    StringParentNoMsg: direct_hoist_46,
    UserId: direct_hoist_47,
    ValidCurrency: direct_hoist_48,
    WriteAuthorizedUserId: direct_hoist_49
});
const buildParsersInput = {
    ValidCurrency: direct_hoist_0,
    ShortCode: direct_hoist_1,
    UserId: direct_hoist_2,
    ReadAuthorizedUserId: direct_hoist_3,
    WriteAuthorizedUserId: direct_hoist_4,
    StringParentNoMsg: direct_hoist_5,
    StringChildNoMsg: direct_hoist_6,
    StringParentMsgOnly: direct_hoist_7,
    StringParentMsgOnlyChild: direct_hoist_8,
    StringChildMsgParent: direct_hoist_9,
    StringChildMsg: direct_hoist_10,
    StringBothMsgParent: direct_hoist_11,
    StringBothMsgChild: direct_hoist_12,
    NonInfiniteNumber: direct_hoist_13,
    NegativeNumber: direct_hoist_14,
    NonNegativeNumber: direct_hoist_15,
    Rate: direct_hoist_16,
    NumberParentNoMsg: direct_hoist_17,
    NumberChildNoMsg: direct_hoist_18,
    NumberParentMsgOnly: direct_hoist_19,
    NumberParentMsgOnlyChild: direct_hoist_20,
    NumberChildMsgParent: direct_hoist_21,
    NumberChildMsg: direct_hoist_22,
    NumberBothMsgParent: direct_hoist_23,
    NumberBothMsgChild: direct_hoist_24
};

export default { buildParsers };