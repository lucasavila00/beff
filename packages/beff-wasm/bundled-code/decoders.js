/* eslint-disable */
//@ts-check
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

function decodeObject(ctx, input, required, data) {
  if (!required && input == null) {
    return input;
  }
  if (typeof input === "object" && !Array.isArray(input) && input !== null) {
    const acc = {};
    for (const [k, v] of Object.entries(data)) {
      pushPath(ctx, k);
      acc[k] = v(ctx, input[k]);
      popPath(ctx);
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
const isNumeric = (num) =>
  (typeof num === "number" || (typeof num === "string" && num.trim() !== "")) &&
  !isNaN(
    //@ts-ignore
    num
  );

function decodeNumber(ctx, input, required) {
  if (!required && input == null) {
    return input;
  }
  if (typeof input === "number") {
    return input;
  }
  if (isNumeric(input)) {
    return Number(input);
  }
  if (String(input).toLowerCase() == "nan") {
    return NaN;
  }

  return buildError(input, ctx, "expected number");
}

function encodeCodec(codec, value) {
  switch (codec) {
    case "Codec::ISO8061": {
      return value.toISOString();
    }
    case "Codec::BigInt": {
      return value.toString();
    }
  }
  throw new Error("encode - codec not found: " + codec);
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
          //noop
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
  return input;
  // throw new Error("decodeStringWithFormat not implemented")
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
  if (input === "true" || input === "false") {
    return input === "true";
  }
  if (input === "1" || input === "0") {
    return input === "1";
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
function decodeConst(ctx, input, required, constValue) {
  if (!required && input == null) {
    return input;
  }
  if (input == constValue) {
    return constValue;
  }
  return buildError(input, ctx, "expected " + JSON.stringify(constValue));
}
function encodeNumber(value) {
  if (Number.isNaN(value)) {
    return "NaN";
  }
  return value;
}
function encodeAllOf(cbs, value) {
  if (typeof value === "object") {
    let acc = {};
    for (const cb of cbs) {
      const newValue = cb(value);
      acc = { ...acc, ...newValue };
    }
    return acc;
  }
  return value;
}

function encodeAnyOf(decodeCbs, encodeCbs, value) {
  for (let i = 0; i < decodeCbs.length; i++) {
    const decodeCb = decodeCbs[i];
    const encodeCb = encodeCbs[i];
    // try to validate this value
    const validatorCtx = {};
    const newValue = decodeCb(validatorCtx, value);
    if (validatorCtx.errors == null) {
      // validation passed, encode the value
      return encodeCb(newValue);
    }
  }
  return value;
}
