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
const direct_hoist_18 = new RefRuntype(undefined, "AccessLevelTpl2");
const direct_hoist_19 = new RefRuntype(undefined, "AccessLevelTpl");
const direct_hoist_20 = new RefRuntype(undefined, "Arr3");
const direct_hoist_21 = new RefRuntype(undefined, "OmitSettings");
const direct_hoist_22 = new RefRuntype(undefined, "RequiredPartialObject");
const direct_hoist_23 = new RefRuntype(undefined, "LevelAndDSettings");
const direct_hoist_24 = new RefRuntype(undefined, "PartialSettings");
const direct_hoist_25 = new RefRuntype(undefined, "Extra");
const direct_hoist_26 = new RefRuntype(undefined, "User");
const direct_hoist_27 = new RefRuntype(undefined, "PublicUser");
const direct_hoist_28 = new RefRuntype(undefined, "Req");
const direct_hoist_29 = new RefRuntype(undefined, "Repro1");
const direct_hoist_30 = new RefRuntype(undefined, "SettingsUpdate");
const direct_hoist_31 = new RefRuntype(undefined, "Mapped");
const direct_hoist_32 = new RefRuntype(undefined, "MappedOptional");
const direct_hoist_33 = new RefRuntype(undefined, "PartialObject");
const direct_hoist_34 = new RefRuntype(undefined, "DiscriminatedUnion");
const direct_hoist_35 = new RefRuntype(undefined, "DiscriminatedUnion2");
const direct_hoist_36 = new RefRuntype(undefined, "DiscriminatedUnion3");
const direct_hoist_37 = new RefRuntype(undefined, "DiscriminatedUnion4");
const direct_hoist_38 = new RefRuntype(undefined, "AllTypes");
const direct_hoist_39 = new RefRuntype(undefined, "AccessLevel");
const direct_hoist_40 = new RefRuntype(undefined, "OtherEnum");
const direct_hoist_41 = new RefRuntype(undefined, "Arr2");
const direct_hoist_42 = new RefRuntype(undefined, "ValidCurrency");
const direct_hoist_43 = new RefRuntype(undefined, "UnionWithEnumAccess");
const direct_hoist_44 = new RefRuntype(undefined, "T3");
const direct_hoist_45 = new RefRuntype(undefined, "AvatarSize");
const direct_hoist_46 = new RefRuntype(undefined, "BObject");
const direct_hoist_47 = new ConstRuntype(undefined, "a");
const direct_hoist_48 = new ObjectRuntype(undefined, {
    "A": direct_hoist_47
}, []);
const direct_hoist_49 = new RefRuntype(undefined, "KDEF");
const direct_hoist_50 = new RefRuntype(undefined, "KABC");
const direct_hoist_51 = new RefRuntype(undefined, "K");
const direct_hoist_52 = new RefRuntype(undefined, "NonNegativeNumber");
const direct_hoist_53 = new RefRuntype(undefined, "NonInfiniteNumber");
const direct_hoist_54 = new RefRuntype(undefined, "Rate");
const direct_hoist_55 = new RefRuntype(undefined, "UserId");
const direct_hoist_56 = new RefRuntype(undefined, "ReadAuthorizedUserId");
const direct_hoist_57 = new RefRuntype(undefined, "WriteAuthorizedUserId");
const direct_hoist_58 = new RefRuntype(undefined, "CurrencyPrices");
const direct_hoist_59 = new RefRuntype(undefined, "Uint8ArrayType");
const direct_hoist_60 = new RefRuntype(undefined, "Int32ArrayType");
const direct_hoist_61 = new RefRuntype(undefined, "Float64ArrayType");
const direct_hoist_62 = new RefRuntype(undefined, "BigInt64ArrayType");
const direct_hoist_63 = new RefRuntype(undefined, "TsxTask");
const direct_hoist_64 = new RefRuntype(undefined, "Query");
const direct_hoist_65 = new RefRuntype(undefined, "DtsConfig");
const direct_hoist_66 = new RefRuntype(undefined, "DeploymentState");
const direct_hoist_67 = new AnyOfConstsRuntype(undefined, [
    "deployed",
    "failed",
    "pending"
]);
const direct_hoist_68 = new NullishRuntype(undefined, "undefined");
const direct_hoist_69 = new AnyOfConstsRuntype(undefined, [
    "asc",
    "desc"
]);
const direct_hoist_70 = new AnyOfConstsRuntype(undefined, [
    "age",
    "name"
]);
const direct_hoist_71 = new ObjectRuntype(undefined, {
    "direction": direct_hoist_69,
    "field": direct_hoist_70
}, []);
const direct_hoist_72 = new AnyOfRuntype(undefined, [
    direct_hoist_68,
    direct_hoist_71
]);
const direct_hoist_73 = new ObjectRuntype(undefined, {
    "orderBy": direct_hoist_72
}, []);
const direct_hoist_74 = new ObjectRuntype(undefined, {}, []);
const direct_hoist_75 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_47
}, []);
const direct_hoist_76 = new AnyOfConstsRuntype(undefined, [
    "ADMIN",
    "USER"
]);
const direct_hoist_77 = new AnyOfConstsRuntype(undefined, [
    "ADMIN Admin",
    "USER User"
]);
const direct_hoist_78 = new RegexRuntype(undefined, /((ADMIN)|(USER))/, '`("ADMIN" | "USER")`');
const direct_hoist_79 = new RegexRuntype(undefined, /((ADMIN Admin)|(USER User))/, '`("ADMIN Admin" | "USER User")`');
const direct_hoist_80 = new AnyOfConstsRuntype(undefined, [
    "LevelAndDSettings",
    "OmitSettings",
    "PartialSettings",
    "RequiredPartialObject"
]);
const direct_hoist_81 = new RegexRuntype(undefined, /(\d+(\.\d+)?)(x)(\d+(\.\d+)?)/, "`${number}x${number}`");
const direct_hoist_82 = new ConstRuntype(undefined, "b");
const direct_hoist_83 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_82
}, []);
const direct_hoist_84 = new TypedArrayRuntype(undefined, "BigInt64Array");
const direct_hoist_85 = new ObjectRuntype(undefined, {
    "a": direct_hoist_7
}, []);
const direct_hoist_86 = new ConstRuntype(undefined, "a1");
const direct_hoist_87 = new ObjectRuntype(undefined, {
    "a1": direct_hoist_7,
    "a11": new OptionalFieldRuntype(direct_hoist_7),
    "subType": direct_hoist_86,
    "type": direct_hoist_47
}, []);
const direct_hoist_88 = new ConstRuntype(undefined, "a2");
const direct_hoist_89 = new ObjectRuntype(undefined, {
    "a2": direct_hoist_7,
    "subType": direct_hoist_88,
    "type": direct_hoist_47
}, []);
const direct_hoist_90 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_87,
    direct_hoist_89
], "subType", {
    "a1": direct_hoist_87,
    "a2": direct_hoist_89
}, {
    "a1": direct_hoist_87,
    "a2": direct_hoist_89
});
const direct_hoist_91 = new ObjectRuntype(undefined, {
    "type": direct_hoist_82,
    "value": direct_hoist_11
}, []);
const direct_hoist_92 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_87,
    direct_hoist_89,
    direct_hoist_91
], "type", {
    "a": direct_hoist_90,
    "b": direct_hoist_91
}, {
    "a": direct_hoist_90,
    "b": direct_hoist_91
});
const direct_hoist_93 = new ConstRuntype(undefined, "d");
const direct_hoist_94 = new ObjectRuntype(undefined, {
    "type": new OptionalFieldRuntype(direct_hoist_93),
    "valueD": direct_hoist_11
}, []);
const direct_hoist_95 = new AnyOfRuntype(undefined, [
    direct_hoist_87,
    direct_hoist_89,
    direct_hoist_94,
    direct_hoist_91
]);
const direct_hoist_96 = new AnyOfConstsRuntype(undefined, [
    "a",
    "c"
]);
const direct_hoist_97 = new ObjectRuntype(undefined, {
    "a1": direct_hoist_7,
    "type": direct_hoist_96
}, []);
const direct_hoist_98 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_97,
    direct_hoist_91
], "type", {
    "a": direct_hoist_97,
    "b": direct_hoist_91,
    "c": direct_hoist_97
}, {
    "a": direct_hoist_97,
    "b": direct_hoist_91,
    "c": direct_hoist_97
});
const direct_hoist_99 = new ObjectRuntype(undefined, {
    "a1": direct_hoist_7,
    "subType": direct_hoist_86
}, []);
const direct_hoist_100 = new ObjectRuntype(undefined, {
    "a": direct_hoist_99,
    "type": direct_hoist_47
}, []);
const direct_hoist_101 = new ObjectRuntype(undefined, {
    "a2": direct_hoist_7,
    "subType": direct_hoist_88
}, []);
const direct_hoist_102 = new ObjectRuntype(undefined, {
    "a": direct_hoist_101,
    "type": direct_hoist_47
}, []);
const direct_hoist_103 = new AnyOfRuntype(undefined, [
    direct_hoist_100,
    direct_hoist_102
]);
const direct_hoist_104 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_7,
        "value": direct_hoist_7
    }
]);
const direct_hoist_105 = new TypedArrayRuntype(undefined, "Float64Array");
const direct_hoist_106 = new TypedArrayRuntype(undefined, "Int32Array");
const direct_hoist_107 = new AnyOfConstsRuntype(undefined, [
    "a"
]);
const direct_hoist_108 = new NeverRuntype(undefined);
const direct_hoist_109 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_93
}, []);
const direct_hoist_110 = new AnyOfConstsRuntype(undefined, [
    "a",
    "b"
]);
const direct_hoist_111 = new ObjectRuntype(undefined, {
    "d": direct_hoist_109,
    "level": direct_hoist_110
}, []);
const direct_hoist_112 = new MapRuntype(undefined, direct_hoist_7, direct_hoist_11);
const direct_hoist_113 = new ObjectRuntype(undefined, {
    "value": direct_hoist_47
}, []);
const direct_hoist_114 = new ObjectRuntype(undefined, {
    "value": direct_hoist_82
}, []);
const direct_hoist_115 = new ObjectRuntype(undefined, {
    "a": direct_hoist_113,
    "b": direct_hoist_114
}, []);
const direct_hoist_116 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_113),
    "b": new OptionalFieldRuntype(direct_hoist_114)
}, []);
const direct_hoist_117 = new ObjectRuntype(undefined, {
    "A": direct_hoist_7
}, []);
const direct_hoist_118 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_7),
    "b": new OptionalFieldRuntype(direct_hoist_11)
}, []);
const direct_hoist_119 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_7),
    "b": new OptionalFieldRuntype(direct_hoist_7)
}, []);
const direct_hoist_120 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_7),
    "d": new OptionalFieldRuntype(direct_hoist_109),
    "level": new OptionalFieldRuntype(direct_hoist_110)
}, []);
const direct_hoist_121 = new ObjectRuntype(undefined, {
    "accessLevel": direct_hoist_39,
    "avatarSize": direct_hoist_45,
    "extra": direct_hoist_25,
    "name": direct_hoist_7
}, []);
const direct_hoist_122 = new RefRuntype(undefined, "Repro2");
const direct_hoist_123 = new ObjectRuntype(undefined, {
    "sizes": new OptionalFieldRuntype(direct_hoist_122)
}, []);
const direct_hoist_124 = new TypeofRuntype(undefined, "boolean");
const direct_hoist_125 = new ObjectRuntype(undefined, {
    "useSmallerSizes": direct_hoist_124
}, []);
const direct_hoist_126 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_7,
        "value": direct_hoist_11
    }
]);
const direct_hoist_127 = new ObjectRuntype(undefined, {
    "accountEndpoints": direct_hoist_126
}, []);
const direct_hoist_128 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_11,
        "value": direct_hoist_11
    }
]);
const direct_hoist_129 = new ObjectRuntype(undefined, {
    "accountEndpoints": direct_hoist_128
}, []);
const direct_hoist_130 = new ObjectRuntype(undefined, {
    "optional": direct_hoist_7
}, []);
const direct_hoist_131 = new ObjectRuntype(undefined, {
    "a": direct_hoist_7,
    "b": direct_hoist_11
}, []);
const direct_hoist_132 = new SetRuntype(undefined, direct_hoist_7);
const direct_hoist_133 = new ObjectRuntype(undefined, {
    "a": direct_hoist_7,
    "d": direct_hoist_109,
    "level": direct_hoist_110
}, []);
const direct_hoist_134 = new AnyOfRuntype(undefined, [
    direct_hoist_7,
    direct_hoist_47,
    direct_hoist_82,
    direct_hoist_109
]);
const direct_hoist_135 = new ConstRuntype(undefined, "circle");
const direct_hoist_136 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_135,
    "radius": direct_hoist_11
}, []);
const direct_hoist_137 = new ConstRuntype(undefined, "square");
const direct_hoist_138 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_137,
    "x": direct_hoist_11
}, []);
const direct_hoist_139 = new ConstRuntype(undefined, "triangle");
const direct_hoist_140 = new ObjectRuntype(undefined, {
    "kind": direct_hoist_139,
    "x": direct_hoist_11,
    "y": direct_hoist_11
}, []);
const direct_hoist_141 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_136,
    direct_hoist_138,
    direct_hoist_140
], "kind", {
    "circle": direct_hoist_136,
    "square": direct_hoist_138,
    "triangle": direct_hoist_140
}, {
    "circle": direct_hoist_136,
    "square": direct_hoist_138,
    "triangle": direct_hoist_140
});
const direct_hoist_142 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_138,
    direct_hoist_140
], "kind", {
    "square": direct_hoist_138,
    "triangle": direct_hoist_140
}, {
    "square": direct_hoist_138,
    "triangle": direct_hoist_140
});
const direct_hoist_143 = new NullishRuntype(undefined, "null");
const direct_hoist_144 = new AnyOfRuntype(undefined, [
    direct_hoist_143,
    direct_hoist_68,
    direct_hoist_7,
    direct_hoist_11
]);
const direct_hoist_145 = new ArrayRuntype(undefined, direct_hoist_144);
const direct_hoist_146 = new AnyOfRuntype(undefined, [
    direct_hoist_143,
    direct_hoist_68,
    direct_hoist_7,
    direct_hoist_145
]);
const direct_hoist_147 = new TypedArrayRuntype(undefined, "Uint8Array");
const direct_hoist_148 = new RefRuntype(undefined, "OtherEnum__A");
const direct_hoist_149 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_148,
    "value": direct_hoist_7
}, []);
const direct_hoist_150 = new RefRuntype(undefined, "OtherEnum__B");
const direct_hoist_151 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_150,
    "value": direct_hoist_11
}, []);
const direct_hoist_152 = new RefRuntype(undefined, "OtherEnum2__C");
const direct_hoist_153 = new ObjectRuntype(undefined, {
    "tag": direct_hoist_152,
    "value": direct_hoist_124
}, []);
const direct_hoist_154 = new AnyOfDiscriminatedRuntype(undefined, [
    direct_hoist_153,
    direct_hoist_149,
    direct_hoist_151
], "tag", {
    "a": direct_hoist_149,
    "b": direct_hoist_151,
    "c": direct_hoist_153
}, {
    "a": direct_hoist_149,
    "b": direct_hoist_151,
    "c": direct_hoist_153
});
const direct_hoist_155 = new ArrayRuntype(undefined, direct_hoist_26);
const direct_hoist_156 = new ObjectRuntype(undefined, {
    "accessLevel": direct_hoist_39,
    "avatarSize": direct_hoist_45,
    "extra": direct_hoist_25,
    "friends": direct_hoist_155,
    "name": direct_hoist_7
}, []);
const direct_hoist_157 = new RegexRuntype(undefined, /(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "`${number}.${number}.${number}`");
const direct_hoist_158 = new RegexRuntype(undefined, /(v)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "`v${number}.${number}.${number}`");
const direct_hoist_159 = new ObjectRuntype(undefined, {
    "optional": new OptionalFieldRuntype(direct_hoist_7)
}, []);
const direct_hoist_160 = new RefRuntype(undefined, "DtsStatus");
const direct_hoist_161 = new ObjectRuntype(undefined, {
    "enabled": direct_hoist_124,
    "status": direct_hoist_160
}, []);
const direct_hoist_162 = new AnyOfConstsRuntype(undefined, [
    "off",
    "on"
]);
const direct_hoist_163 = new AnyOfConstsRuntype(undefined, [
    "active",
    "closed",
    "pending"
]);
const direct_hoist_164 = new RefRuntype(undefined, "TsxLabel");
const direct_hoist_165 = new ObjectRuntype(undefined, {
    "id": direct_hoist_7,
    "label": direct_hoist_164
}, []);
const direct_hoist_166 = new AnyOfConstsRuntype(undefined, [
    "A",
    "B",
    "C"
]);
const direct_hoist_167 = new AnyOfConstsRuntype(undefined, [
    "X",
    "Y"
]);
const direct_hoist_168 = new StringWithFormatRuntype(undefined, [
    "ValidCurrency"
]);
const direct_hoist_169 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_168,
        "value": direct_hoist_54
    }
]);
const direct_hoist_170 = new NumberWithFormatRuntype(undefined, [
    "NonInfiniteNumber"
]);
const direct_hoist_171 = new NumberWithFormatRuntype(undefined, [
    "NonInfiniteNumber",
    "NonNegativeNumber"
]);
const direct_hoist_172 = new NumberWithFormatRuntype(undefined, [
    "NonInfiniteNumber",
    "NonNegativeNumber",
    "Rate"
]);
const direct_hoist_173 = new StringWithFormatRuntype(undefined, [
    "UserId",
    "ReadAuthorizedUserId"
]);
const direct_hoist_174 = new StringWithFormatRuntype(undefined, [
    "UserId"
]);
const direct_hoist_175 = new StringWithFormatRuntype(undefined, [
    "UserId",
    "ReadAuthorizedUserId",
    "WriteAuthorizedUserId"
]);
const direct_hoist_176 = new ConstRuntype(undefined, "c");
const namedRuntypes = {
    "DeploymentState": direct_hoist_67,
    "Query": direct_hoist_73,
    "ABC": direct_hoist_74,
    "AObject": direct_hoist_75,
    "AccessLevel": direct_hoist_76,
    "AccessLevel2": direct_hoist_77,
    "AccessLevelTpl": direct_hoist_78,
    "AccessLevelTpl2": direct_hoist_79,
    "AllTypes": direct_hoist_80,
    "AvatarSize": direct_hoist_81,
    "BObject": direct_hoist_83,
    "BigInt64ArrayType": direct_hoist_84,
    "DEF": direct_hoist_85,
    "DiscriminatedUnion": direct_hoist_92,
    "DiscriminatedUnion2": direct_hoist_95,
    "DiscriminatedUnion3": direct_hoist_98,
    "DiscriminatedUnion4": direct_hoist_103,
    "Extra": direct_hoist_104,
    "Float64ArrayType": direct_hoist_105,
    "Int32ArrayType": direct_hoist_106,
    "K": direct_hoist_107,
    "KABC": direct_hoist_108,
    "KDEF": direct_hoist_47,
    "LevelAndDSettings": direct_hoist_111,
    "M1": direct_hoist_112,
    "Mapped": direct_hoist_115,
    "MappedOptional": direct_hoist_116,
    "OmitSettings": direct_hoist_111,
    "OnlyAKey": direct_hoist_117,
    "PartialObject": direct_hoist_118,
    "PartialRepro": direct_hoist_119,
    "PartialSettings": direct_hoist_120,
    "PublicUser": direct_hoist_121,
    "Repro1": direct_hoist_123,
    "Repro2": direct_hoist_125,
    "Repro5": direct_hoist_127,
    "Repro6": direct_hoist_129,
    "Req": direct_hoist_130,
    "RequiredPartialObject": direct_hoist_131,
    "S1": direct_hoist_132,
    "Settings": direct_hoist_133,
    "SettingsUpdate": direct_hoist_134,
    "Shape": direct_hoist_141,
    "T3": direct_hoist_142,
    "TransportedValue": direct_hoist_146,
    "Uint8ArrayType": direct_hoist_147,
    "UnionWithEnumAccess": direct_hoist_154,
    "User": direct_hoist_156,
    "Version": direct_hoist_157,
    "Version2": direct_hoist_158,
    "WithOptionals": direct_hoist_159,
    "DtsConfig": direct_hoist_161,
    "DtsStatus": direct_hoist_162,
    "TsxLabel": direct_hoist_163,
    "TsxTask": direct_hoist_165,
    "Arr2": direct_hoist_166,
    "OtherEnum": direct_hoist_110,
    "Arr3": direct_hoist_167,
    "CurrencyPrices": direct_hoist_169,
    "NonInfiniteNumber": direct_hoist_170,
    "NonNegativeNumber": direct_hoist_171,
    "Rate": direct_hoist_172,
    "ReadAuthorizedUserId": direct_hoist_173,
    "UserId": direct_hoist_174,
    "ValidCurrency": direct_hoist_168,
    "WriteAuthorizedUserId": direct_hoist_175,
    "AllTs": direct_hoist_110,
    "OtherEnum__A": direct_hoist_47,
    "OtherEnum__B": direct_hoist_82,
    "OtherEnum2__C": direct_hoist_176
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
    "AccessLevelTpl2": direct_hoist_18,
    "AccessLevelTpl": direct_hoist_19,
    "Arr3": direct_hoist_20,
    "OmitSettings": direct_hoist_21,
    "RequiredPartialObject": direct_hoist_22,
    "LevelAndDSettings": direct_hoist_23,
    "PartialSettings": direct_hoist_24,
    "Extra": direct_hoist_25,
    "User": direct_hoist_26,
    "PublicUser": direct_hoist_27,
    "Req": direct_hoist_28,
    "Repro1": direct_hoist_29,
    "SettingsUpdate": direct_hoist_30,
    "Mapped": direct_hoist_31,
    "MappedOptional": direct_hoist_32,
    "PartialObject": direct_hoist_33,
    "DiscriminatedUnion": direct_hoist_34,
    "DiscriminatedUnion2": direct_hoist_35,
    "DiscriminatedUnion3": direct_hoist_36,
    "DiscriminatedUnion4": direct_hoist_37,
    "AllTypes": direct_hoist_38,
    "AccessLevel": direct_hoist_39,
    "OtherEnum": direct_hoist_40,
    "Arr2C": direct_hoist_41,
    "ValidCurrency": direct_hoist_42,
    "UnionWithEnumAccess": direct_hoist_43,
    "T3": direct_hoist_44,
    "AccessLevelCodec": direct_hoist_39,
    "AvatarSize": direct_hoist_45,
    "BObject": direct_hoist_46,
    "ImportEnumTypeof": direct_hoist_48,
    "KDEF": direct_hoist_49,
    "KABC": direct_hoist_50,
    "K": direct_hoist_51,
    "NonNegativeNumber": direct_hoist_52,
    "NonInfiniteNumber": direct_hoist_53,
    "Rate": direct_hoist_54,
    "UserId": direct_hoist_55,
    "ReadAuthorizedUserId": direct_hoist_56,
    "WriteAuthorizedUserId": direct_hoist_57,
    "CurrencyPrices": direct_hoist_58,
    "Uint8ArrayCodec": direct_hoist_59,
    "Int32ArrayCodec": direct_hoist_60,
    "Float64ArrayCodec": direct_hoist_61,
    "BigInt64ArrayCodec": direct_hoist_62,
    "TsxTask": direct_hoist_63,
    "Query": direct_hoist_64,
    "DtsConfig": direct_hoist_65,
    "DeploymentState": direct_hoist_66
};

export default { buildParsers };