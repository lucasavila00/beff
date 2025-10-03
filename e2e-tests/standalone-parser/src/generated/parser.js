//@ts-nocheck

import {printErrors} from '@beff/client';
import {z} from 'zod';
import validatorsMod from "./validators.js"; const { registerStringFormatter, registerNumberFormatter, ObjectValidator, ObjectParser, ArrayParser, ArrayValidator, CodecDecoder, StringWithFormatDecoder, NumberWithFormatDecoder, AnyOfValidator, AnyOfParser, AllOfValidator, AllOfParser, TupleParser, TupleValidator, RegexDecoder, ConstDecoder, AnyOfConstsDecoder, AnyOfDiscriminatedParser, AnyOfDiscriminatedValidator, validateString, validateNumber, validateFunction, validateBoolean, validateAny, validateNull, validateNever, parseIdentity, reportString, reportNumber, reportNull, reportBoolean, reportAny, reportNever, reportFunction, ArrayReporter, ObjectReporter, TupleReporter, AnyOfReporter, AllOfReporter, AnyOfDiscriminatedReporter, schemaString, schemaNumber, schemaBoolean, schemaNull, schemaAny, schemaNever, schemaFunction, ArraySchema, ObjectSchema, TupleSchema, AnyOfSchema, AllOfSchema, AnyOfDiscriminatedSchema, validators, parsers, reporters, schemas, c } = validatorsMod;
const RequiredStringFormats = ["ValidCurrency"];
const RequiredNumberFormats = ["NonNegativeNumber"];
const hoisted_ObjectWithArr_0 = validateString;
const hoisted_ObjectWithArr_1 = new ArrayValidator(hoisted_ObjectWithArr_0);
const hoisted_ObjectWithArr_2 = new ArrayParser(parseIdentity);
const hoisted_ObjectWithArr_3 = new ArrayReporter(hoisted_ObjectWithArr_0, reportString);
const hoisted_ObjectWithArr_4 = new ArraySchema(schemaString);
const hoisted_ObjectWithArr_5 = {
    "a": hoisted_ObjectWithArr_1.validateArrayValidator.bind(hoisted_ObjectWithArr_1)
};
const hoisted_ObjectWithArr_6 = {
    "a": hoisted_ObjectWithArr_4.schemaArraySchema.bind(hoisted_ObjectWithArr_4)
};
const hoisted_ObjectWithArr_7 = null;
const hoisted_ObjectWithArr_8 = new ObjectValidator(hoisted_ObjectWithArr_5, hoisted_ObjectWithArr_7);
const hoisted_ObjectWithArr_9 = new ObjectParser({
    "a": hoisted_ObjectWithArr_2.parseArrayParser.bind(hoisted_ObjectWithArr_2)
}, null);
const hoisted_ObjectWithArr_10 = new ObjectReporter(hoisted_ObjectWithArr_5, hoisted_ObjectWithArr_7, {
    "a": hoisted_ObjectWithArr_3.reportArrayReporter.bind(hoisted_ObjectWithArr_3)
}, null);
const hoisted_ObjectWithArr_11 = new ObjectSchema(hoisted_ObjectWithArr_6, null);
const hoisted_BigIntCodec_0 = new CodecDecoder("Codec::BigInt");
const hoisted_TupleCodec_0 = [
    validateNumber,
    validateNumber,
    validateNumber
];
const hoisted_TupleCodec_1 = null;
const hoisted_TupleCodec_2 = new TupleValidator(hoisted_TupleCodec_0, hoisted_TupleCodec_1);
const hoisted_TupleCodec_3 = new TupleParser([
    parseIdentity,
    parseIdentity,
    parseIdentity
], null);
const hoisted_TupleCodec_4 = new TupleReporter(hoisted_TupleCodec_0, hoisted_TupleCodec_1, [
    reportNumber,
    reportNumber,
    reportNumber
], null);
const hoisted_TupleCodec_5 = new TupleSchema([
    schemaNumber,
    schemaNumber,
    schemaNumber
], null);
const hoisted_TupleCodecRest_0 = [
    validateNumber,
    validateNumber
];
const hoisted_TupleCodecRest_1 = validateString;
const hoisted_TupleCodecRest_2 = new TupleValidator(hoisted_TupleCodecRest_0, hoisted_TupleCodecRest_1);
const hoisted_TupleCodecRest_3 = new TupleParser([
    parseIdentity,
    parseIdentity
], parseIdentity);
const hoisted_TupleCodecRest_4 = new TupleReporter(hoisted_TupleCodecRest_0, hoisted_TupleCodecRest_1, [
    reportNumber,
    reportNumber
], reportString);
const hoisted_TupleCodecRest_5 = new TupleSchema([
    schemaNumber,
    schemaNumber
], schemaString);
const hoisted_StringArrCodec_0 = validateString;
const hoisted_StringArrCodec_1 = new ArrayValidator(hoisted_StringArrCodec_0);
const hoisted_StringArrCodec_2 = new ArrayParser(parseIdentity);
const hoisted_StringArrCodec_3 = new ArrayReporter(hoisted_StringArrCodec_0, reportString);
const hoisted_StringArrCodec_4 = new ArraySchema(schemaString);
const hoisted_ImportEnumTypeof_0 = new ConstDecoder("a");
const hoisted_ImportEnumTypeof_1 = {
    "A": hoisted_ImportEnumTypeof_0.validateConstDecoder.bind(hoisted_ImportEnumTypeof_0)
};
const hoisted_ImportEnumTypeof_2 = {
    "A": hoisted_ImportEnumTypeof_0.schemaConstDecoder.bind(hoisted_ImportEnumTypeof_0)
};
const hoisted_ImportEnumTypeof_3 = null;
const hoisted_ImportEnumTypeof_4 = new ObjectValidator(hoisted_ImportEnumTypeof_1, hoisted_ImportEnumTypeof_3);
const hoisted_ImportEnumTypeof_5 = new ObjectParser({
    "A": hoisted_ImportEnumTypeof_0.parseConstDecoder.bind(hoisted_ImportEnumTypeof_0)
}, null);
const hoisted_ImportEnumTypeof_6 = new ObjectReporter(hoisted_ImportEnumTypeof_1, hoisted_ImportEnumTypeof_3, {
    "A": hoisted_ImportEnumTypeof_0.reportConstDecoder.bind(hoisted_ImportEnumTypeof_0)
}, null);
const hoisted_ImportEnumTypeof_7 = new ObjectSchema(hoisted_ImportEnumTypeof_2, null);
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
    "ImportEnumTypeof": hoisted_ImportEnumTypeof_4.validateObjectValidator.bind(hoisted_ImportEnumTypeof_4),
    "K": validators.K,
    "KABC": validators.KABC,
    "KDEF": validators.KDEF,
    "LevelAndDSettings": validators.LevelAndDSettings,
    "Mapped": validators.Mapped,
    "MappedOptional": validators.MappedOptional,
    "NonNegativeNumber": validators.NonNegativeNumber,
    "ObjectWithArr": hoisted_ObjectWithArr_8.validateObjectValidator.bind(hoisted_ObjectWithArr_8),
    "OmitSettings": validators.OmitSettings,
    "OnlyAKey": validators.OnlyAKey,
    "OtherEnum": validators.OtherEnum,
    "PartialObject": validators.PartialObject,
    "PartialRepro": validators.PartialRepro,
    "PartialSettings": validators.PartialSettings,
    "PublicUser": validators.PublicUser,
    "Repro1": validators.Repro1,
    "Req": validators.Req,
    "RequiredPartialObject": validators.RequiredPartialObject,
    "SettingsUpdate": validators.SettingsUpdate,
    "StringArrCodec": hoisted_StringArrCodec_1.validateArrayValidator.bind(hoisted_StringArrCodec_1),
    "T3": validators.T3,
    "TransportedValue": validators.TransportedValue,
    "TupleCodec": hoisted_TupleCodec_2.validateTupleValidator.bind(hoisted_TupleCodec_2),
    "TupleCodecRest": hoisted_TupleCodecRest_2.validateTupleValidator.bind(hoisted_TupleCodecRest_2),
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
    "ImportEnumTypeof": hoisted_ImportEnumTypeof_5.parseObjectParser.bind(hoisted_ImportEnumTypeof_5),
    "K": parsers.K,
    "KABC": parsers.KABC,
    "KDEF": parsers.KDEF,
    "LevelAndDSettings": parsers.LevelAndDSettings,
    "Mapped": parsers.Mapped,
    "MappedOptional": parsers.MappedOptional,
    "NonNegativeNumber": parsers.NonNegativeNumber,
    "ObjectWithArr": hoisted_ObjectWithArr_9.parseObjectParser.bind(hoisted_ObjectWithArr_9),
    "OmitSettings": parsers.OmitSettings,
    "OnlyAKey": parsers.OnlyAKey,
    "OtherEnum": parsers.OtherEnum,
    "PartialObject": parsers.PartialObject,
    "PartialRepro": parsers.PartialRepro,
    "PartialSettings": parsers.PartialSettings,
    "PublicUser": parsers.PublicUser,
    "Repro1": parsers.Repro1,
    "Req": parsers.Req,
    "RequiredPartialObject": parsers.RequiredPartialObject,
    "SettingsUpdate": parsers.SettingsUpdate,
    "StringArrCodec": hoisted_StringArrCodec_2.parseArrayParser.bind(hoisted_StringArrCodec_2),
    "T3": parsers.T3,
    "TransportedValue": parsers.TransportedValue,
    "TupleCodec": hoisted_TupleCodec_3.parseTupleParser.bind(hoisted_TupleCodec_3),
    "TupleCodecRest": hoisted_TupleCodecRest_3.parseTupleParser.bind(hoisted_TupleCodecRest_3),
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
    "ImportEnumTypeof": hoisted_ImportEnumTypeof_6.reportObjectReporter.bind(hoisted_ImportEnumTypeof_6),
    "K": reporters.K,
    "KABC": reporters.KABC,
    "KDEF": reporters.KDEF,
    "LevelAndDSettings": reporters.LevelAndDSettings,
    "Mapped": reporters.Mapped,
    "MappedOptional": reporters.MappedOptional,
    "NonNegativeNumber": reporters.NonNegativeNumber,
    "ObjectWithArr": hoisted_ObjectWithArr_10.reportObjectReporter.bind(hoisted_ObjectWithArr_10),
    "OmitSettings": reporters.OmitSettings,
    "OnlyAKey": reporters.OnlyAKey,
    "OtherEnum": reporters.OtherEnum,
    "PartialObject": reporters.PartialObject,
    "PartialRepro": reporters.PartialRepro,
    "PartialSettings": reporters.PartialSettings,
    "PublicUser": reporters.PublicUser,
    "Repro1": reporters.Repro1,
    "Req": reporters.Req,
    "RequiredPartialObject": reporters.RequiredPartialObject,
    "SettingsUpdate": reporters.SettingsUpdate,
    "StringArrCodec": hoisted_StringArrCodec_3.reportArrayReporter.bind(hoisted_StringArrCodec_3),
    "T3": reporters.T3,
    "TransportedValue": reporters.TransportedValue,
    "TupleCodec": hoisted_TupleCodec_4.reportTupleReporter.bind(hoisted_TupleCodec_4),
    "TupleCodecRest": hoisted_TupleCodecRest_4.reportTupleReporter.bind(hoisted_TupleCodecRest_4),
    "UnionWithEnumAccess": reporters.UnionWithEnumAccess,
    "User": reporters.User,
    "ValidCurrency": reporters.ValidCurrency,
    "Version": reporters.Version,
    "Version2": reporters.Version2
};
const buildSchemaInput = {
    "AObject": schemas.AObject,
    "AccessLevel": schemas.AccessLevel,
    "AccessLevelCodec": schemas.AccessLevel,
    "AccessLevelTpl": schemas.AccessLevelTpl,
    "AccessLevelTpl2": schemas.AccessLevelTpl2,
    "AllTs": schemas.AllTs,
    "AllTypes": schemas.AllTypes,
    "Arr2C": schemas.Arr2,
    "Arr3": schemas.Arr3,
    "AvatarSize": schemas.AvatarSize,
    "BObject": schemas.BObject,
    "BigIntCodec": hoisted_BigIntCodec_0.schemaCodecDecoder.bind(hoisted_BigIntCodec_0),
    "DiscriminatedUnion": schemas.DiscriminatedUnion,
    "DiscriminatedUnion2": schemas.DiscriminatedUnion2,
    "DiscriminatedUnion3": schemas.DiscriminatedUnion3,
    "DiscriminatedUnion4": schemas.DiscriminatedUnion4,
    "Extra": schemas.Extra,
    "ImportEnumTypeof": hoisted_ImportEnumTypeof_7.schemaObjectSchema.bind(hoisted_ImportEnumTypeof_7),
    "K": schemas.K,
    "KABC": schemas.KABC,
    "KDEF": schemas.KDEF,
    "LevelAndDSettings": schemas.LevelAndDSettings,
    "Mapped": schemas.Mapped,
    "MappedOptional": schemas.MappedOptional,
    "NonNegativeNumber": schemas.NonNegativeNumber,
    "ObjectWithArr": hoisted_ObjectWithArr_11.schemaObjectSchema.bind(hoisted_ObjectWithArr_11),
    "OmitSettings": schemas.OmitSettings,
    "OnlyAKey": schemas.OnlyAKey,
    "OtherEnum": schemas.OtherEnum,
    "PartialObject": schemas.PartialObject,
    "PartialRepro": schemas.PartialRepro,
    "PartialSettings": schemas.PartialSettings,
    "PublicUser": schemas.PublicUser,
    "Repro1": schemas.Repro1,
    "Req": schemas.Req,
    "RequiredPartialObject": schemas.RequiredPartialObject,
    "SettingsUpdate": schemas.SettingsUpdate,
    "StringArrCodec": hoisted_StringArrCodec_4.schemaArraySchema.bind(hoisted_StringArrCodec_4),
    "T3": schemas.T3,
    "TransportedValue": schemas.TransportedValue,
    "TupleCodec": hoisted_TupleCodec_5.schemaTupleSchema.bind(hoisted_TupleCodec_5),
    "TupleCodecRest": hoisted_TupleCodecRest_5.schemaTupleSchema.bind(hoisted_TupleCodecRest_5),
    "UnionWithEnumAccess": schemas.UnionWithEnumAccess,
    "User": schemas.User,
    "ValidCurrency": schemas.ValidCurrency,
    "Version": schemas.Version,
    "Version2": schemas.Version2
};



function buildParsers(args) {
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

    
    const schemaFn = buildSchemaInput[k];
    const schema = () => {
      const ctx = {
        path: [],
        seen: {},
      };
      return schemaFn(ctx);
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
        },
      );
    };
    decoders[k] = {
      parse,
      safeParse,
      zod,
      name: k,
      validate,
      schema,
    };
  });
  return decoders;
}

export default { buildParsers };