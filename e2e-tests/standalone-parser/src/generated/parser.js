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

const RequiredStringFormats = ["ValidCurrency","UserId","ReadAuthorizedUserId","WriteAuthorizedUserId"];
const RequiredNumberFormats = ["NonNegativeNumber","NonInfiniteNumber","Rate"];
const h0=ref(R,"Intersection");
const h1=ref(R,"IntersectionPartial");
const h2=ref(R,"IntersectionOmitPick");
const h3=ref(R,"IntersectionNested");
const h4=ref(R,"IntersectionIndex");
const h5=ref(R,"IntersectionUnion");
const h6=ref(R,"IntersectionTplIndex");
const h7=ref(R,"IntersectionTwoTplIndexes");
const h8=ref(R,"TplRecord");
const h9=ref(R,"ProtoDiscriminated");
const h10=ref(R,"ProtoKeyObject");
const h11=ref(R,"Repro5");
const h12=ref(R,"Repro6");
const h13=ref(R,"M1");
const h14=ref(R,"S1");
const h15=ref(R,"PartialRepro");
const h16=ref(R,"TransportedValue");
const h17=ref(R,"OnlyAKey");
const h18=str();
const h19=arr(h18);
const h20=obj({a:h19});
const h21=bigint();
const h22=num();
const h23=tuple([h22,h22,h22]);
const h24=tuple([h22,h22],h18);
const h25=ref(R,"AllTs");
const h26=ref(R,"AObject");
const h27=ref(R,"Version");
const h28=ref(R,"Version2");
const h29=ref(R,"PrefixedString");
const h30=ref(R,"KeyedNumber");
const h31=ref(R,"FlagTpl");
const h32=ref(R,"AccessLevelTpl2");
const h33=ref(R,"AccessLevelTpl");
const h34=ref(R,"Arr3");
const h35=ref(R,"OmitSettings");
const h36=ref(R,"RequiredPartialObject");
const h37=ref(R,"LevelAndDSettings");
const h38=ref(R,"PartialSettings");
const h39=ref(R,"Extra");
const h40=ref(R,"User");
const h41=ref(R,"PublicUser");
const h42=ref(R,"Req");
const h43=ref(R,"Repro1");
const h44=ref(R,"SettingsUpdate");
const h45=ref(R,"Mapped");
const h46=ref(R,"MappedOptional");
const h47=ref(R,"PartialObject");
const h48=ref(R,"DiscriminatedUnion");
const h49=ref(R,"DiscriminatedUnion2");
const h50=ref(R,"DiscriminatedUnion3");
const h51=ref(R,"DiscriminatedUnion4");
const h52=ref(R,"AllTypes");
const h53=ref(R,"AccessLevel");
const h54=ref(R,"OtherEnum");
const h55=ref(R,"Arr2");
const h56=ref(R,"ValidCurrency");
const h57=ref(R,"UnionWithEnumAccess");
const h58=ref(R,"T3");
const h59=ref(R,"AvatarSize");
const h60=ref(R,"BObject");
const h61=lit("a");
const h62=obj({A:h61});
const h63=ref(R,"KDEF");
const h64=ref(R,"KABC");
const h65=ref(R,"K");
const h66=ref(R,"NonNegativeNumber");
const h67=ref(R,"NonInfiniteNumber");
const h68=ref(R,"Rate");
const h69=ref(R,"UserId");
const h70=ref(R,"ReadAuthorizedUserId");
const h71=ref(R,"WriteAuthorizedUserId");
const h72=ref(R,"CurrencyPrices");
const h73=ref(R,"Uint8ArrayType");
const h74=ref(R,"Int32ArrayType");
const h75=ref(R,"Float64ArrayType");
const h76=ref(R,"BigInt64ArrayType");
const h77=ref(R,"TsxTask");
const h78=ref(R,"Query");
const h79=ref(R,"DtsConfig");
const h80=ref(R,"DeploymentState");
const h81=lits(["deployed","failed","pending"]);
const h82=undef();
const h83=lits(["asc","desc"]);
const h84=lits(["age","name"]);
const h85=obj({direction:h83,field:h84});
const h86=union([h82,h85]);
const h87=obj({orderBy:h86});
const h88=obj({});
const h89=obj({tag:h61});
const h90=lits(["ADMIN","USER"]);
const h91=lits(["ADMIN Admin","USER User"]);
const h92=regex(/^((ADMIN)|(USER))$/,'`("ADMIN" | "USER")`');
const h93=regex(/^((ADMIN Admin)|(USER User))$/,'`("ADMIN Admin" | "USER User")`');
const h94=lits(["LevelAndDSettings","OmitSettings","PartialSettings","RequiredPartialObject"]);
const h95=regex(/^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(x)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/,"`${number}x${number}`");
const h96=lit("b");
const h97=obj({tag:h96});
const h98=typedArray("BigInt64Array");
const h99=obj({a:h18});
const h100=lit("a1");
const h101=obj({a1:h18,a11:opt(h18),subType:h100,type:h61});
const h102=lit("a2");
const h103=obj({a2:h18,subType:h102,type:h61});
const h104=disc("subType",{a1:h101,a2:h103},[h101,h103]);
const h105=obj({type:h96,value:h22});
const h106=disc("type",{a:h104,b:h105},[h101,h103,h105]);
const h107=lit("d");
const h108=obj({type:opt(h107),valueD:h22});
const h109=union([h101,h103,h108,h105]);
const h110=lits(["a","c"]);
const h111=obj({a1:h18,type:h110});
const h112=disc("type",{a:h111,b:h105,c:h111},[h111,h105]);
const h113=obj({a1:h18,subType:h100});
const h114=obj({a:h113,type:h61});
const h115=obj({a2:h18,subType:h102});
const h116=obj({a:h115,type:h61});
const h117=union([h114,h116]);
const h118=obj({},[{key:h18,value:h18}]);
const h119=regex(/^(true|false)$/,"`${boolean}`");
const h120=typedArray("Float64Array");
const h121=obj({b:opt(h18)});
const h122=obj({a:h18,b:h22,c:h18});
const h123=obj({d0:h18,e:h22});
const h124=bool();
const h125=obj({a:h18,b:h22,z:h124});
const h126=typedArray("Int32Array");
const h127=ref(R,"IA");
const h128=ref(R,"IB");
const h129=allOf([h127,h128]);
const h130=union([h18,h22]);
const h131=obj({},[{key:h18,value:h130}]);
const h132=obj({n:h22});
const h133=allOf([h131,h132,h127]);
const h134=obj({x:h18});
const h135=obj({n:h134});
const h136=allOf([h135,h128]);
const h137=allOf([h127,h136]);
const h138=obj({a:opt(h18),b:opt(h22)});
const h139=obj({a:h18,b:h22,d0:h18,e:h22});
const h140=allOf([h138,h139]);
const h141=obj({c:opt(h18)});
const h142=allOf([h141,h127]);
const h143=regex(/^(x_)([\s\S]*)$/,"`x_${string}`");
const h144=obj({},[{key:h143,value:h22}]);
const h145=allOf([h144,h127]);
const h146=regex(/^(y_)([\s\S]*)$/,"`y_${string}`");
const h147=obj({},[{key:h146,value:h18}]);
const h148=allOf([h144,h147,h127]);
const h149=lit("u");
const h150=obj({kind:h149,u:h18});
const h151=lit("v");
const h152=obj({kind:h151,v:opt(h22)});
const h153=disc("kind",{u:h150,v:h152},[h150,h152]);
const h154=allOf([h127,h153]);
const h155=lits(["a"]);
const h156=never();
const h157=regex(/^((a)|(b))(-)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/,'`("a" | "b")-${number}`');
const h158=obj({tag:h107});
const h159=lits(["a","b"]);
const h160=obj({d:h158,level:h159});
const h161=map(h18,h22);
const h162=obj({value:h61});
const h163=obj({value:h96});
const h164=obj({a:h162,b:h163});
const h165=obj({a:opt(h162),b:opt(h163)});
const h166=obj({A:h18});
const h167=obj({a:opt(h18),b:opt(h18)});
const h168=obj({a:opt(h18),d:opt(h158),level:opt(h159)});
const h169=regex(/^(a)([\s\S]*)$/,"`a${string}`");
const h170=lit("__proto__");
const h171=obj({c:h124,kind:h170});
const h172=lit("constructor");
const h173=obj({b:h22,kind:h172});
const h174=lit("toString");
const h175=obj({a:h18,kind:h174});
const h176=disc("kind",{["__proto__"]:h171,constructor:h173,toString:h175},[h175,h173,h171]);
const h177=obj({["__proto__"]:h18,toString:h22});
const h178=obj({accessLevel:h53,avatarSize:h59,extra:h39,name:h18});
const h179=ref(R,"Repro2");
const h180=obj({sizes:opt(h179)});
const h181=obj({useSmallerSizes:h124});
const h182=obj({},[{key:h18,value:h22}]);
const h183=obj({accountEndpoints:h182});
const h184=obj({},[{key:numKey(),value:h22}]);
const h185=obj({accountEndpoints:h184});
const h186=obj({optional:h18});
const h187=obj({a:h18,b:h22});
const h188=set(h18);
const h189=obj({a:h18,d:h158,level:h159});
const h190=union([h18,h61,h96,h158]);
const h191=lit("circle");
const h192=obj({kind:h191,radius:h22});
const h193=lit("square");
const h194=obj({kind:h193,x:h22});
const h195=lit("triangle");
const h196=obj({kind:h195,x:h22,y:h22});
const h197=disc("kind",{circle:h192,square:h194,triangle:h196},[h192,h194,h196]);
const h198=disc("kind",{square:h194,triangle:h196},[h194,h196]);
const h199=nul();
const h200=union([h199,h82,h18,h22]);
const h201=arr(h200);
const h202=union([h199,h82,h18,h201]);
const h203=typedArray("Uint8Array");
const h204=ref(R,"OtherEnum__A");
const h205=obj({tag:h204,value:h18});
const h206=ref(R,"OtherEnum__B");
const h207=obj({tag:h206,value:h22});
const h208=ref(R,"OtherEnum2__C");
const h209=obj({tag:h208,value:h124});
const h210=disc("tag",{a:h205,b:h207,c:h209},[h209,h205,h207]);
const h211=arr(h40);
const h212=obj({accessLevel:h53,avatarSize:h59,extra:h39,friends:h211,name:h18});
const h213=regex(/^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/,"`${number}.${number}.${number}`");
const h214=regex(/^(v)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/,"`v${number}.${number}.${number}`");
const h215=obj({optional:opt(h18)});
const h216=ref(R,"DtsStatus");
const h217=obj({enabled:h124,status:h216});
const h218=lits(["off","on"]);
const h219=lits(["active","closed","pending"]);
const h220=ref(R,"TsxLabel");
const h221=obj({id:h18,label:h220});
const h222=lits(["A","B","C"]);
const h223=lits(["X","Y"]);
const h224=strFormat(["ValidCurrency"]);
const h225=obj({},[{key:h224,value:h68}]);
const h226=numFormat(["NonInfiniteNumber"]);
const h227=numFormat(["NonInfiniteNumber","NonNegativeNumber"]);
const h228=numFormat(["NonInfiniteNumber","NonNegativeNumber","Rate"]);
const h229=strFormat(["UserId","ReadAuthorizedUserId"]);
const h230=strFormat(["UserId"]);
const h231=strFormat(["UserId","ReadAuthorizedUserId","WriteAuthorizedUserId"]);
const h232=lit("c");
define(R,{DeploymentState:h81,Query:h87,ABC:h88,AObject:h89,AccessLevel:h90,AccessLevel2:h91,AccessLevelTpl:h92,AccessLevelTpl2:h93,AllTypes:h94,AvatarSize:h95,BObject:h97,BigInt64ArrayType:h98,DEF:h99,DiscriminatedUnion:h106,DiscriminatedUnion2:h109,DiscriminatedUnion3:h112,DiscriminatedUnion4:h117,Extra:h118,FlagTpl:h119,Float64ArrayType:h120,IA:h99,IB:h121,IBase:h122,IExtra:h123,IOther:h125,Int32ArrayType:h126,Intersection:h129,IntersectionIndex:h133,IntersectionNested:h137,IntersectionOmitPick:h140,IntersectionPartial:h142,IntersectionTplIndex:h145,IntersectionTwoTplIndexes:h148,IntersectionUnion:h154,K:h155,KABC:h156,KDEF:h61,KeyedNumber:h157,LevelAndDSettings:h160,M1:h161,Mapped:h164,MappedOptional:h165,OmitSettings:h160,OnlyAKey:h166,PartialObject:h138,PartialRepro:h167,PartialSettings:h168,PrefixedString:h169,ProtoDiscriminated:h176,ProtoKeyObject:h177,PublicUser:h178,Repro1:h180,Repro2:h181,Repro5:h183,Repro6:h185,Req:h186,RequiredPartialObject:h187,S1:h188,Settings:h189,SettingsUpdate:h190,Shape:h197,T3:h198,TplRecord:h144,TransportedValue:h202,Uint8ArrayType:h203,UnionWithEnumAccess:h210,User:h212,Version:h213,Version2:h214,WithOptionals:h215,DtsConfig:h217,DtsStatus:h218,TsxLabel:h219,TsxTask:h221,Arr2:h222,OtherEnum:h159,Arr3:h223,CurrencyPrices:h225,NonInfiniteNumber:h226,NonNegativeNumber:h227,Rate:h228,ReadAuthorizedUserId:h229,UserId:h230,ValidCurrency:h224,WriteAuthorizedUserId:h231,AllTs:h159,OtherEnum__A:h61,OtherEnum__B:h96,OtherEnum2__C:h232});
const buildParsersInput={Intersection:h0,IntersectionPartial:h1,IntersectionOmitPick:h2,IntersectionNested:h3,IntersectionIndex:h4,IntersectionUnion:h5,IntersectionTplIndex:h6,IntersectionTwoTplIndexes:h7,TplRecord:h8,ProtoDiscriminated:h9,ProtoKeyObject:h10,Repro5:h11,Repro6:h12,M1:h13,S1:h14,PartialRepro:h15,TransportedValue:h16,OnlyAKey:h17,ObjectWithArr:h20,BigIntCodec:h21,TupleCodec:h23,TupleCodecRest:h24,StringArrCodec:h19,AllTs:h25,AObject:h26,Version:h27,Version2:h28,PrefixedString:h29,KeyedNumber:h30,FlagTpl:h31,AccessLevelTpl2:h32,AccessLevelTpl:h33,Arr3:h34,OmitSettings:h35,RequiredPartialObject:h36,LevelAndDSettings:h37,PartialSettings:h38,Extra:h39,User:h40,PublicUser:h41,Req:h42,Repro1:h43,SettingsUpdate:h44,Mapped:h45,MappedOptional:h46,PartialObject:h47,DiscriminatedUnion:h48,DiscriminatedUnion2:h49,DiscriminatedUnion3:h50,DiscriminatedUnion4:h51,AllTypes:h52,AccessLevel:h53,OtherEnum:h54,Arr2C:h55,ValidCurrency:h56,UnionWithEnumAccess:h57,T3:h58,AccessLevelCodec:h53,AvatarSize:h59,BObject:h60,ImportEnumTypeof:h62,KDEF:h63,KABC:h64,K:h65,NonNegativeNumber:h66,NonInfiniteNumber:h67,Rate:h68,UserId:h69,ReadAuthorizedUserId:h70,WriteAuthorizedUserId:h71,CurrencyPrices:h72,Uint8ArrayCodec:h73,Int32ArrayCodec:h74,Float64ArrayCodec:h75,BigInt64ArrayCodec:h76,TsxTask:h77,Query:h78,DtsConfig:h79,DeploymentState:h80};

export default { buildParsers };