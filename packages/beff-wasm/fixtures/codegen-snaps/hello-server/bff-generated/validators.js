

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

function DataTypesKitchenSink(ctx, input) {
    return decodeObject(ctx, input, true, {
        "array1": (ctx, input)=>(decodeArray(ctx, input, true, (ctx, input)=>(decodeString(ctx, input, true)))),
        "array2": (ctx, input)=>(decodeArray(ctx, input, true, (ctx, input)=>(decodeString(ctx, input, true)))),
        "basic": (ctx, input)=>(decodeObject(ctx, input, true, {
                "a": (ctx, input)=>(decodeString(ctx, input, true)),
                "b": (ctx, input)=>(decodeNumber(ctx, input, true)),
                "c": (ctx, input)=>(decodeBoolean(ctx, input, true))
            })),
        "enum": (ctx, input)=>(decodeAnyOf(ctx, input, true, [
                (ctx, input)=>(decodeConst(ctx, input, true, "a")),
                (ctx, input)=>(decodeConst(ctx, input, true, "b")),
                (ctx, input)=>(decodeConst(ctx, input, true, "c"))
            ])),
        "literals": (ctx, input)=>(decodeObject(ctx, input, true, {
                "a": (ctx, input)=>(decodeConst(ctx, input, true, "a")),
                "b": (ctx, input)=>(decodeConst(ctx, input, true, 1)),
                "c": (ctx, input)=>(decodeConst(ctx, input, true, true))
            })),
        "many_nullable": (ctx, input)=>(decodeAnyOf(ctx, input, true, [
                (ctx, input)=>(decodeNull(ctx, input, true)),
                (ctx, input)=>(decodeString(ctx, input, true)),
                (ctx, input)=>(decodeNumber(ctx, input, true))
            ])),
        "nullable": (ctx, input)=>(decodeAnyOf(ctx, input, true, [
                (ctx, input)=>(decodeNull(ctx, input, true)),
                (ctx, input)=>(decodeString(ctx, input, true))
            ])),
        "optional_prop": (ctx, input)=>(decodeString(ctx, input, false)),
        "str_template": (ctx, input)=>(decodeConst(ctx, input, true, "ab")),
        "tuple1": (ctx, input)=>(decodeTuple(ctx, input, true, {
                prefix: [
                    (ctx, input)=>(decodeString(ctx, input, true))
                ]
            }, {
                items: null
            })),
        "tuple2": (ctx, input)=>(decodeTuple(ctx, input, true, {
                prefix: [
                    (ctx, input)=>(decodeString(ctx, input, true)),
                    (ctx, input)=>(decodeString(ctx, input, true))
                ]
            }, {
                items: null
            })),
        "tuple_lit": (ctx, input)=>(decodeTuple(ctx, input, true, {
                prefix: [
                    (ctx, input)=>(decodeConst(ctx, input, true, "a")),
                    (ctx, input)=>(decodeConst(ctx, input, true, 1)),
                    (ctx, input)=>(decodeConst(ctx, input, true, true))
                ]
            }, {
                items: null
            })),
        "tuple_rest": (ctx, input)=>(decodeTuple(ctx, input, true, {
                prefix: [
                    (ctx, input)=>(decodeString(ctx, input, true)),
                    (ctx, input)=>(decodeString(ctx, input, true))
                ]
            }, {
                items: decodeNumber(ctx, input, true)
            })),
        "union_of_many": (ctx, input)=>(decodeAnyOf(ctx, input, true, [
                (ctx, input)=>(decodeBoolean(ctx, input, true)),
                (ctx, input)=>(decodeString(ctx, input, true)),
                (ctx, input)=>(decodeNumber(ctx, input, true))
            ])),
        "union_with_undefined": (ctx, input)=>(decodeAnyOf(ctx, input, true, [
                (ctx, input)=>(decodeNull(ctx, input, true)),
                (ctx, input)=>(decodeString(ctx, input, true))
            ]))
    });
}
function EncodeDataTypesKitchenSink(input) {
    return {
        array1: input.array1.map((input)=>(input)),
        array2: input.array2.map((input)=>(input)),
        basic: {
            a: input.basic.a,
            b: input.basic.b,
            c: input.basic.c
        },
        enum: input.enum,
        literals: {
            a: input.literals.a,
            b: input.literals.b,
            c: input.literals.c
        },
        many_nullable: input.many_nullable,
        nullable: input.nullable,
        optional_prop: input.optional_prop,
        str_template: input.str_template,
        tuple1: [
            input.tuple1[0]
        ],
        tuple2: [
            input.tuple2[0],
            input.tuple2[1]
        ],
        tuple_lit: [
            input.tuple_lit[0],
            input.tuple_lit[1],
            input.tuple_lit[2]
        ],
        tuple_rest: [
            input.tuple_rest[0],
            input.tuple_rest[1],
            ...(input.tuple_rest.slice(2).map((input)=>(input)))
        ],
        union_of_many: input.union_of_many,
        union_with_undefined: input.union_with_undefined
    };
}
function A(ctx, input) {
    return decodeString(ctx, input, true);
}
function EncodeA(input) {
    return input;
}
function User(ctx, input) {
    return decodeObject(ctx, input, true, {
        "entities": (ctx, input)=>(decodeArray(ctx, input, true, (ctx, input)=>(validators.UserEntity(ctx, input, true)))),
        "id": (ctx, input)=>(decodeNumber(ctx, input, true)),
        "name": (ctx, input)=>(decodeString(ctx, input, true)),
        "optional_prop": (ctx, input)=>(decodeString(ctx, input, false))
    });
}
function EncodeUser(input) {
    return {
        entities: input.entities.map((input)=>(encoders.UserEntity(input))),
        id: input.id,
        name: input.name,
        optional_prop: input.optional_prop
    };
}
function UserEntity(ctx, input) {
    return decodeObject(ctx, input, true, {
        "id": (ctx, input)=>(decodeString(ctx, input, true)),
        "idA": (ctx, input)=>(validators.A(ctx, input, true))
    });
}
function EncodeUserEntity(input) {
    return {
        id: input.id,
        idA: encoders.A(input.idA)
    };
}
const validators = {
    DataTypesKitchenSink: DataTypesKitchenSink,
    A: A,
    User: User,
    UserEntity: UserEntity
};
const encoders = {
    DataTypesKitchenSink: EncodeDataTypesKitchenSink,
    A: EncodeA,
    User: EncodeUser,
    UserEntity: EncodeUserEntity
};

export default { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeConst, encodeCodec, validators, encoders, isCustomFormatValid, registerStringFormat };