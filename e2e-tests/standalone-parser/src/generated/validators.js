//@ts-nocheck
/* eslint-disable */




const customFormatters = {};

function registerCustomFormatter(name, validator) {
  customFormatters[name] = validator;
}

function decodeString(ctx, input) {
  return typeof input === "string";
}

function decodeNumber(ctx, input) {
  return typeof input === "number";
}

function decodeBoolean(ctx, input) {
  return typeof input === "boolean";
}
function decodeAny(ctx, input) {
  return true;
}
function decodeNull(ctx, input) {
  if (input == null) {
    return true;
  }
  return false;
}
function decodeNever(ctx, input) {
  return false;
}
function decodeFunction(ctx, input) {
  return typeof input === "function";
}

class ConstDecoder {
  constructor(value) {
    this.value = value;
  }

  decodeConstDecoder(ctx, input) {
    return input === this.value;
  }
}

class RegexDecoder {
  constructor(regex, description) {
    this.regex = regex;
    this.description = description;
  }

  decodeRegexDecoder(ctx, input) {
    if (typeof input === "string") {
      return this.regex.test(input);
    }
    return false;
  }
}

class ObjectDecoder {
  constructor(data, additionalPropsValidator = null) {
    this.data = data;
    this.additionalPropsValidator = additionalPropsValidator;
  }

  decodeObjectDecoder(ctx, input) {
    if (typeof input === "object" && !Array.isArray(input) && input !== null) {
      const configKeys = Object.keys(this.data);
      for (const k of configKeys) {
        const v = this.data[k];
        if (!v(ctx, input[k])) {
          return false;
        }
      }

      if (this.additionalPropsValidator != null) {
        const inputKeys = Object.keys(input);
        const extraKeys = inputKeys.filter((k) => !configKeys.includes(k));
        for (const k of extraKeys) {
          const v = input[k];
          if (!this.additionalPropsValidator(ctx, v)) {
            return false;
          }
        }
      }

      return true;
    }
    return false;
  }
}

class ArrayDecoder {
  constructor(data) {
    this.data = data;
  }

  decodeArrayDecoder(ctx, input) {
    if (Array.isArray(input)) {
      for (let i = 0; i < input.length; i++) {
        const v = input[i];
        const ok = this.data(ctx, v);
        if (!ok) {
          return false;
        }
      }
    }
    return true;
  }
}
class CodecDecoder {
  constructor(codec) {
    this.codec = codec;
  }
  decodeCodecDecoder(ctx, input) {
    switch (this.codec) {
      case "Codec::ISO8061": {
        const d = new Date(input);
        return !isNaN(d.getTime());
      }
      case "Codec::BigInt": {
        if (typeof input === "bigint") {
          return true;
        }
        if (typeof input === "number") {
          return true;
        }
        if (typeof input === "string") {
          try {
            return true;
          } catch (e) {
            
          }
        }
        return false;
      }
    }
    return false;
  }
}

class StringWithFormatDecoder {
  constructor(format) {
    this.format = format;
  }

  decodeStringWithFormatDecoder(ctx, input) {
    if (typeof input !== "string") {
      return false;
    }

    const validator = customFormatters[this.format];

    if (validator == null) {
      return false;
    }

    return validator(input);
  }
}
class AnyOfDiscriminatedDecoder {
  constructor(discriminator, mapping) {
    this.discriminator = discriminator;
    this.mapping = mapping;
  }

  decodeAnyOfDiscriminatedDecoder(ctx, input) {
    const d = input[this.discriminator];
    if (d == null) {
      return false;
    }
    const v = this.mapping[d];
    if (v == null) {
      
      return false;
    }
    if (!v(ctx, input)) {
      return false;
    }
    return true;
  }
}

class AnyOfConstsDecoder {
  constructor(consts) {
    this.consts = consts;
  }
  decodeAnyOfConstsDecoder(ctx, input) {
    if (input == null) {
      if (this.consts.includes(null) || this.consts.includes(undefined)) {
        return true;
      }
    }
    return this.consts.includes(input);
  }
}

class AnyOfDecoder {
  constructor(vs) {
    this.vs = vs;
  }
  decodeAnyOfDecoder(ctx, input) {
    for (const v of this.vs) {
      if (v(ctx, input)) {
        return true;
      }
    }
    return false;
  }
}
class AllOfDecoder {
  constructor(vs) {
    this.vs = vs;
  }
  decodeAllOfDecoder(ctx, input) {
    for (const v of this.vs) {
      if (!v(ctx, input)) {
        return false;
      }
    }
    return true;
  }
}
class TupleDecoder {
  constructor(vs) {
    this.vs = vs;
  }
  decodeTupleDecoder(ctx, input) {
    if (Array.isArray(input)) {
      let idx = 0;
      for (const prefixVal of this.vs.prefix) {
        if (!prefixVal(ctx, input[idx])) {
          return false;
        }
        idx++;
      }
      const itemVal = this.vs.items;
      if (itemVal != null) {
        for (let i = idx; i < input.length; i++) {
          if (!itemVal(ctx, input[i])) {
            return false;
          }
        }
      } else {
        if (input.length > idx) {
          return false;
        }
      }
      return true;
    }
    return false;
  }
}


function ValidateTransportedValue(ctx, input) {
    return (hoisted_TransportedValue_2.decodeAnyOfDecoder.bind(hoisted_TransportedValue_2))(ctx, input);
}
function ValidateOnlyAKey(ctx, input) {
    return (hoisted_OnlyAKey_3.decodeObjectDecoder.bind(hoisted_OnlyAKey_3))(ctx, input);
}
function ValidateAllTs(ctx, input) {
    return (hoisted_AllTs_4.decodeAnyOfConstsDecoder.bind(hoisted_AllTs_4))(ctx, input);
}
function ValidateAObject(ctx, input) {
    return (hoisted_AObject_6.decodeObjectDecoder.bind(hoisted_AObject_6))(ctx, input);
}
function ValidateVersion(ctx, input) {
    return (hoisted_Version_7.decodeRegexDecoder.bind(hoisted_Version_7))(ctx, input);
}
function ValidateVersion2(ctx, input) {
    return (hoisted_Version2_8.decodeRegexDecoder.bind(hoisted_Version2_8))(ctx, input);
}
function ValidateAccessLevel2(ctx, input) {
    return (hoisted_AccessLevel2_9.decodeAnyOfConstsDecoder.bind(hoisted_AccessLevel2_9))(ctx, input);
}
function ValidateAccessLevelTpl2(ctx, input) {
    return (hoisted_AccessLevelTpl2_10.decodeRegexDecoder.bind(hoisted_AccessLevelTpl2_10))(ctx, input);
}
function ValidateAccessLevel(ctx, input) {
    return (hoisted_AccessLevel_11.decodeAnyOfConstsDecoder.bind(hoisted_AccessLevel_11))(ctx, input);
}
function ValidateAccessLevelTpl(ctx, input) {
    return (hoisted_AccessLevelTpl_12.decodeRegexDecoder.bind(hoisted_AccessLevelTpl_12))(ctx, input);
}
function ValidateArr3(ctx, input) {
    return (hoisted_Arr3_13.decodeAnyOfConstsDecoder.bind(hoisted_Arr3_13))(ctx, input);
}
function ValidateOmitSettings(ctx, input) {
    return (hoisted_OmitSettings_17.decodeObjectDecoder.bind(hoisted_OmitSettings_17))(ctx, input);
}
function ValidateSettings(ctx, input) {
    return (hoisted_Settings_21.decodeObjectDecoder.bind(hoisted_Settings_21))(ctx, input);
}
function ValidatePartialObject(ctx, input) {
    return (hoisted_PartialObject_24.decodeObjectDecoder.bind(hoisted_PartialObject_24))(ctx, input);
}
function ValidateRequiredPartialObject(ctx, input) {
    return (hoisted_RequiredPartialObject_25.decodeObjectDecoder.bind(hoisted_RequiredPartialObject_25))(ctx, input);
}
function ValidateLevelAndDSettings(ctx, input) {
    return (hoisted_LevelAndDSettings_29.decodeObjectDecoder.bind(hoisted_LevelAndDSettings_29))(ctx, input);
}
function ValidatePartialSettings(ctx, input) {
    return (hoisted_PartialSettings_37.decodeObjectDecoder.bind(hoisted_PartialSettings_37))(ctx, input);
}
function ValidateExtra(ctx, input) {
    return (hoisted_Extra_38.decodeObjectDecoder.bind(hoisted_Extra_38))(ctx, input);
}
function ValidateAvatarSize(ctx, input) {
    return (hoisted_AvatarSize_39.decodeRegexDecoder.bind(hoisted_AvatarSize_39))(ctx, input);
}
function ValidateUser(ctx, input) {
    return (hoisted_User_41.decodeObjectDecoder.bind(hoisted_User_41))(ctx, input);
}
function ValidatePublicUser(ctx, input) {
    return (hoisted_PublicUser_42.decodeObjectDecoder.bind(hoisted_PublicUser_42))(ctx, input);
}
function ValidateReq(ctx, input) {
    return (hoisted_Req_43.decodeObjectDecoder.bind(hoisted_Req_43))(ctx, input);
}
function ValidateWithOptionals(ctx, input) {
    return (hoisted_WithOptionals_45.decodeObjectDecoder.bind(hoisted_WithOptionals_45))(ctx, input);
}
function ValidateRepro1(ctx, input) {
    return (hoisted_Repro1_47.decodeObjectDecoder.bind(hoisted_Repro1_47))(ctx, input);
}
function ValidateRepro2(ctx, input) {
    return (hoisted_Repro2_48.decodeObjectDecoder.bind(hoisted_Repro2_48))(ctx, input);
}
function ValidateSettingsUpdate(ctx, input) {
    return (hoisted_SettingsUpdate_51.decodeAnyOfDecoder.bind(hoisted_SettingsUpdate_51))(ctx, input);
}
function ValidateMapped(ctx, input) {
    return (hoisted_Mapped_56.decodeObjectDecoder.bind(hoisted_Mapped_56))(ctx, input);
}
function ValidateMappedOptional(ctx, input) {
    return (hoisted_MappedOptional_63.decodeObjectDecoder.bind(hoisted_MappedOptional_63))(ctx, input);
}
function ValidateDiscriminatedUnion(ctx, input) {
    return (hoisted_DiscriminatedUnion_69.decodeAnyOfDiscriminatedDecoder.bind(hoisted_DiscriminatedUnion_69))(ctx, input);
}
function ValidateDiscriminatedUnion2(ctx, input) {
    return (hoisted_DiscriminatedUnion2_82.decodeAnyOfDecoder.bind(hoisted_DiscriminatedUnion2_82))(ctx, input);
}
function ValidateDiscriminatedUnion3(ctx, input) {
    return (hoisted_DiscriminatedUnion3_86.decodeAnyOfDiscriminatedDecoder.bind(hoisted_DiscriminatedUnion3_86))(ctx, input);
}
function ValidateDiscriminatedUnion4(ctx, input) {
    return (hoisted_DiscriminatedUnion4_94.decodeAnyOfDiscriminatedDecoder.bind(hoisted_DiscriminatedUnion4_94))(ctx, input);
}
function ValidateAllTypes(ctx, input) {
    return (hoisted_AllTypes_95.decodeAnyOfConstsDecoder.bind(hoisted_AllTypes_95))(ctx, input);
}
function ValidateOtherEnum(ctx, input) {
    return (hoisted_OtherEnum_96.decodeAnyOfConstsDecoder.bind(hoisted_OtherEnum_96))(ctx, input);
}
function ValidateArr2(ctx, input) {
    return (hoisted_Arr2_97.decodeAnyOfConstsDecoder.bind(hoisted_Arr2_97))(ctx, input);
}
function ValidateValidCurrency(ctx, input) {
    return (hoisted_ValidCurrency_98.decodeStringWithFormatDecoder.bind(hoisted_ValidCurrency_98))(ctx, input);
}
function ValidateUnionWithEnumAccess(ctx, input) {
    return (hoisted_UnionWithEnumAccess_102.decodeAnyOfDiscriminatedDecoder.bind(hoisted_UnionWithEnumAccess_102))(ctx, input);
}
function ValidateShape(ctx, input) {
    return (hoisted_Shape_106.decodeAnyOfDiscriminatedDecoder.bind(hoisted_Shape_106))(ctx, input);
}
function ValidateT3(ctx, input) {
    return (hoisted_T3_109.decodeAnyOfDiscriminatedDecoder.bind(hoisted_T3_109))(ctx, input);
}
function ValidateBObject(ctx, input) {
    return (hoisted_BObject_111.decodeObjectDecoder.bind(hoisted_BObject_111))(ctx, input);
}
function ValidateDEF(ctx, input) {
    return (hoisted_DEF_112.decodeObjectDecoder.bind(hoisted_DEF_112))(ctx, input);
}
function ValidateKDEF(ctx, input) {
    return (hoisted_KDEF_113.decodeConstDecoder.bind(hoisted_KDEF_113))(ctx, input);
}
function ValidateABC(ctx, input) {
    return (hoisted_ABC_114.decodeObjectDecoder.bind(hoisted_ABC_114))(ctx, input);
}
function ValidateKABC(ctx, input) {
    return (decodeNever)(ctx, input);
}
function ValidateK(ctx, input) {
    return (hoisted_K_115.decodeAnyOfDecoder.bind(hoisted_K_115))(ctx, input);
}
const validators = {
    TransportedValue: ValidateTransportedValue,
    OnlyAKey: ValidateOnlyAKey,
    AllTs: ValidateAllTs,
    AObject: ValidateAObject,
    Version: ValidateVersion,
    Version2: ValidateVersion2,
    AccessLevel2: ValidateAccessLevel2,
    AccessLevelTpl2: ValidateAccessLevelTpl2,
    AccessLevel: ValidateAccessLevel,
    AccessLevelTpl: ValidateAccessLevelTpl,
    Arr3: ValidateArr3,
    OmitSettings: ValidateOmitSettings,
    Settings: ValidateSettings,
    PartialObject: ValidatePartialObject,
    RequiredPartialObject: ValidateRequiredPartialObject,
    LevelAndDSettings: ValidateLevelAndDSettings,
    PartialSettings: ValidatePartialSettings,
    Extra: ValidateExtra,
    AvatarSize: ValidateAvatarSize,
    User: ValidateUser,
    PublicUser: ValidatePublicUser,
    Req: ValidateReq,
    WithOptionals: ValidateWithOptionals,
    Repro1: ValidateRepro1,
    Repro2: ValidateRepro2,
    SettingsUpdate: ValidateSettingsUpdate,
    Mapped: ValidateMapped,
    MappedOptional: ValidateMappedOptional,
    DiscriminatedUnion: ValidateDiscriminatedUnion,
    DiscriminatedUnion2: ValidateDiscriminatedUnion2,
    DiscriminatedUnion3: ValidateDiscriminatedUnion3,
    DiscriminatedUnion4: ValidateDiscriminatedUnion4,
    AllTypes: ValidateAllTypes,
    OtherEnum: ValidateOtherEnum,
    Arr2: ValidateArr2,
    ValidCurrency: ValidateValidCurrency,
    UnionWithEnumAccess: ValidateUnionWithEnumAccess,
    Shape: ValidateShape,
    T3: ValidateT3,
    BObject: ValidateBObject,
    DEF: ValidateDEF,
    KDEF: ValidateKDEF,
    ABC: ValidateABC,
    KABC: ValidateKABC,
    K: ValidateK
};
const hoisted_TransportedValue_0 = new AnyOfDecoder([
    decodeNull,
    decodeString,
    decodeNumber
]);
const hoisted_TransportedValue_1 = new ArrayDecoder(hoisted_TransportedValue_0.decodeAnyOfDecoder.bind(hoisted_TransportedValue_0));
const hoisted_TransportedValue_2 = new AnyOfDecoder([
    decodeNull,
    decodeString,
    hoisted_TransportedValue_1.decodeArrayDecoder.bind(hoisted_TransportedValue_1)
]);
const hoisted_OnlyAKey_3 = new ObjectDecoder({
    "A": decodeString
});
const hoisted_AllTs_4 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_AObject_5 = new ConstDecoder("a");
const hoisted_AObject_6 = new ObjectDecoder({
    "tag": hoisted_AObject_5.decodeConstDecoder.bind(hoisted_AObject_5)
});
const hoisted_Version_7 = new RegexDecoder(/(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "${number}.${number}.${number}");
const hoisted_Version2_8 = new RegexDecoder(/(v)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "v${number}.${number}.${number}");
const hoisted_AccessLevel2_9 = new AnyOfConstsDecoder([
    "ADMIN Admin",
    "USER User"
]);
const hoisted_AccessLevelTpl2_10 = new RegexDecoder(/((ADMIN Admin)|(USER User))/, '("ADMIN Admin" | "USER User")');
const hoisted_AccessLevel_11 = new AnyOfConstsDecoder([
    "ADMIN",
    "USER"
]);
const hoisted_AccessLevelTpl_12 = new RegexDecoder(/((ADMIN)|(USER))/, '("ADMIN" | "USER")');
const hoisted_Arr3_13 = new AnyOfConstsDecoder([
    "X",
    "Y"
]);
const hoisted_OmitSettings_14 = new ConstDecoder("d");
const hoisted_OmitSettings_15 = new ObjectDecoder({
    "tag": hoisted_OmitSettings_14.decodeConstDecoder.bind(hoisted_OmitSettings_14)
});
const hoisted_OmitSettings_16 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_OmitSettings_17 = new ObjectDecoder({
    "d": hoisted_OmitSettings_15.decodeObjectDecoder.bind(hoisted_OmitSettings_15),
    "level": hoisted_OmitSettings_16.decodeAnyOfConstsDecoder.bind(hoisted_OmitSettings_16)
});
const hoisted_Settings_18 = new ConstDecoder("d");
const hoisted_Settings_19 = new ObjectDecoder({
    "tag": hoisted_Settings_18.decodeConstDecoder.bind(hoisted_Settings_18)
});
const hoisted_Settings_20 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_Settings_21 = new ObjectDecoder({
    "a": decodeString,
    "d": hoisted_Settings_19.decodeObjectDecoder.bind(hoisted_Settings_19),
    "level": hoisted_Settings_20.decodeAnyOfConstsDecoder.bind(hoisted_Settings_20)
});
const hoisted_PartialObject_22 = new AnyOfDecoder([
    decodeNull,
    decodeString
]);
const hoisted_PartialObject_23 = new AnyOfDecoder([
    decodeNull,
    decodeNumber
]);
const hoisted_PartialObject_24 = new ObjectDecoder({
    "a": hoisted_PartialObject_22.decodeAnyOfDecoder.bind(hoisted_PartialObject_22),
    "b": hoisted_PartialObject_23.decodeAnyOfDecoder.bind(hoisted_PartialObject_23)
});
const hoisted_RequiredPartialObject_25 = new ObjectDecoder({
    "a": decodeString,
    "b": decodeNumber
});
const hoisted_LevelAndDSettings_26 = new ConstDecoder("d");
const hoisted_LevelAndDSettings_27 = new ObjectDecoder({
    "tag": hoisted_LevelAndDSettings_26.decodeConstDecoder.bind(hoisted_LevelAndDSettings_26)
});
const hoisted_LevelAndDSettings_28 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_LevelAndDSettings_29 = new ObjectDecoder({
    "d": hoisted_LevelAndDSettings_27.decodeObjectDecoder.bind(hoisted_LevelAndDSettings_27),
    "level": hoisted_LevelAndDSettings_28.decodeAnyOfConstsDecoder.bind(hoisted_LevelAndDSettings_28)
});
const hoisted_PartialSettings_30 = new AnyOfDecoder([
    decodeNull,
    decodeString
]);
const hoisted_PartialSettings_31 = new ConstDecoder("d");
const hoisted_PartialSettings_32 = new ObjectDecoder({
    "tag": hoisted_PartialSettings_31.decodeConstDecoder.bind(hoisted_PartialSettings_31)
});
const hoisted_PartialSettings_33 = new AnyOfDecoder([
    decodeNull,
    hoisted_PartialSettings_32.decodeObjectDecoder.bind(hoisted_PartialSettings_32)
]);
const hoisted_PartialSettings_34 = new ConstDecoder("a");
const hoisted_PartialSettings_35 = new ConstDecoder("b");
const hoisted_PartialSettings_36 = new AnyOfDecoder([
    decodeNull,
    hoisted_PartialSettings_34.decodeConstDecoder.bind(hoisted_PartialSettings_34),
    hoisted_PartialSettings_35.decodeConstDecoder.bind(hoisted_PartialSettings_35)
]);
const hoisted_PartialSettings_37 = new ObjectDecoder({
    "a": hoisted_PartialSettings_30.decodeAnyOfDecoder.bind(hoisted_PartialSettings_30),
    "d": hoisted_PartialSettings_33.decodeAnyOfDecoder.bind(hoisted_PartialSettings_33),
    "level": hoisted_PartialSettings_36.decodeAnyOfDecoder.bind(hoisted_PartialSettings_36)
});
const hoisted_Extra_38 = new ObjectDecoder({}, decodeString);
const hoisted_AvatarSize_39 = new RegexDecoder(/(\d+(\.\d+)?)(x)(\d+(\.\d+)?)/, "${number}x${number}");
const hoisted_User_40 = new ArrayDecoder(validators.User);
const hoisted_User_41 = new ObjectDecoder({
    "accessLevel": validators.AccessLevel,
    "avatarSize": validators.AvatarSize,
    "extra": validators.Extra,
    "friends": hoisted_User_40.decodeArrayDecoder.bind(hoisted_User_40),
    "name": decodeString
});
const hoisted_PublicUser_42 = new ObjectDecoder({
    "accessLevel": validators.AccessLevel,
    "avatarSize": validators.AvatarSize,
    "extra": validators.Extra,
    "name": decodeString
});
const hoisted_Req_43 = new ObjectDecoder({
    "optional": decodeString
});
const hoisted_WithOptionals_44 = new AnyOfDecoder([
    decodeNull,
    decodeString
]);
const hoisted_WithOptionals_45 = new ObjectDecoder({
    "optional": hoisted_WithOptionals_44.decodeAnyOfDecoder.bind(hoisted_WithOptionals_44)
});
const hoisted_Repro1_46 = new AnyOfDecoder([
    decodeNull,
    validators.Repro2
]);
const hoisted_Repro1_47 = new ObjectDecoder({
    "sizes": hoisted_Repro1_46.decodeAnyOfDecoder.bind(hoisted_Repro1_46)
});
const hoisted_Repro2_48 = new ObjectDecoder({
    "useSmallerSizes": decodeBoolean
});
const hoisted_SettingsUpdate_49 = new ConstDecoder("d");
const hoisted_SettingsUpdate_50 = new ObjectDecoder({
    "tag": hoisted_SettingsUpdate_49.decodeConstDecoder.bind(hoisted_SettingsUpdate_49)
});
const hoisted_SettingsUpdate_51 = new AnyOfDecoder([
    decodeString,
    hoisted_SettingsUpdate_50.decodeObjectDecoder.bind(hoisted_SettingsUpdate_50)
]);
const hoisted_Mapped_52 = new ConstDecoder("a");
const hoisted_Mapped_53 = new ObjectDecoder({
    "value": hoisted_Mapped_52.decodeConstDecoder.bind(hoisted_Mapped_52)
});
const hoisted_Mapped_54 = new ConstDecoder("b");
const hoisted_Mapped_55 = new ObjectDecoder({
    "value": hoisted_Mapped_54.decodeConstDecoder.bind(hoisted_Mapped_54)
});
const hoisted_Mapped_56 = new ObjectDecoder({
    "a": hoisted_Mapped_53.decodeObjectDecoder.bind(hoisted_Mapped_53),
    "b": hoisted_Mapped_55.decodeObjectDecoder.bind(hoisted_Mapped_55)
});
const hoisted_MappedOptional_57 = new ConstDecoder("a");
const hoisted_MappedOptional_58 = new ObjectDecoder({
    "value": hoisted_MappedOptional_57.decodeConstDecoder.bind(hoisted_MappedOptional_57)
});
const hoisted_MappedOptional_59 = new AnyOfDecoder([
    decodeNull,
    hoisted_MappedOptional_58.decodeObjectDecoder.bind(hoisted_MappedOptional_58)
]);
const hoisted_MappedOptional_60 = new ConstDecoder("b");
const hoisted_MappedOptional_61 = new ObjectDecoder({
    "value": hoisted_MappedOptional_60.decodeConstDecoder.bind(hoisted_MappedOptional_60)
});
const hoisted_MappedOptional_62 = new AnyOfDecoder([
    decodeNull,
    hoisted_MappedOptional_61.decodeObjectDecoder.bind(hoisted_MappedOptional_61)
]);
const hoisted_MappedOptional_63 = new ObjectDecoder({
    "a": hoisted_MappedOptional_59.decodeAnyOfDecoder.bind(hoisted_MappedOptional_59),
    "b": hoisted_MappedOptional_62.decodeAnyOfDecoder.bind(hoisted_MappedOptional_62)
});
const hoisted_DiscriminatedUnion_64 = new AnyOfDecoder([
    decodeNull,
    decodeString
]);
const hoisted_DiscriminatedUnion_65 = new ObjectDecoder({
    "a1": decodeString,
    "a11": hoisted_DiscriminatedUnion_64.decodeAnyOfDecoder.bind(hoisted_DiscriminatedUnion_64)
});
const hoisted_DiscriminatedUnion_66 = new ObjectDecoder({
    "a2": decodeString
});
const hoisted_DiscriminatedUnion_67 = new AnyOfDiscriminatedDecoder("subType", {
    "a1": hoisted_DiscriminatedUnion_65.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion_65),
    "a2": hoisted_DiscriminatedUnion_66.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion_66)
});
const hoisted_DiscriminatedUnion_68 = new ObjectDecoder({
    "value": decodeNumber
});
const hoisted_DiscriminatedUnion_69 = new AnyOfDiscriminatedDecoder("type", {
    "a": hoisted_DiscriminatedUnion_67.decodeAnyOfDiscriminatedDecoder.bind(hoisted_DiscriminatedUnion_67),
    "b": hoisted_DiscriminatedUnion_68.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion_68)
});
const hoisted_DiscriminatedUnion2_70 = new AnyOfDecoder([
    decodeNull,
    decodeString
]);
const hoisted_DiscriminatedUnion2_71 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion2_72 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion2_73 = new ObjectDecoder({
    "a1": decodeString,
    "a11": hoisted_DiscriminatedUnion2_70.decodeAnyOfDecoder.bind(hoisted_DiscriminatedUnion2_70),
    "subType": hoisted_DiscriminatedUnion2_71.decodeConstDecoder.bind(hoisted_DiscriminatedUnion2_71),
    "type": hoisted_DiscriminatedUnion2_72.decodeConstDecoder.bind(hoisted_DiscriminatedUnion2_72)
});
const hoisted_DiscriminatedUnion2_74 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion2_75 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion2_76 = new ObjectDecoder({
    "a2": decodeString,
    "subType": hoisted_DiscriminatedUnion2_74.decodeConstDecoder.bind(hoisted_DiscriminatedUnion2_74),
    "type": hoisted_DiscriminatedUnion2_75.decodeConstDecoder.bind(hoisted_DiscriminatedUnion2_75)
});
const hoisted_DiscriminatedUnion2_77 = new ConstDecoder("d");
const hoisted_DiscriminatedUnion2_78 = new AnyOfDecoder([
    decodeNull,
    hoisted_DiscriminatedUnion2_77.decodeConstDecoder.bind(hoisted_DiscriminatedUnion2_77)
]);
const hoisted_DiscriminatedUnion2_79 = new ObjectDecoder({
    "type": hoisted_DiscriminatedUnion2_78.decodeAnyOfDecoder.bind(hoisted_DiscriminatedUnion2_78),
    "valueD": decodeNumber
});
const hoisted_DiscriminatedUnion2_80 = new ConstDecoder("b");
const hoisted_DiscriminatedUnion2_81 = new ObjectDecoder({
    "type": hoisted_DiscriminatedUnion2_80.decodeConstDecoder.bind(hoisted_DiscriminatedUnion2_80),
    "value": decodeNumber
});
const hoisted_DiscriminatedUnion2_82 = new AnyOfDecoder([
    hoisted_DiscriminatedUnion2_73.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion2_73),
    hoisted_DiscriminatedUnion2_76.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion2_76),
    hoisted_DiscriminatedUnion2_79.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion2_79),
    hoisted_DiscriminatedUnion2_81.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion2_81)
]);
const hoisted_DiscriminatedUnion3_83 = new ObjectDecoder({
    "a1": decodeString
});
const hoisted_DiscriminatedUnion3_84 = new ObjectDecoder({
    "value": decodeNumber
});
const hoisted_DiscriminatedUnion3_85 = new ObjectDecoder({
    "a1": decodeString
});
const hoisted_DiscriminatedUnion3_86 = new AnyOfDiscriminatedDecoder("type", {
    "a": hoisted_DiscriminatedUnion3_83.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion3_83),
    "b": hoisted_DiscriminatedUnion3_84.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion3_84),
    "c": hoisted_DiscriminatedUnion3_85.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion3_85)
});
const hoisted_DiscriminatedUnion4_87 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion4_88 = new ObjectDecoder({
    "a1": decodeString,
    "subType": hoisted_DiscriminatedUnion4_87.decodeConstDecoder.bind(hoisted_DiscriminatedUnion4_87)
});
const hoisted_DiscriminatedUnion4_89 = new ObjectDecoder({
    "a": hoisted_DiscriminatedUnion4_88.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion4_88)
});
const hoisted_DiscriminatedUnion4_90 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion4_91 = new ObjectDecoder({
    "a2": decodeString,
    "subType": hoisted_DiscriminatedUnion4_90.decodeConstDecoder.bind(hoisted_DiscriminatedUnion4_90)
});
const hoisted_DiscriminatedUnion4_92 = new ObjectDecoder({
    "a": hoisted_DiscriminatedUnion4_91.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion4_91)
});
const hoisted_DiscriminatedUnion4_93 = new AnyOfDecoder([
    hoisted_DiscriminatedUnion4_89.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion4_89),
    hoisted_DiscriminatedUnion4_92.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion4_92)
]);
const hoisted_DiscriminatedUnion4_94 = new AnyOfDiscriminatedDecoder("type", {
    "a": hoisted_DiscriminatedUnion4_93.decodeAnyOfDecoder.bind(hoisted_DiscriminatedUnion4_93)
});
const hoisted_AllTypes_95 = new AnyOfConstsDecoder([
    "LevelAndDSettings",
    "OmitSettings",
    "PartialSettings",
    "RequiredPartialObject"
]);
const hoisted_OtherEnum_96 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_Arr2_97 = new AnyOfConstsDecoder([
    "A",
    "B",
    "C"
]);
const hoisted_ValidCurrency_98 = new StringWithFormatDecoder("ValidCurrency");
const hoisted_UnionWithEnumAccess_99 = new ObjectDecoder({
    "value": decodeString
});
const hoisted_UnionWithEnumAccess_100 = new ObjectDecoder({
    "value": decodeNumber
});
const hoisted_UnionWithEnumAccess_101 = new ObjectDecoder({
    "value": decodeBoolean
});
const hoisted_UnionWithEnumAccess_102 = new AnyOfDiscriminatedDecoder("tag", {
    "a": hoisted_UnionWithEnumAccess_99.decodeObjectDecoder.bind(hoisted_UnionWithEnumAccess_99),
    "b": hoisted_UnionWithEnumAccess_100.decodeObjectDecoder.bind(hoisted_UnionWithEnumAccess_100),
    "c": hoisted_UnionWithEnumAccess_101.decodeObjectDecoder.bind(hoisted_UnionWithEnumAccess_101)
});
const hoisted_Shape_103 = new ObjectDecoder({
    "radius": decodeNumber
});
const hoisted_Shape_104 = new ObjectDecoder({
    "x": decodeNumber
});
const hoisted_Shape_105 = new ObjectDecoder({
    "x": decodeNumber,
    "y": decodeNumber
});
const hoisted_Shape_106 = new AnyOfDiscriminatedDecoder("kind", {
    "circle": hoisted_Shape_103.decodeObjectDecoder.bind(hoisted_Shape_103),
    "square": hoisted_Shape_104.decodeObjectDecoder.bind(hoisted_Shape_104),
    "triangle": hoisted_Shape_105.decodeObjectDecoder.bind(hoisted_Shape_105)
});
const hoisted_T3_107 = new ObjectDecoder({
    "x": decodeNumber
});
const hoisted_T3_108 = new ObjectDecoder({
    "x": decodeNumber,
    "y": decodeNumber
});
const hoisted_T3_109 = new AnyOfDiscriminatedDecoder("kind", {
    "square": hoisted_T3_107.decodeObjectDecoder.bind(hoisted_T3_107),
    "triangle": hoisted_T3_108.decodeObjectDecoder.bind(hoisted_T3_108)
});
const hoisted_BObject_110 = new ConstDecoder("b");
const hoisted_BObject_111 = new ObjectDecoder({
    "tag": hoisted_BObject_110.decodeConstDecoder.bind(hoisted_BObject_110)
});
const hoisted_DEF_112 = new ObjectDecoder({
    "a": decodeString
});
const hoisted_KDEF_113 = new ConstDecoder("a");
const hoisted_ABC_114 = new ObjectDecoder({});
const hoisted_K_115 = new AnyOfDecoder([
    validators.KABC,
    validators.KDEF
]);

export default { ObjectDecoder, ArrayDecoder, decodeString, decodeNumber, CodecDecoder, decodeFunction, StringWithFormatDecoder, AnyOfDecoder, AllOfDecoder, decodeBoolean, decodeAny, TupleDecoder, decodeNull, decodeNever, RegexDecoder, ConstDecoder, registerCustomFormatter, AnyOfConstsDecoder, AnyOfDiscriminatedDecoder, validators };