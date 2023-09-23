

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

function encodeCodec(codec, value) {
  switch (codec) {
    case "Codec::ISO8061": {
      return value.toISOString();
    }
    case "Codec::BigInt": {
      return value.toString();
    }
  }
  throw new Error("encode - codec not found: "+codec);
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
    case "Codec::BigInt": {
      if (typeof input === "bigint") {
        return input;
      }
      if (typeof input === "number") {
        return BigInt(input);
      }
      if (typeof input === "string") {
        return BigInt(input);
      }
      return buildError(input, ctx,  "expected bigint")
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
  
  let acc = {};
  for (const v of vs) {
    const newValue = v(ctx, input);
    acc = { ...acc, ...newValue };
  }
  return acc
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

function encodeAnyOf(cbs, value) {
  for (const cb of cbs) {
    return cb(value);
  }
  return value
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
function EncodeUser(input) {
    return {
        age: input.age,
        name: input.name
    };
}
function Password(ctx, input) {
    return decodeStringWithFormat(ctx, input, true, "password");
}
function EncodePassword(input) {
    return input;
}
function StartsWithA(ctx, input) {
    return decodeStringWithFormat(ctx, input, true, "StartsWithA");
}
function EncodeStartsWithA(input) {
    return input;
}
function A(ctx, input) {
    return decodeAnyOf(ctx, input, true, [
        (ctx, input)=>(decodeConst(ctx, input, true, 1)),
        (ctx, input)=>(decodeConst(ctx, input, true, 2))
    ]);
}
function EncodeA(input) {
    return encodeAnyOf([
        (input)=>(input),
        (input)=>(input)
    ], input);
}
function B(ctx, input) {
    return decodeAnyOf(ctx, input, true, [
        (ctx, input)=>(decodeConst(ctx, input, true, 2)),
        (ctx, input)=>(decodeConst(ctx, input, true, 3))
    ]);
}
function EncodeB(input) {
    return encodeAnyOf([
        (input)=>(input),
        (input)=>(input)
    ], input);
}
function D(ctx, input) {
    return decodeAnyOf(ctx, input, true, [
        (ctx, input)=>(decodeConst(ctx, input, true, 4)),
        (ctx, input)=>(decodeConst(ctx, input, true, 5))
    ]);
}
function EncodeD(input) {
    return encodeAnyOf([
        (input)=>(input),
        (input)=>(input)
    ], input);
}
function E(ctx, input) {
    return decodeAnyOf(ctx, input, true, [
        (ctx, input)=>(decodeConst(ctx, input, true, 5)),
        (ctx, input)=>(decodeConst(ctx, input, true, 6))
    ]);
}
function EncodeE(input) {
    return encodeAnyOf([
        (input)=>(input),
        (input)=>(input)
    ], input);
}
function UnionNestedNamed(ctx, input) {
    return decodeAnyOf(ctx, input, true, [
        (ctx, input)=>(validators.A(ctx, input, true)),
        (ctx, input)=>(validators.B(ctx, input, true)),
        (ctx, input)=>(validators.D(ctx, input, true)),
        (ctx, input)=>(validators.E(ctx, input, true))
    ]);
}
function EncodeUnionNestedNamed(input) {
    return encodeAnyOf([
        (input)=>(encoders.A(input)),
        (input)=>(encoders.B(input)),
        (input)=>(encoders.D(input)),
        (input)=>(encoders.E(input))
    ], input);
}
function NotPublic(ctx, input) {
    return decodeObject(ctx, input, true, {
        "a": (ctx, input)=>(decodeString(ctx, input, true))
    });
}
function EncodeNotPublic(input) {
    return {
        a: input.a
    };
}
function UnionNested(ctx, input) {
    return decodeAnyOf(ctx, input, true, [
        (ctx, input)=>(validators.A(ctx, input, true)),
        (ctx, input)=>(validators.B(ctx, input, true)),
        (ctx, input)=>(validators.D(ctx, input, true)),
        (ctx, input)=>(validators.E(ctx, input, true))
    ]);
}
function EncodeUnionNested(input) {
    return encodeAnyOf([
        (input)=>(encoders.A(input)),
        (input)=>(encoders.B(input)),
        (input)=>(encoders.D(input)),
        (input)=>(encoders.E(input))
    ], input);
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
const encoders = {
    User: EncodeUser,
    Password: EncodePassword,
    StartsWithA: EncodeStartsWithA,
    A: EncodeA,
    B: EncodeB,
    D: EncodeD,
    E: EncodeE,
    UnionNestedNamed: EncodeUnionNestedNamed,
    NotPublic: EncodeNotPublic,
    UnionNested: EncodeUnionNested
};

export default { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeConst, encodeCodec, encodeAnyOf, encodeAllOf, validators, encoders, isCustomFormatValid, registerStringFormat };