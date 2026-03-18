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
const direct_hoist_2 = new RefRuntype("PartialRepro");
const direct_hoist_3 = new RefRuntype("TransportedValue");
const direct_hoist_4 = new RefRuntype("OnlyAKey");
const direct_hoist_5 = new TypeofRuntype("string");
const direct_hoist_6 = new ArrayRuntype(direct_hoist_5);
const direct_hoist_7 = new ObjectRuntype({
    "a": direct_hoist_6
}, []);
const direct_hoist_8 = new BigIntRuntype();
const direct_hoist_9 = new TypeofRuntype("number");
const direct_hoist_10 = new TupleRuntype([
    direct_hoist_9,
    direct_hoist_9,
    direct_hoist_9
], null);
const direct_hoist_11 = new TupleRuntype([
    direct_hoist_9,
    direct_hoist_9
], direct_hoist_5);
const direct_hoist_12 = new RefRuntype("AllTs");
const direct_hoist_13 = new RefRuntype("AObject");
const direct_hoist_14 = new RefRuntype("Version");
const direct_hoist_15 = new RefRuntype("Version2");
const direct_hoist_16 = new RefRuntype("AccessLevelTpl2");
const direct_hoist_17 = new RefRuntype("AccessLevelTpl");
const direct_hoist_18 = new RefRuntype("Arr3");
const direct_hoist_19 = new RefRuntype("OmitSettings");
const direct_hoist_20 = new RefRuntype("RequiredPartialObject");
const direct_hoist_21 = new RefRuntype("LevelAndDSettings");
const direct_hoist_22 = new RefRuntype("PartialSettings");
const direct_hoist_23 = new RefRuntype("Extra");
const direct_hoist_24 = new RefRuntype("User");
const direct_hoist_25 = new RefRuntype("PublicUser");
const direct_hoist_26 = new RefRuntype("Req");
const direct_hoist_27 = new RefRuntype("Repro1");
const direct_hoist_28 = new RefRuntype("SettingsUpdate");
const direct_hoist_29 = new RefRuntype("Mapped");
const direct_hoist_30 = new RefRuntype("MappedOptional");
const direct_hoist_31 = new RefRuntype("PartialObject");
const direct_hoist_32 = new RefRuntype("DiscriminatedUnion");
const direct_hoist_33 = new RefRuntype("DiscriminatedUnion2");
const direct_hoist_34 = new RefRuntype("DiscriminatedUnion3");
const direct_hoist_35 = new RefRuntype("DiscriminatedUnion4");
const direct_hoist_36 = new RefRuntype("AllTypes");
const direct_hoist_37 = new RefRuntype("AccessLevel");
const direct_hoist_38 = new RefRuntype("OtherEnum");
const direct_hoist_39 = new RefRuntype("Arr2");
const direct_hoist_40 = new RefRuntype("ValidCurrency");
const direct_hoist_41 = new RefRuntype("UnionWithEnumAccess");
const direct_hoist_42 = new RefRuntype("T3");
const direct_hoist_43 = new RefRuntype("AvatarSize");
const direct_hoist_44 = new RefRuntype("BObject");
const direct_hoist_45 = new ConstRuntype("a");
const direct_hoist_46 = new ObjectRuntype({
    "A": direct_hoist_45
}, []);
const direct_hoist_47 = new RefRuntype("KDEF");
const direct_hoist_48 = new RefRuntype("KABC");
const direct_hoist_49 = new RefRuntype("K");
const direct_hoist_50 = new RefRuntype("NonNegativeNumber");
const direct_hoist_51 = new RefRuntype("NonInfiniteNumber");
const direct_hoist_52 = new RefRuntype("Rate");
const direct_hoist_53 = new RefRuntype("UserId");
const direct_hoist_54 = new RefRuntype("ReadAuthorizedUserId");
const direct_hoist_55 = new RefRuntype("WriteAuthorizedUserId");
const direct_hoist_56 = new RefRuntype("CurrencyPrices");
const direct_hoist_57 = new RefRuntype("Uint8ArrayType");
const direct_hoist_58 = new RefRuntype("Int32ArrayType");
const direct_hoist_59 = new RefRuntype("Float64ArrayType");
const direct_hoist_60 = new RefRuntype("BigInt64ArrayType");
const direct_hoist_61 = new RefRuntype("TsxTask");
const direct_hoist_62 = new RefRuntype("DtsConfig");
const direct_hoist_63 = new RefRuntype("DeploymentState");
const direct_hoist_64 = new AnyOfConstsRuntype([
    "deployed",
    "failed",
    "pending"
]);
const direct_hoist_65 = new ObjectRuntype({}, []);
const direct_hoist_66 = new ObjectRuntype({
    "tag": direct_hoist_45
}, []);
const direct_hoist_67 = new AnyOfConstsRuntype([
    "ADMIN",
    "USER"
]);
const direct_hoist_68 = new AnyOfConstsRuntype([
    "ADMIN Admin",
    "USER User"
]);
const direct_hoist_69 = new RegexRuntype(/((ADMIN)|(USER))/, '`("ADMIN" | "USER")`');
const direct_hoist_70 = new RegexRuntype(/((ADMIN Admin)|(USER User))/, '`("ADMIN Admin" | "USER User")`');
const direct_hoist_71 = new AnyOfConstsRuntype([
    "LevelAndDSettings",
    "OmitSettings",
    "PartialSettings",
    "RequiredPartialObject"
]);
const direct_hoist_72 = new RegexRuntype(/(\d+(\.\d+)?)(x)(\d+(\.\d+)?)/, "`${number}x${number}`");
const direct_hoist_73 = new ConstRuntype("b");
const direct_hoist_74 = new ObjectRuntype({
    "tag": direct_hoist_73
}, []);
const direct_hoist_75 = new TypedArrayRuntype("BigInt64Array");
const direct_hoist_76 = new ObjectRuntype({
    "a": direct_hoist_5
}, []);
const direct_hoist_77 = new ConstRuntype("a1");
const direct_hoist_78 = new ObjectRuntype({
    "a1": direct_hoist_5,
    "a11": new OptionalFieldRuntype(direct_hoist_5),
    "subType": direct_hoist_77,
    "type": direct_hoist_45
}, []);
const direct_hoist_79 = new ConstRuntype("a2");
const direct_hoist_80 = new ObjectRuntype({
    "a2": direct_hoist_5,
    "subType": direct_hoist_79,
    "type": direct_hoist_45
}, []);
const direct_hoist_81 = new AnyOfDiscriminatedRuntype([
    direct_hoist_78,
    direct_hoist_80
], "subType", {
    "a1": direct_hoist_78,
    "a2": direct_hoist_80
});
const direct_hoist_82 = new ObjectRuntype({
    "type": direct_hoist_73,
    "value": direct_hoist_9
}, []);
const direct_hoist_83 = new AnyOfDiscriminatedRuntype([
    direct_hoist_78,
    direct_hoist_80,
    direct_hoist_82
], "type", {
    "a": direct_hoist_81,
    "b": direct_hoist_82
});
const direct_hoist_84 = new ConstRuntype("d");
const direct_hoist_85 = new ObjectRuntype({
    "type": new OptionalFieldRuntype(direct_hoist_84),
    "valueD": direct_hoist_9
}, []);
const direct_hoist_86 = new AnyOfRuntype([
    direct_hoist_78,
    direct_hoist_80,
    direct_hoist_85,
    direct_hoist_82
]);
const direct_hoist_87 = new AnyOfConstsRuntype([
    "a",
    "c"
]);
const direct_hoist_88 = new ObjectRuntype({
    "a1": direct_hoist_5,
    "type": direct_hoist_87
}, []);
const direct_hoist_89 = new AnyOfDiscriminatedRuntype([
    direct_hoist_88,
    direct_hoist_82
], "type", {
    "a": direct_hoist_88,
    "b": direct_hoist_82,
    "c": direct_hoist_88
});
const direct_hoist_90 = new ObjectRuntype({
    "a1": direct_hoist_5,
    "subType": direct_hoist_77
}, []);
const direct_hoist_91 = new ObjectRuntype({
    "a": direct_hoist_90,
    "type": direct_hoist_45
}, []);
const direct_hoist_92 = new ObjectRuntype({
    "a2": direct_hoist_5,
    "subType": direct_hoist_79
}, []);
const direct_hoist_93 = new ObjectRuntype({
    "a": direct_hoist_92,
    "type": direct_hoist_45
}, []);
const direct_hoist_94 = new AnyOfRuntype([
    direct_hoist_91,
    direct_hoist_93
]);
const direct_hoist_95 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_5,
        "value": direct_hoist_5
    }
]);
const direct_hoist_96 = new TypedArrayRuntype("Float64Array");
const direct_hoist_97 = new TypedArrayRuntype("Int32Array");
const direct_hoist_98 = new AnyOfConstsRuntype([
    "a"
]);
const direct_hoist_99 = new NeverRuntype();
const direct_hoist_100 = new ObjectRuntype({
    "tag": direct_hoist_84
}, []);
const direct_hoist_101 = new AnyOfConstsRuntype([
    "a",
    "b"
]);
const direct_hoist_102 = new ObjectRuntype({
    "d": direct_hoist_100,
    "level": direct_hoist_101
}, []);
const direct_hoist_103 = new ObjectRuntype({
    "value": direct_hoist_45
}, []);
const direct_hoist_104 = new ObjectRuntype({
    "value": direct_hoist_73
}, []);
const direct_hoist_105 = new ObjectRuntype({
    "a": direct_hoist_103,
    "b": direct_hoist_104
}, []);
const direct_hoist_106 = new ObjectRuntype({
    "a": new OptionalFieldRuntype(direct_hoist_103),
    "b": new OptionalFieldRuntype(direct_hoist_104)
}, []);
const direct_hoist_107 = new ObjectRuntype({
    "A": direct_hoist_5
}, []);
const direct_hoist_108 = new ObjectRuntype({
    "a": new OptionalFieldRuntype(direct_hoist_5),
    "b": new OptionalFieldRuntype(direct_hoist_9)
}, []);
const direct_hoist_109 = new ObjectRuntype({
    "a": new OptionalFieldRuntype(direct_hoist_5),
    "b": new OptionalFieldRuntype(direct_hoist_5)
}, []);
const direct_hoist_110 = new ObjectRuntype({
    "a": new OptionalFieldRuntype(direct_hoist_5),
    "d": new OptionalFieldRuntype(direct_hoist_100),
    "level": new OptionalFieldRuntype(direct_hoist_101)
}, []);
const direct_hoist_111 = new ObjectRuntype({
    "accessLevel": direct_hoist_37,
    "avatarSize": direct_hoist_43,
    "extra": direct_hoist_23,
    "name": direct_hoist_5
}, []);
const direct_hoist_112 = new RefRuntype("Repro2");
const direct_hoist_113 = new ObjectRuntype({
    "sizes": new OptionalFieldRuntype(direct_hoist_112)
}, []);
const direct_hoist_114 = new TypeofRuntype("boolean");
const direct_hoist_115 = new ObjectRuntype({
    "useSmallerSizes": direct_hoist_114
}, []);
const direct_hoist_116 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_5,
        "value": direct_hoist_9
    }
]);
const direct_hoist_117 = new ObjectRuntype({
    "accountEndpoints": direct_hoist_116
}, []);
const direct_hoist_118 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_9,
        "value": direct_hoist_9
    }
]);
const direct_hoist_119 = new ObjectRuntype({
    "accountEndpoints": direct_hoist_118
}, []);
const direct_hoist_120 = new ObjectRuntype({
    "optional": direct_hoist_5
}, []);
const direct_hoist_121 = new ObjectRuntype({
    "a": direct_hoist_5,
    "b": direct_hoist_9
}, []);
const direct_hoist_122 = new ObjectRuntype({
    "a": direct_hoist_5,
    "d": direct_hoist_100,
    "level": direct_hoist_101
}, []);
const direct_hoist_123 = new AnyOfRuntype([
    direct_hoist_5,
    direct_hoist_45,
    direct_hoist_73,
    direct_hoist_100
]);
const direct_hoist_124 = new ConstRuntype("circle");
const direct_hoist_125 = new ObjectRuntype({
    "kind": direct_hoist_124,
    "radius": direct_hoist_9
}, []);
const direct_hoist_126 = new ConstRuntype("square");
const direct_hoist_127 = new ObjectRuntype({
    "kind": direct_hoist_126,
    "x": direct_hoist_9
}, []);
const direct_hoist_128 = new ConstRuntype("triangle");
const direct_hoist_129 = new ObjectRuntype({
    "kind": direct_hoist_128,
    "x": direct_hoist_9,
    "y": direct_hoist_9
}, []);
const direct_hoist_130 = new AnyOfDiscriminatedRuntype([
    direct_hoist_125,
    direct_hoist_127,
    direct_hoist_129
], "kind", {
    "circle": direct_hoist_125,
    "square": direct_hoist_127,
    "triangle": direct_hoist_129
});
const direct_hoist_131 = new AnyOfDiscriminatedRuntype([
    direct_hoist_127,
    direct_hoist_129
], "kind", {
    "square": direct_hoist_127,
    "triangle": direct_hoist_129
});
const direct_hoist_132 = new NullishRuntype("null");
const direct_hoist_133 = new NullishRuntype("undefined");
const direct_hoist_134 = new AnyOfRuntype([
    direct_hoist_132,
    direct_hoist_133,
    direct_hoist_5,
    direct_hoist_9
]);
const direct_hoist_135 = new ArrayRuntype(direct_hoist_134);
const direct_hoist_136 = new AnyOfRuntype([
    direct_hoist_132,
    direct_hoist_133,
    direct_hoist_5,
    direct_hoist_135
]);
const direct_hoist_137 = new TypedArrayRuntype("Uint8Array");
const direct_hoist_138 = new RefRuntype("OtherEnum__A");
const direct_hoist_139 = new ObjectRuntype({
    "tag": direct_hoist_138,
    "value": direct_hoist_5
}, []);
const direct_hoist_140 = new RefRuntype("OtherEnum__B");
const direct_hoist_141 = new ObjectRuntype({
    "tag": direct_hoist_140,
    "value": direct_hoist_9
}, []);
const direct_hoist_142 = new RefRuntype("OtherEnum2__C");
const direct_hoist_143 = new ObjectRuntype({
    "tag": direct_hoist_142,
    "value": direct_hoist_114
}, []);
const direct_hoist_144 = new AnyOfDiscriminatedRuntype([
    direct_hoist_143,
    direct_hoist_139,
    direct_hoist_141
], "tag", {
    "a": direct_hoist_139,
    "b": direct_hoist_141,
    "c": direct_hoist_143
});
const direct_hoist_145 = new ArrayRuntype(direct_hoist_24);
const direct_hoist_146 = new ObjectRuntype({
    "accessLevel": direct_hoist_37,
    "avatarSize": direct_hoist_43,
    "extra": direct_hoist_23,
    "friends": direct_hoist_145,
    "name": direct_hoist_5
}, []);
const direct_hoist_147 = new RegexRuntype(/(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "`${number}.${number}.${number}`");
const direct_hoist_148 = new RegexRuntype(/(v)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "`v${number}.${number}.${number}`");
const direct_hoist_149 = new ObjectRuntype({
    "optional": new OptionalFieldRuntype(direct_hoist_5)
}, []);
const direct_hoist_150 = new RefRuntype("DtsStatus");
const direct_hoist_151 = new ObjectRuntype({
    "enabled": direct_hoist_114,
    "status": direct_hoist_150
}, []);
const direct_hoist_152 = new AnyOfConstsRuntype([
    "off",
    "on"
]);
const direct_hoist_153 = new AnyOfConstsRuntype([
    "active",
    "closed",
    "pending"
]);
const direct_hoist_154 = new RefRuntype("TsxLabel");
const direct_hoist_155 = new ObjectRuntype({
    "id": direct_hoist_5,
    "label": direct_hoist_154
}, []);
const direct_hoist_156 = new AnyOfConstsRuntype([
    "A",
    "B",
    "C"
]);
const direct_hoist_157 = new AnyOfConstsRuntype([
    "X",
    "Y"
]);
const direct_hoist_158 = new StringWithFormatRuntype([
    "ValidCurrency"
]);
const direct_hoist_159 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_158,
        "value": direct_hoist_52
    }
]);
const direct_hoist_160 = new NumberWithFormatRuntype([
    "NonInfiniteNumber"
]);
const direct_hoist_161 = new NumberWithFormatRuntype([
    "NonInfiniteNumber",
    "NonNegativeNumber"
]);
const direct_hoist_162 = new NumberWithFormatRuntype([
    "NonInfiniteNumber",
    "NonNegativeNumber",
    "Rate"
]);
const direct_hoist_163 = new StringWithFormatRuntype([
    "UserId",
    "ReadAuthorizedUserId"
]);
const direct_hoist_164 = new StringWithFormatRuntype([
    "UserId"
]);
const direct_hoist_165 = new StringWithFormatRuntype([
    "UserId",
    "ReadAuthorizedUserId",
    "WriteAuthorizedUserId"
]);
const direct_hoist_166 = new ConstRuntype("c");
const namedRuntypes = {
    "DeploymentState": direct_hoist_64,
    "ABC": direct_hoist_65,
    "AObject": direct_hoist_66,
    "AccessLevel": direct_hoist_67,
    "AccessLevel2": direct_hoist_68,
    "AccessLevelTpl": direct_hoist_69,
    "AccessLevelTpl2": direct_hoist_70,
    "AllTypes": direct_hoist_71,
    "AvatarSize": direct_hoist_72,
    "BObject": direct_hoist_74,
    "BigInt64ArrayType": direct_hoist_75,
    "DEF": direct_hoist_76,
    "DiscriminatedUnion": direct_hoist_83,
    "DiscriminatedUnion2": direct_hoist_86,
    "DiscriminatedUnion3": direct_hoist_89,
    "DiscriminatedUnion4": direct_hoist_94,
    "Extra": direct_hoist_95,
    "Float64ArrayType": direct_hoist_96,
    "Int32ArrayType": direct_hoist_97,
    "K": direct_hoist_98,
    "KABC": direct_hoist_99,
    "KDEF": direct_hoist_45,
    "LevelAndDSettings": direct_hoist_102,
    "Mapped": direct_hoist_105,
    "MappedOptional": direct_hoist_106,
    "OmitSettings": direct_hoist_102,
    "OnlyAKey": direct_hoist_107,
    "PartialObject": direct_hoist_108,
    "PartialRepro": direct_hoist_109,
    "PartialSettings": direct_hoist_110,
    "PublicUser": direct_hoist_111,
    "Repro1": direct_hoist_113,
    "Repro2": direct_hoist_115,
    "Repro5": direct_hoist_117,
    "Repro6": direct_hoist_119,
    "Req": direct_hoist_120,
    "RequiredPartialObject": direct_hoist_121,
    "Settings": direct_hoist_122,
    "SettingsUpdate": direct_hoist_123,
    "Shape": direct_hoist_130,
    "T3": direct_hoist_131,
    "TransportedValue": direct_hoist_136,
    "Uint8ArrayType": direct_hoist_137,
    "UnionWithEnumAccess": direct_hoist_144,
    "User": direct_hoist_146,
    "Version": direct_hoist_147,
    "Version2": direct_hoist_148,
    "WithOptionals": direct_hoist_149,
    "DtsConfig": direct_hoist_151,
    "DtsStatus": direct_hoist_152,
    "TsxLabel": direct_hoist_153,
    "TsxTask": direct_hoist_155,
    "Arr2": direct_hoist_156,
    "OtherEnum": direct_hoist_101,
    "Arr3": direct_hoist_157,
    "CurrencyPrices": direct_hoist_159,
    "NonInfiniteNumber": direct_hoist_160,
    "NonNegativeNumber": direct_hoist_161,
    "Rate": direct_hoist_162,
    "ReadAuthorizedUserId": direct_hoist_163,
    "UserId": direct_hoist_164,
    "ValidCurrency": direct_hoist_158,
    "WriteAuthorizedUserId": direct_hoist_165,
    "AllTs": direct_hoist_101,
    "OtherEnum__A": direct_hoist_45,
    "OtherEnum__B": direct_hoist_73,
    "OtherEnum2__C": direct_hoist_166
};
const buildParsersInput = {
    "Repro5": direct_hoist_0,
    "Repro6": direct_hoist_1,
    "PartialRepro": direct_hoist_2,
    "TransportedValue": direct_hoist_3,
    "OnlyAKey": direct_hoist_4,
    "ObjectWithArr": direct_hoist_7,
    "BigIntCodec": direct_hoist_8,
    "TupleCodec": direct_hoist_10,
    "TupleCodecRest": direct_hoist_11,
    "StringArrCodec": direct_hoist_6,
    "AllTs": direct_hoist_12,
    "AObject": direct_hoist_13,
    "Version": direct_hoist_14,
    "Version2": direct_hoist_15,
    "AccessLevelTpl2": direct_hoist_16,
    "AccessLevelTpl": direct_hoist_17,
    "Arr3": direct_hoist_18,
    "OmitSettings": direct_hoist_19,
    "RequiredPartialObject": direct_hoist_20,
    "LevelAndDSettings": direct_hoist_21,
    "PartialSettings": direct_hoist_22,
    "Extra": direct_hoist_23,
    "User": direct_hoist_24,
    "PublicUser": direct_hoist_25,
    "Req": direct_hoist_26,
    "Repro1": direct_hoist_27,
    "SettingsUpdate": direct_hoist_28,
    "Mapped": direct_hoist_29,
    "MappedOptional": direct_hoist_30,
    "PartialObject": direct_hoist_31,
    "DiscriminatedUnion": direct_hoist_32,
    "DiscriminatedUnion2": direct_hoist_33,
    "DiscriminatedUnion3": direct_hoist_34,
    "DiscriminatedUnion4": direct_hoist_35,
    "AllTypes": direct_hoist_36,
    "AccessLevel": direct_hoist_37,
    "OtherEnum": direct_hoist_38,
    "Arr2C": direct_hoist_39,
    "ValidCurrency": direct_hoist_40,
    "UnionWithEnumAccess": direct_hoist_41,
    "T3": direct_hoist_42,
    "AccessLevelCodec": direct_hoist_37,
    "AvatarSize": direct_hoist_43,
    "BObject": direct_hoist_44,
    "ImportEnumTypeof": direct_hoist_46,
    "KDEF": direct_hoist_47,
    "KABC": direct_hoist_48,
    "K": direct_hoist_49,
    "NonNegativeNumber": direct_hoist_50,
    "NonInfiniteNumber": direct_hoist_51,
    "Rate": direct_hoist_52,
    "UserId": direct_hoist_53,
    "ReadAuthorizedUserId": direct_hoist_54,
    "WriteAuthorizedUserId": direct_hoist_55,
    "CurrencyPrices": direct_hoist_56,
    "Uint8ArrayCodec": direct_hoist_57,
    "Int32ArrayCodec": direct_hoist_58,
    "Float64ArrayCodec": direct_hoist_59,
    "BigInt64ArrayCodec": direct_hoist_60,
    "TsxTask": direct_hoist_61,
    "DtsConfig": direct_hoist_62,
    "DeploymentState": direct_hoist_63
};

export default { buildParsers };