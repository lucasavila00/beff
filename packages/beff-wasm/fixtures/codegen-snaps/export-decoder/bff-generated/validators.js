//@ts-nocheck
/* eslint-disable */




const customFormatters = {}

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

function decodeObject(ctx, input, required, data, additionalPropsValidator = null) {
  if (!required && input == null) {
    return input;
  }

  const disallowExtraProperties = ctx?.disallowExtraProperties ?? false;

  const allowedExtraProperties = ctx.allowedExtraProperties__ ?? []

  if (typeof input === "object" && !Array.isArray(input) && input !== null) {
    const acc = {};
    for (const [k, v] of Object.entries(data)) {
      pushPath(ctx, k);
      acc[k] = v(ctx, input[k]);
      popPath(ctx);
    }

    if (additionalPropsValidator != null) {
      for (const [k, v] of Object.entries(input)) {
        if (acc[k] == null) {
          pushPath(ctx, k);
          
          acc[k] = additionalPropsValidator(ctx, v);
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

function decodeArray(ctx, input, required, data) {
  if (!required && input == null) {
    return input;
  }
  if (Array.isArray(input)) {
    const acc = [];
    for (let i = 0; i < input.length; i++) {
      const v = input[i];
      pushPath(ctx, "[" + i + "]");
      acc.push(data(ctx, v));
      popPath(ctx);
    }
    return acc;
  }
  return buildError(input, ctx, "expected array");
}
function decodeString(ctx, input, required) {
  if (!required && input == null) {
    return input;
  }

  if (typeof input === "string") {
    return input;
  }

  return buildError(input, ctx, "expected string");
}

function decodeNumber(ctx, input, required) {
  if (!required && input == null) {
    return input;
  }
  if (typeof input === "number") {
    return input;
  }
  if (String(input).toLowerCase() == "nan") {
    return NaN;
  }

  return buildError(input, ctx, "expected number");
}

function decodeFunction(ctx, input, required) {
  if (!required && input == null) {
    return input;
  }
  if (typeof input === "function") {
    return input;
  }
  return buildError(input, ctx, "expected function");
}

function decodeCodec(ctx, input, required, codec) {
  if (!required && input == null) {
    return input;
  }
  switch (codec) {
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
  return buildError(input, ctx, "codec " + codec + " not implemented");
}

function decodeStringWithFormat(ctx, input, required, format) {
  if (!required && input == null) {
    return input;
  }
  if (typeof input !== "string") {
    return buildError(input, ctx, "expected string with format " + JSON.stringify(format));
  }

  const validator = customFormatters[format];

  if (validator == null) {
    return buildError(input, ctx, "format " + JSON.stringify(format) + " not implemented");
  }

  const isOk = validator(input);
  if (isOk) {
    return input;
  }
  return buildError(input, ctx, "expected string with format " + JSON.stringify(format));
}

function decodeAnyOfDiscriminated(ctx, input, required, discriminator, mapping) {
  if (!required && input == null) {
    return input;
  }
  const d = input[discriminator];
  if (d == null) {
    return buildError(input, ctx, "expected discriminator key " + JSON.stringify(discriminator))
  }
  const v = mapping[d];
  if (v == null) {
    pushPath(ctx, discriminator);
    const err = buildError(d, ctx, "expected one of " + Object.keys(mapping).map(it => JSON.stringify(it)).join(", "));
    popPath(ctx);
    return err;
  }
  const prevAllow = (ctx.allowedExtraProperties__ ?? []);
  ctx.allowedExtraProperties__ = [...prevAllow, discriminator]
  const out = v(ctx, input);
  ctx.allowedExtraProperties__ = prevAllow;
  return { ...out, [discriminator]: d };
}

function decodeAnyOfConsts(ctx, input, required, consts) {
  if (!required && input == null) {
    return input;
  }
  for (const c of consts) {
    if (input === c) {
      return c;
    }
  }
  return buildError(input, ctx, "expected one of " + consts.map(it => JSON.stringify(it)).join(", "));
}
function decodeAnyOf(ctx, input, required, vs) {
  if (!required && input == null) {
    return input;
  }

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
function decodeAllOf(ctx, input, required, vs) {
  if (!required && input == null) {
    return input;
  }
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
function decodeTuple(ctx, input, required, vs) {
  if (!required && input == null) {
    return input;
  }
  if (Array.isArray(input)) {
    const acc = [];
    let idx = 0;
    for (const v of vs.prefix) {
      pushPath(ctx, "[" + idx + "]");
      const newValue = v(ctx, input[idx]);
      popPath(ctx);
      acc.push(newValue);
      idx++;
    }
    if (vs.items != null) {
      for (let i = idx; i < input.length; i++) {
        const v = input[i];
        pushPath(ctx, "[" + i + "]");
        acc.push(vs.items(ctx, v));
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
function decodeBoolean(ctx, input, required) {
  if (!required && input == null) {
    return input;
  }
  if (typeof input === "boolean") {
    return input;
  }
  return buildError(input, ctx, "expected boolean");
}
function decodeAny(ctx, input, required) {
  return input;
}
function decodeNull(ctx, input, required) {
  if (!required && input == null) {
    return input;
  }
  if (input == "null" || input == "undefined") {
    return null;
  }
  if (input == null) {
    return null;
  }
  return buildError(input, ctx, "expected null");
}
function decodeNever(ctx, input, required) {
  if (!required && input == null) {
    return input;
  }
  return buildError(input, ctx, "never");
}
function decodeConst(ctx, input, required, constValue) {
  if (!required && input == null) {
    return input;
  }
  if (input == constValue) {
    return constValue;
  }
  return buildError(input, ctx, "expected " + JSON.stringify(constValue));
}

function decodeRegex(ctx, input, required, regex, description) {
  if (!required && input == null) {
    return input;
  }
  if (typeof input === "string") {
    if (regex.test(input)) {
      return input;
    }
  }
  return buildError(input, ctx, "expected string matching " + description);
}

function DecodeUser(ctx, input, required = true) {
    return decodeObject(ctx, input, required, {
        "age": (ctx, input)=>(decodeNumber(ctx, input, true)),
        "name": (ctx, input)=>(decodeString(ctx, input, true))
    });
}
function DecodeNotPublic(ctx, input, required = true) {
    return decodeObject(ctx, input, required, {
        "a": (ctx, input)=>(decodeString(ctx, input, true))
    });
}
function DecodeStartsWithA(ctx, input, required = true) {
    return decodeStringWithFormat(ctx, input, required, "StartsWithA");
}
function DecodePassword(ctx, input, required = true) {
    return decodeStringWithFormat(ctx, input, required, "password");
}
function DecodeA(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, required, [
        1,
        2
    ]);
}
function DecodeB(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, required, [
        2,
        3
    ]);
}
function DecodeD(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, required, [
        4,
        5
    ]);
}
function DecodeE(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, required, [
        5,
        6
    ]);
}
function DecodeUnionNested(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, required, [
        1,
        2,
        3,
        4,
        5,
        6
    ]);
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

export default { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeFunction, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeNever, decodeConst, registerCustomFormatter, validators };