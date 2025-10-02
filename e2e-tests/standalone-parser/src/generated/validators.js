//@ts-nocheck
/* eslint-disable */








const JSON_PROTO = Object.getPrototypeOf({});

function deepmergeConstructor(options) {
  function isNotPrototypeKey(value) {
    return value !== "constructor" && value !== "prototype" && value !== "__proto__";
  }

  function cloneArray(value) {
    let i = 0;
    const il = value.length;
    const result = new Array(il);
    for (i; i < il; ++i) {
      result[i] = clone(value[i]);
    }
    return result;
  }

  function cloneObject(target) {
    const result = {};

    if (cloneProtoObject && Object.getPrototypeOf(target) !== JSON_PROTO) {
      return cloneProtoObject(target);
    }

    const targetKeys = getKeys(target);
    let i, il, key;
    for (i = 0, il = targetKeys.length; i < il; ++i) {
      isNotPrototypeKey((key = targetKeys[i])) && (result[key] = clone(target[key]));
    }
    return result;
  }

  function concatArrays(target, source) {
    const tl = target.length;
    const sl = source.length;
    let i = 0;
    const result = new Array(tl + sl);
    for (i; i < tl; ++i) {
      result[i] = clone(target[i]);
    }
    for (i = 0; i < sl; ++i) {
      result[i + tl] = clone(source[i]);
    }
    return result;
  }

  const propertyIsEnumerable = Object.prototype.propertyIsEnumerable;
  function getSymbolsAndKeys(value) {
    const result = Object.keys(value);
    const keys = Object.getOwnPropertySymbols(value);
    for (let i = 0, il = keys.length; i < il; ++i) {
      
      propertyIsEnumerable.call(value, keys[i]) && result.push(keys[i]);
    }
    return result;
  }

  const getKeys = options?.symbols ? getSymbolsAndKeys : Object.keys;

  const cloneProtoObject =
    typeof options?.cloneProtoObject === "function" ? options.cloneProtoObject : undefined;

  function isMergeableObject(value) {
    return (
      typeof value === "object" && value !== null && !(value instanceof RegExp) && !(value instanceof Date)
    );
  }

  function isPrimitive(value) {
    return typeof value !== "object" || value === null;
  }

  const isPrimitiveOrBuiltIn =
    
    typeof Buffer !== "undefined"
      ? (value) =>
          typeof value !== "object" ||
          value === null ||
          value instanceof RegExp ||
          value instanceof Date ||
          
          value instanceof Buffer
      : (value) =>
          typeof value !== "object" || value === null || value instanceof RegExp || value instanceof Date;

  const mergeArray =
    options && typeof options.mergeArray === "function"
      ? options.mergeArray({ clone, deepmerge: _deepmerge, getKeys, isMergeableObject })
      : concatArrays;

  function clone(entry) {
    return isMergeableObject(entry) ? (Array.isArray(entry) ? cloneArray(entry) : cloneObject(entry)) : entry;
  }

  function mergeObject(target, source) {
    const result = {};
    const targetKeys = getKeys(target);
    const sourceKeys = getKeys(source);
    let i, il, key;
    for (i = 0, il = targetKeys.length; i < il; ++i) {
      isNotPrototypeKey((key = targetKeys[i])) &&
        sourceKeys.indexOf(key) === -1 &&
        (result[key] = clone(target[key]));
    }

    for (i = 0, il = sourceKeys.length; i < il; ++i) {
      if (!isNotPrototypeKey((key = sourceKeys[i]))) {
        continue;
      }

      if (key in target) {
        if (targetKeys.indexOf(key) !== -1) {
          if (
            cloneProtoObject &&
            isMergeableObject(source[key]) &&
            Object.getPrototypeOf(source[key]) !== JSON_PROTO
          ) {
            result[key] = cloneProtoObject(source[key]);
          } else {
            result[key] = _deepmerge(target[key], source[key]);
          }
        }
      } else {
        result[key] = clone(source[key]);
      }
    }
    return result;
  }

  function _deepmerge(target, source) {
    const sourceIsArray = Array.isArray(source);
    const targetIsArray = Array.isArray(target);

    if (isPrimitive(source)) {
      return source;
    } else if (isPrimitiveOrBuiltIn(target)) {
      return clone(source);
    } else if (sourceIsArray && targetIsArray) {
      return mergeArray(target, source);
    } else if (sourceIsArray !== targetIsArray) {
      return clone(source);
    } else {
      return mergeObject(target, source);
    }
  }

  function _deepmergeAll() {
    switch (arguments.length) {
      case 0:
        return {};
      case 1:
        return clone(arguments[0]);
      case 2:
        return _deepmerge(arguments[0], arguments[1]);
    }
    let result;
    for (let i = 0, il = arguments.length; i < il; ++i) {
      result = _deepmerge(result, arguments[i]);
    }
    return result;
  }

  return options?.all ? _deepmergeAll : _deepmerge;
}

function deepmergeArray(options) {
  const deepmerge = options.deepmerge;
  const clone = options.clone;
  return function (target, source) {
    let i = 0;
    const tl = target.length;
    const sl = source.length;
    const il = Math.max(target.length, source.length);
    const result = new Array(il);
    for (i = 0; i < il; ++i) {
      if (i < sl) {
        result[i] = deepmerge(target[i], source[i]);
      } else {
        result[i] = clone(target[i]);
      }
    }
    return result;
  };
}

const deepmerge = deepmergeConstructor({ all: true, mergeArray: deepmergeArray });

const stringFormatters = {};

function registerStringFormatter(name, validator) {
  stringFormatters[name] = validator;
}

const numberFormatters = {};

function registerNumberFormatter(name, validator) {
  numberFormatters[name] = validator;
}

function pushPath(ctx, key) {
  ctx.path.push(key);
}
function popPath(ctx) {
  ctx.path.pop();
}
function printPath(ctx) {
  return ctx.path.join(".");
}
function buildSchemaErrorMessage(ctx, message) {
  return `Failed to print schema. At ${printPath(ctx)}: ${message}`;
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
      message: "expected one of",
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

function schemaString(ctx) {
  return {
    type: "string",
  };
}

function validateNumber(ctx, input) {
  return typeof input === "number";
}

function reportNumber(ctx, input) {
  return buildError(ctx, "expected number", input);
}

function schemaNumber(ctx) {
  return {
    type: "number",
  };
}

function validateBoolean(ctx, input) {
  return typeof input === "boolean";
}

function reportBoolean(ctx, input) {
  return buildError(ctx, "expected boolean", input);
}

function schemaBoolean(ctx) {
  return {
    type: "boolean",
  };
}

function validateAny(ctx, input) {
  return true;
}

function reportAny(ctx, input) {
  return buildError(ctx, "expected any", input);
}

function schemaAny(ctx) {
  return {};
}

function validateNull(ctx, input) {
  if (input == null) {
    return true;
  }
  return false;
}

function reportNull(ctx, input) {
  return buildError(ctx, "expected nullish value", input);
}

function schemaNull(ctx) {
  return {
    type: "null",
  };
}

function validateNever(ctx, input) {
  return false;
}

function reportNever(ctx, input) {
  return buildError(ctx, "expected never", input);
}

function schemaNever(ctx) {
  return {
    anyOf: [],
  };
}

function validateFunction(ctx, input) {
  return typeof input === "function";
}

function reportFunction(ctx, input) {
  return buildError(ctx, "expected function", input);
}

function schemaFunction(ctx) {
  throw new Error(buildSchemaErrorMessage(ctx, "Cannot generate JSON Schema for function"));
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
    return buildError(ctx, `expected ${JSON.stringify(this.value)}`, input);
  }

  schemaConstDecoder(ctx) {
    return {
      const: this.value,
    };
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
    return buildError(ctx, `expected string matching ${this.description}`, input);
  }

  schemaRegexDecoder(ctx) {
    return {
      type: "string",
      pattern: this.description,
    };
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

  schemaCodecDecoder(ctx) {
    switch (this.codec) {
      case "Codec::ISO8061": {
        throw new Error(buildSchemaErrorMessage(ctx, "Cannot generate JSON Schema for Date"));
      }
      case "Codec::BigInt": {
        throw new Error(buildSchemaErrorMessage(ctx, "Cannot generate JSON Schema for BigInt"));
      }
    }

    throw new Error("INTERNAL ERROR: Unrecognized codec: " + this.codec);
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

    const validator = stringFormatters[this.format];

    if (validator == null) {
      return false;
    }

    return validator(input);
  }
  parseStringWithFormatDecoder(ctx, input) {
    return input;
  }
  reportStringWithFormatDecoder(ctx, input) {
    return buildError(ctx, `expected string with format "${this.format}"`, input);
  }
  schemaStringWithFormatDecoder(ctx) {
    return {
      type: "string",
      format: this.format,
    };
  }
}
class NumberWithFormatDecoder {
  constructor(format) {
    this.format = format;
  }

  validateNumberWithFormatDecoder(ctx, input) {
    if (typeof input !== "number") {
      return false;
    }

    const validator = numberFormatters[this.format];

    if (validator == null) {
      return false;
    }

    return validator(input);
  }
  parseNumberWithFormatDecoder(ctx, input) {
    return input;
  }
  reportNumberWithFormatDecoder(ctx, input) {
    return buildError(ctx, `expected number with format "${this.format}"`, input);
  }
  schemaNumberWithFormatDecoder(ctx) {
    return {
      type: "string",
      format: this.format,
    };
  }
}

const limitedCommaJoinJson = (arr) => {
  const limit = 3;
  if (arr.length < limit) {
    return arr.map((it) => JSON.stringify(it)).join(", ");
  }
  return (
    arr
      .slice(0, limit)
      .map((it) => JSON.stringify(it))
      .join(", ") + `...`
  );
};
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
  parseAnyOfConstsDecoder(ctx, input) {
    return input;
  }
  reportAnyOfConstsDecoder(ctx, input) {
    return buildError(ctx, `expected one of ${limitedCommaJoinJson(this.consts)}`, input);
  }
  schemaAnyOfConstsDecoder(ctx) {
    return {
      enum: this.consts,
    };
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
        const validator = this.data[k];
        if (!validator(ctx, input[k])) {
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
      } else {
        if (ctx.disallowExtraProperties) {
          const inputKeys = Object.keys(input);
          const extraKeys = inputKeys.filter((k) => !configKeys.includes(k));

          if (extraKeys.length > 0) {
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
        const arr2 = this.dataReporter[k](ctx, input[k]);
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
          const arr2 = this.restReporter(ctx, input[k]);
          acc.push(...arr2);
          popPath(ctx);
        }
      }
    } else {
      if (ctx.disallowExtraProperties) {
        const inputKeys = Object.keys(input);
        const extraKeys = inputKeys.filter((k) => !configKeys.includes(k));
        if (extraKeys.length > 0) {
          
          return extraKeys.flatMap((k) => {
            pushPath(ctx, k);
            const err = buildError(ctx, `extra property`, input[k]);
            popPath(ctx);
            return err;
          });
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
        const itemParsed = this.data[k](ctx, v);
        acc[k] = itemParsed;
      } else if (this.rest != null) {
        const restParsed = this.rest(ctx, v);
        acc[k] = restParsed;
      }
    }

    return acc;
  }
}

class ObjectSchema {
  constructor(data, rest) {
    this.data = data;
    this.rest = rest;
  }

  schemaObjectSchema(ctx) {
    const properties = {};
    for (const k in this.data) {
      pushPath(ctx, k);
      properties[k] = this.data[k](ctx);
      popPath(ctx);
    }

    const required = Object.keys(this.data);

    const additionalProperties = this.rest != null ? this.rest(ctx) : false;

    return {
      type: "object",
      properties,
      required,
      additionalProperties,
    };
  }
}

class AnyOfDiscriminatedValidator {
  constructor(discriminator, mapping) {
    this.discriminator = discriminator;
    this.mapping = mapping;
  }

  validateAnyOfDiscriminatedValidator(ctx, input) {
    if (typeof input !== "object" || input == null) {
      return false;
    }
    const d = input[this.discriminator];
    if (d == null) {
      return false;
    }
    const v = this.mapping[d];
    if (v == null) {
      
      return false;
    }

    return v(ctx, input);
  }
}

class AnyOfDiscriminatedParser {
  constructor(discriminator, mapping) {
    this.discriminator = discriminator;
    this.mapping = mapping;
  }

  parseAnyOfDiscriminatedParser(ctx, input) {
    const parser = this.mapping[input[this.discriminator]];
    if (parser == null) {
      throw new Error(
        "INTERNAL ERROR: Missing parser for discriminator " + JSON.stringify(input[this.discriminator]),
      );
    }
    return {
      ...parser(ctx, input),
      [this.discriminator]: input[this.discriminator],
    };
  }
}

class AnyOfDiscriminatedReporter {
  constructor(discriminator, mapping) {
    this.discriminator = discriminator;
    this.mapping = mapping;
  }

  reportAnyOfDiscriminatedReporter(ctx, input) {
    if (input == null || typeof input !== "object") {
      return buildError(ctx, "expected object", input);
    }

    const d = input[this.discriminator];
    if (d == null) {
      return buildError(ctx, "expected discriminator key " + JSON.stringify(this.discriminator), input);
    }
    const v = this.mapping[d];
    if (v == null) {
      pushPath(ctx, this.discriminator);
      const errs = buildError(
        ctx,
        "expected one of " +
          Object.keys(this.mapping)
            .map((it) => JSON.stringify(it))
            .join(", "),
        d,
      );
      popPath(ctx);
      return errs;
    }
    return v(ctx, input);
  }
}

class AnyOfDiscriminatedSchema {
  constructor(vs) {
    this.vs = vs;
  }

  schemaAnyOfDiscriminatedSchema(ctx) {
    
    return {
      anyOf: this.vs.map((v) => v(ctx)),
    };
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
      return true;
    }
    return false;
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

class ArraySchema {
  constructor(innerSchema) {
    this.innerSchema = innerSchema;
  }

  schemaArraySchema(ctx) {
    pushPath(ctx, "[]");
    const items = this.innerSchema(ctx);
    popPath(ctx);
    return {
      type: "array",
      items,
    };
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
    const items = [];
    for (let i = 0; i < this.validators.length; i++) {
      if (this.validators[i](ctx, input)) {
        items.push(this.parsers[i](ctx, input));
      }
    }
    return deepmerge(...items);
  }
}
class AnyOfReporter {
  constructor(validators, reporters) {
    this.validators = validators;
    this.reporters = reporters;
  }
  reportAnyOfReporter(ctx, input) {
    const acc = [];
    const oldPaths = ctx.path;
    ctx.path = [];
    for (const v of this.reporters) {
      const errors = v(ctx, input);
      acc.push(...errors);
    }
    ctx.path = oldPaths;
    return buildUnionError(ctx, acc, input);
  }
}

class AnyOfSchema {
  constructor(schemas) {
    this.schemas = schemas;
  }
  schemaAnyOfSchema(ctx) {
    return {
      anyOf: this.schemas.map((s) => s(ctx)),
    };
  }
}

class AllOfValidator {
  constructor(vs) {
    this.vs = vs;
  }
  validateAllOfValidator(ctx, input) {
    for (const v of this.vs) {
      const isObj = typeof input === "object";
      if (!isObj) {
        return false;
      }
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
        throw new Error("INTERNAL ERROR: AllOfParser: Expected object");
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
    const acc = [];
    for (const v of this.reporters) {
      const errors = v(ctx, input);
      acc.push(...errors);
    }
    return acc;
  }
}

class AllOfSchema {
  constructor(schemas) {
    this.schemas = schemas;
  }
  schemaAllOfSchema(ctx) {
    return {
      allOf: this.schemas.map((s) => s(ctx)),
    };
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
    let idx = 0;
    let acc = [];
    for (const prefixParser of this.prefix) {
      acc.push(prefixParser(ctx, input[idx]));
      idx++;
    }
    if (this.rest != null) {
      for (let i = idx; i < input.length; i++) {
        acc.push(this.rest(ctx, input[i]));
      }
    }
    return acc;
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
    if (!Array.isArray(input)) {
      return buildError(ctx, "expected tuple", input);
    }

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

class TupleSchema {
  constructor(prefix, rest) {
    this.prefix = prefix;
    this.rest = rest;
  }

  schemaTupleSchema(ctx) {
    pushPath(ctx, "[]");
    const prefixItems = this.prefix.map((s) => s(ctx));
    const items = this.rest != null ? this.rest(ctx) : false;
    popPath(ctx);
    return {
      type: "array",
      prefixItems,
      items,
    };
  }
}


function ValidatePartialRepro(ctx, input) {
    return (hoisted_PartialRepro_15.validateObjectValidator.bind(hoisted_PartialRepro_15))(ctx, input);
}
function ParsePartialRepro(ctx, input) {
    return (hoisted_PartialRepro_16.parseObjectParser.bind(hoisted_PartialRepro_16))(ctx, input);
}
function ReportPartialRepro(ctx, input) {
    return (hoisted_PartialRepro_17.reportObjectReporter.bind(hoisted_PartialRepro_17))(ctx, input);
}
function SchemaPartialRepro(ctx, input) {
    if (ctx.seen["PartialRepro"]) {
        return {};
    }
    ctx.seen["PartialRepro"] = true;
    var tmp = (hoisted_PartialRepro_18.schemaObjectSchema.bind(hoisted_PartialRepro_18))(ctx);
    delete ctx.seen["PartialRepro"];
    return tmp;
}
function ValidateTransportedValue(ctx, input) {
    return (hoisted_TransportedValue_13.validateAnyOfValidator.bind(hoisted_TransportedValue_13))(ctx, input);
}
function ParseTransportedValue(ctx, input) {
    return (hoisted_TransportedValue_14.parseAnyOfParser.bind(hoisted_TransportedValue_14))(ctx, input);
}
function ReportTransportedValue(ctx, input) {
    return (hoisted_TransportedValue_15.reportAnyOfReporter.bind(hoisted_TransportedValue_15))(ctx, input);
}
function SchemaTransportedValue(ctx, input) {
    if (ctx.seen["TransportedValue"]) {
        return {};
    }
    ctx.seen["TransportedValue"] = true;
    var tmp = (hoisted_TransportedValue_16.schemaAnyOfSchema.bind(hoisted_TransportedValue_16))(ctx);
    delete ctx.seen["TransportedValue"];
    return tmp;
}
function ValidateOnlyAKey(ctx, input) {
    return (hoisted_OnlyAKey_3.validateObjectValidator.bind(hoisted_OnlyAKey_3))(ctx, input);
}
function ParseOnlyAKey(ctx, input) {
    return (hoisted_OnlyAKey_4.parseObjectParser.bind(hoisted_OnlyAKey_4))(ctx, input);
}
function ReportOnlyAKey(ctx, input) {
    return (hoisted_OnlyAKey_5.reportObjectReporter.bind(hoisted_OnlyAKey_5))(ctx, input);
}
function SchemaOnlyAKey(ctx, input) {
    if (ctx.seen["OnlyAKey"]) {
        return {};
    }
    ctx.seen["OnlyAKey"] = true;
    var tmp = (hoisted_OnlyAKey_6.schemaObjectSchema.bind(hoisted_OnlyAKey_6))(ctx);
    delete ctx.seen["OnlyAKey"];
    return tmp;
}
function ValidateAllTs(ctx, input) {
    return (hoisted_AllTs_0.validateAnyOfConstsDecoder.bind(hoisted_AllTs_0))(ctx, input);
}
function ParseAllTs(ctx, input) {
    return (hoisted_AllTs_0.parseAnyOfConstsDecoder.bind(hoisted_AllTs_0))(ctx, input);
}
function ReportAllTs(ctx, input) {
    return (hoisted_AllTs_0.reportAnyOfConstsDecoder.bind(hoisted_AllTs_0))(ctx, input);
}
function SchemaAllTs(ctx, input) {
    if (ctx.seen["AllTs"]) {
        return {};
    }
    ctx.seen["AllTs"] = true;
    var tmp = (hoisted_AllTs_0.schemaAnyOfConstsDecoder.bind(hoisted_AllTs_0))(ctx);
    delete ctx.seen["AllTs"];
    return tmp;
}
function ValidateAObject(ctx, input) {
    return (hoisted_AObject_4.validateObjectValidator.bind(hoisted_AObject_4))(ctx, input);
}
function ParseAObject(ctx, input) {
    return (hoisted_AObject_5.parseObjectParser.bind(hoisted_AObject_5))(ctx, input);
}
function ReportAObject(ctx, input) {
    return (hoisted_AObject_6.reportObjectReporter.bind(hoisted_AObject_6))(ctx, input);
}
function SchemaAObject(ctx, input) {
    if (ctx.seen["AObject"]) {
        return {};
    }
    ctx.seen["AObject"] = true;
    var tmp = (hoisted_AObject_7.schemaObjectSchema.bind(hoisted_AObject_7))(ctx);
    delete ctx.seen["AObject"];
    return tmp;
}
function ValidateVersion(ctx, input) {
    return (hoisted_Version_0.validateRegexDecoder.bind(hoisted_Version_0))(ctx, input);
}
function ParseVersion(ctx, input) {
    return (hoisted_Version_0.parseRegexDecoder.bind(hoisted_Version_0))(ctx, input);
}
function ReportVersion(ctx, input) {
    return (hoisted_Version_0.reportRegexDecoder.bind(hoisted_Version_0))(ctx, input);
}
function SchemaVersion(ctx, input) {
    if (ctx.seen["Version"]) {
        return {};
    }
    ctx.seen["Version"] = true;
    var tmp = (hoisted_Version_0.schemaRegexDecoder.bind(hoisted_Version_0))(ctx);
    delete ctx.seen["Version"];
    return tmp;
}
function ValidateVersion2(ctx, input) {
    return (hoisted_Version2_0.validateRegexDecoder.bind(hoisted_Version2_0))(ctx, input);
}
function ParseVersion2(ctx, input) {
    return (hoisted_Version2_0.parseRegexDecoder.bind(hoisted_Version2_0))(ctx, input);
}
function ReportVersion2(ctx, input) {
    return (hoisted_Version2_0.reportRegexDecoder.bind(hoisted_Version2_0))(ctx, input);
}
function SchemaVersion2(ctx, input) {
    if (ctx.seen["Version2"]) {
        return {};
    }
    ctx.seen["Version2"] = true;
    var tmp = (hoisted_Version2_0.schemaRegexDecoder.bind(hoisted_Version2_0))(ctx);
    delete ctx.seen["Version2"];
    return tmp;
}
function ValidateAccessLevel2(ctx, input) {
    return (hoisted_AccessLevel2_0.validateAnyOfConstsDecoder.bind(hoisted_AccessLevel2_0))(ctx, input);
}
function ParseAccessLevel2(ctx, input) {
    return (hoisted_AccessLevel2_0.parseAnyOfConstsDecoder.bind(hoisted_AccessLevel2_0))(ctx, input);
}
function ReportAccessLevel2(ctx, input) {
    return (hoisted_AccessLevel2_0.reportAnyOfConstsDecoder.bind(hoisted_AccessLevel2_0))(ctx, input);
}
function SchemaAccessLevel2(ctx, input) {
    if (ctx.seen["AccessLevel2"]) {
        return {};
    }
    ctx.seen["AccessLevel2"] = true;
    var tmp = (hoisted_AccessLevel2_0.schemaAnyOfConstsDecoder.bind(hoisted_AccessLevel2_0))(ctx);
    delete ctx.seen["AccessLevel2"];
    return tmp;
}
function ValidateAccessLevelTpl2(ctx, input) {
    return (hoisted_AccessLevelTpl2_0.validateRegexDecoder.bind(hoisted_AccessLevelTpl2_0))(ctx, input);
}
function ParseAccessLevelTpl2(ctx, input) {
    return (hoisted_AccessLevelTpl2_0.parseRegexDecoder.bind(hoisted_AccessLevelTpl2_0))(ctx, input);
}
function ReportAccessLevelTpl2(ctx, input) {
    return (hoisted_AccessLevelTpl2_0.reportRegexDecoder.bind(hoisted_AccessLevelTpl2_0))(ctx, input);
}
function SchemaAccessLevelTpl2(ctx, input) {
    if (ctx.seen["AccessLevelTpl2"]) {
        return {};
    }
    ctx.seen["AccessLevelTpl2"] = true;
    var tmp = (hoisted_AccessLevelTpl2_0.schemaRegexDecoder.bind(hoisted_AccessLevelTpl2_0))(ctx);
    delete ctx.seen["AccessLevelTpl2"];
    return tmp;
}
function ValidateAccessLevel(ctx, input) {
    return (hoisted_AccessLevel_0.validateAnyOfConstsDecoder.bind(hoisted_AccessLevel_0))(ctx, input);
}
function ParseAccessLevel(ctx, input) {
    return (hoisted_AccessLevel_0.parseAnyOfConstsDecoder.bind(hoisted_AccessLevel_0))(ctx, input);
}
function ReportAccessLevel(ctx, input) {
    return (hoisted_AccessLevel_0.reportAnyOfConstsDecoder.bind(hoisted_AccessLevel_0))(ctx, input);
}
function SchemaAccessLevel(ctx, input) {
    if (ctx.seen["AccessLevel"]) {
        return {};
    }
    ctx.seen["AccessLevel"] = true;
    var tmp = (hoisted_AccessLevel_0.schemaAnyOfConstsDecoder.bind(hoisted_AccessLevel_0))(ctx);
    delete ctx.seen["AccessLevel"];
    return tmp;
}
function ValidateAccessLevelTpl(ctx, input) {
    return (hoisted_AccessLevelTpl_0.validateRegexDecoder.bind(hoisted_AccessLevelTpl_0))(ctx, input);
}
function ParseAccessLevelTpl(ctx, input) {
    return (hoisted_AccessLevelTpl_0.parseRegexDecoder.bind(hoisted_AccessLevelTpl_0))(ctx, input);
}
function ReportAccessLevelTpl(ctx, input) {
    return (hoisted_AccessLevelTpl_0.reportRegexDecoder.bind(hoisted_AccessLevelTpl_0))(ctx, input);
}
function SchemaAccessLevelTpl(ctx, input) {
    if (ctx.seen["AccessLevelTpl"]) {
        return {};
    }
    ctx.seen["AccessLevelTpl"] = true;
    var tmp = (hoisted_AccessLevelTpl_0.schemaRegexDecoder.bind(hoisted_AccessLevelTpl_0))(ctx);
    delete ctx.seen["AccessLevelTpl"];
    return tmp;
}
function ValidateArr3(ctx, input) {
    return (hoisted_Arr3_0.validateAnyOfConstsDecoder.bind(hoisted_Arr3_0))(ctx, input);
}
function ParseArr3(ctx, input) {
    return (hoisted_Arr3_0.parseAnyOfConstsDecoder.bind(hoisted_Arr3_0))(ctx, input);
}
function ReportArr3(ctx, input) {
    return (hoisted_Arr3_0.reportAnyOfConstsDecoder.bind(hoisted_Arr3_0))(ctx, input);
}
function SchemaArr3(ctx, input) {
    if (ctx.seen["Arr3"]) {
        return {};
    }
    ctx.seen["Arr3"] = true;
    var tmp = (hoisted_Arr3_0.schemaAnyOfConstsDecoder.bind(hoisted_Arr3_0))(ctx);
    delete ctx.seen["Arr3"];
    return tmp;
}
function ValidateOmitSettings(ctx, input) {
    return (hoisted_OmitSettings_12.validateObjectValidator.bind(hoisted_OmitSettings_12))(ctx, input);
}
function ParseOmitSettings(ctx, input) {
    return (hoisted_OmitSettings_13.parseObjectParser.bind(hoisted_OmitSettings_13))(ctx, input);
}
function ReportOmitSettings(ctx, input) {
    return (hoisted_OmitSettings_14.reportObjectReporter.bind(hoisted_OmitSettings_14))(ctx, input);
}
function SchemaOmitSettings(ctx, input) {
    if (ctx.seen["OmitSettings"]) {
        return {};
    }
    ctx.seen["OmitSettings"] = true;
    var tmp = (hoisted_OmitSettings_15.schemaObjectSchema.bind(hoisted_OmitSettings_15))(ctx);
    delete ctx.seen["OmitSettings"];
    return tmp;
}
function ValidateSettings(ctx, input) {
    return (hoisted_Settings_12.validateObjectValidator.bind(hoisted_Settings_12))(ctx, input);
}
function ParseSettings(ctx, input) {
    return (hoisted_Settings_13.parseObjectParser.bind(hoisted_Settings_13))(ctx, input);
}
function ReportSettings(ctx, input) {
    return (hoisted_Settings_14.reportObjectReporter.bind(hoisted_Settings_14))(ctx, input);
}
function SchemaSettings(ctx, input) {
    if (ctx.seen["Settings"]) {
        return {};
    }
    ctx.seen["Settings"] = true;
    var tmp = (hoisted_Settings_15.schemaObjectSchema.bind(hoisted_Settings_15))(ctx);
    delete ctx.seen["Settings"];
    return tmp;
}
function ValidatePartialObject(ctx, input) {
    return (hoisted_PartialObject_15.validateObjectValidator.bind(hoisted_PartialObject_15))(ctx, input);
}
function ParsePartialObject(ctx, input) {
    return (hoisted_PartialObject_16.parseObjectParser.bind(hoisted_PartialObject_16))(ctx, input);
}
function ReportPartialObject(ctx, input) {
    return (hoisted_PartialObject_17.reportObjectReporter.bind(hoisted_PartialObject_17))(ctx, input);
}
function SchemaPartialObject(ctx, input) {
    if (ctx.seen["PartialObject"]) {
        return {};
    }
    ctx.seen["PartialObject"] = true;
    var tmp = (hoisted_PartialObject_18.schemaObjectSchema.bind(hoisted_PartialObject_18))(ctx);
    delete ctx.seen["PartialObject"];
    return tmp;
}
function ValidateRequiredPartialObject(ctx, input) {
    return (hoisted_RequiredPartialObject_3.validateObjectValidator.bind(hoisted_RequiredPartialObject_3))(ctx, input);
}
function ParseRequiredPartialObject(ctx, input) {
    return (hoisted_RequiredPartialObject_4.parseObjectParser.bind(hoisted_RequiredPartialObject_4))(ctx, input);
}
function ReportRequiredPartialObject(ctx, input) {
    return (hoisted_RequiredPartialObject_5.reportObjectReporter.bind(hoisted_RequiredPartialObject_5))(ctx, input);
}
function SchemaRequiredPartialObject(ctx, input) {
    if (ctx.seen["RequiredPartialObject"]) {
        return {};
    }
    ctx.seen["RequiredPartialObject"] = true;
    var tmp = (hoisted_RequiredPartialObject_6.schemaObjectSchema.bind(hoisted_RequiredPartialObject_6))(ctx);
    delete ctx.seen["RequiredPartialObject"];
    return tmp;
}
function ValidateLevelAndDSettings(ctx, input) {
    return (hoisted_LevelAndDSettings_12.validateObjectValidator.bind(hoisted_LevelAndDSettings_12))(ctx, input);
}
function ParseLevelAndDSettings(ctx, input) {
    return (hoisted_LevelAndDSettings_13.parseObjectParser.bind(hoisted_LevelAndDSettings_13))(ctx, input);
}
function ReportLevelAndDSettings(ctx, input) {
    return (hoisted_LevelAndDSettings_14.reportObjectReporter.bind(hoisted_LevelAndDSettings_14))(ctx, input);
}
function SchemaLevelAndDSettings(ctx, input) {
    if (ctx.seen["LevelAndDSettings"]) {
        return {};
    }
    ctx.seen["LevelAndDSettings"] = true;
    var tmp = (hoisted_LevelAndDSettings_15.schemaObjectSchema.bind(hoisted_LevelAndDSettings_15))(ctx);
    delete ctx.seen["LevelAndDSettings"];
    return tmp;
}
function ValidatePartialSettings(ctx, input) {
    return (hoisted_PartialSettings_31.validateObjectValidator.bind(hoisted_PartialSettings_31))(ctx, input);
}
function ParsePartialSettings(ctx, input) {
    return (hoisted_PartialSettings_32.parseObjectParser.bind(hoisted_PartialSettings_32))(ctx, input);
}
function ReportPartialSettings(ctx, input) {
    return (hoisted_PartialSettings_33.reportObjectReporter.bind(hoisted_PartialSettings_33))(ctx, input);
}
function SchemaPartialSettings(ctx, input) {
    if (ctx.seen["PartialSettings"]) {
        return {};
    }
    ctx.seen["PartialSettings"] = true;
    var tmp = (hoisted_PartialSettings_34.schemaObjectSchema.bind(hoisted_PartialSettings_34))(ctx);
    delete ctx.seen["PartialSettings"];
    return tmp;
}
function ValidateExtra(ctx, input) {
    return (hoisted_Extra_3.validateObjectValidator.bind(hoisted_Extra_3))(ctx, input);
}
function ParseExtra(ctx, input) {
    return (hoisted_Extra_4.parseObjectParser.bind(hoisted_Extra_4))(ctx, input);
}
function ReportExtra(ctx, input) {
    return (hoisted_Extra_5.reportObjectReporter.bind(hoisted_Extra_5))(ctx, input);
}
function SchemaExtra(ctx, input) {
    if (ctx.seen["Extra"]) {
        return {};
    }
    ctx.seen["Extra"] = true;
    var tmp = (hoisted_Extra_6.schemaObjectSchema.bind(hoisted_Extra_6))(ctx);
    delete ctx.seen["Extra"];
    return tmp;
}
function ValidateAvatarSize(ctx, input) {
    return (hoisted_AvatarSize_0.validateRegexDecoder.bind(hoisted_AvatarSize_0))(ctx, input);
}
function ParseAvatarSize(ctx, input) {
    return (hoisted_AvatarSize_0.parseRegexDecoder.bind(hoisted_AvatarSize_0))(ctx, input);
}
function ReportAvatarSize(ctx, input) {
    return (hoisted_AvatarSize_0.reportRegexDecoder.bind(hoisted_AvatarSize_0))(ctx, input);
}
function SchemaAvatarSize(ctx, input) {
    if (ctx.seen["AvatarSize"]) {
        return {};
    }
    ctx.seen["AvatarSize"] = true;
    var tmp = (hoisted_AvatarSize_0.schemaRegexDecoder.bind(hoisted_AvatarSize_0))(ctx);
    delete ctx.seen["AvatarSize"];
    return tmp;
}
function ValidateUser(ctx, input) {
    return (hoisted_User_8.validateObjectValidator.bind(hoisted_User_8))(ctx, input);
}
function ParseUser(ctx, input) {
    return (hoisted_User_9.parseObjectParser.bind(hoisted_User_9))(ctx, input);
}
function ReportUser(ctx, input) {
    return (hoisted_User_10.reportObjectReporter.bind(hoisted_User_10))(ctx, input);
}
function SchemaUser(ctx, input) {
    if (ctx.seen["User"]) {
        return {};
    }
    ctx.seen["User"] = true;
    var tmp = (hoisted_User_11.schemaObjectSchema.bind(hoisted_User_11))(ctx);
    delete ctx.seen["User"];
    return tmp;
}
function ValidatePublicUser(ctx, input) {
    return (hoisted_PublicUser_3.validateObjectValidator.bind(hoisted_PublicUser_3))(ctx, input);
}
function ParsePublicUser(ctx, input) {
    return (hoisted_PublicUser_4.parseObjectParser.bind(hoisted_PublicUser_4))(ctx, input);
}
function ReportPublicUser(ctx, input) {
    return (hoisted_PublicUser_5.reportObjectReporter.bind(hoisted_PublicUser_5))(ctx, input);
}
function SchemaPublicUser(ctx, input) {
    if (ctx.seen["PublicUser"]) {
        return {};
    }
    ctx.seen["PublicUser"] = true;
    var tmp = (hoisted_PublicUser_6.schemaObjectSchema.bind(hoisted_PublicUser_6))(ctx);
    delete ctx.seen["PublicUser"];
    return tmp;
}
function ValidateReq(ctx, input) {
    return (hoisted_Req_3.validateObjectValidator.bind(hoisted_Req_3))(ctx, input);
}
function ParseReq(ctx, input) {
    return (hoisted_Req_4.parseObjectParser.bind(hoisted_Req_4))(ctx, input);
}
function ReportReq(ctx, input) {
    return (hoisted_Req_5.reportObjectReporter.bind(hoisted_Req_5))(ctx, input);
}
function SchemaReq(ctx, input) {
    if (ctx.seen["Req"]) {
        return {};
    }
    ctx.seen["Req"] = true;
    var tmp = (hoisted_Req_6.schemaObjectSchema.bind(hoisted_Req_6))(ctx);
    delete ctx.seen["Req"];
    return tmp;
}
function ValidateWithOptionals(ctx, input) {
    return (hoisted_WithOptionals_9.validateObjectValidator.bind(hoisted_WithOptionals_9))(ctx, input);
}
function ParseWithOptionals(ctx, input) {
    return (hoisted_WithOptionals_10.parseObjectParser.bind(hoisted_WithOptionals_10))(ctx, input);
}
function ReportWithOptionals(ctx, input) {
    return (hoisted_WithOptionals_11.reportObjectReporter.bind(hoisted_WithOptionals_11))(ctx, input);
}
function SchemaWithOptionals(ctx, input) {
    if (ctx.seen["WithOptionals"]) {
        return {};
    }
    ctx.seen["WithOptionals"] = true;
    var tmp = (hoisted_WithOptionals_12.schemaObjectSchema.bind(hoisted_WithOptionals_12))(ctx);
    delete ctx.seen["WithOptionals"];
    return tmp;
}
function ValidateRepro1(ctx, input) {
    return (hoisted_Repro1_9.validateObjectValidator.bind(hoisted_Repro1_9))(ctx, input);
}
function ParseRepro1(ctx, input) {
    return (hoisted_Repro1_10.parseObjectParser.bind(hoisted_Repro1_10))(ctx, input);
}
function ReportRepro1(ctx, input) {
    return (hoisted_Repro1_11.reportObjectReporter.bind(hoisted_Repro1_11))(ctx, input);
}
function SchemaRepro1(ctx, input) {
    if (ctx.seen["Repro1"]) {
        return {};
    }
    ctx.seen["Repro1"] = true;
    var tmp = (hoisted_Repro1_12.schemaObjectSchema.bind(hoisted_Repro1_12))(ctx);
    delete ctx.seen["Repro1"];
    return tmp;
}
function ValidateRepro2(ctx, input) {
    return (hoisted_Repro2_3.validateObjectValidator.bind(hoisted_Repro2_3))(ctx, input);
}
function ParseRepro2(ctx, input) {
    return (hoisted_Repro2_4.parseObjectParser.bind(hoisted_Repro2_4))(ctx, input);
}
function ReportRepro2(ctx, input) {
    return (hoisted_Repro2_5.reportObjectReporter.bind(hoisted_Repro2_5))(ctx, input);
}
function SchemaRepro2(ctx, input) {
    if (ctx.seen["Repro2"]) {
        return {};
    }
    ctx.seen["Repro2"] = true;
    var tmp = (hoisted_Repro2_6.schemaObjectSchema.bind(hoisted_Repro2_6))(ctx);
    delete ctx.seen["Repro2"];
    return tmp;
}
function ValidateSettingsUpdate(ctx, input) {
    return (hoisted_SettingsUpdate_10.validateAnyOfValidator.bind(hoisted_SettingsUpdate_10))(ctx, input);
}
function ParseSettingsUpdate(ctx, input) {
    return (hoisted_SettingsUpdate_11.parseAnyOfParser.bind(hoisted_SettingsUpdate_11))(ctx, input);
}
function ReportSettingsUpdate(ctx, input) {
    return (hoisted_SettingsUpdate_12.reportAnyOfReporter.bind(hoisted_SettingsUpdate_12))(ctx, input);
}
function SchemaSettingsUpdate(ctx, input) {
    if (ctx.seen["SettingsUpdate"]) {
        return {};
    }
    ctx.seen["SettingsUpdate"] = true;
    var tmp = (hoisted_SettingsUpdate_13.schemaAnyOfSchema.bind(hoisted_SettingsUpdate_13))(ctx);
    delete ctx.seen["SettingsUpdate"];
    return tmp;
}
function ValidateMapped(ctx, input) {
    return (hoisted_Mapped_19.validateObjectValidator.bind(hoisted_Mapped_19))(ctx, input);
}
function ParseMapped(ctx, input) {
    return (hoisted_Mapped_20.parseObjectParser.bind(hoisted_Mapped_20))(ctx, input);
}
function ReportMapped(ctx, input) {
    return (hoisted_Mapped_21.reportObjectReporter.bind(hoisted_Mapped_21))(ctx, input);
}
function SchemaMapped(ctx, input) {
    if (ctx.seen["Mapped"]) {
        return {};
    }
    ctx.seen["Mapped"] = true;
    var tmp = (hoisted_Mapped_22.schemaObjectSchema.bind(hoisted_Mapped_22))(ctx);
    delete ctx.seen["Mapped"];
    return tmp;
}
function ValidateMappedOptional(ctx, input) {
    return (hoisted_MappedOptional_31.validateObjectValidator.bind(hoisted_MappedOptional_31))(ctx, input);
}
function ParseMappedOptional(ctx, input) {
    return (hoisted_MappedOptional_32.parseObjectParser.bind(hoisted_MappedOptional_32))(ctx, input);
}
function ReportMappedOptional(ctx, input) {
    return (hoisted_MappedOptional_33.reportObjectReporter.bind(hoisted_MappedOptional_33))(ctx, input);
}
function SchemaMappedOptional(ctx, input) {
    if (ctx.seen["MappedOptional"]) {
        return {};
    }
    ctx.seen["MappedOptional"] = true;
    var tmp = (hoisted_MappedOptional_34.schemaObjectSchema.bind(hoisted_MappedOptional_34))(ctx);
    delete ctx.seen["MappedOptional"];
    return tmp;
}
function ValidateDiscriminatedUnion(ctx, input) {
    return (hoisted_DiscriminatedUnion_92.validateAnyOfDiscriminatedValidator.bind(hoisted_DiscriminatedUnion_92))(ctx, input);
}
function ParseDiscriminatedUnion(ctx, input) {
    return (hoisted_DiscriminatedUnion_93.parseAnyOfDiscriminatedParser.bind(hoisted_DiscriminatedUnion_93))(ctx, input);
}
function ReportDiscriminatedUnion(ctx, input) {
    return (hoisted_DiscriminatedUnion_94.reportAnyOfDiscriminatedReporter.bind(hoisted_DiscriminatedUnion_94))(ctx, input);
}
function SchemaDiscriminatedUnion(ctx, input) {
    if (ctx.seen["DiscriminatedUnion"]) {
        return {};
    }
    ctx.seen["DiscriminatedUnion"] = true;
    var tmp = (hoisted_DiscriminatedUnion_95.schemaAnyOfDiscriminatedSchema.bind(hoisted_DiscriminatedUnion_95))(ctx);
    delete ctx.seen["DiscriminatedUnion"];
    return tmp;
}
function ValidateDiscriminatedUnion2(ctx, input) {
    return (hoisted_DiscriminatedUnion2_48.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion2_48))(ctx, input);
}
function ParseDiscriminatedUnion2(ctx, input) {
    return (hoisted_DiscriminatedUnion2_49.parseAnyOfParser.bind(hoisted_DiscriminatedUnion2_49))(ctx, input);
}
function ReportDiscriminatedUnion2(ctx, input) {
    return (hoisted_DiscriminatedUnion2_50.reportAnyOfReporter.bind(hoisted_DiscriminatedUnion2_50))(ctx, input);
}
function SchemaDiscriminatedUnion2(ctx, input) {
    if (ctx.seen["DiscriminatedUnion2"]) {
        return {};
    }
    ctx.seen["DiscriminatedUnion2"] = true;
    var tmp = (hoisted_DiscriminatedUnion2_51.schemaAnyOfSchema.bind(hoisted_DiscriminatedUnion2_51))(ctx);
    delete ctx.seen["DiscriminatedUnion2"];
    return tmp;
}
function ValidateDiscriminatedUnion3(ctx, input) {
    return (hoisted_DiscriminatedUnion3_40.validateAnyOfDiscriminatedValidator.bind(hoisted_DiscriminatedUnion3_40))(ctx, input);
}
function ParseDiscriminatedUnion3(ctx, input) {
    return (hoisted_DiscriminatedUnion3_41.parseAnyOfDiscriminatedParser.bind(hoisted_DiscriminatedUnion3_41))(ctx, input);
}
function ReportDiscriminatedUnion3(ctx, input) {
    return (hoisted_DiscriminatedUnion3_42.reportAnyOfDiscriminatedReporter.bind(hoisted_DiscriminatedUnion3_42))(ctx, input);
}
function SchemaDiscriminatedUnion3(ctx, input) {
    if (ctx.seen["DiscriminatedUnion3"]) {
        return {};
    }
    ctx.seen["DiscriminatedUnion3"] = true;
    var tmp = (hoisted_DiscriminatedUnion3_43.schemaAnyOfDiscriminatedSchema.bind(hoisted_DiscriminatedUnion3_43))(ctx);
    delete ctx.seen["DiscriminatedUnion3"];
    return tmp;
}
function ValidateDiscriminatedUnion4(ctx, input) {
    return (hoisted_DiscriminatedUnion4_34.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion4_34))(ctx, input);
}
function ParseDiscriminatedUnion4(ctx, input) {
    return (hoisted_DiscriminatedUnion4_35.parseAnyOfParser.bind(hoisted_DiscriminatedUnion4_35))(ctx, input);
}
function ReportDiscriminatedUnion4(ctx, input) {
    return (hoisted_DiscriminatedUnion4_36.reportAnyOfReporter.bind(hoisted_DiscriminatedUnion4_36))(ctx, input);
}
function SchemaDiscriminatedUnion4(ctx, input) {
    if (ctx.seen["DiscriminatedUnion4"]) {
        return {};
    }
    ctx.seen["DiscriminatedUnion4"] = true;
    var tmp = (hoisted_DiscriminatedUnion4_37.schemaAnyOfSchema.bind(hoisted_DiscriminatedUnion4_37))(ctx);
    delete ctx.seen["DiscriminatedUnion4"];
    return tmp;
}
function ValidateAllTypes(ctx, input) {
    return (hoisted_AllTypes_0.validateAnyOfConstsDecoder.bind(hoisted_AllTypes_0))(ctx, input);
}
function ParseAllTypes(ctx, input) {
    return (hoisted_AllTypes_0.parseAnyOfConstsDecoder.bind(hoisted_AllTypes_0))(ctx, input);
}
function ReportAllTypes(ctx, input) {
    return (hoisted_AllTypes_0.reportAnyOfConstsDecoder.bind(hoisted_AllTypes_0))(ctx, input);
}
function SchemaAllTypes(ctx, input) {
    if (ctx.seen["AllTypes"]) {
        return {};
    }
    ctx.seen["AllTypes"] = true;
    var tmp = (hoisted_AllTypes_0.schemaAnyOfConstsDecoder.bind(hoisted_AllTypes_0))(ctx);
    delete ctx.seen["AllTypes"];
    return tmp;
}
function ValidateOtherEnum(ctx, input) {
    return (hoisted_OtherEnum_0.validateAnyOfConstsDecoder.bind(hoisted_OtherEnum_0))(ctx, input);
}
function ParseOtherEnum(ctx, input) {
    return (hoisted_OtherEnum_0.parseAnyOfConstsDecoder.bind(hoisted_OtherEnum_0))(ctx, input);
}
function ReportOtherEnum(ctx, input) {
    return (hoisted_OtherEnum_0.reportAnyOfConstsDecoder.bind(hoisted_OtherEnum_0))(ctx, input);
}
function SchemaOtherEnum(ctx, input) {
    if (ctx.seen["OtherEnum"]) {
        return {};
    }
    ctx.seen["OtherEnum"] = true;
    var tmp = (hoisted_OtherEnum_0.schemaAnyOfConstsDecoder.bind(hoisted_OtherEnum_0))(ctx);
    delete ctx.seen["OtherEnum"];
    return tmp;
}
function ValidateArr2(ctx, input) {
    return (hoisted_Arr2_0.validateAnyOfConstsDecoder.bind(hoisted_Arr2_0))(ctx, input);
}
function ParseArr2(ctx, input) {
    return (hoisted_Arr2_0.parseAnyOfConstsDecoder.bind(hoisted_Arr2_0))(ctx, input);
}
function ReportArr2(ctx, input) {
    return (hoisted_Arr2_0.reportAnyOfConstsDecoder.bind(hoisted_Arr2_0))(ctx, input);
}
function SchemaArr2(ctx, input) {
    if (ctx.seen["Arr2"]) {
        return {};
    }
    ctx.seen["Arr2"] = true;
    var tmp = (hoisted_Arr2_0.schemaAnyOfConstsDecoder.bind(hoisted_Arr2_0))(ctx);
    delete ctx.seen["Arr2"];
    return tmp;
}
function ValidateValidCurrency(ctx, input) {
    return (hoisted_ValidCurrency_0.validateStringWithFormatDecoder.bind(hoisted_ValidCurrency_0))(ctx, input);
}
function ParseValidCurrency(ctx, input) {
    return (hoisted_ValidCurrency_0.parseStringWithFormatDecoder.bind(hoisted_ValidCurrency_0))(ctx, input);
}
function ReportValidCurrency(ctx, input) {
    return (hoisted_ValidCurrency_0.reportStringWithFormatDecoder.bind(hoisted_ValidCurrency_0))(ctx, input);
}
function SchemaValidCurrency(ctx, input) {
    if (ctx.seen["ValidCurrency"]) {
        return {};
    }
    ctx.seen["ValidCurrency"] = true;
    var tmp = (hoisted_ValidCurrency_0.schemaStringWithFormatDecoder.bind(hoisted_ValidCurrency_0))(ctx);
    delete ctx.seen["ValidCurrency"];
    return tmp;
}
function ValidateUnionWithEnumAccess(ctx, input) {
    return (hoisted_UnionWithEnumAccess_48.validateAnyOfDiscriminatedValidator.bind(hoisted_UnionWithEnumAccess_48))(ctx, input);
}
function ParseUnionWithEnumAccess(ctx, input) {
    return (hoisted_UnionWithEnumAccess_49.parseAnyOfDiscriminatedParser.bind(hoisted_UnionWithEnumAccess_49))(ctx, input);
}
function ReportUnionWithEnumAccess(ctx, input) {
    return (hoisted_UnionWithEnumAccess_50.reportAnyOfDiscriminatedReporter.bind(hoisted_UnionWithEnumAccess_50))(ctx, input);
}
function SchemaUnionWithEnumAccess(ctx, input) {
    if (ctx.seen["UnionWithEnumAccess"]) {
        return {};
    }
    ctx.seen["UnionWithEnumAccess"] = true;
    var tmp = (hoisted_UnionWithEnumAccess_51.schemaAnyOfDiscriminatedSchema.bind(hoisted_UnionWithEnumAccess_51))(ctx);
    delete ctx.seen["UnionWithEnumAccess"];
    return tmp;
}
function ValidateShape(ctx, input) {
    return (hoisted_Shape_48.validateAnyOfDiscriminatedValidator.bind(hoisted_Shape_48))(ctx, input);
}
function ParseShape(ctx, input) {
    return (hoisted_Shape_49.parseAnyOfDiscriminatedParser.bind(hoisted_Shape_49))(ctx, input);
}
function ReportShape(ctx, input) {
    return (hoisted_Shape_50.reportAnyOfDiscriminatedReporter.bind(hoisted_Shape_50))(ctx, input);
}
function SchemaShape(ctx, input) {
    if (ctx.seen["Shape"]) {
        return {};
    }
    ctx.seen["Shape"] = true;
    var tmp = (hoisted_Shape_51.schemaAnyOfDiscriminatedSchema.bind(hoisted_Shape_51))(ctx);
    delete ctx.seen["Shape"];
    return tmp;
}
function ValidateT3(ctx, input) {
    return (hoisted_T3_32.validateAnyOfDiscriminatedValidator.bind(hoisted_T3_32))(ctx, input);
}
function ParseT3(ctx, input) {
    return (hoisted_T3_33.parseAnyOfDiscriminatedParser.bind(hoisted_T3_33))(ctx, input);
}
function ReportT3(ctx, input) {
    return (hoisted_T3_34.reportAnyOfDiscriminatedReporter.bind(hoisted_T3_34))(ctx, input);
}
function SchemaT3(ctx, input) {
    if (ctx.seen["T3"]) {
        return {};
    }
    ctx.seen["T3"] = true;
    var tmp = (hoisted_T3_35.schemaAnyOfDiscriminatedSchema.bind(hoisted_T3_35))(ctx);
    delete ctx.seen["T3"];
    return tmp;
}
function ValidateBObject(ctx, input) {
    return (hoisted_BObject_4.validateObjectValidator.bind(hoisted_BObject_4))(ctx, input);
}
function ParseBObject(ctx, input) {
    return (hoisted_BObject_5.parseObjectParser.bind(hoisted_BObject_5))(ctx, input);
}
function ReportBObject(ctx, input) {
    return (hoisted_BObject_6.reportObjectReporter.bind(hoisted_BObject_6))(ctx, input);
}
function SchemaBObject(ctx, input) {
    if (ctx.seen["BObject"]) {
        return {};
    }
    ctx.seen["BObject"] = true;
    var tmp = (hoisted_BObject_7.schemaObjectSchema.bind(hoisted_BObject_7))(ctx);
    delete ctx.seen["BObject"];
    return tmp;
}
function ValidateDEF(ctx, input) {
    return (hoisted_DEF_3.validateObjectValidator.bind(hoisted_DEF_3))(ctx, input);
}
function ParseDEF(ctx, input) {
    return (hoisted_DEF_4.parseObjectParser.bind(hoisted_DEF_4))(ctx, input);
}
function ReportDEF(ctx, input) {
    return (hoisted_DEF_5.reportObjectReporter.bind(hoisted_DEF_5))(ctx, input);
}
function SchemaDEF(ctx, input) {
    if (ctx.seen["DEF"]) {
        return {};
    }
    ctx.seen["DEF"] = true;
    var tmp = (hoisted_DEF_6.schemaObjectSchema.bind(hoisted_DEF_6))(ctx);
    delete ctx.seen["DEF"];
    return tmp;
}
function ValidateKDEF(ctx, input) {
    return (hoisted_KDEF_0.validateConstDecoder.bind(hoisted_KDEF_0))(ctx, input);
}
function ParseKDEF(ctx, input) {
    return (hoisted_KDEF_0.parseConstDecoder.bind(hoisted_KDEF_0))(ctx, input);
}
function ReportKDEF(ctx, input) {
    return (hoisted_KDEF_0.reportConstDecoder.bind(hoisted_KDEF_0))(ctx, input);
}
function SchemaKDEF(ctx, input) {
    if (ctx.seen["KDEF"]) {
        return {};
    }
    ctx.seen["KDEF"] = true;
    var tmp = (hoisted_KDEF_0.schemaConstDecoder.bind(hoisted_KDEF_0))(ctx);
    delete ctx.seen["KDEF"];
    return tmp;
}
function ValidateABC(ctx, input) {
    return (hoisted_ABC_3.validateObjectValidator.bind(hoisted_ABC_3))(ctx, input);
}
function ParseABC(ctx, input) {
    return (hoisted_ABC_4.parseObjectParser.bind(hoisted_ABC_4))(ctx, input);
}
function ReportABC(ctx, input) {
    return (hoisted_ABC_5.reportObjectReporter.bind(hoisted_ABC_5))(ctx, input);
}
function SchemaABC(ctx, input) {
    if (ctx.seen["ABC"]) {
        return {};
    }
    ctx.seen["ABC"] = true;
    var tmp = (hoisted_ABC_6.schemaObjectSchema.bind(hoisted_ABC_6))(ctx);
    delete ctx.seen["ABC"];
    return tmp;
}
function ValidateKABC(ctx, input) {
    return (validateNever)(ctx, input);
}
function ParseKABC(ctx, input) {
    return (parseIdentity)(ctx, input);
}
function ReportKABC(ctx, input) {
    return (reportNever)(ctx, input);
}
function SchemaKABC(ctx, input) {
    if (ctx.seen["KABC"]) {
        return {};
    }
    ctx.seen["KABC"] = true;
    var tmp = (schemaNever)(ctx);
    delete ctx.seen["KABC"];
    return tmp;
}
function ValidateK(ctx, input) {
    return (hoisted_K_2.validateAnyOfValidator.bind(hoisted_K_2))(ctx, input);
}
function ParseK(ctx, input) {
    return (hoisted_K_3.parseAnyOfParser.bind(hoisted_K_3))(ctx, input);
}
function ReportK(ctx, input) {
    return (hoisted_K_4.reportAnyOfReporter.bind(hoisted_K_4))(ctx, input);
}
function SchemaK(ctx, input) {
    if (ctx.seen["K"]) {
        return {};
    }
    ctx.seen["K"] = true;
    var tmp = (hoisted_K_5.schemaAnyOfSchema.bind(hoisted_K_5))(ctx);
    delete ctx.seen["K"];
    return tmp;
}
function ValidateNonNegativeNumber(ctx, input) {
    return (hoisted_NonNegativeNumber_0.validateNumberWithFormatDecoder.bind(hoisted_NonNegativeNumber_0))(ctx, input);
}
function ParseNonNegativeNumber(ctx, input) {
    return (hoisted_NonNegativeNumber_0.parseNumberWithFormatDecoder.bind(hoisted_NonNegativeNumber_0))(ctx, input);
}
function ReportNonNegativeNumber(ctx, input) {
    return (hoisted_NonNegativeNumber_0.reportNumberWithFormatDecoder.bind(hoisted_NonNegativeNumber_0))(ctx, input);
}
function SchemaNonNegativeNumber(ctx, input) {
    if (ctx.seen["NonNegativeNumber"]) {
        return {};
    }
    ctx.seen["NonNegativeNumber"] = true;
    var tmp = (hoisted_NonNegativeNumber_0.schemaNumberWithFormatDecoder.bind(hoisted_NonNegativeNumber_0))(ctx);
    delete ctx.seen["NonNegativeNumber"];
    return tmp;
}
const validators = {
    PartialRepro: ValidatePartialRepro,
    TransportedValue: ValidateTransportedValue,
    OnlyAKey: ValidateOnlyAKey,
    AllTs: ValidateAllTs,
    AObject: ValidateAObject,
    Version: ValidateVersion,
    Version2: ValidateVersion2,
    AccessLevel2: ValidateAccessLevel2,
    AccessLevelTpl2: ValidateAccessLevelTpl2,
    AccessLevel: ValidateAccessLevel,
    AccessLevelTpl: ValidateAccessLevelTpl,
    Arr3: ValidateArr3,
    OmitSettings: ValidateOmitSettings,
    Settings: ValidateSettings,
    PartialObject: ValidatePartialObject,
    RequiredPartialObject: ValidateRequiredPartialObject,
    LevelAndDSettings: ValidateLevelAndDSettings,
    PartialSettings: ValidatePartialSettings,
    Extra: ValidateExtra,
    AvatarSize: ValidateAvatarSize,
    User: ValidateUser,
    PublicUser: ValidatePublicUser,
    Req: ValidateReq,
    WithOptionals: ValidateWithOptionals,
    Repro1: ValidateRepro1,
    Repro2: ValidateRepro2,
    SettingsUpdate: ValidateSettingsUpdate,
    Mapped: ValidateMapped,
    MappedOptional: ValidateMappedOptional,
    DiscriminatedUnion: ValidateDiscriminatedUnion,
    DiscriminatedUnion2: ValidateDiscriminatedUnion2,
    DiscriminatedUnion3: ValidateDiscriminatedUnion3,
    DiscriminatedUnion4: ValidateDiscriminatedUnion4,
    AllTypes: ValidateAllTypes,
    OtherEnum: ValidateOtherEnum,
    Arr2: ValidateArr2,
    ValidCurrency: ValidateValidCurrency,
    UnionWithEnumAccess: ValidateUnionWithEnumAccess,
    Shape: ValidateShape,
    T3: ValidateT3,
    BObject: ValidateBObject,
    DEF: ValidateDEF,
    KDEF: ValidateKDEF,
    ABC: ValidateABC,
    KABC: ValidateKABC,
    K: ValidateK,
    NonNegativeNumber: ValidateNonNegativeNumber
};
const parsers = {
    PartialRepro: ParsePartialRepro,
    TransportedValue: ParseTransportedValue,
    OnlyAKey: ParseOnlyAKey,
    AllTs: ParseAllTs,
    AObject: ParseAObject,
    Version: ParseVersion,
    Version2: ParseVersion2,
    AccessLevel2: ParseAccessLevel2,
    AccessLevelTpl2: ParseAccessLevelTpl2,
    AccessLevel: ParseAccessLevel,
    AccessLevelTpl: ParseAccessLevelTpl,
    Arr3: ParseArr3,
    OmitSettings: ParseOmitSettings,
    Settings: ParseSettings,
    PartialObject: ParsePartialObject,
    RequiredPartialObject: ParseRequiredPartialObject,
    LevelAndDSettings: ParseLevelAndDSettings,
    PartialSettings: ParsePartialSettings,
    Extra: ParseExtra,
    AvatarSize: ParseAvatarSize,
    User: ParseUser,
    PublicUser: ParsePublicUser,
    Req: ParseReq,
    WithOptionals: ParseWithOptionals,
    Repro1: ParseRepro1,
    Repro2: ParseRepro2,
    SettingsUpdate: ParseSettingsUpdate,
    Mapped: ParseMapped,
    MappedOptional: ParseMappedOptional,
    DiscriminatedUnion: ParseDiscriminatedUnion,
    DiscriminatedUnion2: ParseDiscriminatedUnion2,
    DiscriminatedUnion3: ParseDiscriminatedUnion3,
    DiscriminatedUnion4: ParseDiscriminatedUnion4,
    AllTypes: ParseAllTypes,
    OtherEnum: ParseOtherEnum,
    Arr2: ParseArr2,
    ValidCurrency: ParseValidCurrency,
    UnionWithEnumAccess: ParseUnionWithEnumAccess,
    Shape: ParseShape,
    T3: ParseT3,
    BObject: ParseBObject,
    DEF: ParseDEF,
    KDEF: ParseKDEF,
    ABC: ParseABC,
    KABC: ParseKABC,
    K: ParseK,
    NonNegativeNumber: ParseNonNegativeNumber
};
const reporters = {
    PartialRepro: ReportPartialRepro,
    TransportedValue: ReportTransportedValue,
    OnlyAKey: ReportOnlyAKey,
    AllTs: ReportAllTs,
    AObject: ReportAObject,
    Version: ReportVersion,
    Version2: ReportVersion2,
    AccessLevel2: ReportAccessLevel2,
    AccessLevelTpl2: ReportAccessLevelTpl2,
    AccessLevel: ReportAccessLevel,
    AccessLevelTpl: ReportAccessLevelTpl,
    Arr3: ReportArr3,
    OmitSettings: ReportOmitSettings,
    Settings: ReportSettings,
    PartialObject: ReportPartialObject,
    RequiredPartialObject: ReportRequiredPartialObject,
    LevelAndDSettings: ReportLevelAndDSettings,
    PartialSettings: ReportPartialSettings,
    Extra: ReportExtra,
    AvatarSize: ReportAvatarSize,
    User: ReportUser,
    PublicUser: ReportPublicUser,
    Req: ReportReq,
    WithOptionals: ReportWithOptionals,
    Repro1: ReportRepro1,
    Repro2: ReportRepro2,
    SettingsUpdate: ReportSettingsUpdate,
    Mapped: ReportMapped,
    MappedOptional: ReportMappedOptional,
    DiscriminatedUnion: ReportDiscriminatedUnion,
    DiscriminatedUnion2: ReportDiscriminatedUnion2,
    DiscriminatedUnion3: ReportDiscriminatedUnion3,
    DiscriminatedUnion4: ReportDiscriminatedUnion4,
    AllTypes: ReportAllTypes,
    OtherEnum: ReportOtherEnum,
    Arr2: ReportArr2,
    ValidCurrency: ReportValidCurrency,
    UnionWithEnumAccess: ReportUnionWithEnumAccess,
    Shape: ReportShape,
    T3: ReportT3,
    BObject: ReportBObject,
    DEF: ReportDEF,
    KDEF: ReportKDEF,
    ABC: ReportABC,
    KABC: ReportKABC,
    K: ReportK,
    NonNegativeNumber: ReportNonNegativeNumber
};
const schemas = {
    PartialRepro: SchemaPartialRepro,
    TransportedValue: SchemaTransportedValue,
    OnlyAKey: SchemaOnlyAKey,
    AllTs: SchemaAllTs,
    AObject: SchemaAObject,
    Version: SchemaVersion,
    Version2: SchemaVersion2,
    AccessLevel2: SchemaAccessLevel2,
    AccessLevelTpl2: SchemaAccessLevelTpl2,
    AccessLevel: SchemaAccessLevel,
    AccessLevelTpl: SchemaAccessLevelTpl,
    Arr3: SchemaArr3,
    OmitSettings: SchemaOmitSettings,
    Settings: SchemaSettings,
    PartialObject: SchemaPartialObject,
    RequiredPartialObject: SchemaRequiredPartialObject,
    LevelAndDSettings: SchemaLevelAndDSettings,
    PartialSettings: SchemaPartialSettings,
    Extra: SchemaExtra,
    AvatarSize: SchemaAvatarSize,
    User: SchemaUser,
    PublicUser: SchemaPublicUser,
    Req: SchemaReq,
    WithOptionals: SchemaWithOptionals,
    Repro1: SchemaRepro1,
    Repro2: SchemaRepro2,
    SettingsUpdate: SchemaSettingsUpdate,
    Mapped: SchemaMapped,
    MappedOptional: SchemaMappedOptional,
    DiscriminatedUnion: SchemaDiscriminatedUnion,
    DiscriminatedUnion2: SchemaDiscriminatedUnion2,
    DiscriminatedUnion3: SchemaDiscriminatedUnion3,
    DiscriminatedUnion4: SchemaDiscriminatedUnion4,
    AllTypes: SchemaAllTypes,
    OtherEnum: SchemaOtherEnum,
    Arr2: SchemaArr2,
    ValidCurrency: SchemaValidCurrency,
    UnionWithEnumAccess: SchemaUnionWithEnumAccess,
    Shape: SchemaShape,
    T3: SchemaT3,
    BObject: SchemaBObject,
    DEF: SchemaDEF,
    KDEF: SchemaKDEF,
    ABC: SchemaABC,
    KABC: SchemaKABC,
    K: SchemaK,
    NonNegativeNumber: SchemaNonNegativeNumber
};
const hoisted_PartialRepro_0 = [
    validateNull,
    validateString
];
const hoisted_PartialRepro_1 = [
    schemaNull,
    schemaString
];
const hoisted_PartialRepro_2 = new AnyOfValidator(hoisted_PartialRepro_0);
const hoisted_PartialRepro_3 = new AnyOfParser(hoisted_PartialRepro_0, [
    parseIdentity,
    parseIdentity
]);
const hoisted_PartialRepro_4 = new AnyOfReporter(hoisted_PartialRepro_0, [
    reportNull,
    reportString
]);
const hoisted_PartialRepro_5 = new AnyOfSchema(hoisted_PartialRepro_1);
const hoisted_PartialRepro_6 = [
    validateNull,
    validateString
];
const hoisted_PartialRepro_7 = [
    schemaNull,
    schemaString
];
const hoisted_PartialRepro_8 = new AnyOfValidator(hoisted_PartialRepro_6);
const hoisted_PartialRepro_9 = new AnyOfParser(hoisted_PartialRepro_6, [
    parseIdentity,
    parseIdentity
]);
const hoisted_PartialRepro_10 = new AnyOfReporter(hoisted_PartialRepro_6, [
    reportNull,
    reportString
]);
const hoisted_PartialRepro_11 = new AnyOfSchema(hoisted_PartialRepro_7);
const hoisted_PartialRepro_12 = {
    "a": hoisted_PartialRepro_2.validateAnyOfValidator.bind(hoisted_PartialRepro_2),
    "b": hoisted_PartialRepro_8.validateAnyOfValidator.bind(hoisted_PartialRepro_8)
};
const hoisted_PartialRepro_13 = {
    "a": hoisted_PartialRepro_5.schemaAnyOfSchema.bind(hoisted_PartialRepro_5),
    "b": hoisted_PartialRepro_11.schemaAnyOfSchema.bind(hoisted_PartialRepro_11)
};
const hoisted_PartialRepro_14 = null;
const hoisted_PartialRepro_15 = new ObjectValidator(hoisted_PartialRepro_12, hoisted_PartialRepro_14);
const hoisted_PartialRepro_16 = new ObjectParser({
    "a": hoisted_PartialRepro_3.parseAnyOfParser.bind(hoisted_PartialRepro_3),
    "b": hoisted_PartialRepro_9.parseAnyOfParser.bind(hoisted_PartialRepro_9)
}, null);
const hoisted_PartialRepro_17 = new ObjectReporter(hoisted_PartialRepro_12, hoisted_PartialRepro_14, {
    "a": hoisted_PartialRepro_4.reportAnyOfReporter.bind(hoisted_PartialRepro_4),
    "b": hoisted_PartialRepro_10.reportAnyOfReporter.bind(hoisted_PartialRepro_10)
}, null);
const hoisted_PartialRepro_18 = new ObjectSchema(hoisted_PartialRepro_13, null);
const hoisted_TransportedValue_0 = [
    validateNull,
    validateString,
    validateNumber
];
const hoisted_TransportedValue_1 = [
    schemaNull,
    schemaString,
    schemaNumber
];
const hoisted_TransportedValue_2 = new AnyOfValidator(hoisted_TransportedValue_0);
const hoisted_TransportedValue_3 = new AnyOfParser(hoisted_TransportedValue_0, [
    parseIdentity,
    parseIdentity,
    parseIdentity
]);
const hoisted_TransportedValue_4 = new AnyOfReporter(hoisted_TransportedValue_0, [
    reportNull,
    reportString,
    reportNumber
]);
const hoisted_TransportedValue_5 = new AnyOfSchema(hoisted_TransportedValue_1);
const hoisted_TransportedValue_6 = hoisted_TransportedValue_2.validateAnyOfValidator.bind(hoisted_TransportedValue_2);
const hoisted_TransportedValue_7 = new ArrayValidator(hoisted_TransportedValue_6);
const hoisted_TransportedValue_8 = new ArrayParser(hoisted_TransportedValue_3.parseAnyOfParser.bind(hoisted_TransportedValue_3));
const hoisted_TransportedValue_9 = new ArrayReporter(hoisted_TransportedValue_6, hoisted_TransportedValue_4.reportAnyOfReporter.bind(hoisted_TransportedValue_4));
const hoisted_TransportedValue_10 = new ArraySchema(hoisted_TransportedValue_5.schemaAnyOfSchema.bind(hoisted_TransportedValue_5));
const hoisted_TransportedValue_11 = [
    validateNull,
    validateString,
    hoisted_TransportedValue_7.validateArrayValidator.bind(hoisted_TransportedValue_7)
];
const hoisted_TransportedValue_12 = [
    schemaNull,
    schemaString,
    hoisted_TransportedValue_10.schemaArraySchema.bind(hoisted_TransportedValue_10)
];
const hoisted_TransportedValue_13 = new AnyOfValidator(hoisted_TransportedValue_11);
const hoisted_TransportedValue_14 = new AnyOfParser(hoisted_TransportedValue_11, [
    parseIdentity,
    parseIdentity,
    hoisted_TransportedValue_8.parseArrayParser.bind(hoisted_TransportedValue_8)
]);
const hoisted_TransportedValue_15 = new AnyOfReporter(hoisted_TransportedValue_11, [
    reportNull,
    reportString,
    hoisted_TransportedValue_9.reportArrayReporter.bind(hoisted_TransportedValue_9)
]);
const hoisted_TransportedValue_16 = new AnyOfSchema(hoisted_TransportedValue_12);
const hoisted_OnlyAKey_0 = {
    "A": validateString
};
const hoisted_OnlyAKey_1 = {
    "A": schemaString
};
const hoisted_OnlyAKey_2 = null;
const hoisted_OnlyAKey_3 = new ObjectValidator(hoisted_OnlyAKey_0, hoisted_OnlyAKey_2);
const hoisted_OnlyAKey_4 = new ObjectParser({
    "A": parseIdentity
}, null);
const hoisted_OnlyAKey_5 = new ObjectReporter(hoisted_OnlyAKey_0, hoisted_OnlyAKey_2, {
    "A": reportString
}, null);
const hoisted_OnlyAKey_6 = new ObjectSchema(hoisted_OnlyAKey_1, null);
const hoisted_AllTs_0 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_AObject_0 = new ConstDecoder("a");
const hoisted_AObject_1 = {
    "tag": hoisted_AObject_0.validateConstDecoder.bind(hoisted_AObject_0)
};
const hoisted_AObject_2 = {
    "tag": hoisted_AObject_0.schemaConstDecoder.bind(hoisted_AObject_0)
};
const hoisted_AObject_3 = null;
const hoisted_AObject_4 = new ObjectValidator(hoisted_AObject_1, hoisted_AObject_3);
const hoisted_AObject_5 = new ObjectParser({
    "tag": hoisted_AObject_0.parseConstDecoder.bind(hoisted_AObject_0)
}, null);
const hoisted_AObject_6 = new ObjectReporter(hoisted_AObject_1, hoisted_AObject_3, {
    "tag": hoisted_AObject_0.reportConstDecoder.bind(hoisted_AObject_0)
}, null);
const hoisted_AObject_7 = new ObjectSchema(hoisted_AObject_2, null);
const hoisted_Version_0 = new RegexDecoder(/(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "${number}.${number}.${number}");
const hoisted_Version2_0 = new RegexDecoder(/(v)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "v${number}.${number}.${number}");
const hoisted_AccessLevel2_0 = new AnyOfConstsDecoder([
    "ADMIN Admin",
    "USER User"
]);
const hoisted_AccessLevelTpl2_0 = new RegexDecoder(/((ADMIN Admin)|(USER User))/, '("ADMIN Admin" | "USER User")');
const hoisted_AccessLevel_0 = new AnyOfConstsDecoder([
    "ADMIN",
    "USER"
]);
const hoisted_AccessLevelTpl_0 = new RegexDecoder(/((ADMIN)|(USER))/, '("ADMIN" | "USER")');
const hoisted_Arr3_0 = new AnyOfConstsDecoder([
    "X",
    "Y"
]);
const hoisted_OmitSettings_0 = new ConstDecoder("d");
const hoisted_OmitSettings_1 = {
    "tag": hoisted_OmitSettings_0.validateConstDecoder.bind(hoisted_OmitSettings_0)
};
const hoisted_OmitSettings_2 = {
    "tag": hoisted_OmitSettings_0.schemaConstDecoder.bind(hoisted_OmitSettings_0)
};
const hoisted_OmitSettings_3 = null;
const hoisted_OmitSettings_4 = new ObjectValidator(hoisted_OmitSettings_1, hoisted_OmitSettings_3);
const hoisted_OmitSettings_5 = new ObjectParser({
    "tag": hoisted_OmitSettings_0.parseConstDecoder.bind(hoisted_OmitSettings_0)
}, null);
const hoisted_OmitSettings_6 = new ObjectReporter(hoisted_OmitSettings_1, hoisted_OmitSettings_3, {
    "tag": hoisted_OmitSettings_0.reportConstDecoder.bind(hoisted_OmitSettings_0)
}, null);
const hoisted_OmitSettings_7 = new ObjectSchema(hoisted_OmitSettings_2, null);
const hoisted_OmitSettings_8 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_OmitSettings_9 = {
    "d": hoisted_OmitSettings_4.validateObjectValidator.bind(hoisted_OmitSettings_4),
    "level": hoisted_OmitSettings_8.validateAnyOfConstsDecoder.bind(hoisted_OmitSettings_8)
};
const hoisted_OmitSettings_10 = {
    "d": hoisted_OmitSettings_7.schemaObjectSchema.bind(hoisted_OmitSettings_7),
    "level": hoisted_OmitSettings_8.schemaAnyOfConstsDecoder.bind(hoisted_OmitSettings_8)
};
const hoisted_OmitSettings_11 = null;
const hoisted_OmitSettings_12 = new ObjectValidator(hoisted_OmitSettings_9, hoisted_OmitSettings_11);
const hoisted_OmitSettings_13 = new ObjectParser({
    "d": hoisted_OmitSettings_5.parseObjectParser.bind(hoisted_OmitSettings_5),
    "level": hoisted_OmitSettings_8.parseAnyOfConstsDecoder.bind(hoisted_OmitSettings_8)
}, null);
const hoisted_OmitSettings_14 = new ObjectReporter(hoisted_OmitSettings_9, hoisted_OmitSettings_11, {
    "d": hoisted_OmitSettings_6.reportObjectReporter.bind(hoisted_OmitSettings_6),
    "level": hoisted_OmitSettings_8.reportAnyOfConstsDecoder.bind(hoisted_OmitSettings_8)
}, null);
const hoisted_OmitSettings_15 = new ObjectSchema(hoisted_OmitSettings_10, null);
const hoisted_Settings_0 = new ConstDecoder("d");
const hoisted_Settings_1 = {
    "tag": hoisted_Settings_0.validateConstDecoder.bind(hoisted_Settings_0)
};
const hoisted_Settings_2 = {
    "tag": hoisted_Settings_0.schemaConstDecoder.bind(hoisted_Settings_0)
};
const hoisted_Settings_3 = null;
const hoisted_Settings_4 = new ObjectValidator(hoisted_Settings_1, hoisted_Settings_3);
const hoisted_Settings_5 = new ObjectParser({
    "tag": hoisted_Settings_0.parseConstDecoder.bind(hoisted_Settings_0)
}, null);
const hoisted_Settings_6 = new ObjectReporter(hoisted_Settings_1, hoisted_Settings_3, {
    "tag": hoisted_Settings_0.reportConstDecoder.bind(hoisted_Settings_0)
}, null);
const hoisted_Settings_7 = new ObjectSchema(hoisted_Settings_2, null);
const hoisted_Settings_8 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_Settings_9 = {
    "a": validateString,
    "d": hoisted_Settings_4.validateObjectValidator.bind(hoisted_Settings_4),
    "level": hoisted_Settings_8.validateAnyOfConstsDecoder.bind(hoisted_Settings_8)
};
const hoisted_Settings_10 = {
    "a": schemaString,
    "d": hoisted_Settings_7.schemaObjectSchema.bind(hoisted_Settings_7),
    "level": hoisted_Settings_8.schemaAnyOfConstsDecoder.bind(hoisted_Settings_8)
};
const hoisted_Settings_11 = null;
const hoisted_Settings_12 = new ObjectValidator(hoisted_Settings_9, hoisted_Settings_11);
const hoisted_Settings_13 = new ObjectParser({
    "a": parseIdentity,
    "d": hoisted_Settings_5.parseObjectParser.bind(hoisted_Settings_5),
    "level": hoisted_Settings_8.parseAnyOfConstsDecoder.bind(hoisted_Settings_8)
}, null);
const hoisted_Settings_14 = new ObjectReporter(hoisted_Settings_9, hoisted_Settings_11, {
    "a": reportString,
    "d": hoisted_Settings_6.reportObjectReporter.bind(hoisted_Settings_6),
    "level": hoisted_Settings_8.reportAnyOfConstsDecoder.bind(hoisted_Settings_8)
}, null);
const hoisted_Settings_15 = new ObjectSchema(hoisted_Settings_10, null);
const hoisted_PartialObject_0 = [
    validateNull,
    validateString
];
const hoisted_PartialObject_1 = [
    schemaNull,
    schemaString
];
const hoisted_PartialObject_2 = new AnyOfValidator(hoisted_PartialObject_0);
const hoisted_PartialObject_3 = new AnyOfParser(hoisted_PartialObject_0, [
    parseIdentity,
    parseIdentity
]);
const hoisted_PartialObject_4 = new AnyOfReporter(hoisted_PartialObject_0, [
    reportNull,
    reportString
]);
const hoisted_PartialObject_5 = new AnyOfSchema(hoisted_PartialObject_1);
const hoisted_PartialObject_6 = [
    validateNull,
    validateNumber
];
const hoisted_PartialObject_7 = [
    schemaNull,
    schemaNumber
];
const hoisted_PartialObject_8 = new AnyOfValidator(hoisted_PartialObject_6);
const hoisted_PartialObject_9 = new AnyOfParser(hoisted_PartialObject_6, [
    parseIdentity,
    parseIdentity
]);
const hoisted_PartialObject_10 = new AnyOfReporter(hoisted_PartialObject_6, [
    reportNull,
    reportNumber
]);
const hoisted_PartialObject_11 = new AnyOfSchema(hoisted_PartialObject_7);
const hoisted_PartialObject_12 = {
    "a": hoisted_PartialObject_2.validateAnyOfValidator.bind(hoisted_PartialObject_2),
    "b": hoisted_PartialObject_8.validateAnyOfValidator.bind(hoisted_PartialObject_8)
};
const hoisted_PartialObject_13 = {
    "a": hoisted_PartialObject_5.schemaAnyOfSchema.bind(hoisted_PartialObject_5),
    "b": hoisted_PartialObject_11.schemaAnyOfSchema.bind(hoisted_PartialObject_11)
};
const hoisted_PartialObject_14 = null;
const hoisted_PartialObject_15 = new ObjectValidator(hoisted_PartialObject_12, hoisted_PartialObject_14);
const hoisted_PartialObject_16 = new ObjectParser({
    "a": hoisted_PartialObject_3.parseAnyOfParser.bind(hoisted_PartialObject_3),
    "b": hoisted_PartialObject_9.parseAnyOfParser.bind(hoisted_PartialObject_9)
}, null);
const hoisted_PartialObject_17 = new ObjectReporter(hoisted_PartialObject_12, hoisted_PartialObject_14, {
    "a": hoisted_PartialObject_4.reportAnyOfReporter.bind(hoisted_PartialObject_4),
    "b": hoisted_PartialObject_10.reportAnyOfReporter.bind(hoisted_PartialObject_10)
}, null);
const hoisted_PartialObject_18 = new ObjectSchema(hoisted_PartialObject_13, null);
const hoisted_RequiredPartialObject_0 = {
    "a": validateString,
    "b": validateNumber
};
const hoisted_RequiredPartialObject_1 = {
    "a": schemaString,
    "b": schemaNumber
};
const hoisted_RequiredPartialObject_2 = null;
const hoisted_RequiredPartialObject_3 = new ObjectValidator(hoisted_RequiredPartialObject_0, hoisted_RequiredPartialObject_2);
const hoisted_RequiredPartialObject_4 = new ObjectParser({
    "a": parseIdentity,
    "b": parseIdentity
}, null);
const hoisted_RequiredPartialObject_5 = new ObjectReporter(hoisted_RequiredPartialObject_0, hoisted_RequiredPartialObject_2, {
    "a": reportString,
    "b": reportNumber
}, null);
const hoisted_RequiredPartialObject_6 = new ObjectSchema(hoisted_RequiredPartialObject_1, null);
const hoisted_LevelAndDSettings_0 = new ConstDecoder("d");
const hoisted_LevelAndDSettings_1 = {
    "tag": hoisted_LevelAndDSettings_0.validateConstDecoder.bind(hoisted_LevelAndDSettings_0)
};
const hoisted_LevelAndDSettings_2 = {
    "tag": hoisted_LevelAndDSettings_0.schemaConstDecoder.bind(hoisted_LevelAndDSettings_0)
};
const hoisted_LevelAndDSettings_3 = null;
const hoisted_LevelAndDSettings_4 = new ObjectValidator(hoisted_LevelAndDSettings_1, hoisted_LevelAndDSettings_3);
const hoisted_LevelAndDSettings_5 = new ObjectParser({
    "tag": hoisted_LevelAndDSettings_0.parseConstDecoder.bind(hoisted_LevelAndDSettings_0)
}, null);
const hoisted_LevelAndDSettings_6 = new ObjectReporter(hoisted_LevelAndDSettings_1, hoisted_LevelAndDSettings_3, {
    "tag": hoisted_LevelAndDSettings_0.reportConstDecoder.bind(hoisted_LevelAndDSettings_0)
}, null);
const hoisted_LevelAndDSettings_7 = new ObjectSchema(hoisted_LevelAndDSettings_2, null);
const hoisted_LevelAndDSettings_8 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_LevelAndDSettings_9 = {
    "d": hoisted_LevelAndDSettings_4.validateObjectValidator.bind(hoisted_LevelAndDSettings_4),
    "level": hoisted_LevelAndDSettings_8.validateAnyOfConstsDecoder.bind(hoisted_LevelAndDSettings_8)
};
const hoisted_LevelAndDSettings_10 = {
    "d": hoisted_LevelAndDSettings_7.schemaObjectSchema.bind(hoisted_LevelAndDSettings_7),
    "level": hoisted_LevelAndDSettings_8.schemaAnyOfConstsDecoder.bind(hoisted_LevelAndDSettings_8)
};
const hoisted_LevelAndDSettings_11 = null;
const hoisted_LevelAndDSettings_12 = new ObjectValidator(hoisted_LevelAndDSettings_9, hoisted_LevelAndDSettings_11);
const hoisted_LevelAndDSettings_13 = new ObjectParser({
    "d": hoisted_LevelAndDSettings_5.parseObjectParser.bind(hoisted_LevelAndDSettings_5),
    "level": hoisted_LevelAndDSettings_8.parseAnyOfConstsDecoder.bind(hoisted_LevelAndDSettings_8)
}, null);
const hoisted_LevelAndDSettings_14 = new ObjectReporter(hoisted_LevelAndDSettings_9, hoisted_LevelAndDSettings_11, {
    "d": hoisted_LevelAndDSettings_6.reportObjectReporter.bind(hoisted_LevelAndDSettings_6),
    "level": hoisted_LevelAndDSettings_8.reportAnyOfConstsDecoder.bind(hoisted_LevelAndDSettings_8)
}, null);
const hoisted_LevelAndDSettings_15 = new ObjectSchema(hoisted_LevelAndDSettings_10, null);
const hoisted_PartialSettings_0 = [
    validateNull,
    validateString
];
const hoisted_PartialSettings_1 = [
    schemaNull,
    schemaString
];
const hoisted_PartialSettings_2 = new AnyOfValidator(hoisted_PartialSettings_0);
const hoisted_PartialSettings_3 = new AnyOfParser(hoisted_PartialSettings_0, [
    parseIdentity,
    parseIdentity
]);
const hoisted_PartialSettings_4 = new AnyOfReporter(hoisted_PartialSettings_0, [
    reportNull,
    reportString
]);
const hoisted_PartialSettings_5 = new AnyOfSchema(hoisted_PartialSettings_1);
const hoisted_PartialSettings_6 = new ConstDecoder("d");
const hoisted_PartialSettings_7 = {
    "tag": hoisted_PartialSettings_6.validateConstDecoder.bind(hoisted_PartialSettings_6)
};
const hoisted_PartialSettings_8 = {
    "tag": hoisted_PartialSettings_6.schemaConstDecoder.bind(hoisted_PartialSettings_6)
};
const hoisted_PartialSettings_9 = null;
const hoisted_PartialSettings_10 = new ObjectValidator(hoisted_PartialSettings_7, hoisted_PartialSettings_9);
const hoisted_PartialSettings_11 = new ObjectParser({
    "tag": hoisted_PartialSettings_6.parseConstDecoder.bind(hoisted_PartialSettings_6)
}, null);
const hoisted_PartialSettings_12 = new ObjectReporter(hoisted_PartialSettings_7, hoisted_PartialSettings_9, {
    "tag": hoisted_PartialSettings_6.reportConstDecoder.bind(hoisted_PartialSettings_6)
}, null);
const hoisted_PartialSettings_13 = new ObjectSchema(hoisted_PartialSettings_8, null);
const hoisted_PartialSettings_14 = [
    validateNull,
    hoisted_PartialSettings_10.validateObjectValidator.bind(hoisted_PartialSettings_10)
];
const hoisted_PartialSettings_15 = [
    schemaNull,
    hoisted_PartialSettings_13.schemaObjectSchema.bind(hoisted_PartialSettings_13)
];
const hoisted_PartialSettings_16 = new AnyOfValidator(hoisted_PartialSettings_14);
const hoisted_PartialSettings_17 = new AnyOfParser(hoisted_PartialSettings_14, [
    parseIdentity,
    hoisted_PartialSettings_11.parseObjectParser.bind(hoisted_PartialSettings_11)
]);
const hoisted_PartialSettings_18 = new AnyOfReporter(hoisted_PartialSettings_14, [
    reportNull,
    hoisted_PartialSettings_12.reportObjectReporter.bind(hoisted_PartialSettings_12)
]);
const hoisted_PartialSettings_19 = new AnyOfSchema(hoisted_PartialSettings_15);
const hoisted_PartialSettings_20 = new ConstDecoder("a");
const hoisted_PartialSettings_21 = new ConstDecoder("b");
const hoisted_PartialSettings_22 = [
    validateNull,
    hoisted_PartialSettings_20.validateConstDecoder.bind(hoisted_PartialSettings_20),
    hoisted_PartialSettings_21.validateConstDecoder.bind(hoisted_PartialSettings_21)
];
const hoisted_PartialSettings_23 = [
    schemaNull,
    hoisted_PartialSettings_20.schemaConstDecoder.bind(hoisted_PartialSettings_20),
    hoisted_PartialSettings_21.schemaConstDecoder.bind(hoisted_PartialSettings_21)
];
const hoisted_PartialSettings_24 = new AnyOfValidator(hoisted_PartialSettings_22);
const hoisted_PartialSettings_25 = new AnyOfParser(hoisted_PartialSettings_22, [
    parseIdentity,
    hoisted_PartialSettings_20.parseConstDecoder.bind(hoisted_PartialSettings_20),
    hoisted_PartialSettings_21.parseConstDecoder.bind(hoisted_PartialSettings_21)
]);
const hoisted_PartialSettings_26 = new AnyOfReporter(hoisted_PartialSettings_22, [
    reportNull,
    hoisted_PartialSettings_20.reportConstDecoder.bind(hoisted_PartialSettings_20),
    hoisted_PartialSettings_21.reportConstDecoder.bind(hoisted_PartialSettings_21)
]);
const hoisted_PartialSettings_27 = new AnyOfSchema(hoisted_PartialSettings_23);
const hoisted_PartialSettings_28 = {
    "a": hoisted_PartialSettings_2.validateAnyOfValidator.bind(hoisted_PartialSettings_2),
    "d": hoisted_PartialSettings_16.validateAnyOfValidator.bind(hoisted_PartialSettings_16),
    "level": hoisted_PartialSettings_24.validateAnyOfValidator.bind(hoisted_PartialSettings_24)
};
const hoisted_PartialSettings_29 = {
    "a": hoisted_PartialSettings_5.schemaAnyOfSchema.bind(hoisted_PartialSettings_5),
    "d": hoisted_PartialSettings_19.schemaAnyOfSchema.bind(hoisted_PartialSettings_19),
    "level": hoisted_PartialSettings_27.schemaAnyOfSchema.bind(hoisted_PartialSettings_27)
};
const hoisted_PartialSettings_30 = null;
const hoisted_PartialSettings_31 = new ObjectValidator(hoisted_PartialSettings_28, hoisted_PartialSettings_30);
const hoisted_PartialSettings_32 = new ObjectParser({
    "a": hoisted_PartialSettings_3.parseAnyOfParser.bind(hoisted_PartialSettings_3),
    "d": hoisted_PartialSettings_17.parseAnyOfParser.bind(hoisted_PartialSettings_17),
    "level": hoisted_PartialSettings_25.parseAnyOfParser.bind(hoisted_PartialSettings_25)
}, null);
const hoisted_PartialSettings_33 = new ObjectReporter(hoisted_PartialSettings_28, hoisted_PartialSettings_30, {
    "a": hoisted_PartialSettings_4.reportAnyOfReporter.bind(hoisted_PartialSettings_4),
    "d": hoisted_PartialSettings_18.reportAnyOfReporter.bind(hoisted_PartialSettings_18),
    "level": hoisted_PartialSettings_26.reportAnyOfReporter.bind(hoisted_PartialSettings_26)
}, null);
const hoisted_PartialSettings_34 = new ObjectSchema(hoisted_PartialSettings_29, null);
const hoisted_Extra_0 = {};
const hoisted_Extra_1 = {};
const hoisted_Extra_2 = validateString;
const hoisted_Extra_3 = new ObjectValidator(hoisted_Extra_0, hoisted_Extra_2);
const hoisted_Extra_4 = new ObjectParser({}, parseIdentity);
const hoisted_Extra_5 = new ObjectReporter(hoisted_Extra_0, hoisted_Extra_2, {}, reportString);
const hoisted_Extra_6 = new ObjectSchema(hoisted_Extra_1, schemaString);
const hoisted_AvatarSize_0 = new RegexDecoder(/(\d+(\.\d+)?)(x)(\d+(\.\d+)?)/, "${number}x${number}");
const hoisted_User_0 = validators.User;
const hoisted_User_1 = new ArrayValidator(hoisted_User_0);
const hoisted_User_2 = new ArrayParser(parsers.User);
const hoisted_User_3 = new ArrayReporter(hoisted_User_0, reporters.User);
const hoisted_User_4 = new ArraySchema(schemas.User);
const hoisted_User_5 = {
    "accessLevel": validators.AccessLevel,
    "avatarSize": validators.AvatarSize,
    "extra": validators.Extra,
    "friends": hoisted_User_1.validateArrayValidator.bind(hoisted_User_1),
    "name": validateString
};
const hoisted_User_6 = {
    "accessLevel": schemas.AccessLevel,
    "avatarSize": schemas.AvatarSize,
    "extra": schemas.Extra,
    "friends": hoisted_User_4.schemaArraySchema.bind(hoisted_User_4),
    "name": schemaString
};
const hoisted_User_7 = null;
const hoisted_User_8 = new ObjectValidator(hoisted_User_5, hoisted_User_7);
const hoisted_User_9 = new ObjectParser({
    "accessLevel": parsers.AccessLevel,
    "avatarSize": parsers.AvatarSize,
    "extra": parsers.Extra,
    "friends": hoisted_User_2.parseArrayParser.bind(hoisted_User_2),
    "name": parseIdentity
}, null);
const hoisted_User_10 = new ObjectReporter(hoisted_User_5, hoisted_User_7, {
    "accessLevel": reporters.AccessLevel,
    "avatarSize": reporters.AvatarSize,
    "extra": reporters.Extra,
    "friends": hoisted_User_3.reportArrayReporter.bind(hoisted_User_3),
    "name": reportString
}, null);
const hoisted_User_11 = new ObjectSchema(hoisted_User_6, null);
const hoisted_PublicUser_0 = {
    "accessLevel": validators.AccessLevel,
    "avatarSize": validators.AvatarSize,
    "extra": validators.Extra,
    "name": validateString
};
const hoisted_PublicUser_1 = {
    "accessLevel": schemas.AccessLevel,
    "avatarSize": schemas.AvatarSize,
    "extra": schemas.Extra,
    "name": schemaString
};
const hoisted_PublicUser_2 = null;
const hoisted_PublicUser_3 = new ObjectValidator(hoisted_PublicUser_0, hoisted_PublicUser_2);
const hoisted_PublicUser_4 = new ObjectParser({
    "accessLevel": parsers.AccessLevel,
    "avatarSize": parsers.AvatarSize,
    "extra": parsers.Extra,
    "name": parseIdentity
}, null);
const hoisted_PublicUser_5 = new ObjectReporter(hoisted_PublicUser_0, hoisted_PublicUser_2, {
    "accessLevel": reporters.AccessLevel,
    "avatarSize": reporters.AvatarSize,
    "extra": reporters.Extra,
    "name": reportString
}, null);
const hoisted_PublicUser_6 = new ObjectSchema(hoisted_PublicUser_1, null);
const hoisted_Req_0 = {
    "optional": validateString
};
const hoisted_Req_1 = {
    "optional": schemaString
};
const hoisted_Req_2 = null;
const hoisted_Req_3 = new ObjectValidator(hoisted_Req_0, hoisted_Req_2);
const hoisted_Req_4 = new ObjectParser({
    "optional": parseIdentity
}, null);
const hoisted_Req_5 = new ObjectReporter(hoisted_Req_0, hoisted_Req_2, {
    "optional": reportString
}, null);
const hoisted_Req_6 = new ObjectSchema(hoisted_Req_1, null);
const hoisted_WithOptionals_0 = [
    validateNull,
    validateString
];
const hoisted_WithOptionals_1 = [
    schemaNull,
    schemaString
];
const hoisted_WithOptionals_2 = new AnyOfValidator(hoisted_WithOptionals_0);
const hoisted_WithOptionals_3 = new AnyOfParser(hoisted_WithOptionals_0, [
    parseIdentity,
    parseIdentity
]);
const hoisted_WithOptionals_4 = new AnyOfReporter(hoisted_WithOptionals_0, [
    reportNull,
    reportString
]);
const hoisted_WithOptionals_5 = new AnyOfSchema(hoisted_WithOptionals_1);
const hoisted_WithOptionals_6 = {
    "optional": hoisted_WithOptionals_2.validateAnyOfValidator.bind(hoisted_WithOptionals_2)
};
const hoisted_WithOptionals_7 = {
    "optional": hoisted_WithOptionals_5.schemaAnyOfSchema.bind(hoisted_WithOptionals_5)
};
const hoisted_WithOptionals_8 = null;
const hoisted_WithOptionals_9 = new ObjectValidator(hoisted_WithOptionals_6, hoisted_WithOptionals_8);
const hoisted_WithOptionals_10 = new ObjectParser({
    "optional": hoisted_WithOptionals_3.parseAnyOfParser.bind(hoisted_WithOptionals_3)
}, null);
const hoisted_WithOptionals_11 = new ObjectReporter(hoisted_WithOptionals_6, hoisted_WithOptionals_8, {
    "optional": hoisted_WithOptionals_4.reportAnyOfReporter.bind(hoisted_WithOptionals_4)
}, null);
const hoisted_WithOptionals_12 = new ObjectSchema(hoisted_WithOptionals_7, null);
const hoisted_Repro1_0 = [
    validateNull,
    validators.Repro2
];
const hoisted_Repro1_1 = [
    schemaNull,
    schemas.Repro2
];
const hoisted_Repro1_2 = new AnyOfValidator(hoisted_Repro1_0);
const hoisted_Repro1_3 = new AnyOfParser(hoisted_Repro1_0, [
    parseIdentity,
    parsers.Repro2
]);
const hoisted_Repro1_4 = new AnyOfReporter(hoisted_Repro1_0, [
    reportNull,
    reporters.Repro2
]);
const hoisted_Repro1_5 = new AnyOfSchema(hoisted_Repro1_1);
const hoisted_Repro1_6 = {
    "sizes": hoisted_Repro1_2.validateAnyOfValidator.bind(hoisted_Repro1_2)
};
const hoisted_Repro1_7 = {
    "sizes": hoisted_Repro1_5.schemaAnyOfSchema.bind(hoisted_Repro1_5)
};
const hoisted_Repro1_8 = null;
const hoisted_Repro1_9 = new ObjectValidator(hoisted_Repro1_6, hoisted_Repro1_8);
const hoisted_Repro1_10 = new ObjectParser({
    "sizes": hoisted_Repro1_3.parseAnyOfParser.bind(hoisted_Repro1_3)
}, null);
const hoisted_Repro1_11 = new ObjectReporter(hoisted_Repro1_6, hoisted_Repro1_8, {
    "sizes": hoisted_Repro1_4.reportAnyOfReporter.bind(hoisted_Repro1_4)
}, null);
const hoisted_Repro1_12 = new ObjectSchema(hoisted_Repro1_7, null);
const hoisted_Repro2_0 = {
    "useSmallerSizes": validateBoolean
};
const hoisted_Repro2_1 = {
    "useSmallerSizes": schemaBoolean
};
const hoisted_Repro2_2 = null;
const hoisted_Repro2_3 = new ObjectValidator(hoisted_Repro2_0, hoisted_Repro2_2);
const hoisted_Repro2_4 = new ObjectParser({
    "useSmallerSizes": parseIdentity
}, null);
const hoisted_Repro2_5 = new ObjectReporter(hoisted_Repro2_0, hoisted_Repro2_2, {
    "useSmallerSizes": reportBoolean
}, null);
const hoisted_Repro2_6 = new ObjectSchema(hoisted_Repro2_1, null);
const hoisted_SettingsUpdate_0 = new ConstDecoder("d");
const hoisted_SettingsUpdate_1 = {
    "tag": hoisted_SettingsUpdate_0.validateConstDecoder.bind(hoisted_SettingsUpdate_0)
};
const hoisted_SettingsUpdate_2 = {
    "tag": hoisted_SettingsUpdate_0.schemaConstDecoder.bind(hoisted_SettingsUpdate_0)
};
const hoisted_SettingsUpdate_3 = null;
const hoisted_SettingsUpdate_4 = new ObjectValidator(hoisted_SettingsUpdate_1, hoisted_SettingsUpdate_3);
const hoisted_SettingsUpdate_5 = new ObjectParser({
    "tag": hoisted_SettingsUpdate_0.parseConstDecoder.bind(hoisted_SettingsUpdate_0)
}, null);
const hoisted_SettingsUpdate_6 = new ObjectReporter(hoisted_SettingsUpdate_1, hoisted_SettingsUpdate_3, {
    "tag": hoisted_SettingsUpdate_0.reportConstDecoder.bind(hoisted_SettingsUpdate_0)
}, null);
const hoisted_SettingsUpdate_7 = new ObjectSchema(hoisted_SettingsUpdate_2, null);
const hoisted_SettingsUpdate_8 = [
    validateString,
    hoisted_SettingsUpdate_4.validateObjectValidator.bind(hoisted_SettingsUpdate_4)
];
const hoisted_SettingsUpdate_9 = [
    schemaString,
    hoisted_SettingsUpdate_7.schemaObjectSchema.bind(hoisted_SettingsUpdate_7)
];
const hoisted_SettingsUpdate_10 = new AnyOfValidator(hoisted_SettingsUpdate_8);
const hoisted_SettingsUpdate_11 = new AnyOfParser(hoisted_SettingsUpdate_8, [
    parseIdentity,
    hoisted_SettingsUpdate_5.parseObjectParser.bind(hoisted_SettingsUpdate_5)
]);
const hoisted_SettingsUpdate_12 = new AnyOfReporter(hoisted_SettingsUpdate_8, [
    reportString,
    hoisted_SettingsUpdate_6.reportObjectReporter.bind(hoisted_SettingsUpdate_6)
]);
const hoisted_SettingsUpdate_13 = new AnyOfSchema(hoisted_SettingsUpdate_9);
const hoisted_Mapped_0 = new ConstDecoder("a");
const hoisted_Mapped_1 = {
    "value": hoisted_Mapped_0.validateConstDecoder.bind(hoisted_Mapped_0)
};
const hoisted_Mapped_2 = {
    "value": hoisted_Mapped_0.schemaConstDecoder.bind(hoisted_Mapped_0)
};
const hoisted_Mapped_3 = null;
const hoisted_Mapped_4 = new ObjectValidator(hoisted_Mapped_1, hoisted_Mapped_3);
const hoisted_Mapped_5 = new ObjectParser({
    "value": hoisted_Mapped_0.parseConstDecoder.bind(hoisted_Mapped_0)
}, null);
const hoisted_Mapped_6 = new ObjectReporter(hoisted_Mapped_1, hoisted_Mapped_3, {
    "value": hoisted_Mapped_0.reportConstDecoder.bind(hoisted_Mapped_0)
}, null);
const hoisted_Mapped_7 = new ObjectSchema(hoisted_Mapped_2, null);
const hoisted_Mapped_8 = new ConstDecoder("b");
const hoisted_Mapped_9 = {
    "value": hoisted_Mapped_8.validateConstDecoder.bind(hoisted_Mapped_8)
};
const hoisted_Mapped_10 = {
    "value": hoisted_Mapped_8.schemaConstDecoder.bind(hoisted_Mapped_8)
};
const hoisted_Mapped_11 = null;
const hoisted_Mapped_12 = new ObjectValidator(hoisted_Mapped_9, hoisted_Mapped_11);
const hoisted_Mapped_13 = new ObjectParser({
    "value": hoisted_Mapped_8.parseConstDecoder.bind(hoisted_Mapped_8)
}, null);
const hoisted_Mapped_14 = new ObjectReporter(hoisted_Mapped_9, hoisted_Mapped_11, {
    "value": hoisted_Mapped_8.reportConstDecoder.bind(hoisted_Mapped_8)
}, null);
const hoisted_Mapped_15 = new ObjectSchema(hoisted_Mapped_10, null);
const hoisted_Mapped_16 = {
    "a": hoisted_Mapped_4.validateObjectValidator.bind(hoisted_Mapped_4),
    "b": hoisted_Mapped_12.validateObjectValidator.bind(hoisted_Mapped_12)
};
const hoisted_Mapped_17 = {
    "a": hoisted_Mapped_7.schemaObjectSchema.bind(hoisted_Mapped_7),
    "b": hoisted_Mapped_15.schemaObjectSchema.bind(hoisted_Mapped_15)
};
const hoisted_Mapped_18 = null;
const hoisted_Mapped_19 = new ObjectValidator(hoisted_Mapped_16, hoisted_Mapped_18);
const hoisted_Mapped_20 = new ObjectParser({
    "a": hoisted_Mapped_5.parseObjectParser.bind(hoisted_Mapped_5),
    "b": hoisted_Mapped_13.parseObjectParser.bind(hoisted_Mapped_13)
}, null);
const hoisted_Mapped_21 = new ObjectReporter(hoisted_Mapped_16, hoisted_Mapped_18, {
    "a": hoisted_Mapped_6.reportObjectReporter.bind(hoisted_Mapped_6),
    "b": hoisted_Mapped_14.reportObjectReporter.bind(hoisted_Mapped_14)
}, null);
const hoisted_Mapped_22 = new ObjectSchema(hoisted_Mapped_17, null);
const hoisted_MappedOptional_0 = new ConstDecoder("a");
const hoisted_MappedOptional_1 = {
    "value": hoisted_MappedOptional_0.validateConstDecoder.bind(hoisted_MappedOptional_0)
};
const hoisted_MappedOptional_2 = {
    "value": hoisted_MappedOptional_0.schemaConstDecoder.bind(hoisted_MappedOptional_0)
};
const hoisted_MappedOptional_3 = null;
const hoisted_MappedOptional_4 = new ObjectValidator(hoisted_MappedOptional_1, hoisted_MappedOptional_3);
const hoisted_MappedOptional_5 = new ObjectParser({
    "value": hoisted_MappedOptional_0.parseConstDecoder.bind(hoisted_MappedOptional_0)
}, null);
const hoisted_MappedOptional_6 = new ObjectReporter(hoisted_MappedOptional_1, hoisted_MappedOptional_3, {
    "value": hoisted_MappedOptional_0.reportConstDecoder.bind(hoisted_MappedOptional_0)
}, null);
const hoisted_MappedOptional_7 = new ObjectSchema(hoisted_MappedOptional_2, null);
const hoisted_MappedOptional_8 = [
    validateNull,
    hoisted_MappedOptional_4.validateObjectValidator.bind(hoisted_MappedOptional_4)
];
const hoisted_MappedOptional_9 = [
    schemaNull,
    hoisted_MappedOptional_7.schemaObjectSchema.bind(hoisted_MappedOptional_7)
];
const hoisted_MappedOptional_10 = new AnyOfValidator(hoisted_MappedOptional_8);
const hoisted_MappedOptional_11 = new AnyOfParser(hoisted_MappedOptional_8, [
    parseIdentity,
    hoisted_MappedOptional_5.parseObjectParser.bind(hoisted_MappedOptional_5)
]);
const hoisted_MappedOptional_12 = new AnyOfReporter(hoisted_MappedOptional_8, [
    reportNull,
    hoisted_MappedOptional_6.reportObjectReporter.bind(hoisted_MappedOptional_6)
]);
const hoisted_MappedOptional_13 = new AnyOfSchema(hoisted_MappedOptional_9);
const hoisted_MappedOptional_14 = new ConstDecoder("b");
const hoisted_MappedOptional_15 = {
    "value": hoisted_MappedOptional_14.validateConstDecoder.bind(hoisted_MappedOptional_14)
};
const hoisted_MappedOptional_16 = {
    "value": hoisted_MappedOptional_14.schemaConstDecoder.bind(hoisted_MappedOptional_14)
};
const hoisted_MappedOptional_17 = null;
const hoisted_MappedOptional_18 = new ObjectValidator(hoisted_MappedOptional_15, hoisted_MappedOptional_17);
const hoisted_MappedOptional_19 = new ObjectParser({
    "value": hoisted_MappedOptional_14.parseConstDecoder.bind(hoisted_MappedOptional_14)
}, null);
const hoisted_MappedOptional_20 = new ObjectReporter(hoisted_MappedOptional_15, hoisted_MappedOptional_17, {
    "value": hoisted_MappedOptional_14.reportConstDecoder.bind(hoisted_MappedOptional_14)
}, null);
const hoisted_MappedOptional_21 = new ObjectSchema(hoisted_MappedOptional_16, null);
const hoisted_MappedOptional_22 = [
    validateNull,
    hoisted_MappedOptional_18.validateObjectValidator.bind(hoisted_MappedOptional_18)
];
const hoisted_MappedOptional_23 = [
    schemaNull,
    hoisted_MappedOptional_21.schemaObjectSchema.bind(hoisted_MappedOptional_21)
];
const hoisted_MappedOptional_24 = new AnyOfValidator(hoisted_MappedOptional_22);
const hoisted_MappedOptional_25 = new AnyOfParser(hoisted_MappedOptional_22, [
    parseIdentity,
    hoisted_MappedOptional_19.parseObjectParser.bind(hoisted_MappedOptional_19)
]);
const hoisted_MappedOptional_26 = new AnyOfReporter(hoisted_MappedOptional_22, [
    reportNull,
    hoisted_MappedOptional_20.reportObjectReporter.bind(hoisted_MappedOptional_20)
]);
const hoisted_MappedOptional_27 = new AnyOfSchema(hoisted_MappedOptional_23);
const hoisted_MappedOptional_28 = {
    "a": hoisted_MappedOptional_10.validateAnyOfValidator.bind(hoisted_MappedOptional_10),
    "b": hoisted_MappedOptional_24.validateAnyOfValidator.bind(hoisted_MappedOptional_24)
};
const hoisted_MappedOptional_29 = {
    "a": hoisted_MappedOptional_13.schemaAnyOfSchema.bind(hoisted_MappedOptional_13),
    "b": hoisted_MappedOptional_27.schemaAnyOfSchema.bind(hoisted_MappedOptional_27)
};
const hoisted_MappedOptional_30 = null;
const hoisted_MappedOptional_31 = new ObjectValidator(hoisted_MappedOptional_28, hoisted_MappedOptional_30);
const hoisted_MappedOptional_32 = new ObjectParser({
    "a": hoisted_MappedOptional_11.parseAnyOfParser.bind(hoisted_MappedOptional_11),
    "b": hoisted_MappedOptional_25.parseAnyOfParser.bind(hoisted_MappedOptional_25)
}, null);
const hoisted_MappedOptional_33 = new ObjectReporter(hoisted_MappedOptional_28, hoisted_MappedOptional_30, {
    "a": hoisted_MappedOptional_12.reportAnyOfReporter.bind(hoisted_MappedOptional_12),
    "b": hoisted_MappedOptional_26.reportAnyOfReporter.bind(hoisted_MappedOptional_26)
}, null);
const hoisted_MappedOptional_34 = new ObjectSchema(hoisted_MappedOptional_29, null);
const hoisted_DiscriminatedUnion_0 = [
    validateNull,
    validateString
];
const hoisted_DiscriminatedUnion_1 = [
    schemaNull,
    schemaString
];
const hoisted_DiscriminatedUnion_2 = new AnyOfValidator(hoisted_DiscriminatedUnion_0);
const hoisted_DiscriminatedUnion_3 = new AnyOfParser(hoisted_DiscriminatedUnion_0, [
    parseIdentity,
    parseIdentity
]);
const hoisted_DiscriminatedUnion_4 = new AnyOfReporter(hoisted_DiscriminatedUnion_0, [
    reportNull,
    reportString
]);
const hoisted_DiscriminatedUnion_5 = new AnyOfSchema(hoisted_DiscriminatedUnion_1);
const hoisted_DiscriminatedUnion_6 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion_7 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion_8 = {
    "a1": validateString,
    "a11": hoisted_DiscriminatedUnion_2.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion_2),
    "subType": hoisted_DiscriminatedUnion_6.validateConstDecoder.bind(hoisted_DiscriminatedUnion_6),
    "type": hoisted_DiscriminatedUnion_7.validateConstDecoder.bind(hoisted_DiscriminatedUnion_7)
};
const hoisted_DiscriminatedUnion_9 = {
    "a1": schemaString,
    "a11": hoisted_DiscriminatedUnion_5.schemaAnyOfSchema.bind(hoisted_DiscriminatedUnion_5),
    "subType": hoisted_DiscriminatedUnion_6.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_6),
    "type": hoisted_DiscriminatedUnion_7.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_7)
};
const hoisted_DiscriminatedUnion_10 = null;
const hoisted_DiscriminatedUnion_11 = new ObjectValidator(hoisted_DiscriminatedUnion_8, hoisted_DiscriminatedUnion_10);
const hoisted_DiscriminatedUnion_12 = new ObjectParser({
    "a1": parseIdentity,
    "a11": hoisted_DiscriminatedUnion_3.parseAnyOfParser.bind(hoisted_DiscriminatedUnion_3),
    "subType": hoisted_DiscriminatedUnion_6.parseConstDecoder.bind(hoisted_DiscriminatedUnion_6),
    "type": hoisted_DiscriminatedUnion_7.parseConstDecoder.bind(hoisted_DiscriminatedUnion_7)
}, null);
const hoisted_DiscriminatedUnion_13 = new ObjectReporter(hoisted_DiscriminatedUnion_8, hoisted_DiscriminatedUnion_10, {
    "a1": reportString,
    "a11": hoisted_DiscriminatedUnion_4.reportAnyOfReporter.bind(hoisted_DiscriminatedUnion_4),
    "subType": hoisted_DiscriminatedUnion_6.reportConstDecoder.bind(hoisted_DiscriminatedUnion_6),
    "type": hoisted_DiscriminatedUnion_7.reportConstDecoder.bind(hoisted_DiscriminatedUnion_7)
}, null);
const hoisted_DiscriminatedUnion_14 = new ObjectSchema(hoisted_DiscriminatedUnion_9, null);
const hoisted_DiscriminatedUnion_15 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion_16 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion_17 = {
    "a2": validateString,
    "subType": hoisted_DiscriminatedUnion_15.validateConstDecoder.bind(hoisted_DiscriminatedUnion_15),
    "type": hoisted_DiscriminatedUnion_16.validateConstDecoder.bind(hoisted_DiscriminatedUnion_16)
};
const hoisted_DiscriminatedUnion_18 = {
    "a2": schemaString,
    "subType": hoisted_DiscriminatedUnion_15.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_15),
    "type": hoisted_DiscriminatedUnion_16.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_16)
};
const hoisted_DiscriminatedUnion_19 = null;
const hoisted_DiscriminatedUnion_20 = new ObjectValidator(hoisted_DiscriminatedUnion_17, hoisted_DiscriminatedUnion_19);
const hoisted_DiscriminatedUnion_21 = new ObjectParser({
    "a2": parseIdentity,
    "subType": hoisted_DiscriminatedUnion_15.parseConstDecoder.bind(hoisted_DiscriminatedUnion_15),
    "type": hoisted_DiscriminatedUnion_16.parseConstDecoder.bind(hoisted_DiscriminatedUnion_16)
}, null);
const hoisted_DiscriminatedUnion_22 = new ObjectReporter(hoisted_DiscriminatedUnion_17, hoisted_DiscriminatedUnion_19, {
    "a2": reportString,
    "subType": hoisted_DiscriminatedUnion_15.reportConstDecoder.bind(hoisted_DiscriminatedUnion_15),
    "type": hoisted_DiscriminatedUnion_16.reportConstDecoder.bind(hoisted_DiscriminatedUnion_16)
}, null);
const hoisted_DiscriminatedUnion_23 = new ObjectSchema(hoisted_DiscriminatedUnion_18, null);
const hoisted_DiscriminatedUnion_24 = [
    validateNull,
    validateString
];
const hoisted_DiscriminatedUnion_25 = [
    schemaNull,
    schemaString
];
const hoisted_DiscriminatedUnion_26 = new AnyOfValidator(hoisted_DiscriminatedUnion_24);
const hoisted_DiscriminatedUnion_27 = new AnyOfParser(hoisted_DiscriminatedUnion_24, [
    parseIdentity,
    parseIdentity
]);
const hoisted_DiscriminatedUnion_28 = new AnyOfReporter(hoisted_DiscriminatedUnion_24, [
    reportNull,
    reportString
]);
const hoisted_DiscriminatedUnion_29 = new AnyOfSchema(hoisted_DiscriminatedUnion_25);
const hoisted_DiscriminatedUnion_30 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion_31 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion_32 = {
    "a1": validateString,
    "a11": hoisted_DiscriminatedUnion_26.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion_26),
    "subType": hoisted_DiscriminatedUnion_30.validateConstDecoder.bind(hoisted_DiscriminatedUnion_30),
    "type": hoisted_DiscriminatedUnion_31.validateConstDecoder.bind(hoisted_DiscriminatedUnion_31)
};
const hoisted_DiscriminatedUnion_33 = {
    "a1": schemaString,
    "a11": hoisted_DiscriminatedUnion_29.schemaAnyOfSchema.bind(hoisted_DiscriminatedUnion_29),
    "subType": hoisted_DiscriminatedUnion_30.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_30),
    "type": hoisted_DiscriminatedUnion_31.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_31)
};
const hoisted_DiscriminatedUnion_34 = null;
const hoisted_DiscriminatedUnion_35 = new ObjectValidator(hoisted_DiscriminatedUnion_32, hoisted_DiscriminatedUnion_34);
const hoisted_DiscriminatedUnion_36 = new ObjectParser({
    "a1": parseIdentity,
    "a11": hoisted_DiscriminatedUnion_27.parseAnyOfParser.bind(hoisted_DiscriminatedUnion_27),
    "subType": hoisted_DiscriminatedUnion_30.parseConstDecoder.bind(hoisted_DiscriminatedUnion_30),
    "type": hoisted_DiscriminatedUnion_31.parseConstDecoder.bind(hoisted_DiscriminatedUnion_31)
}, null);
const hoisted_DiscriminatedUnion_37 = new ObjectReporter(hoisted_DiscriminatedUnion_32, hoisted_DiscriminatedUnion_34, {
    "a1": reportString,
    "a11": hoisted_DiscriminatedUnion_28.reportAnyOfReporter.bind(hoisted_DiscriminatedUnion_28),
    "subType": hoisted_DiscriminatedUnion_30.reportConstDecoder.bind(hoisted_DiscriminatedUnion_30),
    "type": hoisted_DiscriminatedUnion_31.reportConstDecoder.bind(hoisted_DiscriminatedUnion_31)
}, null);
const hoisted_DiscriminatedUnion_38 = new ObjectSchema(hoisted_DiscriminatedUnion_33, null);
const hoisted_DiscriminatedUnion_39 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion_40 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion_41 = {
    "a2": validateString,
    "subType": hoisted_DiscriminatedUnion_39.validateConstDecoder.bind(hoisted_DiscriminatedUnion_39),
    "type": hoisted_DiscriminatedUnion_40.validateConstDecoder.bind(hoisted_DiscriminatedUnion_40)
};
const hoisted_DiscriminatedUnion_42 = {
    "a2": schemaString,
    "subType": hoisted_DiscriminatedUnion_39.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_39),
    "type": hoisted_DiscriminatedUnion_40.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_40)
};
const hoisted_DiscriminatedUnion_43 = null;
const hoisted_DiscriminatedUnion_44 = new ObjectValidator(hoisted_DiscriminatedUnion_41, hoisted_DiscriminatedUnion_43);
const hoisted_DiscriminatedUnion_45 = new ObjectParser({
    "a2": parseIdentity,
    "subType": hoisted_DiscriminatedUnion_39.parseConstDecoder.bind(hoisted_DiscriminatedUnion_39),
    "type": hoisted_DiscriminatedUnion_40.parseConstDecoder.bind(hoisted_DiscriminatedUnion_40)
}, null);
const hoisted_DiscriminatedUnion_46 = new ObjectReporter(hoisted_DiscriminatedUnion_41, hoisted_DiscriminatedUnion_43, {
    "a2": reportString,
    "subType": hoisted_DiscriminatedUnion_39.reportConstDecoder.bind(hoisted_DiscriminatedUnion_39),
    "type": hoisted_DiscriminatedUnion_40.reportConstDecoder.bind(hoisted_DiscriminatedUnion_40)
}, null);
const hoisted_DiscriminatedUnion_47 = new ObjectSchema(hoisted_DiscriminatedUnion_42, null);
const hoisted_DiscriminatedUnion_48 = new AnyOfDiscriminatedValidator("subType", {
    "a1": hoisted_DiscriminatedUnion_11.validateObjectValidator.bind(hoisted_DiscriminatedUnion_11),
    "a2": hoisted_DiscriminatedUnion_20.validateObjectValidator.bind(hoisted_DiscriminatedUnion_20)
});
const hoisted_DiscriminatedUnion_49 = new AnyOfDiscriminatedParser("subType", {
    "a1": hoisted_DiscriminatedUnion_12.parseObjectParser.bind(hoisted_DiscriminatedUnion_12),
    "a2": hoisted_DiscriminatedUnion_21.parseObjectParser.bind(hoisted_DiscriminatedUnion_21)
});
const hoisted_DiscriminatedUnion_50 = new AnyOfDiscriminatedReporter("subType", {
    "a1": hoisted_DiscriminatedUnion_13.reportObjectReporter.bind(hoisted_DiscriminatedUnion_13),
    "a2": hoisted_DiscriminatedUnion_22.reportObjectReporter.bind(hoisted_DiscriminatedUnion_22)
});
const hoisted_DiscriminatedUnion_51 = new AnyOfDiscriminatedSchema([
    hoisted_DiscriminatedUnion_38.schemaObjectSchema.bind(hoisted_DiscriminatedUnion_38),
    hoisted_DiscriminatedUnion_47.schemaObjectSchema.bind(hoisted_DiscriminatedUnion_47)
]);
const hoisted_DiscriminatedUnion_52 = new ConstDecoder("b");
const hoisted_DiscriminatedUnion_53 = {
    "type": hoisted_DiscriminatedUnion_52.validateConstDecoder.bind(hoisted_DiscriminatedUnion_52),
    "value": validateNumber
};
const hoisted_DiscriminatedUnion_54 = {
    "type": hoisted_DiscriminatedUnion_52.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_52),
    "value": schemaNumber
};
const hoisted_DiscriminatedUnion_55 = null;
const hoisted_DiscriminatedUnion_56 = new ObjectValidator(hoisted_DiscriminatedUnion_53, hoisted_DiscriminatedUnion_55);
const hoisted_DiscriminatedUnion_57 = new ObjectParser({
    "type": hoisted_DiscriminatedUnion_52.parseConstDecoder.bind(hoisted_DiscriminatedUnion_52),
    "value": parseIdentity
}, null);
const hoisted_DiscriminatedUnion_58 = new ObjectReporter(hoisted_DiscriminatedUnion_53, hoisted_DiscriminatedUnion_55, {
    "type": hoisted_DiscriminatedUnion_52.reportConstDecoder.bind(hoisted_DiscriminatedUnion_52),
    "value": reportNumber
}, null);
const hoisted_DiscriminatedUnion_59 = new ObjectSchema(hoisted_DiscriminatedUnion_54, null);
const hoisted_DiscriminatedUnion_60 = [
    validateNull,
    validateString
];
const hoisted_DiscriminatedUnion_61 = [
    schemaNull,
    schemaString
];
const hoisted_DiscriminatedUnion_62 = new AnyOfValidator(hoisted_DiscriminatedUnion_60);
const hoisted_DiscriminatedUnion_63 = new AnyOfParser(hoisted_DiscriminatedUnion_60, [
    parseIdentity,
    parseIdentity
]);
const hoisted_DiscriminatedUnion_64 = new AnyOfReporter(hoisted_DiscriminatedUnion_60, [
    reportNull,
    reportString
]);
const hoisted_DiscriminatedUnion_65 = new AnyOfSchema(hoisted_DiscriminatedUnion_61);
const hoisted_DiscriminatedUnion_66 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion_67 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion_68 = {
    "a1": validateString,
    "a11": hoisted_DiscriminatedUnion_62.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion_62),
    "subType": hoisted_DiscriminatedUnion_66.validateConstDecoder.bind(hoisted_DiscriminatedUnion_66),
    "type": hoisted_DiscriminatedUnion_67.validateConstDecoder.bind(hoisted_DiscriminatedUnion_67)
};
const hoisted_DiscriminatedUnion_69 = {
    "a1": schemaString,
    "a11": hoisted_DiscriminatedUnion_65.schemaAnyOfSchema.bind(hoisted_DiscriminatedUnion_65),
    "subType": hoisted_DiscriminatedUnion_66.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_66),
    "type": hoisted_DiscriminatedUnion_67.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_67)
};
const hoisted_DiscriminatedUnion_70 = null;
const hoisted_DiscriminatedUnion_71 = new ObjectValidator(hoisted_DiscriminatedUnion_68, hoisted_DiscriminatedUnion_70);
const hoisted_DiscriminatedUnion_72 = new ObjectParser({
    "a1": parseIdentity,
    "a11": hoisted_DiscriminatedUnion_63.parseAnyOfParser.bind(hoisted_DiscriminatedUnion_63),
    "subType": hoisted_DiscriminatedUnion_66.parseConstDecoder.bind(hoisted_DiscriminatedUnion_66),
    "type": hoisted_DiscriminatedUnion_67.parseConstDecoder.bind(hoisted_DiscriminatedUnion_67)
}, null);
const hoisted_DiscriminatedUnion_73 = new ObjectReporter(hoisted_DiscriminatedUnion_68, hoisted_DiscriminatedUnion_70, {
    "a1": reportString,
    "a11": hoisted_DiscriminatedUnion_64.reportAnyOfReporter.bind(hoisted_DiscriminatedUnion_64),
    "subType": hoisted_DiscriminatedUnion_66.reportConstDecoder.bind(hoisted_DiscriminatedUnion_66),
    "type": hoisted_DiscriminatedUnion_67.reportConstDecoder.bind(hoisted_DiscriminatedUnion_67)
}, null);
const hoisted_DiscriminatedUnion_74 = new ObjectSchema(hoisted_DiscriminatedUnion_69, null);
const hoisted_DiscriminatedUnion_75 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion_76 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion_77 = {
    "a2": validateString,
    "subType": hoisted_DiscriminatedUnion_75.validateConstDecoder.bind(hoisted_DiscriminatedUnion_75),
    "type": hoisted_DiscriminatedUnion_76.validateConstDecoder.bind(hoisted_DiscriminatedUnion_76)
};
const hoisted_DiscriminatedUnion_78 = {
    "a2": schemaString,
    "subType": hoisted_DiscriminatedUnion_75.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_75),
    "type": hoisted_DiscriminatedUnion_76.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_76)
};
const hoisted_DiscriminatedUnion_79 = null;
const hoisted_DiscriminatedUnion_80 = new ObjectValidator(hoisted_DiscriminatedUnion_77, hoisted_DiscriminatedUnion_79);
const hoisted_DiscriminatedUnion_81 = new ObjectParser({
    "a2": parseIdentity,
    "subType": hoisted_DiscriminatedUnion_75.parseConstDecoder.bind(hoisted_DiscriminatedUnion_75),
    "type": hoisted_DiscriminatedUnion_76.parseConstDecoder.bind(hoisted_DiscriminatedUnion_76)
}, null);
const hoisted_DiscriminatedUnion_82 = new ObjectReporter(hoisted_DiscriminatedUnion_77, hoisted_DiscriminatedUnion_79, {
    "a2": reportString,
    "subType": hoisted_DiscriminatedUnion_75.reportConstDecoder.bind(hoisted_DiscriminatedUnion_75),
    "type": hoisted_DiscriminatedUnion_76.reportConstDecoder.bind(hoisted_DiscriminatedUnion_76)
}, null);
const hoisted_DiscriminatedUnion_83 = new ObjectSchema(hoisted_DiscriminatedUnion_78, null);
const hoisted_DiscriminatedUnion_84 = new ConstDecoder("b");
const hoisted_DiscriminatedUnion_85 = {
    "type": hoisted_DiscriminatedUnion_84.validateConstDecoder.bind(hoisted_DiscriminatedUnion_84),
    "value": validateNumber
};
const hoisted_DiscriminatedUnion_86 = {
    "type": hoisted_DiscriminatedUnion_84.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_84),
    "value": schemaNumber
};
const hoisted_DiscriminatedUnion_87 = null;
const hoisted_DiscriminatedUnion_88 = new ObjectValidator(hoisted_DiscriminatedUnion_85, hoisted_DiscriminatedUnion_87);
const hoisted_DiscriminatedUnion_89 = new ObjectParser({
    "type": hoisted_DiscriminatedUnion_84.parseConstDecoder.bind(hoisted_DiscriminatedUnion_84),
    "value": parseIdentity
}, null);
const hoisted_DiscriminatedUnion_90 = new ObjectReporter(hoisted_DiscriminatedUnion_85, hoisted_DiscriminatedUnion_87, {
    "type": hoisted_DiscriminatedUnion_84.reportConstDecoder.bind(hoisted_DiscriminatedUnion_84),
    "value": reportNumber
}, null);
const hoisted_DiscriminatedUnion_91 = new ObjectSchema(hoisted_DiscriminatedUnion_86, null);
const hoisted_DiscriminatedUnion_92 = new AnyOfDiscriminatedValidator("type", {
    "a": hoisted_DiscriminatedUnion_48.validateAnyOfDiscriminatedValidator.bind(hoisted_DiscriminatedUnion_48),
    "b": hoisted_DiscriminatedUnion_56.validateObjectValidator.bind(hoisted_DiscriminatedUnion_56)
});
const hoisted_DiscriminatedUnion_93 = new AnyOfDiscriminatedParser("type", {
    "a": hoisted_DiscriminatedUnion_49.parseAnyOfDiscriminatedParser.bind(hoisted_DiscriminatedUnion_49),
    "b": hoisted_DiscriminatedUnion_57.parseObjectParser.bind(hoisted_DiscriminatedUnion_57)
});
const hoisted_DiscriminatedUnion_94 = new AnyOfDiscriminatedReporter("type", {
    "a": hoisted_DiscriminatedUnion_50.reportAnyOfDiscriminatedReporter.bind(hoisted_DiscriminatedUnion_50),
    "b": hoisted_DiscriminatedUnion_58.reportObjectReporter.bind(hoisted_DiscriminatedUnion_58)
});
const hoisted_DiscriminatedUnion_95 = new AnyOfDiscriminatedSchema([
    hoisted_DiscriminatedUnion_74.schemaObjectSchema.bind(hoisted_DiscriminatedUnion_74),
    hoisted_DiscriminatedUnion_83.schemaObjectSchema.bind(hoisted_DiscriminatedUnion_83),
    hoisted_DiscriminatedUnion_91.schemaObjectSchema.bind(hoisted_DiscriminatedUnion_91)
]);
const hoisted_DiscriminatedUnion2_0 = [
    validateNull,
    validateString
];
const hoisted_DiscriminatedUnion2_1 = [
    schemaNull,
    schemaString
];
const hoisted_DiscriminatedUnion2_2 = new AnyOfValidator(hoisted_DiscriminatedUnion2_0);
const hoisted_DiscriminatedUnion2_3 = new AnyOfParser(hoisted_DiscriminatedUnion2_0, [
    parseIdentity,
    parseIdentity
]);
const hoisted_DiscriminatedUnion2_4 = new AnyOfReporter(hoisted_DiscriminatedUnion2_0, [
    reportNull,
    reportString
]);
const hoisted_DiscriminatedUnion2_5 = new AnyOfSchema(hoisted_DiscriminatedUnion2_1);
const hoisted_DiscriminatedUnion2_6 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion2_7 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion2_8 = {
    "a1": validateString,
    "a11": hoisted_DiscriminatedUnion2_2.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion2_2),
    "subType": hoisted_DiscriminatedUnion2_6.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_6),
    "type": hoisted_DiscriminatedUnion2_7.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_7)
};
const hoisted_DiscriminatedUnion2_9 = {
    "a1": schemaString,
    "a11": hoisted_DiscriminatedUnion2_5.schemaAnyOfSchema.bind(hoisted_DiscriminatedUnion2_5),
    "subType": hoisted_DiscriminatedUnion2_6.schemaConstDecoder.bind(hoisted_DiscriminatedUnion2_6),
    "type": hoisted_DiscriminatedUnion2_7.schemaConstDecoder.bind(hoisted_DiscriminatedUnion2_7)
};
const hoisted_DiscriminatedUnion2_10 = null;
const hoisted_DiscriminatedUnion2_11 = new ObjectValidator(hoisted_DiscriminatedUnion2_8, hoisted_DiscriminatedUnion2_10);
const hoisted_DiscriminatedUnion2_12 = new ObjectParser({
    "a1": parseIdentity,
    "a11": hoisted_DiscriminatedUnion2_3.parseAnyOfParser.bind(hoisted_DiscriminatedUnion2_3),
    "subType": hoisted_DiscriminatedUnion2_6.parseConstDecoder.bind(hoisted_DiscriminatedUnion2_6),
    "type": hoisted_DiscriminatedUnion2_7.parseConstDecoder.bind(hoisted_DiscriminatedUnion2_7)
}, null);
const hoisted_DiscriminatedUnion2_13 = new ObjectReporter(hoisted_DiscriminatedUnion2_8, hoisted_DiscriminatedUnion2_10, {
    "a1": reportString,
    "a11": hoisted_DiscriminatedUnion2_4.reportAnyOfReporter.bind(hoisted_DiscriminatedUnion2_4),
    "subType": hoisted_DiscriminatedUnion2_6.reportConstDecoder.bind(hoisted_DiscriminatedUnion2_6),
    "type": hoisted_DiscriminatedUnion2_7.reportConstDecoder.bind(hoisted_DiscriminatedUnion2_7)
}, null);
const hoisted_DiscriminatedUnion2_14 = new ObjectSchema(hoisted_DiscriminatedUnion2_9, null);
const hoisted_DiscriminatedUnion2_15 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion2_16 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion2_17 = {
    "a2": validateString,
    "subType": hoisted_DiscriminatedUnion2_15.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_15),
    "type": hoisted_DiscriminatedUnion2_16.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_16)
};
const hoisted_DiscriminatedUnion2_18 = {
    "a2": schemaString,
    "subType": hoisted_DiscriminatedUnion2_15.schemaConstDecoder.bind(hoisted_DiscriminatedUnion2_15),
    "type": hoisted_DiscriminatedUnion2_16.schemaConstDecoder.bind(hoisted_DiscriminatedUnion2_16)
};
const hoisted_DiscriminatedUnion2_19 = null;
const hoisted_DiscriminatedUnion2_20 = new ObjectValidator(hoisted_DiscriminatedUnion2_17, hoisted_DiscriminatedUnion2_19);
const hoisted_DiscriminatedUnion2_21 = new ObjectParser({
    "a2": parseIdentity,
    "subType": hoisted_DiscriminatedUnion2_15.parseConstDecoder.bind(hoisted_DiscriminatedUnion2_15),
    "type": hoisted_DiscriminatedUnion2_16.parseConstDecoder.bind(hoisted_DiscriminatedUnion2_16)
}, null);
const hoisted_DiscriminatedUnion2_22 = new ObjectReporter(hoisted_DiscriminatedUnion2_17, hoisted_DiscriminatedUnion2_19, {
    "a2": reportString,
    "subType": hoisted_DiscriminatedUnion2_15.reportConstDecoder.bind(hoisted_DiscriminatedUnion2_15),
    "type": hoisted_DiscriminatedUnion2_16.reportConstDecoder.bind(hoisted_DiscriminatedUnion2_16)
}, null);
const hoisted_DiscriminatedUnion2_23 = new ObjectSchema(hoisted_DiscriminatedUnion2_18, null);
const hoisted_DiscriminatedUnion2_24 = new ConstDecoder("d");
const hoisted_DiscriminatedUnion2_25 = [
    validateNull,
    hoisted_DiscriminatedUnion2_24.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_24)
];
const hoisted_DiscriminatedUnion2_26 = [
    schemaNull,
    hoisted_DiscriminatedUnion2_24.schemaConstDecoder.bind(hoisted_DiscriminatedUnion2_24)
];
const hoisted_DiscriminatedUnion2_27 = new AnyOfValidator(hoisted_DiscriminatedUnion2_25);
const hoisted_DiscriminatedUnion2_28 = new AnyOfParser(hoisted_DiscriminatedUnion2_25, [
    parseIdentity,
    hoisted_DiscriminatedUnion2_24.parseConstDecoder.bind(hoisted_DiscriminatedUnion2_24)
]);
const hoisted_DiscriminatedUnion2_29 = new AnyOfReporter(hoisted_DiscriminatedUnion2_25, [
    reportNull,
    hoisted_DiscriminatedUnion2_24.reportConstDecoder.bind(hoisted_DiscriminatedUnion2_24)
]);
const hoisted_DiscriminatedUnion2_30 = new AnyOfSchema(hoisted_DiscriminatedUnion2_26);
const hoisted_DiscriminatedUnion2_31 = {
    "type": hoisted_DiscriminatedUnion2_27.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion2_27),
    "valueD": validateNumber
};
const hoisted_DiscriminatedUnion2_32 = {
    "type": hoisted_DiscriminatedUnion2_30.schemaAnyOfSchema.bind(hoisted_DiscriminatedUnion2_30),
    "valueD": schemaNumber
};
const hoisted_DiscriminatedUnion2_33 = null;
const hoisted_DiscriminatedUnion2_34 = new ObjectValidator(hoisted_DiscriminatedUnion2_31, hoisted_DiscriminatedUnion2_33);
const hoisted_DiscriminatedUnion2_35 = new ObjectParser({
    "type": hoisted_DiscriminatedUnion2_28.parseAnyOfParser.bind(hoisted_DiscriminatedUnion2_28),
    "valueD": parseIdentity
}, null);
const hoisted_DiscriminatedUnion2_36 = new ObjectReporter(hoisted_DiscriminatedUnion2_31, hoisted_DiscriminatedUnion2_33, {
    "type": hoisted_DiscriminatedUnion2_29.reportAnyOfReporter.bind(hoisted_DiscriminatedUnion2_29),
    "valueD": reportNumber
}, null);
const hoisted_DiscriminatedUnion2_37 = new ObjectSchema(hoisted_DiscriminatedUnion2_32, null);
const hoisted_DiscriminatedUnion2_38 = new ConstDecoder("b");
const hoisted_DiscriminatedUnion2_39 = {
    "type": hoisted_DiscriminatedUnion2_38.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_38),
    "value": validateNumber
};
const hoisted_DiscriminatedUnion2_40 = {
    "type": hoisted_DiscriminatedUnion2_38.schemaConstDecoder.bind(hoisted_DiscriminatedUnion2_38),
    "value": schemaNumber
};
const hoisted_DiscriminatedUnion2_41 = null;
const hoisted_DiscriminatedUnion2_42 = new ObjectValidator(hoisted_DiscriminatedUnion2_39, hoisted_DiscriminatedUnion2_41);
const hoisted_DiscriminatedUnion2_43 = new ObjectParser({
    "type": hoisted_DiscriminatedUnion2_38.parseConstDecoder.bind(hoisted_DiscriminatedUnion2_38),
    "value": parseIdentity
}, null);
const hoisted_DiscriminatedUnion2_44 = new ObjectReporter(hoisted_DiscriminatedUnion2_39, hoisted_DiscriminatedUnion2_41, {
    "type": hoisted_DiscriminatedUnion2_38.reportConstDecoder.bind(hoisted_DiscriminatedUnion2_38),
    "value": reportNumber
}, null);
const hoisted_DiscriminatedUnion2_45 = new ObjectSchema(hoisted_DiscriminatedUnion2_40, null);
const hoisted_DiscriminatedUnion2_46 = [
    hoisted_DiscriminatedUnion2_11.validateObjectValidator.bind(hoisted_DiscriminatedUnion2_11),
    hoisted_DiscriminatedUnion2_20.validateObjectValidator.bind(hoisted_DiscriminatedUnion2_20),
    hoisted_DiscriminatedUnion2_34.validateObjectValidator.bind(hoisted_DiscriminatedUnion2_34),
    hoisted_DiscriminatedUnion2_42.validateObjectValidator.bind(hoisted_DiscriminatedUnion2_42)
];
const hoisted_DiscriminatedUnion2_47 = [
    hoisted_DiscriminatedUnion2_14.schemaObjectSchema.bind(hoisted_DiscriminatedUnion2_14),
    hoisted_DiscriminatedUnion2_23.schemaObjectSchema.bind(hoisted_DiscriminatedUnion2_23),
    hoisted_DiscriminatedUnion2_37.schemaObjectSchema.bind(hoisted_DiscriminatedUnion2_37),
    hoisted_DiscriminatedUnion2_45.schemaObjectSchema.bind(hoisted_DiscriminatedUnion2_45)
];
const hoisted_DiscriminatedUnion2_48 = new AnyOfValidator(hoisted_DiscriminatedUnion2_46);
const hoisted_DiscriminatedUnion2_49 = new AnyOfParser(hoisted_DiscriminatedUnion2_46, [
    hoisted_DiscriminatedUnion2_12.parseObjectParser.bind(hoisted_DiscriminatedUnion2_12),
    hoisted_DiscriminatedUnion2_21.parseObjectParser.bind(hoisted_DiscriminatedUnion2_21),
    hoisted_DiscriminatedUnion2_35.parseObjectParser.bind(hoisted_DiscriminatedUnion2_35),
    hoisted_DiscriminatedUnion2_43.parseObjectParser.bind(hoisted_DiscriminatedUnion2_43)
]);
const hoisted_DiscriminatedUnion2_50 = new AnyOfReporter(hoisted_DiscriminatedUnion2_46, [
    hoisted_DiscriminatedUnion2_13.reportObjectReporter.bind(hoisted_DiscriminatedUnion2_13),
    hoisted_DiscriminatedUnion2_22.reportObjectReporter.bind(hoisted_DiscriminatedUnion2_22),
    hoisted_DiscriminatedUnion2_36.reportObjectReporter.bind(hoisted_DiscriminatedUnion2_36),
    hoisted_DiscriminatedUnion2_44.reportObjectReporter.bind(hoisted_DiscriminatedUnion2_44)
]);
const hoisted_DiscriminatedUnion2_51 = new AnyOfSchema(hoisted_DiscriminatedUnion2_47);
const hoisted_DiscriminatedUnion3_0 = new AnyOfConstsDecoder([
    "a",
    "c"
]);
const hoisted_DiscriminatedUnion3_1 = {
    "a1": validateString,
    "type": hoisted_DiscriminatedUnion3_0.validateAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_0)
};
const hoisted_DiscriminatedUnion3_2 = {
    "a1": schemaString,
    "type": hoisted_DiscriminatedUnion3_0.schemaAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_0)
};
const hoisted_DiscriminatedUnion3_3 = null;
const hoisted_DiscriminatedUnion3_4 = new ObjectValidator(hoisted_DiscriminatedUnion3_1, hoisted_DiscriminatedUnion3_3);
const hoisted_DiscriminatedUnion3_5 = new ObjectParser({
    "a1": parseIdentity,
    "type": hoisted_DiscriminatedUnion3_0.parseAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_0)
}, null);
const hoisted_DiscriminatedUnion3_6 = new ObjectReporter(hoisted_DiscriminatedUnion3_1, hoisted_DiscriminatedUnion3_3, {
    "a1": reportString,
    "type": hoisted_DiscriminatedUnion3_0.reportAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_0)
}, null);
const hoisted_DiscriminatedUnion3_7 = new ObjectSchema(hoisted_DiscriminatedUnion3_2, null);
const hoisted_DiscriminatedUnion3_8 = new ConstDecoder("b");
const hoisted_DiscriminatedUnion3_9 = {
    "type": hoisted_DiscriminatedUnion3_8.validateConstDecoder.bind(hoisted_DiscriminatedUnion3_8),
    "value": validateNumber
};
const hoisted_DiscriminatedUnion3_10 = {
    "type": hoisted_DiscriminatedUnion3_8.schemaConstDecoder.bind(hoisted_DiscriminatedUnion3_8),
    "value": schemaNumber
};
const hoisted_DiscriminatedUnion3_11 = null;
const hoisted_DiscriminatedUnion3_12 = new ObjectValidator(hoisted_DiscriminatedUnion3_9, hoisted_DiscriminatedUnion3_11);
const hoisted_DiscriminatedUnion3_13 = new ObjectParser({
    "type": hoisted_DiscriminatedUnion3_8.parseConstDecoder.bind(hoisted_DiscriminatedUnion3_8),
    "value": parseIdentity
}, null);
const hoisted_DiscriminatedUnion3_14 = new ObjectReporter(hoisted_DiscriminatedUnion3_9, hoisted_DiscriminatedUnion3_11, {
    "type": hoisted_DiscriminatedUnion3_8.reportConstDecoder.bind(hoisted_DiscriminatedUnion3_8),
    "value": reportNumber
}, null);
const hoisted_DiscriminatedUnion3_15 = new ObjectSchema(hoisted_DiscriminatedUnion3_10, null);
const hoisted_DiscriminatedUnion3_16 = new AnyOfConstsDecoder([
    "a",
    "c"
]);
const hoisted_DiscriminatedUnion3_17 = {
    "a1": validateString,
    "type": hoisted_DiscriminatedUnion3_16.validateAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_16)
};
const hoisted_DiscriminatedUnion3_18 = {
    "a1": schemaString,
    "type": hoisted_DiscriminatedUnion3_16.schemaAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_16)
};
const hoisted_DiscriminatedUnion3_19 = null;
const hoisted_DiscriminatedUnion3_20 = new ObjectValidator(hoisted_DiscriminatedUnion3_17, hoisted_DiscriminatedUnion3_19);
const hoisted_DiscriminatedUnion3_21 = new ObjectParser({
    "a1": parseIdentity,
    "type": hoisted_DiscriminatedUnion3_16.parseAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_16)
}, null);
const hoisted_DiscriminatedUnion3_22 = new ObjectReporter(hoisted_DiscriminatedUnion3_17, hoisted_DiscriminatedUnion3_19, {
    "a1": reportString,
    "type": hoisted_DiscriminatedUnion3_16.reportAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_16)
}, null);
const hoisted_DiscriminatedUnion3_23 = new ObjectSchema(hoisted_DiscriminatedUnion3_18, null);
const hoisted_DiscriminatedUnion3_24 = new AnyOfConstsDecoder([
    "a",
    "c"
]);
const hoisted_DiscriminatedUnion3_25 = {
    "a1": validateString,
    "type": hoisted_DiscriminatedUnion3_24.validateAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_24)
};
const hoisted_DiscriminatedUnion3_26 = {
    "a1": schemaString,
    "type": hoisted_DiscriminatedUnion3_24.schemaAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_24)
};
const hoisted_DiscriminatedUnion3_27 = null;
const hoisted_DiscriminatedUnion3_28 = new ObjectValidator(hoisted_DiscriminatedUnion3_25, hoisted_DiscriminatedUnion3_27);
const hoisted_DiscriminatedUnion3_29 = new ObjectParser({
    "a1": parseIdentity,
    "type": hoisted_DiscriminatedUnion3_24.parseAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_24)
}, null);
const hoisted_DiscriminatedUnion3_30 = new ObjectReporter(hoisted_DiscriminatedUnion3_25, hoisted_DiscriminatedUnion3_27, {
    "a1": reportString,
    "type": hoisted_DiscriminatedUnion3_24.reportAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_24)
}, null);
const hoisted_DiscriminatedUnion3_31 = new ObjectSchema(hoisted_DiscriminatedUnion3_26, null);
const hoisted_DiscriminatedUnion3_32 = new ConstDecoder("b");
const hoisted_DiscriminatedUnion3_33 = {
    "type": hoisted_DiscriminatedUnion3_32.validateConstDecoder.bind(hoisted_DiscriminatedUnion3_32),
    "value": validateNumber
};
const hoisted_DiscriminatedUnion3_34 = {
    "type": hoisted_DiscriminatedUnion3_32.schemaConstDecoder.bind(hoisted_DiscriminatedUnion3_32),
    "value": schemaNumber
};
const hoisted_DiscriminatedUnion3_35 = null;
const hoisted_DiscriminatedUnion3_36 = new ObjectValidator(hoisted_DiscriminatedUnion3_33, hoisted_DiscriminatedUnion3_35);
const hoisted_DiscriminatedUnion3_37 = new ObjectParser({
    "type": hoisted_DiscriminatedUnion3_32.parseConstDecoder.bind(hoisted_DiscriminatedUnion3_32),
    "value": parseIdentity
}, null);
const hoisted_DiscriminatedUnion3_38 = new ObjectReporter(hoisted_DiscriminatedUnion3_33, hoisted_DiscriminatedUnion3_35, {
    "type": hoisted_DiscriminatedUnion3_32.reportConstDecoder.bind(hoisted_DiscriminatedUnion3_32),
    "value": reportNumber
}, null);
const hoisted_DiscriminatedUnion3_39 = new ObjectSchema(hoisted_DiscriminatedUnion3_34, null);
const hoisted_DiscriminatedUnion3_40 = new AnyOfDiscriminatedValidator("type", {
    "a": hoisted_DiscriminatedUnion3_4.validateObjectValidator.bind(hoisted_DiscriminatedUnion3_4),
    "b": hoisted_DiscriminatedUnion3_12.validateObjectValidator.bind(hoisted_DiscriminatedUnion3_12),
    "c": hoisted_DiscriminatedUnion3_20.validateObjectValidator.bind(hoisted_DiscriminatedUnion3_20)
});
const hoisted_DiscriminatedUnion3_41 = new AnyOfDiscriminatedParser("type", {
    "a": hoisted_DiscriminatedUnion3_5.parseObjectParser.bind(hoisted_DiscriminatedUnion3_5),
    "b": hoisted_DiscriminatedUnion3_13.parseObjectParser.bind(hoisted_DiscriminatedUnion3_13),
    "c": hoisted_DiscriminatedUnion3_21.parseObjectParser.bind(hoisted_DiscriminatedUnion3_21)
});
const hoisted_DiscriminatedUnion3_42 = new AnyOfDiscriminatedReporter("type", {
    "a": hoisted_DiscriminatedUnion3_6.reportObjectReporter.bind(hoisted_DiscriminatedUnion3_6),
    "b": hoisted_DiscriminatedUnion3_14.reportObjectReporter.bind(hoisted_DiscriminatedUnion3_14),
    "c": hoisted_DiscriminatedUnion3_22.reportObjectReporter.bind(hoisted_DiscriminatedUnion3_22)
});
const hoisted_DiscriminatedUnion3_43 = new AnyOfDiscriminatedSchema([
    hoisted_DiscriminatedUnion3_31.schemaObjectSchema.bind(hoisted_DiscriminatedUnion3_31),
    hoisted_DiscriminatedUnion3_39.schemaObjectSchema.bind(hoisted_DiscriminatedUnion3_39)
]);
const hoisted_DiscriminatedUnion4_0 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion4_1 = {
    "a1": validateString,
    "subType": hoisted_DiscriminatedUnion4_0.validateConstDecoder.bind(hoisted_DiscriminatedUnion4_0)
};
const hoisted_DiscriminatedUnion4_2 = {
    "a1": schemaString,
    "subType": hoisted_DiscriminatedUnion4_0.schemaConstDecoder.bind(hoisted_DiscriminatedUnion4_0)
};
const hoisted_DiscriminatedUnion4_3 = null;
const hoisted_DiscriminatedUnion4_4 = new ObjectValidator(hoisted_DiscriminatedUnion4_1, hoisted_DiscriminatedUnion4_3);
const hoisted_DiscriminatedUnion4_5 = new ObjectParser({
    "a1": parseIdentity,
    "subType": hoisted_DiscriminatedUnion4_0.parseConstDecoder.bind(hoisted_DiscriminatedUnion4_0)
}, null);
const hoisted_DiscriminatedUnion4_6 = new ObjectReporter(hoisted_DiscriminatedUnion4_1, hoisted_DiscriminatedUnion4_3, {
    "a1": reportString,
    "subType": hoisted_DiscriminatedUnion4_0.reportConstDecoder.bind(hoisted_DiscriminatedUnion4_0)
}, null);
const hoisted_DiscriminatedUnion4_7 = new ObjectSchema(hoisted_DiscriminatedUnion4_2, null);
const hoisted_DiscriminatedUnion4_8 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion4_9 = {
    "a": hoisted_DiscriminatedUnion4_4.validateObjectValidator.bind(hoisted_DiscriminatedUnion4_4),
    "type": hoisted_DiscriminatedUnion4_8.validateConstDecoder.bind(hoisted_DiscriminatedUnion4_8)
};
const hoisted_DiscriminatedUnion4_10 = {
    "a": hoisted_DiscriminatedUnion4_7.schemaObjectSchema.bind(hoisted_DiscriminatedUnion4_7),
    "type": hoisted_DiscriminatedUnion4_8.schemaConstDecoder.bind(hoisted_DiscriminatedUnion4_8)
};
const hoisted_DiscriminatedUnion4_11 = null;
const hoisted_DiscriminatedUnion4_12 = new ObjectValidator(hoisted_DiscriminatedUnion4_9, hoisted_DiscriminatedUnion4_11);
const hoisted_DiscriminatedUnion4_13 = new ObjectParser({
    "a": hoisted_DiscriminatedUnion4_5.parseObjectParser.bind(hoisted_DiscriminatedUnion4_5),
    "type": hoisted_DiscriminatedUnion4_8.parseConstDecoder.bind(hoisted_DiscriminatedUnion4_8)
}, null);
const hoisted_DiscriminatedUnion4_14 = new ObjectReporter(hoisted_DiscriminatedUnion4_9, hoisted_DiscriminatedUnion4_11, {
    "a": hoisted_DiscriminatedUnion4_6.reportObjectReporter.bind(hoisted_DiscriminatedUnion4_6),
    "type": hoisted_DiscriminatedUnion4_8.reportConstDecoder.bind(hoisted_DiscriminatedUnion4_8)
}, null);
const hoisted_DiscriminatedUnion4_15 = new ObjectSchema(hoisted_DiscriminatedUnion4_10, null);
const hoisted_DiscriminatedUnion4_16 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion4_17 = {
    "a2": validateString,
    "subType": hoisted_DiscriminatedUnion4_16.validateConstDecoder.bind(hoisted_DiscriminatedUnion4_16)
};
const hoisted_DiscriminatedUnion4_18 = {
    "a2": schemaString,
    "subType": hoisted_DiscriminatedUnion4_16.schemaConstDecoder.bind(hoisted_DiscriminatedUnion4_16)
};
const hoisted_DiscriminatedUnion4_19 = null;
const hoisted_DiscriminatedUnion4_20 = new ObjectValidator(hoisted_DiscriminatedUnion4_17, hoisted_DiscriminatedUnion4_19);
const hoisted_DiscriminatedUnion4_21 = new ObjectParser({
    "a2": parseIdentity,
    "subType": hoisted_DiscriminatedUnion4_16.parseConstDecoder.bind(hoisted_DiscriminatedUnion4_16)
}, null);
const hoisted_DiscriminatedUnion4_22 = new ObjectReporter(hoisted_DiscriminatedUnion4_17, hoisted_DiscriminatedUnion4_19, {
    "a2": reportString,
    "subType": hoisted_DiscriminatedUnion4_16.reportConstDecoder.bind(hoisted_DiscriminatedUnion4_16)
}, null);
const hoisted_DiscriminatedUnion4_23 = new ObjectSchema(hoisted_DiscriminatedUnion4_18, null);
const hoisted_DiscriminatedUnion4_24 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion4_25 = {
    "a": hoisted_DiscriminatedUnion4_20.validateObjectValidator.bind(hoisted_DiscriminatedUnion4_20),
    "type": hoisted_DiscriminatedUnion4_24.validateConstDecoder.bind(hoisted_DiscriminatedUnion4_24)
};
const hoisted_DiscriminatedUnion4_26 = {
    "a": hoisted_DiscriminatedUnion4_23.schemaObjectSchema.bind(hoisted_DiscriminatedUnion4_23),
    "type": hoisted_DiscriminatedUnion4_24.schemaConstDecoder.bind(hoisted_DiscriminatedUnion4_24)
};
const hoisted_DiscriminatedUnion4_27 = null;
const hoisted_DiscriminatedUnion4_28 = new ObjectValidator(hoisted_DiscriminatedUnion4_25, hoisted_DiscriminatedUnion4_27);
const hoisted_DiscriminatedUnion4_29 = new ObjectParser({
    "a": hoisted_DiscriminatedUnion4_21.parseObjectParser.bind(hoisted_DiscriminatedUnion4_21),
    "type": hoisted_DiscriminatedUnion4_24.parseConstDecoder.bind(hoisted_DiscriminatedUnion4_24)
}, null);
const hoisted_DiscriminatedUnion4_30 = new ObjectReporter(hoisted_DiscriminatedUnion4_25, hoisted_DiscriminatedUnion4_27, {
    "a": hoisted_DiscriminatedUnion4_22.reportObjectReporter.bind(hoisted_DiscriminatedUnion4_22),
    "type": hoisted_DiscriminatedUnion4_24.reportConstDecoder.bind(hoisted_DiscriminatedUnion4_24)
}, null);
const hoisted_DiscriminatedUnion4_31 = new ObjectSchema(hoisted_DiscriminatedUnion4_26, null);
const hoisted_DiscriminatedUnion4_32 = [
    hoisted_DiscriminatedUnion4_12.validateObjectValidator.bind(hoisted_DiscriminatedUnion4_12),
    hoisted_DiscriminatedUnion4_28.validateObjectValidator.bind(hoisted_DiscriminatedUnion4_28)
];
const hoisted_DiscriminatedUnion4_33 = [
    hoisted_DiscriminatedUnion4_15.schemaObjectSchema.bind(hoisted_DiscriminatedUnion4_15),
    hoisted_DiscriminatedUnion4_31.schemaObjectSchema.bind(hoisted_DiscriminatedUnion4_31)
];
const hoisted_DiscriminatedUnion4_34 = new AnyOfValidator(hoisted_DiscriminatedUnion4_32);
const hoisted_DiscriminatedUnion4_35 = new AnyOfParser(hoisted_DiscriminatedUnion4_32, [
    hoisted_DiscriminatedUnion4_13.parseObjectParser.bind(hoisted_DiscriminatedUnion4_13),
    hoisted_DiscriminatedUnion4_29.parseObjectParser.bind(hoisted_DiscriminatedUnion4_29)
]);
const hoisted_DiscriminatedUnion4_36 = new AnyOfReporter(hoisted_DiscriminatedUnion4_32, [
    hoisted_DiscriminatedUnion4_14.reportObjectReporter.bind(hoisted_DiscriminatedUnion4_14),
    hoisted_DiscriminatedUnion4_30.reportObjectReporter.bind(hoisted_DiscriminatedUnion4_30)
]);
const hoisted_DiscriminatedUnion4_37 = new AnyOfSchema(hoisted_DiscriminatedUnion4_33);
const hoisted_AllTypes_0 = new AnyOfConstsDecoder([
    "LevelAndDSettings",
    "OmitSettings",
    "PartialSettings",
    "RequiredPartialObject"
]);
const hoisted_OtherEnum_0 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_Arr2_0 = new AnyOfConstsDecoder([
    "A",
    "B",
    "C"
]);
const hoisted_ValidCurrency_0 = new StringWithFormatDecoder("ValidCurrency");
const hoisted_UnionWithEnumAccess_0 = new ConstDecoder("a");
const hoisted_UnionWithEnumAccess_1 = {
    "tag": hoisted_UnionWithEnumAccess_0.validateConstDecoder.bind(hoisted_UnionWithEnumAccess_0),
    "value": validateString
};
const hoisted_UnionWithEnumAccess_2 = {
    "tag": hoisted_UnionWithEnumAccess_0.schemaConstDecoder.bind(hoisted_UnionWithEnumAccess_0),
    "value": schemaString
};
const hoisted_UnionWithEnumAccess_3 = null;
const hoisted_UnionWithEnumAccess_4 = new ObjectValidator(hoisted_UnionWithEnumAccess_1, hoisted_UnionWithEnumAccess_3);
const hoisted_UnionWithEnumAccess_5 = new ObjectParser({
    "tag": hoisted_UnionWithEnumAccess_0.parseConstDecoder.bind(hoisted_UnionWithEnumAccess_0),
    "value": parseIdentity
}, null);
const hoisted_UnionWithEnumAccess_6 = new ObjectReporter(hoisted_UnionWithEnumAccess_1, hoisted_UnionWithEnumAccess_3, {
    "tag": hoisted_UnionWithEnumAccess_0.reportConstDecoder.bind(hoisted_UnionWithEnumAccess_0),
    "value": reportString
}, null);
const hoisted_UnionWithEnumAccess_7 = new ObjectSchema(hoisted_UnionWithEnumAccess_2, null);
const hoisted_UnionWithEnumAccess_8 = new ConstDecoder("b");
const hoisted_UnionWithEnumAccess_9 = {
    "tag": hoisted_UnionWithEnumAccess_8.validateConstDecoder.bind(hoisted_UnionWithEnumAccess_8),
    "value": validateNumber
};
const hoisted_UnionWithEnumAccess_10 = {
    "tag": hoisted_UnionWithEnumAccess_8.schemaConstDecoder.bind(hoisted_UnionWithEnumAccess_8),
    "value": schemaNumber
};
const hoisted_UnionWithEnumAccess_11 = null;
const hoisted_UnionWithEnumAccess_12 = new ObjectValidator(hoisted_UnionWithEnumAccess_9, hoisted_UnionWithEnumAccess_11);
const hoisted_UnionWithEnumAccess_13 = new ObjectParser({
    "tag": hoisted_UnionWithEnumAccess_8.parseConstDecoder.bind(hoisted_UnionWithEnumAccess_8),
    "value": parseIdentity
}, null);
const hoisted_UnionWithEnumAccess_14 = new ObjectReporter(hoisted_UnionWithEnumAccess_9, hoisted_UnionWithEnumAccess_11, {
    "tag": hoisted_UnionWithEnumAccess_8.reportConstDecoder.bind(hoisted_UnionWithEnumAccess_8),
    "value": reportNumber
}, null);
const hoisted_UnionWithEnumAccess_15 = new ObjectSchema(hoisted_UnionWithEnumAccess_10, null);
const hoisted_UnionWithEnumAccess_16 = new ConstDecoder("c");
const hoisted_UnionWithEnumAccess_17 = {
    "tag": hoisted_UnionWithEnumAccess_16.validateConstDecoder.bind(hoisted_UnionWithEnumAccess_16),
    "value": validateBoolean
};
const hoisted_UnionWithEnumAccess_18 = {
    "tag": hoisted_UnionWithEnumAccess_16.schemaConstDecoder.bind(hoisted_UnionWithEnumAccess_16),
    "value": schemaBoolean
};
const hoisted_UnionWithEnumAccess_19 = null;
const hoisted_UnionWithEnumAccess_20 = new ObjectValidator(hoisted_UnionWithEnumAccess_17, hoisted_UnionWithEnumAccess_19);
const hoisted_UnionWithEnumAccess_21 = new ObjectParser({
    "tag": hoisted_UnionWithEnumAccess_16.parseConstDecoder.bind(hoisted_UnionWithEnumAccess_16),
    "value": parseIdentity
}, null);
const hoisted_UnionWithEnumAccess_22 = new ObjectReporter(hoisted_UnionWithEnumAccess_17, hoisted_UnionWithEnumAccess_19, {
    "tag": hoisted_UnionWithEnumAccess_16.reportConstDecoder.bind(hoisted_UnionWithEnumAccess_16),
    "value": reportBoolean
}, null);
const hoisted_UnionWithEnumAccess_23 = new ObjectSchema(hoisted_UnionWithEnumAccess_18, null);
const hoisted_UnionWithEnumAccess_24 = new ConstDecoder("a");
const hoisted_UnionWithEnumAccess_25 = {
    "tag": hoisted_UnionWithEnumAccess_24.validateConstDecoder.bind(hoisted_UnionWithEnumAccess_24),
    "value": validateString
};
const hoisted_UnionWithEnumAccess_26 = {
    "tag": hoisted_UnionWithEnumAccess_24.schemaConstDecoder.bind(hoisted_UnionWithEnumAccess_24),
    "value": schemaString
};
const hoisted_UnionWithEnumAccess_27 = null;
const hoisted_UnionWithEnumAccess_28 = new ObjectValidator(hoisted_UnionWithEnumAccess_25, hoisted_UnionWithEnumAccess_27);
const hoisted_UnionWithEnumAccess_29 = new ObjectParser({
    "tag": hoisted_UnionWithEnumAccess_24.parseConstDecoder.bind(hoisted_UnionWithEnumAccess_24),
    "value": parseIdentity
}, null);
const hoisted_UnionWithEnumAccess_30 = new ObjectReporter(hoisted_UnionWithEnumAccess_25, hoisted_UnionWithEnumAccess_27, {
    "tag": hoisted_UnionWithEnumAccess_24.reportConstDecoder.bind(hoisted_UnionWithEnumAccess_24),
    "value": reportString
}, null);
const hoisted_UnionWithEnumAccess_31 = new ObjectSchema(hoisted_UnionWithEnumAccess_26, null);
const hoisted_UnionWithEnumAccess_32 = new ConstDecoder("b");
const hoisted_UnionWithEnumAccess_33 = {
    "tag": hoisted_UnionWithEnumAccess_32.validateConstDecoder.bind(hoisted_UnionWithEnumAccess_32),
    "value": validateNumber
};
const hoisted_UnionWithEnumAccess_34 = {
    "tag": hoisted_UnionWithEnumAccess_32.schemaConstDecoder.bind(hoisted_UnionWithEnumAccess_32),
    "value": schemaNumber
};
const hoisted_UnionWithEnumAccess_35 = null;
const hoisted_UnionWithEnumAccess_36 = new ObjectValidator(hoisted_UnionWithEnumAccess_33, hoisted_UnionWithEnumAccess_35);
const hoisted_UnionWithEnumAccess_37 = new ObjectParser({
    "tag": hoisted_UnionWithEnumAccess_32.parseConstDecoder.bind(hoisted_UnionWithEnumAccess_32),
    "value": parseIdentity
}, null);
const hoisted_UnionWithEnumAccess_38 = new ObjectReporter(hoisted_UnionWithEnumAccess_33, hoisted_UnionWithEnumAccess_35, {
    "tag": hoisted_UnionWithEnumAccess_32.reportConstDecoder.bind(hoisted_UnionWithEnumAccess_32),
    "value": reportNumber
}, null);
const hoisted_UnionWithEnumAccess_39 = new ObjectSchema(hoisted_UnionWithEnumAccess_34, null);
const hoisted_UnionWithEnumAccess_40 = new ConstDecoder("c");
const hoisted_UnionWithEnumAccess_41 = {
    "tag": hoisted_UnionWithEnumAccess_40.validateConstDecoder.bind(hoisted_UnionWithEnumAccess_40),
    "value": validateBoolean
};
const hoisted_UnionWithEnumAccess_42 = {
    "tag": hoisted_UnionWithEnumAccess_40.schemaConstDecoder.bind(hoisted_UnionWithEnumAccess_40),
    "value": schemaBoolean
};
const hoisted_UnionWithEnumAccess_43 = null;
const hoisted_UnionWithEnumAccess_44 = new ObjectValidator(hoisted_UnionWithEnumAccess_41, hoisted_UnionWithEnumAccess_43);
const hoisted_UnionWithEnumAccess_45 = new ObjectParser({
    "tag": hoisted_UnionWithEnumAccess_40.parseConstDecoder.bind(hoisted_UnionWithEnumAccess_40),
    "value": parseIdentity
}, null);
const hoisted_UnionWithEnumAccess_46 = new ObjectReporter(hoisted_UnionWithEnumAccess_41, hoisted_UnionWithEnumAccess_43, {
    "tag": hoisted_UnionWithEnumAccess_40.reportConstDecoder.bind(hoisted_UnionWithEnumAccess_40),
    "value": reportBoolean
}, null);
const hoisted_UnionWithEnumAccess_47 = new ObjectSchema(hoisted_UnionWithEnumAccess_42, null);
const hoisted_UnionWithEnumAccess_48 = new AnyOfDiscriminatedValidator("tag", {
    "a": hoisted_UnionWithEnumAccess_4.validateObjectValidator.bind(hoisted_UnionWithEnumAccess_4),
    "b": hoisted_UnionWithEnumAccess_12.validateObjectValidator.bind(hoisted_UnionWithEnumAccess_12),
    "c": hoisted_UnionWithEnumAccess_20.validateObjectValidator.bind(hoisted_UnionWithEnumAccess_20)
});
const hoisted_UnionWithEnumAccess_49 = new AnyOfDiscriminatedParser("tag", {
    "a": hoisted_UnionWithEnumAccess_5.parseObjectParser.bind(hoisted_UnionWithEnumAccess_5),
    "b": hoisted_UnionWithEnumAccess_13.parseObjectParser.bind(hoisted_UnionWithEnumAccess_13),
    "c": hoisted_UnionWithEnumAccess_21.parseObjectParser.bind(hoisted_UnionWithEnumAccess_21)
});
const hoisted_UnionWithEnumAccess_50 = new AnyOfDiscriminatedReporter("tag", {
    "a": hoisted_UnionWithEnumAccess_6.reportObjectReporter.bind(hoisted_UnionWithEnumAccess_6),
    "b": hoisted_UnionWithEnumAccess_14.reportObjectReporter.bind(hoisted_UnionWithEnumAccess_14),
    "c": hoisted_UnionWithEnumAccess_22.reportObjectReporter.bind(hoisted_UnionWithEnumAccess_22)
});
const hoisted_UnionWithEnumAccess_51 = new AnyOfDiscriminatedSchema([
    hoisted_UnionWithEnumAccess_31.schemaObjectSchema.bind(hoisted_UnionWithEnumAccess_31),
    hoisted_UnionWithEnumAccess_39.schemaObjectSchema.bind(hoisted_UnionWithEnumAccess_39),
    hoisted_UnionWithEnumAccess_47.schemaObjectSchema.bind(hoisted_UnionWithEnumAccess_47)
]);
const hoisted_Shape_0 = new ConstDecoder("circle");
const hoisted_Shape_1 = {
    "kind": hoisted_Shape_0.validateConstDecoder.bind(hoisted_Shape_0),
    "radius": validateNumber
};
const hoisted_Shape_2 = {
    "kind": hoisted_Shape_0.schemaConstDecoder.bind(hoisted_Shape_0),
    "radius": schemaNumber
};
const hoisted_Shape_3 = null;
const hoisted_Shape_4 = new ObjectValidator(hoisted_Shape_1, hoisted_Shape_3);
const hoisted_Shape_5 = new ObjectParser({
    "kind": hoisted_Shape_0.parseConstDecoder.bind(hoisted_Shape_0),
    "radius": parseIdentity
}, null);
const hoisted_Shape_6 = new ObjectReporter(hoisted_Shape_1, hoisted_Shape_3, {
    "kind": hoisted_Shape_0.reportConstDecoder.bind(hoisted_Shape_0),
    "radius": reportNumber
}, null);
const hoisted_Shape_7 = new ObjectSchema(hoisted_Shape_2, null);
const hoisted_Shape_8 = new ConstDecoder("square");
const hoisted_Shape_9 = {
    "kind": hoisted_Shape_8.validateConstDecoder.bind(hoisted_Shape_8),
    "x": validateNumber
};
const hoisted_Shape_10 = {
    "kind": hoisted_Shape_8.schemaConstDecoder.bind(hoisted_Shape_8),
    "x": schemaNumber
};
const hoisted_Shape_11 = null;
const hoisted_Shape_12 = new ObjectValidator(hoisted_Shape_9, hoisted_Shape_11);
const hoisted_Shape_13 = new ObjectParser({
    "kind": hoisted_Shape_8.parseConstDecoder.bind(hoisted_Shape_8),
    "x": parseIdentity
}, null);
const hoisted_Shape_14 = new ObjectReporter(hoisted_Shape_9, hoisted_Shape_11, {
    "kind": hoisted_Shape_8.reportConstDecoder.bind(hoisted_Shape_8),
    "x": reportNumber
}, null);
const hoisted_Shape_15 = new ObjectSchema(hoisted_Shape_10, null);
const hoisted_Shape_16 = new ConstDecoder("triangle");
const hoisted_Shape_17 = {
    "kind": hoisted_Shape_16.validateConstDecoder.bind(hoisted_Shape_16),
    "x": validateNumber,
    "y": validateNumber
};
const hoisted_Shape_18 = {
    "kind": hoisted_Shape_16.schemaConstDecoder.bind(hoisted_Shape_16),
    "x": schemaNumber,
    "y": schemaNumber
};
const hoisted_Shape_19 = null;
const hoisted_Shape_20 = new ObjectValidator(hoisted_Shape_17, hoisted_Shape_19);
const hoisted_Shape_21 = new ObjectParser({
    "kind": hoisted_Shape_16.parseConstDecoder.bind(hoisted_Shape_16),
    "x": parseIdentity,
    "y": parseIdentity
}, null);
const hoisted_Shape_22 = new ObjectReporter(hoisted_Shape_17, hoisted_Shape_19, {
    "kind": hoisted_Shape_16.reportConstDecoder.bind(hoisted_Shape_16),
    "x": reportNumber,
    "y": reportNumber
}, null);
const hoisted_Shape_23 = new ObjectSchema(hoisted_Shape_18, null);
const hoisted_Shape_24 = new ConstDecoder("circle");
const hoisted_Shape_25 = {
    "kind": hoisted_Shape_24.validateConstDecoder.bind(hoisted_Shape_24),
    "radius": validateNumber
};
const hoisted_Shape_26 = {
    "kind": hoisted_Shape_24.schemaConstDecoder.bind(hoisted_Shape_24),
    "radius": schemaNumber
};
const hoisted_Shape_27 = null;
const hoisted_Shape_28 = new ObjectValidator(hoisted_Shape_25, hoisted_Shape_27);
const hoisted_Shape_29 = new ObjectParser({
    "kind": hoisted_Shape_24.parseConstDecoder.bind(hoisted_Shape_24),
    "radius": parseIdentity
}, null);
const hoisted_Shape_30 = new ObjectReporter(hoisted_Shape_25, hoisted_Shape_27, {
    "kind": hoisted_Shape_24.reportConstDecoder.bind(hoisted_Shape_24),
    "radius": reportNumber
}, null);
const hoisted_Shape_31 = new ObjectSchema(hoisted_Shape_26, null);
const hoisted_Shape_32 = new ConstDecoder("square");
const hoisted_Shape_33 = {
    "kind": hoisted_Shape_32.validateConstDecoder.bind(hoisted_Shape_32),
    "x": validateNumber
};
const hoisted_Shape_34 = {
    "kind": hoisted_Shape_32.schemaConstDecoder.bind(hoisted_Shape_32),
    "x": schemaNumber
};
const hoisted_Shape_35 = null;
const hoisted_Shape_36 = new ObjectValidator(hoisted_Shape_33, hoisted_Shape_35);
const hoisted_Shape_37 = new ObjectParser({
    "kind": hoisted_Shape_32.parseConstDecoder.bind(hoisted_Shape_32),
    "x": parseIdentity
}, null);
const hoisted_Shape_38 = new ObjectReporter(hoisted_Shape_33, hoisted_Shape_35, {
    "kind": hoisted_Shape_32.reportConstDecoder.bind(hoisted_Shape_32),
    "x": reportNumber
}, null);
const hoisted_Shape_39 = new ObjectSchema(hoisted_Shape_34, null);
const hoisted_Shape_40 = new ConstDecoder("triangle");
const hoisted_Shape_41 = {
    "kind": hoisted_Shape_40.validateConstDecoder.bind(hoisted_Shape_40),
    "x": validateNumber,
    "y": validateNumber
};
const hoisted_Shape_42 = {
    "kind": hoisted_Shape_40.schemaConstDecoder.bind(hoisted_Shape_40),
    "x": schemaNumber,
    "y": schemaNumber
};
const hoisted_Shape_43 = null;
const hoisted_Shape_44 = new ObjectValidator(hoisted_Shape_41, hoisted_Shape_43);
const hoisted_Shape_45 = new ObjectParser({
    "kind": hoisted_Shape_40.parseConstDecoder.bind(hoisted_Shape_40),
    "x": parseIdentity,
    "y": parseIdentity
}, null);
const hoisted_Shape_46 = new ObjectReporter(hoisted_Shape_41, hoisted_Shape_43, {
    "kind": hoisted_Shape_40.reportConstDecoder.bind(hoisted_Shape_40),
    "x": reportNumber,
    "y": reportNumber
}, null);
const hoisted_Shape_47 = new ObjectSchema(hoisted_Shape_42, null);
const hoisted_Shape_48 = new AnyOfDiscriminatedValidator("kind", {
    "circle": hoisted_Shape_4.validateObjectValidator.bind(hoisted_Shape_4),
    "square": hoisted_Shape_12.validateObjectValidator.bind(hoisted_Shape_12),
    "triangle": hoisted_Shape_20.validateObjectValidator.bind(hoisted_Shape_20)
});
const hoisted_Shape_49 = new AnyOfDiscriminatedParser("kind", {
    "circle": hoisted_Shape_5.parseObjectParser.bind(hoisted_Shape_5),
    "square": hoisted_Shape_13.parseObjectParser.bind(hoisted_Shape_13),
    "triangle": hoisted_Shape_21.parseObjectParser.bind(hoisted_Shape_21)
});
const hoisted_Shape_50 = new AnyOfDiscriminatedReporter("kind", {
    "circle": hoisted_Shape_6.reportObjectReporter.bind(hoisted_Shape_6),
    "square": hoisted_Shape_14.reportObjectReporter.bind(hoisted_Shape_14),
    "triangle": hoisted_Shape_22.reportObjectReporter.bind(hoisted_Shape_22)
});
const hoisted_Shape_51 = new AnyOfDiscriminatedSchema([
    hoisted_Shape_31.schemaObjectSchema.bind(hoisted_Shape_31),
    hoisted_Shape_39.schemaObjectSchema.bind(hoisted_Shape_39),
    hoisted_Shape_47.schemaObjectSchema.bind(hoisted_Shape_47)
]);
const hoisted_T3_0 = new ConstDecoder("square");
const hoisted_T3_1 = {
    "kind": hoisted_T3_0.validateConstDecoder.bind(hoisted_T3_0),
    "x": validateNumber
};
const hoisted_T3_2 = {
    "kind": hoisted_T3_0.schemaConstDecoder.bind(hoisted_T3_0),
    "x": schemaNumber
};
const hoisted_T3_3 = null;
const hoisted_T3_4 = new ObjectValidator(hoisted_T3_1, hoisted_T3_3);
const hoisted_T3_5 = new ObjectParser({
    "kind": hoisted_T3_0.parseConstDecoder.bind(hoisted_T3_0),
    "x": parseIdentity
}, null);
const hoisted_T3_6 = new ObjectReporter(hoisted_T3_1, hoisted_T3_3, {
    "kind": hoisted_T3_0.reportConstDecoder.bind(hoisted_T3_0),
    "x": reportNumber
}, null);
const hoisted_T3_7 = new ObjectSchema(hoisted_T3_2, null);
const hoisted_T3_8 = new ConstDecoder("triangle");
const hoisted_T3_9 = {
    "kind": hoisted_T3_8.validateConstDecoder.bind(hoisted_T3_8),
    "x": validateNumber,
    "y": validateNumber
};
const hoisted_T3_10 = {
    "kind": hoisted_T3_8.schemaConstDecoder.bind(hoisted_T3_8),
    "x": schemaNumber,
    "y": schemaNumber
};
const hoisted_T3_11 = null;
const hoisted_T3_12 = new ObjectValidator(hoisted_T3_9, hoisted_T3_11);
const hoisted_T3_13 = new ObjectParser({
    "kind": hoisted_T3_8.parseConstDecoder.bind(hoisted_T3_8),
    "x": parseIdentity,
    "y": parseIdentity
}, null);
const hoisted_T3_14 = new ObjectReporter(hoisted_T3_9, hoisted_T3_11, {
    "kind": hoisted_T3_8.reportConstDecoder.bind(hoisted_T3_8),
    "x": reportNumber,
    "y": reportNumber
}, null);
const hoisted_T3_15 = new ObjectSchema(hoisted_T3_10, null);
const hoisted_T3_16 = new ConstDecoder("square");
const hoisted_T3_17 = {
    "kind": hoisted_T3_16.validateConstDecoder.bind(hoisted_T3_16),
    "x": validateNumber
};
const hoisted_T3_18 = {
    "kind": hoisted_T3_16.schemaConstDecoder.bind(hoisted_T3_16),
    "x": schemaNumber
};
const hoisted_T3_19 = null;
const hoisted_T3_20 = new ObjectValidator(hoisted_T3_17, hoisted_T3_19);
const hoisted_T3_21 = new ObjectParser({
    "kind": hoisted_T3_16.parseConstDecoder.bind(hoisted_T3_16),
    "x": parseIdentity
}, null);
const hoisted_T3_22 = new ObjectReporter(hoisted_T3_17, hoisted_T3_19, {
    "kind": hoisted_T3_16.reportConstDecoder.bind(hoisted_T3_16),
    "x": reportNumber
}, null);
const hoisted_T3_23 = new ObjectSchema(hoisted_T3_18, null);
const hoisted_T3_24 = new ConstDecoder("triangle");
const hoisted_T3_25 = {
    "kind": hoisted_T3_24.validateConstDecoder.bind(hoisted_T3_24),
    "x": validateNumber,
    "y": validateNumber
};
const hoisted_T3_26 = {
    "kind": hoisted_T3_24.schemaConstDecoder.bind(hoisted_T3_24),
    "x": schemaNumber,
    "y": schemaNumber
};
const hoisted_T3_27 = null;
const hoisted_T3_28 = new ObjectValidator(hoisted_T3_25, hoisted_T3_27);
const hoisted_T3_29 = new ObjectParser({
    "kind": hoisted_T3_24.parseConstDecoder.bind(hoisted_T3_24),
    "x": parseIdentity,
    "y": parseIdentity
}, null);
const hoisted_T3_30 = new ObjectReporter(hoisted_T3_25, hoisted_T3_27, {
    "kind": hoisted_T3_24.reportConstDecoder.bind(hoisted_T3_24),
    "x": reportNumber,
    "y": reportNumber
}, null);
const hoisted_T3_31 = new ObjectSchema(hoisted_T3_26, null);
const hoisted_T3_32 = new AnyOfDiscriminatedValidator("kind", {
    "square": hoisted_T3_4.validateObjectValidator.bind(hoisted_T3_4),
    "triangle": hoisted_T3_12.validateObjectValidator.bind(hoisted_T3_12)
});
const hoisted_T3_33 = new AnyOfDiscriminatedParser("kind", {
    "square": hoisted_T3_5.parseObjectParser.bind(hoisted_T3_5),
    "triangle": hoisted_T3_13.parseObjectParser.bind(hoisted_T3_13)
});
const hoisted_T3_34 = new AnyOfDiscriminatedReporter("kind", {
    "square": hoisted_T3_6.reportObjectReporter.bind(hoisted_T3_6),
    "triangle": hoisted_T3_14.reportObjectReporter.bind(hoisted_T3_14)
});
const hoisted_T3_35 = new AnyOfDiscriminatedSchema([
    hoisted_T3_23.schemaObjectSchema.bind(hoisted_T3_23),
    hoisted_T3_31.schemaObjectSchema.bind(hoisted_T3_31)
]);
const hoisted_BObject_0 = new ConstDecoder("b");
const hoisted_BObject_1 = {
    "tag": hoisted_BObject_0.validateConstDecoder.bind(hoisted_BObject_0)
};
const hoisted_BObject_2 = {
    "tag": hoisted_BObject_0.schemaConstDecoder.bind(hoisted_BObject_0)
};
const hoisted_BObject_3 = null;
const hoisted_BObject_4 = new ObjectValidator(hoisted_BObject_1, hoisted_BObject_3);
const hoisted_BObject_5 = new ObjectParser({
    "tag": hoisted_BObject_0.parseConstDecoder.bind(hoisted_BObject_0)
}, null);
const hoisted_BObject_6 = new ObjectReporter(hoisted_BObject_1, hoisted_BObject_3, {
    "tag": hoisted_BObject_0.reportConstDecoder.bind(hoisted_BObject_0)
}, null);
const hoisted_BObject_7 = new ObjectSchema(hoisted_BObject_2, null);
const hoisted_DEF_0 = {
    "a": validateString
};
const hoisted_DEF_1 = {
    "a": schemaString
};
const hoisted_DEF_2 = null;
const hoisted_DEF_3 = new ObjectValidator(hoisted_DEF_0, hoisted_DEF_2);
const hoisted_DEF_4 = new ObjectParser({
    "a": parseIdentity
}, null);
const hoisted_DEF_5 = new ObjectReporter(hoisted_DEF_0, hoisted_DEF_2, {
    "a": reportString
}, null);
const hoisted_DEF_6 = new ObjectSchema(hoisted_DEF_1, null);
const hoisted_KDEF_0 = new ConstDecoder("a");
const hoisted_ABC_0 = {};
const hoisted_ABC_1 = {};
const hoisted_ABC_2 = null;
const hoisted_ABC_3 = new ObjectValidator(hoisted_ABC_0, hoisted_ABC_2);
const hoisted_ABC_4 = new ObjectParser({}, null);
const hoisted_ABC_5 = new ObjectReporter(hoisted_ABC_0, hoisted_ABC_2, {}, null);
const hoisted_ABC_6 = new ObjectSchema(hoisted_ABC_1, null);
const hoisted_K_0 = [
    validators.KABC,
    validators.KDEF
];
const hoisted_K_1 = [
    schemas.KABC,
    schemas.KDEF
];
const hoisted_K_2 = new AnyOfValidator(hoisted_K_0);
const hoisted_K_3 = new AnyOfParser(hoisted_K_0, [
    parsers.KABC,
    parsers.KDEF
]);
const hoisted_K_4 = new AnyOfReporter(hoisted_K_0, [
    reporters.KABC,
    reporters.KDEF
]);
const hoisted_K_5 = new AnyOfSchema(hoisted_K_1);
const hoisted_NonNegativeNumber_0 = new NumberWithFormatDecoder("NonNegativeNumber");

export default { registerStringFormatter, registerNumberFormatter, ObjectValidator, ObjectParser, ArrayParser, ArrayValidator, CodecDecoder, StringWithFormatDecoder, NumberWithFormatDecoder, AnyOfValidator, AnyOfParser, AllOfValidator, AllOfParser, TupleParser, TupleValidator, RegexDecoder, ConstDecoder, AnyOfConstsDecoder, AnyOfDiscriminatedParser, AnyOfDiscriminatedValidator, validateString, validateNumber, validateFunction, validateBoolean, validateAny, validateNull, validateNever, parseIdentity, reportString, reportNumber, reportNull, reportBoolean, reportAny, reportNever, reportFunction, ArrayReporter, ObjectReporter, TupleReporter, AnyOfReporter, AllOfReporter, AnyOfDiscriminatedReporter, schemaString, schemaNumber, schemaBoolean, schemaNull, schemaAny, schemaNever, schemaFunction, ArraySchema, ObjectSchema, TupleSchema, AnyOfSchema, AllOfSchema, AnyOfDiscriminatedSchema, validators, parsers, reporters, schemas };