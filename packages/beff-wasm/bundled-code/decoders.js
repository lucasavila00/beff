/* eslint-disable */
//@ts-check

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

  decode(ctx, input) {
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

  decode(ctx, input) {
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
  decode(ctx, input) {
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
            //noop
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

  decode(ctx, input) {
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

function decodeAnyOfDiscriminated(ctx, input, discriminator, mapping) {
  const d = input[discriminator];
  if (d == null) {
    return buildError(input, ctx, "expected discriminator key " + JSON.stringify(discriminator));
  }
  const v = mapping[d];
  if (v == null) {
    pushPath(ctx, discriminator);
    const err = buildError(
      d,
      ctx,
      "expected one of " +
        Object.keys(mapping)
          .map((it) => JSON.stringify(it))
          .join(", ")
    );
    popPath(ctx);
    return err;
  }
  const prevAllow = ctx.allowedExtraProperties__ ?? [];
  ctx.allowedExtraProperties__ = [...prevAllow, discriminator];
  const out = v(ctx, input);
  ctx.allowedExtraProperties__ = prevAllow;
  return { ...out, [discriminator]: d };
}

function decodeAnyOfConsts(ctx, input, consts) {
  for (const c of consts) {
    if (input === c) {
      return c;
    }
  }
  return buildError(input, ctx, "expected one of " + consts.map((it) => JSON.stringify(it)).join(", "));
}
function decodeAnyOf(ctx, input, vs) {
  let accErrors = [];
  for (const v of vs) {
    const validatorCtx = {};
    const newValue = v(validatorCtx, input);
    if (validatorCtx.errors == null) {
      return newValue;
    }
    accErrors.push(...(validatorCtx.errors ?? []));
  }
  return buildUnionError(input, ctx, accErrors);
}
function decodeAllOf(ctx, input, vs) {
  let acc = {};
  let foundOneObject = false;
  let allObjects = true;
  for (const v of vs) {
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
class TupleDecoder {
  constructor(vs) {
    this.vs = vs;
  }
  decode(ctx, input) {
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

  decode(ctx, input) {
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

  decode(ctx, input) {
    if (typeof input === "string") {
      if (this.regex.test(input)) {
        return input;
      }
    }
    return buildError(input, ctx, "expected string matching " + this.description);
  }
}
