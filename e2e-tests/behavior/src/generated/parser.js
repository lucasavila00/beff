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
  TypedArrayRuntype,
  MapRuntype,
  SetRuntype,
  NumberKeyRuntype,
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

const RequiredStringFormats = ["UserId","AdminId"];
const RequiredNumberFormats = ["NonNegative","Rate"];
const direct_hoist_0 = new TypeofRuntype(undefined, "string");
const direct_hoist_1 = new TypeofRuntype(undefined, "number");
const direct_hoist_2 = new TypeofRuntype(undefined, "boolean");
const direct_hoist_3 = new NullishRuntype(undefined, "null");
const direct_hoist_4 = new NullishRuntype(undefined, "undefined");
const direct_hoist_5 = new NullishRuntype(undefined, "void");
const direct_hoist_6 = new AnyRuntype(undefined);
const direct_hoist_7 = new BigIntRuntype(undefined);
const direct_hoist_8 = new DateRuntype(undefined);
const direct_hoist_9 = new ConstRuntype(undefined, "hello");
const direct_hoist_10 = new ConstRuntype(undefined, 42);
const direct_hoist_11 = new ConstRuntype(undefined, true);
const direct_hoist_12 = new AnyOfConstsRuntype(undefined, [
    "a",
    "b",
    "c"
]);
const direct_hoist_13 = new ConstRuntype(undefined, "a");
const direct_hoist_14 = new ConstRuntype(undefined, 1);
const direct_hoist_15 = new AnyOfRuntype(undefined, [
    direct_hoist_3,
    direct_hoist_13,
    direct_hoist_11,
    direct_hoist_14
]);
const direct_hoist_16 = new AnyOfConstsRuntype(undefined, [
    "__proto__",
    "constructor",
    "toString"
]);
const direct_hoist_17 = new RefRuntype(undefined, "Color");
const direct_hoist_18 = new RefRuntype(undefined, "Color__Red");
const direct_hoist_19 = new ArrayRuntype(undefined, direct_hoist_0);
const direct_hoist_20 = new ArrayRuntype(undefined, direct_hoist_1);
const direct_hoist_21 = new ArrayRuntype(undefined, direct_hoist_20);
const direct_hoist_22 = new TupleRuntype(undefined, [
    direct_hoist_0,
    direct_hoist_1
], null);
const direct_hoist_23 = new TupleRuntype(undefined, [
    direct_hoist_0
], direct_hoist_1);
const direct_hoist_24 = new TupleRuntype(undefined, [
    direct_hoist_2,
    direct_hoist_0
], null);
const direct_hoist_25 = new ObjectRuntype(undefined, {}, []);
const direct_hoist_26 = new RefRuntype(undefined, "Nested");
const direct_hoist_27 = new RefRuntype(undefined, "ManyFields");
const direct_hoist_28 = new RefRuntype(undefined, "Optionals");
const direct_hoist_29 = new ObjectRuntype(undefined, {
    ["__proto__"]: direct_hoist_0,
    "toString": direct_hoist_1
}, []);
const direct_hoist_30 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_0,
        "value": direct_hoist_1
    }
]);
const direct_hoist_31 = new ObjectRuntype(undefined, {}, [
    {
        "key": new NumberKeyRuntype(undefined),
        "value": direct_hoist_0
    }
]);
const direct_hoist_32 = new RefRuntype(undefined, "NumberKeyedObj");
const direct_hoist_33 = new ObjectRuntype(undefined, {
    "x": direct_hoist_1,
    "y": direct_hoist_1
}, []);
const direct_hoist_34 = new ObjectRuntype(undefined, {
    "1": direct_hoist_0,
    "2": direct_hoist_0
}, []);
const direct_hoist_35 = new ObjectRuntype(undefined, {
    "x": new OptionalFieldRuntype(direct_hoist_1),
    "y": new OptionalFieldRuntype(direct_hoist_1)
}, []);
const direct_hoist_36 = new RegexRuntype(undefined, /^(x_)([\s\S]*)$/, "`x_${string}`");
const direct_hoist_37 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_36,
        "value": direct_hoist_1
    }
]);
const direct_hoist_38 = new RefRuntype(undefined, "TplIndexWithProps");
const direct_hoist_39 = new RegexRuntype(undefined, /^(beta_)([\s\S]*)$/, "`beta_${string}`");
const direct_hoist_40 = new ObjectRuntype(undefined, {
    "alpha": new OptionalFieldRuntype(direct_hoist_0)
}, [
    {
        "key": direct_hoist_39,
        "value": new OptionalFieldRuntype(direct_hoist_0)
    }
]);
const direct_hoist_41 = new ObjectRuntype(undefined, {
    "value": direct_hoist_13
}, []);
const direct_hoist_42 = new ConstRuntype(undefined, "b");
const direct_hoist_43 = new ObjectRuntype(undefined, {
    "value": direct_hoist_42
}, []);
const direct_hoist_44 = new ObjectRuntype(undefined, {
    "a": direct_hoist_41,
    "b": direct_hoist_43
}, []);
const direct_hoist_45 = new AnyOfRuntype(undefined, [
    direct_hoist_0,
    direct_hoist_1
]);
const direct_hoist_46 = new RefRuntype(undefined, "ObjA");
const direct_hoist_47 = new RefRuntype(undefined, "ObjB");
const direct_hoist_48 = new AnyOfRuntype(undefined, [
    direct_hoist_46,
    direct_hoist_47
]);
const direct_hoist_49 = new AnyOfRuntype(undefined, [
    direct_hoist_3,
    direct_hoist_0,
    direct_hoist_20,
    direct_hoist_46
]);
const direct_hoist_50 = new RefRuntype(undefined, "Shape");
const direct_hoist_51 = new RefRuntype(undefined, "NestedDiscriminated");
const direct_hoist_52 = new RefRuntype(undefined, "ProtoDiscriminated");
const direct_hoist_53 = new RefRuntype(undefined, "MultiValueDiscriminated");
const direct_hoist_54 = new RefRuntype(undefined, "OptionalDiscriminated");
const direct_hoist_55 = new MapRuntype(undefined, direct_hoist_0, direct_hoist_1);
const direct_hoist_56 = new SetRuntype(undefined, direct_hoist_0);
const direct_hoist_57 = new AnyOfRuntype(undefined, [
    direct_hoist_3,
    direct_hoist_55,
    direct_hoist_56
]);
const direct_hoist_58 = new RefRuntype(undefined, "IA");
const direct_hoist_59 = new RefRuntype(undefined, "IB");
const direct_hoist_60 = new AllOfRuntype(undefined, [
    direct_hoist_58,
    direct_hoist_59
]);
const direct_hoist_61 = new ObjectRuntype(undefined, {
    "x": direct_hoist_0
}, []);
const direct_hoist_62 = new ObjectRuntype(undefined, {
    "n": direct_hoist_61
}, []);
const direct_hoist_63 = new AllOfRuntype(undefined, [
    direct_hoist_62,
    direct_hoist_59
]);
const direct_hoist_64 = new AllOfRuntype(undefined, [
    direct_hoist_58,
    direct_hoist_63
]);
const direct_hoist_65 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_0,
        "value": direct_hoist_45
    }
]);
const direct_hoist_66 = new ObjectRuntype(undefined, {
    "n": direct_hoist_1
}, []);
const direct_hoist_67 = new AllOfRuntype(undefined, [
    direct_hoist_65,
    direct_hoist_66,
    direct_hoist_58
]);
const direct_hoist_68 = new AllOfRuntype(undefined, [
    direct_hoist_37,
    direct_hoist_58
]);
const direct_hoist_69 = new RefRuntype(undefined, "IntersectionUnion");
const direct_hoist_70 = new ObjectRuntype(undefined, {
    "foo": direct_hoist_0
}, []);
const direct_hoist_71 = new AllOfRuntype(undefined, [
    direct_hoist_70,
    direct_hoist_8
]);
const direct_hoist_72 = new AnyOfRuntype(undefined, [
    direct_hoist_3,
    direct_hoist_58
]);
const direct_hoist_73 = new AnyOfRuntype(undefined, [
    direct_hoist_4,
    direct_hoist_59
]);
const direct_hoist_74 = new AllOfRuntype(undefined, [
    direct_hoist_72,
    direct_hoist_73
]);
const direct_hoist_75 = new ObjectRuntype(undefined, {
    "a": direct_hoist_0,
    "c": new OptionalFieldRuntype(direct_hoist_2)
}, []);
const direct_hoist_76 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_0),
    "b": new OptionalFieldRuntype(direct_hoist_1),
    "c": new OptionalFieldRuntype(direct_hoist_2)
}, []);
const direct_hoist_77 = new ObjectRuntype(undefined, {
    "a": direct_hoist_0,
    "b": direct_hoist_1,
    "c": direct_hoist_2
}, []);
const direct_hoist_78 = new ConstRuntype(undefined, "rect");
const direct_hoist_79 = new ObjectRuntype(undefined, {
    "h": direct_hoist_1,
    "kind": direct_hoist_78,
    "w": direct_hoist_1
}, []);
const direct_hoist_80 = new ConstRuntype(undefined, "square");
const direct_hoist_81 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_80,
    "size": direct_hoist_1
}, []);
const direct_hoist_82 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_79,
    direct_hoist_81
], "kind", {
    "rect": direct_hoist_79,
    "square": direct_hoist_81
}, {
    "rect": direct_hoist_79,
    "square": direct_hoist_81
});
const direct_hoist_83 = new AnyOfConstsRuntype(undefined, [
    "a",
    "c"
]);
const direct_hoist_84 = new RefRuntype(undefined, "ShapeKind");
const direct_hoist_85 = new RefRuntype(undefined, "Box_string");
const direct_hoist_86 = new RefRuntype(undefined, "Box_Box__number__");
const direct_hoist_87 = new RefRuntype(undefined, "Pair_number");
const direct_hoist_88 = new RefRuntype(undefined, "Pair_instance_3");
const direct_hoist_89 = new RefRuntype(undefined, "ListOf_number");
const direct_hoist_90 = new RefRuntype(undefined, "WithDefault_boolean");
const direct_hoist_91 = new RefRuntype(undefined, "GenericRecursive_string");
const direct_hoist_92 = new RefRuntype(undefined, "LinkedList");
const direct_hoist_93 = new RefRuntype(undefined, "Tree");
const direct_hoist_94 = new RefRuntype(undefined, "Json");
const direct_hoist_95 = new RefRuntype(undefined, "Expr");
const direct_hoist_96 = new RefRuntype(undefined, "MutualA");
const direct_hoist_97 = new RefRuntype(undefined, "RecursiveFirst");
const direct_hoist_98 = new RefRuntype(undefined, "RecursiveMiddle");
const direct_hoist_99 = new RefRuntype(undefined, "RecursiveLast");
const direct_hoist_100 = new RefRuntype(undefined, "RecursiveInTuple");
const direct_hoist_101 = new RegexRuntype(undefined, /^(a)([\s\S]*)$/, "`a${string}`");
const direct_hoist_102 = new RegexRuntype(undefined, /^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}`");
const direct_hoist_103 = new RegexRuntype(undefined, /^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}.${number}.${number}`");
const direct_hoist_104 = new RegexRuntype(undefined, /^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(x)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}x${number}`");
const direct_hoist_105 = new RegexRuntype(undefined, /^((a)|(b))(-)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, '`("a" | "b")-${number}`');
const direct_hoist_106 = new RegexRuntype(undefined, /^(true|false)$/, "`${boolean}`");
const direct_hoist_107 = new RegexRuntype(undefined, /^([\s\S]*)$/, "`${string}`");
const direct_hoist_108 = new RegexRuntype(undefined, /^((green)|(red))$/, '`("green" | "red")`');
const direct_hoist_109 = new RefRuntype(undefined, "UserId");
const direct_hoist_110 = new RefRuntype(undefined, "AdminId");
const direct_hoist_111 = new RefRuntype(undefined, "NonNegative");
const direct_hoist_112 = new RefRuntype(undefined, "Rate");
const direct_hoist_113 = new ObjectRuntype(undefined, {
    "id": direct_hoist_109,
    "rate": direct_hoist_112
}, []);
const direct_hoist_114 = new MapRuntype(undefined, direct_hoist_0, direct_hoist_8);
const direct_hoist_115 = new ObjectRuntype(undefined, {
    "m": direct_hoist_114
}, []);
const direct_hoist_116 = new TypedArrayRuntype(undefined, "Uint8Array");
const direct_hoist_117 = new TypedArrayRuntype(undefined, "Int32Array");
const direct_hoist_118 = new TypedArrayRuntype(undefined, "Float64Array");
const direct_hoist_119 = new TypedArrayRuntype(undefined, "BigInt64Array");
const direct_hoist_120 = new ObjectRuntype(undefined, {
    "at": direct_hoist_8,
    "big": direct_hoist_7
}, []);
const direct_hoist_121 = new StringWithFormatRuntype(undefined, [
    "UserId",
    "AdminId"
]);
const direct_hoist_122 = new ObjectRuntype(undefined, {
    "a": direct_hoist_0,
    "b": direct_hoist_1,
    "c": new OptionalFieldRuntype(direct_hoist_2)
}, []);
const direct_hoist_123 = new ObjectRuntype(undefined, {
    "value": direct_hoist_0
}, []);
const direct_hoist_124 = new ObjectRuntype(undefined, {
    "value": direct_hoist_1
}, []);
const direct_hoist_125 = new RefRuntype(undefined, "Box_number");
const direct_hoist_126 = new ObjectRuntype(undefined, {
    "value": direct_hoist_125
}, []);
const direct_hoist_127 = new AnyOfConstsRuntype(undefined, [
    "green",
    "red"
]);
const direct_hoist_128 = new ConstRuntype(undefined, "add");
const direct_hoist_129 = new ObjectRuntype(undefined, {
    "left": direct_hoist_95,
    "op": direct_hoist_128,
    "right": direct_hoist_95
}, []);
const direct_hoist_130 = new ConstRuntype(undefined, "neg");
const direct_hoist_131 = new ObjectRuntype(undefined, {
    "arg": direct_hoist_95,
    "op": direct_hoist_130
}, []);
const direct_hoist_132 = new ConstRuntype(undefined, "num");
const direct_hoist_133 = new ObjectRuntype(undefined, {
    "op": direct_hoist_132,
    "value": direct_hoist_1
}, []);
const direct_hoist_134 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_131,
    direct_hoist_129,
    direct_hoist_133
], "op", {
    "add": direct_hoist_129,
    "neg": direct_hoist_131,
    "num": direct_hoist_133
}, {
    "add": direct_hoist_129,
    "neg": direct_hoist_131,
    "num": direct_hoist_133
});
const direct_hoist_135 = new ArrayRuntype(undefined, direct_hoist_91);
const direct_hoist_136 = new ObjectRuntype(undefined, {
    "children": direct_hoist_135,
    "value": direct_hoist_0
}, []);
const direct_hoist_137 = new ObjectRuntype(undefined, {
    "a": direct_hoist_0
}, []);
const direct_hoist_138 = new ObjectRuntype(undefined, {
    "b": new OptionalFieldRuntype(direct_hoist_1)
}, []);
const direct_hoist_139 = new ConstRuntype(undefined, "u");
const direct_hoist_140 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_139,
    "u": direct_hoist_0
}, []);
const direct_hoist_141 = new ConstRuntype(undefined, "v");
const direct_hoist_142 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_141,
    "v": new OptionalFieldRuntype(direct_hoist_1)
}, []);
const direct_hoist_143 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_140,
    direct_hoist_142
], "kind", {
    "u": direct_hoist_140,
    "v": direct_hoist_142
}, {
    "u": direct_hoist_140,
    "v": direct_hoist_142
});
const direct_hoist_144 = new AllOfRuntype(undefined, [
    direct_hoist_58,
    direct_hoist_143
]);
const direct_hoist_145 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_0,
        "value": direct_hoist_94
    }
]);
const direct_hoist_146 = new ArrayRuntype(undefined, direct_hoist_94);
const direct_hoist_147 = new AnyOfRuntype(undefined, [
    direct_hoist_3,
    direct_hoist_2,
    direct_hoist_0,
    direct_hoist_1,
    direct_hoist_145,
    direct_hoist_146
]);
const direct_hoist_148 = new AnyOfRuntype(undefined, [
    direct_hoist_3,
    direct_hoist_92
]);
const direct_hoist_149 = new ObjectRuntype(undefined, {
    "next": direct_hoist_148,
    "value": direct_hoist_1
}, []);
const direct_hoist_150 = new ObjectRuntype(undefined, {
    "item": direct_hoist_1,
    "items": direct_hoist_20
}, []);
const direct_hoist_151 = new ObjectRuntype(undefined, {
    "f01": direct_hoist_0,
    "f02": direct_hoist_1,
    "f03": direct_hoist_2,
    "f04": direct_hoist_0,
    "f05": direct_hoist_1,
    "f06": direct_hoist_2,
    "f07": direct_hoist_0,
    "f08": direct_hoist_1,
    "f09": direct_hoist_2,
    "f10": direct_hoist_0,
    "f11": direct_hoist_1,
    "f12": direct_hoist_2,
    "f13": direct_hoist_0,
    "f14": direct_hoist_1,
    "f15": direct_hoist_2,
    "f16": direct_hoist_0,
    "f17": direct_hoist_1,
    "f18": direct_hoist_2,
    "f19": direct_hoist_0,
    "f20": direct_hoist_1
}, []);
const direct_hoist_152 = new ConstRuntype(undefined, "alpha");
const direct_hoist_153 = new AnyOfRuntype(undefined, [
    direct_hoist_152,
    direct_hoist_39
]);
const direct_hoist_154 = new ObjectRuntype(undefined, {
    "a": direct_hoist_0,
    "type": direct_hoist_83
}, []);
const direct_hoist_155 = new ObjectRuntype(undefined, {
    "b": direct_hoist_1,
    "type": direct_hoist_42
}, []);
const direct_hoist_156 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_154,
    direct_hoist_155
], "type", {
    "a": direct_hoist_154,
    "b": direct_hoist_155,
    "c": direct_hoist_154
}, {
    "a": direct_hoist_154,
    "b": direct_hoist_155,
    "c": direct_hoist_154
});
const direct_hoist_157 = new RefRuntype(undefined, "MutualB");
const direct_hoist_158 = new ObjectRuntype(undefined, {
    "b": new OptionalFieldRuntype(direct_hoist_157),
    "tag": direct_hoist_13
}, []);
const direct_hoist_159 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_96),
    "tag": direct_hoist_42
}, []);
const direct_hoist_160 = new ObjectRuntype(undefined, {
    "deep": direct_hoist_124
}, []);
const direct_hoist_161 = new ObjectRuntype(undefined, {
    "id": direct_hoist_0
}, []);
const direct_hoist_162 = new ArrayRuntype(undefined, direct_hoist_161);
const direct_hoist_163 = new ObjectRuntype(undefined, {
    "inner": direct_hoist_160,
    "list": direct_hoist_162
}, []);
const direct_hoist_164 = new ConstRuntype(undefined, "a1");
const direct_hoist_165 = new ObjectRuntype(undefined, {
    "a1": direct_hoist_0,
    "subType": direct_hoist_164,
    "type": direct_hoist_13
}, []);
const direct_hoist_166 = new ConstRuntype(undefined, "a2");
const direct_hoist_167 = new ObjectRuntype(undefined, {
    "a2": direct_hoist_0,
    "subType": direct_hoist_166,
    "type": direct_hoist_13
}, []);
const direct_hoist_168 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_165,
    direct_hoist_167
], "subType", {
    "a1": direct_hoist_165,
    "a2": direct_hoist_167
}, {
    "a1": direct_hoist_165,
    "a2": direct_hoist_167
});
const direct_hoist_169 = new ObjectRuntype(undefined, {
    "type": direct_hoist_42,
    "value": direct_hoist_1
}, []);
const direct_hoist_170 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_165,
    direct_hoist_167,
    direct_hoist_169
], "type", {
    "a": direct_hoist_168,
    "b": direct_hoist_169
}, {
    "a": direct_hoist_168,
    "b": direct_hoist_169
});
const direct_hoist_171 = new NumberWithFormatRuntype(undefined, [
    "NonNegative"
]);
const direct_hoist_172 = new ObjectRuntype(undefined, {}, [
    {
        "key": new NumberKeyRuntype(undefined),
        "value": direct_hoist_2
    }
]);
const direct_hoist_173 = new ObjectRuntype(undefined, {
    "b": direct_hoist_1
}, []);
const direct_hoist_174 = new ObjectRuntype(undefined, {
    "a": direct_hoist_0,
    "type": direct_hoist_13
}, []);
const direct_hoist_175 = new ConstRuntype(undefined, "d");
const direct_hoist_176 = new ObjectRuntype(undefined, {
    "d": direct_hoist_1,
    "type": new OptionalFieldRuntype(direct_hoist_175)
}, []);
const direct_hoist_177 = new AnyOfRuntype(undefined, [
    direct_hoist_174,
    direct_hoist_176
]);
const direct_hoist_178 = new AnyOfRuntype(undefined, [
    direct_hoist_3,
    direct_hoist_0
]);
const direct_hoist_179 = new AnyOfRuntype(undefined, [
    direct_hoist_4,
    direct_hoist_0
]);
const direct_hoist_180 = new AnyOfRuntype(undefined, [
    direct_hoist_5,
    direct_hoist_0
]);
const direct_hoist_181 = new ObjectRuntype(undefined, {
    "nul": direct_hoist_178,
    "opt": new OptionalFieldRuntype(direct_hoist_0),
    "req": direct_hoist_0,
    "undef": direct_hoist_179,
    "voided": direct_hoist_180
}, []);
const direct_hoist_182 = new ObjectRuntype(undefined, {
    "first": direct_hoist_1,
    "second": direct_hoist_0
}, []);
const direct_hoist_183 = new ObjectRuntype(undefined, {
    "first": direct_hoist_1,
    "second": direct_hoist_2
}, []);
const direct_hoist_184 = new ConstRuntype(undefined, "__proto__");
const direct_hoist_185 = new ObjectRuntype(undefined, {
    "c": direct_hoist_2,
    "kind": direct_hoist_184
}, []);
const direct_hoist_186 = new ConstRuntype(undefined, "constructor");
const direct_hoist_187 = new ObjectRuntype(undefined, {
    "b": direct_hoist_1,
    "kind": direct_hoist_186
}, []);
const direct_hoist_188 = new ConstRuntype(undefined, "toString");
const direct_hoist_189 = new ObjectRuntype(undefined, {
    "a": direct_hoist_0,
    "kind": direct_hoist_188
}, []);
const direct_hoist_190 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_189,
    direct_hoist_187,
    direct_hoist_185
], "kind", {
    ["__proto__"]: direct_hoist_185,
    "constructor": direct_hoist_187,
    "toString": direct_hoist_189
}, {
    ["__proto__"]: direct_hoist_185,
    "constructor": direct_hoist_187,
    "toString": direct_hoist_189
});
const direct_hoist_191 = new NumberWithFormatRuntype(undefined, [
    "NonNegative",
    "Rate"
]);
const direct_hoist_192 = new ArrayRuntype(undefined, direct_hoist_97);
const direct_hoist_193 = new AnyOfRuntype(undefined, [
    direct_hoist_0,
    direct_hoist_192
]);
const direct_hoist_194 = new AnyOfRuntype(undefined, [
    direct_hoist_3,
    direct_hoist_100
]);
const direct_hoist_195 = new TupleRuntype(undefined, [
    direct_hoist_1,
    direct_hoist_194
], null);
const direct_hoist_196 = new ArrayRuntype(undefined, direct_hoist_99);
const direct_hoist_197 = new AnyOfRuntype(undefined, [
    direct_hoist_0,
    direct_hoist_1,
    direct_hoist_196
]);
const direct_hoist_198 = new ObjectRuntype(undefined, {
    "child": direct_hoist_98
}, []);
const direct_hoist_199 = new AnyOfRuntype(undefined, [
    direct_hoist_3,
    direct_hoist_1,
    direct_hoist_198
]);
const direct_hoist_200 = new ConstRuntype(undefined, "circle");
const direct_hoist_201 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_200,
    "radius": direct_hoist_1
}, []);
const direct_hoist_202 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_79,
    direct_hoist_201,
    direct_hoist_81
], "kind", {
    "circle": direct_hoist_201,
    "rect": direct_hoist_79,
    "square": direct_hoist_81
}, {
    "circle": direct_hoist_201,
    "rect": direct_hoist_79,
    "square": direct_hoist_81
});
const direct_hoist_203 = new AnyOfConstsRuntype(undefined, [
    "circle",
    "rect",
    "square"
]);
const direct_hoist_204 = new ObjectRuntype(undefined, {
    "a": direct_hoist_1
}, [
    {
        "key": direct_hoist_36,
        "value": direct_hoist_1
    }
]);
const direct_hoist_205 = new ArrayRuntype(undefined, direct_hoist_93);
const direct_hoist_206 = new ObjectRuntype(undefined, {
    "children": direct_hoist_205,
    "name": direct_hoist_0
}, []);
const direct_hoist_207 = new StringWithFormatRuntype(undefined, [
    "UserId"
]);
const direct_hoist_208 = new ArrayRuntype(undefined, direct_hoist_2);
const direct_hoist_209 = new ObjectRuntype(undefined, {
    "a": direct_hoist_2,
    "b": direct_hoist_208
}, []);
const direct_hoist_210 = new ConstRuntype(undefined, "red");
const namedRuntypes = {
    "AdminId": direct_hoist_121,
    "Base": direct_hoist_122,
    "Box_string": direct_hoist_123,
    "Box_number": direct_hoist_124,
    "Box_Box__number__": direct_hoist_126,
    "Color": direct_hoist_127,
    "Expr": direct_hoist_134,
    "GenericRecursive_string": direct_hoist_136,
    "IA": direct_hoist_137,
    "IB": direct_hoist_138,
    "IntersectionUnion": direct_hoist_144,
    "Json": direct_hoist_147,
    "LinkedList": direct_hoist_149,
    "ListOf_number": direct_hoist_150,
    "ManyFields": direct_hoist_151,
    "MetaKey": direct_hoist_153,
    "MultiValueDiscriminated": direct_hoist_156,
    "MutualA": direct_hoist_158,
    "MutualB": direct_hoist_159,
    "Nested": direct_hoist_163,
    "NestedDiscriminated": direct_hoist_170,
    "NonNegative": direct_hoist_171,
    "NumberKeyedObj": direct_hoist_172,
    "ObjA": direct_hoist_137,
    "ObjB": direct_hoist_173,
    "OptionalDiscriminated": direct_hoist_177,
    "Optionals": direct_hoist_181,
    "Pair_number": direct_hoist_182,
    "Pair_instance_3": direct_hoist_183,
    "ProtoDiscriminated": direct_hoist_190,
    "Rate": direct_hoist_191,
    "RecursiveFirst": direct_hoist_193,
    "RecursiveInTuple": direct_hoist_195,
    "RecursiveLast": direct_hoist_197,
    "RecursiveMiddle": direct_hoist_199,
    "Shape": direct_hoist_202,
    "ShapeKind": direct_hoist_203,
    "TplIndexWithProps": direct_hoist_204,
    "Tree": direct_hoist_206,
    "UserId": direct_hoist_207,
    "WithDefault_boolean": direct_hoist_209,
    "Color__Red": direct_hoist_210
};
const buildParsersInput = {
    "String": direct_hoist_0,
    "Number": direct_hoist_1,
    "Boolean": direct_hoist_2,
    "Null": direct_hoist_3,
    "Undefined": direct_hoist_4,
    "Void": direct_hoist_5,
    "Any": direct_hoist_6,
    "Unknown": direct_hoist_6,
    "BigInt": direct_hoist_7,
    "DateT": direct_hoist_8,
    "LitString": direct_hoist_9,
    "LitNumber": direct_hoist_10,
    "LitTrue": direct_hoist_11,
    "LitUnion": direct_hoist_12,
    "LitMixedUnion": direct_hoist_15,
    "ProtoLitUnion": direct_hoist_16,
    "Enum": direct_hoist_17,
    "EnumMember": direct_hoist_18,
    "StringArray": direct_hoist_19,
    "ReadonlyNumberArray": direct_hoist_20,
    "NestedArray": direct_hoist_21,
    "Tuple": direct_hoist_22,
    "TupleRest": direct_hoist_23,
    "ReadonlyTuple": direct_hoist_24,
    "Empty": direct_hoist_25,
    "Nested": direct_hoist_26,
    "ManyFields": direct_hoist_27,
    "Optionals": direct_hoist_28,
    "ProtoKeyObject": direct_hoist_29,
    "StringRecord": direct_hoist_30,
    "NumberRecord": direct_hoist_31,
    "NumberKeyedObj": direct_hoist_32,
    "LiteralKeyRecord": direct_hoist_33,
    "NumberLiteralKeyRecord": direct_hoist_34,
    "PartialRecord": direct_hoist_35,
    "TplRecord": direct_hoist_37,
    "TplIndexWithProps": direct_hoist_38,
    "MetaRecord": direct_hoist_40,
    "MappedType": direct_hoist_44,
    "PrimitiveUnion": direct_hoist_45,
    "ObjectUnion": direct_hoist_48,
    "MixedUnion": direct_hoist_49,
    "Shape": direct_hoist_50,
    "NestedDiscriminated": direct_hoist_51,
    "ProtoDiscriminated": direct_hoist_52,
    "MultiValueDiscriminated": direct_hoist_53,
    "OptionalDiscriminated": direct_hoist_54,
    "MapOrSetUnion": direct_hoist_57,
    "Intersection": direct_hoist_60,
    "IntersectionNested": direct_hoist_64,
    "IntersectionIndex": direct_hoist_67,
    "IntersectionTplIndex": direct_hoist_68,
    "IntersectionUnion": direct_hoist_69,
    "IntersectionDate": direct_hoist_71,
    "IntersectionNullish": direct_hoist_74,
    "OmitT": direct_hoist_75,
    "PickT": direct_hoist_75,
    "PartialT": direct_hoist_76,
    "RequiredT": direct_hoist_77,
    "ExcludeT": direct_hoist_82,
    "ExcludeLit": direct_hoist_83,
    "KeyofT": direct_hoist_12,
    "IndexedAccess": direct_hoist_84,
    "BoxString": direct_hoist_85,
    "BoxBox": direct_hoist_86,
    "PairDefault": direct_hoist_87,
    "PairExplicit": direct_hoist_88,
    "ListOfDefault": direct_hoist_89,
    "WithDefault": direct_hoist_90,
    "GenericRecursive": direct_hoist_91,
    "LinkedList": direct_hoist_92,
    "Tree": direct_hoist_93,
    "Json": direct_hoist_94,
    "Expr": direct_hoist_95,
    "MutualA": direct_hoist_96,
    "RecursiveFirst": direct_hoist_97,
    "RecursiveMiddle": direct_hoist_98,
    "RecursiveLast": direct_hoist_99,
    "RecursiveInTuple": direct_hoist_100,
    "TplPrefix": direct_hoist_101,
    "TplNumber": direct_hoist_102,
    "TplVersion": direct_hoist_103,
    "TplSize": direct_hoist_104,
    "TplLitUnion": direct_hoist_105,
    "TplBoolean": direct_hoist_106,
    "TplString": direct_hoist_107,
    "TplEnum": direct_hoist_108,
    "UserId": direct_hoist_109,
    "AdminId": direct_hoist_110,
    "NonNegative": direct_hoist_111,
    "Rate": direct_hoist_112,
    "FormatsInObject": direct_hoist_113,
    "MapT": direct_hoist_55,
    "SetT": direct_hoist_56,
    "MapInObject": direct_hoist_115,
    "Uint8ArrayT": direct_hoist_116,
    "Int32ArrayT": direct_hoist_117,
    "Float64ArrayT": direct_hoist_118,
    "BigInt64ArrayT": direct_hoist_119,
    "DateInObject": direct_hoist_120
};

export default { buildParsers };