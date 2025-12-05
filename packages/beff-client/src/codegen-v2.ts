import {
  type BeffParser,
  type DecodeError,
  type ParseOptions,
  type RegularDecodeError,
  type UnionDecodeError,
} from "./types";
import { z } from "zod";
import {
  generateHashFromString,
  generateHashFromNumbers,
  unknownHash,
  stringHash,
  numberHash,
  booleanHash,
  nullishHash,
  undefinedHash,
  arrayHash,
  objectHash,
  dateHash,
  bigintHash,
  stringWithFormatHash,
  numberWithFormatHash,
  anyOfConstsHash,
  tupleHash,
  allOfHash,
  anyOfHash,
  optionalFieldHash,
} from "./hash";
import { JSONSchema7 } from "./json-schema";
import { printErrors } from "./err";
export { generateHashFromString, generateHashFromNumbers } from "./hash";

const JSON_PROTO = Object.getPrototypeOf({});

function deepmergeConstructor(options: any) {
  function isNotPrototypeKey(value: any) {
    return value !== "constructor" && value !== "prototype" && value !== "__proto__";
  }

  function cloneArray(value: any) {
    let i = 0;
    const il = value.length;
    const result = new Array(il);
    for (i; i < il; ++i) {
      result[i] = clone(value[i]);
    }
    return result;
  }

  function cloneObject(target: any) {
    const result = {};

    if (cloneProtoObject && Object.getPrototypeOf(target) !== JSON_PROTO) {
      return cloneProtoObject(target);
    }

    const targetKeys = getKeys(target);
    let i, il, key;
    for (i = 0, il = targetKeys.length; i < il; ++i) {
      //@ts-ignore
      isNotPrototypeKey((key = targetKeys[i])) && (result[key] = clone(target[key]));
    }
    return result;
  }

  function concatArrays(target: any, source: any) {
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
  function getSymbolsAndKeys(value: any) {
    const result = Object.keys(value);
    const keys = Object.getOwnPropertySymbols(value);
    for (let i = 0, il = keys.length; i < il; ++i) {
      //@ts-ignore
      propertyIsEnumerable.call(value, keys[i]) && result.push(keys[i]);
    }
    return result;
  }

  const getKeys = options?.symbols ? getSymbolsAndKeys : Object.keys;

  const cloneProtoObject =
    typeof options?.cloneProtoObject === "function" ? options.cloneProtoObject : undefined;

  function isMergeableObject(value: any) {
    return (
      typeof value === "object" && value !== null && !(value instanceof RegExp) && !(value instanceof Date)
    );
  }

  function isPrimitive(value: any) {
    return typeof value !== "object" || value === null;
  }

  const isPrimitiveOrBuiltIn =
    // @ts-ignore
    typeof Buffer !== "undefined"
      ? (value: any) =>
          typeof value !== "object" ||
          value === null ||
          value instanceof RegExp ||
          value instanceof Date ||
          // @ts-ignore
          value instanceof Buffer
      : (value: any) =>
          typeof value !== "object" || value === null || value instanceof RegExp || value instanceof Date;

  const mergeArray =
    options && typeof options.mergeArray === "function"
      ? options.mergeArray({ clone, deepmerge: _deepmerge, getKeys, isMergeableObject })
      : concatArrays;

  function clone(entry: any) {
    return isMergeableObject(entry) ? (Array.isArray(entry) ? cloneArray(entry) : cloneObject(entry)) : entry;
  }

  function mergeObject(target: any, source: any) {
    const result = {};
    const targetKeys = getKeys(target);
    const sourceKeys = getKeys(source);
    let i, il, key;
    for (i = 0, il = targetKeys.length; i < il; ++i) {
      isNotPrototypeKey((key = targetKeys[i])) &&
        sourceKeys.indexOf(key) === -1 &&
        // @ts-ignore
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
            // @ts-ignore
            result[key] = cloneProtoObject(source[key]);
          } else {
            // @ts-ignore
            result[key] = _deepmerge(target[key], source[key]);
          }
        }
      } else {
        // @ts-ignore
        result[key] = clone(source[key]);
      }
    }
    return result;
  }

  function _deepmerge(target: any, source: any) {
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

function deepmergeArray(options: any) {
  const deepmerge = options.deepmerge;
  const clone = options.clone;
  return function (target: any, source: any) {
    let i = 0;
    //const tl = target.length;
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

const deepmerge = deepmergeConstructor({ mergeArray: deepmergeArray }) as (...args: unknown[]) => unknown;

function buildUnionError(
  ctx: { path: string[] },
  errors: DecodeError[],
  received: unknown,
): UnionDecodeError[] {
  return [
    {
      path: [...ctx.path],
      received,
      errors,
      isUnionError: true,
    },
  ];
}
function buildError(ctx: { path: string[] }, message: string, received: unknown): RegularDecodeError[] {
  return [
    {
      message,
      path: [...ctx.path],
      received,
    },
  ];
}
function pushPath(ctx: { path: string[] }, key: string) {
  ctx.path.push(key);
}
function popPath(ctx: { path: string[] }) {
  ctx.path.pop();
}
function printPath(ctx: { path: string[] }) {
  return ctx.path.join(".");
}
function buildSchemaErrorMessage(ctx: { path: string[] }, message: string) {
  return `Failed to print schema. At ${printPath(ctx)}: ${message}`;
}
const limitedCommaJoinJson = (arr: unknown[]) => {
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
type UserProvidedStringValidatorFn = (input: string) => boolean;
const stringFormatters: Record<string, UserProvidedStringValidatorFn> = {};
export function registerStringFormatter(name: string, validator: UserProvidedStringValidatorFn) {
  stringFormatters[name] = validator;
}

type UserProvidedNumberValidatorFn = (input: number) => boolean;
const numberFormatters: Record<string, UserProvidedNumberValidatorFn> = {};
export function registerNumberFormatter(name: string, validator: UserProvidedNumberValidatorFn) {
  numberFormatters[name] = validator;
}

type DescribeContext = {
  measure: boolean;
  deps: Record<string, boolean | string>;
  deps_counter: Record<string, number>;
};

type SchemaContext = {
  path: string[];
  seen: Record<string, boolean>;
};

type ValidateContext = {
  disallowExtraProperties: boolean;
};

type ParseContext = {
  disallowExtraProperties: boolean;
};

type ReportContext = {
  disallowExtraProperties: boolean;
  path: string[];
};

type HashContext = {
  seen: Record<string, boolean>;
};

export interface Runtype {
  describe(ctx: DescribeContext): string;
  schema(ctx: SchemaContext): JSONSchema7;
  hash(ctx: HashContext): number;
  validate(ctx: ValidateContext, input: unknown): boolean;
  parseAfterValidation(ctx: ParseContext, input: any): unknown;
  reportDecodeError(ctx: ReportContext, input: unknown): DecodeError[];
}

type TypeOfSupported = "string" | "number" | "boolean";
export class TypeofRuntype implements Runtype {
  private typeName: TypeOfSupported;

  constructor(typeName: TypeOfSupported) {
    this.typeName = typeName;
  }

  describe(_ctx: DescribeContext): string {
    return this.typeName;
  }
  schema(_ctx: SchemaContext): JSONSchema7 {
    return { type: this.typeName };
  }
  validate(_ctx: ValidateContext, input: unknown): boolean {
    return typeof input === this.typeName;
  }
  parseAfterValidation(_ctx: ParseContext, input: unknown): unknown {
    return input;
  }
  reportDecodeError(ctx: ReportContext, input: unknown): DecodeError[] {
    return buildError(ctx, "expected " + this.typeName, input);
  }
  hash(_ctx: HashContext): number {
    switch (this.typeName) {
      case "string":
        return stringHash;
      case "number":
        return numberHash;
      case "boolean":
        return booleanHash;
    }
  }
}

export class AnyRuntype implements Runtype {
  describe(_ctx: DescribeContext): string {
    return "any";
  }
  schema(_ctx: SchemaContext): JSONSchema7 {
    return {};
  }
  validate(_ctx: ValidateContext, _input: unknown): boolean {
    return true;
  }
  parseAfterValidation(_ctx: ParseContext, input: unknown): unknown {
    return input;
  }
  reportDecodeError(ctx: ReportContext, input: unknown): DecodeError[] {
    return buildError(ctx, "expected any", input);
  }
  hash(_ctx: HashContext): number {
    return unknownHash;
  }
}

export class NullishRuntype implements Runtype {
  description: string;
  constructor(description: "undefined" | "null" | "void") {
    this.description = description;
  }

  describe(_ctx: DescribeContext): string {
    return this.description;
  }
  schema(_ctx: SchemaContext): JSONSchema7 {
    return { type: "null" };
  }
  validate(_ctx: ValidateContext, input: unknown): boolean {
    return input == null;
  }
  parseAfterValidation(_ctx: ParseContext, input: unknown): unknown {
    return input;
  }
  reportDecodeError(ctx: ReportContext, input: unknown): DecodeError[] {
    return buildError(ctx, "expected nullish value", input);
  }
  hash(_ctx: HashContext): number {
    return nullishHash;
  }
}

export class NeverRuntype implements Runtype {
  describe(_ctx: DescribeContext): string {
    return "never";
  }
  schema(_ctx: SchemaContext): JSONSchema7 {
    return { anyOf: [] };
  }
  validate(_ctx: ValidateContext, _input: unknown): boolean {
    return false;
  }
  parseAfterValidation(_ctx: ParseContext, _input: unknown): unknown {
    throw new Error("unreachable");
  }
  reportDecodeError(ctx: ReportContext, input: unknown): DecodeError[] {
    return buildError(ctx, "expected never", input);
  }
  hash(_ctx: HashContext): number {
    return undefinedHash;
  }
}

type Const = string | number | boolean | null;

export class ConstRuntype implements Runtype {
  private value: Const;
  constructor(value: Const) {
    this.value = value ?? null;
  }
  describe(_ctx: DescribeContext): string {
    return JSON.stringify(this.value);
  }
  schema(_ctx: SchemaContext): JSONSchema7 {
    return { const: this.value };
  }
  validate(_ctx: ValidateContext, input: unknown): boolean {
    if (this.value == null) {
      return input == this.value;
    }
    return input === this.value;
  }
  parseAfterValidation(_ctx: ParseContext, input: unknown): unknown {
    return input;
  }
  reportDecodeError(ctx: ReportContext, input: unknown): DecodeError[] {
    return buildError(ctx, `expected ${JSON.stringify(this.value)}`, input);
  }
  hash(_ctx: HashContext): number {
    if (this.value == null) {
      return nullishHash;
    }
    switch (typeof this.value) {
      case "string":
        return generateHashFromString(this.value);
      case "number":
        return generateHashFromNumbers([this.value]);
      case "boolean":
        return generateHashFromString(this.value ? "true" : "false");
    }
  }
}

export class RegexRuntype implements Runtype {
  private regex: RegExp;
  private description: string;

  constructor(regex: RegExp, description: string) {
    this.regex = regex;
    this.description = description;
  }

  describe(_ctx: DescribeContext): string {
    return this.description;
  }
  schema(_ctx: SchemaContext): JSONSchema7 {
    return { type: "string", pattern: this.description };
  }
  validate(_ctx: ValidateContext, input: unknown): boolean {
    if (typeof input === "string") {
      return this.regex.test(input);
    }
    return false;
  }
  parseAfterValidation(_ctx: ParseContext, input: unknown): unknown {
    return input;
  }
  reportDecodeError(ctx: ReportContext, input: unknown): DecodeError[] {
    return buildError(ctx, `expected string matching ${this.description}`, input);
  }
  hash(_ctx: HashContext): number {
    return generateHashFromString(this.description);
  }
}

export class DateRuntype implements Runtype {
  describe(_ctx: DescribeContext): string {
    return "Date";
  }
  schema(ctx: SchemaContext): JSONSchema7 {
    throw new Error(buildSchemaErrorMessage(ctx, "Cannot generate JSON Schema for Date"));
  }
  validate(_ctx: ValidateContext, input: unknown): boolean {
    return input instanceof Date;
  }
  parseAfterValidation(_ctx: ParseContext, input: unknown): unknown {
    return input;
  }
  reportDecodeError(ctx: ReportContext, input: unknown): DecodeError[] {
    return buildError(ctx, `expected Date`, input);
  }
  hash(_ctx: HashContext): number {
    return dateHash;
  }
}

export class BigIntRuntype implements Runtype {
  describe(_ctx: DescribeContext): string {
    return "BigInt";
  }
  schema(ctx: SchemaContext): JSONSchema7 {
    throw new Error(buildSchemaErrorMessage(ctx, "Cannot generate JSON Schema for BigInt"));
  }
  validate(_ctx: ValidateContext, input: unknown): boolean {
    return typeof input === "bigint";
  }
  parseAfterValidation(_ctx: ParseContext, input: unknown): unknown {
    return input;
  }
  reportDecodeError(ctx: ReportContext, input: unknown): DecodeError[] {
    return buildError(ctx, `expected BigInt`, input);
  }
  hash(_ctx: HashContext): number {
    return bigintHash;
  }
}

export class StringWithFormatRuntype implements Runtype {
  private formats: string[];

  constructor(formats: string[]) {
    this.formats = formats;
  }
  describe(_ctx: DescribeContext): string {
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
  schema(_ctx: SchemaContext): JSONSchema7 {
    return {
      type: "string",
      format: this.formats.join(" and "),
    };
  }
  validate(_ctx: ValidateContext, input: unknown): boolean {
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
  parseAfterValidation(_ctx: ParseContext, input: unknown): unknown {
    return input;
  }
  reportDecodeError(ctx: ReportContext, input: unknown): DecodeError[] {
    return buildError(ctx, `expected string with format "${this.formats.join(" and ")}"`, input);
  }
  hash(_ctx: HashContext): number {
    let acc: number[] = [stringWithFormatHash];
    for (const f of [...this.formats].sort()) {
      acc.push(generateHashFromString(f));
    }
    return generateHashFromNumbers(acc);
  }
}

export class NumberWithFormatRuntype implements Runtype {
  private formats: string[];
  constructor(formats: string[]) {
    this.formats = formats;
  }
  describe(_ctx: DescribeContext): string {
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
  schema(_ctx: SchemaContext): JSONSchema7 {
    return {
      type: "number",
      format: this.formats.join(" and "),
    };
  }
  validate(_ctx: ValidateContext, input: unknown): boolean {
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
  parseAfterValidation(_ctx: ParseContext, input: unknown): unknown {
    return input;
  }
  reportDecodeError(ctx: ReportContext, input: unknown): DecodeError[] {
    return buildError(ctx, `expected number with format "${this.formats.join(" and ")}"`, input);
  }
  hash(_ctx: HashContext): number {
    let acc: number[] = [numberWithFormatHash];
    for (const f of [...this.formats].sort()) {
      acc.push(generateHashFromString(f));
    }
    return generateHashFromNumbers(acc);
  }
}

export class AnyOfConstsRuntype implements Runtype {
  private values: Const[];
  constructor(values: Const[]) {
    this.values = values;
  }
  describe(_ctx: DescribeContext): string {
    const parts = this.values.map((it) => JSON.stringify(it));
    const inner = parts.join(" | ");
    return `(${inner})`;
  }
  schema(_ctx: SchemaContext): JSONSchema7 {
    return {
      enum: this.values,
    };
  }
  validate(_ctx: ValidateContext, input: unknown): boolean {
    if (input == null) {
      if (this.values.includes(null)) {
        return true;
      }
    }
    return this.values.includes(input as any);
  }
  parseAfterValidation(_ctx: ParseContext, input: unknown): unknown {
    return input;
  }
  reportDecodeError(ctx: ReportContext, input: unknown): DecodeError[] {
    return buildError(ctx, `expected one of ${limitedCommaJoinJson(this.values)}`, input);
  }
  hash(_ctx: HashContext): number {
    let acc: number[] = [anyOfConstsHash];
    for (const v of [...this.values].sort()) {
      if (v == null) {
        acc.push(nullishHash);
      } else {
        switch (typeof v) {
          case "string":
            acc.push(generateHashFromString(v));
            break;
          case "number":
            acc.push(generateHashFromNumbers([v]));
            break;
          case "boolean":
            acc.push(generateHashFromString(v ? "true" : "false"));
            break;
        }
      }
    }
    return generateHashFromNumbers(acc);
  }
}

export class TupleRuntype implements Runtype {
  private prefix: Runtype[];
  private rest: Runtype | null;
  constructor(prefix: Runtype[], rest: Runtype | null) {
    this.prefix = prefix;
    this.rest = rest;
  }
  describe(ctx: DescribeContext): string {
    const prefix = this.prefix.map((it) => it.describe(ctx)).join(", ");
    const rest = this.rest != null ? `...Array<${this.rest.describe(ctx)}>` : null;

    const inner = [prefix, rest].filter((it) => it != null && it.length > 0).join(", ");
    return `[${inner}]`;
  }
  schema(ctx: SchemaContext): JSONSchema7 {
    pushPath(ctx, "[]");
    const prefixItems = this.prefix.map((it) => it.schema(ctx));
    const items = this.rest != null ? this.rest.schema(ctx) : false;
    popPath(ctx);
    return {
      type: "array",
      prefixItems,
      items,
    } as any;
  }
  validate(ctx: ValidateContext, input: unknown): boolean {
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
  parseAfterValidation(ctx: ParseContext, input: any): unknown {
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
  reportDecodeError(ctx: ReportContext, input: unknown): DecodeError[] {
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
  hash(ctx: HashContext): number {
    let acc: number[] = [tupleHash];
    for (const p of this.prefix) {
      acc.push(p.hash(ctx));
    }
    if (this.rest != null) {
      acc.push(this.rest.hash(ctx));
    } else {
      acc.push(0);
    }
    return generateHashFromNumbers(acc);
  }
}

export class AllOfRuntype implements Runtype {
  private schemas: Runtype[];
  constructor(schemas: Runtype[]) {
    this.schemas = schemas;
  }
  describe(ctx: DescribeContext): string {
    return `(${this.schemas.map((it) => it.describe(ctx)).join(" & ")})`;
  }
  schema(ctx: SchemaContext): JSONSchema7 {
    return {
      allOf: this.schemas.map((it) => it.schema(ctx)),
    };
  }
  validate(ctx: ValidateContext, input: unknown): boolean {
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
  parseAfterValidation(ctx: ParseContext, input: any): unknown {
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
  reportDecodeError(ctx: ReportContext, input: unknown): DecodeError[] {
    const acc = [];
    for (const v of this.schemas) {
      const errors = v.reportDecodeError(ctx, input);
      acc.push(...errors);
    }
    return acc;
  }
  hash(ctx: HashContext): number {
    let acc: number[] = [allOfHash];
    for (const s of this.schemas) {
      acc.push(s.hash(ctx));
    }
    return generateHashFromNumbers(acc);
  }
}

export class AnyOfRuntype implements Runtype {
  private schemas: Runtype[];
  constructor(schemas: Runtype[]) {
    this.schemas = schemas;
  }
  schema(ctx: SchemaContext): JSONSchema7 {
    return {
      anyOf: this.schemas.map((it) => it.schema(ctx)),
    };
  }
  validate(ctx: ValidateContext, input: unknown): boolean {
    for (const it of this.schemas) {
      if (it.validate(ctx, input)) {
        return true;
      }
    }
    return false;
  }
  parseAfterValidation(ctx: ParseContext, input: any): unknown {
    const items = [];
    for (const it of this.schemas) {
      if (it.validate(ctx, input)) {
        items.push(it.parseAfterValidation(ctx, input));
      }
    }
    return deepmerge(...items);
  }
  reportDecodeError(ctx: ReportContext, input: unknown): DecodeError[] {
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
  describe(ctx: DescribeContext): string {
    return `(${this.schemas.map((it) => it.describe(ctx)).join(" | ")})`;
  }
  hash(ctx: HashContext): number {
    let acc: number[] = [anyOfHash];
    for (const s of this.schemas) {
      acc.push(s.hash(ctx));
    }
    return generateHashFromNumbers(acc);
  }
}

export class ArrayRuntype implements Runtype {
  private itemParser: Runtype;
  constructor(itemParser: Runtype) {
    this.itemParser = itemParser;
  }
  schema(ctx: SchemaContext): JSONSchema7 {
    pushPath(ctx, "[]");
    const items = this.itemParser.schema(ctx);
    popPath(ctx);
    return {
      type: "array",
      items,
    };
  }
  validate(ctx: ValidateContext, input: unknown): boolean {
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
  parseAfterValidation(ctx: ParseContext, input: any): unknown {
    return (input as any[]).map((v) => this.itemParser.parseAfterValidation(ctx, v));
  }
  reportDecodeError(ctx: ReportContext, input: unknown): DecodeError[] {
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
  describe(ctx: DescribeContext): string {
    return `Array<${this.itemParser.describe(ctx)}>`;
  }
  hash(ctx: HashContext): number {
    return generateHashFromNumbers([arrayHash, this.itemParser.hash(ctx)]);
  }
}

export class AnyOfDiscriminatedRuntype implements Runtype {
  private schemas: Runtype[];
  private discriminator: string;
  private mapping: Record<string, Runtype>;
  constructor(schemas: Runtype[], discriminator: string, mapping: Record<string, Runtype>) {
    this.schemas = schemas;
    this.discriminator = discriminator;
    this.mapping = mapping;
  }
  schema(ctx: SchemaContext): JSONSchema7 {
    return {
      anyOf: this.schemas.map((it) => it.schema(ctx)),
    };
  }
  validate(ctx: ValidateContext, input: unknown): boolean {
    if (typeof input !== "object" || input == null) {
      return false;
    }
    const d = (input as any)[this.discriminator];
    if (d == null) {
      return false;
    }
    const v = this.mapping[d];
    if (v == null) {
      return false;
    }

    return v.validate(ctx, input);
  }
  parseAfterValidation(ctx: ParseContext, input: any): unknown {
    const parser = this.mapping[input[this.discriminator]];
    if (parser == null) {
      throw new Error(
        "INTERNAL ERROR: Missing parser for discriminator " + JSON.stringify(input[this.discriminator]),
      );
    }
    return {
      ...(parser.parseAfterValidation(ctx, input) as object),
      [this.discriminator]: input[this.discriminator],
    };
  }
  reportDecodeError(ctx: ReportContext, input: unknown): DecodeError[] {
    if (input == null || typeof input !== "object") {
      return buildError(ctx, "expected object", input);
    }

    const d = (input as any)[this.discriminator];
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
    return v.reportDecodeError(ctx, input);
  }
  describe(ctx: DescribeContext): string {
    return `(${this.schemas.map((it) => it.describe(ctx)).join(" | ")})`;
  }
  hash(ctx: HashContext): number {
    let acc: number[] = [anyOfHash];
    for (const s of this.schemas) {
      acc.push(s.hash(ctx));
    }
    return generateHashFromNumbers(acc);
  }
}

export class OptionalFieldRuntype implements Runtype {
  private t: Runtype;

  constructor(t: Runtype) {
    this.t = t;
  }

  schema(ctx: SchemaContext): JSONSchema7 {
    const inner = this.t.schema(ctx);
    return {
      anyOf: [inner, { type: "null" }],
    };
  }
  validate(ctx: ValidateContext, input: unknown): boolean {
    if (input == null) {
      return true;
    }
    return this.t.validate(ctx, input);
  }
  parseAfterValidation(ctx: ParseContext, input: any): unknown {
    if (input == null) {
      return input;
    }
    return this.t.parseAfterValidation(ctx, input);
  }
  reportDecodeError(ctx: ReportContext, input: unknown): DecodeError[] {
    const acc: DecodeError[] = [];
    acc.push(...buildError(ctx, "expected nullish value", input));
    return [...acc, ...this.t.reportDecodeError(ctx, input)];
  }
  describe(ctx: DescribeContext): string {
    return this.t.describe(ctx);
  }
  hash(ctx: HashContext): number {
    let acc = [optionalFieldHash, this.t.hash(ctx)];
    return generateHashFromNumbers(acc);
  }
}

export class ObjectRuntype implements Runtype {
  private properties: Record<string, Runtype>;
  private indexedPropertiesParser: Array<{
    key: Runtype;
    value: Runtype;
  }>;
  constructor(
    properties: Record<string, Runtype>,
    indexedPropertiesParser: Array<{
      key: Runtype;
      value: Runtype;
    }>,
  ) {
    this.properties = properties;
    this.indexedPropertiesParser = indexedPropertiesParser;
  }
  describe(ctx: DescribeContext): string {
    const sortedKeys = Object.keys(this.properties).sort();
    const props = sortedKeys
      .map((k) => {
        const it = this.properties[k];
        const optionalMark = it instanceof OptionalFieldRuntype ? "?" : "";
        return `${k}${optionalMark}: ${it.describe(ctx)}`;
      })
      .join(", ");

    const indexPropsParats = this.indexedPropertiesParser.map(({ key, value }) => {
      return `[K in ${key.describe(ctx)}]: ${value.describe(ctx)}`;
    });
    const rest = indexPropsParats.join(", ");

    const content = [props, rest].filter((it) => it != null && it.length > 0).join(", ");
    return `{ ${content} }`;
  }
  schema(ctx: SchemaContext): JSONSchema7 {
    const properties: any = {};
    for (const k in this.properties) {
      pushPath(ctx, k);
      const item = this.properties[k];
      properties[k] = item.schema(ctx);
      popPath(ctx);
    }

    const required = Object.keys(this.properties);
    const base: JSONSchema7 = {
      type: "object",
      properties,
      required,
    };

    const indexSchemas = this.indexedPropertiesParser.map(({ key, value }): JSONSchema7 => {
      pushPath(ctx, "[key]");
      const keySchema = key.schema(ctx);
      popPath(ctx);
      pushPath(ctx, "[value]");
      const valueSchema = value.schema(ctx);
      popPath(ctx);

      return {
        type: "object",
        additionalProperties: valueSchema,
        propertyNames: keySchema,
      };
    });

    if (indexSchemas.length === 0) {
      return { ...base, additionalProperties: false };
    }
    return {
      allOf: [base, ...indexSchemas],
    };
  }
  validate(ctx: ValidateContext, input: any): boolean {
    if (typeof input === "object" && !Array.isArray(input) && input !== null) {
      const configKeys = Object.keys(this.properties);
      for (const k of configKeys) {
        const validator = this.properties[k];
        if (!validator.validate(ctx, input[k])) {
          return false;
        }
      }

      if (this.indexedPropertiesParser.length > 0) {
        const inputKeys = Object.keys(input);
        const extraKeys = inputKeys.filter((k) => !configKeys.includes(k));
        for (const k of extraKeys) {
          let isValid = false;
          for (const p of this.indexedPropertiesParser) {
            if (!p.key.validate(ctx, k)) {
              continue;
            }
            const v = input[k];
            if (!p.value.validate(ctx, v)) {
              continue;
            }
            isValid = true;
            break;
          }
          if (!isValid) {
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
  parseAfterValidation(ctx: ParseContext, input: any): unknown {
    let acc: any = {};

    const inputKeys = Object.keys(input);

    for (const k of inputKeys) {
      const v = input[k];
      if (k in this.properties) {
        const itemParsed = this.properties[k].parseAfterValidation(ctx, v);
        acc[k] = itemParsed;
      } else if (this.indexedPropertiesParser.length > 0) {
        for (const p of this.indexedPropertiesParser) {
          const isValid = p.key.validate(ctx, k) && p.value.validate(ctx, v);
          if (isValid) {
            const itemParsed = p.value.parseAfterValidation(ctx, v);
            const keyParsed = p.key.parseAfterValidation(ctx, k);
            acc[keyParsed as any] = itemParsed;
          }
        }
      }
    }

    return acc;
  }
  reportDecodeError(ctx: ReportContext, input: any): DecodeError[] {
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

    if (this.indexedPropertiesParser.length > 0) {
      const inputKeys = Object.keys(input);
      const extraKeys = inputKeys.filter((k) => !configKeys.includes(k));
      for (const k of extraKeys) {
        for (const p of this.indexedPropertiesParser) {
          const keyOk = p.key.validate(ctx, k);
          const valueOk = p.value.validate(ctx, input[k]);
          const ok = keyOk && valueOk;
          if (!ok) {
            pushPath(ctx, k);
            if (!keyOk) {
              const keyReported = p.key.reportDecodeError(ctx, k);
              acc.push(...keyReported);
            }
            if (!valueOk) {
              const valueReported = p.value.reportDecodeError(ctx, input[k]);
              acc.push(...valueReported);
            }
            popPath(ctx);
          }
        }
      }
    } else {
      if (ctx.disallowExtraProperties) {
        const inputKeys = Object.keys(input);
        const extraKeys = inputKeys.filter((k) => !configKeys.includes(k));
        if (extraKeys.length > 0) {
          return extraKeys
            .map((k) => {
              pushPath(ctx, k);
              const err = buildError(ctx, `extra property`, input[k]);
              popPath(ctx);
              return err;
            })
            .reduce((a, b) => a.concat(b), []);
        }
      }
    }

    return acc;
  }
  hash(ctx: HashContext) {
    let acc: number[] = [objectHash];
    for (const key of Object.keys(this.properties).sort()) {
      acc.push(generateHashFromString(key));
      const parser = this.properties[key];
      acc.push(parser.hash(ctx));
    }
    if (this.indexedPropertiesParser.length > 0) {
      for (const p of this.indexedPropertiesParser) {
        acc.push(p.key.hash(ctx));
        acc.push(p.value.hash(ctx));
      }
    }
    return generateHashFromNumbers(acc);
  }
}

class ParserFromRuntype implements BeffParser<any> {
  _runtype: Runtype;
  name: string;
  private isB: boolean;
  constructor(runtype: Runtype, name: string, isB: boolean) {
    this._runtype = runtype;
    this.name = name;
    this.isB = isB;
  }
  parse(input: any, options?: ParseOptions): any {
    const safe = this.safeParse(input, options);
    if (safe.success) {
      return safe.data;
    }
    const explained = printErrors(safe.errors, []);
    throw new Error(`Failed to parse ${this.name} - ${explained}`);
  }
  safeParse(
    input: any,
    options?: ParseOptions,
  ): { success: false; errors: DecodeError[] } | { success: true; data: any } {
    const disallowExtraProperties = options?.disallowExtraProperties ?? false;
    const ok = this.validate(input, options);
    if (ok) {
      let ctx = { disallowExtraProperties };
      const parsed = this._runtype.parseAfterValidation(ctx, input);
      return { success: true, data: parsed };
    }
    let ctx = { path: [], disallowExtraProperties };
    return {
      success: false,
      errors: this._runtype.reportDecodeError(ctx, input).slice(0, 10),
    };
  }
  zod(): z.ZodType<any, z.ZodTypeDef, any> {
    //@ts-ignore
    return z.custom(
      (data: any) => this.validate(data),
      //@ts-ignore
      (val: any) => {
        const errors = this._runtype.reportDecodeError({ path: [], disallowExtraProperties: false }, val);
        return printErrors(errors, []);
      },
    );
  }
  validate(input: any, options?: ParseOptions): input is any {
    const disallowExtraProperties = options?.disallowExtraProperties ?? false;
    const ctx = { disallowExtraProperties };
    const ok = this._runtype.validate(ctx, input);
    if (typeof ok !== "boolean") {
      throw new Error("INTERNAL ERROR: Expected boolean");
    }
    return ok;
  }
  schema(): JSONSchema7 {
    const ctx = {
      path: [],
      seen: {},
    };
    return this._runtype.schema(ctx);
  }
  describe(): string {
    const ctx: DescribeContext = {
      deps: {},
      deps_counter: {},
      measure: true,
    };
    let out = this._runtype.describe(ctx);
    ctx["deps"] = {};
    ctx["measure"] = false;
    out = this._runtype.describe(ctx);
    let sortedDepsKeys = Object.keys(ctx.deps).sort();
    // if sorted deps includes k, make it last
    // if (sortedDepsKeys.includes(k)) {
    //   sortedDepsKeys = sortedDepsKeys.filter(it => it !== k).concat([k]);
    // }
    const depsPart = sortedDepsKeys
      .map((key) => {
        return `type ${key} = ${ctx.deps[key]};`;
      })
      .join("\n\n");

    if (this.isB) {
      return [depsPart, out].filter((it) => it != null && it.length > 0).join("\n\n");
    }
    // if (k in ctx.deps) {
    //   return depsPart;
    // }
    const outPart = `type Codec${this.name} = ${out};`;
    return [depsPart, outPart].filter((it) => it != null && it.length > 0).join("\n\n");
  }
  hash(): number {
    const ctx = {
      seen: {},
    };
    return this._runtype.hash(ctx);
  }
}

export const buildParserFromRuntype = (runtype: Runtype, name: string, isB: boolean): BeffParser<any> =>
  new ParserFromRuntype(runtype, name, isB);
