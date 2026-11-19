//@ts-nocheck

Object.defineProperty(exports, "__esModule", {
  value: true
});
    
"use strict";

const {
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
} = require("@beff/client/codegen-v2");

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
const h0=str();
const h1=num();
const h2=bool();
const h3=nul();
const h4=undef();
const h5=any();
const h6=obj({},[{key:union([h0,numKey()]),value:h5}]);
const h7=arr(h5);
const h8=ref(R,"T1");
const h9=ref(R,"DocumentedPayload");
const h10=ref(R,"T2");
const h11=ref(R,"T3");
const h12=ref(R,"InvalidSchemaWithDate");
const h13=ref(R,"InvalidSchemaWithBigInt");
const h14=ref(R,"DiscriminatedUnion");
const h15=ref(R,"RecursiveTree");
const h16=ref(R,"SemVer");
const h17=ref(R,"NonEmptyString");
const h18=ref(R,"ValidCurrency");
const h19=ref(R,"EmptyClosedRecord");
const h20=ref(R,"OptionalNullishInput");
const h21=ref(R,"ToolInput");
const h22=lit("a1");
const h23=lit("a");
const h24=obj({a1:h0,a11:opt(h0),subType:h22,type:h23});
const h25=lit("a2");
const h26=obj({a2:h0,subType:h25,type:h23});
const h27=disc("subType",{a1:h24,a2:h26},[h24,h26]);
const h28=lit("b");
const h29=obj({type:h28,value:h1});
const h30=disc("type",{a:h27,b:h29},[h24,h26,h29]);
const h31=doc(str(),"Stable payload id.");
const h32=doc(num(),"Optional retry count.");
const h33=doc(obj({id:h31,retries:opt(h32)}),"Documented payload for flat JSON Schema.");
const h34=never();
const h35=obj({},[{key:h0,value:h34}]);
const h36=bigint();
const h37=obj({x:h36});
const h38=date();
const h39=obj({x:h38});
const h40=tuple([h0],h0);
const h41=union([h3,h4,h1]);
const h42=union([h3,h4,h0]);
const h43=obj({limit:opt(h41),value:opt(h42)});
const h44=arr(h15);
const h45=obj({children:h44,value:h1});
const h46=regex(/^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/,"`${number}.${number}.${number}`");
const h47=obj({a:h0,b:h1});
const h48=obj({t1:h8});
const h49=arr(h10);
const h50=obj({t2Array:h49});
const h51=lit("stock_picker");
const h52=obj({key:h51});
const h53=ref(R,"ToolEnvelope");
const h54=ref(R,"WorkflowInput");
const h55=allOf([h53,h54]);
const h56=strFormat(["ValidCurrency"]);
const h57=obj({evaluationEndDate:h0,evaluationStartDate:h0,optionalNote:opt(h0),trainingEndDate:h0});
define(R,{DiscriminatedUnion:h30,DocumentedPayload:h33,EmptyClosedRecord:h35,InvalidSchemaWithBigInt:h37,InvalidSchemaWithDate:h39,NonEmptyString:h40,OptionalNullishInput:h43,RecursiveTree:h45,SemVer:h46,T1:h47,T2:h48,T3:h50,ToolEnvelope:h52,ToolInput:h55,ValidCurrency:h56,WorkflowInput:h57});
const buildParsersInput={string:h0,number:h1,boolean:h2,null:h3,undefined:h4,object:h6,anyArray:h7,any:h5,T1:h8,DocumentedPayload:h9,T2:h10,T3:h11,InvalidSchemaWithDate:h12,InvalidSchemaWithBigInt:h13,DiscriminatedUnion:h14,RecursiveTree:h15,SemVer:h16,NonEmptyString:h17,ValidCurrency:h18,EmptyClosedRecord:h19,OptionalNullishInput:h20,ToolInput:h21};

exports.default = { buildParsers };