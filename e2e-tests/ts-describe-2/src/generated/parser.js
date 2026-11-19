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

const RequiredStringFormats = [];
const RequiredNumberFormats = [];
const h0=ref(R,"BeforeRequired");
const h1=ref(R,"KeyofBeforeRequired");
const h2=ref(R,"AfterRequired");
const h3=ref(R,"KeyofAfterRequired");
const h4=ref(R,"SomeString");
const h5=ref(R,"SomeChar");
const h6=str();
const h7=undef();
const h8=union([h7,h6]);
const h9=voidType();
const h10=union([h9,h6]);
const h11=nul();
const h12=union([h11,h6]);
const h13=obj({a:h6,b:h8,c:h10,d:h12,e:h6});
const h14=obj({a:h6,b:h8,c:h10,d:h12,e:opt(h6)});
const h15=lits(["a","b","c","d","e"]);
define(R,{AfterRequired:h13,BeforeRequired:h14,KeyofAfterRequired:h15,KeyofBeforeRequired:h15,SomeChar:h6,SomeString:h6});
const buildParsersInput={BeforeRequired:h0,KeyofBeforeRequired:h1,AfterRequired:h2,KeyofAfterRequired:h3,SomeString:h4,SomeChar:h5};

export default { buildParsers };