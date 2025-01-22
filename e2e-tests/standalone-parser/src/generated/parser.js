//@ts-nocheck
/* eslint-disable */


import {printErrors} from '@beff/client';
import {z} from 'zod';
import validatorsMod from "./validators.js"; const { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeFunction, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeNever, decodeConst, registerCustomFormatter, validators, c } = validatorsMod;
const RequiredCustomFormats = ["ValidCurrency"];
const buildParsersInput = {
    "AObject": function(ctx, input, required = true) {
        return validators.AObject(ctx, input);
    },
    "AccessLevel": function(ctx, input, required = true) {
        return validators.AccessLevel(ctx, input);
    },
    "AccessLevelCodec": function(ctx, input, required = true) {
        return validators.AccessLevel(ctx, input);
    },
    "AccessLevelTpl": function(ctx, input, required = true) {
        return validators.AccessLevelTpl(ctx, input);
    },
    "AccessLevelTpl2": function(ctx, input, required = true) {
        return validators.AccessLevelTpl2(ctx, input);
    },
    "AllTs": function(ctx, input, required = true) {
        return validators.AllTs(ctx, input);
    },
    "AllTypes": function(ctx, input, required = true) {
        return validators.AllTypes(ctx, input);
    },
    "Arr2C": function(ctx, input, required = true) {
        return validators.Arr2(ctx, input);
    },
    "Arr3": function(ctx, input, required = true) {
        return validators.Arr3(ctx, input);
    },
    "AvatarSize": function(ctx, input, required = true) {
        return validators.AvatarSize(ctx, input);
    },
    "BObject": function(ctx, input, required = true) {
        return validators.BObject(ctx, input);
    },
    "DiscriminatedUnion": function(ctx, input, required = true) {
        return validators.DiscriminatedUnion(ctx, input);
    },
    "DiscriminatedUnion2": function(ctx, input, required = true) {
        return validators.DiscriminatedUnion2(ctx, input);
    },
    "DiscriminatedUnion3": function(ctx, input, required = true) {
        return validators.DiscriminatedUnion3(ctx, input);
    },
    "DiscriminatedUnion4": function(ctx, input, required = true) {
        return validators.DiscriminatedUnion4(ctx, input);
    },
    "Extra": function(ctx, input, required = true) {
        return validators.Extra(ctx, input);
    },
    "ImportEnumTypeof": function(ctx, input, required = true) {
        return decodeObject(ctx, input, hoisted_ImportEnumTypeof_0);
    },
    "K": function(ctx, input, required = true) {
        return validators.K(ctx, input);
    },
    "KABC": function(ctx, input, required = true) {
        return validators.KABC(ctx, input);
    },
    "KDEF": function(ctx, input, required = true) {
        return validators.KDEF(ctx, input);
    },
    "LevelAndDSettings": function(ctx, input, required = true) {
        return validators.LevelAndDSettings(ctx, input);
    },
    "Mapped": function(ctx, input, required = true) {
        return validators.Mapped(ctx, input);
    },
    "MappedOptional": function(ctx, input, required = true) {
        return validators.MappedOptional(ctx, input);
    },
    "OmitSettings": function(ctx, input, required = true) {
        return validators.OmitSettings(ctx, input);
    },
    "OtherEnum": function(ctx, input, required = true) {
        return validators.OtherEnum(ctx, input);
    },
    "PartialObject": function(ctx, input, required = true) {
        return validators.PartialObject(ctx, input);
    },
    "PartialSettings": function(ctx, input, required = true) {
        return validators.PartialSettings(ctx, input);
    },
    "PublicUser": function(ctx, input, required = true) {
        return validators.PublicUser(ctx, input);
    },
    "Repro1": function(ctx, input, required = true) {
        return validators.Repro1(ctx, input);
    },
    "Req": function(ctx, input, required = true) {
        return validators.Req(ctx, input);
    },
    "RequiredPartialObject": function(ctx, input, required = true) {
        return validators.RequiredPartialObject(ctx, input);
    },
    "SettingsUpdate": function(ctx, input, required = true) {
        return validators.SettingsUpdate(ctx, input);
    },
    "T3": function(ctx, input, required = true) {
        return validators.T3(ctx, input);
    },
    "TransportedValue": function(ctx, input, required = true) {
        return validators.TransportedValue(ctx, input);
    },
    "UnionWithEnumAccess": function(ctx, input, required = true) {
        return validators.UnionWithEnumAccess(ctx, input);
    },
    "User": function(ctx, input, required = true) {
        return validators.User(ctx, input);
    },
    "ValidCurrency": function(ctx, input, required = true) {
        return validators.ValidCurrency(ctx, input);
    },
    "Version": function(ctx, input, required = true) {
        return validators.Version(ctx, input);
    },
    "Version2": function(ctx, input, required = true) {
        return validators.Version2(ctx, input);
    }
};
const hoisted_ImportEnumTypeof_0 = {
    "A": (ctx, input)=>(decodeConst(ctx, input, "a"))
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