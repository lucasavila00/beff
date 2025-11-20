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


function ValidateT1(ctx, input) {
    return (hoisted_T1_5.validateObjectValidator.bind(hoisted_T1_5))(ctx, input);
}
function ParseT1(ctx, input) {
    return (hoisted_T1_6.parseObjectParser.bind(hoisted_T1_6))(ctx, input);
}
function ReportT1(ctx, input) {
    return (hoisted_T1_7.reportObjectReporter.bind(hoisted_T1_7))(ctx, input);
}
function SchemaT1(ctx, input) {
    if (ctx.seen["T1"]) {
        return {};
    }
    ctx.seen["T1"] = true;
    var tmp = (hoisted_T1_8.schemaObjectSchema.bind(hoisted_T1_8))(ctx);
    delete ctx.seen["T1"];
    return tmp;
}
function DescribeT1(ctx, input) {
    return (hoisted_T1_9.describeObjectDescribe.bind(hoisted_T1_9))(ctx);
}
function ValidateT2(ctx, input) {
    return (hoisted_T2_5.validateObjectValidator.bind(hoisted_T2_5))(ctx, input);
}
function ParseT2(ctx, input) {
    return (hoisted_T2_6.parseObjectParser.bind(hoisted_T2_6))(ctx, input);
}
function ReportT2(ctx, input) {
    return (hoisted_T2_7.reportObjectReporter.bind(hoisted_T2_7))(ctx, input);
}
function SchemaT2(ctx, input) {
    if (ctx.seen["T2"]) {
        return {};
    }
    ctx.seen["T2"] = true;
    var tmp = (hoisted_T2_8.schemaObjectSchema.bind(hoisted_T2_8))(ctx);
    delete ctx.seen["T2"];
    return tmp;
}
function DescribeT2(ctx, input) {
    return (hoisted_T2_9.describeObjectDescribe.bind(hoisted_T2_9))(ctx);
}
function ValidateT3(ctx, input) {
    return (hoisted_T3_11.validateObjectValidator.bind(hoisted_T3_11))(ctx, input);
}
function ParseT3(ctx, input) {
    return (hoisted_T3_12.parseObjectParser.bind(hoisted_T3_12))(ctx, input);
}
function ReportT3(ctx, input) {
    return (hoisted_T3_13.reportObjectReporter.bind(hoisted_T3_13))(ctx, input);
}
function SchemaT3(ctx, input) {
    if (ctx.seen["T3"]) {
        return {};
    }
    ctx.seen["T3"] = true;
    var tmp = (hoisted_T3_14.schemaObjectSchema.bind(hoisted_T3_14))(ctx);
    delete ctx.seen["T3"];
    return tmp;
}
function DescribeT3(ctx, input) {
    return (hoisted_T3_15.describeObjectDescribe.bind(hoisted_T3_15))(ctx);
}
function ValidateInvalidSchemaWithDate(ctx, input) {
    return (hoisted_InvalidSchemaWithDate_6.validateObjectValidator.bind(hoisted_InvalidSchemaWithDate_6))(ctx, input);
}
function ParseInvalidSchemaWithDate(ctx, input) {
    return (hoisted_InvalidSchemaWithDate_7.parseObjectParser.bind(hoisted_InvalidSchemaWithDate_7))(ctx, input);
}
function ReportInvalidSchemaWithDate(ctx, input) {
    return (hoisted_InvalidSchemaWithDate_8.reportObjectReporter.bind(hoisted_InvalidSchemaWithDate_8))(ctx, input);
}
function SchemaInvalidSchemaWithDate(ctx, input) {
    if (ctx.seen["InvalidSchemaWithDate"]) {
        return {};
    }
    ctx.seen["InvalidSchemaWithDate"] = true;
    var tmp = (hoisted_InvalidSchemaWithDate_9.schemaObjectSchema.bind(hoisted_InvalidSchemaWithDate_9))(ctx);
    delete ctx.seen["InvalidSchemaWithDate"];
    return tmp;
}
function DescribeInvalidSchemaWithDate(ctx, input) {
    return (hoisted_InvalidSchemaWithDate_10.describeObjectDescribe.bind(hoisted_InvalidSchemaWithDate_10))(ctx);
}
function ValidateInvalidSchemaWithBigInt(ctx, input) {
    return (hoisted_InvalidSchemaWithBigInt_6.validateObjectValidator.bind(hoisted_InvalidSchemaWithBigInt_6))(ctx, input);
}
function ParseInvalidSchemaWithBigInt(ctx, input) {
    return (hoisted_InvalidSchemaWithBigInt_7.parseObjectParser.bind(hoisted_InvalidSchemaWithBigInt_7))(ctx, input);
}
function ReportInvalidSchemaWithBigInt(ctx, input) {
    return (hoisted_InvalidSchemaWithBigInt_8.reportObjectReporter.bind(hoisted_InvalidSchemaWithBigInt_8))(ctx, input);
}
function SchemaInvalidSchemaWithBigInt(ctx, input) {
    if (ctx.seen["InvalidSchemaWithBigInt"]) {
        return {};
    }
    ctx.seen["InvalidSchemaWithBigInt"] = true;
    var tmp = (hoisted_InvalidSchemaWithBigInt_9.schemaObjectSchema.bind(hoisted_InvalidSchemaWithBigInt_9))(ctx);
    delete ctx.seen["InvalidSchemaWithBigInt"];
    return tmp;
}
function DescribeInvalidSchemaWithBigInt(ctx, input) {
    return (hoisted_InvalidSchemaWithBigInt_10.describeObjectDescribe.bind(hoisted_InvalidSchemaWithBigInt_10))(ctx);
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
function ValidateRecursiveTree(ctx, input) {
    return (hoisted_RecursiveTree_11.validateObjectValidator.bind(hoisted_RecursiveTree_11))(ctx, input);
}
function ParseRecursiveTree(ctx, input) {
    return (hoisted_RecursiveTree_12.parseObjectParser.bind(hoisted_RecursiveTree_12))(ctx, input);
}
function ReportRecursiveTree(ctx, input) {
    return (hoisted_RecursiveTree_13.reportObjectReporter.bind(hoisted_RecursiveTree_13))(ctx, input);
}
function SchemaRecursiveTree(ctx, input) {
    if (ctx.seen["RecursiveTree"]) {
        return {};
    }
    ctx.seen["RecursiveTree"] = true;
    var tmp = (hoisted_RecursiveTree_14.schemaObjectSchema.bind(hoisted_RecursiveTree_14))(ctx);
    delete ctx.seen["RecursiveTree"];
    return tmp;
}
function DescribeRecursiveTree(ctx, input) {
    return (hoisted_RecursiveTree_15.describeObjectDescribe.bind(hoisted_RecursiveTree_15))(ctx);
}
function ValidateSemVer(ctx, input) {
    return (hoisted_SemVer_0.validateRegexDecoder.bind(hoisted_SemVer_0))(ctx, input);
}
function ParseSemVer(ctx, input) {
    return (hoisted_SemVer_0.parseRegexDecoder.bind(hoisted_SemVer_0))(ctx, input);
}
function ReportSemVer(ctx, input) {
    return (hoisted_SemVer_0.reportRegexDecoder.bind(hoisted_SemVer_0))(ctx, input);
}
function SchemaSemVer(ctx, input) {
    if (ctx.seen["SemVer"]) {
        return {};
    }
    ctx.seen["SemVer"] = true;
    var tmp = (hoisted_SemVer_0.schemaRegexDecoder.bind(hoisted_SemVer_0))(ctx);
    delete ctx.seen["SemVer"];
    return tmp;
}
function DescribeSemVer(ctx, input) {
    return (hoisted_SemVer_0.describeRegexDecoder.bind(hoisted_SemVer_0))(ctx);
}
function ValidateNonEmptyString(ctx, input) {
    return (hoisted_NonEmptyString_2.validateTupleValidator.bind(hoisted_NonEmptyString_2))(ctx, input);
}
function ParseNonEmptyString(ctx, input) {
    return (hoisted_NonEmptyString_3.parseTupleParser.bind(hoisted_NonEmptyString_3))(ctx, input);
}
function ReportNonEmptyString(ctx, input) {
    return (hoisted_NonEmptyString_4.reportTupleReporter.bind(hoisted_NonEmptyString_4))(ctx, input);
}
function SchemaNonEmptyString(ctx, input) {
    if (ctx.seen["NonEmptyString"]) {
        return {};
    }
    ctx.seen["NonEmptyString"] = true;
    var tmp = (hoisted_NonEmptyString_5.schemaTupleSchema.bind(hoisted_NonEmptyString_5))(ctx);
    delete ctx.seen["NonEmptyString"];
    return tmp;
}
function DescribeNonEmptyString(ctx, input) {
    return (hoisted_NonEmptyString_6.describeTupleDescribe.bind(hoisted_NonEmptyString_6))(ctx);
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
function ValidateReusesRef(ctx, input) {
    return (hoisted_ReusesRef_5.validateObjectValidator.bind(hoisted_ReusesRef_5))(ctx, input);
}
function ParseReusesRef(ctx, input) {
    return (hoisted_ReusesRef_6.parseObjectParser.bind(hoisted_ReusesRef_6))(ctx, input);
}
function ReportReusesRef(ctx, input) {
    return (hoisted_ReusesRef_7.reportObjectReporter.bind(hoisted_ReusesRef_7))(ctx, input);
}
function SchemaReusesRef(ctx, input) {
    if (ctx.seen["ReusesRef"]) {
        return {};
    }
    ctx.seen["ReusesRef"] = true;
    var tmp = (hoisted_ReusesRef_8.schemaObjectSchema.bind(hoisted_ReusesRef_8))(ctx);
    delete ctx.seen["ReusesRef"];
    return tmp;
}
function DescribeReusesRef(ctx, input) {
    return (hoisted_ReusesRef_9.describeObjectDescribe.bind(hoisted_ReusesRef_9))(ctx);
}
const validators = {
    T1: ValidateT1,
    T2: ValidateT2,
    T3: ValidateT3,
    InvalidSchemaWithDate: ValidateInvalidSchemaWithDate,
    InvalidSchemaWithBigInt: ValidateInvalidSchemaWithBigInt,
    DiscriminatedUnion: ValidateDiscriminatedUnion,
    RecursiveTree: ValidateRecursiveTree,
    SemVer: ValidateSemVer,
    NonEmptyString: ValidateNonEmptyString,
    ValidCurrency: ValidateValidCurrency,
    ReusesRef: ValidateReusesRef
};
const parsers = {
    T1: ParseT1,
    T2: ParseT2,
    T3: ParseT3,
    InvalidSchemaWithDate: ParseInvalidSchemaWithDate,
    InvalidSchemaWithBigInt: ParseInvalidSchemaWithBigInt,
    DiscriminatedUnion: ParseDiscriminatedUnion,
    RecursiveTree: ParseRecursiveTree,
    SemVer: ParseSemVer,
    NonEmptyString: ParseNonEmptyString,
    ValidCurrency: ParseValidCurrency,
    ReusesRef: ParseReusesRef
};
const reporters = {
    T1: ReportT1,
    T2: ReportT2,
    T3: ReportT3,
    InvalidSchemaWithDate: ReportInvalidSchemaWithDate,
    InvalidSchemaWithBigInt: ReportInvalidSchemaWithBigInt,
    DiscriminatedUnion: ReportDiscriminatedUnion,
    RecursiveTree: ReportRecursiveTree,
    SemVer: ReportSemVer,
    NonEmptyString: ReportNonEmptyString,
    ValidCurrency: ReportValidCurrency,
    ReusesRef: ReportReusesRef
};
const schemas = {
    T1: SchemaT1,
    T2: SchemaT2,
    T3: SchemaT3,
    InvalidSchemaWithDate: SchemaInvalidSchemaWithDate,
    InvalidSchemaWithBigInt: SchemaInvalidSchemaWithBigInt,
    DiscriminatedUnion: SchemaDiscriminatedUnion,
    RecursiveTree: SchemaRecursiveTree,
    SemVer: SchemaSemVer,
    NonEmptyString: SchemaNonEmptyString,
    ValidCurrency: SchemaValidCurrency,
    ReusesRef: SchemaReusesRef
};
const describers = {
    T1: DescribeT1,
    T2: DescribeT2,
    T3: DescribeT3,
    InvalidSchemaWithDate: DescribeInvalidSchemaWithDate,
    InvalidSchemaWithBigInt: DescribeInvalidSchemaWithBigInt,
    DiscriminatedUnion: DescribeDiscriminatedUnion,
    RecursiveTree: DescribeRecursiveTree,
    SemVer: DescribeSemVer,
    NonEmptyString: DescribeNonEmptyString,
    ValidCurrency: DescribeValidCurrency,
    ReusesRef: DescribeReusesRef
};
const hoisted_T1_0 = {
    "a": validateString,
    "b": validateNumber
};
const hoisted_T1_1 = {
    "a": schemaString,
    "b": schemaNumber
};
const hoisted_T1_2 = {
    "a": describeString,
    "b": describeNumber
};
const hoisted_T1_3 = hoisted_T1_2;
const hoisted_T1_4 = null;
const hoisted_T1_5 = new ObjectValidator(hoisted_T1_0, hoisted_T1_4);
const hoisted_T1_6 = new ObjectParser({
    "a": parseIdentity,
    "b": parseIdentity
}, null);
const hoisted_T1_7 = new ObjectReporter(hoisted_T1_0, hoisted_T1_4, {
    "a": reportString,
    "b": reportNumber
}, null);
const hoisted_T1_8 = new ObjectSchema(hoisted_T1_1, null);
const hoisted_T1_9 = new ObjectDescribe(hoisted_T1_3, null);
const hoisted_T2_0 = {
    "t1": validators.T1
};
const hoisted_T2_1 = {
    "t1": schemas.T1
};
const hoisted_T2_2 = {
    "t1": wrap_describe(describers.T1, "T1")
};
const hoisted_T2_3 = hoisted_T2_2;
const hoisted_T2_4 = null;
const hoisted_T2_5 = new ObjectValidator(hoisted_T2_0, hoisted_T2_4);
const hoisted_T2_6 = new ObjectParser({
    "t1": parsers.T1
}, null);
const hoisted_T2_7 = new ObjectReporter(hoisted_T2_0, hoisted_T2_4, {
    "t1": reporters.T1
}, null);
const hoisted_T2_8 = new ObjectSchema(hoisted_T2_1, null);
const hoisted_T2_9 = new ObjectDescribe(hoisted_T2_3, null);
const hoisted_T3_0 = validators.T2;
const hoisted_T3_1 = new ArrayValidator(hoisted_T3_0);
const hoisted_T3_2 = new ArrayParser(parsers.T2);
const hoisted_T3_3 = new ArrayReporter(hoisted_T3_0, reporters.T2);
const hoisted_T3_4 = new ArraySchema(schemas.T2);
const hoisted_T3_5 = new ArrayDescribe(wrap_describe(describers.T2, "T2"));
const hoisted_T3_6 = {
    "t2Array": hoisted_T3_1.validateArrayValidator.bind(hoisted_T3_1)
};
const hoisted_T3_7 = {
    "t2Array": hoisted_T3_4.schemaArraySchema.bind(hoisted_T3_4)
};
const hoisted_T3_8 = {
    "t2Array": hoisted_T3_5.describeArrayDescribe.bind(hoisted_T3_5)
};
const hoisted_T3_9 = hoisted_T3_8;
const hoisted_T3_10 = null;
const hoisted_T3_11 = new ObjectValidator(hoisted_T3_6, hoisted_T3_10);
const hoisted_T3_12 = new ObjectParser({
    "t2Array": hoisted_T3_2.parseArrayParser.bind(hoisted_T3_2)
}, null);
const hoisted_T3_13 = new ObjectReporter(hoisted_T3_6, hoisted_T3_10, {
    "t2Array": hoisted_T3_3.reportArrayReporter.bind(hoisted_T3_3)
}, null);
const hoisted_T3_14 = new ObjectSchema(hoisted_T3_7, null);
const hoisted_T3_15 = new ObjectDescribe(hoisted_T3_9, null);
const hoisted_InvalidSchemaWithDate_0 = new CodecDecoder("Codec::ISO8061");
const hoisted_InvalidSchemaWithDate_1 = {
    "x": hoisted_InvalidSchemaWithDate_0.validateCodecDecoder.bind(hoisted_InvalidSchemaWithDate_0)
};
const hoisted_InvalidSchemaWithDate_2 = {
    "x": hoisted_InvalidSchemaWithDate_0.schemaCodecDecoder.bind(hoisted_InvalidSchemaWithDate_0)
};
const hoisted_InvalidSchemaWithDate_3 = {
    "x": hoisted_InvalidSchemaWithDate_0.describeCodecDecoder.bind(hoisted_InvalidSchemaWithDate_0)
};
const hoisted_InvalidSchemaWithDate_4 = hoisted_InvalidSchemaWithDate_3;
const hoisted_InvalidSchemaWithDate_5 = null;
const hoisted_InvalidSchemaWithDate_6 = new ObjectValidator(hoisted_InvalidSchemaWithDate_1, hoisted_InvalidSchemaWithDate_5);
const hoisted_InvalidSchemaWithDate_7 = new ObjectParser({
    "x": hoisted_InvalidSchemaWithDate_0.parseCodecDecoder.bind(hoisted_InvalidSchemaWithDate_0)
}, null);
const hoisted_InvalidSchemaWithDate_8 = new ObjectReporter(hoisted_InvalidSchemaWithDate_1, hoisted_InvalidSchemaWithDate_5, {
    "x": hoisted_InvalidSchemaWithDate_0.reportCodecDecoder.bind(hoisted_InvalidSchemaWithDate_0)
}, null);
const hoisted_InvalidSchemaWithDate_9 = new ObjectSchema(hoisted_InvalidSchemaWithDate_2, null);
const hoisted_InvalidSchemaWithDate_10 = new ObjectDescribe(hoisted_InvalidSchemaWithDate_4, null);
const hoisted_InvalidSchemaWithBigInt_0 = new CodecDecoder("Codec::BigInt");
const hoisted_InvalidSchemaWithBigInt_1 = {
    "x": hoisted_InvalidSchemaWithBigInt_0.validateCodecDecoder.bind(hoisted_InvalidSchemaWithBigInt_0)
};
const hoisted_InvalidSchemaWithBigInt_2 = {
    "x": hoisted_InvalidSchemaWithBigInt_0.schemaCodecDecoder.bind(hoisted_InvalidSchemaWithBigInt_0)
};
const hoisted_InvalidSchemaWithBigInt_3 = {
    "x": hoisted_InvalidSchemaWithBigInt_0.describeCodecDecoder.bind(hoisted_InvalidSchemaWithBigInt_0)
};
const hoisted_InvalidSchemaWithBigInt_4 = hoisted_InvalidSchemaWithBigInt_3;
const hoisted_InvalidSchemaWithBigInt_5 = null;
const hoisted_InvalidSchemaWithBigInt_6 = new ObjectValidator(hoisted_InvalidSchemaWithBigInt_1, hoisted_InvalidSchemaWithBigInt_5);
const hoisted_InvalidSchemaWithBigInt_7 = new ObjectParser({
    "x": hoisted_InvalidSchemaWithBigInt_0.parseCodecDecoder.bind(hoisted_InvalidSchemaWithBigInt_0)
}, null);
const hoisted_InvalidSchemaWithBigInt_8 = new ObjectReporter(hoisted_InvalidSchemaWithBigInt_1, hoisted_InvalidSchemaWithBigInt_5, {
    "x": hoisted_InvalidSchemaWithBigInt_0.reportCodecDecoder.bind(hoisted_InvalidSchemaWithBigInt_0)
}, null);
const hoisted_InvalidSchemaWithBigInt_9 = new ObjectSchema(hoisted_InvalidSchemaWithBigInt_2, null);
const hoisted_InvalidSchemaWithBigInt_10 = new ObjectDescribe(hoisted_InvalidSchemaWithBigInt_4, null);
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
const hoisted_RecursiveTree_0 = validators.RecursiveTree;
const hoisted_RecursiveTree_1 = new ArrayValidator(hoisted_RecursiveTree_0);
const hoisted_RecursiveTree_2 = new ArrayParser(parsers.RecursiveTree);
const hoisted_RecursiveTree_3 = new ArrayReporter(hoisted_RecursiveTree_0, reporters.RecursiveTree);
const hoisted_RecursiveTree_4 = new ArraySchema(schemas.RecursiveTree);
const hoisted_RecursiveTree_5 = new ArrayDescribe(wrap_describe(describers.RecursiveTree, "RecursiveTree"));
const hoisted_RecursiveTree_6 = {
    "children": hoisted_RecursiveTree_1.validateArrayValidator.bind(hoisted_RecursiveTree_1),
    "value": validateNumber
};
const hoisted_RecursiveTree_7 = {
    "children": hoisted_RecursiveTree_4.schemaArraySchema.bind(hoisted_RecursiveTree_4),
    "value": schemaNumber
};
const hoisted_RecursiveTree_8 = {
    "children": hoisted_RecursiveTree_5.describeArrayDescribe.bind(hoisted_RecursiveTree_5),
    "value": describeNumber
};
const hoisted_RecursiveTree_9 = hoisted_RecursiveTree_8;
const hoisted_RecursiveTree_10 = null;
const hoisted_RecursiveTree_11 = new ObjectValidator(hoisted_RecursiveTree_6, hoisted_RecursiveTree_10);
const hoisted_RecursiveTree_12 = new ObjectParser({
    "children": hoisted_RecursiveTree_2.parseArrayParser.bind(hoisted_RecursiveTree_2),
    "value": parseIdentity
}, null);
const hoisted_RecursiveTree_13 = new ObjectReporter(hoisted_RecursiveTree_6, hoisted_RecursiveTree_10, {
    "children": hoisted_RecursiveTree_3.reportArrayReporter.bind(hoisted_RecursiveTree_3),
    "value": reportNumber
}, null);
const hoisted_RecursiveTree_14 = new ObjectSchema(hoisted_RecursiveTree_7, null);
const hoisted_RecursiveTree_15 = new ObjectDescribe(hoisted_RecursiveTree_9, null);
const hoisted_SemVer_0 = new RegexDecoder(/(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "${number}.${number}.${number}");
const hoisted_NonEmptyString_0 = [
    validateString
];
const hoisted_NonEmptyString_1 = validateString;
const hoisted_NonEmptyString_2 = new TupleValidator(hoisted_NonEmptyString_0, hoisted_NonEmptyString_1);
const hoisted_NonEmptyString_3 = new TupleParser([
    parseIdentity
], parseIdentity);
const hoisted_NonEmptyString_4 = new TupleReporter(hoisted_NonEmptyString_0, hoisted_NonEmptyString_1, [
    reportString
], reportString);
const hoisted_NonEmptyString_5 = new TupleSchema([
    schemaString
], schemaString);
const hoisted_NonEmptyString_6 = new TupleDescribe([
    describeString
], describeString);
const hoisted_ValidCurrency_0 = new StringWithFormatsDecoder("ValidCurrency");
const hoisted_ReusesRef_0 = {
    "a": validators.T3,
    "b": validators.T3
};
const hoisted_ReusesRef_1 = {
    "a": schemas.T3,
    "b": schemas.T3
};
const hoisted_ReusesRef_2 = {
    "a": wrap_describe(describers.T3, "T3"),
    "b": wrap_describe(describers.T3, "T3")
};
const hoisted_ReusesRef_3 = hoisted_ReusesRef_2;
const hoisted_ReusesRef_4 = null;
const hoisted_ReusesRef_5 = new ObjectValidator(hoisted_ReusesRef_0, hoisted_ReusesRef_4);
const hoisted_ReusesRef_6 = new ObjectParser({
    "a": parsers.T3,
    "b": parsers.T3
}, null);
const hoisted_ReusesRef_7 = new ObjectReporter(hoisted_ReusesRef_0, hoisted_ReusesRef_4, {
    "a": reporters.T3,
    "b": reporters.T3
}, null);
const hoisted_ReusesRef_8 = new ObjectSchema(hoisted_ReusesRef_1, null);
const hoisted_ReusesRef_9 = new ObjectDescribe(hoisted_ReusesRef_3, null);

export default { registerStringFormatter, registerNumberFormatter, ObjectValidator, ObjectParser, MappedRecordParser, MappedRecordValidator, ArrayParser, ArrayValidator, CodecDecoder, StringWithFormatsDecoder, NumberWithFormatsDecoder, AnyOfValidator, AnyOfParser, AllOfValidator, AllOfParser, TupleParser, TupleValidator, RegexDecoder, ConstDecoder, AnyOfConstsDecoder, AnyOfDiscriminatedParser, AnyOfDiscriminatedValidator, validateString, validateNumber, validateFunction, validateBoolean, validateAny, validateNull, validateNever, parseIdentity, reportString, reportNumber, reportNull, reportBoolean, reportAny, reportNever, reportFunction, ArrayReporter, ObjectReporter, TupleReporter, AnyOfReporter, AllOfReporter, AnyOfDiscriminatedReporter, MappedRecordReporter, schemaString, schemaNumber, schemaBoolean, schemaNull, schemaAny, schemaNever, schemaFunction, ArraySchema, ObjectSchema, TupleSchema, AnyOfSchema, AllOfSchema, AnyOfDiscriminatedSchema, MappedRecordSchema, describeString, describeNumber, describeBoolean, describeNull, describeAny, describeNever, describeFunction, ArrayDescribe, ObjectDescribe, TupleDescribe, AnyOfDescribe, AllOfDescribe, AnyOfDiscriminatedDescribe, MappedRecordDescribe, wrap_describe, validators, parsers, reporters, schemas, describers };