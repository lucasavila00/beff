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
const direct_hoist_14 = new RefRuntype("OpenApiCompatOptionalNullishPayload");
const direct_hoist_15 = new RefRuntype("OpenApiCompatDiscUnion");
const direct_hoist_16 = new RefRuntype("OpenApiCompatDiscUnionCron");
const direct_hoist_17 = new RefRuntype("OpenApiCompatDiscUnionEvent");
const direct_hoist_18 = new RefRuntype("OpenApiCompatDiscUnionAndNamedTypes");
const direct_hoist_19 = new RefRuntype("WorkflowSource");
const direct_hoist_20 = new TypeofRuntype("string");
const direct_hoist_21 = new ObjectRuntype({
    "city": direct_hoist_20,
    "street": direct_hoist_20
}, []);
const direct_hoist_22 = new ObjectRuntype({
    "source": direct_hoist_20
}, []);
const direct_hoist_23 = new ObjectRuntype({
    "metadata": direct_hoist_22,
    "user": direct_hoist_1
}, []);
const direct_hoist_24 = new ObjectRuntype({
    "user": direct_hoist_1
}, []);
const direct_hoist_25 = new NullishRuntype("undefined");
const direct_hoist_26 = new AnyOfRuntype([
    direct_hoist_25,
    direct_hoist_20
]);
const direct_hoist_27 = new ConstRuntype("CRON");
const direct_hoist_28 = new ObjectRuntype({
    "cronExpression": direct_hoist_20,
    "eventName": direct_hoist_26,
    "type": direct_hoist_27
}, []);
const direct_hoist_29 = new RefRuntype("WorkflowSourceBase");
const direct_hoist_30 = new AllOfRuntype([
    direct_hoist_28,
    direct_hoist_29
]);
const direct_hoist_31 = new ConstRuntype("EVENT");
const direct_hoist_32 = new ObjectRuntype({
    "cronExpression": direct_hoist_26,
    "eventName": direct_hoist_20,
    "type": direct_hoist_31
}, []);
const direct_hoist_33 = new AllOfRuntype([
    direct_hoist_32,
    direct_hoist_29
]);
const direct_hoist_34 = new ConstRuntype(true);
const direct_hoist_35 = new NullishRuntype("null");
const direct_hoist_36 = new ConstRuntype(3);
const direct_hoist_37 = new ConstRuntype("ok");
const direct_hoist_38 = new ObjectRuntype({
    "enabled": direct_hoist_34,
    "nullable": direct_hoist_35,
    "retries": direct_hoist_36,
    "status": direct_hoist_37
}, []);
const direct_hoist_39 = new AnyOfDiscriminatedRuntype([
    direct_hoist_17,
    direct_hoist_16
], "type", {
    "CRON": direct_hoist_16,
    "EVENT": direct_hoist_17
}, {
    "CRON": direct_hoist_16,
    "EVENT": direct_hoist_17
});
const direct_hoist_40 = new AnyOfDiscriminatedRuntype([
    direct_hoist_17,
    direct_hoist_16
], "type", {
    "CRON": direct_hoist_16,
    "EVENT": direct_hoist_17
}, {
    "CRON": direct_hoist_16,
    "EVENT": direct_hoist_17
});
const direct_hoist_41 = new ObjectRuntype({
    "schedule": direct_hoist_20,
    "type": direct_hoist_27
}, []);
const direct_hoist_42 = new ObjectRuntype({
    "eventName": direct_hoist_20,
    "type": direct_hoist_31
}, []);
const direct_hoist_43 = new NeverRuntype();
const direct_hoist_44 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_20,
        "value": direct_hoist_43
    }
]);
const direct_hoist_45 = new ObjectRuntype({
    "payload": direct_hoist_44
}, []);
const direct_hoist_46 = new AnyOfConstsRuntype([
    200,
    201
]);
const direct_hoist_47 = new AnyOfConstsRuntype([
    false,
    true
]);
const direct_hoist_48 = new ConstRuntype("fallback");
const direct_hoist_49 = new ConstRuntype(0);
const direct_hoist_50 = new AnyOfRuntype([
    direct_hoist_35,
    direct_hoist_48,
    direct_hoist_49
]);
const direct_hoist_51 = new AnyOfConstsRuntype([
    "admin",
    "member"
]);
const direct_hoist_52 = new ObjectRuntype({
    "code": direct_hoist_46,
    "enabled": direct_hoist_47,
    "mixed": direct_hoist_50,
    "role": direct_hoist_51
}, []);
const direct_hoist_53 = new ObjectRuntype({
    "it": new OptionalFieldRuntype(direct_hoist_20)
}, []);
const direct_hoist_54 = new TypeofRuntype("number");
const direct_hoist_55 = new AnyOfRuntype([
    direct_hoist_35,
    direct_hoist_25,
    direct_hoist_54
]);
const direct_hoist_56 = new AnyOfRuntype([
    direct_hoist_35,
    direct_hoist_25,
    direct_hoist_20
]);
const direct_hoist_57 = new ObjectRuntype({
    "limit": new OptionalFieldRuntype(direct_hoist_55),
    "value": new OptionalFieldRuntype(direct_hoist_56)
}, []);
const direct_hoist_58 = new ConstRuntype("primary");
const direct_hoist_59 = new AnyOfRuntype([
    direct_hoist_35,
    direct_hoist_48,
    direct_hoist_58
]);
const direct_hoist_60 = new AnyOfRuntype([
    direct_hoist_35,
    direct_hoist_20
]);
const direct_hoist_61 = new ObjectRuntype({
    "maybeEnum": direct_hoist_59,
    "maybeText": direct_hoist_60,
    "onlyNull": direct_hoist_35,
    "optional": new OptionalFieldRuntype(direct_hoist_20),
    "orUndefined": direct_hoist_26
}, []);
const direct_hoist_62 = new AnyRuntype();
const direct_hoist_63 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_20,
        "value": direct_hoist_62
    }
]);
const direct_hoist_64 = new ObjectRuntype({
    "payload": direct_hoist_63
}, []);
const direct_hoist_65 = new ObjectRuntype({
    "previous": new OptionalFieldRuntype(direct_hoist_7),
    "root": direct_hoist_6
}, []);
const direct_hoist_66 = new ArrayRuntype(direct_hoist_6);
const direct_hoist_67 = new ObjectRuntype({
    "children": direct_hoist_66,
    "value": direct_hoist_20
}, []);
const direct_hoist_68 = new ArrayRuntype(direct_hoist_1);
const direct_hoist_69 = new ObjectRuntype({
    "items": direct_hoist_68,
    "primaryAddress": direct_hoist_0
}, []);
const direct_hoist_70 = new ObjectRuntype({
    "address": direct_hoist_0,
    "id": direct_hoist_20
}, []);
const direct_hoist_71 = new ObjectRuntype({
    "displayName": direct_hoist_20
}, []);
const direct_hoist_72 = new ObjectRuntype({
    "address": direct_hoist_0,
    "id": direct_hoist_20,
    "profile": direct_hoist_71
}, []);
const direct_hoist_73 = new ObjectRuntype({
    "createdAt": direct_hoist_20,
    "cronExpression": direct_hoist_20,
    "eventName": direct_hoist_26,
    "id": direct_hoist_20,
    "metadata": direct_hoist_63,
    "type": direct_hoist_27,
    "updatedAt": direct_hoist_20,
    "workflowID": direct_hoist_20
}, []);
const direct_hoist_74 = new ObjectRuntype({
    "createdAt": direct_hoist_20,
    "cronExpression": direct_hoist_26,
    "eventName": direct_hoist_20,
    "id": direct_hoist_20,
    "metadata": direct_hoist_63,
    "type": direct_hoist_31,
    "updatedAt": direct_hoist_20,
    "workflowID": direct_hoist_20
}, []);
const direct_hoist_75 = new RefRuntype("EventWorkflowSource");
const direct_hoist_76 = new RefRuntype("CronWorkflowSource");
const direct_hoist_77 = new AnyOfDiscriminatedRuntype([
    direct_hoist_75,
    direct_hoist_76
], "type", {
    "CRON": direct_hoist_73,
    "EVENT": direct_hoist_74
}, {
    "CRON": direct_hoist_73,
    "EVENT": direct_hoist_74
});
const direct_hoist_78 = new AnyOfConstsRuntype([
    "CRON",
    "EVENT"
]);
const direct_hoist_79 = new ObjectRuntype({
    "createdAt": direct_hoist_20,
    "id": direct_hoist_20,
    "metadata": direct_hoist_63,
    "type": direct_hoist_78,
    "updatedAt": direct_hoist_20,
    "workflowID": direct_hoist_20
}, []);
const namedRuntypes = {
    "Address": direct_hoist_21,
    "CreateUserRequest": direct_hoist_23,
    "CreateUserResponse": direct_hoist_24,
    "CronWorkflowSource": direct_hoist_30,
    "EventWorkflowSource": direct_hoist_33,
    "OpenApiCompatConstPayload": direct_hoist_38,
    "OpenApiCompatDiscUnion": direct_hoist_39,
    "OpenApiCompatDiscUnionAndNamedTypes": direct_hoist_40,
    "OpenApiCompatDiscUnionCron": direct_hoist_41,
    "OpenApiCompatDiscUnionEvent": direct_hoist_42,
    "OpenApiCompatEmptyRecordPayload": direct_hoist_45,
    "OpenApiCompatEnumPayload": direct_hoist_52,
    "OpenApiCompatOptinal": direct_hoist_53,
    "OpenApiCompatOptionalNullishPayload": direct_hoist_57,
    "OpenApiCompatOptionalizedPayload": direct_hoist_61,
    "OpenApiCompatRecordPayload": direct_hoist_64,
    "RecursiveEnvelope": direct_hoist_65,
    "RecursiveTree": direct_hoist_67,
    "SearchUsersResponse": direct_hoist_69,
    "UpdateUserRequest": direct_hoist_70,
    "User": direct_hoist_72,
    "WorkflowSource": direct_hoist_77,
    "WorkflowSourceBase": direct_hoist_79
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
    "OpenApiCompatOptionalNullishPayload": direct_hoist_14,
    "OpenApiCompatDiscUnion": direct_hoist_15,
    "OpenApiCompatDiscUnionCron": direct_hoist_16,
    "OpenApiCompatDiscUnionEvent": direct_hoist_17,
    "OpenApiCompatDiscUnionAndNamedTypes": direct_hoist_18,
    "WorkflowSource": direct_hoist_19
};

exports.default = { buildParsers };