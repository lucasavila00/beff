//@ts-nocheck

import {printErrors} from '@beff/client';
import {z} from 'zod';
import validatorsMod from "./validators.js"; const { registerStringFormatter, registerNumberFormatter, ObjectValidator, ObjectParser, MappedRecordParser, MappedRecordValidator, ArrayParser, ArrayValidator, CodecDecoder, StringWithFormatsDecoder, NumberWithFormatsDecoder, AnyOfValidator, AnyOfParser, AllOfValidator, AllOfParser, TupleParser, TupleValidator, RegexDecoder, ConstDecoder, AnyOfConstsDecoder, AnyOfDiscriminatedParser, AnyOfDiscriminatedValidator, validateString, validateNumber, validateFunction, validateBoolean, validateAny, validateNull, validateNever, parseIdentity, reportString, reportNumber, reportNull, reportBoolean, reportAny, reportNever, reportFunction, ArrayReporter, ObjectReporter, TupleReporter, AnyOfReporter, AllOfReporter, AnyOfDiscriminatedReporter, MappedRecordReporter, schemaString, schemaNumber, schemaBoolean, schemaNull, schemaAny, schemaNever, schemaFunction, ArraySchema, ObjectSchema, TupleSchema, AnyOfSchema, AllOfSchema, AnyOfDiscriminatedSchema, MappedRecordSchema, describeString, describeNumber, describeBoolean, describeNull, describeAny, describeNever, describeFunction, ArrayDescribe, ObjectDescribe, TupleDescribe, AnyOfDescribe, AllOfDescribe, AnyOfDiscriminatedDescribe, MappedRecordDescribe, wrap_describe, validators, parsers, reporters, schemas, describers, c } = validatorsMod;
const RequiredStringFormats = ["ValidCurrency","UserId","ReadAuthorizedUserId","WriteAuthorizedUserId"];
const RequiredNumberFormats = ["NonNegativeNumber","NonInfiniteNumber","Rate"];
const hoisted_ObjectWithArr_0 = validateString;
const hoisted_ObjectWithArr_1 = new ArrayValidator(hoisted_ObjectWithArr_0);
const hoisted_ObjectWithArr_2 = new ArrayParser(parseIdentity);
const hoisted_ObjectWithArr_3 = new ArrayReporter(hoisted_ObjectWithArr_0, reportString);
const hoisted_ObjectWithArr_4 = new ArraySchema(schemaString);
const hoisted_ObjectWithArr_5 = new ArrayDescribe(describeString);
const hoisted_ObjectWithArr_6 = {
    "a": hoisted_ObjectWithArr_1.validateArrayValidator.bind(hoisted_ObjectWithArr_1)
};
const hoisted_ObjectWithArr_7 = {
    "a": hoisted_ObjectWithArr_4.schemaArraySchema.bind(hoisted_ObjectWithArr_4)
};
const hoisted_ObjectWithArr_8 = {
    "a": hoisted_ObjectWithArr_5.describeArrayDescribe.bind(hoisted_ObjectWithArr_5)
};
const hoisted_ObjectWithArr_9 = hoisted_ObjectWithArr_8;
const hoisted_ObjectWithArr_10 = null;
const hoisted_ObjectWithArr_11 = new ObjectValidator(hoisted_ObjectWithArr_6, hoisted_ObjectWithArr_10);
const hoisted_ObjectWithArr_12 = new ObjectParser({
    "a": hoisted_ObjectWithArr_2.parseArrayParser.bind(hoisted_ObjectWithArr_2)
}, null);
const hoisted_ObjectWithArr_13 = new ObjectReporter(hoisted_ObjectWithArr_6, hoisted_ObjectWithArr_10, {
    "a": hoisted_ObjectWithArr_3.reportArrayReporter.bind(hoisted_ObjectWithArr_3)
}, null);
const hoisted_ObjectWithArr_14 = new ObjectSchema(hoisted_ObjectWithArr_7, null);
const hoisted_ObjectWithArr_15 = new ObjectDescribe(hoisted_ObjectWithArr_9, null);
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
const hoisted_TupleCodec_6 = new TupleDescribe([
    describeNumber,
    describeNumber,
    describeNumber
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
const hoisted_TupleCodecRest_6 = new TupleDescribe([
    describeNumber,
    describeNumber
], describeString);
const hoisted_StringArrCodec_0 = validateString;
const hoisted_StringArrCodec_1 = new ArrayValidator(hoisted_StringArrCodec_0);
const hoisted_StringArrCodec_2 = new ArrayParser(parseIdentity);
const hoisted_StringArrCodec_3 = new ArrayReporter(hoisted_StringArrCodec_0, reportString);
const hoisted_StringArrCodec_4 = new ArraySchema(schemaString);
const hoisted_StringArrCodec_5 = new ArrayDescribe(describeString);
const hoisted_ImportEnumTypeof_0 = new ConstDecoder("a");
const hoisted_ImportEnumTypeof_1 = {
    "A": hoisted_ImportEnumTypeof_0.validateConstDecoder.bind(hoisted_ImportEnumTypeof_0)
};
const hoisted_ImportEnumTypeof_2 = {
    "A": hoisted_ImportEnumTypeof_0.schemaConstDecoder.bind(hoisted_ImportEnumTypeof_0)
};
const hoisted_ImportEnumTypeof_3 = {
    "A": hoisted_ImportEnumTypeof_0.describeConstDecoder.bind(hoisted_ImportEnumTypeof_0)
};
const hoisted_ImportEnumTypeof_4 = hoisted_ImportEnumTypeof_3;
const hoisted_ImportEnumTypeof_5 = null;
const hoisted_ImportEnumTypeof_6 = new ObjectValidator(hoisted_ImportEnumTypeof_1, hoisted_ImportEnumTypeof_5);
const hoisted_ImportEnumTypeof_7 = new ObjectParser({
    "A": hoisted_ImportEnumTypeof_0.parseConstDecoder.bind(hoisted_ImportEnumTypeof_0)
}, null);
const hoisted_ImportEnumTypeof_8 = new ObjectReporter(hoisted_ImportEnumTypeof_1, hoisted_ImportEnumTypeof_5, {
    "A": hoisted_ImportEnumTypeof_0.reportConstDecoder.bind(hoisted_ImportEnumTypeof_0)
}, null);
const hoisted_ImportEnumTypeof_9 = new ObjectSchema(hoisted_ImportEnumTypeof_2, null);
const hoisted_ImportEnumTypeof_10 = new ObjectDescribe(hoisted_ImportEnumTypeof_4, null);
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
    "CurrencyPrices": validators.CurrencyPrices,
    "DiscriminatedUnion": validators.DiscriminatedUnion,
    "DiscriminatedUnion2": validators.DiscriminatedUnion2,
    "DiscriminatedUnion3": validators.DiscriminatedUnion3,
    "DiscriminatedUnion4": validators.DiscriminatedUnion4,
    "Extra": validators.Extra,
    "ImportEnumTypeof": hoisted_ImportEnumTypeof_6.validateObjectValidator.bind(hoisted_ImportEnumTypeof_6),
    "K": validators.K,
    "KABC": validators.KABC,
    "KDEF": validators.KDEF,
    "LevelAndDSettings": validators.LevelAndDSettings,
    "Mapped": validators.Mapped,
    "MappedOptional": validators.MappedOptional,
    "NonInfiniteNumber": validators.NonInfiniteNumber,
    "NonNegativeNumber": validators.NonNegativeNumber,
    "ObjectWithArr": hoisted_ObjectWithArr_11.validateObjectValidator.bind(hoisted_ObjectWithArr_11),
    "OmitSettings": validators.OmitSettings,
    "OnlyAKey": validators.OnlyAKey,
    "OtherEnum": validators.OtherEnum,
    "PartialObject": validators.PartialObject,
    "PartialRepro": validators.PartialRepro,
    "PartialSettings": validators.PartialSettings,
    "PublicUser": validators.PublicUser,
    "Rate": validators.Rate,
    "ReadAuthorizedUserId": validators.ReadAuthorizedUserId,
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
    "UserId": validators.UserId,
    "ValidCurrency": validators.ValidCurrency,
    "Version": validators.Version,
    "Version2": validators.Version2,
    "WriteAuthorizedUserId": validators.WriteAuthorizedUserId
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
    "CurrencyPrices": parsers.CurrencyPrices,
    "DiscriminatedUnion": parsers.DiscriminatedUnion,
    "DiscriminatedUnion2": parsers.DiscriminatedUnion2,
    "DiscriminatedUnion3": parsers.DiscriminatedUnion3,
    "DiscriminatedUnion4": parsers.DiscriminatedUnion4,
    "Extra": parsers.Extra,
    "ImportEnumTypeof": hoisted_ImportEnumTypeof_7.parseObjectParser.bind(hoisted_ImportEnumTypeof_7),
    "K": parsers.K,
    "KABC": parsers.KABC,
    "KDEF": parsers.KDEF,
    "LevelAndDSettings": parsers.LevelAndDSettings,
    "Mapped": parsers.Mapped,
    "MappedOptional": parsers.MappedOptional,
    "NonInfiniteNumber": parsers.NonInfiniteNumber,
    "NonNegativeNumber": parsers.NonNegativeNumber,
    "ObjectWithArr": hoisted_ObjectWithArr_12.parseObjectParser.bind(hoisted_ObjectWithArr_12),
    "OmitSettings": parsers.OmitSettings,
    "OnlyAKey": parsers.OnlyAKey,
    "OtherEnum": parsers.OtherEnum,
    "PartialObject": parsers.PartialObject,
    "PartialRepro": parsers.PartialRepro,
    "PartialSettings": parsers.PartialSettings,
    "PublicUser": parsers.PublicUser,
    "Rate": parsers.Rate,
    "ReadAuthorizedUserId": parsers.ReadAuthorizedUserId,
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
    "UserId": parsers.UserId,
    "ValidCurrency": parsers.ValidCurrency,
    "Version": parsers.Version,
    "Version2": parsers.Version2,
    "WriteAuthorizedUserId": parsers.WriteAuthorizedUserId
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
    "CurrencyPrices": reporters.CurrencyPrices,
    "DiscriminatedUnion": reporters.DiscriminatedUnion,
    "DiscriminatedUnion2": reporters.DiscriminatedUnion2,
    "DiscriminatedUnion3": reporters.DiscriminatedUnion3,
    "DiscriminatedUnion4": reporters.DiscriminatedUnion4,
    "Extra": reporters.Extra,
    "ImportEnumTypeof": hoisted_ImportEnumTypeof_8.reportObjectReporter.bind(hoisted_ImportEnumTypeof_8),
    "K": reporters.K,
    "KABC": reporters.KABC,
    "KDEF": reporters.KDEF,
    "LevelAndDSettings": reporters.LevelAndDSettings,
    "Mapped": reporters.Mapped,
    "MappedOptional": reporters.MappedOptional,
    "NonInfiniteNumber": reporters.NonInfiniteNumber,
    "NonNegativeNumber": reporters.NonNegativeNumber,
    "ObjectWithArr": hoisted_ObjectWithArr_13.reportObjectReporter.bind(hoisted_ObjectWithArr_13),
    "OmitSettings": reporters.OmitSettings,
    "OnlyAKey": reporters.OnlyAKey,
    "OtherEnum": reporters.OtherEnum,
    "PartialObject": reporters.PartialObject,
    "PartialRepro": reporters.PartialRepro,
    "PartialSettings": reporters.PartialSettings,
    "PublicUser": reporters.PublicUser,
    "Rate": reporters.Rate,
    "ReadAuthorizedUserId": reporters.ReadAuthorizedUserId,
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
    "UserId": reporters.UserId,
    "ValidCurrency": reporters.ValidCurrency,
    "Version": reporters.Version,
    "Version2": reporters.Version2,
    "WriteAuthorizedUserId": reporters.WriteAuthorizedUserId
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
    "CurrencyPrices": schemas.CurrencyPrices,
    "DiscriminatedUnion": schemas.DiscriminatedUnion,
    "DiscriminatedUnion2": schemas.DiscriminatedUnion2,
    "DiscriminatedUnion3": schemas.DiscriminatedUnion3,
    "DiscriminatedUnion4": schemas.DiscriminatedUnion4,
    "Extra": schemas.Extra,
    "ImportEnumTypeof": hoisted_ImportEnumTypeof_9.schemaObjectSchema.bind(hoisted_ImportEnumTypeof_9),
    "K": schemas.K,
    "KABC": schemas.KABC,
    "KDEF": schemas.KDEF,
    "LevelAndDSettings": schemas.LevelAndDSettings,
    "Mapped": schemas.Mapped,
    "MappedOptional": schemas.MappedOptional,
    "NonInfiniteNumber": schemas.NonInfiniteNumber,
    "NonNegativeNumber": schemas.NonNegativeNumber,
    "ObjectWithArr": hoisted_ObjectWithArr_14.schemaObjectSchema.bind(hoisted_ObjectWithArr_14),
    "OmitSettings": schemas.OmitSettings,
    "OnlyAKey": schemas.OnlyAKey,
    "OtherEnum": schemas.OtherEnum,
    "PartialObject": schemas.PartialObject,
    "PartialRepro": schemas.PartialRepro,
    "PartialSettings": schemas.PartialSettings,
    "PublicUser": schemas.PublicUser,
    "Rate": schemas.Rate,
    "ReadAuthorizedUserId": schemas.ReadAuthorizedUserId,
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
    "UserId": schemas.UserId,
    "ValidCurrency": schemas.ValidCurrency,
    "Version": schemas.Version,
    "Version2": schemas.Version2,
    "WriteAuthorizedUserId": schemas.WriteAuthorizedUserId
};
const buildDescribeInput = {
    "PartialRepro": wrap_describe(describers.PartialRepro, "PartialRepro"),
    "TransportedValue": wrap_describe(describers.TransportedValue, "TransportedValue"),
    "OnlyAKey": wrap_describe(describers.OnlyAKey, "OnlyAKey"),
    "ObjectWithArr": hoisted_ObjectWithArr_15.describeObjectDescribe.bind(hoisted_ObjectWithArr_15),
    "BigIntCodec": hoisted_BigIntCodec_0.describeCodecDecoder.bind(hoisted_BigIntCodec_0),
    "TupleCodec": hoisted_TupleCodec_6.describeTupleDescribe.bind(hoisted_TupleCodec_6),
    "TupleCodecRest": hoisted_TupleCodecRest_6.describeTupleDescribe.bind(hoisted_TupleCodecRest_6),
    "StringArrCodec": hoisted_StringArrCodec_5.describeArrayDescribe.bind(hoisted_StringArrCodec_5),
    "AllTs": wrap_describe(describers.AllTs, "AllTs"),
    "AObject": wrap_describe(describers.AObject, "AObject"),
    "Version": wrap_describe(describers.Version, "Version"),
    "Version2": wrap_describe(describers.Version2, "Version2"),
    "AccessLevelTpl2": wrap_describe(describers.AccessLevelTpl2, "AccessLevelTpl2"),
    "AccessLevelTpl": wrap_describe(describers.AccessLevelTpl, "AccessLevelTpl"),
    "Arr3": wrap_describe(describers.Arr3, "Arr3"),
    "OmitSettings": wrap_describe(describers.OmitSettings, "OmitSettings"),
    "RequiredPartialObject": wrap_describe(describers.RequiredPartialObject, "RequiredPartialObject"),
    "LevelAndDSettings": wrap_describe(describers.LevelAndDSettings, "LevelAndDSettings"),
    "PartialSettings": wrap_describe(describers.PartialSettings, "PartialSettings"),
    "Extra": wrap_describe(describers.Extra, "Extra"),
    "User": wrap_describe(describers.User, "User"),
    "PublicUser": wrap_describe(describers.PublicUser, "PublicUser"),
    "Req": wrap_describe(describers.Req, "Req"),
    "Repro1": wrap_describe(describers.Repro1, "Repro1"),
    "SettingsUpdate": wrap_describe(describers.SettingsUpdate, "SettingsUpdate"),
    "Mapped": wrap_describe(describers.Mapped, "Mapped"),
    "MappedOptional": wrap_describe(describers.MappedOptional, "MappedOptional"),
    "PartialObject": wrap_describe(describers.PartialObject, "PartialObject"),
    "DiscriminatedUnion": wrap_describe(describers.DiscriminatedUnion, "DiscriminatedUnion"),
    "DiscriminatedUnion2": wrap_describe(describers.DiscriminatedUnion2, "DiscriminatedUnion2"),
    "DiscriminatedUnion3": wrap_describe(describers.DiscriminatedUnion3, "DiscriminatedUnion3"),
    "DiscriminatedUnion4": wrap_describe(describers.DiscriminatedUnion4, "DiscriminatedUnion4"),
    "AllTypes": wrap_describe(describers.AllTypes, "AllTypes"),
    "AccessLevel": wrap_describe(describers.AccessLevel, "AccessLevel"),
    "OtherEnum": wrap_describe(describers.OtherEnum, "OtherEnum"),
    "Arr2C": wrap_describe(describers.Arr2, "Arr2"),
    "ValidCurrency": wrap_describe(describers.ValidCurrency, "ValidCurrency"),
    "UnionWithEnumAccess": wrap_describe(describers.UnionWithEnumAccess, "UnionWithEnumAccess"),
    "T3": wrap_describe(describers.T3, "T3"),
    "AccessLevelCodec": wrap_describe(describers.AccessLevel, "AccessLevel"),
    "AvatarSize": wrap_describe(describers.AvatarSize, "AvatarSize"),
    "BObject": wrap_describe(describers.BObject, "BObject"),
    "ImportEnumTypeof": hoisted_ImportEnumTypeof_10.describeObjectDescribe.bind(hoisted_ImportEnumTypeof_10),
    "KDEF": wrap_describe(describers.KDEF, "KDEF"),
    "KABC": wrap_describe(describers.KABC, "KABC"),
    "K": wrap_describe(describers.K, "K"),
    "NonNegativeNumber": wrap_describe(describers.NonNegativeNumber, "NonNegativeNumber"),
    "NonInfiniteNumber": wrap_describe(describers.NonInfiniteNumber, "NonInfiniteNumber"),
    "Rate": wrap_describe(describers.Rate, "Rate"),
    "UserId": wrap_describe(describers.UserId, "UserId"),
    "ReadAuthorizedUserId": wrap_describe(describers.ReadAuthorizedUserId, "ReadAuthorizedUserId"),
    "WriteAuthorizedUserId": wrap_describe(describers.WriteAuthorizedUserId, "WriteAuthorizedUserId"),
    "CurrencyPrices": wrap_describe(describers.CurrencyPrices, "CurrencyPrices")
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

    
    const describeFn = buildDescribeInput[k];
    const describe = () => {
      const ctx = {
        deps: {},
        deps_counter: {},
        measure: true,
      };
      let out = describeFn(ctx);
      ctx["deps"] = {};
      ctx["measure"] = false;
      out = describeFn(ctx);
      let sortedDepsKeys = Object.keys(ctx.deps).sort();
      
      
      
      
      const depsPart = sortedDepsKeys
        .map((key) => {
          return `type ${key} = ${ctx.deps[key]};`;
        })
        .join("\n\n");
      
      
      
      const outPart = `type Codec${k} = ${out};`;
      return [depsPart, outPart].filter((it) => it != null && it.length > 0).join("\n\n");
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
      describe,
    };
  });
  return decoders;
}

export default { buildParsers };