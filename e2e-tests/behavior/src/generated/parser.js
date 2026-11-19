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

const RequiredStringFormats = ["UserId","AdminId"];
const RequiredNumberFormats = ["NonNegative","Rate"];
const h0=str();
const h1=num();
const h2=bool();
const h3=nul();
const h4=undef();
const h5=voidType();
const h6=any();
const h7=bigint();
const h8=date();
const h9=lit("hello");
const h10=lit(42);
const h11=lit(true);
const h12=lits(["a","b","c"]);
const h13=lit("a");
const h14=lit(1);
const h15=union([h3,h13,h11,h14]);
const h16=lits(["__proto__","constructor","toString"]);
const h17=ref(R,"Color");
const h18=ref(R,"Color__Red");
const h19=arr(h0);
const h20=arr(h1);
const h21=arr(h20);
const h22=tuple([h0,h1]);
const h23=tuple([h0],h1);
const h24=tuple([h2,h0]);
const h25=obj({});
const h26=ref(R,"Nested");
const h27=ref(R,"ManyFields");
const h28=ref(R,"Optionals");
const h29=obj({["__proto__"]:h0,toString:h1});
const h30=obj({},[{key:h0,value:h1}]);
const h31=obj({},[{key:numKey(),value:h0}]);
const h32=ref(R,"NumberKeyedObj");
const h33=obj({x:h1,y:h1});
const h34=obj({"1":h0,"2":h0});
const h35=obj({x:opt(h1),y:opt(h1)});
const h36=regex(/^(x_)([\s\S]*)$/,"`x_${string}`");
const h37=obj({},[{key:h36,value:h1}]);
const h38=ref(R,"TplIndexWithProps");
const h39=regex(/^(beta_)([\s\S]*)$/,"`beta_${string}`");
const h40=obj({alpha:opt(h0)},[{key:h39,value:opt(h0)}]);
const h41=obj({value:h13});
const h42=lit("b");
const h43=obj({value:h42});
const h44=obj({a:h41,b:h43});
const h45=union([h0,h1]);
const h46=ref(R,"ObjA");
const h47=ref(R,"ObjB");
const h48=union([h46,h47]);
const h49=union([h3,h0,h20,h46]);
const h50=ref(R,"Shape");
const h51=ref(R,"NestedDiscriminated");
const h52=ref(R,"ProtoDiscriminated");
const h53=ref(R,"MultiValueDiscriminated");
const h54=ref(R,"OptionalDiscriminated");
const h55=map(h0,h1);
const h56=set(h0);
const h57=union([h3,h55,h56]);
const h58=ref(R,"IA");
const h59=ref(R,"IB");
const h60=allOf([h58,h59]);
const h61=obj({x:h0});
const h62=obj({n:h61});
const h63=allOf([h62,h59]);
const h64=allOf([h58,h63]);
const h65=obj({},[{key:h0,value:h45}]);
const h66=obj({n:h1});
const h67=allOf([h65,h66,h58]);
const h68=allOf([h37,h58]);
const h69=ref(R,"IntersectionUnion");
const h70=obj({a:h0,c:opt(h2)});
const h71=obj({a:opt(h0),b:opt(h1),c:opt(h2)});
const h72=obj({a:h0,b:h1,c:h2});
const h73=lit("rect");
const h74=obj({h:h1,kind:h73,w:h1});
const h75=lit("square");
const h76=obj({kind:h75,size:h1});
const h77=disc("kind",{rect:h74,square:h76},[h74,h76]);
const h78=lits(["a","c"]);
const h79=ref(R,"ShapeKind");
const h80=ref(R,"Box_string");
const h81=ref(R,"Box_Box__number__");
const h82=ref(R,"Pair_number");
const h83=ref(R,"Pair_instance_3");
const h84=ref(R,"ListOf_number");
const h85=ref(R,"WithDefault_boolean");
const h86=ref(R,"GenericRecursive_string");
const h87=ref(R,"LinkedList");
const h88=ref(R,"Tree");
const h89=ref(R,"Json");
const h90=ref(R,"Expr");
const h91=ref(R,"MutualA");
const h92=ref(R,"RecursiveFirst");
const h93=ref(R,"RecursiveMiddle");
const h94=ref(R,"RecursiveLast");
const h95=ref(R,"RecursiveInTuple");
const h96=regex(/^(a)([\s\S]*)$/,"`a${string}`");
const h97=regex(/^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/,"`${number}`");
const h98=regex(/^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/,"`${number}.${number}.${number}`");
const h99=regex(/^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(x)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/,"`${number}x${number}`");
const h100=regex(/^((a)|(b))(-)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/,'`("a" | "b")-${number}`');
const h101=regex(/^(true|false)$/,"`${boolean}`");
const h102=regex(/^([\s\S]*)$/,"`${string}`");
const h103=regex(/^((green)|(red))$/,'`("green" | "red")`');
const h104=ref(R,"UserId");
const h105=ref(R,"AdminId");
const h106=ref(R,"NonNegative");
const h107=ref(R,"Rate");
const h108=obj({id:h104,rate:h107});
const h109=map(h0,h8);
const h110=obj({m:h109});
const h111=typedArray("Uint8Array");
const h112=typedArray("Int32Array");
const h113=typedArray("Float64Array");
const h114=typedArray("BigInt64Array");
const h115=obj({at:h8,big:h7});
const h116=strFormat(["UserId","AdminId"]);
const h117=obj({a:h0,b:h1,c:opt(h2)});
const h118=obj({value:h0});
const h119=obj({value:h1});
const h120=ref(R,"Box_number");
const h121=obj({value:h120});
const h122=lits(["green","red"]);
const h123=lit("add");
const h124=obj({left:h90,op:h123,right:h90});
const h125=lit("neg");
const h126=obj({arg:h90,op:h125});
const h127=lit("num");
const h128=obj({op:h127,value:h1});
const h129=disc("op",{add:h124,neg:h126,num:h128},[h126,h124,h128]);
const h130=arr(h86);
const h131=obj({children:h130,value:h0});
const h132=obj({a:h0});
const h133=obj({b:opt(h1)});
const h134=lit("u");
const h135=obj({kind:h134,u:h0});
const h136=lit("v");
const h137=obj({kind:h136,v:opt(h1)});
const h138=disc("kind",{u:h135,v:h137},[h135,h137]);
const h139=allOf([h58,h138]);
const h140=obj({},[{key:h0,value:h89}]);
const h141=arr(h89);
const h142=union([h3,h2,h0,h1,h140,h141]);
const h143=union([h3,h87]);
const h144=obj({next:h143,value:h1});
const h145=obj({item:h1,items:h20});
const h146=obj({f01:h0,f02:h1,f03:h2,f04:h0,f05:h1,f06:h2,f07:h0,f08:h1,f09:h2,f10:h0,f11:h1,f12:h2,f13:h0,f14:h1,f15:h2,f16:h0,f17:h1,f18:h2,f19:h0,f20:h1});
const h147=lit("alpha");
const h148=union([h147,h39]);
const h149=obj({a:h0,type:h78});
const h150=obj({b:h1,type:h42});
const h151=disc("type",{a:h149,b:h150,c:h149},[h149,h150]);
const h152=ref(R,"MutualB");
const h153=obj({b:opt(h152),tag:h13});
const h154=obj({a:opt(h91),tag:h42});
const h155=obj({deep:h119});
const h156=obj({id:h0});
const h157=arr(h156);
const h158=obj({inner:h155,list:h157});
const h159=lit("a1");
const h160=obj({a1:h0,subType:h159,type:h13});
const h161=lit("a2");
const h162=obj({a2:h0,subType:h161,type:h13});
const h163=disc("subType",{a1:h160,a2:h162},[h160,h162]);
const h164=obj({type:h42,value:h1});
const h165=disc("type",{a:h163,b:h164},[h160,h162,h164]);
const h166=numFormat(["NonNegative"]);
const h167=obj({},[{key:numKey(),value:h2}]);
const h168=obj({b:h1});
const h169=obj({a:h0,type:h13});
const h170=lit("d");
const h171=obj({d:h1,type:opt(h170)});
const h172=union([h169,h171]);
const h173=union([h3,h0]);
const h174=union([h4,h0]);
const h175=union([h5,h0]);
const h176=obj({nul:h173,opt:opt(h0),req:h0,undef:h174,voided:h175});
const h177=obj({first:h1,second:h0});
const h178=obj({first:h1,second:h2});
const h179=lit("__proto__");
const h180=obj({c:h2,kind:h179});
const h181=lit("constructor");
const h182=obj({b:h1,kind:h181});
const h183=lit("toString");
const h184=obj({a:h0,kind:h183});
const h185=disc("kind",{["__proto__"]:h180,constructor:h182,toString:h184},[h184,h182,h180]);
const h186=numFormat(["NonNegative","Rate"]);
const h187=arr(h92);
const h188=union([h0,h187]);
const h189=union([h3,h95]);
const h190=tuple([h1,h189]);
const h191=arr(h94);
const h192=union([h0,h1,h191]);
const h193=obj({child:h93});
const h194=union([h3,h1,h193]);
const h195=lit("circle");
const h196=obj({kind:h195,radius:h1});
const h197=disc("kind",{circle:h196,rect:h74,square:h76},[h74,h196,h76]);
const h198=lits(["circle","rect","square"]);
const h199=obj({a:h1},[{key:h36,value:h1}]);
const h200=arr(h88);
const h201=obj({children:h200,name:h0});
const h202=strFormat(["UserId"]);
const h203=arr(h2);
const h204=obj({a:h2,b:h203});
const h205=lit("red");
define(R,{AdminId:h116,Base:h117,Box_string:h118,Box_number:h119,Box_Box__number__:h121,Color:h122,Expr:h129,GenericRecursive_string:h131,IA:h132,IB:h133,IntersectionUnion:h139,Json:h142,LinkedList:h144,ListOf_number:h145,ManyFields:h146,MetaKey:h148,MultiValueDiscriminated:h151,MutualA:h153,MutualB:h154,Nested:h158,NestedDiscriminated:h165,NonNegative:h166,NumberKeyedObj:h167,ObjA:h132,ObjB:h168,OptionalDiscriminated:h172,Optionals:h176,Pair_number:h177,Pair_instance_3:h178,ProtoDiscriminated:h185,Rate:h186,RecursiveFirst:h188,RecursiveInTuple:h190,RecursiveLast:h192,RecursiveMiddle:h194,Shape:h197,ShapeKind:h198,TplIndexWithProps:h199,Tree:h201,UserId:h202,WithDefault_boolean:h204,Color__Red:h205});
const buildParsersInput={String:h0,Number:h1,Boolean:h2,Null:h3,Undefined:h4,Void:h5,Any:h6,Unknown:h6,BigInt:h7,DateT:h8,LitString:h9,LitNumber:h10,LitTrue:h11,LitUnion:h12,LitMixedUnion:h15,ProtoLitUnion:h16,Enum:h17,EnumMember:h18,StringArray:h19,ReadonlyNumberArray:h20,NestedArray:h21,Tuple:h22,TupleRest:h23,ReadonlyTuple:h24,Empty:h25,Nested:h26,ManyFields:h27,Optionals:h28,ProtoKeyObject:h29,StringRecord:h30,NumberRecord:h31,NumberKeyedObj:h32,LiteralKeyRecord:h33,NumberLiteralKeyRecord:h34,PartialRecord:h35,TplRecord:h37,TplIndexWithProps:h38,MetaRecord:h40,MappedType:h44,PrimitiveUnion:h45,ObjectUnion:h48,MixedUnion:h49,Shape:h50,NestedDiscriminated:h51,ProtoDiscriminated:h52,MultiValueDiscriminated:h53,OptionalDiscriminated:h54,MapOrSetUnion:h57,Intersection:h60,IntersectionNested:h64,IntersectionIndex:h67,IntersectionTplIndex:h68,IntersectionUnion:h69,OmitT:h70,PickT:h70,PartialT:h71,RequiredT:h72,ExcludeT:h77,ExcludeLit:h78,KeyofT:h12,IndexedAccess:h79,BoxString:h80,BoxBox:h81,PairDefault:h82,PairExplicit:h83,ListOfDefault:h84,WithDefault:h85,GenericRecursive:h86,LinkedList:h87,Tree:h88,Json:h89,Expr:h90,MutualA:h91,RecursiveFirst:h92,RecursiveMiddle:h93,RecursiveLast:h94,RecursiveInTuple:h95,TplPrefix:h96,TplNumber:h97,TplVersion:h98,TplSize:h99,TplLitUnion:h100,TplBoolean:h101,TplString:h102,TplEnum:h103,UserId:h104,AdminId:h105,NonNegative:h106,Rate:h107,FormatsInObject:h108,MapT:h55,SetT:h56,MapInObject:h110,Uint8ArrayT:h111,Int32ArrayT:h112,Float64ArrayT:h113,BigInt64ArrayT:h114,DateInObject:h115};

export default { buildParsers };