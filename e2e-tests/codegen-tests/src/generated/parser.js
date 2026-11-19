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
const h0=str();
const h1=ref(R,"AliasToString");
const h2=ref(R,"AliasToNumber");
const h3=ref(R,"AliasToBoolean");
const h4=ref(R,"AliasToNull");
const h5=ref(R,"AliasToAny");
const h6=ref(R,"AliasToConst");
const h7=ref(R,"TestHoist");
const h8=ref(R,"NestedOrder");
const h9=ref(R,"BeforeRequired");
const h10=ref(R,"AfterRequired");
const h11=ref(R,"R");
const h12=ref(R,"R2");
const h13=ref(R,"R3");
const h14=ref(R,"R4");
const h15=ref(R,"R5");
const h16=ref(R,"Meta");
const h17=ref(R,"Meta2");
const h18=ref(R,"KnownConstants");
const h19=ref(R,"NumberKeys");
const h20=ref(R,"NumberIndex");
const h21=ref(R,"NumberOrTemplateKeys");
const h22=ref(R,"DefaultTypeParams");
const h23=ref(R,"NumberLiteralKeys");
const h24=ref(R,"PartialNumberLiteralKeys");
const h25=ref(R,"MixedLiteralKeys");
const h26=undef();
const h27=union([h26,h0]);
const h28=voidType();
const h29=union([h28,h0]);
const h30=nul();
const h31=union([h30,h0]);
const h32=obj({a:h0,b:h27,c:h29,d:h31,e:h0});
const h33=any();
const h34=bool();
const h35=lit("constant value");
const h36=num();
const h37=obj({a:h0,b:h27,c:h29,d:h31,e:opt(h0)});
const h38=obj({v:h0});
const h39=obj({v:h36});
const h40=obj({a:h36,b:h0});
const h41=arr(h34);
const h42=obj({a:h34,b:h41});
const h43=arr(h36);
const h44=obj({a:h36,b:h43});
const h45=ref(R,"DefaultG");
const h46=ref(R,"DefaultG_number");
const h47=ref(R,"DefaultH_number");
const h48=ref(R,"DefaultI_boolean");
const h49=ref(R,"DefaultP_number");
const h50=obj({g:h45,gn:h46,h:h47,i:h48,p:h49});
const h51=lits(["blue","red"]);
const h52=arr(h0);
const h53=obj({BAR_OPTION:h51,BAZ_VALUES:h52,FOO_VALUE:h0});
const h54=regex(/^(alpha_entity_)([\s\S]*)$/,"`alpha_entity_${string}`");
const h55=regex(/^(beta-entity-)([\s\S]*)$/,"`beta-entity-${string}`");
const h56=union([h54,h55]);
const h57=obj({alpha:opt(h0),beta:opt(h0)},[{key:h56,value:opt(h0)}]);
const h58=obj({alpha:h0,beta:h0},[{key:h56,value:h0}]);
const h59=lit("alpha");
const h60=lit("beta");
const h61=union([h59,h54,h60,h55]);
const h62=obj({"1":h0,a:h0});
const h63=obj({a:h36,b:h36});
const h64=obj({label:h0,outer:h63});
const h65=obj({},[{key:numKey(),value:h34}]);
const h66=obj({},[{key:numKey(),value:h0}]);
const h67=obj({"1":h0,"2":h0});
const h68=regex(/^(x_)([\s\S]*)$/,"`x_${string}`");
const h69=obj({},[{key:union([numKey(),h68]),value:h0}]);
const h70=obj({"1":opt(h0),"2":opt(h0)});
const h71=obj({a:h36,b:h36},[{key:h68,value:h36}]);
const h72=obj({a:opt(h36),b:opt(h36)});
const h73=obj({},[{key:h68,value:h36}]);
const h74=obj({},[{key:h68,value:opt(h36)}]);
const h75=obj({a:h52,b:h52});
define(R,{AfterRequired:h32,AliasToAny:h33,AliasToBoolean:h34,AliasToConst:h35,AliasToNull:h30,AliasToNumber:h36,AliasToString:h0,BeforeRequired:h37,DefaultG:h38,DefaultG_number:h39,DefaultH_number:h40,DefaultI_boolean:h42,DefaultP_number:h44,DefaultTypeParams:h50,KnownConstants:h53,Meta:h57,Meta2:h58,MetaKey:h61,MixedLiteralKeys:h62,NestedOrder:h64,NumberIndex:h65,NumberKeys:h66,NumberLiteralKeys:h67,NumberOrTemplateKeys:h69,PartialNumberLiteralKeys:h70,R:h71,R2:h63,R3:h72,R4:h73,R5:h74,TestHoist:h75});
const buildParsersInput={Dec:h0,AliasToString:h1,AliasToNumber:h2,AliasToBoolean:h3,AliasToNull:h4,AliasToAny:h5,AliasToConst:h6,TestHoist:h7,NestedOrder:h8,BeforeRequired:h9,AfterRequired:h10,R:h11,R2:h12,R3:h13,R4:h14,R5:h15,Meta:h16,Meta2:h17,KnownConstants:h18,NumberKeys:h19,NumberIndex:h20,NumberOrTemplateKeys:h21,DefaultTypeParams:h22,NumberLiteralKeys:h23,PartialNumberLiteralKeys:h24,MixedLiteralKeys:h25};

export default { buildParsers };