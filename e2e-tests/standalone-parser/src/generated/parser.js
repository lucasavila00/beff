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
const direct_hoist_6 = new RefRuntype(undefined, "Repro5");
const direct_hoist_7 = new RefRuntype(undefined, "Repro6");
const direct_hoist_8 = new RefRuntype(undefined, "M1");
const direct_hoist_9 = new RefRuntype(undefined, "S1");
const direct_hoist_10 = new RefRuntype(undefined, "PartialRepro");
const direct_hoist_11 = new RefRuntype(undefined, "TransportedValue");
const direct_hoist_12 = new RefRuntype(undefined, "OnlyAKey");
const direct_hoist_13 = new TypeofRuntype(undefined, "string");
const direct_hoist_14 = new ArrayRuntype(undefined, direct_hoist_13);
const direct_hoist_15 = new ObjectRuntype(undefined, {
    "a": direct_hoist_14
}, []);
const direct_hoist_16 = new BigIntRuntype(undefined);
const direct_hoist_17 = new TypeofRuntype(undefined, "number");
const direct_hoist_18 = new TupleRuntype(undefined, [
    direct_hoist_17,
    direct_hoist_17,
    direct_hoist_17
], null);
const direct_hoist_19 = new TupleRuntype(undefined, [
    direct_hoist_17,
    direct_hoist_17
], direct_hoist_13);
const direct_hoist_20 = new RefRuntype(undefined, "AllTs");
const direct_hoist_21 = new RefRuntype(undefined, "AObject");
const direct_hoist_22 = new RefRuntype(undefined, "Version");
const direct_hoist_23 = new RefRuntype(undefined, "Version2");
const direct_hoist_24 = new RefRuntype(undefined, "PrefixedString");
const direct_hoist_25 = new RefRuntype(undefined, "KeyedNumber");
const direct_hoist_26 = new RefRuntype(undefined, "FlagTpl");
const direct_hoist_27 = new RefRuntype(undefined, "AccessLevelTpl2");
const direct_hoist_28 = new RefRuntype(undefined, "AccessLevelTpl");
const direct_hoist_29 = new RefRuntype(undefined, "Arr3");
const direct_hoist_30 = new RefRuntype(undefined, "OmitSettings");
const direct_hoist_31 = new RefRuntype(undefined, "RequiredPartialObject");
const direct_hoist_32 = new RefRuntype(undefined, "LevelAndDSettings");
const direct_hoist_33 = new RefRuntype(undefined, "PartialSettings");
const direct_hoist_34 = new RefRuntype(undefined, "Extra");
const direct_hoist_35 = new RefRuntype(undefined, "User");
const direct_hoist_36 = new RefRuntype(undefined, "PublicUser");
const direct_hoist_37 = new RefRuntype(undefined, "Req");
const direct_hoist_38 = new RefRuntype(undefined, "Repro1");
const direct_hoist_39 = new RefRuntype(undefined, "SettingsUpdate");
const direct_hoist_40 = new RefRuntype(undefined, "Mapped");
const direct_hoist_41 = new RefRuntype(undefined, "MappedOptional");
const direct_hoist_42 = new RefRuntype(undefined, "PartialObject");
const direct_hoist_43 = new RefRuntype(undefined, "DiscriminatedUnion");
const direct_hoist_44 = new RefRuntype(undefined, "DiscriminatedUnion2");
const direct_hoist_45 = new RefRuntype(undefined, "DiscriminatedUnion3");
const direct_hoist_46 = new RefRuntype(undefined, "DiscriminatedUnion4");
const direct_hoist_47 = new RefRuntype(undefined, "AllTypes");
const direct_hoist_48 = new RefRuntype(undefined, "AccessLevel");
const direct_hoist_49 = new RefRuntype(undefined, "OtherEnum");
const direct_hoist_50 = new RefRuntype(undefined, "Arr2");
const direct_hoist_51 = new RefRuntype(undefined, "ValidCurrency");
const direct_hoist_52 = new RefRuntype(undefined, "UnionWithEnumAccess");
const direct_hoist_53 = new RefRuntype(undefined, "T3");
const direct_hoist_54 = new RefRuntype(undefined, "AvatarSize");
const direct_hoist_55 = new RefRuntype(undefined, "BObject");
const direct_hoist_56 = new ConstRuntype(undefined, "a");
const direct_hoist_57 = new ObjectRuntype(undefined, {
    "A": direct_hoist_56
}, []);
const direct_hoist_58 = new RefRuntype(undefined, "KDEF");
const direct_hoist_59 = new RefRuntype(undefined, "KABC");
const direct_hoist_60 = new RefRuntype(undefined, "K");
const direct_hoist_61 = new RefRuntype(undefined, "NonNegativeNumber");
const direct_hoist_62 = new RefRuntype(undefined, "NonInfiniteNumber");
const direct_hoist_63 = new RefRuntype(undefined, "Rate");
const direct_hoist_64 = new RefRuntype(undefined, "UserId");
const direct_hoist_65 = new RefRuntype(undefined, "ReadAuthorizedUserId");
const direct_hoist_66 = new RefRuntype(undefined, "WriteAuthorizedUserId");
const direct_hoist_67 = new RefRuntype(undefined, "CurrencyPrices");
const direct_hoist_68 = new RefRuntype(undefined, "Uint8ArrayType");
const direct_hoist_69 = new RefRuntype(undefined, "Int32ArrayType");
const direct_hoist_70 = new RefRuntype(undefined, "Float64ArrayType");
const direct_hoist_71 = new RefRuntype(undefined, "BigInt64ArrayType");
const direct_hoist_72 = new RefRuntype(undefined, "TsxTask");
const direct_hoist_73 = new RefRuntype(undefined, "Query");
const direct_hoist_74 = new RefRuntype(undefined, "DtsConfig");
const direct_hoist_75 = new RefRuntype(undefined, "DeploymentState");
const direct_hoist_76 = new AnyOfConstsRuntype(undefined, [
    "deployed",
    "failed",
    "pending"
]);
const direct_hoist_77 = new NullishRuntype(undefined, "undefined");
const direct_hoist_78 = new AnyOfConstsRuntype(undefined, [
    "asc",
    "desc"
]);
const direct_hoist_79 = new AnyOfConstsRuntype(undefined, [
    "age",
    "name"
]);
const direct_hoist_80 = new ObjectRuntype(undefined, {
    "direction": direct_hoist_78,
    "field": direct_hoist_79
}, []);
const direct_hoist_81 = new AnyOfRuntype(undefined, [
    direct_hoist_77,
    direct_hoist_80
]);
const direct_hoist_82 = new ObjectRuntype(undefined, {
    "orderBy": direct_hoist_81
}, []);
const direct_hoist_83 = new ObjectRuntype(undefined, {}, []);
const direct_hoist_84 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_56
}, []);
const direct_hoist_85 = new AnyOfConstsRuntype(undefined, [
    "ADMIN",
    "USER"
]);
const direct_hoist_86 = new AnyOfConstsRuntype(undefined, [
    "ADMIN Admin",
    "USER User"
]);
const direct_hoist_87 = new RegexRuntype(undefined, /^((ADMIN)|(USER))$/, '`("ADMIN" | "USER")`');
const direct_hoist_88 = new RegexRuntype(undefined, /^((ADMIN Admin)|(USER User))$/, '`("ADMIN Admin" | "USER User")`');
const direct_hoist_89 = new AnyOfConstsRuntype(undefined, [
    "LevelAndDSettings",
    "OmitSettings",
    "PartialSettings",
    "RequiredPartialObject"
]);
const direct_hoist_90 = new RegexRuntype(undefined, /^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(x)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}x${number}`");
const direct_hoist_91 = new ConstRuntype(undefined, "b");
const direct_hoist_92 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_91
}, []);
const direct_hoist_93 = new TypedArrayRuntype(undefined, "BigInt64Array");
const direct_hoist_94 = new ObjectRuntype(undefined, {
    "a": direct_hoist_13
}, []);
const direct_hoist_95 = new ConstRuntype(undefined, "a1");
const direct_hoist_96 = new ObjectRuntype(undefined, {
    "a1": direct_hoist_13,
    "a11": new OptionalFieldRuntype(direct_hoist_13),
    "subType": direct_hoist_95,
    "type": direct_hoist_56
}, []);
const direct_hoist_97 = new ConstRuntype(undefined, "a2");
const direct_hoist_98 = new ObjectRuntype(undefined, {
    "a2": direct_hoist_13,
    "subType": direct_hoist_97,
    "type": direct_hoist_56
}, []);
const direct_hoist_99 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_96,
    direct_hoist_98
], "subType", {
    "a1": direct_hoist_96,
    "a2": direct_hoist_98
}, {
    "a1": direct_hoist_96,
    "a2": direct_hoist_98
});
const direct_hoist_100 = new ObjectRuntype(undefined, {
    "type": direct_hoist_91,
    "value": direct_hoist_17
}, []);
const direct_hoist_101 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_96,
    direct_hoist_98,
    direct_hoist_100
], "type", {
    "a": direct_hoist_99,
    "b": direct_hoist_100
}, {
    "a": direct_hoist_99,
    "b": direct_hoist_100
});
const direct_hoist_102 = new ConstRuntype(undefined, "d");
const direct_hoist_103 = new ObjectRuntype(undefined, {
    "type": new OptionalFieldRuntype(direct_hoist_102),
    "valueD": direct_hoist_17
}, []);
const direct_hoist_104 = new AnyOfRuntype(undefined, [
    direct_hoist_96,
    direct_hoist_98,
    direct_hoist_103,
    direct_hoist_100
]);
const direct_hoist_105 = new AnyOfConstsRuntype(undefined, [
    "a",
    "c"
]);
const direct_hoist_106 = new ObjectRuntype(undefined, {
    "a1": direct_hoist_13,
    "type": direct_hoist_105
}, []);
const direct_hoist_107 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_106,
    direct_hoist_100
], "type", {
    "a": direct_hoist_106,
    "b": direct_hoist_100,
    "c": direct_hoist_106
}, {
    "a": direct_hoist_106,
    "b": direct_hoist_100,
    "c": direct_hoist_106
});
const direct_hoist_108 = new ObjectRuntype(undefined, {
    "a1": direct_hoist_13,
    "subType": direct_hoist_95
}, []);
const direct_hoist_109 = new ObjectRuntype(undefined, {
    "a": direct_hoist_108,
    "type": direct_hoist_56
}, []);
const direct_hoist_110 = new ObjectRuntype(undefined, {
    "a2": direct_hoist_13,
    "subType": direct_hoist_97
}, []);
const direct_hoist_111 = new ObjectRuntype(undefined, {
    "a": direct_hoist_110,
    "type": direct_hoist_56
}, []);
const direct_hoist_112 = new AnyOfRuntype(undefined, [
    direct_hoist_109,
    direct_hoist_111
]);
const direct_hoist_113 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_13,
        "value": direct_hoist_13
    }
]);
const direct_hoist_114 = new RegexRuntype(undefined, /^(true|false)$/, "`${boolean}`");
const direct_hoist_115 = new TypedArrayRuntype(undefined, "Float64Array");
const direct_hoist_116 = new ObjectRuntype(undefined, {
    "b": new OptionalFieldRuntype(direct_hoist_13)
}, []);
const direct_hoist_117 = new ObjectRuntype(undefined, {
    "a": direct_hoist_13,
    "b": direct_hoist_17,
    "c": direct_hoist_13
}, []);
const direct_hoist_118 = new ObjectRuntype(undefined, {
    "d0": direct_hoist_13,
    "e": direct_hoist_17
}, []);
const direct_hoist_119 = new TypeofRuntype(undefined, "boolean");
const direct_hoist_120 = new ObjectRuntype(undefined, {
    "a": direct_hoist_13,
    "b": direct_hoist_17,
    "z": direct_hoist_119
}, []);
const direct_hoist_121 = new TypedArrayRuntype(undefined, "Int32Array");
const direct_hoist_122 = new RefRuntype(undefined, "IA");
const direct_hoist_123 = new RefRuntype(undefined, "IB");
const direct_hoist_124 = new AllOfRuntype(undefined, [
    direct_hoist_122,
    direct_hoist_123
]);
const direct_hoist_125 = new AnyOfRuntype(undefined, [
    direct_hoist_13,
    direct_hoist_17
]);
const direct_hoist_126 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_13,
        "value": direct_hoist_125
    }
]);
const direct_hoist_127 = new ObjectRuntype(undefined, {
    "n": direct_hoist_17
}, []);
const direct_hoist_128 = new AllOfRuntype(undefined, [
    direct_hoist_126,
    direct_hoist_127,
    direct_hoist_122
]);
const direct_hoist_129 = new ObjectRuntype(undefined, {
    "x": direct_hoist_13
}, []);
const direct_hoist_130 = new ObjectRuntype(undefined, {
    "n": direct_hoist_129
}, []);
const direct_hoist_131 = new AllOfRuntype(undefined, [
    direct_hoist_130,
    direct_hoist_123
]);
const direct_hoist_132 = new AllOfRuntype(undefined, [
    direct_hoist_122,
    direct_hoist_131
]);
const direct_hoist_133 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_13),
    "b": new OptionalFieldRuntype(direct_hoist_17)
}, []);
const direct_hoist_134 = new ObjectRuntype(undefined, {
    "a": direct_hoist_13,
    "b": direct_hoist_17,
    "d0": direct_hoist_13,
    "e": direct_hoist_17
}, []);
const direct_hoist_135 = new AllOfRuntype(undefined, [
    direct_hoist_133,
    direct_hoist_134
]);
const direct_hoist_136 = new ObjectRuntype(undefined, {
    "c": new OptionalFieldRuntype(direct_hoist_13)
}, []);
const direct_hoist_137 = new AllOfRuntype(undefined, [
    direct_hoist_136,
    direct_hoist_122
]);
const direct_hoist_138 = new ConstRuntype(undefined, "u");
const direct_hoist_139 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_138,
    "u": direct_hoist_13
}, []);
const direct_hoist_140 = new ConstRuntype(undefined, "v");
const direct_hoist_141 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_140,
    "v": new OptionalFieldRuntype(direct_hoist_17)
}, []);
const direct_hoist_142 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_139,
    direct_hoist_141
], "kind", {
    "u": direct_hoist_139,
    "v": direct_hoist_141
}, {
    "u": direct_hoist_139,
    "v": direct_hoist_141
});
const direct_hoist_143 = new AllOfRuntype(undefined, [
    direct_hoist_122,
    direct_hoist_142
]);
const direct_hoist_144 = new AnyOfConstsRuntype(undefined, [
    "a"
]);
const direct_hoist_145 = new NeverRuntype(undefined);
const direct_hoist_146 = new RegexRuntype(undefined, /^((a)|(b))(-)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, '`("a" | "b")-${number}`');
const direct_hoist_147 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_102
}, []);
const direct_hoist_148 = new AnyOfConstsRuntype(undefined, [
    "a",
    "b"
]);
const direct_hoist_149 = new ObjectRuntype(undefined, {
    "d": direct_hoist_147,
    "level": direct_hoist_148
}, []);
const direct_hoist_150 = new MapRuntype(undefined, direct_hoist_13, direct_hoist_17);
const direct_hoist_151 = new ObjectRuntype(undefined, {
    "value": direct_hoist_56
}, []);
const direct_hoist_152 = new ObjectRuntype(undefined, {
    "value": direct_hoist_91
}, []);
const direct_hoist_153 = new ObjectRuntype(undefined, {
    "a": direct_hoist_151,
    "b": direct_hoist_152
}, []);
const direct_hoist_154 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_151),
    "b": new OptionalFieldRuntype(direct_hoist_152)
}, []);
const direct_hoist_155 = new ObjectRuntype(undefined, {
    "A": direct_hoist_13
}, []);
const direct_hoist_156 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_13),
    "b": new OptionalFieldRuntype(direct_hoist_13)
}, []);
const direct_hoist_157 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_13),
    "d": new OptionalFieldRuntype(direct_hoist_147),
    "level": new OptionalFieldRuntype(direct_hoist_148)
}, []);
const direct_hoist_158 = new RegexRuntype(undefined, /^(a)([\s\S]*)$/, "`a${string}`");
const direct_hoist_159 = new ObjectRuntype(undefined, {
    "accessLevel": direct_hoist_48,
    "avatarSize": direct_hoist_54,
    "extra": direct_hoist_34,
    "name": direct_hoist_13
}, []);
const direct_hoist_160 = new RefRuntype(undefined, "Repro2");
const direct_hoist_161 = new ObjectRuntype(undefined, {
    "sizes": new OptionalFieldRuntype(direct_hoist_160)
}, []);
const direct_hoist_162 = new ObjectRuntype(undefined, {
    "useSmallerSizes": direct_hoist_119
}, []);
const direct_hoist_163 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_13,
        "value": direct_hoist_17
    }
]);
const direct_hoist_164 = new ObjectRuntype(undefined, {
    "accountEndpoints": direct_hoist_163
}, []);
const direct_hoist_165 = new ObjectRuntype(undefined, {}, [
    {
        "key": new NumberKeyRuntype(undefined),
        "value": direct_hoist_17
    }
]);
const direct_hoist_166 = new ObjectRuntype(undefined, {
    "accountEndpoints": direct_hoist_165
}, []);
const direct_hoist_167 = new ObjectRuntype(undefined, {
    "optional": direct_hoist_13
}, []);
const direct_hoist_168 = new ObjectRuntype(undefined, {
    "a": direct_hoist_13,
    "b": direct_hoist_17
}, []);
const direct_hoist_169 = new SetRuntype(undefined, direct_hoist_13);
const direct_hoist_170 = new ObjectRuntype(undefined, {
    "a": direct_hoist_13,
    "d": direct_hoist_147,
    "level": direct_hoist_148
}, []);
const direct_hoist_171 = new AnyOfRuntype(undefined, [
    direct_hoist_13,
    direct_hoist_56,
    direct_hoist_91,
    direct_hoist_147
]);
const direct_hoist_172 = new ConstRuntype(undefined, "circle");
const direct_hoist_173 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_172,
    "radius": direct_hoist_17
}, []);
const direct_hoist_174 = new ConstRuntype(undefined, "square");
const direct_hoist_175 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_174,
    "x": direct_hoist_17
}, []);
const direct_hoist_176 = new ConstRuntype(undefined, "triangle");
const direct_hoist_177 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_176,
    "x": direct_hoist_17,
    "y": direct_hoist_17
}, []);
const direct_hoist_178 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_173,
    direct_hoist_175,
    direct_hoist_177
], "kind", {
    "circle": direct_hoist_173,
    "square": direct_hoist_175,
    "triangle": direct_hoist_177
}, {
    "circle": direct_hoist_173,
    "square": direct_hoist_175,
    "triangle": direct_hoist_177
});
const direct_hoist_179 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_175,
    direct_hoist_177
], "kind", {
    "square": direct_hoist_175,
    "triangle": direct_hoist_177
}, {
    "square": direct_hoist_175,
    "triangle": direct_hoist_177
});
const direct_hoist_180 = new NullishRuntype(undefined, "null");
const direct_hoist_181 = new AnyOfRuntype(undefined, [
    direct_hoist_180,
    direct_hoist_77,
    direct_hoist_13,
    direct_hoist_17
]);
const direct_hoist_182 = new ArrayRuntype(undefined, direct_hoist_181);
const direct_hoist_183 = new AnyOfRuntype(undefined, [
    direct_hoist_180,
    direct_hoist_77,
    direct_hoist_13,
    direct_hoist_182
]);
const direct_hoist_184 = new TypedArrayRuntype(undefined, "Uint8Array");
const direct_hoist_185 = new RefRuntype(undefined, "OtherEnum__A");
const direct_hoist_186 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_185,
    "value": direct_hoist_13
}, []);
const direct_hoist_187 = new RefRuntype(undefined, "OtherEnum__B");
const direct_hoist_188 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_187,
    "value": direct_hoist_17
}, []);
const direct_hoist_189 = new RefRuntype(undefined, "OtherEnum2__C");
const direct_hoist_190 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_189,
    "value": direct_hoist_119
}, []);
const direct_hoist_191 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_190,
    direct_hoist_186,
    direct_hoist_188
], "tag", {
    "a": direct_hoist_186,
    "b": direct_hoist_188,
    "c": direct_hoist_190
}, {
    "a": direct_hoist_186,
    "b": direct_hoist_188,
    "c": direct_hoist_190
});
const direct_hoist_192 = new ArrayRuntype(undefined, direct_hoist_35);
const direct_hoist_193 = new ObjectRuntype(undefined, {
    "accessLevel": direct_hoist_48,
    "avatarSize": direct_hoist_54,
    "extra": direct_hoist_34,
    "friends": direct_hoist_192,
    "name": direct_hoist_13
}, []);
const direct_hoist_194 = new RegexRuntype(undefined, /^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}.${number}.${number}`");
const direct_hoist_195 = new RegexRuntype(undefined, /^(v)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`v${number}.${number}.${number}`");
const direct_hoist_196 = new ObjectRuntype(undefined, {
    "optional": new OptionalFieldRuntype(direct_hoist_13)
}, []);
const direct_hoist_197 = new RefRuntype(undefined, "DtsStatus");
const direct_hoist_198 = new ObjectRuntype(undefined, {
    "enabled": direct_hoist_119,
    "status": direct_hoist_197
}, []);
const direct_hoist_199 = new AnyOfConstsRuntype(undefined, [
    "off",
    "on"
]);
const direct_hoist_200 = new AnyOfConstsRuntype(undefined, [
    "active",
    "closed",
    "pending"
]);
const direct_hoist_201 = new RefRuntype(undefined, "TsxLabel");
const direct_hoist_202 = new ObjectRuntype(undefined, {
    "id": direct_hoist_13,
    "label": direct_hoist_201
}, []);
const direct_hoist_203 = new AnyOfConstsRuntype(undefined, [
    "A",
    "B",
    "C"
]);
const direct_hoist_204 = new AnyOfConstsRuntype(undefined, [
    "X",
    "Y"
]);
const direct_hoist_205 = new StringWithFormatRuntype(undefined, [
    "ValidCurrency"
]);
const direct_hoist_206 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_205,
        "value": direct_hoist_63
    }
]);
const direct_hoist_207 = new NumberWithFormatRuntype(undefined, [
    "NonInfiniteNumber"
]);
const direct_hoist_208 = new NumberWithFormatRuntype(undefined, [
    "NonInfiniteNumber",
    "NonNegativeNumber"
]);
const direct_hoist_209 = new NumberWithFormatRuntype(undefined, [
    "NonInfiniteNumber",
    "NonNegativeNumber",
    "Rate"
]);
const direct_hoist_210 = new StringWithFormatRuntype(undefined, [
    "UserId",
    "ReadAuthorizedUserId"
]);
const direct_hoist_211 = new StringWithFormatRuntype(undefined, [
    "UserId"
]);
const direct_hoist_212 = new StringWithFormatRuntype(undefined, [
    "UserId",
    "ReadAuthorizedUserId",
    "WriteAuthorizedUserId"
]);
const direct_hoist_213 = new ConstRuntype(undefined, "c");
const namedRuntypes = {
    "DeploymentState": direct_hoist_76,
    "Query": direct_hoist_82,
    "ABC": direct_hoist_83,
    "AObject": direct_hoist_84,
    "AccessLevel": direct_hoist_85,
    "AccessLevel2": direct_hoist_86,
    "AccessLevelTpl": direct_hoist_87,
    "AccessLevelTpl2": direct_hoist_88,
    "AllTypes": direct_hoist_89,
    "AvatarSize": direct_hoist_90,
    "BObject": direct_hoist_92,
    "BigInt64ArrayType": direct_hoist_93,
    "DEF": direct_hoist_94,
    "DiscriminatedUnion": direct_hoist_101,
    "DiscriminatedUnion2": direct_hoist_104,
    "DiscriminatedUnion3": direct_hoist_107,
    "DiscriminatedUnion4": direct_hoist_112,
    "Extra": direct_hoist_113,
    "FlagTpl": direct_hoist_114,
    "Float64ArrayType": direct_hoist_115,
    "IA": direct_hoist_94,
    "IB": direct_hoist_116,
    "IBase": direct_hoist_117,
    "IExtra": direct_hoist_118,
    "IOther": direct_hoist_120,
    "Int32ArrayType": direct_hoist_121,
    "Intersection": direct_hoist_124,
    "IntersectionIndex": direct_hoist_128,
    "IntersectionNested": direct_hoist_132,
    "IntersectionOmitPick": direct_hoist_135,
    "IntersectionPartial": direct_hoist_137,
    "IntersectionUnion": direct_hoist_143,
    "K": direct_hoist_144,
    "KABC": direct_hoist_145,
    "KDEF": direct_hoist_56,
    "KeyedNumber": direct_hoist_146,
    "LevelAndDSettings": direct_hoist_149,
    "M1": direct_hoist_150,
    "Mapped": direct_hoist_153,
    "MappedOptional": direct_hoist_154,
    "OmitSettings": direct_hoist_149,
    "OnlyAKey": direct_hoist_155,
    "PartialObject": direct_hoist_133,
    "PartialRepro": direct_hoist_156,
    "PartialSettings": direct_hoist_157,
    "PrefixedString": direct_hoist_158,
    "PublicUser": direct_hoist_159,
    "Repro1": direct_hoist_161,
    "Repro2": direct_hoist_162,
    "Repro5": direct_hoist_164,
    "Repro6": direct_hoist_166,
    "Req": direct_hoist_167,
    "RequiredPartialObject": direct_hoist_168,
    "S1": direct_hoist_169,
    "Settings": direct_hoist_170,
    "SettingsUpdate": direct_hoist_171,
    "Shape": direct_hoist_178,
    "T3": direct_hoist_179,
    "TransportedValue": direct_hoist_183,
    "Uint8ArrayType": direct_hoist_184,
    "UnionWithEnumAccess": direct_hoist_191,
    "User": direct_hoist_193,
    "Version": direct_hoist_194,
    "Version2": direct_hoist_195,
    "WithOptionals": direct_hoist_196,
    "DtsConfig": direct_hoist_198,
    "DtsStatus": direct_hoist_199,
    "TsxLabel": direct_hoist_200,
    "TsxTask": direct_hoist_202,
    "Arr2": direct_hoist_203,
    "OtherEnum": direct_hoist_148,
    "Arr3": direct_hoist_204,
    "CurrencyPrices": direct_hoist_206,
    "NonInfiniteNumber": direct_hoist_207,
    "NonNegativeNumber": direct_hoist_208,
    "Rate": direct_hoist_209,
    "ReadAuthorizedUserId": direct_hoist_210,
    "UserId": direct_hoist_211,
    "ValidCurrency": direct_hoist_205,
    "WriteAuthorizedUserId": direct_hoist_212,
    "AllTs": direct_hoist_148,
    "OtherEnum__A": direct_hoist_56,
    "OtherEnum__B": direct_hoist_91,
    "OtherEnum2__C": direct_hoist_213
};
const buildParsersInput = {
    "Intersection": direct_hoist_0,
    "IntersectionPartial": direct_hoist_1,
    "IntersectionOmitPick": direct_hoist_2,
    "IntersectionNested": direct_hoist_3,
    "IntersectionIndex": direct_hoist_4,
    "IntersectionUnion": direct_hoist_5,
    "Repro5": direct_hoist_6,
    "Repro6": direct_hoist_7,
    "M1": direct_hoist_8,
    "S1": direct_hoist_9,
    "PartialRepro": direct_hoist_10,
    "TransportedValue": direct_hoist_11,
    "OnlyAKey": direct_hoist_12,
    "ObjectWithArr": direct_hoist_15,
    "BigIntCodec": direct_hoist_16,
    "TupleCodec": direct_hoist_18,
    "TupleCodecRest": direct_hoist_19,
    "StringArrCodec": direct_hoist_14,
    "AllTs": direct_hoist_20,
    "AObject": direct_hoist_21,
    "Version": direct_hoist_22,
    "Version2": direct_hoist_23,
    "PrefixedString": direct_hoist_24,
    "KeyedNumber": direct_hoist_25,
    "FlagTpl": direct_hoist_26,
    "AccessLevelTpl2": direct_hoist_27,
    "AccessLevelTpl": direct_hoist_28,
    "Arr3": direct_hoist_29,
    "OmitSettings": direct_hoist_30,
    "RequiredPartialObject": direct_hoist_31,
    "LevelAndDSettings": direct_hoist_32,
    "PartialSettings": direct_hoist_33,
    "Extra": direct_hoist_34,
    "User": direct_hoist_35,
    "PublicUser": direct_hoist_36,
    "Req": direct_hoist_37,
    "Repro1": direct_hoist_38,
    "SettingsUpdate": direct_hoist_39,
    "Mapped": direct_hoist_40,
    "MappedOptional": direct_hoist_41,
    "PartialObject": direct_hoist_42,
    "DiscriminatedUnion": direct_hoist_43,
    "DiscriminatedUnion2": direct_hoist_44,
    "DiscriminatedUnion3": direct_hoist_45,
    "DiscriminatedUnion4": direct_hoist_46,
    "AllTypes": direct_hoist_47,
    "AccessLevel": direct_hoist_48,
    "OtherEnum": direct_hoist_49,
    "Arr2C": direct_hoist_50,
    "ValidCurrency": direct_hoist_51,
    "UnionWithEnumAccess": direct_hoist_52,
    "T3": direct_hoist_53,
    "AccessLevelCodec": direct_hoist_48,
    "AvatarSize": direct_hoist_54,
    "BObject": direct_hoist_55,
    "ImportEnumTypeof": direct_hoist_57,
    "KDEF": direct_hoist_58,
    "KABC": direct_hoist_59,
    "K": direct_hoist_60,
    "NonNegativeNumber": direct_hoist_61,
    "NonInfiniteNumber": direct_hoist_62,
    "Rate": direct_hoist_63,
    "UserId": direct_hoist_64,
    "ReadAuthorizedUserId": direct_hoist_65,
    "WriteAuthorizedUserId": direct_hoist_66,
    "CurrencyPrices": direct_hoist_67,
    "Uint8ArrayCodec": direct_hoist_68,
    "Int32ArrayCodec": direct_hoist_69,
    "Float64ArrayCodec": direct_hoist_70,
    "BigInt64ArrayCodec": direct_hoist_71,
    "TsxTask": direct_hoist_72,
    "Query": direct_hoist_73,
    "DtsConfig": direct_hoist_74,
    "DeploymentState": direct_hoist_75
};

export default { buildParsers };