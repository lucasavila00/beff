//@ts-nocheck






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

function describeString(ctx) {
  return "string";
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

function describeNumber(ctx) {
  return "number";
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

function describeBoolean(ctx) {
  return "boolean";
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

function describeAny(ctx) {
  return "any";
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

function describeNull(ctx) {
  return "null";
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

function describeNever(ctx) {
  return "never";
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

function describeFunction(ctx) {
  return "function";
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
  describeConstDecoder(ctx) {
    return JSON.stringify(this.value);
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
  describeRegexDecoder(ctx) {
    return "`" + this.description + "`";
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
  describeCodecDecoder(ctx) {
    switch (this.codec) {
      case "Codec::ISO8061": {
        return "Date";
      }
      case "Codec::BigInt": {
        return "BigInt";
      }
    }
    throw new Error("INTERNAL ERROR: Unrecognized codec: " + this.codec);
  }
}

class StringWithFormatsDecoder {
  constructor(...formats) {
    this.formats = formats;
  }

  validateStringWithFormatsDecoder(ctx, input) {
    if (typeof input !== "string") {
      return false;
    }

    for (const f of this.formats) {
      const validator = stringFormatters[f];

      if (validator == null) {
        return false;
      }

      if (!validator(input)) {
        return false;
      }
    }

    return true;
  }
  parseStringWithFormatsDecoder(ctx, input) {
    return input;
  }
  reportStringWithFormatsDecoder(ctx, input) {
    return buildError(ctx, `expected string with format "${this.formats.join(" and ")}"`, input);
  }
  schemaStringWithFormatsDecoder(ctx) {
    return {
      type: "string",
      format: this.formats.join(" and "),
    };
  }
  describeStringWithFormatsDecoder(ctx) {
    if (this.formats.length === 0) {
      throw new Error("INTERNAL ERROR: No formats provided");
    }
    const [first, ...rest] = this.formats;
    let acc = `StringFormat<"${first}">`;
    for (const r of rest) {
      acc = `StringFormatExtends<${acc}, "${r}">`;
    }
    return acc;
  }
}
class NumberWithFormatsDecoder {
  constructor(...formats) {
    this.formats = formats;
  }

  validateNumberWithFormatsDecoder(ctx, input) {
    if (typeof input !== "number") {
      return false;
    }

    for (const f of this.formats) {
      const validator = numberFormatters[f];

      if (validator == null) {
        return false;
      }

      if (!validator(input)) {
        return false;
      }
    }

    return true;
  }
  parseNumberWithFormatsDecoder(ctx, input) {
    return input;
  }
  reportNumberWithFormatsDecoder(ctx, input) {
    return buildError(ctx, `expected number with format "${this.formats.join(" and ")}"`, input);
  }
  schemaNumberWithFormatsDecoder(ctx) {
    return {
      type: "number",
      format: this.formats.join(" and "),
    };
  }
  describeNumberWithFormatsDecoder(ctx) {
    if (this.formats.length === 0) {
      throw new Error("INTERNAL ERROR: No formats provided");
    }
    const [first, ...rest] = this.formats;
    let acc = `NumberFormat<"${first}">`;
    for (const r of rest) {
      acc = `NumberFormatExtends<${acc}, "${r}">`;
    }
    return acc;
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
  describeAnyOfConstsDecoder(ctx) {
    const parts = this.consts.map((it) => JSON.stringify(it));
    return parts.join(" | ");
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

class ObjectDescribe {
  constructor(dataDescriber, restDescriber) {
    this.dataDescriber = dataDescriber;
    this.restDescriber = restDescriber;
  }
  describeObjectDescribe(ctx) {
    const sortedKeys = Object.keys(this.dataDescriber).sort();
    const props = sortedKeys
      .map((k) => {
        const describer = this.dataDescriber[k];
        return `${k}: ${describer(ctx)}`;
      })
      .join(", ");

    const rest = this.restDescriber != null ? `[K in string]: ${this.restDescriber(ctx)}` : null;

    const content = [props, rest].filter((it) => it != null && it.length > 0).join(", ");
    return `{ ${content} }`;
  }
}

class MappedRecordValidator {
  constructor(keyValidator, valueValidator) {
    this.keyValidator = keyValidator;
    this.valueValidator = valueValidator;
  }

  validateMappedRecordValidator(ctx, input) {
    if (typeof input !== "object" || input == null) {
      return false;
    }

    for (const k in input) {
      const v = input[k];
      if (!this.keyValidator(ctx, k) || !this.valueValidator(ctx, v)) {
        return false;
      }
    }

    return true;
  }
}

class MappedRecordParser {
  constructor(keyParser, valueParser) {
    this.keyParser = keyParser;
    this.valueParser = valueParser;
  }

  parseMappedRecordParser(ctx, input) {
    const result = {};
    for (const k in input) {
      const parsedKey = this.keyParser(ctx, k);
      const parsedValue = this.valueParser(ctx, input[k]);
      result[parsedKey] = parsedValue;
    }
    return result;
  }
}

class MappedRecordSchema {
  constructor(keySchema, valueSchema) {
    this.keySchema = keySchema;
    this.valueSchema = valueSchema;
  }

  schemaMappedRecordSchema(ctx) {
    return {
      type: "object",
      additionalProperties: this.valueSchema(ctx),
      propertyNames: this.keySchema(ctx),
    };
  }
}

class MappedRecordDescribe {
  constructor(keyDescriber, valueDescriber) {
    this.keyDescriber = keyDescriber;
    this.valueDescriber = valueDescriber;
  }
  describeMappedRecordDescribe(ctx) {
    const k = this.keyDescriber(ctx);
    const v = this.valueDescriber(ctx);
    return `Record<${k}, ${v}>`;
  }
}

class MappedRecordReporter {
  constructor(keyValidator, valueValidator, keyReporter, valueReporter) {
    this.keyValidator = keyValidator;
    this.valueValidator = valueValidator;
    this.keyReporter = keyReporter;
    this.valueReporter = valueReporter;
  }

  reportMappedRecordReporter(ctx, input) {
    if (typeof input !== "object" || input == null) {
      return buildError(ctx, "expected object", input);
    }

    let acc = [];
    for (const k in input) {
      const v = input[k];
      const okKey = this.keyValidator(ctx, k);
      if (!okKey) {
        pushPath(ctx, k);
        const errs = this.keyReporter(ctx, k);
        acc.push(...errs);
        popPath(ctx);
      }
      const okValue = this.valueValidator(ctx, v);
      if (!okValue) {
        pushPath(ctx, k);
        const errs = this.valueReporter(ctx, v);
        acc.push(...errs);
        popPath(ctx);
      }
    }
    return acc;
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

class AnyOfDiscriminatedDescribe {
  constructor(vs) {
    this.vs = vs;
  }

  describeAnyOfDiscriminatedDescribe(ctx) {
    
    return `(${this.vs.map((v) => v(ctx)).join(" | ")})`;
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

class ArrayDescribe {
  constructor(innerDescriber) {
    this.innerDescriber = innerDescriber;
  }
  describeArrayDescribe(ctx) {
    return `Array<${this.innerDescriber(ctx)}>`;
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

class AnyOfDescribe {
  constructor(describers) {
    this.describers = describers;
  }
  describeAnyOfDescribe(ctx) {
    return `(${this.describers.map((v) => v(ctx)).join(" | ")})`;
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

class AllOfDescribe {
  constructor(describers) {
    this.describers = describers;
  }
  describeAllOfDescribe(ctx) {
    return `(${this.describers.map((v) => v(ctx)).join(" & ")})`;
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

class TupleDescribe {
  constructor(prefix, rest) {
    this.prefix = prefix;
    this.rest = rest;
  }
  describeTupleDescribe(ctx) {
    const prefix = this.prefix.map((d) => d(ctx)).join(", ");
    const rest = this.rest != null ? `...Array<${this.rest(ctx)}>` : null;

    const inner = [prefix, rest].filter((it) => it != null && it.length > 0).join(", ");
    return `[${inner}]`;
  }
}

function wrap_describe(fn, name) {
  return (ctx, input) => {
    if (ctx.measure) {
      ctx.deps_counter[name] = (ctx.deps_counter[name] || 0) + 1;
      if (ctx.deps[name]) {
        return name;
      }
      ctx.deps[name] = true;
      ctx.deps[name] = fn(ctx, input);
      return name;
    } else {
      if (ctx.deps_counter[name] > 1) {
        if (!ctx.deps[name]) {
          ctx.deps[name] = true;
          ctx.deps[name] = fn(ctx, input);
        }
        return name;
      } else {
        return fn(ctx, input);
      }
    }
  };
}


function ValidatePartialRepro(ctx, input) {
    return (hoisted_PartialRepro_21.validateObjectValidator.bind(hoisted_PartialRepro_21))(ctx, input);
}
function ParsePartialRepro(ctx, input) {
    return (hoisted_PartialRepro_22.parseObjectParser.bind(hoisted_PartialRepro_22))(ctx, input);
}
function ReportPartialRepro(ctx, input) {
    return (hoisted_PartialRepro_23.reportObjectReporter.bind(hoisted_PartialRepro_23))(ctx, input);
}
function SchemaPartialRepro(ctx, input) {
    if (ctx.seen["PartialRepro"]) {
        return {};
    }
    ctx.seen["PartialRepro"] = true;
    var tmp = (hoisted_PartialRepro_24.schemaObjectSchema.bind(hoisted_PartialRepro_24))(ctx);
    delete ctx.seen["PartialRepro"];
    return tmp;
}
function DescribePartialRepro(ctx, input) {
    return (hoisted_PartialRepro_25.describeObjectDescribe.bind(hoisted_PartialRepro_25))(ctx);
}
function ValidateTransportedValue(ctx, input) {
    return (hoisted_TransportedValue_17.validateAnyOfValidator.bind(hoisted_TransportedValue_17))(ctx, input);
}
function ParseTransportedValue(ctx, input) {
    return (hoisted_TransportedValue_18.parseAnyOfParser.bind(hoisted_TransportedValue_18))(ctx, input);
}
function ReportTransportedValue(ctx, input) {
    return (hoisted_TransportedValue_19.reportAnyOfReporter.bind(hoisted_TransportedValue_19))(ctx, input);
}
function SchemaTransportedValue(ctx, input) {
    if (ctx.seen["TransportedValue"]) {
        return {};
    }
    ctx.seen["TransportedValue"] = true;
    var tmp = (hoisted_TransportedValue_20.schemaAnyOfSchema.bind(hoisted_TransportedValue_20))(ctx);
    delete ctx.seen["TransportedValue"];
    return tmp;
}
function DescribeTransportedValue(ctx, input) {
    return (hoisted_TransportedValue_21.describeAnyOfDescribe.bind(hoisted_TransportedValue_21))(ctx);
}
function ValidateOnlyAKey(ctx, input) {
    return (hoisted_OnlyAKey_5.validateObjectValidator.bind(hoisted_OnlyAKey_5))(ctx, input);
}
function ParseOnlyAKey(ctx, input) {
    return (hoisted_OnlyAKey_6.parseObjectParser.bind(hoisted_OnlyAKey_6))(ctx, input);
}
function ReportOnlyAKey(ctx, input) {
    return (hoisted_OnlyAKey_7.reportObjectReporter.bind(hoisted_OnlyAKey_7))(ctx, input);
}
function SchemaOnlyAKey(ctx, input) {
    if (ctx.seen["OnlyAKey"]) {
        return {};
    }
    ctx.seen["OnlyAKey"] = true;
    var tmp = (hoisted_OnlyAKey_8.schemaObjectSchema.bind(hoisted_OnlyAKey_8))(ctx);
    delete ctx.seen["OnlyAKey"];
    return tmp;
}
function DescribeOnlyAKey(ctx, input) {
    return (hoisted_OnlyAKey_9.describeObjectDescribe.bind(hoisted_OnlyAKey_9))(ctx);
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
function DescribeAllTs(ctx, input) {
    return (hoisted_AllTs_0.describeAnyOfConstsDecoder.bind(hoisted_AllTs_0))(ctx);
}
function ValidateAObject(ctx, input) {
    return (hoisted_AObject_6.validateObjectValidator.bind(hoisted_AObject_6))(ctx, input);
}
function ParseAObject(ctx, input) {
    return (hoisted_AObject_7.parseObjectParser.bind(hoisted_AObject_7))(ctx, input);
}
function ReportAObject(ctx, input) {
    return (hoisted_AObject_8.reportObjectReporter.bind(hoisted_AObject_8))(ctx, input);
}
function SchemaAObject(ctx, input) {
    if (ctx.seen["AObject"]) {
        return {};
    }
    ctx.seen["AObject"] = true;
    var tmp = (hoisted_AObject_9.schemaObjectSchema.bind(hoisted_AObject_9))(ctx);
    delete ctx.seen["AObject"];
    return tmp;
}
function DescribeAObject(ctx, input) {
    return (hoisted_AObject_10.describeObjectDescribe.bind(hoisted_AObject_10))(ctx);
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
function DescribeVersion(ctx, input) {
    return (hoisted_Version_0.describeRegexDecoder.bind(hoisted_Version_0))(ctx);
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
function DescribeVersion2(ctx, input) {
    return (hoisted_Version2_0.describeRegexDecoder.bind(hoisted_Version2_0))(ctx);
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
function DescribeAccessLevel2(ctx, input) {
    return (hoisted_AccessLevel2_0.describeAnyOfConstsDecoder.bind(hoisted_AccessLevel2_0))(ctx);
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
function DescribeAccessLevelTpl2(ctx, input) {
    return (hoisted_AccessLevelTpl2_0.describeRegexDecoder.bind(hoisted_AccessLevelTpl2_0))(ctx);
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
function DescribeAccessLevel(ctx, input) {
    return (hoisted_AccessLevel_0.describeAnyOfConstsDecoder.bind(hoisted_AccessLevel_0))(ctx);
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
function DescribeAccessLevelTpl(ctx, input) {
    return (hoisted_AccessLevelTpl_0.describeRegexDecoder.bind(hoisted_AccessLevelTpl_0))(ctx);
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
function DescribeArr3(ctx, input) {
    return (hoisted_Arr3_0.describeAnyOfConstsDecoder.bind(hoisted_Arr3_0))(ctx);
}
function ValidateOmitSettings(ctx, input) {
    return (hoisted_OmitSettings_17.validateObjectValidator.bind(hoisted_OmitSettings_17))(ctx, input);
}
function ParseOmitSettings(ctx, input) {
    return (hoisted_OmitSettings_18.parseObjectParser.bind(hoisted_OmitSettings_18))(ctx, input);
}
function ReportOmitSettings(ctx, input) {
    return (hoisted_OmitSettings_19.reportObjectReporter.bind(hoisted_OmitSettings_19))(ctx, input);
}
function SchemaOmitSettings(ctx, input) {
    if (ctx.seen["OmitSettings"]) {
        return {};
    }
    ctx.seen["OmitSettings"] = true;
    var tmp = (hoisted_OmitSettings_20.schemaObjectSchema.bind(hoisted_OmitSettings_20))(ctx);
    delete ctx.seen["OmitSettings"];
    return tmp;
}
function DescribeOmitSettings(ctx, input) {
    return (hoisted_OmitSettings_21.describeObjectDescribe.bind(hoisted_OmitSettings_21))(ctx);
}
function ValidateSettings(ctx, input) {
    return (hoisted_Settings_17.validateObjectValidator.bind(hoisted_Settings_17))(ctx, input);
}
function ParseSettings(ctx, input) {
    return (hoisted_Settings_18.parseObjectParser.bind(hoisted_Settings_18))(ctx, input);
}
function ReportSettings(ctx, input) {
    return (hoisted_Settings_19.reportObjectReporter.bind(hoisted_Settings_19))(ctx, input);
}
function SchemaSettings(ctx, input) {
    if (ctx.seen["Settings"]) {
        return {};
    }
    ctx.seen["Settings"] = true;
    var tmp = (hoisted_Settings_20.schemaObjectSchema.bind(hoisted_Settings_20))(ctx);
    delete ctx.seen["Settings"];
    return tmp;
}
function DescribeSettings(ctx, input) {
    return (hoisted_Settings_21.describeObjectDescribe.bind(hoisted_Settings_21))(ctx);
}
function ValidatePartialObject(ctx, input) {
    return (hoisted_PartialObject_21.validateObjectValidator.bind(hoisted_PartialObject_21))(ctx, input);
}
function ParsePartialObject(ctx, input) {
    return (hoisted_PartialObject_22.parseObjectParser.bind(hoisted_PartialObject_22))(ctx, input);
}
function ReportPartialObject(ctx, input) {
    return (hoisted_PartialObject_23.reportObjectReporter.bind(hoisted_PartialObject_23))(ctx, input);
}
function SchemaPartialObject(ctx, input) {
    if (ctx.seen["PartialObject"]) {
        return {};
    }
    ctx.seen["PartialObject"] = true;
    var tmp = (hoisted_PartialObject_24.schemaObjectSchema.bind(hoisted_PartialObject_24))(ctx);
    delete ctx.seen["PartialObject"];
    return tmp;
}
function DescribePartialObject(ctx, input) {
    return (hoisted_PartialObject_25.describeObjectDescribe.bind(hoisted_PartialObject_25))(ctx);
}
function ValidateRequiredPartialObject(ctx, input) {
    return (hoisted_RequiredPartialObject_5.validateObjectValidator.bind(hoisted_RequiredPartialObject_5))(ctx, input);
}
function ParseRequiredPartialObject(ctx, input) {
    return (hoisted_RequiredPartialObject_6.parseObjectParser.bind(hoisted_RequiredPartialObject_6))(ctx, input);
}
function ReportRequiredPartialObject(ctx, input) {
    return (hoisted_RequiredPartialObject_7.reportObjectReporter.bind(hoisted_RequiredPartialObject_7))(ctx, input);
}
function SchemaRequiredPartialObject(ctx, input) {
    if (ctx.seen["RequiredPartialObject"]) {
        return {};
    }
    ctx.seen["RequiredPartialObject"] = true;
    var tmp = (hoisted_RequiredPartialObject_8.schemaObjectSchema.bind(hoisted_RequiredPartialObject_8))(ctx);
    delete ctx.seen["RequiredPartialObject"];
    return tmp;
}
function DescribeRequiredPartialObject(ctx, input) {
    return (hoisted_RequiredPartialObject_9.describeObjectDescribe.bind(hoisted_RequiredPartialObject_9))(ctx);
}
function ValidateLevelAndDSettings(ctx, input) {
    return (hoisted_LevelAndDSettings_17.validateObjectValidator.bind(hoisted_LevelAndDSettings_17))(ctx, input);
}
function ParseLevelAndDSettings(ctx, input) {
    return (hoisted_LevelAndDSettings_18.parseObjectParser.bind(hoisted_LevelAndDSettings_18))(ctx, input);
}
function ReportLevelAndDSettings(ctx, input) {
    return (hoisted_LevelAndDSettings_19.reportObjectReporter.bind(hoisted_LevelAndDSettings_19))(ctx, input);
}
function SchemaLevelAndDSettings(ctx, input) {
    if (ctx.seen["LevelAndDSettings"]) {
        return {};
    }
    ctx.seen["LevelAndDSettings"] = true;
    var tmp = (hoisted_LevelAndDSettings_20.schemaObjectSchema.bind(hoisted_LevelAndDSettings_20))(ctx);
    delete ctx.seen["LevelAndDSettings"];
    return tmp;
}
function DescribeLevelAndDSettings(ctx, input) {
    return (hoisted_LevelAndDSettings_21.describeObjectDescribe.bind(hoisted_LevelAndDSettings_21))(ctx);
}
function ValidatePartialSettings(ctx, input) {
    return (hoisted_PartialSettings_42.validateObjectValidator.bind(hoisted_PartialSettings_42))(ctx, input);
}
function ParsePartialSettings(ctx, input) {
    return (hoisted_PartialSettings_43.parseObjectParser.bind(hoisted_PartialSettings_43))(ctx, input);
}
function ReportPartialSettings(ctx, input) {
    return (hoisted_PartialSettings_44.reportObjectReporter.bind(hoisted_PartialSettings_44))(ctx, input);
}
function SchemaPartialSettings(ctx, input) {
    if (ctx.seen["PartialSettings"]) {
        return {};
    }
    ctx.seen["PartialSettings"] = true;
    var tmp = (hoisted_PartialSettings_45.schemaObjectSchema.bind(hoisted_PartialSettings_45))(ctx);
    delete ctx.seen["PartialSettings"];
    return tmp;
}
function DescribePartialSettings(ctx, input) {
    return (hoisted_PartialSettings_46.describeObjectDescribe.bind(hoisted_PartialSettings_46))(ctx);
}
function ValidateExtra(ctx, input) {
    return (hoisted_Extra_5.validateObjectValidator.bind(hoisted_Extra_5))(ctx, input);
}
function ParseExtra(ctx, input) {
    return (hoisted_Extra_6.parseObjectParser.bind(hoisted_Extra_6))(ctx, input);
}
function ReportExtra(ctx, input) {
    return (hoisted_Extra_7.reportObjectReporter.bind(hoisted_Extra_7))(ctx, input);
}
function SchemaExtra(ctx, input) {
    if (ctx.seen["Extra"]) {
        return {};
    }
    ctx.seen["Extra"] = true;
    var tmp = (hoisted_Extra_8.schemaObjectSchema.bind(hoisted_Extra_8))(ctx);
    delete ctx.seen["Extra"];
    return tmp;
}
function DescribeExtra(ctx, input) {
    return (hoisted_Extra_9.describeObjectDescribe.bind(hoisted_Extra_9))(ctx);
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
function DescribeAvatarSize(ctx, input) {
    return (hoisted_AvatarSize_0.describeRegexDecoder.bind(hoisted_AvatarSize_0))(ctx);
}
function ValidateUser(ctx, input) {
    return (hoisted_User_11.validateObjectValidator.bind(hoisted_User_11))(ctx, input);
}
function ParseUser(ctx, input) {
    return (hoisted_User_12.parseObjectParser.bind(hoisted_User_12))(ctx, input);
}
function ReportUser(ctx, input) {
    return (hoisted_User_13.reportObjectReporter.bind(hoisted_User_13))(ctx, input);
}
function SchemaUser(ctx, input) {
    if (ctx.seen["User"]) {
        return {};
    }
    ctx.seen["User"] = true;
    var tmp = (hoisted_User_14.schemaObjectSchema.bind(hoisted_User_14))(ctx);
    delete ctx.seen["User"];
    return tmp;
}
function DescribeUser(ctx, input) {
    return (hoisted_User_15.describeObjectDescribe.bind(hoisted_User_15))(ctx);
}
function ValidatePublicUser(ctx, input) {
    return (hoisted_PublicUser_5.validateObjectValidator.bind(hoisted_PublicUser_5))(ctx, input);
}
function ParsePublicUser(ctx, input) {
    return (hoisted_PublicUser_6.parseObjectParser.bind(hoisted_PublicUser_6))(ctx, input);
}
function ReportPublicUser(ctx, input) {
    return (hoisted_PublicUser_7.reportObjectReporter.bind(hoisted_PublicUser_7))(ctx, input);
}
function SchemaPublicUser(ctx, input) {
    if (ctx.seen["PublicUser"]) {
        return {};
    }
    ctx.seen["PublicUser"] = true;
    var tmp = (hoisted_PublicUser_8.schemaObjectSchema.bind(hoisted_PublicUser_8))(ctx);
    delete ctx.seen["PublicUser"];
    return tmp;
}
function DescribePublicUser(ctx, input) {
    return (hoisted_PublicUser_9.describeObjectDescribe.bind(hoisted_PublicUser_9))(ctx);
}
function ValidateReq(ctx, input) {
    return (hoisted_Req_5.validateObjectValidator.bind(hoisted_Req_5))(ctx, input);
}
function ParseReq(ctx, input) {
    return (hoisted_Req_6.parseObjectParser.bind(hoisted_Req_6))(ctx, input);
}
function ReportReq(ctx, input) {
    return (hoisted_Req_7.reportObjectReporter.bind(hoisted_Req_7))(ctx, input);
}
function SchemaReq(ctx, input) {
    if (ctx.seen["Req"]) {
        return {};
    }
    ctx.seen["Req"] = true;
    var tmp = (hoisted_Req_8.schemaObjectSchema.bind(hoisted_Req_8))(ctx);
    delete ctx.seen["Req"];
    return tmp;
}
function DescribeReq(ctx, input) {
    return (hoisted_Req_9.describeObjectDescribe.bind(hoisted_Req_9))(ctx);
}
function ValidateWithOptionals(ctx, input) {
    return (hoisted_WithOptionals_13.validateObjectValidator.bind(hoisted_WithOptionals_13))(ctx, input);
}
function ParseWithOptionals(ctx, input) {
    return (hoisted_WithOptionals_14.parseObjectParser.bind(hoisted_WithOptionals_14))(ctx, input);
}
function ReportWithOptionals(ctx, input) {
    return (hoisted_WithOptionals_15.reportObjectReporter.bind(hoisted_WithOptionals_15))(ctx, input);
}
function SchemaWithOptionals(ctx, input) {
    if (ctx.seen["WithOptionals"]) {
        return {};
    }
    ctx.seen["WithOptionals"] = true;
    var tmp = (hoisted_WithOptionals_16.schemaObjectSchema.bind(hoisted_WithOptionals_16))(ctx);
    delete ctx.seen["WithOptionals"];
    return tmp;
}
function DescribeWithOptionals(ctx, input) {
    return (hoisted_WithOptionals_17.describeObjectDescribe.bind(hoisted_WithOptionals_17))(ctx);
}
function ValidateRepro1(ctx, input) {
    return (hoisted_Repro1_13.validateObjectValidator.bind(hoisted_Repro1_13))(ctx, input);
}
function ParseRepro1(ctx, input) {
    return (hoisted_Repro1_14.parseObjectParser.bind(hoisted_Repro1_14))(ctx, input);
}
function ReportRepro1(ctx, input) {
    return (hoisted_Repro1_15.reportObjectReporter.bind(hoisted_Repro1_15))(ctx, input);
}
function SchemaRepro1(ctx, input) {
    if (ctx.seen["Repro1"]) {
        return {};
    }
    ctx.seen["Repro1"] = true;
    var tmp = (hoisted_Repro1_16.schemaObjectSchema.bind(hoisted_Repro1_16))(ctx);
    delete ctx.seen["Repro1"];
    return tmp;
}
function DescribeRepro1(ctx, input) {
    return (hoisted_Repro1_17.describeObjectDescribe.bind(hoisted_Repro1_17))(ctx);
}
function ValidateRepro2(ctx, input) {
    return (hoisted_Repro2_5.validateObjectValidator.bind(hoisted_Repro2_5))(ctx, input);
}
function ParseRepro2(ctx, input) {
    return (hoisted_Repro2_6.parseObjectParser.bind(hoisted_Repro2_6))(ctx, input);
}
function ReportRepro2(ctx, input) {
    return (hoisted_Repro2_7.reportObjectReporter.bind(hoisted_Repro2_7))(ctx, input);
}
function SchemaRepro2(ctx, input) {
    if (ctx.seen["Repro2"]) {
        return {};
    }
    ctx.seen["Repro2"] = true;
    var tmp = (hoisted_Repro2_8.schemaObjectSchema.bind(hoisted_Repro2_8))(ctx);
    delete ctx.seen["Repro2"];
    return tmp;
}
function DescribeRepro2(ctx, input) {
    return (hoisted_Repro2_9.describeObjectDescribe.bind(hoisted_Repro2_9))(ctx);
}
function ValidateSettingsUpdate(ctx, input) {
    return (hoisted_SettingsUpdate_14.validateAnyOfValidator.bind(hoisted_SettingsUpdate_14))(ctx, input);
}
function ParseSettingsUpdate(ctx, input) {
    return (hoisted_SettingsUpdate_15.parseAnyOfParser.bind(hoisted_SettingsUpdate_15))(ctx, input);
}
function ReportSettingsUpdate(ctx, input) {
    return (hoisted_SettingsUpdate_16.reportAnyOfReporter.bind(hoisted_SettingsUpdate_16))(ctx, input);
}
function SchemaSettingsUpdate(ctx, input) {
    if (ctx.seen["SettingsUpdate"]) {
        return {};
    }
    ctx.seen["SettingsUpdate"] = true;
    var tmp = (hoisted_SettingsUpdate_17.schemaAnyOfSchema.bind(hoisted_SettingsUpdate_17))(ctx);
    delete ctx.seen["SettingsUpdate"];
    return tmp;
}
function DescribeSettingsUpdate(ctx, input) {
    return (hoisted_SettingsUpdate_18.describeAnyOfDescribe.bind(hoisted_SettingsUpdate_18))(ctx);
}
function ValidateMapped(ctx, input) {
    return (hoisted_Mapped_27.validateObjectValidator.bind(hoisted_Mapped_27))(ctx, input);
}
function ParseMapped(ctx, input) {
    return (hoisted_Mapped_28.parseObjectParser.bind(hoisted_Mapped_28))(ctx, input);
}
function ReportMapped(ctx, input) {
    return (hoisted_Mapped_29.reportObjectReporter.bind(hoisted_Mapped_29))(ctx, input);
}
function SchemaMapped(ctx, input) {
    if (ctx.seen["Mapped"]) {
        return {};
    }
    ctx.seen["Mapped"] = true;
    var tmp = (hoisted_Mapped_30.schemaObjectSchema.bind(hoisted_Mapped_30))(ctx);
    delete ctx.seen["Mapped"];
    return tmp;
}
function DescribeMapped(ctx, input) {
    return (hoisted_Mapped_31.describeObjectDescribe.bind(hoisted_Mapped_31))(ctx);
}
function ValidateMappedOptional(ctx, input) {
    return (hoisted_MappedOptional_43.validateObjectValidator.bind(hoisted_MappedOptional_43))(ctx, input);
}
function ParseMappedOptional(ctx, input) {
    return (hoisted_MappedOptional_44.parseObjectParser.bind(hoisted_MappedOptional_44))(ctx, input);
}
function ReportMappedOptional(ctx, input) {
    return (hoisted_MappedOptional_45.reportObjectReporter.bind(hoisted_MappedOptional_45))(ctx, input);
}
function SchemaMappedOptional(ctx, input) {
    if (ctx.seen["MappedOptional"]) {
        return {};
    }
    ctx.seen["MappedOptional"] = true;
    var tmp = (hoisted_MappedOptional_46.schemaObjectSchema.bind(hoisted_MappedOptional_46))(ctx);
    delete ctx.seen["MappedOptional"];
    return tmp;
}
function DescribeMappedOptional(ctx, input) {
    return (hoisted_MappedOptional_47.describeObjectDescribe.bind(hoisted_MappedOptional_47))(ctx);
}
function ValidateDiscriminatedUnion(ctx, input) {
    return (hoisted_DiscriminatedUnion_198.validateAnyOfDiscriminatedValidator.bind(hoisted_DiscriminatedUnion_198))(ctx, input);
}
function ParseDiscriminatedUnion(ctx, input) {
    return (hoisted_DiscriminatedUnion_199.parseAnyOfDiscriminatedParser.bind(hoisted_DiscriminatedUnion_199))(ctx, input);
}
function ReportDiscriminatedUnion(ctx, input) {
    return (hoisted_DiscriminatedUnion_200.reportAnyOfDiscriminatedReporter.bind(hoisted_DiscriminatedUnion_200))(ctx, input);
}
function SchemaDiscriminatedUnion(ctx, input) {
    if (ctx.seen["DiscriminatedUnion"]) {
        return {};
    }
    ctx.seen["DiscriminatedUnion"] = true;
    var tmp = (hoisted_DiscriminatedUnion_201.schemaAnyOfDiscriminatedSchema.bind(hoisted_DiscriminatedUnion_201))(ctx);
    delete ctx.seen["DiscriminatedUnion"];
    return tmp;
}
function DescribeDiscriminatedUnion(ctx, input) {
    return (hoisted_DiscriminatedUnion_202.describeAnyOfDiscriminatedDescribe.bind(hoisted_DiscriminatedUnion_202))(ctx);
}
function ValidateDiscriminatedUnion2(ctx, input) {
    return (hoisted_DiscriminatedUnion2_65.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion2_65))(ctx, input);
}
function ParseDiscriminatedUnion2(ctx, input) {
    return (hoisted_DiscriminatedUnion2_66.parseAnyOfParser.bind(hoisted_DiscriminatedUnion2_66))(ctx, input);
}
function ReportDiscriminatedUnion2(ctx, input) {
    return (hoisted_DiscriminatedUnion2_67.reportAnyOfReporter.bind(hoisted_DiscriminatedUnion2_67))(ctx, input);
}
function SchemaDiscriminatedUnion2(ctx, input) {
    if (ctx.seen["DiscriminatedUnion2"]) {
        return {};
    }
    ctx.seen["DiscriminatedUnion2"] = true;
    var tmp = (hoisted_DiscriminatedUnion2_68.schemaAnyOfSchema.bind(hoisted_DiscriminatedUnion2_68))(ctx);
    delete ctx.seen["DiscriminatedUnion2"];
    return tmp;
}
function DescribeDiscriminatedUnion2(ctx, input) {
    return (hoisted_DiscriminatedUnion2_69.describeAnyOfDescribe.bind(hoisted_DiscriminatedUnion2_69))(ctx);
}
function ValidateDiscriminatedUnion3(ctx, input) {
    return (hoisted_DiscriminatedUnion3_77.validateAnyOfDiscriminatedValidator.bind(hoisted_DiscriminatedUnion3_77))(ctx, input);
}
function ParseDiscriminatedUnion3(ctx, input) {
    return (hoisted_DiscriminatedUnion3_78.parseAnyOfDiscriminatedParser.bind(hoisted_DiscriminatedUnion3_78))(ctx, input);
}
function ReportDiscriminatedUnion3(ctx, input) {
    return (hoisted_DiscriminatedUnion3_79.reportAnyOfDiscriminatedReporter.bind(hoisted_DiscriminatedUnion3_79))(ctx, input);
}
function SchemaDiscriminatedUnion3(ctx, input) {
    if (ctx.seen["DiscriminatedUnion3"]) {
        return {};
    }
    ctx.seen["DiscriminatedUnion3"] = true;
    var tmp = (hoisted_DiscriminatedUnion3_80.schemaAnyOfDiscriminatedSchema.bind(hoisted_DiscriminatedUnion3_80))(ctx);
    delete ctx.seen["DiscriminatedUnion3"];
    return tmp;
}
function DescribeDiscriminatedUnion3(ctx, input) {
    return (hoisted_DiscriminatedUnion3_81.describeAnyOfDiscriminatedDescribe.bind(hoisted_DiscriminatedUnion3_81))(ctx);
}
function ValidateDiscriminatedUnion4(ctx, input) {
    return (hoisted_DiscriminatedUnion4_47.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion4_47))(ctx, input);
}
function ParseDiscriminatedUnion4(ctx, input) {
    return (hoisted_DiscriminatedUnion4_48.parseAnyOfParser.bind(hoisted_DiscriminatedUnion4_48))(ctx, input);
}
function ReportDiscriminatedUnion4(ctx, input) {
    return (hoisted_DiscriminatedUnion4_49.reportAnyOfReporter.bind(hoisted_DiscriminatedUnion4_49))(ctx, input);
}
function SchemaDiscriminatedUnion4(ctx, input) {
    if (ctx.seen["DiscriminatedUnion4"]) {
        return {};
    }
    ctx.seen["DiscriminatedUnion4"] = true;
    var tmp = (hoisted_DiscriminatedUnion4_50.schemaAnyOfSchema.bind(hoisted_DiscriminatedUnion4_50))(ctx);
    delete ctx.seen["DiscriminatedUnion4"];
    return tmp;
}
function DescribeDiscriminatedUnion4(ctx, input) {
    return (hoisted_DiscriminatedUnion4_51.describeAnyOfDescribe.bind(hoisted_DiscriminatedUnion4_51))(ctx);
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
function DescribeAllTypes(ctx, input) {
    return (hoisted_AllTypes_0.describeAnyOfConstsDecoder.bind(hoisted_AllTypes_0))(ctx);
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
function DescribeOtherEnum(ctx, input) {
    return (hoisted_OtherEnum_0.describeAnyOfConstsDecoder.bind(hoisted_OtherEnum_0))(ctx);
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
function DescribeArr2(ctx, input) {
    return (hoisted_Arr2_0.describeAnyOfConstsDecoder.bind(hoisted_Arr2_0))(ctx);
}
function ValidateValidCurrency(ctx, input) {
    return (hoisted_ValidCurrency_0.validateStringWithFormatsDecoder.bind(hoisted_ValidCurrency_0))(ctx, input);
}
function ParseValidCurrency(ctx, input) {
    return (hoisted_ValidCurrency_0.parseStringWithFormatsDecoder.bind(hoisted_ValidCurrency_0))(ctx, input);
}
function ReportValidCurrency(ctx, input) {
    return (hoisted_ValidCurrency_0.reportStringWithFormatsDecoder.bind(hoisted_ValidCurrency_0))(ctx, input);
}
function SchemaValidCurrency(ctx, input) {
    if (ctx.seen["ValidCurrency"]) {
        return {};
    }
    ctx.seen["ValidCurrency"] = true;
    var tmp = (hoisted_ValidCurrency_0.schemaStringWithFormatsDecoder.bind(hoisted_ValidCurrency_0))(ctx);
    delete ctx.seen["ValidCurrency"];
    return tmp;
}
function DescribeValidCurrency(ctx, input) {
    return (hoisted_ValidCurrency_0.describeStringWithFormatsDecoder.bind(hoisted_ValidCurrency_0))(ctx);
}
function ValidateUnionWithEnumAccess(ctx, input) {
    return (hoisted_UnionWithEnumAccess_99.validateAnyOfDiscriminatedValidator.bind(hoisted_UnionWithEnumAccess_99))(ctx, input);
}
function ParseUnionWithEnumAccess(ctx, input) {
    return (hoisted_UnionWithEnumAccess_100.parseAnyOfDiscriminatedParser.bind(hoisted_UnionWithEnumAccess_100))(ctx, input);
}
function ReportUnionWithEnumAccess(ctx, input) {
    return (hoisted_UnionWithEnumAccess_101.reportAnyOfDiscriminatedReporter.bind(hoisted_UnionWithEnumAccess_101))(ctx, input);
}
function SchemaUnionWithEnumAccess(ctx, input) {
    if (ctx.seen["UnionWithEnumAccess"]) {
        return {};
    }
    ctx.seen["UnionWithEnumAccess"] = true;
    var tmp = (hoisted_UnionWithEnumAccess_102.schemaAnyOfDiscriminatedSchema.bind(hoisted_UnionWithEnumAccess_102))(ctx);
    delete ctx.seen["UnionWithEnumAccess"];
    return tmp;
}
function DescribeUnionWithEnumAccess(ctx, input) {
    return (hoisted_UnionWithEnumAccess_103.describeAnyOfDiscriminatedDescribe.bind(hoisted_UnionWithEnumAccess_103))(ctx);
}
function ValidateShape(ctx, input) {
    return (hoisted_Shape_99.validateAnyOfDiscriminatedValidator.bind(hoisted_Shape_99))(ctx, input);
}
function ParseShape(ctx, input) {
    return (hoisted_Shape_100.parseAnyOfDiscriminatedParser.bind(hoisted_Shape_100))(ctx, input);
}
function ReportShape(ctx, input) {
    return (hoisted_Shape_101.reportAnyOfDiscriminatedReporter.bind(hoisted_Shape_101))(ctx, input);
}
function SchemaShape(ctx, input) {
    if (ctx.seen["Shape"]) {
        return {};
    }
    ctx.seen["Shape"] = true;
    var tmp = (hoisted_Shape_102.schemaAnyOfDiscriminatedSchema.bind(hoisted_Shape_102))(ctx);
    delete ctx.seen["Shape"];
    return tmp;
}
function DescribeShape(ctx, input) {
    return (hoisted_Shape_103.describeAnyOfDiscriminatedDescribe.bind(hoisted_Shape_103))(ctx);
}
function ValidateT3(ctx, input) {
    return (hoisted_T3_66.validateAnyOfDiscriminatedValidator.bind(hoisted_T3_66))(ctx, input);
}
function ParseT3(ctx, input) {
    return (hoisted_T3_67.parseAnyOfDiscriminatedParser.bind(hoisted_T3_67))(ctx, input);
}
function ReportT3(ctx, input) {
    return (hoisted_T3_68.reportAnyOfDiscriminatedReporter.bind(hoisted_T3_68))(ctx, input);
}
function SchemaT3(ctx, input) {
    if (ctx.seen["T3"]) {
        return {};
    }
    ctx.seen["T3"] = true;
    var tmp = (hoisted_T3_69.schemaAnyOfDiscriminatedSchema.bind(hoisted_T3_69))(ctx);
    delete ctx.seen["T3"];
    return tmp;
}
function DescribeT3(ctx, input) {
    return (hoisted_T3_70.describeAnyOfDiscriminatedDescribe.bind(hoisted_T3_70))(ctx);
}
function ValidateBObject(ctx, input) {
    return (hoisted_BObject_6.validateObjectValidator.bind(hoisted_BObject_6))(ctx, input);
}
function ParseBObject(ctx, input) {
    return (hoisted_BObject_7.parseObjectParser.bind(hoisted_BObject_7))(ctx, input);
}
function ReportBObject(ctx, input) {
    return (hoisted_BObject_8.reportObjectReporter.bind(hoisted_BObject_8))(ctx, input);
}
function SchemaBObject(ctx, input) {
    if (ctx.seen["BObject"]) {
        return {};
    }
    ctx.seen["BObject"] = true;
    var tmp = (hoisted_BObject_9.schemaObjectSchema.bind(hoisted_BObject_9))(ctx);
    delete ctx.seen["BObject"];
    return tmp;
}
function DescribeBObject(ctx, input) {
    return (hoisted_BObject_10.describeObjectDescribe.bind(hoisted_BObject_10))(ctx);
}
function ValidateDEF(ctx, input) {
    return (hoisted_DEF_5.validateObjectValidator.bind(hoisted_DEF_5))(ctx, input);
}
function ParseDEF(ctx, input) {
    return (hoisted_DEF_6.parseObjectParser.bind(hoisted_DEF_6))(ctx, input);
}
function ReportDEF(ctx, input) {
    return (hoisted_DEF_7.reportObjectReporter.bind(hoisted_DEF_7))(ctx, input);
}
function SchemaDEF(ctx, input) {
    if (ctx.seen["DEF"]) {
        return {};
    }
    ctx.seen["DEF"] = true;
    var tmp = (hoisted_DEF_8.schemaObjectSchema.bind(hoisted_DEF_8))(ctx);
    delete ctx.seen["DEF"];
    return tmp;
}
function DescribeDEF(ctx, input) {
    return (hoisted_DEF_9.describeObjectDescribe.bind(hoisted_DEF_9))(ctx);
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
function DescribeKDEF(ctx, input) {
    return (hoisted_KDEF_0.describeConstDecoder.bind(hoisted_KDEF_0))(ctx);
}
function ValidateABC(ctx, input) {
    return (hoisted_ABC_5.validateObjectValidator.bind(hoisted_ABC_5))(ctx, input);
}
function ParseABC(ctx, input) {
    return (hoisted_ABC_6.parseObjectParser.bind(hoisted_ABC_6))(ctx, input);
}
function ReportABC(ctx, input) {
    return (hoisted_ABC_7.reportObjectReporter.bind(hoisted_ABC_7))(ctx, input);
}
function SchemaABC(ctx, input) {
    if (ctx.seen["ABC"]) {
        return {};
    }
    ctx.seen["ABC"] = true;
    var tmp = (hoisted_ABC_8.schemaObjectSchema.bind(hoisted_ABC_8))(ctx);
    delete ctx.seen["ABC"];
    return tmp;
}
function DescribeABC(ctx, input) {
    return (hoisted_ABC_9.describeObjectDescribe.bind(hoisted_ABC_9))(ctx);
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
function DescribeKABC(ctx, input) {
    return (describeNever)(ctx);
}
function ValidateK(ctx, input) {
    return (hoisted_K_3.validateAnyOfValidator.bind(hoisted_K_3))(ctx, input);
}
function ParseK(ctx, input) {
    return (hoisted_K_4.parseAnyOfParser.bind(hoisted_K_4))(ctx, input);
}
function ReportK(ctx, input) {
    return (hoisted_K_5.reportAnyOfReporter.bind(hoisted_K_5))(ctx, input);
}
function SchemaK(ctx, input) {
    if (ctx.seen["K"]) {
        return {};
    }
    ctx.seen["K"] = true;
    var tmp = (hoisted_K_6.schemaAnyOfSchema.bind(hoisted_K_6))(ctx);
    delete ctx.seen["K"];
    return tmp;
}
function DescribeK(ctx, input) {
    return (hoisted_K_7.describeAnyOfDescribe.bind(hoisted_K_7))(ctx);
}
function ValidateNonInfiniteNumber(ctx, input) {
    return (hoisted_NonInfiniteNumber_0.validateNumberWithFormatsDecoder.bind(hoisted_NonInfiniteNumber_0))(ctx, input);
}
function ParseNonInfiniteNumber(ctx, input) {
    return (hoisted_NonInfiniteNumber_0.parseNumberWithFormatsDecoder.bind(hoisted_NonInfiniteNumber_0))(ctx, input);
}
function ReportNonInfiniteNumber(ctx, input) {
    return (hoisted_NonInfiniteNumber_0.reportNumberWithFormatsDecoder.bind(hoisted_NonInfiniteNumber_0))(ctx, input);
}
function SchemaNonInfiniteNumber(ctx, input) {
    if (ctx.seen["NonInfiniteNumber"]) {
        return {};
    }
    ctx.seen["NonInfiniteNumber"] = true;
    var tmp = (hoisted_NonInfiniteNumber_0.schemaNumberWithFormatsDecoder.bind(hoisted_NonInfiniteNumber_0))(ctx);
    delete ctx.seen["NonInfiniteNumber"];
    return tmp;
}
function DescribeNonInfiniteNumber(ctx, input) {
    return (hoisted_NonInfiniteNumber_0.describeNumberWithFormatsDecoder.bind(hoisted_NonInfiniteNumber_0))(ctx);
}
function ValidateNonNegativeNumber(ctx, input) {
    return (hoisted_NonNegativeNumber_0.validateNumberWithFormatsDecoder.bind(hoisted_NonNegativeNumber_0))(ctx, input);
}
function ParseNonNegativeNumber(ctx, input) {
    return (hoisted_NonNegativeNumber_0.parseNumberWithFormatsDecoder.bind(hoisted_NonNegativeNumber_0))(ctx, input);
}
function ReportNonNegativeNumber(ctx, input) {
    return (hoisted_NonNegativeNumber_0.reportNumberWithFormatsDecoder.bind(hoisted_NonNegativeNumber_0))(ctx, input);
}
function SchemaNonNegativeNumber(ctx, input) {
    if (ctx.seen["NonNegativeNumber"]) {
        return {};
    }
    ctx.seen["NonNegativeNumber"] = true;
    var tmp = (hoisted_NonNegativeNumber_0.schemaNumberWithFormatsDecoder.bind(hoisted_NonNegativeNumber_0))(ctx);
    delete ctx.seen["NonNegativeNumber"];
    return tmp;
}
function DescribeNonNegativeNumber(ctx, input) {
    return (hoisted_NonNegativeNumber_0.describeNumberWithFormatsDecoder.bind(hoisted_NonNegativeNumber_0))(ctx);
}
function ValidateRate(ctx, input) {
    return (hoisted_Rate_0.validateNumberWithFormatsDecoder.bind(hoisted_Rate_0))(ctx, input);
}
function ParseRate(ctx, input) {
    return (hoisted_Rate_0.parseNumberWithFormatsDecoder.bind(hoisted_Rate_0))(ctx, input);
}
function ReportRate(ctx, input) {
    return (hoisted_Rate_0.reportNumberWithFormatsDecoder.bind(hoisted_Rate_0))(ctx, input);
}
function SchemaRate(ctx, input) {
    if (ctx.seen["Rate"]) {
        return {};
    }
    ctx.seen["Rate"] = true;
    var tmp = (hoisted_Rate_0.schemaNumberWithFormatsDecoder.bind(hoisted_Rate_0))(ctx);
    delete ctx.seen["Rate"];
    return tmp;
}
function DescribeRate(ctx, input) {
    return (hoisted_Rate_0.describeNumberWithFormatsDecoder.bind(hoisted_Rate_0))(ctx);
}
function ValidateUserId(ctx, input) {
    return (hoisted_UserId_0.validateStringWithFormatsDecoder.bind(hoisted_UserId_0))(ctx, input);
}
function ParseUserId(ctx, input) {
    return (hoisted_UserId_0.parseStringWithFormatsDecoder.bind(hoisted_UserId_0))(ctx, input);
}
function ReportUserId(ctx, input) {
    return (hoisted_UserId_0.reportStringWithFormatsDecoder.bind(hoisted_UserId_0))(ctx, input);
}
function SchemaUserId(ctx, input) {
    if (ctx.seen["UserId"]) {
        return {};
    }
    ctx.seen["UserId"] = true;
    var tmp = (hoisted_UserId_0.schemaStringWithFormatsDecoder.bind(hoisted_UserId_0))(ctx);
    delete ctx.seen["UserId"];
    return tmp;
}
function DescribeUserId(ctx, input) {
    return (hoisted_UserId_0.describeStringWithFormatsDecoder.bind(hoisted_UserId_0))(ctx);
}
function ValidateReadAuthorizedUserId(ctx, input) {
    return (hoisted_ReadAuthorizedUserId_0.validateStringWithFormatsDecoder.bind(hoisted_ReadAuthorizedUserId_0))(ctx, input);
}
function ParseReadAuthorizedUserId(ctx, input) {
    return (hoisted_ReadAuthorizedUserId_0.parseStringWithFormatsDecoder.bind(hoisted_ReadAuthorizedUserId_0))(ctx, input);
}
function ReportReadAuthorizedUserId(ctx, input) {
    return (hoisted_ReadAuthorizedUserId_0.reportStringWithFormatsDecoder.bind(hoisted_ReadAuthorizedUserId_0))(ctx, input);
}
function SchemaReadAuthorizedUserId(ctx, input) {
    if (ctx.seen["ReadAuthorizedUserId"]) {
        return {};
    }
    ctx.seen["ReadAuthorizedUserId"] = true;
    var tmp = (hoisted_ReadAuthorizedUserId_0.schemaStringWithFormatsDecoder.bind(hoisted_ReadAuthorizedUserId_0))(ctx);
    delete ctx.seen["ReadAuthorizedUserId"];
    return tmp;
}
function DescribeReadAuthorizedUserId(ctx, input) {
    return (hoisted_ReadAuthorizedUserId_0.describeStringWithFormatsDecoder.bind(hoisted_ReadAuthorizedUserId_0))(ctx);
}
function ValidateWriteAuthorizedUserId(ctx, input) {
    return (hoisted_WriteAuthorizedUserId_0.validateStringWithFormatsDecoder.bind(hoisted_WriteAuthorizedUserId_0))(ctx, input);
}
function ParseWriteAuthorizedUserId(ctx, input) {
    return (hoisted_WriteAuthorizedUserId_0.parseStringWithFormatsDecoder.bind(hoisted_WriteAuthorizedUserId_0))(ctx, input);
}
function ReportWriteAuthorizedUserId(ctx, input) {
    return (hoisted_WriteAuthorizedUserId_0.reportStringWithFormatsDecoder.bind(hoisted_WriteAuthorizedUserId_0))(ctx, input);
}
function SchemaWriteAuthorizedUserId(ctx, input) {
    if (ctx.seen["WriteAuthorizedUserId"]) {
        return {};
    }
    ctx.seen["WriteAuthorizedUserId"] = true;
    var tmp = (hoisted_WriteAuthorizedUserId_0.schemaStringWithFormatsDecoder.bind(hoisted_WriteAuthorizedUserId_0))(ctx);
    delete ctx.seen["WriteAuthorizedUserId"];
    return tmp;
}
function DescribeWriteAuthorizedUserId(ctx, input) {
    return (hoisted_WriteAuthorizedUserId_0.describeStringWithFormatsDecoder.bind(hoisted_WriteAuthorizedUserId_0))(ctx);
}
function ValidateCurrencyPrices(ctx, input) {
    return (hoisted_CurrencyPrices_3.validateMappedRecordValidator.bind(hoisted_CurrencyPrices_3))(ctx, input);
}
function ParseCurrencyPrices(ctx, input) {
    return (hoisted_CurrencyPrices_4.parseMappedRecordParser.bind(hoisted_CurrencyPrices_4))(ctx, input);
}
function ReportCurrencyPrices(ctx, input) {
    return (hoisted_CurrencyPrices_5.reportMappedRecordReporter.bind(hoisted_CurrencyPrices_5))(ctx, input);
}
function SchemaCurrencyPrices(ctx, input) {
    if (ctx.seen["CurrencyPrices"]) {
        return {};
    }
    ctx.seen["CurrencyPrices"] = true;
    var tmp = (hoisted_CurrencyPrices_6.schemaMappedRecordSchema.bind(hoisted_CurrencyPrices_6))(ctx);
    delete ctx.seen["CurrencyPrices"];
    return tmp;
}
function DescribeCurrencyPrices(ctx, input) {
    return (hoisted_CurrencyPrices_7.describeMappedRecordDescribe.bind(hoisted_CurrencyPrices_7))(ctx);
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
    NonInfiniteNumber: ValidateNonInfiniteNumber,
    NonNegativeNumber: ValidateNonNegativeNumber,
    Rate: ValidateRate,
    UserId: ValidateUserId,
    ReadAuthorizedUserId: ValidateReadAuthorizedUserId,
    WriteAuthorizedUserId: ValidateWriteAuthorizedUserId,
    CurrencyPrices: ValidateCurrencyPrices
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
    NonInfiniteNumber: ParseNonInfiniteNumber,
    NonNegativeNumber: ParseNonNegativeNumber,
    Rate: ParseRate,
    UserId: ParseUserId,
    ReadAuthorizedUserId: ParseReadAuthorizedUserId,
    WriteAuthorizedUserId: ParseWriteAuthorizedUserId,
    CurrencyPrices: ParseCurrencyPrices
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
    NonInfiniteNumber: ReportNonInfiniteNumber,
    NonNegativeNumber: ReportNonNegativeNumber,
    Rate: ReportRate,
    UserId: ReportUserId,
    ReadAuthorizedUserId: ReportReadAuthorizedUserId,
    WriteAuthorizedUserId: ReportWriteAuthorizedUserId,
    CurrencyPrices: ReportCurrencyPrices
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
    NonInfiniteNumber: SchemaNonInfiniteNumber,
    NonNegativeNumber: SchemaNonNegativeNumber,
    Rate: SchemaRate,
    UserId: SchemaUserId,
    ReadAuthorizedUserId: SchemaReadAuthorizedUserId,
    WriteAuthorizedUserId: SchemaWriteAuthorizedUserId,
    CurrencyPrices: SchemaCurrencyPrices
};
const describers = {
    PartialRepro: DescribePartialRepro,
    TransportedValue: DescribeTransportedValue,
    OnlyAKey: DescribeOnlyAKey,
    AllTs: DescribeAllTs,
    AObject: DescribeAObject,
    Version: DescribeVersion,
    Version2: DescribeVersion2,
    AccessLevel2: DescribeAccessLevel2,
    AccessLevelTpl2: DescribeAccessLevelTpl2,
    AccessLevel: DescribeAccessLevel,
    AccessLevelTpl: DescribeAccessLevelTpl,
    Arr3: DescribeArr3,
    OmitSettings: DescribeOmitSettings,
    Settings: DescribeSettings,
    PartialObject: DescribePartialObject,
    RequiredPartialObject: DescribeRequiredPartialObject,
    LevelAndDSettings: DescribeLevelAndDSettings,
    PartialSettings: DescribePartialSettings,
    Extra: DescribeExtra,
    AvatarSize: DescribeAvatarSize,
    User: DescribeUser,
    PublicUser: DescribePublicUser,
    Req: DescribeReq,
    WithOptionals: DescribeWithOptionals,
    Repro1: DescribeRepro1,
    Repro2: DescribeRepro2,
    SettingsUpdate: DescribeSettingsUpdate,
    Mapped: DescribeMapped,
    MappedOptional: DescribeMappedOptional,
    DiscriminatedUnion: DescribeDiscriminatedUnion,
    DiscriminatedUnion2: DescribeDiscriminatedUnion2,
    DiscriminatedUnion3: DescribeDiscriminatedUnion3,
    DiscriminatedUnion4: DescribeDiscriminatedUnion4,
    AllTypes: DescribeAllTypes,
    OtherEnum: DescribeOtherEnum,
    Arr2: DescribeArr2,
    ValidCurrency: DescribeValidCurrency,
    UnionWithEnumAccess: DescribeUnionWithEnumAccess,
    Shape: DescribeShape,
    T3: DescribeT3,
    BObject: DescribeBObject,
    DEF: DescribeDEF,
    KDEF: DescribeKDEF,
    ABC: DescribeABC,
    KABC: DescribeKABC,
    K: DescribeK,
    NonInfiniteNumber: DescribeNonInfiniteNumber,
    NonNegativeNumber: DescribeNonNegativeNumber,
    Rate: DescribeRate,
    UserId: DescribeUserId,
    ReadAuthorizedUserId: DescribeReadAuthorizedUserId,
    WriteAuthorizedUserId: DescribeWriteAuthorizedUserId,
    CurrencyPrices: DescribeCurrencyPrices
};
const hoisted_PartialRepro_0 = [
    validateNull,
    validateString
];
const hoisted_PartialRepro_1 = [
    schemaNull,
    schemaString
];
const hoisted_PartialRepro_2 = [
    describeNull,
    describeString
];
const hoisted_PartialRepro_3 = new AnyOfValidator(hoisted_PartialRepro_0);
const hoisted_PartialRepro_4 = new AnyOfParser(hoisted_PartialRepro_0, [
    parseIdentity,
    parseIdentity
]);
const hoisted_PartialRepro_5 = new AnyOfReporter(hoisted_PartialRepro_0, [
    reportNull,
    reportString
]);
const hoisted_PartialRepro_6 = new AnyOfSchema(hoisted_PartialRepro_1);
const hoisted_PartialRepro_7 = new AnyOfDescribe(hoisted_PartialRepro_2);
const hoisted_PartialRepro_8 = [
    validateNull,
    validateString
];
const hoisted_PartialRepro_9 = [
    schemaNull,
    schemaString
];
const hoisted_PartialRepro_10 = [
    describeNull,
    describeString
];
const hoisted_PartialRepro_11 = new AnyOfValidator(hoisted_PartialRepro_8);
const hoisted_PartialRepro_12 = new AnyOfParser(hoisted_PartialRepro_8, [
    parseIdentity,
    parseIdentity
]);
const hoisted_PartialRepro_13 = new AnyOfReporter(hoisted_PartialRepro_8, [
    reportNull,
    reportString
]);
const hoisted_PartialRepro_14 = new AnyOfSchema(hoisted_PartialRepro_9);
const hoisted_PartialRepro_15 = new AnyOfDescribe(hoisted_PartialRepro_10);
const hoisted_PartialRepro_16 = {
    "a": hoisted_PartialRepro_3.validateAnyOfValidator.bind(hoisted_PartialRepro_3),
    "b": hoisted_PartialRepro_11.validateAnyOfValidator.bind(hoisted_PartialRepro_11)
};
const hoisted_PartialRepro_17 = {
    "a": hoisted_PartialRepro_6.schemaAnyOfSchema.bind(hoisted_PartialRepro_6),
    "b": hoisted_PartialRepro_14.schemaAnyOfSchema.bind(hoisted_PartialRepro_14)
};
const hoisted_PartialRepro_18 = {
    "a": hoisted_PartialRepro_7.describeAnyOfDescribe.bind(hoisted_PartialRepro_7),
    "b": hoisted_PartialRepro_15.describeAnyOfDescribe.bind(hoisted_PartialRepro_15)
};
const hoisted_PartialRepro_19 = hoisted_PartialRepro_18;
const hoisted_PartialRepro_20 = null;
const hoisted_PartialRepro_21 = new ObjectValidator(hoisted_PartialRepro_16, hoisted_PartialRepro_20);
const hoisted_PartialRepro_22 = new ObjectParser({
    "a": hoisted_PartialRepro_4.parseAnyOfParser.bind(hoisted_PartialRepro_4),
    "b": hoisted_PartialRepro_12.parseAnyOfParser.bind(hoisted_PartialRepro_12)
}, null);
const hoisted_PartialRepro_23 = new ObjectReporter(hoisted_PartialRepro_16, hoisted_PartialRepro_20, {
    "a": hoisted_PartialRepro_5.reportAnyOfReporter.bind(hoisted_PartialRepro_5),
    "b": hoisted_PartialRepro_13.reportAnyOfReporter.bind(hoisted_PartialRepro_13)
}, null);
const hoisted_PartialRepro_24 = new ObjectSchema(hoisted_PartialRepro_17, null);
const hoisted_PartialRepro_25 = new ObjectDescribe(hoisted_PartialRepro_19, null);
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
const hoisted_TransportedValue_2 = [
    describeNull,
    describeString,
    describeNumber
];
const hoisted_TransportedValue_3 = new AnyOfValidator(hoisted_TransportedValue_0);
const hoisted_TransportedValue_4 = new AnyOfParser(hoisted_TransportedValue_0, [
    parseIdentity,
    parseIdentity,
    parseIdentity
]);
const hoisted_TransportedValue_5 = new AnyOfReporter(hoisted_TransportedValue_0, [
    reportNull,
    reportString,
    reportNumber
]);
const hoisted_TransportedValue_6 = new AnyOfSchema(hoisted_TransportedValue_1);
const hoisted_TransportedValue_7 = new AnyOfDescribe(hoisted_TransportedValue_2);
const hoisted_TransportedValue_8 = hoisted_TransportedValue_3.validateAnyOfValidator.bind(hoisted_TransportedValue_3);
const hoisted_TransportedValue_9 = new ArrayValidator(hoisted_TransportedValue_8);
const hoisted_TransportedValue_10 = new ArrayParser(hoisted_TransportedValue_4.parseAnyOfParser.bind(hoisted_TransportedValue_4));
const hoisted_TransportedValue_11 = new ArrayReporter(hoisted_TransportedValue_8, hoisted_TransportedValue_5.reportAnyOfReporter.bind(hoisted_TransportedValue_5));
const hoisted_TransportedValue_12 = new ArraySchema(hoisted_TransportedValue_6.schemaAnyOfSchema.bind(hoisted_TransportedValue_6));
const hoisted_TransportedValue_13 = new ArrayDescribe(hoisted_TransportedValue_7.describeAnyOfDescribe.bind(hoisted_TransportedValue_7));
const hoisted_TransportedValue_14 = [
    validateNull,
    validateString,
    hoisted_TransportedValue_9.validateArrayValidator.bind(hoisted_TransportedValue_9)
];
const hoisted_TransportedValue_15 = [
    schemaNull,
    schemaString,
    hoisted_TransportedValue_12.schemaArraySchema.bind(hoisted_TransportedValue_12)
];
const hoisted_TransportedValue_16 = [
    describeNull,
    describeString,
    hoisted_TransportedValue_13.describeArrayDescribe.bind(hoisted_TransportedValue_13)
];
const hoisted_TransportedValue_17 = new AnyOfValidator(hoisted_TransportedValue_14);
const hoisted_TransportedValue_18 = new AnyOfParser(hoisted_TransportedValue_14, [
    parseIdentity,
    parseIdentity,
    hoisted_TransportedValue_10.parseArrayParser.bind(hoisted_TransportedValue_10)
]);
const hoisted_TransportedValue_19 = new AnyOfReporter(hoisted_TransportedValue_14, [
    reportNull,
    reportString,
    hoisted_TransportedValue_11.reportArrayReporter.bind(hoisted_TransportedValue_11)
]);
const hoisted_TransportedValue_20 = new AnyOfSchema(hoisted_TransportedValue_15);
const hoisted_TransportedValue_21 = new AnyOfDescribe(hoisted_TransportedValue_16);
const hoisted_OnlyAKey_0 = {
    "A": validateString
};
const hoisted_OnlyAKey_1 = {
    "A": schemaString
};
const hoisted_OnlyAKey_2 = {
    "A": describeString
};
const hoisted_OnlyAKey_3 = hoisted_OnlyAKey_2;
const hoisted_OnlyAKey_4 = null;
const hoisted_OnlyAKey_5 = new ObjectValidator(hoisted_OnlyAKey_0, hoisted_OnlyAKey_4);
const hoisted_OnlyAKey_6 = new ObjectParser({
    "A": parseIdentity
}, null);
const hoisted_OnlyAKey_7 = new ObjectReporter(hoisted_OnlyAKey_0, hoisted_OnlyAKey_4, {
    "A": reportString
}, null);
const hoisted_OnlyAKey_8 = new ObjectSchema(hoisted_OnlyAKey_1, null);
const hoisted_OnlyAKey_9 = new ObjectDescribe(hoisted_OnlyAKey_3, null);
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
const hoisted_AObject_3 = {
    "tag": hoisted_AObject_0.describeConstDecoder.bind(hoisted_AObject_0)
};
const hoisted_AObject_4 = hoisted_AObject_3;
const hoisted_AObject_5 = null;
const hoisted_AObject_6 = new ObjectValidator(hoisted_AObject_1, hoisted_AObject_5);
const hoisted_AObject_7 = new ObjectParser({
    "tag": hoisted_AObject_0.parseConstDecoder.bind(hoisted_AObject_0)
}, null);
const hoisted_AObject_8 = new ObjectReporter(hoisted_AObject_1, hoisted_AObject_5, {
    "tag": hoisted_AObject_0.reportConstDecoder.bind(hoisted_AObject_0)
}, null);
const hoisted_AObject_9 = new ObjectSchema(hoisted_AObject_2, null);
const hoisted_AObject_10 = new ObjectDescribe(hoisted_AObject_4, null);
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
const hoisted_OmitSettings_3 = {
    "tag": hoisted_OmitSettings_0.describeConstDecoder.bind(hoisted_OmitSettings_0)
};
const hoisted_OmitSettings_4 = hoisted_OmitSettings_3;
const hoisted_OmitSettings_5 = null;
const hoisted_OmitSettings_6 = new ObjectValidator(hoisted_OmitSettings_1, hoisted_OmitSettings_5);
const hoisted_OmitSettings_7 = new ObjectParser({
    "tag": hoisted_OmitSettings_0.parseConstDecoder.bind(hoisted_OmitSettings_0)
}, null);
const hoisted_OmitSettings_8 = new ObjectReporter(hoisted_OmitSettings_1, hoisted_OmitSettings_5, {
    "tag": hoisted_OmitSettings_0.reportConstDecoder.bind(hoisted_OmitSettings_0)
}, null);
const hoisted_OmitSettings_9 = new ObjectSchema(hoisted_OmitSettings_2, null);
const hoisted_OmitSettings_10 = new ObjectDescribe(hoisted_OmitSettings_4, null);
const hoisted_OmitSettings_11 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_OmitSettings_12 = {
    "d": hoisted_OmitSettings_6.validateObjectValidator.bind(hoisted_OmitSettings_6),
    "level": hoisted_OmitSettings_11.validateAnyOfConstsDecoder.bind(hoisted_OmitSettings_11)
};
const hoisted_OmitSettings_13 = {
    "d": hoisted_OmitSettings_9.schemaObjectSchema.bind(hoisted_OmitSettings_9),
    "level": hoisted_OmitSettings_11.schemaAnyOfConstsDecoder.bind(hoisted_OmitSettings_11)
};
const hoisted_OmitSettings_14 = {
    "d": hoisted_OmitSettings_10.describeObjectDescribe.bind(hoisted_OmitSettings_10),
    "level": hoisted_OmitSettings_11.describeAnyOfConstsDecoder.bind(hoisted_OmitSettings_11)
};
const hoisted_OmitSettings_15 = hoisted_OmitSettings_14;
const hoisted_OmitSettings_16 = null;
const hoisted_OmitSettings_17 = new ObjectValidator(hoisted_OmitSettings_12, hoisted_OmitSettings_16);
const hoisted_OmitSettings_18 = new ObjectParser({
    "d": hoisted_OmitSettings_7.parseObjectParser.bind(hoisted_OmitSettings_7),
    "level": hoisted_OmitSettings_11.parseAnyOfConstsDecoder.bind(hoisted_OmitSettings_11)
}, null);
const hoisted_OmitSettings_19 = new ObjectReporter(hoisted_OmitSettings_12, hoisted_OmitSettings_16, {
    "d": hoisted_OmitSettings_8.reportObjectReporter.bind(hoisted_OmitSettings_8),
    "level": hoisted_OmitSettings_11.reportAnyOfConstsDecoder.bind(hoisted_OmitSettings_11)
}, null);
const hoisted_OmitSettings_20 = new ObjectSchema(hoisted_OmitSettings_13, null);
const hoisted_OmitSettings_21 = new ObjectDescribe(hoisted_OmitSettings_15, null);
const hoisted_Settings_0 = new ConstDecoder("d");
const hoisted_Settings_1 = {
    "tag": hoisted_Settings_0.validateConstDecoder.bind(hoisted_Settings_0)
};
const hoisted_Settings_2 = {
    "tag": hoisted_Settings_0.schemaConstDecoder.bind(hoisted_Settings_0)
};
const hoisted_Settings_3 = {
    "tag": hoisted_Settings_0.describeConstDecoder.bind(hoisted_Settings_0)
};
const hoisted_Settings_4 = hoisted_Settings_3;
const hoisted_Settings_5 = null;
const hoisted_Settings_6 = new ObjectValidator(hoisted_Settings_1, hoisted_Settings_5);
const hoisted_Settings_7 = new ObjectParser({
    "tag": hoisted_Settings_0.parseConstDecoder.bind(hoisted_Settings_0)
}, null);
const hoisted_Settings_8 = new ObjectReporter(hoisted_Settings_1, hoisted_Settings_5, {
    "tag": hoisted_Settings_0.reportConstDecoder.bind(hoisted_Settings_0)
}, null);
const hoisted_Settings_9 = new ObjectSchema(hoisted_Settings_2, null);
const hoisted_Settings_10 = new ObjectDescribe(hoisted_Settings_4, null);
const hoisted_Settings_11 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_Settings_12 = {
    "a": validateString,
    "d": hoisted_Settings_6.validateObjectValidator.bind(hoisted_Settings_6),
    "level": hoisted_Settings_11.validateAnyOfConstsDecoder.bind(hoisted_Settings_11)
};
const hoisted_Settings_13 = {
    "a": schemaString,
    "d": hoisted_Settings_9.schemaObjectSchema.bind(hoisted_Settings_9),
    "level": hoisted_Settings_11.schemaAnyOfConstsDecoder.bind(hoisted_Settings_11)
};
const hoisted_Settings_14 = {
    "a": describeString,
    "d": hoisted_Settings_10.describeObjectDescribe.bind(hoisted_Settings_10),
    "level": hoisted_Settings_11.describeAnyOfConstsDecoder.bind(hoisted_Settings_11)
};
const hoisted_Settings_15 = hoisted_Settings_14;
const hoisted_Settings_16 = null;
const hoisted_Settings_17 = new ObjectValidator(hoisted_Settings_12, hoisted_Settings_16);
const hoisted_Settings_18 = new ObjectParser({
    "a": parseIdentity,
    "d": hoisted_Settings_7.parseObjectParser.bind(hoisted_Settings_7),
    "level": hoisted_Settings_11.parseAnyOfConstsDecoder.bind(hoisted_Settings_11)
}, null);
const hoisted_Settings_19 = new ObjectReporter(hoisted_Settings_12, hoisted_Settings_16, {
    "a": reportString,
    "d": hoisted_Settings_8.reportObjectReporter.bind(hoisted_Settings_8),
    "level": hoisted_Settings_11.reportAnyOfConstsDecoder.bind(hoisted_Settings_11)
}, null);
const hoisted_Settings_20 = new ObjectSchema(hoisted_Settings_13, null);
const hoisted_Settings_21 = new ObjectDescribe(hoisted_Settings_15, null);
const hoisted_PartialObject_0 = [
    validateNull,
    validateString
];
const hoisted_PartialObject_1 = [
    schemaNull,
    schemaString
];
const hoisted_PartialObject_2 = [
    describeNull,
    describeString
];
const hoisted_PartialObject_3 = new AnyOfValidator(hoisted_PartialObject_0);
const hoisted_PartialObject_4 = new AnyOfParser(hoisted_PartialObject_0, [
    parseIdentity,
    parseIdentity
]);
const hoisted_PartialObject_5 = new AnyOfReporter(hoisted_PartialObject_0, [
    reportNull,
    reportString
]);
const hoisted_PartialObject_6 = new AnyOfSchema(hoisted_PartialObject_1);
const hoisted_PartialObject_7 = new AnyOfDescribe(hoisted_PartialObject_2);
const hoisted_PartialObject_8 = [
    validateNull,
    validateNumber
];
const hoisted_PartialObject_9 = [
    schemaNull,
    schemaNumber
];
const hoisted_PartialObject_10 = [
    describeNull,
    describeNumber
];
const hoisted_PartialObject_11 = new AnyOfValidator(hoisted_PartialObject_8);
const hoisted_PartialObject_12 = new AnyOfParser(hoisted_PartialObject_8, [
    parseIdentity,
    parseIdentity
]);
const hoisted_PartialObject_13 = new AnyOfReporter(hoisted_PartialObject_8, [
    reportNull,
    reportNumber
]);
const hoisted_PartialObject_14 = new AnyOfSchema(hoisted_PartialObject_9);
const hoisted_PartialObject_15 = new AnyOfDescribe(hoisted_PartialObject_10);
const hoisted_PartialObject_16 = {
    "a": hoisted_PartialObject_3.validateAnyOfValidator.bind(hoisted_PartialObject_3),
    "b": hoisted_PartialObject_11.validateAnyOfValidator.bind(hoisted_PartialObject_11)
};
const hoisted_PartialObject_17 = {
    "a": hoisted_PartialObject_6.schemaAnyOfSchema.bind(hoisted_PartialObject_6),
    "b": hoisted_PartialObject_14.schemaAnyOfSchema.bind(hoisted_PartialObject_14)
};
const hoisted_PartialObject_18 = {
    "a": hoisted_PartialObject_7.describeAnyOfDescribe.bind(hoisted_PartialObject_7),
    "b": hoisted_PartialObject_15.describeAnyOfDescribe.bind(hoisted_PartialObject_15)
};
const hoisted_PartialObject_19 = hoisted_PartialObject_18;
const hoisted_PartialObject_20 = null;
const hoisted_PartialObject_21 = new ObjectValidator(hoisted_PartialObject_16, hoisted_PartialObject_20);
const hoisted_PartialObject_22 = new ObjectParser({
    "a": hoisted_PartialObject_4.parseAnyOfParser.bind(hoisted_PartialObject_4),
    "b": hoisted_PartialObject_12.parseAnyOfParser.bind(hoisted_PartialObject_12)
}, null);
const hoisted_PartialObject_23 = new ObjectReporter(hoisted_PartialObject_16, hoisted_PartialObject_20, {
    "a": hoisted_PartialObject_5.reportAnyOfReporter.bind(hoisted_PartialObject_5),
    "b": hoisted_PartialObject_13.reportAnyOfReporter.bind(hoisted_PartialObject_13)
}, null);
const hoisted_PartialObject_24 = new ObjectSchema(hoisted_PartialObject_17, null);
const hoisted_PartialObject_25 = new ObjectDescribe(hoisted_PartialObject_19, null);
const hoisted_RequiredPartialObject_0 = {
    "a": validateString,
    "b": validateNumber
};
const hoisted_RequiredPartialObject_1 = {
    "a": schemaString,
    "b": schemaNumber
};
const hoisted_RequiredPartialObject_2 = {
    "a": describeString,
    "b": describeNumber
};
const hoisted_RequiredPartialObject_3 = hoisted_RequiredPartialObject_2;
const hoisted_RequiredPartialObject_4 = null;
const hoisted_RequiredPartialObject_5 = new ObjectValidator(hoisted_RequiredPartialObject_0, hoisted_RequiredPartialObject_4);
const hoisted_RequiredPartialObject_6 = new ObjectParser({
    "a": parseIdentity,
    "b": parseIdentity
}, null);
const hoisted_RequiredPartialObject_7 = new ObjectReporter(hoisted_RequiredPartialObject_0, hoisted_RequiredPartialObject_4, {
    "a": reportString,
    "b": reportNumber
}, null);
const hoisted_RequiredPartialObject_8 = new ObjectSchema(hoisted_RequiredPartialObject_1, null);
const hoisted_RequiredPartialObject_9 = new ObjectDescribe(hoisted_RequiredPartialObject_3, null);
const hoisted_LevelAndDSettings_0 = new ConstDecoder("d");
const hoisted_LevelAndDSettings_1 = {
    "tag": hoisted_LevelAndDSettings_0.validateConstDecoder.bind(hoisted_LevelAndDSettings_0)
};
const hoisted_LevelAndDSettings_2 = {
    "tag": hoisted_LevelAndDSettings_0.schemaConstDecoder.bind(hoisted_LevelAndDSettings_0)
};
const hoisted_LevelAndDSettings_3 = {
    "tag": hoisted_LevelAndDSettings_0.describeConstDecoder.bind(hoisted_LevelAndDSettings_0)
};
const hoisted_LevelAndDSettings_4 = hoisted_LevelAndDSettings_3;
const hoisted_LevelAndDSettings_5 = null;
const hoisted_LevelAndDSettings_6 = new ObjectValidator(hoisted_LevelAndDSettings_1, hoisted_LevelAndDSettings_5);
const hoisted_LevelAndDSettings_7 = new ObjectParser({
    "tag": hoisted_LevelAndDSettings_0.parseConstDecoder.bind(hoisted_LevelAndDSettings_0)
}, null);
const hoisted_LevelAndDSettings_8 = new ObjectReporter(hoisted_LevelAndDSettings_1, hoisted_LevelAndDSettings_5, {
    "tag": hoisted_LevelAndDSettings_0.reportConstDecoder.bind(hoisted_LevelAndDSettings_0)
}, null);
const hoisted_LevelAndDSettings_9 = new ObjectSchema(hoisted_LevelAndDSettings_2, null);
const hoisted_LevelAndDSettings_10 = new ObjectDescribe(hoisted_LevelAndDSettings_4, null);
const hoisted_LevelAndDSettings_11 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_LevelAndDSettings_12 = {
    "d": hoisted_LevelAndDSettings_6.validateObjectValidator.bind(hoisted_LevelAndDSettings_6),
    "level": hoisted_LevelAndDSettings_11.validateAnyOfConstsDecoder.bind(hoisted_LevelAndDSettings_11)
};
const hoisted_LevelAndDSettings_13 = {
    "d": hoisted_LevelAndDSettings_9.schemaObjectSchema.bind(hoisted_LevelAndDSettings_9),
    "level": hoisted_LevelAndDSettings_11.schemaAnyOfConstsDecoder.bind(hoisted_LevelAndDSettings_11)
};
const hoisted_LevelAndDSettings_14 = {
    "d": hoisted_LevelAndDSettings_10.describeObjectDescribe.bind(hoisted_LevelAndDSettings_10),
    "level": hoisted_LevelAndDSettings_11.describeAnyOfConstsDecoder.bind(hoisted_LevelAndDSettings_11)
};
const hoisted_LevelAndDSettings_15 = hoisted_LevelAndDSettings_14;
const hoisted_LevelAndDSettings_16 = null;
const hoisted_LevelAndDSettings_17 = new ObjectValidator(hoisted_LevelAndDSettings_12, hoisted_LevelAndDSettings_16);
const hoisted_LevelAndDSettings_18 = new ObjectParser({
    "d": hoisted_LevelAndDSettings_7.parseObjectParser.bind(hoisted_LevelAndDSettings_7),
    "level": hoisted_LevelAndDSettings_11.parseAnyOfConstsDecoder.bind(hoisted_LevelAndDSettings_11)
}, null);
const hoisted_LevelAndDSettings_19 = new ObjectReporter(hoisted_LevelAndDSettings_12, hoisted_LevelAndDSettings_16, {
    "d": hoisted_LevelAndDSettings_8.reportObjectReporter.bind(hoisted_LevelAndDSettings_8),
    "level": hoisted_LevelAndDSettings_11.reportAnyOfConstsDecoder.bind(hoisted_LevelAndDSettings_11)
}, null);
const hoisted_LevelAndDSettings_20 = new ObjectSchema(hoisted_LevelAndDSettings_13, null);
const hoisted_LevelAndDSettings_21 = new ObjectDescribe(hoisted_LevelAndDSettings_15, null);
const hoisted_PartialSettings_0 = [
    validateNull,
    validateString
];
const hoisted_PartialSettings_1 = [
    schemaNull,
    schemaString
];
const hoisted_PartialSettings_2 = [
    describeNull,
    describeString
];
const hoisted_PartialSettings_3 = new AnyOfValidator(hoisted_PartialSettings_0);
const hoisted_PartialSettings_4 = new AnyOfParser(hoisted_PartialSettings_0, [
    parseIdentity,
    parseIdentity
]);
const hoisted_PartialSettings_5 = new AnyOfReporter(hoisted_PartialSettings_0, [
    reportNull,
    reportString
]);
const hoisted_PartialSettings_6 = new AnyOfSchema(hoisted_PartialSettings_1);
const hoisted_PartialSettings_7 = new AnyOfDescribe(hoisted_PartialSettings_2);
const hoisted_PartialSettings_8 = new ConstDecoder("d");
const hoisted_PartialSettings_9 = {
    "tag": hoisted_PartialSettings_8.validateConstDecoder.bind(hoisted_PartialSettings_8)
};
const hoisted_PartialSettings_10 = {
    "tag": hoisted_PartialSettings_8.schemaConstDecoder.bind(hoisted_PartialSettings_8)
};
const hoisted_PartialSettings_11 = {
    "tag": hoisted_PartialSettings_8.describeConstDecoder.bind(hoisted_PartialSettings_8)
};
const hoisted_PartialSettings_12 = hoisted_PartialSettings_11;
const hoisted_PartialSettings_13 = null;
const hoisted_PartialSettings_14 = new ObjectValidator(hoisted_PartialSettings_9, hoisted_PartialSettings_13);
const hoisted_PartialSettings_15 = new ObjectParser({
    "tag": hoisted_PartialSettings_8.parseConstDecoder.bind(hoisted_PartialSettings_8)
}, null);
const hoisted_PartialSettings_16 = new ObjectReporter(hoisted_PartialSettings_9, hoisted_PartialSettings_13, {
    "tag": hoisted_PartialSettings_8.reportConstDecoder.bind(hoisted_PartialSettings_8)
}, null);
const hoisted_PartialSettings_17 = new ObjectSchema(hoisted_PartialSettings_10, null);
const hoisted_PartialSettings_18 = new ObjectDescribe(hoisted_PartialSettings_12, null);
const hoisted_PartialSettings_19 = [
    validateNull,
    hoisted_PartialSettings_14.validateObjectValidator.bind(hoisted_PartialSettings_14)
];
const hoisted_PartialSettings_20 = [
    schemaNull,
    hoisted_PartialSettings_17.schemaObjectSchema.bind(hoisted_PartialSettings_17)
];
const hoisted_PartialSettings_21 = [
    describeNull,
    hoisted_PartialSettings_18.describeObjectDescribe.bind(hoisted_PartialSettings_18)
];
const hoisted_PartialSettings_22 = new AnyOfValidator(hoisted_PartialSettings_19);
const hoisted_PartialSettings_23 = new AnyOfParser(hoisted_PartialSettings_19, [
    parseIdentity,
    hoisted_PartialSettings_15.parseObjectParser.bind(hoisted_PartialSettings_15)
]);
const hoisted_PartialSettings_24 = new AnyOfReporter(hoisted_PartialSettings_19, [
    reportNull,
    hoisted_PartialSettings_16.reportObjectReporter.bind(hoisted_PartialSettings_16)
]);
const hoisted_PartialSettings_25 = new AnyOfSchema(hoisted_PartialSettings_20);
const hoisted_PartialSettings_26 = new AnyOfDescribe(hoisted_PartialSettings_21);
const hoisted_PartialSettings_27 = new ConstDecoder("a");
const hoisted_PartialSettings_28 = new ConstDecoder("b");
const hoisted_PartialSettings_29 = [
    validateNull,
    hoisted_PartialSettings_27.validateConstDecoder.bind(hoisted_PartialSettings_27),
    hoisted_PartialSettings_28.validateConstDecoder.bind(hoisted_PartialSettings_28)
];
const hoisted_PartialSettings_30 = [
    schemaNull,
    hoisted_PartialSettings_27.schemaConstDecoder.bind(hoisted_PartialSettings_27),
    hoisted_PartialSettings_28.schemaConstDecoder.bind(hoisted_PartialSettings_28)
];
const hoisted_PartialSettings_31 = [
    describeNull,
    hoisted_PartialSettings_27.describeConstDecoder.bind(hoisted_PartialSettings_27),
    hoisted_PartialSettings_28.describeConstDecoder.bind(hoisted_PartialSettings_28)
];
const hoisted_PartialSettings_32 = new AnyOfValidator(hoisted_PartialSettings_29);
const hoisted_PartialSettings_33 = new AnyOfParser(hoisted_PartialSettings_29, [
    parseIdentity,
    hoisted_PartialSettings_27.parseConstDecoder.bind(hoisted_PartialSettings_27),
    hoisted_PartialSettings_28.parseConstDecoder.bind(hoisted_PartialSettings_28)
]);
const hoisted_PartialSettings_34 = new AnyOfReporter(hoisted_PartialSettings_29, [
    reportNull,
    hoisted_PartialSettings_27.reportConstDecoder.bind(hoisted_PartialSettings_27),
    hoisted_PartialSettings_28.reportConstDecoder.bind(hoisted_PartialSettings_28)
]);
const hoisted_PartialSettings_35 = new AnyOfSchema(hoisted_PartialSettings_30);
const hoisted_PartialSettings_36 = new AnyOfDescribe(hoisted_PartialSettings_31);
const hoisted_PartialSettings_37 = {
    "a": hoisted_PartialSettings_3.validateAnyOfValidator.bind(hoisted_PartialSettings_3),
    "d": hoisted_PartialSettings_22.validateAnyOfValidator.bind(hoisted_PartialSettings_22),
    "level": hoisted_PartialSettings_32.validateAnyOfValidator.bind(hoisted_PartialSettings_32)
};
const hoisted_PartialSettings_38 = {
    "a": hoisted_PartialSettings_6.schemaAnyOfSchema.bind(hoisted_PartialSettings_6),
    "d": hoisted_PartialSettings_25.schemaAnyOfSchema.bind(hoisted_PartialSettings_25),
    "level": hoisted_PartialSettings_35.schemaAnyOfSchema.bind(hoisted_PartialSettings_35)
};
const hoisted_PartialSettings_39 = {
    "a": hoisted_PartialSettings_7.describeAnyOfDescribe.bind(hoisted_PartialSettings_7),
    "d": hoisted_PartialSettings_26.describeAnyOfDescribe.bind(hoisted_PartialSettings_26),
    "level": hoisted_PartialSettings_36.describeAnyOfDescribe.bind(hoisted_PartialSettings_36)
};
const hoisted_PartialSettings_40 = hoisted_PartialSettings_39;
const hoisted_PartialSettings_41 = null;
const hoisted_PartialSettings_42 = new ObjectValidator(hoisted_PartialSettings_37, hoisted_PartialSettings_41);
const hoisted_PartialSettings_43 = new ObjectParser({
    "a": hoisted_PartialSettings_4.parseAnyOfParser.bind(hoisted_PartialSettings_4),
    "d": hoisted_PartialSettings_23.parseAnyOfParser.bind(hoisted_PartialSettings_23),
    "level": hoisted_PartialSettings_33.parseAnyOfParser.bind(hoisted_PartialSettings_33)
}, null);
const hoisted_PartialSettings_44 = new ObjectReporter(hoisted_PartialSettings_37, hoisted_PartialSettings_41, {
    "a": hoisted_PartialSettings_5.reportAnyOfReporter.bind(hoisted_PartialSettings_5),
    "d": hoisted_PartialSettings_24.reportAnyOfReporter.bind(hoisted_PartialSettings_24),
    "level": hoisted_PartialSettings_34.reportAnyOfReporter.bind(hoisted_PartialSettings_34)
}, null);
const hoisted_PartialSettings_45 = new ObjectSchema(hoisted_PartialSettings_38, null);
const hoisted_PartialSettings_46 = new ObjectDescribe(hoisted_PartialSettings_40, null);
const hoisted_Extra_0 = {};
const hoisted_Extra_1 = {};
const hoisted_Extra_2 = {};
const hoisted_Extra_3 = hoisted_Extra_2;
const hoisted_Extra_4 = validateString;
const hoisted_Extra_5 = new ObjectValidator(hoisted_Extra_0, hoisted_Extra_4);
const hoisted_Extra_6 = new ObjectParser({}, parseIdentity);
const hoisted_Extra_7 = new ObjectReporter(hoisted_Extra_0, hoisted_Extra_4, {}, reportString);
const hoisted_Extra_8 = new ObjectSchema(hoisted_Extra_1, schemaString);
const hoisted_Extra_9 = new ObjectDescribe(hoisted_Extra_3, describeString);
const hoisted_AvatarSize_0 = new RegexDecoder(/(\d+(\.\d+)?)(x)(\d+(\.\d+)?)/, "${number}x${number}");
const hoisted_User_0 = validators.User;
const hoisted_User_1 = new ArrayValidator(hoisted_User_0);
const hoisted_User_2 = new ArrayParser(parsers.User);
const hoisted_User_3 = new ArrayReporter(hoisted_User_0, reporters.User);
const hoisted_User_4 = new ArraySchema(schemas.User);
const hoisted_User_5 = new ArrayDescribe(wrap_describe(describers.User, "User"));
const hoisted_User_6 = {
    "accessLevel": validators.AccessLevel,
    "avatarSize": validators.AvatarSize,
    "extra": validators.Extra,
    "friends": hoisted_User_1.validateArrayValidator.bind(hoisted_User_1),
    "name": validateString
};
const hoisted_User_7 = {
    "accessLevel": schemas.AccessLevel,
    "avatarSize": schemas.AvatarSize,
    "extra": schemas.Extra,
    "friends": hoisted_User_4.schemaArraySchema.bind(hoisted_User_4),
    "name": schemaString
};
const hoisted_User_8 = {
    "accessLevel": wrap_describe(describers.AccessLevel, "AccessLevel"),
    "avatarSize": wrap_describe(describers.AvatarSize, "AvatarSize"),
    "extra": wrap_describe(describers.Extra, "Extra"),
    "friends": hoisted_User_5.describeArrayDescribe.bind(hoisted_User_5),
    "name": describeString
};
const hoisted_User_9 = hoisted_User_8;
const hoisted_User_10 = null;
const hoisted_User_11 = new ObjectValidator(hoisted_User_6, hoisted_User_10);
const hoisted_User_12 = new ObjectParser({
    "accessLevel": parsers.AccessLevel,
    "avatarSize": parsers.AvatarSize,
    "extra": parsers.Extra,
    "friends": hoisted_User_2.parseArrayParser.bind(hoisted_User_2),
    "name": parseIdentity
}, null);
const hoisted_User_13 = new ObjectReporter(hoisted_User_6, hoisted_User_10, {
    "accessLevel": reporters.AccessLevel,
    "avatarSize": reporters.AvatarSize,
    "extra": reporters.Extra,
    "friends": hoisted_User_3.reportArrayReporter.bind(hoisted_User_3),
    "name": reportString
}, null);
const hoisted_User_14 = new ObjectSchema(hoisted_User_7, null);
const hoisted_User_15 = new ObjectDescribe(hoisted_User_9, null);
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
const hoisted_PublicUser_2 = {
    "accessLevel": wrap_describe(describers.AccessLevel, "AccessLevel"),
    "avatarSize": wrap_describe(describers.AvatarSize, "AvatarSize"),
    "extra": wrap_describe(describers.Extra, "Extra"),
    "name": describeString
};
const hoisted_PublicUser_3 = hoisted_PublicUser_2;
const hoisted_PublicUser_4 = null;
const hoisted_PublicUser_5 = new ObjectValidator(hoisted_PublicUser_0, hoisted_PublicUser_4);
const hoisted_PublicUser_6 = new ObjectParser({
    "accessLevel": parsers.AccessLevel,
    "avatarSize": parsers.AvatarSize,
    "extra": parsers.Extra,
    "name": parseIdentity
}, null);
const hoisted_PublicUser_7 = new ObjectReporter(hoisted_PublicUser_0, hoisted_PublicUser_4, {
    "accessLevel": reporters.AccessLevel,
    "avatarSize": reporters.AvatarSize,
    "extra": reporters.Extra,
    "name": reportString
}, null);
const hoisted_PublicUser_8 = new ObjectSchema(hoisted_PublicUser_1, null);
const hoisted_PublicUser_9 = new ObjectDescribe(hoisted_PublicUser_3, null);
const hoisted_Req_0 = {
    "optional": validateString
};
const hoisted_Req_1 = {
    "optional": schemaString
};
const hoisted_Req_2 = {
    "optional": describeString
};
const hoisted_Req_3 = hoisted_Req_2;
const hoisted_Req_4 = null;
const hoisted_Req_5 = new ObjectValidator(hoisted_Req_0, hoisted_Req_4);
const hoisted_Req_6 = new ObjectParser({
    "optional": parseIdentity
}, null);
const hoisted_Req_7 = new ObjectReporter(hoisted_Req_0, hoisted_Req_4, {
    "optional": reportString
}, null);
const hoisted_Req_8 = new ObjectSchema(hoisted_Req_1, null);
const hoisted_Req_9 = new ObjectDescribe(hoisted_Req_3, null);
const hoisted_WithOptionals_0 = [
    validateNull,
    validateString
];
const hoisted_WithOptionals_1 = [
    schemaNull,
    schemaString
];
const hoisted_WithOptionals_2 = [
    describeNull,
    describeString
];
const hoisted_WithOptionals_3 = new AnyOfValidator(hoisted_WithOptionals_0);
const hoisted_WithOptionals_4 = new AnyOfParser(hoisted_WithOptionals_0, [
    parseIdentity,
    parseIdentity
]);
const hoisted_WithOptionals_5 = new AnyOfReporter(hoisted_WithOptionals_0, [
    reportNull,
    reportString
]);
const hoisted_WithOptionals_6 = new AnyOfSchema(hoisted_WithOptionals_1);
const hoisted_WithOptionals_7 = new AnyOfDescribe(hoisted_WithOptionals_2);
const hoisted_WithOptionals_8 = {
    "optional": hoisted_WithOptionals_3.validateAnyOfValidator.bind(hoisted_WithOptionals_3)
};
const hoisted_WithOptionals_9 = {
    "optional": hoisted_WithOptionals_6.schemaAnyOfSchema.bind(hoisted_WithOptionals_6)
};
const hoisted_WithOptionals_10 = {
    "optional": hoisted_WithOptionals_7.describeAnyOfDescribe.bind(hoisted_WithOptionals_7)
};
const hoisted_WithOptionals_11 = hoisted_WithOptionals_10;
const hoisted_WithOptionals_12 = null;
const hoisted_WithOptionals_13 = new ObjectValidator(hoisted_WithOptionals_8, hoisted_WithOptionals_12);
const hoisted_WithOptionals_14 = new ObjectParser({
    "optional": hoisted_WithOptionals_4.parseAnyOfParser.bind(hoisted_WithOptionals_4)
}, null);
const hoisted_WithOptionals_15 = new ObjectReporter(hoisted_WithOptionals_8, hoisted_WithOptionals_12, {
    "optional": hoisted_WithOptionals_5.reportAnyOfReporter.bind(hoisted_WithOptionals_5)
}, null);
const hoisted_WithOptionals_16 = new ObjectSchema(hoisted_WithOptionals_9, null);
const hoisted_WithOptionals_17 = new ObjectDescribe(hoisted_WithOptionals_11, null);
const hoisted_Repro1_0 = [
    validateNull,
    validators.Repro2
];
const hoisted_Repro1_1 = [
    schemaNull,
    schemas.Repro2
];
const hoisted_Repro1_2 = [
    describeNull,
    wrap_describe(describers.Repro2, "Repro2")
];
const hoisted_Repro1_3 = new AnyOfValidator(hoisted_Repro1_0);
const hoisted_Repro1_4 = new AnyOfParser(hoisted_Repro1_0, [
    parseIdentity,
    parsers.Repro2
]);
const hoisted_Repro1_5 = new AnyOfReporter(hoisted_Repro1_0, [
    reportNull,
    reporters.Repro2
]);
const hoisted_Repro1_6 = new AnyOfSchema(hoisted_Repro1_1);
const hoisted_Repro1_7 = new AnyOfDescribe(hoisted_Repro1_2);
const hoisted_Repro1_8 = {
    "sizes": hoisted_Repro1_3.validateAnyOfValidator.bind(hoisted_Repro1_3)
};
const hoisted_Repro1_9 = {
    "sizes": hoisted_Repro1_6.schemaAnyOfSchema.bind(hoisted_Repro1_6)
};
const hoisted_Repro1_10 = {
    "sizes": hoisted_Repro1_7.describeAnyOfDescribe.bind(hoisted_Repro1_7)
};
const hoisted_Repro1_11 = hoisted_Repro1_10;
const hoisted_Repro1_12 = null;
const hoisted_Repro1_13 = new ObjectValidator(hoisted_Repro1_8, hoisted_Repro1_12);
const hoisted_Repro1_14 = new ObjectParser({
    "sizes": hoisted_Repro1_4.parseAnyOfParser.bind(hoisted_Repro1_4)
}, null);
const hoisted_Repro1_15 = new ObjectReporter(hoisted_Repro1_8, hoisted_Repro1_12, {
    "sizes": hoisted_Repro1_5.reportAnyOfReporter.bind(hoisted_Repro1_5)
}, null);
const hoisted_Repro1_16 = new ObjectSchema(hoisted_Repro1_9, null);
const hoisted_Repro1_17 = new ObjectDescribe(hoisted_Repro1_11, null);
const hoisted_Repro2_0 = {
    "useSmallerSizes": validateBoolean
};
const hoisted_Repro2_1 = {
    "useSmallerSizes": schemaBoolean
};
const hoisted_Repro2_2 = {
    "useSmallerSizes": describeBoolean
};
const hoisted_Repro2_3 = hoisted_Repro2_2;
const hoisted_Repro2_4 = null;
const hoisted_Repro2_5 = new ObjectValidator(hoisted_Repro2_0, hoisted_Repro2_4);
const hoisted_Repro2_6 = new ObjectParser({
    "useSmallerSizes": parseIdentity
}, null);
const hoisted_Repro2_7 = new ObjectReporter(hoisted_Repro2_0, hoisted_Repro2_4, {
    "useSmallerSizes": reportBoolean
}, null);
const hoisted_Repro2_8 = new ObjectSchema(hoisted_Repro2_1, null);
const hoisted_Repro2_9 = new ObjectDescribe(hoisted_Repro2_3, null);
const hoisted_SettingsUpdate_0 = new ConstDecoder("d");
const hoisted_SettingsUpdate_1 = {
    "tag": hoisted_SettingsUpdate_0.validateConstDecoder.bind(hoisted_SettingsUpdate_0)
};
const hoisted_SettingsUpdate_2 = {
    "tag": hoisted_SettingsUpdate_0.schemaConstDecoder.bind(hoisted_SettingsUpdate_0)
};
const hoisted_SettingsUpdate_3 = {
    "tag": hoisted_SettingsUpdate_0.describeConstDecoder.bind(hoisted_SettingsUpdate_0)
};
const hoisted_SettingsUpdate_4 = hoisted_SettingsUpdate_3;
const hoisted_SettingsUpdate_5 = null;
const hoisted_SettingsUpdate_6 = new ObjectValidator(hoisted_SettingsUpdate_1, hoisted_SettingsUpdate_5);
const hoisted_SettingsUpdate_7 = new ObjectParser({
    "tag": hoisted_SettingsUpdate_0.parseConstDecoder.bind(hoisted_SettingsUpdate_0)
}, null);
const hoisted_SettingsUpdate_8 = new ObjectReporter(hoisted_SettingsUpdate_1, hoisted_SettingsUpdate_5, {
    "tag": hoisted_SettingsUpdate_0.reportConstDecoder.bind(hoisted_SettingsUpdate_0)
}, null);
const hoisted_SettingsUpdate_9 = new ObjectSchema(hoisted_SettingsUpdate_2, null);
const hoisted_SettingsUpdate_10 = new ObjectDescribe(hoisted_SettingsUpdate_4, null);
const hoisted_SettingsUpdate_11 = [
    validateString,
    hoisted_SettingsUpdate_6.validateObjectValidator.bind(hoisted_SettingsUpdate_6)
];
const hoisted_SettingsUpdate_12 = [
    schemaString,
    hoisted_SettingsUpdate_9.schemaObjectSchema.bind(hoisted_SettingsUpdate_9)
];
const hoisted_SettingsUpdate_13 = [
    describeString,
    hoisted_SettingsUpdate_10.describeObjectDescribe.bind(hoisted_SettingsUpdate_10)
];
const hoisted_SettingsUpdate_14 = new AnyOfValidator(hoisted_SettingsUpdate_11);
const hoisted_SettingsUpdate_15 = new AnyOfParser(hoisted_SettingsUpdate_11, [
    parseIdentity,
    hoisted_SettingsUpdate_7.parseObjectParser.bind(hoisted_SettingsUpdate_7)
]);
const hoisted_SettingsUpdate_16 = new AnyOfReporter(hoisted_SettingsUpdate_11, [
    reportString,
    hoisted_SettingsUpdate_8.reportObjectReporter.bind(hoisted_SettingsUpdate_8)
]);
const hoisted_SettingsUpdate_17 = new AnyOfSchema(hoisted_SettingsUpdate_12);
const hoisted_SettingsUpdate_18 = new AnyOfDescribe(hoisted_SettingsUpdate_13);
const hoisted_Mapped_0 = new ConstDecoder("a");
const hoisted_Mapped_1 = {
    "value": hoisted_Mapped_0.validateConstDecoder.bind(hoisted_Mapped_0)
};
const hoisted_Mapped_2 = {
    "value": hoisted_Mapped_0.schemaConstDecoder.bind(hoisted_Mapped_0)
};
const hoisted_Mapped_3 = {
    "value": hoisted_Mapped_0.describeConstDecoder.bind(hoisted_Mapped_0)
};
const hoisted_Mapped_4 = hoisted_Mapped_3;
const hoisted_Mapped_5 = null;
const hoisted_Mapped_6 = new ObjectValidator(hoisted_Mapped_1, hoisted_Mapped_5);
const hoisted_Mapped_7 = new ObjectParser({
    "value": hoisted_Mapped_0.parseConstDecoder.bind(hoisted_Mapped_0)
}, null);
const hoisted_Mapped_8 = new ObjectReporter(hoisted_Mapped_1, hoisted_Mapped_5, {
    "value": hoisted_Mapped_0.reportConstDecoder.bind(hoisted_Mapped_0)
}, null);
const hoisted_Mapped_9 = new ObjectSchema(hoisted_Mapped_2, null);
const hoisted_Mapped_10 = new ObjectDescribe(hoisted_Mapped_4, null);
const hoisted_Mapped_11 = new ConstDecoder("b");
const hoisted_Mapped_12 = {
    "value": hoisted_Mapped_11.validateConstDecoder.bind(hoisted_Mapped_11)
};
const hoisted_Mapped_13 = {
    "value": hoisted_Mapped_11.schemaConstDecoder.bind(hoisted_Mapped_11)
};
const hoisted_Mapped_14 = {
    "value": hoisted_Mapped_11.describeConstDecoder.bind(hoisted_Mapped_11)
};
const hoisted_Mapped_15 = hoisted_Mapped_14;
const hoisted_Mapped_16 = null;
const hoisted_Mapped_17 = new ObjectValidator(hoisted_Mapped_12, hoisted_Mapped_16);
const hoisted_Mapped_18 = new ObjectParser({
    "value": hoisted_Mapped_11.parseConstDecoder.bind(hoisted_Mapped_11)
}, null);
const hoisted_Mapped_19 = new ObjectReporter(hoisted_Mapped_12, hoisted_Mapped_16, {
    "value": hoisted_Mapped_11.reportConstDecoder.bind(hoisted_Mapped_11)
}, null);
const hoisted_Mapped_20 = new ObjectSchema(hoisted_Mapped_13, null);
const hoisted_Mapped_21 = new ObjectDescribe(hoisted_Mapped_15, null);
const hoisted_Mapped_22 = {
    "a": hoisted_Mapped_6.validateObjectValidator.bind(hoisted_Mapped_6),
    "b": hoisted_Mapped_17.validateObjectValidator.bind(hoisted_Mapped_17)
};
const hoisted_Mapped_23 = {
    "a": hoisted_Mapped_9.schemaObjectSchema.bind(hoisted_Mapped_9),
    "b": hoisted_Mapped_20.schemaObjectSchema.bind(hoisted_Mapped_20)
};
const hoisted_Mapped_24 = {
    "a": hoisted_Mapped_10.describeObjectDescribe.bind(hoisted_Mapped_10),
    "b": hoisted_Mapped_21.describeObjectDescribe.bind(hoisted_Mapped_21)
};
const hoisted_Mapped_25 = hoisted_Mapped_24;
const hoisted_Mapped_26 = null;
const hoisted_Mapped_27 = new ObjectValidator(hoisted_Mapped_22, hoisted_Mapped_26);
const hoisted_Mapped_28 = new ObjectParser({
    "a": hoisted_Mapped_7.parseObjectParser.bind(hoisted_Mapped_7),
    "b": hoisted_Mapped_18.parseObjectParser.bind(hoisted_Mapped_18)
}, null);
const hoisted_Mapped_29 = new ObjectReporter(hoisted_Mapped_22, hoisted_Mapped_26, {
    "a": hoisted_Mapped_8.reportObjectReporter.bind(hoisted_Mapped_8),
    "b": hoisted_Mapped_19.reportObjectReporter.bind(hoisted_Mapped_19)
}, null);
const hoisted_Mapped_30 = new ObjectSchema(hoisted_Mapped_23, null);
const hoisted_Mapped_31 = new ObjectDescribe(hoisted_Mapped_25, null);
const hoisted_MappedOptional_0 = new ConstDecoder("a");
const hoisted_MappedOptional_1 = {
    "value": hoisted_MappedOptional_0.validateConstDecoder.bind(hoisted_MappedOptional_0)
};
const hoisted_MappedOptional_2 = {
    "value": hoisted_MappedOptional_0.schemaConstDecoder.bind(hoisted_MappedOptional_0)
};
const hoisted_MappedOptional_3 = {
    "value": hoisted_MappedOptional_0.describeConstDecoder.bind(hoisted_MappedOptional_0)
};
const hoisted_MappedOptional_4 = hoisted_MappedOptional_3;
const hoisted_MappedOptional_5 = null;
const hoisted_MappedOptional_6 = new ObjectValidator(hoisted_MappedOptional_1, hoisted_MappedOptional_5);
const hoisted_MappedOptional_7 = new ObjectParser({
    "value": hoisted_MappedOptional_0.parseConstDecoder.bind(hoisted_MappedOptional_0)
}, null);
const hoisted_MappedOptional_8 = new ObjectReporter(hoisted_MappedOptional_1, hoisted_MappedOptional_5, {
    "value": hoisted_MappedOptional_0.reportConstDecoder.bind(hoisted_MappedOptional_0)
}, null);
const hoisted_MappedOptional_9 = new ObjectSchema(hoisted_MappedOptional_2, null);
const hoisted_MappedOptional_10 = new ObjectDescribe(hoisted_MappedOptional_4, null);
const hoisted_MappedOptional_11 = [
    validateNull,
    hoisted_MappedOptional_6.validateObjectValidator.bind(hoisted_MappedOptional_6)
];
const hoisted_MappedOptional_12 = [
    schemaNull,
    hoisted_MappedOptional_9.schemaObjectSchema.bind(hoisted_MappedOptional_9)
];
const hoisted_MappedOptional_13 = [
    describeNull,
    hoisted_MappedOptional_10.describeObjectDescribe.bind(hoisted_MappedOptional_10)
];
const hoisted_MappedOptional_14 = new AnyOfValidator(hoisted_MappedOptional_11);
const hoisted_MappedOptional_15 = new AnyOfParser(hoisted_MappedOptional_11, [
    parseIdentity,
    hoisted_MappedOptional_7.parseObjectParser.bind(hoisted_MappedOptional_7)
]);
const hoisted_MappedOptional_16 = new AnyOfReporter(hoisted_MappedOptional_11, [
    reportNull,
    hoisted_MappedOptional_8.reportObjectReporter.bind(hoisted_MappedOptional_8)
]);
const hoisted_MappedOptional_17 = new AnyOfSchema(hoisted_MappedOptional_12);
const hoisted_MappedOptional_18 = new AnyOfDescribe(hoisted_MappedOptional_13);
const hoisted_MappedOptional_19 = new ConstDecoder("b");
const hoisted_MappedOptional_20 = {
    "value": hoisted_MappedOptional_19.validateConstDecoder.bind(hoisted_MappedOptional_19)
};
const hoisted_MappedOptional_21 = {
    "value": hoisted_MappedOptional_19.schemaConstDecoder.bind(hoisted_MappedOptional_19)
};
const hoisted_MappedOptional_22 = {
    "value": hoisted_MappedOptional_19.describeConstDecoder.bind(hoisted_MappedOptional_19)
};
const hoisted_MappedOptional_23 = hoisted_MappedOptional_22;
const hoisted_MappedOptional_24 = null;
const hoisted_MappedOptional_25 = new ObjectValidator(hoisted_MappedOptional_20, hoisted_MappedOptional_24);
const hoisted_MappedOptional_26 = new ObjectParser({
    "value": hoisted_MappedOptional_19.parseConstDecoder.bind(hoisted_MappedOptional_19)
}, null);
const hoisted_MappedOptional_27 = new ObjectReporter(hoisted_MappedOptional_20, hoisted_MappedOptional_24, {
    "value": hoisted_MappedOptional_19.reportConstDecoder.bind(hoisted_MappedOptional_19)
}, null);
const hoisted_MappedOptional_28 = new ObjectSchema(hoisted_MappedOptional_21, null);
const hoisted_MappedOptional_29 = new ObjectDescribe(hoisted_MappedOptional_23, null);
const hoisted_MappedOptional_30 = [
    validateNull,
    hoisted_MappedOptional_25.validateObjectValidator.bind(hoisted_MappedOptional_25)
];
const hoisted_MappedOptional_31 = [
    schemaNull,
    hoisted_MappedOptional_28.schemaObjectSchema.bind(hoisted_MappedOptional_28)
];
const hoisted_MappedOptional_32 = [
    describeNull,
    hoisted_MappedOptional_29.describeObjectDescribe.bind(hoisted_MappedOptional_29)
];
const hoisted_MappedOptional_33 = new AnyOfValidator(hoisted_MappedOptional_30);
const hoisted_MappedOptional_34 = new AnyOfParser(hoisted_MappedOptional_30, [
    parseIdentity,
    hoisted_MappedOptional_26.parseObjectParser.bind(hoisted_MappedOptional_26)
]);
const hoisted_MappedOptional_35 = new AnyOfReporter(hoisted_MappedOptional_30, [
    reportNull,
    hoisted_MappedOptional_27.reportObjectReporter.bind(hoisted_MappedOptional_27)
]);
const hoisted_MappedOptional_36 = new AnyOfSchema(hoisted_MappedOptional_31);
const hoisted_MappedOptional_37 = new AnyOfDescribe(hoisted_MappedOptional_32);
const hoisted_MappedOptional_38 = {
    "a": hoisted_MappedOptional_14.validateAnyOfValidator.bind(hoisted_MappedOptional_14),
    "b": hoisted_MappedOptional_33.validateAnyOfValidator.bind(hoisted_MappedOptional_33)
};
const hoisted_MappedOptional_39 = {
    "a": hoisted_MappedOptional_17.schemaAnyOfSchema.bind(hoisted_MappedOptional_17),
    "b": hoisted_MappedOptional_36.schemaAnyOfSchema.bind(hoisted_MappedOptional_36)
};
const hoisted_MappedOptional_40 = {
    "a": hoisted_MappedOptional_18.describeAnyOfDescribe.bind(hoisted_MappedOptional_18),
    "b": hoisted_MappedOptional_37.describeAnyOfDescribe.bind(hoisted_MappedOptional_37)
};
const hoisted_MappedOptional_41 = hoisted_MappedOptional_40;
const hoisted_MappedOptional_42 = null;
const hoisted_MappedOptional_43 = new ObjectValidator(hoisted_MappedOptional_38, hoisted_MappedOptional_42);
const hoisted_MappedOptional_44 = new ObjectParser({
    "a": hoisted_MappedOptional_15.parseAnyOfParser.bind(hoisted_MappedOptional_15),
    "b": hoisted_MappedOptional_34.parseAnyOfParser.bind(hoisted_MappedOptional_34)
}, null);
const hoisted_MappedOptional_45 = new ObjectReporter(hoisted_MappedOptional_38, hoisted_MappedOptional_42, {
    "a": hoisted_MappedOptional_16.reportAnyOfReporter.bind(hoisted_MappedOptional_16),
    "b": hoisted_MappedOptional_35.reportAnyOfReporter.bind(hoisted_MappedOptional_35)
}, null);
const hoisted_MappedOptional_46 = new ObjectSchema(hoisted_MappedOptional_39, null);
const hoisted_MappedOptional_47 = new ObjectDescribe(hoisted_MappedOptional_41, null);
const hoisted_DiscriminatedUnion_0 = [
    validateNull,
    validateString
];
const hoisted_DiscriminatedUnion_1 = [
    schemaNull,
    schemaString
];
const hoisted_DiscriminatedUnion_2 = [
    describeNull,
    describeString
];
const hoisted_DiscriminatedUnion_3 = new AnyOfValidator(hoisted_DiscriminatedUnion_0);
const hoisted_DiscriminatedUnion_4 = new AnyOfParser(hoisted_DiscriminatedUnion_0, [
    parseIdentity,
    parseIdentity
]);
const hoisted_DiscriminatedUnion_5 = new AnyOfReporter(hoisted_DiscriminatedUnion_0, [
    reportNull,
    reportString
]);
const hoisted_DiscriminatedUnion_6 = new AnyOfSchema(hoisted_DiscriminatedUnion_1);
const hoisted_DiscriminatedUnion_7 = new AnyOfDescribe(hoisted_DiscriminatedUnion_2);
const hoisted_DiscriminatedUnion_8 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion_9 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion_10 = {
    "a1": validateString,
    "a11": hoisted_DiscriminatedUnion_3.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion_3),
    "subType": hoisted_DiscriminatedUnion_8.validateConstDecoder.bind(hoisted_DiscriminatedUnion_8),
    "type": hoisted_DiscriminatedUnion_9.validateConstDecoder.bind(hoisted_DiscriminatedUnion_9)
};
const hoisted_DiscriminatedUnion_11 = {
    "a1": schemaString,
    "a11": hoisted_DiscriminatedUnion_6.schemaAnyOfSchema.bind(hoisted_DiscriminatedUnion_6),
    "subType": hoisted_DiscriminatedUnion_8.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_8),
    "type": hoisted_DiscriminatedUnion_9.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_9)
};
const hoisted_DiscriminatedUnion_12 = {
    "a1": describeString,
    "a11": hoisted_DiscriminatedUnion_7.describeAnyOfDescribe.bind(hoisted_DiscriminatedUnion_7),
    "subType": hoisted_DiscriminatedUnion_8.describeConstDecoder.bind(hoisted_DiscriminatedUnion_8),
    "type": hoisted_DiscriminatedUnion_9.describeConstDecoder.bind(hoisted_DiscriminatedUnion_9)
};
const hoisted_DiscriminatedUnion_13 = hoisted_DiscriminatedUnion_12;
const hoisted_DiscriminatedUnion_14 = null;
const hoisted_DiscriminatedUnion_15 = new ObjectValidator(hoisted_DiscriminatedUnion_10, hoisted_DiscriminatedUnion_14);
const hoisted_DiscriminatedUnion_16 = new ObjectParser({
    "a1": parseIdentity,
    "a11": hoisted_DiscriminatedUnion_4.parseAnyOfParser.bind(hoisted_DiscriminatedUnion_4),
    "subType": hoisted_DiscriminatedUnion_8.parseConstDecoder.bind(hoisted_DiscriminatedUnion_8),
    "type": hoisted_DiscriminatedUnion_9.parseConstDecoder.bind(hoisted_DiscriminatedUnion_9)
}, null);
const hoisted_DiscriminatedUnion_17 = new ObjectReporter(hoisted_DiscriminatedUnion_10, hoisted_DiscriminatedUnion_14, {
    "a1": reportString,
    "a11": hoisted_DiscriminatedUnion_5.reportAnyOfReporter.bind(hoisted_DiscriminatedUnion_5),
    "subType": hoisted_DiscriminatedUnion_8.reportConstDecoder.bind(hoisted_DiscriminatedUnion_8),
    "type": hoisted_DiscriminatedUnion_9.reportConstDecoder.bind(hoisted_DiscriminatedUnion_9)
}, null);
const hoisted_DiscriminatedUnion_18 = new ObjectSchema(hoisted_DiscriminatedUnion_11, null);
const hoisted_DiscriminatedUnion_19 = new ObjectDescribe(hoisted_DiscriminatedUnion_13, null);
const hoisted_DiscriminatedUnion_20 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion_21 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion_22 = {
    "a2": validateString,
    "subType": hoisted_DiscriminatedUnion_20.validateConstDecoder.bind(hoisted_DiscriminatedUnion_20),
    "type": hoisted_DiscriminatedUnion_21.validateConstDecoder.bind(hoisted_DiscriminatedUnion_21)
};
const hoisted_DiscriminatedUnion_23 = {
    "a2": schemaString,
    "subType": hoisted_DiscriminatedUnion_20.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_20),
    "type": hoisted_DiscriminatedUnion_21.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_21)
};
const hoisted_DiscriminatedUnion_24 = {
    "a2": describeString,
    "subType": hoisted_DiscriminatedUnion_20.describeConstDecoder.bind(hoisted_DiscriminatedUnion_20),
    "type": hoisted_DiscriminatedUnion_21.describeConstDecoder.bind(hoisted_DiscriminatedUnion_21)
};
const hoisted_DiscriminatedUnion_25 = hoisted_DiscriminatedUnion_24;
const hoisted_DiscriminatedUnion_26 = null;
const hoisted_DiscriminatedUnion_27 = new ObjectValidator(hoisted_DiscriminatedUnion_22, hoisted_DiscriminatedUnion_26);
const hoisted_DiscriminatedUnion_28 = new ObjectParser({
    "a2": parseIdentity,
    "subType": hoisted_DiscriminatedUnion_20.parseConstDecoder.bind(hoisted_DiscriminatedUnion_20),
    "type": hoisted_DiscriminatedUnion_21.parseConstDecoder.bind(hoisted_DiscriminatedUnion_21)
}, null);
const hoisted_DiscriminatedUnion_29 = new ObjectReporter(hoisted_DiscriminatedUnion_22, hoisted_DiscriminatedUnion_26, {
    "a2": reportString,
    "subType": hoisted_DiscriminatedUnion_20.reportConstDecoder.bind(hoisted_DiscriminatedUnion_20),
    "type": hoisted_DiscriminatedUnion_21.reportConstDecoder.bind(hoisted_DiscriminatedUnion_21)
}, null);
const hoisted_DiscriminatedUnion_30 = new ObjectSchema(hoisted_DiscriminatedUnion_23, null);
const hoisted_DiscriminatedUnion_31 = new ObjectDescribe(hoisted_DiscriminatedUnion_25, null);
const hoisted_DiscriminatedUnion_32 = [
    validateNull,
    validateString
];
const hoisted_DiscriminatedUnion_33 = [
    schemaNull,
    schemaString
];
const hoisted_DiscriminatedUnion_34 = [
    describeNull,
    describeString
];
const hoisted_DiscriminatedUnion_35 = new AnyOfValidator(hoisted_DiscriminatedUnion_32);
const hoisted_DiscriminatedUnion_36 = new AnyOfParser(hoisted_DiscriminatedUnion_32, [
    parseIdentity,
    parseIdentity
]);
const hoisted_DiscriminatedUnion_37 = new AnyOfReporter(hoisted_DiscriminatedUnion_32, [
    reportNull,
    reportString
]);
const hoisted_DiscriminatedUnion_38 = new AnyOfSchema(hoisted_DiscriminatedUnion_33);
const hoisted_DiscriminatedUnion_39 = new AnyOfDescribe(hoisted_DiscriminatedUnion_34);
const hoisted_DiscriminatedUnion_40 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion_41 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion_42 = {
    "a1": validateString,
    "a11": hoisted_DiscriminatedUnion_35.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion_35),
    "subType": hoisted_DiscriminatedUnion_40.validateConstDecoder.bind(hoisted_DiscriminatedUnion_40),
    "type": hoisted_DiscriminatedUnion_41.validateConstDecoder.bind(hoisted_DiscriminatedUnion_41)
};
const hoisted_DiscriminatedUnion_43 = {
    "a1": schemaString,
    "a11": hoisted_DiscriminatedUnion_38.schemaAnyOfSchema.bind(hoisted_DiscriminatedUnion_38),
    "subType": hoisted_DiscriminatedUnion_40.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_40),
    "type": hoisted_DiscriminatedUnion_41.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_41)
};
const hoisted_DiscriminatedUnion_44 = {
    "a1": describeString,
    "a11": hoisted_DiscriminatedUnion_39.describeAnyOfDescribe.bind(hoisted_DiscriminatedUnion_39),
    "subType": hoisted_DiscriminatedUnion_40.describeConstDecoder.bind(hoisted_DiscriminatedUnion_40),
    "type": hoisted_DiscriminatedUnion_41.describeConstDecoder.bind(hoisted_DiscriminatedUnion_41)
};
const hoisted_DiscriminatedUnion_45 = hoisted_DiscriminatedUnion_44;
const hoisted_DiscriminatedUnion_46 = null;
const hoisted_DiscriminatedUnion_47 = new ObjectValidator(hoisted_DiscriminatedUnion_42, hoisted_DiscriminatedUnion_46);
const hoisted_DiscriminatedUnion_48 = new ObjectParser({
    "a1": parseIdentity,
    "a11": hoisted_DiscriminatedUnion_36.parseAnyOfParser.bind(hoisted_DiscriminatedUnion_36),
    "subType": hoisted_DiscriminatedUnion_40.parseConstDecoder.bind(hoisted_DiscriminatedUnion_40),
    "type": hoisted_DiscriminatedUnion_41.parseConstDecoder.bind(hoisted_DiscriminatedUnion_41)
}, null);
const hoisted_DiscriminatedUnion_49 = new ObjectReporter(hoisted_DiscriminatedUnion_42, hoisted_DiscriminatedUnion_46, {
    "a1": reportString,
    "a11": hoisted_DiscriminatedUnion_37.reportAnyOfReporter.bind(hoisted_DiscriminatedUnion_37),
    "subType": hoisted_DiscriminatedUnion_40.reportConstDecoder.bind(hoisted_DiscriminatedUnion_40),
    "type": hoisted_DiscriminatedUnion_41.reportConstDecoder.bind(hoisted_DiscriminatedUnion_41)
}, null);
const hoisted_DiscriminatedUnion_50 = new ObjectSchema(hoisted_DiscriminatedUnion_43, null);
const hoisted_DiscriminatedUnion_51 = new ObjectDescribe(hoisted_DiscriminatedUnion_45, null);
const hoisted_DiscriminatedUnion_52 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion_53 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion_54 = {
    "a2": validateString,
    "subType": hoisted_DiscriminatedUnion_52.validateConstDecoder.bind(hoisted_DiscriminatedUnion_52),
    "type": hoisted_DiscriminatedUnion_53.validateConstDecoder.bind(hoisted_DiscriminatedUnion_53)
};
const hoisted_DiscriminatedUnion_55 = {
    "a2": schemaString,
    "subType": hoisted_DiscriminatedUnion_52.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_52),
    "type": hoisted_DiscriminatedUnion_53.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_53)
};
const hoisted_DiscriminatedUnion_56 = {
    "a2": describeString,
    "subType": hoisted_DiscriminatedUnion_52.describeConstDecoder.bind(hoisted_DiscriminatedUnion_52),
    "type": hoisted_DiscriminatedUnion_53.describeConstDecoder.bind(hoisted_DiscriminatedUnion_53)
};
const hoisted_DiscriminatedUnion_57 = hoisted_DiscriminatedUnion_56;
const hoisted_DiscriminatedUnion_58 = null;
const hoisted_DiscriminatedUnion_59 = new ObjectValidator(hoisted_DiscriminatedUnion_54, hoisted_DiscriminatedUnion_58);
const hoisted_DiscriminatedUnion_60 = new ObjectParser({
    "a2": parseIdentity,
    "subType": hoisted_DiscriminatedUnion_52.parseConstDecoder.bind(hoisted_DiscriminatedUnion_52),
    "type": hoisted_DiscriminatedUnion_53.parseConstDecoder.bind(hoisted_DiscriminatedUnion_53)
}, null);
const hoisted_DiscriminatedUnion_61 = new ObjectReporter(hoisted_DiscriminatedUnion_54, hoisted_DiscriminatedUnion_58, {
    "a2": reportString,
    "subType": hoisted_DiscriminatedUnion_52.reportConstDecoder.bind(hoisted_DiscriminatedUnion_52),
    "type": hoisted_DiscriminatedUnion_53.reportConstDecoder.bind(hoisted_DiscriminatedUnion_53)
}, null);
const hoisted_DiscriminatedUnion_62 = new ObjectSchema(hoisted_DiscriminatedUnion_55, null);
const hoisted_DiscriminatedUnion_63 = new ObjectDescribe(hoisted_DiscriminatedUnion_57, null);
const hoisted_DiscriminatedUnion_64 = [
    validateNull,
    validateString
];
const hoisted_DiscriminatedUnion_65 = [
    schemaNull,
    schemaString
];
const hoisted_DiscriminatedUnion_66 = [
    describeNull,
    describeString
];
const hoisted_DiscriminatedUnion_67 = new AnyOfValidator(hoisted_DiscriminatedUnion_64);
const hoisted_DiscriminatedUnion_68 = new AnyOfParser(hoisted_DiscriminatedUnion_64, [
    parseIdentity,
    parseIdentity
]);
const hoisted_DiscriminatedUnion_69 = new AnyOfReporter(hoisted_DiscriminatedUnion_64, [
    reportNull,
    reportString
]);
const hoisted_DiscriminatedUnion_70 = new AnyOfSchema(hoisted_DiscriminatedUnion_65);
const hoisted_DiscriminatedUnion_71 = new AnyOfDescribe(hoisted_DiscriminatedUnion_66);
const hoisted_DiscriminatedUnion_72 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion_73 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion_74 = {
    "a1": validateString,
    "a11": hoisted_DiscriminatedUnion_67.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion_67),
    "subType": hoisted_DiscriminatedUnion_72.validateConstDecoder.bind(hoisted_DiscriminatedUnion_72),
    "type": hoisted_DiscriminatedUnion_73.validateConstDecoder.bind(hoisted_DiscriminatedUnion_73)
};
const hoisted_DiscriminatedUnion_75 = {
    "a1": schemaString,
    "a11": hoisted_DiscriminatedUnion_70.schemaAnyOfSchema.bind(hoisted_DiscriminatedUnion_70),
    "subType": hoisted_DiscriminatedUnion_72.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_72),
    "type": hoisted_DiscriminatedUnion_73.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_73)
};
const hoisted_DiscriminatedUnion_76 = {
    "a1": describeString,
    "a11": hoisted_DiscriminatedUnion_71.describeAnyOfDescribe.bind(hoisted_DiscriminatedUnion_71),
    "subType": hoisted_DiscriminatedUnion_72.describeConstDecoder.bind(hoisted_DiscriminatedUnion_72),
    "type": hoisted_DiscriminatedUnion_73.describeConstDecoder.bind(hoisted_DiscriminatedUnion_73)
};
const hoisted_DiscriminatedUnion_77 = hoisted_DiscriminatedUnion_76;
const hoisted_DiscriminatedUnion_78 = null;
const hoisted_DiscriminatedUnion_79 = new ObjectValidator(hoisted_DiscriminatedUnion_74, hoisted_DiscriminatedUnion_78);
const hoisted_DiscriminatedUnion_80 = new ObjectParser({
    "a1": parseIdentity,
    "a11": hoisted_DiscriminatedUnion_68.parseAnyOfParser.bind(hoisted_DiscriminatedUnion_68),
    "subType": hoisted_DiscriminatedUnion_72.parseConstDecoder.bind(hoisted_DiscriminatedUnion_72),
    "type": hoisted_DiscriminatedUnion_73.parseConstDecoder.bind(hoisted_DiscriminatedUnion_73)
}, null);
const hoisted_DiscriminatedUnion_81 = new ObjectReporter(hoisted_DiscriminatedUnion_74, hoisted_DiscriminatedUnion_78, {
    "a1": reportString,
    "a11": hoisted_DiscriminatedUnion_69.reportAnyOfReporter.bind(hoisted_DiscriminatedUnion_69),
    "subType": hoisted_DiscriminatedUnion_72.reportConstDecoder.bind(hoisted_DiscriminatedUnion_72),
    "type": hoisted_DiscriminatedUnion_73.reportConstDecoder.bind(hoisted_DiscriminatedUnion_73)
}, null);
const hoisted_DiscriminatedUnion_82 = new ObjectSchema(hoisted_DiscriminatedUnion_75, null);
const hoisted_DiscriminatedUnion_83 = new ObjectDescribe(hoisted_DiscriminatedUnion_77, null);
const hoisted_DiscriminatedUnion_84 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion_85 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion_86 = {
    "a2": validateString,
    "subType": hoisted_DiscriminatedUnion_84.validateConstDecoder.bind(hoisted_DiscriminatedUnion_84),
    "type": hoisted_DiscriminatedUnion_85.validateConstDecoder.bind(hoisted_DiscriminatedUnion_85)
};
const hoisted_DiscriminatedUnion_87 = {
    "a2": schemaString,
    "subType": hoisted_DiscriminatedUnion_84.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_84),
    "type": hoisted_DiscriminatedUnion_85.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_85)
};
const hoisted_DiscriminatedUnion_88 = {
    "a2": describeString,
    "subType": hoisted_DiscriminatedUnion_84.describeConstDecoder.bind(hoisted_DiscriminatedUnion_84),
    "type": hoisted_DiscriminatedUnion_85.describeConstDecoder.bind(hoisted_DiscriminatedUnion_85)
};
const hoisted_DiscriminatedUnion_89 = hoisted_DiscriminatedUnion_88;
const hoisted_DiscriminatedUnion_90 = null;
const hoisted_DiscriminatedUnion_91 = new ObjectValidator(hoisted_DiscriminatedUnion_86, hoisted_DiscriminatedUnion_90);
const hoisted_DiscriminatedUnion_92 = new ObjectParser({
    "a2": parseIdentity,
    "subType": hoisted_DiscriminatedUnion_84.parseConstDecoder.bind(hoisted_DiscriminatedUnion_84),
    "type": hoisted_DiscriminatedUnion_85.parseConstDecoder.bind(hoisted_DiscriminatedUnion_85)
}, null);
const hoisted_DiscriminatedUnion_93 = new ObjectReporter(hoisted_DiscriminatedUnion_86, hoisted_DiscriminatedUnion_90, {
    "a2": reportString,
    "subType": hoisted_DiscriminatedUnion_84.reportConstDecoder.bind(hoisted_DiscriminatedUnion_84),
    "type": hoisted_DiscriminatedUnion_85.reportConstDecoder.bind(hoisted_DiscriminatedUnion_85)
}, null);
const hoisted_DiscriminatedUnion_94 = new ObjectSchema(hoisted_DiscriminatedUnion_87, null);
const hoisted_DiscriminatedUnion_95 = new ObjectDescribe(hoisted_DiscriminatedUnion_89, null);
const hoisted_DiscriminatedUnion_96 = new AnyOfDiscriminatedValidator("subType", {
    "a1": hoisted_DiscriminatedUnion_15.validateObjectValidator.bind(hoisted_DiscriminatedUnion_15),
    "a2": hoisted_DiscriminatedUnion_27.validateObjectValidator.bind(hoisted_DiscriminatedUnion_27)
});
const hoisted_DiscriminatedUnion_97 = new AnyOfDiscriminatedParser("subType", {
    "a1": hoisted_DiscriminatedUnion_16.parseObjectParser.bind(hoisted_DiscriminatedUnion_16),
    "a2": hoisted_DiscriminatedUnion_28.parseObjectParser.bind(hoisted_DiscriminatedUnion_28)
});
const hoisted_DiscriminatedUnion_98 = new AnyOfDiscriminatedReporter("subType", {
    "a1": hoisted_DiscriminatedUnion_17.reportObjectReporter.bind(hoisted_DiscriminatedUnion_17),
    "a2": hoisted_DiscriminatedUnion_29.reportObjectReporter.bind(hoisted_DiscriminatedUnion_29)
});
const hoisted_DiscriminatedUnion_99 = new AnyOfDiscriminatedSchema([
    hoisted_DiscriminatedUnion_50.schemaObjectSchema.bind(hoisted_DiscriminatedUnion_50),
    hoisted_DiscriminatedUnion_62.schemaObjectSchema.bind(hoisted_DiscriminatedUnion_62)
]);
const hoisted_DiscriminatedUnion_100 = new AnyOfDiscriminatedDescribe([
    hoisted_DiscriminatedUnion_83.describeObjectDescribe.bind(hoisted_DiscriminatedUnion_83),
    hoisted_DiscriminatedUnion_95.describeObjectDescribe.bind(hoisted_DiscriminatedUnion_95)
]);
const hoisted_DiscriminatedUnion_101 = new ConstDecoder("b");
const hoisted_DiscriminatedUnion_102 = {
    "type": hoisted_DiscriminatedUnion_101.validateConstDecoder.bind(hoisted_DiscriminatedUnion_101),
    "value": validateNumber
};
const hoisted_DiscriminatedUnion_103 = {
    "type": hoisted_DiscriminatedUnion_101.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_101),
    "value": schemaNumber
};
const hoisted_DiscriminatedUnion_104 = {
    "type": hoisted_DiscriminatedUnion_101.describeConstDecoder.bind(hoisted_DiscriminatedUnion_101),
    "value": describeNumber
};
const hoisted_DiscriminatedUnion_105 = hoisted_DiscriminatedUnion_104;
const hoisted_DiscriminatedUnion_106 = null;
const hoisted_DiscriminatedUnion_107 = new ObjectValidator(hoisted_DiscriminatedUnion_102, hoisted_DiscriminatedUnion_106);
const hoisted_DiscriminatedUnion_108 = new ObjectParser({
    "type": hoisted_DiscriminatedUnion_101.parseConstDecoder.bind(hoisted_DiscriminatedUnion_101),
    "value": parseIdentity
}, null);
const hoisted_DiscriminatedUnion_109 = new ObjectReporter(hoisted_DiscriminatedUnion_102, hoisted_DiscriminatedUnion_106, {
    "type": hoisted_DiscriminatedUnion_101.reportConstDecoder.bind(hoisted_DiscriminatedUnion_101),
    "value": reportNumber
}, null);
const hoisted_DiscriminatedUnion_110 = new ObjectSchema(hoisted_DiscriminatedUnion_103, null);
const hoisted_DiscriminatedUnion_111 = new ObjectDescribe(hoisted_DiscriminatedUnion_105, null);
const hoisted_DiscriminatedUnion_112 = [
    validateNull,
    validateString
];
const hoisted_DiscriminatedUnion_113 = [
    schemaNull,
    schemaString
];
const hoisted_DiscriminatedUnion_114 = [
    describeNull,
    describeString
];
const hoisted_DiscriminatedUnion_115 = new AnyOfValidator(hoisted_DiscriminatedUnion_112);
const hoisted_DiscriminatedUnion_116 = new AnyOfParser(hoisted_DiscriminatedUnion_112, [
    parseIdentity,
    parseIdentity
]);
const hoisted_DiscriminatedUnion_117 = new AnyOfReporter(hoisted_DiscriminatedUnion_112, [
    reportNull,
    reportString
]);
const hoisted_DiscriminatedUnion_118 = new AnyOfSchema(hoisted_DiscriminatedUnion_113);
const hoisted_DiscriminatedUnion_119 = new AnyOfDescribe(hoisted_DiscriminatedUnion_114);
const hoisted_DiscriminatedUnion_120 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion_121 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion_122 = {
    "a1": validateString,
    "a11": hoisted_DiscriminatedUnion_115.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion_115),
    "subType": hoisted_DiscriminatedUnion_120.validateConstDecoder.bind(hoisted_DiscriminatedUnion_120),
    "type": hoisted_DiscriminatedUnion_121.validateConstDecoder.bind(hoisted_DiscriminatedUnion_121)
};
const hoisted_DiscriminatedUnion_123 = {
    "a1": schemaString,
    "a11": hoisted_DiscriminatedUnion_118.schemaAnyOfSchema.bind(hoisted_DiscriminatedUnion_118),
    "subType": hoisted_DiscriminatedUnion_120.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_120),
    "type": hoisted_DiscriminatedUnion_121.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_121)
};
const hoisted_DiscriminatedUnion_124 = {
    "a1": describeString,
    "a11": hoisted_DiscriminatedUnion_119.describeAnyOfDescribe.bind(hoisted_DiscriminatedUnion_119),
    "subType": hoisted_DiscriminatedUnion_120.describeConstDecoder.bind(hoisted_DiscriminatedUnion_120),
    "type": hoisted_DiscriminatedUnion_121.describeConstDecoder.bind(hoisted_DiscriminatedUnion_121)
};
const hoisted_DiscriminatedUnion_125 = hoisted_DiscriminatedUnion_124;
const hoisted_DiscriminatedUnion_126 = null;
const hoisted_DiscriminatedUnion_127 = new ObjectValidator(hoisted_DiscriminatedUnion_122, hoisted_DiscriminatedUnion_126);
const hoisted_DiscriminatedUnion_128 = new ObjectParser({
    "a1": parseIdentity,
    "a11": hoisted_DiscriminatedUnion_116.parseAnyOfParser.bind(hoisted_DiscriminatedUnion_116),
    "subType": hoisted_DiscriminatedUnion_120.parseConstDecoder.bind(hoisted_DiscriminatedUnion_120),
    "type": hoisted_DiscriminatedUnion_121.parseConstDecoder.bind(hoisted_DiscriminatedUnion_121)
}, null);
const hoisted_DiscriminatedUnion_129 = new ObjectReporter(hoisted_DiscriminatedUnion_122, hoisted_DiscriminatedUnion_126, {
    "a1": reportString,
    "a11": hoisted_DiscriminatedUnion_117.reportAnyOfReporter.bind(hoisted_DiscriminatedUnion_117),
    "subType": hoisted_DiscriminatedUnion_120.reportConstDecoder.bind(hoisted_DiscriminatedUnion_120),
    "type": hoisted_DiscriminatedUnion_121.reportConstDecoder.bind(hoisted_DiscriminatedUnion_121)
}, null);
const hoisted_DiscriminatedUnion_130 = new ObjectSchema(hoisted_DiscriminatedUnion_123, null);
const hoisted_DiscriminatedUnion_131 = new ObjectDescribe(hoisted_DiscriminatedUnion_125, null);
const hoisted_DiscriminatedUnion_132 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion_133 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion_134 = {
    "a2": validateString,
    "subType": hoisted_DiscriminatedUnion_132.validateConstDecoder.bind(hoisted_DiscriminatedUnion_132),
    "type": hoisted_DiscriminatedUnion_133.validateConstDecoder.bind(hoisted_DiscriminatedUnion_133)
};
const hoisted_DiscriminatedUnion_135 = {
    "a2": schemaString,
    "subType": hoisted_DiscriminatedUnion_132.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_132),
    "type": hoisted_DiscriminatedUnion_133.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_133)
};
const hoisted_DiscriminatedUnion_136 = {
    "a2": describeString,
    "subType": hoisted_DiscriminatedUnion_132.describeConstDecoder.bind(hoisted_DiscriminatedUnion_132),
    "type": hoisted_DiscriminatedUnion_133.describeConstDecoder.bind(hoisted_DiscriminatedUnion_133)
};
const hoisted_DiscriminatedUnion_137 = hoisted_DiscriminatedUnion_136;
const hoisted_DiscriminatedUnion_138 = null;
const hoisted_DiscriminatedUnion_139 = new ObjectValidator(hoisted_DiscriminatedUnion_134, hoisted_DiscriminatedUnion_138);
const hoisted_DiscriminatedUnion_140 = new ObjectParser({
    "a2": parseIdentity,
    "subType": hoisted_DiscriminatedUnion_132.parseConstDecoder.bind(hoisted_DiscriminatedUnion_132),
    "type": hoisted_DiscriminatedUnion_133.parseConstDecoder.bind(hoisted_DiscriminatedUnion_133)
}, null);
const hoisted_DiscriminatedUnion_141 = new ObjectReporter(hoisted_DiscriminatedUnion_134, hoisted_DiscriminatedUnion_138, {
    "a2": reportString,
    "subType": hoisted_DiscriminatedUnion_132.reportConstDecoder.bind(hoisted_DiscriminatedUnion_132),
    "type": hoisted_DiscriminatedUnion_133.reportConstDecoder.bind(hoisted_DiscriminatedUnion_133)
}, null);
const hoisted_DiscriminatedUnion_142 = new ObjectSchema(hoisted_DiscriminatedUnion_135, null);
const hoisted_DiscriminatedUnion_143 = new ObjectDescribe(hoisted_DiscriminatedUnion_137, null);
const hoisted_DiscriminatedUnion_144 = new ConstDecoder("b");
const hoisted_DiscriminatedUnion_145 = {
    "type": hoisted_DiscriminatedUnion_144.validateConstDecoder.bind(hoisted_DiscriminatedUnion_144),
    "value": validateNumber
};
const hoisted_DiscriminatedUnion_146 = {
    "type": hoisted_DiscriminatedUnion_144.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_144),
    "value": schemaNumber
};
const hoisted_DiscriminatedUnion_147 = {
    "type": hoisted_DiscriminatedUnion_144.describeConstDecoder.bind(hoisted_DiscriminatedUnion_144),
    "value": describeNumber
};
const hoisted_DiscriminatedUnion_148 = hoisted_DiscriminatedUnion_147;
const hoisted_DiscriminatedUnion_149 = null;
const hoisted_DiscriminatedUnion_150 = new ObjectValidator(hoisted_DiscriminatedUnion_145, hoisted_DiscriminatedUnion_149);
const hoisted_DiscriminatedUnion_151 = new ObjectParser({
    "type": hoisted_DiscriminatedUnion_144.parseConstDecoder.bind(hoisted_DiscriminatedUnion_144),
    "value": parseIdentity
}, null);
const hoisted_DiscriminatedUnion_152 = new ObjectReporter(hoisted_DiscriminatedUnion_145, hoisted_DiscriminatedUnion_149, {
    "type": hoisted_DiscriminatedUnion_144.reportConstDecoder.bind(hoisted_DiscriminatedUnion_144),
    "value": reportNumber
}, null);
const hoisted_DiscriminatedUnion_153 = new ObjectSchema(hoisted_DiscriminatedUnion_146, null);
const hoisted_DiscriminatedUnion_154 = new ObjectDescribe(hoisted_DiscriminatedUnion_148, null);
const hoisted_DiscriminatedUnion_155 = [
    validateNull,
    validateString
];
const hoisted_DiscriminatedUnion_156 = [
    schemaNull,
    schemaString
];
const hoisted_DiscriminatedUnion_157 = [
    describeNull,
    describeString
];
const hoisted_DiscriminatedUnion_158 = new AnyOfValidator(hoisted_DiscriminatedUnion_155);
const hoisted_DiscriminatedUnion_159 = new AnyOfParser(hoisted_DiscriminatedUnion_155, [
    parseIdentity,
    parseIdentity
]);
const hoisted_DiscriminatedUnion_160 = new AnyOfReporter(hoisted_DiscriminatedUnion_155, [
    reportNull,
    reportString
]);
const hoisted_DiscriminatedUnion_161 = new AnyOfSchema(hoisted_DiscriminatedUnion_156);
const hoisted_DiscriminatedUnion_162 = new AnyOfDescribe(hoisted_DiscriminatedUnion_157);
const hoisted_DiscriminatedUnion_163 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion_164 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion_165 = {
    "a1": validateString,
    "a11": hoisted_DiscriminatedUnion_158.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion_158),
    "subType": hoisted_DiscriminatedUnion_163.validateConstDecoder.bind(hoisted_DiscriminatedUnion_163),
    "type": hoisted_DiscriminatedUnion_164.validateConstDecoder.bind(hoisted_DiscriminatedUnion_164)
};
const hoisted_DiscriminatedUnion_166 = {
    "a1": schemaString,
    "a11": hoisted_DiscriminatedUnion_161.schemaAnyOfSchema.bind(hoisted_DiscriminatedUnion_161),
    "subType": hoisted_DiscriminatedUnion_163.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_163),
    "type": hoisted_DiscriminatedUnion_164.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_164)
};
const hoisted_DiscriminatedUnion_167 = {
    "a1": describeString,
    "a11": hoisted_DiscriminatedUnion_162.describeAnyOfDescribe.bind(hoisted_DiscriminatedUnion_162),
    "subType": hoisted_DiscriminatedUnion_163.describeConstDecoder.bind(hoisted_DiscriminatedUnion_163),
    "type": hoisted_DiscriminatedUnion_164.describeConstDecoder.bind(hoisted_DiscriminatedUnion_164)
};
const hoisted_DiscriminatedUnion_168 = hoisted_DiscriminatedUnion_167;
const hoisted_DiscriminatedUnion_169 = null;
const hoisted_DiscriminatedUnion_170 = new ObjectValidator(hoisted_DiscriminatedUnion_165, hoisted_DiscriminatedUnion_169);
const hoisted_DiscriminatedUnion_171 = new ObjectParser({
    "a1": parseIdentity,
    "a11": hoisted_DiscriminatedUnion_159.parseAnyOfParser.bind(hoisted_DiscriminatedUnion_159),
    "subType": hoisted_DiscriminatedUnion_163.parseConstDecoder.bind(hoisted_DiscriminatedUnion_163),
    "type": hoisted_DiscriminatedUnion_164.parseConstDecoder.bind(hoisted_DiscriminatedUnion_164)
}, null);
const hoisted_DiscriminatedUnion_172 = new ObjectReporter(hoisted_DiscriminatedUnion_165, hoisted_DiscriminatedUnion_169, {
    "a1": reportString,
    "a11": hoisted_DiscriminatedUnion_160.reportAnyOfReporter.bind(hoisted_DiscriminatedUnion_160),
    "subType": hoisted_DiscriminatedUnion_163.reportConstDecoder.bind(hoisted_DiscriminatedUnion_163),
    "type": hoisted_DiscriminatedUnion_164.reportConstDecoder.bind(hoisted_DiscriminatedUnion_164)
}, null);
const hoisted_DiscriminatedUnion_173 = new ObjectSchema(hoisted_DiscriminatedUnion_166, null);
const hoisted_DiscriminatedUnion_174 = new ObjectDescribe(hoisted_DiscriminatedUnion_168, null);
const hoisted_DiscriminatedUnion_175 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion_176 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion_177 = {
    "a2": validateString,
    "subType": hoisted_DiscriminatedUnion_175.validateConstDecoder.bind(hoisted_DiscriminatedUnion_175),
    "type": hoisted_DiscriminatedUnion_176.validateConstDecoder.bind(hoisted_DiscriminatedUnion_176)
};
const hoisted_DiscriminatedUnion_178 = {
    "a2": schemaString,
    "subType": hoisted_DiscriminatedUnion_175.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_175),
    "type": hoisted_DiscriminatedUnion_176.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_176)
};
const hoisted_DiscriminatedUnion_179 = {
    "a2": describeString,
    "subType": hoisted_DiscriminatedUnion_175.describeConstDecoder.bind(hoisted_DiscriminatedUnion_175),
    "type": hoisted_DiscriminatedUnion_176.describeConstDecoder.bind(hoisted_DiscriminatedUnion_176)
};
const hoisted_DiscriminatedUnion_180 = hoisted_DiscriminatedUnion_179;
const hoisted_DiscriminatedUnion_181 = null;
const hoisted_DiscriminatedUnion_182 = new ObjectValidator(hoisted_DiscriminatedUnion_177, hoisted_DiscriminatedUnion_181);
const hoisted_DiscriminatedUnion_183 = new ObjectParser({
    "a2": parseIdentity,
    "subType": hoisted_DiscriminatedUnion_175.parseConstDecoder.bind(hoisted_DiscriminatedUnion_175),
    "type": hoisted_DiscriminatedUnion_176.parseConstDecoder.bind(hoisted_DiscriminatedUnion_176)
}, null);
const hoisted_DiscriminatedUnion_184 = new ObjectReporter(hoisted_DiscriminatedUnion_177, hoisted_DiscriminatedUnion_181, {
    "a2": reportString,
    "subType": hoisted_DiscriminatedUnion_175.reportConstDecoder.bind(hoisted_DiscriminatedUnion_175),
    "type": hoisted_DiscriminatedUnion_176.reportConstDecoder.bind(hoisted_DiscriminatedUnion_176)
}, null);
const hoisted_DiscriminatedUnion_185 = new ObjectSchema(hoisted_DiscriminatedUnion_178, null);
const hoisted_DiscriminatedUnion_186 = new ObjectDescribe(hoisted_DiscriminatedUnion_180, null);
const hoisted_DiscriminatedUnion_187 = new ConstDecoder("b");
const hoisted_DiscriminatedUnion_188 = {
    "type": hoisted_DiscriminatedUnion_187.validateConstDecoder.bind(hoisted_DiscriminatedUnion_187),
    "value": validateNumber
};
const hoisted_DiscriminatedUnion_189 = {
    "type": hoisted_DiscriminatedUnion_187.schemaConstDecoder.bind(hoisted_DiscriminatedUnion_187),
    "value": schemaNumber
};
const hoisted_DiscriminatedUnion_190 = {
    "type": hoisted_DiscriminatedUnion_187.describeConstDecoder.bind(hoisted_DiscriminatedUnion_187),
    "value": describeNumber
};
const hoisted_DiscriminatedUnion_191 = hoisted_DiscriminatedUnion_190;
const hoisted_DiscriminatedUnion_192 = null;
const hoisted_DiscriminatedUnion_193 = new ObjectValidator(hoisted_DiscriminatedUnion_188, hoisted_DiscriminatedUnion_192);
const hoisted_DiscriminatedUnion_194 = new ObjectParser({
    "type": hoisted_DiscriminatedUnion_187.parseConstDecoder.bind(hoisted_DiscriminatedUnion_187),
    "value": parseIdentity
}, null);
const hoisted_DiscriminatedUnion_195 = new ObjectReporter(hoisted_DiscriminatedUnion_188, hoisted_DiscriminatedUnion_192, {
    "type": hoisted_DiscriminatedUnion_187.reportConstDecoder.bind(hoisted_DiscriminatedUnion_187),
    "value": reportNumber
}, null);
const hoisted_DiscriminatedUnion_196 = new ObjectSchema(hoisted_DiscriminatedUnion_189, null);
const hoisted_DiscriminatedUnion_197 = new ObjectDescribe(hoisted_DiscriminatedUnion_191, null);
const hoisted_DiscriminatedUnion_198 = new AnyOfDiscriminatedValidator("type", {
    "a": hoisted_DiscriminatedUnion_96.validateAnyOfDiscriminatedValidator.bind(hoisted_DiscriminatedUnion_96),
    "b": hoisted_DiscriminatedUnion_107.validateObjectValidator.bind(hoisted_DiscriminatedUnion_107)
});
const hoisted_DiscriminatedUnion_199 = new AnyOfDiscriminatedParser("type", {
    "a": hoisted_DiscriminatedUnion_97.parseAnyOfDiscriminatedParser.bind(hoisted_DiscriminatedUnion_97),
    "b": hoisted_DiscriminatedUnion_108.parseObjectParser.bind(hoisted_DiscriminatedUnion_108)
});
const hoisted_DiscriminatedUnion_200 = new AnyOfDiscriminatedReporter("type", {
    "a": hoisted_DiscriminatedUnion_98.reportAnyOfDiscriminatedReporter.bind(hoisted_DiscriminatedUnion_98),
    "b": hoisted_DiscriminatedUnion_109.reportObjectReporter.bind(hoisted_DiscriminatedUnion_109)
});
const hoisted_DiscriminatedUnion_201 = new AnyOfDiscriminatedSchema([
    hoisted_DiscriminatedUnion_130.schemaObjectSchema.bind(hoisted_DiscriminatedUnion_130),
    hoisted_DiscriminatedUnion_142.schemaObjectSchema.bind(hoisted_DiscriminatedUnion_142),
    hoisted_DiscriminatedUnion_153.schemaObjectSchema.bind(hoisted_DiscriminatedUnion_153)
]);
const hoisted_DiscriminatedUnion_202 = new AnyOfDiscriminatedDescribe([
    hoisted_DiscriminatedUnion_174.describeObjectDescribe.bind(hoisted_DiscriminatedUnion_174),
    hoisted_DiscriminatedUnion_186.describeObjectDescribe.bind(hoisted_DiscriminatedUnion_186),
    hoisted_DiscriminatedUnion_197.describeObjectDescribe.bind(hoisted_DiscriminatedUnion_197)
]);
const hoisted_DiscriminatedUnion2_0 = [
    validateNull,
    validateString
];
const hoisted_DiscriminatedUnion2_1 = [
    schemaNull,
    schemaString
];
const hoisted_DiscriminatedUnion2_2 = [
    describeNull,
    describeString
];
const hoisted_DiscriminatedUnion2_3 = new AnyOfValidator(hoisted_DiscriminatedUnion2_0);
const hoisted_DiscriminatedUnion2_4 = new AnyOfParser(hoisted_DiscriminatedUnion2_0, [
    parseIdentity,
    parseIdentity
]);
const hoisted_DiscriminatedUnion2_5 = new AnyOfReporter(hoisted_DiscriminatedUnion2_0, [
    reportNull,
    reportString
]);
const hoisted_DiscriminatedUnion2_6 = new AnyOfSchema(hoisted_DiscriminatedUnion2_1);
const hoisted_DiscriminatedUnion2_7 = new AnyOfDescribe(hoisted_DiscriminatedUnion2_2);
const hoisted_DiscriminatedUnion2_8 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion2_9 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion2_10 = {
    "a1": validateString,
    "a11": hoisted_DiscriminatedUnion2_3.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion2_3),
    "subType": hoisted_DiscriminatedUnion2_8.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_8),
    "type": hoisted_DiscriminatedUnion2_9.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_9)
};
const hoisted_DiscriminatedUnion2_11 = {
    "a1": schemaString,
    "a11": hoisted_DiscriminatedUnion2_6.schemaAnyOfSchema.bind(hoisted_DiscriminatedUnion2_6),
    "subType": hoisted_DiscriminatedUnion2_8.schemaConstDecoder.bind(hoisted_DiscriminatedUnion2_8),
    "type": hoisted_DiscriminatedUnion2_9.schemaConstDecoder.bind(hoisted_DiscriminatedUnion2_9)
};
const hoisted_DiscriminatedUnion2_12 = {
    "a1": describeString,
    "a11": hoisted_DiscriminatedUnion2_7.describeAnyOfDescribe.bind(hoisted_DiscriminatedUnion2_7),
    "subType": hoisted_DiscriminatedUnion2_8.describeConstDecoder.bind(hoisted_DiscriminatedUnion2_8),
    "type": hoisted_DiscriminatedUnion2_9.describeConstDecoder.bind(hoisted_DiscriminatedUnion2_9)
};
const hoisted_DiscriminatedUnion2_13 = hoisted_DiscriminatedUnion2_12;
const hoisted_DiscriminatedUnion2_14 = null;
const hoisted_DiscriminatedUnion2_15 = new ObjectValidator(hoisted_DiscriminatedUnion2_10, hoisted_DiscriminatedUnion2_14);
const hoisted_DiscriminatedUnion2_16 = new ObjectParser({
    "a1": parseIdentity,
    "a11": hoisted_DiscriminatedUnion2_4.parseAnyOfParser.bind(hoisted_DiscriminatedUnion2_4),
    "subType": hoisted_DiscriminatedUnion2_8.parseConstDecoder.bind(hoisted_DiscriminatedUnion2_8),
    "type": hoisted_DiscriminatedUnion2_9.parseConstDecoder.bind(hoisted_DiscriminatedUnion2_9)
}, null);
const hoisted_DiscriminatedUnion2_17 = new ObjectReporter(hoisted_DiscriminatedUnion2_10, hoisted_DiscriminatedUnion2_14, {
    "a1": reportString,
    "a11": hoisted_DiscriminatedUnion2_5.reportAnyOfReporter.bind(hoisted_DiscriminatedUnion2_5),
    "subType": hoisted_DiscriminatedUnion2_8.reportConstDecoder.bind(hoisted_DiscriminatedUnion2_8),
    "type": hoisted_DiscriminatedUnion2_9.reportConstDecoder.bind(hoisted_DiscriminatedUnion2_9)
}, null);
const hoisted_DiscriminatedUnion2_18 = new ObjectSchema(hoisted_DiscriminatedUnion2_11, null);
const hoisted_DiscriminatedUnion2_19 = new ObjectDescribe(hoisted_DiscriminatedUnion2_13, null);
const hoisted_DiscriminatedUnion2_20 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion2_21 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion2_22 = {
    "a2": validateString,
    "subType": hoisted_DiscriminatedUnion2_20.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_20),
    "type": hoisted_DiscriminatedUnion2_21.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_21)
};
const hoisted_DiscriminatedUnion2_23 = {
    "a2": schemaString,
    "subType": hoisted_DiscriminatedUnion2_20.schemaConstDecoder.bind(hoisted_DiscriminatedUnion2_20),
    "type": hoisted_DiscriminatedUnion2_21.schemaConstDecoder.bind(hoisted_DiscriminatedUnion2_21)
};
const hoisted_DiscriminatedUnion2_24 = {
    "a2": describeString,
    "subType": hoisted_DiscriminatedUnion2_20.describeConstDecoder.bind(hoisted_DiscriminatedUnion2_20),
    "type": hoisted_DiscriminatedUnion2_21.describeConstDecoder.bind(hoisted_DiscriminatedUnion2_21)
};
const hoisted_DiscriminatedUnion2_25 = hoisted_DiscriminatedUnion2_24;
const hoisted_DiscriminatedUnion2_26 = null;
const hoisted_DiscriminatedUnion2_27 = new ObjectValidator(hoisted_DiscriminatedUnion2_22, hoisted_DiscriminatedUnion2_26);
const hoisted_DiscriminatedUnion2_28 = new ObjectParser({
    "a2": parseIdentity,
    "subType": hoisted_DiscriminatedUnion2_20.parseConstDecoder.bind(hoisted_DiscriminatedUnion2_20),
    "type": hoisted_DiscriminatedUnion2_21.parseConstDecoder.bind(hoisted_DiscriminatedUnion2_21)
}, null);
const hoisted_DiscriminatedUnion2_29 = new ObjectReporter(hoisted_DiscriminatedUnion2_22, hoisted_DiscriminatedUnion2_26, {
    "a2": reportString,
    "subType": hoisted_DiscriminatedUnion2_20.reportConstDecoder.bind(hoisted_DiscriminatedUnion2_20),
    "type": hoisted_DiscriminatedUnion2_21.reportConstDecoder.bind(hoisted_DiscriminatedUnion2_21)
}, null);
const hoisted_DiscriminatedUnion2_30 = new ObjectSchema(hoisted_DiscriminatedUnion2_23, null);
const hoisted_DiscriminatedUnion2_31 = new ObjectDescribe(hoisted_DiscriminatedUnion2_25, null);
const hoisted_DiscriminatedUnion2_32 = new ConstDecoder("d");
const hoisted_DiscriminatedUnion2_33 = [
    validateNull,
    hoisted_DiscriminatedUnion2_32.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_32)
];
const hoisted_DiscriminatedUnion2_34 = [
    schemaNull,
    hoisted_DiscriminatedUnion2_32.schemaConstDecoder.bind(hoisted_DiscriminatedUnion2_32)
];
const hoisted_DiscriminatedUnion2_35 = [
    describeNull,
    hoisted_DiscriminatedUnion2_32.describeConstDecoder.bind(hoisted_DiscriminatedUnion2_32)
];
const hoisted_DiscriminatedUnion2_36 = new AnyOfValidator(hoisted_DiscriminatedUnion2_33);
const hoisted_DiscriminatedUnion2_37 = new AnyOfParser(hoisted_DiscriminatedUnion2_33, [
    parseIdentity,
    hoisted_DiscriminatedUnion2_32.parseConstDecoder.bind(hoisted_DiscriminatedUnion2_32)
]);
const hoisted_DiscriminatedUnion2_38 = new AnyOfReporter(hoisted_DiscriminatedUnion2_33, [
    reportNull,
    hoisted_DiscriminatedUnion2_32.reportConstDecoder.bind(hoisted_DiscriminatedUnion2_32)
]);
const hoisted_DiscriminatedUnion2_39 = new AnyOfSchema(hoisted_DiscriminatedUnion2_34);
const hoisted_DiscriminatedUnion2_40 = new AnyOfDescribe(hoisted_DiscriminatedUnion2_35);
const hoisted_DiscriminatedUnion2_41 = {
    "type": hoisted_DiscriminatedUnion2_36.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion2_36),
    "valueD": validateNumber
};
const hoisted_DiscriminatedUnion2_42 = {
    "type": hoisted_DiscriminatedUnion2_39.schemaAnyOfSchema.bind(hoisted_DiscriminatedUnion2_39),
    "valueD": schemaNumber
};
const hoisted_DiscriminatedUnion2_43 = {
    "type": hoisted_DiscriminatedUnion2_40.describeAnyOfDescribe.bind(hoisted_DiscriminatedUnion2_40),
    "valueD": describeNumber
};
const hoisted_DiscriminatedUnion2_44 = hoisted_DiscriminatedUnion2_43;
const hoisted_DiscriminatedUnion2_45 = null;
const hoisted_DiscriminatedUnion2_46 = new ObjectValidator(hoisted_DiscriminatedUnion2_41, hoisted_DiscriminatedUnion2_45);
const hoisted_DiscriminatedUnion2_47 = new ObjectParser({
    "type": hoisted_DiscriminatedUnion2_37.parseAnyOfParser.bind(hoisted_DiscriminatedUnion2_37),
    "valueD": parseIdentity
}, null);
const hoisted_DiscriminatedUnion2_48 = new ObjectReporter(hoisted_DiscriminatedUnion2_41, hoisted_DiscriminatedUnion2_45, {
    "type": hoisted_DiscriminatedUnion2_38.reportAnyOfReporter.bind(hoisted_DiscriminatedUnion2_38),
    "valueD": reportNumber
}, null);
const hoisted_DiscriminatedUnion2_49 = new ObjectSchema(hoisted_DiscriminatedUnion2_42, null);
const hoisted_DiscriminatedUnion2_50 = new ObjectDescribe(hoisted_DiscriminatedUnion2_44, null);
const hoisted_DiscriminatedUnion2_51 = new ConstDecoder("b");
const hoisted_DiscriminatedUnion2_52 = {
    "type": hoisted_DiscriminatedUnion2_51.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_51),
    "value": validateNumber
};
const hoisted_DiscriminatedUnion2_53 = {
    "type": hoisted_DiscriminatedUnion2_51.schemaConstDecoder.bind(hoisted_DiscriminatedUnion2_51),
    "value": schemaNumber
};
const hoisted_DiscriminatedUnion2_54 = {
    "type": hoisted_DiscriminatedUnion2_51.describeConstDecoder.bind(hoisted_DiscriminatedUnion2_51),
    "value": describeNumber
};
const hoisted_DiscriminatedUnion2_55 = hoisted_DiscriminatedUnion2_54;
const hoisted_DiscriminatedUnion2_56 = null;
const hoisted_DiscriminatedUnion2_57 = new ObjectValidator(hoisted_DiscriminatedUnion2_52, hoisted_DiscriminatedUnion2_56);
const hoisted_DiscriminatedUnion2_58 = new ObjectParser({
    "type": hoisted_DiscriminatedUnion2_51.parseConstDecoder.bind(hoisted_DiscriminatedUnion2_51),
    "value": parseIdentity
}, null);
const hoisted_DiscriminatedUnion2_59 = new ObjectReporter(hoisted_DiscriminatedUnion2_52, hoisted_DiscriminatedUnion2_56, {
    "type": hoisted_DiscriminatedUnion2_51.reportConstDecoder.bind(hoisted_DiscriminatedUnion2_51),
    "value": reportNumber
}, null);
const hoisted_DiscriminatedUnion2_60 = new ObjectSchema(hoisted_DiscriminatedUnion2_53, null);
const hoisted_DiscriminatedUnion2_61 = new ObjectDescribe(hoisted_DiscriminatedUnion2_55, null);
const hoisted_DiscriminatedUnion2_62 = [
    hoisted_DiscriminatedUnion2_15.validateObjectValidator.bind(hoisted_DiscriminatedUnion2_15),
    hoisted_DiscriminatedUnion2_27.validateObjectValidator.bind(hoisted_DiscriminatedUnion2_27),
    hoisted_DiscriminatedUnion2_46.validateObjectValidator.bind(hoisted_DiscriminatedUnion2_46),
    hoisted_DiscriminatedUnion2_57.validateObjectValidator.bind(hoisted_DiscriminatedUnion2_57)
];
const hoisted_DiscriminatedUnion2_63 = [
    hoisted_DiscriminatedUnion2_18.schemaObjectSchema.bind(hoisted_DiscriminatedUnion2_18),
    hoisted_DiscriminatedUnion2_30.schemaObjectSchema.bind(hoisted_DiscriminatedUnion2_30),
    hoisted_DiscriminatedUnion2_49.schemaObjectSchema.bind(hoisted_DiscriminatedUnion2_49),
    hoisted_DiscriminatedUnion2_60.schemaObjectSchema.bind(hoisted_DiscriminatedUnion2_60)
];
const hoisted_DiscriminatedUnion2_64 = [
    hoisted_DiscriminatedUnion2_19.describeObjectDescribe.bind(hoisted_DiscriminatedUnion2_19),
    hoisted_DiscriminatedUnion2_31.describeObjectDescribe.bind(hoisted_DiscriminatedUnion2_31),
    hoisted_DiscriminatedUnion2_50.describeObjectDescribe.bind(hoisted_DiscriminatedUnion2_50),
    hoisted_DiscriminatedUnion2_61.describeObjectDescribe.bind(hoisted_DiscriminatedUnion2_61)
];
const hoisted_DiscriminatedUnion2_65 = new AnyOfValidator(hoisted_DiscriminatedUnion2_62);
const hoisted_DiscriminatedUnion2_66 = new AnyOfParser(hoisted_DiscriminatedUnion2_62, [
    hoisted_DiscriminatedUnion2_16.parseObjectParser.bind(hoisted_DiscriminatedUnion2_16),
    hoisted_DiscriminatedUnion2_28.parseObjectParser.bind(hoisted_DiscriminatedUnion2_28),
    hoisted_DiscriminatedUnion2_47.parseObjectParser.bind(hoisted_DiscriminatedUnion2_47),
    hoisted_DiscriminatedUnion2_58.parseObjectParser.bind(hoisted_DiscriminatedUnion2_58)
]);
const hoisted_DiscriminatedUnion2_67 = new AnyOfReporter(hoisted_DiscriminatedUnion2_62, [
    hoisted_DiscriminatedUnion2_17.reportObjectReporter.bind(hoisted_DiscriminatedUnion2_17),
    hoisted_DiscriminatedUnion2_29.reportObjectReporter.bind(hoisted_DiscriminatedUnion2_29),
    hoisted_DiscriminatedUnion2_48.reportObjectReporter.bind(hoisted_DiscriminatedUnion2_48),
    hoisted_DiscriminatedUnion2_59.reportObjectReporter.bind(hoisted_DiscriminatedUnion2_59)
]);
const hoisted_DiscriminatedUnion2_68 = new AnyOfSchema(hoisted_DiscriminatedUnion2_63);
const hoisted_DiscriminatedUnion2_69 = new AnyOfDescribe(hoisted_DiscriminatedUnion2_64);
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
const hoisted_DiscriminatedUnion3_3 = {
    "a1": describeString,
    "type": hoisted_DiscriminatedUnion3_0.describeAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_0)
};
const hoisted_DiscriminatedUnion3_4 = hoisted_DiscriminatedUnion3_3;
const hoisted_DiscriminatedUnion3_5 = null;
const hoisted_DiscriminatedUnion3_6 = new ObjectValidator(hoisted_DiscriminatedUnion3_1, hoisted_DiscriminatedUnion3_5);
const hoisted_DiscriminatedUnion3_7 = new ObjectParser({
    "a1": parseIdentity,
    "type": hoisted_DiscriminatedUnion3_0.parseAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_0)
}, null);
const hoisted_DiscriminatedUnion3_8 = new ObjectReporter(hoisted_DiscriminatedUnion3_1, hoisted_DiscriminatedUnion3_5, {
    "a1": reportString,
    "type": hoisted_DiscriminatedUnion3_0.reportAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_0)
}, null);
const hoisted_DiscriminatedUnion3_9 = new ObjectSchema(hoisted_DiscriminatedUnion3_2, null);
const hoisted_DiscriminatedUnion3_10 = new ObjectDescribe(hoisted_DiscriminatedUnion3_4, null);
const hoisted_DiscriminatedUnion3_11 = new ConstDecoder("b");
const hoisted_DiscriminatedUnion3_12 = {
    "type": hoisted_DiscriminatedUnion3_11.validateConstDecoder.bind(hoisted_DiscriminatedUnion3_11),
    "value": validateNumber
};
const hoisted_DiscriminatedUnion3_13 = {
    "type": hoisted_DiscriminatedUnion3_11.schemaConstDecoder.bind(hoisted_DiscriminatedUnion3_11),
    "value": schemaNumber
};
const hoisted_DiscriminatedUnion3_14 = {
    "type": hoisted_DiscriminatedUnion3_11.describeConstDecoder.bind(hoisted_DiscriminatedUnion3_11),
    "value": describeNumber
};
const hoisted_DiscriminatedUnion3_15 = hoisted_DiscriminatedUnion3_14;
const hoisted_DiscriminatedUnion3_16 = null;
const hoisted_DiscriminatedUnion3_17 = new ObjectValidator(hoisted_DiscriminatedUnion3_12, hoisted_DiscriminatedUnion3_16);
const hoisted_DiscriminatedUnion3_18 = new ObjectParser({
    "type": hoisted_DiscriminatedUnion3_11.parseConstDecoder.bind(hoisted_DiscriminatedUnion3_11),
    "value": parseIdentity
}, null);
const hoisted_DiscriminatedUnion3_19 = new ObjectReporter(hoisted_DiscriminatedUnion3_12, hoisted_DiscriminatedUnion3_16, {
    "type": hoisted_DiscriminatedUnion3_11.reportConstDecoder.bind(hoisted_DiscriminatedUnion3_11),
    "value": reportNumber
}, null);
const hoisted_DiscriminatedUnion3_20 = new ObjectSchema(hoisted_DiscriminatedUnion3_13, null);
const hoisted_DiscriminatedUnion3_21 = new ObjectDescribe(hoisted_DiscriminatedUnion3_15, null);
const hoisted_DiscriminatedUnion3_22 = new AnyOfConstsDecoder([
    "a",
    "c"
]);
const hoisted_DiscriminatedUnion3_23 = {
    "a1": validateString,
    "type": hoisted_DiscriminatedUnion3_22.validateAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_22)
};
const hoisted_DiscriminatedUnion3_24 = {
    "a1": schemaString,
    "type": hoisted_DiscriminatedUnion3_22.schemaAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_22)
};
const hoisted_DiscriminatedUnion3_25 = {
    "a1": describeString,
    "type": hoisted_DiscriminatedUnion3_22.describeAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_22)
};
const hoisted_DiscriminatedUnion3_26 = hoisted_DiscriminatedUnion3_25;
const hoisted_DiscriminatedUnion3_27 = null;
const hoisted_DiscriminatedUnion3_28 = new ObjectValidator(hoisted_DiscriminatedUnion3_23, hoisted_DiscriminatedUnion3_27);
const hoisted_DiscriminatedUnion3_29 = new ObjectParser({
    "a1": parseIdentity,
    "type": hoisted_DiscriminatedUnion3_22.parseAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_22)
}, null);
const hoisted_DiscriminatedUnion3_30 = new ObjectReporter(hoisted_DiscriminatedUnion3_23, hoisted_DiscriminatedUnion3_27, {
    "a1": reportString,
    "type": hoisted_DiscriminatedUnion3_22.reportAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_22)
}, null);
const hoisted_DiscriminatedUnion3_31 = new ObjectSchema(hoisted_DiscriminatedUnion3_24, null);
const hoisted_DiscriminatedUnion3_32 = new ObjectDescribe(hoisted_DiscriminatedUnion3_26, null);
const hoisted_DiscriminatedUnion3_33 = new AnyOfConstsDecoder([
    "a",
    "c"
]);
const hoisted_DiscriminatedUnion3_34 = {
    "a1": validateString,
    "type": hoisted_DiscriminatedUnion3_33.validateAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_33)
};
const hoisted_DiscriminatedUnion3_35 = {
    "a1": schemaString,
    "type": hoisted_DiscriminatedUnion3_33.schemaAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_33)
};
const hoisted_DiscriminatedUnion3_36 = {
    "a1": describeString,
    "type": hoisted_DiscriminatedUnion3_33.describeAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_33)
};
const hoisted_DiscriminatedUnion3_37 = hoisted_DiscriminatedUnion3_36;
const hoisted_DiscriminatedUnion3_38 = null;
const hoisted_DiscriminatedUnion3_39 = new ObjectValidator(hoisted_DiscriminatedUnion3_34, hoisted_DiscriminatedUnion3_38);
const hoisted_DiscriminatedUnion3_40 = new ObjectParser({
    "a1": parseIdentity,
    "type": hoisted_DiscriminatedUnion3_33.parseAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_33)
}, null);
const hoisted_DiscriminatedUnion3_41 = new ObjectReporter(hoisted_DiscriminatedUnion3_34, hoisted_DiscriminatedUnion3_38, {
    "a1": reportString,
    "type": hoisted_DiscriminatedUnion3_33.reportAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_33)
}, null);
const hoisted_DiscriminatedUnion3_42 = new ObjectSchema(hoisted_DiscriminatedUnion3_35, null);
const hoisted_DiscriminatedUnion3_43 = new ObjectDescribe(hoisted_DiscriminatedUnion3_37, null);
const hoisted_DiscriminatedUnion3_44 = new ConstDecoder("b");
const hoisted_DiscriminatedUnion3_45 = {
    "type": hoisted_DiscriminatedUnion3_44.validateConstDecoder.bind(hoisted_DiscriminatedUnion3_44),
    "value": validateNumber
};
const hoisted_DiscriminatedUnion3_46 = {
    "type": hoisted_DiscriminatedUnion3_44.schemaConstDecoder.bind(hoisted_DiscriminatedUnion3_44),
    "value": schemaNumber
};
const hoisted_DiscriminatedUnion3_47 = {
    "type": hoisted_DiscriminatedUnion3_44.describeConstDecoder.bind(hoisted_DiscriminatedUnion3_44),
    "value": describeNumber
};
const hoisted_DiscriminatedUnion3_48 = hoisted_DiscriminatedUnion3_47;
const hoisted_DiscriminatedUnion3_49 = null;
const hoisted_DiscriminatedUnion3_50 = new ObjectValidator(hoisted_DiscriminatedUnion3_45, hoisted_DiscriminatedUnion3_49);
const hoisted_DiscriminatedUnion3_51 = new ObjectParser({
    "type": hoisted_DiscriminatedUnion3_44.parseConstDecoder.bind(hoisted_DiscriminatedUnion3_44),
    "value": parseIdentity
}, null);
const hoisted_DiscriminatedUnion3_52 = new ObjectReporter(hoisted_DiscriminatedUnion3_45, hoisted_DiscriminatedUnion3_49, {
    "type": hoisted_DiscriminatedUnion3_44.reportConstDecoder.bind(hoisted_DiscriminatedUnion3_44),
    "value": reportNumber
}, null);
const hoisted_DiscriminatedUnion3_53 = new ObjectSchema(hoisted_DiscriminatedUnion3_46, null);
const hoisted_DiscriminatedUnion3_54 = new ObjectDescribe(hoisted_DiscriminatedUnion3_48, null);
const hoisted_DiscriminatedUnion3_55 = new AnyOfConstsDecoder([
    "a",
    "c"
]);
const hoisted_DiscriminatedUnion3_56 = {
    "a1": validateString,
    "type": hoisted_DiscriminatedUnion3_55.validateAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_55)
};
const hoisted_DiscriminatedUnion3_57 = {
    "a1": schemaString,
    "type": hoisted_DiscriminatedUnion3_55.schemaAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_55)
};
const hoisted_DiscriminatedUnion3_58 = {
    "a1": describeString,
    "type": hoisted_DiscriminatedUnion3_55.describeAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_55)
};
const hoisted_DiscriminatedUnion3_59 = hoisted_DiscriminatedUnion3_58;
const hoisted_DiscriminatedUnion3_60 = null;
const hoisted_DiscriminatedUnion3_61 = new ObjectValidator(hoisted_DiscriminatedUnion3_56, hoisted_DiscriminatedUnion3_60);
const hoisted_DiscriminatedUnion3_62 = new ObjectParser({
    "a1": parseIdentity,
    "type": hoisted_DiscriminatedUnion3_55.parseAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_55)
}, null);
const hoisted_DiscriminatedUnion3_63 = new ObjectReporter(hoisted_DiscriminatedUnion3_56, hoisted_DiscriminatedUnion3_60, {
    "a1": reportString,
    "type": hoisted_DiscriminatedUnion3_55.reportAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_55)
}, null);
const hoisted_DiscriminatedUnion3_64 = new ObjectSchema(hoisted_DiscriminatedUnion3_57, null);
const hoisted_DiscriminatedUnion3_65 = new ObjectDescribe(hoisted_DiscriminatedUnion3_59, null);
const hoisted_DiscriminatedUnion3_66 = new ConstDecoder("b");
const hoisted_DiscriminatedUnion3_67 = {
    "type": hoisted_DiscriminatedUnion3_66.validateConstDecoder.bind(hoisted_DiscriminatedUnion3_66),
    "value": validateNumber
};
const hoisted_DiscriminatedUnion3_68 = {
    "type": hoisted_DiscriminatedUnion3_66.schemaConstDecoder.bind(hoisted_DiscriminatedUnion3_66),
    "value": schemaNumber
};
const hoisted_DiscriminatedUnion3_69 = {
    "type": hoisted_DiscriminatedUnion3_66.describeConstDecoder.bind(hoisted_DiscriminatedUnion3_66),
    "value": describeNumber
};
const hoisted_DiscriminatedUnion3_70 = hoisted_DiscriminatedUnion3_69;
const hoisted_DiscriminatedUnion3_71 = null;
const hoisted_DiscriminatedUnion3_72 = new ObjectValidator(hoisted_DiscriminatedUnion3_67, hoisted_DiscriminatedUnion3_71);
const hoisted_DiscriminatedUnion3_73 = new ObjectParser({
    "type": hoisted_DiscriminatedUnion3_66.parseConstDecoder.bind(hoisted_DiscriminatedUnion3_66),
    "value": parseIdentity
}, null);
const hoisted_DiscriminatedUnion3_74 = new ObjectReporter(hoisted_DiscriminatedUnion3_67, hoisted_DiscriminatedUnion3_71, {
    "type": hoisted_DiscriminatedUnion3_66.reportConstDecoder.bind(hoisted_DiscriminatedUnion3_66),
    "value": reportNumber
}, null);
const hoisted_DiscriminatedUnion3_75 = new ObjectSchema(hoisted_DiscriminatedUnion3_68, null);
const hoisted_DiscriminatedUnion3_76 = new ObjectDescribe(hoisted_DiscriminatedUnion3_70, null);
const hoisted_DiscriminatedUnion3_77 = new AnyOfDiscriminatedValidator("type", {
    "a": hoisted_DiscriminatedUnion3_6.validateObjectValidator.bind(hoisted_DiscriminatedUnion3_6),
    "b": hoisted_DiscriminatedUnion3_17.validateObjectValidator.bind(hoisted_DiscriminatedUnion3_17),
    "c": hoisted_DiscriminatedUnion3_28.validateObjectValidator.bind(hoisted_DiscriminatedUnion3_28)
});
const hoisted_DiscriminatedUnion3_78 = new AnyOfDiscriminatedParser("type", {
    "a": hoisted_DiscriminatedUnion3_7.parseObjectParser.bind(hoisted_DiscriminatedUnion3_7),
    "b": hoisted_DiscriminatedUnion3_18.parseObjectParser.bind(hoisted_DiscriminatedUnion3_18),
    "c": hoisted_DiscriminatedUnion3_29.parseObjectParser.bind(hoisted_DiscriminatedUnion3_29)
});
const hoisted_DiscriminatedUnion3_79 = new AnyOfDiscriminatedReporter("type", {
    "a": hoisted_DiscriminatedUnion3_8.reportObjectReporter.bind(hoisted_DiscriminatedUnion3_8),
    "b": hoisted_DiscriminatedUnion3_19.reportObjectReporter.bind(hoisted_DiscriminatedUnion3_19),
    "c": hoisted_DiscriminatedUnion3_30.reportObjectReporter.bind(hoisted_DiscriminatedUnion3_30)
});
const hoisted_DiscriminatedUnion3_80 = new AnyOfDiscriminatedSchema([
    hoisted_DiscriminatedUnion3_42.schemaObjectSchema.bind(hoisted_DiscriminatedUnion3_42),
    hoisted_DiscriminatedUnion3_53.schemaObjectSchema.bind(hoisted_DiscriminatedUnion3_53)
]);
const hoisted_DiscriminatedUnion3_81 = new AnyOfDiscriminatedDescribe([
    hoisted_DiscriminatedUnion3_65.describeObjectDescribe.bind(hoisted_DiscriminatedUnion3_65),
    hoisted_DiscriminatedUnion3_76.describeObjectDescribe.bind(hoisted_DiscriminatedUnion3_76)
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
const hoisted_DiscriminatedUnion4_3 = {
    "a1": describeString,
    "subType": hoisted_DiscriminatedUnion4_0.describeConstDecoder.bind(hoisted_DiscriminatedUnion4_0)
};
const hoisted_DiscriminatedUnion4_4 = hoisted_DiscriminatedUnion4_3;
const hoisted_DiscriminatedUnion4_5 = null;
const hoisted_DiscriminatedUnion4_6 = new ObjectValidator(hoisted_DiscriminatedUnion4_1, hoisted_DiscriminatedUnion4_5);
const hoisted_DiscriminatedUnion4_7 = new ObjectParser({
    "a1": parseIdentity,
    "subType": hoisted_DiscriminatedUnion4_0.parseConstDecoder.bind(hoisted_DiscriminatedUnion4_0)
}, null);
const hoisted_DiscriminatedUnion4_8 = new ObjectReporter(hoisted_DiscriminatedUnion4_1, hoisted_DiscriminatedUnion4_5, {
    "a1": reportString,
    "subType": hoisted_DiscriminatedUnion4_0.reportConstDecoder.bind(hoisted_DiscriminatedUnion4_0)
}, null);
const hoisted_DiscriminatedUnion4_9 = new ObjectSchema(hoisted_DiscriminatedUnion4_2, null);
const hoisted_DiscriminatedUnion4_10 = new ObjectDescribe(hoisted_DiscriminatedUnion4_4, null);
const hoisted_DiscriminatedUnion4_11 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion4_12 = {
    "a": hoisted_DiscriminatedUnion4_6.validateObjectValidator.bind(hoisted_DiscriminatedUnion4_6),
    "type": hoisted_DiscriminatedUnion4_11.validateConstDecoder.bind(hoisted_DiscriminatedUnion4_11)
};
const hoisted_DiscriminatedUnion4_13 = {
    "a": hoisted_DiscriminatedUnion4_9.schemaObjectSchema.bind(hoisted_DiscriminatedUnion4_9),
    "type": hoisted_DiscriminatedUnion4_11.schemaConstDecoder.bind(hoisted_DiscriminatedUnion4_11)
};
const hoisted_DiscriminatedUnion4_14 = {
    "a": hoisted_DiscriminatedUnion4_10.describeObjectDescribe.bind(hoisted_DiscriminatedUnion4_10),
    "type": hoisted_DiscriminatedUnion4_11.describeConstDecoder.bind(hoisted_DiscriminatedUnion4_11)
};
const hoisted_DiscriminatedUnion4_15 = hoisted_DiscriminatedUnion4_14;
const hoisted_DiscriminatedUnion4_16 = null;
const hoisted_DiscriminatedUnion4_17 = new ObjectValidator(hoisted_DiscriminatedUnion4_12, hoisted_DiscriminatedUnion4_16);
const hoisted_DiscriminatedUnion4_18 = new ObjectParser({
    "a": hoisted_DiscriminatedUnion4_7.parseObjectParser.bind(hoisted_DiscriminatedUnion4_7),
    "type": hoisted_DiscriminatedUnion4_11.parseConstDecoder.bind(hoisted_DiscriminatedUnion4_11)
}, null);
const hoisted_DiscriminatedUnion4_19 = new ObjectReporter(hoisted_DiscriminatedUnion4_12, hoisted_DiscriminatedUnion4_16, {
    "a": hoisted_DiscriminatedUnion4_8.reportObjectReporter.bind(hoisted_DiscriminatedUnion4_8),
    "type": hoisted_DiscriminatedUnion4_11.reportConstDecoder.bind(hoisted_DiscriminatedUnion4_11)
}, null);
const hoisted_DiscriminatedUnion4_20 = new ObjectSchema(hoisted_DiscriminatedUnion4_13, null);
const hoisted_DiscriminatedUnion4_21 = new ObjectDescribe(hoisted_DiscriminatedUnion4_15, null);
const hoisted_DiscriminatedUnion4_22 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion4_23 = {
    "a2": validateString,
    "subType": hoisted_DiscriminatedUnion4_22.validateConstDecoder.bind(hoisted_DiscriminatedUnion4_22)
};
const hoisted_DiscriminatedUnion4_24 = {
    "a2": schemaString,
    "subType": hoisted_DiscriminatedUnion4_22.schemaConstDecoder.bind(hoisted_DiscriminatedUnion4_22)
};
const hoisted_DiscriminatedUnion4_25 = {
    "a2": describeString,
    "subType": hoisted_DiscriminatedUnion4_22.describeConstDecoder.bind(hoisted_DiscriminatedUnion4_22)
};
const hoisted_DiscriminatedUnion4_26 = hoisted_DiscriminatedUnion4_25;
const hoisted_DiscriminatedUnion4_27 = null;
const hoisted_DiscriminatedUnion4_28 = new ObjectValidator(hoisted_DiscriminatedUnion4_23, hoisted_DiscriminatedUnion4_27);
const hoisted_DiscriminatedUnion4_29 = new ObjectParser({
    "a2": parseIdentity,
    "subType": hoisted_DiscriminatedUnion4_22.parseConstDecoder.bind(hoisted_DiscriminatedUnion4_22)
}, null);
const hoisted_DiscriminatedUnion4_30 = new ObjectReporter(hoisted_DiscriminatedUnion4_23, hoisted_DiscriminatedUnion4_27, {
    "a2": reportString,
    "subType": hoisted_DiscriminatedUnion4_22.reportConstDecoder.bind(hoisted_DiscriminatedUnion4_22)
}, null);
const hoisted_DiscriminatedUnion4_31 = new ObjectSchema(hoisted_DiscriminatedUnion4_24, null);
const hoisted_DiscriminatedUnion4_32 = new ObjectDescribe(hoisted_DiscriminatedUnion4_26, null);
const hoisted_DiscriminatedUnion4_33 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion4_34 = {
    "a": hoisted_DiscriminatedUnion4_28.validateObjectValidator.bind(hoisted_DiscriminatedUnion4_28),
    "type": hoisted_DiscriminatedUnion4_33.validateConstDecoder.bind(hoisted_DiscriminatedUnion4_33)
};
const hoisted_DiscriminatedUnion4_35 = {
    "a": hoisted_DiscriminatedUnion4_31.schemaObjectSchema.bind(hoisted_DiscriminatedUnion4_31),
    "type": hoisted_DiscriminatedUnion4_33.schemaConstDecoder.bind(hoisted_DiscriminatedUnion4_33)
};
const hoisted_DiscriminatedUnion4_36 = {
    "a": hoisted_DiscriminatedUnion4_32.describeObjectDescribe.bind(hoisted_DiscriminatedUnion4_32),
    "type": hoisted_DiscriminatedUnion4_33.describeConstDecoder.bind(hoisted_DiscriminatedUnion4_33)
};
const hoisted_DiscriminatedUnion4_37 = hoisted_DiscriminatedUnion4_36;
const hoisted_DiscriminatedUnion4_38 = null;
const hoisted_DiscriminatedUnion4_39 = new ObjectValidator(hoisted_DiscriminatedUnion4_34, hoisted_DiscriminatedUnion4_38);
const hoisted_DiscriminatedUnion4_40 = new ObjectParser({
    "a": hoisted_DiscriminatedUnion4_29.parseObjectParser.bind(hoisted_DiscriminatedUnion4_29),
    "type": hoisted_DiscriminatedUnion4_33.parseConstDecoder.bind(hoisted_DiscriminatedUnion4_33)
}, null);
const hoisted_DiscriminatedUnion4_41 = new ObjectReporter(hoisted_DiscriminatedUnion4_34, hoisted_DiscriminatedUnion4_38, {
    "a": hoisted_DiscriminatedUnion4_30.reportObjectReporter.bind(hoisted_DiscriminatedUnion4_30),
    "type": hoisted_DiscriminatedUnion4_33.reportConstDecoder.bind(hoisted_DiscriminatedUnion4_33)
}, null);
const hoisted_DiscriminatedUnion4_42 = new ObjectSchema(hoisted_DiscriminatedUnion4_35, null);
const hoisted_DiscriminatedUnion4_43 = new ObjectDescribe(hoisted_DiscriminatedUnion4_37, null);
const hoisted_DiscriminatedUnion4_44 = [
    hoisted_DiscriminatedUnion4_17.validateObjectValidator.bind(hoisted_DiscriminatedUnion4_17),
    hoisted_DiscriminatedUnion4_39.validateObjectValidator.bind(hoisted_DiscriminatedUnion4_39)
];
const hoisted_DiscriminatedUnion4_45 = [
    hoisted_DiscriminatedUnion4_20.schemaObjectSchema.bind(hoisted_DiscriminatedUnion4_20),
    hoisted_DiscriminatedUnion4_42.schemaObjectSchema.bind(hoisted_DiscriminatedUnion4_42)
];
const hoisted_DiscriminatedUnion4_46 = [
    hoisted_DiscriminatedUnion4_21.describeObjectDescribe.bind(hoisted_DiscriminatedUnion4_21),
    hoisted_DiscriminatedUnion4_43.describeObjectDescribe.bind(hoisted_DiscriminatedUnion4_43)
];
const hoisted_DiscriminatedUnion4_47 = new AnyOfValidator(hoisted_DiscriminatedUnion4_44);
const hoisted_DiscriminatedUnion4_48 = new AnyOfParser(hoisted_DiscriminatedUnion4_44, [
    hoisted_DiscriminatedUnion4_18.parseObjectParser.bind(hoisted_DiscriminatedUnion4_18),
    hoisted_DiscriminatedUnion4_40.parseObjectParser.bind(hoisted_DiscriminatedUnion4_40)
]);
const hoisted_DiscriminatedUnion4_49 = new AnyOfReporter(hoisted_DiscriminatedUnion4_44, [
    hoisted_DiscriminatedUnion4_19.reportObjectReporter.bind(hoisted_DiscriminatedUnion4_19),
    hoisted_DiscriminatedUnion4_41.reportObjectReporter.bind(hoisted_DiscriminatedUnion4_41)
]);
const hoisted_DiscriminatedUnion4_50 = new AnyOfSchema(hoisted_DiscriminatedUnion4_45);
const hoisted_DiscriminatedUnion4_51 = new AnyOfDescribe(hoisted_DiscriminatedUnion4_46);
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
const hoisted_ValidCurrency_0 = new StringWithFormatsDecoder("ValidCurrency");
const hoisted_UnionWithEnumAccess_0 = new ConstDecoder("a");
const hoisted_UnionWithEnumAccess_1 = {
    "tag": hoisted_UnionWithEnumAccess_0.validateConstDecoder.bind(hoisted_UnionWithEnumAccess_0),
    "value": validateString
};
const hoisted_UnionWithEnumAccess_2 = {
    "tag": hoisted_UnionWithEnumAccess_0.schemaConstDecoder.bind(hoisted_UnionWithEnumAccess_0),
    "value": schemaString
};
const hoisted_UnionWithEnumAccess_3 = {
    "tag": hoisted_UnionWithEnumAccess_0.describeConstDecoder.bind(hoisted_UnionWithEnumAccess_0),
    "value": describeString
};
const hoisted_UnionWithEnumAccess_4 = hoisted_UnionWithEnumAccess_3;
const hoisted_UnionWithEnumAccess_5 = null;
const hoisted_UnionWithEnumAccess_6 = new ObjectValidator(hoisted_UnionWithEnumAccess_1, hoisted_UnionWithEnumAccess_5);
const hoisted_UnionWithEnumAccess_7 = new ObjectParser({
    "tag": hoisted_UnionWithEnumAccess_0.parseConstDecoder.bind(hoisted_UnionWithEnumAccess_0),
    "value": parseIdentity
}, null);
const hoisted_UnionWithEnumAccess_8 = new ObjectReporter(hoisted_UnionWithEnumAccess_1, hoisted_UnionWithEnumAccess_5, {
    "tag": hoisted_UnionWithEnumAccess_0.reportConstDecoder.bind(hoisted_UnionWithEnumAccess_0),
    "value": reportString
}, null);
const hoisted_UnionWithEnumAccess_9 = new ObjectSchema(hoisted_UnionWithEnumAccess_2, null);
const hoisted_UnionWithEnumAccess_10 = new ObjectDescribe(hoisted_UnionWithEnumAccess_4, null);
const hoisted_UnionWithEnumAccess_11 = new ConstDecoder("b");
const hoisted_UnionWithEnumAccess_12 = {
    "tag": hoisted_UnionWithEnumAccess_11.validateConstDecoder.bind(hoisted_UnionWithEnumAccess_11),
    "value": validateNumber
};
const hoisted_UnionWithEnumAccess_13 = {
    "tag": hoisted_UnionWithEnumAccess_11.schemaConstDecoder.bind(hoisted_UnionWithEnumAccess_11),
    "value": schemaNumber
};
const hoisted_UnionWithEnumAccess_14 = {
    "tag": hoisted_UnionWithEnumAccess_11.describeConstDecoder.bind(hoisted_UnionWithEnumAccess_11),
    "value": describeNumber
};
const hoisted_UnionWithEnumAccess_15 = hoisted_UnionWithEnumAccess_14;
const hoisted_UnionWithEnumAccess_16 = null;
const hoisted_UnionWithEnumAccess_17 = new ObjectValidator(hoisted_UnionWithEnumAccess_12, hoisted_UnionWithEnumAccess_16);
const hoisted_UnionWithEnumAccess_18 = new ObjectParser({
    "tag": hoisted_UnionWithEnumAccess_11.parseConstDecoder.bind(hoisted_UnionWithEnumAccess_11),
    "value": parseIdentity
}, null);
const hoisted_UnionWithEnumAccess_19 = new ObjectReporter(hoisted_UnionWithEnumAccess_12, hoisted_UnionWithEnumAccess_16, {
    "tag": hoisted_UnionWithEnumAccess_11.reportConstDecoder.bind(hoisted_UnionWithEnumAccess_11),
    "value": reportNumber
}, null);
const hoisted_UnionWithEnumAccess_20 = new ObjectSchema(hoisted_UnionWithEnumAccess_13, null);
const hoisted_UnionWithEnumAccess_21 = new ObjectDescribe(hoisted_UnionWithEnumAccess_15, null);
const hoisted_UnionWithEnumAccess_22 = new ConstDecoder("c");
const hoisted_UnionWithEnumAccess_23 = {
    "tag": hoisted_UnionWithEnumAccess_22.validateConstDecoder.bind(hoisted_UnionWithEnumAccess_22),
    "value": validateBoolean
};
const hoisted_UnionWithEnumAccess_24 = {
    "tag": hoisted_UnionWithEnumAccess_22.schemaConstDecoder.bind(hoisted_UnionWithEnumAccess_22),
    "value": schemaBoolean
};
const hoisted_UnionWithEnumAccess_25 = {
    "tag": hoisted_UnionWithEnumAccess_22.describeConstDecoder.bind(hoisted_UnionWithEnumAccess_22),
    "value": describeBoolean
};
const hoisted_UnionWithEnumAccess_26 = hoisted_UnionWithEnumAccess_25;
const hoisted_UnionWithEnumAccess_27 = null;
const hoisted_UnionWithEnumAccess_28 = new ObjectValidator(hoisted_UnionWithEnumAccess_23, hoisted_UnionWithEnumAccess_27);
const hoisted_UnionWithEnumAccess_29 = new ObjectParser({
    "tag": hoisted_UnionWithEnumAccess_22.parseConstDecoder.bind(hoisted_UnionWithEnumAccess_22),
    "value": parseIdentity
}, null);
const hoisted_UnionWithEnumAccess_30 = new ObjectReporter(hoisted_UnionWithEnumAccess_23, hoisted_UnionWithEnumAccess_27, {
    "tag": hoisted_UnionWithEnumAccess_22.reportConstDecoder.bind(hoisted_UnionWithEnumAccess_22),
    "value": reportBoolean
}, null);
const hoisted_UnionWithEnumAccess_31 = new ObjectSchema(hoisted_UnionWithEnumAccess_24, null);
const hoisted_UnionWithEnumAccess_32 = new ObjectDescribe(hoisted_UnionWithEnumAccess_26, null);
const hoisted_UnionWithEnumAccess_33 = new ConstDecoder("a");
const hoisted_UnionWithEnumAccess_34 = {
    "tag": hoisted_UnionWithEnumAccess_33.validateConstDecoder.bind(hoisted_UnionWithEnumAccess_33),
    "value": validateString
};
const hoisted_UnionWithEnumAccess_35 = {
    "tag": hoisted_UnionWithEnumAccess_33.schemaConstDecoder.bind(hoisted_UnionWithEnumAccess_33),
    "value": schemaString
};
const hoisted_UnionWithEnumAccess_36 = {
    "tag": hoisted_UnionWithEnumAccess_33.describeConstDecoder.bind(hoisted_UnionWithEnumAccess_33),
    "value": describeString
};
const hoisted_UnionWithEnumAccess_37 = hoisted_UnionWithEnumAccess_36;
const hoisted_UnionWithEnumAccess_38 = null;
const hoisted_UnionWithEnumAccess_39 = new ObjectValidator(hoisted_UnionWithEnumAccess_34, hoisted_UnionWithEnumAccess_38);
const hoisted_UnionWithEnumAccess_40 = new ObjectParser({
    "tag": hoisted_UnionWithEnumAccess_33.parseConstDecoder.bind(hoisted_UnionWithEnumAccess_33),
    "value": parseIdentity
}, null);
const hoisted_UnionWithEnumAccess_41 = new ObjectReporter(hoisted_UnionWithEnumAccess_34, hoisted_UnionWithEnumAccess_38, {
    "tag": hoisted_UnionWithEnumAccess_33.reportConstDecoder.bind(hoisted_UnionWithEnumAccess_33),
    "value": reportString
}, null);
const hoisted_UnionWithEnumAccess_42 = new ObjectSchema(hoisted_UnionWithEnumAccess_35, null);
const hoisted_UnionWithEnumAccess_43 = new ObjectDescribe(hoisted_UnionWithEnumAccess_37, null);
const hoisted_UnionWithEnumAccess_44 = new ConstDecoder("b");
const hoisted_UnionWithEnumAccess_45 = {
    "tag": hoisted_UnionWithEnumAccess_44.validateConstDecoder.bind(hoisted_UnionWithEnumAccess_44),
    "value": validateNumber
};
const hoisted_UnionWithEnumAccess_46 = {
    "tag": hoisted_UnionWithEnumAccess_44.schemaConstDecoder.bind(hoisted_UnionWithEnumAccess_44),
    "value": schemaNumber
};
const hoisted_UnionWithEnumAccess_47 = {
    "tag": hoisted_UnionWithEnumAccess_44.describeConstDecoder.bind(hoisted_UnionWithEnumAccess_44),
    "value": describeNumber
};
const hoisted_UnionWithEnumAccess_48 = hoisted_UnionWithEnumAccess_47;
const hoisted_UnionWithEnumAccess_49 = null;
const hoisted_UnionWithEnumAccess_50 = new ObjectValidator(hoisted_UnionWithEnumAccess_45, hoisted_UnionWithEnumAccess_49);
const hoisted_UnionWithEnumAccess_51 = new ObjectParser({
    "tag": hoisted_UnionWithEnumAccess_44.parseConstDecoder.bind(hoisted_UnionWithEnumAccess_44),
    "value": parseIdentity
}, null);
const hoisted_UnionWithEnumAccess_52 = new ObjectReporter(hoisted_UnionWithEnumAccess_45, hoisted_UnionWithEnumAccess_49, {
    "tag": hoisted_UnionWithEnumAccess_44.reportConstDecoder.bind(hoisted_UnionWithEnumAccess_44),
    "value": reportNumber
}, null);
const hoisted_UnionWithEnumAccess_53 = new ObjectSchema(hoisted_UnionWithEnumAccess_46, null);
const hoisted_UnionWithEnumAccess_54 = new ObjectDescribe(hoisted_UnionWithEnumAccess_48, null);
const hoisted_UnionWithEnumAccess_55 = new ConstDecoder("c");
const hoisted_UnionWithEnumAccess_56 = {
    "tag": hoisted_UnionWithEnumAccess_55.validateConstDecoder.bind(hoisted_UnionWithEnumAccess_55),
    "value": validateBoolean
};
const hoisted_UnionWithEnumAccess_57 = {
    "tag": hoisted_UnionWithEnumAccess_55.schemaConstDecoder.bind(hoisted_UnionWithEnumAccess_55),
    "value": schemaBoolean
};
const hoisted_UnionWithEnumAccess_58 = {
    "tag": hoisted_UnionWithEnumAccess_55.describeConstDecoder.bind(hoisted_UnionWithEnumAccess_55),
    "value": describeBoolean
};
const hoisted_UnionWithEnumAccess_59 = hoisted_UnionWithEnumAccess_58;
const hoisted_UnionWithEnumAccess_60 = null;
const hoisted_UnionWithEnumAccess_61 = new ObjectValidator(hoisted_UnionWithEnumAccess_56, hoisted_UnionWithEnumAccess_60);
const hoisted_UnionWithEnumAccess_62 = new ObjectParser({
    "tag": hoisted_UnionWithEnumAccess_55.parseConstDecoder.bind(hoisted_UnionWithEnumAccess_55),
    "value": parseIdentity
}, null);
const hoisted_UnionWithEnumAccess_63 = new ObjectReporter(hoisted_UnionWithEnumAccess_56, hoisted_UnionWithEnumAccess_60, {
    "tag": hoisted_UnionWithEnumAccess_55.reportConstDecoder.bind(hoisted_UnionWithEnumAccess_55),
    "value": reportBoolean
}, null);
const hoisted_UnionWithEnumAccess_64 = new ObjectSchema(hoisted_UnionWithEnumAccess_57, null);
const hoisted_UnionWithEnumAccess_65 = new ObjectDescribe(hoisted_UnionWithEnumAccess_59, null);
const hoisted_UnionWithEnumAccess_66 = new ConstDecoder("a");
const hoisted_UnionWithEnumAccess_67 = {
    "tag": hoisted_UnionWithEnumAccess_66.validateConstDecoder.bind(hoisted_UnionWithEnumAccess_66),
    "value": validateString
};
const hoisted_UnionWithEnumAccess_68 = {
    "tag": hoisted_UnionWithEnumAccess_66.schemaConstDecoder.bind(hoisted_UnionWithEnumAccess_66),
    "value": schemaString
};
const hoisted_UnionWithEnumAccess_69 = {
    "tag": hoisted_UnionWithEnumAccess_66.describeConstDecoder.bind(hoisted_UnionWithEnumAccess_66),
    "value": describeString
};
const hoisted_UnionWithEnumAccess_70 = hoisted_UnionWithEnumAccess_69;
const hoisted_UnionWithEnumAccess_71 = null;
const hoisted_UnionWithEnumAccess_72 = new ObjectValidator(hoisted_UnionWithEnumAccess_67, hoisted_UnionWithEnumAccess_71);
const hoisted_UnionWithEnumAccess_73 = new ObjectParser({
    "tag": hoisted_UnionWithEnumAccess_66.parseConstDecoder.bind(hoisted_UnionWithEnumAccess_66),
    "value": parseIdentity
}, null);
const hoisted_UnionWithEnumAccess_74 = new ObjectReporter(hoisted_UnionWithEnumAccess_67, hoisted_UnionWithEnumAccess_71, {
    "tag": hoisted_UnionWithEnumAccess_66.reportConstDecoder.bind(hoisted_UnionWithEnumAccess_66),
    "value": reportString
}, null);
const hoisted_UnionWithEnumAccess_75 = new ObjectSchema(hoisted_UnionWithEnumAccess_68, null);
const hoisted_UnionWithEnumAccess_76 = new ObjectDescribe(hoisted_UnionWithEnumAccess_70, null);
const hoisted_UnionWithEnumAccess_77 = new ConstDecoder("b");
const hoisted_UnionWithEnumAccess_78 = {
    "tag": hoisted_UnionWithEnumAccess_77.validateConstDecoder.bind(hoisted_UnionWithEnumAccess_77),
    "value": validateNumber
};
const hoisted_UnionWithEnumAccess_79 = {
    "tag": hoisted_UnionWithEnumAccess_77.schemaConstDecoder.bind(hoisted_UnionWithEnumAccess_77),
    "value": schemaNumber
};
const hoisted_UnionWithEnumAccess_80 = {
    "tag": hoisted_UnionWithEnumAccess_77.describeConstDecoder.bind(hoisted_UnionWithEnumAccess_77),
    "value": describeNumber
};
const hoisted_UnionWithEnumAccess_81 = hoisted_UnionWithEnumAccess_80;
const hoisted_UnionWithEnumAccess_82 = null;
const hoisted_UnionWithEnumAccess_83 = new ObjectValidator(hoisted_UnionWithEnumAccess_78, hoisted_UnionWithEnumAccess_82);
const hoisted_UnionWithEnumAccess_84 = new ObjectParser({
    "tag": hoisted_UnionWithEnumAccess_77.parseConstDecoder.bind(hoisted_UnionWithEnumAccess_77),
    "value": parseIdentity
}, null);
const hoisted_UnionWithEnumAccess_85 = new ObjectReporter(hoisted_UnionWithEnumAccess_78, hoisted_UnionWithEnumAccess_82, {
    "tag": hoisted_UnionWithEnumAccess_77.reportConstDecoder.bind(hoisted_UnionWithEnumAccess_77),
    "value": reportNumber
}, null);
const hoisted_UnionWithEnumAccess_86 = new ObjectSchema(hoisted_UnionWithEnumAccess_79, null);
const hoisted_UnionWithEnumAccess_87 = new ObjectDescribe(hoisted_UnionWithEnumAccess_81, null);
const hoisted_UnionWithEnumAccess_88 = new ConstDecoder("c");
const hoisted_UnionWithEnumAccess_89 = {
    "tag": hoisted_UnionWithEnumAccess_88.validateConstDecoder.bind(hoisted_UnionWithEnumAccess_88),
    "value": validateBoolean
};
const hoisted_UnionWithEnumAccess_90 = {
    "tag": hoisted_UnionWithEnumAccess_88.schemaConstDecoder.bind(hoisted_UnionWithEnumAccess_88),
    "value": schemaBoolean
};
const hoisted_UnionWithEnumAccess_91 = {
    "tag": hoisted_UnionWithEnumAccess_88.describeConstDecoder.bind(hoisted_UnionWithEnumAccess_88),
    "value": describeBoolean
};
const hoisted_UnionWithEnumAccess_92 = hoisted_UnionWithEnumAccess_91;
const hoisted_UnionWithEnumAccess_93 = null;
const hoisted_UnionWithEnumAccess_94 = new ObjectValidator(hoisted_UnionWithEnumAccess_89, hoisted_UnionWithEnumAccess_93);
const hoisted_UnionWithEnumAccess_95 = new ObjectParser({
    "tag": hoisted_UnionWithEnumAccess_88.parseConstDecoder.bind(hoisted_UnionWithEnumAccess_88),
    "value": parseIdentity
}, null);
const hoisted_UnionWithEnumAccess_96 = new ObjectReporter(hoisted_UnionWithEnumAccess_89, hoisted_UnionWithEnumAccess_93, {
    "tag": hoisted_UnionWithEnumAccess_88.reportConstDecoder.bind(hoisted_UnionWithEnumAccess_88),
    "value": reportBoolean
}, null);
const hoisted_UnionWithEnumAccess_97 = new ObjectSchema(hoisted_UnionWithEnumAccess_90, null);
const hoisted_UnionWithEnumAccess_98 = new ObjectDescribe(hoisted_UnionWithEnumAccess_92, null);
const hoisted_UnionWithEnumAccess_99 = new AnyOfDiscriminatedValidator("tag", {
    "a": hoisted_UnionWithEnumAccess_6.validateObjectValidator.bind(hoisted_UnionWithEnumAccess_6),
    "b": hoisted_UnionWithEnumAccess_17.validateObjectValidator.bind(hoisted_UnionWithEnumAccess_17),
    "c": hoisted_UnionWithEnumAccess_28.validateObjectValidator.bind(hoisted_UnionWithEnumAccess_28)
});
const hoisted_UnionWithEnumAccess_100 = new AnyOfDiscriminatedParser("tag", {
    "a": hoisted_UnionWithEnumAccess_7.parseObjectParser.bind(hoisted_UnionWithEnumAccess_7),
    "b": hoisted_UnionWithEnumAccess_18.parseObjectParser.bind(hoisted_UnionWithEnumAccess_18),
    "c": hoisted_UnionWithEnumAccess_29.parseObjectParser.bind(hoisted_UnionWithEnumAccess_29)
});
const hoisted_UnionWithEnumAccess_101 = new AnyOfDiscriminatedReporter("tag", {
    "a": hoisted_UnionWithEnumAccess_8.reportObjectReporter.bind(hoisted_UnionWithEnumAccess_8),
    "b": hoisted_UnionWithEnumAccess_19.reportObjectReporter.bind(hoisted_UnionWithEnumAccess_19),
    "c": hoisted_UnionWithEnumAccess_30.reportObjectReporter.bind(hoisted_UnionWithEnumAccess_30)
});
const hoisted_UnionWithEnumAccess_102 = new AnyOfDiscriminatedSchema([
    hoisted_UnionWithEnumAccess_42.schemaObjectSchema.bind(hoisted_UnionWithEnumAccess_42),
    hoisted_UnionWithEnumAccess_53.schemaObjectSchema.bind(hoisted_UnionWithEnumAccess_53),
    hoisted_UnionWithEnumAccess_64.schemaObjectSchema.bind(hoisted_UnionWithEnumAccess_64)
]);
const hoisted_UnionWithEnumAccess_103 = new AnyOfDiscriminatedDescribe([
    hoisted_UnionWithEnumAccess_76.describeObjectDescribe.bind(hoisted_UnionWithEnumAccess_76),
    hoisted_UnionWithEnumAccess_87.describeObjectDescribe.bind(hoisted_UnionWithEnumAccess_87),
    hoisted_UnionWithEnumAccess_98.describeObjectDescribe.bind(hoisted_UnionWithEnumAccess_98)
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
const hoisted_Shape_3 = {
    "kind": hoisted_Shape_0.describeConstDecoder.bind(hoisted_Shape_0),
    "radius": describeNumber
};
const hoisted_Shape_4 = hoisted_Shape_3;
const hoisted_Shape_5 = null;
const hoisted_Shape_6 = new ObjectValidator(hoisted_Shape_1, hoisted_Shape_5);
const hoisted_Shape_7 = new ObjectParser({
    "kind": hoisted_Shape_0.parseConstDecoder.bind(hoisted_Shape_0),
    "radius": parseIdentity
}, null);
const hoisted_Shape_8 = new ObjectReporter(hoisted_Shape_1, hoisted_Shape_5, {
    "kind": hoisted_Shape_0.reportConstDecoder.bind(hoisted_Shape_0),
    "radius": reportNumber
}, null);
const hoisted_Shape_9 = new ObjectSchema(hoisted_Shape_2, null);
const hoisted_Shape_10 = new ObjectDescribe(hoisted_Shape_4, null);
const hoisted_Shape_11 = new ConstDecoder("square");
const hoisted_Shape_12 = {
    "kind": hoisted_Shape_11.validateConstDecoder.bind(hoisted_Shape_11),
    "x": validateNumber
};
const hoisted_Shape_13 = {
    "kind": hoisted_Shape_11.schemaConstDecoder.bind(hoisted_Shape_11),
    "x": schemaNumber
};
const hoisted_Shape_14 = {
    "kind": hoisted_Shape_11.describeConstDecoder.bind(hoisted_Shape_11),
    "x": describeNumber
};
const hoisted_Shape_15 = hoisted_Shape_14;
const hoisted_Shape_16 = null;
const hoisted_Shape_17 = new ObjectValidator(hoisted_Shape_12, hoisted_Shape_16);
const hoisted_Shape_18 = new ObjectParser({
    "kind": hoisted_Shape_11.parseConstDecoder.bind(hoisted_Shape_11),
    "x": parseIdentity
}, null);
const hoisted_Shape_19 = new ObjectReporter(hoisted_Shape_12, hoisted_Shape_16, {
    "kind": hoisted_Shape_11.reportConstDecoder.bind(hoisted_Shape_11),
    "x": reportNumber
}, null);
const hoisted_Shape_20 = new ObjectSchema(hoisted_Shape_13, null);
const hoisted_Shape_21 = new ObjectDescribe(hoisted_Shape_15, null);
const hoisted_Shape_22 = new ConstDecoder("triangle");
const hoisted_Shape_23 = {
    "kind": hoisted_Shape_22.validateConstDecoder.bind(hoisted_Shape_22),
    "x": validateNumber,
    "y": validateNumber
};
const hoisted_Shape_24 = {
    "kind": hoisted_Shape_22.schemaConstDecoder.bind(hoisted_Shape_22),
    "x": schemaNumber,
    "y": schemaNumber
};
const hoisted_Shape_25 = {
    "kind": hoisted_Shape_22.describeConstDecoder.bind(hoisted_Shape_22),
    "x": describeNumber,
    "y": describeNumber
};
const hoisted_Shape_26 = hoisted_Shape_25;
const hoisted_Shape_27 = null;
const hoisted_Shape_28 = new ObjectValidator(hoisted_Shape_23, hoisted_Shape_27);
const hoisted_Shape_29 = new ObjectParser({
    "kind": hoisted_Shape_22.parseConstDecoder.bind(hoisted_Shape_22),
    "x": parseIdentity,
    "y": parseIdentity
}, null);
const hoisted_Shape_30 = new ObjectReporter(hoisted_Shape_23, hoisted_Shape_27, {
    "kind": hoisted_Shape_22.reportConstDecoder.bind(hoisted_Shape_22),
    "x": reportNumber,
    "y": reportNumber
}, null);
const hoisted_Shape_31 = new ObjectSchema(hoisted_Shape_24, null);
const hoisted_Shape_32 = new ObjectDescribe(hoisted_Shape_26, null);
const hoisted_Shape_33 = new ConstDecoder("circle");
const hoisted_Shape_34 = {
    "kind": hoisted_Shape_33.validateConstDecoder.bind(hoisted_Shape_33),
    "radius": validateNumber
};
const hoisted_Shape_35 = {
    "kind": hoisted_Shape_33.schemaConstDecoder.bind(hoisted_Shape_33),
    "radius": schemaNumber
};
const hoisted_Shape_36 = {
    "kind": hoisted_Shape_33.describeConstDecoder.bind(hoisted_Shape_33),
    "radius": describeNumber
};
const hoisted_Shape_37 = hoisted_Shape_36;
const hoisted_Shape_38 = null;
const hoisted_Shape_39 = new ObjectValidator(hoisted_Shape_34, hoisted_Shape_38);
const hoisted_Shape_40 = new ObjectParser({
    "kind": hoisted_Shape_33.parseConstDecoder.bind(hoisted_Shape_33),
    "radius": parseIdentity
}, null);
const hoisted_Shape_41 = new ObjectReporter(hoisted_Shape_34, hoisted_Shape_38, {
    "kind": hoisted_Shape_33.reportConstDecoder.bind(hoisted_Shape_33),
    "radius": reportNumber
}, null);
const hoisted_Shape_42 = new ObjectSchema(hoisted_Shape_35, null);
const hoisted_Shape_43 = new ObjectDescribe(hoisted_Shape_37, null);
const hoisted_Shape_44 = new ConstDecoder("square");
const hoisted_Shape_45 = {
    "kind": hoisted_Shape_44.validateConstDecoder.bind(hoisted_Shape_44),
    "x": validateNumber
};
const hoisted_Shape_46 = {
    "kind": hoisted_Shape_44.schemaConstDecoder.bind(hoisted_Shape_44),
    "x": schemaNumber
};
const hoisted_Shape_47 = {
    "kind": hoisted_Shape_44.describeConstDecoder.bind(hoisted_Shape_44),
    "x": describeNumber
};
const hoisted_Shape_48 = hoisted_Shape_47;
const hoisted_Shape_49 = null;
const hoisted_Shape_50 = new ObjectValidator(hoisted_Shape_45, hoisted_Shape_49);
const hoisted_Shape_51 = new ObjectParser({
    "kind": hoisted_Shape_44.parseConstDecoder.bind(hoisted_Shape_44),
    "x": parseIdentity
}, null);
const hoisted_Shape_52 = new ObjectReporter(hoisted_Shape_45, hoisted_Shape_49, {
    "kind": hoisted_Shape_44.reportConstDecoder.bind(hoisted_Shape_44),
    "x": reportNumber
}, null);
const hoisted_Shape_53 = new ObjectSchema(hoisted_Shape_46, null);
const hoisted_Shape_54 = new ObjectDescribe(hoisted_Shape_48, null);
const hoisted_Shape_55 = new ConstDecoder("triangle");
const hoisted_Shape_56 = {
    "kind": hoisted_Shape_55.validateConstDecoder.bind(hoisted_Shape_55),
    "x": validateNumber,
    "y": validateNumber
};
const hoisted_Shape_57 = {
    "kind": hoisted_Shape_55.schemaConstDecoder.bind(hoisted_Shape_55),
    "x": schemaNumber,
    "y": schemaNumber
};
const hoisted_Shape_58 = {
    "kind": hoisted_Shape_55.describeConstDecoder.bind(hoisted_Shape_55),
    "x": describeNumber,
    "y": describeNumber
};
const hoisted_Shape_59 = hoisted_Shape_58;
const hoisted_Shape_60 = null;
const hoisted_Shape_61 = new ObjectValidator(hoisted_Shape_56, hoisted_Shape_60);
const hoisted_Shape_62 = new ObjectParser({
    "kind": hoisted_Shape_55.parseConstDecoder.bind(hoisted_Shape_55),
    "x": parseIdentity,
    "y": parseIdentity
}, null);
const hoisted_Shape_63 = new ObjectReporter(hoisted_Shape_56, hoisted_Shape_60, {
    "kind": hoisted_Shape_55.reportConstDecoder.bind(hoisted_Shape_55),
    "x": reportNumber,
    "y": reportNumber
}, null);
const hoisted_Shape_64 = new ObjectSchema(hoisted_Shape_57, null);
const hoisted_Shape_65 = new ObjectDescribe(hoisted_Shape_59, null);
const hoisted_Shape_66 = new ConstDecoder("circle");
const hoisted_Shape_67 = {
    "kind": hoisted_Shape_66.validateConstDecoder.bind(hoisted_Shape_66),
    "radius": validateNumber
};
const hoisted_Shape_68 = {
    "kind": hoisted_Shape_66.schemaConstDecoder.bind(hoisted_Shape_66),
    "radius": schemaNumber
};
const hoisted_Shape_69 = {
    "kind": hoisted_Shape_66.describeConstDecoder.bind(hoisted_Shape_66),
    "radius": describeNumber
};
const hoisted_Shape_70 = hoisted_Shape_69;
const hoisted_Shape_71 = null;
const hoisted_Shape_72 = new ObjectValidator(hoisted_Shape_67, hoisted_Shape_71);
const hoisted_Shape_73 = new ObjectParser({
    "kind": hoisted_Shape_66.parseConstDecoder.bind(hoisted_Shape_66),
    "radius": parseIdentity
}, null);
const hoisted_Shape_74 = new ObjectReporter(hoisted_Shape_67, hoisted_Shape_71, {
    "kind": hoisted_Shape_66.reportConstDecoder.bind(hoisted_Shape_66),
    "radius": reportNumber
}, null);
const hoisted_Shape_75 = new ObjectSchema(hoisted_Shape_68, null);
const hoisted_Shape_76 = new ObjectDescribe(hoisted_Shape_70, null);
const hoisted_Shape_77 = new ConstDecoder("square");
const hoisted_Shape_78 = {
    "kind": hoisted_Shape_77.validateConstDecoder.bind(hoisted_Shape_77),
    "x": validateNumber
};
const hoisted_Shape_79 = {
    "kind": hoisted_Shape_77.schemaConstDecoder.bind(hoisted_Shape_77),
    "x": schemaNumber
};
const hoisted_Shape_80 = {
    "kind": hoisted_Shape_77.describeConstDecoder.bind(hoisted_Shape_77),
    "x": describeNumber
};
const hoisted_Shape_81 = hoisted_Shape_80;
const hoisted_Shape_82 = null;
const hoisted_Shape_83 = new ObjectValidator(hoisted_Shape_78, hoisted_Shape_82);
const hoisted_Shape_84 = new ObjectParser({
    "kind": hoisted_Shape_77.parseConstDecoder.bind(hoisted_Shape_77),
    "x": parseIdentity
}, null);
const hoisted_Shape_85 = new ObjectReporter(hoisted_Shape_78, hoisted_Shape_82, {
    "kind": hoisted_Shape_77.reportConstDecoder.bind(hoisted_Shape_77),
    "x": reportNumber
}, null);
const hoisted_Shape_86 = new ObjectSchema(hoisted_Shape_79, null);
const hoisted_Shape_87 = new ObjectDescribe(hoisted_Shape_81, null);
const hoisted_Shape_88 = new ConstDecoder("triangle");
const hoisted_Shape_89 = {
    "kind": hoisted_Shape_88.validateConstDecoder.bind(hoisted_Shape_88),
    "x": validateNumber,
    "y": validateNumber
};
const hoisted_Shape_90 = {
    "kind": hoisted_Shape_88.schemaConstDecoder.bind(hoisted_Shape_88),
    "x": schemaNumber,
    "y": schemaNumber
};
const hoisted_Shape_91 = {
    "kind": hoisted_Shape_88.describeConstDecoder.bind(hoisted_Shape_88),
    "x": describeNumber,
    "y": describeNumber
};
const hoisted_Shape_92 = hoisted_Shape_91;
const hoisted_Shape_93 = null;
const hoisted_Shape_94 = new ObjectValidator(hoisted_Shape_89, hoisted_Shape_93);
const hoisted_Shape_95 = new ObjectParser({
    "kind": hoisted_Shape_88.parseConstDecoder.bind(hoisted_Shape_88),
    "x": parseIdentity,
    "y": parseIdentity
}, null);
const hoisted_Shape_96 = new ObjectReporter(hoisted_Shape_89, hoisted_Shape_93, {
    "kind": hoisted_Shape_88.reportConstDecoder.bind(hoisted_Shape_88),
    "x": reportNumber,
    "y": reportNumber
}, null);
const hoisted_Shape_97 = new ObjectSchema(hoisted_Shape_90, null);
const hoisted_Shape_98 = new ObjectDescribe(hoisted_Shape_92, null);
const hoisted_Shape_99 = new AnyOfDiscriminatedValidator("kind", {
    "circle": hoisted_Shape_6.validateObjectValidator.bind(hoisted_Shape_6),
    "square": hoisted_Shape_17.validateObjectValidator.bind(hoisted_Shape_17),
    "triangle": hoisted_Shape_28.validateObjectValidator.bind(hoisted_Shape_28)
});
const hoisted_Shape_100 = new AnyOfDiscriminatedParser("kind", {
    "circle": hoisted_Shape_7.parseObjectParser.bind(hoisted_Shape_7),
    "square": hoisted_Shape_18.parseObjectParser.bind(hoisted_Shape_18),
    "triangle": hoisted_Shape_29.parseObjectParser.bind(hoisted_Shape_29)
});
const hoisted_Shape_101 = new AnyOfDiscriminatedReporter("kind", {
    "circle": hoisted_Shape_8.reportObjectReporter.bind(hoisted_Shape_8),
    "square": hoisted_Shape_19.reportObjectReporter.bind(hoisted_Shape_19),
    "triangle": hoisted_Shape_30.reportObjectReporter.bind(hoisted_Shape_30)
});
const hoisted_Shape_102 = new AnyOfDiscriminatedSchema([
    hoisted_Shape_42.schemaObjectSchema.bind(hoisted_Shape_42),
    hoisted_Shape_53.schemaObjectSchema.bind(hoisted_Shape_53),
    hoisted_Shape_64.schemaObjectSchema.bind(hoisted_Shape_64)
]);
const hoisted_Shape_103 = new AnyOfDiscriminatedDescribe([
    hoisted_Shape_76.describeObjectDescribe.bind(hoisted_Shape_76),
    hoisted_Shape_87.describeObjectDescribe.bind(hoisted_Shape_87),
    hoisted_Shape_98.describeObjectDescribe.bind(hoisted_Shape_98)
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
const hoisted_T3_3 = {
    "kind": hoisted_T3_0.describeConstDecoder.bind(hoisted_T3_0),
    "x": describeNumber
};
const hoisted_T3_4 = hoisted_T3_3;
const hoisted_T3_5 = null;
const hoisted_T3_6 = new ObjectValidator(hoisted_T3_1, hoisted_T3_5);
const hoisted_T3_7 = new ObjectParser({
    "kind": hoisted_T3_0.parseConstDecoder.bind(hoisted_T3_0),
    "x": parseIdentity
}, null);
const hoisted_T3_8 = new ObjectReporter(hoisted_T3_1, hoisted_T3_5, {
    "kind": hoisted_T3_0.reportConstDecoder.bind(hoisted_T3_0),
    "x": reportNumber
}, null);
const hoisted_T3_9 = new ObjectSchema(hoisted_T3_2, null);
const hoisted_T3_10 = new ObjectDescribe(hoisted_T3_4, null);
const hoisted_T3_11 = new ConstDecoder("triangle");
const hoisted_T3_12 = {
    "kind": hoisted_T3_11.validateConstDecoder.bind(hoisted_T3_11),
    "x": validateNumber,
    "y": validateNumber
};
const hoisted_T3_13 = {
    "kind": hoisted_T3_11.schemaConstDecoder.bind(hoisted_T3_11),
    "x": schemaNumber,
    "y": schemaNumber
};
const hoisted_T3_14 = {
    "kind": hoisted_T3_11.describeConstDecoder.bind(hoisted_T3_11),
    "x": describeNumber,
    "y": describeNumber
};
const hoisted_T3_15 = hoisted_T3_14;
const hoisted_T3_16 = null;
const hoisted_T3_17 = new ObjectValidator(hoisted_T3_12, hoisted_T3_16);
const hoisted_T3_18 = new ObjectParser({
    "kind": hoisted_T3_11.parseConstDecoder.bind(hoisted_T3_11),
    "x": parseIdentity,
    "y": parseIdentity
}, null);
const hoisted_T3_19 = new ObjectReporter(hoisted_T3_12, hoisted_T3_16, {
    "kind": hoisted_T3_11.reportConstDecoder.bind(hoisted_T3_11),
    "x": reportNumber,
    "y": reportNumber
}, null);
const hoisted_T3_20 = new ObjectSchema(hoisted_T3_13, null);
const hoisted_T3_21 = new ObjectDescribe(hoisted_T3_15, null);
const hoisted_T3_22 = new ConstDecoder("square");
const hoisted_T3_23 = {
    "kind": hoisted_T3_22.validateConstDecoder.bind(hoisted_T3_22),
    "x": validateNumber
};
const hoisted_T3_24 = {
    "kind": hoisted_T3_22.schemaConstDecoder.bind(hoisted_T3_22),
    "x": schemaNumber
};
const hoisted_T3_25 = {
    "kind": hoisted_T3_22.describeConstDecoder.bind(hoisted_T3_22),
    "x": describeNumber
};
const hoisted_T3_26 = hoisted_T3_25;
const hoisted_T3_27 = null;
const hoisted_T3_28 = new ObjectValidator(hoisted_T3_23, hoisted_T3_27);
const hoisted_T3_29 = new ObjectParser({
    "kind": hoisted_T3_22.parseConstDecoder.bind(hoisted_T3_22),
    "x": parseIdentity
}, null);
const hoisted_T3_30 = new ObjectReporter(hoisted_T3_23, hoisted_T3_27, {
    "kind": hoisted_T3_22.reportConstDecoder.bind(hoisted_T3_22),
    "x": reportNumber
}, null);
const hoisted_T3_31 = new ObjectSchema(hoisted_T3_24, null);
const hoisted_T3_32 = new ObjectDescribe(hoisted_T3_26, null);
const hoisted_T3_33 = new ConstDecoder("triangle");
const hoisted_T3_34 = {
    "kind": hoisted_T3_33.validateConstDecoder.bind(hoisted_T3_33),
    "x": validateNumber,
    "y": validateNumber
};
const hoisted_T3_35 = {
    "kind": hoisted_T3_33.schemaConstDecoder.bind(hoisted_T3_33),
    "x": schemaNumber,
    "y": schemaNumber
};
const hoisted_T3_36 = {
    "kind": hoisted_T3_33.describeConstDecoder.bind(hoisted_T3_33),
    "x": describeNumber,
    "y": describeNumber
};
const hoisted_T3_37 = hoisted_T3_36;
const hoisted_T3_38 = null;
const hoisted_T3_39 = new ObjectValidator(hoisted_T3_34, hoisted_T3_38);
const hoisted_T3_40 = new ObjectParser({
    "kind": hoisted_T3_33.parseConstDecoder.bind(hoisted_T3_33),
    "x": parseIdentity,
    "y": parseIdentity
}, null);
const hoisted_T3_41 = new ObjectReporter(hoisted_T3_34, hoisted_T3_38, {
    "kind": hoisted_T3_33.reportConstDecoder.bind(hoisted_T3_33),
    "x": reportNumber,
    "y": reportNumber
}, null);
const hoisted_T3_42 = new ObjectSchema(hoisted_T3_35, null);
const hoisted_T3_43 = new ObjectDescribe(hoisted_T3_37, null);
const hoisted_T3_44 = new ConstDecoder("square");
const hoisted_T3_45 = {
    "kind": hoisted_T3_44.validateConstDecoder.bind(hoisted_T3_44),
    "x": validateNumber
};
const hoisted_T3_46 = {
    "kind": hoisted_T3_44.schemaConstDecoder.bind(hoisted_T3_44),
    "x": schemaNumber
};
const hoisted_T3_47 = {
    "kind": hoisted_T3_44.describeConstDecoder.bind(hoisted_T3_44),
    "x": describeNumber
};
const hoisted_T3_48 = hoisted_T3_47;
const hoisted_T3_49 = null;
const hoisted_T3_50 = new ObjectValidator(hoisted_T3_45, hoisted_T3_49);
const hoisted_T3_51 = new ObjectParser({
    "kind": hoisted_T3_44.parseConstDecoder.bind(hoisted_T3_44),
    "x": parseIdentity
}, null);
const hoisted_T3_52 = new ObjectReporter(hoisted_T3_45, hoisted_T3_49, {
    "kind": hoisted_T3_44.reportConstDecoder.bind(hoisted_T3_44),
    "x": reportNumber
}, null);
const hoisted_T3_53 = new ObjectSchema(hoisted_T3_46, null);
const hoisted_T3_54 = new ObjectDescribe(hoisted_T3_48, null);
const hoisted_T3_55 = new ConstDecoder("triangle");
const hoisted_T3_56 = {
    "kind": hoisted_T3_55.validateConstDecoder.bind(hoisted_T3_55),
    "x": validateNumber,
    "y": validateNumber
};
const hoisted_T3_57 = {
    "kind": hoisted_T3_55.schemaConstDecoder.bind(hoisted_T3_55),
    "x": schemaNumber,
    "y": schemaNumber
};
const hoisted_T3_58 = {
    "kind": hoisted_T3_55.describeConstDecoder.bind(hoisted_T3_55),
    "x": describeNumber,
    "y": describeNumber
};
const hoisted_T3_59 = hoisted_T3_58;
const hoisted_T3_60 = null;
const hoisted_T3_61 = new ObjectValidator(hoisted_T3_56, hoisted_T3_60);
const hoisted_T3_62 = new ObjectParser({
    "kind": hoisted_T3_55.parseConstDecoder.bind(hoisted_T3_55),
    "x": parseIdentity,
    "y": parseIdentity
}, null);
const hoisted_T3_63 = new ObjectReporter(hoisted_T3_56, hoisted_T3_60, {
    "kind": hoisted_T3_55.reportConstDecoder.bind(hoisted_T3_55),
    "x": reportNumber,
    "y": reportNumber
}, null);
const hoisted_T3_64 = new ObjectSchema(hoisted_T3_57, null);
const hoisted_T3_65 = new ObjectDescribe(hoisted_T3_59, null);
const hoisted_T3_66 = new AnyOfDiscriminatedValidator("kind", {
    "square": hoisted_T3_6.validateObjectValidator.bind(hoisted_T3_6),
    "triangle": hoisted_T3_17.validateObjectValidator.bind(hoisted_T3_17)
});
const hoisted_T3_67 = new AnyOfDiscriminatedParser("kind", {
    "square": hoisted_T3_7.parseObjectParser.bind(hoisted_T3_7),
    "triangle": hoisted_T3_18.parseObjectParser.bind(hoisted_T3_18)
});
const hoisted_T3_68 = new AnyOfDiscriminatedReporter("kind", {
    "square": hoisted_T3_8.reportObjectReporter.bind(hoisted_T3_8),
    "triangle": hoisted_T3_19.reportObjectReporter.bind(hoisted_T3_19)
});
const hoisted_T3_69 = new AnyOfDiscriminatedSchema([
    hoisted_T3_31.schemaObjectSchema.bind(hoisted_T3_31),
    hoisted_T3_42.schemaObjectSchema.bind(hoisted_T3_42)
]);
const hoisted_T3_70 = new AnyOfDiscriminatedDescribe([
    hoisted_T3_54.describeObjectDescribe.bind(hoisted_T3_54),
    hoisted_T3_65.describeObjectDescribe.bind(hoisted_T3_65)
]);
const hoisted_BObject_0 = new ConstDecoder("b");
const hoisted_BObject_1 = {
    "tag": hoisted_BObject_0.validateConstDecoder.bind(hoisted_BObject_0)
};
const hoisted_BObject_2 = {
    "tag": hoisted_BObject_0.schemaConstDecoder.bind(hoisted_BObject_0)
};
const hoisted_BObject_3 = {
    "tag": hoisted_BObject_0.describeConstDecoder.bind(hoisted_BObject_0)
};
const hoisted_BObject_4 = hoisted_BObject_3;
const hoisted_BObject_5 = null;
const hoisted_BObject_6 = new ObjectValidator(hoisted_BObject_1, hoisted_BObject_5);
const hoisted_BObject_7 = new ObjectParser({
    "tag": hoisted_BObject_0.parseConstDecoder.bind(hoisted_BObject_0)
}, null);
const hoisted_BObject_8 = new ObjectReporter(hoisted_BObject_1, hoisted_BObject_5, {
    "tag": hoisted_BObject_0.reportConstDecoder.bind(hoisted_BObject_0)
}, null);
const hoisted_BObject_9 = new ObjectSchema(hoisted_BObject_2, null);
const hoisted_BObject_10 = new ObjectDescribe(hoisted_BObject_4, null);
const hoisted_DEF_0 = {
    "a": validateString
};
const hoisted_DEF_1 = {
    "a": schemaString
};
const hoisted_DEF_2 = {
    "a": describeString
};
const hoisted_DEF_3 = hoisted_DEF_2;
const hoisted_DEF_4 = null;
const hoisted_DEF_5 = new ObjectValidator(hoisted_DEF_0, hoisted_DEF_4);
const hoisted_DEF_6 = new ObjectParser({
    "a": parseIdentity
}, null);
const hoisted_DEF_7 = new ObjectReporter(hoisted_DEF_0, hoisted_DEF_4, {
    "a": reportString
}, null);
const hoisted_DEF_8 = new ObjectSchema(hoisted_DEF_1, null);
const hoisted_DEF_9 = new ObjectDescribe(hoisted_DEF_3, null);
const hoisted_KDEF_0 = new ConstDecoder("a");
const hoisted_ABC_0 = {};
const hoisted_ABC_1 = {};
const hoisted_ABC_2 = {};
const hoisted_ABC_3 = hoisted_ABC_2;
const hoisted_ABC_4 = null;
const hoisted_ABC_5 = new ObjectValidator(hoisted_ABC_0, hoisted_ABC_4);
const hoisted_ABC_6 = new ObjectParser({}, null);
const hoisted_ABC_7 = new ObjectReporter(hoisted_ABC_0, hoisted_ABC_4, {}, null);
const hoisted_ABC_8 = new ObjectSchema(hoisted_ABC_1, null);
const hoisted_ABC_9 = new ObjectDescribe(hoisted_ABC_3, null);
const hoisted_K_0 = [
    validators.KABC,
    validators.KDEF
];
const hoisted_K_1 = [
    schemas.KABC,
    schemas.KDEF
];
const hoisted_K_2 = [
    wrap_describe(describers.KABC, "KABC"),
    wrap_describe(describers.KDEF, "KDEF")
];
const hoisted_K_3 = new AnyOfValidator(hoisted_K_0);
const hoisted_K_4 = new AnyOfParser(hoisted_K_0, [
    parsers.KABC,
    parsers.KDEF
]);
const hoisted_K_5 = new AnyOfReporter(hoisted_K_0, [
    reporters.KABC,
    reporters.KDEF
]);
const hoisted_K_6 = new AnyOfSchema(hoisted_K_1);
const hoisted_K_7 = new AnyOfDescribe(hoisted_K_2);
const hoisted_NonInfiniteNumber_0 = new NumberWithFormatsDecoder("NonInfiniteNumber");
const hoisted_NonNegativeNumber_0 = new NumberWithFormatsDecoder("NonInfiniteNumber", "NonNegativeNumber");
const hoisted_Rate_0 = new NumberWithFormatsDecoder("NonInfiniteNumber", "NonNegativeNumber", "Rate");
const hoisted_UserId_0 = new StringWithFormatsDecoder("UserId");
const hoisted_ReadAuthorizedUserId_0 = new StringWithFormatsDecoder("UserId", "ReadAuthorizedUserId");
const hoisted_WriteAuthorizedUserId_0 = new StringWithFormatsDecoder("UserId", "ReadAuthorizedUserId", "WriteAuthorizedUserId");
const hoisted_CurrencyPrices_0 = new StringWithFormatsDecoder("ValidCurrency");
const hoisted_CurrencyPrices_1 = hoisted_CurrencyPrices_0.validateStringWithFormatsDecoder.bind(hoisted_CurrencyPrices_0);
const hoisted_CurrencyPrices_2 = validators.Rate;
const hoisted_CurrencyPrices_3 = new MappedRecordValidator(hoisted_CurrencyPrices_1, hoisted_CurrencyPrices_2);
const hoisted_CurrencyPrices_4 = new MappedRecordParser(hoisted_CurrencyPrices_0.parseStringWithFormatsDecoder.bind(hoisted_CurrencyPrices_0), parsers.Rate);
const hoisted_CurrencyPrices_5 = new MappedRecordReporter(hoisted_CurrencyPrices_1, hoisted_CurrencyPrices_2, hoisted_CurrencyPrices_0.reportStringWithFormatsDecoder.bind(hoisted_CurrencyPrices_0), reporters.Rate);
const hoisted_CurrencyPrices_6 = new MappedRecordSchema(hoisted_CurrencyPrices_0.schemaStringWithFormatsDecoder.bind(hoisted_CurrencyPrices_0), schemas.Rate);
const hoisted_CurrencyPrices_7 = new MappedRecordDescribe(hoisted_CurrencyPrices_0.describeStringWithFormatsDecoder.bind(hoisted_CurrencyPrices_0), wrap_describe(describers.Rate, "Rate"));

export default { registerStringFormatter, registerNumberFormatter, ObjectValidator, ObjectParser, MappedRecordParser, MappedRecordValidator, ArrayParser, ArrayValidator, CodecDecoder, StringWithFormatsDecoder, NumberWithFormatsDecoder, AnyOfValidator, AnyOfParser, AllOfValidator, AllOfParser, TupleParser, TupleValidator, RegexDecoder, ConstDecoder, AnyOfConstsDecoder, AnyOfDiscriminatedParser, AnyOfDiscriminatedValidator, validateString, validateNumber, validateFunction, validateBoolean, validateAny, validateNull, validateNever, parseIdentity, reportString, reportNumber, reportNull, reportBoolean, reportAny, reportNever, reportFunction, ArrayReporter, ObjectReporter, TupleReporter, AnyOfReporter, AllOfReporter, AnyOfDiscriminatedReporter, MappedRecordReporter, schemaString, schemaNumber, schemaBoolean, schemaNull, schemaAny, schemaNever, schemaFunction, ArraySchema, ObjectSchema, TupleSchema, AnyOfSchema, AllOfSchema, AnyOfDiscriminatedSchema, MappedRecordSchema, describeString, describeNumber, describeBoolean, describeNull, describeAny, describeNever, describeFunction, ArrayDescribe, ObjectDescribe, TupleDescribe, AnyOfDescribe, AllOfDescribe, AnyOfDiscriminatedDescribe, MappedRecordDescribe, wrap_describe, validators, parsers, reporters, schemas, describers };