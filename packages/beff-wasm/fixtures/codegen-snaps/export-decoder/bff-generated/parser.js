//@ts-nocheck
/* eslint-disable */


import {printErrors} from '@beff/client';
import {z} from 'zod';
import validatorsMod from "./validators.js"; const { registerCustomFormatter, ObjectValidator, ObjectParser, ArrayParser, ArrayValidator, CodecDecoder, StringWithFormatDecoder, AnyOfValidator, AnyOfParser, AllOfValidator, AllOfParser, TupleParser, TupleValidator, RegexDecoder, ConstDecoder, AnyOfConstsDecoder, AnyOfDiscriminatedDecoder, validateString, validateNumber, validateFunction, validateBoolean, validateAny, validateNull, validateNever, parseIdentity, AnyOfReporter, AllOfReporter, reportString, reportNumber, reportNull, reportBoolean, reportAny, reportNever, reportFunction, ArrayReporter, ObjectReporter, TupleReporter, validators, parsers, reporters, c } = validatorsMod;
const RequiredCustomFormats = ["password","StartsWithA"];
const hoisted_Users_0 = new ArrayValidator(validators.User);
const hoisted_Users_1 = new ArrayParser(parsers.User);
const hoisted_Users_2 = new ArrayReporter(reporters.User);
const hoisted_float_3 = new ConstDecoder(123.456);
const hoisted_int_4 = new ConstDecoder(123);
const buildValidatorsInput = {
    "NotPublicRenamed": validators.NotPublic,
    "Password": validators.Password,
    "StartsWithA": validators.StartsWithA,
    "User": validators.User,
    "Users": hoisted_Users_0.validateArrayValidator.bind(hoisted_Users_0),
    "float": hoisted_float_3.validateConstDecoder.bind(hoisted_float_3),
    "int": hoisted_int_4.validateConstDecoder.bind(hoisted_int_4),
    "union": validators.UnionNested
};
const buildParsersInput = {
    "NotPublicRenamed": parsers.NotPublic,
    "Password": parsers.Password,
    "StartsWithA": parsers.StartsWithA,
    "User": parsers.User,
    "Users": hoisted_Users_1.parseArrayParser.bind(hoisted_Users_1),
    "float": hoisted_float_3.parseConstDecoder.bind(hoisted_float_3),
    "int": hoisted_int_4.parseConstDecoder.bind(hoisted_int_4),
    "union": parsers.UnionNested
};
const buildReportersInput = {
    "NotPublicRenamed": reporters.NotPublic,
    "Password": reporters.Password,
    "StartsWithA": reporters.StartsWithA,
    "User": reporters.User,
    "Users": hoisted_Users_2.reportArrayReporter.bind(hoisted_Users_2),
    "float": hoisted_float_3.reportConstDecoder.bind(hoisted_float_3),
    "int": hoisted_int_4.reportConstDecoder.bind(hoisted_int_4),
    "union": reporters.UnionNested
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
      let ctx = { path: [] };
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