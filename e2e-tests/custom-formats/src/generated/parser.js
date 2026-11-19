//@ts-nocheck

"use strict";

import {
  str,
  num,
  bool,
  fn,
  numKey,
  any,
  nul,
  undef,
  voidType,
  never,
  lit,
  lits,
  regex,
  date,
  bigint,
  typedArray,
  strFormat,
  numFormat,
  tuple,
  allOf,
  union,
  arr,
  map,
  set,
  disc,
  opt,
  obj,
  ref,
  doc,
  define,
  registerStringFormatter,
  registerNumberFormatter,
  buildParserFromRuntype,
} from "@beff/client/codegen-v2";

const R = new Map();

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
const h0=ref(R,"ValidCurrency");
const h1=ref(R,"ShortCode");
const h2=ref(R,"UserId");
const h3=ref(R,"ReadAuthorizedUserId");
const h4=ref(R,"WriteAuthorizedUserId");
const h5=ref(R,"StringParentNoMsg");
const h6=ref(R,"StringChildNoMsg");
const h7=ref(R,"StringParentMsgOnly");
const h8=ref(R,"StringParentMsgOnlyChild");
const h9=ref(R,"StringChildMsgParent");
const h10=ref(R,"StringChildMsg");
const h11=ref(R,"StringBothMsgParent");
const h12=ref(R,"StringBothMsgChild");
const h13=ref(R,"NonInfiniteNumber");
const h14=ref(R,"NegativeNumber");
const h15=ref(R,"NonNegativeNumber");
const h16=ref(R,"Rate");
const h17=ref(R,"NumberParentNoMsg");
const h18=ref(R,"NumberChildNoMsg");
const h19=ref(R,"NumberParentMsgOnly");
const h20=ref(R,"NumberParentMsgOnlyChild");
const h21=ref(R,"NumberChildMsgParent");
const h22=ref(R,"NumberChildMsg");
const h23=ref(R,"NumberBothMsgParent");
const h24=ref(R,"NumberBothMsgChild");
const h25=numFormat(["NegativeNumber"]);
const h26=numFormat(["NonInfiniteNumber"]);
const h27=numFormat(["NonInfiniteNumber","NonNegativeNumber"]);
const h28=numFormat(["NumberBothMsgParent","NumberBothMsgChild"]);
const h29=numFormat(["NumberBothMsgParent"]);
const h30=numFormat(["NumberChildMsgParent","NumberChildMsg"]);
const h31=numFormat(["NumberChildMsgParent"]);
const h32=numFormat(["NumberParentNoMsg","NumberChildNoMsg"]);
const h33=numFormat(["NumberParentMsgOnly"]);
const h34=numFormat(["NumberParentMsgOnly","NumberParentMsgOnlyChild"]);
const h35=numFormat(["NumberParentNoMsg"]);
const h36=numFormat(["NonInfiniteNumber","NonNegativeNumber","Rate"]);
const h37=strFormat(["UserId","ReadAuthorizedUserId"]);
const h38=strFormat(["ShortCode"]);
const h39=strFormat(["StringBothMsgParent","StringBothMsgChild"]);
const h40=strFormat(["StringBothMsgParent"]);
const h41=strFormat(["StringChildMsgParent","StringChildMsg"]);
const h42=strFormat(["StringChildMsgParent"]);
const h43=strFormat(["StringParentNoMsg","StringChildNoMsg"]);
const h44=strFormat(["StringParentMsgOnly"]);
const h45=strFormat(["StringParentMsgOnly","StringParentMsgOnlyChild"]);
const h46=strFormat(["StringParentNoMsg"]);
const h47=strFormat(["UserId"]);
const h48=strFormat(["ValidCurrency"]);
const h49=strFormat(["UserId","ReadAuthorizedUserId","WriteAuthorizedUserId"]);
define(R,{NegativeNumber:h25,NonInfiniteNumber:h26,NonNegativeNumber:h27,NumberBothMsgChild:h28,NumberBothMsgParent:h29,NumberChildMsg:h30,NumberChildMsgParent:h31,NumberChildNoMsg:h32,NumberParentMsgOnly:h33,NumberParentMsgOnlyChild:h34,NumberParentNoMsg:h35,Rate:h36,ReadAuthorizedUserId:h37,ShortCode:h38,StringBothMsgChild:h39,StringBothMsgParent:h40,StringChildMsg:h41,StringChildMsgParent:h42,StringChildNoMsg:h43,StringParentMsgOnly:h44,StringParentMsgOnlyChild:h45,StringParentNoMsg:h46,UserId:h47,ValidCurrency:h48,WriteAuthorizedUserId:h49});
const buildParsersInput={ValidCurrency:h0,ShortCode:h1,UserId:h2,ReadAuthorizedUserId:h3,WriteAuthorizedUserId:h4,StringParentNoMsg:h5,StringChildNoMsg:h6,StringParentMsgOnly:h7,StringParentMsgOnlyChild:h8,StringChildMsgParent:h9,StringChildMsg:h10,StringBothMsgParent:h11,StringBothMsgChild:h12,NonInfiniteNumber:h13,NegativeNumber:h14,NonNegativeNumber:h15,Rate:h16,NumberParentNoMsg:h17,NumberChildNoMsg:h18,NumberParentMsgOnly:h19,NumberParentMsgOnlyChild:h20,NumberChildMsgParent:h21,NumberChildMsg:h22,NumberBothMsgParent:h23,NumberBothMsgChild:h24};

export default { buildParsers };