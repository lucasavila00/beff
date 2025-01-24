//@ts-nocheck
/* eslint-disable */




const customFormatters = {};

function registerCustomFormatter(name, validator) {
  customFormatters[name] = validator;
}

function validateString(ctx, input) {
  return typeof input === "string";
}

function validateNumber(ctx, input) {
  return typeof input === "number";
}

function validateBoolean(ctx, input) {
  return typeof input === "boolean";
}
function validateAny(ctx, input) {
  return true;
}
function validateNull(ctx, input) {
  if (input == null) {
    return true;
  }
  return false;
}
function validateNever(ctx, input) {
  return false;
}
function validateFunction(ctx, input) {
  return typeof input === "function";
}

class ConstDecoder {
  constructor(value) {
    this.value = value;
  }

  validateConstDecoder(ctx, input) {
    return input === this.value;
  }
}

class RegexDecoder {
  constructor(regex, description) {
    this.regex = regex;
    this.description = description;
  }

  validateRegexDecoder(ctx, input) {
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

  validateObjectDecoder(ctx, input) {
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

  validateArrayDecoder(ctx, input) {
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
  validateCodecDecoder(ctx, input) {
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

  validateStringWithFormatDecoder(ctx, input) {
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

  validateAnyOfDiscriminatedDecoder(ctx, input) {
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
  validateAnyOfConstsDecoder(ctx, input) {
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
  validateAnyOfDecoder(ctx, input) {
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
  validateAllOfDecoder(ctx, input) {
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
  validateTupleDecoder(ctx, input) {
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


function ValidateUser(ctx, input) {
    return (hoisted_User_0.validateObjectDecoder.bind(hoisted_User_0))(ctx, input);
}
function ValidateNotPublic(ctx, input) {
    return (hoisted_NotPublic_0.validateObjectDecoder.bind(hoisted_NotPublic_0))(ctx, input);
}
function ValidateStartsWithA(ctx, input) {
    return (hoisted_StartsWithA_0.validateStringWithFormatDecoder.bind(hoisted_StartsWithA_0))(ctx, input);
}
function ValidatePassword(ctx, input) {
    return (hoisted_Password_0.validateStringWithFormatDecoder.bind(hoisted_Password_0))(ctx, input);
}
function ValidateA(ctx, input) {
    return (hoisted_A_0.validateAnyOfConstsDecoder.bind(hoisted_A_0))(ctx, input);
}
function ValidateB(ctx, input) {
    return (hoisted_B_0.validateAnyOfConstsDecoder.bind(hoisted_B_0))(ctx, input);
}
function ValidateD(ctx, input) {
    return (hoisted_D_0.validateAnyOfConstsDecoder.bind(hoisted_D_0))(ctx, input);
}
function ValidateE(ctx, input) {
    return (hoisted_E_0.validateAnyOfConstsDecoder.bind(hoisted_E_0))(ctx, input);
}
function ValidateUnionNested(ctx, input) {
    return (hoisted_UnionNested_0.validateAnyOfConstsDecoder.bind(hoisted_UnionNested_0))(ctx, input);
}
const validators = {
    User: ValidateUser,
    NotPublic: ValidateNotPublic,
    StartsWithA: ValidateStartsWithA,
    Password: ValidatePassword,
    A: ValidateA,
    B: ValidateB,
    D: ValidateD,
    E: ValidateE,
    UnionNested: ValidateUnionNested
};
const hoisted_User_0 = new ObjectDecoder({
    "age": validateNumber,
    "name": validateString
});
const hoisted_NotPublic_0 = new ObjectDecoder({
    "a": validateString
});
const hoisted_StartsWithA_0 = new StringWithFormatDecoder("StartsWithA");
const hoisted_Password_0 = new StringWithFormatDecoder("password");
const hoisted_A_0 = new AnyOfConstsDecoder([
    1,
    2
]);
const hoisted_B_0 = new AnyOfConstsDecoder([
    2,
    3
]);
const hoisted_D_0 = new AnyOfConstsDecoder([
    4,
    5
]);
const hoisted_E_0 = new AnyOfConstsDecoder([
    5,
    6
]);
const hoisted_UnionNested_0 = new AnyOfConstsDecoder([
    1,
    2,
    3,
    4,
    5,
    6
]);

export default { registerCustomFormatter, ObjectDecoder, ArrayDecoder, CodecDecoder, StringWithFormatDecoder, AnyOfDecoder, AllOfDecoder, TupleDecoder, RegexDecoder, ConstDecoder, AnyOfConstsDecoder, AnyOfDiscriminatedDecoder, validateString, validateNumber, validateFunction, validateBoolean, validateAny, validateNull, validateNever, validators };