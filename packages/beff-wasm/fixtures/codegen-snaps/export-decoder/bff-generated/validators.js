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
    return buildError(ctx, `expected string with format "${this.format}"`, input);
  }
  schemaStringWithFormatDecoder(ctx) {
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
        "INTERNAL ERROR: Missing parser for discriminator " + JSON.stringify(input[this.discriminator])
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
        d
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
    const items = this.prefix.map((s) => s(ctx));
    const additionalItems = this.rest != null ? this.rest(ctx) : false;
    popPath(ctx);
    return {
      type: "array",
      items,
      additionalItems,
    };
  }
}


function ValidateUser(ctx, input) {
    return (hoisted_User_3.validateObjectValidator.bind(hoisted_User_3))(ctx, input);
}
function ParseUser(ctx, input) {
    return (hoisted_User_4.parseObjectParser.bind(hoisted_User_4))(ctx, input);
}
function ReportUser(ctx, input) {
    return (hoisted_User_5.reportObjectReporter.bind(hoisted_User_5))(ctx, input);
}
function SchemaUser(ctx, input) {
    if (ctx.seen["User"]) {
        return {};
    }
    ctx.seen["User"] = true;
    var tmp = (hoisted_User_6.schemaObjectSchema.bind(hoisted_User_6))(ctx);
    delete ctx.seen["User"];
    return tmp;
}
function ValidateNotPublic(ctx, input) {
    return (hoisted_NotPublic_3.validateObjectValidator.bind(hoisted_NotPublic_3))(ctx, input);
}
function ParseNotPublic(ctx, input) {
    return (hoisted_NotPublic_4.parseObjectParser.bind(hoisted_NotPublic_4))(ctx, input);
}
function ReportNotPublic(ctx, input) {
    return (hoisted_NotPublic_5.reportObjectReporter.bind(hoisted_NotPublic_5))(ctx, input);
}
function SchemaNotPublic(ctx, input) {
    if (ctx.seen["NotPublic"]) {
        return {};
    }
    ctx.seen["NotPublic"] = true;
    var tmp = (hoisted_NotPublic_6.schemaObjectSchema.bind(hoisted_NotPublic_6))(ctx);
    delete ctx.seen["NotPublic"];
    return tmp;
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
function SchemaStartsWithA(ctx, input) {
    if (ctx.seen["StartsWithA"]) {
        return {};
    }
    ctx.seen["StartsWithA"] = true;
    var tmp = (hoisted_StartsWithA_0.schemaStringWithFormatDecoder.bind(hoisted_StartsWithA_0))(ctx);
    delete ctx.seen["StartsWithA"];
    return tmp;
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
function SchemaPassword(ctx, input) {
    if (ctx.seen["Password"]) {
        return {};
    }
    ctx.seen["Password"] = true;
    var tmp = (hoisted_Password_0.schemaStringWithFormatDecoder.bind(hoisted_Password_0))(ctx);
    delete ctx.seen["Password"];
    return tmp;
}
function ValidateA(ctx, input) {
    return (hoisted_A_0.validateAnyOfConstsDecoder.bind(hoisted_A_0))(ctx, input);
}
function ParseA(ctx, input) {
    return (hoisted_A_0.parseAnyOfConstsDecoder.bind(hoisted_A_0))(ctx, input);
}
function ReportA(ctx, input) {
    return (hoisted_A_0.reportAnyOfConstsDecoder.bind(hoisted_A_0))(ctx, input);
}
function SchemaA(ctx, input) {
    if (ctx.seen["A"]) {
        return {};
    }
    ctx.seen["A"] = true;
    var tmp = (hoisted_A_0.schemaAnyOfConstsDecoder.bind(hoisted_A_0))(ctx);
    delete ctx.seen["A"];
    return tmp;
}
function ValidateB(ctx, input) {
    return (hoisted_B_0.validateAnyOfConstsDecoder.bind(hoisted_B_0))(ctx, input);
}
function ParseB(ctx, input) {
    return (hoisted_B_0.parseAnyOfConstsDecoder.bind(hoisted_B_0))(ctx, input);
}
function ReportB(ctx, input) {
    return (hoisted_B_0.reportAnyOfConstsDecoder.bind(hoisted_B_0))(ctx, input);
}
function SchemaB(ctx, input) {
    if (ctx.seen["B"]) {
        return {};
    }
    ctx.seen["B"] = true;
    var tmp = (hoisted_B_0.schemaAnyOfConstsDecoder.bind(hoisted_B_0))(ctx);
    delete ctx.seen["B"];
    return tmp;
}
function ValidateD(ctx, input) {
    return (hoisted_D_0.validateAnyOfConstsDecoder.bind(hoisted_D_0))(ctx, input);
}
function ParseD(ctx, input) {
    return (hoisted_D_0.parseAnyOfConstsDecoder.bind(hoisted_D_0))(ctx, input);
}
function ReportD(ctx, input) {
    return (hoisted_D_0.reportAnyOfConstsDecoder.bind(hoisted_D_0))(ctx, input);
}
function SchemaD(ctx, input) {
    if (ctx.seen["D"]) {
        return {};
    }
    ctx.seen["D"] = true;
    var tmp = (hoisted_D_0.schemaAnyOfConstsDecoder.bind(hoisted_D_0))(ctx);
    delete ctx.seen["D"];
    return tmp;
}
function ValidateE(ctx, input) {
    return (hoisted_E_0.validateAnyOfConstsDecoder.bind(hoisted_E_0))(ctx, input);
}
function ParseE(ctx, input) {
    return (hoisted_E_0.parseAnyOfConstsDecoder.bind(hoisted_E_0))(ctx, input);
}
function ReportE(ctx, input) {
    return (hoisted_E_0.reportAnyOfConstsDecoder.bind(hoisted_E_0))(ctx, input);
}
function SchemaE(ctx, input) {
    if (ctx.seen["E"]) {
        return {};
    }
    ctx.seen["E"] = true;
    var tmp = (hoisted_E_0.schemaAnyOfConstsDecoder.bind(hoisted_E_0))(ctx);
    delete ctx.seen["E"];
    return tmp;
}
function ValidateUnionNested(ctx, input) {
    return (hoisted_UnionNested_0.validateAnyOfConstsDecoder.bind(hoisted_UnionNested_0))(ctx, input);
}
function ParseUnionNested(ctx, input) {
    return (hoisted_UnionNested_0.parseAnyOfConstsDecoder.bind(hoisted_UnionNested_0))(ctx, input);
}
function ReportUnionNested(ctx, input) {
    return (hoisted_UnionNested_0.reportAnyOfConstsDecoder.bind(hoisted_UnionNested_0))(ctx, input);
}
function SchemaUnionNested(ctx, input) {
    if (ctx.seen["UnionNested"]) {
        return {};
    }
    ctx.seen["UnionNested"] = true;
    var tmp = (hoisted_UnionNested_0.schemaAnyOfConstsDecoder.bind(hoisted_UnionNested_0))(ctx);
    delete ctx.seen["UnionNested"];
    return tmp;
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
const schemas = {
    User: SchemaUser,
    NotPublic: SchemaNotPublic,
    StartsWithA: SchemaStartsWithA,
    Password: SchemaPassword,
    A: SchemaA,
    B: SchemaB,
    D: SchemaD,
    E: SchemaE,
    UnionNested: SchemaUnionNested
};
const hoisted_User_0 = {
    "age": validateNumber,
    "name": validateString
};
const hoisted_User_1 = {
    "age": schemaNumber,
    "name": schemaString
};
const hoisted_User_2 = null;
const hoisted_User_3 = new ObjectValidator(hoisted_User_0, hoisted_User_2);
const hoisted_User_4 = new ObjectParser({
    "age": parseIdentity,
    "name": parseIdentity
}, null);
const hoisted_User_5 = new ObjectReporter(hoisted_User_0, hoisted_User_2, {
    "age": reportNumber,
    "name": reportString
}, null);
const hoisted_User_6 = new ObjectSchema(hoisted_User_1, null);
const hoisted_NotPublic_0 = {
    "a": validateString
};
const hoisted_NotPublic_1 = {
    "a": schemaString
};
const hoisted_NotPublic_2 = null;
const hoisted_NotPublic_3 = new ObjectValidator(hoisted_NotPublic_0, hoisted_NotPublic_2);
const hoisted_NotPublic_4 = new ObjectParser({
    "a": parseIdentity
}, null);
const hoisted_NotPublic_5 = new ObjectReporter(hoisted_NotPublic_0, hoisted_NotPublic_2, {
    "a": reportString
}, null);
const hoisted_NotPublic_6 = new ObjectSchema(hoisted_NotPublic_1, null);
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

export default { registerCustomFormatter, ObjectValidator, ObjectParser, ArrayParser, ArrayValidator, CodecDecoder, StringWithFormatDecoder, AnyOfValidator, AnyOfParser, AllOfValidator, AllOfParser, TupleParser, TupleValidator, RegexDecoder, ConstDecoder, AnyOfConstsDecoder, AnyOfDiscriminatedParser, AnyOfDiscriminatedValidator, validateString, validateNumber, validateFunction, validateBoolean, validateAny, validateNull, validateNever, parseIdentity, reportString, reportNumber, reportNull, reportBoolean, reportAny, reportNever, reportFunction, ArrayReporter, ObjectReporter, TupleReporter, AnyOfReporter, AllOfReporter, AnyOfDiscriminatedReporter, schemaString, schemaNumber, schemaBoolean, schemaNull, schemaAny, schemaNever, schemaFunction, ArraySchema, ObjectSchema, TupleSchema, AnyOfSchema, AllOfSchema, AnyOfDiscriminatedSchema, validators, parsers, reporters, schemas };