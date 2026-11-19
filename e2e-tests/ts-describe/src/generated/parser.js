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

const RequiredStringFormats = ["ValidCurrency","CompactId","JsdocReusableToken"];
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
const h10=ref(R,"DocumentedResult");
const h11=ref(R,"JsdocSingleLineAlias");
const h12=ref(R,"JsdocMultilineObject");
const h13=ref(R,"JsdocMemberOnlyObject");
const h14=ref(R,"JsdocNestedObject");
const h15=ref(R,"JsdocReferencesDocumentedAlias");
const h16=ref(R,"JsdocUnionVariant");
const h17=ref(R,"JsdocIgnoredCommentObject");
const h18=ref(R,"JsdocAfterUnrelatedValue");
const h19=ref(R,"T2");
const h20=ref(R,"T3");
const h21=ref(R,"InvalidSchemaWithDate");
const h22=ref(R,"InvalidSchemaWithBigInt");
const h23=ref(R,"DiscriminatedUnion");
const h24=ref(R,"RecursiveTree");
const h25=ref(R,"SemVer");
const h26=ref(R,"NonEmptyString");
const h27=ref(R,"ValidCurrency");
const h28=ref(R,"DocumentedSearchInput");
const h29=ref(R,"HierarchySelection");
const h30=ref(R,"ReusesRef");
const h31=ref(R,"UsesGenericWrapper");
const h32=ref(R,"StringWrapped");
const h33=ref(R,"NumberWrapped");
const h34=ref(R,"UsesWrappeds");
const h35=ref(R,"UsesWrappedsComplex");
const h36=ref(R,"UsesWrappedsComplexRef");
const h37=obj({a:h2});
const h38=doc(strFormat(["CompactId"]),"CompactId represents a formatted identifier\nwhile keeping generated schemas small.");
const h39=obj({value:h2});
const h40=obj({value:h0});
const h41=obj({value:h1});
const h42=obj({value:h37});
const h43=ref(R,"ABool");
const h44=obj({value:h43});
const h45=lit("a1");
const h46=lit("a");
const h47=obj({a1:h0,a11:opt(h0),subType:h45,type:h46});
const h48=lit("a2");
const h49=obj({a2:h0,subType:h48,type:h46});
const h50=disc("subType",{a1:h47,a2:h49},[h47,h49]);
const h51=lit("b");
const h52=obj({type:h51,value:h1});
const h53=disc("type",{a:h50,b:h52},[h47,h49,h52]);
const h54=doc(str(),"Stable payload id.");
const h55=doc(num(),"Optional retry count.");
const h56=doc(obj({id:h54,retries:opt(h55)}),"Documented payload for TypeScript descriptions.");
const h57=doc(union([h3,h0]),"Optional display label.");
const h58=doc(str(),"Stable lookup key.");
const h59=doc(obj({alpha:h57,beta:h58}),"Documented result with nullable and required fields.");
const h60=doc(union([h4,h1]),"Optional numeric cursor for paged lookup.");
const h61=ref(R,"CompactId");
const h62=obj({cursor:h60,item:h61});
const h63=ref(R,"GenericWrapper_string");
const h64=union([h2,h0]);
const h65=obj({other:h63,value:h0,value2:h64});
const h66=ref(R,"GenericWrapper_number");
const h67=union([h2,h1]);
const h68=obj({other:h66,value:h1,value2:h67});
const h69=lit("entityId");
const h70=ref(R,"EntityId");
const h71=doc(obj({_tag:h69,entityId:h70}),"A selectable hierarchy entry that resolves to a list of target entities.");
const h72=bigint();
const h73=obj({x:h72});
const h74=date();
const h75=obj({x:h74});
const h76=obj({line:h1,plain:h0});
const h77=doc(union([h3,h0]),"Nullable first field.");
const h78=doc(str(),"Required second field.");
const h79=doc(num(),"Optional third field.");
const h80=obj({alpha:h77,beta:h78,gamma:opt(h79)});
const h81=doc(str(),"First documented field.");
const h82=doc(num(),"Second documented field.");
const h83=doc(obj({first:h81,second:h82}),"Anonymous multiline object.\n\nKeeps an intentional blank line.");
const h84=doc(bool(),"Inner enabled flag.");
const h85=doc(obj({enabled:h84}),"Nested value.");
const h86=obj({nested:h85});
const h87=ref(R,"JsdocReusableToken");
const h88=obj({token:h87});
const h89=doc(strFormat(["JsdocReusableToken"]),"Reusable documented token.");
const h90=doc(str(),"Anonymous single-line alias.");
const h91=lit("left");
const h92=doc(str(),"Left variant value.");
const h93=obj({kind:h91,value:h92});
const h94=doc(num(),"Right variant count.");
const h95=lit("right");
const h96=obj({count:h94,kind:h95});
const h97=disc("kind",{left:h93,right:h96},[h96,h93]);
const h98=tuple([h0],h0);
const h99=ref(R,"DataWrapper_number");
const h100=arr(h24);
const h101=obj({children:h100,value:h1});
const h102=obj({a:h20,b:h20});
const h103=regex(/^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/,"`${number}.${number}.${number}`");
const h104=ref(R,"DataWrapper_string");
const h105=obj({a:h0,b:h1});
const h106=obj({t1:h8});
const h107=arr(h19);
const h108=obj({t2Array:h107});
const h109=obj({wrappedNumber:h66,wrappedString:h63});
const h110=ref(R,"DataWrapper_boolean");
const h111=obj({x1:h32,x2:h33,x3:h110,x4:h32,x5:h33,x6:h110});
const h112=ref(R,"DataWrapper_instance_5");
const h113=obj({x3:h112,x6:h112});
const h114=ref(R,"DataWrapper_ABool");
const h115=obj({x3:h114,x6:h114});
const h116=strFormat(["ValidCurrency"]);
define(R,{ABool:h37,CompactId:h38,DataWrapper_boolean:h39,DataWrapper_string:h40,DataWrapper_number:h41,DataWrapper_instance_5:h42,DataWrapper_ABool:h44,DiscriminatedUnion:h53,DocumentedPayload:h56,DocumentedResult:h59,DocumentedSearchInput:h62,EntityId:h0,GenericWrapper_string:h65,GenericWrapper_number:h68,HierarchySelection:h71,InvalidSchemaWithBigInt:h73,InvalidSchemaWithDate:h75,JsdocAfterUnrelatedValue:h0,JsdocIgnoredCommentObject:h76,JsdocMemberOnlyObject:h80,JsdocMultilineObject:h83,JsdocNestedObject:h86,JsdocReferencesDocumentedAlias:h88,JsdocReusableToken:h89,JsdocSingleLineAlias:h90,JsdocUnionVariant:h97,NonEmptyString:h98,NumberWrapped:h99,RecursiveTree:h101,ReusesRef:h102,SemVer:h103,StringWrapped:h104,T1:h105,T2:h106,T3:h108,UsesGenericWrapper:h109,UsesWrappeds:h111,UsesWrappedsComplex:h113,UsesWrappedsComplexRef:h115,ValidCurrency:h116});
const buildParsersInput={string:h0,number:h1,boolean:h2,null:h3,undefined:h4,object:h6,anyArray:h7,any:h5,T1:h8,DocumentedPayload:h9,DocumentedResult:h10,JsdocSingleLineAlias:h11,JsdocMultilineObject:h12,JsdocMemberOnlyObject:h13,JsdocNestedObject:h14,JsdocReferencesDocumentedAlias:h15,JsdocUnionVariant:h16,JsdocIgnoredCommentObject:h17,JsdocAfterUnrelatedValue:h18,T2:h19,T3:h20,InvalidSchemaWithDate:h21,InvalidSchemaWithBigInt:h22,DiscriminatedUnion:h23,RecursiveTree:h24,SemVer:h25,NonEmptyString:h26,ValidCurrency:h27,DocumentedSearchInput:h28,HierarchySelection:h29,ReusesRef:h30,UsesGenericWrapper:h31,StringWrapped:h32,NumberWrapped:h33,UsesWrappeds:h34,UsesWrappedsComplex:h35,UsesWrappedsComplexRef:h36};

export default { buildParsers };