//@ts-nocheck
/* eslint-disable */




const customFormatters = {};

function registerCustomFormatter(name, validator) {
  customFormatters[name] = validator;
}

function decodeString(ctx, input) {
  return typeof input === "string";
}

function decodeNumber(ctx, input) {
  return typeof input === "number";
}

function decodeBoolean(ctx, input) {
  return typeof input === "boolean";
}
function decodeAny(ctx, input) {
  return true;
}
function decodeNull(ctx, input) {
  if (input == null) {
    return true;
  }
  return false;
}
function decodeNever(ctx, input) {
  return false;
}
function decodeFunction(ctx, input) {
  return typeof input === "function";
}

class ConstDecoder {
  constructor(value) {
    this.value = value;
  }

  decodeConstDecoder(ctx, input) {
    return input === this.value;
  }
}

class RegexDecoder {
  constructor(regex, description) {
    this.regex = regex;
    this.description = description;
  }

  decodeRegexDecoder(ctx, input) {
    if (typeof input === "string") {
      return this.regex.test(input);
    }
    return false;
  }
}

class ObjectDecoder {
  constructor(data, additionalPropsValidator = null) {
    this.data = data;
    this.additionalPropsValidator = additionalPropsValidator;
  }

  decodeObjectDecoder(ctx, input) {
    if (typeof input === "object" && !Array.isArray(input) && input !== null) {
      const configKeys = Object.keys(this.data);
      for (const k of configKeys) {
        const v = this.data[k];
        if (!v(ctx, input[k])) {
          return false;
        }
      }

      if (this.additionalPropsValidator != null) {
        const inputKeys = Object.keys(input);
        const extraKeys = inputKeys.filter((k) => !configKeys.includes(k));
        for (const k of extraKeys) {
          const v = input[k];
          if (!this.additionalPropsValidator(ctx, v)) {
            return false;
          }
        }
      }

      return true;
    }
    return false;
  }
}

class ArrayDecoder {
  constructor(data) {
    this.data = data;
  }

  decodeArrayDecoder(ctx, input) {
    if (Array.isArray(input)) {
      for (let i = 0; i < input.length; i++) {
        const v = input[i];
        const ok = this.data(ctx, v);
        if (!ok) {
          return false;
        }
      }
    }
    return true;
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
        return !isNaN(d.getTime());
      }
      case "Codec::BigInt": {
        if (typeof input === "bigint") {
          return true;
        }
        if (typeof input === "number") {
          return true;
        }
        if (typeof input === "string") {
          try {
            return true;
          } catch (e) {
            
          }
        }
        return false;
      }
    }
    return false;
  }
}

class StringWithFormatDecoder {
  constructor(format) {
    this.format = format;
  }

  decodeStringWithFormatDecoder(ctx, input) {
    if (typeof input !== "string") {
      return false;
    }

    const validator = customFormatters[this.format];

    if (validator == null) {
      return false;
    }

    return validator(input);
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
      return false;
    }
    const v = this.mapping[d];
    if (v == null) {
      
      return false;
    }
    if (!v(ctx, input)) {
      return false;
    }
    return true;
  }
}

class AnyOfConstsDecoder {
  constructor(consts) {
    this.consts = consts;
  }
  decodeAnyOfConstsDecoder(ctx, input) {
    if (input == null) {
      if (this.consts.includes(null) || this.consts.includes(undefined)) {
        return true;
      }
    }
    return this.consts.includes(input);
  }
}

class AnyOfDecoder {
  constructor(vs) {
    this.vs = vs;
  }
  decodeAnyOfDecoder(ctx, input) {
    for (const v of this.vs) {
      if (v(ctx, input)) {
        return true;
      }
    }
    return false;
  }
}
class AllOfDecoder {
  constructor(vs) {
    this.vs = vs;
  }
  decodeAllOfDecoder(ctx, input) {
    for (const v of this.vs) {
      if (!v(ctx, input)) {
        return false;
      }
    }
    return true;
  }
}
class TupleDecoder {
  constructor(vs) {
    this.vs = vs;
  }
  decodeTupleDecoder(ctx, input) {
    if (Array.isArray(input)) {
      let idx = 0;
      for (const prefixVal of this.vs.prefix) {
        if (!prefixVal(ctx, input[idx])) {
          return false;
        }
        idx++;
      }
      const itemVal = this.vs.items;
      if (itemVal != null) {
        for (let i = idx; i < input.length; i++) {
          if (!itemVal(ctx, input[i])) {
            return false;
          }
        }
      } else {
        if (input.length > idx) {
          return false;
        }
      }
      return true;
    }
    return false;
  }
}


function DecodeUser(ctx, input) {
    return (hoisted_User_0.decodeObjectDecoder.bind(hoisted_User_0))(ctx, input);
}
function DecodeNotPublic(ctx, input) {
    return (hoisted_NotPublic_1.decodeObjectDecoder.bind(hoisted_NotPublic_1))(ctx, input);
}
function DecodeStartsWithA(ctx, input) {
    return (hoisted_StartsWithA_2.decodeStringWithFormatDecoder.bind(hoisted_StartsWithA_2))(ctx, input);
}
function DecodePassword(ctx, input) {
    return (hoisted_Password_3.decodeStringWithFormatDecoder.bind(hoisted_Password_3))(ctx, input);
}
function DecodeA(ctx, input) {
    return (hoisted_A_4.decodeAnyOfConstsDecoder.bind(hoisted_A_4))(ctx, input);
}
function DecodeB(ctx, input) {
    return (hoisted_B_5.decodeAnyOfConstsDecoder.bind(hoisted_B_5))(ctx, input);
}
function DecodeD(ctx, input) {
    return (hoisted_D_6.decodeAnyOfConstsDecoder.bind(hoisted_D_6))(ctx, input);
}
function DecodeE(ctx, input) {
    return (hoisted_E_7.decodeAnyOfConstsDecoder.bind(hoisted_E_7))(ctx, input);
}
function DecodeUnionNested(ctx, input) {
    return (hoisted_UnionNested_8.decodeAnyOfConstsDecoder.bind(hoisted_UnionNested_8))(ctx, input);
}
const validators = {
    User: DecodeUser,
    NotPublic: DecodeNotPublic,
    StartsWithA: DecodeStartsWithA,
    Password: DecodePassword,
    A: DecodeA,
    B: DecodeB,
    D: DecodeD,
    E: DecodeE,
    UnionNested: DecodeUnionNested
};
const hoisted_User_0 = new ObjectDecoder({
    "age": decodeNumber,
    "name": decodeString
});
const hoisted_NotPublic_1 = new ObjectDecoder({
    "a": decodeString
});
const hoisted_StartsWithA_2 = new StringWithFormatDecoder("StartsWithA");
const hoisted_Password_3 = new StringWithFormatDecoder("password");
const hoisted_A_4 = new AnyOfConstsDecoder([
    1,
    2
]);
const hoisted_B_5 = new AnyOfConstsDecoder([
    2,
    3
]);
const hoisted_D_6 = new AnyOfConstsDecoder([
    4,
    5
]);
const hoisted_E_7 = new AnyOfConstsDecoder([
    5,
    6
]);
const hoisted_UnionNested_8 = new AnyOfConstsDecoder([
    1,
    2,
    3,
    4,
    5,
    6
]);

export default { ObjectDecoder, ArrayDecoder, decodeString, decodeNumber, CodecDecoder, decodeFunction, StringWithFormatDecoder, AnyOfDecoder, AllOfDecoder, decodeBoolean, decodeAny, TupleDecoder, decodeNull, decodeNever, RegexDecoder, ConstDecoder, registerCustomFormatter, AnyOfConstsDecoder, AnyOfDiscriminatedDecoder, validators };