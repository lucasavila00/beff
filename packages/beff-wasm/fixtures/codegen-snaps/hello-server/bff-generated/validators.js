

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

function DataTypesKitchenSink(ctx, input) {
    return decodeObject(ctx, input, true, {
        "array1": (ctx, input)=>(decodeArray(ctx, input, true, (ctx, input)=>(decodeString(ctx, input, true)))),
        "array2": (ctx, input)=>(decodeArray(ctx, input, true, (ctx, input)=>(decodeString(ctx, input, true)))),
        "basic": (ctx, input)=>(decodeObject(ctx, input, true, {
                "a": (ctx, input)=>(decodeString(ctx, input, true)),
                "b": (ctx, input)=>(decodeNumber(ctx, input, true)),
                "c": (ctx, input)=>(decodeBoolean(ctx, input, true))
            })),
        "enum": (ctx, input)=>(todoAnyOf(ctx, input, true)),
        "literals": (ctx, input)=>(decodeObject(ctx, input, true, {
                "a": (ctx, input)=>(todConsto(ctx, input, true)),
                "b": (ctx, input)=>(todConsto(ctx, input, true)),
                "c": (ctx, input)=>(todConsto(ctx, input, true))
            })),
        "many_nullable": (ctx, input)=>(todoAnyOf(ctx, input, true)),
        "nullable": (ctx, input)=>(todoAnyOf(ctx, input, true)),
        "optional_prop": (ctx, input)=>(decodeString(ctx, input, false)),
        "str_template": (ctx, input)=>(todConsto(ctx, input, true)),
        "tuple1": (ctx, input)=>(todo(ctx, input, true)),
        "tuple2": (ctx, input)=>(todo(ctx, input, true)),
        "tuple_lit": (ctx, input)=>(todo(ctx, input, true)),
        "tuple_rest": (ctx, input)=>(todo(ctx, input, true)),
        "union_of_many": (ctx, input)=>(todoAnyOf(ctx, input, true)),
        "union_with_undefined": (ctx, input)=>(todoAnyOf(ctx, input, true))
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

export default { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeStringWithFormat, validators, isCustomFormatInvalid, isCodecInvalid, registerStringFormat };