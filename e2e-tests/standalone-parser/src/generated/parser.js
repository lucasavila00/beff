//@ts-nocheck
/* eslint-disable */


import {printErrors} from '@beff/client';
import {z} from 'zod';
import validatorsMod from "./validators.js"; const { registerCustomFormatter, ObjectDecoder, ArrayDecoder, CodecDecoder, StringWithFormatDecoder, AnyOfDecoder, AllOfDecoder, TupleDecoder, RegexDecoder, ConstDecoder, AnyOfConstsDecoder, AnyOfDiscriminatedDecoder, validateString, validateNumber, validateFunction, validateBoolean, validateAny, validateNull, validateNever, validators, c } = validatorsMod;
const RequiredCustomFormats = ["ValidCurrency"];
const hoisted_BigIntCodec_0 = new CodecDecoder("Codec::BigInt");
const hoisted_TupleCodec_1 = new TupleDecoder({
    prefix: [
        validateNumber,
        validateNumber,
        validateNumber
    ],
    items: null
});
const hoisted_TupleCodecRest_2 = new TupleDecoder({
    prefix: [
        validateNumber,
        validateNumber
    ],
    items: validateString
});
const hoisted_StringArrCodec_3 = new ArrayDecoder(validateString);
const hoisted_ImportEnumTypeof_4 = new ConstDecoder("a");
const hoisted_ImportEnumTypeof_5 = new ObjectDecoder({
    "A": hoisted_ImportEnumTypeof_4.validateConstDecoder.bind(hoisted_ImportEnumTypeof_4)
});
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
    "ImportEnumTypeof": hoisted_ImportEnumTypeof_5.validateObjectDecoder.bind(hoisted_ImportEnumTypeof_5),
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
    "StringArrCodec": hoisted_StringArrCodec_3.validateArrayDecoder.bind(hoisted_StringArrCodec_3),
    "T3": validators.T3,
    "TransportedValue": validators.TransportedValue,
    "TupleCodec": hoisted_TupleCodec_1.validateTupleDecoder.bind(hoisted_TupleCodec_1),
    "TupleCodecRest": hoisted_TupleCodecRest_2.validateTupleDecoder.bind(hoisted_TupleCodecRest_2),
    "UnionWithEnumAccess": validators.UnionWithEnumAccess,
    "User": validators.User,
    "ValidCurrency": validators.ValidCurrency,
    "Version": validators.Version,
    "Version2": validators.Version2
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