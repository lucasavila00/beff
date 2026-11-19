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
    "__proto__": direct_hoist_0,
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
    "a": direct_hoist_0,
    "c": new OptionalFieldRuntype(direct_hoist_2)
}, []);
const direct_hoist_71 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_0),
    "b": new OptionalFieldRuntype(direct_hoist_1),
    "c": new OptionalFieldRuntype(direct_hoist_2)
}, []);
const direct_hoist_72 = new ObjectRuntype(undefined, {
    "a": direct_hoist_0,
    "b": direct_hoist_1,
    "c": direct_hoist_2
}, []);
const direct_hoist_73 = new ConstRuntype(undefined, "rect");
const direct_hoist_74 = new ObjectRuntype(undefined, {
    "h": direct_hoist_1,
    "kind": direct_hoist_73,
    "w": direct_hoist_1
}, []);
const direct_hoist_75 = new ConstRuntype(undefined, "square");
const direct_hoist_76 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_75,
    "size": direct_hoist_1
}, []);
const direct_hoist_77 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_74,
    direct_hoist_76
], "kind", {
    "rect": direct_hoist_74,
    "square": direct_hoist_76
}, {
    "rect": direct_hoist_74,
    "square": direct_hoist_76
});
const direct_hoist_78 = new AnyOfConstsRuntype(undefined, [
    "a",
    "c"
]);
const direct_hoist_79 = new RefRuntype(undefined, "ShapeKind");
const direct_hoist_80 = new RefRuntype(undefined, "Box_string");
const direct_hoist_81 = new RefRuntype(undefined, "Box_Box__number__");
const direct_hoist_82 = new RefRuntype(undefined, "Pair_number");
const direct_hoist_83 = new RefRuntype(undefined, "Pair_instance_3");
const direct_hoist_84 = new RefRuntype(undefined, "ListOf_number");
const direct_hoist_85 = new RefRuntype(undefined, "WithDefault_boolean");
const direct_hoist_86 = new RefRuntype(undefined, "GenericRecursive_string");
const direct_hoist_87 = new RefRuntype(undefined, "LinkedList");
const direct_hoist_88 = new RefRuntype(undefined, "Tree");
const direct_hoist_89 = new RefRuntype(undefined, "Json");
const direct_hoist_90 = new RefRuntype(undefined, "Expr");
const direct_hoist_91 = new RefRuntype(undefined, "MutualA");
const direct_hoist_92 = new RefRuntype(undefined, "RecursiveFirst");
const direct_hoist_93 = new RefRuntype(undefined, "RecursiveMiddle");
const direct_hoist_94 = new RefRuntype(undefined, "RecursiveLast");
const direct_hoist_95 = new RefRuntype(undefined, "RecursiveInTuple");
const direct_hoist_96 = new RegexRuntype(undefined, /^(a)([\s\S]*)$/, "`a${string}`");
const direct_hoist_97 = new RegexRuntype(undefined, /^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}`");
const direct_hoist_98 = new RegexRuntype(undefined, /^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}.${number}.${number}`");
const direct_hoist_99 = new RegexRuntype(undefined, /^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(x)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}x${number}`");
const direct_hoist_100 = new RegexRuntype(undefined, /^((a)|(b))(-)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, '`("a" | "b")-${number}`');
const direct_hoist_101 = new RegexRuntype(undefined, /^(true|false)$/, "`${boolean}`");
const direct_hoist_102 = new RegexRuntype(undefined, /^([\s\S]*)$/, "`${string}`");
const direct_hoist_103 = new RegexRuntype(undefined, /^((green)|(red))$/, '`("green" | "red")`');
const direct_hoist_104 = new RefRuntype(undefined, "UserId");
const direct_hoist_105 = new RefRuntype(undefined, "AdminId");
const direct_hoist_106 = new RefRuntype(undefined, "NonNegative");
const direct_hoist_107 = new RefRuntype(undefined, "Rate");
const direct_hoist_108 = new ObjectRuntype(undefined, {
    "id": direct_hoist_104,
    "rate": direct_hoist_107
}, []);
const direct_hoist_109 = new MapRuntype(undefined, direct_hoist_0, direct_hoist_8);
const direct_hoist_110 = new ObjectRuntype(undefined, {
    "m": direct_hoist_109
}, []);
const direct_hoist_111 = new TypedArrayRuntype(undefined, "Uint8Array");
const direct_hoist_112 = new TypedArrayRuntype(undefined, "Int32Array");
const direct_hoist_113 = new TypedArrayRuntype(undefined, "Float64Array");
const direct_hoist_114 = new TypedArrayRuntype(undefined, "BigInt64Array");
const direct_hoist_115 = new ObjectRuntype(undefined, {
    "at": direct_hoist_8,
    "big": direct_hoist_7
}, []);
const direct_hoist_116 = new StringWithFormatRuntype(undefined, [
    "UserId",
    "AdminId"
]);
const direct_hoist_117 = new ObjectRuntype(undefined, {
    "a": direct_hoist_0,
    "b": direct_hoist_1,
    "c": new OptionalFieldRuntype(direct_hoist_2)
}, []);
const direct_hoist_118 = new ObjectRuntype(undefined, {
    "value": direct_hoist_0
}, []);
const direct_hoist_119 = new ObjectRuntype(undefined, {
    "value": direct_hoist_1
}, []);
const direct_hoist_120 = new RefRuntype(undefined, "Box_number");
const direct_hoist_121 = new ObjectRuntype(undefined, {
    "value": direct_hoist_120
}, []);
const direct_hoist_122 = new AnyOfConstsRuntype(undefined, [
    "green",
    "red"
]);
const direct_hoist_123 = new ConstRuntype(undefined, "add");
const direct_hoist_124 = new ObjectRuntype(undefined, {
    "left": direct_hoist_90,
    "op": direct_hoist_123,
    "right": direct_hoist_90
}, []);
const direct_hoist_125 = new ConstRuntype(undefined, "neg");
const direct_hoist_126 = new ObjectRuntype(undefined, {
    "arg": direct_hoist_90,
    "op": direct_hoist_125
}, []);
const direct_hoist_127 = new ConstRuntype(undefined, "num");
const direct_hoist_128 = new ObjectRuntype(undefined, {
    "op": direct_hoist_127,
    "value": direct_hoist_1
}, []);
const direct_hoist_129 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_126,
    direct_hoist_124,
    direct_hoist_128
], "op", {
    "add": direct_hoist_124,
    "neg": direct_hoist_126,
    "num": direct_hoist_128
}, {
    "add": direct_hoist_124,
    "neg": direct_hoist_126,
    "num": direct_hoist_128
});
const direct_hoist_130 = new ArrayRuntype(undefined, direct_hoist_86);
const direct_hoist_131 = new ObjectRuntype(undefined, {
    "children": direct_hoist_130,
    "value": direct_hoist_0
}, []);
const direct_hoist_132 = new ObjectRuntype(undefined, {
    "a": direct_hoist_0
}, []);
const direct_hoist_133 = new ObjectRuntype(undefined, {
    "b": new OptionalFieldRuntype(direct_hoist_1)
}, []);
const direct_hoist_134 = new ConstRuntype(undefined, "u");
const direct_hoist_135 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_134,
    "u": direct_hoist_0
}, []);
const direct_hoist_136 = new ConstRuntype(undefined, "v");
const direct_hoist_137 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_136,
    "v": new OptionalFieldRuntype(direct_hoist_1)
}, []);
const direct_hoist_138 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_135,
    direct_hoist_137
], "kind", {
    "u": direct_hoist_135,
    "v": direct_hoist_137
}, {
    "u": direct_hoist_135,
    "v": direct_hoist_137
});
const direct_hoist_139 = new AllOfRuntype(undefined, [
    direct_hoist_58,
    direct_hoist_138
]);
const direct_hoist_140 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_0,
        "value": direct_hoist_89
    }
]);
const direct_hoist_141 = new ArrayRuntype(undefined, direct_hoist_89);
const direct_hoist_142 = new AnyOfRuntype(undefined, [
    direct_hoist_3,
    direct_hoist_2,
    direct_hoist_0,
    direct_hoist_1,
    direct_hoist_140,
    direct_hoist_141
]);
const direct_hoist_143 = new AnyOfRuntype(undefined, [
    direct_hoist_3,
    direct_hoist_87
]);
const direct_hoist_144 = new ObjectRuntype(undefined, {
    "next": direct_hoist_143,
    "value": direct_hoist_1
}, []);
const direct_hoist_145 = new ObjectRuntype(undefined, {
    "item": direct_hoist_1,
    "items": direct_hoist_20
}, []);
const direct_hoist_146 = new ObjectRuntype(undefined, {
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
const direct_hoist_147 = new ConstRuntype(undefined, "alpha");
const direct_hoist_148 = new AnyOfRuntype(undefined, [
    direct_hoist_147,
    direct_hoist_39
]);
const direct_hoist_149 = new ObjectRuntype(undefined, {
    "a": direct_hoist_0,
    "type": direct_hoist_78
}, []);
const direct_hoist_150 = new ObjectRuntype(undefined, {
    "b": direct_hoist_1,
    "type": direct_hoist_42
}, []);
const direct_hoist_151 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_149,
    direct_hoist_150
], "type", {
    "a": direct_hoist_149,
    "b": direct_hoist_150,
    "c": direct_hoist_149
}, {
    "a": direct_hoist_149,
    "b": direct_hoist_150,
    "c": direct_hoist_149
});
const direct_hoist_152 = new RefRuntype(undefined, "MutualB");
const direct_hoist_153 = new ObjectRuntype(undefined, {
    "b": new OptionalFieldRuntype(direct_hoist_152),
    "tag": direct_hoist_13
}, []);
const direct_hoist_154 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_91),
    "tag": direct_hoist_42
}, []);
const direct_hoist_155 = new ObjectRuntype(undefined, {
    "deep": direct_hoist_119
}, []);
const direct_hoist_156 = new ObjectRuntype(undefined, {
    "id": direct_hoist_0
}, []);
const direct_hoist_157 = new ArrayRuntype(undefined, direct_hoist_156);
const direct_hoist_158 = new ObjectRuntype(undefined, {
    "inner": direct_hoist_155,
    "list": direct_hoist_157
}, []);
const direct_hoist_159 = new ConstRuntype(undefined, "a1");
const direct_hoist_160 = new ObjectRuntype(undefined, {
    "a1": direct_hoist_0,
    "subType": direct_hoist_159,
    "type": direct_hoist_13
}, []);
const direct_hoist_161 = new ConstRuntype(undefined, "a2");
const direct_hoist_162 = new ObjectRuntype(undefined, {
    "a2": direct_hoist_0,
    "subType": direct_hoist_161,
    "type": direct_hoist_13
}, []);
const direct_hoist_163 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_160,
    direct_hoist_162
], "subType", {
    "a1": direct_hoist_160,
    "a2": direct_hoist_162
}, {
    "a1": direct_hoist_160,
    "a2": direct_hoist_162
});
const direct_hoist_164 = new ObjectRuntype(undefined, {
    "type": direct_hoist_42,
    "value": direct_hoist_1
}, []);
const direct_hoist_165 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_160,
    direct_hoist_162,
    direct_hoist_164
], "type", {
    "a": direct_hoist_163,
    "b": direct_hoist_164
}, {
    "a": direct_hoist_163,
    "b": direct_hoist_164
});
const direct_hoist_166 = new NumberWithFormatRuntype(undefined, [
    "NonNegative"
]);
const direct_hoist_167 = new ObjectRuntype(undefined, {}, [
    {
        "key": new NumberKeyRuntype(undefined),
        "value": direct_hoist_2
    }
]);
const direct_hoist_168 = new ObjectRuntype(undefined, {
    "b": direct_hoist_1
}, []);
const direct_hoist_169 = new ObjectRuntype(undefined, {
    "a": direct_hoist_0,
    "type": direct_hoist_13
}, []);
const direct_hoist_170 = new ConstRuntype(undefined, "d");
const direct_hoist_171 = new ObjectRuntype(undefined, {
    "d": direct_hoist_1,
    "type": new OptionalFieldRuntype(direct_hoist_170)
}, []);
const direct_hoist_172 = new AnyOfRuntype(undefined, [
    direct_hoist_169,
    direct_hoist_171
]);
const direct_hoist_173 = new AnyOfRuntype(undefined, [
    direct_hoist_3,
    direct_hoist_0
]);
const direct_hoist_174 = new AnyOfRuntype(undefined, [
    direct_hoist_4,
    direct_hoist_0
]);
const direct_hoist_175 = new AnyOfRuntype(undefined, [
    direct_hoist_5,
    direct_hoist_0
]);
const direct_hoist_176 = new ObjectRuntype(undefined, {
    "nul": direct_hoist_173,
    "opt": new OptionalFieldRuntype(direct_hoist_0),
    "req": direct_hoist_0,
    "undef": direct_hoist_174,
    "voided": direct_hoist_175
}, []);
const direct_hoist_177 = new ObjectRuntype(undefined, {
    "first": direct_hoist_1,
    "second": direct_hoist_0
}, []);
const direct_hoist_178 = new ObjectRuntype(undefined, {
    "first": direct_hoist_1,
    "second": direct_hoist_2
}, []);
const direct_hoist_179 = new ConstRuntype(undefined, "__proto__");
const direct_hoist_180 = new ObjectRuntype(undefined, {
    "c": direct_hoist_2,
    "kind": direct_hoist_179
}, []);
const direct_hoist_181 = new ConstRuntype(undefined, "constructor");
const direct_hoist_182 = new ObjectRuntype(undefined, {
    "b": direct_hoist_1,
    "kind": direct_hoist_181
}, []);
const direct_hoist_183 = new ConstRuntype(undefined, "toString");
const direct_hoist_184 = new ObjectRuntype(undefined, {
    "a": direct_hoist_0,
    "kind": direct_hoist_183
}, []);
const direct_hoist_185 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_184,
    direct_hoist_182,
    direct_hoist_180
], "kind", {
    "__proto__": direct_hoist_180,
    "constructor": direct_hoist_182,
    "toString": direct_hoist_184
}, {
    "__proto__": direct_hoist_180,
    "constructor": direct_hoist_182,
    "toString": direct_hoist_184
});
const direct_hoist_186 = new NumberWithFormatRuntype(undefined, [
    "NonNegative",
    "Rate"
]);
const direct_hoist_187 = new ArrayRuntype(undefined, direct_hoist_92);
const direct_hoist_188 = new AnyOfRuntype(undefined, [
    direct_hoist_0,
    direct_hoist_187
]);
const direct_hoist_189 = new AnyOfRuntype(undefined, [
    direct_hoist_3,
    direct_hoist_95
]);
const direct_hoist_190 = new TupleRuntype(undefined, [
    direct_hoist_1,
    direct_hoist_189
], null);
const direct_hoist_191 = new ArrayRuntype(undefined, direct_hoist_94);
const direct_hoist_192 = new AnyOfRuntype(undefined, [
    direct_hoist_0,
    direct_hoist_1,
    direct_hoist_191
]);
const direct_hoist_193 = new ObjectRuntype(undefined, {
    "child": direct_hoist_93
}, []);
const direct_hoist_194 = new AnyOfRuntype(undefined, [
    direct_hoist_3,
    direct_hoist_1,
    direct_hoist_193
]);
const direct_hoist_195 = new ConstRuntype(undefined, "circle");
const direct_hoist_196 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_195,
    "radius": direct_hoist_1
}, []);
const direct_hoist_197 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_74,
    direct_hoist_196,
    direct_hoist_76
], "kind", {
    "circle": direct_hoist_196,
    "rect": direct_hoist_74,
    "square": direct_hoist_76
}, {
    "circle": direct_hoist_196,
    "rect": direct_hoist_74,
    "square": direct_hoist_76
});
const direct_hoist_198 = new AnyOfConstsRuntype(undefined, [
    "circle",
    "rect",
    "square"
]);
const direct_hoist_199 = new ObjectRuntype(undefined, {
    "a": direct_hoist_1
}, [
    {
        "key": direct_hoist_36,
        "value": direct_hoist_1
    }
]);
const direct_hoist_200 = new ArrayRuntype(undefined, direct_hoist_88);
const direct_hoist_201 = new ObjectRuntype(undefined, {
    "children": direct_hoist_200,
    "name": direct_hoist_0
}, []);
const direct_hoist_202 = new StringWithFormatRuntype(undefined, [
    "UserId"
]);
const direct_hoist_203 = new ArrayRuntype(undefined, direct_hoist_2);
const direct_hoist_204 = new ObjectRuntype(undefined, {
    "a": direct_hoist_2,
    "b": direct_hoist_203
}, []);
const direct_hoist_205 = new ConstRuntype(undefined, "red");
const namedRuntypes = {
    "AdminId": direct_hoist_116,
    "Base": direct_hoist_117,
    "Box_string": direct_hoist_118,
    "Box_number": direct_hoist_119,
    "Box_Box__number__": direct_hoist_121,
    "Color": direct_hoist_122,
    "Expr": direct_hoist_129,
    "GenericRecursive_string": direct_hoist_131,
    "IA": direct_hoist_132,
    "IB": direct_hoist_133,
    "IntersectionUnion": direct_hoist_139,
    "Json": direct_hoist_142,
    "LinkedList": direct_hoist_144,
    "ListOf_number": direct_hoist_145,
    "ManyFields": direct_hoist_146,
    "MetaKey": direct_hoist_148,
    "MultiValueDiscriminated": direct_hoist_151,
    "MutualA": direct_hoist_153,
    "MutualB": direct_hoist_154,
    "Nested": direct_hoist_158,
    "NestedDiscriminated": direct_hoist_165,
    "NonNegative": direct_hoist_166,
    "NumberKeyedObj": direct_hoist_167,
    "ObjA": direct_hoist_132,
    "ObjB": direct_hoist_168,
    "OptionalDiscriminated": direct_hoist_172,
    "Optionals": direct_hoist_176,
    "Pair_number": direct_hoist_177,
    "Pair_instance_3": direct_hoist_178,
    "ProtoDiscriminated": direct_hoist_185,
    "Rate": direct_hoist_186,
    "RecursiveFirst": direct_hoist_188,
    "RecursiveInTuple": direct_hoist_190,
    "RecursiveLast": direct_hoist_192,
    "RecursiveMiddle": direct_hoist_194,
    "Shape": direct_hoist_197,
    "ShapeKind": direct_hoist_198,
    "TplIndexWithProps": direct_hoist_199,
    "Tree": direct_hoist_201,
    "UserId": direct_hoist_202,
    "WithDefault_boolean": direct_hoist_204,
    "Color__Red": direct_hoist_205
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
    "StringArray": new GeneratedRuntype(direct_hoist_19, v19),
    "ReadonlyNumberArray": new GeneratedRuntype(direct_hoist_20, v20),
    "NestedArray": new GeneratedRuntype(direct_hoist_21, v21),
    "Tuple": direct_hoist_22,
    "TupleRest": direct_hoist_23,
    "ReadonlyTuple": direct_hoist_24,
    "Empty": new GeneratedRuntype(direct_hoist_25, v25),
    "Nested": new GeneratedRuntype(direct_hoist_26, v158),
    "ManyFields": new GeneratedRuntype(direct_hoist_27, v146),
    "Optionals": new GeneratedRuntype(direct_hoist_28, v176),
    "ProtoKeyObject": direct_hoist_29,
    "StringRecord": direct_hoist_30,
    "NumberRecord": direct_hoist_31,
    "NumberKeyedObj": direct_hoist_32,
    "LiteralKeyRecord": new GeneratedRuntype(direct_hoist_33, v33),
    "NumberLiteralKeyRecord": new GeneratedRuntype(direct_hoist_34, v34),
    "PartialRecord": new GeneratedRuntype(direct_hoist_35, v35),
    "TplRecord": direct_hoist_37,
    "TplIndexWithProps": direct_hoist_38,
    "MetaRecord": direct_hoist_40,
    "MappedType": new GeneratedRuntype(direct_hoist_44, v44),
    "PrimitiveUnion": direct_hoist_45,
    "ObjectUnion": new GeneratedRuntype(direct_hoist_48, v48),
    "MixedUnion": new GeneratedRuntype(direct_hoist_49, v49),
    "Shape": new GeneratedRuntype(direct_hoist_50, v197),
    "NestedDiscriminated": new GeneratedRuntype(direct_hoist_51, v165),
    "ProtoDiscriminated": direct_hoist_52,
    "MultiValueDiscriminated": new GeneratedRuntype(direct_hoist_53, v151),
    "OptionalDiscriminated": new GeneratedRuntype(direct_hoist_54, v172),
    "MapOrSetUnion": new GeneratedRuntype(direct_hoist_57, v57),
    "Intersection": direct_hoist_60,
    "IntersectionNested": direct_hoist_64,
    "IntersectionIndex": direct_hoist_67,
    "IntersectionTplIndex": direct_hoist_68,
    "IntersectionUnion": direct_hoist_69,
    "OmitT": new GeneratedRuntype(direct_hoist_70, v70),
    "PickT": new GeneratedRuntype(direct_hoist_70, v70),
    "PartialT": new GeneratedRuntype(direct_hoist_71, v71),
    "RequiredT": new GeneratedRuntype(direct_hoist_72, v72),
    "ExcludeT": new GeneratedRuntype(direct_hoist_77, v77),
    "ExcludeLit": direct_hoist_78,
    "KeyofT": direct_hoist_12,
    "IndexedAccess": direct_hoist_79,
    "BoxString": new GeneratedRuntype(direct_hoist_80, v118),
    "BoxBox": new GeneratedRuntype(direct_hoist_81, v121),
    "PairDefault": new GeneratedRuntype(direct_hoist_82, v177),
    "PairExplicit": new GeneratedRuntype(direct_hoist_83, v178),
    "ListOfDefault": new GeneratedRuntype(direct_hoist_84, v145),
    "WithDefault": new GeneratedRuntype(direct_hoist_85, v204),
    "GenericRecursive": new GeneratedRuntype(direct_hoist_86, v131),
    "LinkedList": new GeneratedRuntype(direct_hoist_87, v144),
    "Tree": new GeneratedRuntype(direct_hoist_88, v201),
    "Json": new GeneratedRuntype(direct_hoist_89, v142),
    "Expr": new GeneratedRuntype(direct_hoist_90, v129),
    "MutualA": new GeneratedRuntype(direct_hoist_91, v153),
    "RecursiveFirst": new GeneratedRuntype(direct_hoist_92, v188),
    "RecursiveMiddle": new GeneratedRuntype(direct_hoist_93, v194),
    "RecursiveLast": new GeneratedRuntype(direct_hoist_94, v192),
    "RecursiveInTuple": direct_hoist_95,
    "TplPrefix": direct_hoist_96,
    "TplNumber": direct_hoist_97,
    "TplVersion": direct_hoist_98,
    "TplSize": direct_hoist_99,
    "TplLitUnion": direct_hoist_100,
    "TplBoolean": direct_hoist_101,
    "TplString": direct_hoist_102,
    "TplEnum": direct_hoist_103,
    "UserId": direct_hoist_104,
    "AdminId": direct_hoist_105,
    "NonNegative": direct_hoist_106,
    "Rate": direct_hoist_107,
    "FormatsInObject": new GeneratedRuntype(direct_hoist_108, v108),
    "MapT": direct_hoist_55,
    "SetT": direct_hoist_56,
    "MapInObject": new GeneratedRuntype(direct_hoist_110, v110),
    "Uint8ArrayT": direct_hoist_111,
    "Int32ArrayT": direct_hoist_112,
    "Float64ArrayT": direct_hoist_113,
    "BigInt64ArrayT": direct_hoist_114,
    "DateInObject": new GeneratedRuntype(direct_hoist_115, v115)
};
function v19(c,i){if(!Array.isArray(i))return false;for(let k=0;k<i.length;k++)if(!(typeof i[k]=="string"))return false;return true}
function v20(c,i){if(!Array.isArray(i))return false;for(let k=0;k<i.length;k++)if(!(typeof i[k]=="number"))return false;return true}
function v21(c,i){if(!Array.isArray(i))return false;for(let k=0;k<i.length;k++)if(!(v20(c,i[k])))return false;return true}
function v25(c,i){return isObj(i)&&direct_hoist_25.noExtraKeys(c,i)}
function v33(c,i){return isObj(i)&&typeof i.x=="number"&&typeof i.y=="number"&&direct_hoist_33.noExtraKeys(c,i)}
function v34(c,i){return isObj(i)&&typeof i["1"]=="string"&&typeof i["2"]=="string"&&direct_hoist_34.noExtraKeys(c,i)}
function v35(c,i){return isObj(i)&&(i.x==null||typeof i.x=="number")&&(i.y==null||typeof i.y=="number")&&direct_hoist_35.noExtraKeys(c,i)}
function v41(c,i){return isObj(i)&&i.value==="a"&&direct_hoist_41.noExtraKeys(c,i)}
function v43(c,i){return isObj(i)&&i.value==="b"&&direct_hoist_43.noExtraKeys(c,i)}
function v44(c,i){return isObj(i)&&v41(c,i.a)&&v43(c,i.b)&&direct_hoist_44.noExtraKeys(c,i)}
function v48(c,i){return v132(c,i)||v168(c,i)}
function v49(c,i){return i==null||typeof i=="string"||v20(c,i)||v132(c,i)}
function v57(c,i){return i==null||direct_hoist_55.validate(c,i)||direct_hoist_56.validate(c,i)}
function v70(c,i){return isObj(i)&&typeof i.a=="string"&&(i.c==null||typeof i.c=="boolean")&&direct_hoist_70.noExtraKeys(c,i)}
function v71(c,i){return isObj(i)&&(i.a==null||typeof i.a=="string")&&(i.b==null||typeof i.b=="number")&&(i.c==null||typeof i.c=="boolean")&&direct_hoist_71.noExtraKeys(c,i)}
function v72(c,i){return isObj(i)&&typeof i.a=="string"&&typeof i.b=="number"&&typeof i.c=="boolean"&&direct_hoist_72.noExtraKeys(c,i)}
function v74(c,i){return isObj(i)&&typeof i.h=="number"&&i.kind==="rect"&&typeof i.w=="number"&&direct_hoist_74.noExtraKeys(c,i)}
function v76(c,i){return isObj(i)&&i.kind==="square"&&typeof i.size=="number"&&direct_hoist_76.noExtraKeys(c,i)}
function v77(c,i){switch(discKey(i,"kind")){case "rect":return v74(c,i);case "square":return v76(c,i)}return false}
function v108(c,i){return isObj(i)&&direct_hoist_202.validate(c,i.id)&&direct_hoist_186.validate(c,i.rate)&&direct_hoist_108.noExtraKeys(c,i)}
function v110(c,i){return isObj(i)&&direct_hoist_109.validate(c,i.m)&&direct_hoist_110.noExtraKeys(c,i)}
function v115(c,i){return isObj(i)&&direct_hoist_8.validate(c,i.at)&&direct_hoist_7.validate(c,i.big)&&direct_hoist_115.noExtraKeys(c,i)}
function v118(c,i){return isObj(i)&&typeof i.value=="string"&&direct_hoist_118.noExtraKeys(c,i)}
function v119(c,i){return isObj(i)&&typeof i.value=="number"&&direct_hoist_119.noExtraKeys(c,i)}
function v121(c,i){return isObj(i)&&v119(c,i.value)&&direct_hoist_121.noExtraKeys(c,i)}
function v124(c,i){return isObj(i)&&v129(c,i.left)&&i.op==="add"&&v129(c,i.right)&&direct_hoist_124.noExtraKeys(c,i)}
function v126(c,i){return isObj(i)&&v129(c,i.arg)&&i.op==="neg"&&direct_hoist_126.noExtraKeys(c,i)}
function v128(c,i){return isObj(i)&&i.op==="num"&&typeof i.value=="number"&&direct_hoist_128.noExtraKeys(c,i)}
function v129(c,i){switch(discKey(i,"op")){case "add":return v124(c,i);case "neg":return v126(c,i);case "num":return v128(c,i)}return false}
function v130(c,i){if(!Array.isArray(i))return false;for(let k=0;k<i.length;k++)if(!(v131(c,i[k])))return false;return true}
function v131(c,i){return isObj(i)&&v130(c,i.children)&&typeof i.value=="string"&&direct_hoist_131.noExtraKeys(c,i)}
function v132(c,i){return isObj(i)&&typeof i.a=="string"&&direct_hoist_132.noExtraKeys(c,i)}
function v141(c,i){if(!Array.isArray(i))return false;for(let k=0;k<i.length;k++)if(!(v142(c,i[k])))return false;return true}
function v142(c,i){return i==null||typeof i=="boolean"||typeof i=="string"||typeof i=="number"||direct_hoist_140.validate(c,i)||v141(c,i)}
function v143(c,i){return i==null||v144(c,i)}
function v144(c,i){return isObj(i)&&v143(c,i.next)&&typeof i.value=="number"&&direct_hoist_144.noExtraKeys(c,i)}
function v145(c,i){return isObj(i)&&typeof i.item=="number"&&v20(c,i.items)&&direct_hoist_145.noExtraKeys(c,i)}
function v146(c,i){return isObj(i)&&typeof i.f01=="string"&&typeof i.f02=="number"&&typeof i.f03=="boolean"&&typeof i.f04=="string"&&typeof i.f05=="number"&&typeof i.f06=="boolean"&&typeof i.f07=="string"&&typeof i.f08=="number"&&typeof i.f09=="boolean"&&typeof i.f10=="string"&&typeof i.f11=="number"&&typeof i.f12=="boolean"&&typeof i.f13=="string"&&typeof i.f14=="number"&&typeof i.f15=="boolean"&&typeof i.f16=="string"&&typeof i.f17=="number"&&typeof i.f18=="boolean"&&typeof i.f19=="string"&&typeof i.f20=="number"&&direct_hoist_146.noExtraKeys(c,i)}
function v149(c,i){return isObj(i)&&typeof i.a=="string"&&direct_hoist_78.validate(c,i.type)&&direct_hoist_149.noExtraKeys(c,i)}
function v150(c,i){return isObj(i)&&typeof i.b=="number"&&i.type==="b"&&direct_hoist_150.noExtraKeys(c,i)}
function v151(c,i){switch(discKey(i,"type")){case "a":return v149(c,i);case "b":return v150(c,i);case "c":return v149(c,i)}return false}
function v153(c,i){return isObj(i)&&(i.b==null||v154(c,i.b))&&i.tag==="a"&&direct_hoist_153.noExtraKeys(c,i)}
function v154(c,i){return isObj(i)&&(i.a==null||v153(c,i.a))&&i.tag==="b"&&direct_hoist_154.noExtraKeys(c,i)}
function v155(c,i){return isObj(i)&&v119(c,i.deep)&&direct_hoist_155.noExtraKeys(c,i)}
function v156(c,i){return isObj(i)&&typeof i.id=="string"&&direct_hoist_156.noExtraKeys(c,i)}
function v157(c,i){if(!Array.isArray(i))return false;for(let k=0;k<i.length;k++)if(!(v156(c,i[k])))return false;return true}
function v158(c,i){return isObj(i)&&v155(c,i.inner)&&v157(c,i.list)&&direct_hoist_158.noExtraKeys(c,i)}
function v160(c,i){return isObj(i)&&typeof i.a1=="string"&&i.subType==="a1"&&i.type==="a"&&direct_hoist_160.noExtraKeys(c,i)}
function v162(c,i){return isObj(i)&&typeof i.a2=="string"&&i.subType==="a2"&&i.type==="a"&&direct_hoist_162.noExtraKeys(c,i)}
function v163(c,i){switch(discKey(i,"subType")){case "a1":return v160(c,i);case "a2":return v162(c,i)}return false}
function v164(c,i){return isObj(i)&&i.type==="b"&&typeof i.value=="number"&&direct_hoist_164.noExtraKeys(c,i)}
function v165(c,i){switch(discKey(i,"type")){case "a":return v163(c,i);case "b":return v164(c,i)}return false}
function v168(c,i){return isObj(i)&&typeof i.b=="number"&&direct_hoist_168.noExtraKeys(c,i)}
function v169(c,i){return isObj(i)&&typeof i.a=="string"&&i.type==="a"&&direct_hoist_169.noExtraKeys(c,i)}
function v171(c,i){return isObj(i)&&typeof i.d=="number"&&(i.type==null||i.type==="d")&&direct_hoist_171.noExtraKeys(c,i)}
function v172(c,i){return v169(c,i)||v171(c,i)}
function v176(c,i){return isObj(i)&&(i.nul==null||typeof i.nul=="string")&&(i.opt==null||typeof i.opt=="string")&&typeof i.req=="string"&&(i.undef==null||typeof i.undef=="string")&&(i.voided==null||typeof i.voided=="string")&&direct_hoist_176.noExtraKeys(c,i)}
function v177(c,i){return isObj(i)&&typeof i.first=="number"&&typeof i.second=="string"&&direct_hoist_177.noExtraKeys(c,i)}
function v178(c,i){return isObj(i)&&typeof i.first=="number"&&typeof i.second=="boolean"&&direct_hoist_178.noExtraKeys(c,i)}
function v187(c,i){if(!Array.isArray(i))return false;for(let k=0;k<i.length;k++)if(!(v188(c,i[k])))return false;return true}
function v188(c,i){return typeof i=="string"||v187(c,i)}
function v191(c,i){if(!Array.isArray(i))return false;for(let k=0;k<i.length;k++)if(!(v192(c,i[k])))return false;return true}
function v192(c,i){return typeof i=="string"||typeof i=="number"||v191(c,i)}
function v193(c,i){return isObj(i)&&v194(c,i.child)&&direct_hoist_193.noExtraKeys(c,i)}
function v194(c,i){return i==null||typeof i=="number"||v193(c,i)}
function v196(c,i){return isObj(i)&&i.kind==="circle"&&typeof i.radius=="number"&&direct_hoist_196.noExtraKeys(c,i)}
function v197(c,i){switch(discKey(i,"kind")){case "circle":return v196(c,i);case "rect":return v74(c,i);case "square":return v76(c,i)}return false}
function v200(c,i){if(!Array.isArray(i))return false;for(let k=0;k<i.length;k++)if(!(v201(c,i[k])))return false;return true}
function v201(c,i){return isObj(i)&&v200(c,i.children)&&typeof i.name=="string"&&direct_hoist_201.noExtraKeys(c,i)}
function v203(c,i){if(!Array.isArray(i))return false;for(let k=0;k<i.length;k++)if(!(typeof i[k]=="boolean"))return false;return true}
function v204(c,i){return isObj(i)&&typeof i.a=="boolean"&&v203(c,i.b)&&direct_hoist_204.noExtraKeys(c,i)}

export default { buildParsers };