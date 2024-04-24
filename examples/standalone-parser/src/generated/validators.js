//@ts-nocheck
/* eslint-disable */



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
function buildError(received, ctx, message) {
  if (ctx.errors == null) {
    ctx.errors = [];
  }
  ctx.errors.push({
    message,
    path: [...(ctx.paths ?? [])],
    received,
  });
}
function buildUnionError(received, ctx, errors) {
  if (ctx.errors == null) {
    ctx.errors = [];
  }
  ctx.errors.push({
    message: "expected one of",
    isUnionError: true,
    errors,
    path: [...(ctx.paths ?? [])],
    received,
  });
}

function decodeObject(ctx, input, required, data, additionalPropsValidator = null) {
  if (!required && input == null) {
    return input;
  }
  if (typeof input === "object" && !Array.isArray(input) && input !== null) {
    const acc = {};
    for (const [k, v] of Object.entries(data)) {
      pushPath(ctx, k);
      acc[k] = v(ctx, input[k]);
      popPath(ctx);
    }

    if (additionalPropsValidator != null) {
      for (const [k, v] of Object.entries(input)) {
        if (acc[k] == null) {
          pushPath(ctx, k);
          
          acc[k] = additionalPropsValidator(ctx, v);
          popPath(ctx);
        }
      }
    }
    return acc;
  }
  return buildError(input, ctx, "expected object");
}

function decodeArray(ctx, input, required, data) {
  if (!required && input == null) {
    return input;
  }
  if (Array.isArray(input)) {
    const acc = [];
    for (let i = 0; i < input.length; i++) {
      const v = input[i];
      pushPath(ctx, "[" + i + "]");
      acc.push(data(ctx, v));
      popPath(ctx);
    }
    return acc;
  }
  return buildError(input, ctx, "expected array");
}
function decodeString(ctx, input, required) {
  if (!required && input == null) {
    return input;
  }

  if (typeof input === "string") {
    return input;
  }

  return buildError(input, ctx, "expected string");
}

function decodeNumber(ctx, input, required) {
  if (!required && input == null) {
    return input;
  }
  if (typeof input === "number") {
    return input;
  }
  if (String(input).toLowerCase() == "nan") {
    return NaN;
  }

  return buildError(input, ctx, "expected number");
}

function decodeCodec(ctx, input, required, codec) {
  if (!required && input == null) {
    return input;
  }
  switch (codec) {
    case "Codec::ISO8061": {
      const d = new Date(input);
      if (isNaN(d.getTime())) {
        return buildError(input, ctx, "expected ISO8061 date");
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
        try {
          return BigInt(input);
        } catch (e) {
          
        }
      }
      return buildError(input, ctx, "expected bigint");
    }
  }
  return buildError(input, ctx, "codec " + codec + " not implemented");
}

function decodeStringWithFormat(ctx, input, required, format) {
  if (!required && input == null) {
    return input;
  }
  return input;
  
}


function decodeAnyOfConsts(ctx, input, required, consts) {
  if (!required && input == null) {
    return input;
  }
  for (const c of consts) {
    if (input === c) {
      return c;
    }
  }
  return buildError(input, ctx, "expected one of " + consts.map(it => JSON.stringify(it)).join(", "));
}
function decodeAnyOf(ctx, input, required, vs) {
  if (!required && input == null) {
    return input;
  }

  let accErrors = [];
  for (const v of vs) {
    const validatorCtx = {};
    const newValue = v(validatorCtx, input);
    if (validatorCtx.errors == null) {
      return newValue;
    }
    accErrors.push(...(validatorCtx.errors ?? []));
  }
  return buildUnionError(input, ctx, accErrors);
}
function decodeAllOf(ctx, input, required, vs) {
  if (!required && input == null) {
    return input;
  }
  let acc = {};
  let foundOneObject = false;
  let allObjects = true;
  for (const v of vs) {
    const newValue = v(ctx, input);
    const isObj = typeof newValue === "object";
    allObjects = allObjects && isObj;
    if (isObj) {
      foundOneObject = true;
      acc = { ...acc, ...newValue };
    }
  }
  if (foundOneObject && allObjects) {
    return acc;
  }
  return input;
}
function decodeTuple(ctx, input, required, vs) {
  if (!required && input == null) {
    return input;
  }
  if (Array.isArray(input)) {
    const acc = [];
    let idx = 0;
    for (const v of vs.prefix) {
      pushPath(ctx, "[" + idx + "]");
      const newValue = v(ctx, input[idx]);
      popPath(ctx);
      acc.push(newValue);
      idx++;
    }
    if (vs.items != null) {
      for (let i = idx; i < input.length; i++) {
        const v = input[i];
        pushPath(ctx, "[" + i + "]");
        acc.push(vs.items(ctx, v));
        popPath(ctx);
      }
    } else {
      if (input.length > idx) {
        return buildError(input, ctx, "tuple has too many items");
      }
    }
    return acc;
  }
  return buildError(input, ctx, "expected tuple");
}
function decodeBoolean(ctx, input, required) {
  if (!required && input == null) {
    return input;
  }
  if (typeof input === "boolean") {
    return input;
  }
  return buildError(input, ctx, "expected boolean");
}
function decodeAny(ctx, input, required) {
  return input;
}
function decodeNull(ctx, input, required) {
  if (!required && input == null) {
    return input;
  }
  if (input == "null" || input == "undefined") {
    return null;
  }
  if (input == null) {
    return null;
  }
  return buildError(input, ctx, "expected null");
}
function decodeConst(ctx, input, required, constValue) {
  if (!required && input == null) {
    return input;
  }
  if (input == constValue) {
    return constValue;
  }
  return buildError(input, ctx, "expected " + JSON.stringify(constValue));
}


function DecodeOmitSettings(ctx, input, required = true) {
    return decodeObject(ctx, input, required, {
        "d": (ctx, input)=>(decodeObject(ctx, input, true, {
                "tag": (ctx, input)=>(decodeConst(ctx, input, true, "d"))
            })),
        "level": (ctx, input)=>(decodeAnyOfConsts(ctx, input, true, [
                "a",
                "b"
            ]))
    });
}
function DecodeSettings(ctx, input, required = true) {
    return decodeObject(ctx, input, required, {
        "a": (ctx, input)=>(decodeString(ctx, input, true)),
        "d": (ctx, input)=>(decodeObject(ctx, input, true, {
                "tag": (ctx, input)=>(decodeConst(ctx, input, true, "d"))
            })),
        "level": (ctx, input)=>(decodeAnyOfConsts(ctx, input, true, [
                "a",
                "b"
            ]))
    });
}
function DecodePartialObject(ctx, input, required = true) {
    return decodeObject(ctx, input, required, {
        "a": (ctx, input)=>(decodeString(ctx, input, false)),
        "b": (ctx, input)=>(decodeNumber(ctx, input, false))
    });
}
function DecodeRequiredPartialObject(ctx, input, required = true) {
    return decodeObject(ctx, input, required, {
        "a": (ctx, input)=>(decodeString(ctx, input, true)),
        "b": (ctx, input)=>(decodeNumber(ctx, input, true))
    });
}
function DecodeLevelAndDSettings(ctx, input, required = true) {
    return decodeObject(ctx, input, required, {
        "d": (ctx, input)=>(decodeObject(ctx, input, true, {
                "tag": (ctx, input)=>(decodeConst(ctx, input, true, "d"))
            })),
        "level": (ctx, input)=>(decodeAnyOfConsts(ctx, input, true, [
                "a",
                "b"
            ]))
    });
}
function DecodePartialSettings(ctx, input, required = true) {
    return decodeObject(ctx, input, required, {
        "a": (ctx, input)=>(decodeString(ctx, input, false)),
        "d": (ctx, input)=>(decodeObject(ctx, input, false, {
                "tag": (ctx, input)=>(decodeConst(ctx, input, true, "d"))
            })),
        "level": (ctx, input)=>(decodeAnyOfConsts(ctx, input, false, [
                "a",
                "b"
            ]))
    });
}
function DecodeExtra(ctx, input, required = true) {
    return decodeObject(ctx, input, required, {}, (ctx, input)=>(decodeString(ctx, input, false)));
}
function DecodeAccessLevel(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, required, [
        "ADMIN",
        "USER"
    ]);
}
function DecodeAvatarSize(ctx, input, required = true) {
    return decodeString(ctx, input, required);
}
function DecodeUser(ctx, input, required = true) {
    return decodeObject(ctx, input, required, {
        "accessLevel": (ctx, input)=>(validators.AccessLevel(ctx, input, true)),
        "avatarSize": (ctx, input)=>(validators.AvatarSize(ctx, input, true)),
        "extra": (ctx, input)=>(validators.Extra(ctx, input, true)),
        "friends": (ctx, input)=>(decodeArray(ctx, input, true, (ctx, input)=>(validators.User(ctx, input, true)))),
        "name": (ctx, input)=>(decodeString(ctx, input, true))
    });
}
function DecodePublicUser(ctx, input, required = true) {
    return decodeObject(ctx, input, required, {
        "accessLevel": (ctx, input)=>(validators.AccessLevel(ctx, input, true)),
        "avatarSize": (ctx, input)=>(validators.AvatarSize(ctx, input, true)),
        "extra": (ctx, input)=>(validators.Extra(ctx, input, true)),
        "name": (ctx, input)=>(decodeString(ctx, input, true))
    });
}
function DecodeReq(ctx, input, required = true) {
    return decodeObject(ctx, input, required, {
        "optional": (ctx, input)=>(decodeString(ctx, input, true))
    });
}
function DecodeWithOptionals(ctx, input, required = true) {
    return decodeObject(ctx, input, required, {
        "optional": (ctx, input)=>(decodeString(ctx, input, false))
    });
}
function DecodeRepro1(ctx, input, required = true) {
    return decodeObject(ctx, input, required, {
        "sizes": (ctx, input)=>(validators.Repro2(ctx, input, false))
    });
}
function DecodeRepro2(ctx, input, required = true) {
    return decodeObject(ctx, input, required, {
        "useSmallerSizes": (ctx, input)=>(decodeBoolean(ctx, input, true))
    });
}
function DecodeSettingsUpdate(ctx, input, required = true) {
    return decodeAnyOf(ctx, input, required, [
        (ctx, input)=>(decodeString(ctx, input, required)),
        (ctx, input)=>(decodeObject(ctx, input, required, {
                "tag": (ctx, input)=>(decodeConst(ctx, input, true, "d"))
            }))
    ]);
}
function DecodeMapped(ctx, input, required = true) {
    return decodeObject(ctx, input, required, {
        "a": (ctx, input)=>(decodeObject(ctx, input, true, {
                "value": (ctx, input)=>(decodeConst(ctx, input, true, "a"))
            })),
        "b": (ctx, input)=>(decodeObject(ctx, input, true, {
                "value": (ctx, input)=>(decodeConst(ctx, input, true, "b"))
            }))
    });
}
function DecodeMappedOptional(ctx, input, required = true) {
    return decodeObject(ctx, input, required, {
        "a": (ctx, input)=>(decodeObject(ctx, input, false, {
                "value": (ctx, input)=>(decodeConst(ctx, input, true, "a"))
            })),
        "b": (ctx, input)=>(decodeObject(ctx, input, false, {
                "value": (ctx, input)=>(decodeConst(ctx, input, true, "b"))
            }))
    });
}
const validators = {
    OmitSettings: DecodeOmitSettings,
    Settings: DecodeSettings,
    PartialObject: DecodePartialObject,
    RequiredPartialObject: DecodeRequiredPartialObject,
    LevelAndDSettings: DecodeLevelAndDSettings,
    PartialSettings: DecodePartialSettings,
    Extra: DecodeExtra,
    AccessLevel: DecodeAccessLevel,
    AvatarSize: DecodeAvatarSize,
    User: DecodeUser,
    PublicUser: DecodePublicUser,
    Req: DecodeReq,
    WithOptionals: DecodeWithOptionals,
    Repro1: DecodeRepro1,
    Repro2: DecodeRepro2,
    SettingsUpdate: DecodeSettingsUpdate,
    Mapped: DecodeMapped,
    MappedOptional: DecodeMappedOptional
};

export default { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeConst, validators };