//@ts-nocheck
/* eslint-disable */




const customFormatters = {};

function registerCustomFormatter(name, validator) {
  customFormatters[name] = validator;
}

function pushPath(ctx, path) {
  if (ctx.noErrorMessages) {
    return;
  }
  if (ctx.paths == null) {
    ctx.paths = [];
  }
  ctx.paths.push(path);
}
function popPath(ctx) {
  if (ctx.noErrorMessages) {
    return;
  }
  if (ctx.paths == null) {
    throw new Error("popPath: no paths");
  }
  return ctx.paths.pop();
}
function storeError(ctx, received, message) {
  if (ctx.noErrorMessages) {
    ctx.errors = true;
    return;
  }
  if (ctx.errors == null) {
    ctx.errors = [];
  }

  let messageStr = message;
  if (typeof message === "function") {
    messageStr = message();
  }

  ctx.errors.push({
    message: messageStr,
    path: [...(ctx.paths ?? [])],
    received,
  });
}
function storeUnionError(ctx, received, errors) {
  if (ctx.noErrorMessages) {
    ctx.errors = true;
    return;
  }
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

function decodeString(ctx, input) {
  if (typeof input === "string") {
    return input;
  }

  return storeError(ctx, input, "expected string");
}

function decodeNumber(ctx, input) {
  if (typeof input === "number") {
    return input;
  }
  if (String(input).toLowerCase() == "nan") {
    return NaN;
  }

  return storeError(ctx, input, "expected number");
}

function decodeFunction(ctx, input) {
  if (typeof input === "function") {
    return input;
  }
  return storeError(ctx, input, "expected function");
}
function decodeBoolean(ctx, input) {
  if (typeof input === "boolean") {
    return input;
  }
  return storeError(ctx, input, "expected boolean");
}
function decodeAny(ctx, input) {
  return input;
}
function decodeNull(ctx, input) {
  if (input == null) {
    return input;
  }
  return storeError(ctx, input, "expected nullish value");
}
function decodeNever(ctx, input) {
  return storeError(ctx, input, "never");
}

class ConstDecoder {
  constructor(value) {
    this.value = value;
  }

  decodeConstDecoder(ctx, input) {
    if (input == this.value) {
      return this.value;
    }
    return storeError(ctx, input, () => "expected " + JSON.stringify(this.value));
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
    return storeError(ctx, input, () => "expected string matching " + this.description);
  }
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
            storeError(ctx, input[k], "extra property");
            popPath(ctx);
          }
        }
      }

      return acc;
    }
    return storeError(ctx, input, "expected object");
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
    return storeError(ctx, input, "expected array");
  }
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
          return storeError(ctx, input, "expected ISO8061 date");
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
        return storeError(ctx, input, "expected bigint");
      }
    }
    return storeError(ctx, input, () => "codec " + this.codec + " not implemented");
  }
}

class StringWithFormatDecoder {
  constructor(format) {
    this.format = format;
  }

  decodeStringWithFormatDecoder(ctx, input) {
    if (typeof input !== "string") {
      return storeError(ctx, input, "expected string with format " + JSON.stringify(this.format));
    }

    const validator = customFormatters[this.format];

    if (validator == null) {
      return storeError(ctx, input, () => "format " + JSON.stringify(this.format) + " not implemented");
    }

    const isOk = validator(input);
    if (isOk) {
      return input;
    }
    return storeError(ctx, input, "expected string with format " + JSON.stringify(this.format));
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
      return storeError(ctx, input, () => "expected discriminator key " + JSON.stringify(this.discriminator));
    }
    const v = this.mapping[d];
    if (v == null) {
      pushPath(ctx, this.discriminator);
      const err = storeError(
        ctx,
        d,
        () =>
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
    return storeError(ctx, input, () =>
      this.consts.length < 3
        ? "expected one of " + this.consts.map((it) => JSON.stringify(it)).join(", ")
        : "expected one of " +
          this.consts
            .slice(0, 3)
            .map((it) => JSON.stringify(it))
            .join(", ") +
          "..."
    );
  }
}

class AnyOfDecoder {
  constructor(vs) {
    this.vs = vs;
  }
  decodeAnyOfDecoder(ctx, input) {
    for (const v of this.vs) {
      const validatorCtx = {
        noErrorMessages: true,
      };
      const newValue = v(validatorCtx, input);
      if (validatorCtx.errors == null) {
        return newValue;
      }
    }

    let accErrors = [];
    for (const v of this.vs) {
      const validatorCtx = {};
      const newValue = v(validatorCtx, input);
      if (validatorCtx.errors == null) {
        return newValue;
      }
      accErrors.push(...(validatorCtx.errors ?? []));
    }
    return storeUnionError(ctx, input, accErrors);
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
          return storeError(ctx, input, "tuple has too many items");
        }
      }
      return acc;
    }
    return storeError(ctx, input, "expected tuple");
  }
}


function DecodeA(ctx, input) {
    return (decodeString)(ctx, input);
}
const validators = {
    A: DecodeA
};

export default { ObjectDecoder, ArrayDecoder, decodeString, decodeNumber, CodecDecoder, decodeFunction, StringWithFormatDecoder, AnyOfDecoder, AllOfDecoder, decodeBoolean, decodeAny, TupleDecoder, decodeNull, decodeNever, RegexDecoder, ConstDecoder, registerCustomFormatter, AnyOfConstsDecoder, AnyOfDiscriminatedDecoder, validators };