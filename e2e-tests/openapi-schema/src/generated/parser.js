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

const RequiredStringFormats = [];
const RequiredNumberFormats = [];
const h0=ref(R,"Address");
const h1=ref(R,"User");
const h2=ref(R,"DocumentedPayload");
const h3=ref(R,"CreateUserRequest");
const h4=ref(R,"CreateUserResponse");
const h5=ref(R,"UpdateUserRequest");
const h6=ref(R,"SearchUsersResponse");
const h7=ref(R,"RecursiveTree");
const h8=ref(R,"RecursiveEnvelope");
const h9=ref(R,"OpenApiCompatConstPayload");
const h10=ref(R,"OpenApiCompatEnumPayload");
const h11=ref(R,"OpenApiCompatRecordPayload");
const h12=ref(R,"OpenApiCompatEmptyRecordPayload");
const h13=ref(R,"OpenApiCompatOptionalizedPayload");
const h14=ref(R,"OpenApiCompatOptinal");
const h15=ref(R,"OpenApiCompatOptionalNullishPayload");
const h16=ref(R,"OpenApiCompatDiscUnion");
const h17=ref(R,"OpenApiCompatDiscUnionCron");
const h18=ref(R,"OpenApiCompatDiscUnionEvent");
const h19=ref(R,"OpenApiCompatDiscUnionAndNamedTypes");
const h20=ref(R,"WorkflowSource");
const h21=str();
const h22=obj({city:h21,street:h21});
const h23=obj({source:h21});
const h24=obj({metadata:h23,user:h1});
const h25=obj({user:h1});
const h26=undef();
const h27=union([h26,h21]);
const h28=lit("CRON");
const h29=obj({cronExpression:h21,eventName:h27,type:h28});
const h30=ref(R,"WorkflowSourceBase");
const h31=allOf([h29,h30]);
const h32=doc(str(),"Stable payload id.");
const h33=doc(num(),"Optional retry count.");
const h34=doc(obj({id:h32,retries:opt(h33)}),"Documented payload for contextual JSON Schema.");
const h35=lit("EVENT");
const h36=obj({cronExpression:h27,eventName:h21,type:h35});
const h37=allOf([h36,h30]);
const h38=lit(true);
const h39=nul();
const h40=lit(3);
const h41=lit("ok");
const h42=obj({enabled:h38,nullable:h39,retries:h40,status:h41});
const h43=disc("type",{CRON:h17,EVENT:h18},[h18,h17]);
const h44=disc("type",{CRON:h17,EVENT:h18},[h18,h17]);
const h45=obj({schedule:h21,type:h28});
const h46=obj({eventName:h21,type:h35});
const h47=never();
const h48=obj({},[{key:h21,value:h47}]);
const h49=obj({payload:h48});
const h50=lits([200,201]);
const h51=lits([false,true]);
const h52=lit("fallback");
const h53=lit(0);
const h54=union([h39,h52,h53]);
const h55=lits(["admin","member"]);
const h56=obj({code:h50,enabled:h51,mixed:h54,role:h55});
const h57=obj({it:opt(h21)});
const h58=num();
const h59=union([h39,h26,h58]);
const h60=union([h39,h26,h21]);
const h61=obj({limit:opt(h59),value:opt(h60)});
const h62=lit("primary");
const h63=union([h39,h52,h62]);
const h64=union([h39,h21]);
const h65=obj({maybeEnum:h63,maybeText:h64,onlyNull:h39,optional:opt(h21),orUndefined:h27});
const h66=any();
const h67=obj({},[{key:h21,value:h66}]);
const h68=obj({payload:h67});
const h69=obj({previous:opt(h8),root:h7});
const h70=arr(h7);
const h71=obj({children:h70,value:h21});
const h72=arr(h1);
const h73=obj({items:h72,primaryAddress:h0});
const h74=obj({address:h0,id:h21});
const h75=obj({displayName:h21});
const h76=obj({address:h0,id:h21,profile:h75});
const h77=obj({createdAt:h21,cronExpression:h21,eventName:h27,id:h21,metadata:h67,type:h28,updatedAt:h21,workflowID:h21});
const h78=obj({createdAt:h21,cronExpression:h27,eventName:h21,id:h21,metadata:h67,type:h35,updatedAt:h21,workflowID:h21});
const h79=ref(R,"EventWorkflowSource");
const h80=ref(R,"CronWorkflowSource");
const h81=disc("type",{CRON:h77,EVENT:h78},[h79,h80]);
const h82=lits(["CRON","EVENT"]);
const h83=obj({createdAt:h21,id:h21,metadata:h67,type:h82,updatedAt:h21,workflowID:h21});
define(R,{Address:h22,CreateUserRequest:h24,CreateUserResponse:h25,CronWorkflowSource:h31,DocumentedPayload:h34,EventWorkflowSource:h37,OpenApiCompatConstPayload:h42,OpenApiCompatDiscUnion:h43,OpenApiCompatDiscUnionAndNamedTypes:h44,OpenApiCompatDiscUnionCron:h45,OpenApiCompatDiscUnionEvent:h46,OpenApiCompatEmptyRecordPayload:h49,OpenApiCompatEnumPayload:h56,OpenApiCompatOptinal:h57,OpenApiCompatOptionalNullishPayload:h61,OpenApiCompatOptionalizedPayload:h65,OpenApiCompatRecordPayload:h68,RecursiveEnvelope:h69,RecursiveTree:h71,SearchUsersResponse:h73,UpdateUserRequest:h74,User:h76,WorkflowSource:h81,WorkflowSourceBase:h83});
const buildParsersInput={Address:h0,User:h1,DocumentedPayload:h2,CreateUserRequest:h3,CreateUserResponse:h4,UpdateUserRequest:h5,SearchUsersResponse:h6,RecursiveTree:h7,RecursiveEnvelope:h8,OpenApiCompatConstPayload:h9,OpenApiCompatEnumPayload:h10,OpenApiCompatRecordPayload:h11,OpenApiCompatEmptyRecordPayload:h12,OpenApiCompatOptionalizedPayload:h13,OpenApiCompatOptinal:h14,OpenApiCompatOptionalNullishPayload:h15,OpenApiCompatDiscUnion:h16,OpenApiCompatDiscUnionCron:h17,OpenApiCompatDiscUnionEvent:h18,OpenApiCompatDiscUnionAndNamedTypes:h19,WorkflowSource:h20};

exports.default = { buildParsers };