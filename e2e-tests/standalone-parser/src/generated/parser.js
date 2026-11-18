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
const direct_hoist_0 = new RefRuntype(undefined, "Repro5");
const direct_hoist_1 = new RefRuntype(undefined, "Repro6");
const direct_hoist_2 = new RefRuntype(undefined, "M1");
const direct_hoist_3 = new RefRuntype(undefined, "S1");
const direct_hoist_4 = new RefRuntype(undefined, "PartialRepro");
const direct_hoist_5 = new RefRuntype(undefined, "TransportedValue");
const direct_hoist_6 = new RefRuntype(undefined, "OnlyAKey");
const direct_hoist_7 = new TypeofRuntype(undefined, "string");
const direct_hoist_8 = new ArrayRuntype(undefined, direct_hoist_7);
const direct_hoist_9 = new ObjectRuntype(undefined, {
    "a": direct_hoist_8
}, []);
const direct_hoist_10 = new BigIntRuntype(undefined);
const direct_hoist_11 = new TypeofRuntype(undefined, "number");
const direct_hoist_12 = new TupleRuntype(undefined, [
    direct_hoist_11,
    direct_hoist_11,
    direct_hoist_11
], null);
const direct_hoist_13 = new TupleRuntype(undefined, [
    direct_hoist_11,
    direct_hoist_11
], direct_hoist_7);
const direct_hoist_14 = new RefRuntype(undefined, "AllTs");
const direct_hoist_15 = new RefRuntype(undefined, "AObject");
const direct_hoist_16 = new RefRuntype(undefined, "Version");
const direct_hoist_17 = new RefRuntype(undefined, "Version2");
const direct_hoist_18 = new RefRuntype(undefined, "PrefixedString");
const direct_hoist_19 = new RefRuntype(undefined, "KeyedNumber");
const direct_hoist_20 = new RefRuntype(undefined, "FlagTpl");
const direct_hoist_21 = new RefRuntype(undefined, "AccessLevelTpl2");
const direct_hoist_22 = new RefRuntype(undefined, "AccessLevelTpl");
const direct_hoist_23 = new RefRuntype(undefined, "Arr3");
const direct_hoist_24 = new RefRuntype(undefined, "OmitSettings");
const direct_hoist_25 = new RefRuntype(undefined, "RequiredPartialObject");
const direct_hoist_26 = new RefRuntype(undefined, "LevelAndDSettings");
const direct_hoist_27 = new RefRuntype(undefined, "PartialSettings");
const direct_hoist_28 = new RefRuntype(undefined, "Extra");
const direct_hoist_29 = new RefRuntype(undefined, "User");
const direct_hoist_30 = new RefRuntype(undefined, "PublicUser");
const direct_hoist_31 = new RefRuntype(undefined, "Req");
const direct_hoist_32 = new RefRuntype(undefined, "Repro1");
const direct_hoist_33 = new RefRuntype(undefined, "SettingsUpdate");
const direct_hoist_34 = new RefRuntype(undefined, "Mapped");
const direct_hoist_35 = new RefRuntype(undefined, "MappedOptional");
const direct_hoist_36 = new RefRuntype(undefined, "PartialObject");
const direct_hoist_37 = new RefRuntype(undefined, "DiscriminatedUnion");
const direct_hoist_38 = new RefRuntype(undefined, "DiscriminatedUnion2");
const direct_hoist_39 = new RefRuntype(undefined, "DiscriminatedUnion3");
const direct_hoist_40 = new RefRuntype(undefined, "DiscriminatedUnion4");
const direct_hoist_41 = new RefRuntype(undefined, "AllTypes");
const direct_hoist_42 = new RefRuntype(undefined, "AccessLevel");
const direct_hoist_43 = new RefRuntype(undefined, "OtherEnum");
const direct_hoist_44 = new RefRuntype(undefined, "Arr2");
const direct_hoist_45 = new RefRuntype(undefined, "ValidCurrency");
const direct_hoist_46 = new RefRuntype(undefined, "UnionWithEnumAccess");
const direct_hoist_47 = new RefRuntype(undefined, "T3");
const direct_hoist_48 = new RefRuntype(undefined, "AvatarSize");
const direct_hoist_49 = new RefRuntype(undefined, "BObject");
const direct_hoist_50 = new ConstRuntype(undefined, "a");
const direct_hoist_51 = new ObjectRuntype(undefined, {
    "A": direct_hoist_50
}, []);
const direct_hoist_52 = new RefRuntype(undefined, "KDEF");
const direct_hoist_53 = new RefRuntype(undefined, "KABC");
const direct_hoist_54 = new RefRuntype(undefined, "K");
const direct_hoist_55 = new RefRuntype(undefined, "NonNegativeNumber");
const direct_hoist_56 = new RefRuntype(undefined, "NonInfiniteNumber");
const direct_hoist_57 = new RefRuntype(undefined, "Rate");
const direct_hoist_58 = new RefRuntype(undefined, "UserId");
const direct_hoist_59 = new RefRuntype(undefined, "ReadAuthorizedUserId");
const direct_hoist_60 = new RefRuntype(undefined, "WriteAuthorizedUserId");
const direct_hoist_61 = new RefRuntype(undefined, "CurrencyPrices");
const direct_hoist_62 = new RefRuntype(undefined, "Uint8ArrayType");
const direct_hoist_63 = new RefRuntype(undefined, "Int32ArrayType");
const direct_hoist_64 = new RefRuntype(undefined, "Float64ArrayType");
const direct_hoist_65 = new RefRuntype(undefined, "BigInt64ArrayType");
const direct_hoist_66 = new RefRuntype(undefined, "TsxTask");
const direct_hoist_67 = new RefRuntype(undefined, "Query");
const direct_hoist_68 = new RefRuntype(undefined, "DtsConfig");
const direct_hoist_69 = new RefRuntype(undefined, "DeploymentState");
const direct_hoist_70 = new AnyOfConstsRuntype(undefined, [
    "deployed",
    "failed",
    "pending"
]);
const direct_hoist_71 = new NullishRuntype(undefined, "undefined");
const direct_hoist_72 = new AnyOfConstsRuntype(undefined, [
    "asc",
    "desc"
]);
const direct_hoist_73 = new AnyOfConstsRuntype(undefined, [
    "age",
    "name"
]);
const direct_hoist_74 = new ObjectRuntype(undefined, {
    "direction": direct_hoist_72,
    "field": direct_hoist_73
}, []);
const direct_hoist_75 = new AnyOfRuntype(undefined, [
    direct_hoist_71,
    direct_hoist_74
]);
const direct_hoist_76 = new ObjectRuntype(undefined, {
    "orderBy": direct_hoist_75
}, []);
const direct_hoist_77 = new ObjectRuntype(undefined, {}, []);
const direct_hoist_78 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_50
}, []);
const direct_hoist_79 = new AnyOfConstsRuntype(undefined, [
    "ADMIN",
    "USER"
]);
const direct_hoist_80 = new AnyOfConstsRuntype(undefined, [
    "ADMIN Admin",
    "USER User"
]);
const direct_hoist_81 = new RegexRuntype(undefined, /^((ADMIN)|(USER))$/, '`("ADMIN" | "USER")`');
const direct_hoist_82 = new RegexRuntype(undefined, /^((ADMIN Admin)|(USER User))$/, '`("ADMIN Admin" | "USER User")`');
const direct_hoist_83 = new AnyOfConstsRuntype(undefined, [
    "LevelAndDSettings",
    "OmitSettings",
    "PartialSettings",
    "RequiredPartialObject"
]);
const direct_hoist_84 = new RegexRuntype(undefined, /^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(x)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}x${number}`");
const direct_hoist_85 = new ConstRuntype(undefined, "b");
const direct_hoist_86 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_85
}, []);
const direct_hoist_87 = new TypedArrayRuntype(undefined, "BigInt64Array");
const direct_hoist_88 = new ObjectRuntype(undefined, {
    "a": direct_hoist_7
}, []);
const direct_hoist_89 = new ConstRuntype(undefined, "a1");
const direct_hoist_90 = new ObjectRuntype(undefined, {
    "a1": direct_hoist_7,
    "a11": new OptionalFieldRuntype(direct_hoist_7),
    "subType": direct_hoist_89,
    "type": direct_hoist_50
}, []);
const direct_hoist_91 = new ConstRuntype(undefined, "a2");
const direct_hoist_92 = new ObjectRuntype(undefined, {
    "a2": direct_hoist_7,
    "subType": direct_hoist_91,
    "type": direct_hoist_50
}, []);
const direct_hoist_93 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_90,
    direct_hoist_92
], "subType", {
    "a1": direct_hoist_90,
    "a2": direct_hoist_92
}, {
    "a1": direct_hoist_90,
    "a2": direct_hoist_92
});
const direct_hoist_94 = new ObjectRuntype(undefined, {
    "type": direct_hoist_85,
    "value": direct_hoist_11
}, []);
const direct_hoist_95 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_90,
    direct_hoist_92,
    direct_hoist_94
], "type", {
    "a": direct_hoist_93,
    "b": direct_hoist_94
}, {
    "a": direct_hoist_93,
    "b": direct_hoist_94
});
const direct_hoist_96 = new ConstRuntype(undefined, "d");
const direct_hoist_97 = new ObjectRuntype(undefined, {
    "type": new OptionalFieldRuntype(direct_hoist_96),
    "valueD": direct_hoist_11
}, []);
const direct_hoist_98 = new AnyOfRuntype(undefined, [
    direct_hoist_90,
    direct_hoist_92,
    direct_hoist_97,
    direct_hoist_94
]);
const direct_hoist_99 = new AnyOfConstsRuntype(undefined, [
    "a",
    "c"
]);
const direct_hoist_100 = new ObjectRuntype(undefined, {
    "a1": direct_hoist_7,
    "type": direct_hoist_99
}, []);
const direct_hoist_101 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_100,
    direct_hoist_94
], "type", {
    "a": direct_hoist_100,
    "b": direct_hoist_94,
    "c": direct_hoist_100
}, {
    "a": direct_hoist_100,
    "b": direct_hoist_94,
    "c": direct_hoist_100
});
const direct_hoist_102 = new ObjectRuntype(undefined, {
    "a1": direct_hoist_7,
    "subType": direct_hoist_89
}, []);
const direct_hoist_103 = new ObjectRuntype(undefined, {
    "a": direct_hoist_102,
    "type": direct_hoist_50
}, []);
const direct_hoist_104 = new ObjectRuntype(undefined, {
    "a2": direct_hoist_7,
    "subType": direct_hoist_91
}, []);
const direct_hoist_105 = new ObjectRuntype(undefined, {
    "a": direct_hoist_104,
    "type": direct_hoist_50
}, []);
const direct_hoist_106 = new AnyOfRuntype(undefined, [
    direct_hoist_103,
    direct_hoist_105
]);
const direct_hoist_107 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_7,
        "value": direct_hoist_7
    }
]);
const direct_hoist_108 = new RegexRuntype(undefined, /^(true|false)$/, "`${boolean}`");
const direct_hoist_109 = new TypedArrayRuntype(undefined, "Float64Array");
const direct_hoist_110 = new TypedArrayRuntype(undefined, "Int32Array");
const direct_hoist_111 = new AnyOfConstsRuntype(undefined, [
    "a"
]);
const direct_hoist_112 = new NeverRuntype(undefined);
const direct_hoist_113 = new RegexRuntype(undefined, /^((a)|(b))(-)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, '`("a" | "b")-${number}`');
const direct_hoist_114 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_96
}, []);
const direct_hoist_115 = new AnyOfConstsRuntype(undefined, [
    "a",
    "b"
]);
const direct_hoist_116 = new ObjectRuntype(undefined, {
    "d": direct_hoist_114,
    "level": direct_hoist_115
}, []);
const direct_hoist_117 = new MapRuntype(undefined, direct_hoist_7, direct_hoist_11);
const direct_hoist_118 = new ObjectRuntype(undefined, {
    "value": direct_hoist_50
}, []);
const direct_hoist_119 = new ObjectRuntype(undefined, {
    "value": direct_hoist_85
}, []);
const direct_hoist_120 = new ObjectRuntype(undefined, {
    "a": direct_hoist_118,
    "b": direct_hoist_119
}, []);
const direct_hoist_121 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_118),
    "b": new OptionalFieldRuntype(direct_hoist_119)
}, []);
const direct_hoist_122 = new ObjectRuntype(undefined, {
    "A": direct_hoist_7
}, []);
const direct_hoist_123 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_7),
    "b": new OptionalFieldRuntype(direct_hoist_11)
}, []);
const direct_hoist_124 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_7),
    "b": new OptionalFieldRuntype(direct_hoist_7)
}, []);
const direct_hoist_125 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_7),
    "d": new OptionalFieldRuntype(direct_hoist_114),
    "level": new OptionalFieldRuntype(direct_hoist_115)
}, []);
const direct_hoist_126 = new RegexRuntype(undefined, /^(a)([\s\S]*)$/, "`a${string}`");
const direct_hoist_127 = new ObjectRuntype(undefined, {
    "accessLevel": direct_hoist_42,
    "avatarSize": direct_hoist_48,
    "extra": direct_hoist_28,
    "name": direct_hoist_7
}, []);
const direct_hoist_128 = new RefRuntype(undefined, "Repro2");
const direct_hoist_129 = new ObjectRuntype(undefined, {
    "sizes": new OptionalFieldRuntype(direct_hoist_128)
}, []);
const direct_hoist_130 = new TypeofRuntype(undefined, "boolean");
const direct_hoist_131 = new ObjectRuntype(undefined, {
    "useSmallerSizes": direct_hoist_130
}, []);
const direct_hoist_132 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_7,
        "value": direct_hoist_11
    }
]);
const direct_hoist_133 = new ObjectRuntype(undefined, {
    "accountEndpoints": direct_hoist_132
}, []);
const direct_hoist_134 = new ObjectRuntype(undefined, {}, [
    {
        "key": new NumberKeyRuntype(undefined),
        "value": direct_hoist_11
    }
]);
const direct_hoist_135 = new ObjectRuntype(undefined, {
    "accountEndpoints": direct_hoist_134
}, []);
const direct_hoist_136 = new ObjectRuntype(undefined, {
    "optional": direct_hoist_7
}, []);
const direct_hoist_137 = new ObjectRuntype(undefined, {
    "a": direct_hoist_7,
    "b": direct_hoist_11
}, []);
const direct_hoist_138 = new SetRuntype(undefined, direct_hoist_7);
const direct_hoist_139 = new ObjectRuntype(undefined, {
    "a": direct_hoist_7,
    "d": direct_hoist_114,
    "level": direct_hoist_115
}, []);
const direct_hoist_140 = new AnyOfRuntype(undefined, [
    direct_hoist_7,
    direct_hoist_50,
    direct_hoist_85,
    direct_hoist_114
]);
const direct_hoist_141 = new ConstRuntype(undefined, "circle");
const direct_hoist_142 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_141,
    "radius": direct_hoist_11
}, []);
const direct_hoist_143 = new ConstRuntype(undefined, "square");
const direct_hoist_144 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_143,
    "x": direct_hoist_11
}, []);
const direct_hoist_145 = new ConstRuntype(undefined, "triangle");
const direct_hoist_146 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_145,
    "x": direct_hoist_11,
    "y": direct_hoist_11
}, []);
const direct_hoist_147 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_142,
    direct_hoist_144,
    direct_hoist_146
], "kind", {
    "circle": direct_hoist_142,
    "square": direct_hoist_144,
    "triangle": direct_hoist_146
}, {
    "circle": direct_hoist_142,
    "square": direct_hoist_144,
    "triangle": direct_hoist_146
});
const direct_hoist_148 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_144,
    direct_hoist_146
], "kind", {
    "square": direct_hoist_144,
    "triangle": direct_hoist_146
}, {
    "square": direct_hoist_144,
    "triangle": direct_hoist_146
});
const direct_hoist_149 = new NullishRuntype(undefined, "null");
const direct_hoist_150 = new AnyOfRuntype(undefined, [
    direct_hoist_149,
    direct_hoist_71,
    direct_hoist_7,
    direct_hoist_11
]);
const direct_hoist_151 = new ArrayRuntype(undefined, direct_hoist_150);
const direct_hoist_152 = new AnyOfRuntype(undefined, [
    direct_hoist_149,
    direct_hoist_71,
    direct_hoist_7,
    direct_hoist_151
]);
const direct_hoist_153 = new TypedArrayRuntype(undefined, "Uint8Array");
const direct_hoist_154 = new RefRuntype(undefined, "OtherEnum__A");
const direct_hoist_155 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_154,
    "value": direct_hoist_7
}, []);
const direct_hoist_156 = new RefRuntype(undefined, "OtherEnum__B");
const direct_hoist_157 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_156,
    "value": direct_hoist_11
}, []);
const direct_hoist_158 = new RefRuntype(undefined, "OtherEnum2__C");
const direct_hoist_159 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_158,
    "value": direct_hoist_130
}, []);
const direct_hoist_160 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_159,
    direct_hoist_155,
    direct_hoist_157
], "tag", {
    "a": direct_hoist_155,
    "b": direct_hoist_157,
    "c": direct_hoist_159
}, {
    "a": direct_hoist_155,
    "b": direct_hoist_157,
    "c": direct_hoist_159
});
const direct_hoist_161 = new ArrayRuntype(undefined, direct_hoist_29);
const direct_hoist_162 = new ObjectRuntype(undefined, {
    "accessLevel": direct_hoist_42,
    "avatarSize": direct_hoist_48,
    "extra": direct_hoist_28,
    "friends": direct_hoist_161,
    "name": direct_hoist_7
}, []);
const direct_hoist_163 = new RegexRuntype(undefined, /^(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`${number}.${number}.${number}`");
const direct_hoist_164 = new RegexRuntype(undefined, /^(v)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)(\.)(-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?)$/, "`v${number}.${number}.${number}`");
const direct_hoist_165 = new ObjectRuntype(undefined, {
    "optional": new OptionalFieldRuntype(direct_hoist_7)
}, []);
const direct_hoist_166 = new RefRuntype(undefined, "DtsStatus");
const direct_hoist_167 = new ObjectRuntype(undefined, {
    "enabled": direct_hoist_130,
    "status": direct_hoist_166
}, []);
const direct_hoist_168 = new AnyOfConstsRuntype(undefined, [
    "off",
    "on"
]);
const direct_hoist_169 = new AnyOfConstsRuntype(undefined, [
    "active",
    "closed",
    "pending"
]);
const direct_hoist_170 = new RefRuntype(undefined, "TsxLabel");
const direct_hoist_171 = new ObjectRuntype(undefined, {
    "id": direct_hoist_7,
    "label": direct_hoist_170
}, []);
const direct_hoist_172 = new AnyOfConstsRuntype(undefined, [
    "A",
    "B",
    "C"
]);
const direct_hoist_173 = new AnyOfConstsRuntype(undefined, [
    "X",
    "Y"
]);
const direct_hoist_174 = new StringWithFormatRuntype(undefined, [
    "ValidCurrency"
]);
const direct_hoist_175 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_174,
        "value": direct_hoist_57
    }
]);
const direct_hoist_176 = new NumberWithFormatRuntype(undefined, [
    "NonInfiniteNumber"
]);
const direct_hoist_177 = new NumberWithFormatRuntype(undefined, [
    "NonInfiniteNumber",
    "NonNegativeNumber"
]);
const direct_hoist_178 = new NumberWithFormatRuntype(undefined, [
    "NonInfiniteNumber",
    "NonNegativeNumber",
    "Rate"
]);
const direct_hoist_179 = new StringWithFormatRuntype(undefined, [
    "UserId",
    "ReadAuthorizedUserId"
]);
const direct_hoist_180 = new StringWithFormatRuntype(undefined, [
    "UserId"
]);
const direct_hoist_181 = new StringWithFormatRuntype(undefined, [
    "UserId",
    "ReadAuthorizedUserId",
    "WriteAuthorizedUserId"
]);
const direct_hoist_182 = new ConstRuntype(undefined, "c");
const namedRuntypes = {
    "DeploymentState": direct_hoist_70,
    "Query": direct_hoist_76,
    "ABC": direct_hoist_77,
    "AObject": direct_hoist_78,
    "AccessLevel": direct_hoist_79,
    "AccessLevel2": direct_hoist_80,
    "AccessLevelTpl": direct_hoist_81,
    "AccessLevelTpl2": direct_hoist_82,
    "AllTypes": direct_hoist_83,
    "AvatarSize": direct_hoist_84,
    "BObject": direct_hoist_86,
    "BigInt64ArrayType": direct_hoist_87,
    "DEF": direct_hoist_88,
    "DiscriminatedUnion": direct_hoist_95,
    "DiscriminatedUnion2": direct_hoist_98,
    "DiscriminatedUnion3": direct_hoist_101,
    "DiscriminatedUnion4": direct_hoist_106,
    "Extra": direct_hoist_107,
    "FlagTpl": direct_hoist_108,
    "Float64ArrayType": direct_hoist_109,
    "Int32ArrayType": direct_hoist_110,
    "K": direct_hoist_111,
    "KABC": direct_hoist_112,
    "KDEF": direct_hoist_50,
    "KeyedNumber": direct_hoist_113,
    "LevelAndDSettings": direct_hoist_116,
    "M1": direct_hoist_117,
    "Mapped": direct_hoist_120,
    "MappedOptional": direct_hoist_121,
    "OmitSettings": direct_hoist_116,
    "OnlyAKey": direct_hoist_122,
    "PartialObject": direct_hoist_123,
    "PartialRepro": direct_hoist_124,
    "PartialSettings": direct_hoist_125,
    "PrefixedString": direct_hoist_126,
    "PublicUser": direct_hoist_127,
    "Repro1": direct_hoist_129,
    "Repro2": direct_hoist_131,
    "Repro5": direct_hoist_133,
    "Repro6": direct_hoist_135,
    "Req": direct_hoist_136,
    "RequiredPartialObject": direct_hoist_137,
    "S1": direct_hoist_138,
    "Settings": direct_hoist_139,
    "SettingsUpdate": direct_hoist_140,
    "Shape": direct_hoist_147,
    "T3": direct_hoist_148,
    "TransportedValue": direct_hoist_152,
    "Uint8ArrayType": direct_hoist_153,
    "UnionWithEnumAccess": direct_hoist_160,
    "User": direct_hoist_162,
    "Version": direct_hoist_163,
    "Version2": direct_hoist_164,
    "WithOptionals": direct_hoist_165,
    "DtsConfig": direct_hoist_167,
    "DtsStatus": direct_hoist_168,
    "TsxLabel": direct_hoist_169,
    "TsxTask": direct_hoist_171,
    "Arr2": direct_hoist_172,
    "OtherEnum": direct_hoist_115,
    "Arr3": direct_hoist_173,
    "CurrencyPrices": direct_hoist_175,
    "NonInfiniteNumber": direct_hoist_176,
    "NonNegativeNumber": direct_hoist_177,
    "Rate": direct_hoist_178,
    "ReadAuthorizedUserId": direct_hoist_179,
    "UserId": direct_hoist_180,
    "ValidCurrency": direct_hoist_174,
    "WriteAuthorizedUserId": direct_hoist_181,
    "AllTs": direct_hoist_115,
    "OtherEnum__A": direct_hoist_50,
    "OtherEnum__B": direct_hoist_85,
    "OtherEnum2__C": direct_hoist_182
};
const buildParsersInput = {
    "Repro5": direct_hoist_0,
    "Repro6": direct_hoist_1,
    "M1": direct_hoist_2,
    "S1": direct_hoist_3,
    "PartialRepro": direct_hoist_4,
    "TransportedValue": direct_hoist_5,
    "OnlyAKey": direct_hoist_6,
    "ObjectWithArr": direct_hoist_9,
    "BigIntCodec": direct_hoist_10,
    "TupleCodec": direct_hoist_12,
    "TupleCodecRest": direct_hoist_13,
    "StringArrCodec": direct_hoist_8,
    "AllTs": direct_hoist_14,
    "AObject": direct_hoist_15,
    "Version": direct_hoist_16,
    "Version2": direct_hoist_17,
    "PrefixedString": direct_hoist_18,
    "KeyedNumber": direct_hoist_19,
    "FlagTpl": direct_hoist_20,
    "AccessLevelTpl2": direct_hoist_21,
    "AccessLevelTpl": direct_hoist_22,
    "Arr3": direct_hoist_23,
    "OmitSettings": direct_hoist_24,
    "RequiredPartialObject": direct_hoist_25,
    "LevelAndDSettings": direct_hoist_26,
    "PartialSettings": direct_hoist_27,
    "Extra": direct_hoist_28,
    "User": direct_hoist_29,
    "PublicUser": direct_hoist_30,
    "Req": direct_hoist_31,
    "Repro1": direct_hoist_32,
    "SettingsUpdate": direct_hoist_33,
    "Mapped": direct_hoist_34,
    "MappedOptional": direct_hoist_35,
    "PartialObject": direct_hoist_36,
    "DiscriminatedUnion": direct_hoist_37,
    "DiscriminatedUnion2": direct_hoist_38,
    "DiscriminatedUnion3": direct_hoist_39,
    "DiscriminatedUnion4": direct_hoist_40,
    "AllTypes": direct_hoist_41,
    "AccessLevel": direct_hoist_42,
    "OtherEnum": direct_hoist_43,
    "Arr2C": direct_hoist_44,
    "ValidCurrency": direct_hoist_45,
    "UnionWithEnumAccess": direct_hoist_46,
    "T3": direct_hoist_47,
    "AccessLevelCodec": direct_hoist_42,
    "AvatarSize": direct_hoist_48,
    "BObject": direct_hoist_49,
    "ImportEnumTypeof": direct_hoist_51,
    "KDEF": direct_hoist_52,
    "KABC": direct_hoist_53,
    "K": direct_hoist_54,
    "NonNegativeNumber": direct_hoist_55,
    "NonInfiniteNumber": direct_hoist_56,
    "Rate": direct_hoist_57,
    "UserId": direct_hoist_58,
    "ReadAuthorizedUserId": direct_hoist_59,
    "WriteAuthorizedUserId": direct_hoist_60,
    "CurrencyPrices": direct_hoist_61,
    "Uint8ArrayCodec": direct_hoist_62,
    "Int32ArrayCodec": direct_hoist_63,
    "Float64ArrayCodec": direct_hoist_64,
    "BigInt64ArrayCodec": direct_hoist_65,
    "TsxTask": direct_hoist_66,
    "Query": direct_hoist_67,
    "DtsConfig": direct_hoist_68,
    "DeploymentState": direct_hoist_69
};

export default { buildParsers };