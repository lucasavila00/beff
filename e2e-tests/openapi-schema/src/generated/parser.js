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

const RequiredStringFormats = [];
const RequiredNumberFormats = [];
const direct_hoist_0 = new RefRuntype(undefined, "Address");
const direct_hoist_1 = new RefRuntype(undefined, "User");
const direct_hoist_2 = new RefRuntype(undefined, "DocumentedPayload");
const direct_hoist_3 = new RefRuntype(undefined, "CreateUserRequest");
const direct_hoist_4 = new RefRuntype(undefined, "CreateUserResponse");
const direct_hoist_5 = new RefRuntype(undefined, "UpdateUserRequest");
const direct_hoist_6 = new RefRuntype(undefined, "SearchUsersResponse");
const direct_hoist_7 = new RefRuntype(undefined, "RecursiveTree");
const direct_hoist_8 = new RefRuntype(undefined, "RecursiveEnvelope");
const direct_hoist_9 = new RefRuntype(undefined, "OpenApiCompatConstPayload");
const direct_hoist_10 = new RefRuntype(undefined, "OpenApiCompatEnumPayload");
const direct_hoist_11 = new RefRuntype(undefined, "OpenApiCompatRecordPayload");
const direct_hoist_12 = new RefRuntype(undefined, "OpenApiCompatEmptyRecordPayload");
const direct_hoist_13 = new RefRuntype(undefined, "OpenApiCompatOptionalizedPayload");
const direct_hoist_14 = new RefRuntype(undefined, "OpenApiCompatOptinal");
const direct_hoist_15 = new RefRuntype(undefined, "OpenApiCompatOptionalNullishPayload");
const direct_hoist_16 = new RefRuntype(undefined, "OpenApiCompatDiscUnion");
const direct_hoist_17 = new RefRuntype(undefined, "OpenApiCompatDiscUnionCron");
const direct_hoist_18 = new RefRuntype(undefined, "OpenApiCompatDiscUnionEvent");
const direct_hoist_19 = new RefRuntype(undefined, "OpenApiCompatDiscUnionAndNamedTypes");
const direct_hoist_20 = new RefRuntype(undefined, "WorkflowSource");
const direct_hoist_21 = new TypeofRuntype(undefined, "string");
const direct_hoist_22 = new ObjectRuntype(undefined, {
    "city": direct_hoist_21,
    "street": direct_hoist_21
}, []);
const direct_hoist_23 = new ObjectRuntype(undefined, {
    "source": direct_hoist_21
}, []);
const direct_hoist_24 = new ObjectRuntype(undefined, {
    "metadata": direct_hoist_23,
    "user": direct_hoist_1
}, []);
const direct_hoist_25 = new ObjectRuntype(undefined, {
    "user": direct_hoist_1
}, []);
const direct_hoist_26 = new NullishRuntype(undefined, "undefined");
const direct_hoist_27 = new AnyOfRuntype(undefined, [
    direct_hoist_26,
    direct_hoist_21
]);
const direct_hoist_28 = new ConstRuntype(undefined, "CRON");
const direct_hoist_29 = new ObjectRuntype(undefined, {
    "cronExpression": direct_hoist_21,
    "eventName": direct_hoist_27,
    "type": direct_hoist_28
}, []);
const direct_hoist_30 = new RefRuntype(undefined, "WorkflowSourceBase");
const direct_hoist_31 = new AllOfRuntype(undefined, [
    direct_hoist_29,
    direct_hoist_30
]);
const direct_hoist_32 = new TypeofRuntype({
    "description": "Stable payload id."
}, "string");
const direct_hoist_33 = new TypeofRuntype({
    "description": "Optional retry count."
}, "number");
const direct_hoist_34 = new ObjectRuntype({
    "description": "Documented payload for contextual JSON Schema."
}, {
    "id": direct_hoist_32,
    "retries": new OptionalFieldRuntype(direct_hoist_33)
}, []);
const direct_hoist_35 = new ConstRuntype(undefined, "EVENT");
const direct_hoist_36 = new ObjectRuntype(undefined, {
    "cronExpression": direct_hoist_27,
    "eventName": direct_hoist_21,
    "type": direct_hoist_35
}, []);
const direct_hoist_37 = new AllOfRuntype(undefined, [
    direct_hoist_36,
    direct_hoist_30
]);
const direct_hoist_38 = new ConstRuntype(undefined, true);
const direct_hoist_39 = new NullishRuntype(undefined, "null");
const direct_hoist_40 = new ConstRuntype(undefined, 3);
const direct_hoist_41 = new ConstRuntype(undefined, "ok");
const direct_hoist_42 = new ObjectRuntype(undefined, {
    "enabled": direct_hoist_38,
    "nullable": direct_hoist_39,
    "retries": direct_hoist_40,
    "status": direct_hoist_41
}, []);
const direct_hoist_43 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_18,
    direct_hoist_17
], "type", {
    "CRON": direct_hoist_17,
    "EVENT": direct_hoist_18
}, {
    "CRON": direct_hoist_17,
    "EVENT": direct_hoist_18
});
const direct_hoist_44 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_18,
    direct_hoist_17
], "type", {
    "CRON": direct_hoist_17,
    "EVENT": direct_hoist_18
}, {
    "CRON": direct_hoist_17,
    "EVENT": direct_hoist_18
});
const direct_hoist_45 = new ObjectRuntype(undefined, {
    "schedule": direct_hoist_21,
    "type": direct_hoist_28
}, []);
const direct_hoist_46 = new ObjectRuntype(undefined, {
    "eventName": direct_hoist_21,
    "type": direct_hoist_35
}, []);
const direct_hoist_47 = new NeverRuntype(undefined);
const direct_hoist_48 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_21,
        "value": direct_hoist_47
    }
]);
const direct_hoist_49 = new ObjectRuntype(undefined, {
    "payload": direct_hoist_48
}, []);
const direct_hoist_50 = new AnyOfConstsRuntype(undefined, [
    200,
    201
]);
const direct_hoist_51 = new AnyOfConstsRuntype(undefined, [
    false,
    true
]);
const direct_hoist_52 = new ConstRuntype(undefined, "fallback");
const direct_hoist_53 = new ConstRuntype(undefined, 0);
const direct_hoist_54 = new AnyOfRuntype(undefined, [
    direct_hoist_39,
    direct_hoist_52,
    direct_hoist_53
]);
const direct_hoist_55 = new AnyOfConstsRuntype(undefined, [
    "admin",
    "member"
]);
const direct_hoist_56 = new ObjectRuntype(undefined, {
    "code": direct_hoist_50,
    "enabled": direct_hoist_51,
    "mixed": direct_hoist_54,
    "role": direct_hoist_55
}, []);
const direct_hoist_57 = new ObjectRuntype(undefined, {
    "it": new OptionalFieldRuntype(direct_hoist_21)
}, []);
const direct_hoist_58 = new TypeofRuntype(undefined, "number");
const direct_hoist_59 = new AnyOfRuntype(undefined, [
    direct_hoist_39,
    direct_hoist_26,
    direct_hoist_58
]);
const direct_hoist_60 = new AnyOfRuntype(undefined, [
    direct_hoist_39,
    direct_hoist_26,
    direct_hoist_21
]);
const direct_hoist_61 = new ObjectRuntype(undefined, {
    "limit": new OptionalFieldRuntype(direct_hoist_59),
    "value": new OptionalFieldRuntype(direct_hoist_60)
}, []);
const direct_hoist_62 = new ConstRuntype(undefined, "primary");
const direct_hoist_63 = new AnyOfRuntype(undefined, [
    direct_hoist_39,
    direct_hoist_52,
    direct_hoist_62
]);
const direct_hoist_64 = new AnyOfRuntype(undefined, [
    direct_hoist_39,
    direct_hoist_21
]);
const direct_hoist_65 = new ObjectRuntype(undefined, {
    "maybeEnum": direct_hoist_63,
    "maybeText": direct_hoist_64,
    "onlyNull": direct_hoist_39,
    "optional": new OptionalFieldRuntype(direct_hoist_21),
    "orUndefined": direct_hoist_27
}, []);
const direct_hoist_66 = new AnyRuntype(undefined);
const direct_hoist_67 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_21,
        "value": direct_hoist_66
    }
]);
const direct_hoist_68 = new ObjectRuntype(undefined, {
    "payload": direct_hoist_67
}, []);
const direct_hoist_69 = new ObjectRuntype(undefined, {
    "previous": new OptionalFieldRuntype(direct_hoist_8),
    "root": direct_hoist_7
}, []);
const direct_hoist_70 = new ArrayRuntype(undefined, direct_hoist_7);
const direct_hoist_71 = new ObjectRuntype(undefined, {
    "children": direct_hoist_70,
    "value": direct_hoist_21
}, []);
const direct_hoist_72 = new ArrayRuntype(undefined, direct_hoist_1);
const direct_hoist_73 = new ObjectRuntype(undefined, {
    "items": direct_hoist_72,
    "primaryAddress": direct_hoist_0
}, []);
const direct_hoist_74 = new ObjectRuntype(undefined, {
    "address": direct_hoist_0,
    "id": direct_hoist_21
}, []);
const direct_hoist_75 = new ObjectRuntype(undefined, {
    "displayName": direct_hoist_21
}, []);
const direct_hoist_76 = new ObjectRuntype(undefined, {
    "address": direct_hoist_0,
    "id": direct_hoist_21,
    "profile": direct_hoist_75
}, []);
const direct_hoist_77 = new ObjectRuntype(undefined, {
    "createdAt": direct_hoist_21,
    "cronExpression": direct_hoist_21,
    "eventName": direct_hoist_27,
    "id": direct_hoist_21,
    "metadata": direct_hoist_67,
    "type": direct_hoist_28,
    "updatedAt": direct_hoist_21,
    "workflowID": direct_hoist_21
}, []);
const direct_hoist_78 = new ObjectRuntype(undefined, {
    "createdAt": direct_hoist_21,
    "cronExpression": direct_hoist_27,
    "eventName": direct_hoist_21,
    "id": direct_hoist_21,
    "metadata": direct_hoist_67,
    "type": direct_hoist_35,
    "updatedAt": direct_hoist_21,
    "workflowID": direct_hoist_21
}, []);
const direct_hoist_79 = new RefRuntype(undefined, "EventWorkflowSource");
const direct_hoist_80 = new RefRuntype(undefined, "CronWorkflowSource");
const direct_hoist_81 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_79,
    direct_hoist_80
], "type", {
    "CRON": direct_hoist_77,
    "EVENT": direct_hoist_78
}, {
    "CRON": direct_hoist_77,
    "EVENT": direct_hoist_78
});
const direct_hoist_82 = new AnyOfConstsRuntype(undefined, [
    "CRON",
    "EVENT"
]);
const direct_hoist_83 = new ObjectRuntype(undefined, {
    "createdAt": direct_hoist_21,
    "id": direct_hoist_21,
    "metadata": direct_hoist_67,
    "type": direct_hoist_82,
    "updatedAt": direct_hoist_21,
    "workflowID": direct_hoist_21
}, []);
const namedRuntypes = {
    "Address": direct_hoist_22,
    "CreateUserRequest": direct_hoist_24,
    "CreateUserResponse": direct_hoist_25,
    "CronWorkflowSource": direct_hoist_31,
    "DocumentedPayload": direct_hoist_34,
    "EventWorkflowSource": direct_hoist_37,
    "OpenApiCompatConstPayload": direct_hoist_42,
    "OpenApiCompatDiscUnion": direct_hoist_43,
    "OpenApiCompatDiscUnionAndNamedTypes": direct_hoist_44,
    "OpenApiCompatDiscUnionCron": direct_hoist_45,
    "OpenApiCompatDiscUnionEvent": direct_hoist_46,
    "OpenApiCompatEmptyRecordPayload": direct_hoist_49,
    "OpenApiCompatEnumPayload": direct_hoist_56,
    "OpenApiCompatOptinal": direct_hoist_57,
    "OpenApiCompatOptionalNullishPayload": direct_hoist_61,
    "OpenApiCompatOptionalizedPayload": direct_hoist_65,
    "OpenApiCompatRecordPayload": direct_hoist_68,
    "RecursiveEnvelope": direct_hoist_69,
    "RecursiveTree": direct_hoist_71,
    "SearchUsersResponse": direct_hoist_73,
    "UpdateUserRequest": direct_hoist_74,
    "User": direct_hoist_76,
    "WorkflowSource": direct_hoist_81,
    "WorkflowSourceBase": direct_hoist_83
};
const buildParsersInput = {
    "Address": new GeneratedRuntype(direct_hoist_0, v22),
    "User": new GeneratedRuntype(direct_hoist_1, v76),
    "DocumentedPayload": new GeneratedRuntype(direct_hoist_2, v34),
    "CreateUserRequest": new GeneratedRuntype(direct_hoist_3, v24),
    "CreateUserResponse": new GeneratedRuntype(direct_hoist_4, v25),
    "UpdateUserRequest": new GeneratedRuntype(direct_hoist_5, v74),
    "SearchUsersResponse": new GeneratedRuntype(direct_hoist_6, v73),
    "RecursiveTree": new GeneratedRuntype(direct_hoist_7, v71),
    "RecursiveEnvelope": new GeneratedRuntype(direct_hoist_8, v69),
    "OpenApiCompatConstPayload": new GeneratedRuntype(direct_hoist_9, v42),
    "OpenApiCompatEnumPayload": new GeneratedRuntype(direct_hoist_10, v56),
    "OpenApiCompatRecordPayload": new GeneratedRuntype(direct_hoist_11, v68),
    "OpenApiCompatEmptyRecordPayload": new GeneratedRuntype(direct_hoist_12, v49),
    "OpenApiCompatOptionalizedPayload": new GeneratedRuntype(direct_hoist_13, v65),
    "OpenApiCompatOptinal": new GeneratedRuntype(direct_hoist_14, v57),
    "OpenApiCompatOptionalNullishPayload": new GeneratedRuntype(direct_hoist_15, v61),
    "OpenApiCompatDiscUnion": new GeneratedRuntype(direct_hoist_16, v43),
    "OpenApiCompatDiscUnionCron": new GeneratedRuntype(direct_hoist_17, v45),
    "OpenApiCompatDiscUnionEvent": new GeneratedRuntype(direct_hoist_18, v46),
    "OpenApiCompatDiscUnionAndNamedTypes": new GeneratedRuntype(direct_hoist_19, v44),
    "WorkflowSource": new GeneratedRuntype(direct_hoist_20, v81)
};
function v22(c,i){return isObj(i)&&typeof i.city=="string"&&typeof i.street=="string"&&direct_hoist_22.noExtraKeys(c,i)}
function v23(c,i){return isObj(i)&&typeof i.source=="string"&&direct_hoist_23.noExtraKeys(c,i)}
function v24(c,i){return isObj(i)&&v23(c,i.metadata)&&v76(c,i.user)&&direct_hoist_24.noExtraKeys(c,i)}
function v25(c,i){return isObj(i)&&v76(c,i.user)&&direct_hoist_25.noExtraKeys(c,i)}
function v34(c,i){return isObj(i)&&typeof i.id=="string"&&(i.retries==null||typeof i.retries=="number")&&direct_hoist_34.noExtraKeys(c,i)}
function v42(c,i){return isObj(i)&&i.enabled===true&&i.nullable==null&&i.retries===3&&i.status==="ok"&&direct_hoist_42.noExtraKeys(c,i)}
function v43(c,i){switch(discKey(i,"type")){case "CRON":return v45(c,i);case "EVENT":return v46(c,i)}return false}
function v44(c,i){switch(discKey(i,"type")){case "CRON":return v45(c,i);case "EVENT":return v46(c,i)}return false}
function v45(c,i){return isObj(i)&&typeof i.schedule=="string"&&i.type==="CRON"&&direct_hoist_45.noExtraKeys(c,i)}
function v46(c,i){return isObj(i)&&typeof i.eventName=="string"&&i.type==="EVENT"&&direct_hoist_46.noExtraKeys(c,i)}
function v49(c,i){return isObj(i)&&direct_hoist_48.validate(c,i.payload)&&direct_hoist_49.noExtraKeys(c,i)}
function v56(c,i){return isObj(i)&&direct_hoist_50.validate(c,i.code)&&direct_hoist_51.validate(c,i.enabled)&&(i.mixed==null||i.mixed==="fallback"||i.mixed===0)&&direct_hoist_55.validate(c,i.role)&&direct_hoist_56.noExtraKeys(c,i)}
function v57(c,i){return isObj(i)&&(i.it==null||typeof i.it=="string")&&direct_hoist_57.noExtraKeys(c,i)}
function v61(c,i){return isObj(i)&&(i.limit==null||(i.limit==null||i.limit==null||typeof i.limit=="number"))&&(i.value==null||(i.value==null||i.value==null||typeof i.value=="string"))&&direct_hoist_61.noExtraKeys(c,i)}
function v65(c,i){return isObj(i)&&(i.maybeEnum==null||i.maybeEnum==="fallback"||i.maybeEnum==="primary")&&(i.maybeText==null||typeof i.maybeText=="string")&&i.onlyNull==null&&(i.optional==null||typeof i.optional=="string")&&(i.orUndefined==null||typeof i.orUndefined=="string")&&direct_hoist_65.noExtraKeys(c,i)}
function v68(c,i){return isObj(i)&&direct_hoist_67.validate(c,i.payload)&&direct_hoist_68.noExtraKeys(c,i)}
function v69(c,i){return isObj(i)&&(i.previous==null||v69(c,i.previous))&&v71(c,i.root)&&direct_hoist_69.noExtraKeys(c,i)}
function v70(c,i){if(!Array.isArray(i))return false;for(let k=0;k<i.length;k++)if(!(v71(c,i[k])))return false;return true}
function v71(c,i){return isObj(i)&&v70(c,i.children)&&typeof i.value=="string"&&direct_hoist_71.noExtraKeys(c,i)}
function v72(c,i){if(!Array.isArray(i))return false;for(let k=0;k<i.length;k++)if(!(v76(c,i[k])))return false;return true}
function v73(c,i){return isObj(i)&&v72(c,i.items)&&v22(c,i.primaryAddress)&&direct_hoist_73.noExtraKeys(c,i)}
function v74(c,i){return isObj(i)&&v22(c,i.address)&&typeof i.id=="string"&&direct_hoist_74.noExtraKeys(c,i)}
function v75(c,i){return isObj(i)&&typeof i.displayName=="string"&&direct_hoist_75.noExtraKeys(c,i)}
function v76(c,i){return isObj(i)&&v22(c,i.address)&&typeof i.id=="string"&&v75(c,i.profile)&&direct_hoist_76.noExtraKeys(c,i)}
function v77(c,i){return isObj(i)&&typeof i.createdAt=="string"&&typeof i.cronExpression=="string"&&(i.eventName==null||typeof i.eventName=="string")&&typeof i.id=="string"&&direct_hoist_67.validate(c,i.metadata)&&i.type==="CRON"&&typeof i.updatedAt=="string"&&typeof i.workflowID=="string"&&direct_hoist_77.noExtraKeys(c,i)}
function v78(c,i){return isObj(i)&&typeof i.createdAt=="string"&&(i.cronExpression==null||typeof i.cronExpression=="string")&&typeof i.eventName=="string"&&typeof i.id=="string"&&direct_hoist_67.validate(c,i.metadata)&&i.type==="EVENT"&&typeof i.updatedAt=="string"&&typeof i.workflowID=="string"&&direct_hoist_78.noExtraKeys(c,i)}
function v81(c,i){switch(discKey(i,"type")){case "CRON":return v77(c,i);case "EVENT":return v78(c,i)}return false}

exports.default = { buildParsers };