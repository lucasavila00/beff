//@ts-nocheck
/* eslint-disable */




const customFormatters = {}

function registerCustomFormatter(name, validator) {
  customFormatters[name] = validator;
}

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

  const disallowExtraProperties = ctx?.disallowExtraProperties ?? false;

  const allowedExtraProperties = ctx.allowedExtraProperties__ ?? []

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

    if (disallowExtraProperties) {
      for (const k of Object.keys(input)) {
        if (acc[k] == null && allowedExtraProperties.indexOf(k) == -1) {
          pushPath(ctx, k);
          buildError(input[k], ctx, "extra property");
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

function decodeFunction(ctx, input, required) {
  if (!required && input == null) {
    return input;
  }
  if (typeof input === "function") {
    return input;
  }
  return buildError(input, ctx, "expected function");
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
  if (typeof input !== "string") {
    return buildError(input, ctx, "expected string with format " + JSON.stringify(format));
  }

  const validator = customFormatters[format];

  if (validator == null) {
    return buildError(input, ctx, "format " + JSON.stringify(format) + " not implemented");
  }

  const isOk = validator(input);
  if (isOk) {
    return input;
  }
  return buildError(input, ctx, "expected string with format " + JSON.stringify(format));
}

function decodeAnyOfDiscriminated(ctx, input, required, discriminator, mapping) {
  if (!required && input == null) {
    return input;
  }
  const d = input[discriminator];
  if (d == null) {
    return buildError(input, ctx, "expected discriminator key " + JSON.stringify(discriminator))
  }
  const v = mapping[d];
  if (v == null) {
    pushPath(ctx, discriminator);
    const err = buildError(d, ctx, "expected one of " + Object.keys(mapping).map(it => JSON.stringify(it)).join(", "));
    popPath(ctx);
    return err;
  }
  const prevAllow = (ctx.allowedExtraProperties__ ?? []);
  ctx.allowedExtraProperties__ = [...prevAllow, discriminator]
  const out = v(ctx, input);
  ctx.allowedExtraProperties__ = prevAllow;
  return { ...out, [discriminator]: d };
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
  if (input == null) {
    return null;
  }
  return buildError(input, ctx, "expected null");
}
function decodeNever(ctx, input, required) {
  if (!required && input == null) {
    return input;
  }
  return buildError(input, ctx, "never");
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

function decodeRegex(ctx, input, required, regex, description) {
  if (!required && input == null) {
    return input;
  }
  if (typeof input === "string") {
    if (regex.test(input)) {
      return input;
    }
  }
  return buildError(input, ctx, "expected string matching " + description);
}

function DecodeAllTs(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, required, [
        "a",
        "b"
    ]);
}
function DecodeAObject(ctx, input, required = true) {
    return decodeObject(ctx, input, required, {
        "tag": (ctx, input)=>(decodeConst(ctx, input, true, "a"))
    });
}
function DecodeVersion(ctx, input, required = true) {
    return decodeRegex(ctx, input, required, /(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "${number}.${number}.${number}");
}
function DecodeVersion2(ctx, input, required = true) {
    return decodeRegex(ctx, input, required, /(v)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "v${number}.${number}.${number}");
}
function DecodeAccessLevel2(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, required, [
        "ADMIN Admin",
        "USER User"
    ]);
}
function DecodeAccessLevelTpl2(ctx, input, required = true) {
    return decodeRegex(ctx, input, required, /((ADMIN Admin)|(USER User))/, '("ADMIN Admin" | "USER User")');
}
function DecodeAccessLevel(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, required, [
        "ADMIN",
        "USER"
    ]);
}
function DecodeAccessLevelTpl(ctx, input, required = true) {
    return decodeRegex(ctx, input, required, /((ADMIN)|(USER))/, '("ADMIN" | "USER")');
}
function DecodeArr3(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, required, [
        "X",
        "Y"
    ]);
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
function DecodeAvatarSize(ctx, input, required = true) {
    return decodeRegex(ctx, input, required, /(\d+(\.\d+)?)(x)(\d+(\.\d+)?)/, "${number}x${number}");
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
function DecodeDiscriminatedUnion(ctx, input, required = true) {
    return decodeAnyOfDiscriminated(ctx, input, required, "type", {
        "a": (ctx, input)=>(decodeAnyOfDiscriminated(ctx, input, true, "subType", {
                "a1": (ctx, input)=>(decodeObject(ctx, input, true, {
                        "a1": (ctx, input)=>(decodeString(ctx, input, true)),
                        "a11": (ctx, input)=>(decodeString(ctx, input, false))
                    })),
                "a2": (ctx, input)=>(decodeObject(ctx, input, true, {
                        "a2": (ctx, input)=>(decodeString(ctx, input, true))
                    }))
            })),
        "b": (ctx, input)=>(decodeObject(ctx, input, true, {
                "value": (ctx, input)=>(decodeNumber(ctx, input, true))
            }))
    });
}
function DecodeDiscriminatedUnion2(ctx, input, required = true) {
    return decodeAnyOf(ctx, input, required, [
        (ctx, input)=>(decodeObject(ctx, input, required, {
                "a1": (ctx, input)=>(decodeString(ctx, input, true)),
                "a11": (ctx, input)=>(decodeString(ctx, input, false)),
                "subType": (ctx, input)=>(decodeConst(ctx, input, true, "a1")),
                "type": (ctx, input)=>(decodeConst(ctx, input, true, "a"))
            })),
        (ctx, input)=>(decodeObject(ctx, input, required, {
                "a2": (ctx, input)=>(decodeString(ctx, input, true)),
                "subType": (ctx, input)=>(decodeConst(ctx, input, true, "a2")),
                "type": (ctx, input)=>(decodeConst(ctx, input, true, "a"))
            })),
        (ctx, input)=>(decodeObject(ctx, input, required, {
                "type": (ctx, input)=>(decodeConst(ctx, input, false, "d")),
                "valueD": (ctx, input)=>(decodeNumber(ctx, input, true))
            })),
        (ctx, input)=>(decodeObject(ctx, input, required, {
                "type": (ctx, input)=>(decodeConst(ctx, input, true, "b")),
                "value": (ctx, input)=>(decodeNumber(ctx, input, true))
            }))
    ]);
}
function DecodeDiscriminatedUnion3(ctx, input, required = true) {
    return decodeAnyOfDiscriminated(ctx, input, required, "type", {
        "a": (ctx, input)=>(decodeObject(ctx, input, true, {
                "a1": (ctx, input)=>(decodeString(ctx, input, true))
            })),
        "b": (ctx, input)=>(decodeObject(ctx, input, true, {
                "value": (ctx, input)=>(decodeNumber(ctx, input, true))
            })),
        "c": (ctx, input)=>(decodeObject(ctx, input, true, {
                "a1": (ctx, input)=>(decodeString(ctx, input, true))
            }))
    });
}
function DecodeDiscriminatedUnion4(ctx, input, required = true) {
    return decodeAnyOfDiscriminated(ctx, input, required, "type", {
        "a": (ctx, input)=>(decodeAnyOf(ctx, input, true, [
                (ctx, input)=>(decodeObject(ctx, input, true, {
                        "a": (ctx, input)=>(decodeObject(ctx, input, true, {
                                "a1": (ctx, input)=>(decodeString(ctx, input, true)),
                                "subType": (ctx, input)=>(decodeConst(ctx, input, true, "a1"))
                            }))
                    })),
                (ctx, input)=>(decodeObject(ctx, input, true, {
                        "a": (ctx, input)=>(decodeObject(ctx, input, true, {
                                "a2": (ctx, input)=>(decodeString(ctx, input, true)),
                                "subType": (ctx, input)=>(decodeConst(ctx, input, true, "a2"))
                            }))
                    }))
            ]))
    });
}
function DecodeAllTypes(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, required, [
        "LevelAndDSettings",
        "OmitSettings",
        "PartialSettings",
        "RequiredPartialObject"
    ]);
}
function DecodeOtherEnum(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, required, [
        "a",
        "b"
    ]);
}
function DecodeArr2(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, required, [
        "A",
        "B",
        "C"
    ]);
}
function DecodeValidCurrency(ctx, input, required = true) {
    return decodeStringWithFormat(ctx, input, required, "ValidCurrency");
}
function DecodeUnionWithEnumAccess(ctx, input, required = true) {
    return decodeAnyOfDiscriminated(ctx, input, required, "tag", {
        "a": (ctx, input)=>(decodeObject(ctx, input, true, {
                "value": (ctx, input)=>(decodeString(ctx, input, true))
            })),
        "b": (ctx, input)=>(decodeObject(ctx, input, true, {
                "value": (ctx, input)=>(decodeNumber(ctx, input, true))
            })),
        "c": (ctx, input)=>(decodeObject(ctx, input, true, {
                "value": (ctx, input)=>(decodeBoolean(ctx, input, true))
            }))
    });
}
function DecodeShape(ctx, input, required = true) {
    return decodeAnyOfDiscriminated(ctx, input, required, "kind", {
        "circle": (ctx, input)=>(decodeObject(ctx, input, true, {
                "radius": (ctx, input)=>(decodeNumber(ctx, input, true))
            })),
        "square": (ctx, input)=>(decodeObject(ctx, input, true, {
                "x": (ctx, input)=>(decodeNumber(ctx, input, true))
            })),
        "triangle": (ctx, input)=>(decodeObject(ctx, input, true, {
                "x": (ctx, input)=>(decodeNumber(ctx, input, true)),
                "y": (ctx, input)=>(decodeNumber(ctx, input, true))
            }))
    });
}
function DecodeT3(ctx, input, required = true) {
    return decodeAnyOfDiscriminated(ctx, input, required, "kind", {
        "square": (ctx, input)=>(decodeObject(ctx, input, true, {
                "x": (ctx, input)=>(decodeNumber(ctx, input, true))
            })),
        "triangle": (ctx, input)=>(decodeObject(ctx, input, true, {
                "x": (ctx, input)=>(decodeNumber(ctx, input, true)),
                "y": (ctx, input)=>(decodeNumber(ctx, input, true))
            }))
    });
}
function DecodeBObject(ctx, input, required = true) {
    return decodeObject(ctx, input, required, {
        "tag": (ctx, input)=>(decodeConst(ctx, input, true, "b"))
    });
}
function DecodeDEF(ctx, input, required = true) {
    return decodeObject(ctx, input, required, {
        "a": (ctx, input)=>(decodeString(ctx, input, true))
    });
}
function DecodeKDEF(ctx, input, required = true) {
    return decodeConst(ctx, input, required, "a");
}
function DecodeABC(ctx, input, required = true) {
    return decodeObject(ctx, input, required, {});
}
function DecodeKABC(ctx, input, required = true) {
    return decodeNever(ctx, input, required);
}
function DecodeK(ctx, input, required = true) {
    return decodeAnyOf(ctx, input, required, [
        (ctx, input)=>(validators.KABC(ctx, input, required)),
        (ctx, input)=>(validators.KDEF(ctx, input, required))
    ]);
}
const validators = {
    AllTs: DecodeAllTs,
    AObject: DecodeAObject,
    Version: DecodeVersion,
    Version2: DecodeVersion2,
    AccessLevel2: DecodeAccessLevel2,
    AccessLevelTpl2: DecodeAccessLevelTpl2,
    AccessLevel: DecodeAccessLevel,
    AccessLevelTpl: DecodeAccessLevelTpl,
    Arr3: DecodeArr3,
    OmitSettings: DecodeOmitSettings,
    Settings: DecodeSettings,
    PartialObject: DecodePartialObject,
    RequiredPartialObject: DecodeRequiredPartialObject,
    LevelAndDSettings: DecodeLevelAndDSettings,
    PartialSettings: DecodePartialSettings,
    Extra: DecodeExtra,
    AvatarSize: DecodeAvatarSize,
    User: DecodeUser,
    PublicUser: DecodePublicUser,
    Req: DecodeReq,
    WithOptionals: DecodeWithOptionals,
    Repro1: DecodeRepro1,
    Repro2: DecodeRepro2,
    SettingsUpdate: DecodeSettingsUpdate,
    Mapped: DecodeMapped,
    MappedOptional: DecodeMappedOptional,
    DiscriminatedUnion: DecodeDiscriminatedUnion,
    DiscriminatedUnion2: DecodeDiscriminatedUnion2,
    DiscriminatedUnion3: DecodeDiscriminatedUnion3,
    DiscriminatedUnion4: DecodeDiscriminatedUnion4,
    AllTypes: DecodeAllTypes,
    OtherEnum: DecodeOtherEnum,
    Arr2: DecodeArr2,
    ValidCurrency: DecodeValidCurrency,
    UnionWithEnumAccess: DecodeUnionWithEnumAccess,
    Shape: DecodeShape,
    T3: DecodeT3,
    BObject: DecodeBObject,
    DEF: DecodeDEF,
    KDEF: DecodeKDEF,
    ABC: DecodeABC,
    KABC: DecodeKABC,
    K: DecodeK
};

export default { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeFunction, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeNever, decodeConst, registerCustomFormatter, validators };