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
    return (hoisted_OnlyAKey_0.decodeObjectDecoder.bind(hoisted_OnlyAKey_0))(ctx, input);
}
function ValidateAllTs(ctx, input) {
    return (hoisted_AllTs_0.decodeAnyOfConstsDecoder.bind(hoisted_AllTs_0))(ctx, input);
}
function ValidateAObject(ctx, input) {
    return (hoisted_AObject_1.decodeObjectDecoder.bind(hoisted_AObject_1))(ctx, input);
}
function ValidateVersion(ctx, input) {
    return (hoisted_Version_0.decodeRegexDecoder.bind(hoisted_Version_0))(ctx, input);
}
function ValidateVersion2(ctx, input) {
    return (hoisted_Version2_0.decodeRegexDecoder.bind(hoisted_Version2_0))(ctx, input);
}
function ValidateAccessLevel2(ctx, input) {
    return (hoisted_AccessLevel2_0.decodeAnyOfConstsDecoder.bind(hoisted_AccessLevel2_0))(ctx, input);
}
function ValidateAccessLevelTpl2(ctx, input) {
    return (hoisted_AccessLevelTpl2_0.decodeRegexDecoder.bind(hoisted_AccessLevelTpl2_0))(ctx, input);
}
function ValidateAccessLevel(ctx, input) {
    return (hoisted_AccessLevel_0.decodeAnyOfConstsDecoder.bind(hoisted_AccessLevel_0))(ctx, input);
}
function ValidateAccessLevelTpl(ctx, input) {
    return (hoisted_AccessLevelTpl_0.decodeRegexDecoder.bind(hoisted_AccessLevelTpl_0))(ctx, input);
}
function ValidateArr3(ctx, input) {
    return (hoisted_Arr3_0.decodeAnyOfConstsDecoder.bind(hoisted_Arr3_0))(ctx, input);
}
function ValidateOmitSettings(ctx, input) {
    return (hoisted_OmitSettings_3.decodeObjectDecoder.bind(hoisted_OmitSettings_3))(ctx, input);
}
function ValidateSettings(ctx, input) {
    return (hoisted_Settings_3.decodeObjectDecoder.bind(hoisted_Settings_3))(ctx, input);
}
function ValidatePartialObject(ctx, input) {
    return (hoisted_PartialObject_2.decodeObjectDecoder.bind(hoisted_PartialObject_2))(ctx, input);
}
function ValidateRequiredPartialObject(ctx, input) {
    return (hoisted_RequiredPartialObject_0.decodeObjectDecoder.bind(hoisted_RequiredPartialObject_0))(ctx, input);
}
function ValidateLevelAndDSettings(ctx, input) {
    return (hoisted_LevelAndDSettings_3.decodeObjectDecoder.bind(hoisted_LevelAndDSettings_3))(ctx, input);
}
function ValidatePartialSettings(ctx, input) {
    return (hoisted_PartialSettings_7.decodeObjectDecoder.bind(hoisted_PartialSettings_7))(ctx, input);
}
function ValidateExtra(ctx, input) {
    return (hoisted_Extra_0.decodeObjectDecoder.bind(hoisted_Extra_0))(ctx, input);
}
function ValidateAvatarSize(ctx, input) {
    return (hoisted_AvatarSize_0.decodeRegexDecoder.bind(hoisted_AvatarSize_0))(ctx, input);
}
function ValidateUser(ctx, input) {
    return (hoisted_User_1.decodeObjectDecoder.bind(hoisted_User_1))(ctx, input);
}
function ValidatePublicUser(ctx, input) {
    return (hoisted_PublicUser_0.decodeObjectDecoder.bind(hoisted_PublicUser_0))(ctx, input);
}
function ValidateReq(ctx, input) {
    return (hoisted_Req_0.decodeObjectDecoder.bind(hoisted_Req_0))(ctx, input);
}
function ValidateWithOptionals(ctx, input) {
    return (hoisted_WithOptionals_1.decodeObjectDecoder.bind(hoisted_WithOptionals_1))(ctx, input);
}
function ValidateRepro1(ctx, input) {
    return (hoisted_Repro1_1.decodeObjectDecoder.bind(hoisted_Repro1_1))(ctx, input);
}
function ValidateRepro2(ctx, input) {
    return (hoisted_Repro2_0.decodeObjectDecoder.bind(hoisted_Repro2_0))(ctx, input);
}
function ValidateSettingsUpdate(ctx, input) {
    return (hoisted_SettingsUpdate_2.decodeAnyOfDecoder.bind(hoisted_SettingsUpdate_2))(ctx, input);
}
function ValidateMapped(ctx, input) {
    return (hoisted_Mapped_4.decodeObjectDecoder.bind(hoisted_Mapped_4))(ctx, input);
}
function ValidateMappedOptional(ctx, input) {
    return (hoisted_MappedOptional_6.decodeObjectDecoder.bind(hoisted_MappedOptional_6))(ctx, input);
}
function ValidateDiscriminatedUnion(ctx, input) {
    return (hoisted_DiscriminatedUnion_5.decodeAnyOfDiscriminatedDecoder.bind(hoisted_DiscriminatedUnion_5))(ctx, input);
}
function ValidateDiscriminatedUnion2(ctx, input) {
    return (hoisted_DiscriminatedUnion2_12.decodeAnyOfDecoder.bind(hoisted_DiscriminatedUnion2_12))(ctx, input);
}
function ValidateDiscriminatedUnion3(ctx, input) {
    return (hoisted_DiscriminatedUnion3_3.decodeAnyOfDiscriminatedDecoder.bind(hoisted_DiscriminatedUnion3_3))(ctx, input);
}
function ValidateDiscriminatedUnion4(ctx, input) {
    return (hoisted_DiscriminatedUnion4_7.decodeAnyOfDiscriminatedDecoder.bind(hoisted_DiscriminatedUnion4_7))(ctx, input);
}
function ValidateAllTypes(ctx, input) {
    return (hoisted_AllTypes_0.decodeAnyOfConstsDecoder.bind(hoisted_AllTypes_0))(ctx, input);
}
function ValidateOtherEnum(ctx, input) {
    return (hoisted_OtherEnum_0.decodeAnyOfConstsDecoder.bind(hoisted_OtherEnum_0))(ctx, input);
}
function ValidateArr2(ctx, input) {
    return (hoisted_Arr2_0.decodeAnyOfConstsDecoder.bind(hoisted_Arr2_0))(ctx, input);
}
function ValidateValidCurrency(ctx, input) {
    return (hoisted_ValidCurrency_0.decodeStringWithFormatDecoder.bind(hoisted_ValidCurrency_0))(ctx, input);
}
function ValidateUnionWithEnumAccess(ctx, input) {
    return (hoisted_UnionWithEnumAccess_3.decodeAnyOfDiscriminatedDecoder.bind(hoisted_UnionWithEnumAccess_3))(ctx, input);
}
function ValidateShape(ctx, input) {
    return (hoisted_Shape_3.decodeAnyOfDiscriminatedDecoder.bind(hoisted_Shape_3))(ctx, input);
}
function ValidateT3(ctx, input) {
    return (hoisted_T3_2.decodeAnyOfDiscriminatedDecoder.bind(hoisted_T3_2))(ctx, input);
}
function ValidateBObject(ctx, input) {
    return (hoisted_BObject_1.decodeObjectDecoder.bind(hoisted_BObject_1))(ctx, input);
}
function ValidateDEF(ctx, input) {
    return (hoisted_DEF_0.decodeObjectDecoder.bind(hoisted_DEF_0))(ctx, input);
}
function ValidateKDEF(ctx, input) {
    return (hoisted_KDEF_0.decodeConstDecoder.bind(hoisted_KDEF_0))(ctx, input);
}
function ValidateABC(ctx, input) {
    return (hoisted_ABC_0.decodeObjectDecoder.bind(hoisted_ABC_0))(ctx, input);
}
function ValidateKABC(ctx, input) {
    return (decodeNever)(ctx, input);
}
function ValidateK(ctx, input) {
    return (hoisted_K_0.decodeAnyOfDecoder.bind(hoisted_K_0))(ctx, input);
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
const hoisted_OnlyAKey_0 = new ObjectDecoder({
    "A": decodeString
});
const hoisted_AllTs_0 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_AObject_0 = new ConstDecoder("a");
const hoisted_AObject_1 = new ObjectDecoder({
    "tag": hoisted_AObject_0.decodeConstDecoder.bind(hoisted_AObject_0)
});
const hoisted_Version_0 = new RegexDecoder(/(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "${number}.${number}.${number}");
const hoisted_Version2_0 = new RegexDecoder(/(v)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "v${number}.${number}.${number}");
const hoisted_AccessLevel2_0 = new AnyOfConstsDecoder([
    "ADMIN Admin",
    "USER User"
]);
const hoisted_AccessLevelTpl2_0 = new RegexDecoder(/((ADMIN Admin)|(USER User))/, '("ADMIN Admin" | "USER User")');
const hoisted_AccessLevel_0 = new AnyOfConstsDecoder([
    "ADMIN",
    "USER"
]);
const hoisted_AccessLevelTpl_0 = new RegexDecoder(/((ADMIN)|(USER))/, '("ADMIN" | "USER")');
const hoisted_Arr3_0 = new AnyOfConstsDecoder([
    "X",
    "Y"
]);
const hoisted_OmitSettings_0 = new ConstDecoder("d");
const hoisted_OmitSettings_1 = new ObjectDecoder({
    "tag": hoisted_OmitSettings_0.decodeConstDecoder.bind(hoisted_OmitSettings_0)
});
const hoisted_OmitSettings_2 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_OmitSettings_3 = new ObjectDecoder({
    "d": hoisted_OmitSettings_1.decodeObjectDecoder.bind(hoisted_OmitSettings_1),
    "level": hoisted_OmitSettings_2.decodeAnyOfConstsDecoder.bind(hoisted_OmitSettings_2)
});
const hoisted_Settings_0 = new ConstDecoder("d");
const hoisted_Settings_1 = new ObjectDecoder({
    "tag": hoisted_Settings_0.decodeConstDecoder.bind(hoisted_Settings_0)
});
const hoisted_Settings_2 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_Settings_3 = new ObjectDecoder({
    "a": decodeString,
    "d": hoisted_Settings_1.decodeObjectDecoder.bind(hoisted_Settings_1),
    "level": hoisted_Settings_2.decodeAnyOfConstsDecoder.bind(hoisted_Settings_2)
});
const hoisted_PartialObject_0 = new AnyOfDecoder([
    decodeNull,
    decodeString
]);
const hoisted_PartialObject_1 = new AnyOfDecoder([
    decodeNull,
    decodeNumber
]);
const hoisted_PartialObject_2 = new ObjectDecoder({
    "a": hoisted_PartialObject_0.decodeAnyOfDecoder.bind(hoisted_PartialObject_0),
    "b": hoisted_PartialObject_1.decodeAnyOfDecoder.bind(hoisted_PartialObject_1)
});
const hoisted_RequiredPartialObject_0 = new ObjectDecoder({
    "a": decodeString,
    "b": decodeNumber
});
const hoisted_LevelAndDSettings_0 = new ConstDecoder("d");
const hoisted_LevelAndDSettings_1 = new ObjectDecoder({
    "tag": hoisted_LevelAndDSettings_0.decodeConstDecoder.bind(hoisted_LevelAndDSettings_0)
});
const hoisted_LevelAndDSettings_2 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_LevelAndDSettings_3 = new ObjectDecoder({
    "d": hoisted_LevelAndDSettings_1.decodeObjectDecoder.bind(hoisted_LevelAndDSettings_1),
    "level": hoisted_LevelAndDSettings_2.decodeAnyOfConstsDecoder.bind(hoisted_LevelAndDSettings_2)
});
const hoisted_PartialSettings_0 = new AnyOfDecoder([
    decodeNull,
    decodeString
]);
const hoisted_PartialSettings_1 = new ConstDecoder("d");
const hoisted_PartialSettings_2 = new ObjectDecoder({
    "tag": hoisted_PartialSettings_1.decodeConstDecoder.bind(hoisted_PartialSettings_1)
});
const hoisted_PartialSettings_3 = new AnyOfDecoder([
    decodeNull,
    hoisted_PartialSettings_2.decodeObjectDecoder.bind(hoisted_PartialSettings_2)
]);
const hoisted_PartialSettings_4 = new ConstDecoder("a");
const hoisted_PartialSettings_5 = new ConstDecoder("b");
const hoisted_PartialSettings_6 = new AnyOfDecoder([
    decodeNull,
    hoisted_PartialSettings_4.decodeConstDecoder.bind(hoisted_PartialSettings_4),
    hoisted_PartialSettings_5.decodeConstDecoder.bind(hoisted_PartialSettings_5)
]);
const hoisted_PartialSettings_7 = new ObjectDecoder({
    "a": hoisted_PartialSettings_0.decodeAnyOfDecoder.bind(hoisted_PartialSettings_0),
    "d": hoisted_PartialSettings_3.decodeAnyOfDecoder.bind(hoisted_PartialSettings_3),
    "level": hoisted_PartialSettings_6.decodeAnyOfDecoder.bind(hoisted_PartialSettings_6)
});
const hoisted_Extra_0 = new ObjectDecoder({}, decodeString);
const hoisted_AvatarSize_0 = new RegexDecoder(/(\d+(\.\d+)?)(x)(\d+(\.\d+)?)/, "${number}x${number}");
const hoisted_User_0 = new ArrayDecoder(validators.User);
const hoisted_User_1 = new ObjectDecoder({
    "accessLevel": validators.AccessLevel,
    "avatarSize": validators.AvatarSize,
    "extra": validators.Extra,
    "friends": hoisted_User_0.decodeArrayDecoder.bind(hoisted_User_0),
    "name": decodeString
});
const hoisted_PublicUser_0 = new ObjectDecoder({
    "accessLevel": validators.AccessLevel,
    "avatarSize": validators.AvatarSize,
    "extra": validators.Extra,
    "name": decodeString
});
const hoisted_Req_0 = new ObjectDecoder({
    "optional": decodeString
});
const hoisted_WithOptionals_0 = new AnyOfDecoder([
    decodeNull,
    decodeString
]);
const hoisted_WithOptionals_1 = new ObjectDecoder({
    "optional": hoisted_WithOptionals_0.decodeAnyOfDecoder.bind(hoisted_WithOptionals_0)
});
const hoisted_Repro1_0 = new AnyOfDecoder([
    decodeNull,
    validators.Repro2
]);
const hoisted_Repro1_1 = new ObjectDecoder({
    "sizes": hoisted_Repro1_0.decodeAnyOfDecoder.bind(hoisted_Repro1_0)
});
const hoisted_Repro2_0 = new ObjectDecoder({
    "useSmallerSizes": decodeBoolean
});
const hoisted_SettingsUpdate_0 = new ConstDecoder("d");
const hoisted_SettingsUpdate_1 = new ObjectDecoder({
    "tag": hoisted_SettingsUpdate_0.decodeConstDecoder.bind(hoisted_SettingsUpdate_0)
});
const hoisted_SettingsUpdate_2 = new AnyOfDecoder([
    decodeString,
    hoisted_SettingsUpdate_1.decodeObjectDecoder.bind(hoisted_SettingsUpdate_1)
]);
const hoisted_Mapped_0 = new ConstDecoder("a");
const hoisted_Mapped_1 = new ObjectDecoder({
    "value": hoisted_Mapped_0.decodeConstDecoder.bind(hoisted_Mapped_0)
});
const hoisted_Mapped_2 = new ConstDecoder("b");
const hoisted_Mapped_3 = new ObjectDecoder({
    "value": hoisted_Mapped_2.decodeConstDecoder.bind(hoisted_Mapped_2)
});
const hoisted_Mapped_4 = new ObjectDecoder({
    "a": hoisted_Mapped_1.decodeObjectDecoder.bind(hoisted_Mapped_1),
    "b": hoisted_Mapped_3.decodeObjectDecoder.bind(hoisted_Mapped_3)
});
const hoisted_MappedOptional_0 = new ConstDecoder("a");
const hoisted_MappedOptional_1 = new ObjectDecoder({
    "value": hoisted_MappedOptional_0.decodeConstDecoder.bind(hoisted_MappedOptional_0)
});
const hoisted_MappedOptional_2 = new AnyOfDecoder([
    decodeNull,
    hoisted_MappedOptional_1.decodeObjectDecoder.bind(hoisted_MappedOptional_1)
]);
const hoisted_MappedOptional_3 = new ConstDecoder("b");
const hoisted_MappedOptional_4 = new ObjectDecoder({
    "value": hoisted_MappedOptional_3.decodeConstDecoder.bind(hoisted_MappedOptional_3)
});
const hoisted_MappedOptional_5 = new AnyOfDecoder([
    decodeNull,
    hoisted_MappedOptional_4.decodeObjectDecoder.bind(hoisted_MappedOptional_4)
]);
const hoisted_MappedOptional_6 = new ObjectDecoder({
    "a": hoisted_MappedOptional_2.decodeAnyOfDecoder.bind(hoisted_MappedOptional_2),
    "b": hoisted_MappedOptional_5.decodeAnyOfDecoder.bind(hoisted_MappedOptional_5)
});
const hoisted_DiscriminatedUnion_0 = new AnyOfDecoder([
    decodeNull,
    decodeString
]);
const hoisted_DiscriminatedUnion_1 = new ObjectDecoder({
    "a1": decodeString,
    "a11": hoisted_DiscriminatedUnion_0.decodeAnyOfDecoder.bind(hoisted_DiscriminatedUnion_0)
});
const hoisted_DiscriminatedUnion_2 = new ObjectDecoder({
    "a2": decodeString
});
const hoisted_DiscriminatedUnion_3 = new AnyOfDiscriminatedDecoder("subType", {
    "a1": hoisted_DiscriminatedUnion_1.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion_1),
    "a2": hoisted_DiscriminatedUnion_2.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion_2)
});
const hoisted_DiscriminatedUnion_4 = new ObjectDecoder({
    "value": decodeNumber
});
const hoisted_DiscriminatedUnion_5 = new AnyOfDiscriminatedDecoder("type", {
    "a": hoisted_DiscriminatedUnion_3.decodeAnyOfDiscriminatedDecoder.bind(hoisted_DiscriminatedUnion_3),
    "b": hoisted_DiscriminatedUnion_4.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion_4)
});
const hoisted_DiscriminatedUnion2_0 = new AnyOfDecoder([
    decodeNull,
    decodeString
]);
const hoisted_DiscriminatedUnion2_1 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion2_2 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion2_3 = new ObjectDecoder({
    "a1": decodeString,
    "a11": hoisted_DiscriminatedUnion2_0.decodeAnyOfDecoder.bind(hoisted_DiscriminatedUnion2_0),
    "subType": hoisted_DiscriminatedUnion2_1.decodeConstDecoder.bind(hoisted_DiscriminatedUnion2_1),
    "type": hoisted_DiscriminatedUnion2_2.decodeConstDecoder.bind(hoisted_DiscriminatedUnion2_2)
});
const hoisted_DiscriminatedUnion2_4 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion2_5 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion2_6 = new ObjectDecoder({
    "a2": decodeString,
    "subType": hoisted_DiscriminatedUnion2_4.decodeConstDecoder.bind(hoisted_DiscriminatedUnion2_4),
    "type": hoisted_DiscriminatedUnion2_5.decodeConstDecoder.bind(hoisted_DiscriminatedUnion2_5)
});
const hoisted_DiscriminatedUnion2_7 = new ConstDecoder("d");
const hoisted_DiscriminatedUnion2_8 = new AnyOfDecoder([
    decodeNull,
    hoisted_DiscriminatedUnion2_7.decodeConstDecoder.bind(hoisted_DiscriminatedUnion2_7)
]);
const hoisted_DiscriminatedUnion2_9 = new ObjectDecoder({
    "type": hoisted_DiscriminatedUnion2_8.decodeAnyOfDecoder.bind(hoisted_DiscriminatedUnion2_8),
    "valueD": decodeNumber
});
const hoisted_DiscriminatedUnion2_10 = new ConstDecoder("b");
const hoisted_DiscriminatedUnion2_11 = new ObjectDecoder({
    "type": hoisted_DiscriminatedUnion2_10.decodeConstDecoder.bind(hoisted_DiscriminatedUnion2_10),
    "value": decodeNumber
});
const hoisted_DiscriminatedUnion2_12 = new AnyOfDecoder([
    hoisted_DiscriminatedUnion2_3.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion2_3),
    hoisted_DiscriminatedUnion2_6.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion2_6),
    hoisted_DiscriminatedUnion2_9.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion2_9),
    hoisted_DiscriminatedUnion2_11.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion2_11)
]);
const hoisted_DiscriminatedUnion3_0 = new ObjectDecoder({
    "a1": decodeString
});
const hoisted_DiscriminatedUnion3_1 = new ObjectDecoder({
    "value": decodeNumber
});
const hoisted_DiscriminatedUnion3_2 = new ObjectDecoder({
    "a1": decodeString
});
const hoisted_DiscriminatedUnion3_3 = new AnyOfDiscriminatedDecoder("type", {
    "a": hoisted_DiscriminatedUnion3_0.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion3_0),
    "b": hoisted_DiscriminatedUnion3_1.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion3_1),
    "c": hoisted_DiscriminatedUnion3_2.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion3_2)
});
const hoisted_DiscriminatedUnion4_0 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion4_1 = new ObjectDecoder({
    "a1": decodeString,
    "subType": hoisted_DiscriminatedUnion4_0.decodeConstDecoder.bind(hoisted_DiscriminatedUnion4_0)
});
const hoisted_DiscriminatedUnion4_2 = new ObjectDecoder({
    "a": hoisted_DiscriminatedUnion4_1.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion4_1)
});
const hoisted_DiscriminatedUnion4_3 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion4_4 = new ObjectDecoder({
    "a2": decodeString,
    "subType": hoisted_DiscriminatedUnion4_3.decodeConstDecoder.bind(hoisted_DiscriminatedUnion4_3)
});
const hoisted_DiscriminatedUnion4_5 = new ObjectDecoder({
    "a": hoisted_DiscriminatedUnion4_4.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion4_4)
});
const hoisted_DiscriminatedUnion4_6 = new AnyOfDecoder([
    hoisted_DiscriminatedUnion4_2.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion4_2),
    hoisted_DiscriminatedUnion4_5.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion4_5)
]);
const hoisted_DiscriminatedUnion4_7 = new AnyOfDiscriminatedDecoder("type", {
    "a": hoisted_DiscriminatedUnion4_6.decodeAnyOfDecoder.bind(hoisted_DiscriminatedUnion4_6)
});
const hoisted_AllTypes_0 = new AnyOfConstsDecoder([
    "LevelAndDSettings",
    "OmitSettings",
    "PartialSettings",
    "RequiredPartialObject"
]);
const hoisted_OtherEnum_0 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_Arr2_0 = new AnyOfConstsDecoder([
    "A",
    "B",
    "C"
]);
const hoisted_ValidCurrency_0 = new StringWithFormatDecoder("ValidCurrency");
const hoisted_UnionWithEnumAccess_0 = new ObjectDecoder({
    "value": decodeString
});
const hoisted_UnionWithEnumAccess_1 = new ObjectDecoder({
    "value": decodeNumber
});
const hoisted_UnionWithEnumAccess_2 = new ObjectDecoder({
    "value": decodeBoolean
});
const hoisted_UnionWithEnumAccess_3 = new AnyOfDiscriminatedDecoder("tag", {
    "a": hoisted_UnionWithEnumAccess_0.decodeObjectDecoder.bind(hoisted_UnionWithEnumAccess_0),
    "b": hoisted_UnionWithEnumAccess_1.decodeObjectDecoder.bind(hoisted_UnionWithEnumAccess_1),
    "c": hoisted_UnionWithEnumAccess_2.decodeObjectDecoder.bind(hoisted_UnionWithEnumAccess_2)
});
const hoisted_Shape_0 = new ObjectDecoder({
    "radius": decodeNumber
});
const hoisted_Shape_1 = new ObjectDecoder({
    "x": decodeNumber
});
const hoisted_Shape_2 = new ObjectDecoder({
    "x": decodeNumber,
    "y": decodeNumber
});
const hoisted_Shape_3 = new AnyOfDiscriminatedDecoder("kind", {
    "circle": hoisted_Shape_0.decodeObjectDecoder.bind(hoisted_Shape_0),
    "square": hoisted_Shape_1.decodeObjectDecoder.bind(hoisted_Shape_1),
    "triangle": hoisted_Shape_2.decodeObjectDecoder.bind(hoisted_Shape_2)
});
const hoisted_T3_0 = new ObjectDecoder({
    "x": decodeNumber
});
const hoisted_T3_1 = new ObjectDecoder({
    "x": decodeNumber,
    "y": decodeNumber
});
const hoisted_T3_2 = new AnyOfDiscriminatedDecoder("kind", {
    "square": hoisted_T3_0.decodeObjectDecoder.bind(hoisted_T3_0),
    "triangle": hoisted_T3_1.decodeObjectDecoder.bind(hoisted_T3_1)
});
const hoisted_BObject_0 = new ConstDecoder("b");
const hoisted_BObject_1 = new ObjectDecoder({
    "tag": hoisted_BObject_0.decodeConstDecoder.bind(hoisted_BObject_0)
});
const hoisted_DEF_0 = new ObjectDecoder({
    "a": decodeString
});
const hoisted_KDEF_0 = new ConstDecoder("a");
const hoisted_ABC_0 = new ObjectDecoder({});
const hoisted_K_0 = new AnyOfDecoder([
    validators.KABC,
    validators.KDEF
]);

export default { ObjectDecoder, ArrayDecoder, decodeString, decodeNumber, CodecDecoder, decodeFunction, StringWithFormatDecoder, AnyOfDecoder, AllOfDecoder, decodeBoolean, decodeAny, TupleDecoder, decodeNull, decodeNever, RegexDecoder, ConstDecoder, registerCustomFormatter, AnyOfConstsDecoder, AnyOfDiscriminatedDecoder, validators };