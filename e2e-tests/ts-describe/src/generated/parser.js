//@ts-nocheck

"use strict";

import {
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
} from "@beff/client/codegen-v2";

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

const RequiredStringFormats = ["ValidCurrency","CompactId","JsdocReusableToken"];
const RequiredNumberFormats = [];
const direct_hoist_0 = string();
const direct_hoist_1 = number();
const direct_hoist_2 = boolean();
const direct_hoist_3 = nullType();
const direct_hoist_4 = undefinedType();
const direct_hoist_5 = any();
const direct_hoist_6 = object({}, [
    {
        key: union([
            direct_hoist_0,
            numberKey()
        ]),
        value: direct_hoist_5
    }
]);
const direct_hoist_7 = array(direct_hoist_5);
const direct_hoist_8 = reference(registry, "T1");
const direct_hoist_9 = reference(registry, "DocumentedPayload");
const direct_hoist_10 = reference(registry, "DocumentedResult");
const direct_hoist_11 = reference(registry, "JsdocSingleLineAlias");
const direct_hoist_12 = reference(registry, "JsdocMultilineObject");
const direct_hoist_13 = reference(registry, "JsdocMemberOnlyObject");
const direct_hoist_14 = reference(registry, "JsdocNestedObject");
const direct_hoist_15 = reference(registry, "JsdocReferencesDocumentedAlias");
const direct_hoist_16 = reference(registry, "JsdocUnionVariant");
const direct_hoist_17 = reference(registry, "JsdocIgnoredCommentObject");
const direct_hoist_18 = reference(registry, "JsdocAfterUnrelatedValue");
const direct_hoist_19 = reference(registry, "T2");
const direct_hoist_20 = reference(registry, "T3");
const direct_hoist_21 = reference(registry, "InvalidSchemaWithDate");
const direct_hoist_22 = reference(registry, "InvalidSchemaWithBigInt");
const direct_hoist_23 = reference(registry, "DiscriminatedUnion");
const direct_hoist_24 = reference(registry, "RecursiveTree");
const direct_hoist_25 = reference(registry, "SemVer");
const direct_hoist_26 = reference(registry, "NonEmptyString");
const direct_hoist_27 = reference(registry, "ValidCurrency");
const direct_hoist_28 = reference(registry, "DocumentedSearchInput");
const direct_hoist_29 = reference(registry, "HierarchySelection");
const direct_hoist_30 = reference(registry, "ReusesRef");
const direct_hoist_31 = reference(registry, "UsesGenericWrapper");
const direct_hoist_32 = reference(registry, "StringWrapped");
const direct_hoist_33 = reference(registry, "NumberWrapped");
const direct_hoist_34 = reference(registry, "UsesWrappeds");
const direct_hoist_35 = reference(registry, "UsesWrappedsComplex");
const direct_hoist_36 = reference(registry, "UsesWrappedsComplexRef");
const direct_hoist_37 = object({
    a: direct_hoist_2
});
const direct_hoist_38 = withDescription(stringWithFormat([
    "CompactId"
]), "CompactId represents a formatted identifier\nwhile keeping generated schemas small.");
const direct_hoist_39 = object({
    value: direct_hoist_2
});
const direct_hoist_40 = object({
    value: direct_hoist_0
});
const direct_hoist_41 = object({
    value: direct_hoist_1
});
const direct_hoist_42 = object({
    value: direct_hoist_37
});
const direct_hoist_43 = reference(registry, "ABool");
const direct_hoist_44 = object({
    value: direct_hoist_43
});
const direct_hoist_45 = literal("a1");
const direct_hoist_46 = literal("a");
const direct_hoist_47 = object({
    a1: direct_hoist_0,
    a11: optional(direct_hoist_0),
    subType: direct_hoist_45,
    type: direct_hoist_46
});
const direct_hoist_48 = literal("a2");
const direct_hoist_49 = object({
    a2: direct_hoist_0,
    subType: direct_hoist_48,
    type: direct_hoist_46
});
const direct_hoist_50 = discriminatedUnion("subType", {
    a1: direct_hoist_47,
    a2: direct_hoist_49
}, [
    direct_hoist_47,
    direct_hoist_49
]);
const direct_hoist_51 = literal("b");
const direct_hoist_52 = object({
    type: direct_hoist_51,
    value: direct_hoist_1
});
const direct_hoist_53 = discriminatedUnion("type", {
    a: direct_hoist_50,
    b: direct_hoist_52
}, [
    direct_hoist_47,
    direct_hoist_49,
    direct_hoist_52
]);
const direct_hoist_54 = withDescription(string(), "Stable payload id.");
const direct_hoist_55 = withDescription(number(), "Optional retry count.");
const direct_hoist_56 = withDescription(object({
    id: direct_hoist_54,
    retries: optional(direct_hoist_55)
}), "Documented payload for TypeScript descriptions.");
const direct_hoist_57 = withDescription(union([
    direct_hoist_3,
    direct_hoist_0
]), "Optional display label.");
const direct_hoist_58 = withDescription(string(), "Stable lookup key.");
const direct_hoist_59 = withDescription(object({
    alpha: direct_hoist_57,
    beta: direct_hoist_58
}), "Documented result with nullable and required fields.");
const direct_hoist_60 = withDescription(union([
    direct_hoist_4,
    direct_hoist_1
]), "Optional numeric cursor for paged lookup.");
const direct_hoist_61 = reference(registry, "CompactId");
const direct_hoist_62 = object({
    cursor: direct_hoist_60,
    item: direct_hoist_61
});
const direct_hoist_63 = reference(registry, "GenericWrapper_string");
const direct_hoist_64 = union([
    direct_hoist_2,
    direct_hoist_0
]);
const direct_hoist_65 = object({
    other: direct_hoist_63,
    value: direct_hoist_0,
    value2: direct_hoist_64
});
const direct_hoist_66 = reference(registry, "GenericWrapper_number");
const direct_hoist_67 = union([
    direct_hoist_2,
    direct_hoist_1
]);
const direct_hoist_68 = object({
    other: direct_hoist_66,
    value: direct_hoist_1,
    value2: direct_hoist_67
});
const direct_hoist_69 = literal("entityId");
const direct_hoist_70 = reference(registry, "EntityId");
const direct_hoist_71 = withDescription(object({
    _tag: direct_hoist_69,
    entityId: direct_hoist_70
}), "A selectable hierarchy entry that resolves to a list of target entities.");
const direct_hoist_72 = bigint();
const direct_hoist_73 = object({
    x: direct_hoist_72
});
const direct_hoist_74 = date();
const direct_hoist_75 = object({
    x: direct_hoist_74
});
const direct_hoist_76 = object({
    line: direct_hoist_1,
    plain: direct_hoist_0
});
const direct_hoist_77 = withDescription(union([
    direct_hoist_3,
    direct_hoist_0
]), "Nullable first field.");
const direct_hoist_78 = withDescription(string(), "Required second field.");
const direct_hoist_79 = withDescription(number(), "Optional third field.");
const direct_hoist_80 = object({
    alpha: direct_hoist_77,
    beta: direct_hoist_78,
    gamma: optional(direct_hoist_79)
});
const direct_hoist_81 = withDescription(string(), "First documented field.");
const direct_hoist_82 = withDescription(number(), "Second documented field.");
const direct_hoist_83 = withDescription(object({
    first: direct_hoist_81,
    second: direct_hoist_82
}), "Anonymous multiline object.\n\nKeeps an intentional blank line.");
const direct_hoist_84 = withDescription(boolean(), "Inner enabled flag.");
const direct_hoist_85 = withDescription(object({
    enabled: direct_hoist_84
}), "Nested value.");
const direct_hoist_86 = object({
    nested: direct_hoist_85
});
const direct_hoist_87 = reference(registry, "JsdocReusableToken");
const direct_hoist_88 = object({
    token: direct_hoist_87
});
const direct_hoist_89 = withDescription(stringWithFormat([
    "JsdocReusableToken"
]), "Reusable documented token.");
const direct_hoist_90 = withDescription(string(), "Anonymous single-line alias.");
const direct_hoist_91 = literal("left");
const direct_hoist_92 = withDescription(string(), "Left variant value.");
const direct_hoist_93 = object({
    kind: direct_hoist_91,
    value: direct_hoist_92
});
const direct_hoist_94 = withDescription(number(), "Right variant count.");
const direct_hoist_95 = literal("right");
const direct_hoist_96 = object({
    count: direct_hoist_94,
    kind: direct_hoist_95
});
const direct_hoist_97 = discriminatedUnion("kind", {
    left: direct_hoist_93,
    right: direct_hoist_96
}, [
    direct_hoist_96,
    direct_hoist_93
]);
const direct_hoist_98 = tuple([
    direct_hoist_0
], direct_hoist_0);
const direct_hoist_99 = reference(registry, "DataWrapper_number");
const direct_hoist_100 = array(direct_hoist_24);
const direct_hoist_101 = object({
    children: direct_hoist_100,
    value: direct_hoist_1
});
const direct_hoist_102 = object({
    a: direct_hoist_20,
    b: direct_hoist_20
});
const direct_hoist_103 = regex(/^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}.${number}.${number}`");
const direct_hoist_104 = reference(registry, "DataWrapper_string");
const direct_hoist_105 = object({
    a: direct_hoist_0,
    b: direct_hoist_1
});
const direct_hoist_106 = object({
    t1: direct_hoist_8
});
const direct_hoist_107 = array(direct_hoist_19);
const direct_hoist_108 = object({
    t2Array: direct_hoist_107
});
const direct_hoist_109 = object({
    wrappedNumber: direct_hoist_66,
    wrappedString: direct_hoist_63
});
const direct_hoist_110 = reference(registry, "DataWrapper_boolean");
const direct_hoist_111 = object({
    x1: direct_hoist_32,
    x2: direct_hoist_33,
    x3: direct_hoist_110,
    x4: direct_hoist_32,
    x5: direct_hoist_33,
    x6: direct_hoist_110
});
const direct_hoist_112 = reference(registry, "DataWrapper_instance_5");
const direct_hoist_113 = object({
    x3: direct_hoist_112,
    x6: direct_hoist_112
});
const direct_hoist_114 = reference(registry, "DataWrapper_ABool");
const direct_hoist_115 = object({
    x3: direct_hoist_114,
    x6: direct_hoist_114
});
const direct_hoist_116 = stringWithFormat([
    "ValidCurrency"
]);
define(registry, {
    ABool: direct_hoist_37,
    CompactId: direct_hoist_38,
    DataWrapper_boolean: direct_hoist_39,
    DataWrapper_string: direct_hoist_40,
    DataWrapper_number: direct_hoist_41,
    DataWrapper_instance_5: direct_hoist_42,
    DataWrapper_ABool: direct_hoist_44,
    DiscriminatedUnion: direct_hoist_53,
    DocumentedPayload: direct_hoist_56,
    DocumentedResult: direct_hoist_59,
    DocumentedSearchInput: direct_hoist_62,
    EntityId: direct_hoist_0,
    GenericWrapper_string: direct_hoist_65,
    GenericWrapper_number: direct_hoist_68,
    HierarchySelection: direct_hoist_71,
    InvalidSchemaWithBigInt: direct_hoist_73,
    InvalidSchemaWithDate: direct_hoist_75,
    JsdocAfterUnrelatedValue: direct_hoist_0,
    JsdocIgnoredCommentObject: direct_hoist_76,
    JsdocMemberOnlyObject: direct_hoist_80,
    JsdocMultilineObject: direct_hoist_83,
    JsdocNestedObject: direct_hoist_86,
    JsdocReferencesDocumentedAlias: direct_hoist_88,
    JsdocReusableToken: direct_hoist_89,
    JsdocSingleLineAlias: direct_hoist_90,
    JsdocUnionVariant: direct_hoist_97,
    NonEmptyString: direct_hoist_98,
    NumberWrapped: direct_hoist_99,
    RecursiveTree: direct_hoist_101,
    ReusesRef: direct_hoist_102,
    SemVer: direct_hoist_103,
    StringWrapped: direct_hoist_104,
    T1: direct_hoist_105,
    T2: direct_hoist_106,
    T3: direct_hoist_108,
    UsesGenericWrapper: direct_hoist_109,
    UsesWrappeds: direct_hoist_111,
    UsesWrappedsComplex: direct_hoist_113,
    UsesWrappedsComplexRef: direct_hoist_115,
    ValidCurrency: direct_hoist_116
});
const buildParsersInput = {
    string: direct_hoist_0,
    number: direct_hoist_1,
    boolean: direct_hoist_2,
    null: direct_hoist_3,
    undefined: direct_hoist_4,
    object: direct_hoist_6,
    anyArray: direct_hoist_7,
    any: direct_hoist_5,
    T1: direct_hoist_8,
    DocumentedPayload: direct_hoist_9,
    DocumentedResult: direct_hoist_10,
    JsdocSingleLineAlias: direct_hoist_11,
    JsdocMultilineObject: direct_hoist_12,
    JsdocMemberOnlyObject: direct_hoist_13,
    JsdocNestedObject: direct_hoist_14,
    JsdocReferencesDocumentedAlias: direct_hoist_15,
    JsdocUnionVariant: direct_hoist_16,
    JsdocIgnoredCommentObject: direct_hoist_17,
    JsdocAfterUnrelatedValue: direct_hoist_18,
    T2: direct_hoist_19,
    T3: direct_hoist_20,
    InvalidSchemaWithDate: direct_hoist_21,
    InvalidSchemaWithBigInt: direct_hoist_22,
    DiscriminatedUnion: direct_hoist_23,
    RecursiveTree: direct_hoist_24,
    SemVer: direct_hoist_25,
    NonEmptyString: direct_hoist_26,
    ValidCurrency: direct_hoist_27,
    DocumentedSearchInput: direct_hoist_28,
    HierarchySelection: direct_hoist_29,
    ReusesRef: direct_hoist_30,
    UsesGenericWrapper: direct_hoist_31,
    StringWrapped: direct_hoist_32,
    NumberWrapped: direct_hoist_33,
    UsesWrappeds: direct_hoist_34,
    UsesWrappedsComplex: direct_hoist_35,
    UsesWrappedsComplexRef: direct_hoist_36
};

export default { buildParsers };