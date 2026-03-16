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
const direct_hoist_0 = new RefRuntype("PartialRepro");
const direct_hoist_1 = new RefRuntype("TransportedValue");
const direct_hoist_2 = new RefRuntype("OnlyAKey");
const direct_hoist_3 = new TypeofRuntype("string");
const direct_hoist_4 = new ArrayRuntype(direct_hoist_3);
const direct_hoist_5 = new ObjectRuntype({
    "a": direct_hoist_4
}, []);
const direct_hoist_6 = new BigIntRuntype();
const direct_hoist_7 = new TypeofRuntype("number");
const direct_hoist_8 = new TupleRuntype([
    direct_hoist_7,
    direct_hoist_7,
    direct_hoist_7
], null);
const direct_hoist_9 = new TupleRuntype([
    direct_hoist_7,
    direct_hoist_7
], direct_hoist_3);
const direct_hoist_10 = new RefRuntype("AllTs");
const direct_hoist_11 = new RefRuntype("AObject");
const direct_hoist_12 = new RefRuntype("Version");
const direct_hoist_13 = new RefRuntype("Version2");
const direct_hoist_14 = new RefRuntype("AccessLevelTpl2");
const direct_hoist_15 = new RefRuntype("AccessLevelTpl");
const direct_hoist_16 = new RefRuntype("Arr3");
const direct_hoist_17 = new RefRuntype("OmitSettings");
const direct_hoist_18 = new RefRuntype("RequiredPartialObject");
const direct_hoist_19 = new RefRuntype("LevelAndDSettings");
const direct_hoist_20 = new RefRuntype("PartialSettings");
const direct_hoist_21 = new RefRuntype("Extra");
const direct_hoist_22 = new RefRuntype("User");
const direct_hoist_23 = new RefRuntype("PublicUser");
const direct_hoist_24 = new RefRuntype("Req");
const direct_hoist_25 = new RefRuntype("Repro1");
const direct_hoist_26 = new RefRuntype("SettingsUpdate");
const direct_hoist_27 = new RefRuntype("Mapped");
const direct_hoist_28 = new RefRuntype("MappedOptional");
const direct_hoist_29 = new RefRuntype("PartialObject");
const direct_hoist_30 = new RefRuntype("DiscriminatedUnion");
const direct_hoist_31 = new RefRuntype("DiscriminatedUnion2");
const direct_hoist_32 = new RefRuntype("DiscriminatedUnion3");
const direct_hoist_33 = new RefRuntype("DiscriminatedUnion4");
const direct_hoist_34 = new RefRuntype("AllTypes");
const direct_hoist_35 = new RefRuntype("AccessLevel");
const direct_hoist_36 = new RefRuntype("OtherEnum");
const direct_hoist_37 = new RefRuntype("Arr2");
const direct_hoist_38 = new RefRuntype("ValidCurrency");
const direct_hoist_39 = new RefRuntype("UnionWithEnumAccess");
const direct_hoist_40 = new RefRuntype("T3");
const direct_hoist_41 = new RefRuntype("AvatarSize");
const direct_hoist_42 = new RefRuntype("BObject");
const direct_hoist_43 = new ConstRuntype("a");
const direct_hoist_44 = new ObjectRuntype({
    "A": direct_hoist_43
}, []);
const direct_hoist_45 = new RefRuntype("KDEF");
const direct_hoist_46 = new RefRuntype("KABC");
const direct_hoist_47 = new RefRuntype("K");
const direct_hoist_48 = new RefRuntype("NonNegativeNumber");
const direct_hoist_49 = new RefRuntype("NonInfiniteNumber");
const direct_hoist_50 = new RefRuntype("Rate");
const direct_hoist_51 = new RefRuntype("UserId");
const direct_hoist_52 = new RefRuntype("ReadAuthorizedUserId");
const direct_hoist_53 = new RefRuntype("WriteAuthorizedUserId");
const direct_hoist_54 = new RefRuntype("CurrencyPrices");
const direct_hoist_55 = new RefRuntype("Uint8ArrayType");
const direct_hoist_56 = new RefRuntype("Int32ArrayType");
const direct_hoist_57 = new RefRuntype("Float64ArrayType");
const direct_hoist_58 = new RefRuntype("BigInt64ArrayType");
const direct_hoist_59 = new RefRuntype("TsxTask");
const direct_hoist_60 = new RefRuntype("DtsConfig");
const direct_hoist_61 = new RefRuntype("DeploymentState");
const direct_hoist_62 = new AnyOfConstsRuntype([
    "deployed",
    "failed",
    "pending"
]);
const direct_hoist_63 = new ObjectRuntype({}, []);
const direct_hoist_64 = new ObjectRuntype({
    "tag": direct_hoist_43
}, []);
const direct_hoist_65 = new AnyOfConstsRuntype([
    "ADMIN",
    "USER"
]);
const direct_hoist_66 = new AnyOfConstsRuntype([
    "ADMIN Admin",
    "USER User"
]);
const direct_hoist_67 = new RegexRuntype(/((ADMIN)|(USER))/, '`("ADMIN" | "USER")`');
const direct_hoist_68 = new RegexRuntype(/((ADMIN Admin)|(USER User))/, '`("ADMIN Admin" | "USER User")`');
const direct_hoist_69 = new AnyOfConstsRuntype([
    "LevelAndDSettings",
    "OmitSettings",
    "PartialSettings",
    "RequiredPartialObject"
]);
const direct_hoist_70 = new RegexRuntype(/(\d+(\.\d+)?)(x)(\d+(\.\d+)?)/, "`${number}x${number}`");
const direct_hoist_71 = new ConstRuntype("b");
const direct_hoist_72 = new ObjectRuntype({
    "tag": direct_hoist_71
}, []);
const direct_hoist_73 = new TypedArrayRuntype("BigInt64Array");
const direct_hoist_74 = new ObjectRuntype({
    "a": direct_hoist_3
}, []);
const direct_hoist_75 = new ConstRuntype("a1");
const direct_hoist_76 = new ObjectRuntype({
    "a1": direct_hoist_3,
    "a11": new OptionalFieldRuntype(direct_hoist_3),
    "subType": direct_hoist_75,
    "type": direct_hoist_43
}, []);
const direct_hoist_77 = new ConstRuntype("a2");
const direct_hoist_78 = new ObjectRuntype({
    "a2": direct_hoist_3,
    "subType": direct_hoist_77,
    "type": direct_hoist_43
}, []);
const direct_hoist_79 = new AnyOfDiscriminatedRuntype([
    direct_hoist_76,
    direct_hoist_78
], "subType", {
    "a1": direct_hoist_76,
    "a2": direct_hoist_78
});
const direct_hoist_80 = new ObjectRuntype({
    "type": direct_hoist_71,
    "value": direct_hoist_7
}, []);
const direct_hoist_81 = new AnyOfDiscriminatedRuntype([
    direct_hoist_76,
    direct_hoist_78,
    direct_hoist_80
], "type", {
    "a": direct_hoist_79,
    "b": direct_hoist_80
});
const direct_hoist_82 = new ConstRuntype("d");
const direct_hoist_83 = new ObjectRuntype({
    "type": new OptionalFieldRuntype(direct_hoist_82),
    "valueD": direct_hoist_7
}, []);
const direct_hoist_84 = new AnyOfRuntype([
    direct_hoist_76,
    direct_hoist_78,
    direct_hoist_83,
    direct_hoist_80
]);
const direct_hoist_85 = new AnyOfConstsRuntype([
    "a",
    "c"
]);
const direct_hoist_86 = new ObjectRuntype({
    "a1": direct_hoist_3,
    "type": direct_hoist_85
}, []);
const direct_hoist_87 = new AnyOfDiscriminatedRuntype([
    direct_hoist_86,
    direct_hoist_80
], "type", {
    "a": direct_hoist_86,
    "b": direct_hoist_80,
    "c": direct_hoist_86
});
const direct_hoist_88 = new ObjectRuntype({
    "a1": direct_hoist_3,
    "subType": direct_hoist_75
}, []);
const direct_hoist_89 = new ObjectRuntype({
    "a": direct_hoist_88,
    "type": direct_hoist_43
}, []);
const direct_hoist_90 = new ObjectRuntype({
    "a2": direct_hoist_3,
    "subType": direct_hoist_77
}, []);
const direct_hoist_91 = new ObjectRuntype({
    "a": direct_hoist_90,
    "type": direct_hoist_43
}, []);
const direct_hoist_92 = new AnyOfRuntype([
    direct_hoist_89,
    direct_hoist_91
]);
const direct_hoist_93 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_3,
        "value": direct_hoist_3
    }
]);
const direct_hoist_94 = new TypedArrayRuntype("Float64Array");
const direct_hoist_95 = new TypedArrayRuntype("Int32Array");
const direct_hoist_96 = new AnyOfConstsRuntype([
    "a"
]);
const direct_hoist_97 = new NeverRuntype();
const direct_hoist_98 = new ObjectRuntype({
    "tag": direct_hoist_82
}, []);
const direct_hoist_99 = new AnyOfConstsRuntype([
    "a",
    "b"
]);
const direct_hoist_100 = new ObjectRuntype({
    "d": direct_hoist_98,
    "level": direct_hoist_99
}, []);
const direct_hoist_101 = new ObjectRuntype({
    "value": direct_hoist_43
}, []);
const direct_hoist_102 = new ObjectRuntype({
    "value": direct_hoist_71
}, []);
const direct_hoist_103 = new ObjectRuntype({
    "a": direct_hoist_101,
    "b": direct_hoist_102
}, []);
const direct_hoist_104 = new ObjectRuntype({
    "a": new OptionalFieldRuntype(direct_hoist_101),
    "b": new OptionalFieldRuntype(direct_hoist_102)
}, []);
const direct_hoist_105 = new ObjectRuntype({
    "A": direct_hoist_3
}, []);
const direct_hoist_106 = new ObjectRuntype({
    "a": new OptionalFieldRuntype(direct_hoist_3),
    "b": new OptionalFieldRuntype(direct_hoist_7)
}, []);
const direct_hoist_107 = new ObjectRuntype({
    "a": new OptionalFieldRuntype(direct_hoist_3),
    "b": new OptionalFieldRuntype(direct_hoist_3)
}, []);
const direct_hoist_108 = new ObjectRuntype({
    "a": new OptionalFieldRuntype(direct_hoist_3),
    "d": new OptionalFieldRuntype(direct_hoist_98),
    "level": new OptionalFieldRuntype(direct_hoist_99)
}, []);
const direct_hoist_109 = new ObjectRuntype({
    "accessLevel": direct_hoist_35,
    "avatarSize": direct_hoist_41,
    "extra": direct_hoist_21,
    "name": direct_hoist_3
}, []);
const direct_hoist_110 = new RefRuntype("Repro2");
const direct_hoist_111 = new ObjectRuntype({
    "sizes": new OptionalFieldRuntype(direct_hoist_110)
}, []);
const direct_hoist_112 = new TypeofRuntype("boolean");
const direct_hoist_113 = new ObjectRuntype({
    "useSmallerSizes": direct_hoist_112
}, []);
const direct_hoist_114 = new ObjectRuntype({
    "optional": direct_hoist_3
}, []);
const direct_hoist_115 = new ObjectRuntype({
    "a": direct_hoist_3,
    "b": direct_hoist_7
}, []);
const direct_hoist_116 = new ObjectRuntype({
    "a": direct_hoist_3,
    "d": direct_hoist_98,
    "level": direct_hoist_99
}, []);
const direct_hoist_117 = new AnyOfRuntype([
    direct_hoist_3,
    direct_hoist_43,
    direct_hoist_71,
    direct_hoist_98
]);
const direct_hoist_118 = new ConstRuntype("circle");
const direct_hoist_119 = new ObjectRuntype({
    "kind": direct_hoist_118,
    "radius": direct_hoist_7
}, []);
const direct_hoist_120 = new ConstRuntype("square");
const direct_hoist_121 = new ObjectRuntype({
    "kind": direct_hoist_120,
    "x": direct_hoist_7
}, []);
const direct_hoist_122 = new ConstRuntype("triangle");
const direct_hoist_123 = new ObjectRuntype({
    "kind": direct_hoist_122,
    "x": direct_hoist_7,
    "y": direct_hoist_7
}, []);
const direct_hoist_124 = new AnyOfDiscriminatedRuntype([
    direct_hoist_119,
    direct_hoist_121,
    direct_hoist_123
], "kind", {
    "circle": direct_hoist_119,
    "square": direct_hoist_121,
    "triangle": direct_hoist_123
});
const direct_hoist_125 = new AnyOfDiscriminatedRuntype([
    direct_hoist_121,
    direct_hoist_123
], "kind", {
    "square": direct_hoist_121,
    "triangle": direct_hoist_123
});
const direct_hoist_126 = new NullishRuntype("null");
const direct_hoist_127 = new NullishRuntype("undefined");
const direct_hoist_128 = new AnyOfRuntype([
    direct_hoist_126,
    direct_hoist_127,
    direct_hoist_3,
    direct_hoist_7
]);
const direct_hoist_129 = new ArrayRuntype(direct_hoist_128);
const direct_hoist_130 = new AnyOfRuntype([
    direct_hoist_126,
    direct_hoist_127,
    direct_hoist_3,
    direct_hoist_129
]);
const direct_hoist_131 = new TypedArrayRuntype("Uint8Array");
const direct_hoist_132 = new RefRuntype("OtherEnum__A");
const direct_hoist_133 = new ObjectRuntype({
    "tag": direct_hoist_132,
    "value": direct_hoist_3
}, []);
const direct_hoist_134 = new RefRuntype("OtherEnum__B");
const direct_hoist_135 = new ObjectRuntype({
    "tag": direct_hoist_134,
    "value": direct_hoist_7
}, []);
const direct_hoist_136 = new RefRuntype("OtherEnum2__C");
const direct_hoist_137 = new ObjectRuntype({
    "tag": direct_hoist_136,
    "value": direct_hoist_112
}, []);
const direct_hoist_138 = new AnyOfDiscriminatedRuntype([
    direct_hoist_137,
    direct_hoist_133,
    direct_hoist_135
], "tag", {
    "a": direct_hoist_133,
    "b": direct_hoist_135,
    "c": direct_hoist_137
});
const direct_hoist_139 = new ArrayRuntype(direct_hoist_22);
const direct_hoist_140 = new ObjectRuntype({
    "accessLevel": direct_hoist_35,
    "avatarSize": direct_hoist_41,
    "extra": direct_hoist_21,
    "friends": direct_hoist_139,
    "name": direct_hoist_3
}, []);
const direct_hoist_141 = new RegexRuntype(/(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "`${number}.${number}.${number}`");
const direct_hoist_142 = new RegexRuntype(/(v)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "`v${number}.${number}.${number}`");
const direct_hoist_143 = new ObjectRuntype({
    "optional": new OptionalFieldRuntype(direct_hoist_3)
}, []);
const direct_hoist_144 = new RefRuntype("DtsStatus");
const direct_hoist_145 = new ObjectRuntype({
    "enabled": direct_hoist_112,
    "status": direct_hoist_144
}, []);
const direct_hoist_146 = new AnyOfConstsRuntype([
    "off",
    "on"
]);
const direct_hoist_147 = new AnyOfConstsRuntype([
    "active",
    "closed",
    "pending"
]);
const direct_hoist_148 = new RefRuntype("TsxLabel");
const direct_hoist_149 = new ObjectRuntype({
    "id": direct_hoist_3,
    "label": direct_hoist_148
}, []);
const direct_hoist_150 = new AnyOfConstsRuntype([
    "A",
    "B",
    "C"
]);
const direct_hoist_151 = new AnyOfConstsRuntype([
    "X",
    "Y"
]);
const direct_hoist_152 = new StringWithFormatRuntype([
    "ValidCurrency"
]);
const direct_hoist_153 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_152,
        "value": direct_hoist_50
    }
]);
const direct_hoist_154 = new NumberWithFormatRuntype([
    "NonInfiniteNumber"
]);
const direct_hoist_155 = new NumberWithFormatRuntype([
    "NonInfiniteNumber",
    "NonNegativeNumber"
]);
const direct_hoist_156 = new NumberWithFormatRuntype([
    "NonInfiniteNumber",
    "NonNegativeNumber",
    "Rate"
]);
const direct_hoist_157 = new StringWithFormatRuntype([
    "UserId",
    "ReadAuthorizedUserId"
]);
const direct_hoist_158 = new StringWithFormatRuntype([
    "UserId"
]);
const direct_hoist_159 = new StringWithFormatRuntype([
    "UserId",
    "ReadAuthorizedUserId",
    "WriteAuthorizedUserId"
]);
const direct_hoist_160 = new ConstRuntype("c");
const namedRuntypes = {
    "DeploymentState": direct_hoist_62,
    "ABC": direct_hoist_63,
    "AObject": direct_hoist_64,
    "AccessLevel": direct_hoist_65,
    "AccessLevel2": direct_hoist_66,
    "AccessLevelTpl": direct_hoist_67,
    "AccessLevelTpl2": direct_hoist_68,
    "AllTypes": direct_hoist_69,
    "AvatarSize": direct_hoist_70,
    "BObject": direct_hoist_72,
    "BigInt64ArrayType": direct_hoist_73,
    "DEF": direct_hoist_74,
    "DiscriminatedUnion": direct_hoist_81,
    "DiscriminatedUnion2": direct_hoist_84,
    "DiscriminatedUnion3": direct_hoist_87,
    "DiscriminatedUnion4": direct_hoist_92,
    "Extra": direct_hoist_93,
    "Float64ArrayType": direct_hoist_94,
    "Int32ArrayType": direct_hoist_95,
    "K": direct_hoist_96,
    "KABC": direct_hoist_97,
    "KDEF": direct_hoist_43,
    "LevelAndDSettings": direct_hoist_100,
    "Mapped": direct_hoist_103,
    "MappedOptional": direct_hoist_104,
    "OmitSettings": direct_hoist_100,
    "OnlyAKey": direct_hoist_105,
    "PartialObject": direct_hoist_106,
    "PartialRepro": direct_hoist_107,
    "PartialSettings": direct_hoist_108,
    "PublicUser": direct_hoist_109,
    "Repro1": direct_hoist_111,
    "Repro2": direct_hoist_113,
    "Req": direct_hoist_114,
    "RequiredPartialObject": direct_hoist_115,
    "Settings": direct_hoist_116,
    "SettingsUpdate": direct_hoist_117,
    "Shape": direct_hoist_124,
    "T3": direct_hoist_125,
    "TransportedValue": direct_hoist_130,
    "Uint8ArrayType": direct_hoist_131,
    "UnionWithEnumAccess": direct_hoist_138,
    "User": direct_hoist_140,
    "Version": direct_hoist_141,
    "Version2": direct_hoist_142,
    "WithOptionals": direct_hoist_143,
    "DtsConfig": direct_hoist_145,
    "DtsStatus": direct_hoist_146,
    "TsxLabel": direct_hoist_147,
    "TsxTask": direct_hoist_149,
    "Arr2": direct_hoist_150,
    "OtherEnum": direct_hoist_99,
    "Arr3": direct_hoist_151,
    "CurrencyPrices": direct_hoist_153,
    "NonInfiniteNumber": direct_hoist_154,
    "NonNegativeNumber": direct_hoist_155,
    "Rate": direct_hoist_156,
    "ReadAuthorizedUserId": direct_hoist_157,
    "UserId": direct_hoist_158,
    "ValidCurrency": direct_hoist_152,
    "WriteAuthorizedUserId": direct_hoist_159,
    "AllTs": direct_hoist_99,
    "OtherEnum__A": direct_hoist_43,
    "OtherEnum__B": direct_hoist_71,
    "OtherEnum2__C": direct_hoist_160
};
const buildParsersInput = {
    "PartialRepro": direct_hoist_0,
    "TransportedValue": direct_hoist_1,
    "OnlyAKey": direct_hoist_2,
    "ObjectWithArr": direct_hoist_5,
    "BigIntCodec": direct_hoist_6,
    "TupleCodec": direct_hoist_8,
    "TupleCodecRest": direct_hoist_9,
    "StringArrCodec": direct_hoist_4,
    "AllTs": direct_hoist_10,
    "AObject": direct_hoist_11,
    "Version": direct_hoist_12,
    "Version2": direct_hoist_13,
    "AccessLevelTpl2": direct_hoist_14,
    "AccessLevelTpl": direct_hoist_15,
    "Arr3": direct_hoist_16,
    "OmitSettings": direct_hoist_17,
    "RequiredPartialObject": direct_hoist_18,
    "LevelAndDSettings": direct_hoist_19,
    "PartialSettings": direct_hoist_20,
    "Extra": direct_hoist_21,
    "User": direct_hoist_22,
    "PublicUser": direct_hoist_23,
    "Req": direct_hoist_24,
    "Repro1": direct_hoist_25,
    "SettingsUpdate": direct_hoist_26,
    "Mapped": direct_hoist_27,
    "MappedOptional": direct_hoist_28,
    "PartialObject": direct_hoist_29,
    "DiscriminatedUnion": direct_hoist_30,
    "DiscriminatedUnion2": direct_hoist_31,
    "DiscriminatedUnion3": direct_hoist_32,
    "DiscriminatedUnion4": direct_hoist_33,
    "AllTypes": direct_hoist_34,
    "AccessLevel": direct_hoist_35,
    "OtherEnum": direct_hoist_36,
    "Arr2C": direct_hoist_37,
    "ValidCurrency": direct_hoist_38,
    "UnionWithEnumAccess": direct_hoist_39,
    "T3": direct_hoist_40,
    "AccessLevelCodec": direct_hoist_35,
    "AvatarSize": direct_hoist_41,
    "BObject": direct_hoist_42,
    "ImportEnumTypeof": direct_hoist_44,
    "KDEF": direct_hoist_45,
    "KABC": direct_hoist_46,
    "K": direct_hoist_47,
    "NonNegativeNumber": direct_hoist_48,
    "NonInfiniteNumber": direct_hoist_49,
    "Rate": direct_hoist_50,
    "UserId": direct_hoist_51,
    "ReadAuthorizedUserId": direct_hoist_52,
    "WriteAuthorizedUserId": direct_hoist_53,
    "CurrencyPrices": direct_hoist_54,
    "Uint8ArrayCodec": direct_hoist_55,
    "Int32ArrayCodec": direct_hoist_56,
    "Float64ArrayCodec": direct_hoist_57,
    "BigInt64ArrayCodec": direct_hoist_58,
    "TsxTask": direct_hoist_59,
    "DtsConfig": direct_hoist_60,
    "DeploymentState": direct_hoist_61
};

export default { buildParsers };