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
  return buildError(ctx, "expected nullish value", input);
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
    return buildError(ctx, `expected ${JSON.stringify(this.value)}`, input);
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
    const dataKeys = Object.keys(this.data);
    const missingKeys = dataKeys.filter((k) => !inputKeys.includes(k));

    for (const k of missingKeys) {
      acc[k] = undefined;
    }

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
      throw new Error("Unknown discriminator");
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
    const acc = [];
    for (const v of this.reporters) {
      const errors = v(ctx, input);
      acc.push(...errors);
    }
    return acc;
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


function ValidateTransportedValue(ctx, input) {
    return (hoisted_TransportedValue_9.validateAnyOfValidator.bind(hoisted_TransportedValue_9))(ctx, input);
}
function ParseTransportedValue(ctx, input) {
    return (hoisted_TransportedValue_10.parseAnyOfParser.bind(hoisted_TransportedValue_10))(ctx, input);
}
function ReportTransportedValue(ctx, input) {
    return (hoisted_TransportedValue_11.reportAnyOfReporter.bind(hoisted_TransportedValue_11))(ctx, input);
}
function ValidateOnlyAKey(ctx, input) {
    return (hoisted_OnlyAKey_2.validateObjectValidator.bind(hoisted_OnlyAKey_2))(ctx, input);
}
function ParseOnlyAKey(ctx, input) {
    return (hoisted_OnlyAKey_3.parseObjectParser.bind(hoisted_OnlyAKey_3))(ctx, input);
}
function ReportOnlyAKey(ctx, input) {
    return (hoisted_OnlyAKey_4.reportObjectReporter.bind(hoisted_OnlyAKey_4))(ctx, input);
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
function ValidateAObject(ctx, input) {
    return (hoisted_AObject_3.validateObjectValidator.bind(hoisted_AObject_3))(ctx, input);
}
function ParseAObject(ctx, input) {
    return (hoisted_AObject_4.parseObjectParser.bind(hoisted_AObject_4))(ctx, input);
}
function ReportAObject(ctx, input) {
    return (hoisted_AObject_5.reportObjectReporter.bind(hoisted_AObject_5))(ctx, input);
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
function ValidateVersion2(ctx, input) {
    return (hoisted_Version2_0.validateRegexDecoder.bind(hoisted_Version2_0))(ctx, input);
}
function ParseVersion2(ctx, input) {
    return (hoisted_Version2_0.parseRegexDecoder.bind(hoisted_Version2_0))(ctx, input);
}
function ReportVersion2(ctx, input) {
    return (hoisted_Version2_0.reportRegexDecoder.bind(hoisted_Version2_0))(ctx, input);
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
function ValidateAccessLevelTpl2(ctx, input) {
    return (hoisted_AccessLevelTpl2_0.validateRegexDecoder.bind(hoisted_AccessLevelTpl2_0))(ctx, input);
}
function ParseAccessLevelTpl2(ctx, input) {
    return (hoisted_AccessLevelTpl2_0.parseRegexDecoder.bind(hoisted_AccessLevelTpl2_0))(ctx, input);
}
function ReportAccessLevelTpl2(ctx, input) {
    return (hoisted_AccessLevelTpl2_0.reportRegexDecoder.bind(hoisted_AccessLevelTpl2_0))(ctx, input);
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
function ValidateAccessLevelTpl(ctx, input) {
    return (hoisted_AccessLevelTpl_0.validateRegexDecoder.bind(hoisted_AccessLevelTpl_0))(ctx, input);
}
function ParseAccessLevelTpl(ctx, input) {
    return (hoisted_AccessLevelTpl_0.parseRegexDecoder.bind(hoisted_AccessLevelTpl_0))(ctx, input);
}
function ReportAccessLevelTpl(ctx, input) {
    return (hoisted_AccessLevelTpl_0.reportRegexDecoder.bind(hoisted_AccessLevelTpl_0))(ctx, input);
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
function ValidateOmitSettings(ctx, input) {
    return (hoisted_OmitSettings_9.validateObjectValidator.bind(hoisted_OmitSettings_9))(ctx, input);
}
function ParseOmitSettings(ctx, input) {
    return (hoisted_OmitSettings_10.parseObjectParser.bind(hoisted_OmitSettings_10))(ctx, input);
}
function ReportOmitSettings(ctx, input) {
    return (hoisted_OmitSettings_11.reportObjectReporter.bind(hoisted_OmitSettings_11))(ctx, input);
}
function ValidateSettings(ctx, input) {
    return (hoisted_Settings_9.validateObjectValidator.bind(hoisted_Settings_9))(ctx, input);
}
function ParseSettings(ctx, input) {
    return (hoisted_Settings_10.parseObjectParser.bind(hoisted_Settings_10))(ctx, input);
}
function ReportSettings(ctx, input) {
    return (hoisted_Settings_11.reportObjectReporter.bind(hoisted_Settings_11))(ctx, input);
}
function ValidatePartialObject(ctx, input) {
    return (hoisted_PartialObject_10.validateObjectValidator.bind(hoisted_PartialObject_10))(ctx, input);
}
function ParsePartialObject(ctx, input) {
    return (hoisted_PartialObject_11.parseObjectParser.bind(hoisted_PartialObject_11))(ctx, input);
}
function ReportPartialObject(ctx, input) {
    return (hoisted_PartialObject_12.reportObjectReporter.bind(hoisted_PartialObject_12))(ctx, input);
}
function ValidateRequiredPartialObject(ctx, input) {
    return (hoisted_RequiredPartialObject_2.validateObjectValidator.bind(hoisted_RequiredPartialObject_2))(ctx, input);
}
function ParseRequiredPartialObject(ctx, input) {
    return (hoisted_RequiredPartialObject_3.parseObjectParser.bind(hoisted_RequiredPartialObject_3))(ctx, input);
}
function ReportRequiredPartialObject(ctx, input) {
    return (hoisted_RequiredPartialObject_4.reportObjectReporter.bind(hoisted_RequiredPartialObject_4))(ctx, input);
}
function ValidateLevelAndDSettings(ctx, input) {
    return (hoisted_LevelAndDSettings_9.validateObjectValidator.bind(hoisted_LevelAndDSettings_9))(ctx, input);
}
function ParseLevelAndDSettings(ctx, input) {
    return (hoisted_LevelAndDSettings_10.parseObjectParser.bind(hoisted_LevelAndDSettings_10))(ctx, input);
}
function ReportLevelAndDSettings(ctx, input) {
    return (hoisted_LevelAndDSettings_11.reportObjectReporter.bind(hoisted_LevelAndDSettings_11))(ctx, input);
}
function ValidatePartialSettings(ctx, input) {
    return (hoisted_PartialSettings_22.validateObjectValidator.bind(hoisted_PartialSettings_22))(ctx, input);
}
function ParsePartialSettings(ctx, input) {
    return (hoisted_PartialSettings_23.parseObjectParser.bind(hoisted_PartialSettings_23))(ctx, input);
}
function ReportPartialSettings(ctx, input) {
    return (hoisted_PartialSettings_24.reportObjectReporter.bind(hoisted_PartialSettings_24))(ctx, input);
}
function ValidateExtra(ctx, input) {
    return (hoisted_Extra_2.validateObjectValidator.bind(hoisted_Extra_2))(ctx, input);
}
function ParseExtra(ctx, input) {
    return (hoisted_Extra_3.parseObjectParser.bind(hoisted_Extra_3))(ctx, input);
}
function ReportExtra(ctx, input) {
    return (hoisted_Extra_4.reportObjectReporter.bind(hoisted_Extra_4))(ctx, input);
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
function ValidateUser(ctx, input) {
    return (hoisted_User_6.validateObjectValidator.bind(hoisted_User_6))(ctx, input);
}
function ParseUser(ctx, input) {
    return (hoisted_User_7.parseObjectParser.bind(hoisted_User_7))(ctx, input);
}
function ReportUser(ctx, input) {
    return (hoisted_User_8.reportObjectReporter.bind(hoisted_User_8))(ctx, input);
}
function ValidatePublicUser(ctx, input) {
    return (hoisted_PublicUser_2.validateObjectValidator.bind(hoisted_PublicUser_2))(ctx, input);
}
function ParsePublicUser(ctx, input) {
    return (hoisted_PublicUser_3.parseObjectParser.bind(hoisted_PublicUser_3))(ctx, input);
}
function ReportPublicUser(ctx, input) {
    return (hoisted_PublicUser_4.reportObjectReporter.bind(hoisted_PublicUser_4))(ctx, input);
}
function ValidateReq(ctx, input) {
    return (hoisted_Req_2.validateObjectValidator.bind(hoisted_Req_2))(ctx, input);
}
function ParseReq(ctx, input) {
    return (hoisted_Req_3.parseObjectParser.bind(hoisted_Req_3))(ctx, input);
}
function ReportReq(ctx, input) {
    return (hoisted_Req_4.reportObjectReporter.bind(hoisted_Req_4))(ctx, input);
}
function ValidateWithOptionals(ctx, input) {
    return (hoisted_WithOptionals_6.validateObjectValidator.bind(hoisted_WithOptionals_6))(ctx, input);
}
function ParseWithOptionals(ctx, input) {
    return (hoisted_WithOptionals_7.parseObjectParser.bind(hoisted_WithOptionals_7))(ctx, input);
}
function ReportWithOptionals(ctx, input) {
    return (hoisted_WithOptionals_8.reportObjectReporter.bind(hoisted_WithOptionals_8))(ctx, input);
}
function ValidateRepro1(ctx, input) {
    return (hoisted_Repro1_6.validateObjectValidator.bind(hoisted_Repro1_6))(ctx, input);
}
function ParseRepro1(ctx, input) {
    return (hoisted_Repro1_7.parseObjectParser.bind(hoisted_Repro1_7))(ctx, input);
}
function ReportRepro1(ctx, input) {
    return (hoisted_Repro1_8.reportObjectReporter.bind(hoisted_Repro1_8))(ctx, input);
}
function ValidateRepro2(ctx, input) {
    return (hoisted_Repro2_2.validateObjectValidator.bind(hoisted_Repro2_2))(ctx, input);
}
function ParseRepro2(ctx, input) {
    return (hoisted_Repro2_3.parseObjectParser.bind(hoisted_Repro2_3))(ctx, input);
}
function ReportRepro2(ctx, input) {
    return (hoisted_Repro2_4.reportObjectReporter.bind(hoisted_Repro2_4))(ctx, input);
}
function ValidateSettingsUpdate(ctx, input) {
    return (hoisted_SettingsUpdate_7.validateAnyOfValidator.bind(hoisted_SettingsUpdate_7))(ctx, input);
}
function ParseSettingsUpdate(ctx, input) {
    return (hoisted_SettingsUpdate_8.parseAnyOfParser.bind(hoisted_SettingsUpdate_8))(ctx, input);
}
function ReportSettingsUpdate(ctx, input) {
    return (hoisted_SettingsUpdate_9.reportAnyOfReporter.bind(hoisted_SettingsUpdate_9))(ctx, input);
}
function ValidateMapped(ctx, input) {
    return (hoisted_Mapped_14.validateObjectValidator.bind(hoisted_Mapped_14))(ctx, input);
}
function ParseMapped(ctx, input) {
    return (hoisted_Mapped_15.parseObjectParser.bind(hoisted_Mapped_15))(ctx, input);
}
function ReportMapped(ctx, input) {
    return (hoisted_Mapped_16.reportObjectReporter.bind(hoisted_Mapped_16))(ctx, input);
}
function ValidateMappedOptional(ctx, input) {
    return (hoisted_MappedOptional_22.validateObjectValidator.bind(hoisted_MappedOptional_22))(ctx, input);
}
function ParseMappedOptional(ctx, input) {
    return (hoisted_MappedOptional_23.parseObjectParser.bind(hoisted_MappedOptional_23))(ctx, input);
}
function ReportMappedOptional(ctx, input) {
    return (hoisted_MappedOptional_24.reportObjectReporter.bind(hoisted_MappedOptional_24))(ctx, input);
}
function ValidateDiscriminatedUnion(ctx, input) {
    return (hoisted_DiscriminatedUnion_27.validateAnyOfDiscriminatedValidator.bind(hoisted_DiscriminatedUnion_27))(ctx, input);
}
function ParseDiscriminatedUnion(ctx, input) {
    return (hoisted_DiscriminatedUnion_28.parseAnyOfDiscriminatedParser.bind(hoisted_DiscriminatedUnion_28))(ctx, input);
}
function ReportDiscriminatedUnion(ctx, input) {
    return (hoisted_DiscriminatedUnion_29.reportAnyOfDiscriminatedReporter.bind(hoisted_DiscriminatedUnion_29))(ctx, input);
}
function ValidateDiscriminatedUnion2(ctx, input) {
    return (hoisted_DiscriminatedUnion2_35.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion2_35))(ctx, input);
}
function ParseDiscriminatedUnion2(ctx, input) {
    return (hoisted_DiscriminatedUnion2_36.parseAnyOfParser.bind(hoisted_DiscriminatedUnion2_36))(ctx, input);
}
function ReportDiscriminatedUnion2(ctx, input) {
    return (hoisted_DiscriminatedUnion2_37.reportAnyOfReporter.bind(hoisted_DiscriminatedUnion2_37))(ctx, input);
}
function ValidateDiscriminatedUnion3(ctx, input) {
    return (hoisted_DiscriminatedUnion3_18.validateAnyOfDiscriminatedValidator.bind(hoisted_DiscriminatedUnion3_18))(ctx, input);
}
function ParseDiscriminatedUnion3(ctx, input) {
    return (hoisted_DiscriminatedUnion3_19.parseAnyOfDiscriminatedParser.bind(hoisted_DiscriminatedUnion3_19))(ctx, input);
}
function ReportDiscriminatedUnion3(ctx, input) {
    return (hoisted_DiscriminatedUnion3_20.reportAnyOfDiscriminatedReporter.bind(hoisted_DiscriminatedUnion3_20))(ctx, input);
}
function ValidateDiscriminatedUnion4(ctx, input) {
    return (hoisted_DiscriminatedUnion4_25.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion4_25))(ctx, input);
}
function ParseDiscriminatedUnion4(ctx, input) {
    return (hoisted_DiscriminatedUnion4_26.parseAnyOfParser.bind(hoisted_DiscriminatedUnion4_26))(ctx, input);
}
function ReportDiscriminatedUnion4(ctx, input) {
    return (hoisted_DiscriminatedUnion4_27.reportAnyOfReporter.bind(hoisted_DiscriminatedUnion4_27))(ctx, input);
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
function ValidateOtherEnum(ctx, input) {
    return (hoisted_OtherEnum_0.validateAnyOfConstsDecoder.bind(hoisted_OtherEnum_0))(ctx, input);
}
function ParseOtherEnum(ctx, input) {
    return (hoisted_OtherEnum_0.parseAnyOfConstsDecoder.bind(hoisted_OtherEnum_0))(ctx, input);
}
function ReportOtherEnum(ctx, input) {
    return (hoisted_OtherEnum_0.reportAnyOfConstsDecoder.bind(hoisted_OtherEnum_0))(ctx, input);
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
function ValidateValidCurrency(ctx, input) {
    return (hoisted_ValidCurrency_0.validateStringWithFormatDecoder.bind(hoisted_ValidCurrency_0))(ctx, input);
}
function ParseValidCurrency(ctx, input) {
    return (hoisted_ValidCurrency_0.parseStringWithFormatDecoder.bind(hoisted_ValidCurrency_0))(ctx, input);
}
function ReportValidCurrency(ctx, input) {
    return (hoisted_ValidCurrency_0.reportStringWithFormatDecoder.bind(hoisted_ValidCurrency_0))(ctx, input);
}
function ValidateUnionWithEnumAccess(ctx, input) {
    return (hoisted_UnionWithEnumAccess_18.validateAnyOfDiscriminatedValidator.bind(hoisted_UnionWithEnumAccess_18))(ctx, input);
}
function ParseUnionWithEnumAccess(ctx, input) {
    return (hoisted_UnionWithEnumAccess_19.parseAnyOfDiscriminatedParser.bind(hoisted_UnionWithEnumAccess_19))(ctx, input);
}
function ReportUnionWithEnumAccess(ctx, input) {
    return (hoisted_UnionWithEnumAccess_20.reportAnyOfDiscriminatedReporter.bind(hoisted_UnionWithEnumAccess_20))(ctx, input);
}
function ValidateShape(ctx, input) {
    return (hoisted_Shape_18.validateAnyOfDiscriminatedValidator.bind(hoisted_Shape_18))(ctx, input);
}
function ParseShape(ctx, input) {
    return (hoisted_Shape_19.parseAnyOfDiscriminatedParser.bind(hoisted_Shape_19))(ctx, input);
}
function ReportShape(ctx, input) {
    return (hoisted_Shape_20.reportAnyOfDiscriminatedReporter.bind(hoisted_Shape_20))(ctx, input);
}
function ValidateT3(ctx, input) {
    return (hoisted_T3_12.validateAnyOfDiscriminatedValidator.bind(hoisted_T3_12))(ctx, input);
}
function ParseT3(ctx, input) {
    return (hoisted_T3_13.parseAnyOfDiscriminatedParser.bind(hoisted_T3_13))(ctx, input);
}
function ReportT3(ctx, input) {
    return (hoisted_T3_14.reportAnyOfDiscriminatedReporter.bind(hoisted_T3_14))(ctx, input);
}
function ValidateBObject(ctx, input) {
    return (hoisted_BObject_3.validateObjectValidator.bind(hoisted_BObject_3))(ctx, input);
}
function ParseBObject(ctx, input) {
    return (hoisted_BObject_4.parseObjectParser.bind(hoisted_BObject_4))(ctx, input);
}
function ReportBObject(ctx, input) {
    return (hoisted_BObject_5.reportObjectReporter.bind(hoisted_BObject_5))(ctx, input);
}
function ValidateDEF(ctx, input) {
    return (hoisted_DEF_2.validateObjectValidator.bind(hoisted_DEF_2))(ctx, input);
}
function ParseDEF(ctx, input) {
    return (hoisted_DEF_3.parseObjectParser.bind(hoisted_DEF_3))(ctx, input);
}
function ReportDEF(ctx, input) {
    return (hoisted_DEF_4.reportObjectReporter.bind(hoisted_DEF_4))(ctx, input);
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
function ValidateABC(ctx, input) {
    return (hoisted_ABC_2.validateObjectValidator.bind(hoisted_ABC_2))(ctx, input);
}
function ParseABC(ctx, input) {
    return (hoisted_ABC_3.parseObjectParser.bind(hoisted_ABC_3))(ctx, input);
}
function ReportABC(ctx, input) {
    return (hoisted_ABC_4.reportObjectReporter.bind(hoisted_ABC_4))(ctx, input);
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
function ValidateK(ctx, input) {
    return (hoisted_K_1.validateAnyOfValidator.bind(hoisted_K_1))(ctx, input);
}
function ParseK(ctx, input) {
    return (hoisted_K_2.parseAnyOfParser.bind(hoisted_K_2))(ctx, input);
}
function ReportK(ctx, input) {
    return (hoisted_K_3.reportAnyOfReporter.bind(hoisted_K_3))(ctx, input);
}
const validators = {
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
    K: ValidateK
};
const parsers = {
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
    K: ParseK
};
const reporters = {
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
    K: ReportK
};
const hoisted_TransportedValue_0 = [
    validateNull,
    validateString,
    validateNumber
];
const hoisted_TransportedValue_1 = new AnyOfValidator(hoisted_TransportedValue_0);
const hoisted_TransportedValue_2 = new AnyOfParser(hoisted_TransportedValue_0, [
    parseIdentity,
    parseIdentity,
    parseIdentity
]);
const hoisted_TransportedValue_3 = new AnyOfReporter(hoisted_TransportedValue_0, [
    reportNull,
    reportString,
    reportNumber
]);
const hoisted_TransportedValue_4 = hoisted_TransportedValue_1.validateAnyOfValidator.bind(hoisted_TransportedValue_1);
const hoisted_TransportedValue_5 = new ArrayValidator(hoisted_TransportedValue_4);
const hoisted_TransportedValue_6 = new ArrayParser(hoisted_TransportedValue_2.parseAnyOfParser.bind(hoisted_TransportedValue_2));
const hoisted_TransportedValue_7 = new ArrayReporter(hoisted_TransportedValue_4, hoisted_TransportedValue_3.reportAnyOfReporter.bind(hoisted_TransportedValue_3));
const hoisted_TransportedValue_8 = [
    validateNull,
    validateString,
    hoisted_TransportedValue_5.validateArrayValidator.bind(hoisted_TransportedValue_5)
];
const hoisted_TransportedValue_9 = new AnyOfValidator(hoisted_TransportedValue_8);
const hoisted_TransportedValue_10 = new AnyOfParser(hoisted_TransportedValue_8, [
    parseIdentity,
    parseIdentity,
    hoisted_TransportedValue_6.parseArrayParser.bind(hoisted_TransportedValue_6)
]);
const hoisted_TransportedValue_11 = new AnyOfReporter(hoisted_TransportedValue_8, [
    reportNull,
    reportString,
    hoisted_TransportedValue_7.reportArrayReporter.bind(hoisted_TransportedValue_7)
]);
const hoisted_OnlyAKey_0 = {
    "A": validateString
};
const hoisted_OnlyAKey_1 = null;
const hoisted_OnlyAKey_2 = new ObjectValidator(hoisted_OnlyAKey_0, hoisted_OnlyAKey_1);
const hoisted_OnlyAKey_3 = new ObjectParser({
    "A": parseIdentity
}, null);
const hoisted_OnlyAKey_4 = new ObjectReporter(hoisted_OnlyAKey_0, hoisted_OnlyAKey_1, {
    "A": reportString
}, null);
const hoisted_AllTs_0 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_AObject_0 = new ConstDecoder("a");
const hoisted_AObject_1 = {
    "tag": hoisted_AObject_0.validateConstDecoder.bind(hoisted_AObject_0)
};
const hoisted_AObject_2 = null;
const hoisted_AObject_3 = new ObjectValidator(hoisted_AObject_1, hoisted_AObject_2);
const hoisted_AObject_4 = new ObjectParser({
    "tag": hoisted_AObject_0.parseConstDecoder.bind(hoisted_AObject_0)
}, null);
const hoisted_AObject_5 = new ObjectReporter(hoisted_AObject_1, hoisted_AObject_2, {
    "tag": hoisted_AObject_0.reportConstDecoder.bind(hoisted_AObject_0)
}, null);
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
const hoisted_OmitSettings_2 = null;
const hoisted_OmitSettings_3 = new ObjectValidator(hoisted_OmitSettings_1, hoisted_OmitSettings_2);
const hoisted_OmitSettings_4 = new ObjectParser({
    "tag": hoisted_OmitSettings_0.parseConstDecoder.bind(hoisted_OmitSettings_0)
}, null);
const hoisted_OmitSettings_5 = new ObjectReporter(hoisted_OmitSettings_1, hoisted_OmitSettings_2, {
    "tag": hoisted_OmitSettings_0.reportConstDecoder.bind(hoisted_OmitSettings_0)
}, null);
const hoisted_OmitSettings_6 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_OmitSettings_7 = {
    "d": hoisted_OmitSettings_3.validateObjectValidator.bind(hoisted_OmitSettings_3),
    "level": hoisted_OmitSettings_6.validateAnyOfConstsDecoder.bind(hoisted_OmitSettings_6)
};
const hoisted_OmitSettings_8 = null;
const hoisted_OmitSettings_9 = new ObjectValidator(hoisted_OmitSettings_7, hoisted_OmitSettings_8);
const hoisted_OmitSettings_10 = new ObjectParser({
    "d": hoisted_OmitSettings_4.parseObjectParser.bind(hoisted_OmitSettings_4),
    "level": hoisted_OmitSettings_6.parseAnyOfConstsDecoder.bind(hoisted_OmitSettings_6)
}, null);
const hoisted_OmitSettings_11 = new ObjectReporter(hoisted_OmitSettings_7, hoisted_OmitSettings_8, {
    "d": hoisted_OmitSettings_5.reportObjectReporter.bind(hoisted_OmitSettings_5),
    "level": hoisted_OmitSettings_6.reportAnyOfConstsDecoder.bind(hoisted_OmitSettings_6)
}, null);
const hoisted_Settings_0 = new ConstDecoder("d");
const hoisted_Settings_1 = {
    "tag": hoisted_Settings_0.validateConstDecoder.bind(hoisted_Settings_0)
};
const hoisted_Settings_2 = null;
const hoisted_Settings_3 = new ObjectValidator(hoisted_Settings_1, hoisted_Settings_2);
const hoisted_Settings_4 = new ObjectParser({
    "tag": hoisted_Settings_0.parseConstDecoder.bind(hoisted_Settings_0)
}, null);
const hoisted_Settings_5 = new ObjectReporter(hoisted_Settings_1, hoisted_Settings_2, {
    "tag": hoisted_Settings_0.reportConstDecoder.bind(hoisted_Settings_0)
}, null);
const hoisted_Settings_6 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_Settings_7 = {
    "a": validateString,
    "d": hoisted_Settings_3.validateObjectValidator.bind(hoisted_Settings_3),
    "level": hoisted_Settings_6.validateAnyOfConstsDecoder.bind(hoisted_Settings_6)
};
const hoisted_Settings_8 = null;
const hoisted_Settings_9 = new ObjectValidator(hoisted_Settings_7, hoisted_Settings_8);
const hoisted_Settings_10 = new ObjectParser({
    "a": parseIdentity,
    "d": hoisted_Settings_4.parseObjectParser.bind(hoisted_Settings_4),
    "level": hoisted_Settings_6.parseAnyOfConstsDecoder.bind(hoisted_Settings_6)
}, null);
const hoisted_Settings_11 = new ObjectReporter(hoisted_Settings_7, hoisted_Settings_8, {
    "a": reportString,
    "d": hoisted_Settings_5.reportObjectReporter.bind(hoisted_Settings_5),
    "level": hoisted_Settings_6.reportAnyOfConstsDecoder.bind(hoisted_Settings_6)
}, null);
const hoisted_PartialObject_0 = [
    validateNull,
    validateString
];
const hoisted_PartialObject_1 = new AnyOfValidator(hoisted_PartialObject_0);
const hoisted_PartialObject_2 = new AnyOfParser(hoisted_PartialObject_0, [
    parseIdentity,
    parseIdentity
]);
const hoisted_PartialObject_3 = new AnyOfReporter(hoisted_PartialObject_0, [
    reportNull,
    reportString
]);
const hoisted_PartialObject_4 = [
    validateNull,
    validateNumber
];
const hoisted_PartialObject_5 = new AnyOfValidator(hoisted_PartialObject_4);
const hoisted_PartialObject_6 = new AnyOfParser(hoisted_PartialObject_4, [
    parseIdentity,
    parseIdentity
]);
const hoisted_PartialObject_7 = new AnyOfReporter(hoisted_PartialObject_4, [
    reportNull,
    reportNumber
]);
const hoisted_PartialObject_8 = {
    "a": hoisted_PartialObject_1.validateAnyOfValidator.bind(hoisted_PartialObject_1),
    "b": hoisted_PartialObject_5.validateAnyOfValidator.bind(hoisted_PartialObject_5)
};
const hoisted_PartialObject_9 = null;
const hoisted_PartialObject_10 = new ObjectValidator(hoisted_PartialObject_8, hoisted_PartialObject_9);
const hoisted_PartialObject_11 = new ObjectParser({
    "a": hoisted_PartialObject_2.parseAnyOfParser.bind(hoisted_PartialObject_2),
    "b": hoisted_PartialObject_6.parseAnyOfParser.bind(hoisted_PartialObject_6)
}, null);
const hoisted_PartialObject_12 = new ObjectReporter(hoisted_PartialObject_8, hoisted_PartialObject_9, {
    "a": hoisted_PartialObject_3.reportAnyOfReporter.bind(hoisted_PartialObject_3),
    "b": hoisted_PartialObject_7.reportAnyOfReporter.bind(hoisted_PartialObject_7)
}, null);
const hoisted_RequiredPartialObject_0 = {
    "a": validateString,
    "b": validateNumber
};
const hoisted_RequiredPartialObject_1 = null;
const hoisted_RequiredPartialObject_2 = new ObjectValidator(hoisted_RequiredPartialObject_0, hoisted_RequiredPartialObject_1);
const hoisted_RequiredPartialObject_3 = new ObjectParser({
    "a": parseIdentity,
    "b": parseIdentity
}, null);
const hoisted_RequiredPartialObject_4 = new ObjectReporter(hoisted_RequiredPartialObject_0, hoisted_RequiredPartialObject_1, {
    "a": reportString,
    "b": reportNumber
}, null);
const hoisted_LevelAndDSettings_0 = new ConstDecoder("d");
const hoisted_LevelAndDSettings_1 = {
    "tag": hoisted_LevelAndDSettings_0.validateConstDecoder.bind(hoisted_LevelAndDSettings_0)
};
const hoisted_LevelAndDSettings_2 = null;
const hoisted_LevelAndDSettings_3 = new ObjectValidator(hoisted_LevelAndDSettings_1, hoisted_LevelAndDSettings_2);
const hoisted_LevelAndDSettings_4 = new ObjectParser({
    "tag": hoisted_LevelAndDSettings_0.parseConstDecoder.bind(hoisted_LevelAndDSettings_0)
}, null);
const hoisted_LevelAndDSettings_5 = new ObjectReporter(hoisted_LevelAndDSettings_1, hoisted_LevelAndDSettings_2, {
    "tag": hoisted_LevelAndDSettings_0.reportConstDecoder.bind(hoisted_LevelAndDSettings_0)
}, null);
const hoisted_LevelAndDSettings_6 = new AnyOfConstsDecoder([
    "a",
    "b"
]);
const hoisted_LevelAndDSettings_7 = {
    "d": hoisted_LevelAndDSettings_3.validateObjectValidator.bind(hoisted_LevelAndDSettings_3),
    "level": hoisted_LevelAndDSettings_6.validateAnyOfConstsDecoder.bind(hoisted_LevelAndDSettings_6)
};
const hoisted_LevelAndDSettings_8 = null;
const hoisted_LevelAndDSettings_9 = new ObjectValidator(hoisted_LevelAndDSettings_7, hoisted_LevelAndDSettings_8);
const hoisted_LevelAndDSettings_10 = new ObjectParser({
    "d": hoisted_LevelAndDSettings_4.parseObjectParser.bind(hoisted_LevelAndDSettings_4),
    "level": hoisted_LevelAndDSettings_6.parseAnyOfConstsDecoder.bind(hoisted_LevelAndDSettings_6)
}, null);
const hoisted_LevelAndDSettings_11 = new ObjectReporter(hoisted_LevelAndDSettings_7, hoisted_LevelAndDSettings_8, {
    "d": hoisted_LevelAndDSettings_5.reportObjectReporter.bind(hoisted_LevelAndDSettings_5),
    "level": hoisted_LevelAndDSettings_6.reportAnyOfConstsDecoder.bind(hoisted_LevelAndDSettings_6)
}, null);
const hoisted_PartialSettings_0 = [
    validateNull,
    validateString
];
const hoisted_PartialSettings_1 = new AnyOfValidator(hoisted_PartialSettings_0);
const hoisted_PartialSettings_2 = new AnyOfParser(hoisted_PartialSettings_0, [
    parseIdentity,
    parseIdentity
]);
const hoisted_PartialSettings_3 = new AnyOfReporter(hoisted_PartialSettings_0, [
    reportNull,
    reportString
]);
const hoisted_PartialSettings_4 = new ConstDecoder("d");
const hoisted_PartialSettings_5 = {
    "tag": hoisted_PartialSettings_4.validateConstDecoder.bind(hoisted_PartialSettings_4)
};
const hoisted_PartialSettings_6 = null;
const hoisted_PartialSettings_7 = new ObjectValidator(hoisted_PartialSettings_5, hoisted_PartialSettings_6);
const hoisted_PartialSettings_8 = new ObjectParser({
    "tag": hoisted_PartialSettings_4.parseConstDecoder.bind(hoisted_PartialSettings_4)
}, null);
const hoisted_PartialSettings_9 = new ObjectReporter(hoisted_PartialSettings_5, hoisted_PartialSettings_6, {
    "tag": hoisted_PartialSettings_4.reportConstDecoder.bind(hoisted_PartialSettings_4)
}, null);
const hoisted_PartialSettings_10 = [
    validateNull,
    hoisted_PartialSettings_7.validateObjectValidator.bind(hoisted_PartialSettings_7)
];
const hoisted_PartialSettings_11 = new AnyOfValidator(hoisted_PartialSettings_10);
const hoisted_PartialSettings_12 = new AnyOfParser(hoisted_PartialSettings_10, [
    parseIdentity,
    hoisted_PartialSettings_8.parseObjectParser.bind(hoisted_PartialSettings_8)
]);
const hoisted_PartialSettings_13 = new AnyOfReporter(hoisted_PartialSettings_10, [
    reportNull,
    hoisted_PartialSettings_9.reportObjectReporter.bind(hoisted_PartialSettings_9)
]);
const hoisted_PartialSettings_14 = new ConstDecoder("a");
const hoisted_PartialSettings_15 = new ConstDecoder("b");
const hoisted_PartialSettings_16 = [
    validateNull,
    hoisted_PartialSettings_14.validateConstDecoder.bind(hoisted_PartialSettings_14),
    hoisted_PartialSettings_15.validateConstDecoder.bind(hoisted_PartialSettings_15)
];
const hoisted_PartialSettings_17 = new AnyOfValidator(hoisted_PartialSettings_16);
const hoisted_PartialSettings_18 = new AnyOfParser(hoisted_PartialSettings_16, [
    parseIdentity,
    hoisted_PartialSettings_14.parseConstDecoder.bind(hoisted_PartialSettings_14),
    hoisted_PartialSettings_15.parseConstDecoder.bind(hoisted_PartialSettings_15)
]);
const hoisted_PartialSettings_19 = new AnyOfReporter(hoisted_PartialSettings_16, [
    reportNull,
    hoisted_PartialSettings_14.reportConstDecoder.bind(hoisted_PartialSettings_14),
    hoisted_PartialSettings_15.reportConstDecoder.bind(hoisted_PartialSettings_15)
]);
const hoisted_PartialSettings_20 = {
    "a": hoisted_PartialSettings_1.validateAnyOfValidator.bind(hoisted_PartialSettings_1),
    "d": hoisted_PartialSettings_11.validateAnyOfValidator.bind(hoisted_PartialSettings_11),
    "level": hoisted_PartialSettings_17.validateAnyOfValidator.bind(hoisted_PartialSettings_17)
};
const hoisted_PartialSettings_21 = null;
const hoisted_PartialSettings_22 = new ObjectValidator(hoisted_PartialSettings_20, hoisted_PartialSettings_21);
const hoisted_PartialSettings_23 = new ObjectParser({
    "a": hoisted_PartialSettings_2.parseAnyOfParser.bind(hoisted_PartialSettings_2),
    "d": hoisted_PartialSettings_12.parseAnyOfParser.bind(hoisted_PartialSettings_12),
    "level": hoisted_PartialSettings_18.parseAnyOfParser.bind(hoisted_PartialSettings_18)
}, null);
const hoisted_PartialSettings_24 = new ObjectReporter(hoisted_PartialSettings_20, hoisted_PartialSettings_21, {
    "a": hoisted_PartialSettings_3.reportAnyOfReporter.bind(hoisted_PartialSettings_3),
    "d": hoisted_PartialSettings_13.reportAnyOfReporter.bind(hoisted_PartialSettings_13),
    "level": hoisted_PartialSettings_19.reportAnyOfReporter.bind(hoisted_PartialSettings_19)
}, null);
const hoisted_Extra_0 = {};
const hoisted_Extra_1 = validateString;
const hoisted_Extra_2 = new ObjectValidator(hoisted_Extra_0, hoisted_Extra_1);
const hoisted_Extra_3 = new ObjectParser({}, parseIdentity);
const hoisted_Extra_4 = new ObjectReporter(hoisted_Extra_0, hoisted_Extra_1, {}, reportString);
const hoisted_AvatarSize_0 = new RegexDecoder(/(\d+(\.\d+)?)(x)(\d+(\.\d+)?)/, "${number}x${number}");
const hoisted_User_0 = validators.User;
const hoisted_User_1 = new ArrayValidator(hoisted_User_0);
const hoisted_User_2 = new ArrayParser(parsers.User);
const hoisted_User_3 = new ArrayReporter(hoisted_User_0, reporters.User);
const hoisted_User_4 = {
    "accessLevel": validators.AccessLevel,
    "avatarSize": validators.AvatarSize,
    "extra": validators.Extra,
    "friends": hoisted_User_1.validateArrayValidator.bind(hoisted_User_1),
    "name": validateString
};
const hoisted_User_5 = null;
const hoisted_User_6 = new ObjectValidator(hoisted_User_4, hoisted_User_5);
const hoisted_User_7 = new ObjectParser({
    "accessLevel": parsers.AccessLevel,
    "avatarSize": parsers.AvatarSize,
    "extra": parsers.Extra,
    "friends": hoisted_User_2.parseArrayParser.bind(hoisted_User_2),
    "name": parseIdentity
}, null);
const hoisted_User_8 = new ObjectReporter(hoisted_User_4, hoisted_User_5, {
    "accessLevel": reporters.AccessLevel,
    "avatarSize": reporters.AvatarSize,
    "extra": reporters.Extra,
    "friends": hoisted_User_3.reportArrayReporter.bind(hoisted_User_3),
    "name": reportString
}, null);
const hoisted_PublicUser_0 = {
    "accessLevel": validators.AccessLevel,
    "avatarSize": validators.AvatarSize,
    "extra": validators.Extra,
    "name": validateString
};
const hoisted_PublicUser_1 = null;
const hoisted_PublicUser_2 = new ObjectValidator(hoisted_PublicUser_0, hoisted_PublicUser_1);
const hoisted_PublicUser_3 = new ObjectParser({
    "accessLevel": parsers.AccessLevel,
    "avatarSize": parsers.AvatarSize,
    "extra": parsers.Extra,
    "name": parseIdentity
}, null);
const hoisted_PublicUser_4 = new ObjectReporter(hoisted_PublicUser_0, hoisted_PublicUser_1, {
    "accessLevel": reporters.AccessLevel,
    "avatarSize": reporters.AvatarSize,
    "extra": reporters.Extra,
    "name": reportString
}, null);
const hoisted_Req_0 = {
    "optional": validateString
};
const hoisted_Req_1 = null;
const hoisted_Req_2 = new ObjectValidator(hoisted_Req_0, hoisted_Req_1);
const hoisted_Req_3 = new ObjectParser({
    "optional": parseIdentity
}, null);
const hoisted_Req_4 = new ObjectReporter(hoisted_Req_0, hoisted_Req_1, {
    "optional": reportString
}, null);
const hoisted_WithOptionals_0 = [
    validateNull,
    validateString
];
const hoisted_WithOptionals_1 = new AnyOfValidator(hoisted_WithOptionals_0);
const hoisted_WithOptionals_2 = new AnyOfParser(hoisted_WithOptionals_0, [
    parseIdentity,
    parseIdentity
]);
const hoisted_WithOptionals_3 = new AnyOfReporter(hoisted_WithOptionals_0, [
    reportNull,
    reportString
]);
const hoisted_WithOptionals_4 = {
    "optional": hoisted_WithOptionals_1.validateAnyOfValidator.bind(hoisted_WithOptionals_1)
};
const hoisted_WithOptionals_5 = null;
const hoisted_WithOptionals_6 = new ObjectValidator(hoisted_WithOptionals_4, hoisted_WithOptionals_5);
const hoisted_WithOptionals_7 = new ObjectParser({
    "optional": hoisted_WithOptionals_2.parseAnyOfParser.bind(hoisted_WithOptionals_2)
}, null);
const hoisted_WithOptionals_8 = new ObjectReporter(hoisted_WithOptionals_4, hoisted_WithOptionals_5, {
    "optional": hoisted_WithOptionals_3.reportAnyOfReporter.bind(hoisted_WithOptionals_3)
}, null);
const hoisted_Repro1_0 = [
    validateNull,
    validators.Repro2
];
const hoisted_Repro1_1 = new AnyOfValidator(hoisted_Repro1_0);
const hoisted_Repro1_2 = new AnyOfParser(hoisted_Repro1_0, [
    parseIdentity,
    parsers.Repro2
]);
const hoisted_Repro1_3 = new AnyOfReporter(hoisted_Repro1_0, [
    reportNull,
    reporters.Repro2
]);
const hoisted_Repro1_4 = {
    "sizes": hoisted_Repro1_1.validateAnyOfValidator.bind(hoisted_Repro1_1)
};
const hoisted_Repro1_5 = null;
const hoisted_Repro1_6 = new ObjectValidator(hoisted_Repro1_4, hoisted_Repro1_5);
const hoisted_Repro1_7 = new ObjectParser({
    "sizes": hoisted_Repro1_2.parseAnyOfParser.bind(hoisted_Repro1_2)
}, null);
const hoisted_Repro1_8 = new ObjectReporter(hoisted_Repro1_4, hoisted_Repro1_5, {
    "sizes": hoisted_Repro1_3.reportAnyOfReporter.bind(hoisted_Repro1_3)
}, null);
const hoisted_Repro2_0 = {
    "useSmallerSizes": validateBoolean
};
const hoisted_Repro2_1 = null;
const hoisted_Repro2_2 = new ObjectValidator(hoisted_Repro2_0, hoisted_Repro2_1);
const hoisted_Repro2_3 = new ObjectParser({
    "useSmallerSizes": parseIdentity
}, null);
const hoisted_Repro2_4 = new ObjectReporter(hoisted_Repro2_0, hoisted_Repro2_1, {
    "useSmallerSizes": reportBoolean
}, null);
const hoisted_SettingsUpdate_0 = new ConstDecoder("d");
const hoisted_SettingsUpdate_1 = {
    "tag": hoisted_SettingsUpdate_0.validateConstDecoder.bind(hoisted_SettingsUpdate_0)
};
const hoisted_SettingsUpdate_2 = null;
const hoisted_SettingsUpdate_3 = new ObjectValidator(hoisted_SettingsUpdate_1, hoisted_SettingsUpdate_2);
const hoisted_SettingsUpdate_4 = new ObjectParser({
    "tag": hoisted_SettingsUpdate_0.parseConstDecoder.bind(hoisted_SettingsUpdate_0)
}, null);
const hoisted_SettingsUpdate_5 = new ObjectReporter(hoisted_SettingsUpdate_1, hoisted_SettingsUpdate_2, {
    "tag": hoisted_SettingsUpdate_0.reportConstDecoder.bind(hoisted_SettingsUpdate_0)
}, null);
const hoisted_SettingsUpdate_6 = [
    validateString,
    hoisted_SettingsUpdate_3.validateObjectValidator.bind(hoisted_SettingsUpdate_3)
];
const hoisted_SettingsUpdate_7 = new AnyOfValidator(hoisted_SettingsUpdate_6);
const hoisted_SettingsUpdate_8 = new AnyOfParser(hoisted_SettingsUpdate_6, [
    parseIdentity,
    hoisted_SettingsUpdate_4.parseObjectParser.bind(hoisted_SettingsUpdate_4)
]);
const hoisted_SettingsUpdate_9 = new AnyOfReporter(hoisted_SettingsUpdate_6, [
    reportString,
    hoisted_SettingsUpdate_5.reportObjectReporter.bind(hoisted_SettingsUpdate_5)
]);
const hoisted_Mapped_0 = new ConstDecoder("a");
const hoisted_Mapped_1 = {
    "value": hoisted_Mapped_0.validateConstDecoder.bind(hoisted_Mapped_0)
};
const hoisted_Mapped_2 = null;
const hoisted_Mapped_3 = new ObjectValidator(hoisted_Mapped_1, hoisted_Mapped_2);
const hoisted_Mapped_4 = new ObjectParser({
    "value": hoisted_Mapped_0.parseConstDecoder.bind(hoisted_Mapped_0)
}, null);
const hoisted_Mapped_5 = new ObjectReporter(hoisted_Mapped_1, hoisted_Mapped_2, {
    "value": hoisted_Mapped_0.reportConstDecoder.bind(hoisted_Mapped_0)
}, null);
const hoisted_Mapped_6 = new ConstDecoder("b");
const hoisted_Mapped_7 = {
    "value": hoisted_Mapped_6.validateConstDecoder.bind(hoisted_Mapped_6)
};
const hoisted_Mapped_8 = null;
const hoisted_Mapped_9 = new ObjectValidator(hoisted_Mapped_7, hoisted_Mapped_8);
const hoisted_Mapped_10 = new ObjectParser({
    "value": hoisted_Mapped_6.parseConstDecoder.bind(hoisted_Mapped_6)
}, null);
const hoisted_Mapped_11 = new ObjectReporter(hoisted_Mapped_7, hoisted_Mapped_8, {
    "value": hoisted_Mapped_6.reportConstDecoder.bind(hoisted_Mapped_6)
}, null);
const hoisted_Mapped_12 = {
    "a": hoisted_Mapped_3.validateObjectValidator.bind(hoisted_Mapped_3),
    "b": hoisted_Mapped_9.validateObjectValidator.bind(hoisted_Mapped_9)
};
const hoisted_Mapped_13 = null;
const hoisted_Mapped_14 = new ObjectValidator(hoisted_Mapped_12, hoisted_Mapped_13);
const hoisted_Mapped_15 = new ObjectParser({
    "a": hoisted_Mapped_4.parseObjectParser.bind(hoisted_Mapped_4),
    "b": hoisted_Mapped_10.parseObjectParser.bind(hoisted_Mapped_10)
}, null);
const hoisted_Mapped_16 = new ObjectReporter(hoisted_Mapped_12, hoisted_Mapped_13, {
    "a": hoisted_Mapped_5.reportObjectReporter.bind(hoisted_Mapped_5),
    "b": hoisted_Mapped_11.reportObjectReporter.bind(hoisted_Mapped_11)
}, null);
const hoisted_MappedOptional_0 = new ConstDecoder("a");
const hoisted_MappedOptional_1 = {
    "value": hoisted_MappedOptional_0.validateConstDecoder.bind(hoisted_MappedOptional_0)
};
const hoisted_MappedOptional_2 = null;
const hoisted_MappedOptional_3 = new ObjectValidator(hoisted_MappedOptional_1, hoisted_MappedOptional_2);
const hoisted_MappedOptional_4 = new ObjectParser({
    "value": hoisted_MappedOptional_0.parseConstDecoder.bind(hoisted_MappedOptional_0)
}, null);
const hoisted_MappedOptional_5 = new ObjectReporter(hoisted_MappedOptional_1, hoisted_MappedOptional_2, {
    "value": hoisted_MappedOptional_0.reportConstDecoder.bind(hoisted_MappedOptional_0)
}, null);
const hoisted_MappedOptional_6 = [
    validateNull,
    hoisted_MappedOptional_3.validateObjectValidator.bind(hoisted_MappedOptional_3)
];
const hoisted_MappedOptional_7 = new AnyOfValidator(hoisted_MappedOptional_6);
const hoisted_MappedOptional_8 = new AnyOfParser(hoisted_MappedOptional_6, [
    parseIdentity,
    hoisted_MappedOptional_4.parseObjectParser.bind(hoisted_MappedOptional_4)
]);
const hoisted_MappedOptional_9 = new AnyOfReporter(hoisted_MappedOptional_6, [
    reportNull,
    hoisted_MappedOptional_5.reportObjectReporter.bind(hoisted_MappedOptional_5)
]);
const hoisted_MappedOptional_10 = new ConstDecoder("b");
const hoisted_MappedOptional_11 = {
    "value": hoisted_MappedOptional_10.validateConstDecoder.bind(hoisted_MappedOptional_10)
};
const hoisted_MappedOptional_12 = null;
const hoisted_MappedOptional_13 = new ObjectValidator(hoisted_MappedOptional_11, hoisted_MappedOptional_12);
const hoisted_MappedOptional_14 = new ObjectParser({
    "value": hoisted_MappedOptional_10.parseConstDecoder.bind(hoisted_MappedOptional_10)
}, null);
const hoisted_MappedOptional_15 = new ObjectReporter(hoisted_MappedOptional_11, hoisted_MappedOptional_12, {
    "value": hoisted_MappedOptional_10.reportConstDecoder.bind(hoisted_MappedOptional_10)
}, null);
const hoisted_MappedOptional_16 = [
    validateNull,
    hoisted_MappedOptional_13.validateObjectValidator.bind(hoisted_MappedOptional_13)
];
const hoisted_MappedOptional_17 = new AnyOfValidator(hoisted_MappedOptional_16);
const hoisted_MappedOptional_18 = new AnyOfParser(hoisted_MappedOptional_16, [
    parseIdentity,
    hoisted_MappedOptional_14.parseObjectParser.bind(hoisted_MappedOptional_14)
]);
const hoisted_MappedOptional_19 = new AnyOfReporter(hoisted_MappedOptional_16, [
    reportNull,
    hoisted_MappedOptional_15.reportObjectReporter.bind(hoisted_MappedOptional_15)
]);
const hoisted_MappedOptional_20 = {
    "a": hoisted_MappedOptional_7.validateAnyOfValidator.bind(hoisted_MappedOptional_7),
    "b": hoisted_MappedOptional_17.validateAnyOfValidator.bind(hoisted_MappedOptional_17)
};
const hoisted_MappedOptional_21 = null;
const hoisted_MappedOptional_22 = new ObjectValidator(hoisted_MappedOptional_20, hoisted_MappedOptional_21);
const hoisted_MappedOptional_23 = new ObjectParser({
    "a": hoisted_MappedOptional_8.parseAnyOfParser.bind(hoisted_MappedOptional_8),
    "b": hoisted_MappedOptional_18.parseAnyOfParser.bind(hoisted_MappedOptional_18)
}, null);
const hoisted_MappedOptional_24 = new ObjectReporter(hoisted_MappedOptional_20, hoisted_MappedOptional_21, {
    "a": hoisted_MappedOptional_9.reportAnyOfReporter.bind(hoisted_MappedOptional_9),
    "b": hoisted_MappedOptional_19.reportAnyOfReporter.bind(hoisted_MappedOptional_19)
}, null);
const hoisted_DiscriminatedUnion_0 = [
    validateNull,
    validateString
];
const hoisted_DiscriminatedUnion_1 = new AnyOfValidator(hoisted_DiscriminatedUnion_0);
const hoisted_DiscriminatedUnion_2 = new AnyOfParser(hoisted_DiscriminatedUnion_0, [
    parseIdentity,
    parseIdentity
]);
const hoisted_DiscriminatedUnion_3 = new AnyOfReporter(hoisted_DiscriminatedUnion_0, [
    reportNull,
    reportString
]);
const hoisted_DiscriminatedUnion_4 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion_5 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion_6 = {
    "a1": validateString,
    "a11": hoisted_DiscriminatedUnion_1.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion_1),
    "subType": hoisted_DiscriminatedUnion_4.validateConstDecoder.bind(hoisted_DiscriminatedUnion_4),
    "type": hoisted_DiscriminatedUnion_5.validateConstDecoder.bind(hoisted_DiscriminatedUnion_5)
};
const hoisted_DiscriminatedUnion_7 = null;
const hoisted_DiscriminatedUnion_8 = new ObjectValidator(hoisted_DiscriminatedUnion_6, hoisted_DiscriminatedUnion_7);
const hoisted_DiscriminatedUnion_9 = new ObjectParser({
    "a1": parseIdentity,
    "a11": hoisted_DiscriminatedUnion_2.parseAnyOfParser.bind(hoisted_DiscriminatedUnion_2),
    "subType": hoisted_DiscriminatedUnion_4.parseConstDecoder.bind(hoisted_DiscriminatedUnion_4),
    "type": hoisted_DiscriminatedUnion_5.parseConstDecoder.bind(hoisted_DiscriminatedUnion_5)
}, null);
const hoisted_DiscriminatedUnion_10 = new ObjectReporter(hoisted_DiscriminatedUnion_6, hoisted_DiscriminatedUnion_7, {
    "a1": reportString,
    "a11": hoisted_DiscriminatedUnion_3.reportAnyOfReporter.bind(hoisted_DiscriminatedUnion_3),
    "subType": hoisted_DiscriminatedUnion_4.reportConstDecoder.bind(hoisted_DiscriminatedUnion_4),
    "type": hoisted_DiscriminatedUnion_5.reportConstDecoder.bind(hoisted_DiscriminatedUnion_5)
}, null);
const hoisted_DiscriminatedUnion_11 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion_12 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion_13 = {
    "a2": validateString,
    "subType": hoisted_DiscriminatedUnion_11.validateConstDecoder.bind(hoisted_DiscriminatedUnion_11),
    "type": hoisted_DiscriminatedUnion_12.validateConstDecoder.bind(hoisted_DiscriminatedUnion_12)
};
const hoisted_DiscriminatedUnion_14 = null;
const hoisted_DiscriminatedUnion_15 = new ObjectValidator(hoisted_DiscriminatedUnion_13, hoisted_DiscriminatedUnion_14);
const hoisted_DiscriminatedUnion_16 = new ObjectParser({
    "a2": parseIdentity,
    "subType": hoisted_DiscriminatedUnion_11.parseConstDecoder.bind(hoisted_DiscriminatedUnion_11),
    "type": hoisted_DiscriminatedUnion_12.parseConstDecoder.bind(hoisted_DiscriminatedUnion_12)
}, null);
const hoisted_DiscriminatedUnion_17 = new ObjectReporter(hoisted_DiscriminatedUnion_13, hoisted_DiscriminatedUnion_14, {
    "a2": reportString,
    "subType": hoisted_DiscriminatedUnion_11.reportConstDecoder.bind(hoisted_DiscriminatedUnion_11),
    "type": hoisted_DiscriminatedUnion_12.reportConstDecoder.bind(hoisted_DiscriminatedUnion_12)
}, null);
const hoisted_DiscriminatedUnion_18 = new AnyOfDiscriminatedValidator("subType", {
    "a1": hoisted_DiscriminatedUnion_8.validateObjectValidator.bind(hoisted_DiscriminatedUnion_8),
    "a2": hoisted_DiscriminatedUnion_15.validateObjectValidator.bind(hoisted_DiscriminatedUnion_15)
});
const hoisted_DiscriminatedUnion_19 = new AnyOfDiscriminatedParser("subType", {
    "a1": hoisted_DiscriminatedUnion_9.parseObjectParser.bind(hoisted_DiscriminatedUnion_9),
    "a2": hoisted_DiscriminatedUnion_16.parseObjectParser.bind(hoisted_DiscriminatedUnion_16)
});
const hoisted_DiscriminatedUnion_20 = new AnyOfDiscriminatedReporter("subType", {
    "a1": hoisted_DiscriminatedUnion_10.reportObjectReporter.bind(hoisted_DiscriminatedUnion_10),
    "a2": hoisted_DiscriminatedUnion_17.reportObjectReporter.bind(hoisted_DiscriminatedUnion_17)
});
const hoisted_DiscriminatedUnion_21 = new ConstDecoder("b");
const hoisted_DiscriminatedUnion_22 = {
    "type": hoisted_DiscriminatedUnion_21.validateConstDecoder.bind(hoisted_DiscriminatedUnion_21),
    "value": validateNumber
};
const hoisted_DiscriminatedUnion_23 = null;
const hoisted_DiscriminatedUnion_24 = new ObjectValidator(hoisted_DiscriminatedUnion_22, hoisted_DiscriminatedUnion_23);
const hoisted_DiscriminatedUnion_25 = new ObjectParser({
    "type": hoisted_DiscriminatedUnion_21.parseConstDecoder.bind(hoisted_DiscriminatedUnion_21),
    "value": parseIdentity
}, null);
const hoisted_DiscriminatedUnion_26 = new ObjectReporter(hoisted_DiscriminatedUnion_22, hoisted_DiscriminatedUnion_23, {
    "type": hoisted_DiscriminatedUnion_21.reportConstDecoder.bind(hoisted_DiscriminatedUnion_21),
    "value": reportNumber
}, null);
const hoisted_DiscriminatedUnion_27 = new AnyOfDiscriminatedValidator("type", {
    "a": hoisted_DiscriminatedUnion_18.validateAnyOfDiscriminatedValidator.bind(hoisted_DiscriminatedUnion_18),
    "b": hoisted_DiscriminatedUnion_24.validateObjectValidator.bind(hoisted_DiscriminatedUnion_24)
});
const hoisted_DiscriminatedUnion_28 = new AnyOfDiscriminatedParser("type", {
    "a": hoisted_DiscriminatedUnion_19.parseAnyOfDiscriminatedParser.bind(hoisted_DiscriminatedUnion_19),
    "b": hoisted_DiscriminatedUnion_25.parseObjectParser.bind(hoisted_DiscriminatedUnion_25)
});
const hoisted_DiscriminatedUnion_29 = new AnyOfDiscriminatedReporter("type", {
    "a": hoisted_DiscriminatedUnion_20.reportAnyOfDiscriminatedReporter.bind(hoisted_DiscriminatedUnion_20),
    "b": hoisted_DiscriminatedUnion_26.reportObjectReporter.bind(hoisted_DiscriminatedUnion_26)
});
const hoisted_DiscriminatedUnion2_0 = [
    validateNull,
    validateString
];
const hoisted_DiscriminatedUnion2_1 = new AnyOfValidator(hoisted_DiscriminatedUnion2_0);
const hoisted_DiscriminatedUnion2_2 = new AnyOfParser(hoisted_DiscriminatedUnion2_0, [
    parseIdentity,
    parseIdentity
]);
const hoisted_DiscriminatedUnion2_3 = new AnyOfReporter(hoisted_DiscriminatedUnion2_0, [
    reportNull,
    reportString
]);
const hoisted_DiscriminatedUnion2_4 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion2_5 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion2_6 = {
    "a1": validateString,
    "a11": hoisted_DiscriminatedUnion2_1.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion2_1),
    "subType": hoisted_DiscriminatedUnion2_4.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_4),
    "type": hoisted_DiscriminatedUnion2_5.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_5)
};
const hoisted_DiscriminatedUnion2_7 = null;
const hoisted_DiscriminatedUnion2_8 = new ObjectValidator(hoisted_DiscriminatedUnion2_6, hoisted_DiscriminatedUnion2_7);
const hoisted_DiscriminatedUnion2_9 = new ObjectParser({
    "a1": parseIdentity,
    "a11": hoisted_DiscriminatedUnion2_2.parseAnyOfParser.bind(hoisted_DiscriminatedUnion2_2),
    "subType": hoisted_DiscriminatedUnion2_4.parseConstDecoder.bind(hoisted_DiscriminatedUnion2_4),
    "type": hoisted_DiscriminatedUnion2_5.parseConstDecoder.bind(hoisted_DiscriminatedUnion2_5)
}, null);
const hoisted_DiscriminatedUnion2_10 = new ObjectReporter(hoisted_DiscriminatedUnion2_6, hoisted_DiscriminatedUnion2_7, {
    "a1": reportString,
    "a11": hoisted_DiscriminatedUnion2_3.reportAnyOfReporter.bind(hoisted_DiscriminatedUnion2_3),
    "subType": hoisted_DiscriminatedUnion2_4.reportConstDecoder.bind(hoisted_DiscriminatedUnion2_4),
    "type": hoisted_DiscriminatedUnion2_5.reportConstDecoder.bind(hoisted_DiscriminatedUnion2_5)
}, null);
const hoisted_DiscriminatedUnion2_11 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion2_12 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion2_13 = {
    "a2": validateString,
    "subType": hoisted_DiscriminatedUnion2_11.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_11),
    "type": hoisted_DiscriminatedUnion2_12.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_12)
};
const hoisted_DiscriminatedUnion2_14 = null;
const hoisted_DiscriminatedUnion2_15 = new ObjectValidator(hoisted_DiscriminatedUnion2_13, hoisted_DiscriminatedUnion2_14);
const hoisted_DiscriminatedUnion2_16 = new ObjectParser({
    "a2": parseIdentity,
    "subType": hoisted_DiscriminatedUnion2_11.parseConstDecoder.bind(hoisted_DiscriminatedUnion2_11),
    "type": hoisted_DiscriminatedUnion2_12.parseConstDecoder.bind(hoisted_DiscriminatedUnion2_12)
}, null);
const hoisted_DiscriminatedUnion2_17 = new ObjectReporter(hoisted_DiscriminatedUnion2_13, hoisted_DiscriminatedUnion2_14, {
    "a2": reportString,
    "subType": hoisted_DiscriminatedUnion2_11.reportConstDecoder.bind(hoisted_DiscriminatedUnion2_11),
    "type": hoisted_DiscriminatedUnion2_12.reportConstDecoder.bind(hoisted_DiscriminatedUnion2_12)
}, null);
const hoisted_DiscriminatedUnion2_18 = new ConstDecoder("d");
const hoisted_DiscriminatedUnion2_19 = [
    validateNull,
    hoisted_DiscriminatedUnion2_18.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_18)
];
const hoisted_DiscriminatedUnion2_20 = new AnyOfValidator(hoisted_DiscriminatedUnion2_19);
const hoisted_DiscriminatedUnion2_21 = new AnyOfParser(hoisted_DiscriminatedUnion2_19, [
    parseIdentity,
    hoisted_DiscriminatedUnion2_18.parseConstDecoder.bind(hoisted_DiscriminatedUnion2_18)
]);
const hoisted_DiscriminatedUnion2_22 = new AnyOfReporter(hoisted_DiscriminatedUnion2_19, [
    reportNull,
    hoisted_DiscriminatedUnion2_18.reportConstDecoder.bind(hoisted_DiscriminatedUnion2_18)
]);
const hoisted_DiscriminatedUnion2_23 = {
    "type": hoisted_DiscriminatedUnion2_20.validateAnyOfValidator.bind(hoisted_DiscriminatedUnion2_20),
    "valueD": validateNumber
};
const hoisted_DiscriminatedUnion2_24 = null;
const hoisted_DiscriminatedUnion2_25 = new ObjectValidator(hoisted_DiscriminatedUnion2_23, hoisted_DiscriminatedUnion2_24);
const hoisted_DiscriminatedUnion2_26 = new ObjectParser({
    "type": hoisted_DiscriminatedUnion2_21.parseAnyOfParser.bind(hoisted_DiscriminatedUnion2_21),
    "valueD": parseIdentity
}, null);
const hoisted_DiscriminatedUnion2_27 = new ObjectReporter(hoisted_DiscriminatedUnion2_23, hoisted_DiscriminatedUnion2_24, {
    "type": hoisted_DiscriminatedUnion2_22.reportAnyOfReporter.bind(hoisted_DiscriminatedUnion2_22),
    "valueD": reportNumber
}, null);
const hoisted_DiscriminatedUnion2_28 = new ConstDecoder("b");
const hoisted_DiscriminatedUnion2_29 = {
    "type": hoisted_DiscriminatedUnion2_28.validateConstDecoder.bind(hoisted_DiscriminatedUnion2_28),
    "value": validateNumber
};
const hoisted_DiscriminatedUnion2_30 = null;
const hoisted_DiscriminatedUnion2_31 = new ObjectValidator(hoisted_DiscriminatedUnion2_29, hoisted_DiscriminatedUnion2_30);
const hoisted_DiscriminatedUnion2_32 = new ObjectParser({
    "type": hoisted_DiscriminatedUnion2_28.parseConstDecoder.bind(hoisted_DiscriminatedUnion2_28),
    "value": parseIdentity
}, null);
const hoisted_DiscriminatedUnion2_33 = new ObjectReporter(hoisted_DiscriminatedUnion2_29, hoisted_DiscriminatedUnion2_30, {
    "type": hoisted_DiscriminatedUnion2_28.reportConstDecoder.bind(hoisted_DiscriminatedUnion2_28),
    "value": reportNumber
}, null);
const hoisted_DiscriminatedUnion2_34 = [
    hoisted_DiscriminatedUnion2_8.validateObjectValidator.bind(hoisted_DiscriminatedUnion2_8),
    hoisted_DiscriminatedUnion2_15.validateObjectValidator.bind(hoisted_DiscriminatedUnion2_15),
    hoisted_DiscriminatedUnion2_25.validateObjectValidator.bind(hoisted_DiscriminatedUnion2_25),
    hoisted_DiscriminatedUnion2_31.validateObjectValidator.bind(hoisted_DiscriminatedUnion2_31)
];
const hoisted_DiscriminatedUnion2_35 = new AnyOfValidator(hoisted_DiscriminatedUnion2_34);
const hoisted_DiscriminatedUnion2_36 = new AnyOfParser(hoisted_DiscriminatedUnion2_34, [
    hoisted_DiscriminatedUnion2_9.parseObjectParser.bind(hoisted_DiscriminatedUnion2_9),
    hoisted_DiscriminatedUnion2_16.parseObjectParser.bind(hoisted_DiscriminatedUnion2_16),
    hoisted_DiscriminatedUnion2_26.parseObjectParser.bind(hoisted_DiscriminatedUnion2_26),
    hoisted_DiscriminatedUnion2_32.parseObjectParser.bind(hoisted_DiscriminatedUnion2_32)
]);
const hoisted_DiscriminatedUnion2_37 = new AnyOfReporter(hoisted_DiscriminatedUnion2_34, [
    hoisted_DiscriminatedUnion2_10.reportObjectReporter.bind(hoisted_DiscriminatedUnion2_10),
    hoisted_DiscriminatedUnion2_17.reportObjectReporter.bind(hoisted_DiscriminatedUnion2_17),
    hoisted_DiscriminatedUnion2_27.reportObjectReporter.bind(hoisted_DiscriminatedUnion2_27),
    hoisted_DiscriminatedUnion2_33.reportObjectReporter.bind(hoisted_DiscriminatedUnion2_33)
]);
const hoisted_DiscriminatedUnion3_0 = new AnyOfConstsDecoder([
    "a",
    "c"
]);
const hoisted_DiscriminatedUnion3_1 = {
    "a1": validateString,
    "type": hoisted_DiscriminatedUnion3_0.validateAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_0)
};
const hoisted_DiscriminatedUnion3_2 = null;
const hoisted_DiscriminatedUnion3_3 = new ObjectValidator(hoisted_DiscriminatedUnion3_1, hoisted_DiscriminatedUnion3_2);
const hoisted_DiscriminatedUnion3_4 = new ObjectParser({
    "a1": parseIdentity,
    "type": hoisted_DiscriminatedUnion3_0.parseAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_0)
}, null);
const hoisted_DiscriminatedUnion3_5 = new ObjectReporter(hoisted_DiscriminatedUnion3_1, hoisted_DiscriminatedUnion3_2, {
    "a1": reportString,
    "type": hoisted_DiscriminatedUnion3_0.reportAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_0)
}, null);
const hoisted_DiscriminatedUnion3_6 = new ConstDecoder("b");
const hoisted_DiscriminatedUnion3_7 = {
    "type": hoisted_DiscriminatedUnion3_6.validateConstDecoder.bind(hoisted_DiscriminatedUnion3_6),
    "value": validateNumber
};
const hoisted_DiscriminatedUnion3_8 = null;
const hoisted_DiscriminatedUnion3_9 = new ObjectValidator(hoisted_DiscriminatedUnion3_7, hoisted_DiscriminatedUnion3_8);
const hoisted_DiscriminatedUnion3_10 = new ObjectParser({
    "type": hoisted_DiscriminatedUnion3_6.parseConstDecoder.bind(hoisted_DiscriminatedUnion3_6),
    "value": parseIdentity
}, null);
const hoisted_DiscriminatedUnion3_11 = new ObjectReporter(hoisted_DiscriminatedUnion3_7, hoisted_DiscriminatedUnion3_8, {
    "type": hoisted_DiscriminatedUnion3_6.reportConstDecoder.bind(hoisted_DiscriminatedUnion3_6),
    "value": reportNumber
}, null);
const hoisted_DiscriminatedUnion3_12 = new AnyOfConstsDecoder([
    "a",
    "c"
]);
const hoisted_DiscriminatedUnion3_13 = {
    "a1": validateString,
    "type": hoisted_DiscriminatedUnion3_12.validateAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_12)
};
const hoisted_DiscriminatedUnion3_14 = null;
const hoisted_DiscriminatedUnion3_15 = new ObjectValidator(hoisted_DiscriminatedUnion3_13, hoisted_DiscriminatedUnion3_14);
const hoisted_DiscriminatedUnion3_16 = new ObjectParser({
    "a1": parseIdentity,
    "type": hoisted_DiscriminatedUnion3_12.parseAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_12)
}, null);
const hoisted_DiscriminatedUnion3_17 = new ObjectReporter(hoisted_DiscriminatedUnion3_13, hoisted_DiscriminatedUnion3_14, {
    "a1": reportString,
    "type": hoisted_DiscriminatedUnion3_12.reportAnyOfConstsDecoder.bind(hoisted_DiscriminatedUnion3_12)
}, null);
const hoisted_DiscriminatedUnion3_18 = new AnyOfDiscriminatedValidator("type", {
    "a": hoisted_DiscriminatedUnion3_3.validateObjectValidator.bind(hoisted_DiscriminatedUnion3_3),
    "b": hoisted_DiscriminatedUnion3_9.validateObjectValidator.bind(hoisted_DiscriminatedUnion3_9),
    "c": hoisted_DiscriminatedUnion3_15.validateObjectValidator.bind(hoisted_DiscriminatedUnion3_15)
});
const hoisted_DiscriminatedUnion3_19 = new AnyOfDiscriminatedParser("type", {
    "a": hoisted_DiscriminatedUnion3_4.parseObjectParser.bind(hoisted_DiscriminatedUnion3_4),
    "b": hoisted_DiscriminatedUnion3_10.parseObjectParser.bind(hoisted_DiscriminatedUnion3_10),
    "c": hoisted_DiscriminatedUnion3_16.parseObjectParser.bind(hoisted_DiscriminatedUnion3_16)
});
const hoisted_DiscriminatedUnion3_20 = new AnyOfDiscriminatedReporter("type", {
    "a": hoisted_DiscriminatedUnion3_5.reportObjectReporter.bind(hoisted_DiscriminatedUnion3_5),
    "b": hoisted_DiscriminatedUnion3_11.reportObjectReporter.bind(hoisted_DiscriminatedUnion3_11),
    "c": hoisted_DiscriminatedUnion3_17.reportObjectReporter.bind(hoisted_DiscriminatedUnion3_17)
});
const hoisted_DiscriminatedUnion4_0 = new ConstDecoder("a1");
const hoisted_DiscriminatedUnion4_1 = {
    "a1": validateString,
    "subType": hoisted_DiscriminatedUnion4_0.validateConstDecoder.bind(hoisted_DiscriminatedUnion4_0)
};
const hoisted_DiscriminatedUnion4_2 = null;
const hoisted_DiscriminatedUnion4_3 = new ObjectValidator(hoisted_DiscriminatedUnion4_1, hoisted_DiscriminatedUnion4_2);
const hoisted_DiscriminatedUnion4_4 = new ObjectParser({
    "a1": parseIdentity,
    "subType": hoisted_DiscriminatedUnion4_0.parseConstDecoder.bind(hoisted_DiscriminatedUnion4_0)
}, null);
const hoisted_DiscriminatedUnion4_5 = new ObjectReporter(hoisted_DiscriminatedUnion4_1, hoisted_DiscriminatedUnion4_2, {
    "a1": reportString,
    "subType": hoisted_DiscriminatedUnion4_0.reportConstDecoder.bind(hoisted_DiscriminatedUnion4_0)
}, null);
const hoisted_DiscriminatedUnion4_6 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion4_7 = {
    "a": hoisted_DiscriminatedUnion4_3.validateObjectValidator.bind(hoisted_DiscriminatedUnion4_3),
    "type": hoisted_DiscriminatedUnion4_6.validateConstDecoder.bind(hoisted_DiscriminatedUnion4_6)
};
const hoisted_DiscriminatedUnion4_8 = null;
const hoisted_DiscriminatedUnion4_9 = new ObjectValidator(hoisted_DiscriminatedUnion4_7, hoisted_DiscriminatedUnion4_8);
const hoisted_DiscriminatedUnion4_10 = new ObjectParser({
    "a": hoisted_DiscriminatedUnion4_4.parseObjectParser.bind(hoisted_DiscriminatedUnion4_4),
    "type": hoisted_DiscriminatedUnion4_6.parseConstDecoder.bind(hoisted_DiscriminatedUnion4_6)
}, null);
const hoisted_DiscriminatedUnion4_11 = new ObjectReporter(hoisted_DiscriminatedUnion4_7, hoisted_DiscriminatedUnion4_8, {
    "a": hoisted_DiscriminatedUnion4_5.reportObjectReporter.bind(hoisted_DiscriminatedUnion4_5),
    "type": hoisted_DiscriminatedUnion4_6.reportConstDecoder.bind(hoisted_DiscriminatedUnion4_6)
}, null);
const hoisted_DiscriminatedUnion4_12 = new ConstDecoder("a2");
const hoisted_DiscriminatedUnion4_13 = {
    "a2": validateString,
    "subType": hoisted_DiscriminatedUnion4_12.validateConstDecoder.bind(hoisted_DiscriminatedUnion4_12)
};
const hoisted_DiscriminatedUnion4_14 = null;
const hoisted_DiscriminatedUnion4_15 = new ObjectValidator(hoisted_DiscriminatedUnion4_13, hoisted_DiscriminatedUnion4_14);
const hoisted_DiscriminatedUnion4_16 = new ObjectParser({
    "a2": parseIdentity,
    "subType": hoisted_DiscriminatedUnion4_12.parseConstDecoder.bind(hoisted_DiscriminatedUnion4_12)
}, null);
const hoisted_DiscriminatedUnion4_17 = new ObjectReporter(hoisted_DiscriminatedUnion4_13, hoisted_DiscriminatedUnion4_14, {
    "a2": reportString,
    "subType": hoisted_DiscriminatedUnion4_12.reportConstDecoder.bind(hoisted_DiscriminatedUnion4_12)
}, null);
const hoisted_DiscriminatedUnion4_18 = new ConstDecoder("a");
const hoisted_DiscriminatedUnion4_19 = {
    "a": hoisted_DiscriminatedUnion4_15.validateObjectValidator.bind(hoisted_DiscriminatedUnion4_15),
    "type": hoisted_DiscriminatedUnion4_18.validateConstDecoder.bind(hoisted_DiscriminatedUnion4_18)
};
const hoisted_DiscriminatedUnion4_20 = null;
const hoisted_DiscriminatedUnion4_21 = new ObjectValidator(hoisted_DiscriminatedUnion4_19, hoisted_DiscriminatedUnion4_20);
const hoisted_DiscriminatedUnion4_22 = new ObjectParser({
    "a": hoisted_DiscriminatedUnion4_16.parseObjectParser.bind(hoisted_DiscriminatedUnion4_16),
    "type": hoisted_DiscriminatedUnion4_18.parseConstDecoder.bind(hoisted_DiscriminatedUnion4_18)
}, null);
const hoisted_DiscriminatedUnion4_23 = new ObjectReporter(hoisted_DiscriminatedUnion4_19, hoisted_DiscriminatedUnion4_20, {
    "a": hoisted_DiscriminatedUnion4_17.reportObjectReporter.bind(hoisted_DiscriminatedUnion4_17),
    "type": hoisted_DiscriminatedUnion4_18.reportConstDecoder.bind(hoisted_DiscriminatedUnion4_18)
}, null);
const hoisted_DiscriminatedUnion4_24 = [
    hoisted_DiscriminatedUnion4_9.validateObjectValidator.bind(hoisted_DiscriminatedUnion4_9),
    hoisted_DiscriminatedUnion4_21.validateObjectValidator.bind(hoisted_DiscriminatedUnion4_21)
];
const hoisted_DiscriminatedUnion4_25 = new AnyOfValidator(hoisted_DiscriminatedUnion4_24);
const hoisted_DiscriminatedUnion4_26 = new AnyOfParser(hoisted_DiscriminatedUnion4_24, [
    hoisted_DiscriminatedUnion4_10.parseObjectParser.bind(hoisted_DiscriminatedUnion4_10),
    hoisted_DiscriminatedUnion4_22.parseObjectParser.bind(hoisted_DiscriminatedUnion4_22)
]);
const hoisted_DiscriminatedUnion4_27 = new AnyOfReporter(hoisted_DiscriminatedUnion4_24, [
    hoisted_DiscriminatedUnion4_11.reportObjectReporter.bind(hoisted_DiscriminatedUnion4_11),
    hoisted_DiscriminatedUnion4_23.reportObjectReporter.bind(hoisted_DiscriminatedUnion4_23)
]);
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
const hoisted_UnionWithEnumAccess_2 = null;
const hoisted_UnionWithEnumAccess_3 = new ObjectValidator(hoisted_UnionWithEnumAccess_1, hoisted_UnionWithEnumAccess_2);
const hoisted_UnionWithEnumAccess_4 = new ObjectParser({
    "tag": hoisted_UnionWithEnumAccess_0.parseConstDecoder.bind(hoisted_UnionWithEnumAccess_0),
    "value": parseIdentity
}, null);
const hoisted_UnionWithEnumAccess_5 = new ObjectReporter(hoisted_UnionWithEnumAccess_1, hoisted_UnionWithEnumAccess_2, {
    "tag": hoisted_UnionWithEnumAccess_0.reportConstDecoder.bind(hoisted_UnionWithEnumAccess_0),
    "value": reportString
}, null);
const hoisted_UnionWithEnumAccess_6 = new ConstDecoder("b");
const hoisted_UnionWithEnumAccess_7 = {
    "tag": hoisted_UnionWithEnumAccess_6.validateConstDecoder.bind(hoisted_UnionWithEnumAccess_6),
    "value": validateNumber
};
const hoisted_UnionWithEnumAccess_8 = null;
const hoisted_UnionWithEnumAccess_9 = new ObjectValidator(hoisted_UnionWithEnumAccess_7, hoisted_UnionWithEnumAccess_8);
const hoisted_UnionWithEnumAccess_10 = new ObjectParser({
    "tag": hoisted_UnionWithEnumAccess_6.parseConstDecoder.bind(hoisted_UnionWithEnumAccess_6),
    "value": parseIdentity
}, null);
const hoisted_UnionWithEnumAccess_11 = new ObjectReporter(hoisted_UnionWithEnumAccess_7, hoisted_UnionWithEnumAccess_8, {
    "tag": hoisted_UnionWithEnumAccess_6.reportConstDecoder.bind(hoisted_UnionWithEnumAccess_6),
    "value": reportNumber
}, null);
const hoisted_UnionWithEnumAccess_12 = new ConstDecoder("c");
const hoisted_UnionWithEnumAccess_13 = {
    "tag": hoisted_UnionWithEnumAccess_12.validateConstDecoder.bind(hoisted_UnionWithEnumAccess_12),
    "value": validateBoolean
};
const hoisted_UnionWithEnumAccess_14 = null;
const hoisted_UnionWithEnumAccess_15 = new ObjectValidator(hoisted_UnionWithEnumAccess_13, hoisted_UnionWithEnumAccess_14);
const hoisted_UnionWithEnumAccess_16 = new ObjectParser({
    "tag": hoisted_UnionWithEnumAccess_12.parseConstDecoder.bind(hoisted_UnionWithEnumAccess_12),
    "value": parseIdentity
}, null);
const hoisted_UnionWithEnumAccess_17 = new ObjectReporter(hoisted_UnionWithEnumAccess_13, hoisted_UnionWithEnumAccess_14, {
    "tag": hoisted_UnionWithEnumAccess_12.reportConstDecoder.bind(hoisted_UnionWithEnumAccess_12),
    "value": reportBoolean
}, null);
const hoisted_UnionWithEnumAccess_18 = new AnyOfDiscriminatedValidator("tag", {
    "a": hoisted_UnionWithEnumAccess_3.validateObjectValidator.bind(hoisted_UnionWithEnumAccess_3),
    "b": hoisted_UnionWithEnumAccess_9.validateObjectValidator.bind(hoisted_UnionWithEnumAccess_9),
    "c": hoisted_UnionWithEnumAccess_15.validateObjectValidator.bind(hoisted_UnionWithEnumAccess_15)
});
const hoisted_UnionWithEnumAccess_19 = new AnyOfDiscriminatedParser("tag", {
    "a": hoisted_UnionWithEnumAccess_4.parseObjectParser.bind(hoisted_UnionWithEnumAccess_4),
    "b": hoisted_UnionWithEnumAccess_10.parseObjectParser.bind(hoisted_UnionWithEnumAccess_10),
    "c": hoisted_UnionWithEnumAccess_16.parseObjectParser.bind(hoisted_UnionWithEnumAccess_16)
});
const hoisted_UnionWithEnumAccess_20 = new AnyOfDiscriminatedReporter("tag", {
    "a": hoisted_UnionWithEnumAccess_5.reportObjectReporter.bind(hoisted_UnionWithEnumAccess_5),
    "b": hoisted_UnionWithEnumAccess_11.reportObjectReporter.bind(hoisted_UnionWithEnumAccess_11),
    "c": hoisted_UnionWithEnumAccess_17.reportObjectReporter.bind(hoisted_UnionWithEnumAccess_17)
});
const hoisted_Shape_0 = new ConstDecoder("circle");
const hoisted_Shape_1 = {
    "kind": hoisted_Shape_0.validateConstDecoder.bind(hoisted_Shape_0),
    "radius": validateNumber
};
const hoisted_Shape_2 = null;
const hoisted_Shape_3 = new ObjectValidator(hoisted_Shape_1, hoisted_Shape_2);
const hoisted_Shape_4 = new ObjectParser({
    "kind": hoisted_Shape_0.parseConstDecoder.bind(hoisted_Shape_0),
    "radius": parseIdentity
}, null);
const hoisted_Shape_5 = new ObjectReporter(hoisted_Shape_1, hoisted_Shape_2, {
    "kind": hoisted_Shape_0.reportConstDecoder.bind(hoisted_Shape_0),
    "radius": reportNumber
}, null);
const hoisted_Shape_6 = new ConstDecoder("square");
const hoisted_Shape_7 = {
    "kind": hoisted_Shape_6.validateConstDecoder.bind(hoisted_Shape_6),
    "x": validateNumber
};
const hoisted_Shape_8 = null;
const hoisted_Shape_9 = new ObjectValidator(hoisted_Shape_7, hoisted_Shape_8);
const hoisted_Shape_10 = new ObjectParser({
    "kind": hoisted_Shape_6.parseConstDecoder.bind(hoisted_Shape_6),
    "x": parseIdentity
}, null);
const hoisted_Shape_11 = new ObjectReporter(hoisted_Shape_7, hoisted_Shape_8, {
    "kind": hoisted_Shape_6.reportConstDecoder.bind(hoisted_Shape_6),
    "x": reportNumber
}, null);
const hoisted_Shape_12 = new ConstDecoder("triangle");
const hoisted_Shape_13 = {
    "kind": hoisted_Shape_12.validateConstDecoder.bind(hoisted_Shape_12),
    "x": validateNumber,
    "y": validateNumber
};
const hoisted_Shape_14 = null;
const hoisted_Shape_15 = new ObjectValidator(hoisted_Shape_13, hoisted_Shape_14);
const hoisted_Shape_16 = new ObjectParser({
    "kind": hoisted_Shape_12.parseConstDecoder.bind(hoisted_Shape_12),
    "x": parseIdentity,
    "y": parseIdentity
}, null);
const hoisted_Shape_17 = new ObjectReporter(hoisted_Shape_13, hoisted_Shape_14, {
    "kind": hoisted_Shape_12.reportConstDecoder.bind(hoisted_Shape_12),
    "x": reportNumber,
    "y": reportNumber
}, null);
const hoisted_Shape_18 = new AnyOfDiscriminatedValidator("kind", {
    "circle": hoisted_Shape_3.validateObjectValidator.bind(hoisted_Shape_3),
    "square": hoisted_Shape_9.validateObjectValidator.bind(hoisted_Shape_9),
    "triangle": hoisted_Shape_15.validateObjectValidator.bind(hoisted_Shape_15)
});
const hoisted_Shape_19 = new AnyOfDiscriminatedParser("kind", {
    "circle": hoisted_Shape_4.parseObjectParser.bind(hoisted_Shape_4),
    "square": hoisted_Shape_10.parseObjectParser.bind(hoisted_Shape_10),
    "triangle": hoisted_Shape_16.parseObjectParser.bind(hoisted_Shape_16)
});
const hoisted_Shape_20 = new AnyOfDiscriminatedReporter("kind", {
    "circle": hoisted_Shape_5.reportObjectReporter.bind(hoisted_Shape_5),
    "square": hoisted_Shape_11.reportObjectReporter.bind(hoisted_Shape_11),
    "triangle": hoisted_Shape_17.reportObjectReporter.bind(hoisted_Shape_17)
});
const hoisted_T3_0 = new ConstDecoder("square");
const hoisted_T3_1 = {
    "kind": hoisted_T3_0.validateConstDecoder.bind(hoisted_T3_0),
    "x": validateNumber
};
const hoisted_T3_2 = null;
const hoisted_T3_3 = new ObjectValidator(hoisted_T3_1, hoisted_T3_2);
const hoisted_T3_4 = new ObjectParser({
    "kind": hoisted_T3_0.parseConstDecoder.bind(hoisted_T3_0),
    "x": parseIdentity
}, null);
const hoisted_T3_5 = new ObjectReporter(hoisted_T3_1, hoisted_T3_2, {
    "kind": hoisted_T3_0.reportConstDecoder.bind(hoisted_T3_0),
    "x": reportNumber
}, null);
const hoisted_T3_6 = new ConstDecoder("triangle");
const hoisted_T3_7 = {
    "kind": hoisted_T3_6.validateConstDecoder.bind(hoisted_T3_6),
    "x": validateNumber,
    "y": validateNumber
};
const hoisted_T3_8 = null;
const hoisted_T3_9 = new ObjectValidator(hoisted_T3_7, hoisted_T3_8);
const hoisted_T3_10 = new ObjectParser({
    "kind": hoisted_T3_6.parseConstDecoder.bind(hoisted_T3_6),
    "x": parseIdentity,
    "y": parseIdentity
}, null);
const hoisted_T3_11 = new ObjectReporter(hoisted_T3_7, hoisted_T3_8, {
    "kind": hoisted_T3_6.reportConstDecoder.bind(hoisted_T3_6),
    "x": reportNumber,
    "y": reportNumber
}, null);
const hoisted_T3_12 = new AnyOfDiscriminatedValidator("kind", {
    "square": hoisted_T3_3.validateObjectValidator.bind(hoisted_T3_3),
    "triangle": hoisted_T3_9.validateObjectValidator.bind(hoisted_T3_9)
});
const hoisted_T3_13 = new AnyOfDiscriminatedParser("kind", {
    "square": hoisted_T3_4.parseObjectParser.bind(hoisted_T3_4),
    "triangle": hoisted_T3_10.parseObjectParser.bind(hoisted_T3_10)
});
const hoisted_T3_14 = new AnyOfDiscriminatedReporter("kind", {
    "square": hoisted_T3_5.reportObjectReporter.bind(hoisted_T3_5),
    "triangle": hoisted_T3_11.reportObjectReporter.bind(hoisted_T3_11)
});
const hoisted_BObject_0 = new ConstDecoder("b");
const hoisted_BObject_1 = {
    "tag": hoisted_BObject_0.validateConstDecoder.bind(hoisted_BObject_0)
};
const hoisted_BObject_2 = null;
const hoisted_BObject_3 = new ObjectValidator(hoisted_BObject_1, hoisted_BObject_2);
const hoisted_BObject_4 = new ObjectParser({
    "tag": hoisted_BObject_0.parseConstDecoder.bind(hoisted_BObject_0)
}, null);
const hoisted_BObject_5 = new ObjectReporter(hoisted_BObject_1, hoisted_BObject_2, {
    "tag": hoisted_BObject_0.reportConstDecoder.bind(hoisted_BObject_0)
}, null);
const hoisted_DEF_0 = {
    "a": validateString
};
const hoisted_DEF_1 = null;
const hoisted_DEF_2 = new ObjectValidator(hoisted_DEF_0, hoisted_DEF_1);
const hoisted_DEF_3 = new ObjectParser({
    "a": parseIdentity
}, null);
const hoisted_DEF_4 = new ObjectReporter(hoisted_DEF_0, hoisted_DEF_1, {
    "a": reportString
}, null);
const hoisted_KDEF_0 = new ConstDecoder("a");
const hoisted_ABC_0 = {};
const hoisted_ABC_1 = null;
const hoisted_ABC_2 = new ObjectValidator(hoisted_ABC_0, hoisted_ABC_1);
const hoisted_ABC_3 = new ObjectParser({}, null);
const hoisted_ABC_4 = new ObjectReporter(hoisted_ABC_0, hoisted_ABC_1, {}, null);
const hoisted_K_0 = [
    validators.KABC,
    validators.KDEF
];
const hoisted_K_1 = new AnyOfValidator(hoisted_K_0);
const hoisted_K_2 = new AnyOfParser(hoisted_K_0, [
    parsers.KABC,
    parsers.KDEF
]);
const hoisted_K_3 = new AnyOfReporter(hoisted_K_0, [
    reporters.KABC,
    reporters.KDEF
]);

export default { registerCustomFormatter, ObjectValidator, ObjectParser, ArrayParser, ArrayValidator, CodecDecoder, StringWithFormatDecoder, AnyOfValidator, AnyOfParser, AllOfValidator, AllOfParser, TupleParser, TupleValidator, RegexDecoder, ConstDecoder, AnyOfConstsDecoder, AnyOfDiscriminatedReporter, AnyOfDiscriminatedParser, AnyOfDiscriminatedValidator, validateString, validateNumber, validateFunction, validateBoolean, validateAny, validateNull, validateNever, parseIdentity, AnyOfReporter, AllOfReporter, reportString, reportNumber, reportNull, reportBoolean, reportAny, reportNever, reportFunction, ArrayReporter, ObjectReporter, TupleReporter, validators, parsers, reporters };