//@ts-nocheck
/* eslint-disable */


import {printErrors} from '@beff/client';
import {z} from 'zod';
import validatorsMod from "./validators.js"; const { registerCustomFormatter, ObjectValidator, ObjectParser, ArrayParser, ArrayValidator, CodecDecoder, StringWithFormatDecoder, AnyOfValidator, AnyOfParser, AllOfValidator, AllOfParser, TupleParser, TupleValidator, RegexDecoder, ConstDecoder, AnyOfConstsDecoder, AnyOfDiscriminatedParser, AnyOfDiscriminatedValidator, validateString, validateNumber, validateFunction, validateBoolean, validateAny, validateNull, validateNever, parseIdentity, reportString, reportNumber, reportNull, reportBoolean, reportAny, reportNever, reportFunction, ArrayReporter, ObjectReporter, TupleReporter, AnyOfReporter, AllOfReporter, AnyOfDiscriminatedReporter, schemaString, schemaNumber, schemaBoolean, schemaNull, schemaAny, schemaNever, schemaFunction, ArraySchema, ObjectSchema, TupleSchema, AnyOfSchema, AllOfSchema, AnyOfDiscriminatedSchema, validators, parsers, reporters, schemas, c } = validatorsMod;
const RequiredStringFormats = ["ValidCurrency"];
const buildValidatorsInput = {
    "A": validators.A
};
const buildParsersInput = {
    "A": parsers.A
};
const buildReportersInput = {
    "A": reporters.A
};
const buildSchemaInput = {
    "A": schemas.A
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
        }
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