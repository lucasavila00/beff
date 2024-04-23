//@ts-nocheck
/* eslint-disable */


import validatorsMod from "./validators.js"; const { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeConst, validators, c } = validatorsMod;
const buildParsersInput = {
    "Extra": function(ctx, input, required = true) {
        return validators.Extra(ctx, input, required);
    },
    "Mapped": function(ctx, input, required = true) {
        return validators.Mapped(ctx, input, required);
    },
    "MappedOptional": function(ctx, input, required = true) {
        return validators.MappedOptional(ctx, input, required);
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
    "SettingsUpdate": function(ctx, input, required = true) {
        return validators.SettingsUpdate(ctx, input, required);
    },
    "User": function(ctx, input, required = true) {
        return validators.User(ctx, input, required);
    }
};




class BffParseError {
  constructor(errors) {
    this.errors = errors;
  }
}
function buildParsers() {
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
    decoders[k] = {
      parse,
      safeParse,
    };
  });
  return decoders;
}

export default { buildParsers };