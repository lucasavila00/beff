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


function ValidateT1(ctx, input) {
    return (hoisted_T1_3.validateObjectValidator.bind(hoisted_T1_3))(ctx, input);
}
function ParseT1(ctx, input) {
    return (hoisted_T1_4.parseObjectParser.bind(hoisted_T1_4))(ctx, input);
}
function ReportT1(ctx, input) {
    return (hoisted_T1_5.reportObjectReporter.bind(hoisted_T1_5))(ctx, input);
}
function SchemaT1(ctx, input) {
    if (ctx.seen["T1"]) {
        throw new Error("Failed to print schema. At T1: circular reference in schema");
    }
    ctx.seen["T1"] = true;
    var tmp = (hoisted_T1_6.schemaObjectSchema.bind(hoisted_T1_6))(ctx);
    delete ctx.seen["T1"];
    return tmp;
}
function ValidateT2(ctx, input) {
    return (hoisted_T2_3.validateObjectValidator.bind(hoisted_T2_3))(ctx, input);
}
function ParseT2(ctx, input) {
    return (hoisted_T2_4.parseObjectParser.bind(hoisted_T2_4))(ctx, input);
}
function ReportT2(ctx, input) {
    return (hoisted_T2_5.reportObjectReporter.bind(hoisted_T2_5))(ctx, input);
}
function SchemaT2(ctx, input) {
    if (ctx.seen["T2"]) {
        throw new Error("Failed to print schema. At T2: circular reference in schema");
    }
    ctx.seen["T2"] = true;
    var tmp = (hoisted_T2_6.schemaObjectSchema.bind(hoisted_T2_6))(ctx);
    delete ctx.seen["T2"];
    return tmp;
}
function ValidateT3(ctx, input) {
    return (hoisted_T3_8.validateObjectValidator.bind(hoisted_T3_8))(ctx, input);
}
function ParseT3(ctx, input) {
    return (hoisted_T3_9.parseObjectParser.bind(hoisted_T3_9))(ctx, input);
}
function ReportT3(ctx, input) {
    return (hoisted_T3_10.reportObjectReporter.bind(hoisted_T3_10))(ctx, input);
}
function SchemaT3(ctx, input) {
    if (ctx.seen["T3"]) {
        throw new Error("Failed to print schema. At T3: circular reference in schema");
    }
    ctx.seen["T3"] = true;
    var tmp = (hoisted_T3_11.schemaObjectSchema.bind(hoisted_T3_11))(ctx);
    delete ctx.seen["T3"];
    return tmp;
}
function ValidateInvalidSchemaWithDate(ctx, input) {
    return (hoisted_InvalidSchemaWithDate_4.validateObjectValidator.bind(hoisted_InvalidSchemaWithDate_4))(ctx, input);
}
function ParseInvalidSchemaWithDate(ctx, input) {
    return (hoisted_InvalidSchemaWithDate_5.parseObjectParser.bind(hoisted_InvalidSchemaWithDate_5))(ctx, input);
}
function ReportInvalidSchemaWithDate(ctx, input) {
    return (hoisted_InvalidSchemaWithDate_6.reportObjectReporter.bind(hoisted_InvalidSchemaWithDate_6))(ctx, input);
}
function SchemaInvalidSchemaWithDate(ctx, input) {
    if (ctx.seen["InvalidSchemaWithDate"]) {
        throw new Error("Failed to print schema. At InvalidSchemaWithDate: circular reference in schema");
    }
    ctx.seen["InvalidSchemaWithDate"] = true;
    var tmp = (hoisted_InvalidSchemaWithDate_7.schemaObjectSchema.bind(hoisted_InvalidSchemaWithDate_7))(ctx);
    delete ctx.seen["InvalidSchemaWithDate"];
    return tmp;
}
function ValidateInvalidSchemaWithBigInt(ctx, input) {
    return (hoisted_InvalidSchemaWithBigInt_4.validateObjectValidator.bind(hoisted_InvalidSchemaWithBigInt_4))(ctx, input);
}
function ParseInvalidSchemaWithBigInt(ctx, input) {
    return (hoisted_InvalidSchemaWithBigInt_5.parseObjectParser.bind(hoisted_InvalidSchemaWithBigInt_5))(ctx, input);
}
function ReportInvalidSchemaWithBigInt(ctx, input) {
    return (hoisted_InvalidSchemaWithBigInt_6.reportObjectReporter.bind(hoisted_InvalidSchemaWithBigInt_6))(ctx, input);
}
function SchemaInvalidSchemaWithBigInt(ctx, input) {
    if (ctx.seen["InvalidSchemaWithBigInt"]) {
        throw new Error("Failed to print schema. At InvalidSchemaWithBigInt: circular reference in schema");
    }
    ctx.seen["InvalidSchemaWithBigInt"] = true;
    var tmp = (hoisted_InvalidSchemaWithBigInt_7.schemaObjectSchema.bind(hoisted_InvalidSchemaWithBigInt_7))(ctx);
    delete ctx.seen["InvalidSchemaWithBigInt"];
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
        throw new Error("Failed to print schema. At DiscriminatedUnion: circular reference in schema");
    }
    ctx.seen["DiscriminatedUnion"] = true;
    var tmp = (hoisted_DiscriminatedUnion_95.schemaAnyOfDiscriminatedSchema.bind(hoisted_DiscriminatedUnion_95))(ctx);
    delete ctx.seen["DiscriminatedUnion"];
    return tmp;
}
function ValidateRecursiveTree(ctx, input) {
    return (hoisted_RecursiveTree_8.validateObjectValidator.bind(hoisted_RecursiveTree_8))(ctx, input);
}
function ParseRecursiveTree(ctx, input) {
    return (hoisted_RecursiveTree_9.parseObjectParser.bind(hoisted_RecursiveTree_9))(ctx, input);
}
function ReportRecursiveTree(ctx, input) {
    return (hoisted_RecursiveTree_10.reportObjectReporter.bind(hoisted_RecursiveTree_10))(ctx, input);
}
function SchemaRecursiveTree(ctx, input) {
    if (ctx.seen["RecursiveTree"]) {
        throw new Error("Failed to print schema. At RecursiveTree: circular reference in schema");
    }
    ctx.seen["RecursiveTree"] = true;
    var tmp = (hoisted_RecursiveTree_11.schemaObjectSchema.bind(hoisted_RecursiveTree_11))(ctx);
    delete ctx.seen["RecursiveTree"];
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
        throw new Error("Failed to print schema. At ValidCurrency: circular reference in schema");
    }
    ctx.seen["ValidCurrency"] = true;
    var tmp = (hoisted_ValidCurrency_0.schemaStringWithFormatDecoder.bind(hoisted_ValidCurrency_0))(ctx);
    delete ctx.seen["ValidCurrency"];
    return tmp;
}
const validators = {
    T1: ValidateT1,
    T2: ValidateT2,
    T3: ValidateT3,
    InvalidSchemaWithDate: ValidateInvalidSchemaWithDate,
    InvalidSchemaWithBigInt: ValidateInvalidSchemaWithBigInt,
    DiscriminatedUnion: ValidateDiscriminatedUnion,
    RecursiveTree: ValidateRecursiveTree,
    ValidCurrency: ValidateValidCurrency
};
const parsers = {
    T1: ParseT1,
    T2: ParseT2,
    T3: ParseT3,
    InvalidSchemaWithDate: ParseInvalidSchemaWithDate,
    InvalidSchemaWithBigInt: ParseInvalidSchemaWithBigInt,
    DiscriminatedUnion: ParseDiscriminatedUnion,
    RecursiveTree: ParseRecursiveTree,
    ValidCurrency: ParseValidCurrency
};
const reporters = {
    T1: ReportT1,
    T2: ReportT2,
    T3: ReportT3,
    InvalidSchemaWithDate: ReportInvalidSchemaWithDate,
    InvalidSchemaWithBigInt: ReportInvalidSchemaWithBigInt,
    DiscriminatedUnion: ReportDiscriminatedUnion,
    RecursiveTree: ReportRecursiveTree,
    ValidCurrency: ReportValidCurrency
};
const schemas = {
    T1: SchemaT1,
    T2: SchemaT2,
    T3: SchemaT3,
    InvalidSchemaWithDate: SchemaInvalidSchemaWithDate,
    InvalidSchemaWithBigInt: SchemaInvalidSchemaWithBigInt,
    DiscriminatedUnion: SchemaDiscriminatedUnion,
    RecursiveTree: SchemaRecursiveTree,
    ValidCurrency: SchemaValidCurrency
};
const hoisted_T1_0 = {
    "a": validateString,
    "b": validateNumber
};
const hoisted_T1_1 = {
    "a": schemaString,
    "b": schemaNumber
};
const hoisted_T1_2 = null;
const hoisted_T1_3 = new ObjectValidator(hoisted_T1_0, hoisted_T1_2);
const hoisted_T1_4 = new ObjectParser({
    "a": parseIdentity,
    "b": parseIdentity
}, null);
const hoisted_T1_5 = new ObjectReporter(hoisted_T1_0, hoisted_T1_2, {
    "a": reportString,
    "b": reportNumber
}, null);
const hoisted_T1_6 = new ObjectSchema(hoisted_T1_1, null);
const hoisted_T2_0 = {
    "t1": validators.T1
};
const hoisted_T2_1 = {
    "t1": schemas.T1
};
const hoisted_T2_2 = null;
const hoisted_T2_3 = new ObjectValidator(hoisted_T2_0, hoisted_T2_2);
const hoisted_T2_4 = new ObjectParser({
    "t1": parsers.T1
}, null);
const hoisted_T2_5 = new ObjectReporter(hoisted_T2_0, hoisted_T2_2, {
    "t1": reporters.T1
}, null);
const hoisted_T2_6 = new ObjectSchema(hoisted_T2_1, null);
const hoisted_T3_0 = validators.T2;
const hoisted_T3_1 = new ArrayValidator(hoisted_T3_0);
const hoisted_T3_2 = new ArrayParser(parsers.T2);
const hoisted_T3_3 = new ArrayReporter(hoisted_T3_0, reporters.T2);
const hoisted_T3_4 = new ArraySchema(schemas.T2);
const hoisted_T3_5 = {
    "t2Array": hoisted_T3_1.validateArrayValidator.bind(hoisted_T3_1)
};
const hoisted_T3_6 = {
    "t2Array": hoisted_T3_4.schemaArraySchema.bind(hoisted_T3_4)
};
const hoisted_T3_7 = null;
const hoisted_T3_8 = new ObjectValidator(hoisted_T3_5, hoisted_T3_7);
const hoisted_T3_9 = new ObjectParser({
    "t2Array": hoisted_T3_2.parseArrayParser.bind(hoisted_T3_2)
}, null);
const hoisted_T3_10 = new ObjectReporter(hoisted_T3_5, hoisted_T3_7, {
    "t2Array": hoisted_T3_3.reportArrayReporter.bind(hoisted_T3_3)
}, null);
const hoisted_T3_11 = new ObjectSchema(hoisted_T3_6, null);
const hoisted_InvalidSchemaWithDate_0 = new CodecDecoder("Codec::ISO8061");
const hoisted_InvalidSchemaWithDate_1 = {
    "x": hoisted_InvalidSchemaWithDate_0.validateCodecDecoder.bind(hoisted_InvalidSchemaWithDate_0)
};
const hoisted_InvalidSchemaWithDate_2 = {
    "x": hoisted_InvalidSchemaWithDate_0.schemaCodecDecoder.bind(hoisted_InvalidSchemaWithDate_0)
};
const hoisted_InvalidSchemaWithDate_3 = null;
const hoisted_InvalidSchemaWithDate_4 = new ObjectValidator(hoisted_InvalidSchemaWithDate_1, hoisted_InvalidSchemaWithDate_3);
const hoisted_InvalidSchemaWithDate_5 = new ObjectParser({
    "x": hoisted_InvalidSchemaWithDate_0.parseCodecDecoder.bind(hoisted_InvalidSchemaWithDate_0)
}, null);
const hoisted_InvalidSchemaWithDate_6 = new ObjectReporter(hoisted_InvalidSchemaWithDate_1, hoisted_InvalidSchemaWithDate_3, {
    "x": hoisted_InvalidSchemaWithDate_0.reportCodecDecoder.bind(hoisted_InvalidSchemaWithDate_0)
}, null);
const hoisted_InvalidSchemaWithDate_7 = new ObjectSchema(hoisted_InvalidSchemaWithDate_2, null);
const hoisted_InvalidSchemaWithBigInt_0 = new CodecDecoder("Codec::BigInt");
const hoisted_InvalidSchemaWithBigInt_1 = {
    "x": hoisted_InvalidSchemaWithBigInt_0.validateCodecDecoder.bind(hoisted_InvalidSchemaWithBigInt_0)
};
const hoisted_InvalidSchemaWithBigInt_2 = {
    "x": hoisted_InvalidSchemaWithBigInt_0.schemaCodecDecoder.bind(hoisted_InvalidSchemaWithBigInt_0)
};
const hoisted_InvalidSchemaWithBigInt_3 = null;
const hoisted_InvalidSchemaWithBigInt_4 = new ObjectValidator(hoisted_InvalidSchemaWithBigInt_1, hoisted_InvalidSchemaWithBigInt_3);
const hoisted_InvalidSchemaWithBigInt_5 = new ObjectParser({
    "x": hoisted_InvalidSchemaWithBigInt_0.parseCodecDecoder.bind(hoisted_InvalidSchemaWithBigInt_0)
}, null);
const hoisted_InvalidSchemaWithBigInt_6 = new ObjectReporter(hoisted_InvalidSchemaWithBigInt_1, hoisted_InvalidSchemaWithBigInt_3, {
    "x": hoisted_InvalidSchemaWithBigInt_0.reportCodecDecoder.bind(hoisted_InvalidSchemaWithBigInt_0)
}, null);
const hoisted_InvalidSchemaWithBigInt_7 = new ObjectSchema(hoisted_InvalidSchemaWithBigInt_2, null);
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
const hoisted_RecursiveTree_0 = validators.RecursiveTree;
const hoisted_RecursiveTree_1 = new ArrayValidator(hoisted_RecursiveTree_0);
const hoisted_RecursiveTree_2 = new ArrayParser(parsers.RecursiveTree);
const hoisted_RecursiveTree_3 = new ArrayReporter(hoisted_RecursiveTree_0, reporters.RecursiveTree);
const hoisted_RecursiveTree_4 = new ArraySchema(schemas.RecursiveTree);
const hoisted_RecursiveTree_5 = {
    "children": hoisted_RecursiveTree_1.validateArrayValidator.bind(hoisted_RecursiveTree_1),
    "value": validateNumber
};
const hoisted_RecursiveTree_6 = {
    "children": hoisted_RecursiveTree_4.schemaArraySchema.bind(hoisted_RecursiveTree_4),
    "value": schemaNumber
};
const hoisted_RecursiveTree_7 = null;
const hoisted_RecursiveTree_8 = new ObjectValidator(hoisted_RecursiveTree_5, hoisted_RecursiveTree_7);
const hoisted_RecursiveTree_9 = new ObjectParser({
    "children": hoisted_RecursiveTree_2.parseArrayParser.bind(hoisted_RecursiveTree_2),
    "value": parseIdentity
}, null);
const hoisted_RecursiveTree_10 = new ObjectReporter(hoisted_RecursiveTree_5, hoisted_RecursiveTree_7, {
    "children": hoisted_RecursiveTree_3.reportArrayReporter.bind(hoisted_RecursiveTree_3),
    "value": reportNumber
}, null);
const hoisted_RecursiveTree_11 = new ObjectSchema(hoisted_RecursiveTree_6, null);
const hoisted_ValidCurrency_0 = new StringWithFormatDecoder("ValidCurrency");

export default { registerCustomFormatter, ObjectValidator, ObjectParser, ArrayParser, ArrayValidator, CodecDecoder, StringWithFormatDecoder, AnyOfValidator, AnyOfParser, AllOfValidator, AllOfParser, TupleParser, TupleValidator, RegexDecoder, ConstDecoder, AnyOfConstsDecoder, AnyOfDiscriminatedParser, AnyOfDiscriminatedValidator, validateString, validateNumber, validateFunction, validateBoolean, validateAny, validateNull, validateNever, parseIdentity, reportString, reportNumber, reportNull, reportBoolean, reportAny, reportNever, reportFunction, ArrayReporter, ObjectReporter, TupleReporter, AnyOfReporter, AllOfReporter, AnyOfDiscriminatedReporter, schemaString, schemaNumber, schemaBoolean, schemaNull, schemaAny, schemaNever, schemaFunction, ArraySchema, ObjectSchema, TupleSchema, AnyOfSchema, AllOfSchema, AnyOfDiscriminatedSchema, validators, parsers, reporters, schemas };