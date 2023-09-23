

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

function AllTypes(ctx, input) {
    return decodeObject(ctx, input, true, {
        "allBooleans": (ctx, input)=>(decodeBoolean(ctx, input, true)),
        "allNumbers": (ctx, input)=>(decodeNumber(ctx, input, true)),
        "allStrings": (ctx, input)=>(decodeString(ctx, input, true)),
        "any": (ctx, input)=>(decodeAny(ctx, input, true)),
        "arrayOfStrings": (ctx, input)=>(decodeArray(ctx, input, true, (ctx, input)=>(decodeString(ctx, input, true)))),
        "booleanLiteral": (ctx, input)=>(todConsto(ctx, input, true)),
        "interface": (ctx, input)=>(validators.Post(ctx, input, true)),
        "intersection": (ctx, input)=>(todAllOfo(ctx, input, true)),
        "null": (ctx, input)=>(decodeNull(ctx, input, true)),
        "numberLiteral": (ctx, input)=>(todConsto(ctx, input, true)),
        "optionalType": (ctx, input)=>(decodeArray(ctx, input, false, (ctx, input)=>(decodeNumber(ctx, input, true)))),
        "stringLiteral": (ctx, input)=>(todConsto(ctx, input, true)),
        "tuple": (ctx, input)=>(todo(ctx, input, true)),
        "tupleWithRest": (ctx, input)=>(todo(ctx, input, true)),
        "typeReference": (ctx, input)=>(validators.User(ctx, input, true)),
        "undefined": (ctx, input)=>(decodeNull(ctx, input, true)),
        "unionOfLiterals": (ctx, input)=>(todoAnyOf(ctx, input, true)),
        "unionOfTypes": (ctx, input)=>(todoAnyOf(ctx, input, true)),
        "unionWithNull": (ctx, input)=>(todoAnyOf(ctx, input, true)),
        "unknown": (ctx, input)=>(decodeAny(ctx, input, true))
    });
}
function Post(ctx, input) {
    return decodeObject(ctx, input, true, {
        "content": (ctx, input)=>(decodeString(ctx, input, true)),
        "id": (ctx, input)=>(decodeString(ctx, input, true))
    });
}
function User(ctx, input) {
    return decodeObject(ctx, input, true, {
        "friends": (ctx, input)=>(decodeArray(ctx, input, true, (ctx, input)=>(validators.User(ctx, input, true)))),
        "id": (ctx, input)=>(decodeString(ctx, input, true))
    });
}
const validators = {
    AllTypes: AllTypes,
    Post: Post,
    User: User
};

export default { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeStringWithFormat, validators, isCustomFormatInvalid, isCodecInvalid, registerStringFormat };