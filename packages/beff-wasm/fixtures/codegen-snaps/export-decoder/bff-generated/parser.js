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

const RequiredStringFormats = ["password","StartsWithA"];
const RequiredNumberFormats = [];
const h0=ref(R,"User");
const h1=arr(h0);
const h2=ref(R,"NotPublic");
const h3=ref(R,"StartsWithA");
const h4=ref(R,"Password");
const h5=lit(123.456);
const h6=lit(123);
const h7=ref(R,"UnionNested");
const h8=lits([1,2]);
const h9=lits([2,3]);
const h10=lits([4,5]);
const h11=lits([5,6]);
const h12=str();
const h13=obj({a:h12});
const h14=strFormat(["password"]);
const h15=strFormat(["StartsWithA"]);
const h16=lits([1,2,3,4,5,6]);
const h17=num();
const h18=obj({age:h17,name:h12});
define(R,{A:h8,B:h9,D:h10,E:h11,NotPublic:h13,Password:h14,StartsWithA:h15,UnionNested:h16,User:h18});
const buildParsersInput={User:h0,Users:h1,NotPublicRenamed:h2,StartsWithA:h3,Password:h4,float:h5,int:h6,union:h7};

export default { buildParsers };