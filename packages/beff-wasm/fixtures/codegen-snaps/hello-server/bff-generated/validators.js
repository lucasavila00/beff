

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
function A(ctx, input) {
    return decodeString(ctx, input, true);
}
function User(ctx, input) {
    return decodeObject(ctx, input, true, {
        "entities": (ctx, input)=>(decodeArray(ctx, input, true, (ctx, input)=>(validators.UserEntity(ctx, input, true)))),
        "id": (ctx, input)=>(decodeNumber(ctx, input, true)),
        "name": (ctx, input)=>(decodeString(ctx, input, true)),
        "optional_prop": (ctx, input)=>(decodeString(ctx, input, false))
    });
}
function UserEntity(ctx, input) {
    return decodeObject(ctx, input, true, {
        "id": (ctx, input)=>(decodeString(ctx, input, true)),
        "idA": (ctx, input)=>(validators.A(ctx, input, true))
    });
}
const validators = {
    DataTypesKitchenSink: DataTypesKitchenSink,
    A: A,
    User: User,
    UserEntity: UserEntity
};

export default { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeConst, validators, isCustomFormatValid, registerStringFormat };