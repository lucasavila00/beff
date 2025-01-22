//@ts-nocheck
/* eslint-disable */




const customFormatters = {};

function registerCustomFormatter(name, validator) {
  customFormatters[name] = validator;
}

function pushPath(ctx, path) {
  if (ctx.paths == null) {
    ctx.paths = [];
  }
  ctx.paths.push(path);
}
function popPath(ctx) {
  if (ctx.paths == null) {
    throw new Error("popPath: no paths");
  }
  return ctx.paths.pop();
}
function buildError(received, ctx, message) {
  if (ctx.errors == null) {
    ctx.errors = [];
  }
  ctx.errors.push({
    message,
    path: [...(ctx.paths ?? [])],
    received,
  });
}
function buildUnionError(received, ctx, errors) {
  if (ctx.errors == null) {
    ctx.errors = [];
  }
  ctx.errors.push({
    message: "expected one of",
    isUnionError: true,
    errors,
    path: [...(ctx.paths ?? [])],
    received,
  });
}

class ObjectDecoder {
  constructor(data, additionalPropsValidator = null) {
    this.data = data;
    this.additionalPropsValidator = additionalPropsValidator;
  }

  decodeObjectDecoder(ctx, input) {
    const disallowExtraProperties = ctx?.disallowExtraProperties ?? false;

    const allowedExtraProperties = ctx.allowedExtraProperties__ ?? [];

    if (typeof input === "object" && !Array.isArray(input) && input !== null) {
      const acc = {};
      for (const [k, v] of Object.entries(this.data)) {
        pushPath(ctx, k);
        acc[k] = v(ctx, input[k]);
        popPath(ctx);
      }

      if (this.additionalPropsValidator != null) {
        for (const [k, v] of Object.entries(input)) {
          if (acc[k] == null) {
            pushPath(ctx, k);
            acc[k] = this.additionalPropsValidator(ctx, v);
            popPath(ctx);
          }
        }
      }

      if (disallowExtraProperties) {
        for (const k of Object.keys(input)) {
          if (acc[k] == null && allowedExtraProperties.indexOf(k) == -1) {
            pushPath(ctx, k);
            buildError(input[k], ctx, "extra property");
            popPath(ctx);
          }
        }
      }

      return acc;
    }
    return buildError(input, ctx, "expected object");
  }
}

class ArrayDecoder {
  constructor(data) {
    this.data = data;
  }

  decodeArrayDecoder(ctx, input) {
    if (Array.isArray(input)) {
      const acc = [];
      for (let i = 0; i < input.length; i++) {
        const v = input[i];
        pushPath(ctx, "[" + i + "]");
        acc.push(this.data(ctx, v));
        popPath(ctx);
      }
      return acc;
    }
    return buildError(input, ctx, "expected array");
  }
}
function decodeString(ctx, input) {
  if (typeof input === "string") {
    return input;
  }

  return buildError(input, ctx, "expected string");
}

function decodeNumber(ctx, input) {
  if (typeof input === "number") {
    return input;
  }
  if (String(input).toLowerCase() == "nan") {
    return NaN;
  }

  return buildError(input, ctx, "expected number");
}

function decodeFunction(ctx, input) {
  if (typeof input === "function") {
    return input;
  }
  return buildError(input, ctx, "expected function");
}
class CodecDecoder {
  constructor(codec) {
    this.codec = codec;
  }
  decodeCodecDecoder(ctx, input) {
    switch (this.codec) {
      case "Codec::ISO8061": {
        const d = new Date(input);
        if (isNaN(d.getTime())) {
          return buildError(input, ctx, "expected ISO8061 date");
        }
        return d;
      }
      case "Codec::BigInt": {
        if (typeof input === "bigint") {
          return input;
        }
        if (typeof input === "number") {
          return BigInt(input);
        }
        if (typeof input === "string") {
          try {
            return BigInt(input);
          } catch (e) {
            
          }
        }
        return buildError(input, ctx, "expected bigint");
      }
    }
    return buildError(input, ctx, "codec " + this.codec + " not implemented");
  }
}

class StringWithFormatDecoder {
  constructor(format) {
    this.format = format;
  }

  decodeStringWithFormatDecoder(ctx, input) {
    if (typeof input !== "string") {
      return buildError(input, ctx, "expected string with format " + JSON.stringify(this.format));
    }

    const validator = customFormatters[this.format];

    if (validator == null) {
      return buildError(input, ctx, "format " + JSON.stringify(this.format) + " not implemented");
    }

    const isOk = validator(input);
    if (isOk) {
      return input;
    }
    return buildError(input, ctx, "expected string with format " + JSON.stringify(this.format));
  }
}
class AnyOfDiscriminatedDecoder {
  constructor(discriminator, mapping) {
    this.discriminator = discriminator;
    this.mapping = mapping;
  }

  decodeAnyOfDiscriminatedDecoder(ctx, input) {
    const d = input[this.discriminator];
    if (d == null) {
      return buildError(input, ctx, "expected discriminator key " + JSON.stringify(this.discriminator));
    }
    const v = this.mapping[d];
    if (v == null) {
      pushPath(ctx, this.discriminator);
      const err = buildError(
        d,
        ctx,
        "expected one of " +
          Object.keys(this.mapping)
            .map((it) => JSON.stringify(it))
            .join(", ")
      );
      popPath(ctx);
      return err;
    }
    const prevAllow = ctx.allowedExtraProperties__ ?? [];
    ctx.allowedExtraProperties__ = [...prevAllow, this.discriminator];
    const out = v(ctx, input);
    ctx.allowedExtraProperties__ = prevAllow;
    return { ...out, [this.discriminator]: d };
  }
}

class AnyOfConstsDecoder {
  constructor(consts) {
    this.consts = consts;
  }
  decodeAnyOfConstsDecoder(ctx, input) {
    for (const c of this.consts) {
      if (input === c) {
        return c;
      }
    }
    return buildError(
      input,
      ctx,
      "expected one of " + this.consts.map((it) => JSON.stringify(it)).join(", ")
    );
  }
}

class AnyOfDecoder {
  constructor(vs) {
    this.vs = vs;
  }
  decodeAnyOfDecoder(ctx, input) {
    let accErrors = [];
    for (const v of this.vs) {
      const validatorCtx = {};
      const newValue = v(validatorCtx, input);
      if (validatorCtx.errors == null) {
        return newValue;
      }
      accErrors.push(...(validatorCtx.errors ?? []));
    }
    return buildUnionError(input, ctx, accErrors);
  }
}
class AllOfDecoder {
  constructor(vs) {
    this.vs = vs;
  }
  decodeAllOfDecoder(ctx, input) {
    let acc = {};
    let foundOneObject = false;
    let allObjects = true;
    for (const v of this.vs) {
      const newValue = v(ctx, input);
      const isObj = typeof newValue === "object";
      allObjects = allObjects && isObj;
      if (isObj) {
        foundOneObject = true;
        acc = { ...acc, ...newValue };
      }
    }
    if (foundOneObject && allObjects) {
      return acc;
    }
    return input;
  }
}
class TupleDecoder {
  constructor(vs) {
    this.vs = vs;
  }
  decodeTupleDecoder(ctx, input) {
    if (Array.isArray(input)) {
      const acc = [];
      let idx = 0;
      for (const v of this.vs.prefix) {
        pushPath(ctx, "[" + idx + "]");
        const newValue = v(ctx, input[idx]);
        popPath(ctx);
        acc.push(newValue);
        idx++;
      }
      if (this.vs.items != null) {
        for (let i = idx; i < input.length; i++) {
          const v = input[i];
          pushPath(ctx, "[" + i + "]");
          acc.push(this.vs.items(ctx, v));
          popPath(ctx);
        }
      } else {
        if (input.length > idx) {
          return buildError(input, ctx, "tuple has too many items");
        }
      }
      return acc;
    }
    return buildError(input, ctx, "expected tuple");
  }
}
function decodeBoolean(ctx, input) {
  if (typeof input === "boolean") {
    return input;
  }
  return buildError(input, ctx, "expected boolean");
}
function decodeAny(ctx, input) {
  return input;
}
function decodeNull(ctx, input) {
  if (input == null) {
    return input;
  }
  return buildError(input, ctx, "expected nullish value");
}
function decodeNever(ctx, input) {
  return buildError(input, ctx, "never");
}

class ConstDecoder {
  constructor(value) {
    this.value = value;
  }

  decodeConstDecoder(ctx, input) {
    if (input == this.value) {
      return this.value;
    }
    return buildError(input, ctx, "expected " + JSON.stringify(this.value));
  }
}

class RegexDecoder {
  constructor(regex, description) {
    this.regex = regex;
    this.description = description;
  }

  decodeRegexDecoder(ctx, input) {
    if (typeof input === "string") {
      if (this.regex.test(input)) {
        return input;
      }
    }
    return buildError(input, ctx, "expected string matching " + this.description);
  }
}


function DecodeUser(ctx, input) {
    return (hoisted_User_0.decodeObjectDecoder.bind(hoisted_User_0))(ctx, input);
}
function DecodeNotPublic(ctx, input) {
    return (hoisted_NotPublic_1.decodeObjectDecoder.bind(hoisted_NotPublic_1))(ctx, input);
}
function DecodeStartsWithA(ctx, input) {
    return (hoisted_StartsWithA_2.decodeStringWithFormatDecoder.bind(hoisted_StartsWithA_2))(ctx, input);
}
function DecodePassword(ctx, input) {
    return (hoisted_Password_3.decodeStringWithFormatDecoder.bind(hoisted_Password_3))(ctx, input);
}
function DecodeA(ctx, input) {
    return (hoisted_A_4.decodeAnyOfConstsDecoder.bind(hoisted_A_4))(ctx, input);
}
function DecodeB(ctx, input) {
    return (hoisted_B_5.decodeAnyOfConstsDecoder.bind(hoisted_B_5))(ctx, input);
}
function DecodeD(ctx, input) {
    return (hoisted_D_6.decodeAnyOfConstsDecoder.bind(hoisted_D_6))(ctx, input);
}
function DecodeE(ctx, input) {
    return (hoisted_E_7.decodeAnyOfConstsDecoder.bind(hoisted_E_7))(ctx, input);
}
function DecodeUnionNested(ctx, input) {
    return (hoisted_UnionNested_8.decodeAnyOfConstsDecoder.bind(hoisted_UnionNested_8))(ctx, input);
}
const validators = {
    User: DecodeUser,
    NotPublic: DecodeNotPublic,
    StartsWithA: DecodeStartsWithA,
    Password: DecodePassword,
    A: DecodeA,
    B: DecodeB,
    D: DecodeD,
    E: DecodeE,
    UnionNested: DecodeUnionNested
};
const hoisted_User_0 = new ObjectDecoder({
    "age": decodeNumber,
    "name": decodeString
});
const hoisted_NotPublic_1 = new ObjectDecoder({
    "a": decodeString
});
const hoisted_StartsWithA_2 = new StringWithFormatDecoder("StartsWithA");
const hoisted_Password_3 = new StringWithFormatDecoder("password");
const hoisted_A_4 = new AnyOfConstsDecoder([
    1,
    2
]);
const hoisted_B_5 = new AnyOfConstsDecoder([
    2,
    3
]);
const hoisted_D_6 = new AnyOfConstsDecoder([
    4,
    5
]);
const hoisted_E_7 = new AnyOfConstsDecoder([
    5,
    6
]);
const hoisted_UnionNested_8 = new AnyOfConstsDecoder([
    1,
    2,
    3,
    4,
    5,
    6
]);

export default { ObjectDecoder, ArrayDecoder, decodeString, decodeNumber, CodecDecoder, decodeFunction, StringWithFormatDecoder, AnyOfDecoder, AllOfDecoder, decodeBoolean, decodeAny, TupleDecoder, decodeNull, decodeNever, RegexDecoder, ConstDecoder, registerCustomFormatter, AnyOfConstsDecoder, AnyOfDiscriminatedDecoder, validators };