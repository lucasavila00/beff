//@ts-nocheck

Object.defineProperty(exports, "__esModule", {
  value: true
});
    
"use strict";

const {
  TypeofRuntype,
  AnyRuntype,
  NullishRuntype,
  NeverRuntype,
  ConstRuntype,
  RegexRuntype,
  DateRuntype,
  BigIntRuntype,
  StringWithFormatRuntype,
  NumberWithFormatRuntype,
  AnyOfConstsRuntype,
  TupleRuntype,
  AllOfRuntype,
  AnyOfRuntype,
  ArrayRuntype,
  AnyOfDiscriminatedRuntype,
  ObjectRuntype,
  OptionalFieldRuntype,
  BaseRefRuntype,
  registerStringFormatter,
  registerNumberFormatter,
  buildParserFromRuntype,
  generateHashFromString,
  TypedArrayRuntype,
  MapRuntype,
  SetRuntype,
  NumberKeyRuntype,
  GeneratedRuntype,
  isObj,
  discKey,
} = require("@beff/client/codegen-v2");

class RefRuntype extends BaseRefRuntype  {
  getNamedRuntypes() {
    return namedRuntypes;
  }
}

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
const direct_hoist_0 = new TypeofRuntype(undefined, "string");
const direct_hoist_1 = new TypeofRuntype(undefined, "number");
const direct_hoist_2 = new TypeofRuntype(undefined, "boolean");
const direct_hoist_3 = new NullishRuntype(undefined, "null");
const direct_hoist_4 = new NullishRuntype(undefined, "undefined");
const direct_hoist_5 = new AnyRuntype(undefined);
const direct_hoist_6 = new ObjectRuntype(undefined, {}, [
    {
        "key": new AnyOfRuntype(undefined, [
            direct_hoist_0,
            new NumberKeyRuntype(undefined)
        ]),
        "value": direct_hoist_5
    }
]);
const direct_hoist_7 = new ArrayRuntype(undefined, direct_hoist_5);
const direct_hoist_8 = new RefRuntype(undefined, "T1");
const direct_hoist_9 = new RefRuntype(undefined, "DocumentedPayload");
const direct_hoist_10 = new RefRuntype(undefined, "T2");
const direct_hoist_11 = new RefRuntype(undefined, "T3");
const direct_hoist_12 = new RefRuntype(undefined, "InvalidSchemaWithDate");
const direct_hoist_13 = new RefRuntype(undefined, "InvalidSchemaWithBigInt");
const direct_hoist_14 = new RefRuntype(undefined, "DiscriminatedUnion");
const direct_hoist_15 = new RefRuntype(undefined, "RecursiveTree");
const direct_hoist_16 = new RefRuntype(undefined, "SemVer");
const direct_hoist_17 = new RefRuntype(undefined, "NonEmptyString");
const direct_hoist_18 = new RefRuntype(undefined, "ValidCurrency");
const direct_hoist_19 = new RefRuntype(undefined, "EmptyClosedRecord");
const direct_hoist_20 = new RefRuntype(undefined, "OptionalNullishInput");
const direct_hoist_21 = new RefRuntype(undefined, "ToolInput");
const direct_hoist_22 = new ConstRuntype(undefined, "a1");
const direct_hoist_23 = new ConstRuntype(undefined, "a");
const direct_hoist_24 = new ObjectRuntype(undefined, {
    "a1": direct_hoist_0,
    "a11": new OptionalFieldRuntype(direct_hoist_0),
    "subType": direct_hoist_22,
    "type": direct_hoist_23
}, []);
const direct_hoist_25 = new ConstRuntype(undefined, "a2");
const direct_hoist_26 = new ObjectRuntype(undefined, {
    "a2": direct_hoist_0,
    "subType": direct_hoist_25,
    "type": direct_hoist_23
}, []);
const direct_hoist_27 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_24,
    direct_hoist_26
], "subType", {
    "a1": direct_hoist_24,
    "a2": direct_hoist_26
}, {
    "a1": direct_hoist_24,
    "a2": direct_hoist_26
});
const direct_hoist_28 = new ConstRuntype(undefined, "b");
const direct_hoist_29 = new ObjectRuntype(undefined, {
    "type": direct_hoist_28,
    "value": direct_hoist_1
}, []);
const direct_hoist_30 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_24,
    direct_hoist_26,
    direct_hoist_29
], "type", {
    "a": direct_hoist_27,
    "b": direct_hoist_29
}, {
    "a": direct_hoist_27,
    "b": direct_hoist_29
});
const direct_hoist_31 = new TypeofRuntype({
    "description": "Stable payload id."
}, "string");
const direct_hoist_32 = new TypeofRuntype({
    "description": "Optional retry count."
}, "number");
const direct_hoist_33 = new ObjectRuntype({
    "description": "Documented payload for flat JSON Schema."
}, {
    "id": direct_hoist_31,
    "retries": new OptionalFieldRuntype(direct_hoist_32)
}, []);
const direct_hoist_34 = new NeverRuntype(undefined);
const direct_hoist_35 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_0,
        "value": direct_hoist_34
    }
]);
const direct_hoist_36 = new BigIntRuntype(undefined);
const direct_hoist_37 = new ObjectRuntype(undefined, {
    "x": direct_hoist_36
}, []);
const direct_hoist_38 = new DateRuntype(undefined);
const direct_hoist_39 = new ObjectRuntype(undefined, {
    "x": direct_hoist_38
}, []);
const direct_hoist_40 = new TupleRuntype(undefined, [
    direct_hoist_0
], direct_hoist_0);
const direct_hoist_41 = new AnyOfRuntype(undefined, [
    direct_hoist_3,
    direct_hoist_4,
    direct_hoist_1
]);
const direct_hoist_42 = new AnyOfRuntype(undefined, [
    direct_hoist_3,
    direct_hoist_4,
    direct_hoist_0
]);
const direct_hoist_43 = new ObjectRuntype(undefined, {
    "limit": new OptionalFieldRuntype(direct_hoist_41),
    "value": new OptionalFieldRuntype(direct_hoist_42)
}, []);
const direct_hoist_44 = new ArrayRuntype(undefined, direct_hoist_15);
const direct_hoist_45 = new ObjectRuntype(undefined, {
    "children": direct_hoist_44,
    "value": direct_hoist_1
}, []);
const direct_hoist_46 = new RegexRuntype(undefined, /^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}.${number}.${number}`");
const direct_hoist_47 = new ObjectRuntype(undefined, {
    "a": direct_hoist_0,
    "b": direct_hoist_1
}, []);
const direct_hoist_48 = new ObjectRuntype(undefined, {
    "t1": direct_hoist_8
}, []);
const direct_hoist_49 = new ArrayRuntype(undefined, direct_hoist_10);
const direct_hoist_50 = new ObjectRuntype(undefined, {
    "t2Array": direct_hoist_49
}, []);
const direct_hoist_51 = new ConstRuntype(undefined, "stock_picker");
const direct_hoist_52 = new ObjectRuntype(undefined, {
    "key": direct_hoist_51
}, []);
const direct_hoist_53 = new RefRuntype(undefined, "ToolEnvelope");
const direct_hoist_54 = new RefRuntype(undefined, "WorkflowInput");
const direct_hoist_55 = new AllOfRuntype(undefined, [
    direct_hoist_53,
    direct_hoist_54
]);
const direct_hoist_56 = new StringWithFormatRuntype(undefined, [
    "ValidCurrency"
]);
const direct_hoist_57 = new ObjectRuntype(undefined, {
    "evaluationEndDate": direct_hoist_0,
    "evaluationStartDate": direct_hoist_0,
    "optionalNote": new OptionalFieldRuntype(direct_hoist_0),
    "trainingEndDate": direct_hoist_0
}, []);
const namedRuntypes = {
    "DiscriminatedUnion": direct_hoist_30,
    "DocumentedPayload": direct_hoist_33,
    "EmptyClosedRecord": direct_hoist_35,
    "InvalidSchemaWithBigInt": direct_hoist_37,
    "InvalidSchemaWithDate": direct_hoist_39,
    "NonEmptyString": direct_hoist_40,
    "OptionalNullishInput": direct_hoist_43,
    "RecursiveTree": direct_hoist_45,
    "SemVer": direct_hoist_46,
    "T1": direct_hoist_47,
    "T2": direct_hoist_48,
    "T3": direct_hoist_50,
    "ToolEnvelope": direct_hoist_52,
    "ToolInput": direct_hoist_55,
    "ValidCurrency": direct_hoist_56,
    "WorkflowInput": direct_hoist_57
};
const buildParsersInput = {
    "string": direct_hoist_0,
    "number": direct_hoist_1,
    "boolean": direct_hoist_2,
    "null": direct_hoist_3,
    "undefined": direct_hoist_4,
    "object": direct_hoist_6,
    "anyArray": new GeneratedRuntype(direct_hoist_7, v7),
    "any": direct_hoist_5,
    "T1": new GeneratedRuntype(direct_hoist_8, v47),
    "DocumentedPayload": new GeneratedRuntype(direct_hoist_9, v33),
    "T2": new GeneratedRuntype(direct_hoist_10, v48),
    "T3": new GeneratedRuntype(direct_hoist_11, v50),
    "InvalidSchemaWithDate": new GeneratedRuntype(direct_hoist_12, v39),
    "InvalidSchemaWithBigInt": new GeneratedRuntype(direct_hoist_13, v37),
    "DiscriminatedUnion": new GeneratedRuntype(direct_hoist_14, v30),
    "RecursiveTree": new GeneratedRuntype(direct_hoist_15, v45),
    "SemVer": direct_hoist_16,
    "NonEmptyString": direct_hoist_17,
    "ValidCurrency": direct_hoist_18,
    "EmptyClosedRecord": direct_hoist_19,
    "OptionalNullishInput": new GeneratedRuntype(direct_hoist_20, v43),
    "ToolInput": direct_hoist_21
};
function v7(c,i){if(!Array.isArray(i))return false;for(let k=0;k<i.length;k++)if(!(true))return false;return true}
function v24(c,i){return isObj(i)&&typeof i.a1=="string"&&(i.a11==null||typeof i.a11=="string")&&i.subType==="a1"&&i.type==="a"&&direct_hoist_24.noExtraKeys(c,i)}
function v26(c,i){return isObj(i)&&typeof i.a2=="string"&&i.subType==="a2"&&i.type==="a"&&direct_hoist_26.noExtraKeys(c,i)}
function v27(c,i){switch(discKey(i,"subType")){case "a1":return v24(c,i);case "a2":return v26(c,i)}return false}
function v29(c,i){return isObj(i)&&i.type==="b"&&typeof i.value=="number"&&direct_hoist_29.noExtraKeys(c,i)}
function v30(c,i){switch(discKey(i,"type")){case "a":return v27(c,i);case "b":return v29(c,i)}return false}
function v33(c,i){return isObj(i)&&typeof i.id=="string"&&(i.retries==null||typeof i.retries=="number")&&direct_hoist_33.noExtraKeys(c,i)}
function v37(c,i){return isObj(i)&&direct_hoist_36.validate(c,i.x)&&direct_hoist_37.noExtraKeys(c,i)}
function v39(c,i){return isObj(i)&&direct_hoist_38.validate(c,i.x)&&direct_hoist_39.noExtraKeys(c,i)}
function v43(c,i){return isObj(i)&&(i.limit==null||(i.limit==null||i.limit==null||typeof i.limit=="number"))&&(i.value==null||(i.value==null||i.value==null||typeof i.value=="string"))&&direct_hoist_43.noExtraKeys(c,i)}
function v44(c,i){if(!Array.isArray(i))return false;for(let k=0;k<i.length;k++)if(!(v45(c,i[k])))return false;return true}
function v45(c,i){return isObj(i)&&v44(c,i.children)&&typeof i.value=="number"&&direct_hoist_45.noExtraKeys(c,i)}
function v47(c,i){return isObj(i)&&typeof i.a=="string"&&typeof i.b=="number"&&direct_hoist_47.noExtraKeys(c,i)}
function v48(c,i){return isObj(i)&&v47(c,i.t1)&&direct_hoist_48.noExtraKeys(c,i)}
function v49(c,i){if(!Array.isArray(i))return false;for(let k=0;k<i.length;k++)if(!(v48(c,i[k])))return false;return true}
function v50(c,i){return isObj(i)&&v49(c,i.t2Array)&&direct_hoist_50.noExtraKeys(c,i)}

exports.default = { buildParsers };