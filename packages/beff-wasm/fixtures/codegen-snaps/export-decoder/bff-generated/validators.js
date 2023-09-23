

function buildError(ctx, kind) {
  ctx.errors.push({
    kind
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
      acc[k] = v(ctx, input[k]);
    }
    return acc;
  }
  return buildError(ctx, "notObject")
}
function decodeArray(ctx, input, required, data) {
  if (!required && input == null) {
    return input;
  }
  if (Array.isArray(input)) {
    const acc = [];
    for (const v of input) {
      acc.push(data(ctx, v));
    }
    return acc;
  }
  return buildError(ctx, "notArray")
}
function decodeString(ctx, input, required) {
  if (!required && input == null) {
    return input;
  }

  if (typeof input === 'string') {
    return input;
  }

  return buildError(ctx, "notString")
}
const isNumeric = (num) =>
  (typeof num === "number" || (typeof num === "string" && num.trim() !== "")) &&
  !isNaN(num );

function decodeNumber(ctx, input, required) {
  if (!required && input == null) {
    return input;
  }

  if (isNumeric(input)) {
    return Number(input);
  }

  return buildError(ctx, "notNumber")
}

function decodeCodec(ctx, input, required, codec) {
  throw new Error("not implemented")
}

function decodeStringWithFormat(ctx, input, required, format) {
  throw new Error("not implemented")
}




const stringPredicates = {}
function registerStringFormat(name, predicate) {
  stringPredicates[name] = predicate;
}
function isCodecInvalid(key, value) {
  if (key === 'Codec::ISO8061') {
    return isNaN(Date.parse(value));
  }
  throw new Error("unknown codec: " + key);
}
function isCustomFormatInvalid(key, value) {
  const predicate = stringPredicates[key];
  if (predicate == null) {
    throw new Error("unknown string format: " + key);
  }
  return !predicate(value);
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
    return todoAnyOf(ctx, input, true);
}
function B(ctx, input) {
    return todoAnyOf(ctx, input, true);
}
function D(ctx, input) {
    return todoAnyOf(ctx, input, true);
}
function E(ctx, input) {
    return todoAnyOf(ctx, input, true);
}
function UnionNestedNamed(ctx, input) {
    return todoAnyOf(ctx, input, true);
}
function NotPublic(ctx, input) {
    return decodeObject(ctx, input, true, {
        "a": (ctx, input)=>(decodeString(ctx, input, true))
    });
}
function UnionNested(ctx, input) {
    return todoAnyOf(ctx, input, true);
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

export default { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeStringWithFormat, validators, isCustomFormatInvalid, isCodecInvalid, registerStringFormat };