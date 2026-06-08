import { type BeffParser, type DecodeError, type ParseOptions, type RegularDecodeError } from "./types.js";
import { z } from "zod";
import {
  generateHashFromString,
  generateHashFromNumbers,
  Hash256Writer,
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
  mapHash,
  setHash,
} from "./hash.js";
import { JSONSchema7, JSONSchema7Definition } from "./json-schema.js";
import { removeNullUnionBranch } from "./openapi-pp.js";
import { printErrors } from "./err.js";
export { generateHashFromString, generateHashFromNumbers } from "./hash.js";

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
      typeof value === "object" &&
      value !== null &&
      !(value instanceof RegExp) &&
      !(value instanceof Date) &&
      !ArrayBuffer.isView(value)
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
          ArrayBuffer.isView(value) ||
          // @ts-ignore
          value instanceof Buffer
      : (value: any) =>
          typeof value !== "object" ||
          value === null ||
          value instanceof RegExp ||
          value instanceof Date ||
          ArrayBuffer.isView(value);

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

function maxErrorDepth(errors: DecodeError[]): number {
  let max = 0;
  for (const err of errors) {
    const depth = "isUnionError" in err ? err.path.length + maxErrorDepth(err.errors) : err.path.length;
    if (depth > max) max = depth;
  }
  return max;
}

function prependPath(parentPath: string[], err: DecodeError): DecodeError {
  if ("isUnionError" in err) {
    return { ...err, path: [...parentPath, ...err.path] };
  }
  return { ...err, path: [...parentPath, ...err.path] };
}

function deduplicateErrors(errors: DecodeError[]): DecodeError[] {
  const seen = new Set<string>();
  return errors.filter((err) => {
    const key = JSON.stringify(err);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildUnionError(ctx: { path: string[] }, errors: DecodeError[], received: unknown): DecodeError[] {
  const deduplicated = deduplicateErrors(errors);
  // Single branch survived filtering — flatten instead of wrapping
  if (deduplicated.length === 1) {
    return [prependPath(ctx.path, deduplicated[0])];
  }
  return [
    {
      path: [...ctx.path],
      received,
      errors: deduplicated,
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
type UserProvidedStringErrorMessageFn = (input: string) => string;
type UserProvidedStringFormat =
  | UserProvidedStringValidatorFn
  | {
      validator: UserProvidedStringValidatorFn;
      errorMessage?: UserProvidedStringErrorMessageFn;
    };
type RegisteredStringFormat = {
  validator: UserProvidedStringValidatorFn;
  errorMessage?: UserProvidedStringErrorMessageFn;
};
const stringFormatters: Record<string, RegisteredStringFormat> = {};
export function registerStringFormatter(name: string, value: UserProvidedStringFormat) {
  if (typeof value === "function") {
    stringFormatters[name] = {
      validator: value,
    };
    return;
  }
  stringFormatters[name] = value;
}

type UserProvidedNumberValidatorFn = (input: number) => boolean;
type UserProvidedNumberErrorMessageFn = (input: number) => string;
type UserProvidedNumberFormat =
  | UserProvidedNumberValidatorFn
  | {
      validator: UserProvidedNumberValidatorFn;
      errorMessage?: UserProvidedNumberErrorMessageFn;
    };
type RegisteredNumberFormat = {
  validator: UserProvidedNumberValidatorFn;
  errorMessage?: UserProvidedNumberErrorMessageFn;
};
const numberFormatters: Record<string, RegisteredNumberFormat> = {};
export function registerNumberFormatter(name: string, value: UserProvidedNumberFormat) {
  if (typeof value === "function") {
    numberFormatters[name] = {
      validator: value,
    };
    return;
  }
  numberFormatters[name] = value;
}

function resolveStringFormatErrorMessage(formats: string[], input: string): string | undefined {
  for (const f of [...formats].reverse()) {
    const formatter = stringFormatters[f];
    const errorMessage = formatter?.errorMessage;
    if (errorMessage != null) {
      return errorMessage(input);
    }
  }
  return undefined;
}

function resolveNumberFormatErrorMessage(formats: string[], input: number): string | undefined {
  for (const f of [...formats].reverse()) {
    const formatter = numberFormatters[f];
    const errorMessage = formatter?.errorMessage;
    if (errorMessage != null) {
      return errorMessage(input);
    }
  }
  return undefined;
}

type TypeDescription = {
  typeExpr: string;
  docText?: string;
};

type DescribeContext = {
  activeRefs: Set<string>;
  definitions: Record<string, TypeDescription>;
  refCounts: Record<string, number>;
  visitedRefs: Set<string>;
};

export type SchemaPrintingMode = "flat" | "contextual";

export type SchemaPrintingContextOptions = {
  refPathTemplate: string;
  definitionContainerKey: string | null;
  namedTypeSchemaOverrides?: Record<string, BeffParser<unknown>>;
};

export class SchemaPrintingContext {
  private readonly refPathTemplate: string;
  readonly definitionContainerKey: string | null;
  private readonly collectedDefinitions: Record<string, JSONSchema7Definition>;
  private readonly inProgressDefinitions: Record<string, boolean>;
  private readonly namedTypeSchemaOverrides: Record<string, Runtype>;

  constructor(options: SchemaPrintingContextOptions) {
    this.refPathTemplate = options.refPathTemplate;
    this.definitionContainerKey = options.definitionContainerKey;
    this.collectedDefinitions = {};
    this.inProgressDefinitions = {};
    this.namedTypeSchemaOverrides = Object.fromEntries(
      Object.entries(options.namedTypeSchemaOverrides ?? {}).map(([name, parser]) => [
        name,
        (parser as ParserFromRuntype)._runtype,
      ]),
    );
  }

  get refTemplate(): string {
    return this.refPathTemplate;
  }

  getRef(name: string): string {
    return this.refPathTemplate.replace("{name}", name);
  }

  hasDefinition(name: string): boolean {
    return name in this.collectedDefinitions;
  }

  isDefinitionInProgress(name: string): boolean {
    return this.inProgressDefinitions[name] === true;
  }

  getNamedTypeSchemaOverride(name: string): Runtype | undefined {
    return this.namedTypeSchemaOverrides[name];
  }

  markDefinitionInProgress(name: string): void {
    this.inProgressDefinitions[name] = true;
  }

  storeDefinition(name: string, schema: JSONSchema7Definition): void {
    this.collectedDefinitions[name] = schema;
    delete this.inProgressDefinitions[name];
  }

  exportDefinitions():
    | Record<string, JSONSchema7Definition>
    | Record<string, Record<string, JSONSchema7Definition>> {
    const definitions = { ...this.collectedDefinitions };
    if (this.definitionContainerKey == null) {
      return definitions;
    }
    return {
      [this.definitionContainerKey]: definitions,
    };
  }
}

type SchemaContext = {
  path: string[];
  seen: Record<string, boolean>;
  mode: SchemaPrintingMode;
  printingContext?: SchemaPrintingContext;
};

type ValidateContext = {
  disallowExtraProperties: boolean;
};

type ParseContext = {
  disallowExtraProperties: boolean;
  objectKeyOrder: "input" | "sorted";
};

type ReportContext = {
  disallowExtraProperties: boolean;
  path: string[];
};

type HashContext = {
  seen: Record<string, boolean>;
};

type Hash256Context = {
  writer: Hash256Writer;
  active: Map<Runtype, number>;
  nextCycleId: number;
};

export interface Runtype {
  describe(ctx: DescribeContext): TypeDescription;
  describeChildren(): Runtype[];
  schema(ctx: SchemaContext): JSONSchema7;
  hash(ctx: HashContext): number;
  hash256(ctx: Hash256Context): void;
  validate(ctx: ValidateContext, input: unknown): boolean;
  parseAfterValidation(ctx: ParseContext, input: any): unknown;
  reportDecodeError(ctx: ReportContext, input: unknown): DecodeError[];
}

export type RuntypeMetadata = {
  description?: string;
};

function annotateSchema<T extends JSONSchema7>(metadata: RuntypeMetadata | undefined, schema: T): T {
  if (metadata?.description == null) {
    return schema;
  }
  return {
    ...schema,
    description: metadata.description,
  };
}

function jsdocDescription(description: string): string {
  const sanitized = description.replace(/\*\//g, "* /");
  const lines = sanitized.split("\n");
  if (lines.length === 1) {
    return `/** ${lines[0]} */`;
  }
  return ["/**", ...lines.map((line) => ` * ${line}`), " */"].join("\n");
}

function typeDescription(typeExpr: string, docText?: string): TypeDescription {
  if (docText == null) {
    return { typeExpr };
  }
  return { typeExpr, docText };
}

abstract class BaseRuntype implements Runtype {
  protected metadata: RuntypeMetadata | undefined;

  constructor(metadata: RuntypeMetadata | undefined) {
    this.metadata = metadata;
  }

  describe(ctx: DescribeContext): TypeDescription {
    return typeDescription(this.describeTypeExpr(ctx), this.metadata?.description);
  }

  describeChildren(): Runtype[] {
    return [];
  }

  protected abstract describeTypeExpr(ctx: DescribeContext): string;

  abstract schema(ctx: SchemaContext): JSONSchema7;
  abstract hash(ctx: HashContext): number;
  abstract hash256(ctx: Hash256Context): void;
  abstract validate(ctx: ValidateContext, input: unknown): boolean;
  abstract parseAfterValidation(ctx: ParseContext, input: any): unknown;
  abstract reportDecodeError(ctx: ReportContext, input: unknown): DecodeError[];
}

function describeTypeExpr(ctx: DescribeContext, runtype: Runtype): string {
  return runtype.describe(ctx).typeExpr;
}

function renderTypeDescription(description: TypeDescription): string {
  return description.docText == null
    ? description.typeExpr
    : `${jsdocDescription(description.docText)}\n${description.typeExpr}`;
}

function renderTypeAlias(name: string, description: TypeDescription): string {
  const declaration = `type ${name} = ${description.typeExpr};`;
  return description.docText == null
    ? declaration
    : `${jsdocDescription(description.docText)}\n${declaration}`;
}

function describeObjectMember(
  ctx: DescribeContext,
  key: string,
  value: Runtype,
): { docText?: string; member: string } {
  const optionalMark = value instanceof OptionalFieldRuntype ? "?" : "";
  const description = value.describe(ctx);

  return {
    docText: description.docText,
    member: `${key}${optionalMark}: ${description.typeExpr}`,
  };
}

function describeIndexObjectMember(
  ctx: DescribeContext,
  key: Runtype,
  value: Runtype,
): { docText?: string; member: string } {
  return describeObjectMember(ctx, `[K in ${describeTypeExpr(ctx, key)}]`, value);
}

function renderObjectMember(member: { docText?: string; member: string }): string {
  const renderedMember = `${member.member};`;
  return member.docText == null ? renderedMember : `${jsdocDescription(member.docText)}\n${renderedMember}`;
}

function collectDescribeRefs(runtype: Runtype, ctx: DescribeContext): void {
  if (runtype instanceof BaseRefRuntype) {
    runtype.collectDescribeRefs(ctx);
    return;
  }

  for (const child of runtype.describeChildren()) {
    collectDescribeRefs(child, ctx);
  }
}

type TypeOfSupported = "string" | "number" | "boolean";
export class TypeofRuntype extends BaseRuntype {
  private typeName: TypeOfSupported;

  constructor(metadata: RuntypeMetadata | undefined, typeName: TypeOfSupported) {
    super(metadata);
    this.typeName = typeName;
  }

  protected describeTypeExpr(_ctx: DescribeContext): string {
    return this.typeName;
  }
  schema(_ctx: SchemaContext): JSONSchema7 {
    return annotateSchema(this.metadata, { type: this.typeName });
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
  hash256(ctx: Hash256Context): void {
    ctx.writer.updateTag("typeof");
    ctx.writer.updateString(this.typeName);
  }
}

export class AnyRuntype extends BaseRuntype {
  constructor(metadata: RuntypeMetadata | undefined) {
    super(metadata);
  }

  protected describeTypeExpr(_ctx: DescribeContext): string {
    return "any";
  }
  schema(_ctx: SchemaContext): JSONSchema7 {
    return annotateSchema(this.metadata, {});
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
  hash256(ctx: Hash256Context): void {
    ctx.writer.updateTag("any");
  }
}

export class NullishRuntype extends BaseRuntype {
  description: string;
  constructor(metadata: RuntypeMetadata | undefined, description: "undefined" | "null" | "void") {
    super(metadata);
    this.description = description;
  }

  protected describeTypeExpr(_ctx: DescribeContext): string {
    return this.description;
  }
  schema(_ctx: SchemaContext): JSONSchema7 {
    return annotateSchema(this.metadata, { type: "null" });
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
  hash256(ctx: Hash256Context): void {
    ctx.writer.updateTag("nullish");
  }
}

export class NeverRuntype extends BaseRuntype {
  constructor(metadata: RuntypeMetadata | undefined) {
    super(metadata);
  }

  protected describeTypeExpr(_ctx: DescribeContext): string {
    return "never";
  }
  schema(_ctx: SchemaContext): JSONSchema7 {
    return annotateSchema(this.metadata, { anyOf: [] });
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
  hash256(ctx: Hash256Context): void {
    ctx.writer.updateTag("never");
  }
}

type Const = string | number | boolean | null;

function constSortKey(value: Const): string {
  if (value == null) return "null:";
  return `${typeof value}:${String(value)}`;
}

function compareConst(a: Const, b: Const): number {
  return constSortKey(a).localeCompare(constSortKey(b));
}

function hash256Const(ctx: Hash256Context, value: Const): void {
  if (value == null) {
    ctx.writer.updateNull();
    return;
  }
  switch (typeof value) {
    case "string":
      ctx.writer.updateTag("string");
      ctx.writer.updateString(value);
      return;
    case "number":
      ctx.writer.updateTag("number");
      ctx.writer.updateNumber(value);
      return;
    case "boolean":
      ctx.writer.updateTag("boolean");
      ctx.writer.updateBoolean(value);
      return;
  }
}

export class ConstRuntype extends BaseRuntype {
  private value: Const;
  constructor(metadata: RuntypeMetadata | undefined, value: Const) {
    super(metadata);
    this.value = value ?? null;
  }
  protected describeTypeExpr(_ctx: DescribeContext): string {
    return JSON.stringify(this.value);
  }
  schema(ctx: SchemaContext): JSONSchema7 {
    if (ctx.mode == "contextual") {
      const tp = typeof this.value;
      if (tp === "string" || tp === "number" || tp === "boolean") {
        // OpenAPI mode prefers a type + enum for constant values
        return annotateSchema(this.metadata, {
          type: tp,
          enum: [this.value],
        });
      }
    }

    return annotateSchema(this.metadata, { const: this.value });
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
  hash256(ctx: Hash256Context): void {
    ctx.writer.updateTag("const");
    if (this.value == null) {
      ctx.writer.updateNull();
      return;
    }
    switch (typeof this.value) {
      case "string":
        ctx.writer.updateTag("string");
        ctx.writer.updateString(this.value);
        return;
      case "number":
        ctx.writer.updateTag("number");
        ctx.writer.updateNumber(this.value);
        return;
      case "boolean":
        ctx.writer.updateTag("boolean");
        ctx.writer.updateBoolean(this.value);
        return;
    }
  }
}

export class RegexRuntype extends BaseRuntype {
  private regex: RegExp;
  private description: string;

  constructor(metadata: RuntypeMetadata | undefined, regex: RegExp, description: string) {
    super(metadata);
    this.regex = regex;
    this.description = description;
  }

  protected describeTypeExpr(_ctx: DescribeContext): string {
    return this.description;
  }
  schema(_ctx: SchemaContext): JSONSchema7 {
    return annotateSchema(this.metadata, { type: "string", pattern: this.description });
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
  hash256(ctx: Hash256Context): void {
    ctx.writer.updateTag("regex");
    ctx.writer.updateString(this.description);
  }
}

export class DateRuntype extends BaseRuntype {
  constructor(metadata: RuntypeMetadata | undefined) {
    super(metadata);
  }

  protected describeTypeExpr(_ctx: DescribeContext): string {
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
  hash256(ctx: Hash256Context): void {
    ctx.writer.updateTag("date");
  }
}

export class BigIntRuntype extends BaseRuntype {
  constructor(metadata: RuntypeMetadata | undefined) {
    super(metadata);
  }

  protected describeTypeExpr(_ctx: DescribeContext): string {
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
  hash256(ctx: Hash256Context): void {
    ctx.writer.updateTag("bigint");
  }
}

export class TypedArrayRuntype extends BaseRuntype {
  private ctorName: string;
  private hashValue: number;

  constructor(metadata: RuntypeMetadata | undefined, ctorName: string) {
    super(metadata);
    this.ctorName = ctorName;
    this.hashValue = generateHashFromString(ctorName.toLowerCase());
  }
  private getCtor(): (new (...args: any[]) => ArrayBufferView) | undefined {
    return (globalThis as any)[this.ctorName];
  }
  protected describeTypeExpr(_ctx: DescribeContext): string {
    return this.ctorName;
  }
  schema(ctx: SchemaContext): JSONSchema7 {
    throw new Error(buildSchemaErrorMessage(ctx, `Cannot generate JSON Schema for ${this.ctorName}`));
  }
  validate(_ctx: ValidateContext, input: unknown): boolean {
    const ctor = this.getCtor();
    if (ctor == null) return false;
    return input instanceof ctor;
  }
  parseAfterValidation(_ctx: ParseContext, input: unknown): unknown {
    return input;
  }
  reportDecodeError(ctx: ReportContext, input: unknown): DecodeError[] {
    return buildError(ctx, `expected ${this.ctorName}`, input);
  }
  hash(_ctx: HashContext): number {
    return this.hashValue;
  }
  hash256(ctx: Hash256Context): void {
    ctx.writer.updateTag("typedArray");
    ctx.writer.updateString(this.ctorName);
  }
}

export class StringWithFormatRuntype extends BaseRuntype {
  private formats: string[];

  constructor(metadata: RuntypeMetadata | undefined, formats: string[]) {
    super(metadata);
    this.formats = formats;
  }
  protected describeTypeExpr(_ctx: DescribeContext): string {
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
    return annotateSchema(this.metadata, {
      type: "string",
      format: this.formats.join(" and "),
    });
  }
  validate(_ctx: ValidateContext, input: unknown): boolean {
    if (typeof input !== "string") {
      return false;
    }

    for (const f of this.formats) {
      const formatter = stringFormatters[f];
      const validator = formatter?.validator;

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
    return buildError(
      ctx,
      typeof input === "string"
        ? (resolveStringFormatErrorMessage(this.formats, input) ??
            `expected string with format "${this.formats.join(" and ")}"`)
        : `expected string with format "${this.formats.join(" and ")}"`,
      input,
    );
  }
  hash(_ctx: HashContext): number {
    let acc: number[] = [stringWithFormatHash];
    for (const f of [...this.formats].sort()) {
      acc.push(generateHashFromString(f));
    }
    return generateHashFromNumbers(acc);
  }
  hash256(ctx: Hash256Context): void {
    ctx.writer.updateTag("stringWithFormat");
    const formats = [...this.formats].sort();
    ctx.writer.updateNumber(formats.length);
    for (const f of formats) {
      ctx.writer.updateString(f);
    }
  }
}

export class NumberWithFormatRuntype extends BaseRuntype {
  private formats: string[];
  constructor(metadata: RuntypeMetadata | undefined, formats: string[]) {
    super(metadata);
    this.formats = formats;
  }
  protected describeTypeExpr(_ctx: DescribeContext): string {
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
    return annotateSchema(this.metadata, {
      type: "number",
      format: this.formats.join(" and "),
    });
  }
  validate(_ctx: ValidateContext, input: unknown): boolean {
    if (typeof input !== "number") {
      return false;
    }

    for (const f of this.formats) {
      const formatter = numberFormatters[f];
      const validator = formatter?.validator;

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
    return buildError(
      ctx,
      typeof input === "number"
        ? (resolveNumberFormatErrorMessage(this.formats, input) ??
            `expected number with format "${this.formats.join(" and ")}"`)
        : `expected number with format "${this.formats.join(" and ")}"`,
      input,
    );
  }
  hash(_ctx: HashContext): number {
    let acc: number[] = [numberWithFormatHash];
    for (const f of [...this.formats].sort()) {
      acc.push(generateHashFromString(f));
    }
    return generateHashFromNumbers(acc);
  }
  hash256(ctx: Hash256Context): void {
    ctx.writer.updateTag("numberWithFormat");
    const formats = [...this.formats].sort();
    ctx.writer.updateNumber(formats.length);
    for (const f of formats) {
      ctx.writer.updateString(f);
    }
  }
}

export class AnyOfConstsRuntype extends BaseRuntype {
  private values: Const[];
  constructor(metadata: RuntypeMetadata | undefined, values: Const[]) {
    super(metadata);
    this.values = values;
  }
  protected describeTypeExpr(_ctx: DescribeContext): string {
    const parts = this.values.map((it) => JSON.stringify(it));
    const inner = parts.join(" | ");
    return `(${inner})`;
  }
  schema(_ctx: SchemaContext): JSONSchema7 {
    const isSingleTypeof =
      this.values.length > 0 && this.values.every((v) => typeof v === typeof this.values[0]);
    if (isSingleTypeof) {
      const tp = typeof this.values[0];
      if (tp == "string" || tp === "number" || tp === "boolean") {
        return annotateSchema(this.metadata, {
          type: tp,
          enum: this.values,
        });
      }
    }

    return annotateSchema(this.metadata, {
      enum: this.values,
    });
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
  hash256(ctx: Hash256Context): void {
    ctx.writer.updateTag("anyOfConsts");
    const values = [...this.values].sort((a, b) => compareConst(a, b));
    ctx.writer.updateNumber(values.length);
    for (const v of values) {
      hash256Const(ctx, v);
    }
  }
}

export class TupleRuntype extends BaseRuntype {
  private prefix: Runtype[];
  private rest: Runtype | null;
  constructor(metadata: RuntypeMetadata | undefined, prefix: Runtype[], rest: Runtype | null) {
    super(metadata);
    this.prefix = prefix;
    this.rest = rest;
  }
  protected describeTypeExpr(ctx: DescribeContext): string {
    const prefix = this.prefix.map((it) => describeTypeExpr(ctx, it)).join(", ");
    const rest = this.rest != null ? `...Array<${describeTypeExpr(ctx, this.rest)}>` : null;

    const inner = [prefix, rest].filter((it) => it != null && it.length > 0).join(", ");
    return `[${inner}]`;
  }
  override describeChildren(): Runtype[] {
    return [...this.prefix, ...(this.rest == null ? [] : [this.rest])];
  }
  schema(ctx: SchemaContext): JSONSchema7 {
    pushPath(ctx, "[]");
    const prefixItems = this.prefix.map((it) => it.schema(ctx));
    const items = this.rest != null ? this.rest.schema(ctx) : false;
    popPath(ctx);
    return annotateSchema(this.metadata, {
      type: "array",
      prefixItems,
      items,
    } as any);
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
  hash256(ctx: Hash256Context): void {
    ctx.writer.updateTag("tuple");
    ctx.writer.updateNumber(this.prefix.length);
    for (const p of this.prefix) {
      p.hash256(ctx);
    }
    if (this.rest == null) {
      ctx.writer.updateTag("noRest");
    } else {
      ctx.writer.updateTag("rest");
      this.rest.hash256(ctx);
    }
  }
}

export class AllOfRuntype extends BaseRuntype {
  private schemas: Runtype[];
  constructor(metadata: RuntypeMetadata | undefined, schemas: Runtype[]) {
    super(metadata);
    this.schemas = schemas;
  }
  protected describeTypeExpr(ctx: DescribeContext): string {
    return `(${this.schemas.map((it) => describeTypeExpr(ctx, it)).join(" & ")})`;
  }
  override describeChildren(): Runtype[] {
    return this.schemas;
  }
  schema(ctx: SchemaContext): JSONSchema7 {
    const schemas = this.schemas.map((it) => it.schema(ctx));
    const merged = tryMergeAllOfObjectSchemas(schemas);
    if (merged != null) {
      return annotateSchema(this.metadata, merged);
    }

    return annotateSchema(this.metadata, {
      allOf: schemas,
    });
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
  hash256(ctx: Hash256Context): void {
    ctx.writer.updateTag("allOf");
    ctx.writer.updateNumber(this.schemas.length);
    for (const s of this.schemas) {
      s.hash256(ctx);
    }
  }
}

const MERGEABLE_OBJECT_SCHEMA_KEYS = new Set(["type", "properties", "required", "additionalProperties"]);

function tryMergeAllOfObjectSchemas(schemas: JSONSchema7[]): JSONSchema7 | null {
  const properties: Record<string, JSONSchema7Definition> = {};
  const required = new Set<string>();

  for (const schema of schemas) {
    if (!isMergeableClosedObjectSchema(schema)) {
      return null;
    }

    for (const key of schema.required ?? []) {
      required.add(key);
    }

    for (const [key, value] of Object.entries(schema.properties ?? {})) {
      const existing = properties[key];
      if (existing != null && !jsonSchemaDefinitionEquals(existing, value)) {
        return null;
      }
      properties[key] = value;
    }
  }

  return {
    type: "object",
    ...(Object.keys(properties).length > 0 ? { properties } : {}),
    ...(required.size > 0 ? { required: [...required] } : {}),
    additionalProperties: false,
  };
}

function isMergeableClosedObjectSchema(schema: JSONSchema7): boolean {
  if (schema.type !== "object" || schema.additionalProperties !== false) {
    return false;
  }

  for (const key of Object.keys(schema)) {
    if (!MERGEABLE_OBJECT_SCHEMA_KEYS.has(key)) {
      return false;
    }
  }

  if (schema.properties != null && typeof schema.properties !== "object") {
    return false;
  }

  return schema.required == null || schema.required.every((it) => typeof it === "string");
}

function jsonSchemaDefinitionEquals(a: JSONSchema7Definition, b: JSONSchema7Definition): boolean {
  return stableJsonSchemaDefinitionString(a) === stableJsonSchemaDefinitionString(b);
}

function stableJsonSchemaDefinitionString(value: JSONSchema7Definition): string {
  if (value == null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableJsonSchemaDefinitionString).join(",")}]`;
  }

  const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries
    .map(
      ([key, inner]) =>
        `${JSON.stringify(key)}:${stableJsonSchemaDefinitionString(inner as JSONSchema7Definition)}`,
    )
    .join(",")}}`;
}

export class AnyOfRuntype extends BaseRuntype {
  private schemas: Runtype[];
  constructor(metadata: RuntypeMetadata | undefined, schemas: Runtype[]) {
    super(metadata);
    this.schemas = schemas;
  }
  schema(ctx: SchemaContext): JSONSchema7 {
    return annotateSchema(this.metadata, {
      anyOf: this.schemas.map((it) => it.schema(ctx)),
    });
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
    const branchErrors: DecodeError[][] = [];
    const oldPaths = ctx.path;
    ctx.path = [];
    for (const v of this.schemas) {
      branchErrors.push(v.reportDecodeError(ctx, input));
    }
    ctx.path = oldPaths;

    // Filter to closest-matching branches by max error depth
    const depths = branchErrors.map((errors) => maxErrorDepth(errors));
    const bestDepth = Math.max(...depths);
    const filtered =
      bestDepth > 0 ? branchErrors.filter((_, i) => depths[i] === bestDepth).flat() : branchErrors.flat();

    return buildUnionError(ctx, filtered, input);
  }
  protected describeTypeExpr(ctx: DescribeContext): string {
    return `(${this.schemas.map((it) => describeTypeExpr(ctx, it)).join(" | ")})`;
  }
  override describeChildren(): Runtype[] {
    return this.schemas;
  }
  hash(ctx: HashContext): number {
    let acc: number[] = [anyOfHash];
    for (const s of this.schemas) {
      acc.push(s.hash(ctx));
    }
    return generateHashFromNumbers(acc);
  }
  hash256(ctx: Hash256Context): void {
    ctx.writer.updateTag("anyOf");
    ctx.writer.updateNumber(this.schemas.length);
    for (const s of this.schemas) {
      s.hash256(ctx);
    }
  }
}

export class ArrayRuntype extends BaseRuntype {
  private itemParser: Runtype;
  constructor(metadata: RuntypeMetadata | undefined, itemParser: Runtype) {
    super(metadata);
    this.itemParser = itemParser;
  }
  schema(ctx: SchemaContext): JSONSchema7 {
    pushPath(ctx, "[]");
    const items = this.itemParser.schema(ctx);
    popPath(ctx);
    return annotateSchema(this.metadata, {
      type: "array",
      items,
    });
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
  protected describeTypeExpr(ctx: DescribeContext): string {
    return `Array<${describeTypeExpr(ctx, this.itemParser)}>`;
  }
  override describeChildren(): Runtype[] {
    return [this.itemParser];
  }
  hash(_ctx: HashContext): number {
    return generateHashFromNumbers([arrayHash, this.itemParser.hash(_ctx)]);
  }
  hash256(ctx: Hash256Context): void {
    ctx.writer.updateTag("array");
    this.itemParser.hash256(ctx);
  }
}

export class MapRuntype extends BaseRuntype {
  private keyParser: Runtype;
  private valueParser: Runtype;
  constructor(metadata: RuntypeMetadata | undefined, keyParser: Runtype, valueParser: Runtype) {
    super(metadata);
    this.keyParser = keyParser;
    this.valueParser = valueParser;
  }
  protected describeTypeExpr(ctx: DescribeContext): string {
    return `Map<${describeTypeExpr(ctx, this.keyParser)}, ${describeTypeExpr(ctx, this.valueParser)}>`;
  }
  override describeChildren(): Runtype[] {
    return [this.keyParser, this.valueParser];
  }
  schema(ctx: SchemaContext): JSONSchema7 {
    throw new Error(buildSchemaErrorMessage(ctx, "Cannot generate JSON Schema for Map"));
  }
  validate(ctx: ValidateContext, input: unknown): boolean {
    if (input instanceof Map) {
      for (const [k, v] of input) {
        if (!this.keyParser.validate(ctx, k) || !this.valueParser.validate(ctx, v)) {
          return false;
        }
      }
      return true;
    }
    return false;
  }
  parseAfterValidation(ctx: ParseContext, input: any): unknown {
    const res = new Map();
    for (const [k, v] of input as Map<any, any>) {
      res.set(this.keyParser.parseAfterValidation(ctx, k), this.valueParser.parseAfterValidation(ctx, v));
    }
    return res;
  }
  reportDecodeError(ctx: ReportContext, input: unknown): DecodeError[] {
    if (!(input instanceof Map)) {
      return buildError(ctx, "expected Map", input);
    }
    let acc: DecodeError[] = [];
    for (const [k, v] of input) {
      pushPath(ctx, `key(${JSON.stringify(k)})`);
      if (!this.keyParser.validate(ctx, k)) {
        acc = acc.concat(this.keyParser.reportDecodeError(ctx, k));
      }
      popPath(ctx);
      pushPath(ctx, `value(${JSON.stringify(k)})`);
      if (!this.valueParser.validate(ctx, v)) {
        acc = acc.concat(this.valueParser.reportDecodeError(ctx, v));
      }
      popPath(ctx);
    }
    return acc;
  }
  hash(_ctx: HashContext): number {
    return generateHashFromNumbers([mapHash, this.keyParser.hash(_ctx), this.valueParser.hash(_ctx)]);
  }
  hash256(ctx: Hash256Context): void {
    ctx.writer.updateTag("map");
    this.keyParser.hash256(ctx);
    this.valueParser.hash256(ctx);
  }
}

export class SetRuntype extends BaseRuntype {
  private itemParser: Runtype;
  constructor(metadata: RuntypeMetadata | undefined, itemParser: Runtype) {
    super(metadata);
    this.itemParser = itemParser;
  }
  protected describeTypeExpr(ctx: DescribeContext): string {
    return `Set<${describeTypeExpr(ctx, this.itemParser)}>`;
  }
  override describeChildren(): Runtype[] {
    return [this.itemParser];
  }
  schema(ctx: SchemaContext): JSONSchema7 {
    throw new Error(buildSchemaErrorMessage(ctx, "Cannot generate JSON Schema for Set"));
  }
  validate(ctx: ValidateContext, input: unknown): boolean {
    if (input instanceof Set) {
      for (const v of input) {
        if (!this.itemParser.validate(ctx, v)) {
          return false;
        }
      }
      return true;
    }
    return false;
  }
  parseAfterValidation(ctx: ParseContext, input: any): unknown {
    const res = new Set();
    for (const v of input as Set<any>) {
      res.add(this.itemParser.parseAfterValidation(ctx, v));
    }
    return res;
  }
  reportDecodeError(ctx: ReportContext, input: unknown): DecodeError[] {
    if (!(input instanceof Set)) {
      return buildError(ctx, "expected Set", input);
    }
    let acc: DecodeError[] = [];
    for (const v of input) {
      pushPath(ctx, `item(${JSON.stringify(v)})`);
      if (!this.itemParser.validate(ctx, v)) {
        acc = acc.concat(this.itemParser.reportDecodeError(ctx, v));
      }
      popPath(ctx);
    }
    return acc;
  }
  hash(_ctx: HashContext): number {
    return generateHashFromNumbers([setHash, this.itemParser.hash(_ctx)]);
  }
  hash256(ctx: Hash256Context): void {
    ctx.writer.updateTag("set");
    this.itemParser.hash256(ctx);
  }
}

export class AnyOfDiscriminatedRuntype extends BaseRuntype {
  private schemas: Runtype[];
  private discriminator: string;
  private mapping: Record<string, Runtype>;
  private schemaMapping: Record<string, Runtype>;
  constructor(
    metadata: RuntypeMetadata | undefined,
    schemas: Runtype[],
    discriminator: string,
    mapping: Record<string, Runtype>,
    schemaMapping: Record<string, Runtype>,
  ) {
    super(metadata);
    this.schemas = schemas;
    this.discriminator = discriminator;
    this.mapping = mapping;
    this.schemaMapping = schemaMapping;
  }
  schema(ctx: SchemaContext): JSONSchema7 {
    if (ctx.mode === "contextual" && ctx.printingContext != null) {
      const variantRefs = this.getSchemaVariantRefs(ctx);

      return annotateSchema(this.metadata, {
        type: "object",
        discriminator: {
          propertyName: this.discriminator,
          mapping: Object.fromEntries(variantRefs.map(({ key, ref }) => [key, ref])),
        },
        oneOf: variantRefs.map(({ ref }) => ({ $ref: ref })),
      });
    }

    return annotateSchema(this.metadata, {
      type: "object",
      discriminator: {
        propertyName: this.discriminator,
      },
      anyOf: this.schemas.map((it) => it.schema(ctx)),
    });
  }
  private getSchemaVariantRefs(ctx: SchemaContext): Array<{ key: string; ref: string }> {
    const unionHash = this.hash({ seen: {} });
    return Object.entries(this.schemaMapping).map(([key, schema]) => ({
      key,
      ref: this.ensureSchemaVariantRef(schema, key, unionHash, ctx),
    }));
  }

  private getPrintingContext(ctx: SchemaContext): SchemaPrintingContext {
    const printingContext = ctx.printingContext;
    if (printingContext == null) {
      throw new Error("INTERNAL ERROR: Missing SchemaPrintingContext");
    }
    return printingContext;
  }

  private getRefTarget(runtype: Runtype): { name: string; target: Runtype } | null {
    if (!(runtype instanceof BaseRefRuntype)) {
      return null;
    }

    const name = runtype.refName;
    return {
      name,
      target: runtype.getNamedRuntypes()[name],
    };
  }

  private static sanitizeComponentNamePart(value: string): string {
    const cleaned = value.replace(/[^a-zA-Z0-9]+/g, " ").trim();
    if (cleaned.length === 0) {
      return "Variant";
    }
    return cleaned
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
  }

  private static getSyntheticRefName(discriminator: string, key: string, unionHash: number): string {
    const discriminatorPart = AnyOfDiscriminatedRuntype.sanitizeComponentNamePart(discriminator);
    const keyPart = AnyOfDiscriminatedRuntype.sanitizeComponentNamePart(key);
    return `Discriminated${discriminatorPart}${keyPart}${Math.abs(unionHash)}`;
  }

  private ensureContextualDefinition(name: string, target: Runtype, ctx: SchemaContext): void {
    const printingContext = this.getPrintingContext(ctx);
    if (printingContext.hasDefinition(name) || printingContext.isDefinitionInProgress(name)) {
      return;
    }
    printingContext.markDefinitionInProgress(name);
    const body = target.schema(ctx);
    printingContext.storeDefinition(name, body);
  }

  private ensureSchemaVariantRef(
    runtype: Runtype,
    key: string,
    unionHash: number,
    ctx: SchemaContext,
  ): string {
    const printingContext = this.getPrintingContext(ctx);
    const refTarget = this.getRefTarget(runtype);
    if (refTarget != null) {
      this.ensureContextualDefinition(refTarget.name, refTarget.target, ctx);
      return printingContext.getRef(refTarget.name);
    }

    const syntheticRefName = AnyOfDiscriminatedRuntype.getSyntheticRefName(
      this.discriminator,
      key,
      unionHash,
    );
    this.ensureContextualDefinition(syntheticRefName, runtype, ctx);
    return printingContext.getRef(syntheticRefName);
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
  protected describeTypeExpr(ctx: DescribeContext): string {
    return `(${this.schemas.map((it) => describeTypeExpr(ctx, it)).join(" | ")})`;
  }
  override describeChildren(): Runtype[] {
    return this.schemas;
  }
  hash(ctx: HashContext): number {
    let acc: number[] = [anyOfHash];
    for (const s of this.schemas) {
      acc.push(s.hash(ctx));
    }
    return generateHashFromNumbers(acc);
  }
  hash256(ctx: Hash256Context): void {
    ctx.writer.updateTag("anyOfDiscriminated");
    ctx.writer.updateString(this.discriminator);
    ctx.writer.updateNumber(this.schemas.length);
    for (const s of this.schemas) {
      s.hash256(ctx);
    }
    const mappingKeys = Object.keys(this.mapping).sort();
    ctx.writer.updateNumber(mappingKeys.length);
    for (const key of mappingKeys) {
      ctx.writer.updateString(key);
      this.mapping[key].hash256(ctx);
    }
  }
}

export class OptionalFieldRuntype implements Runtype {
  readonly t: Runtype;

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
  // validate() returns true for null/undefined, so reportDecodeError is only
  // called when input is non-null. Reporting "expected nullish value" here
  // would be noise — only the inner type's errors are relevant.
  reportDecodeError(ctx: ReportContext, input: unknown): DecodeError[] {
    return this.t.reportDecodeError(ctx, input);
  }
  describe(ctx: DescribeContext): TypeDescription {
    return this.t.describe(ctx);
  }
  describeChildren(): Runtype[] {
    return [this.t];
  }
  hash(ctx: HashContext): number {
    let acc = [optionalFieldHash, this.t.hash(ctx)];
    return generateHashFromNumbers(acc);
  }
  hash256(ctx: Hash256Context): void {
    ctx.writer.updateTag("optionalField");
    this.t.hash256(ctx);
  }
}

export class ObjectRuntype extends BaseRuntype {
  private properties: Record<string, Runtype>;
  private indexedPropertiesParser: Array<{
    key: Runtype;
    value: Runtype;
  }>;
  constructor(
    metadata: RuntypeMetadata | undefined,
    properties: Record<string, Runtype>,
    indexedPropertiesParser: Array<{
      key: Runtype;
      value: Runtype;
    }>,
  ) {
    super(metadata);
    this.properties = properties;
    this.indexedPropertiesParser = indexedPropertiesParser;
  }
  protected describeTypeExpr(ctx: DescribeContext): string {
    const sortedKeys = Object.keys(this.properties).sort();
    const props = sortedKeys.map((k) => {
      const it = this.properties[k];
      return describeObjectMember(ctx, k, it);
    });

    const indexProps = this.indexedPropertiesParser.map(({ key, value }) =>
      describeIndexObjectMember(ctx, key, value),
    );

    const members = [...props, ...indexProps];
    const hasMemberDescriptions = members.some((it) => it.docText != null);
    if (hasMemberDescriptions) {
      if (members.length === 0) {
        return "{}";
      }
      const content = members.map(renderObjectMember).join(" ");
      return `{ ${content} }`;
    }

    const content = members.map((it) => it.member).join(", ");
    return `{ ${content} }`;
  }
  override describeChildren(): Runtype[] {
    return [
      ...Object.values(this.properties),
      ...this.indexedPropertiesParser.flatMap(({ key, value }) => [key, value]),
    ];
  }
  schema(ctx: SchemaContext): JSONSchema7 {
    const properties: Record<string, JSONSchema7Definition> = {};
    const optionalized = new Set<string>();
    for (const k in this.properties) {
      pushPath(ctx, k);
      const item = this.properties[k];
      const raw = item.schema(ctx);
      const rewrite = removeNullUnionBranch(raw);
      if (rewrite != null) {
        properties[k] = rewrite;
        optionalized.add(k);
      } else {
        properties[k] = raw;
      }
      popPath(ctx);
    }

    const required = Object.keys(this.properties).filter((k) => !optionalized.has(k));
    const base: JSONSchema7 = {
      type: "object",
      properties,
      ...(required.length > 0 ? { required } : {}),
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
      return annotateSchema(this.metadata, { ...base, additionalProperties: false });
    }

    // special case for Record<string, T> with no named properties
    if (Object.keys(properties).length === 0 && indexSchemas.length === 1) {
      const valueRuntype = this.indexedPropertiesParser[0].value;

      // Record<string, never> -> empty closed object (keys don't matter)
      if (valueRuntype instanceof NeverRuntype) {
        return annotateSchema(this.metadata, { type: "object", additionalProperties: false });
      }

      // Record<string, unknown> -> simplify additionalProperties to true
      if (valueRuntype instanceof AnyRuntype) {
        return annotateSchema(this.metadata, { ...indexSchemas[0], additionalProperties: true });
      }

      return annotateSchema(this.metadata, indexSchemas[0]);
    }

    return annotateSchema(this.metadata, {
      allOf: [base, ...indexSchemas],
    });
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
    const hasOwn = Object.prototype.hasOwnProperty;

    if (ctx.objectKeyOrder === "input") {
      for (const k of inputKeys) {
        if (hasOwn.call(this.properties, k)) {
          acc[k] = this.properties[k].parseAfterValidation(ctx, input[k]);
          continue;
        }

        for (const p of this.indexedPropertiesParser) {
          const v = input[k];
          const isValid = p.key.validate(ctx, k) && p.value.validate(ctx, v);
          if (isValid) {
            const itemParsed = p.value.parseAfterValidation(ctx, v);
            const keyParsed = p.key.parseAfterValidation(ctx, k);
            acc[keyParsed as any] = itemParsed;
          }
        }
      }
    } else {
      const configKeys = Object.keys(this.properties).sort();

      for (const k of configKeys) {
        if (!hasOwn.call(input, k)) {
          continue;
        }
        const v = input[k];
        const itemParsed = this.properties[k].parseAfterValidation(ctx, v);
        acc[k] = itemParsed;
      }

      if (this.indexedPropertiesParser.length > 0) {
        const extraKeys = inputKeys.filter((k) => !(k in this.properties)).sort();
        for (const k of extraKeys) {
          const v = input[k];
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
  hash256(ctx: Hash256Context): void {
    ctx.writer.updateTag("object");
    const keys = Object.keys(this.properties).sort();
    ctx.writer.updateNumber(keys.length);
    for (const key of keys) {
      const parser = this.properties[key];
      ctx.writer.updateString(key);
      ctx.writer.updateBoolean(parser instanceof OptionalFieldRuntype);
      parser.hash256(ctx);
    }
    ctx.writer.updateNumber(this.indexedPropertiesParser.length);
    for (const p of this.indexedPropertiesParser) {
      p.key.hash256(ctx);
      p.value.hash256(ctx);
    }
  }
}
export abstract class BaseRefRuntype extends BaseRuntype {
  refName: string;
  constructor(metadata: RuntypeMetadata | undefined, refName: string) {
    super(metadata);
    this.refName = refName;
  }
  abstract getNamedRuntypes(): Record<string, Runtype>;
  protected describeTypeExpr(_ctx: DescribeContext): string {
    return this.refName;
  }
  collectDescribeRefs(ctx: DescribeContext): void {
    const name = this.refName;
    ctx.refCounts[name] = (ctx.refCounts[name] || 0) + 1;
    if (ctx.activeRefs.has(name)) {
      return;
    }
    if (ctx.visitedRefs.has(name)) {
      return;
    }

    ctx.visitedRefs.add(name);
    ctx.activeRefs.add(name);
    collectDescribeRefs(this.getNamedRuntypes()[name], ctx);
    ctx.activeRefs.delete(name);
  }
  override describe(ctx: DescribeContext): TypeDescription {
    const name = this.refName;
    const to = this.getNamedRuntypes()[this.refName];
    const refDescription = () => typeDescription(name, this.metadata?.description);
    if (ctx.refCounts[name] > 1) {
      if (ctx.activeRefs.has(name)) {
        return refDescription();
      }
      if (ctx.definitions[name] == null) {
        ctx.activeRefs.add(name);
        ctx.definitions[name] = to.describe(ctx);
        ctx.activeRefs.delete(name);
      }
      return refDescription();
    }
    const target = to.describe(ctx);
    return this.metadata?.description == null
      ? target
      : typeDescription(target.typeExpr, this.metadata.description);
  }
  schema(ctx: SchemaContext): JSONSchema7 {
    const name = this.refName;
    const to = this.getNamedRuntypes()[this.refName];
    if (ctx.mode === "contextual") {
      const printingContext = ctx.printingContext;
      if (printingContext == null) {
        throw new Error("INTERNAL ERROR: Missing SchemaPrintingContext");
      }
      if (!printingContext.hasDefinition(name) && !printingContext.isDefinitionInProgress(name)) {
        printingContext.markDefinitionInProgress(name);
        const schemaTarget = printingContext.getNamedTypeSchemaOverride(name) ?? to;
        const body = schemaTarget.schema(ctx);
        printingContext.storeDefinition(name, body);
      }
      return annotateSchema(this.metadata, { $ref: printingContext.getRef(name) });
    }
    if (ctx.seen[name]) {
      return annotateSchema(this.metadata, {});
    }
    ctx.seen[name] = true;
    var tmp = to.schema(ctx);
    delete ctx.seen[name];
    return annotateSchema(this.metadata, tmp);
  }
  hash(ctx: HashContext): number {
    const name = this.refName;
    const to = this.getNamedRuntypes()[this.refName];
    if (ctx.seen[name]) {
      return generateHashFromString(name);
    }
    ctx.seen[name] = true;
    var tmp = to.hash(ctx);
    delete ctx.seen[name];
    return tmp;
  }
  hash256(ctx: Hash256Context): void {
    const to = this.getNamedRuntypes()[this.refName];
    const activeId = ctx.active.get(to);
    if (activeId != null) {
      ctx.writer.updateTag("cycleRef");
      ctx.writer.updateNumber(activeId);
      return;
    }

    const id = ctx.nextCycleId;
    ctx.nextCycleId++;
    ctx.active.set(to, id);
    to.hash256(ctx);
    ctx.active.delete(to);
  }
  validate(ctx: ValidateContext, input: any): boolean {
    const to = this.getNamedRuntypes()[this.refName];
    return to.validate(ctx, input);
  }
  parseAfterValidation(ctx: ParseContext, input: any): any {
    const to = this.getNamedRuntypes()[this.refName];
    return to.parseAfterValidation(ctx, input);
  }
  reportDecodeError(ctx: ReportContext, input: any): DecodeError[] {
    const to = this.getNamedRuntypes()[this.refName];
    return to.reportDecodeError(ctx, input);
  }
}

const namedRuntypes: Record<string, Runtype> = {};

class RuntimeRefRuntype extends BaseRefRuntype {
  getNamedRuntypes(): Record<string, Runtype> {
    return namedRuntypes;
  }
}
const createNamedTypeImpl = (name: string, runtype: Runtype) => {
  if (name in namedRuntypes) {
    throw new Error(`Named type ${name} already exists`);
  }
  namedRuntypes[name] = runtype;
  return buildParserFromRuntype(new RuntimeRefRuntype(undefined, name), name, false);
};
export const createNamedType = <T>(name: string, p: BeffParser<T>): BeffParser<T> => {
  return createNamedTypeImpl(name, (p as ParserFromRuntype)._runtype);
};
export const overrideNamedType = (name: string, runtype: BeffParser<any>): void => {
  if (!(name in namedRuntypes)) {
    throw new Error(`Named type ${name} does not exist`);
  }
  namedRuntypes[name] = (runtype as ParserFromRuntype)._runtype;
};

class ParserFromRuntype implements BeffParser<any> {
  _runtype: Runtype;
  name: string;
  private hideTypeNameInDescribe: boolean;
  constructor(runtype: Runtype, name: string, hideTypeNameInDescribe: boolean) {
    this._runtype = runtype;
    this.name = name;
    this.hideTypeNameInDescribe = hideTypeNameInDescribe;
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
    const objectKeyOrder = options?.objectKeyOrder ?? "input";
    const ok = this.validate(input, options);
    if (ok) {
      let ctx = { disallowExtraProperties, objectKeyOrder };
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
      mode: "flat" as const,
    };
    return this._runtype.schema(ctx);
  }
  schemaWithContext(schemaPrintingContext: SchemaPrintingContext): JSONSchema7 {
    const ctx = {
      path: [],
      seen: {},
      mode: "contextual" as const,
      printingContext: schemaPrintingContext,
    };
    return this._runtype.schema(ctx);
  }
  describe(): string {
    const ctx: DescribeContext = {
      activeRefs: new Set(),
      definitions: {},
      refCounts: {},
      visitedRefs: new Set(),
    };
    collectDescribeRefs(this._runtype, ctx);
    const out = this._runtype.describe(ctx);
    let sortedDepsKeys = Object.keys(ctx.definitions).sort();
    const depsPart = sortedDepsKeys
      .map((key): [string, TypeDescription] => [key, ctx.definitions[key]])
      .map(([key, description]) => renderTypeAlias(key, description))
      .join("\n\n");

    if (this.hideTypeNameInDescribe) {
      return [depsPart, renderTypeDescription(out)].filter((it) => it != null && it.length > 0).join("\n\n");
    }
    const outPart = renderTypeAlias(`Codec${this.name}`, out);
    return [depsPart, outPart].filter((it) => it != null && it.length > 0).join("\n\n");
  }
  hash(): number {
    const ctx = {
      seen: {},
    };
    return this._runtype.hash(ctx);
  }
  hash256(): string {
    const ctx: Hash256Context = {
      writer: new Hash256Writer(),
      active: new Map(),
      nextCycleId: 0,
    };
    ctx.writer.updateTag("beff-hash256-v1");
    this._runtype.hash256(ctx);
    return ctx.writer.digestHex();
  }
}

export const buildParserFromRuntype = (
  runtype: Runtype,
  name: string,
  hideTypeNameInDescribe: boolean,
): BeffParser<any> => new ParserFromRuntype(runtype, name, hideTypeNameInDescribe);
