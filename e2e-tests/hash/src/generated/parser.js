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

const RequiredStringFormats = ["ValidCurrency"];
const RequiredNumberFormats = [];
const h0=ref(R,"StringCodec");
const h1=ref(R,"NumberCodec");
const h2=ref(R,"BooleanCodec");
const h3=ref(R,"StringArrayCodec");
const h4=ref(R,"UndefinedCodec");
const h5=ref(R,"NullCodec");
const h6=ref(R,"AnyCodec");
const h7=ref(R,"UnknownCodec");
const h8=ref(R,"VoidCodec");
const h9=ref(R,"ObjCodec");
const h10=ref(R,"ObjCodec2");
const h11=ref(R,"RecursiveA");
const h12=ref(R,"RecursiveB");
const h13=ref(R,"MutualA1");
const h14=ref(R,"MutualB1");
const h15=ref(R,"MutualA2");
const h16=ref(R,"MutualB2");
const h17=any();
const h18=bool();
const h19=str();
const h20=obj({next:opt(h14),value:h19});
const h21=obj({next:opt(h16),value:h19});
const h22=obj({next:opt(h13),value:h19});
const h23=obj({next:opt(h15),value:h19});
const h24=nul();
const h25=num();
const h26=obj({a:h19,b:h25});
const h27=obj({next:opt(h11),value:h19});
const h28=obj({next:opt(h12),value:h19});
const h29=arr(h19);
const h30=undef();
const h31=voidType();
define(R,{AnyCodec:h17,BooleanCodec:h18,MutualA1:h20,MutualA2:h21,MutualB1:h22,MutualB2:h23,NullCodec:h24,NumberCodec:h25,ObjCodec:h26,ObjCodec2:h26,RecursiveA:h27,RecursiveB:h28,StringArrayCodec:h29,StringCodec:h19,UndefinedCodec:h30,UnknownCodec:h17,VoidCodec:h31});
const buildParsersInput={StringCodec:h0,NumberCodec:h1,BooleanCodec:h2,StringArrayCodec:h3,UndefinedCodec:h4,NullCodec:h5,AnyCodec:h6,UnknownCodec:h7,VoidCodec:h8,ObjCodec:h9,ObjCodec2:h10,RecursiveA:h11,RecursiveB:h12,MutualA1:h13,MutualB1:h14,MutualA2:h15,MutualB2:h16};

export default { buildParsers };