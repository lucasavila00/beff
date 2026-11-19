//@ts-nocheck

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
  RefRuntype,
  TypedArrayRuntype,
  MapRuntype,
  SetRuntype,
  NumberKeyRuntype,
  buildParsers,
} from "@beff/client/codegen-v2";
const RequiredStringFormats = ["UserId","AdminId"];
const RequiredNumberFormats = ["NonNegative","Rate"];
const namedRuntypes = {};
const stringFormatters = {};
const numberFormatters = {};
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
const direct_hoist_17 = new RefRuntype(undefined, "Color", namedRuntypes);
const direct_hoist_18 = new RefRuntype(undefined, "Color__Red", namedRuntypes);
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
const direct_hoist_26 = new RefRuntype(undefined, "Nested", namedRuntypes);
const direct_hoist_27 = new RefRuntype(undefined, "ManyFields", namedRuntypes);
const direct_hoist_28 = new RefRuntype(undefined, "Optionals", namedRuntypes);
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
const direct_hoist_32 = new RefRuntype(undefined, "NumberKeyedObj", namedRuntypes);
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
const direct_hoist_38 = new RefRuntype(undefined, "TplIndexWithProps", namedRuntypes);
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
const direct_hoist_46 = new RefRuntype(undefined, "ObjA", namedRuntypes);
const direct_hoist_47 = new RefRuntype(undefined, "ObjB", namedRuntypes);
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
const direct_hoist_50 = new RefRuntype(undefined, "Shape", namedRuntypes);
const direct_hoist_51 = new RefRuntype(undefined, "NestedDiscriminated", namedRuntypes);
const direct_hoist_52 = new RefRuntype(undefined, "ProtoDiscriminated", namedRuntypes);
const direct_hoist_53 = new RefRuntype(undefined, "MultiValueDiscriminated", namedRuntypes);
const direct_hoist_54 = new RefRuntype(undefined, "OptionalDiscriminated", namedRuntypes);
const direct_hoist_55 = new MapRuntype(undefined, direct_hoist_0, direct_hoist_1);
const direct_hoist_56 = new SetRuntype(undefined, direct_hoist_0);
const direct_hoist_57 = new AnyOfRuntype(undefined, [
    direct_hoist_3,
    direct_hoist_55,
    direct_hoist_56
]);
const direct_hoist_58 = new RefRuntype(undefined, "IA", namedRuntypes);
const direct_hoist_59 = new RefRuntype(undefined, "IB", namedRuntypes);
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
const direct_hoist_69 = new RefRuntype(undefined, "IntersectionUnion", namedRuntypes);
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
const direct_hoist_79 = new RefRuntype(undefined, "ShapeKind", namedRuntypes);
const direct_hoist_80 = new RefRuntype(undefined, "Box_string", namedRuntypes);
const direct_hoist_81 = new RefRuntype(undefined, "Box_Box__number__", namedRuntypes);
const direct_hoist_82 = new RefRuntype(undefined, "Pair_number", namedRuntypes);
const direct_hoist_83 = new RefRuntype(undefined, "Pair_instance_3", namedRuntypes);
const direct_hoist_84 = new RefRuntype(undefined, "ListOf_number", namedRuntypes);
const direct_hoist_85 = new RefRuntype(undefined, "WithDefault_boolean", namedRuntypes);
const direct_hoist_86 = new RefRuntype(undefined, "GenericRecursive_string", namedRuntypes);
const direct_hoist_87 = new RefRuntype(undefined, "LinkedList", namedRuntypes);
const direct_hoist_88 = new RefRuntype(undefined, "Tree", namedRuntypes);
const direct_hoist_89 = new RefRuntype(undefined, "Json", namedRuntypes);
const direct_hoist_90 = new RefRuntype(undefined, "Expr", namedRuntypes);
const direct_hoist_91 = new RefRuntype(undefined, "MutualA", namedRuntypes);
const direct_hoist_92 = new RefRuntype(undefined, "RecursiveFirst", namedRuntypes);
const direct_hoist_93 = new RefRuntype(undefined, "RecursiveMiddle", namedRuntypes);
const direct_hoist_94 = new RefRuntype(undefined, "RecursiveLast", namedRuntypes);
const direct_hoist_95 = new RefRuntype(undefined, "RecursiveInTuple", namedRuntypes);
const direct_hoist_96 = new RegexRuntype(undefined, /^(a)([\s\S]*)$/, "`a${string}`");
const direct_hoist_97 = new RegexRuntype(undefined, /^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}`");
const direct_hoist_98 = new RegexRuntype(undefined, /^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}.${number}.${number}`");
const direct_hoist_99 = new RegexRuntype(undefined, /^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(x)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}x${number}`");
const direct_hoist_100 = new RegexRuntype(undefined, /^((a)|(b))(-)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, '`("a" | "b")-${number}`');
const direct_hoist_101 = new RegexRuntype(undefined, /^(true|false)$/, "`${boolean}`");
const direct_hoist_102 = new RegexRuntype(undefined, /^([\s\S]*)$/, "`${string}`");
const direct_hoist_103 = new RegexRuntype(undefined, /^((green)|(red))$/, '`("green" | "red")`');
const direct_hoist_104 = new RefRuntype(undefined, "UserId", namedRuntypes);
const direct_hoist_105 = new RefRuntype(undefined, "AdminId", namedRuntypes);
const direct_hoist_106 = new RefRuntype(undefined, "NonNegative", namedRuntypes);
const direct_hoist_107 = new RefRuntype(undefined, "Rate", namedRuntypes);
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
], stringFormatters);
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
const direct_hoist_120 = new RefRuntype(undefined, "Box_number", namedRuntypes);
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
const direct_hoist_152 = new RefRuntype(undefined, "MutualB", namedRuntypes);
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
], numberFormatters);
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
    ["__proto__"]: direct_hoist_180,
    "constructor": direct_hoist_182,
    "toString": direct_hoist_184
}, {
    ["__proto__"]: direct_hoist_180,
    "constructor": direct_hoist_182,
    "toString": direct_hoist_184
});
const direct_hoist_186 = new NumberWithFormatRuntype(undefined, [
    "NonNegative",
    "Rate"
], numberFormatters);
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
], stringFormatters);
const direct_hoist_203 = new ArrayRuntype(undefined, direct_hoist_2);
const direct_hoist_204 = new ObjectRuntype(undefined, {
    "a": direct_hoist_2,
    "b": direct_hoist_203
}, []);
const direct_hoist_205 = new ConstRuntype(undefined, "red");
Object.assign(namedRuntypes, {
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
});
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
    "OmitT": direct_hoist_70,
    "PickT": direct_hoist_70,
    "PartialT": direct_hoist_71,
    "RequiredT": direct_hoist_72,
    "ExcludeT": direct_hoist_77,
    "ExcludeLit": direct_hoist_78,
    "KeyofT": direct_hoist_12,
    "IndexedAccess": direct_hoist_79,
    "BoxString": direct_hoist_80,
    "BoxBox": direct_hoist_81,
    "PairDefault": direct_hoist_82,
    "PairExplicit": direct_hoist_83,
    "ListOfDefault": direct_hoist_84,
    "WithDefault": direct_hoist_85,
    "GenericRecursive": direct_hoist_86,
    "LinkedList": direct_hoist_87,
    "Tree": direct_hoist_88,
    "Json": direct_hoist_89,
    "Expr": direct_hoist_90,
    "MutualA": direct_hoist_91,
    "RecursiveFirst": direct_hoist_92,
    "RecursiveMiddle": direct_hoist_93,
    "RecursiveLast": direct_hoist_94,
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
    "FormatsInObject": direct_hoist_108,
    "MapT": direct_hoist_55,
    "SetT": direct_hoist_56,
    "MapInObject": direct_hoist_110,
    "Uint8ArrayT": direct_hoist_111,
    "Int32ArrayT": direct_hoist_112,
    "Float64ArrayT": direct_hoist_113,
    "BigInt64ArrayT": direct_hoist_114,
    "DateInObject": direct_hoist_115
};

export default {
  buildParsers: (args) =>
    buildParsers(
      {
        parsers: buildParsersInput,
        stringFormatters,
        numberFormatters,
        requiredStringFormats: RequiredStringFormats,
        requiredNumberFormats: RequiredNumberFormats,
      },
      args,
    ),
};