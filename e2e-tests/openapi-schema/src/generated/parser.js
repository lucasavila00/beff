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
const direct_hoist_0 = new RefRuntype("Address");
const direct_hoist_1 = new RefRuntype("User");
const direct_hoist_2 = new RefRuntype("CreateUserRequest");
const direct_hoist_3 = new RefRuntype("CreateUserResponse");
const direct_hoist_4 = new RefRuntype("UpdateUserRequest");
const direct_hoist_5 = new RefRuntype("SearchUsersResponse");
const direct_hoist_6 = new RefRuntype("RecursiveTree");
const direct_hoist_7 = new RefRuntype("RecursiveEnvelope");
const direct_hoist_8 = new RefRuntype("OpenApiCompatConstPayload");
const direct_hoist_9 = new RefRuntype("OpenApiCompatEnumPayload");
const direct_hoist_10 = new RefRuntype("OpenApiCompatRecordPayload");
const direct_hoist_11 = new RefRuntype("OpenApiCompatEmptyRecordPayload");
const direct_hoist_12 = new RefRuntype("OpenApiCompatOptionalizedPayload");
const direct_hoist_13 = new RefRuntype("OpenApiCompatOptinal");
const direct_hoist_14 = new RefRuntype("OpenApiCompatDiscUnion");
const direct_hoist_15 = new RefRuntype("OpenApiCompatDiscUnionCron");
const direct_hoist_16 = new RefRuntype("OpenApiCompatDiscUnionEvent");
const direct_hoist_17 = new RefRuntype("OpenApiCompatDiscUnionAndNamedTypes");
const direct_hoist_18 = new RefRuntype("WorkflowSource");
const direct_hoist_19 = new TypeofRuntype("string");
const direct_hoist_20 = new ObjectRuntype({
    "city": direct_hoist_19,
    "street": direct_hoist_19
}, []);
const direct_hoist_21 = new ObjectRuntype({
    "source": direct_hoist_19
}, []);
const direct_hoist_22 = new ObjectRuntype({
    "metadata": direct_hoist_21,
    "user": direct_hoist_1
}, []);
const direct_hoist_23 = new ObjectRuntype({
    "user": direct_hoist_1
}, []);
const direct_hoist_24 = new NullishRuntype("undefined");
const direct_hoist_25 = new AnyOfRuntype([
    direct_hoist_24,
    direct_hoist_19
]);
const direct_hoist_26 = new ConstRuntype("CRON");
const direct_hoist_27 = new ObjectRuntype({
    "cronExpression": direct_hoist_19,
    "eventName": direct_hoist_25,
    "type": direct_hoist_26
}, []);
const direct_hoist_28 = new RefRuntype("WorkflowSourceBase");
const direct_hoist_29 = new AllOfRuntype([
    direct_hoist_27,
    direct_hoist_28
]);
const direct_hoist_30 = new ConstRuntype("EVENT");
const direct_hoist_31 = new ObjectRuntype({
    "cronExpression": direct_hoist_25,
    "eventName": direct_hoist_19,
    "type": direct_hoist_30
}, []);
const direct_hoist_32 = new AllOfRuntype([
    direct_hoist_31,
    direct_hoist_28
]);
const direct_hoist_33 = new ConstRuntype(true);
const direct_hoist_34 = new NullishRuntype("null");
const direct_hoist_35 = new ConstRuntype(3);
const direct_hoist_36 = new ConstRuntype("ok");
const direct_hoist_37 = new ObjectRuntype({
    "enabled": direct_hoist_33,
    "nullable": direct_hoist_34,
    "retries": direct_hoist_35,
    "status": direct_hoist_36
}, []);
const direct_hoist_38 = new AnyOfDiscriminatedRuntype([
    direct_hoist_16,
    direct_hoist_15
], "type", {
    "CRON": direct_hoist_15,
    "EVENT": direct_hoist_16
}, {
    "CRON": direct_hoist_15,
    "EVENT": direct_hoist_16
});
const direct_hoist_39 = new AnyOfDiscriminatedRuntype([
    direct_hoist_16,
    direct_hoist_15
], "type", {
    "CRON": direct_hoist_15,
    "EVENT": direct_hoist_16
}, {
    "CRON": direct_hoist_15,
    "EVENT": direct_hoist_16
});
const direct_hoist_40 = new ObjectRuntype({
    "schedule": direct_hoist_19,
    "type": direct_hoist_26
}, []);
const direct_hoist_41 = new ObjectRuntype({
    "eventName": direct_hoist_19,
    "type": direct_hoist_30
}, []);
const direct_hoist_42 = new NeverRuntype();
const direct_hoist_43 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_19,
        "value": direct_hoist_42
    }
]);
const direct_hoist_44 = new ObjectRuntype({
    "payload": direct_hoist_43
}, []);
const direct_hoist_45 = new AnyOfConstsRuntype([
    200,
    201
]);
const direct_hoist_46 = new AnyOfConstsRuntype([
    false,
    true
]);
const direct_hoist_47 = new ConstRuntype("fallback");
const direct_hoist_48 = new ConstRuntype(0);
const direct_hoist_49 = new AnyOfRuntype([
    direct_hoist_34,
    direct_hoist_47,
    direct_hoist_48
]);
const direct_hoist_50 = new AnyOfConstsRuntype([
    "admin",
    "member"
]);
const direct_hoist_51 = new ObjectRuntype({
    "code": direct_hoist_45,
    "enabled": direct_hoist_46,
    "mixed": direct_hoist_49,
    "role": direct_hoist_50
}, []);
const direct_hoist_52 = new ObjectRuntype({
    "it": new OptionalFieldRuntype(direct_hoist_19)
}, []);
const direct_hoist_53 = new ConstRuntype("primary");
const direct_hoist_54 = new AnyOfRuntype([
    direct_hoist_34,
    direct_hoist_47,
    direct_hoist_53
]);
const direct_hoist_55 = new AnyOfRuntype([
    direct_hoist_34,
    direct_hoist_19
]);
const direct_hoist_56 = new ObjectRuntype({
    "maybeEnum": direct_hoist_54,
    "maybeText": direct_hoist_55,
    "onlyNull": direct_hoist_34,
    "optional": new OptionalFieldRuntype(direct_hoist_19),
    "orUndefined": direct_hoist_25
}, []);
const direct_hoist_57 = new AnyRuntype();
const direct_hoist_58 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_19,
        "value": direct_hoist_57
    }
]);
const direct_hoist_59 = new ObjectRuntype({
    "payload": direct_hoist_58
}, []);
const direct_hoist_60 = new ObjectRuntype({
    "previous": new OptionalFieldRuntype(direct_hoist_7),
    "root": direct_hoist_6
}, []);
const direct_hoist_61 = new ArrayRuntype(direct_hoist_6);
const direct_hoist_62 = new ObjectRuntype({
    "children": direct_hoist_61,
    "value": direct_hoist_19
}, []);
const direct_hoist_63 = new ArrayRuntype(direct_hoist_1);
const direct_hoist_64 = new ObjectRuntype({
    "items": direct_hoist_63,
    "primaryAddress": direct_hoist_0
}, []);
const direct_hoist_65 = new ObjectRuntype({
    "address": direct_hoist_0,
    "id": direct_hoist_19
}, []);
const direct_hoist_66 = new ObjectRuntype({
    "displayName": direct_hoist_19
}, []);
const direct_hoist_67 = new ObjectRuntype({
    "address": direct_hoist_0,
    "id": direct_hoist_19,
    "profile": direct_hoist_66
}, []);
const direct_hoist_68 = new ObjectRuntype({
    "createdAt": direct_hoist_19,
    "cronExpression": direct_hoist_19,
    "eventName": direct_hoist_25,
    "id": direct_hoist_19,
    "metadata": direct_hoist_58,
    "type": direct_hoist_26,
    "updatedAt": direct_hoist_19,
    "workflowID": direct_hoist_19
}, []);
const direct_hoist_69 = new ObjectRuntype({
    "createdAt": direct_hoist_19,
    "cronExpression": direct_hoist_25,
    "eventName": direct_hoist_19,
    "id": direct_hoist_19,
    "metadata": direct_hoist_58,
    "type": direct_hoist_30,
    "updatedAt": direct_hoist_19,
    "workflowID": direct_hoist_19
}, []);
const direct_hoist_70 = new RefRuntype("EventWorkflowSource");
const direct_hoist_71 = new RefRuntype("CronWorkflowSource");
const direct_hoist_72 = new AnyOfDiscriminatedRuntype([
    direct_hoist_70,
    direct_hoist_71
], "type", {
    "CRON": direct_hoist_68,
    "EVENT": direct_hoist_69
}, {
    "CRON": direct_hoist_68,
    "EVENT": direct_hoist_69
});
const direct_hoist_73 = new AnyOfConstsRuntype([
    "CRON",
    "EVENT"
]);
const direct_hoist_74 = new ObjectRuntype({
    "createdAt": direct_hoist_19,
    "id": direct_hoist_19,
    "metadata": direct_hoist_58,
    "type": direct_hoist_73,
    "updatedAt": direct_hoist_19,
    "workflowID": direct_hoist_19
}, []);
const namedRuntypes = {
    "Address": direct_hoist_20,
    "CreateUserRequest": direct_hoist_22,
    "CreateUserResponse": direct_hoist_23,
    "CronWorkflowSource": direct_hoist_29,
    "EventWorkflowSource": direct_hoist_32,
    "OpenApiCompatConstPayload": direct_hoist_37,
    "OpenApiCompatDiscUnion": direct_hoist_38,
    "OpenApiCompatDiscUnionAndNamedTypes": direct_hoist_39,
    "OpenApiCompatDiscUnionCron": direct_hoist_40,
    "OpenApiCompatDiscUnionEvent": direct_hoist_41,
    "OpenApiCompatEmptyRecordPayload": direct_hoist_44,
    "OpenApiCompatEnumPayload": direct_hoist_51,
    "OpenApiCompatOptinal": direct_hoist_52,
    "OpenApiCompatOptionalizedPayload": direct_hoist_56,
    "OpenApiCompatRecordPayload": direct_hoist_59,
    "RecursiveEnvelope": direct_hoist_60,
    "RecursiveTree": direct_hoist_62,
    "SearchUsersResponse": direct_hoist_64,
    "UpdateUserRequest": direct_hoist_65,
    "User": direct_hoist_67,
    "WorkflowSource": direct_hoist_72,
    "WorkflowSourceBase": direct_hoist_74
};
const buildParsersInput = {
    "Address": direct_hoist_0,
    "User": direct_hoist_1,
    "CreateUserRequest": direct_hoist_2,
    "CreateUserResponse": direct_hoist_3,
    "UpdateUserRequest": direct_hoist_4,
    "SearchUsersResponse": direct_hoist_5,
    "RecursiveTree": direct_hoist_6,
    "RecursiveEnvelope": direct_hoist_7,
    "OpenApiCompatConstPayload": direct_hoist_8,
    "OpenApiCompatEnumPayload": direct_hoist_9,
    "OpenApiCompatRecordPayload": direct_hoist_10,
    "OpenApiCompatEmptyRecordPayload": direct_hoist_11,
    "OpenApiCompatOptionalizedPayload": direct_hoist_12,
    "OpenApiCompatOptinal": direct_hoist_13,
    "OpenApiCompatDiscUnion": direct_hoist_14,
    "OpenApiCompatDiscUnionCron": direct_hoist_15,
    "OpenApiCompatDiscUnionEvent": direct_hoist_16,
    "OpenApiCompatDiscUnionAndNamedTypes": direct_hoist_17,
    "WorkflowSource": direct_hoist_18
};

exports.default = { buildParsers };