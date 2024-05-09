//@ts-nocheck
/* eslint-disable */


import {printErrors} from '@beff/client';
import {z} from 'zod';
import validatorsMod from "./validators.js"; const { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeConst, registerCustomFormatter, validators, c } = validatorsMod;
const RequiredCustomFormats = ["password","StartsWithA"];
const buildParsersInput = {
    "NotPublicRenamed": function(ctx, input, required = true) {
        return validators.NotPublic(ctx, input, required);
    },
    "Password": function(ctx, input, required = true) {
        return validators.Password(ctx, input, required);
    },
    "StartsWithA": function(ctx, input, required = true) {
        return validators.StartsWithA(ctx, input, required);
    },
    "User": function(ctx, input, required = true) {
        return validators.User(ctx, input, required);
    },
    "Users": function(ctx, input, required = true) {
        return decodeArray(ctx, input, required, (ctx, input)=>(validators.User(ctx, input, true)));
    },
    "float": function(ctx, input, required = true) {
        return decodeConst(ctx, input, required, 123.456);
    },
    "int": function(ctx, input, required = true) {
        return decodeConst(ctx, input, required, 123);
    },
    "union": function(ctx, input, required = true) {
        return validators.UnionNested(ctx, input, required);
    }
};




function buildParsers(args) {

  const customFormats = args?.customFormats ?? {}
  
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
      return { success: false, errors: validation_result };
    };
    const parse = (input, options) => {
      const safe = safeParse(input, options);
      if (safe.success) {
        return safe.data;
      }
      throw safe
    };
    const zod = () => {
      
      return z.custom(data => safeParse(data).success, val => {
        const errors = safeParse(val).errors;
        
        return printErrors(errors, [])
      })
    }
    decoders[k] = {
      parse,
      safeParse,
      zod
    };
  });
  return decoders;
}

export default { buildParsers };