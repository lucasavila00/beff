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

const RequiredStringFormats = ["UserId","AdminId"];
const RequiredNumberFormats = ["NonNegative","Rate"];
const direct_hoist_0 = string();
const direct_hoist_1 = number();
const direct_hoist_2 = boolean();
const direct_hoist_3 = nullType();
const direct_hoist_4 = undefinedType();
const direct_hoist_5 = voidType();
const direct_hoist_6 = any();
const direct_hoist_7 = bigint();
const direct_hoist_8 = date();
const direct_hoist_9 = literal("hello");
const direct_hoist_10 = literal(42);
const direct_hoist_11 = literal(true);
const direct_hoist_12 = literals([
    "a",
    "b",
    "c"
]);
const direct_hoist_13 = literal("a");
const direct_hoist_14 = literal(1);
const direct_hoist_15 = union([
    direct_hoist_3,
    direct_hoist_13,
    direct_hoist_11,
    direct_hoist_14
]);
const direct_hoist_16 = literals([
    "__proto__",
    "constructor",
    "toString"
]);
const direct_hoist_17 = reference(registry, "Color");
const direct_hoist_18 = reference(registry, "Color__Red");
const direct_hoist_19 = array(direct_hoist_0);
const direct_hoist_20 = array(direct_hoist_1);
const direct_hoist_21 = array(direct_hoist_20);
const direct_hoist_22 = tuple([
    direct_hoist_0,
    direct_hoist_1
]);
const direct_hoist_23 = tuple([
    direct_hoist_0
], direct_hoist_1);
const direct_hoist_24 = tuple([
    direct_hoist_2,
    direct_hoist_0
]);
const direct_hoist_25 = object({});
const direct_hoist_26 = reference(registry, "Nested");
const direct_hoist_27 = reference(registry, "ManyFields");
const direct_hoist_28 = reference(registry, "Optionals");
const direct_hoist_29 = object({
    ["__proto__"]: direct_hoist_0,
    toString: direct_hoist_1
});
const direct_hoist_30 = object({}, [
    {
        key: direct_hoist_0,
        value: direct_hoist_1
    }
]);
const direct_hoist_31 = object({}, [
    {
        key: numberKey(),
        value: direct_hoist_0
    }
]);
const direct_hoist_32 = reference(registry, "NumberKeyedObj");
const direct_hoist_33 = object({
    x: direct_hoist_1,
    y: direct_hoist_1
});
const direct_hoist_34 = object({
    "1": direct_hoist_0,
    "2": direct_hoist_0
});
const direct_hoist_35 = object({
    x: optional(direct_hoist_1),
    y: optional(direct_hoist_1)
});
const direct_hoist_36 = regex(/^(x_)([\s\S]*)$/, "`x_${string}`");
const direct_hoist_37 = object({}, [
    {
        key: direct_hoist_36,
        value: direct_hoist_1
    }
]);
const direct_hoist_38 = reference(registry, "TplIndexWithProps");
const direct_hoist_39 = regex(/^(beta_)([\s\S]*)$/, "`beta_${string}`");
const direct_hoist_40 = object({
    alpha: optional(direct_hoist_0)
}, [
    {
        key: direct_hoist_39,
        value: optional(direct_hoist_0)
    }
]);
const direct_hoist_41 = object({
    value: direct_hoist_13
});
const direct_hoist_42 = literal("b");
const direct_hoist_43 = object({
    value: direct_hoist_42
});
const direct_hoist_44 = object({
    a: direct_hoist_41,
    b: direct_hoist_43
});
const direct_hoist_45 = union([
    direct_hoist_0,
    direct_hoist_1
]);
const direct_hoist_46 = reference(registry, "ObjA");
const direct_hoist_47 = reference(registry, "ObjB");
const direct_hoist_48 = union([
    direct_hoist_46,
    direct_hoist_47
]);
const direct_hoist_49 = union([
    direct_hoist_3,
    direct_hoist_0,
    direct_hoist_20,
    direct_hoist_46
]);
const direct_hoist_50 = reference(registry, "Shape");
const direct_hoist_51 = reference(registry, "NestedDiscriminated");
const direct_hoist_52 = reference(registry, "ProtoDiscriminated");
const direct_hoist_53 = reference(registry, "MultiValueDiscriminated");
const direct_hoist_54 = reference(registry, "OptionalDiscriminated");
const direct_hoist_55 = map(direct_hoist_0, direct_hoist_1);
const direct_hoist_56 = set(direct_hoist_0);
const direct_hoist_57 = union([
    direct_hoist_3,
    direct_hoist_55,
    direct_hoist_56
]);
const direct_hoist_58 = reference(registry, "IA");
const direct_hoist_59 = reference(registry, "IB");
const direct_hoist_60 = intersection([
    direct_hoist_58,
    direct_hoist_59
]);
const direct_hoist_61 = object({
    x: direct_hoist_0
});
const direct_hoist_62 = object({
    n: direct_hoist_61
});
const direct_hoist_63 = intersection([
    direct_hoist_62,
    direct_hoist_59
]);
const direct_hoist_64 = intersection([
    direct_hoist_58,
    direct_hoist_63
]);
const direct_hoist_65 = object({}, [
    {
        key: direct_hoist_0,
        value: direct_hoist_45
    }
]);
const direct_hoist_66 = object({
    n: direct_hoist_1
});
const direct_hoist_67 = intersection([
    direct_hoist_65,
    direct_hoist_66,
    direct_hoist_58
]);
const direct_hoist_68 = intersection([
    direct_hoist_37,
    direct_hoist_58
]);
const direct_hoist_69 = reference(registry, "IntersectionUnion");
const direct_hoist_70 = object({
    a: direct_hoist_0,
    c: optional(direct_hoist_2)
});
const direct_hoist_71 = object({
    a: optional(direct_hoist_0),
    b: optional(direct_hoist_1),
    c: optional(direct_hoist_2)
});
const direct_hoist_72 = object({
    a: direct_hoist_0,
    b: direct_hoist_1,
    c: direct_hoist_2
});
const direct_hoist_73 = literal("rect");
const direct_hoist_74 = object({
    h: direct_hoist_1,
    kind: direct_hoist_73,
    w: direct_hoist_1
});
const direct_hoist_75 = literal("square");
const direct_hoist_76 = object({
    kind: direct_hoist_75,
    size: direct_hoist_1
});
const direct_hoist_77 = discriminatedUnion("kind", {
    rect: direct_hoist_74,
    square: direct_hoist_76
}, [
    direct_hoist_74,
    direct_hoist_76
]);
const direct_hoist_78 = literals([
    "a",
    "c"
]);
const direct_hoist_79 = reference(registry, "ShapeKind");
const direct_hoist_80 = reference(registry, "Box_string");
const direct_hoist_81 = reference(registry, "Box_Box__number__");
const direct_hoist_82 = reference(registry, "Pair_number");
const direct_hoist_83 = reference(registry, "Pair_instance_3");
const direct_hoist_84 = reference(registry, "ListOf_number");
const direct_hoist_85 = reference(registry, "WithDefault_boolean");
const direct_hoist_86 = reference(registry, "GenericRecursive_string");
const direct_hoist_87 = reference(registry, "LinkedList");
const direct_hoist_88 = reference(registry, "Tree");
const direct_hoist_89 = reference(registry, "Json");
const direct_hoist_90 = reference(registry, "Expr");
const direct_hoist_91 = reference(registry, "MutualA");
const direct_hoist_92 = reference(registry, "RecursiveFirst");
const direct_hoist_93 = reference(registry, "RecursiveMiddle");
const direct_hoist_94 = reference(registry, "RecursiveLast");
const direct_hoist_95 = reference(registry, "RecursiveInTuple");
const direct_hoist_96 = regex(/^(a)([\s\S]*)$/, "`a${string}`");
const direct_hoist_97 = regex(/^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}`");
const direct_hoist_98 = regex(/^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}.${number}.${number}`");
const direct_hoist_99 = regex(/^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(x)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}x${number}`");
const direct_hoist_100 = regex(/^((a)|(b))(-)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, '`("a" | "b")-${number}`');
const direct_hoist_101 = regex(/^(true|false)$/, "`${boolean}`");
const direct_hoist_102 = regex(/^([\s\S]*)$/, "`${string}`");
const direct_hoist_103 = regex(/^((green)|(red))$/, '`("green" | "red")`');
const direct_hoist_104 = reference(registry, "UserId");
const direct_hoist_105 = reference(registry, "AdminId");
const direct_hoist_106 = reference(registry, "NonNegative");
const direct_hoist_107 = reference(registry, "Rate");
const direct_hoist_108 = object({
    id: direct_hoist_104,
    rate: direct_hoist_107
});
const direct_hoist_109 = map(direct_hoist_0, direct_hoist_8);
const direct_hoist_110 = object({
    m: direct_hoist_109
});
const direct_hoist_111 = typedArray("Uint8Array");
const direct_hoist_112 = typedArray("Int32Array");
const direct_hoist_113 = typedArray("Float64Array");
const direct_hoist_114 = typedArray("BigInt64Array");
const direct_hoist_115 = object({
    at: direct_hoist_8,
    big: direct_hoist_7
});
const direct_hoist_116 = stringWithFormat([
    "UserId",
    "AdminId"
]);
const direct_hoist_117 = object({
    a: direct_hoist_0,
    b: direct_hoist_1,
    c: optional(direct_hoist_2)
});
const direct_hoist_118 = object({
    value: direct_hoist_0
});
const direct_hoist_119 = object({
    value: direct_hoist_1
});
const direct_hoist_120 = reference(registry, "Box_number");
const direct_hoist_121 = object({
    value: direct_hoist_120
});
const direct_hoist_122 = literals([
    "green",
    "red"
]);
const direct_hoist_123 = literal("add");
const direct_hoist_124 = object({
    left: direct_hoist_90,
    op: direct_hoist_123,
    right: direct_hoist_90
});
const direct_hoist_125 = literal("neg");
const direct_hoist_126 = object({
    arg: direct_hoist_90,
    op: direct_hoist_125
});
const direct_hoist_127 = literal("num");
const direct_hoist_128 = object({
    op: direct_hoist_127,
    value: direct_hoist_1
});
const direct_hoist_129 = discriminatedUnion("op", {
    add: direct_hoist_124,
    neg: direct_hoist_126,
    num: direct_hoist_128
}, [
    direct_hoist_126,
    direct_hoist_124,
    direct_hoist_128
]);
const direct_hoist_130 = array(direct_hoist_86);
const direct_hoist_131 = object({
    children: direct_hoist_130,
    value: direct_hoist_0
});
const direct_hoist_132 = object({
    a: direct_hoist_0
});
const direct_hoist_133 = object({
    b: optional(direct_hoist_1)
});
const direct_hoist_134 = literal("u");
const direct_hoist_135 = object({
    kind: direct_hoist_134,
    u: direct_hoist_0
});
const direct_hoist_136 = literal("v");
const direct_hoist_137 = object({
    kind: direct_hoist_136,
    v: optional(direct_hoist_1)
});
const direct_hoist_138 = discriminatedUnion("kind", {
    u: direct_hoist_135,
    v: direct_hoist_137
}, [
    direct_hoist_135,
    direct_hoist_137
]);
const direct_hoist_139 = intersection([
    direct_hoist_58,
    direct_hoist_138
]);
const direct_hoist_140 = object({}, [
    {
        key: direct_hoist_0,
        value: direct_hoist_89
    }
]);
const direct_hoist_141 = array(direct_hoist_89);
const direct_hoist_142 = union([
    direct_hoist_3,
    direct_hoist_2,
    direct_hoist_0,
    direct_hoist_1,
    direct_hoist_140,
    direct_hoist_141
]);
const direct_hoist_143 = union([
    direct_hoist_3,
    direct_hoist_87
]);
const direct_hoist_144 = object({
    next: direct_hoist_143,
    value: direct_hoist_1
});
const direct_hoist_145 = object({
    item: direct_hoist_1,
    items: direct_hoist_20
});
const direct_hoist_146 = object({
    f01: direct_hoist_0,
    f02: direct_hoist_1,
    f03: direct_hoist_2,
    f04: direct_hoist_0,
    f05: direct_hoist_1,
    f06: direct_hoist_2,
    f07: direct_hoist_0,
    f08: direct_hoist_1,
    f09: direct_hoist_2,
    f10: direct_hoist_0,
    f11: direct_hoist_1,
    f12: direct_hoist_2,
    f13: direct_hoist_0,
    f14: direct_hoist_1,
    f15: direct_hoist_2,
    f16: direct_hoist_0,
    f17: direct_hoist_1,
    f18: direct_hoist_2,
    f19: direct_hoist_0,
    f20: direct_hoist_1
});
const direct_hoist_147 = literal("alpha");
const direct_hoist_148 = union([
    direct_hoist_147,
    direct_hoist_39
]);
const direct_hoist_149 = object({
    a: direct_hoist_0,
    type: direct_hoist_78
});
const direct_hoist_150 = object({
    b: direct_hoist_1,
    type: direct_hoist_42
});
const direct_hoist_151 = discriminatedUnion("type", {
    a: direct_hoist_149,
    b: direct_hoist_150,
    c: direct_hoist_149
}, [
    direct_hoist_149,
    direct_hoist_150
]);
const direct_hoist_152 = reference(registry, "MutualB");
const direct_hoist_153 = object({
    b: optional(direct_hoist_152),
    tag: direct_hoist_13
});
const direct_hoist_154 = object({
    a: optional(direct_hoist_91),
    tag: direct_hoist_42
});
const direct_hoist_155 = object({
    deep: direct_hoist_119
});
const direct_hoist_156 = object({
    id: direct_hoist_0
});
const direct_hoist_157 = array(direct_hoist_156);
const direct_hoist_158 = object({
    inner: direct_hoist_155,
    list: direct_hoist_157
});
const direct_hoist_159 = literal("a1");
const direct_hoist_160 = object({
    a1: direct_hoist_0,
    subType: direct_hoist_159,
    type: direct_hoist_13
});
const direct_hoist_161 = literal("a2");
const direct_hoist_162 = object({
    a2: direct_hoist_0,
    subType: direct_hoist_161,
    type: direct_hoist_13
});
const direct_hoist_163 = discriminatedUnion("subType", {
    a1: direct_hoist_160,
    a2: direct_hoist_162
}, [
    direct_hoist_160,
    direct_hoist_162
]);
const direct_hoist_164 = object({
    type: direct_hoist_42,
    value: direct_hoist_1
});
const direct_hoist_165 = discriminatedUnion("type", {
    a: direct_hoist_163,
    b: direct_hoist_164
}, [
    direct_hoist_160,
    direct_hoist_162,
    direct_hoist_164
]);
const direct_hoist_166 = numberWithFormat([
    "NonNegative"
]);
const direct_hoist_167 = object({}, [
    {
        key: numberKey(),
        value: direct_hoist_2
    }
]);
const direct_hoist_168 = object({
    b: direct_hoist_1
});
const direct_hoist_169 = object({
    a: direct_hoist_0,
    type: direct_hoist_13
});
const direct_hoist_170 = literal("d");
const direct_hoist_171 = object({
    d: direct_hoist_1,
    type: optional(direct_hoist_170)
});
const direct_hoist_172 = union([
    direct_hoist_169,
    direct_hoist_171
]);
const direct_hoist_173 = union([
    direct_hoist_3,
    direct_hoist_0
]);
const direct_hoist_174 = union([
    direct_hoist_4,
    direct_hoist_0
]);
const direct_hoist_175 = union([
    direct_hoist_5,
    direct_hoist_0
]);
const direct_hoist_176 = object({
    nul: direct_hoist_173,
    opt: optional(direct_hoist_0),
    req: direct_hoist_0,
    undef: direct_hoist_174,
    voided: direct_hoist_175
});
const direct_hoist_177 = object({
    first: direct_hoist_1,
    second: direct_hoist_0
});
const direct_hoist_178 = object({
    first: direct_hoist_1,
    second: direct_hoist_2
});
const direct_hoist_179 = literal("__proto__");
const direct_hoist_180 = object({
    c: direct_hoist_2,
    kind: direct_hoist_179
});
const direct_hoist_181 = literal("constructor");
const direct_hoist_182 = object({
    b: direct_hoist_1,
    kind: direct_hoist_181
});
const direct_hoist_183 = literal("toString");
const direct_hoist_184 = object({
    a: direct_hoist_0,
    kind: direct_hoist_183
});
const direct_hoist_185 = discriminatedUnion("kind", {
    ["__proto__"]: direct_hoist_180,
    constructor: direct_hoist_182,
    toString: direct_hoist_184
}, [
    direct_hoist_184,
    direct_hoist_182,
    direct_hoist_180
]);
const direct_hoist_186 = numberWithFormat([
    "NonNegative",
    "Rate"
]);
const direct_hoist_187 = array(direct_hoist_92);
const direct_hoist_188 = union([
    direct_hoist_0,
    direct_hoist_187
]);
const direct_hoist_189 = union([
    direct_hoist_3,
    direct_hoist_95
]);
const direct_hoist_190 = tuple([
    direct_hoist_1,
    direct_hoist_189
]);
const direct_hoist_191 = array(direct_hoist_94);
const direct_hoist_192 = union([
    direct_hoist_0,
    direct_hoist_1,
    direct_hoist_191
]);
const direct_hoist_193 = object({
    child: direct_hoist_93
});
const direct_hoist_194 = union([
    direct_hoist_3,
    direct_hoist_1,
    direct_hoist_193
]);
const direct_hoist_195 = literal("circle");
const direct_hoist_196 = object({
    kind: direct_hoist_195,
    radius: direct_hoist_1
});
const direct_hoist_197 = discriminatedUnion("kind", {
    circle: direct_hoist_196,
    rect: direct_hoist_74,
    square: direct_hoist_76
}, [
    direct_hoist_74,
    direct_hoist_196,
    direct_hoist_76
]);
const direct_hoist_198 = literals([
    "circle",
    "rect",
    "square"
]);
const direct_hoist_199 = object({
    a: direct_hoist_1
}, [
    {
        key: direct_hoist_36,
        value: direct_hoist_1
    }
]);
const direct_hoist_200 = array(direct_hoist_88);
const direct_hoist_201 = object({
    children: direct_hoist_200,
    name: direct_hoist_0
});
const direct_hoist_202 = stringWithFormat([
    "UserId"
]);
const direct_hoist_203 = array(direct_hoist_2);
const direct_hoist_204 = object({
    a: direct_hoist_2,
    b: direct_hoist_203
});
const direct_hoist_205 = literal("red");
define(registry, {
    AdminId: direct_hoist_116,
    Base: direct_hoist_117,
    Box_string: direct_hoist_118,
    Box_number: direct_hoist_119,
    Box_Box__number__: direct_hoist_121,
    Color: direct_hoist_122,
    Expr: direct_hoist_129,
    GenericRecursive_string: direct_hoist_131,
    IA: direct_hoist_132,
    IB: direct_hoist_133,
    IntersectionUnion: direct_hoist_139,
    Json: direct_hoist_142,
    LinkedList: direct_hoist_144,
    ListOf_number: direct_hoist_145,
    ManyFields: direct_hoist_146,
    MetaKey: direct_hoist_148,
    MultiValueDiscriminated: direct_hoist_151,
    MutualA: direct_hoist_153,
    MutualB: direct_hoist_154,
    Nested: direct_hoist_158,
    NestedDiscriminated: direct_hoist_165,
    NonNegative: direct_hoist_166,
    NumberKeyedObj: direct_hoist_167,
    ObjA: direct_hoist_132,
    ObjB: direct_hoist_168,
    OptionalDiscriminated: direct_hoist_172,
    Optionals: direct_hoist_176,
    Pair_number: direct_hoist_177,
    Pair_instance_3: direct_hoist_178,
    ProtoDiscriminated: direct_hoist_185,
    Rate: direct_hoist_186,
    RecursiveFirst: direct_hoist_188,
    RecursiveInTuple: direct_hoist_190,
    RecursiveLast: direct_hoist_192,
    RecursiveMiddle: direct_hoist_194,
    Shape: direct_hoist_197,
    ShapeKind: direct_hoist_198,
    TplIndexWithProps: direct_hoist_199,
    Tree: direct_hoist_201,
    UserId: direct_hoist_202,
    WithDefault_boolean: direct_hoist_204,
    Color__Red: direct_hoist_205
});
const buildParsersInput = {
    String: direct_hoist_0,
    Number: direct_hoist_1,
    Boolean: direct_hoist_2,
    Null: direct_hoist_3,
    Undefined: direct_hoist_4,
    Void: direct_hoist_5,
    Any: direct_hoist_6,
    Unknown: direct_hoist_6,
    BigInt: direct_hoist_7,
    DateT: direct_hoist_8,
    LitString: direct_hoist_9,
    LitNumber: direct_hoist_10,
    LitTrue: direct_hoist_11,
    LitUnion: direct_hoist_12,
    LitMixedUnion: direct_hoist_15,
    ProtoLitUnion: direct_hoist_16,
    Enum: direct_hoist_17,
    EnumMember: direct_hoist_18,
    StringArray: direct_hoist_19,
    ReadonlyNumberArray: direct_hoist_20,
    NestedArray: direct_hoist_21,
    Tuple: direct_hoist_22,
    TupleRest: direct_hoist_23,
    ReadonlyTuple: direct_hoist_24,
    Empty: direct_hoist_25,
    Nested: direct_hoist_26,
    ManyFields: direct_hoist_27,
    Optionals: direct_hoist_28,
    ProtoKeyObject: direct_hoist_29,
    StringRecord: direct_hoist_30,
    NumberRecord: direct_hoist_31,
    NumberKeyedObj: direct_hoist_32,
    LiteralKeyRecord: direct_hoist_33,
    NumberLiteralKeyRecord: direct_hoist_34,
    PartialRecord: direct_hoist_35,
    TplRecord: direct_hoist_37,
    TplIndexWithProps: direct_hoist_38,
    MetaRecord: direct_hoist_40,
    MappedType: direct_hoist_44,
    PrimitiveUnion: direct_hoist_45,
    ObjectUnion: direct_hoist_48,
    MixedUnion: direct_hoist_49,
    Shape: direct_hoist_50,
    NestedDiscriminated: direct_hoist_51,
    ProtoDiscriminated: direct_hoist_52,
    MultiValueDiscriminated: direct_hoist_53,
    OptionalDiscriminated: direct_hoist_54,
    MapOrSetUnion: direct_hoist_57,
    Intersection: direct_hoist_60,
    IntersectionNested: direct_hoist_64,
    IntersectionIndex: direct_hoist_67,
    IntersectionTplIndex: direct_hoist_68,
    IntersectionUnion: direct_hoist_69,
    OmitT: direct_hoist_70,
    PickT: direct_hoist_70,
    PartialT: direct_hoist_71,
    RequiredT: direct_hoist_72,
    ExcludeT: direct_hoist_77,
    ExcludeLit: direct_hoist_78,
    KeyofT: direct_hoist_12,
    IndexedAccess: direct_hoist_79,
    BoxString: direct_hoist_80,
    BoxBox: direct_hoist_81,
    PairDefault: direct_hoist_82,
    PairExplicit: direct_hoist_83,
    ListOfDefault: direct_hoist_84,
    WithDefault: direct_hoist_85,
    GenericRecursive: direct_hoist_86,
    LinkedList: direct_hoist_87,
    Tree: direct_hoist_88,
    Json: direct_hoist_89,
    Expr: direct_hoist_90,
    MutualA: direct_hoist_91,
    RecursiveFirst: direct_hoist_92,
    RecursiveMiddle: direct_hoist_93,
    RecursiveLast: direct_hoist_94,
    RecursiveInTuple: direct_hoist_95,
    TplPrefix: direct_hoist_96,
    TplNumber: direct_hoist_97,
    TplVersion: direct_hoist_98,
    TplSize: direct_hoist_99,
    TplLitUnion: direct_hoist_100,
    TplBoolean: direct_hoist_101,
    TplString: direct_hoist_102,
    TplEnum: direct_hoist_103,
    UserId: direct_hoist_104,
    AdminId: direct_hoist_105,
    NonNegative: direct_hoist_106,
    Rate: direct_hoist_107,
    FormatsInObject: direct_hoist_108,
    MapT: direct_hoist_55,
    SetT: direct_hoist_56,
    MapInObject: direct_hoist_110,
    Uint8ArrayT: direct_hoist_111,
    Int32ArrayT: direct_hoist_112,
    Float64ArrayT: direct_hoist_113,
    BigInt64ArrayT: direct_hoist_114,
    DateInObject: direct_hoist_115
};

export default { buildParsers };