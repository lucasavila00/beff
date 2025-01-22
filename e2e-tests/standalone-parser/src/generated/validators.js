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

function DecodeTransportedValue(ctx, input, required = true) {
    return decodeAnyOf(ctx, input, required, hoisted_TransportedValue_1);
}
function DecodeAllTs(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, required, hoisted_AllTs_2);
}
function DecodeAObject(ctx, input, required = true) {
    return decodeObject(ctx, input, required, hoisted_AObject_3);
}
function DecodeVersion(ctx, input, required = true) {
    return decodeRegex(ctx, input, required, /(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "${number}.${number}.${number}");
}
function DecodeVersion2(ctx, input, required = true) {
    return decodeRegex(ctx, input, required, /(v)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "v${number}.${number}.${number}");
}
function DecodeAccessLevel2(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, required, hoisted_AccessLevel2_4);
}
function DecodeAccessLevelTpl2(ctx, input, required = true) {
    return decodeRegex(ctx, input, required, /((ADMIN Admin)|(USER User))/, '("ADMIN Admin" | "USER User")');
}
function DecodeAccessLevel(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, required, hoisted_AccessLevel_5);
}
function DecodeAccessLevelTpl(ctx, input, required = true) {
    return decodeRegex(ctx, input, required, /((ADMIN)|(USER))/, '("ADMIN" | "USER")');
}
function DecodeArr3(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, required, hoisted_Arr3_6);
}
function DecodeOmitSettings(ctx, input, required = true) {
    return decodeObject(ctx, input, required, hoisted_OmitSettings_9);
}
function DecodeSettings(ctx, input, required = true) {
    return decodeObject(ctx, input, required, hoisted_Settings_12);
}
function DecodePartialObject(ctx, input, required = true) {
    return decodeObject(ctx, input, required, hoisted_PartialObject_13);
}
function DecodeRequiredPartialObject(ctx, input, required = true) {
    return decodeObject(ctx, input, required, hoisted_RequiredPartialObject_14);
}
function DecodeLevelAndDSettings(ctx, input, required = true) {
    return decodeObject(ctx, input, required, hoisted_LevelAndDSettings_17);
}
function DecodePartialSettings(ctx, input, required = true) {
    return decodeObject(ctx, input, required, hoisted_PartialSettings_20);
}
function DecodeExtra(ctx, input, required = true) {
    return decodeObject(ctx, input, required, hoisted_Extra_21, (ctx, input)=>(decodeString(ctx, input, false)));
}
function DecodeAvatarSize(ctx, input, required = true) {
    return decodeRegex(ctx, input, required, /(\d+(\.\d+)?)(x)(\d+(\.\d+)?)/, "${number}x${number}");
}
function DecodeUser(ctx, input, required = true) {
    return decodeObject(ctx, input, required, hoisted_User_22);
}
function DecodePublicUser(ctx, input, required = true) {
    return decodeObject(ctx, input, required, hoisted_PublicUser_23);
}
function DecodeReq(ctx, input, required = true) {
    return decodeObject(ctx, input, required, hoisted_Req_24);
}
function DecodeWithOptionals(ctx, input, required = true) {
    return decodeObject(ctx, input, required, hoisted_WithOptionals_25);
}
function DecodeRepro1(ctx, input, required = true) {
    return decodeObject(ctx, input, required, hoisted_Repro1_26);
}
function DecodeRepro2(ctx, input, required = true) {
    return decodeObject(ctx, input, required, hoisted_Repro2_27);
}
function DecodeSettingsUpdate(ctx, input, required = true) {
    return decodeAnyOf(ctx, input, required, hoisted_SettingsUpdate_29);
}
function DecodeMapped(ctx, input, required = true) {
    return decodeObject(ctx, input, required, hoisted_Mapped_32);
}
function DecodeMappedOptional(ctx, input, required = true) {
    return decodeObject(ctx, input, required, hoisted_MappedOptional_35);
}
function DecodeDiscriminatedUnion(ctx, input, required = true) {
    return decodeAnyOfDiscriminated(ctx, input, required, "type", hoisted_DiscriminatedUnion_40);
}
function DecodeDiscriminatedUnion2(ctx, input, required = true) {
    return decodeAnyOf(ctx, input, required, hoisted_DiscriminatedUnion2_45);
}
function DecodeDiscriminatedUnion3(ctx, input, required = true) {
    return decodeAnyOfDiscriminated(ctx, input, required, "type", hoisted_DiscriminatedUnion3_49);
}
function DecodeDiscriminatedUnion4(ctx, input, required = true) {
    return decodeAnyOfDiscriminated(ctx, input, required, "type", hoisted_DiscriminatedUnion4_55);
}
function DecodeAllTypes(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, required, hoisted_AllTypes_56);
}
function DecodeOtherEnum(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, required, hoisted_OtherEnum_57);
}
function DecodeArr2(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, required, hoisted_Arr2_58);
}
function DecodeValidCurrency(ctx, input, required = true) {
    return decodeStringWithFormat(ctx, input, required, "ValidCurrency");
}
function DecodeUnionWithEnumAccess(ctx, input, required = true) {
    return decodeAnyOfDiscriminated(ctx, input, required, "tag", hoisted_UnionWithEnumAccess_62);
}
function DecodeShape(ctx, input, required = true) {
    return decodeAnyOfDiscriminated(ctx, input, required, "kind", hoisted_Shape_66);
}
function DecodeT3(ctx, input, required = true) {
    return decodeAnyOfDiscriminated(ctx, input, required, "kind", hoisted_T3_69);
}
function DecodeBObject(ctx, input, required = true) {
    return decodeObject(ctx, input, required, hoisted_BObject_70);
}
function DecodeDEF(ctx, input, required = true) {
    return decodeObject(ctx, input, required, hoisted_DEF_71);
}
function DecodeKDEF(ctx, input, required = true) {
    return decodeConst(ctx, input, required, "a");
}
function DecodeABC(ctx, input, required = true) {
    return decodeObject(ctx, input, required, hoisted_ABC_72);
}
function DecodeKABC(ctx, input, required = true) {
    return decodeNever(ctx, input, required);
}
function DecodeK(ctx, input, required = true) {
    return decodeAnyOf(ctx, input, required, hoisted_K_73);
}
const validators = {
    TransportedValue: DecodeTransportedValue,
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
const hoisted_TransportedValue_0 = [
    (ctx, input)=>(decodeNull(ctx, input, true)),
    (ctx, input)=>(decodeString(ctx, input, true)),
    (ctx, input)=>(decodeNumber(ctx, input, true))
];
const hoisted_TransportedValue_1 = [
    (ctx, input)=>(decodeNull(ctx, input, true)),
    (ctx, input)=>(decodeString(ctx, input, true)),
    (ctx, input)=>(decodeArray(ctx, input, true, (ctx, input)=>(decodeAnyOf(ctx, input, true, hoisted_TransportedValue_0))))
];
const hoisted_AllTs_2 = [
    "a",
    "b"
];
const hoisted_AObject_3 = {
    "tag": (ctx, input)=>(decodeConst(ctx, input, true, "a"))
};
const hoisted_AccessLevel2_4 = [
    "ADMIN Admin",
    "USER User"
];
const hoisted_AccessLevel_5 = [
    "ADMIN",
    "USER"
];
const hoisted_Arr3_6 = [
    "X",
    "Y"
];
const hoisted_OmitSettings_7 = {
    "tag": (ctx, input)=>(decodeConst(ctx, input, true, "d"))
};
const hoisted_OmitSettings_8 = [
    "a",
    "b"
];
const hoisted_OmitSettings_9 = {
    "d": (ctx, input)=>(decodeObject(ctx, input, true, hoisted_OmitSettings_7)),
    "level": (ctx, input)=>(decodeAnyOfConsts(ctx, input, true, hoisted_OmitSettings_8))
};
const hoisted_Settings_10 = {
    "tag": (ctx, input)=>(decodeConst(ctx, input, true, "d"))
};
const hoisted_Settings_11 = [
    "a",
    "b"
];
const hoisted_Settings_12 = {
    "a": (ctx, input)=>(decodeString(ctx, input, true)),
    "d": (ctx, input)=>(decodeObject(ctx, input, true, hoisted_Settings_10)),
    "level": (ctx, input)=>(decodeAnyOfConsts(ctx, input, true, hoisted_Settings_11))
};
const hoisted_PartialObject_13 = {
    "a": (ctx, input)=>(decodeString(ctx, input, false)),
    "b": (ctx, input)=>(decodeNumber(ctx, input, false))
};
const hoisted_RequiredPartialObject_14 = {
    "a": (ctx, input)=>(decodeString(ctx, input, true)),
    "b": (ctx, input)=>(decodeNumber(ctx, input, true))
};
const hoisted_LevelAndDSettings_15 = {
    "tag": (ctx, input)=>(decodeConst(ctx, input, true, "d"))
};
const hoisted_LevelAndDSettings_16 = [
    "a",
    "b"
];
const hoisted_LevelAndDSettings_17 = {
    "d": (ctx, input)=>(decodeObject(ctx, input, true, hoisted_LevelAndDSettings_15)),
    "level": (ctx, input)=>(decodeAnyOfConsts(ctx, input, true, hoisted_LevelAndDSettings_16))
};
const hoisted_PartialSettings_18 = {
    "tag": (ctx, input)=>(decodeConst(ctx, input, true, "d"))
};
const hoisted_PartialSettings_19 = [
    "a",
    "b"
];
const hoisted_PartialSettings_20 = {
    "a": (ctx, input)=>(decodeString(ctx, input, false)),
    "d": (ctx, input)=>(decodeObject(ctx, input, false, hoisted_PartialSettings_18)),
    "level": (ctx, input)=>(decodeAnyOfConsts(ctx, input, false, hoisted_PartialSettings_19))
};
const hoisted_Extra_21 = {};
const hoisted_User_22 = {
    "accessLevel": (ctx, input)=>(validators.AccessLevel(ctx, input, true)),
    "avatarSize": (ctx, input)=>(validators.AvatarSize(ctx, input, true)),
    "extra": (ctx, input)=>(validators.Extra(ctx, input, true)),
    "friends": (ctx, input)=>(decodeArray(ctx, input, true, (ctx, input)=>(validators.User(ctx, input, true)))),
    "name": (ctx, input)=>(decodeString(ctx, input, true))
};
const hoisted_PublicUser_23 = {
    "accessLevel": (ctx, input)=>(validators.AccessLevel(ctx, input, true)),
    "avatarSize": (ctx, input)=>(validators.AvatarSize(ctx, input, true)),
    "extra": (ctx, input)=>(validators.Extra(ctx, input, true)),
    "name": (ctx, input)=>(decodeString(ctx, input, true))
};
const hoisted_Req_24 = {
    "optional": (ctx, input)=>(decodeString(ctx, input, true))
};
const hoisted_WithOptionals_25 = {
    "optional": (ctx, input)=>(decodeString(ctx, input, false))
};
const hoisted_Repro1_26 = {
    "sizes": (ctx, input)=>(validators.Repro2(ctx, input, false))
};
const hoisted_Repro2_27 = {
    "useSmallerSizes": (ctx, input)=>(decodeBoolean(ctx, input, true))
};
const hoisted_SettingsUpdate_28 = {
    "tag": (ctx, input)=>(decodeConst(ctx, input, true, "d"))
};
const hoisted_SettingsUpdate_29 = [
    (ctx, input)=>(decodeString(ctx, input, true)),
    (ctx, input)=>(decodeObject(ctx, input, true, hoisted_SettingsUpdate_28))
];
const hoisted_Mapped_30 = {
    "value": (ctx, input)=>(decodeConst(ctx, input, true, "a"))
};
const hoisted_Mapped_31 = {
    "value": (ctx, input)=>(decodeConst(ctx, input, true, "b"))
};
const hoisted_Mapped_32 = {
    "a": (ctx, input)=>(decodeObject(ctx, input, true, hoisted_Mapped_30)),
    "b": (ctx, input)=>(decodeObject(ctx, input, true, hoisted_Mapped_31))
};
const hoisted_MappedOptional_33 = {
    "value": (ctx, input)=>(decodeConst(ctx, input, true, "a"))
};
const hoisted_MappedOptional_34 = {
    "value": (ctx, input)=>(decodeConst(ctx, input, true, "b"))
};
const hoisted_MappedOptional_35 = {
    "a": (ctx, input)=>(decodeObject(ctx, input, false, hoisted_MappedOptional_33)),
    "b": (ctx, input)=>(decodeObject(ctx, input, false, hoisted_MappedOptional_34))
};
const hoisted_DiscriminatedUnion_36 = {
    "a1": (ctx, input)=>(decodeString(ctx, input, true)),
    "a11": (ctx, input)=>(decodeString(ctx, input, false))
};
const hoisted_DiscriminatedUnion_37 = {
    "a2": (ctx, input)=>(decodeString(ctx, input, true))
};
const hoisted_DiscriminatedUnion_38 = {
    "a1": (ctx, input)=>(decodeObject(ctx, input, true, hoisted_DiscriminatedUnion_36)),
    "a2": (ctx, input)=>(decodeObject(ctx, input, true, hoisted_DiscriminatedUnion_37))
};
const hoisted_DiscriminatedUnion_39 = {
    "value": (ctx, input)=>(decodeNumber(ctx, input, true))
};
const hoisted_DiscriminatedUnion_40 = {
    "a": (ctx, input)=>(decodeAnyOfDiscriminated(ctx, input, true, "subType", hoisted_DiscriminatedUnion_38)),
    "b": (ctx, input)=>(decodeObject(ctx, input, true, hoisted_DiscriminatedUnion_39))
};
const hoisted_DiscriminatedUnion2_41 = {
    "a1": (ctx, input)=>(decodeString(ctx, input, true)),
    "a11": (ctx, input)=>(decodeString(ctx, input, false)),
    "subType": (ctx, input)=>(decodeConst(ctx, input, true, "a1")),
    "type": (ctx, input)=>(decodeConst(ctx, input, true, "a"))
};
const hoisted_DiscriminatedUnion2_42 = {
    "a2": (ctx, input)=>(decodeString(ctx, input, true)),
    "subType": (ctx, input)=>(decodeConst(ctx, input, true, "a2")),
    "type": (ctx, input)=>(decodeConst(ctx, input, true, "a"))
};
const hoisted_DiscriminatedUnion2_43 = {
    "type": (ctx, input)=>(decodeConst(ctx, input, false, "d")),
    "valueD": (ctx, input)=>(decodeNumber(ctx, input, true))
};
const hoisted_DiscriminatedUnion2_44 = {
    "type": (ctx, input)=>(decodeConst(ctx, input, true, "b")),
    "value": (ctx, input)=>(decodeNumber(ctx, input, true))
};
const hoisted_DiscriminatedUnion2_45 = [
    (ctx, input)=>(decodeObject(ctx, input, true, hoisted_DiscriminatedUnion2_41)),
    (ctx, input)=>(decodeObject(ctx, input, true, hoisted_DiscriminatedUnion2_42)),
    (ctx, input)=>(decodeObject(ctx, input, true, hoisted_DiscriminatedUnion2_43)),
    (ctx, input)=>(decodeObject(ctx, input, true, hoisted_DiscriminatedUnion2_44))
];
const hoisted_DiscriminatedUnion3_46 = {
    "a1": (ctx, input)=>(decodeString(ctx, input, true))
};
const hoisted_DiscriminatedUnion3_47 = {
    "value": (ctx, input)=>(decodeNumber(ctx, input, true))
};
const hoisted_DiscriminatedUnion3_48 = {
    "a1": (ctx, input)=>(decodeString(ctx, input, true))
};
const hoisted_DiscriminatedUnion3_49 = {
    "a": (ctx, input)=>(decodeObject(ctx, input, true, hoisted_DiscriminatedUnion3_46)),
    "b": (ctx, input)=>(decodeObject(ctx, input, true, hoisted_DiscriminatedUnion3_47)),
    "c": (ctx, input)=>(decodeObject(ctx, input, true, hoisted_DiscriminatedUnion3_48))
};
const hoisted_DiscriminatedUnion4_50 = {
    "a1": (ctx, input)=>(decodeString(ctx, input, true)),
    "subType": (ctx, input)=>(decodeConst(ctx, input, true, "a1"))
};
const hoisted_DiscriminatedUnion4_51 = {
    "a": (ctx, input)=>(decodeObject(ctx, input, true, hoisted_DiscriminatedUnion4_50))
};
const hoisted_DiscriminatedUnion4_52 = {
    "a2": (ctx, input)=>(decodeString(ctx, input, true)),
    "subType": (ctx, input)=>(decodeConst(ctx, input, true, "a2"))
};
const hoisted_DiscriminatedUnion4_53 = {
    "a": (ctx, input)=>(decodeObject(ctx, input, true, hoisted_DiscriminatedUnion4_52))
};
const hoisted_DiscriminatedUnion4_54 = [
    (ctx, input)=>(decodeObject(ctx, input, true, hoisted_DiscriminatedUnion4_51)),
    (ctx, input)=>(decodeObject(ctx, input, true, hoisted_DiscriminatedUnion4_53))
];
const hoisted_DiscriminatedUnion4_55 = {
    "a": (ctx, input)=>(decodeAnyOf(ctx, input, true, hoisted_DiscriminatedUnion4_54))
};
const hoisted_AllTypes_56 = [
    "LevelAndDSettings",
    "OmitSettings",
    "PartialSettings",
    "RequiredPartialObject"
];
const hoisted_OtherEnum_57 = [
    "a",
    "b"
];
const hoisted_Arr2_58 = [
    "A",
    "B",
    "C"
];
const hoisted_UnionWithEnumAccess_59 = {
    "value": (ctx, input)=>(decodeString(ctx, input, true))
};
const hoisted_UnionWithEnumAccess_60 = {
    "value": (ctx, input)=>(decodeNumber(ctx, input, true))
};
const hoisted_UnionWithEnumAccess_61 = {
    "value": (ctx, input)=>(decodeBoolean(ctx, input, true))
};
const hoisted_UnionWithEnumAccess_62 = {
    "a": (ctx, input)=>(decodeObject(ctx, input, true, hoisted_UnionWithEnumAccess_59)),
    "b": (ctx, input)=>(decodeObject(ctx, input, true, hoisted_UnionWithEnumAccess_60)),
    "c": (ctx, input)=>(decodeObject(ctx, input, true, hoisted_UnionWithEnumAccess_61))
};
const hoisted_Shape_63 = {
    "radius": (ctx, input)=>(decodeNumber(ctx, input, true))
};
const hoisted_Shape_64 = {
    "x": (ctx, input)=>(decodeNumber(ctx, input, true))
};
const hoisted_Shape_65 = {
    "x": (ctx, input)=>(decodeNumber(ctx, input, true)),
    "y": (ctx, input)=>(decodeNumber(ctx, input, true))
};
const hoisted_Shape_66 = {
    "circle": (ctx, input)=>(decodeObject(ctx, input, true, hoisted_Shape_63)),
    "square": (ctx, input)=>(decodeObject(ctx, input, true, hoisted_Shape_64)),
    "triangle": (ctx, input)=>(decodeObject(ctx, input, true, hoisted_Shape_65))
};
const hoisted_T3_67 = {
    "x": (ctx, input)=>(decodeNumber(ctx, input, true))
};
const hoisted_T3_68 = {
    "x": (ctx, input)=>(decodeNumber(ctx, input, true)),
    "y": (ctx, input)=>(decodeNumber(ctx, input, true))
};
const hoisted_T3_69 = {
    "square": (ctx, input)=>(decodeObject(ctx, input, true, hoisted_T3_67)),
    "triangle": (ctx, input)=>(decodeObject(ctx, input, true, hoisted_T3_68))
};
const hoisted_BObject_70 = {
    "tag": (ctx, input)=>(decodeConst(ctx, input, true, "b"))
};
const hoisted_DEF_71 = {
    "a": (ctx, input)=>(decodeString(ctx, input, true))
};
const hoisted_ABC_72 = {};
const hoisted_K_73 = [
    (ctx, input)=>(validators.KABC(ctx, input, true)),
    (ctx, input)=>(validators.KDEF(ctx, input, true))
];

export default { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeFunction, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeNever, decodeConst, registerCustomFormatter, validators };