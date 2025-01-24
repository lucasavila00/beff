//@ts-nocheck
/* eslint-disable */


import {printErrors} from '@beff/client';
import {z} from 'zod';
import validatorsMod from "./validators.js"; const { registerCustomFormatter, ObjectValidator, ObjectParser, ArrayParser, ArrayValidator, CodecDecoder, StringWithFormatDecoder, AnyOfValidator, AnyOfParser, AllOfValidator, AllOfParser, TupleParser, TupleValidator, RegexDecoder, ConstDecoder, AnyOfConstsDecoder, AnyOfDiscriminatedDecoder, validateString, validateNumber, validateFunction, validateBoolean, validateAny, validateNull, validateNever, parseIdentity, AnyOfReporter, AllOfReporter, reportString, reportNumber, reportNull, reportBoolean, reportAny, reportNever, reportFunction, ArrayReporter, ObjectReporter, TupleReporter, validators, parsers, reporters, c } = validatorsMod;
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
const hoisted_TupleCodec_3 = new TupleReporter([
    reportNumber,
    reportNumber,
    reportNumber
], null);
const hoisted_TupleCodecRest_4 = new TupleValidator([
    validateNumber,
    validateNumber
], validateString);
const hoisted_TupleCodecRest_5 = new TupleParser([
    parseIdentity,
    parseIdentity
], parseIdentity);
const hoisted_TupleCodecRest_6 = new TupleReporter([
    reportNumber,
    reportNumber
], reportString);
const hoisted_StringArrCodec_7 = new ArrayValidator(validateString);
const hoisted_StringArrCodec_8 = new ArrayParser(parseIdentity);
const hoisted_StringArrCodec_9 = new ArrayReporter(reportString);
const hoisted_ImportEnumTypeof_10 = new ConstDecoder("a");
const hoisted_ImportEnumTypeof_11 = new ObjectValidator({
    "A": hoisted_ImportEnumTypeof_10.validateConstDecoder.bind(hoisted_ImportEnumTypeof_10)
}, null);
const hoisted_ImportEnumTypeof_12 = new ObjectParser({
    "A": hoisted_ImportEnumTypeof_10.parseConstDecoder.bind(hoisted_ImportEnumTypeof_10)
}, null);
const hoisted_ImportEnumTypeof_13 = new ObjectReporter({
    "A": hoisted_ImportEnumTypeof_10.reportConstDecoder.bind(hoisted_ImportEnumTypeof_10)
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
    "ImportEnumTypeof": hoisted_ImportEnumTypeof_11.validateObjectValidator.bind(hoisted_ImportEnumTypeof_11),
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
    "StringArrCodec": hoisted_StringArrCodec_7.validateArrayValidator.bind(hoisted_StringArrCodec_7),
    "T3": validators.T3,
    "TransportedValue": validators.TransportedValue,
    "TupleCodec": hoisted_TupleCodec_1.validateTupleValidator.bind(hoisted_TupleCodec_1),
    "TupleCodecRest": hoisted_TupleCodecRest_4.validateTupleValidator.bind(hoisted_TupleCodecRest_4),
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
    "ImportEnumTypeof": hoisted_ImportEnumTypeof_12.parseObjectParser.bind(hoisted_ImportEnumTypeof_12),
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
    "StringArrCodec": hoisted_StringArrCodec_8.parseArrayParser.bind(hoisted_StringArrCodec_8),
    "T3": parsers.T3,
    "TransportedValue": parsers.TransportedValue,
    "TupleCodec": hoisted_TupleCodec_2.parseTupleParser.bind(hoisted_TupleCodec_2),
    "TupleCodecRest": hoisted_TupleCodecRest_5.parseTupleParser.bind(hoisted_TupleCodecRest_5),
    "UnionWithEnumAccess": parsers.UnionWithEnumAccess,
    "User": parsers.User,
    "ValidCurrency": parsers.ValidCurrency,
    "Version": parsers.Version,
    "Version2": parsers.Version2
};
const buildReportersInput = {
    "AObject": reporters.AObject,
    "AccessLevel": reporters.AccessLevel,
    "AccessLevelCodec": reporters.AccessLevel,
    "AccessLevelTpl": reporters.AccessLevelTpl,
    "AccessLevelTpl2": reporters.AccessLevelTpl2,
    "AllTs": reporters.AllTs,
    "AllTypes": reporters.AllTypes,
    "Arr2C": reporters.Arr2,
    "Arr3": reporters.Arr3,
    "AvatarSize": reporters.AvatarSize,
    "BObject": reporters.BObject,
    "BigIntCodec": hoisted_BigIntCodec_0.reportCodecDecoder.bind(hoisted_BigIntCodec_0),
    "DiscriminatedUnion": reporters.DiscriminatedUnion,
    "DiscriminatedUnion2": reporters.DiscriminatedUnion2,
    "DiscriminatedUnion3": reporters.DiscriminatedUnion3,
    "DiscriminatedUnion4": reporters.DiscriminatedUnion4,
    "Extra": reporters.Extra,
    "ImportEnumTypeof": hoisted_ImportEnumTypeof_13.reportObjectReporter.bind(hoisted_ImportEnumTypeof_13),
    "K": reporters.K,
    "KABC": reporters.KABC,
    "KDEF": reporters.KDEF,
    "LevelAndDSettings": reporters.LevelAndDSettings,
    "Mapped": reporters.Mapped,
    "MappedOptional": reporters.MappedOptional,
    "OmitSettings": reporters.OmitSettings,
    "OnlyAKey": reporters.OnlyAKey,
    "OtherEnum": reporters.OtherEnum,
    "PartialObject": reporters.PartialObject,
    "PartialSettings": reporters.PartialSettings,
    "PublicUser": reporters.PublicUser,
    "Repro1": reporters.Repro1,
    "Req": reporters.Req,
    "RequiredPartialObject": reporters.RequiredPartialObject,
    "SettingsUpdate": reporters.SettingsUpdate,
    "StringArrCodec": hoisted_StringArrCodec_9.reportArrayReporter.bind(hoisted_StringArrCodec_9),
    "T3": reporters.T3,
    "TransportedValue": reporters.TransportedValue,
    "TupleCodec": hoisted_TupleCodec_3.reportTupleReporter.bind(hoisted_TupleCodec_3),
    "TupleCodecRest": hoisted_TupleCodecRest_6.reportTupleReporter.bind(hoisted_TupleCodecRest_6),
    "UnionWithEnumAccess": reporters.UnionWithEnumAccess,
    "User": reporters.User,
    "ValidCurrency": reporters.ValidCurrency,
    "Version": reporters.Version,
    "Version2": reporters.Version2
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
    const validate = (input, options) => {
      if (options?.disallowExtraProperties ?? false) {
        throw new Error("disallowExtraProperties not supported");
      }
      const ctx = null;
      const ok = v(ctx, input);
      if (typeof ok !== "boolean") {
        throw new Error("INTERNAL ERROR: Expected boolean");
      }
      return ok;
    };
    const safeParse = (input, options) => {
      const ok = validate(input, options);
      
      
      
      
      
      
      if (ok) {
        
        let p = buildParsersInput[k];
        let ctx = null;
        const parsed = p(ctx, input);
        return { success: true, data: parsed };
      }
      
      let e = buildReportersInput[k];
      let ctx = {};
      return {
        success: false,
        errors: e(ctx, input),
      };
    };
    const parse = (input, options) => {
      const safe = safeParse(input, options);
      if (safe.success) {
        return safe.data;
      }
      
      const explained = printErrors(safe.errors, []);
      throw new Error(`Failed to parse ${k} - ${explained}`);
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
      validate,
    };
  });
  return decoders;
}

export default { buildParsers };