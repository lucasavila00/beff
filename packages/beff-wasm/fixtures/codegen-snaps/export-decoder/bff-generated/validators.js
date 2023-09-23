

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
function buildError(received, ctx, message, ) {
  if (ctx.errors == null) {
    ctx.errors = [];
  }
  ctx.errors.push({
    message,
    path: [...(ctx.paths??[])],
    received
  })
}

function decodeObject(ctx, input, required, data) {
  if (!required && input == null) {
    return input;
  }
  if (
    typeof input === 'object' &&
    !Array.isArray(input) &&
    input !== null
  ) {
    const acc = {};
    for (const [k, v] of Object.entries(data)) {
      pushPath(ctx, k);
      acc[k] = v(ctx, input[k]);
      popPath(ctx);
    }
    return acc;
  }
  return buildError(input, ctx,  "expected object")
}
function decodeArray(ctx, input, required, data) {
  if (!required && input == null) {
    return input;
  }
  if (Array.isArray(input)) {
    const acc = [];
    for(let i = 0; i < input.length; i++) {
      const v = input[i];
      pushPath(ctx, '['+i+']');
      acc.push(data(ctx, v));
      popPath(ctx);
    }
    return acc;
  }
  return buildError(input, ctx,  "expected array")
}
function decodeString(ctx, input, required) {
  if (!required && input == null) {
    return input;
  }

  if (typeof input === 'string') {
    return input;
  }

  return buildError(input, ctx,  "expected string")
}
const isNumeric = (num) =>
  (typeof num === "number" || (typeof num === "string" && num.trim() !== "")) &&
  !isNaN(num );

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

  return buildError(input, ctx,  "expected number")
}

function decodeCodec(ctx, input, required, codec) {
  if (!required && input == null) {
    return input;
  }
  switch (codec) {
    case "Codec::ISO8061": {
      const d = new Date(input);
      if (isNaN(d.getTime())) {
        return buildError(input, ctx,  "expected ISO8061 date")
      }
      return d;
    }
  }
  return buildError(input, ctx,  "codec " + codec + " not implemented")
}

function decodeStringWithFormat(ctx, input, required, format) {
  if (!required && input == null) {
    return input;
  }
  if (typeof input === 'string') {
    if (isCustomFormatValid(format, input)) {
      return input;
    }
    return buildError(input, ctx,  "expected "+format)
  }
  return buildError(input, ctx,  "expected string")
}
function decodeAnyOf(ctx, input, required, vs) {
  if (!required && input == null) {
    return input;
  }
  for (const v of vs) {
    const validatorCtx = {
    };
    const newValue = v(validatorCtx, input);
    if (validatorCtx.errors == null) {
      return newValue;
    }
  }
  return buildError(input, ctx,  "expected one of")
}
function decodeAllOf(ctx, input, required, vs) {
  if (!required && input == null) {
    return input;
  }
  throw new Error("decodeAllOf not implemented");
}
function decodeTuple(ctx, input, required, vs) {
  if (!required && input == null) {
    return input;
  }
  throw new Error("decodeTuple not implemented");
}
function decodeBoolean(ctx, input, required, ) {
  if (!required && input == null) {
    return input;
  }
  if (typeof input === "boolean") {
    return input;
  }
  if (input === "true" || input === "false") {
    return (input === "true");
  }
  if (input === "1" || input === "0") {
    return (input === "1");
  }
  return buildError(input, ctx,  "expected boolean")
}
function decodeAny(ctx, input, required) {
  return input;
}
function decodeNull(ctx, input, required) {
  if (!required && input == null) {
    return input;
  }
  if (input === null) {
    return input;
  }
  return buildError(input, ctx,  "expected null")
}
function decodeConst(ctx, input, required, constValue) {
  if (!required && input == null) {
    return input;
  }
  if (input == constValue) {
    return constValue;
  }
  return buildError(input, ctx,  "expected "+JSON.stringify(constValue))
}



const stringPredicates = {}
function registerStringFormat(name, predicate) {
  stringPredicates[name] = predicate;
}

function isCustomFormatValid(key, value) {
  const predicate = stringPredicates[key];
  if (predicate == null) {
    throw new Error("unknown string format: " + key);
  }
  return predicate(value);
}

function User(ctx, input) {
    return decodeObject(ctx, input, true, {
        "age": (ctx, input)=>(decodeNumber(ctx, input, true)),
        "name": (ctx, input)=>(decodeString(ctx, input, true))
    });
}
function Password(ctx, input) {
    return decodeStringWithFormat(ctx, input, true, "password");
}
function StartsWithA(ctx, input) {
    return decodeStringWithFormat(ctx, input, true, "StartsWithA");
}
function A(ctx, input) {
    return decodeAnyOf(ctx, input, true, [
        (ctx, input)=>(decodeConst(ctx, input, true, 1)),
        (ctx, input)=>(decodeConst(ctx, input, true, 2))
    ]);
}
function B(ctx, input) {
    return decodeAnyOf(ctx, input, true, [
        (ctx, input)=>(decodeConst(ctx, input, true, 2)),
        (ctx, input)=>(decodeConst(ctx, input, true, 3))
    ]);
}
function D(ctx, input) {
    return decodeAnyOf(ctx, input, true, [
        (ctx, input)=>(decodeConst(ctx, input, true, 4)),
        (ctx, input)=>(decodeConst(ctx, input, true, 5))
    ]);
}
function E(ctx, input) {
    return decodeAnyOf(ctx, input, true, [
        (ctx, input)=>(decodeConst(ctx, input, true, 5)),
        (ctx, input)=>(decodeConst(ctx, input, true, 6))
    ]);
}
function UnionNestedNamed(ctx, input) {
    return decodeAnyOf(ctx, input, true, [
        (ctx, input)=>(validators.A(ctx, input, true)),
        (ctx, input)=>(validators.B(ctx, input, true)),
        (ctx, input)=>(validators.D(ctx, input, true)),
        (ctx, input)=>(validators.E(ctx, input, true))
    ]);
}
function NotPublic(ctx, input) {
    return decodeObject(ctx, input, true, {
        "a": (ctx, input)=>(decodeString(ctx, input, true))
    });
}
function UnionNested(ctx, input) {
    return decodeAnyOf(ctx, input, true, [
        (ctx, input)=>(validators.A(ctx, input, true)),
        (ctx, input)=>(validators.B(ctx, input, true)),
        (ctx, input)=>(validators.D(ctx, input, true)),
        (ctx, input)=>(validators.E(ctx, input, true))
    ]);
}
const validators = {
    User: User,
    Password: Password,
    StartsWithA: StartsWithA,
    A: A,
    B: B,
    D: D,
    E: E,
    UnionNestedNamed: UnionNestedNamed,
    NotPublic: NotPublic,
    UnionNested: UnionNested
};

export default { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeConst, validators, isCustomFormatValid, registerStringFormat };