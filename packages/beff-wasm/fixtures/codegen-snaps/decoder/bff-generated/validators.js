

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

function encodeAllOf(cbs, value) {
  throw new Error("encodeAllOf not implemented");
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
function EncodeAllTypes(input) {
    return {
        allBooleans: input.allBooleans,
        allNumbers: input.allNumbers,
        allStrings: input.allStrings,
        any: input.any,
        arrayOfStrings: input.arrayOfStrings.map((input)=>(input)),
        booleanLiteral: input.booleanLiteral,
        interface: encoders.Post(input.interface),
        intersection: encodeAllOf([
            (input)=>({
                    a: input.a
                }),
            (input)=>({
                    b: input.b
                })
        ], input.intersection),
        null: input.null,
        numberLiteral: input.numberLiteral,
        optionalType: input.optionalType.map((input)=>(input)),
        stringLiteral: input.stringLiteral,
        tuple: [
            input.tuple[0],
            input.tuple[1]
        ],
        tupleWithRest: [
            input.tupleWithRest[0],
            input.tupleWithRest[1],
            ...(input.tupleWithRest.slice(2).map((input)=>(input)))
        ],
        typeReference: encoders.User(input.typeReference),
        undefined: input.undefined,
        unionOfLiterals: encodeAnyOf([
            (input)=>(input),
            (input)=>(input),
            (input)=>(input)
        ], input.unionOfLiterals),
        unionOfTypes: encodeAnyOf([
            (input)=>(input),
            (input)=>(input)
        ], input.unionOfTypes),
        unionWithNull: encodeAnyOf([
            (input)=>(input),
            (input)=>(input),
            (input)=>(input.map((input)=>(encoders.User(input))))
        ], input.unionWithNull),
        unknown: input.unknown
    };
}
function Post(ctx, input) {
    return decodeObject(ctx, input, true, {
        "content": (ctx, input)=>(decodeString(ctx, input, true)),
        "id": (ctx, input)=>(decodeString(ctx, input, true))
    });
}
function EncodePost(input) {
    return {
        content: input.content,
        id: input.id
    };
}
function User(ctx, input) {
    return decodeObject(ctx, input, true, {
        "friends": (ctx, input)=>(decodeArray(ctx, input, true, (ctx, input)=>(validators.User(ctx, input, true)))),
        "id": (ctx, input)=>(decodeString(ctx, input, true))
    });
}
function EncodeUser(input) {
    return {
        friends: input.friends.map((input)=>(encoders.User(input))),
        id: input.id
    };
}
const validators = {
    AllTypes: AllTypes,
    Post: Post,
    User: User
};
const encoders = {
    AllTypes: EncodeAllTypes,
    Post: EncodePost,
    User: EncodeUser
};

export default { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeConst, encodeCodec, encodeAnyOf, encodeAllOf, validators, encoders, isCustomFormatValid, registerStringFormat };