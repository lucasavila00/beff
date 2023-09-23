
import vals from "./validators.js"; const { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeConst, validators, registerStringFormat, c } = vals;
const buildParsersInput = {
    "NotPublicRenamed": function(ctx, input) {
        return validators.NotPublic(ctx, input, true);
    },
    "Password": function(ctx, input) {
        return validators.Password(ctx, input, true);
    },
    "StartsWithA": function(ctx, input) {
        return validators.StartsWithA(ctx, input, true);
    },
    "User": function(ctx, input) {
        return validators.User(ctx, input, true);
    },
    "Users": function(ctx, input) {
        return decodeArray(ctx, input, true, (ctx, input)=>(validators.User(ctx, input, true)));
    },
    "float": function(ctx, input) {
        return decodeConst(ctx, input, true, 123.456);
    },
    "int": function(ctx, input) {
        return decodeConst(ctx, input, true, 123);
    },
    "union": function(ctx, input) {
        return validators.UnionNested(ctx, input, true);
    }
};


class BffParseError {
  constructor(errors) {
    this.errors = errors;
  }
}
function buildParsers() {
  let decoders ={};
  Object.keys(buildParsersInput).forEach(k => {
    let v = buildParsersInput[k];
    const safeParse = (input) => {
      const validatorCtx = {
        errors: [],
      };
      const new_value = v(validatorCtx, input);
      const validation_result = validatorCtx.errors;
      if (validation_result.length === 0) {
        return { success: true, data: new_value };
      }
      return { success: false, errors: validation_result };
    }
    const parse = (input) => {
      const safe = safeParse(input);
      if (safe.success) {
        return safe.data;
      }
      throw new BffParseError(safe.errors)
    };
    decoders[k] = {
      parse, safeParse
    };
  });
  return decoders;
}

export default { buildParsers, registerStringFormat };