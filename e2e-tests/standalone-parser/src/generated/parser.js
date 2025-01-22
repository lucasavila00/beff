//@ts-nocheck
/* eslint-disable */


import {printErrors} from '@beff/client';
import {z} from 'zod';
import validatorsMod from "./validators.js"; const { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeFunction, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeNever, RegexDecoder, ConstDecoder, registerCustomFormatter, validators, c } = validatorsMod;
const RequiredCustomFormats = ["ValidCurrency"];
const buildParsersInput = {
    "AObject": function(ctx, input) {
        return ((ctx, input)=>(validators.AObject(ctx, input)))(ctx, input);
    },
    "AccessLevel": function(ctx, input) {
        return ((ctx, input)=>(validators.AccessLevel(ctx, input)))(ctx, input);
    },
    "AccessLevelCodec": function(ctx, input) {
        return ((ctx, input)=>(validators.AccessLevel(ctx, input)))(ctx, input);
    },
    "AccessLevelTpl": function(ctx, input) {
        return ((ctx, input)=>(validators.AccessLevelTpl(ctx, input)))(ctx, input);
    },
    "AccessLevelTpl2": function(ctx, input) {
        return ((ctx, input)=>(validators.AccessLevelTpl2(ctx, input)))(ctx, input);
    },
    "AllTs": function(ctx, input) {
        return ((ctx, input)=>(validators.AllTs(ctx, input)))(ctx, input);
    },
    "AllTypes": function(ctx, input) {
        return ((ctx, input)=>(validators.AllTypes(ctx, input)))(ctx, input);
    },
    "Arr2C": function(ctx, input) {
        return ((ctx, input)=>(validators.Arr2(ctx, input)))(ctx, input);
    },
    "Arr3": function(ctx, input) {
        return ((ctx, input)=>(validators.Arr3(ctx, input)))(ctx, input);
    },
    "AvatarSize": function(ctx, input) {
        return ((ctx, input)=>(validators.AvatarSize(ctx, input)))(ctx, input);
    },
    "BObject": function(ctx, input) {
        return ((ctx, input)=>(validators.BObject(ctx, input)))(ctx, input);
    },
    "DiscriminatedUnion": function(ctx, input) {
        return ((ctx, input)=>(validators.DiscriminatedUnion(ctx, input)))(ctx, input);
    },
    "DiscriminatedUnion2": function(ctx, input) {
        return ((ctx, input)=>(validators.DiscriminatedUnion2(ctx, input)))(ctx, input);
    },
    "DiscriminatedUnion3": function(ctx, input) {
        return ((ctx, input)=>(validators.DiscriminatedUnion3(ctx, input)))(ctx, input);
    },
    "DiscriminatedUnion4": function(ctx, input) {
        return ((ctx, input)=>(validators.DiscriminatedUnion4(ctx, input)))(ctx, input);
    },
    "Extra": function(ctx, input) {
        return ((ctx, input)=>(validators.Extra(ctx, input)))(ctx, input);
    },
    "ImportEnumTypeof": function(ctx, input) {
        return ((ctx, input)=>(decodeObject(ctx, input, hoisted_ImportEnumTypeof_1)))(ctx, input);
    },
    "K": function(ctx, input) {
        return ((ctx, input)=>(validators.K(ctx, input)))(ctx, input);
    },
    "KABC": function(ctx, input) {
        return ((ctx, input)=>(validators.KABC(ctx, input)))(ctx, input);
    },
    "KDEF": function(ctx, input) {
        return ((ctx, input)=>(validators.KDEF(ctx, input)))(ctx, input);
    },
    "LevelAndDSettings": function(ctx, input) {
        return ((ctx, input)=>(validators.LevelAndDSettings(ctx, input)))(ctx, input);
    },
    "Mapped": function(ctx, input) {
        return ((ctx, input)=>(validators.Mapped(ctx, input)))(ctx, input);
    },
    "MappedOptional": function(ctx, input) {
        return ((ctx, input)=>(validators.MappedOptional(ctx, input)))(ctx, input);
    },
    "OmitSettings": function(ctx, input) {
        return ((ctx, input)=>(validators.OmitSettings(ctx, input)))(ctx, input);
    },
    "OtherEnum": function(ctx, input) {
        return ((ctx, input)=>(validators.OtherEnum(ctx, input)))(ctx, input);
    },
    "PartialObject": function(ctx, input) {
        return ((ctx, input)=>(validators.PartialObject(ctx, input)))(ctx, input);
    },
    "PartialSettings": function(ctx, input) {
        return ((ctx, input)=>(validators.PartialSettings(ctx, input)))(ctx, input);
    },
    "PublicUser": function(ctx, input) {
        return ((ctx, input)=>(validators.PublicUser(ctx, input)))(ctx, input);
    },
    "Repro1": function(ctx, input) {
        return ((ctx, input)=>(validators.Repro1(ctx, input)))(ctx, input);
    },
    "Req": function(ctx, input) {
        return ((ctx, input)=>(validators.Req(ctx, input)))(ctx, input);
    },
    "RequiredPartialObject": function(ctx, input) {
        return ((ctx, input)=>(validators.RequiredPartialObject(ctx, input)))(ctx, input);
    },
    "SettingsUpdate": function(ctx, input) {
        return ((ctx, input)=>(validators.SettingsUpdate(ctx, input)))(ctx, input);
    },
    "T3": function(ctx, input) {
        return ((ctx, input)=>(validators.T3(ctx, input)))(ctx, input);
    },
    "TransportedValue": function(ctx, input) {
        return ((ctx, input)=>(validators.TransportedValue(ctx, input)))(ctx, input);
    },
    "UnionWithEnumAccess": function(ctx, input) {
        return ((ctx, input)=>(validators.UnionWithEnumAccess(ctx, input)))(ctx, input);
    },
    "User": function(ctx, input) {
        return ((ctx, input)=>(validators.User(ctx, input)))(ctx, input);
    },
    "ValidCurrency": function(ctx, input) {
        return ((ctx, input)=>(validators.ValidCurrency(ctx, input)))(ctx, input);
    },
    "Version": function(ctx, input) {
        return ((ctx, input)=>(validators.Version(ctx, input)))(ctx, input);
    },
    "Version2": function(ctx, input) {
        return ((ctx, input)=>(validators.Version2(ctx, input)))(ctx, input);
    }
};
const hoisted_ImportEnumTypeof_0 = new ConstDecoder("a");
const hoisted_ImportEnumTypeof_1 = {
    "A": hoisted_ImportEnumTypeof_0.decode.bind(hoisted_ImportEnumTypeof_0)
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