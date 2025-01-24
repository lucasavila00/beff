//@ts-nocheck
/* eslint-disable */


import {printErrors} from '@beff/client';
import {z} from 'zod';
import validatorsMod from "./validators.js"; const { registerCustomFormatter, ObjectValidator, ObjectParser, ArrayParser, ArrayValidator, CodecDecoder, StringWithFormatDecoder, AnyOfValidator, AnyOfParser, AllOfValidator, AllOfParser, TupleParser, TupleValidator, RegexDecoder, ConstDecoder, AnyOfConstsDecoder, AnyOfDiscriminatedReporter, AnyOfDiscriminatedParser, AnyOfDiscriminatedValidator, validateString, validateNumber, validateFunction, validateBoolean, validateAny, validateNull, validateNever, parseIdentity, AnyOfReporter, AllOfReporter, reportString, reportNumber, reportNull, reportBoolean, reportAny, reportNever, reportFunction, ArrayReporter, ObjectReporter, TupleReporter, validators, parsers, reporters, c } = validatorsMod;
const RequiredCustomFormats = ["ValidCurrency"];
const hoisted_ObjectWithArr_0 = validateString;
const hoisted_ObjectWithArr_1 = new ArrayValidator(hoisted_ObjectWithArr_0);
const hoisted_ObjectWithArr_2 = new ArrayParser(parseIdentity);
const hoisted_ObjectWithArr_3 = new ArrayReporter(hoisted_ObjectWithArr_0, reportString);
const hoisted_ObjectWithArr_4 = {
    "a": hoisted_ObjectWithArr_1.validateArrayValidator.bind(hoisted_ObjectWithArr_1)
};
const hoisted_ObjectWithArr_5 = null;
const hoisted_ObjectWithArr_6 = new ObjectValidator(hoisted_ObjectWithArr_4, hoisted_ObjectWithArr_5);
const hoisted_ObjectWithArr_7 = new ObjectParser({
    "a": hoisted_ObjectWithArr_2.parseArrayParser.bind(hoisted_ObjectWithArr_2)
}, null);
const hoisted_ObjectWithArr_8 = new ObjectReporter(hoisted_ObjectWithArr_4, hoisted_ObjectWithArr_5, {
    "a": hoisted_ObjectWithArr_3.reportArrayReporter.bind(hoisted_ObjectWithArr_3)
}, null);
const hoisted_BigIntCodec_9 = new CodecDecoder("Codec::BigInt");
const hoisted_TupleCodec_10 = [
    validateNumber,
    validateNumber,
    validateNumber
];
const hoisted_TupleCodec_11 = null;
const hoisted_TupleCodec_12 = new TupleValidator(hoisted_TupleCodec_10, hoisted_TupleCodec_11);
const hoisted_TupleCodec_13 = new TupleParser([
    parseIdentity,
    parseIdentity,
    parseIdentity
], null);
const hoisted_TupleCodec_14 = new TupleReporter(hoisted_TupleCodec_10, hoisted_TupleCodec_11, [
    reportNumber,
    reportNumber,
    reportNumber
], null);
const hoisted_TupleCodecRest_15 = [
    validateNumber,
    validateNumber
];
const hoisted_TupleCodecRest_16 = validateString;
const hoisted_TupleCodecRest_17 = new TupleValidator(hoisted_TupleCodecRest_15, hoisted_TupleCodecRest_16);
const hoisted_TupleCodecRest_18 = new TupleParser([
    parseIdentity,
    parseIdentity
], parseIdentity);
const hoisted_TupleCodecRest_19 = new TupleReporter(hoisted_TupleCodecRest_15, hoisted_TupleCodecRest_16, [
    reportNumber,
    reportNumber
], reportString);
const hoisted_StringArrCodec_20 = validateString;
const hoisted_StringArrCodec_21 = new ArrayValidator(hoisted_StringArrCodec_20);
const hoisted_StringArrCodec_22 = new ArrayParser(parseIdentity);
const hoisted_StringArrCodec_23 = new ArrayReporter(hoisted_StringArrCodec_20, reportString);
const hoisted_ImportEnumTypeof_24 = new ConstDecoder("a");
const hoisted_ImportEnumTypeof_25 = {
    "A": hoisted_ImportEnumTypeof_24.validateConstDecoder.bind(hoisted_ImportEnumTypeof_24)
};
const hoisted_ImportEnumTypeof_26 = null;
const hoisted_ImportEnumTypeof_27 = new ObjectValidator(hoisted_ImportEnumTypeof_25, hoisted_ImportEnumTypeof_26);
const hoisted_ImportEnumTypeof_28 = new ObjectParser({
    "A": hoisted_ImportEnumTypeof_24.parseConstDecoder.bind(hoisted_ImportEnumTypeof_24)
}, null);
const hoisted_ImportEnumTypeof_29 = new ObjectReporter(hoisted_ImportEnumTypeof_25, hoisted_ImportEnumTypeof_26, {
    "A": hoisted_ImportEnumTypeof_24.reportConstDecoder.bind(hoisted_ImportEnumTypeof_24)
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
    "BigIntCodec": hoisted_BigIntCodec_9.validateCodecDecoder.bind(hoisted_BigIntCodec_9),
    "DiscriminatedUnion": validators.DiscriminatedUnion,
    "DiscriminatedUnion2": validators.DiscriminatedUnion2,
    "DiscriminatedUnion3": validators.DiscriminatedUnion3,
    "DiscriminatedUnion4": validators.DiscriminatedUnion4,
    "Extra": validators.Extra,
    "ImportEnumTypeof": hoisted_ImportEnumTypeof_27.validateObjectValidator.bind(hoisted_ImportEnumTypeof_27),
    "K": validators.K,
    "KABC": validators.KABC,
    "KDEF": validators.KDEF,
    "LevelAndDSettings": validators.LevelAndDSettings,
    "Mapped": validators.Mapped,
    "MappedOptional": validators.MappedOptional,
    "ObjectWithArr": hoisted_ObjectWithArr_6.validateObjectValidator.bind(hoisted_ObjectWithArr_6),
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
    "StringArrCodec": hoisted_StringArrCodec_21.validateArrayValidator.bind(hoisted_StringArrCodec_21),
    "T3": validators.T3,
    "TransportedValue": validators.TransportedValue,
    "TupleCodec": hoisted_TupleCodec_12.validateTupleValidator.bind(hoisted_TupleCodec_12),
    "TupleCodecRest": hoisted_TupleCodecRest_17.validateTupleValidator.bind(hoisted_TupleCodecRest_17),
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
    "BigIntCodec": hoisted_BigIntCodec_9.parseCodecDecoder.bind(hoisted_BigIntCodec_9),
    "DiscriminatedUnion": parsers.DiscriminatedUnion,
    "DiscriminatedUnion2": parsers.DiscriminatedUnion2,
    "DiscriminatedUnion3": parsers.DiscriminatedUnion3,
    "DiscriminatedUnion4": parsers.DiscriminatedUnion4,
    "Extra": parsers.Extra,
    "ImportEnumTypeof": hoisted_ImportEnumTypeof_28.parseObjectParser.bind(hoisted_ImportEnumTypeof_28),
    "K": parsers.K,
    "KABC": parsers.KABC,
    "KDEF": parsers.KDEF,
    "LevelAndDSettings": parsers.LevelAndDSettings,
    "Mapped": parsers.Mapped,
    "MappedOptional": parsers.MappedOptional,
    "ObjectWithArr": hoisted_ObjectWithArr_7.parseObjectParser.bind(hoisted_ObjectWithArr_7),
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
    "StringArrCodec": hoisted_StringArrCodec_22.parseArrayParser.bind(hoisted_StringArrCodec_22),
    "T3": parsers.T3,
    "TransportedValue": parsers.TransportedValue,
    "TupleCodec": hoisted_TupleCodec_13.parseTupleParser.bind(hoisted_TupleCodec_13),
    "TupleCodecRest": hoisted_TupleCodecRest_18.parseTupleParser.bind(hoisted_TupleCodecRest_18),
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
    "BigIntCodec": hoisted_BigIntCodec_9.reportCodecDecoder.bind(hoisted_BigIntCodec_9),
    "DiscriminatedUnion": reporters.DiscriminatedUnion,
    "DiscriminatedUnion2": reporters.DiscriminatedUnion2,
    "DiscriminatedUnion3": reporters.DiscriminatedUnion3,
    "DiscriminatedUnion4": reporters.DiscriminatedUnion4,
    "Extra": reporters.Extra,
    "ImportEnumTypeof": hoisted_ImportEnumTypeof_29.reportObjectReporter.bind(hoisted_ImportEnumTypeof_29),
    "K": reporters.K,
    "KABC": reporters.KABC,
    "KDEF": reporters.KDEF,
    "LevelAndDSettings": reporters.LevelAndDSettings,
    "Mapped": reporters.Mapped,
    "MappedOptional": reporters.MappedOptional,
    "ObjectWithArr": hoisted_ObjectWithArr_8.reportObjectReporter.bind(hoisted_ObjectWithArr_8),
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
    "StringArrCodec": hoisted_StringArrCodec_23.reportArrayReporter.bind(hoisted_StringArrCodec_23),
    "T3": reporters.T3,
    "TransportedValue": reporters.TransportedValue,
    "TupleCodec": hoisted_TupleCodec_14.reportTupleReporter.bind(hoisted_TupleCodec_14),
    "TupleCodecRest": hoisted_TupleCodecRest_19.reportTupleReporter.bind(hoisted_TupleCodecRest_19),
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
      const disallowExtraProperties = options?.disallowExtraProperties ?? false;
      const ctx = { disallowExtraProperties };
      const ok = v(ctx, input);
      if (typeof ok !== "boolean") {
        throw new Error("INTERNAL ERROR: Expected boolean");
      }
      return ok;
    };
    const safeParse = (input, options) => {
      const disallowExtraProperties = options?.disallowExtraProperties ?? false;
      const ok = validate(input, options);
      
      
      
      
      
      
      if (ok) {
        
        let p = buildParsersInput[k];
        let ctx = { disallowExtraProperties };
        const parsed = p(ctx, input);
        return { success: true, data: parsed };
      }
      
      let e = buildReportersInput[k];
      let ctx = { path: [], disallowExtraProperties };
      return {
        success: false,
        errors: e(ctx, input).slice(0, 10),
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