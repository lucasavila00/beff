//@ts-nocheck

import { z } from "zod";
import {
  printErrors
} from "@beff/client";
"use strict";

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
      isNotPrototypeKey(key = targetKeys[i]) && (result[key] = clone(target[key]));
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
  const cloneProtoObject = typeof options?.cloneProtoObject === "function" ? options.cloneProtoObject : void 0;
  function isMergeableObject(value) {
    return typeof value === "object" && value !== null && !(value instanceof RegExp) && !(value instanceof Date);
  }
  function isPrimitive(value) {
    return typeof value !== "object" || value === null;
  }
  const isPrimitiveOrBuiltIn = (
    
    typeof Buffer !== "undefined" ? (value) => typeof value !== "object" || value === null || value instanceof RegExp || value instanceof Date || 
    value instanceof Buffer : (value) => typeof value !== "object" || value === null || value instanceof RegExp || value instanceof Date
  );
  const mergeArray = options && typeof options.mergeArray === "function" ? options.mergeArray({ clone, deepmerge: _deepmerge, getKeys, isMergeableObject }) : concatArrays;
  function clone(entry) {
    return isMergeableObject(entry) ? Array.isArray(entry) ? cloneArray(entry) : cloneObject(entry) : entry;
  }
  function mergeObject(target, source) {
    const result = {};
    const targetKeys = getKeys(target);
    const sourceKeys = getKeys(source);
    let i, il, key;
    for (i = 0, il = targetKeys.length; i < il; ++i) {
      isNotPrototypeKey(key = targetKeys[i]) && sourceKeys.indexOf(key) === -1 && 
      (result[key] = clone(target[key]));
    }
    for (i = 0, il = sourceKeys.length; i < il; ++i) {
      if (!isNotPrototypeKey(key = sourceKeys[i])) {
        continue;
      }
      if (key in target) {
        if (targetKeys.indexOf(key) !== -1) {
          if (cloneProtoObject && isMergeableObject(source[key]) && Object.getPrototypeOf(source[key]) !== JSON_PROTO) {
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
  return _deepmergeAll;
}
function deepmergeArray(options) {
  const deepmerge2 = options.deepmerge;
  const clone = options.clone;
  return function(target, source) {
    let i = 0;
    const tl = target.length;
    const sl = source.length;
    const il = Math.max(target.length, source.length);
    const result = new Array(il);
    for (i = 0; i < il; ++i) {
      if (i < sl) {
        result[i] = deepmerge2(target[i], source[i]);
      } else {
        result[i] = clone(target[i]);
      }
    }
    return result;
  };
}
const deepmerge = deepmergeConstructor({ mergeArray: deepmergeArray });
function buildUnionError(ctx, errors, received) {
  return [
    {
      path: [...ctx.path],
      received,
      errors,
      isUnionError: true
    }
  ];
}
function buildError(ctx, message, received) {
  return [
    {
      message,
      path: [...ctx.path],
      received
    }
  ];
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
const limitedCommaJoinJson = (arr) => {
  const limit = 3;
  if (arr.length < limit) {
    return arr.map((it) => JSON.stringify(it)).join(", ");
  }
  return arr.slice(0, limit).map((it) => JSON.stringify(it)).join(", ") + `...`;
};
const stringFormatters = {};
function registerStringFormatter(name, validator) {
  stringFormatters[name] = validator;
}
const numberFormatters = {};
function registerNumberFormatter(name, validator) {
  numberFormatters[name] = validator;
}
class ParserTypeOfImpl {
  typeName;
  constructor(typeName) {
    this.typeName = typeName;
  }
  describe(_ctx) {
    return this.typeName;
  }
  schema(_ctx) {
    return { type: this.typeName };
  }
  validate(_ctx, input) {
    return typeof input === this.typeName;
  }
  parseAfterValidation(_ctx, input) {
    return input;
  }
  reportDecodeError(ctx, input) {
    return buildError(ctx, "expected " + this.typeName, input);
  }
}
class ParserAnyImpl {
  describe(_ctx) {
    return "any";
  }
  schema(_ctx) {
    return {};
  }
  validate(_ctx, _input) {
    return true;
  }
  parseAfterValidation(_ctx, input) {
    return input;
  }
  reportDecodeError(ctx, input) {
    return buildError(ctx, "expected any", input);
  }
}
class ParserNullImpl {
  describe(_ctx) {
    return "null";
  }
  schema(_ctx) {
    return { type: "null" };
  }
  validate(_ctx, input) {
    return input == null;
  }
  parseAfterValidation(_ctx, input) {
    return input;
  }
  reportDecodeError(ctx, input) {
    return buildError(ctx, "expected nullish value", input);
  }
}
class ParserNeverImpl {
  describe(_ctx) {
    return "never";
  }
  schema(_ctx) {
    return { anyOf: [] };
  }
  validate(_ctx, _input) {
    return false;
  }
  parseAfterValidation(_ctx, _input) {
    throw new Error("unreachable");
  }
  reportDecodeError(ctx, input) {
    return buildError(ctx, "expected never", input);
  }
}
class ParserConstImpl {
  value;
  constructor(value) {
    this.value = value ?? null;
  }
  describe(_ctx) {
    return JSON.stringify(this.value);
  }
  schema(_ctx) {
    return { const: this.value };
  }
  validate(_ctx, input) {
    if (this.value == null) {
      return input == this.value;
    }
    return input === this.value;
  }
  parseAfterValidation(_ctx, input) {
    return input;
  }
  reportDecodeError(ctx, input) {
    return buildError(ctx, `expected ${JSON.stringify(this.value)}`, input);
  }
}
class ParserRegexImpl {
  regex;
  description;
  constructor(regex, description) {
    this.regex = regex;
    this.description = description;
  }
  describe(_ctx) {
    return "`" + this.description + "`";
  }
  schema(_ctx) {
    return { type: "string", pattern: this.description };
  }
  validate(_ctx, input) {
    if (typeof input === "string") {
      return this.regex.test(input);
    }
    return false;
  }
  parseAfterValidation(ctx, input) {
    return input;
  }
  reportDecodeError(ctx, input) {
    return buildError(ctx, `expected string matching ${this.description}`, input);
  }
}
class ParserDateImpl {
  describe(_ctx) {
    return "Date";
  }
  schema(ctx) {
    throw new Error(buildSchemaErrorMessage(ctx, "Cannot generate JSON Schema for Date"));
  }
  validate(_ctx, input) {
    return input instanceof Date;
  }
  parseAfterValidation(ctx, input) {
    return input;
  }
  reportDecodeError(ctx, input) {
    return buildError(ctx, `expected Date`, input);
  }
}
class ParserBigIntImpl {
  describe(_ctx) {
    return "BigInt";
  }
  schema(ctx) {
    throw new Error(buildSchemaErrorMessage(ctx, "Cannot generate JSON Schema for BigInt"));
  }
  validate(_ctx, input) {
    return typeof input === "bigint";
  }
  parseAfterValidation(ctx, input) {
    return input;
  }
  reportDecodeError(ctx, input) {
    return buildError(ctx, `expected BigInt`, input);
  }
}
class ParserStringWithFormatImpl {
  formats;
  constructor(formats) {
    this.formats = formats;
  }
  describe(ctx) {
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
  schema(ctx) {
    return {
      type: "string",
      format: this.formats.join(" and ")
    };
  }
  validate(ctx, input) {
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
  parseAfterValidation(ctx, input) {
    return input;
  }
  reportDecodeError(ctx, input) {
    return buildError(ctx, `expected string with format "${this.formats.join(" and ")}"`, input);
  }
}
class ParserNumberWithFormatImpl {
  formats;
  constructor(formats) {
    this.formats = formats;
  }
  describe(ctx) {
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
  schema(ctx) {
    return {
      type: "number",
      format: this.formats.join(" and ")
    };
  }
  validate(ctx, input) {
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
  parseAfterValidation(ctx, input) {
    return input;
  }
  reportDecodeError(ctx, input) {
    return buildError(ctx, `expected number with format "${this.formats.join(" and ")}"`, input);
  }
}
class ParserAnyOfConstsImpl {
  values;
  constructor(values) {
    this.values = values;
  }
  describe(ctx) {
    const parts = this.values.map((it) => JSON.stringify(it));
    return parts.join(" | ");
  }
  schema(ctx) {
    return {
      enum: this.values
    };
  }
  validate(ctx, input) {
    if (input == null) {
      if (this.values.includes(null)) {
        return true;
      }
    }
    return this.values.includes(input);
  }
  parseAfterValidation(ctx, input) {
    return input;
  }
  reportDecodeError(ctx, input) {
    return buildError(ctx, `expected one of ${limitedCommaJoinJson(this.values)}`, input);
  }
}
class ParserTupleImpl {
  prefix;
  rest;
  constructor(prefix, rest) {
    this.prefix = prefix;
    this.rest = rest;
  }
  describe(ctx) {
    const prefix = this.prefix.map((it) => it.describe(ctx)).join(", ");
    const rest = this.rest != null ? `...Array<${this.rest.describe(ctx)}>` : null;
    const inner = [prefix, rest].filter((it) => it != null && it.length > 0).join(", ");
    return `[${inner}]`;
  }
  schema(ctx) {
    pushPath(ctx, "[]");
    const prefixItems = this.prefix.map((it) => it.schema(ctx));
    const items = this.rest != null ? this.rest.schema(ctx) : false;
    popPath(ctx);
    return {
      type: "array",
      prefixItems,
      items
    };
  }
  validate(ctx, input) {
    if (Array.isArray(input)) {
      let idx = 0;
      for (const prefixItem of this.prefix) {
        if (!prefixItem.validate(ctx, input[idx])) {
          return false;
        }
        idx++;
      }
      if (this.rest != null) {
        for (let i = idx; i < input.length; i++) {
          if (!this.rest.validate(ctx, input[i])) {
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
  parseAfterValidation(ctx, input) {
    let idx = 0;
    let acc = [];
    for (const prefixItem of this.prefix) {
      acc.push(prefixItem.parseAfterValidation(ctx, input[idx]));
      idx++;
    }
    if (this.rest != null) {
      for (let i = idx; i < input.length; i++) {
        acc.push(this.rest.parseAfterValidation(ctx, input[i]));
      }
    }
    return acc;
  }
  reportDecodeError(ctx, input) {
    if (!Array.isArray(input)) {
      return buildError(ctx, "expected tuple", input);
    }
    let idx = 0;
    let acc = [];
    for (const prefixItem of this.prefix) {
      const ok = prefixItem.validate(ctx, input[idx]);
      if (!ok) {
        pushPath(ctx, `[${idx}]`);
        const errors = prefixItem.reportDecodeError(ctx, input[idx]);
        acc.push(...errors);
        popPath(ctx);
      }
      idx++;
    }
    if (this.rest != null) {
      for (let i = idx; i < input.length; i++) {
        const ok = this.rest.validate(ctx, input[i]);
        if (!ok) {
          pushPath(ctx, `[${i}]`);
          const errors = this.rest.reportDecodeError(ctx, input[i]);
          acc.push(...errors);
          popPath(ctx);
        }
      }
    }
    return acc;
  }
}
class ParserAllOfImpl {
  schemas;
  constructor(schemas) {
    this.schemas = schemas;
  }
  describe(ctx) {
    return `(${this.schemas.map((it) => it.describe(ctx)).join(" & ")})`;
  }
  schema(ctx) {
    return {
      allOf: this.schemas.map((it) => it.schema(ctx))
    };
  }
  validate(ctx, input) {
    for (const it of this.schemas) {
      const isObj = typeof input === "object";
      if (!isObj) {
        return false;
      }
      if (!it.validate(ctx, input)) {
        return false;
      }
    }
    return true;
  }
  parseAfterValidation(ctx, input) {
    let acc = {};
    for (const it of this.schemas) {
      const parsed = it.parseAfterValidation(ctx, input);
      if (typeof parsed !== "object") {
        throw new Error("INTERNAL ERROR: AllOfParser: Expected object");
      }
      acc = { ...acc, ...parsed };
    }
    return acc;
  }
  reportDecodeError(ctx, input) {
    const acc = [];
    for (const v of this.schemas) {
      const errors = v.reportDecodeError(ctx, input);
      acc.push(...errors);
    }
    return acc;
  }
}
class ParserAnyOfImpl {
  schemas;
  constructor(schemas) {
    this.schemas = schemas;
  }
  schema(ctx) {
    return {
      anyOf: this.schemas.map((it) => it.schema(ctx))
    };
  }
  validate(ctx, input) {
    for (const it of this.schemas) {
      if (it.validate(ctx, input)) {
        return true;
      }
    }
    return false;
  }
  parseAfterValidation(ctx, input) {
    const items = [];
    for (const it of this.schemas) {
      if (it.validate(ctx, input)) {
        items.push(it.parseAfterValidation(ctx, input));
      }
    }
    return deepmerge(...items);
  }
  reportDecodeError(ctx, input) {
    const acc = [];
    const oldPaths = ctx.path;
    ctx.path = [];
    for (const v of this.schemas) {
      const errors = v.reportDecodeError(ctx, input);
      acc.push(...errors);
    }
    ctx.path = oldPaths;
    return buildUnionError(ctx, acc, input);
  }
  describe(ctx) {
    return `(${this.schemas.map((it) => it.describe(ctx)).join(" | ")})`;
  }
}
class ParserArrayImpl {
  itemParser;
  constructor(itemParser) {
    this.itemParser = itemParser;
  }
  schema(ctx) {
    pushPath(ctx, "[]");
    const items = this.itemParser.schema(ctx);
    popPath(ctx);
    return {
      type: "array",
      items
    };
  }
  validate(ctx, input) {
    if (Array.isArray(input)) {
      for (let i = 0; i < input.length; i++) {
        const v = input[i];
        const ok = this.itemParser.validate(ctx, v);
        if (!ok) {
          return false;
        }
      }
      return true;
    }
    return false;
  }
  parseAfterValidation(ctx, input) {
    return input.map((v) => this.itemParser.parseAfterValidation(ctx, v));
  }
  reportDecodeError(ctx, input) {
    if (!Array.isArray(input)) {
      return buildError(ctx, "expected array", input);
    }
    let acc = [];
    for (let i = 0; i < input.length; i++) {
      const ok = this.itemParser.validate(ctx, input[i]);
      if (!ok) {
        pushPath(ctx, `[${i}]`);
        const v = input[i];
        const arr2 = this.itemParser.reportDecodeError(ctx, v);
        acc.push(...arr2);
        popPath(ctx);
      }
    }
    return acc;
  }
  describe(ctx) {
    return `Array<${this.itemParser.describe(ctx)}>`;
  }
}
class ParserAnyOfDiscriminatedImpl {
  schemas;
  discriminator;
  mapping;
  constructor(schemas, discriminator, mapping) {
    this.schemas = schemas;
    this.discriminator = discriminator;
    this.mapping = mapping;
  }
  schema(ctx) {
    return {
      anyOf: this.schemas.map((it) => it.schema(ctx))
    };
  }
  validate(ctx, input) {
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
    return v.validate(ctx, input);
  }
  parseAfterValidation(ctx, input) {
    const parser = this.mapping[input[this.discriminator]];
    if (parser == null) {
      throw new Error(
        "INTERNAL ERROR: Missing parser for discriminator " + JSON.stringify(input[this.discriminator])
      );
    }
    return {
      ...parser.parseAfterValidation(ctx, input),
      [this.discriminator]: input[this.discriminator]
    };
  }
  reportDecodeError(ctx, input) {
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
        "expected one of " + Object.keys(this.mapping).map((it) => JSON.stringify(it)).join(", "),
        d
      );
      popPath(ctx);
      return errs;
    }
    return v.reportDecodeError(ctx, input);
  }
  describe(ctx) {
    return `(${this.schemas.map((it) => it.describe(ctx)).join(" | ")})`;
  }
}
class ParserMappedRecordImpl {
  keyParser;
  valueParser;
  constructor(keyParser, valueParser) {
    this.keyParser = keyParser;
    this.valueParser = valueParser;
  }
  describe(ctx) {
    const k = this.keyParser.describe(ctx);
    const v = this.valueParser.describe(ctx);
    return `Record<${k}, ${v}>`;
  }
  schema(ctx) {
    return {
      type: "object",
      additionalProperties: this.valueParser.schema(ctx),
      propertyNames: this.keyParser.schema(ctx)
    };
  }
  validate(ctx, input) {
    if (typeof input !== "object" || input == null) {
      return false;
    }
    for (const k in input) {
      const v = input[k];
      if (!this.keyParser.validate(ctx, k) || !this.valueParser.validate(ctx, v)) {
        return false;
      }
    }
    return true;
  }
  parseAfterValidation(ctx, input) {
    const result = {};
    for (const k in input) {
      const parsedKey = this.keyParser.parseAfterValidation(ctx, k);
      const parsedValue = this.valueParser.parseAfterValidation(ctx, input[k]);
      result[parsedKey] = parsedValue;
    }
    return result;
  }
  reportDecodeError(ctx, input) {
    if (typeof input !== "object" || input == null) {
      return buildError(ctx, "expected object", input);
    }
    let acc = [];
    for (const k in input) {
      const v = input[k];
      const okKey = this.keyParser.validate(ctx, k);
      if (!okKey) {
        pushPath(ctx, k);
        const errs = this.keyParser.reportDecodeError(ctx, k);
        acc.push(...errs);
        popPath(ctx);
      }
      const okValue = this.valueParser.validate(ctx, v);
      if (!okValue) {
        pushPath(ctx, k);
        const errs = this.valueParser.reportDecodeError(ctx, v);
        acc.push(...errs);
        popPath(ctx);
      }
    }
    return acc;
  }
}
class ParserObjectImpl {
  properties;
  restParser;
  constructor(properties, restParser) {
    this.properties = properties;
    this.restParser = restParser;
  }
  describe(ctx) {
    const sortedKeys = Object.keys(this.properties).sort();
    const props = sortedKeys.map((k) => {
      const it = this.properties[k];
      return `${k}: ${it.describe(ctx)}`;
    }).join(", ");
    const rest = this.restParser != null ? `[K in string]: ${this.restParser.describe(ctx)}` : null;
    const content = [props, rest].filter((it) => it != null && it.length > 0).join(", ");
    return `{ ${content} }`;
  }
  schema(ctx) {
    const properties = {};
    for (const k in this.properties) {
      pushPath(ctx, k);
      properties[k] = this.properties[k].schema(ctx);
      popPath(ctx);
    }
    const required = Object.keys(this.properties);
    const additionalProperties = this.restParser != null ? this.restParser.schema(ctx) : false;
    return {
      type: "object",
      properties,
      required,
      additionalProperties
    };
  }
  validate(ctx, input) {
    if (typeof input === "object" && !Array.isArray(input) && input !== null) {
      const configKeys = Object.keys(this.properties);
      for (const k of configKeys) {
        const validator = this.properties[k];
        if (!validator.validate(ctx, input[k])) {
          return false;
        }
      }
      if (this.restParser != null) {
        const inputKeys = Object.keys(input);
        const extraKeys = inputKeys.filter((k) => !configKeys.includes(k));
        for (const k of extraKeys) {
          const v = input[k];
          if (!this.restParser.validate(ctx, v)) {
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
  parseAfterValidation(ctx, input) {
    let acc = {};
    const inputKeys = Object.keys(input);
    for (const k of inputKeys) {
      const v = input[k];
      if (k in this.properties) {
        const itemParsed = this.properties[k].parseAfterValidation(ctx, v);
        acc[k] = itemParsed;
      } else if (this.restParser != null) {
        const restParsed = this.restParser.parseAfterValidation(ctx, v);
        acc[k] = restParsed;
      }
    }
    return acc;
  }
  reportDecodeError(ctx, input) {
    if (typeof input !== "object" || Array.isArray(input) || input === null) {
      return buildError(ctx, "expected object", input);
    }
    let acc = [];
    const configKeys = Object.keys(this.properties);
    for (const k of configKeys) {
      const ok = this.properties[k].validate(ctx, input[k]);
      if (!ok) {
        pushPath(ctx, k);
        const arr2 = this.properties[k].reportDecodeError(ctx, input[k]);
        acc.push(...arr2);
        popPath(ctx);
      }
    }
    if (this.restParser != null) {
      const inputKeys = Object.keys(input);
      const extraKeys = inputKeys.filter((k) => !configKeys.includes(k));
      for (const k of extraKeys) {
        const ok = this.restParser.validate(ctx, input[k]);
        if (!ok) {
          pushPath(ctx, k);
          const arr2 = this.restParser.reportDecodeError(ctx, input[k]);
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
class ParserRefImpl {
  refName;
  constructor(refName) {
    this.refName = refName;
  }
  describe(ctx) {
    const name = this.refName;
    const to = namedParsers[this.refName];
    if (ctx.measure) {
      ctx.deps_counter[name] = (ctx.deps_counter[name] || 0) + 1;
      if (ctx.deps[name]) {
        return name;
      }
      ctx.deps[name] = true;
      ctx.deps[name] = to.describe(ctx);
      return name;
    } else {
      if (ctx.deps_counter[name] > 1) {
        if (!ctx.deps[name]) {
          ctx.deps[name] = true;
          ctx.deps[name] = to.describe(ctx);
        }
        return name;
      } else {
        return to.describe(ctx);
      }
    }
  }
  schema(ctx) {
    const name = this.refName;
    const to = namedParsers[this.refName];
    if (ctx.seen[name]) {
      return {};
    }
    ctx.seen[name] = true;
    var tmp = to.schema(ctx);
    delete ctx.seen[name];
    return tmp;
  }
  validate(ctx, input) {
    const to = namedParsers[this.refName];
    return to.validate(ctx, input);
  }
  parseAfterValidation(ctx, input) {
    const to = namedParsers[this.refName];
    return to.parseAfterValidation(ctx, input);
  }
  reportDecodeError(ctx, input) {
    const to = namedParsers[this.refName];
    return to.reportDecodeError(ctx, input);
  }
}
const buildParsers = (args) => {
  const stringFormats = args?.stringFormats ?? {};
  for (const k of RequiredStringFormats) {
    if (stringFormats[k] == null) {
      throw new Error(`Missing custom format ${k}`);
    }
  }
  Object.keys(stringFormats).forEach((k) => {
    const v = stringFormats[k];
    registerStringFormatter(k, v);
  });
  const numberFormats = args?.numberFormats ?? {};
  for (const k of RequiredNumberFormats) {
    if (numberFormats[k] == null) {
      throw new Error(`Missing custom format ${k}`);
    }
  }
  Object.keys(numberFormats).forEach((k) => {
    const v = numberFormats[k];
    registerNumberFormatter(k, v);
  });
  let acc = {};
  for (const k of Object.keys(buildValidatorsInput)) {
    const impl = buildValidatorsInput[k];
    const validate = (input, options) => {
      const disallowExtraProperties = options?.disallowExtraProperties ?? false;
      const ctx = { disallowExtraProperties };
      const ok = impl.validate(ctx, input);
      if (typeof ok !== "boolean") {
        throw new Error("INTERNAL ERROR: Expected boolean");
      }
      return ok;
    };
    const schema = () => {
      const ctx = {
        path: [],
        seen: {}
      };
      return impl.schema(ctx);
    };
    const describe = () => {
      const ctx = {
        deps: {},
        deps_counter: {},
        measure: true
      };
      let out = impl.describe(ctx);
      ctx["deps"] = {};
      ctx["measure"] = false;
      out = impl.describe(ctx);
      let sortedDepsKeys = Object.keys(ctx.deps).sort();
      const depsPart = sortedDepsKeys.map((key) => {
        return `type ${key} = ${ctx.deps[key]};`;
      }).join("\n\n");
      const outPart = `type Codec${k} = ${out};`;
      return [depsPart, outPart].filter((it2) => it2 != null && it2.length > 0).join("\n\n");
    };
    const safeParse = (input, options) => {
      const disallowExtraProperties = options?.disallowExtraProperties ?? false;
      const ok = validate(input, options);
      if (ok) {
        let ctx2 = { disallowExtraProperties };
        const parsed = impl.parseAfterValidation(ctx2, input);
        return { success: true, data: parsed };
      }
      let ctx = { path: [], disallowExtraProperties };
      return {
        success: false,
        errors: impl.reportDecodeError(ctx, input).slice(0, 10)
      };
    };
    const parse = (input, options) => {
      const safe = safeParse(input, options);
      if (safe.success) {
        return safe.data;
      }
      const explained = printErrors(safe.errors, []);
      throw new Error(`Failed to parse ${k} - ${explained}`);
    };
    const zod = () => {
      return z.custom(
        (data) => validate(data),
        (val) => {
          const errors = impl.reportDecodeError({ path: [], disallowExtraProperties: false }, val);
          return printErrors(errors, []);
        }
      );
    };
    const it = {
      validate,
      schema,
      describe,
      safeParse,
      parse,
      zod,
      name: k
    };
    acc[k] = it;
  }
  return acc;
};

const RequiredStringFormats = ["ValidCurrency","UserId","ReadAuthorizedUserId","WriteAuthorizedUserId"];
const RequiredNumberFormats = ["NonNegativeNumber","NonInfiniteNumber","Rate"];
const hoisted_0 = new ParserRefImpl("PartialRepro");
const hoisted_1 = new ParserRefImpl("TransportedValue");
const hoisted_10 = new ParserRefImpl("AccessLevelTpl2");
const hoisted_11 = new ParserRefImpl("AccessLevelTpl");
const hoisted_12 = new ParserRefImpl("Arr3");
const hoisted_13 = new ParserRefImpl("OmitSettings");
const hoisted_14 = new ParserRefImpl("RequiredPartialObject");
const hoisted_15 = new ParserRefImpl("LevelAndDSettings");
const hoisted_16 = new ParserRefImpl("PartialSettings");
const hoisted_17 = new ParserRefImpl("Extra");
const hoisted_18 = new ParserRefImpl("User");
const hoisted_19 = new ParserRefImpl("PublicUser");
const hoisted_2 = new ParserRefImpl("OnlyAKey");
const hoisted_20 = new ParserRefImpl("Req");
const hoisted_21 = new ParserRefImpl("Repro1");
const hoisted_22 = new ParserRefImpl("SettingsUpdate");
const hoisted_23 = new ParserRefImpl("Mapped");
const hoisted_24 = new ParserRefImpl("MappedOptional");
const hoisted_25 = new ParserRefImpl("PartialObject");
const hoisted_26 = new ParserRefImpl("DiscriminatedUnion");
const hoisted_27 = new ParserRefImpl("DiscriminatedUnion2");
const hoisted_28 = new ParserRefImpl("DiscriminatedUnion3");
const hoisted_29 = new ParserRefImpl("DiscriminatedUnion4");
const hoisted_3 = new ParserTypeOfImpl("string");
const hoisted_30 = new ParserRefImpl("AllTypes");
const hoisted_31 = new ParserRefImpl("AccessLevel");
const hoisted_32 = new ParserRefImpl("OtherEnum");
const hoisted_33 = new ParserRefImpl("Arr2");
const hoisted_34 = new ParserRefImpl("ValidCurrency");
const hoisted_35 = new ParserRefImpl("UnionWithEnumAccess");
const hoisted_36 = new ParserRefImpl("T3");
const hoisted_37 = new ParserRefImpl("AvatarSize");
const hoisted_38 = new ParserRefImpl("BObject");
const hoisted_39 = new ParserConstImpl("a");
const hoisted_4 = new ParserBigIntImpl();
const hoisted_40 = new ParserRefImpl("KDEF");
const hoisted_41 = new ParserRefImpl("KABC");
const hoisted_42 = new ParserRefImpl("K");
const hoisted_43 = new ParserRefImpl("NonNegativeNumber");
const hoisted_44 = new ParserRefImpl("NonInfiniteNumber");
const hoisted_45 = new ParserRefImpl("Rate");
const hoisted_46 = new ParserRefImpl("UserId");
const hoisted_47 = new ParserRefImpl("ReadAuthorizedUserId");
const hoisted_48 = new ParserRefImpl("WriteAuthorizedUserId");
const hoisted_49 = new ParserRefImpl("CurrencyPrices");
const hoisted_5 = new ParserTypeOfImpl("number");
const hoisted_50 = new ParserNullImpl();
const hoisted_51 = new ParserConstImpl("d");
const hoisted_52 = new ParserConstImpl("b");
const hoisted_53 = new ParserRefImpl("Repro2");
const hoisted_54 = new ParserTypeOfImpl("boolean");
const hoisted_55 = new ParserConstImpl("a1");
const hoisted_56 = new ParserConstImpl("a2");
const hoisted_57 = new ParserConstImpl("c");
const hoisted_58 = new ParserConstImpl("circle");
const hoisted_59 = new ParserConstImpl("square");
const hoisted_6 = new ParserRefImpl("AllTs");
const hoisted_60 = new ParserConstImpl("triangle");
const hoisted_61 = new ParserNeverImpl();
const hoisted_62 = new ParserNumberWithFormatImpl([
    "NonInfiniteNumber",
    "NonNegativeNumber"
]);
const hoisted_63 = new ParserNumberWithFormatImpl([
    "NonInfiniteNumber",
    "NonNegativeNumber",
    "Rate"
]);
const hoisted_64 = new ParserStringWithFormatImpl([
    "UserId",
    "ReadAuthorizedUserId"
]);
const hoisted_65 = new ParserStringWithFormatImpl([
    "UserId",
    "ReadAuthorizedUserId",
    "WriteAuthorizedUserId"
]);
const hoisted_7 = new ParserRefImpl("AObject");
const hoisted_8 = new ParserRefImpl("Version");
const hoisted_9 = new ParserRefImpl("Version2");
const namedParsers = {
    "PartialRepro": new ParserObjectImpl({
        "a": new ParserAnyOfImpl([
            hoisted_50,
            hoisted_3
        ]),
        "b": new ParserAnyOfImpl([
            hoisted_50,
            hoisted_3
        ])
    }, null),
    "TransportedValue": new ParserAnyOfImpl([
        hoisted_50,
        hoisted_3,
        new ParserArrayImpl(new ParserAnyOfImpl([
            hoisted_50,
            hoisted_3,
            hoisted_5
        ]))
    ]),
    "OnlyAKey": new ParserObjectImpl({
        "A": hoisted_3
    }, null),
    "AllTs": new ParserAnyOfConstsImpl([
        "a",
        "b"
    ]),
    "AObject": new ParserObjectImpl({
        "tag": hoisted_39
    }, null),
    "Version": new ParserRegexImpl(/(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "${number}.${number}.${number}"),
    "Version2": new ParserRegexImpl(/(v)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)(\.)(\d+(\.\d+)?)/, "v${number}.${number}.${number}"),
    "AccessLevel2": new ParserAnyOfConstsImpl([
        "ADMIN Admin",
        "USER User"
    ]),
    "AccessLevelTpl2": new ParserRegexImpl(/((ADMIN Admin)|(USER User))/, '("ADMIN Admin" | "USER User")'),
    "AccessLevel": new ParserAnyOfConstsImpl([
        "ADMIN",
        "USER"
    ]),
    "AccessLevelTpl": new ParserRegexImpl(/((ADMIN)|(USER))/, '("ADMIN" | "USER")'),
    "Arr3": new ParserAnyOfConstsImpl([
        "X",
        "Y"
    ]),
    "OmitSettings": new ParserObjectImpl({
        "d": new ParserObjectImpl({
            "tag": hoisted_51
        }, null),
        "level": new ParserAnyOfConstsImpl([
            "a",
            "b"
        ])
    }, null),
    "Settings": new ParserObjectImpl({
        "a": hoisted_3,
        "d": new ParserObjectImpl({
            "tag": hoisted_51
        }, null),
        "level": new ParserAnyOfConstsImpl([
            "a",
            "b"
        ])
    }, null),
    "PartialObject": new ParserObjectImpl({
        "a": new ParserAnyOfImpl([
            hoisted_50,
            hoisted_3
        ]),
        "b": new ParserAnyOfImpl([
            hoisted_50,
            hoisted_5
        ])
    }, null),
    "RequiredPartialObject": new ParserObjectImpl({
        "a": hoisted_3,
        "b": hoisted_5
    }, null),
    "LevelAndDSettings": new ParserObjectImpl({
        "d": new ParserObjectImpl({
            "tag": hoisted_51
        }, null),
        "level": new ParserAnyOfConstsImpl([
            "a",
            "b"
        ])
    }, null),
    "PartialSettings": new ParserObjectImpl({
        "a": new ParserAnyOfImpl([
            hoisted_50,
            hoisted_3
        ]),
        "d": new ParserAnyOfImpl([
            hoisted_50,
            new ParserObjectImpl({
                "tag": hoisted_51
            }, null)
        ]),
        "level": new ParserAnyOfImpl([
            hoisted_50,
            hoisted_39,
            hoisted_52
        ])
    }, null),
    "Extra": new ParserObjectImpl({}, hoisted_3),
    "AvatarSize": new ParserRegexImpl(/(\d+(\.\d+)?)(x)(\d+(\.\d+)?)/, "${number}x${number}"),
    "User": new ParserObjectImpl({
        "accessLevel": hoisted_31,
        "avatarSize": hoisted_37,
        "extra": hoisted_17,
        "friends": new ParserArrayImpl(hoisted_18),
        "name": hoisted_3
    }, null),
    "PublicUser": new ParserObjectImpl({
        "accessLevel": hoisted_31,
        "avatarSize": hoisted_37,
        "extra": hoisted_17,
        "name": hoisted_3
    }, null),
    "Req": new ParserObjectImpl({
        "optional": hoisted_3
    }, null),
    "WithOptionals": new ParserObjectImpl({
        "optional": new ParserAnyOfImpl([
            hoisted_50,
            hoisted_3
        ])
    }, null),
    "Repro1": new ParserObjectImpl({
        "sizes": new ParserAnyOfImpl([
            hoisted_50,
            hoisted_53
        ])
    }, null),
    "Repro2": new ParserObjectImpl({
        "useSmallerSizes": hoisted_54
    }, null),
    "SettingsUpdate": new ParserAnyOfImpl([
        hoisted_3,
        new ParserObjectImpl({
            "tag": hoisted_51
        }, null)
    ]),
    "Mapped": new ParserObjectImpl({
        "a": new ParserObjectImpl({
            "value": hoisted_39
        }, null),
        "b": new ParserObjectImpl({
            "value": hoisted_52
        }, null)
    }, null),
    "MappedOptional": new ParserObjectImpl({
        "a": new ParserAnyOfImpl([
            hoisted_50,
            new ParserObjectImpl({
                "value": hoisted_39
            }, null)
        ]),
        "b": new ParserAnyOfImpl([
            hoisted_50,
            new ParserObjectImpl({
                "value": hoisted_52
            }, null)
        ])
    }, null),
    "DiscriminatedUnion": new ParserAnyOfDiscriminatedImpl([
        new ParserObjectImpl({
            "a1": hoisted_3,
            "a11": new ParserAnyOfImpl([
                hoisted_50,
                hoisted_3
            ]),
            "subType": hoisted_55,
            "type": hoisted_39
        }, null),
        new ParserObjectImpl({
            "a2": hoisted_3,
            "subType": hoisted_56,
            "type": hoisted_39
        }, null),
        new ParserObjectImpl({
            "type": hoisted_52,
            "value": hoisted_5
        }, null)
    ], "type", {
        "a": new ParserAnyOfDiscriminatedImpl([
            new ParserObjectImpl({
                "a1": hoisted_3,
                "a11": new ParserAnyOfImpl([
                    hoisted_50,
                    hoisted_3
                ]),
                "subType": hoisted_55,
                "type": hoisted_39
            }, null),
            new ParserObjectImpl({
                "a2": hoisted_3,
                "subType": hoisted_56,
                "type": hoisted_39
            }, null)
        ], "subType", {
            "a1": new ParserObjectImpl({
                "a1": hoisted_3,
                "a11": new ParserAnyOfImpl([
                    hoisted_50,
                    hoisted_3
                ]),
                "subType": hoisted_55,
                "type": hoisted_39
            }, null),
            "a2": new ParserObjectImpl({
                "a2": hoisted_3,
                "subType": hoisted_56,
                "type": hoisted_39
            }, null)
        }),
        "b": new ParserObjectImpl({
            "type": hoisted_52,
            "value": hoisted_5
        }, null)
    }),
    "DiscriminatedUnion2": new ParserAnyOfImpl([
        new ParserObjectImpl({
            "a1": hoisted_3,
            "a11": new ParserAnyOfImpl([
                hoisted_50,
                hoisted_3
            ]),
            "subType": hoisted_55,
            "type": hoisted_39
        }, null),
        new ParserObjectImpl({
            "a2": hoisted_3,
            "subType": hoisted_56,
            "type": hoisted_39
        }, null),
        new ParserObjectImpl({
            "type": new ParserAnyOfImpl([
                hoisted_50,
                hoisted_51
            ]),
            "valueD": hoisted_5
        }, null),
        new ParserObjectImpl({
            "type": hoisted_52,
            "value": hoisted_5
        }, null)
    ]),
    "DiscriminatedUnion3": new ParserAnyOfDiscriminatedImpl([
        new ParserObjectImpl({
            "a1": hoisted_3,
            "type": new ParserAnyOfConstsImpl([
                "a",
                "c"
            ])
        }, null),
        new ParserObjectImpl({
            "type": hoisted_52,
            "value": hoisted_5
        }, null)
    ], "type", {
        "a": new ParserObjectImpl({
            "a1": hoisted_3,
            "type": new ParserAnyOfConstsImpl([
                "a",
                "c"
            ])
        }, null),
        "b": new ParserObjectImpl({
            "type": hoisted_52,
            "value": hoisted_5
        }, null),
        "c": new ParserObjectImpl({
            "a1": hoisted_3,
            "type": new ParserAnyOfConstsImpl([
                "a",
                "c"
            ])
        }, null)
    }),
    "DiscriminatedUnion4": new ParserAnyOfImpl([
        new ParserObjectImpl({
            "a": new ParserObjectImpl({
                "a1": hoisted_3,
                "subType": hoisted_55
            }, null),
            "type": hoisted_39
        }, null),
        new ParserObjectImpl({
            "a": new ParserObjectImpl({
                "a2": hoisted_3,
                "subType": hoisted_56
            }, null),
            "type": hoisted_39
        }, null)
    ]),
    "AllTypes": new ParserAnyOfConstsImpl([
        "LevelAndDSettings",
        "OmitSettings",
        "PartialSettings",
        "RequiredPartialObject"
    ]),
    "OtherEnum": new ParserAnyOfConstsImpl([
        "a",
        "b"
    ]),
    "Arr2": new ParserAnyOfConstsImpl([
        "A",
        "B",
        "C"
    ]),
    "ValidCurrency": new ParserStringWithFormatImpl([
        "ValidCurrency"
    ]),
    "UnionWithEnumAccess": new ParserAnyOfDiscriminatedImpl([
        new ParserObjectImpl({
            "tag": hoisted_39,
            "value": hoisted_3
        }, null),
        new ParserObjectImpl({
            "tag": hoisted_52,
            "value": hoisted_5
        }, null),
        new ParserObjectImpl({
            "tag": hoisted_57,
            "value": hoisted_54
        }, null)
    ], "tag", {
        "a": new ParserObjectImpl({
            "tag": hoisted_39,
            "value": hoisted_3
        }, null),
        "b": new ParserObjectImpl({
            "tag": hoisted_52,
            "value": hoisted_5
        }, null),
        "c": new ParserObjectImpl({
            "tag": hoisted_57,
            "value": hoisted_54
        }, null)
    }),
    "Shape": new ParserAnyOfDiscriminatedImpl([
        new ParserObjectImpl({
            "kind": hoisted_58,
            "radius": hoisted_5
        }, null),
        new ParserObjectImpl({
            "kind": hoisted_59,
            "x": hoisted_5
        }, null),
        new ParserObjectImpl({
            "kind": hoisted_60,
            "x": hoisted_5,
            "y": hoisted_5
        }, null)
    ], "kind", {
        "circle": new ParserObjectImpl({
            "kind": hoisted_58,
            "radius": hoisted_5
        }, null),
        "square": new ParserObjectImpl({
            "kind": hoisted_59,
            "x": hoisted_5
        }, null),
        "triangle": new ParserObjectImpl({
            "kind": hoisted_60,
            "x": hoisted_5,
            "y": hoisted_5
        }, null)
    }),
    "T3": new ParserAnyOfDiscriminatedImpl([
        new ParserObjectImpl({
            "kind": hoisted_59,
            "x": hoisted_5
        }, null),
        new ParserObjectImpl({
            "kind": hoisted_60,
            "x": hoisted_5,
            "y": hoisted_5
        }, null)
    ], "kind", {
        "square": new ParserObjectImpl({
            "kind": hoisted_59,
            "x": hoisted_5
        }, null),
        "triangle": new ParserObjectImpl({
            "kind": hoisted_60,
            "x": hoisted_5,
            "y": hoisted_5
        }, null)
    }),
    "BObject": new ParserObjectImpl({
        "tag": hoisted_52
    }, null),
    "DEF": new ParserObjectImpl({
        "a": hoisted_3
    }, null),
    "KDEF": hoisted_39,
    "ABC": new ParserObjectImpl({}, null),
    "KABC": hoisted_61,
    "K": new ParserAnyOfImpl([
        hoisted_41,
        hoisted_40
    ]),
    "NonInfiniteNumber": new ParserNumberWithFormatImpl([
        "NonInfiniteNumber"
    ]),
    "NonNegativeNumber": hoisted_62,
    "Rate": hoisted_63,
    "UserId": new ParserStringWithFormatImpl([
        "UserId"
    ]),
    "ReadAuthorizedUserId": hoisted_64,
    "WriteAuthorizedUserId": hoisted_65,
    "CurrencyPrices": new ParserMappedRecordImpl(new ParserStringWithFormatImpl([
        "ValidCurrency"
    ]), hoisted_45)
};
const buildValidatorsInput = {
    "PartialRepro": hoisted_0,
    "TransportedValue": hoisted_1,
    "OnlyAKey": hoisted_2,
    "ObjectWithArr": new ParserObjectImpl({
        "a": new ParserArrayImpl(hoisted_3)
    }, null),
    "BigIntCodec": hoisted_4,
    "TupleCodec": new ParserTupleImpl([
        hoisted_5,
        hoisted_5,
        hoisted_5
    ], null),
    "TupleCodecRest": new ParserTupleImpl([
        hoisted_5,
        hoisted_5
    ], hoisted_3),
    "StringArrCodec": new ParserArrayImpl(hoisted_3),
    "AllTs": hoisted_6,
    "AObject": hoisted_7,
    "Version": hoisted_8,
    "Version2": hoisted_9,
    "AccessLevelTpl2": hoisted_10,
    "AccessLevelTpl": hoisted_11,
    "Arr3": hoisted_12,
    "OmitSettings": hoisted_13,
    "RequiredPartialObject": hoisted_14,
    "LevelAndDSettings": hoisted_15,
    "PartialSettings": hoisted_16,
    "Extra": hoisted_17,
    "User": hoisted_18,
    "PublicUser": hoisted_19,
    "Req": hoisted_20,
    "Repro1": hoisted_21,
    "SettingsUpdate": hoisted_22,
    "Mapped": hoisted_23,
    "MappedOptional": hoisted_24,
    "PartialObject": hoisted_25,
    "DiscriminatedUnion": hoisted_26,
    "DiscriminatedUnion2": hoisted_27,
    "DiscriminatedUnion3": hoisted_28,
    "DiscriminatedUnion4": hoisted_29,
    "AllTypes": hoisted_30,
    "AccessLevel": hoisted_31,
    "OtherEnum": hoisted_32,
    "Arr2C": hoisted_33,
    "ValidCurrency": hoisted_34,
    "UnionWithEnumAccess": hoisted_35,
    "T3": hoisted_36,
    "AccessLevelCodec": hoisted_31,
    "AvatarSize": hoisted_37,
    "BObject": hoisted_38,
    "ImportEnumTypeof": new ParserObjectImpl({
        "A": hoisted_39
    }, null),
    "KDEF": hoisted_40,
    "KABC": hoisted_41,
    "K": hoisted_42,
    "NonNegativeNumber": hoisted_43,
    "NonInfiniteNumber": hoisted_44,
    "Rate": hoisted_45,
    "UserId": hoisted_46,
    "ReadAuthorizedUserId": hoisted_47,
    "WriteAuthorizedUserId": hoisted_48,
    "CurrencyPrices": hoisted_49
};

export default { buildParsers };