//@ts-nocheck
/* eslint-disable */




const customFormatters = {};

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

function decodeObject(ctx, input, data, additionalPropsValidator = null) {
  const disallowExtraProperties = ctx?.disallowExtraProperties ?? false;

  const allowedExtraProperties = ctx.allowedExtraProperties__ ?? [];

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

function decodeArray(ctx, input, data) {
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
function decodeString(ctx, input) {
  if (typeof input === "string") {
    return input;
  }

  return buildError(input, ctx, "expected string");
}

function decodeNumber(ctx, input) {
  if (typeof input === "number") {
    return input;
  }
  if (String(input).toLowerCase() == "nan") {
    return NaN;
  }

  return buildError(input, ctx, "expected number");
}

function decodeFunction(ctx, input) {
  if (typeof input === "function") {
    return input;
  }
  return buildError(input, ctx, "expected function");
}

function decodeCodec(ctx, input, codec) {
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

function decodeStringWithFormat(ctx, input, format) {
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

function decodeAnyOfDiscriminated(ctx, input, discriminator, mapping) {
  const d = input[discriminator];
  if (d == null) {
    return buildError(input, ctx, "expected discriminator key " + JSON.stringify(discriminator));
  }
  const v = mapping[d];
  if (v == null) {
    pushPath(ctx, discriminator);
    const err = buildError(
      d,
      ctx,
      "expected one of " +
        Object.keys(mapping)
          .map((it) => JSON.stringify(it))
          .join(", ")
    );
    popPath(ctx);
    return err;
  }
  const prevAllow = ctx.allowedExtraProperties__ ?? [];
  ctx.allowedExtraProperties__ = [...prevAllow, discriminator];
  const out = v(ctx, input);
  ctx.allowedExtraProperties__ = prevAllow;
  return { ...out, [discriminator]: d };
}

function decodeAnyOfConsts(ctx, input, consts) {
  for (const c of consts) {
    if (input === c) {
      return c;
    }
  }
  return buildError(input, ctx, "expected one of " + consts.map((it) => JSON.stringify(it)).join(", "));
}
function decodeAnyOf(ctx, input, vs) {
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
function decodeAllOf(ctx, input, vs) {
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
function decodeTuple(ctx, input, vs) {
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
function decodeBoolean(ctx, input) {
  if (typeof input === "boolean") {
    return input;
  }
  return buildError(input, ctx, "expected boolean");
}
function decodeAny(ctx, input) {
  return input;
}
function decodeNull(ctx, input) {
  if (input == null) {
    return input;
  }
  return buildError(input, ctx, "expected nullish value");
}
function decodeNever(ctx, input) {
  return buildError(input, ctx, "never");
}
function decodeConst(ctx, input, constValue) {
  if (input == constValue) {
    return constValue;
  }
  return buildError(input, ctx, "expected " + JSON.stringify(constValue));
}

class RegexDecoder {
  constructor(regex, description) {
    this.regex = regex;
    this.description = description;
  }

  decode(ctx, input) {
    if (typeof input === "string") {
      if (this.regex.test(input)) {
        return input;
      }
    }
    return buildError(input, ctx, "expected string matching " + this.description);
  }
}


function DecodeTransportedValue(ctx, input) {
    return ((ctx, input)=>(decodeAnyOf(ctx, input, hoisted_TransportedValue_2)))(ctx, input);
}
function DecodeAllTs(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_AllTs_3)))(ctx, input);
}
function DecodeAObject(ctx, input) {
    return ((ctx, input)=>(decodeObject(ctx, input, hoisted_AObject_4)))(ctx, input);
}
function DecodeVersion(ctx, input) {
    return (hoisted_Version_5.decode.bind(hoisted_Version_5))(ctx, input);
}
function DecodeVersion2(ctx, input) {
    return (hoisted_Version2_6.decode.bind(hoisted_Version2_6))(ctx, input);
}
function DecodeAccessLevel2(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_AccessLevel2_7)))(ctx, input);
}
function DecodeAccessLevelTpl2(ctx, input) {
    return (hoisted_AccessLevelTpl2_8.decode.bind(hoisted_AccessLevelTpl2_8))(ctx, input);
}
function DecodeAccessLevel(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_AccessLevel_9)))(ctx, input);
}
function DecodeAccessLevelTpl(ctx, input) {
    return (hoisted_AccessLevelTpl_10.decode.bind(hoisted_AccessLevelTpl_10))(ctx, input);
}
function DecodeArr3(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_Arr3_11)))(ctx, input);
}
function DecodeOmitSettings(ctx, input) {
    return ((ctx, input)=>(decodeObject(ctx, input, hoisted_OmitSettings_14)))(ctx, input);
}
function DecodeSettings(ctx, input) {
    return ((ctx, input)=>(decodeObject(ctx, input, hoisted_Settings_17)))(ctx, input);
}
function DecodePartialObject(ctx, input) {
    return ((ctx, input)=>(decodeObject(ctx, input, hoisted_PartialObject_20)))(ctx, input);
}
function DecodeRequiredPartialObject(ctx, input) {
    return ((ctx, input)=>(decodeObject(ctx, input, hoisted_RequiredPartialObject_21)))(ctx, input);
}
function DecodeLevelAndDSettings(ctx, input) {
    return ((ctx, input)=>(decodeObject(ctx, input, hoisted_LevelAndDSettings_24)))(ctx, input);
}
function DecodePartialSettings(ctx, input) {
    return ((ctx, input)=>(decodeObject(ctx, input, hoisted_PartialSettings_30)))(ctx, input);
}
function DecodeExtra(ctx, input) {
    return ((ctx, input)=>(decodeObject(ctx, input, hoisted_Extra_31, decodeString)))(ctx, input);
}
function DecodeAvatarSize(ctx, input) {
    return (hoisted_AvatarSize_32.decode.bind(hoisted_AvatarSize_32))(ctx, input);
}
function DecodeUser(ctx, input) {
    return ((ctx, input)=>(decodeObject(ctx, input, hoisted_User_34)))(ctx, input);
}
function DecodePublicUser(ctx, input) {
    return ((ctx, input)=>(decodeObject(ctx, input, hoisted_PublicUser_35)))(ctx, input);
}
function DecodeReq(ctx, input) {
    return ((ctx, input)=>(decodeObject(ctx, input, hoisted_Req_36)))(ctx, input);
}
function DecodeWithOptionals(ctx, input) {
    return ((ctx, input)=>(decodeObject(ctx, input, hoisted_WithOptionals_38)))(ctx, input);
}
function DecodeRepro1(ctx, input) {
    return ((ctx, input)=>(decodeObject(ctx, input, hoisted_Repro1_40)))(ctx, input);
}
function DecodeRepro2(ctx, input) {
    return ((ctx, input)=>(decodeObject(ctx, input, hoisted_Repro2_41)))(ctx, input);
}
function DecodeSettingsUpdate(ctx, input) {
    return ((ctx, input)=>(decodeAnyOf(ctx, input, hoisted_SettingsUpdate_43)))(ctx, input);
}
function DecodeMapped(ctx, input) {
    return ((ctx, input)=>(decodeObject(ctx, input, hoisted_Mapped_46)))(ctx, input);
}
function DecodeMappedOptional(ctx, input) {
    return ((ctx, input)=>(decodeObject(ctx, input, hoisted_MappedOptional_51)))(ctx, input);
}
function DecodeDiscriminatedUnion(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfDiscriminated(ctx, input, "type", hoisted_DiscriminatedUnion_57)))(ctx, input);
}
function DecodeDiscriminatedUnion2(ctx, input) {
    return ((ctx, input)=>(decodeAnyOf(ctx, input, hoisted_DiscriminatedUnion2_64)))(ctx, input);
}
function DecodeDiscriminatedUnion3(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfDiscriminated(ctx, input, "type", hoisted_DiscriminatedUnion3_68)))(ctx, input);
}
function DecodeDiscriminatedUnion4(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfDiscriminated(ctx, input, "type", hoisted_DiscriminatedUnion4_74)))(ctx, input);
}
function DecodeAllTypes(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_AllTypes_75)))(ctx, input);
}
function DecodeOtherEnum(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_OtherEnum_76)))(ctx, input);
}
function DecodeArr2(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_Arr2_77)))(ctx, input);
}
function DecodeValidCurrency(ctx, input) {
    return ((ctx, input)=>(decodeStringWithFormat(ctx, input, "ValidCurrency")))(ctx, input);
}
function DecodeUnionWithEnumAccess(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfDiscriminated(ctx, input, "tag", hoisted_UnionWithEnumAccess_81)))(ctx, input);
}
function DecodeShape(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfDiscriminated(ctx, input, "kind", hoisted_Shape_85)))(ctx, input);
}
function DecodeT3(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfDiscriminated(ctx, input, "kind", hoisted_T3_88)))(ctx, input);
}
function DecodeBObject(ctx, input) {
    return ((ctx, input)=>(decodeObject(ctx, input, hoisted_BObject_89)))(ctx, input);
}
function DecodeDEF(ctx, input) {
    return ((ctx, input)=>(decodeObject(ctx, input, hoisted_DEF_90)))(ctx, input);
}
function DecodeKDEF(ctx, input) {
    return ((ctx, input)=>(decodeConst(ctx, input, "a")))(ctx, input);
}
function DecodeABC(ctx, input) {
    return ((ctx, input)=>(decodeObject(ctx, input, hoisted_ABC_91)))(ctx, input);
}
function DecodeKABC(ctx, input) {
    return (decodeNever)(ctx, input);
}
function DecodeK(ctx, input) {
    return ((ctx, input)=>(decodeAnyOf(ctx, input, hoisted_K_92)))(ctx, input);
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
    decodeNull,
    decodeString,
    decodeNumber
];
const hoisted_TransportedValue_1 = (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_TransportedValue_0));
const hoisted_TransportedValue_2 = [
    decodeNull,
    decodeString,
    (ctx, input)=>(decodeArray(ctx, input, hoisted_TransportedValue_1))
];
const hoisted_AllTs_3 = [
    "a",
    "b"
];
const hoisted_AObject_4 = {
    "tag": (ctx, input)=>(decodeConst(ctx, input, "a"))
};
const hoisted_Version_5 = new RegexDecoder(/(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "${number}.${number}.${number}");
const hoisted_Version2_6 = new RegexDecoder(/(v)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "v${number}.${number}.${number}");
const hoisted_AccessLevel2_7 = [
    "ADMIN Admin",
    "USER User"
];
const hoisted_AccessLevelTpl2_8 = new RegexDecoder(/((ADMIN Admin)|(USER User))/, '("ADMIN Admin" | "USER User")');
const hoisted_AccessLevel_9 = [
    "ADMIN",
    "USER"
];
const hoisted_AccessLevelTpl_10 = new RegexDecoder(/((ADMIN)|(USER))/, '("ADMIN" | "USER")');
const hoisted_Arr3_11 = [
    "X",
    "Y"
];
const hoisted_OmitSettings_12 = {
    "tag": (ctx, input)=>(decodeConst(ctx, input, "d"))
};
const hoisted_OmitSettings_13 = [
    "a",
    "b"
];
const hoisted_OmitSettings_14 = {
    "d": (ctx, input)=>(decodeObject(ctx, input, hoisted_OmitSettings_12)),
    "level": (ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_OmitSettings_13))
};
const hoisted_Settings_15 = {
    "tag": (ctx, input)=>(decodeConst(ctx, input, "d"))
};
const hoisted_Settings_16 = [
    "a",
    "b"
];
const hoisted_Settings_17 = {
    "a": decodeString,
    "d": (ctx, input)=>(decodeObject(ctx, input, hoisted_Settings_15)),
    "level": (ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_Settings_16))
};
const hoisted_PartialObject_18 = [
    decodeNull,
    decodeString
];
const hoisted_PartialObject_19 = [
    decodeNull,
    decodeNumber
];
const hoisted_PartialObject_20 = {
    "a": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_PartialObject_18)),
    "b": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_PartialObject_19))
};
const hoisted_RequiredPartialObject_21 = {
    "a": decodeString,
    "b": decodeNumber
};
const hoisted_LevelAndDSettings_22 = {
    "tag": (ctx, input)=>(decodeConst(ctx, input, "d"))
};
const hoisted_LevelAndDSettings_23 = [
    "a",
    "b"
];
const hoisted_LevelAndDSettings_24 = {
    "d": (ctx, input)=>(decodeObject(ctx, input, hoisted_LevelAndDSettings_22)),
    "level": (ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_LevelAndDSettings_23))
};
const hoisted_PartialSettings_25 = [
    decodeNull,
    decodeString
];
const hoisted_PartialSettings_26 = {
    "tag": (ctx, input)=>(decodeConst(ctx, input, "d"))
};
const hoisted_PartialSettings_27 = [
    decodeNull,
    (ctx, input)=>(decodeObject(ctx, input, hoisted_PartialSettings_26))
];
const hoisted_PartialSettings_28 = [
    "a",
    "b"
];
const hoisted_PartialSettings_29 = [
    decodeNull,
    (ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_PartialSettings_28))
];
const hoisted_PartialSettings_30 = {
    "a": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_PartialSettings_25)),
    "d": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_PartialSettings_27)),
    "level": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_PartialSettings_29))
};
const hoisted_Extra_31 = {};
const hoisted_AvatarSize_32 = new RegexDecoder(/(\d+(\.\d+)?)(x)(\d+(\.\d+)?)/, "${number}x${number}");
const hoisted_User_33 = (ctx, input)=>(validators.User(ctx, input));
const hoisted_User_34 = {
    "accessLevel": (ctx, input)=>(validators.AccessLevel(ctx, input)),
    "avatarSize": (ctx, input)=>(validators.AvatarSize(ctx, input)),
    "extra": (ctx, input)=>(validators.Extra(ctx, input)),
    "friends": (ctx, input)=>(decodeArray(ctx, input, hoisted_User_33)),
    "name": decodeString
};
const hoisted_PublicUser_35 = {
    "accessLevel": (ctx, input)=>(validators.AccessLevel(ctx, input)),
    "avatarSize": (ctx, input)=>(validators.AvatarSize(ctx, input)),
    "extra": (ctx, input)=>(validators.Extra(ctx, input)),
    "name": decodeString
};
const hoisted_Req_36 = {
    "optional": decodeString
};
const hoisted_WithOptionals_37 = [
    decodeNull,
    decodeString
];
const hoisted_WithOptionals_38 = {
    "optional": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_WithOptionals_37))
};
const hoisted_Repro1_39 = [
    decodeNull,
    (ctx, input)=>(validators.Repro2(ctx, input))
];
const hoisted_Repro1_40 = {
    "sizes": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_Repro1_39))
};
const hoisted_Repro2_41 = {
    "useSmallerSizes": decodeBoolean
};
const hoisted_SettingsUpdate_42 = {
    "tag": (ctx, input)=>(decodeConst(ctx, input, "d"))
};
const hoisted_SettingsUpdate_43 = [
    decodeString,
    (ctx, input)=>(decodeObject(ctx, input, hoisted_SettingsUpdate_42))
];
const hoisted_Mapped_44 = {
    "value": (ctx, input)=>(decodeConst(ctx, input, "a"))
};
const hoisted_Mapped_45 = {
    "value": (ctx, input)=>(decodeConst(ctx, input, "b"))
};
const hoisted_Mapped_46 = {
    "a": (ctx, input)=>(decodeObject(ctx, input, hoisted_Mapped_44)),
    "b": (ctx, input)=>(decodeObject(ctx, input, hoisted_Mapped_45))
};
const hoisted_MappedOptional_47 = {
    "value": (ctx, input)=>(decodeConst(ctx, input, "a"))
};
const hoisted_MappedOptional_48 = [
    decodeNull,
    (ctx, input)=>(decodeObject(ctx, input, hoisted_MappedOptional_47))
];
const hoisted_MappedOptional_49 = {
    "value": (ctx, input)=>(decodeConst(ctx, input, "b"))
};
const hoisted_MappedOptional_50 = [
    decodeNull,
    (ctx, input)=>(decodeObject(ctx, input, hoisted_MappedOptional_49))
];
const hoisted_MappedOptional_51 = {
    "a": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_MappedOptional_48)),
    "b": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_MappedOptional_50))
};
const hoisted_DiscriminatedUnion_52 = [
    decodeNull,
    decodeString
];
const hoisted_DiscriminatedUnion_53 = {
    "a1": decodeString,
    "a11": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_DiscriminatedUnion_52))
};
const hoisted_DiscriminatedUnion_54 = {
    "a2": decodeString
};
const hoisted_DiscriminatedUnion_55 = {
    "a1": (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion_53)),
    "a2": (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion_54))
};
const hoisted_DiscriminatedUnion_56 = {
    "value": decodeNumber
};
const hoisted_DiscriminatedUnion_57 = {
    "a": (ctx, input)=>(decodeAnyOfDiscriminated(ctx, input, "subType", hoisted_DiscriminatedUnion_55)),
    "b": (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion_56))
};
const hoisted_DiscriminatedUnion2_58 = [
    decodeNull,
    decodeString
];
const hoisted_DiscriminatedUnion2_59 = {
    "a1": decodeString,
    "a11": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_DiscriminatedUnion2_58)),
    "subType": (ctx, input)=>(decodeConst(ctx, input, "a1")),
    "type": (ctx, input)=>(decodeConst(ctx, input, "a"))
};
const hoisted_DiscriminatedUnion2_60 = {
    "a2": decodeString,
    "subType": (ctx, input)=>(decodeConst(ctx, input, "a2")),
    "type": (ctx, input)=>(decodeConst(ctx, input, "a"))
};
const hoisted_DiscriminatedUnion2_61 = [
    decodeNull,
    (ctx, input)=>(decodeConst(ctx, input, "d"))
];
const hoisted_DiscriminatedUnion2_62 = {
    "type": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_DiscriminatedUnion2_61)),
    "valueD": decodeNumber
};
const hoisted_DiscriminatedUnion2_63 = {
    "type": (ctx, input)=>(decodeConst(ctx, input, "b")),
    "value": decodeNumber
};
const hoisted_DiscriminatedUnion2_64 = [
    (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion2_59)),
    (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion2_60)),
    (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion2_62)),
    (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion2_63))
];
const hoisted_DiscriminatedUnion3_65 = {
    "a1": decodeString
};
const hoisted_DiscriminatedUnion3_66 = {
    "value": decodeNumber
};
const hoisted_DiscriminatedUnion3_67 = {
    "a1": decodeString
};
const hoisted_DiscriminatedUnion3_68 = {
    "a": (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion3_65)),
    "b": (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion3_66)),
    "c": (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion3_67))
};
const hoisted_DiscriminatedUnion4_69 = {
    "a1": decodeString,
    "subType": (ctx, input)=>(decodeConst(ctx, input, "a1"))
};
const hoisted_DiscriminatedUnion4_70 = {
    "a": (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion4_69))
};
const hoisted_DiscriminatedUnion4_71 = {
    "a2": decodeString,
    "subType": (ctx, input)=>(decodeConst(ctx, input, "a2"))
};
const hoisted_DiscriminatedUnion4_72 = {
    "a": (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion4_71))
};
const hoisted_DiscriminatedUnion4_73 = [
    (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion4_70)),
    (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion4_72))
];
const hoisted_DiscriminatedUnion4_74 = {
    "a": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_DiscriminatedUnion4_73))
};
const hoisted_AllTypes_75 = [
    "LevelAndDSettings",
    "OmitSettings",
    "PartialSettings",
    "RequiredPartialObject"
];
const hoisted_OtherEnum_76 = [
    "a",
    "b"
];
const hoisted_Arr2_77 = [
    "A",
    "B",
    "C"
];
const hoisted_UnionWithEnumAccess_78 = {
    "value": decodeString
};
const hoisted_UnionWithEnumAccess_79 = {
    "value": decodeNumber
};
const hoisted_UnionWithEnumAccess_80 = {
    "value": decodeBoolean
};
const hoisted_UnionWithEnumAccess_81 = {
    "a": (ctx, input)=>(decodeObject(ctx, input, hoisted_UnionWithEnumAccess_78)),
    "b": (ctx, input)=>(decodeObject(ctx, input, hoisted_UnionWithEnumAccess_79)),
    "c": (ctx, input)=>(decodeObject(ctx, input, hoisted_UnionWithEnumAccess_80))
};
const hoisted_Shape_82 = {
    "radius": decodeNumber
};
const hoisted_Shape_83 = {
    "x": decodeNumber
};
const hoisted_Shape_84 = {
    "x": decodeNumber,
    "y": decodeNumber
};
const hoisted_Shape_85 = {
    "circle": (ctx, input)=>(decodeObject(ctx, input, hoisted_Shape_82)),
    "square": (ctx, input)=>(decodeObject(ctx, input, hoisted_Shape_83)),
    "triangle": (ctx, input)=>(decodeObject(ctx, input, hoisted_Shape_84))
};
const hoisted_T3_86 = {
    "x": decodeNumber
};
const hoisted_T3_87 = {
    "x": decodeNumber,
    "y": decodeNumber
};
const hoisted_T3_88 = {
    "square": (ctx, input)=>(decodeObject(ctx, input, hoisted_T3_86)),
    "triangle": (ctx, input)=>(decodeObject(ctx, input, hoisted_T3_87))
};
const hoisted_BObject_89 = {
    "tag": (ctx, input)=>(decodeConst(ctx, input, "b"))
};
const hoisted_DEF_90 = {
    "a": decodeString
};
const hoisted_ABC_91 = {};
const hoisted_K_92 = [
    (ctx, input)=>(validators.KABC(ctx, input)),
    (ctx, input)=>(validators.KDEF(ctx, input))
];

export default { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeFunction, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeNever, decodeConst, registerCustomFormatter, validators };