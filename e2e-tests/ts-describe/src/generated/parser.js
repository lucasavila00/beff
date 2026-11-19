//@ts-nocheck

"use strict";

import {
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
} from "@beff/client/codegen-v2";

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

const RequiredStringFormats = ["ValidCurrency","CompactId","JsdocReusableToken"];
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
const direct_hoist_10 = new RefRuntype(undefined, "DocumentedResult");
const direct_hoist_11 = new RefRuntype(undefined, "JsdocSingleLineAlias");
const direct_hoist_12 = new RefRuntype(undefined, "JsdocMultilineObject");
const direct_hoist_13 = new RefRuntype(undefined, "JsdocMemberOnlyObject");
const direct_hoist_14 = new RefRuntype(undefined, "JsdocNestedObject");
const direct_hoist_15 = new RefRuntype(undefined, "JsdocReferencesDocumentedAlias");
const direct_hoist_16 = new RefRuntype(undefined, "JsdocUnionVariant");
const direct_hoist_17 = new RefRuntype(undefined, "JsdocIgnoredCommentObject");
const direct_hoist_18 = new RefRuntype(undefined, "JsdocAfterUnrelatedValue");
const direct_hoist_19 = new RefRuntype(undefined, "T2");
const direct_hoist_20 = new RefRuntype(undefined, "T3");
const direct_hoist_21 = new RefRuntype(undefined, "InvalidSchemaWithDate");
const direct_hoist_22 = new RefRuntype(undefined, "InvalidSchemaWithBigInt");
const direct_hoist_23 = new RefRuntype(undefined, "DiscriminatedUnion");
const direct_hoist_24 = new RefRuntype(undefined, "RecursiveTree");
const direct_hoist_25 = new RefRuntype(undefined, "SemVer");
const direct_hoist_26 = new RefRuntype(undefined, "NonEmptyString");
const direct_hoist_27 = new RefRuntype(undefined, "ValidCurrency");
const direct_hoist_28 = new RefRuntype(undefined, "DocumentedSearchInput");
const direct_hoist_29 = new RefRuntype(undefined, "HierarchySelection");
const direct_hoist_30 = new RefRuntype(undefined, "ReusesRef");
const direct_hoist_31 = new RefRuntype(undefined, "UsesGenericWrapper");
const direct_hoist_32 = new RefRuntype(undefined, "StringWrapped");
const direct_hoist_33 = new RefRuntype(undefined, "NumberWrapped");
const direct_hoist_34 = new RefRuntype(undefined, "UsesWrappeds");
const direct_hoist_35 = new RefRuntype(undefined, "UsesWrappedsComplex");
const direct_hoist_36 = new RefRuntype(undefined, "UsesWrappedsComplexRef");
const direct_hoist_37 = new ObjectRuntype(undefined, {
    "a": direct_hoist_2
}, []);
const direct_hoist_38 = new StringWithFormatRuntype({
    "description": "CompactId represents a formatted identifier\nwhile keeping generated schemas small."
}, [
    "CompactId"
]);
const direct_hoist_39 = new ObjectRuntype(undefined, {
    "value": direct_hoist_2
}, []);
const direct_hoist_40 = new ObjectRuntype(undefined, {
    "value": direct_hoist_0
}, []);
const direct_hoist_41 = new ObjectRuntype(undefined, {
    "value": direct_hoist_1
}, []);
const direct_hoist_42 = new ObjectRuntype(undefined, {
    "value": direct_hoist_37
}, []);
const direct_hoist_43 = new RefRuntype(undefined, "ABool");
const direct_hoist_44 = new ObjectRuntype(undefined, {
    "value": direct_hoist_43
}, []);
const direct_hoist_45 = new ConstRuntype(undefined, "a1");
const direct_hoist_46 = new ConstRuntype(undefined, "a");
const direct_hoist_47 = new ObjectRuntype(undefined, {
    "a1": direct_hoist_0,
    "a11": new OptionalFieldRuntype(direct_hoist_0),
    "subType": direct_hoist_45,
    "type": direct_hoist_46
}, []);
const direct_hoist_48 = new ConstRuntype(undefined, "a2");
const direct_hoist_49 = new ObjectRuntype(undefined, {
    "a2": direct_hoist_0,
    "subType": direct_hoist_48,
    "type": direct_hoist_46
}, []);
const direct_hoist_50 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_47,
    direct_hoist_49
], "subType", {
    "a1": direct_hoist_47,
    "a2": direct_hoist_49
}, {
    "a1": direct_hoist_47,
    "a2": direct_hoist_49
});
const direct_hoist_51 = new ConstRuntype(undefined, "b");
const direct_hoist_52 = new ObjectRuntype(undefined, {
    "type": direct_hoist_51,
    "value": direct_hoist_1
}, []);
const direct_hoist_53 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_47,
    direct_hoist_49,
    direct_hoist_52
], "type", {
    "a": direct_hoist_50,
    "b": direct_hoist_52
}, {
    "a": direct_hoist_50,
    "b": direct_hoist_52
});
const direct_hoist_54 = new TypeofRuntype({
    "description": "Stable payload id."
}, "string");
const direct_hoist_55 = new TypeofRuntype({
    "description": "Optional retry count."
}, "number");
const direct_hoist_56 = new ObjectRuntype({
    "description": "Documented payload for TypeScript descriptions."
}, {
    "id": direct_hoist_54,
    "retries": new OptionalFieldRuntype(direct_hoist_55)
}, []);
const direct_hoist_57 = new AnyOfRuntype({
    "description": "Optional display label."
}, [
    direct_hoist_3,
    direct_hoist_0
]);
const direct_hoist_58 = new TypeofRuntype({
    "description": "Stable lookup key."
}, "string");
const direct_hoist_59 = new ObjectRuntype({
    "description": "Documented result with nullable and required fields."
}, {
    "alpha": direct_hoist_57,
    "beta": direct_hoist_58
}, []);
const direct_hoist_60 = new AnyOfRuntype({
    "description": "Optional numeric cursor for paged lookup."
}, [
    direct_hoist_4,
    direct_hoist_1
]);
const direct_hoist_61 = new RefRuntype(undefined, "CompactId");
const direct_hoist_62 = new ObjectRuntype(undefined, {
    "cursor": direct_hoist_60,
    "item": direct_hoist_61
}, []);
const direct_hoist_63 = new RefRuntype(undefined, "GenericWrapper_string");
const direct_hoist_64 = new AnyOfRuntype(undefined, [
    direct_hoist_2,
    direct_hoist_0
]);
const direct_hoist_65 = new ObjectRuntype(undefined, {
    "other": direct_hoist_63,
    "value": direct_hoist_0,
    "value2": direct_hoist_64
}, []);
const direct_hoist_66 = new RefRuntype(undefined, "GenericWrapper_number");
const direct_hoist_67 = new AnyOfRuntype(undefined, [
    direct_hoist_2,
    direct_hoist_1
]);
const direct_hoist_68 = new ObjectRuntype(undefined, {
    "other": direct_hoist_66,
    "value": direct_hoist_1,
    "value2": direct_hoist_67
}, []);
const direct_hoist_69 = new ConstRuntype(undefined, "entityId");
const direct_hoist_70 = new RefRuntype(undefined, "EntityId");
const direct_hoist_71 = new ObjectRuntype({
    "description": "A selectable hierarchy entry that resolves to a list of target entities."
}, {
    "_tag": direct_hoist_69,
    "entityId": direct_hoist_70
}, []);
const direct_hoist_72 = new BigIntRuntype(undefined);
const direct_hoist_73 = new ObjectRuntype(undefined, {
    "x": direct_hoist_72
}, []);
const direct_hoist_74 = new DateRuntype(undefined);
const direct_hoist_75 = new ObjectRuntype(undefined, {
    "x": direct_hoist_74
}, []);
const direct_hoist_76 = new ObjectRuntype(undefined, {
    "line": direct_hoist_1,
    "plain": direct_hoist_0
}, []);
const direct_hoist_77 = new AnyOfRuntype({
    "description": "Nullable first field."
}, [
    direct_hoist_3,
    direct_hoist_0
]);
const direct_hoist_78 = new TypeofRuntype({
    "description": "Required second field."
}, "string");
const direct_hoist_79 = new TypeofRuntype({
    "description": "Optional third field."
}, "number");
const direct_hoist_80 = new ObjectRuntype(undefined, {
    "alpha": direct_hoist_77,
    "beta": direct_hoist_78,
    "gamma": new OptionalFieldRuntype(direct_hoist_79)
}, []);
const direct_hoist_81 = new TypeofRuntype({
    "description": "First documented field."
}, "string");
const direct_hoist_82 = new TypeofRuntype({
    "description": "Second documented field."
}, "number");
const direct_hoist_83 = new ObjectRuntype({
    "description": "Anonymous multiline object.\n\nKeeps an intentional blank line."
}, {
    "first": direct_hoist_81,
    "second": direct_hoist_82
}, []);
const direct_hoist_84 = new TypeofRuntype({
    "description": "Inner enabled flag."
}, "boolean");
const direct_hoist_85 = new ObjectRuntype({
    "description": "Nested value."
}, {
    "enabled": direct_hoist_84
}, []);
const direct_hoist_86 = new ObjectRuntype(undefined, {
    "nested": direct_hoist_85
}, []);
const direct_hoist_87 = new RefRuntype(undefined, "JsdocReusableToken");
const direct_hoist_88 = new ObjectRuntype(undefined, {
    "token": direct_hoist_87
}, []);
const direct_hoist_89 = new StringWithFormatRuntype({
    "description": "Reusable documented token."
}, [
    "JsdocReusableToken"
]);
const direct_hoist_90 = new TypeofRuntype({
    "description": "Anonymous single-line alias."
}, "string");
const direct_hoist_91 = new ConstRuntype(undefined, "left");
const direct_hoist_92 = new TypeofRuntype({
    "description": "Left variant value."
}, "string");
const direct_hoist_93 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_91,
    "value": direct_hoist_92
}, []);
const direct_hoist_94 = new TypeofRuntype({
    "description": "Right variant count."
}, "number");
const direct_hoist_95 = new ConstRuntype(undefined, "right");
const direct_hoist_96 = new ObjectRuntype(undefined, {
    "count": direct_hoist_94,
    "kind": direct_hoist_95
}, []);
const direct_hoist_97 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_96,
    direct_hoist_93
], "kind", {
    "left": direct_hoist_93,
    "right": direct_hoist_96
}, {
    "left": direct_hoist_93,
    "right": direct_hoist_96
});
const direct_hoist_98 = new TupleRuntype(undefined, [
    direct_hoist_0
], direct_hoist_0);
const direct_hoist_99 = new RefRuntype(undefined, "DataWrapper_number");
const direct_hoist_100 = new ArrayRuntype(undefined, direct_hoist_24);
const direct_hoist_101 = new ObjectRuntype(undefined, {
    "children": direct_hoist_100,
    "value": direct_hoist_1
}, []);
const direct_hoist_102 = new ObjectRuntype(undefined, {
    "a": direct_hoist_20,
    "b": direct_hoist_20
}, []);
const direct_hoist_103 = new RegexRuntype(undefined, /^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}.${number}.${number}`");
const direct_hoist_104 = new RefRuntype(undefined, "DataWrapper_string");
const direct_hoist_105 = new ObjectRuntype(undefined, {
    "a": direct_hoist_0,
    "b": direct_hoist_1
}, []);
const direct_hoist_106 = new ObjectRuntype(undefined, {
    "t1": direct_hoist_8
}, []);
const direct_hoist_107 = new ArrayRuntype(undefined, direct_hoist_19);
const direct_hoist_108 = new ObjectRuntype(undefined, {
    "t2Array": direct_hoist_107
}, []);
const direct_hoist_109 = new ObjectRuntype(undefined, {
    "wrappedNumber": direct_hoist_66,
    "wrappedString": direct_hoist_63
}, []);
const direct_hoist_110 = new RefRuntype(undefined, "DataWrapper_boolean");
const direct_hoist_111 = new ObjectRuntype(undefined, {
    "x1": direct_hoist_32,
    "x2": direct_hoist_33,
    "x3": direct_hoist_110,
    "x4": direct_hoist_32,
    "x5": direct_hoist_33,
    "x6": direct_hoist_110
}, []);
const direct_hoist_112 = new RefRuntype(undefined, "DataWrapper_instance_5");
const direct_hoist_113 = new ObjectRuntype(undefined, {
    "x3": direct_hoist_112,
    "x6": direct_hoist_112
}, []);
const direct_hoist_114 = new RefRuntype(undefined, "DataWrapper_ABool");
const direct_hoist_115 = new ObjectRuntype(undefined, {
    "x3": direct_hoist_114,
    "x6": direct_hoist_114
}, []);
const direct_hoist_116 = new StringWithFormatRuntype(undefined, [
    "ValidCurrency"
]);
const namedRuntypes = {
    "ABool": direct_hoist_37,
    "CompactId": direct_hoist_38,
    "DataWrapper_boolean": direct_hoist_39,
    "DataWrapper_string": direct_hoist_40,
    "DataWrapper_number": direct_hoist_41,
    "DataWrapper_instance_5": direct_hoist_42,
    "DataWrapper_ABool": direct_hoist_44,
    "DiscriminatedUnion": direct_hoist_53,
    "DocumentedPayload": direct_hoist_56,
    "DocumentedResult": direct_hoist_59,
    "DocumentedSearchInput": direct_hoist_62,
    "EntityId": direct_hoist_0,
    "GenericWrapper_string": direct_hoist_65,
    "GenericWrapper_number": direct_hoist_68,
    "HierarchySelection": direct_hoist_71,
    "InvalidSchemaWithBigInt": direct_hoist_73,
    "InvalidSchemaWithDate": direct_hoist_75,
    "JsdocAfterUnrelatedValue": direct_hoist_0,
    "JsdocIgnoredCommentObject": direct_hoist_76,
    "JsdocMemberOnlyObject": direct_hoist_80,
    "JsdocMultilineObject": direct_hoist_83,
    "JsdocNestedObject": direct_hoist_86,
    "JsdocReferencesDocumentedAlias": direct_hoist_88,
    "JsdocReusableToken": direct_hoist_89,
    "JsdocSingleLineAlias": direct_hoist_90,
    "JsdocUnionVariant": direct_hoist_97,
    "NonEmptyString": direct_hoist_98,
    "NumberWrapped": direct_hoist_99,
    "RecursiveTree": direct_hoist_101,
    "ReusesRef": direct_hoist_102,
    "SemVer": direct_hoist_103,
    "StringWrapped": direct_hoist_104,
    "T1": direct_hoist_105,
    "T2": direct_hoist_106,
    "T3": direct_hoist_108,
    "UsesGenericWrapper": direct_hoist_109,
    "UsesWrappeds": direct_hoist_111,
    "UsesWrappedsComplex": direct_hoist_113,
    "UsesWrappedsComplexRef": direct_hoist_115,
    "ValidCurrency": direct_hoist_116
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
    "T1": new GeneratedRuntype(direct_hoist_8, v105),
    "DocumentedPayload": new GeneratedRuntype(direct_hoist_9, v56),
    "DocumentedResult": new GeneratedRuntype(direct_hoist_10, v59),
    "JsdocSingleLineAlias": direct_hoist_11,
    "JsdocMultilineObject": new GeneratedRuntype(direct_hoist_12, v83),
    "JsdocMemberOnlyObject": new GeneratedRuntype(direct_hoist_13, v80),
    "JsdocNestedObject": new GeneratedRuntype(direct_hoist_14, v86),
    "JsdocReferencesDocumentedAlias": new GeneratedRuntype(direct_hoist_15, v88),
    "JsdocUnionVariant": new GeneratedRuntype(direct_hoist_16, v97),
    "JsdocIgnoredCommentObject": new GeneratedRuntype(direct_hoist_17, v76),
    "JsdocAfterUnrelatedValue": direct_hoist_18,
    "T2": new GeneratedRuntype(direct_hoist_19, v106),
    "T3": new GeneratedRuntype(direct_hoist_20, v108),
    "InvalidSchemaWithDate": new GeneratedRuntype(direct_hoist_21, v75),
    "InvalidSchemaWithBigInt": new GeneratedRuntype(direct_hoist_22, v73),
    "DiscriminatedUnion": new GeneratedRuntype(direct_hoist_23, v53),
    "RecursiveTree": new GeneratedRuntype(direct_hoist_24, v101),
    "SemVer": direct_hoist_25,
    "NonEmptyString": direct_hoist_26,
    "ValidCurrency": direct_hoist_27,
    "DocumentedSearchInput": new GeneratedRuntype(direct_hoist_28, v62),
    "HierarchySelection": new GeneratedRuntype(direct_hoist_29, v71),
    "ReusesRef": new GeneratedRuntype(direct_hoist_30, v102),
    "UsesGenericWrapper": new GeneratedRuntype(direct_hoist_31, v109),
    "StringWrapped": new GeneratedRuntype(direct_hoist_32, v40),
    "NumberWrapped": new GeneratedRuntype(direct_hoist_33, v41),
    "UsesWrappeds": new GeneratedRuntype(direct_hoist_34, v111),
    "UsesWrappedsComplex": new GeneratedRuntype(direct_hoist_35, v113),
    "UsesWrappedsComplexRef": new GeneratedRuntype(direct_hoist_36, v115)
};
function v7(c,i){if(!Array.isArray(i))return false;for(let k=0;k<i.length;k++)if(!(true))return false;return true}
function v37(c,i){return isObj(i)&&typeof i.a=="boolean"&&direct_hoist_37.noExtraKeys(c,i)}
function v39(c,i){return isObj(i)&&typeof i.value=="boolean"&&direct_hoist_39.noExtraKeys(c,i)}
function v40(c,i){return isObj(i)&&typeof i.value=="string"&&direct_hoist_40.noExtraKeys(c,i)}
function v41(c,i){return isObj(i)&&typeof i.value=="number"&&direct_hoist_41.noExtraKeys(c,i)}
function v42(c,i){return isObj(i)&&v37(c,i.value)&&direct_hoist_42.noExtraKeys(c,i)}
function v44(c,i){return isObj(i)&&v37(c,i.value)&&direct_hoist_44.noExtraKeys(c,i)}
function v47(c,i){return isObj(i)&&typeof i.a1=="string"&&(i.a11==null||typeof i.a11=="string")&&i.subType==="a1"&&i.type==="a"&&direct_hoist_47.noExtraKeys(c,i)}
function v49(c,i){return isObj(i)&&typeof i.a2=="string"&&i.subType==="a2"&&i.type==="a"&&direct_hoist_49.noExtraKeys(c,i)}
function v50(c,i){switch(discKey(i,"subType")){case "a1":return v47(c,i);case "a2":return v49(c,i)}return false}
function v52(c,i){return isObj(i)&&i.type==="b"&&typeof i.value=="number"&&direct_hoist_52.noExtraKeys(c,i)}
function v53(c,i){switch(discKey(i,"type")){case "a":return v50(c,i);case "b":return v52(c,i)}return false}
function v56(c,i){return isObj(i)&&typeof i.id=="string"&&(i.retries==null||typeof i.retries=="number")&&direct_hoist_56.noExtraKeys(c,i)}
function v59(c,i){return isObj(i)&&(i.alpha==null||typeof i.alpha=="string")&&typeof i.beta=="string"&&direct_hoist_59.noExtraKeys(c,i)}
function v62(c,i){return isObj(i)&&(i.cursor==null||typeof i.cursor=="number")&&direct_hoist_38.validate(c,i.item)&&direct_hoist_62.noExtraKeys(c,i)}
function v65(c,i){return isObj(i)&&v65(c,i.other)&&typeof i.value=="string"&&(typeof i.value2=="boolean"||typeof i.value2=="string")&&direct_hoist_65.noExtraKeys(c,i)}
function v68(c,i){return isObj(i)&&v68(c,i.other)&&typeof i.value=="number"&&(typeof i.value2=="boolean"||typeof i.value2=="number")&&direct_hoist_68.noExtraKeys(c,i)}
function v71(c,i){return isObj(i)&&i._tag==="entityId"&&typeof i.entityId=="string"&&direct_hoist_71.noExtraKeys(c,i)}
function v73(c,i){return isObj(i)&&direct_hoist_72.validate(c,i.x)&&direct_hoist_73.noExtraKeys(c,i)}
function v75(c,i){return isObj(i)&&direct_hoist_74.validate(c,i.x)&&direct_hoist_75.noExtraKeys(c,i)}
function v76(c,i){return isObj(i)&&typeof i.line=="number"&&typeof i.plain=="string"&&direct_hoist_76.noExtraKeys(c,i)}
function v80(c,i){return isObj(i)&&(i.alpha==null||typeof i.alpha=="string")&&typeof i.beta=="string"&&(i.gamma==null||typeof i.gamma=="number")&&direct_hoist_80.noExtraKeys(c,i)}
function v83(c,i){return isObj(i)&&typeof i.first=="string"&&typeof i.second=="number"&&direct_hoist_83.noExtraKeys(c,i)}
function v85(c,i){return isObj(i)&&typeof i.enabled=="boolean"&&direct_hoist_85.noExtraKeys(c,i)}
function v86(c,i){return isObj(i)&&v85(c,i.nested)&&direct_hoist_86.noExtraKeys(c,i)}
function v88(c,i){return isObj(i)&&direct_hoist_89.validate(c,i.token)&&direct_hoist_88.noExtraKeys(c,i)}
function v93(c,i){return isObj(i)&&i.kind==="left"&&typeof i.value=="string"&&direct_hoist_93.noExtraKeys(c,i)}
function v96(c,i){return isObj(i)&&typeof i.count=="number"&&i.kind==="right"&&direct_hoist_96.noExtraKeys(c,i)}
function v97(c,i){switch(discKey(i,"kind")){case "left":return v93(c,i);case "right":return v96(c,i)}return false}
function v100(c,i){if(!Array.isArray(i))return false;for(let k=0;k<i.length;k++)if(!(v101(c,i[k])))return false;return true}
function v101(c,i){return isObj(i)&&v100(c,i.children)&&typeof i.value=="number"&&direct_hoist_101.noExtraKeys(c,i)}
function v102(c,i){return isObj(i)&&v108(c,i.a)&&v108(c,i.b)&&direct_hoist_102.noExtraKeys(c,i)}
function v105(c,i){return isObj(i)&&typeof i.a=="string"&&typeof i.b=="number"&&direct_hoist_105.noExtraKeys(c,i)}
function v106(c,i){return isObj(i)&&v105(c,i.t1)&&direct_hoist_106.noExtraKeys(c,i)}
function v107(c,i){if(!Array.isArray(i))return false;for(let k=0;k<i.length;k++)if(!(v106(c,i[k])))return false;return true}
function v108(c,i){return isObj(i)&&v107(c,i.t2Array)&&direct_hoist_108.noExtraKeys(c,i)}
function v109(c,i){return isObj(i)&&v68(c,i.wrappedNumber)&&v65(c,i.wrappedString)&&direct_hoist_109.noExtraKeys(c,i)}
function v111(c,i){return isObj(i)&&v40(c,i.x1)&&v41(c,i.x2)&&v39(c,i.x3)&&v40(c,i.x4)&&v41(c,i.x5)&&v39(c,i.x6)&&direct_hoist_111.noExtraKeys(c,i)}
function v113(c,i){return isObj(i)&&v42(c,i.x3)&&v42(c,i.x6)&&direct_hoist_113.noExtraKeys(c,i)}
function v115(c,i){return isObj(i)&&v44(c,i.x3)&&v44(c,i.x6)&&direct_hoist_115.noExtraKeys(c,i)}

export default { buildParsers };