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
const h0=ref(R,"UsesGenericWrapper");
const h1=ref(R,"GenericWrapper_string");
const h2=str();
const h3=bool();
const h4=union([h3,h2]);
const h5=obj({other:h1,value:h2,value2:h4});
const h6=ref(R,"GenericWrapper_number");
const h7=num();
const h8=union([h3,h7]);
const h9=obj({other:h6,value:h7,value2:h8});
const h10=obj({wrappedNumber:h6,wrappedString:h1});
define(R,{GenericWrapper_string:h5,GenericWrapper_number:h9,UsesGenericWrapper:h10});
const buildParsersInput={UsesGenericWrapper:h0};

export default { buildParsers };