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
  registerStringFormatter,
  registerNumberFormatter,
  buildParserFromRuntype,
} from "@beff/client/codegen-v2";


class RefRuntype  {
  refName
  constructor(refName) {
    this.refName = refName;
  }
  describe(ctx) {
    const name = this.refName;
    const to = namedRuntypes[this.refName];
    if (ctx.measure) {
      ctx.deps_counter[name] = (ctx.deps_counter[name] || 0) + 1;
      if (ctx.deps[name]) {
        return name;
      }
      ctx.deps[name] = true;
      ctx.deps[name] = to.describe(ctx);
      return name;
    } else {
      if (ctx.deps_counter[name] > 1) {
        if (!ctx.deps[name]) {
          ctx.deps[name] = true;
          ctx.deps[name] = to.describe(ctx);
        }
        return name;
      } else {
        return to.describe(ctx);
      }
    }
  }
  schema(ctx) {
    const name = this.refName;
    const to = namedRuntypes[this.refName];
    if (ctx.seen[name]) {
      return {};
    }
    ctx.seen[name] = true;
    var tmp = to.schema(ctx);
    delete ctx.seen[name];
    return tmp;
  }
  hash(ctx) {
    const name = this.refName;
    const to = namedRuntypes[this.refName];
    if (ctx.seen[name]) {
      return generateHashFromString(name);
    }
    ctx.seen[name] = true;
    var tmp = to.hash(ctx);
    delete ctx.seen[name];
    return tmp;
  }
  validate(ctx, input) {
    const to = namedRuntypes[this.refName];
    return to.validate(ctx, input);
  }
  parseAfterValidation(ctx, input) {
    const to = namedRuntypes[this.refName];
    return to.parseAfterValidation(ctx, input);
  }
  reportDecodeError(ctx, input) {
    const to = namedRuntypes[this.refName];
    return to.reportDecodeError(ctx, input);
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
const direct_hoist_55 = new ObjectRuntype({}, []);
const direct_hoist_56 = new ObjectRuntype({
    "tag": direct_hoist_43
}, []);
const direct_hoist_57 = new AnyOfConstsRuntype([
    "ADMIN",
    "USER"
]);
const direct_hoist_58 = new AnyOfConstsRuntype([
    "ADMIN Admin",
    "USER User"
]);
const direct_hoist_59 = new RegexRuntype(/((ADMIN)|(USER))/, '`("ADMIN" | "USER")`');
const direct_hoist_60 = new RegexRuntype(/((ADMIN Admin)|(USER User))/, '`("ADMIN Admin" | "USER User")`');
const direct_hoist_61 = new AnyOfConstsRuntype([
    "LevelAndDSettings",
    "OmitSettings",
    "PartialSettings",
    "RequiredPartialObject"
]);
const direct_hoist_62 = new RegexRuntype(/(\d+(\.\d+)?)(x)(\d+(\.\d+)?)/, "`${number}x${number}`");
const direct_hoist_63 = new ConstRuntype("b");
const direct_hoist_64 = new ObjectRuntype({
    "tag": direct_hoist_63
}, []);
const direct_hoist_65 = new ObjectRuntype({
    "a": direct_hoist_3
}, []);
const direct_hoist_66 = new ConstRuntype("a1");
const direct_hoist_67 = new ObjectRuntype({
    "a1": direct_hoist_3,
    "a11": new OptionalFieldRuntype(direct_hoist_3),
    "subType": direct_hoist_66,
    "type": direct_hoist_43
}, []);
const direct_hoist_68 = new ConstRuntype("a2");
const direct_hoist_69 = new ObjectRuntype({
    "a2": direct_hoist_3,
    "subType": direct_hoist_68,
    "type": direct_hoist_43
}, []);
const direct_hoist_70 = new AnyOfDiscriminatedRuntype([
    direct_hoist_67,
    direct_hoist_69
], "subType", {
    "a1": direct_hoist_67,
    "a2": direct_hoist_69
});
const direct_hoist_71 = new ObjectRuntype({
    "type": direct_hoist_63,
    "value": direct_hoist_7
}, []);
const direct_hoist_72 = new AnyOfDiscriminatedRuntype([
    direct_hoist_67,
    direct_hoist_69,
    direct_hoist_71
], "type", {
    "a": direct_hoist_70,
    "b": direct_hoist_71
});
const direct_hoist_73 = new ConstRuntype("d");
const direct_hoist_74 = new ObjectRuntype({
    "type": new OptionalFieldRuntype(direct_hoist_73),
    "valueD": direct_hoist_7
}, []);
const direct_hoist_75 = new AnyOfRuntype([
    direct_hoist_67,
    direct_hoist_69,
    direct_hoist_74,
    direct_hoist_71
]);
const direct_hoist_76 = new AnyOfConstsRuntype([
    "a",
    "c"
]);
const direct_hoist_77 = new ObjectRuntype({
    "a1": direct_hoist_3,
    "type": direct_hoist_76
}, []);
const direct_hoist_78 = new AnyOfDiscriminatedRuntype([
    direct_hoist_77,
    direct_hoist_71
], "type", {
    "a": direct_hoist_77,
    "b": direct_hoist_71,
    "c": direct_hoist_77
});
const direct_hoist_79 = new ObjectRuntype({
    "a1": direct_hoist_3,
    "subType": direct_hoist_66
}, []);
const direct_hoist_80 = new ObjectRuntype({
    "a": direct_hoist_79,
    "type": direct_hoist_43
}, []);
const direct_hoist_81 = new ObjectRuntype({
    "a2": direct_hoist_3,
    "subType": direct_hoist_68
}, []);
const direct_hoist_82 = new ObjectRuntype({
    "a": direct_hoist_81,
    "type": direct_hoist_43
}, []);
const direct_hoist_83 = new AnyOfRuntype([
    direct_hoist_80,
    direct_hoist_82
]);
const direct_hoist_84 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_3,
        "value": direct_hoist_3
    }
]);
const direct_hoist_85 = new AnyOfConstsRuntype([
    "a"
]);
const direct_hoist_86 = new NeverRuntype();
const direct_hoist_87 = new ObjectRuntype({
    "tag": direct_hoist_73
}, []);
const direct_hoist_88 = new AnyOfConstsRuntype([
    "a",
    "b"
]);
const direct_hoist_89 = new ObjectRuntype({
    "d": direct_hoist_87,
    "level": direct_hoist_88
}, []);
const direct_hoist_90 = new ObjectRuntype({
    "value": direct_hoist_43
}, []);
const direct_hoist_91 = new ObjectRuntype({
    "value": direct_hoist_63
}, []);
const direct_hoist_92 = new ObjectRuntype({
    "a": direct_hoist_90,
    "b": direct_hoist_91
}, []);
const direct_hoist_93 = new ObjectRuntype({
    "a": new OptionalFieldRuntype(direct_hoist_90),
    "b": new OptionalFieldRuntype(direct_hoist_91)
}, []);
const direct_hoist_94 = new ObjectRuntype({
    "A": direct_hoist_3
}, []);
const direct_hoist_95 = new ObjectRuntype({
    "a": new OptionalFieldRuntype(direct_hoist_3),
    "b": new OptionalFieldRuntype(direct_hoist_7)
}, []);
const direct_hoist_96 = new ObjectRuntype({
    "a": new OptionalFieldRuntype(direct_hoist_3),
    "b": new OptionalFieldRuntype(direct_hoist_3)
}, []);
const direct_hoist_97 = new ObjectRuntype({
    "a": new OptionalFieldRuntype(direct_hoist_3),
    "d": new OptionalFieldRuntype(direct_hoist_87),
    "level": new OptionalFieldRuntype(direct_hoist_88)
}, []);
const direct_hoist_98 = new ObjectRuntype({
    "accessLevel": direct_hoist_35,
    "avatarSize": direct_hoist_41,
    "extra": direct_hoist_21,
    "name": direct_hoist_3
}, []);
const direct_hoist_99 = new RefRuntype("Repro2");
const direct_hoist_100 = new ObjectRuntype({
    "sizes": new OptionalFieldRuntype(direct_hoist_99)
}, []);
const direct_hoist_101 = new TypeofRuntype("boolean");
const direct_hoist_102 = new ObjectRuntype({
    "useSmallerSizes": direct_hoist_101
}, []);
const direct_hoist_103 = new ObjectRuntype({
    "optional": direct_hoist_3
}, []);
const direct_hoist_104 = new ObjectRuntype({
    "a": direct_hoist_3,
    "b": direct_hoist_7
}, []);
const direct_hoist_105 = new ObjectRuntype({
    "a": direct_hoist_3,
    "d": direct_hoist_87,
    "level": direct_hoist_88
}, []);
const direct_hoist_106 = new AnyOfRuntype([
    direct_hoist_3,
    direct_hoist_43,
    direct_hoist_63,
    direct_hoist_87
]);
const direct_hoist_107 = new ConstRuntype("circle");
const direct_hoist_108 = new ObjectRuntype({
    "kind": direct_hoist_107,
    "radius": direct_hoist_7
}, []);
const direct_hoist_109 = new ConstRuntype("square");
const direct_hoist_110 = new ObjectRuntype({
    "kind": direct_hoist_109,
    "x": direct_hoist_7
}, []);
const direct_hoist_111 = new ConstRuntype("triangle");
const direct_hoist_112 = new ObjectRuntype({
    "kind": direct_hoist_111,
    "x": direct_hoist_7,
    "y": direct_hoist_7
}, []);
const direct_hoist_113 = new AnyOfDiscriminatedRuntype([
    direct_hoist_108,
    direct_hoist_110,
    direct_hoist_112
], "kind", {
    "circle": direct_hoist_108,
    "square": direct_hoist_110,
    "triangle": direct_hoist_112
});
const direct_hoist_114 = new AnyOfDiscriminatedRuntype([
    direct_hoist_110,
    direct_hoist_112
], "kind", {
    "square": direct_hoist_110,
    "triangle": direct_hoist_112
});
const direct_hoist_115 = new NullishRuntype("null");
const direct_hoist_116 = new NullishRuntype("undefined");
const direct_hoist_117 = new AnyOfRuntype([
    direct_hoist_115,
    direct_hoist_116,
    direct_hoist_3,
    direct_hoist_7
]);
const direct_hoist_118 = new ArrayRuntype(direct_hoist_117);
const direct_hoist_119 = new AnyOfRuntype([
    direct_hoist_115,
    direct_hoist_116,
    direct_hoist_3,
    direct_hoist_118
]);
const direct_hoist_120 = new RefRuntype("OtherEnum__A");
const direct_hoist_121 = new ObjectRuntype({
    "tag": direct_hoist_120,
    "value": direct_hoist_3
}, []);
const direct_hoist_122 = new RefRuntype("OtherEnum__B");
const direct_hoist_123 = new ObjectRuntype({
    "tag": direct_hoist_122,
    "value": direct_hoist_7
}, []);
const direct_hoist_124 = new RefRuntype("OtherEnum2__C");
const direct_hoist_125 = new ObjectRuntype({
    "tag": direct_hoist_124,
    "value": direct_hoist_101
}, []);
const direct_hoist_126 = new AnyOfDiscriminatedRuntype([
    direct_hoist_125,
    direct_hoist_121,
    direct_hoist_123
], "tag", {
    "a": direct_hoist_121,
    "b": direct_hoist_123,
    "c": direct_hoist_125
});
const direct_hoist_127 = new ArrayRuntype(direct_hoist_22);
const direct_hoist_128 = new ObjectRuntype({
    "accessLevel": direct_hoist_35,
    "avatarSize": direct_hoist_41,
    "extra": direct_hoist_21,
    "friends": direct_hoist_127,
    "name": direct_hoist_3
}, []);
const direct_hoist_129 = new RegexRuntype(/(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "`${number}.${number}.${number}`");
const direct_hoist_130 = new RegexRuntype(/(v)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "`v${number}.${number}.${number}`");
const direct_hoist_131 = new ObjectRuntype({
    "optional": new OptionalFieldRuntype(direct_hoist_3)
}, []);
const direct_hoist_132 = new AnyOfConstsRuntype([
    "A",
    "B",
    "C"
]);
const direct_hoist_133 = new AnyOfConstsRuntype([
    "X",
    "Y"
]);
const direct_hoist_134 = new StringWithFormatRuntype([
    "ValidCurrency"
]);
const direct_hoist_135 = new ObjectRuntype({}, [
    {
        "key": direct_hoist_134,
        "value": direct_hoist_50
    }
]);
const direct_hoist_136 = new NumberWithFormatRuntype([
    "NonInfiniteNumber"
]);
const direct_hoist_137 = new NumberWithFormatRuntype([
    "NonInfiniteNumber",
    "NonNegativeNumber"
]);
const direct_hoist_138 = new NumberWithFormatRuntype([
    "NonInfiniteNumber",
    "NonNegativeNumber",
    "Rate"
]);
const direct_hoist_139 = new StringWithFormatRuntype([
    "UserId",
    "ReadAuthorizedUserId"
]);
const direct_hoist_140 = new StringWithFormatRuntype([
    "UserId"
]);
const direct_hoist_141 = new StringWithFormatRuntype([
    "UserId",
    "ReadAuthorizedUserId",
    "WriteAuthorizedUserId"
]);
const direct_hoist_142 = new ConstRuntype("c");
const namedRuntypes = {
    "ABC": direct_hoist_55,
    "AObject": direct_hoist_56,
    "AccessLevel": direct_hoist_57,
    "AccessLevel2": direct_hoist_58,
    "AccessLevelTpl": direct_hoist_59,
    "AccessLevelTpl2": direct_hoist_60,
    "AllTypes": direct_hoist_61,
    "AvatarSize": direct_hoist_62,
    "BObject": direct_hoist_64,
    "DEF": direct_hoist_65,
    "DiscriminatedUnion": direct_hoist_72,
    "DiscriminatedUnion2": direct_hoist_75,
    "DiscriminatedUnion3": direct_hoist_78,
    "DiscriminatedUnion4": direct_hoist_83,
    "Extra": direct_hoist_84,
    "K": direct_hoist_85,
    "KABC": direct_hoist_86,
    "KDEF": direct_hoist_43,
    "LevelAndDSettings": direct_hoist_89,
    "Mapped": direct_hoist_92,
    "MappedOptional": direct_hoist_93,
    "OmitSettings": direct_hoist_89,
    "OnlyAKey": direct_hoist_94,
    "PartialObject": direct_hoist_95,
    "PartialRepro": direct_hoist_96,
    "PartialSettings": direct_hoist_97,
    "PublicUser": direct_hoist_98,
    "Repro1": direct_hoist_100,
    "Repro2": direct_hoist_102,
    "Req": direct_hoist_103,
    "RequiredPartialObject": direct_hoist_104,
    "Settings": direct_hoist_105,
    "SettingsUpdate": direct_hoist_106,
    "Shape": direct_hoist_113,
    "T3": direct_hoist_114,
    "TransportedValue": direct_hoist_119,
    "UnionWithEnumAccess": direct_hoist_126,
    "User": direct_hoist_128,
    "Version": direct_hoist_129,
    "Version2": direct_hoist_130,
    "WithOptionals": direct_hoist_131,
    "Arr2": direct_hoist_132,
    "OtherEnum": direct_hoist_88,
    "Arr3": direct_hoist_133,
    "CurrencyPrices": direct_hoist_135,
    "NonInfiniteNumber": direct_hoist_136,
    "NonNegativeNumber": direct_hoist_137,
    "Rate": direct_hoist_138,
    "ReadAuthorizedUserId": direct_hoist_139,
    "UserId": direct_hoist_140,
    "ValidCurrency": direct_hoist_134,
    "WriteAuthorizedUserId": direct_hoist_141,
    "AllTs": direct_hoist_88,
    "OtherEnum__A": direct_hoist_43,
    "OtherEnum__B": direct_hoist_63,
    "OtherEnum2__C": direct_hoist_142
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
    "CurrencyPrices": direct_hoist_54
};

export default { buildParsers };