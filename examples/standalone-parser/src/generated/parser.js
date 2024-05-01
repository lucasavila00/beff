//@ts-nocheck
/* eslint-disable */


import {printErrors} from '@beff/client';
import {z} from 'zod';
import validatorsMod from "./validators.js"; const { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeConst, registerCustomFormatter, validators, c } = validatorsMod;
const RequiredCustomFormats = ["ValidCurrency"];
const buildParsersInput = {
    "AccessLevel": function(ctx, input, required = true) {
        return validators.AccessLevel(ctx, input, required);
    },
    "AllTypes": function(ctx, input, required = true) {
        return validators.AllTypes(ctx, input, required);
    },
    "Arr2C": function(ctx, input, required = true) {
        return validators.Arr2(ctx, input, required);
    },
    "Arr3": function(ctx, input, required = true) {
        return validators.Arr3(ctx, input, required);
    },
    "DiscriminatedUnion": function(ctx, input, required = true) {
        return validators.DiscriminatedUnion(ctx, input, required);
    },
    "DiscriminatedUnion2": function(ctx, input, required = true) {
        return validators.DiscriminatedUnion2(ctx, input, required);
    },
    "DiscriminatedUnion3": function(ctx, input, required = true) {
        return validators.DiscriminatedUnion3(ctx, input, required);
    },
    "DiscriminatedUnion4": function(ctx, input, required = true) {
        return validators.DiscriminatedUnion4(ctx, input, required);
    },
    "Extra": function(ctx, input, required = true) {
        return validators.Extra(ctx, input, required);
    },
    "LevelAndDSettings": function(ctx, input, required = true) {
        return validators.LevelAndDSettings(ctx, input, required);
    },
    "Mapped": function(ctx, input, required = true) {
        return validators.Mapped(ctx, input, required);
    },
    "MappedOptional": function(ctx, input, required = true) {
        return validators.MappedOptional(ctx, input, required);
    },
    "OmitSettings": function(ctx, input, required = true) {
        return validators.OmitSettings(ctx, input, required);
    },
    "OtherEnum": function(ctx, input, required = true) {
        return validators.OtherEnum(ctx, input, required);
    },
    "PartialObject": function(ctx, input, required = true) {
        return validators.PartialObject(ctx, input, required);
    },
    "PartialSettings": function(ctx, input, required = true) {
        return validators.PartialSettings(ctx, input, required);
    },
    "PublicUser": function(ctx, input, required = true) {
        return validators.PublicUser(ctx, input, required);
    },
    "Repro1": function(ctx, input, required = true) {
        return validators.Repro1(ctx, input, required);
    },
    "Req": function(ctx, input, required = true) {
        return validators.Req(ctx, input, required);
    },
    "RequiredPartialObject": function(ctx, input, required = true) {
        return validators.RequiredPartialObject(ctx, input, required);
    },
    "SettingsUpdate": function(ctx, input, required = true) {
        return validators.SettingsUpdate(ctx, input, required);
    },
    "UnionWithEnumAccess": function(ctx, input, required = true) {
        return validators.UnionWithEnumAccess(ctx, input, required);
    },
    "User": function(ctx, input, required = true) {
        return validators.User(ctx, input, required);
    },
    "ValidCurrency": function(ctx, input, required = true) {
        return validators.ValidCurrency(ctx, input, required);
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