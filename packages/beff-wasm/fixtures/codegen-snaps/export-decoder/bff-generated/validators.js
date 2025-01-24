//@ts-nocheck
/* eslint-disable */




const customFormatters = {};

function registerCustomFormatter(name, validator) {
  customFormatters[name] = validator;
}

function parseIdentity(ctx, input) {
  return input;
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

  parseConstDecoder(ctx, input) {
    throw new Error("Not implemented");
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

  parseRegexDecoder(ctx, input) {
    throw new Error("Not implemented");
  }
}

class ObjectValidator {
  constructor(data, rest) {
    this.data = data;
    this.rest = rest;
  }

  validateObjectValidator(ctx, input) {
    if (typeof input === "object" && !Array.isArray(input) && input !== null) {
      const configKeys = Object.keys(this.data);
      for (const k of configKeys) {
        const v = this.data[k];
        if (!v(ctx, input[k])) {
          return false;
        }
      }

      if (this.rest != null) {
        const inputKeys = Object.keys(input);
        const extraKeys = inputKeys.filter((k) => !configKeys.includes(k));
        for (const k of extraKeys) {
          const v = input[k];
          if (!this.rest(ctx, v)) {
            return false;
          }
        }
      }

      return true;
    }
    return false;
  }
}

class ObjectParser {
  constructor(data, rest) {
    this.data = data;
    this.rest = rest;
  }

  parseObjectParser(ctx, input) {
    throw new Error("Not implemented");
  }
}

class ArrayParser {
  constructor(innerParser) {
    this.innerParser = innerParser;
  }

  parseArrayParser(ctx, input) {
    return input.map((v) => this.innerParser(ctx, v));
  }
}

class ArrayValidator {
  constructor(innerValidator) {
    this.innerValidator = innerValidator;
  }

  validateArrayValidator(ctx, input) {
    if (Array.isArray(input)) {
      for (let i = 0; i < input.length; i++) {
        const v = input[i];
        const ok = this.innerValidator(ctx, v);
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
  parseCodecDecoder(ctx, input) {
    throw new Error("Not implemented");
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
  parseStringWithFormatDecoder(ctx, input) {
    throw new Error("Not implemented");
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

class AnyOfValidator {
  constructor(vs) {
    this.vs = vs;
  }
  validateAnyOfValidator(ctx, input) {
    for (const v of this.vs) {
      if (v(ctx, input)) {
        return true;
      }
    }
    return false;
  }
}
class AnyOfParser {
  constructor(vs) {
    this.vs = vs;
  }
  parseAnyOfParser(ctx, input) {
    throw new Error("Not implemented");
  }
}
class AllOfValidator {
  constructor(vs) {
    this.vs = vs;
  }
  validateAllOfValidator(ctx, input) {
    for (const v of this.vs) {
      if (!v(ctx, input)) {
        return false;
      }
    }
    return true;
  }
}

class AllOfParser {
  constructor(vs) {
    this.vs = vs;
  }
  parseAllOfParser(ctx, input) {
    throw new Error("Not implemented");
  }
}
class TupleValidator {
  constructor(prefix, rest) {
    this.prefix = prefix;
    this.rest = rest;
  }
  validateTupleValidator(ctx, input) {
    if (Array.isArray(input)) {
      let idx = 0;
      for (const prefixVal of this.prefix) {
        if (!prefixVal(ctx, input[idx])) {
          return false;
        }
        idx++;
      }
      const itemVal = this.rest;
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

class TupleParser {
  constructor(prefix, rest) {
    this.prefix = prefix;
    this.rest = rest;
  }
  parseTupleParser(ctx, input) {
    throw new Error("Not implemented");
  }
}


function ValidateUser(ctx, input) {
    return (hoisted_User_0.validateObjectValidator.bind(hoisted_User_0))(ctx, input);
}
function ParseUser(ctx, input) {
    return (hoisted_User_1.parseObjectParser.bind(hoisted_User_1))(ctx, input);
}
function ValidateNotPublic(ctx, input) {
    return (hoisted_NotPublic_0.validateObjectValidator.bind(hoisted_NotPublic_0))(ctx, input);
}
function ParseNotPublic(ctx, input) {
    return (hoisted_NotPublic_1.parseObjectParser.bind(hoisted_NotPublic_1))(ctx, input);
}
function ValidateStartsWithA(ctx, input) {
    return (hoisted_StartsWithA_0.validateStringWithFormatDecoder.bind(hoisted_StartsWithA_0))(ctx, input);
}
function ParseStartsWithA(ctx, input) {
    return (hoisted_StartsWithA_0.parseStringWithFormatDecoder.bind(hoisted_StartsWithA_0))(ctx, input);
}
function ValidatePassword(ctx, input) {
    return (hoisted_Password_0.validateStringWithFormatDecoder.bind(hoisted_Password_0))(ctx, input);
}
function ParsePassword(ctx, input) {
    return (hoisted_Password_0.parseStringWithFormatDecoder.bind(hoisted_Password_0))(ctx, input);
}
function ValidateA(ctx, input) {
    return (hoisted_A_2.validateAnyOfValidator.bind(hoisted_A_2))(ctx, input);
}
function ParseA(ctx, input) {
    return (hoisted_A_3.parseAnyOfParser.bind(hoisted_A_3))(ctx, input);
}
function ValidateB(ctx, input) {
    return (hoisted_B_2.validateAnyOfValidator.bind(hoisted_B_2))(ctx, input);
}
function ParseB(ctx, input) {
    return (hoisted_B_3.parseAnyOfParser.bind(hoisted_B_3))(ctx, input);
}
function ValidateD(ctx, input) {
    return (hoisted_D_2.validateAnyOfValidator.bind(hoisted_D_2))(ctx, input);
}
function ParseD(ctx, input) {
    return (hoisted_D_3.parseAnyOfParser.bind(hoisted_D_3))(ctx, input);
}
function ValidateE(ctx, input) {
    return (hoisted_E_2.validateAnyOfValidator.bind(hoisted_E_2))(ctx, input);
}
function ParseE(ctx, input) {
    return (hoisted_E_3.parseAnyOfParser.bind(hoisted_E_3))(ctx, input);
}
function ValidateUnionNested(ctx, input) {
    return (hoisted_UnionNested_0.validateAnyOfValidator.bind(hoisted_UnionNested_0))(ctx, input);
}
function ParseUnionNested(ctx, input) {
    return (hoisted_UnionNested_1.parseAnyOfParser.bind(hoisted_UnionNested_1))(ctx, input);
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
const parsers = {
    User: ParseUser,
    NotPublic: ParseNotPublic,
    StartsWithA: ParseStartsWithA,
    Password: ParsePassword,
    A: ParseA,
    B: ParseB,
    D: ParseD,
    E: ParseE,
    UnionNested: ParseUnionNested
};
const hoisted_User_0 = new ObjectValidator({
    "age": validateNumber,
    "name": validateString
}, null);
const hoisted_User_1 = new ObjectParser({
    "age": parseIdentity,
    "name": parseIdentity
}, null);
const hoisted_NotPublic_0 = new ObjectValidator({
    "a": validateString
}, null);
const hoisted_NotPublic_1 = new ObjectParser({
    "a": parseIdentity
}, null);
const hoisted_StartsWithA_0 = new StringWithFormatDecoder("StartsWithA");
const hoisted_Password_0 = new StringWithFormatDecoder("password");
const hoisted_A_0 = new ConstDecoder(1);
const hoisted_A_1 = new ConstDecoder(2);
const hoisted_A_2 = new AnyOfValidator([
    hoisted_A_0.validateConstDecoder.bind(hoisted_A_0),
    hoisted_A_1.validateConstDecoder.bind(hoisted_A_1)
]);
const hoisted_A_3 = new AnyOfParser([
    hoisted_A_0.parseConstDecoder.bind(hoisted_A_0),
    hoisted_A_1.parseConstDecoder.bind(hoisted_A_1)
]);
const hoisted_B_0 = new ConstDecoder(2);
const hoisted_B_1 = new ConstDecoder(3);
const hoisted_B_2 = new AnyOfValidator([
    hoisted_B_0.validateConstDecoder.bind(hoisted_B_0),
    hoisted_B_1.validateConstDecoder.bind(hoisted_B_1)
]);
const hoisted_B_3 = new AnyOfParser([
    hoisted_B_0.parseConstDecoder.bind(hoisted_B_0),
    hoisted_B_1.parseConstDecoder.bind(hoisted_B_1)
]);
const hoisted_D_0 = new ConstDecoder(4);
const hoisted_D_1 = new ConstDecoder(5);
const hoisted_D_2 = new AnyOfValidator([
    hoisted_D_0.validateConstDecoder.bind(hoisted_D_0),
    hoisted_D_1.validateConstDecoder.bind(hoisted_D_1)
]);
const hoisted_D_3 = new AnyOfParser([
    hoisted_D_0.parseConstDecoder.bind(hoisted_D_0),
    hoisted_D_1.parseConstDecoder.bind(hoisted_D_1)
]);
const hoisted_E_0 = new ConstDecoder(5);
const hoisted_E_1 = new ConstDecoder(6);
const hoisted_E_2 = new AnyOfValidator([
    hoisted_E_0.validateConstDecoder.bind(hoisted_E_0),
    hoisted_E_1.validateConstDecoder.bind(hoisted_E_1)
]);
const hoisted_E_3 = new AnyOfParser([
    hoisted_E_0.parseConstDecoder.bind(hoisted_E_0),
    hoisted_E_1.parseConstDecoder.bind(hoisted_E_1)
]);
const hoisted_UnionNested_0 = new AnyOfValidator([
    validators.A,
    validators.B,
    validators.D,
    validators.E
]);
const hoisted_UnionNested_1 = new AnyOfParser([
    parsers.A,
    parsers.B,
    parsers.D,
    parsers.E
]);

export default { registerCustomFormatter, ObjectValidator, ObjectParser, ArrayParser, ArrayValidator, CodecDecoder, StringWithFormatDecoder, AnyOfValidator, AnyOfParser, AllOfValidator, AllOfParser, TupleParser, TupleValidator, RegexDecoder, ConstDecoder, AnyOfConstsDecoder, AnyOfDiscriminatedDecoder, validateString, validateNumber, validateFunction, validateBoolean, validateAny, validateNull, validateNever, parseIdentity, validators, parsers };