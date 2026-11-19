//@ts-nocheck

Object.defineProperty(exports, "__esModule", {
  value: true
});
    
"use strict";

const {
  string,
  number,
  boolean,
  functionType,
  numberKey,
  any,
  nullType,
  undefinedType,
  voidType,
  never,
  literal,
  literals,
  regex,
  date,
  bigint,
  typedArray,
  stringWithFormat,
  numberWithFormat,
  tuple,
  intersection,
  union,
  array,
  map,
  set,
  discriminatedUnion,
  optional,
  object,
  reference,
  withDescription,
  define,
  registerStringFormatter,
  registerNumberFormatter,
  buildParserFromRuntype,
} = require("@beff/client/codegen-v2");

const registry = new Map();

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
const direct_hoist_0 = reference(registry, "Address");
const direct_hoist_1 = reference(registry, "User");
const direct_hoist_2 = reference(registry, "DocumentedPayload");
const direct_hoist_3 = reference(registry, "CreateUserRequest");
const direct_hoist_4 = reference(registry, "CreateUserResponse");
const direct_hoist_5 = reference(registry, "UpdateUserRequest");
const direct_hoist_6 = reference(registry, "SearchUsersResponse");
const direct_hoist_7 = reference(registry, "RecursiveTree");
const direct_hoist_8 = reference(registry, "RecursiveEnvelope");
const direct_hoist_9 = reference(registry, "OpenApiCompatConstPayload");
const direct_hoist_10 = reference(registry, "OpenApiCompatEnumPayload");
const direct_hoist_11 = reference(registry, "OpenApiCompatRecordPayload");
const direct_hoist_12 = reference(registry, "OpenApiCompatEmptyRecordPayload");
const direct_hoist_13 = reference(registry, "OpenApiCompatOptionalizedPayload");
const direct_hoist_14 = reference(registry, "OpenApiCompatOptinal");
const direct_hoist_15 = reference(registry, "OpenApiCompatOptionalNullishPayload");
const direct_hoist_16 = reference(registry, "OpenApiCompatDiscUnion");
const direct_hoist_17 = reference(registry, "OpenApiCompatDiscUnionCron");
const direct_hoist_18 = reference(registry, "OpenApiCompatDiscUnionEvent");
const direct_hoist_19 = reference(registry, "OpenApiCompatDiscUnionAndNamedTypes");
const direct_hoist_20 = reference(registry, "WorkflowSource");
const direct_hoist_21 = string();
const direct_hoist_22 = object({
    city: direct_hoist_21,
    street: direct_hoist_21
});
const direct_hoist_23 = object({
    source: direct_hoist_21
});
const direct_hoist_24 = object({
    metadata: direct_hoist_23,
    user: direct_hoist_1
});
const direct_hoist_25 = object({
    user: direct_hoist_1
});
const direct_hoist_26 = undefinedType();
const direct_hoist_27 = union([
    direct_hoist_26,
    direct_hoist_21
]);
const direct_hoist_28 = literal("CRON");
const direct_hoist_29 = object({
    cronExpression: direct_hoist_21,
    eventName: direct_hoist_27,
    type: direct_hoist_28
});
const direct_hoist_30 = reference(registry, "WorkflowSourceBase");
const direct_hoist_31 = intersection([
    direct_hoist_29,
    direct_hoist_30
]);
const direct_hoist_32 = withDescription(string(), "Stable payload id.");
const direct_hoist_33 = withDescription(number(), "Optional retry count.");
const direct_hoist_34 = withDescription(object({
    id: direct_hoist_32,
    retries: optional(direct_hoist_33)
}), "Documented payload for contextual JSON Schema.");
const direct_hoist_35 = literal("EVENT");
const direct_hoist_36 = object({
    cronExpression: direct_hoist_27,
    eventName: direct_hoist_21,
    type: direct_hoist_35
});
const direct_hoist_37 = intersection([
    direct_hoist_36,
    direct_hoist_30
]);
const direct_hoist_38 = literal(true);
const direct_hoist_39 = nullType();
const direct_hoist_40 = literal(3);
const direct_hoist_41 = literal("ok");
const direct_hoist_42 = object({
    enabled: direct_hoist_38,
    nullable: direct_hoist_39,
    retries: direct_hoist_40,
    status: direct_hoist_41
});
const direct_hoist_43 = discriminatedUnion("type", {
    CRON: direct_hoist_17,
    EVENT: direct_hoist_18
}, [
    direct_hoist_18,
    direct_hoist_17
]);
const direct_hoist_44 = discriminatedUnion("type", {
    CRON: direct_hoist_17,
    EVENT: direct_hoist_18
}, [
    direct_hoist_18,
    direct_hoist_17
]);
const direct_hoist_45 = object({
    schedule: direct_hoist_21,
    type: direct_hoist_28
});
const direct_hoist_46 = object({
    eventName: direct_hoist_21,
    type: direct_hoist_35
});
const direct_hoist_47 = never();
const direct_hoist_48 = object({}, [
    {
        key: direct_hoist_21,
        value: direct_hoist_47
    }
]);
const direct_hoist_49 = object({
    payload: direct_hoist_48
});
const direct_hoist_50 = literals([
    200,
    201
]);
const direct_hoist_51 = literals([
    false,
    true
]);
const direct_hoist_52 = literal("fallback");
const direct_hoist_53 = literal(0);
const direct_hoist_54 = union([
    direct_hoist_39,
    direct_hoist_52,
    direct_hoist_53
]);
const direct_hoist_55 = literals([
    "admin",
    "member"
]);
const direct_hoist_56 = object({
    code: direct_hoist_50,
    enabled: direct_hoist_51,
    mixed: direct_hoist_54,
    role: direct_hoist_55
});
const direct_hoist_57 = object({
    it: optional(direct_hoist_21)
});
const direct_hoist_58 = number();
const direct_hoist_59 = union([
    direct_hoist_39,
    direct_hoist_26,
    direct_hoist_58
]);
const direct_hoist_60 = union([
    direct_hoist_39,
    direct_hoist_26,
    direct_hoist_21
]);
const direct_hoist_61 = object({
    limit: optional(direct_hoist_59),
    value: optional(direct_hoist_60)
});
const direct_hoist_62 = literal("primary");
const direct_hoist_63 = union([
    direct_hoist_39,
    direct_hoist_52,
    direct_hoist_62
]);
const direct_hoist_64 = union([
    direct_hoist_39,
    direct_hoist_21
]);
const direct_hoist_65 = object({
    maybeEnum: direct_hoist_63,
    maybeText: direct_hoist_64,
    onlyNull: direct_hoist_39,
    optional: optional(direct_hoist_21),
    orUndefined: direct_hoist_27
});
const direct_hoist_66 = any();
const direct_hoist_67 = object({}, [
    {
        key: direct_hoist_21,
        value: direct_hoist_66
    }
]);
const direct_hoist_68 = object({
    payload: direct_hoist_67
});
const direct_hoist_69 = object({
    previous: optional(direct_hoist_8),
    root: direct_hoist_7
});
const direct_hoist_70 = array(direct_hoist_7);
const direct_hoist_71 = object({
    children: direct_hoist_70,
    value: direct_hoist_21
});
const direct_hoist_72 = array(direct_hoist_1);
const direct_hoist_73 = object({
    items: direct_hoist_72,
    primaryAddress: direct_hoist_0
});
const direct_hoist_74 = object({
    address: direct_hoist_0,
    id: direct_hoist_21
});
const direct_hoist_75 = object({
    displayName: direct_hoist_21
});
const direct_hoist_76 = object({
    address: direct_hoist_0,
    id: direct_hoist_21,
    profile: direct_hoist_75
});
const direct_hoist_77 = object({
    createdAt: direct_hoist_21,
    cronExpression: direct_hoist_21,
    eventName: direct_hoist_27,
    id: direct_hoist_21,
    metadata: direct_hoist_67,
    type: direct_hoist_28,
    updatedAt: direct_hoist_21,
    workflowID: direct_hoist_21
});
const direct_hoist_78 = object({
    createdAt: direct_hoist_21,
    cronExpression: direct_hoist_27,
    eventName: direct_hoist_21,
    id: direct_hoist_21,
    metadata: direct_hoist_67,
    type: direct_hoist_35,
    updatedAt: direct_hoist_21,
    workflowID: direct_hoist_21
});
const direct_hoist_79 = reference(registry, "EventWorkflowSource");
const direct_hoist_80 = reference(registry, "CronWorkflowSource");
const direct_hoist_81 = discriminatedUnion("type", {
    CRON: direct_hoist_77,
    EVENT: direct_hoist_78
}, [
    direct_hoist_79,
    direct_hoist_80
]);
const direct_hoist_82 = literals([
    "CRON",
    "EVENT"
]);
const direct_hoist_83 = object({
    createdAt: direct_hoist_21,
    id: direct_hoist_21,
    metadata: direct_hoist_67,
    type: direct_hoist_82,
    updatedAt: direct_hoist_21,
    workflowID: direct_hoist_21
});
define(registry, {
    Address: direct_hoist_22,
    CreateUserRequest: direct_hoist_24,
    CreateUserResponse: direct_hoist_25,
    CronWorkflowSource: direct_hoist_31,
    DocumentedPayload: direct_hoist_34,
    EventWorkflowSource: direct_hoist_37,
    OpenApiCompatConstPayload: direct_hoist_42,
    OpenApiCompatDiscUnion: direct_hoist_43,
    OpenApiCompatDiscUnionAndNamedTypes: direct_hoist_44,
    OpenApiCompatDiscUnionCron: direct_hoist_45,
    OpenApiCompatDiscUnionEvent: direct_hoist_46,
    OpenApiCompatEmptyRecordPayload: direct_hoist_49,
    OpenApiCompatEnumPayload: direct_hoist_56,
    OpenApiCompatOptinal: direct_hoist_57,
    OpenApiCompatOptionalNullishPayload: direct_hoist_61,
    OpenApiCompatOptionalizedPayload: direct_hoist_65,
    OpenApiCompatRecordPayload: direct_hoist_68,
    RecursiveEnvelope: direct_hoist_69,
    RecursiveTree: direct_hoist_71,
    SearchUsersResponse: direct_hoist_73,
    UpdateUserRequest: direct_hoist_74,
    User: direct_hoist_76,
    WorkflowSource: direct_hoist_81,
    WorkflowSourceBase: direct_hoist_83
});
const buildParsersInput = {
    Address: direct_hoist_0,
    User: direct_hoist_1,
    DocumentedPayload: direct_hoist_2,
    CreateUserRequest: direct_hoist_3,
    CreateUserResponse: direct_hoist_4,
    UpdateUserRequest: direct_hoist_5,
    SearchUsersResponse: direct_hoist_6,
    RecursiveTree: direct_hoist_7,
    RecursiveEnvelope: direct_hoist_8,
    OpenApiCompatConstPayload: direct_hoist_9,
    OpenApiCompatEnumPayload: direct_hoist_10,
    OpenApiCompatRecordPayload: direct_hoist_11,
    OpenApiCompatEmptyRecordPayload: direct_hoist_12,
    OpenApiCompatOptionalizedPayload: direct_hoist_13,
    OpenApiCompatOptinal: direct_hoist_14,
    OpenApiCompatOptionalNullishPayload: direct_hoist_15,
    OpenApiCompatDiscUnion: direct_hoist_16,
    OpenApiCompatDiscUnionCron: direct_hoist_17,
    OpenApiCompatDiscUnionEvent: direct_hoist_18,
    OpenApiCompatDiscUnionAndNamedTypes: direct_hoist_19,
    WorkflowSource: direct_hoist_20
};

exports.default = { buildParsers };