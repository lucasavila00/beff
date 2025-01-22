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

function decodeRegex(ctx, input, regex, description) {
  if (typeof input === "string") {
    if (regex.test(input)) {
      return input;
    }
  }
  return buildError(input, ctx, "expected string matching " + description);
}


function DecodeTransportedValue(ctx, input, required = true) {
    return decodeAnyOf(ctx, input, hoisted_TransportedValue_2);
}
function DecodeAllTs(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, hoisted_AllTs_3);
}
function DecodeAObject(ctx, input, required = true) {
    return decodeObject(ctx, input, hoisted_AObject_4);
}
function DecodeVersion(ctx, input, required = true) {
    return decodeRegex(ctx, input, /(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "${number}.${number}.${number}");
}
function DecodeVersion2(ctx, input, required = true) {
    return decodeRegex(ctx, input, /(v)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "v${number}.${number}.${number}");
}
function DecodeAccessLevel2(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, hoisted_AccessLevel2_5);
}
function DecodeAccessLevelTpl2(ctx, input, required = true) {
    return decodeRegex(ctx, input, /((ADMIN Admin)|(USER User))/, '("ADMIN Admin" | "USER User")');
}
function DecodeAccessLevel(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, hoisted_AccessLevel_6);
}
function DecodeAccessLevelTpl(ctx, input, required = true) {
    return decodeRegex(ctx, input, /((ADMIN)|(USER))/, '("ADMIN" | "USER")');
}
function DecodeArr3(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, hoisted_Arr3_7);
}
function DecodeOmitSettings(ctx, input, required = true) {
    return decodeObject(ctx, input, hoisted_OmitSettings_10);
}
function DecodeSettings(ctx, input, required = true) {
    return decodeObject(ctx, input, hoisted_Settings_13);
}
function DecodePartialObject(ctx, input, required = true) {
    return decodeObject(ctx, input, hoisted_PartialObject_16);
}
function DecodeRequiredPartialObject(ctx, input, required = true) {
    return decodeObject(ctx, input, hoisted_RequiredPartialObject_17);
}
function DecodeLevelAndDSettings(ctx, input, required = true) {
    return decodeObject(ctx, input, hoisted_LevelAndDSettings_20);
}
function DecodePartialSettings(ctx, input, required = true) {
    return decodeObject(ctx, input, hoisted_PartialSettings_26);
}
function DecodeExtra(ctx, input, required = true) {
    return decodeObject(ctx, input, hoisted_Extra_27, (ctx, input)=>(decodeString(ctx, input)));
}
function DecodeAvatarSize(ctx, input, required = true) {
    return decodeRegex(ctx, input, /(\d+(\.\d+)?)(x)(\d+(\.\d+)?)/, "${number}x${number}");
}
function DecodeUser(ctx, input, required = true) {
    return decodeObject(ctx, input, hoisted_User_29);
}
function DecodePublicUser(ctx, input, required = true) {
    return decodeObject(ctx, input, hoisted_PublicUser_30);
}
function DecodeReq(ctx, input, required = true) {
    return decodeObject(ctx, input, hoisted_Req_31);
}
function DecodeWithOptionals(ctx, input, required = true) {
    return decodeObject(ctx, input, hoisted_WithOptionals_33);
}
function DecodeRepro1(ctx, input, required = true) {
    return decodeObject(ctx, input, hoisted_Repro1_35);
}
function DecodeRepro2(ctx, input, required = true) {
    return decodeObject(ctx, input, hoisted_Repro2_36);
}
function DecodeSettingsUpdate(ctx, input, required = true) {
    return decodeAnyOf(ctx, input, hoisted_SettingsUpdate_38);
}
function DecodeMapped(ctx, input, required = true) {
    return decodeObject(ctx, input, hoisted_Mapped_41);
}
function DecodeMappedOptional(ctx, input, required = true) {
    return decodeObject(ctx, input, hoisted_MappedOptional_46);
}
function DecodeDiscriminatedUnion(ctx, input, required = true) {
    return decodeAnyOfDiscriminated(ctx, input, "type", hoisted_DiscriminatedUnion_52);
}
function DecodeDiscriminatedUnion2(ctx, input, required = true) {
    return decodeAnyOf(ctx, input, hoisted_DiscriminatedUnion2_59);
}
function DecodeDiscriminatedUnion3(ctx, input, required = true) {
    return decodeAnyOfDiscriminated(ctx, input, "type", hoisted_DiscriminatedUnion3_63);
}
function DecodeDiscriminatedUnion4(ctx, input, required = true) {
    return decodeAnyOfDiscriminated(ctx, input, "type", hoisted_DiscriminatedUnion4_69);
}
function DecodeAllTypes(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, hoisted_AllTypes_70);
}
function DecodeOtherEnum(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, hoisted_OtherEnum_71);
}
function DecodeArr2(ctx, input, required = true) {
    return decodeAnyOfConsts(ctx, input, hoisted_Arr2_72);
}
function DecodeValidCurrency(ctx, input, required = true) {
    return decodeStringWithFormat(ctx, input, "ValidCurrency");
}
function DecodeUnionWithEnumAccess(ctx, input, required = true) {
    return decodeAnyOfDiscriminated(ctx, input, "tag", hoisted_UnionWithEnumAccess_76);
}
function DecodeShape(ctx, input, required = true) {
    return decodeAnyOfDiscriminated(ctx, input, "kind", hoisted_Shape_80);
}
function DecodeT3(ctx, input, required = true) {
    return decodeAnyOfDiscriminated(ctx, input, "kind", hoisted_T3_83);
}
function DecodeBObject(ctx, input, required = true) {
    return decodeObject(ctx, input, hoisted_BObject_84);
}
function DecodeDEF(ctx, input, required = true) {
    return decodeObject(ctx, input, hoisted_DEF_85);
}
function DecodeKDEF(ctx, input, required = true) {
    return decodeConst(ctx, input, "a");
}
function DecodeABC(ctx, input, required = true) {
    return decodeObject(ctx, input, hoisted_ABC_86);
}
function DecodeKABC(ctx, input, required = true) {
    return decodeNever(ctx, input);
}
function DecodeK(ctx, input, required = true) {
    return decodeAnyOf(ctx, input, hoisted_K_87);
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
    (ctx, input)=>(decodeNull(ctx, input)),
    (ctx, input)=>(decodeString(ctx, input)),
    (ctx, input)=>(decodeNumber(ctx, input))
];
const hoisted_TransportedValue_1 = (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_TransportedValue_0));
const hoisted_TransportedValue_2 = [
    (ctx, input)=>(decodeNull(ctx, input)),
    (ctx, input)=>(decodeString(ctx, input)),
    (ctx, input)=>(decodeArray(ctx, input, hoisted_TransportedValue_1))
];
const hoisted_AllTs_3 = [
    "a",
    "b"
];
const hoisted_AObject_4 = {
    "tag": (ctx, input)=>(decodeConst(ctx, input, "a"))
};
const hoisted_AccessLevel2_5 = [
    "ADMIN Admin",
    "USER User"
];
const hoisted_AccessLevel_6 = [
    "ADMIN",
    "USER"
];
const hoisted_Arr3_7 = [
    "X",
    "Y"
];
const hoisted_OmitSettings_8 = {
    "tag": (ctx, input)=>(decodeConst(ctx, input, "d"))
};
const hoisted_OmitSettings_9 = [
    "a",
    "b"
];
const hoisted_OmitSettings_10 = {
    "d": (ctx, input)=>(decodeObject(ctx, input, hoisted_OmitSettings_8)),
    "level": (ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_OmitSettings_9))
};
const hoisted_Settings_11 = {
    "tag": (ctx, input)=>(decodeConst(ctx, input, "d"))
};
const hoisted_Settings_12 = [
    "a",
    "b"
];
const hoisted_Settings_13 = {
    "a": (ctx, input)=>(decodeString(ctx, input)),
    "d": (ctx, input)=>(decodeObject(ctx, input, hoisted_Settings_11)),
    "level": (ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_Settings_12))
};
const hoisted_PartialObject_14 = [
    (ctx, input)=>(decodeNull(ctx, input)),
    (ctx, input)=>(decodeString(ctx, input))
];
const hoisted_PartialObject_15 = [
    (ctx, input)=>(decodeNull(ctx, input)),
    (ctx, input)=>(decodeNumber(ctx, input))
];
const hoisted_PartialObject_16 = {
    "a": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_PartialObject_14)),
    "b": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_PartialObject_15))
};
const hoisted_RequiredPartialObject_17 = {
    "a": (ctx, input)=>(decodeString(ctx, input)),
    "b": (ctx, input)=>(decodeNumber(ctx, input))
};
const hoisted_LevelAndDSettings_18 = {
    "tag": (ctx, input)=>(decodeConst(ctx, input, "d"))
};
const hoisted_LevelAndDSettings_19 = [
    "a",
    "b"
];
const hoisted_LevelAndDSettings_20 = {
    "d": (ctx, input)=>(decodeObject(ctx, input, hoisted_LevelAndDSettings_18)),
    "level": (ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_LevelAndDSettings_19))
};
const hoisted_PartialSettings_21 = [
    (ctx, input)=>(decodeNull(ctx, input)),
    (ctx, input)=>(decodeString(ctx, input))
];
const hoisted_PartialSettings_22 = {
    "tag": (ctx, input)=>(decodeConst(ctx, input, "d"))
};
const hoisted_PartialSettings_23 = [
    (ctx, input)=>(decodeNull(ctx, input)),
    (ctx, input)=>(decodeObject(ctx, input, hoisted_PartialSettings_22))
];
const hoisted_PartialSettings_24 = [
    "a",
    "b"
];
const hoisted_PartialSettings_25 = [
    (ctx, input)=>(decodeNull(ctx, input)),
    (ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_PartialSettings_24))
];
const hoisted_PartialSettings_26 = {
    "a": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_PartialSettings_21)),
    "d": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_PartialSettings_23)),
    "level": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_PartialSettings_25))
};
const hoisted_Extra_27 = {};
const hoisted_User_28 = (ctx, input)=>(validators.User(ctx, input));
const hoisted_User_29 = {
    "accessLevel": (ctx, input)=>(validators.AccessLevel(ctx, input)),
    "avatarSize": (ctx, input)=>(validators.AvatarSize(ctx, input)),
    "extra": (ctx, input)=>(validators.Extra(ctx, input)),
    "friends": (ctx, input)=>(decodeArray(ctx, input, hoisted_User_28)),
    "name": (ctx, input)=>(decodeString(ctx, input))
};
const hoisted_PublicUser_30 = {
    "accessLevel": (ctx, input)=>(validators.AccessLevel(ctx, input)),
    "avatarSize": (ctx, input)=>(validators.AvatarSize(ctx, input)),
    "extra": (ctx, input)=>(validators.Extra(ctx, input)),
    "name": (ctx, input)=>(decodeString(ctx, input))
};
const hoisted_Req_31 = {
    "optional": (ctx, input)=>(decodeString(ctx, input))
};
const hoisted_WithOptionals_32 = [
    (ctx, input)=>(decodeNull(ctx, input)),
    (ctx, input)=>(decodeString(ctx, input))
];
const hoisted_WithOptionals_33 = {
    "optional": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_WithOptionals_32))
};
const hoisted_Repro1_34 = [
    (ctx, input)=>(decodeNull(ctx, input)),
    (ctx, input)=>(validators.Repro2(ctx, input))
];
const hoisted_Repro1_35 = {
    "sizes": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_Repro1_34))
};
const hoisted_Repro2_36 = {
    "useSmallerSizes": (ctx, input)=>(decodeBoolean(ctx, input))
};
const hoisted_SettingsUpdate_37 = {
    "tag": (ctx, input)=>(decodeConst(ctx, input, "d"))
};
const hoisted_SettingsUpdate_38 = [
    (ctx, input)=>(decodeString(ctx, input)),
    (ctx, input)=>(decodeObject(ctx, input, hoisted_SettingsUpdate_37))
];
const hoisted_Mapped_39 = {
    "value": (ctx, input)=>(decodeConst(ctx, input, "a"))
};
const hoisted_Mapped_40 = {
    "value": (ctx, input)=>(decodeConst(ctx, input, "b"))
};
const hoisted_Mapped_41 = {
    "a": (ctx, input)=>(decodeObject(ctx, input, hoisted_Mapped_39)),
    "b": (ctx, input)=>(decodeObject(ctx, input, hoisted_Mapped_40))
};
const hoisted_MappedOptional_42 = {
    "value": (ctx, input)=>(decodeConst(ctx, input, "a"))
};
const hoisted_MappedOptional_43 = [
    (ctx, input)=>(decodeNull(ctx, input)),
    (ctx, input)=>(decodeObject(ctx, input, hoisted_MappedOptional_42))
];
const hoisted_MappedOptional_44 = {
    "value": (ctx, input)=>(decodeConst(ctx, input, "b"))
};
const hoisted_MappedOptional_45 = [
    (ctx, input)=>(decodeNull(ctx, input)),
    (ctx, input)=>(decodeObject(ctx, input, hoisted_MappedOptional_44))
];
const hoisted_MappedOptional_46 = {
    "a": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_MappedOptional_43)),
    "b": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_MappedOptional_45))
};
const hoisted_DiscriminatedUnion_47 = [
    (ctx, input)=>(decodeNull(ctx, input)),
    (ctx, input)=>(decodeString(ctx, input))
];
const hoisted_DiscriminatedUnion_48 = {
    "a1": (ctx, input)=>(decodeString(ctx, input)),
    "a11": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_DiscriminatedUnion_47))
};
const hoisted_DiscriminatedUnion_49 = {
    "a2": (ctx, input)=>(decodeString(ctx, input))
};
const hoisted_DiscriminatedUnion_50 = {
    "a1": (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion_48)),
    "a2": (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion_49))
};
const hoisted_DiscriminatedUnion_51 = {
    "value": (ctx, input)=>(decodeNumber(ctx, input))
};
const hoisted_DiscriminatedUnion_52 = {
    "a": (ctx, input)=>(decodeAnyOfDiscriminated(ctx, input, "subType", hoisted_DiscriminatedUnion_50)),
    "b": (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion_51))
};
const hoisted_DiscriminatedUnion2_53 = [
    (ctx, input)=>(decodeNull(ctx, input)),
    (ctx, input)=>(decodeString(ctx, input))
];
const hoisted_DiscriminatedUnion2_54 = {
    "a1": (ctx, input)=>(decodeString(ctx, input)),
    "a11": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_DiscriminatedUnion2_53)),
    "subType": (ctx, input)=>(decodeConst(ctx, input, "a1")),
    "type": (ctx, input)=>(decodeConst(ctx, input, "a"))
};
const hoisted_DiscriminatedUnion2_55 = {
    "a2": (ctx, input)=>(decodeString(ctx, input)),
    "subType": (ctx, input)=>(decodeConst(ctx, input, "a2")),
    "type": (ctx, input)=>(decodeConst(ctx, input, "a"))
};
const hoisted_DiscriminatedUnion2_56 = [
    (ctx, input)=>(decodeNull(ctx, input)),
    (ctx, input)=>(decodeConst(ctx, input, "d"))
];
const hoisted_DiscriminatedUnion2_57 = {
    "type": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_DiscriminatedUnion2_56)),
    "valueD": (ctx, input)=>(decodeNumber(ctx, input))
};
const hoisted_DiscriminatedUnion2_58 = {
    "type": (ctx, input)=>(decodeConst(ctx, input, "b")),
    "value": (ctx, input)=>(decodeNumber(ctx, input))
};
const hoisted_DiscriminatedUnion2_59 = [
    (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion2_54)),
    (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion2_55)),
    (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion2_57)),
    (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion2_58))
];
const hoisted_DiscriminatedUnion3_60 = {
    "a1": (ctx, input)=>(decodeString(ctx, input))
};
const hoisted_DiscriminatedUnion3_61 = {
    "value": (ctx, input)=>(decodeNumber(ctx, input))
};
const hoisted_DiscriminatedUnion3_62 = {
    "a1": (ctx, input)=>(decodeString(ctx, input))
};
const hoisted_DiscriminatedUnion3_63 = {
    "a": (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion3_60)),
    "b": (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion3_61)),
    "c": (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion3_62))
};
const hoisted_DiscriminatedUnion4_64 = {
    "a1": (ctx, input)=>(decodeString(ctx, input)),
    "subType": (ctx, input)=>(decodeConst(ctx, input, "a1"))
};
const hoisted_DiscriminatedUnion4_65 = {
    "a": (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion4_64))
};
const hoisted_DiscriminatedUnion4_66 = {
    "a2": (ctx, input)=>(decodeString(ctx, input)),
    "subType": (ctx, input)=>(decodeConst(ctx, input, "a2"))
};
const hoisted_DiscriminatedUnion4_67 = {
    "a": (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion4_66))
};
const hoisted_DiscriminatedUnion4_68 = [
    (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion4_65)),
    (ctx, input)=>(decodeObject(ctx, input, hoisted_DiscriminatedUnion4_67))
];
const hoisted_DiscriminatedUnion4_69 = {
    "a": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_DiscriminatedUnion4_68))
};
const hoisted_AllTypes_70 = [
    "LevelAndDSettings",
    "OmitSettings",
    "PartialSettings",
    "RequiredPartialObject"
];
const hoisted_OtherEnum_71 = [
    "a",
    "b"
];
const hoisted_Arr2_72 = [
    "A",
    "B",
    "C"
];
const hoisted_UnionWithEnumAccess_73 = {
    "value": (ctx, input)=>(decodeString(ctx, input))
};
const hoisted_UnionWithEnumAccess_74 = {
    "value": (ctx, input)=>(decodeNumber(ctx, input))
};
const hoisted_UnionWithEnumAccess_75 = {
    "value": (ctx, input)=>(decodeBoolean(ctx, input))
};
const hoisted_UnionWithEnumAccess_76 = {
    "a": (ctx, input)=>(decodeObject(ctx, input, hoisted_UnionWithEnumAccess_73)),
    "b": (ctx, input)=>(decodeObject(ctx, input, hoisted_UnionWithEnumAccess_74)),
    "c": (ctx, input)=>(decodeObject(ctx, input, hoisted_UnionWithEnumAccess_75))
};
const hoisted_Shape_77 = {
    "radius": (ctx, input)=>(decodeNumber(ctx, input))
};
const hoisted_Shape_78 = {
    "x": (ctx, input)=>(decodeNumber(ctx, input))
};
const hoisted_Shape_79 = {
    "x": (ctx, input)=>(decodeNumber(ctx, input)),
    "y": (ctx, input)=>(decodeNumber(ctx, input))
};
const hoisted_Shape_80 = {
    "circle": (ctx, input)=>(decodeObject(ctx, input, hoisted_Shape_77)),
    "square": (ctx, input)=>(decodeObject(ctx, input, hoisted_Shape_78)),
    "triangle": (ctx, input)=>(decodeObject(ctx, input, hoisted_Shape_79))
};
const hoisted_T3_81 = {
    "x": (ctx, input)=>(decodeNumber(ctx, input))
};
const hoisted_T3_82 = {
    "x": (ctx, input)=>(decodeNumber(ctx, input)),
    "y": (ctx, input)=>(decodeNumber(ctx, input))
};
const hoisted_T3_83 = {
    "square": (ctx, input)=>(decodeObject(ctx, input, hoisted_T3_81)),
    "triangle": (ctx, input)=>(decodeObject(ctx, input, hoisted_T3_82))
};
const hoisted_BObject_84 = {
    "tag": (ctx, input)=>(decodeConst(ctx, input, "b"))
};
const hoisted_DEF_85 = {
    "a": (ctx, input)=>(decodeString(ctx, input))
};
const hoisted_ABC_86 = {};
const hoisted_K_87 = [
    (ctx, input)=>(validators.KABC(ctx, input)),
    (ctx, input)=>(validators.KDEF(ctx, input))
];

export default { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeFunction, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeNever, decodeConst, registerCustomFormatter, validators };