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

class ObjectDecoder {
  constructor(data, additionalPropsValidator = null) {
    this.data = data;
    this.additionalPropsValidator = additionalPropsValidator;
  }

  decode(ctx, input) {
    const disallowExtraProperties = ctx?.disallowExtraProperties ?? false;

    const allowedExtraProperties = ctx.allowedExtraProperties__ ?? [];

    if (typeof input === "object" && !Array.isArray(input) && input !== null) {
      const acc = {};
      for (const [k, v] of Object.entries(this.data)) {
        pushPath(ctx, k);
        acc[k] = v(ctx, input[k]);
        popPath(ctx);
      }

      if (this.additionalPropsValidator != null) {
        for (const [k, v] of Object.entries(input)) {
          if (acc[k] == null) {
            pushPath(ctx, k);
            acc[k] = this.additionalPropsValidator(ctx, v);
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
}

class ArrayDecoder {
  constructor(data) {
    this.data = data;
  }

  decode(ctx, input) {
    if (Array.isArray(input)) {
      const acc = [];
      for (let i = 0; i < input.length; i++) {
        const v = input[i];
        pushPath(ctx, "[" + i + "]");
        acc.push(this.data(ctx, v));
        popPath(ctx);
      }
      return acc;
    }
    return buildError(input, ctx, "expected array");
  }
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
class CodecDecoder {
  constructor(codec) {
    this.codec = codec;
  }
  decode(ctx, input) {
    switch (this.codec) {
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
    return buildError(input, ctx, "codec " + this.codec + " not implemented");
  }
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
class TupleDecoder {
  constructor(vs) {
    this.vs = vs;
  }
  decode(ctx, input) {
    if (Array.isArray(input)) {
      const acc = [];
      let idx = 0;
      for (const v of this.vs.prefix) {
        pushPath(ctx, "[" + idx + "]");
        const newValue = v(ctx, input[idx]);
        popPath(ctx);
        acc.push(newValue);
        idx++;
      }
      if (this.vs.items != null) {
        for (let i = idx; i < input.length; i++) {
          const v = input[i];
          pushPath(ctx, "[" + i + "]");
          acc.push(this.vs.items(ctx, v));
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

class ConstDecoder {
  constructor(value) {
    this.value = value;
  }

  decode(ctx, input) {
    if (input == this.value) {
      return this.value;
    }
    return buildError(input, ctx, "expected " + JSON.stringify(this.value));
  }
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
    return (hoisted_AObject_5.decode.bind(hoisted_AObject_5))(ctx, input);
}
function DecodeVersion(ctx, input) {
    return (hoisted_Version_6.decode.bind(hoisted_Version_6))(ctx, input);
}
function DecodeVersion2(ctx, input) {
    return (hoisted_Version2_7.decode.bind(hoisted_Version2_7))(ctx, input);
}
function DecodeAccessLevel2(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_AccessLevel2_8)))(ctx, input);
}
function DecodeAccessLevelTpl2(ctx, input) {
    return (hoisted_AccessLevelTpl2_9.decode.bind(hoisted_AccessLevelTpl2_9))(ctx, input);
}
function DecodeAccessLevel(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_AccessLevel_10)))(ctx, input);
}
function DecodeAccessLevelTpl(ctx, input) {
    return (hoisted_AccessLevelTpl_11.decode.bind(hoisted_AccessLevelTpl_11))(ctx, input);
}
function DecodeArr3(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_Arr3_12)))(ctx, input);
}
function DecodeOmitSettings(ctx, input) {
    return (hoisted_OmitSettings_16.decode.bind(hoisted_OmitSettings_16))(ctx, input);
}
function DecodeSettings(ctx, input) {
    return (hoisted_Settings_20.decode.bind(hoisted_Settings_20))(ctx, input);
}
function DecodePartialObject(ctx, input) {
    return (hoisted_PartialObject_23.decode.bind(hoisted_PartialObject_23))(ctx, input);
}
function DecodeRequiredPartialObject(ctx, input) {
    return (hoisted_RequiredPartialObject_24.decode.bind(hoisted_RequiredPartialObject_24))(ctx, input);
}
function DecodeLevelAndDSettings(ctx, input) {
    return (hoisted_LevelAndDSettings_28.decode.bind(hoisted_LevelAndDSettings_28))(ctx, input);
}
function DecodePartialSettings(ctx, input) {
    return (hoisted_PartialSettings_35.decode.bind(hoisted_PartialSettings_35))(ctx, input);
}
function DecodeExtra(ctx, input) {
    return (hoisted_Extra_36.decode.bind(hoisted_Extra_36))(ctx, input);
}
function DecodeAvatarSize(ctx, input) {
    return (hoisted_AvatarSize_37.decode.bind(hoisted_AvatarSize_37))(ctx, input);
}
function DecodeUser(ctx, input) {
    return (hoisted_User_39.decode.bind(hoisted_User_39))(ctx, input);
}
function DecodePublicUser(ctx, input) {
    return (hoisted_PublicUser_40.decode.bind(hoisted_PublicUser_40))(ctx, input);
}
function DecodeReq(ctx, input) {
    return (hoisted_Req_41.decode.bind(hoisted_Req_41))(ctx, input);
}
function DecodeWithOptionals(ctx, input) {
    return (hoisted_WithOptionals_43.decode.bind(hoisted_WithOptionals_43))(ctx, input);
}
function DecodeRepro1(ctx, input) {
    return (hoisted_Repro1_45.decode.bind(hoisted_Repro1_45))(ctx, input);
}
function DecodeRepro2(ctx, input) {
    return (hoisted_Repro2_46.decode.bind(hoisted_Repro2_46))(ctx, input);
}
function DecodeSettingsUpdate(ctx, input) {
    return ((ctx, input)=>(decodeAnyOf(ctx, input, hoisted_SettingsUpdate_49)))(ctx, input);
}
function DecodeMapped(ctx, input) {
    return (hoisted_Mapped_54.decode.bind(hoisted_Mapped_54))(ctx, input);
}
function DecodeMappedOptional(ctx, input) {
    return (hoisted_MappedOptional_61.decode.bind(hoisted_MappedOptional_61))(ctx, input);
}
function DecodeDiscriminatedUnion(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfDiscriminated(ctx, input, "type", hoisted_DiscriminatedUnion_67)))(ctx, input);
}
function DecodeDiscriminatedUnion2(ctx, input) {
    return ((ctx, input)=>(decodeAnyOf(ctx, input, hoisted_DiscriminatedUnion2_80)))(ctx, input);
}
function DecodeDiscriminatedUnion3(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfDiscriminated(ctx, input, "type", hoisted_DiscriminatedUnion3_84)))(ctx, input);
}
function DecodeDiscriminatedUnion4(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfDiscriminated(ctx, input, "type", hoisted_DiscriminatedUnion4_92)))(ctx, input);
}
function DecodeAllTypes(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_AllTypes_93)))(ctx, input);
}
function DecodeOtherEnum(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_OtherEnum_94)))(ctx, input);
}
function DecodeArr2(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_Arr2_95)))(ctx, input);
}
function DecodeValidCurrency(ctx, input) {
    return ((ctx, input)=>(decodeStringWithFormat(ctx, input, "ValidCurrency")))(ctx, input);
}
function DecodeUnionWithEnumAccess(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfDiscriminated(ctx, input, "tag", hoisted_UnionWithEnumAccess_99)))(ctx, input);
}
function DecodeShape(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfDiscriminated(ctx, input, "kind", hoisted_Shape_103)))(ctx, input);
}
function DecodeT3(ctx, input) {
    return ((ctx, input)=>(decodeAnyOfDiscriminated(ctx, input, "kind", hoisted_T3_106)))(ctx, input);
}
function DecodeBObject(ctx, input) {
    return (hoisted_BObject_108.decode.bind(hoisted_BObject_108))(ctx, input);
}
function DecodeDEF(ctx, input) {
    return (hoisted_DEF_109.decode.bind(hoisted_DEF_109))(ctx, input);
}
function DecodeKDEF(ctx, input) {
    return (hoisted_KDEF_110.decode.bind(hoisted_KDEF_110))(ctx, input);
}
function DecodeABC(ctx, input) {
    return (hoisted_ABC_111.decode.bind(hoisted_ABC_111))(ctx, input);
}
function DecodeKABC(ctx, input) {
    return (decodeNever)(ctx, input);
}
function DecodeK(ctx, input) {
    return ((ctx, input)=>(decodeAnyOf(ctx, input, hoisted_K_112)))(ctx, input);
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
const hoisted_TransportedValue_1 = new ArrayDecoder((ctx, input)=>(decodeAnyOf(ctx, input, hoisted_TransportedValue_0)));
const hoisted_TransportedValue_2 = [
    decodeNull,
    decodeString,
    hoisted_TransportedValue_1.decode.bind(hoisted_TransportedValue_1)
];
const hoisted_AllTs_3 = [
    "a",
    "b"
];
const hoisted_AObject_4 = new ConstDecoder("a");
const hoisted_AObject_5 = new ObjectDecoder({
    "tag": hoisted_AObject_4.decode.bind(hoisted_AObject_4)
});
const hoisted_Version_6 = new RegexDecoder(/(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "${number}.${number}.${number}");
const hoisted_Version2_7 = new RegexDecoder(/(v)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "v${number}.${number}.${number}");
const hoisted_AccessLevel2_8 = [
    "ADMIN Admin",
    "USER User"
];
const hoisted_AccessLevelTpl2_9 = new RegexDecoder(/((ADMIN Admin)|(USER User))/, '("ADMIN Admin" | "USER User")');
const hoisted_AccessLevel_10 = [
    "ADMIN",
    "USER"
];
const hoisted_AccessLevelTpl_11 = new RegexDecoder(/((ADMIN)|(USER))/, '("ADMIN" | "USER")');
const hoisted_Arr3_12 = [
    "X",
    "Y"
];
const hoisted_OmitSettings_13 = new ConstDecoder("d");
const hoisted_OmitSettings_14 = new ObjectDecoder({
    "tag": hoisted_OmitSettings_13.decode.bind(hoisted_OmitSettings_13)
});
const hoisted_OmitSettings_15 = [
    "a",
    "b"
];
const hoisted_OmitSettings_16 = new ObjectDecoder({
    "d": hoisted_OmitSettings_14.decode.bind(hoisted_OmitSettings_14),
    "level": (ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_OmitSettings_15))
});
const hoisted_Settings_17 = new ConstDecoder("d");
const hoisted_Settings_18 = new ObjectDecoder({
    "tag": hoisted_Settings_17.decode.bind(hoisted_Settings_17)
});
const hoisted_Settings_19 = [
    "a",
    "b"
];
const hoisted_Settings_20 = new ObjectDecoder({
    "a": decodeString,
    "d": hoisted_Settings_18.decode.bind(hoisted_Settings_18),
    "level": (ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_Settings_19))
});
const hoisted_PartialObject_21 = [
    decodeNull,
    decodeString
];
const hoisted_PartialObject_22 = [
    decodeNull,
    decodeNumber
];
const hoisted_PartialObject_23 = new ObjectDecoder({
    "a": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_PartialObject_21)),
    "b": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_PartialObject_22))
});
const hoisted_RequiredPartialObject_24 = new ObjectDecoder({
    "a": decodeString,
    "b": decodeNumber
});
const hoisted_LevelAndDSettings_25 = new ConstDecoder("d");
const hoisted_LevelAndDSettings_26 = new ObjectDecoder({
    "tag": hoisted_LevelAndDSettings_25.decode.bind(hoisted_LevelAndDSettings_25)
});
const hoisted_LevelAndDSettings_27 = [
    "a",
    "b"
];
const hoisted_LevelAndDSettings_28 = new ObjectDecoder({
    "d": hoisted_LevelAndDSettings_26.decode.bind(hoisted_LevelAndDSettings_26),
    "level": (ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_LevelAndDSettings_27))
});
const hoisted_PartialSettings_29 = [
    decodeNull,
    decodeString
];
const hoisted_PartialSettings_30 = new ConstDecoder("d");
const hoisted_PartialSettings_31 = new ObjectDecoder({
    "tag": hoisted_PartialSettings_30.decode.bind(hoisted_PartialSettings_30)
});
const hoisted_PartialSettings_32 = [
    decodeNull,
    hoisted_PartialSettings_31.decode.bind(hoisted_PartialSettings_31)
];
const hoisted_PartialSettings_33 = [
    "a",
    "b"
];
const hoisted_PartialSettings_34 = [
    decodeNull,
    (ctx, input)=>(decodeAnyOfConsts(ctx, input, hoisted_PartialSettings_33))
];
const hoisted_PartialSettings_35 = new ObjectDecoder({
    "a": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_PartialSettings_29)),
    "d": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_PartialSettings_32)),
    "level": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_PartialSettings_34))
});
const hoisted_Extra_36 = new ObjectDecoder({}, decodeString);
const hoisted_AvatarSize_37 = new RegexDecoder(/(\d+(\.\d+)?)(x)(\d+(\.\d+)?)/, "${number}x${number}");
const hoisted_User_38 = new ArrayDecoder((ctx, input)=>(validators.User(ctx, input)));
const hoisted_User_39 = new ObjectDecoder({
    "accessLevel": (ctx, input)=>(validators.AccessLevel(ctx, input)),
    "avatarSize": (ctx, input)=>(validators.AvatarSize(ctx, input)),
    "extra": (ctx, input)=>(validators.Extra(ctx, input)),
    "friends": hoisted_User_38.decode.bind(hoisted_User_38),
    "name": decodeString
});
const hoisted_PublicUser_40 = new ObjectDecoder({
    "accessLevel": (ctx, input)=>(validators.AccessLevel(ctx, input)),
    "avatarSize": (ctx, input)=>(validators.AvatarSize(ctx, input)),
    "extra": (ctx, input)=>(validators.Extra(ctx, input)),
    "name": decodeString
});
const hoisted_Req_41 = new ObjectDecoder({
    "optional": decodeString
});
const hoisted_WithOptionals_42 = [
    decodeNull,
    decodeString
];
const hoisted_WithOptionals_43 = new ObjectDecoder({
    "optional": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_WithOptionals_42))
});
const hoisted_Repro1_44 = [
    decodeNull,
    (ctx, input)=>(validators.Repro2(ctx, input))
];
const hoisted_Repro1_45 = new ObjectDecoder({
    "sizes": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_Repro1_44))
});
const hoisted_Repro2_46 = new ObjectDecoder({
    "useSmallerSizes": decodeBoolean
});
const hoisted_SettingsUpdate_47 = new ConstDecoder("d");
const hoisted_SettingsUpdate_48 = new ObjectDecoder({
    "tag": hoisted_SettingsUpdate_47.decode.bind(hoisted_SettingsUpdate_47)
});
const hoisted_SettingsUpdate_49 = [
    decodeString,
    hoisted_SettingsUpdate_48.decode.bind(hoisted_SettingsUpdate_48)
];
const hoisted_Mapped_50 = new ConstDecoder("a");
const hoisted_Mapped_51 = new ObjectDecoder({
    "value": hoisted_Mapped_50.decode.bind(hoisted_Mapped_50)
});
const hoisted_Mapped_52 = new ConstDecoder("b");
const hoisted_Mapped_53 = new ObjectDecoder({
    "value": hoisted_Mapped_52.decode.bind(hoisted_Mapped_52)
});
const hoisted_Mapped_54 = new ObjectDecoder({
    "a": hoisted_Mapped_51.decode.bind(hoisted_Mapped_51),
    "b": hoisted_Mapped_53.decode.bind(hoisted_Mapped_53)
});
const hoisted_MappedOptional_55 = new ConstDecoder("a");
const hoisted_MappedOptional_56 = new ObjectDecoder({
    "value": hoisted_MappedOptional_55.decode.bind(hoisted_MappedOptional_55)
});
const hoisted_MappedOptional_57 = [
    decodeNull,
    hoisted_MappedOptional_56.decode.bind(hoisted_MappedOptional_56)
];
const hoisted_MappedOptional_58 = new ConstDecoder("b");
const hoisted_MappedOptional_59 = new ObjectDecoder({
    "value": hoisted_MappedOptional_58.decode.bind(hoisted_MappedOptional_58)
});
const hoisted_MappedOptional_60 = [
    decodeNull,
    hoisted_MappedOptional_59.decode.bind(hoisted_MappedOptional_59)
];
const hoisted_MappedOptional_61 = new ObjectDecoder({
    "a": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_MappedOptional_57)),
    "b": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_MappedOptional_60))
});
const hoisted_DiscriminatedUnion_62 = [
    decodeNull,
    decodeString
];
const hoisted_DiscriminatedUnion_63 = new ObjectDecoder({
    "a1": decodeString,
    "a11": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_DiscriminatedUnion_62))
});
const hoisted_DiscriminatedUnion_64 = new ObjectDecoder({
    "a2": decodeString
});
const hoisted_DiscriminatedUnion_65 = {
    "a1": hoisted_DiscriminatedUnion_63.decode.bind(hoisted_DiscriminatedUnion_63),
    "a2": hoisted_DiscriminatedUnion_64.decode.bind(hoisted_DiscriminatedUnion_64)
};
const hoisted_DiscriminatedUnion_66 = new ObjectDecoder({
    "value": decodeNumber
});
const hoisted_DiscriminatedUnion_67 = {
    "a": (ctx, input)=>(decodeAnyOfDiscriminated(ctx, input, "subType", hoisted_DiscriminatedUnion_65)),
    "b": hoisted_DiscriminatedUnion_66.decode.bind(hoisted_DiscriminatedUnion_66)
};
const hoisted_DiscriminatedUnion2_68 = [
    decodeNull,
    decodeString
];
const hoisted_DiscriminatedUnion2_69 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion2_70 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion2_71 = new ObjectDecoder({
    "a1": decodeString,
    "a11": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_DiscriminatedUnion2_68)),
    "subType": hoisted_DiscriminatedUnion2_69.decode.bind(hoisted_DiscriminatedUnion2_69),
    "type": hoisted_DiscriminatedUnion2_70.decode.bind(hoisted_DiscriminatedUnion2_70)
});
const hoisted_DiscriminatedUnion2_72 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion2_73 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion2_74 = new ObjectDecoder({
    "a2": decodeString,
    "subType": hoisted_DiscriminatedUnion2_72.decode.bind(hoisted_DiscriminatedUnion2_72),
    "type": hoisted_DiscriminatedUnion2_73.decode.bind(hoisted_DiscriminatedUnion2_73)
});
const hoisted_DiscriminatedUnion2_75 = new ConstDecoder("d");
const hoisted_DiscriminatedUnion2_76 = [
    decodeNull,
    hoisted_DiscriminatedUnion2_75.decode.bind(hoisted_DiscriminatedUnion2_75)
];
const hoisted_DiscriminatedUnion2_77 = new ObjectDecoder({
    "type": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_DiscriminatedUnion2_76)),
    "valueD": decodeNumber
});
const hoisted_DiscriminatedUnion2_78 = new ConstDecoder("b");
const hoisted_DiscriminatedUnion2_79 = new ObjectDecoder({
    "type": hoisted_DiscriminatedUnion2_78.decode.bind(hoisted_DiscriminatedUnion2_78),
    "value": decodeNumber
});
const hoisted_DiscriminatedUnion2_80 = [
    hoisted_DiscriminatedUnion2_71.decode.bind(hoisted_DiscriminatedUnion2_71),
    hoisted_DiscriminatedUnion2_74.decode.bind(hoisted_DiscriminatedUnion2_74),
    hoisted_DiscriminatedUnion2_77.decode.bind(hoisted_DiscriminatedUnion2_77),
    hoisted_DiscriminatedUnion2_79.decode.bind(hoisted_DiscriminatedUnion2_79)
];
const hoisted_DiscriminatedUnion3_81 = new ObjectDecoder({
    "a1": decodeString
});
const hoisted_DiscriminatedUnion3_82 = new ObjectDecoder({
    "value": decodeNumber
});
const hoisted_DiscriminatedUnion3_83 = new ObjectDecoder({
    "a1": decodeString
});
const hoisted_DiscriminatedUnion3_84 = {
    "a": hoisted_DiscriminatedUnion3_81.decode.bind(hoisted_DiscriminatedUnion3_81),
    "b": hoisted_DiscriminatedUnion3_82.decode.bind(hoisted_DiscriminatedUnion3_82),
    "c": hoisted_DiscriminatedUnion3_83.decode.bind(hoisted_DiscriminatedUnion3_83)
};
const hoisted_DiscriminatedUnion4_85 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion4_86 = new ObjectDecoder({
    "a1": decodeString,
    "subType": hoisted_DiscriminatedUnion4_85.decode.bind(hoisted_DiscriminatedUnion4_85)
});
const hoisted_DiscriminatedUnion4_87 = new ObjectDecoder({
    "a": hoisted_DiscriminatedUnion4_86.decode.bind(hoisted_DiscriminatedUnion4_86)
});
const hoisted_DiscriminatedUnion4_88 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion4_89 = new ObjectDecoder({
    "a2": decodeString,
    "subType": hoisted_DiscriminatedUnion4_88.decode.bind(hoisted_DiscriminatedUnion4_88)
});
const hoisted_DiscriminatedUnion4_90 = new ObjectDecoder({
    "a": hoisted_DiscriminatedUnion4_89.decode.bind(hoisted_DiscriminatedUnion4_89)
});
const hoisted_DiscriminatedUnion4_91 = [
    hoisted_DiscriminatedUnion4_87.decode.bind(hoisted_DiscriminatedUnion4_87),
    hoisted_DiscriminatedUnion4_90.decode.bind(hoisted_DiscriminatedUnion4_90)
];
const hoisted_DiscriminatedUnion4_92 = {
    "a": (ctx, input)=>(decodeAnyOf(ctx, input, hoisted_DiscriminatedUnion4_91))
};
const hoisted_AllTypes_93 = [
    "LevelAndDSettings",
    "OmitSettings",
    "PartialSettings",
    "RequiredPartialObject"
];
const hoisted_OtherEnum_94 = [
    "a",
    "b"
];
const hoisted_Arr2_95 = [
    "A",
    "B",
    "C"
];
const hoisted_UnionWithEnumAccess_96 = new ObjectDecoder({
    "value": decodeString
});
const hoisted_UnionWithEnumAccess_97 = new ObjectDecoder({
    "value": decodeNumber
});
const hoisted_UnionWithEnumAccess_98 = new ObjectDecoder({
    "value": decodeBoolean
});
const hoisted_UnionWithEnumAccess_99 = {
    "a": hoisted_UnionWithEnumAccess_96.decode.bind(hoisted_UnionWithEnumAccess_96),
    "b": hoisted_UnionWithEnumAccess_97.decode.bind(hoisted_UnionWithEnumAccess_97),
    "c": hoisted_UnionWithEnumAccess_98.decode.bind(hoisted_UnionWithEnumAccess_98)
};
const hoisted_Shape_100 = new ObjectDecoder({
    "radius": decodeNumber
});
const hoisted_Shape_101 = new ObjectDecoder({
    "x": decodeNumber
});
const hoisted_Shape_102 = new ObjectDecoder({
    "x": decodeNumber,
    "y": decodeNumber
});
const hoisted_Shape_103 = {
    "circle": hoisted_Shape_100.decode.bind(hoisted_Shape_100),
    "square": hoisted_Shape_101.decode.bind(hoisted_Shape_101),
    "triangle": hoisted_Shape_102.decode.bind(hoisted_Shape_102)
};
const hoisted_T3_104 = new ObjectDecoder({
    "x": decodeNumber
});
const hoisted_T3_105 = new ObjectDecoder({
    "x": decodeNumber,
    "y": decodeNumber
});
const hoisted_T3_106 = {
    "square": hoisted_T3_104.decode.bind(hoisted_T3_104),
    "triangle": hoisted_T3_105.decode.bind(hoisted_T3_105)
};
const hoisted_BObject_107 = new ConstDecoder("b");
const hoisted_BObject_108 = new ObjectDecoder({
    "tag": hoisted_BObject_107.decode.bind(hoisted_BObject_107)
});
const hoisted_DEF_109 = new ObjectDecoder({
    "a": decodeString
});
const hoisted_KDEF_110 = new ConstDecoder("a");
const hoisted_ABC_111 = new ObjectDecoder({});
const hoisted_K_112 = [
    (ctx, input)=>(validators.KABC(ctx, input)),
    (ctx, input)=>(validators.KDEF(ctx, input))
];

export default { ObjectDecoder, ArrayDecoder, decodeString, decodeNumber, CodecDecoder, decodeFunction, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, TupleDecoder, decodeNull, decodeNever, RegexDecoder, ConstDecoder, registerCustomFormatter, validators };