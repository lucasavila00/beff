//@ts-nocheck
/* eslint-disable */




const customFormatters = {};

function registerCustomFormatter(name, validator) {
  customFormatters[name] = validator;
}

function parseIdentity(ctx, input) {
  return input;
}

function validateString(ctx, input) {
  return typeof input === "string";
}

function validateNumber(ctx, input) {
  return typeof input === "number";
}

function validateBoolean(ctx, input) {
  return typeof input === "boolean";
}
function validateAny(ctx, input) {
  return true;
}
function validateNull(ctx, input) {
  if (input == null) {
    return true;
  }
  return false;
}
function validateNever(ctx, input) {
  return false;
}
function validateFunction(ctx, input) {
  return typeof input === "function";
}

class ConstDecoder {
  constructor(value) {
    this.value = value;
  }

  validateConstDecoder(ctx, input) {
    return input === this.value;
  }

  parseConstDecoder(ctx, input) {
    return input;
  }
}

class RegexDecoder {
  constructor(regex, description) {
    this.regex = regex;
    this.description = description;
  }

  validateRegexDecoder(ctx, input) {
    if (typeof input === "string") {
      return this.regex.test(input);
    }
    return false;
  }

  parseRegexDecoder(ctx, input) {
    return input;
  }
}

class ObjectValidator {
  constructor(data, rest) {
    this.data = data;
    this.rest = rest;
  }

  validateObjectValidator(ctx, input) {
    if (typeof input === "object" && !Array.isArray(input) && input !== null) {
      const configKeys = Object.keys(this.data);
      for (const k of configKeys) {
        const v = this.data[k];
        if (!v(ctx, input[k])) {
          return false;
        }
      }

      if (this.rest != null) {
        const inputKeys = Object.keys(input);
        const extraKeys = inputKeys.filter((k) => !configKeys.includes(k));
        for (const k of extraKeys) {
          const v = input[k];
          if (!this.rest(ctx, v)) {
            return false;
          }
        }
      }

      return true;
    }
    return false;
  }
}

class ObjectParser {
  constructor(data, rest) {
    this.data = data;
    this.rest = rest;
  }

  parseObjectParser(ctx, input) {
    let acc = {};

    const inputKeys = Object.keys(input);
    for (const k of inputKeys) {
      const v = input[k];
      if (k in this.data) {
        const p = this.data[k];
        acc[k] = p(ctx, v);
      } else {
        if (this.rest != null) {
          acc[k] = this.rest(ctx, v);
        }
      }
    }

    return acc;
  }
}

class ArrayParser {
  constructor(innerParser) {
    this.innerParser = innerParser;
  }

  parseArrayParser(ctx, input) {
    return input.map((v) => this.innerParser(ctx, v));
  }
}

class ArrayValidator {
  constructor(innerValidator) {
    this.innerValidator = innerValidator;
  }

  validateArrayValidator(ctx, input) {
    if (Array.isArray(input)) {
      for (let i = 0; i < input.length; i++) {
        const v = input[i];
        const ok = this.innerValidator(ctx, v);
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
  validateCodecDecoder(ctx, input) {
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
            BigInt(input);
            return true;
          } catch (e) {
            
          }
        }
        return false;
      }
    }
    return false;
  }
  parseCodecDecoder(ctx, input) {
    switch (this.codec) {
      case "Codec::ISO8061": {
        return new Date(input);
      }
      case "Codec::BigInt": {
        if (typeof input === "bigint") {
          return input;
        }
        if (typeof input === "number") {
          return BigInt(input);
        }
        if (typeof input === "string") {
          return BigInt(input);
        }
        throw new Error("Codec::BigInt: invalid input");
      }
    }
  }
}

class StringWithFormatDecoder {
  constructor(format) {
    this.format = format;
  }

  validateStringWithFormatDecoder(ctx, input) {
    if (typeof input !== "string") {
      return false;
    }

    const validator = customFormatters[this.format];

    if (validator == null) {
      return false;
    }

    return validator(input);
  }
  parseStringWithFormatDecoder(ctx, input) {
    return input;
  }
}
class AnyOfDiscriminatedDecoder {
  constructor(discriminator, mapping) {
    this.discriminator = discriminator;
    this.mapping = mapping;
  }

  validateAnyOfDiscriminatedDecoder(ctx, input) {
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
  validateAnyOfConstsDecoder(ctx, input) {
    if (input == null) {
      if (this.consts.includes(null) || this.consts.includes(undefined)) {
        return true;
      }
    }
    return this.consts.includes(input);
  }
}

class AnyOfValidator {
  constructor(vs) {
    this.vs = vs;
  }
  validateAnyOfValidator(ctx, input) {
    for (const v of this.vs) {
      if (v(ctx, input)) {
        return true;
      }
    }
    return false;
  }
}
class AnyOfParser {
  constructor(validators, parsers) {
    this.validators = validators;
    this.parsers = parsers;
  }
  parseAnyOfParser(ctx, input) {
    for (let i = 0; i < this.validators.length; i++) {
      if (this.validators[i](ctx, input)) {
        return this.parsers[i](ctx, input);
      }
    }
    throw new Error("No parsers matched");
  }
}
class AllOfValidator {
  constructor(vs) {
    this.vs = vs;
  }
  validateAllOfValidator(ctx, input) {
    for (const v of this.vs) {
      if (!v(ctx, input)) {
        return false;
      }
    }
    return true;
  }
}

class AllOfParser {
  constructor(validators, parsers) {
    this.validators = validators;
    this.parsers = parsers;
  }
  parseAllOfParser(ctx, input) {
    let acc = {};

    for (let i = 0; i < this.validators.length; i++) {
      const p = this.parsers[i];
      const parsed = p(ctx, input);
      if (typeof parsed !== "object") {
        throw new Error("AllOfParser: Expected object");
      }
      acc = { ...acc, ...parsed };
    }
    return acc;
  }
}
class TupleValidator {
  constructor(prefix, rest) {
    this.prefix = prefix;
    this.rest = rest;
  }
  validateTupleValidator(ctx, input) {
    if (Array.isArray(input)) {
      let idx = 0;
      for (const prefixVal of this.prefix) {
        if (!prefixVal(ctx, input[idx])) {
          return false;
        }
        idx++;
      }
      const itemVal = this.rest;
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

class TupleParser {
  constructor(prefix, rest) {
    this.prefix = prefix;
    this.rest = rest;
  }
  parseTupleParser(ctx, input) {
    throw new Error("Not implemented");
  }
}


function ValidateTransportedValue(ctx, input) {
    return (hoisted_TransportedValue_4.validateAnyOfValidator.bind(hoisted_TransportedValue_4))(ctx, input);
}
function ParseTransportedValue(ctx, input) {
    return (hoisted_TransportedValue_5.parseAnyOfParser.bind(hoisted_TransportedValue_5))(ctx, input);
}
function ValidateOnlyAKey(ctx, input) {
    return (hoisted_OnlyAKey_0.validateObjectValidator.bind(hoisted_OnlyAKey_0))(ctx, input);
}
function ParseOnlyAKey(ctx, input) {
    return (hoisted_OnlyAKey_1.parseObjectParser.bind(hoisted_OnlyAKey_1))(ctx, input);
}
function ValidateAllTs(ctx, input) {
    return (hoisted_AllTs_2.validateAnyOfValidator.bind(hoisted_AllTs_2))(ctx, input);
}
function ParseAllTs(ctx, input) {
    return (hoisted_AllTs_3.parseAnyOfParser.bind(hoisted_AllTs_3))(ctx, input);
}
function ValidateAObject(ctx, input) {
    return (hoisted_AObject_1.validateObjectValidator.bind(hoisted_AObject_1))(ctx, input);
}
function ParseAObject(ctx, input) {
    return (hoisted_AObject_2.parseObjectParser.bind(hoisted_AObject_2))(ctx, input);
}
function ValidateVersion(ctx, input) {
    return (hoisted_Version_0.validateRegexDecoder.bind(hoisted_Version_0))(ctx, input);
}
function ParseVersion(ctx, input) {
    return (hoisted_Version_0.parseRegexDecoder.bind(hoisted_Version_0))(ctx, input);
}
function ValidateVersion2(ctx, input) {
    return (hoisted_Version2_0.validateRegexDecoder.bind(hoisted_Version2_0))(ctx, input);
}
function ParseVersion2(ctx, input) {
    return (hoisted_Version2_0.parseRegexDecoder.bind(hoisted_Version2_0))(ctx, input);
}
function ValidateAccessLevel2(ctx, input) {
    return (hoisted_AccessLevel2_2.validateAnyOfValidator.bind(hoisted_AccessLevel2_2))(ctx, input);
}
function ParseAccessLevel2(ctx, input) {
    return (hoisted_AccessLevel2_3.parseAnyOfParser.bind(hoisted_AccessLevel2_3))(ctx, input);
}
function ValidateAccessLevelTpl2(ctx, input) {
    return (hoisted_AccessLevelTpl2_0.validateRegexDecoder.bind(hoisted_AccessLevelTpl2_0))(ctx, input);
}
function ParseAccessLevelTpl2(ctx, input) {
    return (hoisted_AccessLevelTpl2_0.parseRegexDecoder.bind(hoisted_AccessLevelTpl2_0))(ctx, input);
}
function ValidateAccessLevel(ctx, input) {
    return (hoisted_AccessLevel_2.validateAnyOfValidator.bind(hoisted_AccessLevel_2))(ctx, input);
}
function ParseAccessLevel(ctx, input) {
    return (hoisted_AccessLevel_3.parseAnyOfParser.bind(hoisted_AccessLevel_3))(ctx, input);
}
function ValidateAccessLevelTpl(ctx, input) {
    return (hoisted_AccessLevelTpl_0.validateRegexDecoder.bind(hoisted_AccessLevelTpl_0))(ctx, input);
}
function ParseAccessLevelTpl(ctx, input) {
    return (hoisted_AccessLevelTpl_0.parseRegexDecoder.bind(hoisted_AccessLevelTpl_0))(ctx, input);
}
function ValidateArr3(ctx, input) {
    return (hoisted_Arr3_2.validateAnyOfValidator.bind(hoisted_Arr3_2))(ctx, input);
}
function ParseArr3(ctx, input) {
    return (hoisted_Arr3_3.parseAnyOfParser.bind(hoisted_Arr3_3))(ctx, input);
}
function ValidateOmitSettings(ctx, input) {
    return (hoisted_OmitSettings_7.validateObjectValidator.bind(hoisted_OmitSettings_7))(ctx, input);
}
function ParseOmitSettings(ctx, input) {
    return (hoisted_OmitSettings_8.parseObjectParser.bind(hoisted_OmitSettings_8))(ctx, input);
}
function ValidateSettings(ctx, input) {
    return (hoisted_Settings_7.validateObjectValidator.bind(hoisted_Settings_7))(ctx, input);
}
function ParseSettings(ctx, input) {
    return (hoisted_Settings_8.parseObjectParser.bind(hoisted_Settings_8))(ctx, input);
}
function ValidatePartialObject(ctx, input) {
    return (hoisted_PartialObject_4.validateObjectValidator.bind(hoisted_PartialObject_4))(ctx, input);
}
function ParsePartialObject(ctx, input) {
    return (hoisted_PartialObject_5.parseObjectParser.bind(hoisted_PartialObject_5))(ctx, input);
}
function ValidateRequiredPartialObject(ctx, input) {
    return (hoisted_RequiredPartialObject_0.validateObjectValidator.bind(hoisted_RequiredPartialObject_0))(ctx, input);
}
function ParseRequiredPartialObject(ctx, input) {
    return (hoisted_RequiredPartialObject_1.parseObjectParser.bind(hoisted_RequiredPartialObject_1))(ctx, input);
}
function ValidateLevelAndDSettings(ctx, input) {
    return (hoisted_LevelAndDSettings_7.validateObjectValidator.bind(hoisted_LevelAndDSettings_7))(ctx, input);
}
function ParseLevelAndDSettings(ctx, input) {
    return (hoisted_LevelAndDSettings_8.parseObjectParser.bind(hoisted_LevelAndDSettings_8))(ctx, input);
}
function ValidatePartialSettings(ctx, input) {
    return (hoisted_PartialSettings_11.validateObjectValidator.bind(hoisted_PartialSettings_11))(ctx, input);
}
function ParsePartialSettings(ctx, input) {
    return (hoisted_PartialSettings_12.parseObjectParser.bind(hoisted_PartialSettings_12))(ctx, input);
}
function ValidateExtra(ctx, input) {
    return (hoisted_Extra_0.validateObjectValidator.bind(hoisted_Extra_0))(ctx, input);
}
function ParseExtra(ctx, input) {
    return (hoisted_Extra_1.parseObjectParser.bind(hoisted_Extra_1))(ctx, input);
}
function ValidateAvatarSize(ctx, input) {
    return (hoisted_AvatarSize_0.validateRegexDecoder.bind(hoisted_AvatarSize_0))(ctx, input);
}
function ParseAvatarSize(ctx, input) {
    return (hoisted_AvatarSize_0.parseRegexDecoder.bind(hoisted_AvatarSize_0))(ctx, input);
}
function ValidateUser(ctx, input) {
    return (hoisted_User_2.validateObjectValidator.bind(hoisted_User_2))(ctx, input);
}
function ParseUser(ctx, input) {
    return (hoisted_User_3.parseObjectParser.bind(hoisted_User_3))(ctx, input);
}
function ValidatePublicUser(ctx, input) {
    return (hoisted_PublicUser_0.validateObjectValidator.bind(hoisted_PublicUser_0))(ctx, input);
}
function ParsePublicUser(ctx, input) {
    return (hoisted_PublicUser_1.parseObjectParser.bind(hoisted_PublicUser_1))(ctx, input);
}
function ValidateReq(ctx, input) {
    return (hoisted_Req_0.validateObjectValidator.bind(hoisted_Req_0))(ctx, input);
}
function ParseReq(ctx, input) {
    return (hoisted_Req_1.parseObjectParser.bind(hoisted_Req_1))(ctx, input);
}
function ValidateWithOptionals(ctx, input) {
    return (hoisted_WithOptionals_2.validateObjectValidator.bind(hoisted_WithOptionals_2))(ctx, input);
}
function ParseWithOptionals(ctx, input) {
    return (hoisted_WithOptionals_3.parseObjectParser.bind(hoisted_WithOptionals_3))(ctx, input);
}
function ValidateRepro1(ctx, input) {
    return (hoisted_Repro1_2.validateObjectValidator.bind(hoisted_Repro1_2))(ctx, input);
}
function ParseRepro1(ctx, input) {
    return (hoisted_Repro1_3.parseObjectParser.bind(hoisted_Repro1_3))(ctx, input);
}
function ValidateRepro2(ctx, input) {
    return (hoisted_Repro2_0.validateObjectValidator.bind(hoisted_Repro2_0))(ctx, input);
}
function ParseRepro2(ctx, input) {
    return (hoisted_Repro2_1.parseObjectParser.bind(hoisted_Repro2_1))(ctx, input);
}
function ValidateSettingsUpdate(ctx, input) {
    return (hoisted_SettingsUpdate_3.validateAnyOfValidator.bind(hoisted_SettingsUpdate_3))(ctx, input);
}
function ParseSettingsUpdate(ctx, input) {
    return (hoisted_SettingsUpdate_4.parseAnyOfParser.bind(hoisted_SettingsUpdate_4))(ctx, input);
}
function ValidateMapped(ctx, input) {
    return (hoisted_Mapped_6.validateObjectValidator.bind(hoisted_Mapped_6))(ctx, input);
}
function ParseMapped(ctx, input) {
    return (hoisted_Mapped_7.parseObjectParser.bind(hoisted_Mapped_7))(ctx, input);
}
function ValidateMappedOptional(ctx, input) {
    return (hoisted_MappedOptional_10.validateObjectValidator.bind(hoisted_MappedOptional_10))(ctx, input);
}
function ParseMappedOptional(ctx, input) {
    return (hoisted_MappedOptional_11.parseObjectParser.bind(hoisted_MappedOptional_11))(ctx, input);
}
function ValidateDiscriminatedUnion(ctx, input) {
    return (hoisted_DiscriminatedUnion_13.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion_13))(ctx, input);
}
function ParseDiscriminatedUnion(ctx, input) {
    return (hoisted_DiscriminatedUnion_14.parseAnyOfParser.bind(hoisted_DiscriminatedUnion_14))(ctx, input);
}
function ValidateDiscriminatedUnion2(ctx, input) {
    return (hoisted_DiscriminatedUnion2_18.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion2_18))(ctx, input);
}
function ParseDiscriminatedUnion2(ctx, input) {
    return (hoisted_DiscriminatedUnion2_19.parseAnyOfParser.bind(hoisted_DiscriminatedUnion2_19))(ctx, input);
}
function ValidateDiscriminatedUnion3(ctx, input) {
    return (hoisted_DiscriminatedUnion3_9.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion3_9))(ctx, input);
}
function ParseDiscriminatedUnion3(ctx, input) {
    return (hoisted_DiscriminatedUnion3_10.parseAnyOfParser.bind(hoisted_DiscriminatedUnion3_10))(ctx, input);
}
function ValidateDiscriminatedUnion4(ctx, input) {
    return (hoisted_DiscriminatedUnion4_12.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion4_12))(ctx, input);
}
function ParseDiscriminatedUnion4(ctx, input) {
    return (hoisted_DiscriminatedUnion4_13.parseAnyOfParser.bind(hoisted_DiscriminatedUnion4_13))(ctx, input);
}
function ValidateAllTypes(ctx, input) {
    return (hoisted_AllTypes_4.validateAnyOfValidator.bind(hoisted_AllTypes_4))(ctx, input);
}
function ParseAllTypes(ctx, input) {
    return (hoisted_AllTypes_5.parseAnyOfParser.bind(hoisted_AllTypes_5))(ctx, input);
}
function ValidateOtherEnum(ctx, input) {
    return (hoisted_OtherEnum_2.validateAnyOfValidator.bind(hoisted_OtherEnum_2))(ctx, input);
}
function ParseOtherEnum(ctx, input) {
    return (hoisted_OtherEnum_3.parseAnyOfParser.bind(hoisted_OtherEnum_3))(ctx, input);
}
function ValidateArr2(ctx, input) {
    return (hoisted_Arr2_3.validateAnyOfValidator.bind(hoisted_Arr2_3))(ctx, input);
}
function ParseArr2(ctx, input) {
    return (hoisted_Arr2_4.parseAnyOfParser.bind(hoisted_Arr2_4))(ctx, input);
}
function ValidateValidCurrency(ctx, input) {
    return (hoisted_ValidCurrency_0.validateStringWithFormatDecoder.bind(hoisted_ValidCurrency_0))(ctx, input);
}
function ParseValidCurrency(ctx, input) {
    return (hoisted_ValidCurrency_0.parseStringWithFormatDecoder.bind(hoisted_ValidCurrency_0))(ctx, input);
}
function ValidateUnionWithEnumAccess(ctx, input) {
    return (hoisted_UnionWithEnumAccess_9.validateAnyOfValidator.bind(hoisted_UnionWithEnumAccess_9))(ctx, input);
}
function ParseUnionWithEnumAccess(ctx, input) {
    return (hoisted_UnionWithEnumAccess_10.parseAnyOfParser.bind(hoisted_UnionWithEnumAccess_10))(ctx, input);
}
function ValidateShape(ctx, input) {
    return (hoisted_Shape_9.validateAnyOfValidator.bind(hoisted_Shape_9))(ctx, input);
}
function ParseShape(ctx, input) {
    return (hoisted_Shape_10.parseAnyOfParser.bind(hoisted_Shape_10))(ctx, input);
}
function ValidateT3(ctx, input) {
    return (hoisted_T3_6.validateAnyOfValidator.bind(hoisted_T3_6))(ctx, input);
}
function ParseT3(ctx, input) {
    return (hoisted_T3_7.parseAnyOfParser.bind(hoisted_T3_7))(ctx, input);
}
function ValidateBObject(ctx, input) {
    return (hoisted_BObject_1.validateObjectValidator.bind(hoisted_BObject_1))(ctx, input);
}
function ParseBObject(ctx, input) {
    return (hoisted_BObject_2.parseObjectParser.bind(hoisted_BObject_2))(ctx, input);
}
function ValidateDEF(ctx, input) {
    return (hoisted_DEF_0.validateObjectValidator.bind(hoisted_DEF_0))(ctx, input);
}
function ParseDEF(ctx, input) {
    return (hoisted_DEF_1.parseObjectParser.bind(hoisted_DEF_1))(ctx, input);
}
function ValidateKDEF(ctx, input) {
    return (hoisted_KDEF_0.validateConstDecoder.bind(hoisted_KDEF_0))(ctx, input);
}
function ParseKDEF(ctx, input) {
    return (hoisted_KDEF_0.parseConstDecoder.bind(hoisted_KDEF_0))(ctx, input);
}
function ValidateABC(ctx, input) {
    return (hoisted_ABC_0.validateObjectValidator.bind(hoisted_ABC_0))(ctx, input);
}
function ParseABC(ctx, input) {
    return (hoisted_ABC_1.parseObjectParser.bind(hoisted_ABC_1))(ctx, input);
}
function ValidateKABC(ctx, input) {
    return (validateNever)(ctx, input);
}
function ParseKABC(ctx, input) {
    return (parseIdentity)(ctx, input);
}
function ValidateK(ctx, input) {
    return (hoisted_K_0.validateAnyOfValidator.bind(hoisted_K_0))(ctx, input);
}
function ParseK(ctx, input) {
    return (hoisted_K_1.parseAnyOfParser.bind(hoisted_K_1))(ctx, input);
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
const parsers = {
    TransportedValue: ParseTransportedValue,
    OnlyAKey: ParseOnlyAKey,
    AllTs: ParseAllTs,
    AObject: ParseAObject,
    Version: ParseVersion,
    Version2: ParseVersion2,
    AccessLevel2: ParseAccessLevel2,
    AccessLevelTpl2: ParseAccessLevelTpl2,
    AccessLevel: ParseAccessLevel,
    AccessLevelTpl: ParseAccessLevelTpl,
    Arr3: ParseArr3,
    OmitSettings: ParseOmitSettings,
    Settings: ParseSettings,
    PartialObject: ParsePartialObject,
    RequiredPartialObject: ParseRequiredPartialObject,
    LevelAndDSettings: ParseLevelAndDSettings,
    PartialSettings: ParsePartialSettings,
    Extra: ParseExtra,
    AvatarSize: ParseAvatarSize,
    User: ParseUser,
    PublicUser: ParsePublicUser,
    Req: ParseReq,
    WithOptionals: ParseWithOptionals,
    Repro1: ParseRepro1,
    Repro2: ParseRepro2,
    SettingsUpdate: ParseSettingsUpdate,
    Mapped: ParseMapped,
    MappedOptional: ParseMappedOptional,
    DiscriminatedUnion: ParseDiscriminatedUnion,
    DiscriminatedUnion2: ParseDiscriminatedUnion2,
    DiscriminatedUnion3: ParseDiscriminatedUnion3,
    DiscriminatedUnion4: ParseDiscriminatedUnion4,
    AllTypes: ParseAllTypes,
    OtherEnum: ParseOtherEnum,
    Arr2: ParseArr2,
    ValidCurrency: ParseValidCurrency,
    UnionWithEnumAccess: ParseUnionWithEnumAccess,
    Shape: ParseShape,
    T3: ParseT3,
    BObject: ParseBObject,
    DEF: ParseDEF,
    KDEF: ParseKDEF,
    ABC: ParseABC,
    KABC: ParseKABC,
    K: ParseK
};
const hoisted_TransportedValue_0 = new AnyOfValidator([
    validateNull,
    validateString,
    validateNumber
]);
const hoisted_TransportedValue_1 = new AnyOfParser([
    validateNull,
    validateString,
    validateNumber
], [
    parseIdentity,
    parseIdentity,
    parseIdentity
]);
const hoisted_TransportedValue_2 = new ArrayValidator(hoisted_TransportedValue_0.validateAnyOfValidator.bind(hoisted_TransportedValue_0));
const hoisted_TransportedValue_3 = new ArrayParser(hoisted_TransportedValue_1.parseAnyOfParser.bind(hoisted_TransportedValue_1));
const hoisted_TransportedValue_4 = new AnyOfValidator([
    validateNull,
    validateString,
    hoisted_TransportedValue_2.validateArrayValidator.bind(hoisted_TransportedValue_2)
]);
const hoisted_TransportedValue_5 = new AnyOfParser([
    validateNull,
    validateString,
    hoisted_TransportedValue_2.validateArrayValidator.bind(hoisted_TransportedValue_2)
], [
    parseIdentity,
    parseIdentity,
    hoisted_TransportedValue_3.parseArrayParser.bind(hoisted_TransportedValue_3)
]);
const hoisted_OnlyAKey_0 = new ObjectValidator({
    "A": validateString
}, null);
const hoisted_OnlyAKey_1 = new ObjectParser({
    "A": parseIdentity
}, null);
const hoisted_AllTs_0 = new ConstDecoder("a");
const hoisted_AllTs_1 = new ConstDecoder("b");
const hoisted_AllTs_2 = new AnyOfValidator([
    hoisted_AllTs_0.validateConstDecoder.bind(hoisted_AllTs_0),
    hoisted_AllTs_1.validateConstDecoder.bind(hoisted_AllTs_1)
]);
const hoisted_AllTs_3 = new AnyOfParser([
    hoisted_AllTs_0.validateConstDecoder.bind(hoisted_AllTs_0),
    hoisted_AllTs_1.validateConstDecoder.bind(hoisted_AllTs_1)
], [
    hoisted_AllTs_0.parseConstDecoder.bind(hoisted_AllTs_0),
    hoisted_AllTs_1.parseConstDecoder.bind(hoisted_AllTs_1)
]);
const hoisted_AObject_0 = new ConstDecoder("a");
const hoisted_AObject_1 = new ObjectValidator({
    "tag": hoisted_AObject_0.validateConstDecoder.bind(hoisted_AObject_0)
}, null);
const hoisted_AObject_2 = new ObjectParser({
    "tag": hoisted_AObject_0.parseConstDecoder.bind(hoisted_AObject_0)
}, null);
const hoisted_Version_0 = new RegexDecoder(/(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "${number}.${number}.${number}");
const hoisted_Version2_0 = new RegexDecoder(/(v)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "v${number}.${number}.${number}");
const hoisted_AccessLevel2_0 = new ConstDecoder("ADMIN Admin");
const hoisted_AccessLevel2_1 = new ConstDecoder("USER User");
const hoisted_AccessLevel2_2 = new AnyOfValidator([
    hoisted_AccessLevel2_0.validateConstDecoder.bind(hoisted_AccessLevel2_0),
    hoisted_AccessLevel2_1.validateConstDecoder.bind(hoisted_AccessLevel2_1)
]);
const hoisted_AccessLevel2_3 = new AnyOfParser([
    hoisted_AccessLevel2_0.validateConstDecoder.bind(hoisted_AccessLevel2_0),
    hoisted_AccessLevel2_1.validateConstDecoder.bind(hoisted_AccessLevel2_1)
], [
    hoisted_AccessLevel2_0.parseConstDecoder.bind(hoisted_AccessLevel2_0),
    hoisted_AccessLevel2_1.parseConstDecoder.bind(hoisted_AccessLevel2_1)
]);
const hoisted_AccessLevelTpl2_0 = new RegexDecoder(/((ADMIN Admin)|(USER User))/, '("ADMIN Admin" | "USER User")');
const hoisted_AccessLevel_0 = new ConstDecoder("ADMIN");
const hoisted_AccessLevel_1 = new ConstDecoder("USER");
const hoisted_AccessLevel_2 = new AnyOfValidator([
    hoisted_AccessLevel_0.validateConstDecoder.bind(hoisted_AccessLevel_0),
    hoisted_AccessLevel_1.validateConstDecoder.bind(hoisted_AccessLevel_1)
]);
const hoisted_AccessLevel_3 = new AnyOfParser([
    hoisted_AccessLevel_0.validateConstDecoder.bind(hoisted_AccessLevel_0),
    hoisted_AccessLevel_1.validateConstDecoder.bind(hoisted_AccessLevel_1)
], [
    hoisted_AccessLevel_0.parseConstDecoder.bind(hoisted_AccessLevel_0),
    hoisted_AccessLevel_1.parseConstDecoder.bind(hoisted_AccessLevel_1)
]);
const hoisted_AccessLevelTpl_0 = new RegexDecoder(/((ADMIN)|(USER))/, '("ADMIN" | "USER")');
const hoisted_Arr3_0 = new ConstDecoder("X");
const hoisted_Arr3_1 = new ConstDecoder("Y");
const hoisted_Arr3_2 = new AnyOfValidator([
    hoisted_Arr3_0.validateConstDecoder.bind(hoisted_Arr3_0),
    hoisted_Arr3_1.validateConstDecoder.bind(hoisted_Arr3_1)
]);
const hoisted_Arr3_3 = new AnyOfParser([
    hoisted_Arr3_0.validateConstDecoder.bind(hoisted_Arr3_0),
    hoisted_Arr3_1.validateConstDecoder.bind(hoisted_Arr3_1)
], [
    hoisted_Arr3_0.parseConstDecoder.bind(hoisted_Arr3_0),
    hoisted_Arr3_1.parseConstDecoder.bind(hoisted_Arr3_1)
]);
const hoisted_OmitSettings_0 = new ConstDecoder("d");
const hoisted_OmitSettings_1 = new ObjectValidator({
    "tag": hoisted_OmitSettings_0.validateConstDecoder.bind(hoisted_OmitSettings_0)
}, null);
const hoisted_OmitSettings_2 = new ObjectParser({
    "tag": hoisted_OmitSettings_0.parseConstDecoder.bind(hoisted_OmitSettings_0)
}, null);
const hoisted_OmitSettings_3 = new ConstDecoder("a");
const hoisted_OmitSettings_4 = new ConstDecoder("b");
const hoisted_OmitSettings_5 = new AnyOfValidator([
    hoisted_OmitSettings_3.validateConstDecoder.bind(hoisted_OmitSettings_3),
    hoisted_OmitSettings_4.validateConstDecoder.bind(hoisted_OmitSettings_4)
]);
const hoisted_OmitSettings_6 = new AnyOfParser([
    hoisted_OmitSettings_3.validateConstDecoder.bind(hoisted_OmitSettings_3),
    hoisted_OmitSettings_4.validateConstDecoder.bind(hoisted_OmitSettings_4)
], [
    hoisted_OmitSettings_3.parseConstDecoder.bind(hoisted_OmitSettings_3),
    hoisted_OmitSettings_4.parseConstDecoder.bind(hoisted_OmitSettings_4)
]);
const hoisted_OmitSettings_7 = new ObjectValidator({
    "d": hoisted_OmitSettings_1.validateObjectValidator.bind(hoisted_OmitSettings_1),
    "level": hoisted_OmitSettings_5.validateAnyOfValidator.bind(hoisted_OmitSettings_5)
}, null);
const hoisted_OmitSettings_8 = new ObjectParser({
    "d": hoisted_OmitSettings_2.parseObjectParser.bind(hoisted_OmitSettings_2),
    "level": hoisted_OmitSettings_6.parseAnyOfParser.bind(hoisted_OmitSettings_6)
}, null);
const hoisted_Settings_0 = new ConstDecoder("d");
const hoisted_Settings_1 = new ObjectValidator({
    "tag": hoisted_Settings_0.validateConstDecoder.bind(hoisted_Settings_0)
}, null);
const hoisted_Settings_2 = new ObjectParser({
    "tag": hoisted_Settings_0.parseConstDecoder.bind(hoisted_Settings_0)
}, null);
const hoisted_Settings_3 = new ConstDecoder("a");
const hoisted_Settings_4 = new ConstDecoder("b");
const hoisted_Settings_5 = new AnyOfValidator([
    hoisted_Settings_3.validateConstDecoder.bind(hoisted_Settings_3),
    hoisted_Settings_4.validateConstDecoder.bind(hoisted_Settings_4)
]);
const hoisted_Settings_6 = new AnyOfParser([
    hoisted_Settings_3.validateConstDecoder.bind(hoisted_Settings_3),
    hoisted_Settings_4.validateConstDecoder.bind(hoisted_Settings_4)
], [
    hoisted_Settings_3.parseConstDecoder.bind(hoisted_Settings_3),
    hoisted_Settings_4.parseConstDecoder.bind(hoisted_Settings_4)
]);
const hoisted_Settings_7 = new ObjectValidator({
    "a": validateString,
    "d": hoisted_Settings_1.validateObjectValidator.bind(hoisted_Settings_1),
    "level": hoisted_Settings_5.validateAnyOfValidator.bind(hoisted_Settings_5)
}, null);
const hoisted_Settings_8 = new ObjectParser({
    "a": parseIdentity,
    "d": hoisted_Settings_2.parseObjectParser.bind(hoisted_Settings_2),
    "level": hoisted_Settings_6.parseAnyOfParser.bind(hoisted_Settings_6)
}, null);
const hoisted_PartialObject_0 = new AnyOfValidator([
    validateNull,
    validateString
]);
const hoisted_PartialObject_1 = new AnyOfParser([
    validateNull,
    validateString
], [
    parseIdentity,
    parseIdentity
]);
const hoisted_PartialObject_2 = new AnyOfValidator([
    validateNull,
    validateNumber
]);
const hoisted_PartialObject_3 = new AnyOfParser([
    validateNull,
    validateNumber
], [
    parseIdentity,
    parseIdentity
]);
const hoisted_PartialObject_4 = new ObjectValidator({
    "a": hoisted_PartialObject_0.validateAnyOfValidator.bind(hoisted_PartialObject_0),
    "b": hoisted_PartialObject_2.validateAnyOfValidator.bind(hoisted_PartialObject_2)
}, null);
const hoisted_PartialObject_5 = new ObjectParser({
    "a": hoisted_PartialObject_1.parseAnyOfParser.bind(hoisted_PartialObject_1),
    "b": hoisted_PartialObject_3.parseAnyOfParser.bind(hoisted_PartialObject_3)
}, null);
const hoisted_RequiredPartialObject_0 = new ObjectValidator({
    "a": validateString,
    "b": validateNumber
}, null);
const hoisted_RequiredPartialObject_1 = new ObjectParser({
    "a": parseIdentity,
    "b": parseIdentity
}, null);
const hoisted_LevelAndDSettings_0 = new ConstDecoder("d");
const hoisted_LevelAndDSettings_1 = new ObjectValidator({
    "tag": hoisted_LevelAndDSettings_0.validateConstDecoder.bind(hoisted_LevelAndDSettings_0)
}, null);
const hoisted_LevelAndDSettings_2 = new ObjectParser({
    "tag": hoisted_LevelAndDSettings_0.parseConstDecoder.bind(hoisted_LevelAndDSettings_0)
}, null);
const hoisted_LevelAndDSettings_3 = new ConstDecoder("a");
const hoisted_LevelAndDSettings_4 = new ConstDecoder("b");
const hoisted_LevelAndDSettings_5 = new AnyOfValidator([
    hoisted_LevelAndDSettings_3.validateConstDecoder.bind(hoisted_LevelAndDSettings_3),
    hoisted_LevelAndDSettings_4.validateConstDecoder.bind(hoisted_LevelAndDSettings_4)
]);
const hoisted_LevelAndDSettings_6 = new AnyOfParser([
    hoisted_LevelAndDSettings_3.validateConstDecoder.bind(hoisted_LevelAndDSettings_3),
    hoisted_LevelAndDSettings_4.validateConstDecoder.bind(hoisted_LevelAndDSettings_4)
], [
    hoisted_LevelAndDSettings_3.parseConstDecoder.bind(hoisted_LevelAndDSettings_3),
    hoisted_LevelAndDSettings_4.parseConstDecoder.bind(hoisted_LevelAndDSettings_4)
]);
const hoisted_LevelAndDSettings_7 = new ObjectValidator({
    "d": hoisted_LevelAndDSettings_1.validateObjectValidator.bind(hoisted_LevelAndDSettings_1),
    "level": hoisted_LevelAndDSettings_5.validateAnyOfValidator.bind(hoisted_LevelAndDSettings_5)
}, null);
const hoisted_LevelAndDSettings_8 = new ObjectParser({
    "d": hoisted_LevelAndDSettings_2.parseObjectParser.bind(hoisted_LevelAndDSettings_2),
    "level": hoisted_LevelAndDSettings_6.parseAnyOfParser.bind(hoisted_LevelAndDSettings_6)
}, null);
const hoisted_PartialSettings_0 = new AnyOfValidator([
    validateNull,
    validateString
]);
const hoisted_PartialSettings_1 = new AnyOfParser([
    validateNull,
    validateString
], [
    parseIdentity,
    parseIdentity
]);
const hoisted_PartialSettings_2 = new ConstDecoder("d");
const hoisted_PartialSettings_3 = new ObjectValidator({
    "tag": hoisted_PartialSettings_2.validateConstDecoder.bind(hoisted_PartialSettings_2)
}, null);
const hoisted_PartialSettings_4 = new ObjectParser({
    "tag": hoisted_PartialSettings_2.parseConstDecoder.bind(hoisted_PartialSettings_2)
}, null);
const hoisted_PartialSettings_5 = new AnyOfValidator([
    validateNull,
    hoisted_PartialSettings_3.validateObjectValidator.bind(hoisted_PartialSettings_3)
]);
const hoisted_PartialSettings_6 = new AnyOfParser([
    validateNull,
    hoisted_PartialSettings_3.validateObjectValidator.bind(hoisted_PartialSettings_3)
], [
    parseIdentity,
    hoisted_PartialSettings_4.parseObjectParser.bind(hoisted_PartialSettings_4)
]);
const hoisted_PartialSettings_7 = new ConstDecoder("a");
const hoisted_PartialSettings_8 = new ConstDecoder("b");
const hoisted_PartialSettings_9 = new AnyOfValidator([
    validateNull,
    hoisted_PartialSettings_7.validateConstDecoder.bind(hoisted_PartialSettings_7),
    hoisted_PartialSettings_8.validateConstDecoder.bind(hoisted_PartialSettings_8)
]);
const hoisted_PartialSettings_10 = new AnyOfParser([
    validateNull,
    hoisted_PartialSettings_7.validateConstDecoder.bind(hoisted_PartialSettings_7),
    hoisted_PartialSettings_8.validateConstDecoder.bind(hoisted_PartialSettings_8)
], [
    parseIdentity,
    hoisted_PartialSettings_7.parseConstDecoder.bind(hoisted_PartialSettings_7),
    hoisted_PartialSettings_8.parseConstDecoder.bind(hoisted_PartialSettings_8)
]);
const hoisted_PartialSettings_11 = new ObjectValidator({
    "a": hoisted_PartialSettings_0.validateAnyOfValidator.bind(hoisted_PartialSettings_0),
    "d": hoisted_PartialSettings_5.validateAnyOfValidator.bind(hoisted_PartialSettings_5),
    "level": hoisted_PartialSettings_9.validateAnyOfValidator.bind(hoisted_PartialSettings_9)
}, null);
const hoisted_PartialSettings_12 = new ObjectParser({
    "a": hoisted_PartialSettings_1.parseAnyOfParser.bind(hoisted_PartialSettings_1),
    "d": hoisted_PartialSettings_6.parseAnyOfParser.bind(hoisted_PartialSettings_6),
    "level": hoisted_PartialSettings_10.parseAnyOfParser.bind(hoisted_PartialSettings_10)
}, null);
const hoisted_Extra_0 = new ObjectValidator({}, validateString);
const hoisted_Extra_1 = new ObjectParser({}, parseIdentity);
const hoisted_AvatarSize_0 = new RegexDecoder(/(\d+(\.\d+)?)(x)(\d+(\.\d+)?)/, "${number}x${number}");
const hoisted_User_0 = new ArrayValidator(validators.User);
const hoisted_User_1 = new ArrayParser(parsers.User);
const hoisted_User_2 = new ObjectValidator({
    "accessLevel": validators.AccessLevel,
    "avatarSize": validators.AvatarSize,
    "extra": validators.Extra,
    "friends": hoisted_User_0.validateArrayValidator.bind(hoisted_User_0),
    "name": validateString
}, null);
const hoisted_User_3 = new ObjectParser({
    "accessLevel": parsers.AccessLevel,
    "avatarSize": parsers.AvatarSize,
    "extra": parsers.Extra,
    "friends": hoisted_User_1.parseArrayParser.bind(hoisted_User_1),
    "name": parseIdentity
}, null);
const hoisted_PublicUser_0 = new ObjectValidator({
    "accessLevel": validators.AccessLevel,
    "avatarSize": validators.AvatarSize,
    "extra": validators.Extra,
    "name": validateString
}, null);
const hoisted_PublicUser_1 = new ObjectParser({
    "accessLevel": parsers.AccessLevel,
    "avatarSize": parsers.AvatarSize,
    "extra": parsers.Extra,
    "name": parseIdentity
}, null);
const hoisted_Req_0 = new ObjectValidator({
    "optional": validateString
}, null);
const hoisted_Req_1 = new ObjectParser({
    "optional": parseIdentity
}, null);
const hoisted_WithOptionals_0 = new AnyOfValidator([
    validateNull,
    validateString
]);
const hoisted_WithOptionals_1 = new AnyOfParser([
    validateNull,
    validateString
], [
    parseIdentity,
    parseIdentity
]);
const hoisted_WithOptionals_2 = new ObjectValidator({
    "optional": hoisted_WithOptionals_0.validateAnyOfValidator.bind(hoisted_WithOptionals_0)
}, null);
const hoisted_WithOptionals_3 = new ObjectParser({
    "optional": hoisted_WithOptionals_1.parseAnyOfParser.bind(hoisted_WithOptionals_1)
}, null);
const hoisted_Repro1_0 = new AnyOfValidator([
    validateNull,
    validators.Repro2
]);
const hoisted_Repro1_1 = new AnyOfParser([
    validateNull,
    validators.Repro2
], [
    parseIdentity,
    parsers.Repro2
]);
const hoisted_Repro1_2 = new ObjectValidator({
    "sizes": hoisted_Repro1_0.validateAnyOfValidator.bind(hoisted_Repro1_0)
}, null);
const hoisted_Repro1_3 = new ObjectParser({
    "sizes": hoisted_Repro1_1.parseAnyOfParser.bind(hoisted_Repro1_1)
}, null);
const hoisted_Repro2_0 = new ObjectValidator({
    "useSmallerSizes": validateBoolean
}, null);
const hoisted_Repro2_1 = new ObjectParser({
    "useSmallerSizes": parseIdentity
}, null);
const hoisted_SettingsUpdate_0 = new ConstDecoder("d");
const hoisted_SettingsUpdate_1 = new ObjectValidator({
    "tag": hoisted_SettingsUpdate_0.validateConstDecoder.bind(hoisted_SettingsUpdate_0)
}, null);
const hoisted_SettingsUpdate_2 = new ObjectParser({
    "tag": hoisted_SettingsUpdate_0.parseConstDecoder.bind(hoisted_SettingsUpdate_0)
}, null);
const hoisted_SettingsUpdate_3 = new AnyOfValidator([
    validateString,
    hoisted_SettingsUpdate_1.validateObjectValidator.bind(hoisted_SettingsUpdate_1)
]);
const hoisted_SettingsUpdate_4 = new AnyOfParser([
    validateString,
    hoisted_SettingsUpdate_1.validateObjectValidator.bind(hoisted_SettingsUpdate_1)
], [
    parseIdentity,
    hoisted_SettingsUpdate_2.parseObjectParser.bind(hoisted_SettingsUpdate_2)
]);
const hoisted_Mapped_0 = new ConstDecoder("a");
const hoisted_Mapped_1 = new ObjectValidator({
    "value": hoisted_Mapped_0.validateConstDecoder.bind(hoisted_Mapped_0)
}, null);
const hoisted_Mapped_2 = new ObjectParser({
    "value": hoisted_Mapped_0.parseConstDecoder.bind(hoisted_Mapped_0)
}, null);
const hoisted_Mapped_3 = new ConstDecoder("b");
const hoisted_Mapped_4 = new ObjectValidator({
    "value": hoisted_Mapped_3.validateConstDecoder.bind(hoisted_Mapped_3)
}, null);
const hoisted_Mapped_5 = new ObjectParser({
    "value": hoisted_Mapped_3.parseConstDecoder.bind(hoisted_Mapped_3)
}, null);
const hoisted_Mapped_6 = new ObjectValidator({
    "a": hoisted_Mapped_1.validateObjectValidator.bind(hoisted_Mapped_1),
    "b": hoisted_Mapped_4.validateObjectValidator.bind(hoisted_Mapped_4)
}, null);
const hoisted_Mapped_7 = new ObjectParser({
    "a": hoisted_Mapped_2.parseObjectParser.bind(hoisted_Mapped_2),
    "b": hoisted_Mapped_5.parseObjectParser.bind(hoisted_Mapped_5)
}, null);
const hoisted_MappedOptional_0 = new ConstDecoder("a");
const hoisted_MappedOptional_1 = new ObjectValidator({
    "value": hoisted_MappedOptional_0.validateConstDecoder.bind(hoisted_MappedOptional_0)
}, null);
const hoisted_MappedOptional_2 = new ObjectParser({
    "value": hoisted_MappedOptional_0.parseConstDecoder.bind(hoisted_MappedOptional_0)
}, null);
const hoisted_MappedOptional_3 = new AnyOfValidator([
    validateNull,
    hoisted_MappedOptional_1.validateObjectValidator.bind(hoisted_MappedOptional_1)
]);
const hoisted_MappedOptional_4 = new AnyOfParser([
    validateNull,
    hoisted_MappedOptional_1.validateObjectValidator.bind(hoisted_MappedOptional_1)
], [
    parseIdentity,
    hoisted_MappedOptional_2.parseObjectParser.bind(hoisted_MappedOptional_2)
]);
const hoisted_MappedOptional_5 = new ConstDecoder("b");
const hoisted_MappedOptional_6 = new ObjectValidator({
    "value": hoisted_MappedOptional_5.validateConstDecoder.bind(hoisted_MappedOptional_5)
}, null);
const hoisted_MappedOptional_7 = new ObjectParser({
    "value": hoisted_MappedOptional_5.parseConstDecoder.bind(hoisted_MappedOptional_5)
}, null);
const hoisted_MappedOptional_8 = new AnyOfValidator([
    validateNull,
    hoisted_MappedOptional_6.validateObjectValidator.bind(hoisted_MappedOptional_6)
]);
const hoisted_MappedOptional_9 = new AnyOfParser([
    validateNull,
    hoisted_MappedOptional_6.validateObjectValidator.bind(hoisted_MappedOptional_6)
], [
    parseIdentity,
    hoisted_MappedOptional_7.parseObjectParser.bind(hoisted_MappedOptional_7)
]);
const hoisted_MappedOptional_10 = new ObjectValidator({
    "a": hoisted_MappedOptional_3.validateAnyOfValidator.bind(hoisted_MappedOptional_3),
    "b": hoisted_MappedOptional_8.validateAnyOfValidator.bind(hoisted_MappedOptional_8)
}, null);
const hoisted_MappedOptional_11 = new ObjectParser({
    "a": hoisted_MappedOptional_4.parseAnyOfParser.bind(hoisted_MappedOptional_4),
    "b": hoisted_MappedOptional_9.parseAnyOfParser.bind(hoisted_MappedOptional_9)
}, null);
const hoisted_DiscriminatedUnion_0 = new AnyOfValidator([
    validateNull,
    validateString
]);
const hoisted_DiscriminatedUnion_1 = new AnyOfParser([
    validateNull,
    validateString
], [
    parseIdentity,
    parseIdentity
]);
const hoisted_DiscriminatedUnion_2 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion_3 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion_4 = new ObjectValidator({
    "a1": validateString,
    "a11": hoisted_DiscriminatedUnion_0.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion_0),
    "subType": hoisted_DiscriminatedUnion_2.validateConstDecoder.bind(hoisted_DiscriminatedUnion_2),
    "type": hoisted_DiscriminatedUnion_3.validateConstDecoder.bind(hoisted_DiscriminatedUnion_3)
}, null);
const hoisted_DiscriminatedUnion_5 = new ObjectParser({
    "a1": parseIdentity,
    "a11": hoisted_DiscriminatedUnion_1.parseAnyOfParser.bind(hoisted_DiscriminatedUnion_1),
    "subType": hoisted_DiscriminatedUnion_2.parseConstDecoder.bind(hoisted_DiscriminatedUnion_2),
    "type": hoisted_DiscriminatedUnion_3.parseConstDecoder.bind(hoisted_DiscriminatedUnion_3)
}, null);
const hoisted_DiscriminatedUnion_6 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion_7 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion_8 = new ObjectValidator({
    "a2": validateString,
    "subType": hoisted_DiscriminatedUnion_6.validateConstDecoder.bind(hoisted_DiscriminatedUnion_6),
    "type": hoisted_DiscriminatedUnion_7.validateConstDecoder.bind(hoisted_DiscriminatedUnion_7)
}, null);
const hoisted_DiscriminatedUnion_9 = new ObjectParser({
    "a2": parseIdentity,
    "subType": hoisted_DiscriminatedUnion_6.parseConstDecoder.bind(hoisted_DiscriminatedUnion_6),
    "type": hoisted_DiscriminatedUnion_7.parseConstDecoder.bind(hoisted_DiscriminatedUnion_7)
}, null);
const hoisted_DiscriminatedUnion_10 = new ConstDecoder("b");
const hoisted_DiscriminatedUnion_11 = new ObjectValidator({
    "type": hoisted_DiscriminatedUnion_10.validateConstDecoder.bind(hoisted_DiscriminatedUnion_10),
    "value": validateNumber
}, null);
const hoisted_DiscriminatedUnion_12 = new ObjectParser({
    "type": hoisted_DiscriminatedUnion_10.parseConstDecoder.bind(hoisted_DiscriminatedUnion_10),
    "value": parseIdentity
}, null);
const hoisted_DiscriminatedUnion_13 = new AnyOfValidator([
    hoisted_DiscriminatedUnion_4.validateObjectValidator.bind(hoisted_DiscriminatedUnion_4),
    hoisted_DiscriminatedUnion_8.validateObjectValidator.bind(hoisted_DiscriminatedUnion_8),
    hoisted_DiscriminatedUnion_11.validateObjectValidator.bind(hoisted_DiscriminatedUnion_11)
]);
const hoisted_DiscriminatedUnion_14 = new AnyOfParser([
    hoisted_DiscriminatedUnion_4.validateObjectValidator.bind(hoisted_DiscriminatedUnion_4),
    hoisted_DiscriminatedUnion_8.validateObjectValidator.bind(hoisted_DiscriminatedUnion_8),
    hoisted_DiscriminatedUnion_11.validateObjectValidator.bind(hoisted_DiscriminatedUnion_11)
], [
    hoisted_DiscriminatedUnion_5.parseObjectParser.bind(hoisted_DiscriminatedUnion_5),
    hoisted_DiscriminatedUnion_9.parseObjectParser.bind(hoisted_DiscriminatedUnion_9),
    hoisted_DiscriminatedUnion_12.parseObjectParser.bind(hoisted_DiscriminatedUnion_12)
]);
const hoisted_DiscriminatedUnion2_0 = new AnyOfValidator([
    validateNull,
    validateString
]);
const hoisted_DiscriminatedUnion2_1 = new AnyOfParser([
    validateNull,
    validateString
], [
    parseIdentity,
    parseIdentity
]);
const hoisted_DiscriminatedUnion2_2 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion2_3 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion2_4 = new ObjectValidator({
    "a1": validateString,
    "a11": hoisted_DiscriminatedUnion2_0.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion2_0),
    "subType": hoisted_DiscriminatedUnion2_2.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_2),
    "type": hoisted_DiscriminatedUnion2_3.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_3)
}, null);
const hoisted_DiscriminatedUnion2_5 = new ObjectParser({
    "a1": parseIdentity,
    "a11": hoisted_DiscriminatedUnion2_1.parseAnyOfParser.bind(hoisted_DiscriminatedUnion2_1),
    "subType": hoisted_DiscriminatedUnion2_2.parseConstDecoder.bind(hoisted_DiscriminatedUnion2_2),
    "type": hoisted_DiscriminatedUnion2_3.parseConstDecoder.bind(hoisted_DiscriminatedUnion2_3)
}, null);
const hoisted_DiscriminatedUnion2_6 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion2_7 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion2_8 = new ObjectValidator({
    "a2": validateString,
    "subType": hoisted_DiscriminatedUnion2_6.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_6),
    "type": hoisted_DiscriminatedUnion2_7.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_7)
}, null);
const hoisted_DiscriminatedUnion2_9 = new ObjectParser({
    "a2": parseIdentity,
    "subType": hoisted_DiscriminatedUnion2_6.parseConstDecoder.bind(hoisted_DiscriminatedUnion2_6),
    "type": hoisted_DiscriminatedUnion2_7.parseConstDecoder.bind(hoisted_DiscriminatedUnion2_7)
}, null);
const hoisted_DiscriminatedUnion2_10 = new ConstDecoder("d");
const hoisted_DiscriminatedUnion2_11 = new AnyOfValidator([
    validateNull,
    hoisted_DiscriminatedUnion2_10.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_10)
]);
const hoisted_DiscriminatedUnion2_12 = new AnyOfParser([
    validateNull,
    hoisted_DiscriminatedUnion2_10.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_10)
], [
    parseIdentity,
    hoisted_DiscriminatedUnion2_10.parseConstDecoder.bind(hoisted_DiscriminatedUnion2_10)
]);
const hoisted_DiscriminatedUnion2_13 = new ObjectValidator({
    "type": hoisted_DiscriminatedUnion2_11.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion2_11),
    "valueD": validateNumber
}, null);
const hoisted_DiscriminatedUnion2_14 = new ObjectParser({
    "type": hoisted_DiscriminatedUnion2_12.parseAnyOfParser.bind(hoisted_DiscriminatedUnion2_12),
    "valueD": parseIdentity
}, null);
const hoisted_DiscriminatedUnion2_15 = new ConstDecoder("b");
const hoisted_DiscriminatedUnion2_16 = new ObjectValidator({
    "type": hoisted_DiscriminatedUnion2_15.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_15),
    "value": validateNumber
}, null);
const hoisted_DiscriminatedUnion2_17 = new ObjectParser({
    "type": hoisted_DiscriminatedUnion2_15.parseConstDecoder.bind(hoisted_DiscriminatedUnion2_15),
    "value": parseIdentity
}, null);
const hoisted_DiscriminatedUnion2_18 = new AnyOfValidator([
    hoisted_DiscriminatedUnion2_4.validateObjectValidator.bind(hoisted_DiscriminatedUnion2_4),
    hoisted_DiscriminatedUnion2_8.validateObjectValidator.bind(hoisted_DiscriminatedUnion2_8),
    hoisted_DiscriminatedUnion2_13.validateObjectValidator.bind(hoisted_DiscriminatedUnion2_13),
    hoisted_DiscriminatedUnion2_16.validateObjectValidator.bind(hoisted_DiscriminatedUnion2_16)
]);
const hoisted_DiscriminatedUnion2_19 = new AnyOfParser([
    hoisted_DiscriminatedUnion2_4.validateObjectValidator.bind(hoisted_DiscriminatedUnion2_4),
    hoisted_DiscriminatedUnion2_8.validateObjectValidator.bind(hoisted_DiscriminatedUnion2_8),
    hoisted_DiscriminatedUnion2_13.validateObjectValidator.bind(hoisted_DiscriminatedUnion2_13),
    hoisted_DiscriminatedUnion2_16.validateObjectValidator.bind(hoisted_DiscriminatedUnion2_16)
], [
    hoisted_DiscriminatedUnion2_5.parseObjectParser.bind(hoisted_DiscriminatedUnion2_5),
    hoisted_DiscriminatedUnion2_9.parseObjectParser.bind(hoisted_DiscriminatedUnion2_9),
    hoisted_DiscriminatedUnion2_14.parseObjectParser.bind(hoisted_DiscriminatedUnion2_14),
    hoisted_DiscriminatedUnion2_17.parseObjectParser.bind(hoisted_DiscriminatedUnion2_17)
]);
const hoisted_DiscriminatedUnion3_0 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion3_1 = new ConstDecoder("c");
const hoisted_DiscriminatedUnion3_2 = new AnyOfValidator([
    hoisted_DiscriminatedUnion3_0.validateConstDecoder.bind(hoisted_DiscriminatedUnion3_0),
    hoisted_DiscriminatedUnion3_1.validateConstDecoder.bind(hoisted_DiscriminatedUnion3_1)
]);
const hoisted_DiscriminatedUnion3_3 = new AnyOfParser([
    hoisted_DiscriminatedUnion3_0.validateConstDecoder.bind(hoisted_DiscriminatedUnion3_0),
    hoisted_DiscriminatedUnion3_1.validateConstDecoder.bind(hoisted_DiscriminatedUnion3_1)
], [
    hoisted_DiscriminatedUnion3_0.parseConstDecoder.bind(hoisted_DiscriminatedUnion3_0),
    hoisted_DiscriminatedUnion3_1.parseConstDecoder.bind(hoisted_DiscriminatedUnion3_1)
]);
const hoisted_DiscriminatedUnion3_4 = new ObjectValidator({
    "a1": validateString,
    "type": hoisted_DiscriminatedUnion3_2.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion3_2)
}, null);
const hoisted_DiscriminatedUnion3_5 = new ObjectParser({
    "a1": parseIdentity,
    "type": hoisted_DiscriminatedUnion3_3.parseAnyOfParser.bind(hoisted_DiscriminatedUnion3_3)
}, null);
const hoisted_DiscriminatedUnion3_6 = new ConstDecoder("b");
const hoisted_DiscriminatedUnion3_7 = new ObjectValidator({
    "type": hoisted_DiscriminatedUnion3_6.validateConstDecoder.bind(hoisted_DiscriminatedUnion3_6),
    "value": validateNumber
}, null);
const hoisted_DiscriminatedUnion3_8 = new ObjectParser({
    "type": hoisted_DiscriminatedUnion3_6.parseConstDecoder.bind(hoisted_DiscriminatedUnion3_6),
    "value": parseIdentity
}, null);
const hoisted_DiscriminatedUnion3_9 = new AnyOfValidator([
    hoisted_DiscriminatedUnion3_4.validateObjectValidator.bind(hoisted_DiscriminatedUnion3_4),
    hoisted_DiscriminatedUnion3_7.validateObjectValidator.bind(hoisted_DiscriminatedUnion3_7)
]);
const hoisted_DiscriminatedUnion3_10 = new AnyOfParser([
    hoisted_DiscriminatedUnion3_4.validateObjectValidator.bind(hoisted_DiscriminatedUnion3_4),
    hoisted_DiscriminatedUnion3_7.validateObjectValidator.bind(hoisted_DiscriminatedUnion3_7)
], [
    hoisted_DiscriminatedUnion3_5.parseObjectParser.bind(hoisted_DiscriminatedUnion3_5),
    hoisted_DiscriminatedUnion3_8.parseObjectParser.bind(hoisted_DiscriminatedUnion3_8)
]);
const hoisted_DiscriminatedUnion4_0 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion4_1 = new ObjectValidator({
    "a1": validateString,
    "subType": hoisted_DiscriminatedUnion4_0.validateConstDecoder.bind(hoisted_DiscriminatedUnion4_0)
}, null);
const hoisted_DiscriminatedUnion4_2 = new ObjectParser({
    "a1": parseIdentity,
    "subType": hoisted_DiscriminatedUnion4_0.parseConstDecoder.bind(hoisted_DiscriminatedUnion4_0)
}, null);
const hoisted_DiscriminatedUnion4_3 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion4_4 = new ObjectValidator({
    "a": hoisted_DiscriminatedUnion4_1.validateObjectValidator.bind(hoisted_DiscriminatedUnion4_1),
    "type": hoisted_DiscriminatedUnion4_3.validateConstDecoder.bind(hoisted_DiscriminatedUnion4_3)
}, null);
const hoisted_DiscriminatedUnion4_5 = new ObjectParser({
    "a": hoisted_DiscriminatedUnion4_2.parseObjectParser.bind(hoisted_DiscriminatedUnion4_2),
    "type": hoisted_DiscriminatedUnion4_3.parseConstDecoder.bind(hoisted_DiscriminatedUnion4_3)
}, null);
const hoisted_DiscriminatedUnion4_6 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion4_7 = new ObjectValidator({
    "a2": validateString,
    "subType": hoisted_DiscriminatedUnion4_6.validateConstDecoder.bind(hoisted_DiscriminatedUnion4_6)
}, null);
const hoisted_DiscriminatedUnion4_8 = new ObjectParser({
    "a2": parseIdentity,
    "subType": hoisted_DiscriminatedUnion4_6.parseConstDecoder.bind(hoisted_DiscriminatedUnion4_6)
}, null);
const hoisted_DiscriminatedUnion4_9 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion4_10 = new ObjectValidator({
    "a": hoisted_DiscriminatedUnion4_7.validateObjectValidator.bind(hoisted_DiscriminatedUnion4_7),
    "type": hoisted_DiscriminatedUnion4_9.validateConstDecoder.bind(hoisted_DiscriminatedUnion4_9)
}, null);
const hoisted_DiscriminatedUnion4_11 = new ObjectParser({
    "a": hoisted_DiscriminatedUnion4_8.parseObjectParser.bind(hoisted_DiscriminatedUnion4_8),
    "type": hoisted_DiscriminatedUnion4_9.parseConstDecoder.bind(hoisted_DiscriminatedUnion4_9)
}, null);
const hoisted_DiscriminatedUnion4_12 = new AnyOfValidator([
    hoisted_DiscriminatedUnion4_4.validateObjectValidator.bind(hoisted_DiscriminatedUnion4_4),
    hoisted_DiscriminatedUnion4_10.validateObjectValidator.bind(hoisted_DiscriminatedUnion4_10)
]);
const hoisted_DiscriminatedUnion4_13 = new AnyOfParser([
    hoisted_DiscriminatedUnion4_4.validateObjectValidator.bind(hoisted_DiscriminatedUnion4_4),
    hoisted_DiscriminatedUnion4_10.validateObjectValidator.bind(hoisted_DiscriminatedUnion4_10)
], [
    hoisted_DiscriminatedUnion4_5.parseObjectParser.bind(hoisted_DiscriminatedUnion4_5),
    hoisted_DiscriminatedUnion4_11.parseObjectParser.bind(hoisted_DiscriminatedUnion4_11)
]);
const hoisted_AllTypes_0 = new ConstDecoder("LevelAndDSettings");
const hoisted_AllTypes_1 = new ConstDecoder("OmitSettings");
const hoisted_AllTypes_2 = new ConstDecoder("PartialSettings");
const hoisted_AllTypes_3 = new ConstDecoder("RequiredPartialObject");
const hoisted_AllTypes_4 = new AnyOfValidator([
    hoisted_AllTypes_0.validateConstDecoder.bind(hoisted_AllTypes_0),
    hoisted_AllTypes_1.validateConstDecoder.bind(hoisted_AllTypes_1),
    hoisted_AllTypes_2.validateConstDecoder.bind(hoisted_AllTypes_2),
    hoisted_AllTypes_3.validateConstDecoder.bind(hoisted_AllTypes_3)
]);
const hoisted_AllTypes_5 = new AnyOfParser([
    hoisted_AllTypes_0.validateConstDecoder.bind(hoisted_AllTypes_0),
    hoisted_AllTypes_1.validateConstDecoder.bind(hoisted_AllTypes_1),
    hoisted_AllTypes_2.validateConstDecoder.bind(hoisted_AllTypes_2),
    hoisted_AllTypes_3.validateConstDecoder.bind(hoisted_AllTypes_3)
], [
    hoisted_AllTypes_0.parseConstDecoder.bind(hoisted_AllTypes_0),
    hoisted_AllTypes_1.parseConstDecoder.bind(hoisted_AllTypes_1),
    hoisted_AllTypes_2.parseConstDecoder.bind(hoisted_AllTypes_2),
    hoisted_AllTypes_3.parseConstDecoder.bind(hoisted_AllTypes_3)
]);
const hoisted_OtherEnum_0 = new ConstDecoder("a");
const hoisted_OtherEnum_1 = new ConstDecoder("b");
const hoisted_OtherEnum_2 = new AnyOfValidator([
    hoisted_OtherEnum_0.validateConstDecoder.bind(hoisted_OtherEnum_0),
    hoisted_OtherEnum_1.validateConstDecoder.bind(hoisted_OtherEnum_1)
]);
const hoisted_OtherEnum_3 = new AnyOfParser([
    hoisted_OtherEnum_0.validateConstDecoder.bind(hoisted_OtherEnum_0),
    hoisted_OtherEnum_1.validateConstDecoder.bind(hoisted_OtherEnum_1)
], [
    hoisted_OtherEnum_0.parseConstDecoder.bind(hoisted_OtherEnum_0),
    hoisted_OtherEnum_1.parseConstDecoder.bind(hoisted_OtherEnum_1)
]);
const hoisted_Arr2_0 = new ConstDecoder("A");
const hoisted_Arr2_1 = new ConstDecoder("B");
const hoisted_Arr2_2 = new ConstDecoder("C");
const hoisted_Arr2_3 = new AnyOfValidator([
    hoisted_Arr2_0.validateConstDecoder.bind(hoisted_Arr2_0),
    hoisted_Arr2_1.validateConstDecoder.bind(hoisted_Arr2_1),
    hoisted_Arr2_2.validateConstDecoder.bind(hoisted_Arr2_2)
]);
const hoisted_Arr2_4 = new AnyOfParser([
    hoisted_Arr2_0.validateConstDecoder.bind(hoisted_Arr2_0),
    hoisted_Arr2_1.validateConstDecoder.bind(hoisted_Arr2_1),
    hoisted_Arr2_2.validateConstDecoder.bind(hoisted_Arr2_2)
], [
    hoisted_Arr2_0.parseConstDecoder.bind(hoisted_Arr2_0),
    hoisted_Arr2_1.parseConstDecoder.bind(hoisted_Arr2_1),
    hoisted_Arr2_2.parseConstDecoder.bind(hoisted_Arr2_2)
]);
const hoisted_ValidCurrency_0 = new StringWithFormatDecoder("ValidCurrency");
const hoisted_UnionWithEnumAccess_0 = new ConstDecoder("a");
const hoisted_UnionWithEnumAccess_1 = new ObjectValidator({
    "tag": hoisted_UnionWithEnumAccess_0.validateConstDecoder.bind(hoisted_UnionWithEnumAccess_0),
    "value": validateString
}, null);
const hoisted_UnionWithEnumAccess_2 = new ObjectParser({
    "tag": hoisted_UnionWithEnumAccess_0.parseConstDecoder.bind(hoisted_UnionWithEnumAccess_0),
    "value": parseIdentity
}, null);
const hoisted_UnionWithEnumAccess_3 = new ConstDecoder("b");
const hoisted_UnionWithEnumAccess_4 = new ObjectValidator({
    "tag": hoisted_UnionWithEnumAccess_3.validateConstDecoder.bind(hoisted_UnionWithEnumAccess_3),
    "value": validateNumber
}, null);
const hoisted_UnionWithEnumAccess_5 = new ObjectParser({
    "tag": hoisted_UnionWithEnumAccess_3.parseConstDecoder.bind(hoisted_UnionWithEnumAccess_3),
    "value": parseIdentity
}, null);
const hoisted_UnionWithEnumAccess_6 = new ConstDecoder("c");
const hoisted_UnionWithEnumAccess_7 = new ObjectValidator({
    "tag": hoisted_UnionWithEnumAccess_6.validateConstDecoder.bind(hoisted_UnionWithEnumAccess_6),
    "value": validateBoolean
}, null);
const hoisted_UnionWithEnumAccess_8 = new ObjectParser({
    "tag": hoisted_UnionWithEnumAccess_6.parseConstDecoder.bind(hoisted_UnionWithEnumAccess_6),
    "value": parseIdentity
}, null);
const hoisted_UnionWithEnumAccess_9 = new AnyOfValidator([
    hoisted_UnionWithEnumAccess_1.validateObjectValidator.bind(hoisted_UnionWithEnumAccess_1),
    hoisted_UnionWithEnumAccess_4.validateObjectValidator.bind(hoisted_UnionWithEnumAccess_4),
    hoisted_UnionWithEnumAccess_7.validateObjectValidator.bind(hoisted_UnionWithEnumAccess_7)
]);
const hoisted_UnionWithEnumAccess_10 = new AnyOfParser([
    hoisted_UnionWithEnumAccess_1.validateObjectValidator.bind(hoisted_UnionWithEnumAccess_1),
    hoisted_UnionWithEnumAccess_4.validateObjectValidator.bind(hoisted_UnionWithEnumAccess_4),
    hoisted_UnionWithEnumAccess_7.validateObjectValidator.bind(hoisted_UnionWithEnumAccess_7)
], [
    hoisted_UnionWithEnumAccess_2.parseObjectParser.bind(hoisted_UnionWithEnumAccess_2),
    hoisted_UnionWithEnumAccess_5.parseObjectParser.bind(hoisted_UnionWithEnumAccess_5),
    hoisted_UnionWithEnumAccess_8.parseObjectParser.bind(hoisted_UnionWithEnumAccess_8)
]);
const hoisted_Shape_0 = new ConstDecoder("circle");
const hoisted_Shape_1 = new ObjectValidator({
    "kind": hoisted_Shape_0.validateConstDecoder.bind(hoisted_Shape_0),
    "radius": validateNumber
}, null);
const hoisted_Shape_2 = new ObjectParser({
    "kind": hoisted_Shape_0.parseConstDecoder.bind(hoisted_Shape_0),
    "radius": parseIdentity
}, null);
const hoisted_Shape_3 = new ConstDecoder("square");
const hoisted_Shape_4 = new ObjectValidator({
    "kind": hoisted_Shape_3.validateConstDecoder.bind(hoisted_Shape_3),
    "x": validateNumber
}, null);
const hoisted_Shape_5 = new ObjectParser({
    "kind": hoisted_Shape_3.parseConstDecoder.bind(hoisted_Shape_3),
    "x": parseIdentity
}, null);
const hoisted_Shape_6 = new ConstDecoder("triangle");
const hoisted_Shape_7 = new ObjectValidator({
    "kind": hoisted_Shape_6.validateConstDecoder.bind(hoisted_Shape_6),
    "x": validateNumber,
    "y": validateNumber
}, null);
const hoisted_Shape_8 = new ObjectParser({
    "kind": hoisted_Shape_6.parseConstDecoder.bind(hoisted_Shape_6),
    "x": parseIdentity,
    "y": parseIdentity
}, null);
const hoisted_Shape_9 = new AnyOfValidator([
    hoisted_Shape_1.validateObjectValidator.bind(hoisted_Shape_1),
    hoisted_Shape_4.validateObjectValidator.bind(hoisted_Shape_4),
    hoisted_Shape_7.validateObjectValidator.bind(hoisted_Shape_7)
]);
const hoisted_Shape_10 = new AnyOfParser([
    hoisted_Shape_1.validateObjectValidator.bind(hoisted_Shape_1),
    hoisted_Shape_4.validateObjectValidator.bind(hoisted_Shape_4),
    hoisted_Shape_7.validateObjectValidator.bind(hoisted_Shape_7)
], [
    hoisted_Shape_2.parseObjectParser.bind(hoisted_Shape_2),
    hoisted_Shape_5.parseObjectParser.bind(hoisted_Shape_5),
    hoisted_Shape_8.parseObjectParser.bind(hoisted_Shape_8)
]);
const hoisted_T3_0 = new ConstDecoder("square");
const hoisted_T3_1 = new ObjectValidator({
    "kind": hoisted_T3_0.validateConstDecoder.bind(hoisted_T3_0),
    "x": validateNumber
}, null);
const hoisted_T3_2 = new ObjectParser({
    "kind": hoisted_T3_0.parseConstDecoder.bind(hoisted_T3_0),
    "x": parseIdentity
}, null);
const hoisted_T3_3 = new ConstDecoder("triangle");
const hoisted_T3_4 = new ObjectValidator({
    "kind": hoisted_T3_3.validateConstDecoder.bind(hoisted_T3_3),
    "x": validateNumber,
    "y": validateNumber
}, null);
const hoisted_T3_5 = new ObjectParser({
    "kind": hoisted_T3_3.parseConstDecoder.bind(hoisted_T3_3),
    "x": parseIdentity,
    "y": parseIdentity
}, null);
const hoisted_T3_6 = new AnyOfValidator([
    hoisted_T3_1.validateObjectValidator.bind(hoisted_T3_1),
    hoisted_T3_4.validateObjectValidator.bind(hoisted_T3_4)
]);
const hoisted_T3_7 = new AnyOfParser([
    hoisted_T3_1.validateObjectValidator.bind(hoisted_T3_1),
    hoisted_T3_4.validateObjectValidator.bind(hoisted_T3_4)
], [
    hoisted_T3_2.parseObjectParser.bind(hoisted_T3_2),
    hoisted_T3_5.parseObjectParser.bind(hoisted_T3_5)
]);
const hoisted_BObject_0 = new ConstDecoder("b");
const hoisted_BObject_1 = new ObjectValidator({
    "tag": hoisted_BObject_0.validateConstDecoder.bind(hoisted_BObject_0)
}, null);
const hoisted_BObject_2 = new ObjectParser({
    "tag": hoisted_BObject_0.parseConstDecoder.bind(hoisted_BObject_0)
}, null);
const hoisted_DEF_0 = new ObjectValidator({
    "a": validateString
}, null);
const hoisted_DEF_1 = new ObjectParser({
    "a": parseIdentity
}, null);
const hoisted_KDEF_0 = new ConstDecoder("a");
const hoisted_ABC_0 = new ObjectValidator({}, null);
const hoisted_ABC_1 = new ObjectParser({}, null);
const hoisted_K_0 = new AnyOfValidator([
    validators.KABC,
    validators.KDEF
]);
const hoisted_K_1 = new AnyOfParser([
    validators.KABC,
    validators.KDEF
], [
    parsers.KABC,
    parsers.KDEF
]);

export default { registerCustomFormatter, ObjectValidator, ObjectParser, ArrayParser, ArrayValidator, CodecDecoder, StringWithFormatDecoder, AnyOfValidator, AnyOfParser, AllOfValidator, AllOfParser, TupleParser, TupleValidator, RegexDecoder, ConstDecoder, AnyOfConstsDecoder, AnyOfDiscriminatedDecoder, validateString, validateNumber, validateFunction, validateBoolean, validateAny, validateNull, validateNever, parseIdentity, validators, parsers };