//@ts-nocheck

"use strict";

import {
  TypeofRuntype,
  AnyRuntype,
  NullishRuntype,
  NeverRuntype,
  ConstRuntype,
  RegexRuntype,
  DateRuntype,
  BigIntRuntype,
  StringWithFormatRuntype,
  NumberWithFormatRuntype,
  AnyOfConstsRuntype,
  TupleRuntype,
  AllOfRuntype,
  AnyOfRuntype,
  ArrayRuntype,
  AnyOfDiscriminatedRuntype,
  ObjectRuntype,
  OptionalFieldRuntype,
  BaseRefRuntype,
  registerStringFormatter,
  registerNumberFormatter,
  buildParserFromRuntype,
  generateHashFromString,
  TypedArrayRuntype,
  MapRuntype,
  SetRuntype,
  NumberKeyRuntype,
} from "@beff/client/codegen-v2";

class RefRuntype extends BaseRefRuntype  {
  getNamedRuntypes() {
    return namedRuntypes;
  }
}

const buildParsers = (args) => {
  const stringFormats = args?.stringFormats ?? {};
  for (const k of RequiredStringFormats) {
    if (stringFormats[k] == null) {
      throw new Error(`Missing custom format ${k}`);
    }
  }
  Object.keys(stringFormats).forEach((k) => {
    const v = stringFormats[k];
    registerStringFormatter(k, v);
  });
  const numberFormats = args?.numberFormats ?? {};
  for (const k of RequiredNumberFormats) {
    if (numberFormats[k] == null) {
      throw new Error(`Missing custom format ${k}`);
    }
  }
  Object.keys(numberFormats).forEach((k) => {
    const v = numberFormats[k];
    registerNumberFormatter(k, v);
  });
  let acc = {};
  for (const k of Object.keys(buildParsersInput)) {
    const it = buildParserFromRuntype(buildParsersInput[k], k, false);
    acc[k] = it;
  }
  return acc;
};

const RequiredStringFormats = [];
const RequiredNumberFormats = [];
const direct_hoist_0 = new TypeofRuntype(undefined, "string");
const direct_hoist_1 = new RefRuntype(undefined, "AliasToString");
const direct_hoist_2 = new RefRuntype(undefined, "AliasToNumber");
const direct_hoist_3 = new RefRuntype(undefined, "AliasToBoolean");
const direct_hoist_4 = new RefRuntype(undefined, "AliasToNull");
const direct_hoist_5 = new RefRuntype(undefined, "AliasToAny");
const direct_hoist_6 = new RefRuntype(undefined, "AliasToConst");
const direct_hoist_7 = new RefRuntype(undefined, "TestHoist");
const direct_hoist_8 = new RefRuntype(undefined, "NestedOrder");
const direct_hoist_9 = new RefRuntype(undefined, "BeforeRequired");
const direct_hoist_10 = new RefRuntype(undefined, "AfterRequired");
const direct_hoist_11 = new RefRuntype(undefined, "R");
const direct_hoist_12 = new RefRuntype(undefined, "R2");
const direct_hoist_13 = new RefRuntype(undefined, "R3");
const direct_hoist_14 = new RefRuntype(undefined, "R4");
const direct_hoist_15 = new RefRuntype(undefined, "R5");
const direct_hoist_16 = new RefRuntype(undefined, "Meta");
const direct_hoist_17 = new RefRuntype(undefined, "Meta2");
const direct_hoist_18 = new RefRuntype(undefined, "KnownConstants");
const direct_hoist_19 = new RefRuntype(undefined, "NumberKeys");
const direct_hoist_20 = new RefRuntype(undefined, "NumberIndex");
const direct_hoist_21 = new RefRuntype(undefined, "NumberOrTemplateKeys");
const direct_hoist_22 = new RefRuntype(undefined, "DefaultTypeParams");
const direct_hoist_23 = new RefRuntype(undefined, "NumberLiteralKeys");
const direct_hoist_24 = new RefRuntype(undefined, "PartialNumberLiteralKeys");
const direct_hoist_25 = new RefRuntype(undefined, "MixedLiteralKeys");
const direct_hoist_26 = new NullishRuntype(undefined, "undefined");
const direct_hoist_27 = new AnyOfRuntype(undefined, [
    direct_hoist_26,
    direct_hoist_0
], {
    "nullish": direct_hoist_26,
    "string": direct_hoist_0
});
const direct_hoist_28 = new NullishRuntype(undefined, "void");
const direct_hoist_29 = new AnyOfRuntype(undefined, [
    direct_hoist_28,
    direct_hoist_0
], {
    "nullish": direct_hoist_28,
    "string": direct_hoist_0
});
const direct_hoist_30 = new NullishRuntype(undefined, "null");
const direct_hoist_31 = new AnyOfRuntype(undefined, [
    direct_hoist_30,
    direct_hoist_0
], {
    "nullish": direct_hoist_30,
    "string": direct_hoist_0
});
const direct_hoist_32 = new ObjectRuntype(undefined, {
    "a": direct_hoist_0,
    "b": direct_hoist_27,
    "c": direct_hoist_29,
    "d": direct_hoist_31,
    "e": direct_hoist_0
}, []);
const direct_hoist_33 = new AnyRuntype(undefined);
const direct_hoist_34 = new TypeofRuntype(undefined, "boolean");
const direct_hoist_35 = new ConstRuntype(undefined, "constant value");
const direct_hoist_36 = new TypeofRuntype(undefined, "number");
const direct_hoist_37 = new ObjectRuntype(undefined, {
    "a": direct_hoist_0,
    "b": direct_hoist_27,
    "c": direct_hoist_29,
    "d": direct_hoist_31,
    "e": new OptionalFieldRuntype(direct_hoist_0)
}, []);
const direct_hoist_38 = new ObjectRuntype(undefined, {
    "v": direct_hoist_0
}, []);
const direct_hoist_39 = new ObjectRuntype(undefined, {
    "v": direct_hoist_36
}, []);
const direct_hoist_40 = new ObjectRuntype(undefined, {
    "a": direct_hoist_36,
    "b": direct_hoist_0
}, []);
const direct_hoist_41 = new ArrayRuntype(undefined, direct_hoist_34);
const direct_hoist_42 = new ObjectRuntype(undefined, {
    "a": direct_hoist_34,
    "b": direct_hoist_41
}, []);
const direct_hoist_43 = new ArrayRuntype(undefined, direct_hoist_36);
const direct_hoist_44 = new ObjectRuntype(undefined, {
    "a": direct_hoist_36,
    "b": direct_hoist_43
}, []);
const direct_hoist_45 = new RefRuntype(undefined, "DefaultG");
const direct_hoist_46 = new RefRuntype(undefined, "DefaultG_number");
const direct_hoist_47 = new RefRuntype(undefined, "DefaultH_number");
const direct_hoist_48 = new RefRuntype(undefined, "DefaultI_boolean");
const direct_hoist_49 = new RefRuntype(undefined, "DefaultP_number");
const direct_hoist_50 = new ObjectRuntype(undefined, {
    "g": direct_hoist_45,
    "gn": direct_hoist_46,
    "h": direct_hoist_47,
    "i": direct_hoist_48,
    "p": direct_hoist_49
}, []);
const direct_hoist_51 = new AnyOfConstsRuntype(undefined, [
    "blue",
    "red"
]);
const direct_hoist_52 = new ArrayRuntype(undefined, direct_hoist_0);
const direct_hoist_53 = new ObjectRuntype(undefined, {
    "BAR_OPTION": direct_hoist_51,
    "BAZ_VALUES": direct_hoist_52,
    "FOO_VALUE": direct_hoist_0
}, []);
const direct_hoist_54 = new RegexRuntype(undefined, /^(alpha_entity_)([\s\S]*)$/, "`alpha_entity_${string}`");
const direct_hoist_55 = new RegexRuntype(undefined, /^(beta-entity-)([\s\S]*)$/, "`beta-entity-${string}`");
const direct_hoist_56 = new AnyOfRuntype(undefined, [
    direct_hoist_54,
    direct_hoist_55
]);
const direct_hoist_57 = new ObjectRuntype(undefined, {
    "alpha": new OptionalFieldRuntype(direct_hoist_0),
    "beta": new OptionalFieldRuntype(direct_hoist_0)
}, [
    {
        "key": direct_hoist_56,
        "value": new OptionalFieldRuntype(direct_hoist_0)
    }
]);
const direct_hoist_58 = new ObjectRuntype(undefined, {
    "alpha": direct_hoist_0,
    "beta": direct_hoist_0
}, [
    {
        "key": direct_hoist_56,
        "value": direct_hoist_0
    }
]);
const direct_hoist_59 = new ConstRuntype(undefined, "alpha");
const direct_hoist_60 = new ConstRuntype(undefined, "beta");
const direct_hoist_61 = new AnyOfRuntype(undefined, [
    direct_hoist_59,
    direct_hoist_54,
    direct_hoist_60,
    direct_hoist_55
]);
const direct_hoist_62 = new ObjectRuntype(undefined, {
    "1": direct_hoist_0,
    "a": direct_hoist_0
}, []);
const direct_hoist_63 = new ObjectRuntype(undefined, {
    "a": direct_hoist_36,
    "b": direct_hoist_36
}, []);
const direct_hoist_64 = new ObjectRuntype(undefined, {
    "label": direct_hoist_0,
    "outer": direct_hoist_63
}, []);
const direct_hoist_65 = new ObjectRuntype(undefined, {}, [
    {
        "key": new NumberKeyRuntype(undefined),
        "value": direct_hoist_34
    }
]);
const direct_hoist_66 = new ObjectRuntype(undefined, {}, [
    {
        "key": new NumberKeyRuntype(undefined),
        "value": direct_hoist_0
    }
]);
const direct_hoist_67 = new ObjectRuntype(undefined, {
    "1": direct_hoist_0,
    "2": direct_hoist_0
}, []);
const direct_hoist_68 = new RegexRuntype(undefined, /^(x_)([\s\S]*)$/, "`x_${string}`");
const direct_hoist_69 = new ObjectRuntype(undefined, {}, [
    {
        "key": new AnyOfRuntype(undefined, [
            new NumberKeyRuntype(undefined),
            direct_hoist_68
        ]),
        "value": direct_hoist_0
    }
]);
const direct_hoist_70 = new ObjectRuntype(undefined, {
    "1": new OptionalFieldRuntype(direct_hoist_0),
    "2": new OptionalFieldRuntype(direct_hoist_0)
}, []);
const direct_hoist_71 = new ObjectRuntype(undefined, {
    "a": direct_hoist_36,
    "b": direct_hoist_36
}, [
    {
        "key": direct_hoist_68,
        "value": direct_hoist_36
    }
]);
const direct_hoist_72 = new ObjectRuntype(undefined, {
    "a": new OptionalFieldRuntype(direct_hoist_36),
    "b": new OptionalFieldRuntype(direct_hoist_36)
}, []);
const direct_hoist_73 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_68,
        "value": direct_hoist_36
    }
]);
const direct_hoist_74 = new ObjectRuntype(undefined, {}, [
    {
        "key": direct_hoist_68,
        "value": new OptionalFieldRuntype(direct_hoist_36)
    }
]);
const direct_hoist_75 = new ObjectRuntype(undefined, {
    "a": direct_hoist_52,
    "b": direct_hoist_52
}, []);
const namedRuntypes = {
    "AfterRequired": direct_hoist_32,
    "AliasToAny": direct_hoist_33,
    "AliasToBoolean": direct_hoist_34,
    "AliasToConst": direct_hoist_35,
    "AliasToNull": direct_hoist_30,
    "AliasToNumber": direct_hoist_36,
    "AliasToString": direct_hoist_0,
    "BeforeRequired": direct_hoist_37,
    "DefaultG": direct_hoist_38,
    "DefaultG_number": direct_hoist_39,
    "DefaultH_number": direct_hoist_40,
    "DefaultI_boolean": direct_hoist_42,
    "DefaultP_number": direct_hoist_44,
    "DefaultTypeParams": direct_hoist_50,
    "KnownConstants": direct_hoist_53,
    "Meta": direct_hoist_57,
    "Meta2": direct_hoist_58,
    "MetaKey": direct_hoist_61,
    "MixedLiteralKeys": direct_hoist_62,
    "NestedOrder": direct_hoist_64,
    "NumberIndex": direct_hoist_65,
    "NumberKeys": direct_hoist_66,
    "NumberLiteralKeys": direct_hoist_67,
    "NumberOrTemplateKeys": direct_hoist_69,
    "PartialNumberLiteralKeys": direct_hoist_70,
    "R": direct_hoist_71,
    "R2": direct_hoist_63,
    "R3": direct_hoist_72,
    "R4": direct_hoist_73,
    "R5": direct_hoist_74,
    "TestHoist": direct_hoist_75
};
const buildParsersInput = {
    "Dec": direct_hoist_0,
    "AliasToString": direct_hoist_1,
    "AliasToNumber": direct_hoist_2,
    "AliasToBoolean": direct_hoist_3,
    "AliasToNull": direct_hoist_4,
    "AliasToAny": direct_hoist_5,
    "AliasToConst": direct_hoist_6,
    "TestHoist": direct_hoist_7,
    "NestedOrder": direct_hoist_8,
    "BeforeRequired": direct_hoist_9,
    "AfterRequired": direct_hoist_10,
    "R": direct_hoist_11,
    "R2": direct_hoist_12,
    "R3": direct_hoist_13,
    "R4": direct_hoist_14,
    "R5": direct_hoist_15,
    "Meta": direct_hoist_16,
    "Meta2": direct_hoist_17,
    "KnownConstants": direct_hoist_18,
    "NumberKeys": direct_hoist_19,
    "NumberIndex": direct_hoist_20,
    "NumberOrTemplateKeys": direct_hoist_21,
    "DefaultTypeParams": direct_hoist_22,
    "NumberLiteralKeys": direct_hoist_23,
    "PartialNumberLiteralKeys": direct_hoist_24,
    "MixedLiteralKeys": direct_hoist_25
};

export default { buildParsers };