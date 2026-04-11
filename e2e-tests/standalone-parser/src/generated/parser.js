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
const direct_hoist_0 = new RefRuntype("Repro5");
const direct_hoist_1 = new RefRuntype("Repro6");
const direct_hoist_2 = new RefRuntype("M1");
const direct_hoist_3 = new RefRuntype("S1");
const direct_hoist_4 = new RefRuntype("PartialRepro");
const direct_hoist_5 = new RefRuntype("TransportedValue");
const direct_hoist_6 = new RefRuntype("OnlyAKey");
const direct_hoist_7 = new TypeofRuntype("string");
const direct_hoist_8 = new ArrayRuntype(direct_hoist_7);
const direct_hoist_9 = new ObjectRuntype({
    "a": direct_hoist_8
}, []);
const direct_hoist_10 = new BigIntRuntype();
const direct_hoist_11 = new TypeofRuntype("number");
const direct_hoist_12 = new TupleRuntype([
    direct_hoist_11,
    direct_hoist_11,
    direct_hoist_11
], null);
const direct_hoist_13 = new TupleRuntype([
    direct_hoist_11,
    direct_hoist_11
], direct_hoist_7);
const direct_hoist_14 = new RefRuntype("AllTs");
const direct_hoist_15 = new RefRuntype("AObject");
const direct_hoist_16 = new RefRuntype("Version");
const direct_hoist_17 = new RefRuntype("Version2");
const direct_hoist_18 = new RefRuntype("AccessLevelTpl2");
const direct_hoist_19 = new RefRuntype("AccessLevelTpl");
const direct_hoist_20 = new RefRuntype("Arr3");
const direct_hoist_21 = new RefRuntype("OmitSettings");
const direct_hoist_22 = new RefRuntype("RequiredPartialObject");
const direct_hoist_23 = new RefRuntype("LevelAndDSettings");
const direct_hoist_24 = new RefRuntype("PartialSettings");
const direct_hoist_25 = new RefRuntype("Extra");
const direct_hoist_26 = new RefRuntype("User");
const direct_hoist_27 = new RefRuntype("PublicUser");
const direct_hoist_28 = new RefRuntype("Req");
const direct_hoist_29 = new RefRuntype("Repro1");
const direct_hoist_30 = new RefRuntype("SettingsUpdate");
const direct_hoist_31 = new RefRuntype("Mapped");
const direct_hoist_32 = new RefRuntype("MappedOptional");
const direct_hoist_33 = new RefRuntype("PartialObject");
const direct_hoist_34 = new RefRuntype("DiscriminatedUnion");
const direct_hoist_35 = new RefRuntype("DiscriminatedUnion2");
const direct_hoist_36 = new RefRuntype("DiscriminatedUnion3");
const direct_hoist_37 = new RefRuntype("DiscriminatedUnion4");
const direct_hoist_38 = new RefRuntype("AllTypes");
const direct_hoist_39 = new RefRuntype("AccessLevel");
const direct_hoist_40 = new RefRuntype("OtherEnum");
const direct_hoist_41 = new RefRuntype("Arr2");
const direct_hoist_42 = new RefRuntype("ValidCurrency");
const direct_hoist_43 = new RefRuntype("UnionWithEnumAccess");
const direct_hoist_44 = new RefRuntype("T3");
const direct_hoist_45 = new RefRuntype("AvatarSize");
const direct_hoist_46 = new RefRuntype("BObject");
const direct_hoist_47 = new ConstRuntype("a");
const direct_hoist_48 = new ObjectRuntype({
    "A": direct_hoist_47
}, []);
const direct_hoist_49 = new RefRuntype("KDEF");
const direct_hoist_50 = new RefRuntype("KABC");
const direct_hoist_51 = new RefRuntype("K");
const direct_hoist_52 = new RefRuntype("NonNegativeNumber");
const direct_hoist_53 = new RefRuntype("NonInfiniteNumber");
const direct_hoist_54 = new RefRuntype("Rate");
const direct_hoist_55 = new RefRuntype("UserId");
const direct_hoist_56 = new RefRuntype("ReadAuthorizedUserId");
const direct_hoist_57 = new RefRuntype("WriteAuthorizedUserId");
const direct_hoist_58 = new RefRuntype("CurrencyPrices");
const direct_hoist_59 = new RefRuntype("Uint8ArrayType");
const direct_hoist_60 = new RefRuntype("Int32ArrayType");
const direct_hoist_61 = new RefRuntype("Float64ArrayType");
const direct_hoist_62 = new RefRuntype("BigInt64ArrayType");
const direct_hoist_63 = new RefRuntype("TsxTask");
const direct_hoist_64 = new RefRuntype("DtsConfig");
const direct_hoist_65 = new RefRuntype("DeploymentState");
const direct_hoist_66 = new AnyOfConstsRuntype([
    "deployed",
    "failed",
    "pending"
]);
const direct_hoist_67 = new ObjectRuntype({}, []);
const direct_hoist_68 = new ObjectRuntype({
    "tag": direct_hoist_47
}, []);
const direct_hoist_69 = new AnyOfConstsRuntype([
    "ADMIN",
    "USER"
]);
const direct_hoist_70 = new AnyOfConstsRuntype([
    "ADMIN Admin",
    "USER User"
]);
const direct_hoist_71 = new RegexRuntype(/((ADMIN)|(USER))/, '`("ADMIN" | "USER")`');
const direct_hoist_72 = new RegexRuntype(/((ADMIN Admin)|(USER User))/, '`("ADMIN Admin" | "USER User")`');
const direct_hoist_73 = new AnyOfConstsRuntype([
    "LevelAndDSettings",
    "OmitSettings",
    "PartialSettings",
    "RequiredPartialObject"
]);
const direct_hoist_74 = new RegexRuntype(/(\d+(\.\d+)?)(x)(\d+(\.\d+)?)/, "`${number}x${number}`");
const direct_hoist_75 = new ConstRuntype("b");
const direct_hoist_76 = new ObjectRuntype({
    "tag": direct_hoist_75
}, []);
const direct_hoist_77 = new TypedArrayRuntype("BigInt64Array");
const direct_hoist_78 = new ObjectRuntype({
    "a": direct_hoist_7
}, []);
const direct_hoist_79 = new ConstRuntype("a1");
const direct_hoist_80 = new ObjectRuntype({
    "a1": direct_hoist_7,
    "a11": new OptionalFieldRuntype(direct_hoist_7),
    "subType": direct_hoist_79,
    "type": direct_hoist_47
}, []);
const direct_hoist_81 = new ConstRuntype("a2");
const direct_hoist_82 = new ObjectRuntype({
    "a2": direct_hoist_7,
    "subType": direct_hoist_81,
    "type": direct_hoist_47
}, []);
const direct_hoist_83 = new AnyOfDiscriminatedRuntype([
    direct_hoist_80,
    direct_hoist_82
], "subType", {
    "a1": direct_hoist_80,
    "a2": direct_hoist_82
}, {
    "a1": direct_hoist_80,
    "a2": direct_hoist_82
});
const direct_hoist_84 = new ObjectRuntype({
    "type": direct_hoist_75,
    "value": direct_hoist_11
}, []);
const direct_hoist_85 = new AnyOfDiscriminatedRuntype([
    direct_hoist_80,
    direct_hoist_82,
    direct_hoist_84
], "type", {
    "a": direct_hoist_83,
    "b": direct_hoist_84
}, {
    "a": direct_hoist_83,
    "b": direct_hoist_84
});
const direct_hoist_86 = new ConstRuntype("d");
const direct_hoist_87 = new ObjectRuntype({
    "type": new OptionalFieldRuntype(direct_hoist_86),
    "valueD": direct_hoist_11
}, []);
const direct_hoist_88 = new AnyOfRuntype([
    direct_hoist_80,
    direct_hoist_82,
    direct_hoist_87,
    direct_hoist_84
]);
const direct_hoist_89 = new AnyOfConstsRuntype([
    "a",
    "c"
]);
const direct_hoist_90 = new ObjectRuntype({
    "a1": direct_hoist_7,
    "type": direct_hoist_89
}, []);
const direct_hoist_91 = new AnyOfDiscriminatedRuntype([
    direct_hoist_90,
    direct_hoist_84
], "type", {
    "a": direct_hoist_90,
    "b": direct_hoist_84,
    "c": direct_hoist_90
}, {
    "a": direct_hoist_90,
    "b": direct_hoist_84,
    "c": direct_hoist_90
});
const direct_hoist_92 = new ObjectRuntype({
    "a1": direct_hoist_7,
    "subType": direct_hoist_79
}, []);
const direct_hoist_93 = new ObjectRuntype({
    "a": direct_hoist_92,
    "type": direct_hoist_47
}, []);
const direct_hoist_94 = new ObjectRuntype({
    "a2": direct_hoist_7,
    "subType": direct_hoist_81
}, []);
const direct_hoist_95 = new ObjectRuntype({
    "a": direct_hoist_94,
    "type": direct_hoist_47
}, []);
const direct_hoist_96 = new AnyOfRuntype([
    direct_hoist_93,
    direct_hoist_95
]);
const direct_hoist_97 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_7,
        "value": direct_hoist_7
    }
]);
const direct_hoist_98 = new TypedArrayRuntype("Float64Array");
const direct_hoist_99 = new TypedArrayRuntype("Int32Array");
const direct_hoist_100 = new AnyOfConstsRuntype([
    "a"
]);
const direct_hoist_101 = new NeverRuntype();
const direct_hoist_102 = new ObjectRuntype({
    "tag": direct_hoist_86
}, []);
const direct_hoist_103 = new AnyOfConstsRuntype([
    "a",
    "b"
]);
const direct_hoist_104 = new ObjectRuntype({
    "d": direct_hoist_102,
    "level": direct_hoist_103
}, []);
const direct_hoist_105 = new MapRuntype(direct_hoist_7, direct_hoist_11);
const direct_hoist_106 = new ObjectRuntype({
    "value": direct_hoist_47
}, []);
const direct_hoist_107 = new ObjectRuntype({
    "value": direct_hoist_75
}, []);
const direct_hoist_108 = new ObjectRuntype({
    "a": direct_hoist_106,
    "b": direct_hoist_107
}, []);
const direct_hoist_109 = new ObjectRuntype({
    "a": new OptionalFieldRuntype(direct_hoist_106),
    "b": new OptionalFieldRuntype(direct_hoist_107)
}, []);
const direct_hoist_110 = new ObjectRuntype({
    "A": direct_hoist_7
}, []);
const direct_hoist_111 = new ObjectRuntype({
    "a": new OptionalFieldRuntype(direct_hoist_7),
    "b": new OptionalFieldRuntype(direct_hoist_11)
}, []);
const direct_hoist_112 = new ObjectRuntype({
    "a": new OptionalFieldRuntype(direct_hoist_7),
    "b": new OptionalFieldRuntype(direct_hoist_7)
}, []);
const direct_hoist_113 = new ObjectRuntype({
    "a": new OptionalFieldRuntype(direct_hoist_7),
    "d": new OptionalFieldRuntype(direct_hoist_102),
    "level": new OptionalFieldRuntype(direct_hoist_103)
}, []);
const direct_hoist_114 = new ObjectRuntype({
    "accessLevel": direct_hoist_39,
    "avatarSize": direct_hoist_45,
    "extra": direct_hoist_25,
    "name": direct_hoist_7
}, []);
const direct_hoist_115 = new RefRuntype("Repro2");
const direct_hoist_116 = new ObjectRuntype({
    "sizes": new OptionalFieldRuntype(direct_hoist_115)
}, []);
const direct_hoist_117 = new TypeofRuntype("boolean");
const direct_hoist_118 = new ObjectRuntype({
    "useSmallerSizes": direct_hoist_117
}, []);
const direct_hoist_119 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_7,
        "value": direct_hoist_11
    }
]);
const direct_hoist_120 = new ObjectRuntype({
    "accountEndpoints": direct_hoist_119
}, []);
const direct_hoist_121 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_11,
        "value": direct_hoist_11
    }
]);
const direct_hoist_122 = new ObjectRuntype({
    "accountEndpoints": direct_hoist_121
}, []);
const direct_hoist_123 = new ObjectRuntype({
    "optional": direct_hoist_7
}, []);
const direct_hoist_124 = new ObjectRuntype({
    "a": direct_hoist_7,
    "b": direct_hoist_11
}, []);
const direct_hoist_125 = new SetRuntype(direct_hoist_7);
const direct_hoist_126 = new ObjectRuntype({
    "a": direct_hoist_7,
    "d": direct_hoist_102,
    "level": direct_hoist_103
}, []);
const direct_hoist_127 = new AnyOfRuntype([
    direct_hoist_7,
    direct_hoist_47,
    direct_hoist_75,
    direct_hoist_102
]);
const direct_hoist_128 = new ConstRuntype("circle");
const direct_hoist_129 = new ObjectRuntype({
    "kind": direct_hoist_128,
    "radius": direct_hoist_11
}, []);
const direct_hoist_130 = new ConstRuntype("square");
const direct_hoist_131 = new ObjectRuntype({
    "kind": direct_hoist_130,
    "x": direct_hoist_11
}, []);
const direct_hoist_132 = new ConstRuntype("triangle");
const direct_hoist_133 = new ObjectRuntype({
    "kind": direct_hoist_132,
    "x": direct_hoist_11,
    "y": direct_hoist_11
}, []);
const direct_hoist_134 = new AnyOfDiscriminatedRuntype([
    direct_hoist_129,
    direct_hoist_131,
    direct_hoist_133
], "kind", {
    "circle": direct_hoist_129,
    "square": direct_hoist_131,
    "triangle": direct_hoist_133
}, {
    "circle": direct_hoist_129,
    "square": direct_hoist_131,
    "triangle": direct_hoist_133
});
const direct_hoist_135 = new AnyOfDiscriminatedRuntype([
    direct_hoist_131,
    direct_hoist_133
], "kind", {
    "square": direct_hoist_131,
    "triangle": direct_hoist_133
}, {
    "square": direct_hoist_131,
    "triangle": direct_hoist_133
});
const direct_hoist_136 = new NullishRuntype("null");
const direct_hoist_137 = new NullishRuntype("undefined");
const direct_hoist_138 = new AnyOfRuntype([
    direct_hoist_136,
    direct_hoist_137,
    direct_hoist_7,
    direct_hoist_11
]);
const direct_hoist_139 = new ArrayRuntype(direct_hoist_138);
const direct_hoist_140 = new AnyOfRuntype([
    direct_hoist_136,
    direct_hoist_137,
    direct_hoist_7,
    direct_hoist_139
]);
const direct_hoist_141 = new TypedArrayRuntype("Uint8Array");
const direct_hoist_142 = new RefRuntype("OtherEnum__A");
const direct_hoist_143 = new ObjectRuntype({
    "tag": direct_hoist_142,
    "value": direct_hoist_7
}, []);
const direct_hoist_144 = new RefRuntype("OtherEnum__B");
const direct_hoist_145 = new ObjectRuntype({
    "tag": direct_hoist_144,
    "value": direct_hoist_11
}, []);
const direct_hoist_146 = new RefRuntype("OtherEnum2__C");
const direct_hoist_147 = new ObjectRuntype({
    "tag": direct_hoist_146,
    "value": direct_hoist_117
}, []);
const direct_hoist_148 = new AnyOfDiscriminatedRuntype([
    direct_hoist_147,
    direct_hoist_143,
    direct_hoist_145
], "tag", {
    "a": direct_hoist_143,
    "b": direct_hoist_145,
    "c": direct_hoist_147
}, {
    "a": direct_hoist_143,
    "b": direct_hoist_145,
    "c": direct_hoist_147
});
const direct_hoist_149 = new ArrayRuntype(direct_hoist_26);
const direct_hoist_150 = new ObjectRuntype({
    "accessLevel": direct_hoist_39,
    "avatarSize": direct_hoist_45,
    "extra": direct_hoist_25,
    "friends": direct_hoist_149,
    "name": direct_hoist_7
}, []);
const direct_hoist_151 = new RegexRuntype(/(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "`${number}.${number}.${number}`");
const direct_hoist_152 = new RegexRuntype(/(v)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "`v${number}.${number}.${number}`");
const direct_hoist_153 = new ObjectRuntype({
    "optional": new OptionalFieldRuntype(direct_hoist_7)
}, []);
const direct_hoist_154 = new RefRuntype("DtsStatus");
const direct_hoist_155 = new ObjectRuntype({
    "enabled": direct_hoist_117,
    "status": direct_hoist_154
}, []);
const direct_hoist_156 = new AnyOfConstsRuntype([
    "off",
    "on"
]);
const direct_hoist_157 = new AnyOfConstsRuntype([
    "active",
    "closed",
    "pending"
]);
const direct_hoist_158 = new RefRuntype("TsxLabel");
const direct_hoist_159 = new ObjectRuntype({
    "id": direct_hoist_7,
    "label": direct_hoist_158
}, []);
const direct_hoist_160 = new AnyOfConstsRuntype([
    "A",
    "B",
    "C"
]);
const direct_hoist_161 = new AnyOfConstsRuntype([
    "X",
    "Y"
]);
const direct_hoist_162 = new StringWithFormatRuntype([
    "ValidCurrency"
], "expected a valid ISO currency code");
const direct_hoist_163 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_162,
        "value": direct_hoist_54
    }
]);
const direct_hoist_164 = new NumberWithFormatRuntype([
    "NonInfiniteNumber"
]);
const direct_hoist_165 = new NumberWithFormatRuntype([
    "NonInfiniteNumber",
    "NonNegativeNumber"
]);
const direct_hoist_166 = new NumberWithFormatRuntype([
    "NonInfiniteNumber",
    "NonNegativeNumber",
    "Rate"
]);
const direct_hoist_167 = new StringWithFormatRuntype([
    "UserId",
    "ReadAuthorizedUserId"
]);
const direct_hoist_168 = new StringWithFormatRuntype([
    "UserId"
]);
const direct_hoist_169 = new StringWithFormatRuntype([
    "UserId",
    "ReadAuthorizedUserId",
    "WriteAuthorizedUserId"
]);
const direct_hoist_170 = new ConstRuntype("c");
const namedRuntypes = {
    "DeploymentState": direct_hoist_66,
    "ABC": direct_hoist_67,
    "AObject": direct_hoist_68,
    "AccessLevel": direct_hoist_69,
    "AccessLevel2": direct_hoist_70,
    "AccessLevelTpl": direct_hoist_71,
    "AccessLevelTpl2": direct_hoist_72,
    "AllTypes": direct_hoist_73,
    "AvatarSize": direct_hoist_74,
    "BObject": direct_hoist_76,
    "BigInt64ArrayType": direct_hoist_77,
    "DEF": direct_hoist_78,
    "DiscriminatedUnion": direct_hoist_85,
    "DiscriminatedUnion2": direct_hoist_88,
    "DiscriminatedUnion3": direct_hoist_91,
    "DiscriminatedUnion4": direct_hoist_96,
    "Extra": direct_hoist_97,
    "Float64ArrayType": direct_hoist_98,
    "Int32ArrayType": direct_hoist_99,
    "K": direct_hoist_100,
    "KABC": direct_hoist_101,
    "KDEF": direct_hoist_47,
    "LevelAndDSettings": direct_hoist_104,
    "M1": direct_hoist_105,
    "Mapped": direct_hoist_108,
    "MappedOptional": direct_hoist_109,
    "OmitSettings": direct_hoist_104,
    "OnlyAKey": direct_hoist_110,
    "PartialObject": direct_hoist_111,
    "PartialRepro": direct_hoist_112,
    "PartialSettings": direct_hoist_113,
    "PublicUser": direct_hoist_114,
    "Repro1": direct_hoist_116,
    "Repro2": direct_hoist_118,
    "Repro5": direct_hoist_120,
    "Repro6": direct_hoist_122,
    "Req": direct_hoist_123,
    "RequiredPartialObject": direct_hoist_124,
    "S1": direct_hoist_125,
    "Settings": direct_hoist_126,
    "SettingsUpdate": direct_hoist_127,
    "Shape": direct_hoist_134,
    "T3": direct_hoist_135,
    "TransportedValue": direct_hoist_140,
    "Uint8ArrayType": direct_hoist_141,
    "UnionWithEnumAccess": direct_hoist_148,
    "User": direct_hoist_150,
    "Version": direct_hoist_151,
    "Version2": direct_hoist_152,
    "WithOptionals": direct_hoist_153,
    "DtsConfig": direct_hoist_155,
    "DtsStatus": direct_hoist_156,
    "TsxLabel": direct_hoist_157,
    "TsxTask": direct_hoist_159,
    "Arr2": direct_hoist_160,
    "OtherEnum": direct_hoist_103,
    "Arr3": direct_hoist_161,
    "CurrencyPrices": direct_hoist_163,
    "NonInfiniteNumber": direct_hoist_164,
    "NonNegativeNumber": direct_hoist_165,
    "Rate": direct_hoist_166,
    "ReadAuthorizedUserId": direct_hoist_167,
    "UserId": direct_hoist_168,
    "ValidCurrency": direct_hoist_162,
    "WriteAuthorizedUserId": direct_hoist_169,
    "AllTs": direct_hoist_103,
    "OtherEnum__A": direct_hoist_47,
    "OtherEnum__B": direct_hoist_75,
    "OtherEnum2__C": direct_hoist_170
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
    "DtsConfig": direct_hoist_64,
    "DeploymentState": direct_hoist_65
};

export default { buildParsers };