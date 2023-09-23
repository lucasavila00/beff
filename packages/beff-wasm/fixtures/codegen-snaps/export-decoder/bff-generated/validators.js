

function buildError(ctx, kind) {
  ctx.errors.push({
    kind,
    path: [],
    received: 'todo',
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
  if (typeof input === "number") {
    return input;
  }
  if (isNumeric(input)) {
    return Number(input);
  }

  return buildError(ctx, "notNumber")
}

function decodeCodec(ctx, input, required, codec) {
  if (!required && input == null) {
    return input;
  }
  switch (codec) {
    case "Codec::ISO8061": {
      const d = new Date(input);
      if (isNaN(d.getTime())) {
        return buildError(ctx, "notISO8061")
      }
      return d;
    }
  }
  return buildError(ctx, "unknownCodec:"+codec)
}

function decodeStringWithFormat(ctx, input, required, format) {
  if (!required && input == null) {
    return input;
  }
  if (typeof input === 'string') {
    if (isCustomFormatValid(format, input)) {
      return input;
    }
    return buildError(ctx, "notCustomFormat:"+format)
  }
  return buildError(ctx, "notString")
}
function decodeAnyOf(ctx, input, required, vs) {
  if (!required && input == null) {
    return input;
  }
  const errors = [];
  for (const v of vs) {
    const validatorCtx = {
      errors: [],
    };
    const new_value = v(validatorCtx, input);
    const validation_result = validatorCtx.errors;
    if (validation_result.length === 0) {
      return new_value;
    }
    errors.push(...validation_result);
  }
  return buildError(ctx, "notAnyOf")
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
  return buildError(ctx, "notBoolean")
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
  return buildError(ctx, "notNull")
}
function decodeConst(ctx, input, required, constValue) {
  if (!required && input == null) {
    return input;
  }
  if (input === constValue) {
    return input;
  }
  return buildError(ctx, "notConst")
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