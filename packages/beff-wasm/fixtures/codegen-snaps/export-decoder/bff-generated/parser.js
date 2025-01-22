//@ts-nocheck
/* eslint-disable */


import {printErrors} from '@beff/client';
import {z} from 'zod';
import validatorsMod from "./validators.js"; const { ObjectDecoder, ArrayDecoder, decodeString, decodeNumber, CodecDecoder, decodeFunction, StringWithFormatDecoder, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, TupleDecoder, decodeNull, decodeNever, RegexDecoder, ConstDecoder, registerCustomFormatter, validators, c } = validatorsMod;
const RequiredCustomFormats = ["password","StartsWithA"];
const buildParsersInput = {
    "NotPublicRenamed": function(ctx, input) {
        return ((ctx, input)=>(validators.NotPublic(ctx, input)))(ctx, input);
    },
    "Password": function(ctx, input) {
        return ((ctx, input)=>(validators.Password(ctx, input)))(ctx, input);
    },
    "StartsWithA": function(ctx, input) {
        return ((ctx, input)=>(validators.StartsWithA(ctx, input)))(ctx, input);
    },
    "User": function(ctx, input) {
        return ((ctx, input)=>(validators.User(ctx, input)))(ctx, input);
    },
    "Users": function(ctx, input) {
        return (hoisted_Users_0.decode.bind(hoisted_Users_0))(ctx, input);
    },
    "float": function(ctx, input) {
        return (hoisted_float_1.decode.bind(hoisted_float_1))(ctx, input);
    },
    "int": function(ctx, input) {
        return (hoisted_int_2.decode.bind(hoisted_int_2))(ctx, input);
    },
    "union": function(ctx, input) {
        return ((ctx, input)=>(validators.UnionNested(ctx, input)))(ctx, input);
    }
};
const hoisted_Users_0 = new ArrayDecoder((ctx, input)=>(validators.User(ctx, input)));
const hoisted_float_1 = new ConstDecoder(123.456);
const hoisted_int_2 = new ConstDecoder(123);




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