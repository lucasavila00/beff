//@ts-nocheck
/* eslint-disable */


import {printErrors} from '@beff/client';
import {z} from 'zod';
import validatorsMod from "./validators.js"; const { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeFunction, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeNever, decodeConst, registerCustomFormatter, validators, c } = validatorsMod;
const RequiredCustomFormats = ["password","StartsWithA"];
const buildParsersInput = {
    "NotPublicRenamed": function(ctx, input) {
        return validators.NotPublic(ctx, input);
    },
    "Password": function(ctx, input) {
        return validators.Password(ctx, input);
    },
    "StartsWithA": function(ctx, input) {
        return validators.StartsWithA(ctx, input);
    },
    "User": function(ctx, input) {
        return validators.User(ctx, input);
    },
    "Users": function(ctx, input) {
        return decodeArray(ctx, input, hoisted_Users_0);
    },
    "float": function(ctx, input) {
        return decodeConst(ctx, input, 123.456);
    },
    "int": function(ctx, input) {
        return decodeConst(ctx, input, 123);
    },
    "union": function(ctx, input) {
        return validators.UnionNested(ctx, input);
    }
};
const hoisted_Users_0 = (ctx, input)=>(validators.User(ctx, input));




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
  
  Object.keys(buildParsersInput).forEach((k) => {
    
    let v = buildParsersInput[k];
    const safeParse = (input, options) => {
      const validatorCtx = {
        disallowExtraProperties: options?.disallowExtraProperties ?? false,
      };
      const new_value = v(validatorCtx, input);
      const validation_result = validatorCtx.errors;
      if (validation_result == null) {
        return { success: true, data: new_value };
      }
      const errorsSlice = validation_result.slice(0, 10);
      return { success: false, errors: errorsSlice };
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