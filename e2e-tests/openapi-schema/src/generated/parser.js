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
    "Address": direct_hoist_0,
    "User": direct_hoist_1,
    "DocumentedPayload": direct_hoist_2,
    "CreateUserRequest": direct_hoist_3,
    "CreateUserResponse": direct_hoist_4,
    "UpdateUserRequest": direct_hoist_5,
    "SearchUsersResponse": direct_hoist_6,
    "RecursiveTree": direct_hoist_7,
    "RecursiveEnvelope": direct_hoist_8,
    "OpenApiCompatConstPayload": direct_hoist_9,
    "OpenApiCompatEnumPayload": direct_hoist_10,
    "OpenApiCompatRecordPayload": direct_hoist_11,
    "OpenApiCompatEmptyRecordPayload": direct_hoist_12,
    "OpenApiCompatOptionalizedPayload": direct_hoist_13,
    "OpenApiCompatOptinal": direct_hoist_14,
    "OpenApiCompatOptionalNullishPayload": direct_hoist_15,
    "OpenApiCompatDiscUnion": direct_hoist_16,
    "OpenApiCompatDiscUnionCron": direct_hoist_17,
    "OpenApiCompatDiscUnionEvent": direct_hoist_18,
    "OpenApiCompatDiscUnionAndNamedTypes": direct_hoist_19,
    "WorkflowSource": direct_hoist_20
};

exports.default = { buildParsers };