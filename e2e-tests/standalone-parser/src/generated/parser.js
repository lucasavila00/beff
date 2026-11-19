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

const RequiredStringFormats = ["ValidCurrency","UserId","ReadAuthorizedUserId","WriteAuthorizedUserId"];
const RequiredNumberFormats = ["NonNegativeNumber","NonInfiniteNumber","Rate"];
const direct_hoist_0 = new RefRuntype(undefined, "Intersection");
const direct_hoist_1 = new RefRuntype(undefined, "IntersectionPartial");
const direct_hoist_2 = new RefRuntype(undefined, "IntersectionOmitPick");
const direct_hoist_3 = new RefRuntype(undefined, "IntersectionNested");
const direct_hoist_4 = new RefRuntype(undefined, "IntersectionIndex");
const direct_hoist_5 = new RefRuntype(undefined, "IntersectionUnion");
const direct_hoist_6 = new RefRuntype(undefined, "IntersectionTplIndex");
const direct_hoist_7 = new RefRuntype(undefined, "IntersectionTwoTplIndexes");
const direct_hoist_8 = new RefRuntype(undefined, "TplRecord");
const direct_hoist_9 = new RefRuntype(undefined, "Repro5");
const direct_hoist_10 = new RefRuntype(undefined, "Repro6");
const direct_hoist_11 = new RefRuntype(undefined, "M1");
const direct_hoist_12 = new RefRuntype(undefined, "S1");
const direct_hoist_13 = new RefRuntype(undefined, "PartialRepro");
const direct_hoist_14 = new RefRuntype(undefined, "TransportedValue");
const direct_hoist_15 = new RefRuntype(undefined, "OnlyAKey");
const direct_hoist_16 = new TypeofRuntype(undefined, "string");
const direct_hoist_17 = new ArrayRuntype(undefined, direct_hoist_16);
const direct_hoist_18 = new ObjectRuntype(undefined, {
    "a": direct_hoist_17
}, []);
const direct_hoist_19 = new BigIntRuntype(undefined);
const direct_hoist_20 = new TypeofRuntype(undefined, "number");
const direct_hoist_21 = new TupleRuntype(undefined, [
    direct_hoist_20,
    direct_hoist_20,
    direct_hoist_20
], null);
const direct_hoist_22 = new TupleRuntype(undefined, [
    direct_hoist_20,
    direct_hoist_20
], direct_hoist_16);
const direct_hoist_23 = new RefRuntype(undefined, "AllTs");
const direct_hoist_24 = new RefRuntype(undefined, "AObject");
const direct_hoist_25 = new RefRuntype(undefined, "Version");
const direct_hoist_26 = new RefRuntype(undefined, "Version2");
const direct_hoist_27 = new RefRuntype(undefined, "PrefixedString");
const direct_hoist_28 = new RefRuntype(undefined, "KeyedNumber");
const direct_hoist_29 = new RefRuntype(undefined, "FlagTpl");
const direct_hoist_30 = new RefRuntype(undefined, "AccessLevelTpl2");
const direct_hoist_31 = new RefRuntype(undefined, "AccessLevelTpl");
const direct_hoist_32 = new RefRuntype(undefined, "Arr3");
const direct_hoist_33 = new RefRuntype(undefined, "OmitSettings");
const direct_hoist_34 = new RefRuntype(undefined, "RequiredPartialObject");
const direct_hoist_35 = new RefRuntype(undefined, "LevelAndDSettings");
const direct_hoist_36 = new RefRuntype(undefined, "PartialSettings");
const direct_hoist_37 = new RefRuntype(undefined, "Extra");
const direct_hoist_38 = new RefRuntype(undefined, "User");
const direct_hoist_39 = new RefRuntype(undefined, "PublicUser");
const direct_hoist_40 = new RefRuntype(undefined, "Req");
const direct_hoist_41 = new RefRuntype(undefined, "Repro1");
const direct_hoist_42 = new RefRuntype(undefined, "SettingsUpdate");
const direct_hoist_43 = new RefRuntype(undefined, "Mapped");
const direct_hoist_44 = new RefRuntype(undefined, "MappedOptional");
const direct_hoist_45 = new RefRuntype(undefined, "PartialObject");
const direct_hoist_46 = new RefRuntype(undefined, "DiscriminatedUnion");
const direct_hoist_47 = new RefRuntype(undefined, "DiscriminatedUnion2");
const direct_hoist_48 = new RefRuntype(undefined, "DiscriminatedUnion3");
const direct_hoist_49 = new RefRuntype(undefined, "DiscriminatedUnion4");
const direct_hoist_50 = new RefRuntype(undefined, "AllTypes");
const direct_hoist_51 = new RefRuntype(undefined, "AccessLevel");
const direct_hoist_52 = new RefRuntype(undefined, "OtherEnum");
const direct_hoist_53 = new RefRuntype(undefined, "Arr2");
const direct_hoist_54 = new RefRuntype(undefined, "ValidCurrency");
const direct_hoist_55 = new RefRuntype(undefined, "UnionWithEnumAccess");
const direct_hoist_56 = new RefRuntype(undefined, "T3");
const direct_hoist_57 = new RefRuntype(undefined, "AvatarSize");
const direct_hoist_58 = new RefRuntype(undefined, "BObject");
const direct_hoist_59 = new ConstRuntype(undefined, "a");
const direct_hoist_60 = new ObjectRuntype(undefined, {
    "A": direct_hoist_59
}, []);
const direct_hoist_61 = new RefRuntype(undefined, "KDEF");
const direct_hoist_62 = new RefRuntype(undefined, "KABC");
const direct_hoist_63 = new RefRuntype(undefined, "K");
const direct_hoist_64 = new RefRuntype(undefined, "NonNegativeNumber");
const direct_hoist_65 = new RefRuntype(undefined, "NonInfiniteNumber");
const direct_hoist_66 = new RefRuntype(undefined, "Rate");
const direct_hoist_67 = new RefRuntype(undefined, "UserId");
const direct_hoist_68 = new RefRuntype(undefined, "ReadAuthorizedUserId");
const direct_hoist_69 = new RefRuntype(undefined, "WriteAuthorizedUserId");
const direct_hoist_70 = new RefRuntype(undefined, "CurrencyPrices");
const direct_hoist_71 = new RefRuntype(undefined, "Uint8ArrayType");
const direct_hoist_72 = new RefRuntype(undefined, "Int32ArrayType");
const direct_hoist_73 = new RefRuntype(undefined, "Float64ArrayType");
const direct_hoist_74 = new RefRuntype(undefined, "BigInt64ArrayType");
const direct_hoist_75 = new RefRuntype(undefined, "TsxTask");
const direct_hoist_76 = new RefRuntype(undefined, "Query");
const direct_hoist_77 = new RefRuntype(undefined, "DtsConfig");
const direct_hoist_78 = new RefRuntype(undefined, "DeploymentState");
const direct_hoist_79 = new AnyOfConstsRuntype(undefined, [
    "deployed",
    "failed",
    "pending"
]);
const direct_hoist_80 = new NullishRuntype(undefined, "undefined");
const direct_hoist_81 = new AnyOfConstsRuntype(undefined, [
    "asc",
    "desc"
]);
const direct_hoist_82 = new AnyOfConstsRuntype(undefined, [
    "age",
    "name"
]);
const direct_hoist_83 = new ObjectRuntype(undefined, {
    "direction": direct_hoist_81,
    "field": direct_hoist_82
}, []);
const direct_hoist_84 = new AnyOfRuntype(undefined, [
    direct_hoist_80,
    direct_hoist_83
], [
    1,
    64
]);
const direct_hoist_85 = new ObjectRuntype(undefined, {
    "orderBy": direct_hoist_84
}, []);
const direct_hoist_86 = new ObjectRuntype(undefined, {}, []);
const direct_hoist_87 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_59
}, []);
const direct_hoist_88 = new AnyOfConstsRuntype(undefined, [
    "ADMIN",
    "USER"
]);
const direct_hoist_89 = new AnyOfConstsRuntype(undefined, [
    "ADMIN Admin",
    "USER User"
]);
const direct_hoist_90 = new RegexRuntype(undefined, /^((ADMIN)|(USER))$/, '`("ADMIN" | "USER")`');
const direct_hoist_91 = new RegexRuntype(undefined, /^((ADMIN Admin)|(USER User))$/, '`("ADMIN Admin" | "USER User")`');
const direct_hoist_92 = new AnyOfConstsRuntype(undefined, [
    "LevelAndDSettings",
    "OmitSettings",
    "PartialSettings",
    "RequiredPartialObject"
]);
const direct_hoist_93 = new RegexRuntype(undefined, /^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(x)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}x${number}`");
const direct_hoist_94 = new ConstRuntype(undefined, "b");
const direct_hoist_95 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_94
}, []);
const direct_hoist_96 = new TypedArrayRuntype(undefined, "BigInt64Array");
const direct_hoist_97 = new ObjectRuntype(undefined, {
    "a": direct_hoist_16
}, []);
const direct_hoist_98 = new ConstRuntype(undefined, "a1");
const direct_hoist_99 = new ObjectRuntype(undefined, {
    "a1": direct_hoist_16,
    "a11": new OptionalFieldRuntype(direct_hoist_16),
    "subType": direct_hoist_98,
    "type": direct_hoist_59
}, []);
const direct_hoist_100 = new ConstRuntype(undefined, "a2");
const direct_hoist_101 = new ObjectRuntype(undefined, {
    "a2": direct_hoist_16,
    "subType": direct_hoist_100,
    "type": direct_hoist_59
}, []);
const direct_hoist_102 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_99,
    direct_hoist_101
], "subType", {
    "a1": direct_hoist_99,
    "a2": direct_hoist_101
}, {
    "a1": direct_hoist_99,
    "a2": direct_hoist_101
});
const direct_hoist_103 = new ObjectRuntype(undefined, {
    "type": direct_hoist_94,
    "value": direct_hoist_20
}, []);
const direct_hoist_104 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_99,
    direct_hoist_101,
    direct_hoist_103
], "type", {
    "a": direct_hoist_102,
    "b": direct_hoist_103
}, {
    "a": direct_hoist_102,
    "b": direct_hoist_103
});
const direct_hoist_105 = new ConstRuntype(undefined, "d");
const direct_hoist_106 = new ObjectRuntype(undefined, {
    "type": new OptionalFieldRuntype(direct_hoist_105),
    "valueD": direct_hoist_20
}, []);
const direct_hoist_107 = new AnyOfRuntype(undefined, [
    direct_hoist_99,
    direct_hoist_101,
    direct_hoist_106,
    direct_hoist_103
], [
    64,
    64,
    64,
    64
]);
const direct_hoist_108 = new AnyOfConstsRuntype(undefined, [
    "a",
    "c"
]);
const direct_hoist_109 = new ObjectRuntype(undefined, {
    "a1": direct_hoist_16,
    "type": direct_hoist_108
}, []);
const direct_hoist_110 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_109,
    direct_hoist_103
], "type", {
    "a": direct_hoist_109,
    "b": direct_hoist_103,
    "c": direct_hoist_109
}, {
    "a": direct_hoist_109,
    "b": direct_hoist_103,
    "c": direct_hoist_109
});
const direct_hoist_111 = new ObjectRuntype(undefined, {
    "a1": direct_hoist_16,
    "subType": direct_hoist_98
}, []);
const direct_hoist_112 = new ObjectRuntype(undefined, {
    "a": direct_hoist_111,
    "type": direct_hoist_59
}, []);
const direct_hoist_113 = new ObjectRuntype(undefined, {
    "a2": direct_hoist_16,
    "subType": direct_hoist_100
}, []);
const direct_hoist_114 = new ObjectRuntype(undefined, {
    "a": direct_hoist_113,
    "type": direct_hoist_59
}, []);
const direct_hoist_115 = new AnyOfRuntype(undefined, [
    direct_hoist_112,
    direct_hoist_114
], [
    64,
    64
]);
const direct_hoist_116 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_16,
        "value": direct_hoist_16
    }
]);
const direct_hoist_117 = new RegexRuntype(undefined, /^(true|false)$/, "`${boolean}`");
const direct_hoist_118 = new TypedArrayRuntype(undefined, "Float64Array");
const direct_hoist_119 = new ObjectRuntype(undefined, {
    "b": new OptionalFieldRuntype(direct_hoist_16)
}, []);
const direct_hoist_120 = new ObjectRuntype(undefined, {
    "a": direct_hoist_16,
    "b": direct_hoist_20,
    "c": direct_hoist_16
}, []);
const direct_hoist_121 = new ObjectRuntype(undefined, {
    "d0": direct_hoist_16,
    "e": direct_hoist_20
}, []);
const direct_hoist_122 = new TypeofRuntype(undefined, "boolean");
const direct_hoist_123 = new ObjectRuntype(undefined, {
    "a": direct_hoist_16,
    "b": direct_hoist_20,
    "z": direct_hoist_122
}, []);
const direct_hoist_124 = new TypedArrayRuntype(undefined, "Int32Array");
const direct_hoist_125 = new RefRuntype(undefined, "IA");
const direct_hoist_126 = new RefRuntype(undefined, "IB");
const direct_hoist_127 = new AllOfRuntype(undefined, [
    direct_hoist_125,
    direct_hoist_126
]);
const direct_hoist_128 = new AnyOfRuntype(undefined, [
    direct_hoist_16,
    direct_hoist_20
], [
    8,
    4
]);
const direct_hoist_129 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_16,
        "value": direct_hoist_128
    }
]);
const direct_hoist_130 = new ObjectRuntype(undefined, {
    "n": direct_hoist_20
}, []);
const direct_hoist_131 = new AllOfRuntype(undefined, [
    direct_hoist_129,
    direct_hoist_130,
    direct_hoist_125
]);
const direct_hoist_132 = new ObjectRuntype(undefined, {
    "x": direct_hoist_16
}, []);
const direct_hoist_133 = new ObjectRuntype(undefined, {
    "n": direct_hoist_132
}, []);
const direct_hoist_134 = new AllOfRuntype(undefined, [
    direct_hoist_133,
    direct_hoist_126
]);
const direct_hoist_135 = new AllOfRuntype(undefined, [
    direct_hoist_125,
    direct_hoist_134
]);
const direct_hoist_136 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_16),
    "b": new OptionalFieldRuntype(direct_hoist_20)
}, []);
const direct_hoist_137 = new ObjectRuntype(undefined, {
    "a": direct_hoist_16,
    "b": direct_hoist_20,
    "d0": direct_hoist_16,
    "e": direct_hoist_20
}, []);
const direct_hoist_138 = new AllOfRuntype(undefined, [
    direct_hoist_136,
    direct_hoist_137
]);
const direct_hoist_139 = new ObjectRuntype(undefined, {
    "c": new OptionalFieldRuntype(direct_hoist_16)
}, []);
const direct_hoist_140 = new AllOfRuntype(undefined, [
    direct_hoist_139,
    direct_hoist_125
]);
const direct_hoist_141 = new RegexRuntype(undefined, /^(x_)([\s\S]*)$/, "`x_${string}`");
const direct_hoist_142 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_141,
        "value": direct_hoist_20
    }
]);
const direct_hoist_143 = new AllOfRuntype(undefined, [
    direct_hoist_142,
    direct_hoist_125
]);
const direct_hoist_144 = new RegexRuntype(undefined, /^(y_)([\s\S]*)$/, "`y_${string}`");
const direct_hoist_145 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_144,
        "value": direct_hoist_16
    }
]);
const direct_hoist_146 = new AllOfRuntype(undefined, [
    direct_hoist_142,
    direct_hoist_145,
    direct_hoist_125
]);
const direct_hoist_147 = new ConstRuntype(undefined, "u");
const direct_hoist_148 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_147,
    "u": direct_hoist_16
}, []);
const direct_hoist_149 = new ConstRuntype(undefined, "v");
const direct_hoist_150 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_149,
    "v": new OptionalFieldRuntype(direct_hoist_20)
}, []);
const direct_hoist_151 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_148,
    direct_hoist_150
], "kind", {
    "u": direct_hoist_148,
    "v": direct_hoist_150
}, {
    "u": direct_hoist_148,
    "v": direct_hoist_150
});
const direct_hoist_152 = new AllOfRuntype(undefined, [
    direct_hoist_125,
    direct_hoist_151
]);
const direct_hoist_153 = new AnyOfConstsRuntype(undefined, [
    "a"
]);
const direct_hoist_154 = new NeverRuntype(undefined);
const direct_hoist_155 = new RegexRuntype(undefined, /^((a)|(b))(-)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, '`("a" | "b")-${number}`');
const direct_hoist_156 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_105
}, []);
const direct_hoist_157 = new AnyOfConstsRuntype(undefined, [
    "a",
    "b"
]);
const direct_hoist_158 = new ObjectRuntype(undefined, {
    "d": direct_hoist_156,
    "level": direct_hoist_157
}, []);
const direct_hoist_159 = new MapRuntype(undefined, direct_hoist_16, direct_hoist_20);
const direct_hoist_160 = new ObjectRuntype(undefined, {
    "value": direct_hoist_59
}, []);
const direct_hoist_161 = new ObjectRuntype(undefined, {
    "value": direct_hoist_94
}, []);
const direct_hoist_162 = new ObjectRuntype(undefined, {
    "a": direct_hoist_160,
    "b": direct_hoist_161
}, []);
const direct_hoist_163 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_160),
    "b": new OptionalFieldRuntype(direct_hoist_161)
}, []);
const direct_hoist_164 = new ObjectRuntype(undefined, {
    "A": direct_hoist_16
}, []);
const direct_hoist_165 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_16),
    "b": new OptionalFieldRuntype(direct_hoist_16)
}, []);
const direct_hoist_166 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_16),
    "d": new OptionalFieldRuntype(direct_hoist_156),
    "level": new OptionalFieldRuntype(direct_hoist_157)
}, []);
const direct_hoist_167 = new RegexRuntype(undefined, /^(a)([\s\S]*)$/, "`a${string}`");
const direct_hoist_168 = new ObjectRuntype(undefined, {
    "accessLevel": direct_hoist_51,
    "avatarSize": direct_hoist_57,
    "extra": direct_hoist_37,
    "name": direct_hoist_16
}, []);
const direct_hoist_169 = new RefRuntype(undefined, "Repro2");
const direct_hoist_170 = new ObjectRuntype(undefined, {
    "sizes": new OptionalFieldRuntype(direct_hoist_169)
}, []);
const direct_hoist_171 = new ObjectRuntype(undefined, {
    "useSmallerSizes": direct_hoist_122
}, []);
const direct_hoist_172 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_16,
        "value": direct_hoist_20
    }
]);
const direct_hoist_173 = new ObjectRuntype(undefined, {
    "accountEndpoints": direct_hoist_172
}, []);
const direct_hoist_174 = new ObjectRuntype(undefined, {}, [
    {
        "key": new NumberKeyRuntype(undefined),
        "value": direct_hoist_20
    }
]);
const direct_hoist_175 = new ObjectRuntype(undefined, {
    "accountEndpoints": direct_hoist_174
}, []);
const direct_hoist_176 = new ObjectRuntype(undefined, {
    "optional": direct_hoist_16
}, []);
const direct_hoist_177 = new ObjectRuntype(undefined, {
    "a": direct_hoist_16,
    "b": direct_hoist_20
}, []);
const direct_hoist_178 = new SetRuntype(undefined, direct_hoist_16);
const direct_hoist_179 = new ObjectRuntype(undefined, {
    "a": direct_hoist_16,
    "d": direct_hoist_156,
    "level": direct_hoist_157
}, []);
const direct_hoist_180 = new AnyOfRuntype(undefined, [
    direct_hoist_16,
    direct_hoist_59,
    direct_hoist_94,
    direct_hoist_156
], [
    8,
    8,
    8,
    64
]);
const direct_hoist_181 = new ConstRuntype(undefined, "circle");
const direct_hoist_182 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_181,
    "radius": direct_hoist_20
}, []);
const direct_hoist_183 = new ConstRuntype(undefined, "square");
const direct_hoist_184 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_183,
    "x": direct_hoist_20
}, []);
const direct_hoist_185 = new ConstRuntype(undefined, "triangle");
const direct_hoist_186 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_185,
    "x": direct_hoist_20,
    "y": direct_hoist_20
}, []);
const direct_hoist_187 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_182,
    direct_hoist_184,
    direct_hoist_186
], "kind", {
    "circle": direct_hoist_182,
    "square": direct_hoist_184,
    "triangle": direct_hoist_186
}, {
    "circle": direct_hoist_182,
    "square": direct_hoist_184,
    "triangle": direct_hoist_186
});
const direct_hoist_188 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_184,
    direct_hoist_186
], "kind", {
    "square": direct_hoist_184,
    "triangle": direct_hoist_186
}, {
    "square": direct_hoist_184,
    "triangle": direct_hoist_186
});
const direct_hoist_189 = new NullishRuntype(undefined, "null");
const direct_hoist_190 = new AnyOfRuntype(undefined, [
    direct_hoist_189,
    direct_hoist_80,
    direct_hoist_16,
    direct_hoist_20
], [
    1,
    1,
    8,
    4
]);
const direct_hoist_191 = new ArrayRuntype(undefined, direct_hoist_190);
const direct_hoist_192 = new AnyOfRuntype(undefined, [
    direct_hoist_189,
    direct_hoist_80,
    direct_hoist_16,
    direct_hoist_191
], [
    1,
    1,
    8,
    32
]);
const direct_hoist_193 = new TypedArrayRuntype(undefined, "Uint8Array");
const direct_hoist_194 = new RefRuntype(undefined, "OtherEnum__A");
const direct_hoist_195 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_194,
    "value": direct_hoist_16
}, []);
const direct_hoist_196 = new RefRuntype(undefined, "OtherEnum__B");
const direct_hoist_197 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_196,
    "value": direct_hoist_20
}, []);
const direct_hoist_198 = new RefRuntype(undefined, "OtherEnum2__C");
const direct_hoist_199 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_198,
    "value": direct_hoist_122
}, []);
const direct_hoist_200 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_199,
    direct_hoist_195,
    direct_hoist_197
], "tag", {
    "a": direct_hoist_195,
    "b": direct_hoist_197,
    "c": direct_hoist_199
}, {
    "a": direct_hoist_195,
    "b": direct_hoist_197,
    "c": direct_hoist_199
});
const direct_hoist_201 = new ArrayRuntype(undefined, direct_hoist_38);
const direct_hoist_202 = new ObjectRuntype(undefined, {
    "accessLevel": direct_hoist_51,
    "avatarSize": direct_hoist_57,
    "extra": direct_hoist_37,
    "friends": direct_hoist_201,
    "name": direct_hoist_16
}, []);
const direct_hoist_203 = new RegexRuntype(undefined, /^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}.${number}.${number}`");
const direct_hoist_204 = new RegexRuntype(undefined, /^(v)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`v${number}.${number}.${number}`");
const direct_hoist_205 = new ObjectRuntype(undefined, {
    "optional": new OptionalFieldRuntype(direct_hoist_16)
}, []);
const direct_hoist_206 = new RefRuntype(undefined, "DtsStatus");
const direct_hoist_207 = new ObjectRuntype(undefined, {
    "enabled": direct_hoist_122,
    "status": direct_hoist_206
}, []);
const direct_hoist_208 = new AnyOfConstsRuntype(undefined, [
    "off",
    "on"
]);
const direct_hoist_209 = new AnyOfConstsRuntype(undefined, [
    "active",
    "closed",
    "pending"
]);
const direct_hoist_210 = new RefRuntype(undefined, "TsxLabel");
const direct_hoist_211 = new ObjectRuntype(undefined, {
    "id": direct_hoist_16,
    "label": direct_hoist_210
}, []);
const direct_hoist_212 = new AnyOfConstsRuntype(undefined, [
    "A",
    "B",
    "C"
]);
const direct_hoist_213 = new AnyOfConstsRuntype(undefined, [
    "X",
    "Y"
]);
const direct_hoist_214 = new StringWithFormatRuntype(undefined, [
    "ValidCurrency"
]);
const direct_hoist_215 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_214,
        "value": direct_hoist_66
    }
]);
const direct_hoist_216 = new NumberWithFormatRuntype(undefined, [
    "NonInfiniteNumber"
]);
const direct_hoist_217 = new NumberWithFormatRuntype(undefined, [
    "NonInfiniteNumber",
    "NonNegativeNumber"
]);
const direct_hoist_218 = new NumberWithFormatRuntype(undefined, [
    "NonInfiniteNumber",
    "NonNegativeNumber",
    "Rate"
]);
const direct_hoist_219 = new StringWithFormatRuntype(undefined, [
    "UserId",
    "ReadAuthorizedUserId"
]);
const direct_hoist_220 = new StringWithFormatRuntype(undefined, [
    "UserId"
]);
const direct_hoist_221 = new StringWithFormatRuntype(undefined, [
    "UserId",
    "ReadAuthorizedUserId",
    "WriteAuthorizedUserId"
]);
const direct_hoist_222 = new ConstRuntype(undefined, "c");
const namedRuntypes = {
    "DeploymentState": direct_hoist_79,
    "Query": direct_hoist_85,
    "ABC": direct_hoist_86,
    "AObject": direct_hoist_87,
    "AccessLevel": direct_hoist_88,
    "AccessLevel2": direct_hoist_89,
    "AccessLevelTpl": direct_hoist_90,
    "AccessLevelTpl2": direct_hoist_91,
    "AllTypes": direct_hoist_92,
    "AvatarSize": direct_hoist_93,
    "BObject": direct_hoist_95,
    "BigInt64ArrayType": direct_hoist_96,
    "DEF": direct_hoist_97,
    "DiscriminatedUnion": direct_hoist_104,
    "DiscriminatedUnion2": direct_hoist_107,
    "DiscriminatedUnion3": direct_hoist_110,
    "DiscriminatedUnion4": direct_hoist_115,
    "Extra": direct_hoist_116,
    "FlagTpl": direct_hoist_117,
    "Float64ArrayType": direct_hoist_118,
    "IA": direct_hoist_97,
    "IB": direct_hoist_119,
    "IBase": direct_hoist_120,
    "IExtra": direct_hoist_121,
    "IOther": direct_hoist_123,
    "Int32ArrayType": direct_hoist_124,
    "Intersection": direct_hoist_127,
    "IntersectionIndex": direct_hoist_131,
    "IntersectionNested": direct_hoist_135,
    "IntersectionOmitPick": direct_hoist_138,
    "IntersectionPartial": direct_hoist_140,
    "IntersectionTplIndex": direct_hoist_143,
    "IntersectionTwoTplIndexes": direct_hoist_146,
    "IntersectionUnion": direct_hoist_152,
    "K": direct_hoist_153,
    "KABC": direct_hoist_154,
    "KDEF": direct_hoist_59,
    "KeyedNumber": direct_hoist_155,
    "LevelAndDSettings": direct_hoist_158,
    "M1": direct_hoist_159,
    "Mapped": direct_hoist_162,
    "MappedOptional": direct_hoist_163,
    "OmitSettings": direct_hoist_158,
    "OnlyAKey": direct_hoist_164,
    "PartialObject": direct_hoist_136,
    "PartialRepro": direct_hoist_165,
    "PartialSettings": direct_hoist_166,
    "PrefixedString": direct_hoist_167,
    "PublicUser": direct_hoist_168,
    "Repro1": direct_hoist_170,
    "Repro2": direct_hoist_171,
    "Repro5": direct_hoist_173,
    "Repro6": direct_hoist_175,
    "Req": direct_hoist_176,
    "RequiredPartialObject": direct_hoist_177,
    "S1": direct_hoist_178,
    "Settings": direct_hoist_179,
    "SettingsUpdate": direct_hoist_180,
    "Shape": direct_hoist_187,
    "T3": direct_hoist_188,
    "TplRecord": direct_hoist_142,
    "TransportedValue": direct_hoist_192,
    "Uint8ArrayType": direct_hoist_193,
    "UnionWithEnumAccess": direct_hoist_200,
    "User": direct_hoist_202,
    "Version": direct_hoist_203,
    "Version2": direct_hoist_204,
    "WithOptionals": direct_hoist_205,
    "DtsConfig": direct_hoist_207,
    "DtsStatus": direct_hoist_208,
    "TsxLabel": direct_hoist_209,
    "TsxTask": direct_hoist_211,
    "Arr2": direct_hoist_212,
    "OtherEnum": direct_hoist_157,
    "Arr3": direct_hoist_213,
    "CurrencyPrices": direct_hoist_215,
    "NonInfiniteNumber": direct_hoist_216,
    "NonNegativeNumber": direct_hoist_217,
    "Rate": direct_hoist_218,
    "ReadAuthorizedUserId": direct_hoist_219,
    "UserId": direct_hoist_220,
    "ValidCurrency": direct_hoist_214,
    "WriteAuthorizedUserId": direct_hoist_221,
    "AllTs": direct_hoist_157,
    "OtherEnum__A": direct_hoist_59,
    "OtherEnum__B": direct_hoist_94,
    "OtherEnum2__C": direct_hoist_222
};
const buildParsersInput = {
    "Intersection": direct_hoist_0,
    "IntersectionPartial": direct_hoist_1,
    "IntersectionOmitPick": direct_hoist_2,
    "IntersectionNested": direct_hoist_3,
    "IntersectionIndex": direct_hoist_4,
    "IntersectionUnion": direct_hoist_5,
    "IntersectionTplIndex": direct_hoist_6,
    "IntersectionTwoTplIndexes": direct_hoist_7,
    "TplRecord": direct_hoist_8,
    "Repro5": direct_hoist_9,
    "Repro6": direct_hoist_10,
    "M1": direct_hoist_11,
    "S1": direct_hoist_12,
    "PartialRepro": direct_hoist_13,
    "TransportedValue": direct_hoist_14,
    "OnlyAKey": direct_hoist_15,
    "ObjectWithArr": direct_hoist_18,
    "BigIntCodec": direct_hoist_19,
    "TupleCodec": direct_hoist_21,
    "TupleCodecRest": direct_hoist_22,
    "StringArrCodec": direct_hoist_17,
    "AllTs": direct_hoist_23,
    "AObject": direct_hoist_24,
    "Version": direct_hoist_25,
    "Version2": direct_hoist_26,
    "PrefixedString": direct_hoist_27,
    "KeyedNumber": direct_hoist_28,
    "FlagTpl": direct_hoist_29,
    "AccessLevelTpl2": direct_hoist_30,
    "AccessLevelTpl": direct_hoist_31,
    "Arr3": direct_hoist_32,
    "OmitSettings": direct_hoist_33,
    "RequiredPartialObject": direct_hoist_34,
    "LevelAndDSettings": direct_hoist_35,
    "PartialSettings": direct_hoist_36,
    "Extra": direct_hoist_37,
    "User": direct_hoist_38,
    "PublicUser": direct_hoist_39,
    "Req": direct_hoist_40,
    "Repro1": direct_hoist_41,
    "SettingsUpdate": direct_hoist_42,
    "Mapped": direct_hoist_43,
    "MappedOptional": direct_hoist_44,
    "PartialObject": direct_hoist_45,
    "DiscriminatedUnion": direct_hoist_46,
    "DiscriminatedUnion2": direct_hoist_47,
    "DiscriminatedUnion3": direct_hoist_48,
    "DiscriminatedUnion4": direct_hoist_49,
    "AllTypes": direct_hoist_50,
    "AccessLevel": direct_hoist_51,
    "OtherEnum": direct_hoist_52,
    "Arr2C": direct_hoist_53,
    "ValidCurrency": direct_hoist_54,
    "UnionWithEnumAccess": direct_hoist_55,
    "T3": direct_hoist_56,
    "AccessLevelCodec": direct_hoist_51,
    "AvatarSize": direct_hoist_57,
    "BObject": direct_hoist_58,
    "ImportEnumTypeof": direct_hoist_60,
    "KDEF": direct_hoist_61,
    "KABC": direct_hoist_62,
    "K": direct_hoist_63,
    "NonNegativeNumber": direct_hoist_64,
    "NonInfiniteNumber": direct_hoist_65,
    "Rate": direct_hoist_66,
    "UserId": direct_hoist_67,
    "ReadAuthorizedUserId": direct_hoist_68,
    "WriteAuthorizedUserId": direct_hoist_69,
    "CurrencyPrices": direct_hoist_70,
    "Uint8ArrayCodec": direct_hoist_71,
    "Int32ArrayCodec": direct_hoist_72,
    "Float64ArrayCodec": direct_hoist_73,
    "BigInt64ArrayCodec": direct_hoist_74,
    "TsxTask": direct_hoist_75,
    "Query": direct_hoist_76,
    "DtsConfig": direct_hoist_77,
    "DeploymentState": direct_hoist_78
};

export default { buildParsers };