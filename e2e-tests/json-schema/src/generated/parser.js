//@ts-nocheck

import {printErrors} from '@beff/client';
import {z} from 'zod';
import validatorsMod from "./validators.js"; const { registerStringFormatter, registerNumberFormatter, ObjectValidator, ObjectParser, ArrayParser, ArrayValidator, CodecDecoder, StringWithFormatsDecoder, NumberWithFormatDecoder, AnyOfValidator, AnyOfParser, AllOfValidator, AllOfParser, TupleParser, TupleValidator, RegexDecoder, ConstDecoder, AnyOfConstsDecoder, AnyOfDiscriminatedParser, AnyOfDiscriminatedValidator, validateString, validateNumber, validateFunction, validateBoolean, validateAny, validateNull, validateNever, parseIdentity, reportString, reportNumber, reportNull, reportBoolean, reportAny, reportNever, reportFunction, ArrayReporter, ObjectReporter, TupleReporter, AnyOfReporter, AllOfReporter, AnyOfDiscriminatedReporter, schemaString, schemaNumber, schemaBoolean, schemaNull, schemaAny, schemaNever, schemaFunction, ArraySchema, ObjectSchema, TupleSchema, AnyOfSchema, AllOfSchema, AnyOfDiscriminatedSchema, validators, parsers, reporters, schemas, c } = validatorsMod;
const RequiredStringFormats = ["ValidCurrency"];
const RequiredNumberFormats = [];
const hoisted_object_0 = {};
const hoisted_object_1 = {};
const hoisted_object_2 = validateAny;
const hoisted_object_3 = new ObjectValidator(hoisted_object_0, hoisted_object_2);
const hoisted_object_4 = new ObjectParser({}, parseIdentity);
const hoisted_object_5 = new ObjectReporter(hoisted_object_0, hoisted_object_2, {}, reportAny);
const hoisted_object_6 = new ObjectSchema(hoisted_object_1, schemaAny);
const hoisted_anyArray_0 = validateAny;
const hoisted_anyArray_1 = new ArrayValidator(hoisted_anyArray_0);
const hoisted_anyArray_2 = new ArrayParser(parseIdentity);
const hoisted_anyArray_3 = new ArrayReporter(hoisted_anyArray_0, reportAny);
const hoisted_anyArray_4 = new ArraySchema(schemaAny);
const buildValidatorsInput = {
    "DiscriminatedUnion": validators.DiscriminatedUnion,
    "InvalidSchemaWithBigInt": validators.InvalidSchemaWithBigInt,
    "InvalidSchemaWithDate": validators.InvalidSchemaWithDate,
    "NonEmptyString": validators.NonEmptyString,
    "RecursiveTree": validators.RecursiveTree,
    "SemVer": validators.SemVer,
    "T1": validators.T1,
    "T2": validators.T2,
    "T3": validators.T3,
    "ValidCurrency": validators.ValidCurrency,
    "any": validateAny,
    "anyArray": hoisted_anyArray_1.validateArrayValidator.bind(hoisted_anyArray_1),
    "boolean": validateBoolean,
    "null": validateNull,
    "number": validateNumber,
    "object": hoisted_object_3.validateObjectValidator.bind(hoisted_object_3),
    "string": validateString,
    "undefined": validateNull
};
const buildParsersInput = {
    "DiscriminatedUnion": parsers.DiscriminatedUnion,
    "InvalidSchemaWithBigInt": parsers.InvalidSchemaWithBigInt,
    "InvalidSchemaWithDate": parsers.InvalidSchemaWithDate,
    "NonEmptyString": parsers.NonEmptyString,
    "RecursiveTree": parsers.RecursiveTree,
    "SemVer": parsers.SemVer,
    "T1": parsers.T1,
    "T2": parsers.T2,
    "T3": parsers.T3,
    "ValidCurrency": parsers.ValidCurrency,
    "any": parseIdentity,
    "anyArray": hoisted_anyArray_2.parseArrayParser.bind(hoisted_anyArray_2),
    "boolean": parseIdentity,
    "null": parseIdentity,
    "number": parseIdentity,
    "object": hoisted_object_4.parseObjectParser.bind(hoisted_object_4),
    "string": parseIdentity,
    "undefined": parseIdentity
};
const buildReportersInput = {
    "DiscriminatedUnion": reporters.DiscriminatedUnion,
    "InvalidSchemaWithBigInt": reporters.InvalidSchemaWithBigInt,
    "InvalidSchemaWithDate": reporters.InvalidSchemaWithDate,
    "NonEmptyString": reporters.NonEmptyString,
    "RecursiveTree": reporters.RecursiveTree,
    "SemVer": reporters.SemVer,
    "T1": reporters.T1,
    "T2": reporters.T2,
    "T3": reporters.T3,
    "ValidCurrency": reporters.ValidCurrency,
    "any": reportAny,
    "anyArray": hoisted_anyArray_3.reportArrayReporter.bind(hoisted_anyArray_3),
    "boolean": reportBoolean,
    "null": reportNull,
    "number": reportNumber,
    "object": hoisted_object_5.reportObjectReporter.bind(hoisted_object_5),
    "string": reportString,
    "undefined": reportNull
};
const buildSchemaInput = {
    "DiscriminatedUnion": schemas.DiscriminatedUnion,
    "InvalidSchemaWithBigInt": schemas.InvalidSchemaWithBigInt,
    "InvalidSchemaWithDate": schemas.InvalidSchemaWithDate,
    "NonEmptyString": schemas.NonEmptyString,
    "RecursiveTree": schemas.RecursiveTree,
    "SemVer": schemas.SemVer,
    "T1": schemas.T1,
    "T2": schemas.T2,
    "T3": schemas.T3,
    "ValidCurrency": schemas.ValidCurrency,
    "any": schemaAny,
    "anyArray": hoisted_anyArray_4.schemaArraySchema.bind(hoisted_anyArray_4),
    "boolean": schemaBoolean,
    "null": schemaNull,
    "number": schemaNumber,
    "object": hoisted_object_6.schemaObjectSchema.bind(hoisted_object_6),
    "string": schemaString,
    "undefined": schemaNull
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