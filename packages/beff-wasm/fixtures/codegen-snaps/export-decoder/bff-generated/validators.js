//@ts-nocheck
/* eslint-disable */




const customFormatters = {};

function registerCustomFormatter(name, validator) {
  customFormatters[name] = validator;
}

function pushPath(ctx, key) {
  ctx.path.push(key);
}
function popPath(ctx) {
  ctx.path.pop();
}
function buildError(ctx, message, received) {
  return [
    {
      message,
      path: [...ctx.path],
      received,
    },
  ];
}

function buildUnionError(ctx, errors, received) {
  return [
    {
      path: [...ctx.path],
      received,
      errors,
      isUnionError: true,
    },
  ];
}

function parseIdentity(ctx, input) {
  return input;
}

function validateString(ctx, input) {
  return typeof input === "string";
}

function reportString(ctx, input) {
  return buildError(ctx, "expected string", input);
}

function validateNumber(ctx, input) {
  return typeof input === "number";
}

function reportNumber(ctx, input) {
  return buildError(ctx, "expected number", input);
}

function validateBoolean(ctx, input) {
  return typeof input === "boolean";
}

function reportBoolean(ctx, input) {
  return buildError(ctx, "expected boolean", input);
}

function validateAny(ctx, input) {
  return true;
}

function reportAny(ctx, input) {
  return buildError(ctx, "expected any", input);
}

function validateNull(ctx, input) {
  if (input == null) {
    return true;
  }
  return false;
}

function reportNull(ctx, input) {
  return buildError(ctx, "expected nullish", input);
}

function validateNever(ctx, input) {
  return false;
}

function reportNever(ctx, input) {
  return buildError(ctx, "expected never", input);
}

function validateFunction(ctx, input) {
  return typeof input === "function";
}

function reportFunction(ctx, input) {
  return buildError(ctx, "expected function", input);
}

class ConstDecoder {
  constructor(value) {
    this.value = value;
  }

  validateConstDecoder(ctx, input) {
    return input === this.value;
  }

  parseConstDecoder(ctx, input) {
    return input;
  }

  reportConstDecoder(ctx, input) {
    return buildError(ctx, `expected ${this.value}`, input);
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
    return input;
  }

  reportRegexDecoder(ctx, input) {
    return buildError(ctx, `expected ${this.description}`, input);
  }
}

class CodecDecoder {
  constructor(codec) {
    this.codec = codec;
  }
  validateCodecDecoder(ctx, input) {
    switch (this.codec) {
      case "Codec::ISO8061": {
        return input instanceof Date;
      }
      case "Codec::BigInt": {
        return typeof input === "bigint";
      }
    }
    return false;
  }
  parseCodecDecoder(ctx, input) {
    return input;
  }

  reportCodecDecoder(ctx, input) {
    switch (this.codec) {
      case "Codec::ISO8061": {
        return buildError(ctx, `expected Date`, input);
      }
      case "Codec::BigInt": {
        return buildError(ctx, `expected BigInt`, input);
      }
    }

    return buildError(ctx, `expected ${this.codec}`, input);
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
    return input;
  }
  reportStringWithFormatDecoder(ctx, input) {
    return buildError(ctx, `expected string with format ${this.format}`, input);
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
class ObjectReporter {
  constructor(dataValidator, restValidator, dataReporter, restReporter) {
    this.dataValidator = dataValidator;
    this.restValidator = restValidator;
    this.dataReporter = dataReporter;
    this.restReporter = restReporter;
  }

  reportObjectReporter(ctx, input) {
    if (typeof input !== "object" || Array.isArray(input) || input === null) {
      return buildError(ctx, "expected object", input);
    }

    let acc = [];

    const configKeys = Object.keys(this.dataReporter);

    for (const k of configKeys) {
      const ok = this.dataValidator[k](ctx, input[k]);
      if (!ok) {
        pushPath(ctx, k);
        const v = this.dataReporter[k];
        const arr2 = v(ctx, input[k]);
        acc.push(...arr2);
        popPath(ctx);
      }
    }

    if (this.restReporter != null) {
      const inputKeys = Object.keys(input);
      const extraKeys = inputKeys.filter((k) => !configKeys.includes(k));
      for (const k of extraKeys) {
        const ok = this.restValidator(ctx, input[k]);
        if (!ok) {
          pushPath(ctx, k);
          const v = input[k];
          const arr2 = this.restReporter(ctx, v);
          acc.push(...arr2);
          popPath(ctx);
        }
      }
    }

    return acc;
  }
}
class ObjectParser {
  constructor(data, rest) {
    this.data = data;
    this.rest = rest;
  }

  parseObjectParser(ctx, input) {
    let acc = {};

    const inputKeys = Object.keys(input);
    for (const k of inputKeys) {
      const v = input[k];
      if (k in this.data) {
        const p = this.data[k];
        acc[k] = p(ctx, v);
      } else {
        if (this.rest != null) {
          acc[k] = this.rest(ctx, v);
        }
      }
    }

    return acc;
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

class ArrayReporter {
  constructor(innerValidator, innerReporter) {
    this.innerValidator = innerValidator;
    this.innerReporter = innerReporter;
  }

  reportArrayReporter(ctx, input) {
    if (!Array.isArray(input)) {
      return buildError(ctx, "expected array", input);
    }

    let acc = [];
    for (let i = 0; i < input.length; i++) {
      const ok = this.innerValidator(ctx, input[i]);
      if (!ok) {
        pushPath(ctx, `[${i}]`);
        const v = input[i];
        const arr2 = this.innerReporter(ctx, v);
        acc.push(...arr2);
        popPath(ctx);
      }
    }

    return acc;
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
  constructor(validators, parsers) {
    this.validators = validators;
    this.parsers = parsers;
  }
  parseAnyOfParser(ctx, input) {
    for (let i = 0; i < this.validators.length; i++) {
      if (this.validators[i](ctx, input)) {
        return this.parsers[i](ctx, input);
      }
    }
    throw new Error("No parsers matched");
  }
}
class AnyOfReporter {
  constructor(validators, reporters) {
    this.validators = validators;
    this.reporters = reporters;
  }
  reportAnyOfReporter(ctx, input) {
    const acc = [];
    for (const v of this.reporters) {
      const errors = v(ctx, input);
      acc.push(...errors);
    }
    return buildUnionError(ctx, acc, input);
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
  constructor(validators, parsers) {
    this.validators = validators;
    this.parsers = parsers;
  }
  parseAllOfParser(ctx, input) {
    let acc = {};

    for (let i = 0; i < this.validators.length; i++) {
      const p = this.parsers[i];
      const parsed = p(ctx, input);
      if (typeof parsed !== "object") {
        throw new Error("AllOfParser: Expected object");
      }
      acc = { ...acc, ...parsed };
    }
    return acc;
  }
}

class AllOfReporter {
  constructor(validators, reporters) {
    this.validators = validators;
    this.reporters = reporters;
  }
  reportAllOfReporter(ctx, input) {
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

class TupleReporter {
  constructor(prefixValidator, restValidator, prefixReporter, restReporter) {
    this.prefixValidator = prefixValidator;
    this.restValidator = restValidator;
    this.prefixReporter = prefixReporter;
    this.restReporter = restReporter;
  }
  reportTupleReporter(ctx, input) {
    let idx = 0;

    let acc = [];

    for (const prefixReporter of this.prefixReporter) {
      const ok = this.prefixValidator[idx](ctx, input[idx]);
      if (!ok) {
        pushPath(ctx, `[${idx}]`);
        const errors = prefixReporter(ctx, input[idx]);
        acc.push(...errors);
        popPath(ctx);
      }
      idx++;
    }

    const restReporter = this.restReporter;
    if (restReporter != null) {
      for (let i = idx; i < input.length; i++) {
        const ok = this.restValidator(ctx, input[i]);
        if (!ok) {
          pushPath(ctx, `[${i}]`);
          const errors = restReporter(ctx, input[i]);
          acc.push(...errors);
          popPath(ctx);
        }
      }
    }

    return acc;
  }
}


function ValidateUser(ctx, input) {
    return (hoisted_User_0.validateObjectValidator.bind(hoisted_User_0))(ctx, input);
}
function ParseUser(ctx, input) {
    return (hoisted_User_1.parseObjectParser.bind(hoisted_User_1))(ctx, input);
}
function ReportUser(ctx, input) {
    return (hoisted_User_2.reportObjectReporter.bind(hoisted_User_2))(ctx, input);
}
function ValidateNotPublic(ctx, input) {
    return (hoisted_NotPublic_0.validateObjectValidator.bind(hoisted_NotPublic_0))(ctx, input);
}
function ParseNotPublic(ctx, input) {
    return (hoisted_NotPublic_1.parseObjectParser.bind(hoisted_NotPublic_1))(ctx, input);
}
function ReportNotPublic(ctx, input) {
    return (hoisted_NotPublic_2.reportObjectReporter.bind(hoisted_NotPublic_2))(ctx, input);
}
function ValidateStartsWithA(ctx, input) {
    return (hoisted_StartsWithA_0.validateStringWithFormatDecoder.bind(hoisted_StartsWithA_0))(ctx, input);
}
function ParseStartsWithA(ctx, input) {
    return (hoisted_StartsWithA_0.parseStringWithFormatDecoder.bind(hoisted_StartsWithA_0))(ctx, input);
}
function ReportStartsWithA(ctx, input) {
    return (hoisted_StartsWithA_0.reportStringWithFormatDecoder.bind(hoisted_StartsWithA_0))(ctx, input);
}
function ValidatePassword(ctx, input) {
    return (hoisted_Password_0.validateStringWithFormatDecoder.bind(hoisted_Password_0))(ctx, input);
}
function ParsePassword(ctx, input) {
    return (hoisted_Password_0.parseStringWithFormatDecoder.bind(hoisted_Password_0))(ctx, input);
}
function ReportPassword(ctx, input) {
    return (hoisted_Password_0.reportStringWithFormatDecoder.bind(hoisted_Password_0))(ctx, input);
}
function ValidateA(ctx, input) {
    return (hoisted_A_2.validateAnyOfValidator.bind(hoisted_A_2))(ctx, input);
}
function ParseA(ctx, input) {
    return (hoisted_A_3.parseAnyOfParser.bind(hoisted_A_3))(ctx, input);
}
function ReportA(ctx, input) {
    return (hoisted_A_4.reportAnyOfReporter.bind(hoisted_A_4))(ctx, input);
}
function ValidateB(ctx, input) {
    return (hoisted_B_2.validateAnyOfValidator.bind(hoisted_B_2))(ctx, input);
}
function ParseB(ctx, input) {
    return (hoisted_B_3.parseAnyOfParser.bind(hoisted_B_3))(ctx, input);
}
function ReportB(ctx, input) {
    return (hoisted_B_4.reportAnyOfReporter.bind(hoisted_B_4))(ctx, input);
}
function ValidateD(ctx, input) {
    return (hoisted_D_2.validateAnyOfValidator.bind(hoisted_D_2))(ctx, input);
}
function ParseD(ctx, input) {
    return (hoisted_D_3.parseAnyOfParser.bind(hoisted_D_3))(ctx, input);
}
function ReportD(ctx, input) {
    return (hoisted_D_4.reportAnyOfReporter.bind(hoisted_D_4))(ctx, input);
}
function ValidateE(ctx, input) {
    return (hoisted_E_2.validateAnyOfValidator.bind(hoisted_E_2))(ctx, input);
}
function ParseE(ctx, input) {
    return (hoisted_E_3.parseAnyOfParser.bind(hoisted_E_3))(ctx, input);
}
function ReportE(ctx, input) {
    return (hoisted_E_4.reportAnyOfReporter.bind(hoisted_E_4))(ctx, input);
}
function ValidateUnionNested(ctx, input) {
    return (hoisted_UnionNested_0.validateAnyOfValidator.bind(hoisted_UnionNested_0))(ctx, input);
}
function ParseUnionNested(ctx, input) {
    return (hoisted_UnionNested_1.parseAnyOfParser.bind(hoisted_UnionNested_1))(ctx, input);
}
function ReportUnionNested(ctx, input) {
    return (hoisted_UnionNested_2.reportAnyOfReporter.bind(hoisted_UnionNested_2))(ctx, input);
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
const reporters = {
    User: ReportUser,
    NotPublic: ReportNotPublic,
    StartsWithA: ReportStartsWithA,
    Password: ReportPassword,
    A: ReportA,
    B: ReportB,
    D: ReportD,
    E: ReportE,
    UnionNested: ReportUnionNested
};
const hoisted_User_0 = new ObjectValidator({
    "age": validateNumber,
    "name": validateString
}, null);
const hoisted_User_1 = new ObjectParser({
    "age": parseIdentity,
    "name": parseIdentity
}, null);
const hoisted_User_2 = new ObjectReporter({
    "age": validateNumber,
    "name": validateString
}, null, {
    "age": reportNumber,
    "name": reportString
}, null);
const hoisted_NotPublic_0 = new ObjectValidator({
    "a": validateString
}, null);
const hoisted_NotPublic_1 = new ObjectParser({
    "a": parseIdentity
}, null);
const hoisted_NotPublic_2 = new ObjectReporter({
    "a": validateString
}, null, {
    "a": reportString
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
    hoisted_A_0.validateConstDecoder.bind(hoisted_A_0),
    hoisted_A_1.validateConstDecoder.bind(hoisted_A_1)
], [
    hoisted_A_0.parseConstDecoder.bind(hoisted_A_0),
    hoisted_A_1.parseConstDecoder.bind(hoisted_A_1)
]);
const hoisted_A_4 = new AnyOfReporter([
    hoisted_A_0.validateConstDecoder.bind(hoisted_A_0),
    hoisted_A_1.validateConstDecoder.bind(hoisted_A_1)
], [
    hoisted_A_0.reportConstDecoder.bind(hoisted_A_0),
    hoisted_A_1.reportConstDecoder.bind(hoisted_A_1)
]);
const hoisted_B_0 = new ConstDecoder(2);
const hoisted_B_1 = new ConstDecoder(3);
const hoisted_B_2 = new AnyOfValidator([
    hoisted_B_0.validateConstDecoder.bind(hoisted_B_0),
    hoisted_B_1.validateConstDecoder.bind(hoisted_B_1)
]);
const hoisted_B_3 = new AnyOfParser([
    hoisted_B_0.validateConstDecoder.bind(hoisted_B_0),
    hoisted_B_1.validateConstDecoder.bind(hoisted_B_1)
], [
    hoisted_B_0.parseConstDecoder.bind(hoisted_B_0),
    hoisted_B_1.parseConstDecoder.bind(hoisted_B_1)
]);
const hoisted_B_4 = new AnyOfReporter([
    hoisted_B_0.validateConstDecoder.bind(hoisted_B_0),
    hoisted_B_1.validateConstDecoder.bind(hoisted_B_1)
], [
    hoisted_B_0.reportConstDecoder.bind(hoisted_B_0),
    hoisted_B_1.reportConstDecoder.bind(hoisted_B_1)
]);
const hoisted_D_0 = new ConstDecoder(4);
const hoisted_D_1 = new ConstDecoder(5);
const hoisted_D_2 = new AnyOfValidator([
    hoisted_D_0.validateConstDecoder.bind(hoisted_D_0),
    hoisted_D_1.validateConstDecoder.bind(hoisted_D_1)
]);
const hoisted_D_3 = new AnyOfParser([
    hoisted_D_0.validateConstDecoder.bind(hoisted_D_0),
    hoisted_D_1.validateConstDecoder.bind(hoisted_D_1)
], [
    hoisted_D_0.parseConstDecoder.bind(hoisted_D_0),
    hoisted_D_1.parseConstDecoder.bind(hoisted_D_1)
]);
const hoisted_D_4 = new AnyOfReporter([
    hoisted_D_0.validateConstDecoder.bind(hoisted_D_0),
    hoisted_D_1.validateConstDecoder.bind(hoisted_D_1)
], [
    hoisted_D_0.reportConstDecoder.bind(hoisted_D_0),
    hoisted_D_1.reportConstDecoder.bind(hoisted_D_1)
]);
const hoisted_E_0 = new ConstDecoder(5);
const hoisted_E_1 = new ConstDecoder(6);
const hoisted_E_2 = new AnyOfValidator([
    hoisted_E_0.validateConstDecoder.bind(hoisted_E_0),
    hoisted_E_1.validateConstDecoder.bind(hoisted_E_1)
]);
const hoisted_E_3 = new AnyOfParser([
    hoisted_E_0.validateConstDecoder.bind(hoisted_E_0),
    hoisted_E_1.validateConstDecoder.bind(hoisted_E_1)
], [
    hoisted_E_0.parseConstDecoder.bind(hoisted_E_0),
    hoisted_E_1.parseConstDecoder.bind(hoisted_E_1)
]);
const hoisted_E_4 = new AnyOfReporter([
    hoisted_E_0.validateConstDecoder.bind(hoisted_E_0),
    hoisted_E_1.validateConstDecoder.bind(hoisted_E_1)
], [
    hoisted_E_0.reportConstDecoder.bind(hoisted_E_0),
    hoisted_E_1.reportConstDecoder.bind(hoisted_E_1)
]);
const hoisted_UnionNested_0 = new AnyOfValidator([
    validators.A,
    validators.B,
    validators.D,
    validators.E
]);
const hoisted_UnionNested_1 = new AnyOfParser([
    validators.A,
    validators.B,
    validators.D,
    validators.E
], [
    parsers.A,
    parsers.B,
    parsers.D,
    parsers.E
]);
const hoisted_UnionNested_2 = new AnyOfReporter([
    validators.A,
    validators.B,
    validators.D,
    validators.E
], [
    reporters.A,
    reporters.B,
    reporters.D,
    reporters.E
]);

export default { registerCustomFormatter, ObjectValidator, ObjectParser, ArrayParser, ArrayValidator, CodecDecoder, StringWithFormatDecoder, AnyOfValidator, AnyOfParser, AllOfValidator, AllOfParser, TupleParser, TupleValidator, RegexDecoder, ConstDecoder, AnyOfConstsDecoder, AnyOfDiscriminatedDecoder, validateString, validateNumber, validateFunction, validateBoolean, validateAny, validateNull, validateNever, parseIdentity, AnyOfReporter, AllOfReporter, reportString, reportNumber, reportNull, reportBoolean, reportAny, reportNever, reportFunction, ArrayReporter, ObjectReporter, TupleReporter, validators, parsers, reporters };