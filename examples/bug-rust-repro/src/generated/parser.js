//@ts-nocheck
/* eslint-disable */


import {printErrors} from '@beff/client';
import {z} from 'zod';
import validatorsMod from "./validators.js"; const { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeConst, registerCustomFormatter, validators, c } = validatorsMod;
const RequiredCustomFormats = ["ValidCurrency"];
const buildParsersInput = {
    "A": function(ctx, input, required = true) {
        return validators.A(ctx, input, required);
    }
};




class BffParseError {
  constructor(errors) {
    this.errors = errors;
  }
}
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
    const safeParse = (input) => {
      const validatorCtx = {};
      const new_value = v(validatorCtx, input);
      const validation_result = validatorCtx.errors;
      if (validation_result == null) {
        return { success: true, data: new_value };
      }
      return { success: false, errors: validation_result };
    };
    const parse = (input) => {
      const safe = safeParse(input);
      if (safe.success) {
        return safe.data;
      }
      throw new BffParseError(safe.errors);
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