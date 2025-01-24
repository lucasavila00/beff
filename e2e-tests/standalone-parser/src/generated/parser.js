//@ts-nocheck
/* eslint-disable */


import {printErrors} from '@beff/client';
import {z} from 'zod';
import validatorsMod from "./validators.js"; const { registerCustomFormatter, ObjectValidator, ObjectParser, ArrayParser, ArrayValidator, CodecDecoder, StringWithFormatDecoder, AnyOfValidator, AnyOfParser, AllOfValidator, AllOfParser, TupleParser, TupleValidator, RegexDecoder, ConstDecoder, AnyOfConstsDecoder, AnyOfDiscriminatedDecoder, validateString, validateNumber, validateFunction, validateBoolean, validateAny, validateNull, validateNever, parseIdentity, validators, parsers, c } = validatorsMod;
const RequiredCustomFormats = ["ValidCurrency"];
const hoisted_BigIntCodec_0 = new CodecDecoder("Codec::BigInt");
const hoisted_TupleCodec_1 = new TupleValidator([
    validateNumber,
    validateNumber,
    validateNumber
], null);
const hoisted_TupleCodec_2 = new TupleParser([
    parseIdentity,
    parseIdentity,
    parseIdentity
], null);
const hoisted_TupleCodecRest_3 = new TupleValidator([
    validateNumber,
    validateNumber
], validateString);
const hoisted_TupleCodecRest_4 = new TupleParser([
    parseIdentity,
    parseIdentity
], parseIdentity);
const hoisted_StringArrCodec_5 = new ArrayValidator(validateString);
const hoisted_StringArrCodec_6 = new ArrayParser(parseIdentity);
const hoisted_ImportEnumTypeof_7 = new ConstDecoder("a");
const hoisted_ImportEnumTypeof_8 = new ObjectValidator({
    "A": hoisted_ImportEnumTypeof_7.validateConstDecoder.bind(hoisted_ImportEnumTypeof_7)
}, null);
const hoisted_ImportEnumTypeof_9 = new ObjectParser({
    "A": hoisted_ImportEnumTypeof_7.parseConstDecoder.bind(hoisted_ImportEnumTypeof_7)
}, null);
const buildValidatorsInput = {
    "AObject": validators.AObject,
    "AccessLevel": validators.AccessLevel,
    "AccessLevelCodec": validators.AccessLevel,
    "AccessLevelTpl": validators.AccessLevelTpl,
    "AccessLevelTpl2": validators.AccessLevelTpl2,
    "AllTs": validators.AllTs,
    "AllTypes": validators.AllTypes,
    "Arr2C": validators.Arr2,
    "Arr3": validators.Arr3,
    "AvatarSize": validators.AvatarSize,
    "BObject": validators.BObject,
    "BigIntCodec": hoisted_BigIntCodec_0.validateCodecDecoder.bind(hoisted_BigIntCodec_0),
    "DiscriminatedUnion": validators.DiscriminatedUnion,
    "DiscriminatedUnion2": validators.DiscriminatedUnion2,
    "DiscriminatedUnion3": validators.DiscriminatedUnion3,
    "DiscriminatedUnion4": validators.DiscriminatedUnion4,
    "Extra": validators.Extra,
    "ImportEnumTypeof": hoisted_ImportEnumTypeof_8.validateObjectValidator.bind(hoisted_ImportEnumTypeof_8),
    "K": validators.K,
    "KABC": validators.KABC,
    "KDEF": validators.KDEF,
    "LevelAndDSettings": validators.LevelAndDSettings,
    "Mapped": validators.Mapped,
    "MappedOptional": validators.MappedOptional,
    "OmitSettings": validators.OmitSettings,
    "OnlyAKey": validators.OnlyAKey,
    "OtherEnum": validators.OtherEnum,
    "PartialObject": validators.PartialObject,
    "PartialSettings": validators.PartialSettings,
    "PublicUser": validators.PublicUser,
    "Repro1": validators.Repro1,
    "Req": validators.Req,
    "RequiredPartialObject": validators.RequiredPartialObject,
    "SettingsUpdate": validators.SettingsUpdate,
    "StringArrCodec": hoisted_StringArrCodec_5.validateArrayValidator.bind(hoisted_StringArrCodec_5),
    "T3": validators.T3,
    "TransportedValue": validators.TransportedValue,
    "TupleCodec": hoisted_TupleCodec_1.validateTupleValidator.bind(hoisted_TupleCodec_1),
    "TupleCodecRest": hoisted_TupleCodecRest_3.validateTupleValidator.bind(hoisted_TupleCodecRest_3),
    "UnionWithEnumAccess": validators.UnionWithEnumAccess,
    "User": validators.User,
    "ValidCurrency": validators.ValidCurrency,
    "Version": validators.Version,
    "Version2": validators.Version2
};
const buildParsersInput = {
    "AObject": parsers.AObject,
    "AccessLevel": parsers.AccessLevel,
    "AccessLevelCodec": parsers.AccessLevel,
    "AccessLevelTpl": parsers.AccessLevelTpl,
    "AccessLevelTpl2": parsers.AccessLevelTpl2,
    "AllTs": parsers.AllTs,
    "AllTypes": parsers.AllTypes,
    "Arr2C": parsers.Arr2,
    "Arr3": parsers.Arr3,
    "AvatarSize": parsers.AvatarSize,
    "BObject": parsers.BObject,
    "BigIntCodec": hoisted_BigIntCodec_0.parseCodecDecoder.bind(hoisted_BigIntCodec_0),
    "DiscriminatedUnion": parsers.DiscriminatedUnion,
    "DiscriminatedUnion2": parsers.DiscriminatedUnion2,
    "DiscriminatedUnion3": parsers.DiscriminatedUnion3,
    "DiscriminatedUnion4": parsers.DiscriminatedUnion4,
    "Extra": parsers.Extra,
    "ImportEnumTypeof": hoisted_ImportEnumTypeof_9.parseObjectParser.bind(hoisted_ImportEnumTypeof_9),
    "K": parsers.K,
    "KABC": parsers.KABC,
    "KDEF": parsers.KDEF,
    "LevelAndDSettings": parsers.LevelAndDSettings,
    "Mapped": parsers.Mapped,
    "MappedOptional": parsers.MappedOptional,
    "OmitSettings": parsers.OmitSettings,
    "OnlyAKey": parsers.OnlyAKey,
    "OtherEnum": parsers.OtherEnum,
    "PartialObject": parsers.PartialObject,
    "PartialSettings": parsers.PartialSettings,
    "PublicUser": parsers.PublicUser,
    "Repro1": parsers.Repro1,
    "Req": parsers.Req,
    "RequiredPartialObject": parsers.RequiredPartialObject,
    "SettingsUpdate": parsers.SettingsUpdate,
    "StringArrCodec": hoisted_StringArrCodec_6.parseArrayParser.bind(hoisted_StringArrCodec_6),
    "T3": parsers.T3,
    "TransportedValue": parsers.TransportedValue,
    "TupleCodec": hoisted_TupleCodec_2.parseTupleParser.bind(hoisted_TupleCodec_2),
    "TupleCodecRest": hoisted_TupleCodecRest_4.parseTupleParser.bind(hoisted_TupleCodecRest_4),
    "UnionWithEnumAccess": parsers.UnionWithEnumAccess,
    "User": parsers.User,
    "ValidCurrency": parsers.ValidCurrency,
    "Version": parsers.Version,
    "Version2": parsers.Version2
};




function buildParsers(args) {
  const customFormats = args?.customFormats ?? {};
  
  for (const k of RequiredCustomFormats) {
    if (customFormats[k] == null) {
      throw new Error(`Missing custom format ${k}`);
    }
  }

  Object.keys(customFormats).forEach((k) => {
    const v = customFormats[k];
    
    registerCustomFormatter(k, v);
  });

  let decoders = {};
  
  Object.keys(buildValidatorsInput).forEach((k) => {
    
    let v = buildValidatorsInput[k];
    const safeParse = (input, options) => {
      if (options?.disallowExtraProperties ?? false) {
        throw new Error("disallowExtraProperties not supported");
      }
      const ok = v(null, input);
      if (typeof ok !== "boolean") {
        throw new Error("DEBUG: Expected boolean");
      }
      
      
      
      
      
      
      if (ok) {
        return { success: true, data: input };
      }
      return {
        success: false,
        errors: [
          {
            message: "failed to parse!!!",
            path: [],
            received: input,
          },
        ],
      };
    };
    const parse = (input, options) => {
      const safe = safeParse(input, options);
      if (safe.success) {
        return safe.data;
      }
      const error = new Error(`Failed to parse ${k}`);
      
      error.errors = safe.errors;
      throw error;
    };
    const zod = () => {
      
      return z.custom(
        (data) => safeParse(data).success,
        (val) => {
          const errors = safeParse(val).errors;
          
          return printErrors(errors, []);
        }
      );
    };
    decoders[k] = {
      parse,
      safeParse,
      zod,
      name: k,
    };
  });
  return decoders;
}

export default { buildParsers };