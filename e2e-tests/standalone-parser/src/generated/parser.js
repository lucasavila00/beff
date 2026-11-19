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
const direct_hoist_9 = new RefRuntype(undefined, "ProtoDiscriminated");
const direct_hoist_10 = new RefRuntype(undefined, "ProtoKeyObject");
const direct_hoist_11 = new RefRuntype(undefined, "Repro5");
const direct_hoist_12 = new RefRuntype(undefined, "Repro6");
const direct_hoist_13 = new RefRuntype(undefined, "M1");
const direct_hoist_14 = new RefRuntype(undefined, "S1");
const direct_hoist_15 = new RefRuntype(undefined, "PartialRepro");
const direct_hoist_16 = new RefRuntype(undefined, "TransportedValue");
const direct_hoist_17 = new RefRuntype(undefined, "OnlyAKey");
const direct_hoist_18 = new TypeofRuntype(undefined, "string");
const direct_hoist_19 = new ArrayRuntype(undefined, direct_hoist_18);
const direct_hoist_20 = new ObjectRuntype(undefined, {
    "a": direct_hoist_19
}, []);
const direct_hoist_21 = new BigIntRuntype(undefined);
const direct_hoist_22 = new TypeofRuntype(undefined, "number");
const direct_hoist_23 = new TupleRuntype(undefined, [
    direct_hoist_22,
    direct_hoist_22,
    direct_hoist_22
], null);
const direct_hoist_24 = new TupleRuntype(undefined, [
    direct_hoist_22,
    direct_hoist_22
], direct_hoist_18);
const direct_hoist_25 = new RefRuntype(undefined, "AllTs");
const direct_hoist_26 = new RefRuntype(undefined, "AObject");
const direct_hoist_27 = new RefRuntype(undefined, "Version");
const direct_hoist_28 = new RefRuntype(undefined, "Version2");
const direct_hoist_29 = new RefRuntype(undefined, "PrefixedString");
const direct_hoist_30 = new RefRuntype(undefined, "KeyedNumber");
const direct_hoist_31 = new RefRuntype(undefined, "FlagTpl");
const direct_hoist_32 = new RefRuntype(undefined, "AccessLevelTpl2");
const direct_hoist_33 = new RefRuntype(undefined, "AccessLevelTpl");
const direct_hoist_34 = new RefRuntype(undefined, "Arr3");
const direct_hoist_35 = new RefRuntype(undefined, "OmitSettings");
const direct_hoist_36 = new RefRuntype(undefined, "RequiredPartialObject");
const direct_hoist_37 = new RefRuntype(undefined, "LevelAndDSettings");
const direct_hoist_38 = new RefRuntype(undefined, "PartialSettings");
const direct_hoist_39 = new RefRuntype(undefined, "Extra");
const direct_hoist_40 = new RefRuntype(undefined, "User");
const direct_hoist_41 = new RefRuntype(undefined, "PublicUser");
const direct_hoist_42 = new RefRuntype(undefined, "Req");
const direct_hoist_43 = new RefRuntype(undefined, "Repro1");
const direct_hoist_44 = new RefRuntype(undefined, "SettingsUpdate");
const direct_hoist_45 = new RefRuntype(undefined, "Mapped");
const direct_hoist_46 = new RefRuntype(undefined, "MappedOptional");
const direct_hoist_47 = new RefRuntype(undefined, "PartialObject");
const direct_hoist_48 = new RefRuntype(undefined, "DiscriminatedUnion");
const direct_hoist_49 = new RefRuntype(undefined, "DiscriminatedUnion2");
const direct_hoist_50 = new RefRuntype(undefined, "DiscriminatedUnion3");
const direct_hoist_51 = new RefRuntype(undefined, "DiscriminatedUnion4");
const direct_hoist_52 = new RefRuntype(undefined, "AllTypes");
const direct_hoist_53 = new RefRuntype(undefined, "AccessLevel");
const direct_hoist_54 = new RefRuntype(undefined, "OtherEnum");
const direct_hoist_55 = new RefRuntype(undefined, "Arr2");
const direct_hoist_56 = new RefRuntype(undefined, "ValidCurrency");
const direct_hoist_57 = new RefRuntype(undefined, "UnionWithEnumAccess");
const direct_hoist_58 = new RefRuntype(undefined, "T3");
const direct_hoist_59 = new RefRuntype(undefined, "AvatarSize");
const direct_hoist_60 = new RefRuntype(undefined, "BObject");
const direct_hoist_61 = new ConstRuntype(undefined, "a");
const direct_hoist_62 = new ObjectRuntype(undefined, {
    "A": direct_hoist_61
}, []);
const direct_hoist_63 = new RefRuntype(undefined, "KDEF");
const direct_hoist_64 = new RefRuntype(undefined, "KABC");
const direct_hoist_65 = new RefRuntype(undefined, "K");
const direct_hoist_66 = new RefRuntype(undefined, "NonNegativeNumber");
const direct_hoist_67 = new RefRuntype(undefined, "NonInfiniteNumber");
const direct_hoist_68 = new RefRuntype(undefined, "Rate");
const direct_hoist_69 = new RefRuntype(undefined, "UserId");
const direct_hoist_70 = new RefRuntype(undefined, "ReadAuthorizedUserId");
const direct_hoist_71 = new RefRuntype(undefined, "WriteAuthorizedUserId");
const direct_hoist_72 = new RefRuntype(undefined, "CurrencyPrices");
const direct_hoist_73 = new RefRuntype(undefined, "Uint8ArrayType");
const direct_hoist_74 = new RefRuntype(undefined, "Int32ArrayType");
const direct_hoist_75 = new RefRuntype(undefined, "Float64ArrayType");
const direct_hoist_76 = new RefRuntype(undefined, "BigInt64ArrayType");
const direct_hoist_77 = new RefRuntype(undefined, "TsxTask");
const direct_hoist_78 = new RefRuntype(undefined, "Query");
const direct_hoist_79 = new RefRuntype(undefined, "DtsConfig");
const direct_hoist_80 = new RefRuntype(undefined, "DeploymentState");
const direct_hoist_81 = new AnyOfConstsRuntype(undefined, [
    "deployed",
    "failed",
    "pending"
]);
const direct_hoist_82 = new NullishRuntype(undefined, "undefined");
const direct_hoist_83 = new AnyOfConstsRuntype(undefined, [
    "asc",
    "desc"
]);
const direct_hoist_84 = new AnyOfConstsRuntype(undefined, [
    "age",
    "name"
]);
const direct_hoist_85 = new ObjectRuntype(undefined, {
    "direction": direct_hoist_83,
    "field": direct_hoist_84
}, []);
const direct_hoist_86 = new AnyOfRuntype(undefined, [
    direct_hoist_82,
    direct_hoist_85
], "0,,,,,,1");
const direct_hoist_87 = new ObjectRuntype(undefined, {
    "orderBy": direct_hoist_86
}, []);
const direct_hoist_88 = new ObjectRuntype(undefined, {}, []);
const direct_hoist_89 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_61
}, []);
const direct_hoist_90 = new AnyOfConstsRuntype(undefined, [
    "ADMIN",
    "USER"
]);
const direct_hoist_91 = new AnyOfConstsRuntype(undefined, [
    "ADMIN Admin",
    "USER User"
]);
const direct_hoist_92 = new RegexRuntype(undefined, /^((ADMIN)|(USER))$/, '`("ADMIN" | "USER")`');
const direct_hoist_93 = new RegexRuntype(undefined, /^((ADMIN Admin)|(USER User))$/, '`("ADMIN Admin" | "USER User")`');
const direct_hoist_94 = new AnyOfConstsRuntype(undefined, [
    "LevelAndDSettings",
    "OmitSettings",
    "PartialSettings",
    "RequiredPartialObject"
]);
const direct_hoist_95 = new RegexRuntype(undefined, /^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(x)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}x${number}`");
const direct_hoist_96 = new ConstRuntype(undefined, "b");
const direct_hoist_97 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_96
}, []);
const direct_hoist_98 = new TypedArrayRuntype(undefined, "BigInt64Array");
const direct_hoist_99 = new ObjectRuntype(undefined, {
    "a": direct_hoist_18
}, []);
const direct_hoist_100 = new ConstRuntype(undefined, "a1");
const direct_hoist_101 = new ObjectRuntype(undefined, {
    "a1": direct_hoist_18,
    "a11": new OptionalFieldRuntype(direct_hoist_18),
    "subType": direct_hoist_100,
    "type": direct_hoist_61
}, []);
const direct_hoist_102 = new ConstRuntype(undefined, "a2");
const direct_hoist_103 = new ObjectRuntype(undefined, {
    "a2": direct_hoist_18,
    "subType": direct_hoist_102,
    "type": direct_hoist_61
}, []);
const direct_hoist_104 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_101,
    direct_hoist_103
], "subType", {
    "a1": direct_hoist_101,
    "a2": direct_hoist_103
});
const direct_hoist_105 = new ObjectRuntype(undefined, {
    "type": direct_hoist_96,
    "value": direct_hoist_22
}, []);
const direct_hoist_106 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_101,
    direct_hoist_103,
    direct_hoist_105
], "type", {
    "a": direct_hoist_104,
    "b": direct_hoist_105
});
const direct_hoist_107 = new ConstRuntype(undefined, "d");
const direct_hoist_108 = new ObjectRuntype(undefined, {
    "type": new OptionalFieldRuntype(direct_hoist_107),
    "valueD": direct_hoist_22
}, []);
const direct_hoist_109 = new AnyOfRuntype(undefined, [
    direct_hoist_101,
    direct_hoist_103,
    direct_hoist_108,
    direct_hoist_105
]);
const direct_hoist_110 = new AnyOfConstsRuntype(undefined, [
    "a",
    "c"
]);
const direct_hoist_111 = new ObjectRuntype(undefined, {
    "a1": direct_hoist_18,
    "type": direct_hoist_110
}, []);
const direct_hoist_112 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_111,
    direct_hoist_105
], "type", {
    "a": direct_hoist_111,
    "b": direct_hoist_105,
    "c": direct_hoist_111
});
const direct_hoist_113 = new ObjectRuntype(undefined, {
    "a1": direct_hoist_18,
    "subType": direct_hoist_100
}, []);
const direct_hoist_114 = new ObjectRuntype(undefined, {
    "a": direct_hoist_113,
    "type": direct_hoist_61
}, []);
const direct_hoist_115 = new ObjectRuntype(undefined, {
    "a2": direct_hoist_18,
    "subType": direct_hoist_102
}, []);
const direct_hoist_116 = new ObjectRuntype(undefined, {
    "a": direct_hoist_115,
    "type": direct_hoist_61
}, []);
const direct_hoist_117 = new AnyOfRuntype(undefined, [
    direct_hoist_114,
    direct_hoist_116
]);
const direct_hoist_118 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_18,
        "value": direct_hoist_18
    }
]);
const direct_hoist_119 = new RegexRuntype(undefined, /^(true|false)$/, "`${boolean}`");
const direct_hoist_120 = new TypedArrayRuntype(undefined, "Float64Array");
const direct_hoist_121 = new ObjectRuntype(undefined, {
    "b": new OptionalFieldRuntype(direct_hoist_18)
}, []);
const direct_hoist_122 = new ObjectRuntype(undefined, {
    "a": direct_hoist_18,
    "b": direct_hoist_22,
    "c": direct_hoist_18
}, []);
const direct_hoist_123 = new ObjectRuntype(undefined, {
    "d0": direct_hoist_18,
    "e": direct_hoist_22
}, []);
const direct_hoist_124 = new TypeofRuntype(undefined, "boolean");
const direct_hoist_125 = new ObjectRuntype(undefined, {
    "a": direct_hoist_18,
    "b": direct_hoist_22,
    "z": direct_hoist_124
}, []);
const direct_hoist_126 = new TypedArrayRuntype(undefined, "Int32Array");
const direct_hoist_127 = new RefRuntype(undefined, "IA");
const direct_hoist_128 = new RefRuntype(undefined, "IB");
const direct_hoist_129 = new AllOfRuntype(undefined, [
    direct_hoist_127,
    direct_hoist_128
]);
const direct_hoist_130 = new AnyOfRuntype(undefined, [
    direct_hoist_18,
    direct_hoist_22
], ",,1,0");
const direct_hoist_131 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_18,
        "value": direct_hoist_130
    }
]);
const direct_hoist_132 = new ObjectRuntype(undefined, {
    "n": direct_hoist_22
}, []);
const direct_hoist_133 = new AllOfRuntype(undefined, [
    direct_hoist_131,
    direct_hoist_132,
    direct_hoist_127
]);
const direct_hoist_134 = new ObjectRuntype(undefined, {
    "x": direct_hoist_18
}, []);
const direct_hoist_135 = new ObjectRuntype(undefined, {
    "n": direct_hoist_134
}, []);
const direct_hoist_136 = new AllOfRuntype(undefined, [
    direct_hoist_135,
    direct_hoist_128
]);
const direct_hoist_137 = new AllOfRuntype(undefined, [
    direct_hoist_127,
    direct_hoist_136
]);
const direct_hoist_138 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_18),
    "b": new OptionalFieldRuntype(direct_hoist_22)
}, []);
const direct_hoist_139 = new ObjectRuntype(undefined, {
    "a": direct_hoist_18,
    "b": direct_hoist_22,
    "d0": direct_hoist_18,
    "e": direct_hoist_22
}, []);
const direct_hoist_140 = new AllOfRuntype(undefined, [
    direct_hoist_138,
    direct_hoist_139
]);
const direct_hoist_141 = new ObjectRuntype(undefined, {
    "c": new OptionalFieldRuntype(direct_hoist_18)
}, []);
const direct_hoist_142 = new AllOfRuntype(undefined, [
    direct_hoist_141,
    direct_hoist_127
]);
const direct_hoist_143 = new RegexRuntype(undefined, /^(x_)([\s\S]*)$/, "`x_${string}`");
const direct_hoist_144 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_143,
        "value": direct_hoist_22
    }
]);
const direct_hoist_145 = new AllOfRuntype(undefined, [
    direct_hoist_144,
    direct_hoist_127
]);
const direct_hoist_146 = new RegexRuntype(undefined, /^(y_)([\s\S]*)$/, "`y_${string}`");
const direct_hoist_147 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_146,
        "value": direct_hoist_18
    }
]);
const direct_hoist_148 = new AllOfRuntype(undefined, [
    direct_hoist_144,
    direct_hoist_147,
    direct_hoist_127
]);
const direct_hoist_149 = new ConstRuntype(undefined, "u");
const direct_hoist_150 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_149,
    "u": direct_hoist_18
}, []);
const direct_hoist_151 = new ConstRuntype(undefined, "v");
const direct_hoist_152 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_151,
    "v": new OptionalFieldRuntype(direct_hoist_22)
}, []);
const direct_hoist_153 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_150,
    direct_hoist_152
], "kind", {
    "u": direct_hoist_150,
    "v": direct_hoist_152
});
const direct_hoist_154 = new AllOfRuntype(undefined, [
    direct_hoist_127,
    direct_hoist_153
]);
const direct_hoist_155 = new AnyOfConstsRuntype(undefined, [
    "a"
]);
const direct_hoist_156 = new NeverRuntype(undefined);
const direct_hoist_157 = new RegexRuntype(undefined, /^((a)|(b))(-)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, '`("a" | "b")-${number}`');
const direct_hoist_158 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_107
}, []);
const direct_hoist_159 = new AnyOfConstsRuntype(undefined, [
    "a",
    "b"
]);
const direct_hoist_160 = new ObjectRuntype(undefined, {
    "d": direct_hoist_158,
    "level": direct_hoist_159
}, []);
const direct_hoist_161 = new MapRuntype(undefined, direct_hoist_18, direct_hoist_22);
const direct_hoist_162 = new ObjectRuntype(undefined, {
    "value": direct_hoist_61
}, []);
const direct_hoist_163 = new ObjectRuntype(undefined, {
    "value": direct_hoist_96
}, []);
const direct_hoist_164 = new ObjectRuntype(undefined, {
    "a": direct_hoist_162,
    "b": direct_hoist_163
}, []);
const direct_hoist_165 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_162),
    "b": new OptionalFieldRuntype(direct_hoist_163)
}, []);
const direct_hoist_166 = new ObjectRuntype(undefined, {
    "A": direct_hoist_18
}, []);
const direct_hoist_167 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_18),
    "b": new OptionalFieldRuntype(direct_hoist_18)
}, []);
const direct_hoist_168 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_18),
    "d": new OptionalFieldRuntype(direct_hoist_158),
    "level": new OptionalFieldRuntype(direct_hoist_159)
}, []);
const direct_hoist_169 = new RegexRuntype(undefined, /^(a)([\s\S]*)$/, "`a${string}`");
const direct_hoist_170 = new ConstRuntype(undefined, "__proto__");
const direct_hoist_171 = new ObjectRuntype(undefined, {
    "c": direct_hoist_124,
    "kind": direct_hoist_170
}, []);
const direct_hoist_172 = new ConstRuntype(undefined, "constructor");
const direct_hoist_173 = new ObjectRuntype(undefined, {
    "b": direct_hoist_22,
    "kind": direct_hoist_172
}, []);
const direct_hoist_174 = new ConstRuntype(undefined, "toString");
const direct_hoist_175 = new ObjectRuntype(undefined, {
    "a": direct_hoist_18,
    "kind": direct_hoist_174
}, []);
const direct_hoist_176 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_175,
    direct_hoist_173,
    direct_hoist_171
], "kind", {
    ["__proto__"]: direct_hoist_171,
    "constructor": direct_hoist_173,
    "toString": direct_hoist_175
});
const direct_hoist_177 = new ObjectRuntype(undefined, {
    ["__proto__"]: direct_hoist_18,
    "toString": direct_hoist_22
}, []);
const direct_hoist_178 = new ObjectRuntype(undefined, {
    "accessLevel": direct_hoist_53,
    "avatarSize": direct_hoist_59,
    "extra": direct_hoist_39,
    "name": direct_hoist_18
}, []);
const direct_hoist_179 = new RefRuntype(undefined, "Repro2");
const direct_hoist_180 = new ObjectRuntype(undefined, {
    "sizes": new OptionalFieldRuntype(direct_hoist_179)
}, []);
const direct_hoist_181 = new ObjectRuntype(undefined, {
    "useSmallerSizes": direct_hoist_124
}, []);
const direct_hoist_182 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_18,
        "value": direct_hoist_22
    }
]);
const direct_hoist_183 = new ObjectRuntype(undefined, {
    "accountEndpoints": direct_hoist_182
}, []);
const direct_hoist_184 = new ObjectRuntype(undefined, {}, [
    {
        "key": new NumberKeyRuntype(undefined),
        "value": direct_hoist_22
    }
]);
const direct_hoist_185 = new ObjectRuntype(undefined, {
    "accountEndpoints": direct_hoist_184
}, []);
const direct_hoist_186 = new ObjectRuntype(undefined, {
    "optional": direct_hoist_18
}, []);
const direct_hoist_187 = new ObjectRuntype(undefined, {
    "a": direct_hoist_18,
    "b": direct_hoist_22
}, []);
const direct_hoist_188 = new SetRuntype(undefined, direct_hoist_18);
const direct_hoist_189 = new ObjectRuntype(undefined, {
    "a": direct_hoist_18,
    "d": direct_hoist_158,
    "level": direct_hoist_159
}, []);
const direct_hoist_190 = new AnyOfRuntype(undefined, [
    direct_hoist_18,
    direct_hoist_61,
    direct_hoist_96,
    direct_hoist_158
]);
const direct_hoist_191 = new ConstRuntype(undefined, "circle");
const direct_hoist_192 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_191,
    "radius": direct_hoist_22
}, []);
const direct_hoist_193 = new ConstRuntype(undefined, "square");
const direct_hoist_194 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_193,
    "x": direct_hoist_22
}, []);
const direct_hoist_195 = new ConstRuntype(undefined, "triangle");
const direct_hoist_196 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_195,
    "x": direct_hoist_22,
    "y": direct_hoist_22
}, []);
const direct_hoist_197 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_192,
    direct_hoist_194,
    direct_hoist_196
], "kind", {
    "circle": direct_hoist_192,
    "square": direct_hoist_194,
    "triangle": direct_hoist_196
});
const direct_hoist_198 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_194,
    direct_hoist_196
], "kind", {
    "square": direct_hoist_194,
    "triangle": direct_hoist_196
});
const direct_hoist_199 = new NullishRuntype(undefined, "null");
const direct_hoist_200 = new AnyOfRuntype(undefined, [
    direct_hoist_199,
    direct_hoist_82,
    direct_hoist_18,
    direct_hoist_22
], "0,,3,2");
const direct_hoist_201 = new ArrayRuntype(undefined, direct_hoist_200);
const direct_hoist_202 = new AnyOfRuntype(undefined, [
    direct_hoist_199,
    direct_hoist_82,
    direct_hoist_18,
    direct_hoist_201
], "0,,,2,,3");
const direct_hoist_203 = new TypedArrayRuntype(undefined, "Uint8Array");
const direct_hoist_204 = new RefRuntype(undefined, "OtherEnum__A");
const direct_hoist_205 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_204,
    "value": direct_hoist_18
}, []);
const direct_hoist_206 = new RefRuntype(undefined, "OtherEnum__B");
const direct_hoist_207 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_206,
    "value": direct_hoist_22
}, []);
const direct_hoist_208 = new RefRuntype(undefined, "OtherEnum2__C");
const direct_hoist_209 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_208,
    "value": direct_hoist_124
}, []);
const direct_hoist_210 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_209,
    direct_hoist_205,
    direct_hoist_207
], "tag", {
    "a": direct_hoist_205,
    "b": direct_hoist_207,
    "c": direct_hoist_209
});
const direct_hoist_211 = new ArrayRuntype(undefined, direct_hoist_40);
const direct_hoist_212 = new ObjectRuntype(undefined, {
    "accessLevel": direct_hoist_53,
    "avatarSize": direct_hoist_59,
    "extra": direct_hoist_39,
    "friends": direct_hoist_211,
    "name": direct_hoist_18
}, []);
const direct_hoist_213 = new RegexRuntype(undefined, /^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}.${number}.${number}`");
const direct_hoist_214 = new RegexRuntype(undefined, /^(v)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`v${number}.${number}.${number}`");
const direct_hoist_215 = new ObjectRuntype(undefined, {
    "optional": new OptionalFieldRuntype(direct_hoist_18)
}, []);
const direct_hoist_216 = new RefRuntype(undefined, "DtsStatus");
const direct_hoist_217 = new ObjectRuntype(undefined, {
    "enabled": direct_hoist_124,
    "status": direct_hoist_216
}, []);
const direct_hoist_218 = new AnyOfConstsRuntype(undefined, [
    "off",
    "on"
]);
const direct_hoist_219 = new AnyOfConstsRuntype(undefined, [
    "active",
    "closed",
    "pending"
]);
const direct_hoist_220 = new RefRuntype(undefined, "TsxLabel");
const direct_hoist_221 = new ObjectRuntype(undefined, {
    "id": direct_hoist_18,
    "label": direct_hoist_220
}, []);
const direct_hoist_222 = new AnyOfConstsRuntype(undefined, [
    "A",
    "B",
    "C"
]);
const direct_hoist_223 = new AnyOfConstsRuntype(undefined, [
    "X",
    "Y"
]);
const direct_hoist_224 = new StringWithFormatRuntype(undefined, [
    "ValidCurrency"
]);
const direct_hoist_225 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_224,
        "value": direct_hoist_68
    }
]);
const direct_hoist_226 = new NumberWithFormatRuntype(undefined, [
    "NonInfiniteNumber"
]);
const direct_hoist_227 = new NumberWithFormatRuntype(undefined, [
    "NonInfiniteNumber",
    "NonNegativeNumber"
]);
const direct_hoist_228 = new NumberWithFormatRuntype(undefined, [
    "NonInfiniteNumber",
    "NonNegativeNumber",
    "Rate"
]);
const direct_hoist_229 = new StringWithFormatRuntype(undefined, [
    "UserId",
    "ReadAuthorizedUserId"
]);
const direct_hoist_230 = new StringWithFormatRuntype(undefined, [
    "UserId"
]);
const direct_hoist_231 = new StringWithFormatRuntype(undefined, [
    "UserId",
    "ReadAuthorizedUserId",
    "WriteAuthorizedUserId"
]);
const direct_hoist_232 = new ConstRuntype(undefined, "c");
const namedRuntypes = {
    "DeploymentState": direct_hoist_81,
    "Query": direct_hoist_87,
    "ABC": direct_hoist_88,
    "AObject": direct_hoist_89,
    "AccessLevel": direct_hoist_90,
    "AccessLevel2": direct_hoist_91,
    "AccessLevelTpl": direct_hoist_92,
    "AccessLevelTpl2": direct_hoist_93,
    "AllTypes": direct_hoist_94,
    "AvatarSize": direct_hoist_95,
    "BObject": direct_hoist_97,
    "BigInt64ArrayType": direct_hoist_98,
    "DEF": direct_hoist_99,
    "DiscriminatedUnion": direct_hoist_106,
    "DiscriminatedUnion2": direct_hoist_109,
    "DiscriminatedUnion3": direct_hoist_112,
    "DiscriminatedUnion4": direct_hoist_117,
    "Extra": direct_hoist_118,
    "FlagTpl": direct_hoist_119,
    "Float64ArrayType": direct_hoist_120,
    "IA": direct_hoist_99,
    "IB": direct_hoist_121,
    "IBase": direct_hoist_122,
    "IExtra": direct_hoist_123,
    "IOther": direct_hoist_125,
    "Int32ArrayType": direct_hoist_126,
    "Intersection": direct_hoist_129,
    "IntersectionIndex": direct_hoist_133,
    "IntersectionNested": direct_hoist_137,
    "IntersectionOmitPick": direct_hoist_140,
    "IntersectionPartial": direct_hoist_142,
    "IntersectionTplIndex": direct_hoist_145,
    "IntersectionTwoTplIndexes": direct_hoist_148,
    "IntersectionUnion": direct_hoist_154,
    "K": direct_hoist_155,
    "KABC": direct_hoist_156,
    "KDEF": direct_hoist_61,
    "KeyedNumber": direct_hoist_157,
    "LevelAndDSettings": direct_hoist_160,
    "M1": direct_hoist_161,
    "Mapped": direct_hoist_164,
    "MappedOptional": direct_hoist_165,
    "OmitSettings": direct_hoist_160,
    "OnlyAKey": direct_hoist_166,
    "PartialObject": direct_hoist_138,
    "PartialRepro": direct_hoist_167,
    "PartialSettings": direct_hoist_168,
    "PrefixedString": direct_hoist_169,
    "ProtoDiscriminated": direct_hoist_176,
    "ProtoKeyObject": direct_hoist_177,
    "PublicUser": direct_hoist_178,
    "Repro1": direct_hoist_180,
    "Repro2": direct_hoist_181,
    "Repro5": direct_hoist_183,
    "Repro6": direct_hoist_185,
    "Req": direct_hoist_186,
    "RequiredPartialObject": direct_hoist_187,
    "S1": direct_hoist_188,
    "Settings": direct_hoist_189,
    "SettingsUpdate": direct_hoist_190,
    "Shape": direct_hoist_197,
    "T3": direct_hoist_198,
    "TplRecord": direct_hoist_144,
    "TransportedValue": direct_hoist_202,
    "Uint8ArrayType": direct_hoist_203,
    "UnionWithEnumAccess": direct_hoist_210,
    "User": direct_hoist_212,
    "Version": direct_hoist_213,
    "Version2": direct_hoist_214,
    "WithOptionals": direct_hoist_215,
    "DtsConfig": direct_hoist_217,
    "DtsStatus": direct_hoist_218,
    "TsxLabel": direct_hoist_219,
    "TsxTask": direct_hoist_221,
    "Arr2": direct_hoist_222,
    "OtherEnum": direct_hoist_159,
    "Arr3": direct_hoist_223,
    "CurrencyPrices": direct_hoist_225,
    "NonInfiniteNumber": direct_hoist_226,
    "NonNegativeNumber": direct_hoist_227,
    "Rate": direct_hoist_228,
    "ReadAuthorizedUserId": direct_hoist_229,
    "UserId": direct_hoist_230,
    "ValidCurrency": direct_hoist_224,
    "WriteAuthorizedUserId": direct_hoist_231,
    "AllTs": direct_hoist_159,
    "OtherEnum__A": direct_hoist_61,
    "OtherEnum__B": direct_hoist_96,
    "OtherEnum2__C": direct_hoist_232
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
    "ProtoDiscriminated": direct_hoist_9,
    "ProtoKeyObject": direct_hoist_10,
    "Repro5": direct_hoist_11,
    "Repro6": direct_hoist_12,
    "M1": direct_hoist_13,
    "S1": direct_hoist_14,
    "PartialRepro": direct_hoist_15,
    "TransportedValue": direct_hoist_16,
    "OnlyAKey": direct_hoist_17,
    "ObjectWithArr": direct_hoist_20,
    "BigIntCodec": direct_hoist_21,
    "TupleCodec": direct_hoist_23,
    "TupleCodecRest": direct_hoist_24,
    "StringArrCodec": direct_hoist_19,
    "AllTs": direct_hoist_25,
    "AObject": direct_hoist_26,
    "Version": direct_hoist_27,
    "Version2": direct_hoist_28,
    "PrefixedString": direct_hoist_29,
    "KeyedNumber": direct_hoist_30,
    "FlagTpl": direct_hoist_31,
    "AccessLevelTpl2": direct_hoist_32,
    "AccessLevelTpl": direct_hoist_33,
    "Arr3": direct_hoist_34,
    "OmitSettings": direct_hoist_35,
    "RequiredPartialObject": direct_hoist_36,
    "LevelAndDSettings": direct_hoist_37,
    "PartialSettings": direct_hoist_38,
    "Extra": direct_hoist_39,
    "User": direct_hoist_40,
    "PublicUser": direct_hoist_41,
    "Req": direct_hoist_42,
    "Repro1": direct_hoist_43,
    "SettingsUpdate": direct_hoist_44,
    "Mapped": direct_hoist_45,
    "MappedOptional": direct_hoist_46,
    "PartialObject": direct_hoist_47,
    "DiscriminatedUnion": direct_hoist_48,
    "DiscriminatedUnion2": direct_hoist_49,
    "DiscriminatedUnion3": direct_hoist_50,
    "DiscriminatedUnion4": direct_hoist_51,
    "AllTypes": direct_hoist_52,
    "AccessLevel": direct_hoist_53,
    "OtherEnum": direct_hoist_54,
    "Arr2C": direct_hoist_55,
    "ValidCurrency": direct_hoist_56,
    "UnionWithEnumAccess": direct_hoist_57,
    "T3": direct_hoist_58,
    "AccessLevelCodec": direct_hoist_53,
    "AvatarSize": direct_hoist_59,
    "BObject": direct_hoist_60,
    "ImportEnumTypeof": direct_hoist_62,
    "KDEF": direct_hoist_63,
    "KABC": direct_hoist_64,
    "K": direct_hoist_65,
    "NonNegativeNumber": direct_hoist_66,
    "NonInfiniteNumber": direct_hoist_67,
    "Rate": direct_hoist_68,
    "UserId": direct_hoist_69,
    "ReadAuthorizedUserId": direct_hoist_70,
    "WriteAuthorizedUserId": direct_hoist_71,
    "CurrencyPrices": direct_hoist_72,
    "Uint8ArrayCodec": direct_hoist_73,
    "Int32ArrayCodec": direct_hoist_74,
    "Float64ArrayCodec": direct_hoist_75,
    "BigInt64ArrayCodec": direct_hoist_76,
    "TsxTask": direct_hoist_77,
    "Query": direct_hoist_78,
    "DtsConfig": direct_hoist_79,
    "DeploymentState": direct_hoist_80
};

export default { buildParsers };