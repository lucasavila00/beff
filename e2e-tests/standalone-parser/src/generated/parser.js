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

const RequiredStringFormats = ["ValidCurrency","UserId","ReadAuthorizedUserId","WriteAuthorizedUserId"];
const RequiredNumberFormats = ["NonNegativeNumber","NonInfiniteNumber","Rate"];
const direct_hoist_0 = reference(registry, "Intersection");
const direct_hoist_1 = reference(registry, "IntersectionPartial");
const direct_hoist_2 = reference(registry, "IntersectionOmitPick");
const direct_hoist_3 = reference(registry, "IntersectionNested");
const direct_hoist_4 = reference(registry, "IntersectionIndex");
const direct_hoist_5 = reference(registry, "IntersectionUnion");
const direct_hoist_6 = reference(registry, "IntersectionTplIndex");
const direct_hoist_7 = reference(registry, "IntersectionTwoTplIndexes");
const direct_hoist_8 = reference(registry, "TplRecord");
const direct_hoist_9 = reference(registry, "ProtoDiscriminated");
const direct_hoist_10 = reference(registry, "ProtoKeyObject");
const direct_hoist_11 = reference(registry, "Repro5");
const direct_hoist_12 = reference(registry, "Repro6");
const direct_hoist_13 = reference(registry, "M1");
const direct_hoist_14 = reference(registry, "S1");
const direct_hoist_15 = reference(registry, "PartialRepro");
const direct_hoist_16 = reference(registry, "TransportedValue");
const direct_hoist_17 = reference(registry, "OnlyAKey");
const direct_hoist_18 = string();
const direct_hoist_19 = array(direct_hoist_18);
const direct_hoist_20 = object({
    a: direct_hoist_19
});
const direct_hoist_21 = bigint();
const direct_hoist_22 = number();
const direct_hoist_23 = tuple([
    direct_hoist_22,
    direct_hoist_22,
    direct_hoist_22
]);
const direct_hoist_24 = tuple([
    direct_hoist_22,
    direct_hoist_22
], direct_hoist_18);
const direct_hoist_25 = reference(registry, "AllTs");
const direct_hoist_26 = reference(registry, "AObject");
const direct_hoist_27 = reference(registry, "Version");
const direct_hoist_28 = reference(registry, "Version2");
const direct_hoist_29 = reference(registry, "PrefixedString");
const direct_hoist_30 = reference(registry, "KeyedNumber");
const direct_hoist_31 = reference(registry, "FlagTpl");
const direct_hoist_32 = reference(registry, "AccessLevelTpl2");
const direct_hoist_33 = reference(registry, "AccessLevelTpl");
const direct_hoist_34 = reference(registry, "Arr3");
const direct_hoist_35 = reference(registry, "OmitSettings");
const direct_hoist_36 = reference(registry, "RequiredPartialObject");
const direct_hoist_37 = reference(registry, "LevelAndDSettings");
const direct_hoist_38 = reference(registry, "PartialSettings");
const direct_hoist_39 = reference(registry, "Extra");
const direct_hoist_40 = reference(registry, "User");
const direct_hoist_41 = reference(registry, "PublicUser");
const direct_hoist_42 = reference(registry, "Req");
const direct_hoist_43 = reference(registry, "Repro1");
const direct_hoist_44 = reference(registry, "SettingsUpdate");
const direct_hoist_45 = reference(registry, "Mapped");
const direct_hoist_46 = reference(registry, "MappedOptional");
const direct_hoist_47 = reference(registry, "PartialObject");
const direct_hoist_48 = reference(registry, "DiscriminatedUnion");
const direct_hoist_49 = reference(registry, "DiscriminatedUnion2");
const direct_hoist_50 = reference(registry, "DiscriminatedUnion3");
const direct_hoist_51 = reference(registry, "DiscriminatedUnion4");
const direct_hoist_52 = reference(registry, "AllTypes");
const direct_hoist_53 = reference(registry, "AccessLevel");
const direct_hoist_54 = reference(registry, "OtherEnum");
const direct_hoist_55 = reference(registry, "Arr2");
const direct_hoist_56 = reference(registry, "ValidCurrency");
const direct_hoist_57 = reference(registry, "UnionWithEnumAccess");
const direct_hoist_58 = reference(registry, "T3");
const direct_hoist_59 = reference(registry, "AvatarSize");
const direct_hoist_60 = reference(registry, "BObject");
const direct_hoist_61 = literal("a");
const direct_hoist_62 = object({
    A: direct_hoist_61
});
const direct_hoist_63 = reference(registry, "KDEF");
const direct_hoist_64 = reference(registry, "KABC");
const direct_hoist_65 = reference(registry, "K");
const direct_hoist_66 = reference(registry, "NonNegativeNumber");
const direct_hoist_67 = reference(registry, "NonInfiniteNumber");
const direct_hoist_68 = reference(registry, "Rate");
const direct_hoist_69 = reference(registry, "UserId");
const direct_hoist_70 = reference(registry, "ReadAuthorizedUserId");
const direct_hoist_71 = reference(registry, "WriteAuthorizedUserId");
const direct_hoist_72 = reference(registry, "CurrencyPrices");
const direct_hoist_73 = reference(registry, "Uint8ArrayType");
const direct_hoist_74 = reference(registry, "Int32ArrayType");
const direct_hoist_75 = reference(registry, "Float64ArrayType");
const direct_hoist_76 = reference(registry, "BigInt64ArrayType");
const direct_hoist_77 = reference(registry, "TsxTask");
const direct_hoist_78 = reference(registry, "Query");
const direct_hoist_79 = reference(registry, "DtsConfig");
const direct_hoist_80 = reference(registry, "DeploymentState");
const direct_hoist_81 = literals([
    "deployed",
    "failed",
    "pending"
]);
const direct_hoist_82 = undefinedType();
const direct_hoist_83 = literals([
    "asc",
    "desc"
]);
const direct_hoist_84 = literals([
    "age",
    "name"
]);
const direct_hoist_85 = object({
    direction: direct_hoist_83,
    field: direct_hoist_84
});
const direct_hoist_86 = union([
    direct_hoist_82,
    direct_hoist_85
]);
const direct_hoist_87 = object({
    orderBy: direct_hoist_86
});
const direct_hoist_88 = object({});
const direct_hoist_89 = object({
    tag: direct_hoist_61
});
const direct_hoist_90 = literals([
    "ADMIN",
    "USER"
]);
const direct_hoist_91 = literals([
    "ADMIN Admin",
    "USER User"
]);
const direct_hoist_92 = regex(/^((ADMIN)|(USER))$/, '`("ADMIN" | "USER")`');
const direct_hoist_93 = regex(/^((ADMIN Admin)|(USER User))$/, '`("ADMIN Admin" | "USER User")`');
const direct_hoist_94 = literals([
    "LevelAndDSettings",
    "OmitSettings",
    "PartialSettings",
    "RequiredPartialObject"
]);
const direct_hoist_95 = regex(/^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(x)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}x${number}`");
const direct_hoist_96 = literal("b");
const direct_hoist_97 = object({
    tag: direct_hoist_96
});
const direct_hoist_98 = typedArray("BigInt64Array");
const direct_hoist_99 = object({
    a: direct_hoist_18
});
const direct_hoist_100 = literal("a1");
const direct_hoist_101 = object({
    a1: direct_hoist_18,
    a11: optional(direct_hoist_18),
    subType: direct_hoist_100,
    type: direct_hoist_61
});
const direct_hoist_102 = literal("a2");
const direct_hoist_103 = object({
    a2: direct_hoist_18,
    subType: direct_hoist_102,
    type: direct_hoist_61
});
const direct_hoist_104 = discriminatedUnion("subType", {
    a1: direct_hoist_101,
    a2: direct_hoist_103
}, [
    direct_hoist_101,
    direct_hoist_103
]);
const direct_hoist_105 = object({
    type: direct_hoist_96,
    value: direct_hoist_22
});
const direct_hoist_106 = discriminatedUnion("type", {
    a: direct_hoist_104,
    b: direct_hoist_105
}, [
    direct_hoist_101,
    direct_hoist_103,
    direct_hoist_105
]);
const direct_hoist_107 = literal("d");
const direct_hoist_108 = object({
    type: optional(direct_hoist_107),
    valueD: direct_hoist_22
});
const direct_hoist_109 = union([
    direct_hoist_101,
    direct_hoist_103,
    direct_hoist_108,
    direct_hoist_105
]);
const direct_hoist_110 = literals([
    "a",
    "c"
]);
const direct_hoist_111 = object({
    a1: direct_hoist_18,
    type: direct_hoist_110
});
const direct_hoist_112 = discriminatedUnion("type", {
    a: direct_hoist_111,
    b: direct_hoist_105,
    c: direct_hoist_111
}, [
    direct_hoist_111,
    direct_hoist_105
]);
const direct_hoist_113 = object({
    a1: direct_hoist_18,
    subType: direct_hoist_100
});
const direct_hoist_114 = object({
    a: direct_hoist_113,
    type: direct_hoist_61
});
const direct_hoist_115 = object({
    a2: direct_hoist_18,
    subType: direct_hoist_102
});
const direct_hoist_116 = object({
    a: direct_hoist_115,
    type: direct_hoist_61
});
const direct_hoist_117 = union([
    direct_hoist_114,
    direct_hoist_116
]);
const direct_hoist_118 = object({}, [
    {
        key: direct_hoist_18,
        value: direct_hoist_18
    }
]);
const direct_hoist_119 = regex(/^(true|false)$/, "`${boolean}`");
const direct_hoist_120 = typedArray("Float64Array");
const direct_hoist_121 = object({
    b: optional(direct_hoist_18)
});
const direct_hoist_122 = object({
    a: direct_hoist_18,
    b: direct_hoist_22,
    c: direct_hoist_18
});
const direct_hoist_123 = object({
    d0: direct_hoist_18,
    e: direct_hoist_22
});
const direct_hoist_124 = boolean();
const direct_hoist_125 = object({
    a: direct_hoist_18,
    b: direct_hoist_22,
    z: direct_hoist_124
});
const direct_hoist_126 = typedArray("Int32Array");
const direct_hoist_127 = reference(registry, "IA");
const direct_hoist_128 = reference(registry, "IB");
const direct_hoist_129 = intersection([
    direct_hoist_127,
    direct_hoist_128
]);
const direct_hoist_130 = union([
    direct_hoist_18,
    direct_hoist_22
]);
const direct_hoist_131 = object({}, [
    {
        key: direct_hoist_18,
        value: direct_hoist_130
    }
]);
const direct_hoist_132 = object({
    n: direct_hoist_22
});
const direct_hoist_133 = intersection([
    direct_hoist_131,
    direct_hoist_132,
    direct_hoist_127
]);
const direct_hoist_134 = object({
    x: direct_hoist_18
});
const direct_hoist_135 = object({
    n: direct_hoist_134
});
const direct_hoist_136 = intersection([
    direct_hoist_135,
    direct_hoist_128
]);
const direct_hoist_137 = intersection([
    direct_hoist_127,
    direct_hoist_136
]);
const direct_hoist_138 = object({
    a: optional(direct_hoist_18),
    b: optional(direct_hoist_22)
});
const direct_hoist_139 = object({
    a: direct_hoist_18,
    b: direct_hoist_22,
    d0: direct_hoist_18,
    e: direct_hoist_22
});
const direct_hoist_140 = intersection([
    direct_hoist_138,
    direct_hoist_139
]);
const direct_hoist_141 = object({
    c: optional(direct_hoist_18)
});
const direct_hoist_142 = intersection([
    direct_hoist_141,
    direct_hoist_127
]);
const direct_hoist_143 = regex(/^(x_)([\s\S]*)$/, "`x_${string}`");
const direct_hoist_144 = object({}, [
    {
        key: direct_hoist_143,
        value: direct_hoist_22
    }
]);
const direct_hoist_145 = intersection([
    direct_hoist_144,
    direct_hoist_127
]);
const direct_hoist_146 = regex(/^(y_)([\s\S]*)$/, "`y_${string}`");
const direct_hoist_147 = object({}, [
    {
        key: direct_hoist_146,
        value: direct_hoist_18
    }
]);
const direct_hoist_148 = intersection([
    direct_hoist_144,
    direct_hoist_147,
    direct_hoist_127
]);
const direct_hoist_149 = literal("u");
const direct_hoist_150 = object({
    kind: direct_hoist_149,
    u: direct_hoist_18
});
const direct_hoist_151 = literal("v");
const direct_hoist_152 = object({
    kind: direct_hoist_151,
    v: optional(direct_hoist_22)
});
const direct_hoist_153 = discriminatedUnion("kind", {
    u: direct_hoist_150,
    v: direct_hoist_152
}, [
    direct_hoist_150,
    direct_hoist_152
]);
const direct_hoist_154 = intersection([
    direct_hoist_127,
    direct_hoist_153
]);
const direct_hoist_155 = literals([
    "a"
]);
const direct_hoist_156 = never();
const direct_hoist_157 = regex(/^((a)|(b))(-)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, '`("a" | "b")-${number}`');
const direct_hoist_158 = object({
    tag: direct_hoist_107
});
const direct_hoist_159 = literals([
    "a",
    "b"
]);
const direct_hoist_160 = object({
    d: direct_hoist_158,
    level: direct_hoist_159
});
const direct_hoist_161 = map(direct_hoist_18, direct_hoist_22);
const direct_hoist_162 = object({
    value: direct_hoist_61
});
const direct_hoist_163 = object({
    value: direct_hoist_96
});
const direct_hoist_164 = object({
    a: direct_hoist_162,
    b: direct_hoist_163
});
const direct_hoist_165 = object({
    a: optional(direct_hoist_162),
    b: optional(direct_hoist_163)
});
const direct_hoist_166 = object({
    A: direct_hoist_18
});
const direct_hoist_167 = object({
    a: optional(direct_hoist_18),
    b: optional(direct_hoist_18)
});
const direct_hoist_168 = object({
    a: optional(direct_hoist_18),
    d: optional(direct_hoist_158),
    level: optional(direct_hoist_159)
});
const direct_hoist_169 = regex(/^(a)([\s\S]*)$/, "`a${string}`");
const direct_hoist_170 = literal("__proto__");
const direct_hoist_171 = object({
    c: direct_hoist_124,
    kind: direct_hoist_170
});
const direct_hoist_172 = literal("constructor");
const direct_hoist_173 = object({
    b: direct_hoist_22,
    kind: direct_hoist_172
});
const direct_hoist_174 = literal("toString");
const direct_hoist_175 = object({
    a: direct_hoist_18,
    kind: direct_hoist_174
});
const direct_hoist_176 = discriminatedUnion("kind", {
    ["__proto__"]: direct_hoist_171,
    constructor: direct_hoist_173,
    toString: direct_hoist_175
}, [
    direct_hoist_175,
    direct_hoist_173,
    direct_hoist_171
]);
const direct_hoist_177 = object({
    ["__proto__"]: direct_hoist_18,
    toString: direct_hoist_22
});
const direct_hoist_178 = object({
    accessLevel: direct_hoist_53,
    avatarSize: direct_hoist_59,
    extra: direct_hoist_39,
    name: direct_hoist_18
});
const direct_hoist_179 = reference(registry, "Repro2");
const direct_hoist_180 = object({
    sizes: optional(direct_hoist_179)
});
const direct_hoist_181 = object({
    useSmallerSizes: direct_hoist_124
});
const direct_hoist_182 = object({}, [
    {
        key: direct_hoist_18,
        value: direct_hoist_22
    }
]);
const direct_hoist_183 = object({
    accountEndpoints: direct_hoist_182
});
const direct_hoist_184 = object({}, [
    {
        key: numberKey(),
        value: direct_hoist_22
    }
]);
const direct_hoist_185 = object({
    accountEndpoints: direct_hoist_184
});
const direct_hoist_186 = object({
    optional: direct_hoist_18
});
const direct_hoist_187 = object({
    a: direct_hoist_18,
    b: direct_hoist_22
});
const direct_hoist_188 = set(direct_hoist_18);
const direct_hoist_189 = object({
    a: direct_hoist_18,
    d: direct_hoist_158,
    level: direct_hoist_159
});
const direct_hoist_190 = union([
    direct_hoist_18,
    direct_hoist_61,
    direct_hoist_96,
    direct_hoist_158
]);
const direct_hoist_191 = literal("circle");
const direct_hoist_192 = object({
    kind: direct_hoist_191,
    radius: direct_hoist_22
});
const direct_hoist_193 = literal("square");
const direct_hoist_194 = object({
    kind: direct_hoist_193,
    x: direct_hoist_22
});
const direct_hoist_195 = literal("triangle");
const direct_hoist_196 = object({
    kind: direct_hoist_195,
    x: direct_hoist_22,
    y: direct_hoist_22
});
const direct_hoist_197 = discriminatedUnion("kind", {
    circle: direct_hoist_192,
    square: direct_hoist_194,
    triangle: direct_hoist_196
}, [
    direct_hoist_192,
    direct_hoist_194,
    direct_hoist_196
]);
const direct_hoist_198 = discriminatedUnion("kind", {
    square: direct_hoist_194,
    triangle: direct_hoist_196
}, [
    direct_hoist_194,
    direct_hoist_196
]);
const direct_hoist_199 = nullType();
const direct_hoist_200 = union([
    direct_hoist_199,
    direct_hoist_82,
    direct_hoist_18,
    direct_hoist_22
]);
const direct_hoist_201 = array(direct_hoist_200);
const direct_hoist_202 = union([
    direct_hoist_199,
    direct_hoist_82,
    direct_hoist_18,
    direct_hoist_201
]);
const direct_hoist_203 = typedArray("Uint8Array");
const direct_hoist_204 = reference(registry, "OtherEnum__A");
const direct_hoist_205 = object({
    tag: direct_hoist_204,
    value: direct_hoist_18
});
const direct_hoist_206 = reference(registry, "OtherEnum__B");
const direct_hoist_207 = object({
    tag: direct_hoist_206,
    value: direct_hoist_22
});
const direct_hoist_208 = reference(registry, "OtherEnum2__C");
const direct_hoist_209 = object({
    tag: direct_hoist_208,
    value: direct_hoist_124
});
const direct_hoist_210 = discriminatedUnion("tag", {
    a: direct_hoist_205,
    b: direct_hoist_207,
    c: direct_hoist_209
}, [
    direct_hoist_209,
    direct_hoist_205,
    direct_hoist_207
]);
const direct_hoist_211 = array(direct_hoist_40);
const direct_hoist_212 = object({
    accessLevel: direct_hoist_53,
    avatarSize: direct_hoist_59,
    extra: direct_hoist_39,
    friends: direct_hoist_211,
    name: direct_hoist_18
});
const direct_hoist_213 = regex(/^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}.${number}.${number}`");
const direct_hoist_214 = regex(/^(v)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`v${number}.${number}.${number}`");
const direct_hoist_215 = object({
    optional: optional(direct_hoist_18)
});
const direct_hoist_216 = reference(registry, "DtsStatus");
const direct_hoist_217 = object({
    enabled: direct_hoist_124,
    status: direct_hoist_216
});
const direct_hoist_218 = literals([
    "off",
    "on"
]);
const direct_hoist_219 = literals([
    "active",
    "closed",
    "pending"
]);
const direct_hoist_220 = reference(registry, "TsxLabel");
const direct_hoist_221 = object({
    id: direct_hoist_18,
    label: direct_hoist_220
});
const direct_hoist_222 = literals([
    "A",
    "B",
    "C"
]);
const direct_hoist_223 = literals([
    "X",
    "Y"
]);
const direct_hoist_224 = stringWithFormat([
    "ValidCurrency"
]);
const direct_hoist_225 = object({}, [
    {
        key: direct_hoist_224,
        value: direct_hoist_68
    }
]);
const direct_hoist_226 = numberWithFormat([
    "NonInfiniteNumber"
]);
const direct_hoist_227 = numberWithFormat([
    "NonInfiniteNumber",
    "NonNegativeNumber"
]);
const direct_hoist_228 = numberWithFormat([
    "NonInfiniteNumber",
    "NonNegativeNumber",
    "Rate"
]);
const direct_hoist_229 = stringWithFormat([
    "UserId",
    "ReadAuthorizedUserId"
]);
const direct_hoist_230 = stringWithFormat([
    "UserId"
]);
const direct_hoist_231 = stringWithFormat([
    "UserId",
    "ReadAuthorizedUserId",
    "WriteAuthorizedUserId"
]);
const direct_hoist_232 = literal("c");
define(registry, {
    DeploymentState: direct_hoist_81,
    Query: direct_hoist_87,
    ABC: direct_hoist_88,
    AObject: direct_hoist_89,
    AccessLevel: direct_hoist_90,
    AccessLevel2: direct_hoist_91,
    AccessLevelTpl: direct_hoist_92,
    AccessLevelTpl2: direct_hoist_93,
    AllTypes: direct_hoist_94,
    AvatarSize: direct_hoist_95,
    BObject: direct_hoist_97,
    BigInt64ArrayType: direct_hoist_98,
    DEF: direct_hoist_99,
    DiscriminatedUnion: direct_hoist_106,
    DiscriminatedUnion2: direct_hoist_109,
    DiscriminatedUnion3: direct_hoist_112,
    DiscriminatedUnion4: direct_hoist_117,
    Extra: direct_hoist_118,
    FlagTpl: direct_hoist_119,
    Float64ArrayType: direct_hoist_120,
    IA: direct_hoist_99,
    IB: direct_hoist_121,
    IBase: direct_hoist_122,
    IExtra: direct_hoist_123,
    IOther: direct_hoist_125,
    Int32ArrayType: direct_hoist_126,
    Intersection: direct_hoist_129,
    IntersectionIndex: direct_hoist_133,
    IntersectionNested: direct_hoist_137,
    IntersectionOmitPick: direct_hoist_140,
    IntersectionPartial: direct_hoist_142,
    IntersectionTplIndex: direct_hoist_145,
    IntersectionTwoTplIndexes: direct_hoist_148,
    IntersectionUnion: direct_hoist_154,
    K: direct_hoist_155,
    KABC: direct_hoist_156,
    KDEF: direct_hoist_61,
    KeyedNumber: direct_hoist_157,
    LevelAndDSettings: direct_hoist_160,
    M1: direct_hoist_161,
    Mapped: direct_hoist_164,
    MappedOptional: direct_hoist_165,
    OmitSettings: direct_hoist_160,
    OnlyAKey: direct_hoist_166,
    PartialObject: direct_hoist_138,
    PartialRepro: direct_hoist_167,
    PartialSettings: direct_hoist_168,
    PrefixedString: direct_hoist_169,
    ProtoDiscriminated: direct_hoist_176,
    ProtoKeyObject: direct_hoist_177,
    PublicUser: direct_hoist_178,
    Repro1: direct_hoist_180,
    Repro2: direct_hoist_181,
    Repro5: direct_hoist_183,
    Repro6: direct_hoist_185,
    Req: direct_hoist_186,
    RequiredPartialObject: direct_hoist_187,
    S1: direct_hoist_188,
    Settings: direct_hoist_189,
    SettingsUpdate: direct_hoist_190,
    Shape: direct_hoist_197,
    T3: direct_hoist_198,
    TplRecord: direct_hoist_144,
    TransportedValue: direct_hoist_202,
    Uint8ArrayType: direct_hoist_203,
    UnionWithEnumAccess: direct_hoist_210,
    User: direct_hoist_212,
    Version: direct_hoist_213,
    Version2: direct_hoist_214,
    WithOptionals: direct_hoist_215,
    DtsConfig: direct_hoist_217,
    DtsStatus: direct_hoist_218,
    TsxLabel: direct_hoist_219,
    TsxTask: direct_hoist_221,
    Arr2: direct_hoist_222,
    OtherEnum: direct_hoist_159,
    Arr3: direct_hoist_223,
    CurrencyPrices: direct_hoist_225,
    NonInfiniteNumber: direct_hoist_226,
    NonNegativeNumber: direct_hoist_227,
    Rate: direct_hoist_228,
    ReadAuthorizedUserId: direct_hoist_229,
    UserId: direct_hoist_230,
    ValidCurrency: direct_hoist_224,
    WriteAuthorizedUserId: direct_hoist_231,
    AllTs: direct_hoist_159,
    OtherEnum__A: direct_hoist_61,
    OtherEnum__B: direct_hoist_96,
    OtherEnum2__C: direct_hoist_232
});
const buildParsersInput = {
    Intersection: direct_hoist_0,
    IntersectionPartial: direct_hoist_1,
    IntersectionOmitPick: direct_hoist_2,
    IntersectionNested: direct_hoist_3,
    IntersectionIndex: direct_hoist_4,
    IntersectionUnion: direct_hoist_5,
    IntersectionTplIndex: direct_hoist_6,
    IntersectionTwoTplIndexes: direct_hoist_7,
    TplRecord: direct_hoist_8,
    ProtoDiscriminated: direct_hoist_9,
    ProtoKeyObject: direct_hoist_10,
    Repro5: direct_hoist_11,
    Repro6: direct_hoist_12,
    M1: direct_hoist_13,
    S1: direct_hoist_14,
    PartialRepro: direct_hoist_15,
    TransportedValue: direct_hoist_16,
    OnlyAKey: direct_hoist_17,
    ObjectWithArr: direct_hoist_20,
    BigIntCodec: direct_hoist_21,
    TupleCodec: direct_hoist_23,
    TupleCodecRest: direct_hoist_24,
    StringArrCodec: direct_hoist_19,
    AllTs: direct_hoist_25,
    AObject: direct_hoist_26,
    Version: direct_hoist_27,
    Version2: direct_hoist_28,
    PrefixedString: direct_hoist_29,
    KeyedNumber: direct_hoist_30,
    FlagTpl: direct_hoist_31,
    AccessLevelTpl2: direct_hoist_32,
    AccessLevelTpl: direct_hoist_33,
    Arr3: direct_hoist_34,
    OmitSettings: direct_hoist_35,
    RequiredPartialObject: direct_hoist_36,
    LevelAndDSettings: direct_hoist_37,
    PartialSettings: direct_hoist_38,
    Extra: direct_hoist_39,
    User: direct_hoist_40,
    PublicUser: direct_hoist_41,
    Req: direct_hoist_42,
    Repro1: direct_hoist_43,
    SettingsUpdate: direct_hoist_44,
    Mapped: direct_hoist_45,
    MappedOptional: direct_hoist_46,
    PartialObject: direct_hoist_47,
    DiscriminatedUnion: direct_hoist_48,
    DiscriminatedUnion2: direct_hoist_49,
    DiscriminatedUnion3: direct_hoist_50,
    DiscriminatedUnion4: direct_hoist_51,
    AllTypes: direct_hoist_52,
    AccessLevel: direct_hoist_53,
    OtherEnum: direct_hoist_54,
    Arr2C: direct_hoist_55,
    ValidCurrency: direct_hoist_56,
    UnionWithEnumAccess: direct_hoist_57,
    T3: direct_hoist_58,
    AccessLevelCodec: direct_hoist_53,
    AvatarSize: direct_hoist_59,
    BObject: direct_hoist_60,
    ImportEnumTypeof: direct_hoist_62,
    KDEF: direct_hoist_63,
    KABC: direct_hoist_64,
    K: direct_hoist_65,
    NonNegativeNumber: direct_hoist_66,
    NonInfiniteNumber: direct_hoist_67,
    Rate: direct_hoist_68,
    UserId: direct_hoist_69,
    ReadAuthorizedUserId: direct_hoist_70,
    WriteAuthorizedUserId: direct_hoist_71,
    CurrencyPrices: direct_hoist_72,
    Uint8ArrayCodec: direct_hoist_73,
    Int32ArrayCodec: direct_hoist_74,
    Float64ArrayCodec: direct_hoist_75,
    BigInt64ArrayCodec: direct_hoist_76,
    TsxTask: direct_hoist_77,
    Query: direct_hoist_78,
    DtsConfig: direct_hoist_79,
    DeploymentState: direct_hoist_80
};

export default { buildParsers };