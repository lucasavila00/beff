//@ts-nocheck
/* eslint-disable */


import {printErrors} from '@beff/client';
import {z} from 'zod';
import validatorsMod from "./validators.js"; const { registerCustomFormatter, ObjectDecoder, ArrayDecoder, CodecDecoder, StringWithFormatDecoder, AnyOfDecoder, AllOfDecoder, TupleDecoder, RegexDecoder, ConstDecoder, AnyOfConstsDecoder, AnyOfDiscriminatedDecoder, validateString, validateNumber, validateFunction, validateBoolean, validateAny, validateNull, validateNever, validators, c } = validatorsMod;
const RequiredCustomFormats = ["password","StartsWithA"];
const hoisted_Users_0 = new ArrayDecoder(validators.User);
const hoisted_float_1 = new ConstDecoder(123.456);
const hoisted_int_2 = new ConstDecoder(123);
const buildValidatorsInput = {
    "NotPublicRenamed": validators.NotPublic,
    "Password": validators.Password,
    "StartsWithA": validators.StartsWithA,
    "User": validators.User,
    "Users": hoisted_Users_0.validateArrayDecoder.bind(hoisted_Users_0),
    "float": hoisted_float_1.validateConstDecoder.bind(hoisted_float_1),
    "int": hoisted_int_2.validateConstDecoder.bind(hoisted_int_2),
    "union": validators.UnionNested
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