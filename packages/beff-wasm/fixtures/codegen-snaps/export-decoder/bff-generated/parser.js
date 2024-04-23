//@ts-nocheck
/* eslint-disable */


import validatorsMod from "./validators.js"; const { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeConst, validators, c } = validatorsMod;
const buildParsersInput = {
    NotPublicRenamed: function(ctx, input, required = true) {
        return validators.NotPublic(ctx, input, required);
    },
    Password: function(ctx, input, required = true) {
        return validators.Password(ctx, input, required);
    },
    StartsWithA: function(ctx, input, required = true) {
        return validators.StartsWithA(ctx, input, required);
    },
    User: function(ctx, input, required = true) {
        return validators.User(ctx, input, required);
    },
    Users: function(ctx, input, required = true) {
        return decodeArray(ctx, input, required, (ctx, input)=>(validators.User(ctx, input, true)));
    },
    float: function(ctx, input, required = true) {
        return decodeConst(ctx, input, required, 123.456);
    },
    int: function(ctx, input, required = true) {
        return decodeConst(ctx, input, required, 123);
    },
    union: function(ctx, input, required = true) {
        return validators.UnionNested(ctx, input, required);
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