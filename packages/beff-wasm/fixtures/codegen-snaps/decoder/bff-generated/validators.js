

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
function buildError(received, ctx, kind, ) {
  if (ctx.errors == null) {
    ctx.errors = [];
  }
  ctx.errors.push({
    kind,
    path: [],
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
  return buildError(input, ctx,  "notObject")
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
  return buildError(input, ctx,  "notArray")
}
function decodeString(ctx, input, required) {
  if (!required && input == null) {
    return input;
  }

  if (typeof input === 'string') {
    return input;
  }

  return buildError(input, ctx,  "notString")
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

  return buildError(input, ctx,  "notNumber")
}

function decodeCodec(ctx, input, required, codec) {
  if (!required && input == null) {
    return input;
  }
  switch (codec) {
    case "Codec::ISO8061": {
      const d = new Date(input);
      if (isNaN(d.getTime())) {
        return buildError(input, ctx,  "notISO8061")
      }
      return d;
    }
  }
  return buildError(input, ctx,  "unknownCodec:"+codec)
}

function decodeStringWithFormat(ctx, input, required, format) {
  if (!required && input == null) {
    return input;
  }
  if (typeof input === 'string') {
    if (isCustomFormatValid(format, input)) {
      return input;
    }
    return buildError(input, ctx,  "notCustomFormat:"+format)
  }
  return buildError(input, ctx,  "notString")
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
  return buildError(input, ctx,  "notAnyOf")
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
  return buildError(input, ctx,  "notBoolean")
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
  return buildError(input, ctx,  "notNull")
}
function decodeConst(ctx, input, required, constValue) {
  if (!required && input == null) {
    return input;
  }
  if (input == constValue) {
    return constValue;
  }
  return buildError(input, ctx,  "notConst")
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

function AllTypes(ctx, input) {
    return decodeObject(ctx, input, true, {
        "allBooleans": (ctx, input)=>(decodeBoolean(ctx, input, true)),
        "allNumbers": (ctx, input)=>(decodeNumber(ctx, input, true)),
        "allStrings": (ctx, input)=>(decodeString(ctx, input, true)),
        "any": (ctx, input)=>(decodeAny(ctx, input, true)),
        "arrayOfStrings": (ctx, input)=>(decodeArray(ctx, input, true, (ctx, input)=>(decodeString(ctx, input, true)))),
        "booleanLiteral": (ctx, input)=>(decodeConst(ctx, input, true, true)),
        "interface": (ctx, input)=>(validators.Post(ctx, input, true)),
        "intersection": (ctx, input)=>(decodeAllOf(ctx, input, true, [
                (ctx, input)=>(decodeObject(ctx, input, true, {
                        "a": (ctx, input)=>(decodeConst(ctx, input, true, 1))
                    })),
                (ctx, input)=>(decodeObject(ctx, input, true, {
                        "b": (ctx, input)=>(decodeConst(ctx, input, true, 2))
                    }))
            ])),
        "null": (ctx, input)=>(decodeNull(ctx, input, true)),
        "numberLiteral": (ctx, input)=>(decodeConst(ctx, input, true, 123)),
        "optionalType": (ctx, input)=>(decodeArray(ctx, input, false, (ctx, input)=>(decodeNumber(ctx, input, true)))),
        "stringLiteral": (ctx, input)=>(decodeConst(ctx, input, true, "a")),
        "tuple": (ctx, input)=>(decodeTuple(ctx, input, true, {
                prefix: [
                    (ctx, input)=>(decodeString(ctx, input, true)),
                    (ctx, input)=>(decodeString(ctx, input, true))
                ]
            }, {
                items: null
            })),
        "tupleWithRest": (ctx, input)=>(decodeTuple(ctx, input, true, {
                prefix: [
                    (ctx, input)=>(decodeString(ctx, input, true)),
                    (ctx, input)=>(decodeString(ctx, input, true))
                ]
            }, {
                items: decodeNumber(ctx, input, true)
            })),
        "typeReference": (ctx, input)=>(validators.User(ctx, input, true)),
        "undefined": (ctx, input)=>(decodeNull(ctx, input, true)),
        "unionOfLiterals": (ctx, input)=>(decodeAnyOf(ctx, input, true, [
                (ctx, input)=>(decodeConst(ctx, input, true, "a")),
                (ctx, input)=>(decodeConst(ctx, input, true, "b")),
                (ctx, input)=>(decodeConst(ctx, input, true, "c"))
            ])),
        "unionOfTypes": (ctx, input)=>(decodeAnyOf(ctx, input, true, [
                (ctx, input)=>(decodeString(ctx, input, true)),
                (ctx, input)=>(decodeNumber(ctx, input, true))
            ])),
        "unionWithNull": (ctx, input)=>(decodeAnyOf(ctx, input, true, [
                (ctx, input)=>(decodeNull(ctx, input, true)),
                (ctx, input)=>(decodeNumber(ctx, input, true)),
                (ctx, input)=>(decodeArray(ctx, input, true, (ctx, input)=>(validators.User(ctx, input, true))))
            ])),
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

export default { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeConst, validators, isCustomFormatValid, registerStringFormat };