/* eslint-disable */
//@ts-check

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
  constructor(data, rest) {
    this.data = data;
    this.rest = rest;
  }

  reportObjectReporter(ctx, input) {
    if (typeof input !== "object" || Array.isArray(input) || input === null) {
      return buildError(ctx, "expected object", input);
    }

    let acc = [];

    const configKeys = Object.keys(this.data);

    for (const k of configKeys) {
      pushPath(ctx, k);
      const v = this.data[k];
      const arr2 = v(ctx, input[k]);
      acc.push(...arr2);
      popPath(ctx);
    }

    if (this.rest != null) {
      const inputKeys = Object.keys(input);
      const extraKeys = inputKeys.filter((k) => !configKeys.includes(k));
      for (const k of extraKeys) {
        pushPath(ctx, k);
        const v = input[k];
        const arr2 = this.rest(ctx, v);
        acc.push(...arr2);
        popPath(ctx);
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
  constructor(innerReporter) {
    this.innerReporter = innerReporter;
  }

  reportArrayReporter(ctx, input) {
    if (!Array.isArray(input)) {
      return buildError(ctx, "expected array", input);
    }

    let acc = [];
    for (let i = 0; i < input.length; i++) {
      pushPath(ctx, `[${i}]`);
      const v = input[i];
      const arr2 = this.innerReporter(ctx, v);
      acc.push(...arr2);
      popPath(ctx);
    }

    return acc;
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
      // not one of the known discriminators
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
  constructor(vs) {
    this.vs = vs;
  }
  reportAnyOfReporter(ctx, input) {
    const acc = [];
    for (const v of this.vs) {
      const errors = v(ctx, input);
      acc.push(...errors);
    }
    return acc;
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
  constructor(vs) {
    this.vs = vs;
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
  constructor(prefix, rest) {
    this.prefix = prefix;
    this.rest = rest;
  }
  reportTupleReporter(ctx, input) {
    let idx = 0;

    let acc = [];

    for (const prefixVal of this.prefix) {
      pushPath(ctx, `[${idx}]`);
      const errors = prefixVal(ctx, input[idx]);
      acc.push(...errors);
      popPath(ctx);
      idx++;
    }

    const itemVal = this.rest;
    if (itemVal != null) {
      for (let i = idx; i < input.length; i++) {
        pushPath(ctx, `[${i}]`);
        const errors = itemVal(ctx, input[i]);
        acc.push(...errors);
        popPath(ctx);
      }
    }

    return acc;
  }
}
