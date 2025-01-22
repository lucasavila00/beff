//@ts-nocheck
/* eslint-disable */




const customFormatters = {};

function registerCustomFormatter(name, validator) {
  customFormatters[name] = validator;
}

function pushPath(ctx, path) {
  if (ctx.noErrorMessages) {
    return;
  }
  if (ctx.paths == null) {
    ctx.paths = [];
  }
  ctx.paths.push(path);
}
function popPath(ctx) {
  if (ctx.noErrorMessages) {
    return;
  }
  if (ctx.paths == null) {
    throw new Error("popPath: no paths");
  }
  return ctx.paths.pop();
}
function storeError(ctx, received, message) {
  if (ctx.noErrorMessages) {
    ctx.errors = true;
    return;
  }
  if (ctx.errors == null) {
    ctx.errors = [];
  }

  let messageStr = message;
  if (typeof message === "function") {
    messageStr = message();
  }

  ctx.errors.push({
    message: messageStr,
    path: [...(ctx.paths ?? [])],
    received,
  });
}
function storeUnionError(ctx, received, errors) {
  if (ctx.noErrorMessages) {
    ctx.errors = true;
    return;
  }
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

function decodeString(ctx, input) {
  if (typeof input === "string") {
    return input;
  }

  return storeError(ctx, input, "expected string");
}

function decodeNumber(ctx, input) {
  if (typeof input === "number") {
    return input;
  }
  if (String(input).toLowerCase() == "nan") {
    return NaN;
  }

  return storeError(ctx, input, "expected number");
}

function decodeFunction(ctx, input) {
  if (typeof input === "function") {
    return input;
  }
  return storeError(ctx, input, "expected function");
}
function decodeBoolean(ctx, input) {
  if (typeof input === "boolean") {
    return input;
  }
  return storeError(ctx, input, "expected boolean");
}
function decodeAny(ctx, input) {
  return input;
}
function decodeNull(ctx, input) {
  if (input == null) {
    return input;
  }
  return storeError(ctx, input, "expected nullish value");
}
function decodeNever(ctx, input) {
  return storeError(ctx, input, "never");
}

class ConstDecoder {
  constructor(value) {
    this.value = value;
  }

  decodeConstDecoder(ctx, input) {
    if (input == this.value) {
      return this.value;
    }
    return storeError(ctx, input, () => "expected " + JSON.stringify(this.value));
  }
}

class RegexDecoder {
  constructor(regex, description) {
    this.regex = regex;
    this.description = description;
  }

  decodeRegexDecoder(ctx, input) {
    if (typeof input === "string") {
      if (this.regex.test(input)) {
        return input;
      }
    }
    return storeError(ctx, input, () => "expected string matching " + this.description);
  }
}

class ObjectDecoder {
  constructor(data, additionalPropsValidator = null) {
    this.data = data;
    this.additionalPropsValidator = additionalPropsValidator;
  }

  decodeObjectDecoder(ctx, input) {
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
            storeError(ctx, input[k], "extra property");
            popPath(ctx);
          }
        }
      }

      return acc;
    }
    return storeError(ctx, input, "expected object");
  }
}

class ArrayDecoder {
  constructor(data) {
    this.data = data;
  }

  decodeArrayDecoder(ctx, input) {
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
    return storeError(ctx, input, "expected array");
  }
}
class CodecDecoder {
  constructor(codec) {
    this.codec = codec;
  }
  decodeCodecDecoder(ctx, input) {
    switch (this.codec) {
      case "Codec::ISO8061": {
        const d = new Date(input);
        if (isNaN(d.getTime())) {
          return storeError(ctx, input, "expected ISO8061 date");
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
        return storeError(ctx, input, "expected bigint");
      }
    }
    return storeError(ctx, input, () => "codec " + this.codec + " not implemented");
  }
}

class StringWithFormatDecoder {
  constructor(format) {
    this.format = format;
  }

  decodeStringWithFormatDecoder(ctx, input) {
    if (typeof input !== "string") {
      return storeError(ctx, input, "expected string with format " + JSON.stringify(this.format));
    }

    const validator = customFormatters[this.format];

    if (validator == null) {
      return storeError(ctx, input, () => "format " + JSON.stringify(this.format) + " not implemented");
    }

    const isOk = validator(input);
    if (isOk) {
      return input;
    }
    return storeError(ctx, input, "expected string with format " + JSON.stringify(this.format));
  }
}
class AnyOfDiscriminatedDecoder {
  constructor(discriminator, mapping) {
    this.discriminator = discriminator;
    this.mapping = mapping;
  }

  decodeAnyOfDiscriminatedDecoder(ctx, input) {
    const d = input[this.discriminator];
    if (d == null) {
      return storeError(ctx, input, () => "expected discriminator key " + JSON.stringify(this.discriminator));
    }
    const v = this.mapping[d];
    if (v == null) {
      pushPath(ctx, this.discriminator);
      const err = storeError(
        ctx,
        d,
        () =>
          "expected one of " +
          Object.keys(this.mapping)
            .map((it) => JSON.stringify(it))
            .join(", ")
      );
      popPath(ctx);
      return err;
    }
    const prevAllow = ctx.allowedExtraProperties__ ?? [];
    ctx.allowedExtraProperties__ = [...prevAllow, this.discriminator];
    const out = v(ctx, input);
    ctx.allowedExtraProperties__ = prevAllow;
    return { ...out, [this.discriminator]: d };
  }
}

class AnyOfConstsDecoder {
  constructor(consts) {
    this.consts = consts;
  }
  decodeAnyOfConstsDecoder(ctx, input) {
    for (const c of this.consts) {
      if (input === c) {
        return c;
      }
    }
    return storeError(ctx, input, () =>
      this.consts.length < 3
        ? "expected one of " + this.consts.map((it) => JSON.stringify(it)).join(", ")
        : "expected one of " +
          this.consts
            .slice(0, 3)
            .map((it) => JSON.stringify(it))
            .join(", ") +
          "..."
    );
  }
}

class AnyOfDecoder {
  constructor(vs) {
    this.vs = vs;
  }
  decodeAnyOfDecoder(ctx, input) {
    const optimisticCtx = {
      noErrorMessages: true,
    };
    for (const v of this.vs) {
      optimisticCtx.errors = null;
      const newValue = v(optimisticCtx, input);
      if (optimisticCtx.errors == null) {
        return newValue;
      }
    }

    let accErrors = [];
    for (const v of this.vs) {
      const validatorCtx = {};
      const newValue = v(validatorCtx, input);
      if (validatorCtx.errors == null) {
        return newValue;
      }
      accErrors.push(...(validatorCtx.errors ?? []));
    }
    return storeUnionError(ctx, input, accErrors);
  }
}
class AllOfDecoder {
  constructor(vs) {
    this.vs = vs;
  }
  decodeAllOfDecoder(ctx, input) {
    let acc = {};
    let foundOneObject = false;
    let allObjects = true;
    for (const v of this.vs) {
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
}
class TupleDecoder {
  constructor(vs) {
    this.vs = vs;
  }
  decodeTupleDecoder(ctx, input) {
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
          return storeError(ctx, input, "tuple has too many items");
        }
      }
      return acc;
    }
    return storeError(ctx, input, "expected tuple");
  }
}


function DecodeTransportedValue(ctx, input) {
    return (hoisted_TransportedValue_2.decodeAnyOfDecoder.bind(hoisted_TransportedValue_2))(ctx, input);
}
function DecodeAllTs(ctx, input) {
    return (hoisted_AllTs_3.decodeAnyOfConstsDecoder.bind(hoisted_AllTs_3))(ctx, input);
}
function DecodeAObject(ctx, input) {
    return (hoisted_AObject_5.decodeObjectDecoder.bind(hoisted_AObject_5))(ctx, input);
}
function DecodeVersion(ctx, input) {
    return (hoisted_Version_6.decodeRegexDecoder.bind(hoisted_Version_6))(ctx, input);
}
function DecodeVersion2(ctx, input) {
    return (hoisted_Version2_7.decodeRegexDecoder.bind(hoisted_Version2_7))(ctx, input);
}
function DecodeAccessLevel2(ctx, input) {
    return (hoisted_AccessLevel2_8.decodeAnyOfConstsDecoder.bind(hoisted_AccessLevel2_8))(ctx, input);
}
function DecodeAccessLevelTpl2(ctx, input) {
    return (hoisted_AccessLevelTpl2_9.decodeRegexDecoder.bind(hoisted_AccessLevelTpl2_9))(ctx, input);
}
function DecodeAccessLevel(ctx, input) {
    return (hoisted_AccessLevel_10.decodeAnyOfConstsDecoder.bind(hoisted_AccessLevel_10))(ctx, input);
}
function DecodeAccessLevelTpl(ctx, input) {
    return (hoisted_AccessLevelTpl_11.decodeRegexDecoder.bind(hoisted_AccessLevelTpl_11))(ctx, input);
}
function DecodeArr3(ctx, input) {
    return (hoisted_Arr3_12.decodeAnyOfConstsDecoder.bind(hoisted_Arr3_12))(ctx, input);
}
function DecodeOmitSettings(ctx, input) {
    return (hoisted_OmitSettings_16.decodeObjectDecoder.bind(hoisted_OmitSettings_16))(ctx, input);
}
function DecodeSettings(ctx, input) {
    return (hoisted_Settings_20.decodeObjectDecoder.bind(hoisted_Settings_20))(ctx, input);
}
function DecodePartialObject(ctx, input) {
    return (hoisted_PartialObject_23.decodeObjectDecoder.bind(hoisted_PartialObject_23))(ctx, input);
}
function DecodeRequiredPartialObject(ctx, input) {
    return (hoisted_RequiredPartialObject_24.decodeObjectDecoder.bind(hoisted_RequiredPartialObject_24))(ctx, input);
}
function DecodeLevelAndDSettings(ctx, input) {
    return (hoisted_LevelAndDSettings_28.decodeObjectDecoder.bind(hoisted_LevelAndDSettings_28))(ctx, input);
}
function DecodePartialSettings(ctx, input) {
    return (hoisted_PartialSettings_36.decodeObjectDecoder.bind(hoisted_PartialSettings_36))(ctx, input);
}
function DecodeExtra(ctx, input) {
    return (hoisted_Extra_37.decodeObjectDecoder.bind(hoisted_Extra_37))(ctx, input);
}
function DecodeAvatarSize(ctx, input) {
    return (hoisted_AvatarSize_38.decodeRegexDecoder.bind(hoisted_AvatarSize_38))(ctx, input);
}
function DecodeUser(ctx, input) {
    return (hoisted_User_40.decodeObjectDecoder.bind(hoisted_User_40))(ctx, input);
}
function DecodePublicUser(ctx, input) {
    return (hoisted_PublicUser_41.decodeObjectDecoder.bind(hoisted_PublicUser_41))(ctx, input);
}
function DecodeReq(ctx, input) {
    return (hoisted_Req_42.decodeObjectDecoder.bind(hoisted_Req_42))(ctx, input);
}
function DecodeWithOptionals(ctx, input) {
    return (hoisted_WithOptionals_44.decodeObjectDecoder.bind(hoisted_WithOptionals_44))(ctx, input);
}
function DecodeRepro1(ctx, input) {
    return (hoisted_Repro1_46.decodeObjectDecoder.bind(hoisted_Repro1_46))(ctx, input);
}
function DecodeRepro2(ctx, input) {
    return (hoisted_Repro2_47.decodeObjectDecoder.bind(hoisted_Repro2_47))(ctx, input);
}
function DecodeSettingsUpdate(ctx, input) {
    return (hoisted_SettingsUpdate_50.decodeAnyOfDecoder.bind(hoisted_SettingsUpdate_50))(ctx, input);
}
function DecodeMapped(ctx, input) {
    return (hoisted_Mapped_55.decodeObjectDecoder.bind(hoisted_Mapped_55))(ctx, input);
}
function DecodeMappedOptional(ctx, input) {
    return (hoisted_MappedOptional_62.decodeObjectDecoder.bind(hoisted_MappedOptional_62))(ctx, input);
}
function DecodeDiscriminatedUnion(ctx, input) {
    return (hoisted_DiscriminatedUnion_68.decodeAnyOfDiscriminatedDecoder.bind(hoisted_DiscriminatedUnion_68))(ctx, input);
}
function DecodeDiscriminatedUnion2(ctx, input) {
    return (hoisted_DiscriminatedUnion2_81.decodeAnyOfDecoder.bind(hoisted_DiscriminatedUnion2_81))(ctx, input);
}
function DecodeDiscriminatedUnion3(ctx, input) {
    return (hoisted_DiscriminatedUnion3_85.decodeAnyOfDiscriminatedDecoder.bind(hoisted_DiscriminatedUnion3_85))(ctx, input);
}
function DecodeDiscriminatedUnion4(ctx, input) {
    return (hoisted_DiscriminatedUnion4_93.decodeAnyOfDiscriminatedDecoder.bind(hoisted_DiscriminatedUnion4_93))(ctx, input);
}
function DecodeAllTypes(ctx, input) {
    return (hoisted_AllTypes_94.decodeAnyOfConstsDecoder.bind(hoisted_AllTypes_94))(ctx, input);
}
function DecodeOtherEnum(ctx, input) {
    return (hoisted_OtherEnum_95.decodeAnyOfConstsDecoder.bind(hoisted_OtherEnum_95))(ctx, input);
}
function DecodeArr2(ctx, input) {
    return (hoisted_Arr2_96.decodeAnyOfConstsDecoder.bind(hoisted_Arr2_96))(ctx, input);
}
function DecodeValidCurrency(ctx, input) {
    return (hoisted_ValidCurrency_97.decodeStringWithFormatDecoder.bind(hoisted_ValidCurrency_97))(ctx, input);
}
function DecodeUnionWithEnumAccess(ctx, input) {
    return (hoisted_UnionWithEnumAccess_101.decodeAnyOfDiscriminatedDecoder.bind(hoisted_UnionWithEnumAccess_101))(ctx, input);
}
function DecodeShape(ctx, input) {
    return (hoisted_Shape_105.decodeAnyOfDiscriminatedDecoder.bind(hoisted_Shape_105))(ctx, input);
}
function DecodeT3(ctx, input) {
    return (hoisted_T3_108.decodeAnyOfDiscriminatedDecoder.bind(hoisted_T3_108))(ctx, input);
}
function DecodeBObject(ctx, input) {
    return (hoisted_BObject_110.decodeObjectDecoder.bind(hoisted_BObject_110))(ctx, input);
}
function DecodeDEF(ctx, input) {
    return (hoisted_DEF_111.decodeObjectDecoder.bind(hoisted_DEF_111))(ctx, input);
}
function DecodeKDEF(ctx, input) {
    return (hoisted_KDEF_112.decodeConstDecoder.bind(hoisted_KDEF_112))(ctx, input);
}
function DecodeABC(ctx, input) {
    return (hoisted_ABC_113.decodeObjectDecoder.bind(hoisted_ABC_113))(ctx, input);
}
function DecodeKABC(ctx, input) {
    return (decodeNever)(ctx, input);
}
function DecodeK(ctx, input) {
    return (hoisted_K_114.decodeAnyOfDecoder.bind(hoisted_K_114))(ctx, input);
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
const hoisted_TransportedValue_0 = new AnyOfDecoder([
    decodeNull,
    decodeString,
    decodeNumber
]);
const hoisted_TransportedValue_1 = new ArrayDecoder(hoisted_TransportedValue_0.decodeAnyOfDecoder.bind(hoisted_TransportedValue_0));
const hoisted_TransportedValue_2 = new AnyOfDecoder([
    decodeNull,
    decodeString,
    hoisted_TransportedValue_1.decodeArrayDecoder.bind(hoisted_TransportedValue_1)
]);
const hoisted_AllTs_3 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_AObject_4 = new ConstDecoder("a");
const hoisted_AObject_5 = new ObjectDecoder({
    "tag": hoisted_AObject_4.decodeConstDecoder.bind(hoisted_AObject_4)
});
const hoisted_Version_6 = new RegexDecoder(/(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "${number}.${number}.${number}");
const hoisted_Version2_7 = new RegexDecoder(/(v)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "v${number}.${number}.${number}");
const hoisted_AccessLevel2_8 = new AnyOfConstsDecoder([
    "ADMIN Admin",
    "USER User"
]);
const hoisted_AccessLevelTpl2_9 = new RegexDecoder(/((ADMIN Admin)|(USER User))/, '("ADMIN Admin" | "USER User")');
const hoisted_AccessLevel_10 = new AnyOfConstsDecoder([
    "ADMIN",
    "USER"
]);
const hoisted_AccessLevelTpl_11 = new RegexDecoder(/((ADMIN)|(USER))/, '("ADMIN" | "USER")');
const hoisted_Arr3_12 = new AnyOfConstsDecoder([
    "X",
    "Y"
]);
const hoisted_OmitSettings_13 = new ConstDecoder("d");
const hoisted_OmitSettings_14 = new ObjectDecoder({
    "tag": hoisted_OmitSettings_13.decodeConstDecoder.bind(hoisted_OmitSettings_13)
});
const hoisted_OmitSettings_15 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_OmitSettings_16 = new ObjectDecoder({
    "d": hoisted_OmitSettings_14.decodeObjectDecoder.bind(hoisted_OmitSettings_14),
    "level": hoisted_OmitSettings_15.decodeAnyOfConstsDecoder.bind(hoisted_OmitSettings_15)
});
const hoisted_Settings_17 = new ConstDecoder("d");
const hoisted_Settings_18 = new ObjectDecoder({
    "tag": hoisted_Settings_17.decodeConstDecoder.bind(hoisted_Settings_17)
});
const hoisted_Settings_19 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_Settings_20 = new ObjectDecoder({
    "a": decodeString,
    "d": hoisted_Settings_18.decodeObjectDecoder.bind(hoisted_Settings_18),
    "level": hoisted_Settings_19.decodeAnyOfConstsDecoder.bind(hoisted_Settings_19)
});
const hoisted_PartialObject_21 = new AnyOfDecoder([
    decodeNull,
    decodeString
]);
const hoisted_PartialObject_22 = new AnyOfDecoder([
    decodeNull,
    decodeNumber
]);
const hoisted_PartialObject_23 = new ObjectDecoder({
    "a": hoisted_PartialObject_21.decodeAnyOfDecoder.bind(hoisted_PartialObject_21),
    "b": hoisted_PartialObject_22.decodeAnyOfDecoder.bind(hoisted_PartialObject_22)
});
const hoisted_RequiredPartialObject_24 = new ObjectDecoder({
    "a": decodeString,
    "b": decodeNumber
});
const hoisted_LevelAndDSettings_25 = new ConstDecoder("d");
const hoisted_LevelAndDSettings_26 = new ObjectDecoder({
    "tag": hoisted_LevelAndDSettings_25.decodeConstDecoder.bind(hoisted_LevelAndDSettings_25)
});
const hoisted_LevelAndDSettings_27 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_LevelAndDSettings_28 = new ObjectDecoder({
    "d": hoisted_LevelAndDSettings_26.decodeObjectDecoder.bind(hoisted_LevelAndDSettings_26),
    "level": hoisted_LevelAndDSettings_27.decodeAnyOfConstsDecoder.bind(hoisted_LevelAndDSettings_27)
});
const hoisted_PartialSettings_29 = new AnyOfDecoder([
    decodeNull,
    decodeString
]);
const hoisted_PartialSettings_30 = new ConstDecoder("d");
const hoisted_PartialSettings_31 = new ObjectDecoder({
    "tag": hoisted_PartialSettings_30.decodeConstDecoder.bind(hoisted_PartialSettings_30)
});
const hoisted_PartialSettings_32 = new AnyOfDecoder([
    decodeNull,
    hoisted_PartialSettings_31.decodeObjectDecoder.bind(hoisted_PartialSettings_31)
]);
const hoisted_PartialSettings_33 = new ConstDecoder("a");
const hoisted_PartialSettings_34 = new ConstDecoder("b");
const hoisted_PartialSettings_35 = new AnyOfDecoder([
    decodeNull,
    hoisted_PartialSettings_33.decodeConstDecoder.bind(hoisted_PartialSettings_33),
    hoisted_PartialSettings_34.decodeConstDecoder.bind(hoisted_PartialSettings_34)
]);
const hoisted_PartialSettings_36 = new ObjectDecoder({
    "a": hoisted_PartialSettings_29.decodeAnyOfDecoder.bind(hoisted_PartialSettings_29),
    "d": hoisted_PartialSettings_32.decodeAnyOfDecoder.bind(hoisted_PartialSettings_32),
    "level": hoisted_PartialSettings_35.decodeAnyOfDecoder.bind(hoisted_PartialSettings_35)
});
const hoisted_Extra_37 = new ObjectDecoder({}, decodeString);
const hoisted_AvatarSize_38 = new RegexDecoder(/(\d+(\.\d+)?)(x)(\d+(\.\d+)?)/, "${number}x${number}");
const hoisted_User_39 = new ArrayDecoder(validators.User);
const hoisted_User_40 = new ObjectDecoder({
    "accessLevel": validators.AccessLevel,
    "avatarSize": validators.AvatarSize,
    "extra": validators.Extra,
    "friends": hoisted_User_39.decodeArrayDecoder.bind(hoisted_User_39),
    "name": decodeString
});
const hoisted_PublicUser_41 = new ObjectDecoder({
    "accessLevel": validators.AccessLevel,
    "avatarSize": validators.AvatarSize,
    "extra": validators.Extra,
    "name": decodeString
});
const hoisted_Req_42 = new ObjectDecoder({
    "optional": decodeString
});
const hoisted_WithOptionals_43 = new AnyOfDecoder([
    decodeNull,
    decodeString
]);
const hoisted_WithOptionals_44 = new ObjectDecoder({
    "optional": hoisted_WithOptionals_43.decodeAnyOfDecoder.bind(hoisted_WithOptionals_43)
});
const hoisted_Repro1_45 = new AnyOfDecoder([
    decodeNull,
    validators.Repro2
]);
const hoisted_Repro1_46 = new ObjectDecoder({
    "sizes": hoisted_Repro1_45.decodeAnyOfDecoder.bind(hoisted_Repro1_45)
});
const hoisted_Repro2_47 = new ObjectDecoder({
    "useSmallerSizes": decodeBoolean
});
const hoisted_SettingsUpdate_48 = new ConstDecoder("d");
const hoisted_SettingsUpdate_49 = new ObjectDecoder({
    "tag": hoisted_SettingsUpdate_48.decodeConstDecoder.bind(hoisted_SettingsUpdate_48)
});
const hoisted_SettingsUpdate_50 = new AnyOfDecoder([
    decodeString,
    hoisted_SettingsUpdate_49.decodeObjectDecoder.bind(hoisted_SettingsUpdate_49)
]);
const hoisted_Mapped_51 = new ConstDecoder("a");
const hoisted_Mapped_52 = new ObjectDecoder({
    "value": hoisted_Mapped_51.decodeConstDecoder.bind(hoisted_Mapped_51)
});
const hoisted_Mapped_53 = new ConstDecoder("b");
const hoisted_Mapped_54 = new ObjectDecoder({
    "value": hoisted_Mapped_53.decodeConstDecoder.bind(hoisted_Mapped_53)
});
const hoisted_Mapped_55 = new ObjectDecoder({
    "a": hoisted_Mapped_52.decodeObjectDecoder.bind(hoisted_Mapped_52),
    "b": hoisted_Mapped_54.decodeObjectDecoder.bind(hoisted_Mapped_54)
});
const hoisted_MappedOptional_56 = new ConstDecoder("a");
const hoisted_MappedOptional_57 = new ObjectDecoder({
    "value": hoisted_MappedOptional_56.decodeConstDecoder.bind(hoisted_MappedOptional_56)
});
const hoisted_MappedOptional_58 = new AnyOfDecoder([
    decodeNull,
    hoisted_MappedOptional_57.decodeObjectDecoder.bind(hoisted_MappedOptional_57)
]);
const hoisted_MappedOptional_59 = new ConstDecoder("b");
const hoisted_MappedOptional_60 = new ObjectDecoder({
    "value": hoisted_MappedOptional_59.decodeConstDecoder.bind(hoisted_MappedOptional_59)
});
const hoisted_MappedOptional_61 = new AnyOfDecoder([
    decodeNull,
    hoisted_MappedOptional_60.decodeObjectDecoder.bind(hoisted_MappedOptional_60)
]);
const hoisted_MappedOptional_62 = new ObjectDecoder({
    "a": hoisted_MappedOptional_58.decodeAnyOfDecoder.bind(hoisted_MappedOptional_58),
    "b": hoisted_MappedOptional_61.decodeAnyOfDecoder.bind(hoisted_MappedOptional_61)
});
const hoisted_DiscriminatedUnion_63 = new AnyOfDecoder([
    decodeNull,
    decodeString
]);
const hoisted_DiscriminatedUnion_64 = new ObjectDecoder({
    "a1": decodeString,
    "a11": hoisted_DiscriminatedUnion_63.decodeAnyOfDecoder.bind(hoisted_DiscriminatedUnion_63)
});
const hoisted_DiscriminatedUnion_65 = new ObjectDecoder({
    "a2": decodeString
});
const hoisted_DiscriminatedUnion_66 = new AnyOfDiscriminatedDecoder("subType", {
    "a1": hoisted_DiscriminatedUnion_64.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion_64),
    "a2": hoisted_DiscriminatedUnion_65.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion_65)
});
const hoisted_DiscriminatedUnion_67 = new ObjectDecoder({
    "value": decodeNumber
});
const hoisted_DiscriminatedUnion_68 = new AnyOfDiscriminatedDecoder("type", {
    "a": hoisted_DiscriminatedUnion_66.decodeAnyOfDiscriminatedDecoder.bind(hoisted_DiscriminatedUnion_66),
    "b": hoisted_DiscriminatedUnion_67.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion_67)
});
const hoisted_DiscriminatedUnion2_69 = new AnyOfDecoder([
    decodeNull,
    decodeString
]);
const hoisted_DiscriminatedUnion2_70 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion2_71 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion2_72 = new ObjectDecoder({
    "a1": decodeString,
    "a11": hoisted_DiscriminatedUnion2_69.decodeAnyOfDecoder.bind(hoisted_DiscriminatedUnion2_69),
    "subType": hoisted_DiscriminatedUnion2_70.decodeConstDecoder.bind(hoisted_DiscriminatedUnion2_70),
    "type": hoisted_DiscriminatedUnion2_71.decodeConstDecoder.bind(hoisted_DiscriminatedUnion2_71)
});
const hoisted_DiscriminatedUnion2_73 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion2_74 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion2_75 = new ObjectDecoder({
    "a2": decodeString,
    "subType": hoisted_DiscriminatedUnion2_73.decodeConstDecoder.bind(hoisted_DiscriminatedUnion2_73),
    "type": hoisted_DiscriminatedUnion2_74.decodeConstDecoder.bind(hoisted_DiscriminatedUnion2_74)
});
const hoisted_DiscriminatedUnion2_76 = new ConstDecoder("d");
const hoisted_DiscriminatedUnion2_77 = new AnyOfDecoder([
    decodeNull,
    hoisted_DiscriminatedUnion2_76.decodeConstDecoder.bind(hoisted_DiscriminatedUnion2_76)
]);
const hoisted_DiscriminatedUnion2_78 = new ObjectDecoder({
    "type": hoisted_DiscriminatedUnion2_77.decodeAnyOfDecoder.bind(hoisted_DiscriminatedUnion2_77),
    "valueD": decodeNumber
});
const hoisted_DiscriminatedUnion2_79 = new ConstDecoder("b");
const hoisted_DiscriminatedUnion2_80 = new ObjectDecoder({
    "type": hoisted_DiscriminatedUnion2_79.decodeConstDecoder.bind(hoisted_DiscriminatedUnion2_79),
    "value": decodeNumber
});
const hoisted_DiscriminatedUnion2_81 = new AnyOfDecoder([
    hoisted_DiscriminatedUnion2_72.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion2_72),
    hoisted_DiscriminatedUnion2_75.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion2_75),
    hoisted_DiscriminatedUnion2_78.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion2_78),
    hoisted_DiscriminatedUnion2_80.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion2_80)
]);
const hoisted_DiscriminatedUnion3_82 = new ObjectDecoder({
    "a1": decodeString
});
const hoisted_DiscriminatedUnion3_83 = new ObjectDecoder({
    "value": decodeNumber
});
const hoisted_DiscriminatedUnion3_84 = new ObjectDecoder({
    "a1": decodeString
});
const hoisted_DiscriminatedUnion3_85 = new AnyOfDiscriminatedDecoder("type", {
    "a": hoisted_DiscriminatedUnion3_82.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion3_82),
    "b": hoisted_DiscriminatedUnion3_83.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion3_83),
    "c": hoisted_DiscriminatedUnion3_84.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion3_84)
});
const hoisted_DiscriminatedUnion4_86 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion4_87 = new ObjectDecoder({
    "a1": decodeString,
    "subType": hoisted_DiscriminatedUnion4_86.decodeConstDecoder.bind(hoisted_DiscriminatedUnion4_86)
});
const hoisted_DiscriminatedUnion4_88 = new ObjectDecoder({
    "a": hoisted_DiscriminatedUnion4_87.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion4_87)
});
const hoisted_DiscriminatedUnion4_89 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion4_90 = new ObjectDecoder({
    "a2": decodeString,
    "subType": hoisted_DiscriminatedUnion4_89.decodeConstDecoder.bind(hoisted_DiscriminatedUnion4_89)
});
const hoisted_DiscriminatedUnion4_91 = new ObjectDecoder({
    "a": hoisted_DiscriminatedUnion4_90.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion4_90)
});
const hoisted_DiscriminatedUnion4_92 = new AnyOfDecoder([
    hoisted_DiscriminatedUnion4_88.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion4_88),
    hoisted_DiscriminatedUnion4_91.decodeObjectDecoder.bind(hoisted_DiscriminatedUnion4_91)
]);
const hoisted_DiscriminatedUnion4_93 = new AnyOfDiscriminatedDecoder("type", {
    "a": hoisted_DiscriminatedUnion4_92.decodeAnyOfDecoder.bind(hoisted_DiscriminatedUnion4_92)
});
const hoisted_AllTypes_94 = new AnyOfConstsDecoder([
    "LevelAndDSettings",
    "OmitSettings",
    "PartialSettings",
    "RequiredPartialObject"
]);
const hoisted_OtherEnum_95 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_Arr2_96 = new AnyOfConstsDecoder([
    "A",
    "B",
    "C"
]);
const hoisted_ValidCurrency_97 = new StringWithFormatDecoder("ValidCurrency");
const hoisted_UnionWithEnumAccess_98 = new ObjectDecoder({
    "value": decodeString
});
const hoisted_UnionWithEnumAccess_99 = new ObjectDecoder({
    "value": decodeNumber
});
const hoisted_UnionWithEnumAccess_100 = new ObjectDecoder({
    "value": decodeBoolean
});
const hoisted_UnionWithEnumAccess_101 = new AnyOfDiscriminatedDecoder("tag", {
    "a": hoisted_UnionWithEnumAccess_98.decodeObjectDecoder.bind(hoisted_UnionWithEnumAccess_98),
    "b": hoisted_UnionWithEnumAccess_99.decodeObjectDecoder.bind(hoisted_UnionWithEnumAccess_99),
    "c": hoisted_UnionWithEnumAccess_100.decodeObjectDecoder.bind(hoisted_UnionWithEnumAccess_100)
});
const hoisted_Shape_102 = new ObjectDecoder({
    "radius": decodeNumber
});
const hoisted_Shape_103 = new ObjectDecoder({
    "x": decodeNumber
});
const hoisted_Shape_104 = new ObjectDecoder({
    "x": decodeNumber,
    "y": decodeNumber
});
const hoisted_Shape_105 = new AnyOfDiscriminatedDecoder("kind", {
    "circle": hoisted_Shape_102.decodeObjectDecoder.bind(hoisted_Shape_102),
    "square": hoisted_Shape_103.decodeObjectDecoder.bind(hoisted_Shape_103),
    "triangle": hoisted_Shape_104.decodeObjectDecoder.bind(hoisted_Shape_104)
});
const hoisted_T3_106 = new ObjectDecoder({
    "x": decodeNumber
});
const hoisted_T3_107 = new ObjectDecoder({
    "x": decodeNumber,
    "y": decodeNumber
});
const hoisted_T3_108 = new AnyOfDiscriminatedDecoder("kind", {
    "square": hoisted_T3_106.decodeObjectDecoder.bind(hoisted_T3_106),
    "triangle": hoisted_T3_107.decodeObjectDecoder.bind(hoisted_T3_107)
});
const hoisted_BObject_109 = new ConstDecoder("b");
const hoisted_BObject_110 = new ObjectDecoder({
    "tag": hoisted_BObject_109.decodeConstDecoder.bind(hoisted_BObject_109)
});
const hoisted_DEF_111 = new ObjectDecoder({
    "a": decodeString
});
const hoisted_KDEF_112 = new ConstDecoder("a");
const hoisted_ABC_113 = new ObjectDecoder({});
const hoisted_K_114 = new AnyOfDecoder([
    validators.KABC,
    validators.KDEF
]);

export default { ObjectDecoder, ArrayDecoder, decodeString, decodeNumber, CodecDecoder, decodeFunction, StringWithFormatDecoder, AnyOfDecoder, AllOfDecoder, decodeBoolean, decodeAny, TupleDecoder, decodeNull, decodeNever, RegexDecoder, ConstDecoder, registerCustomFormatter, AnyOfConstsDecoder, AnyOfDiscriminatedDecoder, validators };