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
import { JSONSchema7, JSONSchema7Definition, JSONSchema7TypeName } from "./json-schema.js";
import { removeNullUnionBranch } from "./openapi-pp.js";
import { printErrors } from "./err.js";
export { generateHashFromString, generateHashFromNumbers } from "./hash.js";

const JSON_PROTO = Object.getPrototypeOf({});

function deepmergeConstructor(options: any) {
  // Define keys as own properties. Assigning to "__proto__" would set the prototype.
  function setKey(result: any, key: any, value: any) {
    if (key === "__proto__") {
      Object.defineProperty(result, key, { value, enumerable: true, writable: true, configurable: true });
    } else {
      result[key] = value;
    }
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
      key = targetKeys[i];
      setKey(result, key, clone(target[key]));
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
      !(value instanceof Map) &&
      !(value instanceof Set) &&
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
      key = targetKeys[i];
      sourceKeys.indexOf(key) === -1 && setKey(result, key, clone(target[key]));
    }

    for (i = 0, il = sourceKeys.length; i < il; ++i) {
      key = sourceKeys[i];

      if (targetKeys.indexOf(key) !== -1) {
        if (
          cloneProtoObject &&
          isMergeableObject(source[key]) &&
          Object.getPrototypeOf(source[key]) !== JSON_PROTO
        ) {
          setKey(result, key, cloneProtoObject(source[key]));
        } else {
          setKey(result, key, _deepmerge(target[key], source[key]));
        }
      } else {
        setKey(result, key, clone(source[key]));
      }
    }
    return result;
  }

  function _deepmerge(target: any, source: any) {
    const sourceIsArray = Array.isArray(source);
    const targetIsArray = Array.isArray(target);

    if (isPrimitive(source) || source instanceof Map || source instanceof Set) {
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

// JSON.stringify throws on bigint values. Write them as `123n`.
function stringifyWithBigInt(value: unknown): string {
  return JSON.stringify(value, (_key, it) => (typeof it === "bigint" ? `${it}n` : it));
}

function deduplicateErrors(errors: DecodeError[]): DecodeError[] {
  const seen = new Set<string>();
  return errors.filter((err) => {
    const key = stringifyWithBigInt(err);
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
// Reports the errors of the child value at `key`, if it is invalid.
function reportAtPath(
  ctx: Ctx,
  acc: DecodeError[],
  key: string,
  validate: Validate,
  reportErrors: Report,
  input: unknown,
): void {
  if (!validate(ctx, input)) {
    pushPath(ctx, key);
    acc.push(...reportErrors(ctx, input));
    popPath(ctx);
  }
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
      jsonSchemaFormat?: string;
    };
type RegisteredStringFormat = {
  validator: UserProvidedStringValidatorFn;
  errorMessage?: UserProvidedStringErrorMessageFn;
  jsonSchemaFormat?: string;
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
      jsonSchemaFormat?: string;
    };
type RegisteredNumberFormat = {
  validator: UserProvidedNumberValidatorFn;
  errorMessage?: UserProvidedNumberErrorMessageFn;
  jsonSchemaFormat?: string;
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

function resolveFormatErrorMessage<T>(
  formatters: Record<string, { errorMessage?: (input: T) => string }>,
  formats: string[],
  input: T,
): string | undefined {
  for (const f of [...formats].reverse()) {
    const formatter = formatters[f];
    const errorMessage = formatter?.errorMessage;
    if (errorMessage != null) {
      return errorMessage(input);
    }
  }
  return undefined;
}

function describeFormats(typeName: "String" | "Number", formats: string[]): string {
  if (formats.length === 0) {
    throw new Error("INTERNAL ERROR: No formats provided");
  }
  const [first, ...rest] = formats;
  let acc = `${typeName}Format<"${first}">`;
  for (const r of rest) {
    acc = `${typeName}FormatExtends<${acc}, "${r}">`;
  }
  return acc;
}

function hashFormats(seed: number, formats: string[]): number {
  let acc: number[] = [seed];
  for (const f of [...formats].sort()) {
    acc.push(generateHashFromString(f));
  }
  return generateHashFromNumbers(acc);
}

function hash256Formats(ctx: Hash256Context, tag: string, formats: string[]): void {
  ctx.writer.updateTag(tag);
  const sorted = [...formats].sort();
  ctx.writer.updateNumber(sorted.length);
  for (const f of sorted) {
    ctx.writer.updateString(f);
  }
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

type Ctx = {
  disallowExtraProperties: boolean;
  objectKeyOrder: "input" | "sorted";
  // The input an intersection is checking. Its members leave the keys of this input they do not know to the
  // intersection: another member may know them.
  intersectionInput: unknown;
  path: string[];
};

// All contexts get the same fields in the same order when they are created. Then V8 uses one hidden class for
// all of them, and the reads of these fields in validate and parse stay fast.
function newCtx(options: ParseOptions | undefined): Ctx {
  return {
    disallowExtraProperties: options?.disallowExtraProperties ?? false,
    objectKeyOrder: options?.objectKeyOrder ?? "input",
    intersectionInput: undefined,
    path: [],
  };
}

// Should an intersection check the extra properties of this input against the keys of all its members?
function intersectionChecksExtraProperties(ctx: Ctx, input: unknown): boolean {
  return (
    ctx.disallowExtraProperties &&
    typeof input === "object" &&
    input !== null &&
    ctx.intersectionInput !== input
  );
}

type HashContext = {
  seen: Record<string, boolean>;
};

type Hash256Context = {
  writer: Hash256Writer;
  active: Map<Runtype, number>;
  nextCycleId: number;
};

type Validate = (ctx: Ctx, input: any) => boolean;
type Parse = (ctx: Ctx, input: any) => any;
type Report = (ctx: Ctx, input: any) => DecodeError[];

// The tag of a node tells other nodes what kind of node it is, where they must know it. For example, `object`
// finds its optional properties by the tag TAG_OPTIONAL. Most nodes have the tag TAG_NONE.
const TAG_NONE = 0;
const TAG_OPTIONAL = 1;
const TAG_NEVER = 2;
const TAG_ANY = 3;
const TAG_REFERENCE = 4;

// A node of a parser. Every builder below returns one, and all nodes have the same fields.
export type Runtype = {
  tag: number;
  // Is the input valid?
  validate: Validate;
  // Parse an input that `validate` accepted.
  parse: Parse;
  // The errors of an input that `validate` rejected.
  reportErrors: Report;
  describe: (ctx: DescribeContext) => TypeDescription;
  schema: (ctx: SchemaContext) => JSONSchema7;
  hash: (ctx: HashContext) => number;
  hash256: (ctx: Hash256Context) => void;
  // The name of the type a reference points to.
  name: string | undefined;
  // The child nodes. A reference has one child, the type it points to now.
  children: () => Runtype[];
};

const noChildren = (): Runtype[] => [];
const parseReturnsInput: Parse = (_ctx, input) => input;

// Makes a node. All nodes get the same fields in the same order, so V8 uses one hidden class for all of them.
function node(fields: Omit<Runtype, "name">): Runtype {
  return {
    tag: fields.tag,
    validate: fields.validate,
    parse: fields.parse,
    reportErrors: fields.reportErrors,
    describe: fields.describe,
    schema: fields.schema,
    hash: fields.hash,
    hash256: fields.hash256,
    name: undefined,
    children: fields.children,
  };
}

// A node without children. Parsing returns the input.
function leaf(fields: {
  tag: number;
  validate: Validate;
  message: string;
  typeExpr: string;
  schema: Runtype["schema"];
  hash: Runtype["hash"];
  hash256: Runtype["hash256"];
}): Runtype {
  const { message, typeExpr } = fields;
  return node({
    tag: fields.tag,
    validate: fields.validate,
    parse: parseReturnsInput,
    reportErrors: (ctx, input) => buildError(ctx, message, input),
    describe: () => ({ typeExpr }),
    schema: fields.schema,
    hash: fields.hash,
    hash256: fields.hash256,
    children: noChildren,
  });
}

// Returns a copy of the node with a description. The description replaces the doc text of the node, and it is
// added to its schema. The node itself does not change, because other nodes can use it.
export function withDescription(runtype: Runtype, description: string): Runtype {
  const { describe, schema } = runtype;
  return {
    ...runtype,
    describe: (ctx) => ({ typeExpr: describe(ctx).typeExpr, docText: description }),
    schema: (ctx) => ({ ...schema(ctx), description }),
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

// Quote a property name if it is not a valid identifier or a plain number.
function describePropertyKey(key: string): string {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) || /^(0|[1-9][0-9]*)$/.test(key)) {
    return key;
  }
  return JSON.stringify(key);
}

function describeObjectMember(
  ctx: DescribeContext,
  key: string,
  value: Runtype,
): { docText?: string; member: string } {
  const optionalMark = value.tag === TAG_OPTIONAL ? "?" : "";
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
  if (runtype.tag === TAG_REFERENCE) {
    const name = runtype.name!;
    ctx.refCounts[name] = (ctx.refCounts[name] || 0) + 1;
    if (ctx.activeRefs.has(name)) {
      return;
    }
    if (ctx.visitedRefs.has(name)) {
      return;
    }

    ctx.visitedRefs.add(name);
    ctx.activeRefs.add(name);
    collectDescribeRefs(runtype.children()[0], ctx);
    ctx.activeRefs.delete(name);
    return;
  }

  for (const child of runtype.children()) {
    collectDescribeRefs(child, ctx);
  }
}

const hash256Tag =
  (tag: string): Runtype["hash256"] =>
  (ctx) =>
    ctx.writer.updateTag(tag);

function typeOf(typeName: string, validate: Validate, hash: number): Runtype {
  return leaf({
    tag: TAG_NONE,
    validate,
    message: "expected " + typeName,
    typeExpr: typeName,
    schema: () => ({ type: typeName as JSONSchema7TypeName }),
    hash: () => hash,
    hash256: (ctx) => {
      ctx.writer.updateTag("typeof");
      ctx.writer.updateString(typeName);
    },
  });
}
export const string = (): Runtype => typeOf("string", (_ctx, input) => typeof input === "string", stringHash);
export const number = (): Runtype => typeOf("number", (_ctx, input) => typeof input === "number", numberHash);
export const boolean = (): Runtype =>
  typeOf("boolean", (_ctx, input) => typeof input === "boolean", booleanHash);
// The hash of a function type is undefined. It was undefined on the runtype classes too, and the hash must not
// change.
export const functionType = (): Runtype =>
  typeOf("function", (_ctx, input) => typeof input === "function", undefined as any);

// The key of a number index signature, such as Record<number, T>.
// Object keys are always strings, so the key must be a numeric string.
const NUMBER_KEY_PATTERN = "^-?(0|[1-9][0-9]*)(\\.[0-9]+)?([eE][+-]?[0-9]+)?$";
const NUMBER_KEY_REGEX = new RegExp(NUMBER_KEY_PATTERN);
export const numberKey = (): Runtype =>
  leaf({
    tag: TAG_NONE,
    validate: (_ctx, input) => typeof input === "string" && NUMBER_KEY_REGEX.test(input),
    message: "expected number key",
    typeExpr: "number",
    schema: () => ({ type: "string", pattern: NUMBER_KEY_PATTERN }),
    // Hash as `number`, so the hash of Record<number, T> does not change.
    hash: () => numberHash,
    hash256: (ctx) => {
      ctx.writer.updateTag("typeof");
      ctx.writer.updateString("number");
    },
  });

export const any = (): Runtype =>
  leaf({
    tag: TAG_ANY,
    validate: () => true,
    message: "expected any",
    typeExpr: "any",
    schema: () => ({}),
    hash: () => unknownHash,
    hash256: hash256Tag("any"),
  });

const nullish = (description: "undefined" | "null" | "void"): Runtype =>
  leaf({
    tag: TAG_NONE,
    validate: (_ctx, input) => input == null,
    message: "expected nullish value",
    typeExpr: description,
    schema: () => ({ type: "null" }),
    hash: () => nullishHash,
    hash256: hash256Tag("nullish"),
  });
export const nullType = (): Runtype => nullish("null");
export const undefinedType = (): Runtype => nullish("undefined");
export const voidType = (): Runtype => nullish("void");

export const never = (): Runtype =>
  node({
    tag: TAG_NEVER,
    validate: () => false,
    parse: () => {
      throw new Error("unreachable");
    },
    reportErrors: (ctx, input) => buildError(ctx, "expected never", input),
    describe: () => ({ typeExpr: "never" }),
    schema: () => ({ anyOf: [] }),
    hash: () => undefinedHash,
    hash256: hash256Tag("never"),
    children: noChildren,
  });

type Const = string | number | boolean | null;

function constSortKey(value: Const): string {
  if (value == null) return "null:";
  return `${typeof value}:${String(value)}`;
}

function compareConst(a: Const, b: Const): number {
  return constSortKey(a).localeCompare(constSortKey(b));
}

function hashConst(value: Const): number {
  if (value == null) {
    return nullishHash;
  }
  switch (typeof value) {
    case "string":
      return generateHashFromString(value);
    case "number":
      return generateHashFromNumbers([value]);
    case "boolean":
      return generateHashFromString(value ? "true" : "false");
  }
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

export function literal(constValue: Const): Runtype {
  const value = constValue ?? null;
  return leaf({
    tag: TAG_NONE,
    validate: value == null ? (_ctx, input) => input == null : (_ctx, input) => input === value,
    message: `expected ${JSON.stringify(value)}`,
    typeExpr: JSON.stringify(value),
    schema: (ctx) => {
      if (ctx.mode == "contextual") {
        const tp = typeof value;
        if (tp === "string" || tp === "number" || tp === "boolean") {
          // OpenAPI mode prefers a type + enum for constant values
          return {
            type: tp,
            enum: [value],
          };
        }
      }

      return { const: value };
    },
    hash: () => hashConst(value),
    hash256: (ctx) => {
      ctx.writer.updateTag("const");
      hash256Const(ctx, value);
    },
  });
}

export const regex = (re: RegExp, description: string): Runtype =>
  leaf({
    tag: TAG_NONE,
    validate: (_ctx, input) => typeof input === "string" && re.test(input),
    message: `expected string matching ${description}`,
    typeExpr: description,
    schema: () => ({ type: "string", pattern: re.source }),
    hash: () => generateHashFromString(description),
    hash256: (ctx) => {
      ctx.writer.updateTag("regex");
      ctx.writer.updateString(description);
    },
  });

const noSchema =
  (typeName: string): Runtype["schema"] =>
  (ctx) => {
    throw new Error(buildSchemaErrorMessage(ctx, `Cannot generate JSON Schema for ${typeName}`));
  };

export const date = (): Runtype =>
  leaf({
    tag: TAG_NONE,
    validate: (_ctx, input) => input instanceof Date,
    message: "expected Date",
    typeExpr: "Date",
    schema: noSchema("Date"),
    hash: () => dateHash,
    hash256: hash256Tag("date"),
  });

export const bigint = (): Runtype =>
  leaf({
    tag: TAG_NONE,
    validate: (_ctx, input) => typeof input === "bigint",
    message: "expected BigInt",
    typeExpr: "BigInt",
    schema: noSchema("BigInt"),
    hash: () => bigintHash,
    hash256: hash256Tag("bigint"),
  });

export const typedArray = (ctorName: string): Runtype =>
  leaf({
    tag: TAG_NONE,
    validate: (_ctx, input) => {
      const ctor = (globalThis as any)[ctorName];
      if (ctor == null) return false;
      return input instanceof ctor;
    },
    message: `expected ${ctorName}`,
    typeExpr: ctorName,
    schema: noSchema(ctorName),
    hash: () => generateHashFromString(ctorName.toLowerCase()),
    hash256: (ctx) => {
      ctx.writer.updateTag("typedArray");
      ctx.writer.updateString(ctorName);
    },
  });

function withFormat(
  typeName: "string" | "number",
  formatters: Record<
    string,
    { validator: (input: any) => boolean; errorMessage?: (input: any) => string; jsonSchemaFormat?: string }
  >,
  formats: string[],
): Runtype {
  const expected = `expected ${typeName} with format "${formats.join(" and ")}"`;
  return node({
    tag: TAG_NONE,
    validate: (_ctx, input) => {
      if (typeof input !== typeName) {
        return false;
      }

      for (const format of formats) {
        const validator = formatters[format]?.validator;

        if (validator == null) {
          return false;
        }

        if (!validator(input)) {
          return false;
        }
      }

      return true;
    },
    parse: parseReturnsInput,
    reportErrors: (ctx, input) =>
      buildError(
        ctx,
        typeof input === typeName
          ? (resolveFormatErrorMessage(formatters, formats, input) ?? expected)
          : expected,
        input,
      ),
    describe: () => ({ typeExpr: describeFormats(typeName === "string" ? "String" : "Number", formats) }),
    schema: () => ({
      type: typeName,
      format: formatters[formats[formats.length - 1]]?.jsonSchemaFormat ?? formats.join(" and "),
    }),
    hash: () => hashFormats(typeName === "string" ? stringWithFormatHash : numberWithFormatHash, formats),
    hash256: (ctx) => hash256Formats(ctx, `${typeName}WithFormat`, formats),
    children: noChildren,
  });
}
export const stringWithFormat = (formats: string[]): Runtype =>
  withFormat("string", stringFormatters, formats);
export const numberWithFormat = (formats: string[]): Runtype =>
  withFormat("number", numberFormatters, formats);

export function literals(values: Const[]): Runtype {
  const known = new Set<unknown>(values);
  const hasNull = known.has(null);
  return leaf({
    tag: TAG_NONE,
    validate: (_ctx, input) => (input == null && hasNull) || known.has(input),
    message: `expected one of ${limitedCommaJoinJson(values)}`,
    typeExpr: `(${values.map((it) => JSON.stringify(it)).join(" | ")})`,
    schema: () => {
      const isSingleTypeof = values.length > 0 && values.every((v) => typeof v === typeof values[0]);
      if (isSingleTypeof) {
        const tp = typeof values[0];
        if (tp == "string" || tp === "number" || tp === "boolean") {
          return {
            type: tp,
            enum: values,
          };
        }
      }

      return {
        enum: values,
      };
    },
    hash: () => generateHashFromNumbers([anyOfConstsHash, ...[...values].sort().map(hashConst)]),
    hash256: (ctx) => {
      ctx.writer.updateTag("anyOfConsts");
      const sorted = [...values].sort((a, b) => compareConst(a, b));
      ctx.writer.updateNumber(sorted.length);
      for (const v of sorted) {
        hash256Const(ctx, v);
      }
    },
  });
}

export function tuple(prefix: Runtype[], rest: Runtype | null = null): Runtype {
  const count = prefix.length;
  const validators = prefix.map((it) => it.validate);
  const parsers = prefix.map((it) => it.parse);
  const reporters = prefix.map((it) => it.reportErrors);
  const validateRest = rest?.validate;
  const parseRest = rest?.parse;
  const reportRest = rest?.reportErrors;
  return node({
    tag: TAG_NONE,
    validate: (ctx, input) => {
      if (!Array.isArray(input)) {
        return false;
      }
      for (let index = 0; index < count; index++) {
        if (!validators[index](ctx, input[index])) {
          return false;
        }
      }
      if (validateRest === undefined) {
        return input.length <= count;
      }
      for (let index = count; index < input.length; index++) {
        if (!validateRest(ctx, input[index])) {
          return false;
        }
      }
      return true;
    },
    parse: (ctx, input) => {
      const acc = [];
      for (let index = 0; index < count; index++) {
        acc.push(parsers[index](ctx, input[index]));
      }
      if (parseRest !== undefined) {
        for (let index = count; index < input.length; index++) {
          acc.push(parseRest(ctx, input[index]));
        }
      }
      return acc;
    },
    reportErrors: (ctx, input) => {
      if (!Array.isArray(input)) {
        return buildError(ctx, "expected tuple", input);
      }

      const acc: DecodeError[] = [];
      for (let index = 0; index < count; index++) {
        reportAtPath(ctx, acc, `[${index}]`, validators[index], reporters[index], input[index]);
      }
      if (validateRest !== undefined) {
        for (let index = count; index < input.length; index++) {
          reportAtPath(ctx, acc, `[${index}]`, validateRest, reportRest!, input[index]);
        }
      } else if (input.length > count) {
        acc.push(...buildError(ctx, `expected tuple with ${count} items, got ${input.length}`, input));
      }

      return acc;
    },
    describe: (ctx) => {
      const prefixExpr = prefix.map((it) => describeTypeExpr(ctx, it)).join(", ");
      const restExpr = rest != null ? `...Array<${describeTypeExpr(ctx, rest)}>` : null;

      const inner = [prefixExpr, restExpr].filter((it) => it != null && it.length > 0).join(", ");
      return { typeExpr: `[${inner}]` };
    },
    schema: (ctx) => {
      pushPath(ctx, "[]");
      const prefixItems = prefix.map((it) => it.schema(ctx));
      const items = rest != null ? rest.schema(ctx) : false;
      popPath(ctx);
      return {
        type: "array",
        prefixItems,
        items,
      } as any;
    },
    hash: (ctx) => {
      let acc: number[] = [tupleHash];
      for (const p of prefix) {
        acc.push(p.hash(ctx));
      }
      if (rest != null) {
        acc.push(rest.hash(ctx));
      } else {
        acc.push(0);
      }
      return generateHashFromNumbers(acc);
    },
    hash256: (ctx) => {
      ctx.writer.updateTag("tuple");
      ctx.writer.updateNumber(prefix.length);
      for (const p of prefix) {
        p.hash256(ctx);
      }
      if (rest == null) {
        ctx.writer.updateTag("noRest");
      } else {
        ctx.writer.updateTag("rest");
        rest.hash256(ctx);
      }
    },
    children: () => [...prefix, ...(rest == null ? [] : [rest])],
  });
}

export function intersection(members: Runtype[]): Runtype {
  const count = members.length;
  const validators = members.map((it) => it.validate);
  const parsers = members.map((it) => it.parse);
  const reporters = members.map((it) => it.reportErrors);
  const parseMembers = (ctx: Ctx, input: any): object => {
    let acc = {};
    for (let index = 0; index < count; index++) {
      const parsed = parsers[index](ctx, input);
      if (typeof parsed !== "object") {
        throw new Error("INTERNAL ERROR: AllOfParser: Expected object");
      }
      acc = { ...acc, ...parsed };
    }
    return acc;
  };
  // Keys of a valid input that no member of the intersection knows about.
  const extraKeys = (input: object): string[] => {
    const known = parseMembers(
      { disallowExtraProperties: true, objectKeyOrder: "input", intersectionInput: input, path: [] },
      input,
    );
    return Object.keys(input).filter((key) => !hasOwn.call(known, key));
  };
  return node({
    tag: TAG_NONE,
    validate: (ctx, input) => {
      const checksExtraProperties = intersectionChecksExtraProperties(ctx, input);
      // An object member must not reject a key of this input only because the member does not know the key:
      // another member can know it. The intersection checks the extra keys itself, after its members.
      const old = ctx.intersectionInput;
      ctx.intersectionInput = input;
      let ok = true;
      for (let index = 0; index < count; index++) {
        if (typeof input !== "object" || !validators[index](ctx, input)) {
          ok = false;
          break;
        }
      }
      ctx.intersectionInput = old;
      return ok && !(checksExtraProperties && extraKeys(input).length > 0);
    },
    parse: (ctx, input) => {
      const old = ctx.intersectionInput;
      ctx.intersectionInput = input;
      const parsed = parseMembers(ctx, input);
      ctx.intersectionInput = old;
      return parsed;
    },
    reportErrors: (ctx, input) => {
      const checksExtraProperties = intersectionChecksExtraProperties(ctx, input);
      const old = ctx.intersectionInput;
      ctx.intersectionInput = input;
      const errors: DecodeError[] = [];
      for (let index = 0; index < count; index++) {
        errors.push(...reporters[index](ctx, input));
      }
      ctx.intersectionInput = old;
      if (errors.length > 0 || !checksExtraProperties) {
        return errors;
      }
      const acc: DecodeError[] = [];
      for (const key of extraKeys(input)) {
        pushPath(ctx, key);
        acc.push(...buildError(ctx, `extra property`, input[key]));
        popPath(ctx);
      }
      return acc;
    },
    describe: (ctx) => ({ typeExpr: `(${members.map((it) => describeTypeExpr(ctx, it)).join(" & ")})` }),
    schema: (ctx) => {
      const schemas = members.map((it) => it.schema(ctx));
      const merged = tryMergeAllOfObjectSchemas(schemas);
      if (merged != null) {
        return merged;
      }

      return {
        allOf: schemas,
      };
    },
    hash: (ctx) => generateHashFromNumbers([allOfHash, ...members.map((it) => it.hash(ctx))]),
    hash256: (ctx) => {
      ctx.writer.updateTag("allOf");
      ctx.writer.updateNumber(members.length);
      for (const s of members) {
        s.hash256(ctx);
      }
    },
    children: () => members,
  });
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

export function union(members: Runtype[]): Runtype {
  const validators = members.map((it) => it.validate);
  const parsers = members.map((it) => it.parse);
  const reporters = members.map((it) => it.reportErrors);
  return node({
    tag: TAG_NONE,
    validate: (ctx, input) => {
      for (let index = 0; index < validators.length; index++) {
        if (validators[index](ctx, input)) {
          return true;
        }
      }
      return false;
    },
    parse: (ctx, input) => {
      const items = [];
      for (let index = 0; index < validators.length; index++) {
        if (validators[index](ctx, input)) {
          items.push(parsers[index](ctx, input));
        }
      }
      if (items.length === 1) {
        return items[0];
      }
      return deepmerge(...items);
    },
    reportErrors: (ctx, input) => {
      const branchErrors: DecodeError[][] = [];
      const oldPaths = ctx.path;
      ctx.path = [];
      for (let index = 0; index < validators.length; index++) {
        branchErrors.push(reporters[index](ctx, input));
      }
      ctx.path = oldPaths;

      // Filter to closest-matching branches by max error depth
      const depths = branchErrors.map((errors) => maxErrorDepth(errors));
      const bestDepth = Math.max(...depths);
      const filtered =
        bestDepth > 0
          ? branchErrors.filter((_, index) => depths[index] === bestDepth).flat()
          : branchErrors.flat();

      return buildUnionError(ctx, filtered, input);
    },
    describe: (ctx) => ({ typeExpr: `(${members.map((it) => describeTypeExpr(ctx, it)).join(" | ")})` }),
    schema: (ctx) => ({
      anyOf: members.map((it) => it.schema(ctx)),
    }),
    hash: (ctx) => generateHashFromNumbers([anyOfHash, ...members.map((it) => it.hash(ctx))]),
    hash256: (ctx) => {
      ctx.writer.updateTag("anyOf");
      ctx.writer.updateNumber(members.length);
      for (const s of members) {
        s.hash256(ctx);
      }
    },
    children: () => members,
  });
}

export function array(item: Runtype): Runtype {
  const validateItem = item.validate;
  const parseItem = item.parse;
  const reportItem = item.reportErrors;
  return node({
    tag: TAG_NONE,
    validate: (ctx, input) => {
      if (!Array.isArray(input)) {
        return false;
      }
      for (let index = 0; index < input.length; index++) {
        if (!validateItem(ctx, input[index])) {
          return false;
        }
      }
      return true;
    },
    parse: (ctx, input) => {
      // An item of a sparse array that is not set stays not set.
      const acc = new Array(input.length);
      for (let index = 0; index < input.length; index++) {
        if (index in input) {
          acc[index] = parseItem(ctx, input[index]);
        }
      }
      return acc;
    },
    reportErrors: (ctx, input) => {
      if (!Array.isArray(input)) {
        return buildError(ctx, "expected array", input);
      }

      const acc: DecodeError[] = [];
      for (let index = 0; index < input.length; index++) {
        reportAtPath(ctx, acc, `[${index}]`, validateItem, reportItem, input[index]);
      }

      return acc;
    },
    describe: (ctx) => ({ typeExpr: `Array<${describeTypeExpr(ctx, item)}>` }),
    schema: (ctx) => {
      pushPath(ctx, "[]");
      const items = item.schema(ctx);
      popPath(ctx);
      return {
        type: "array",
        items,
      };
    },
    hash: (ctx) => generateHashFromNumbers([arrayHash, item.hash(ctx)]),
    hash256: (ctx) => {
      ctx.writer.updateTag("array");
      item.hash256(ctx);
    },
    children: () => [item],
  });
}

export function map(key: Runtype, value: Runtype): Runtype {
  const validateKey = key.validate;
  const parseKey = key.parse;
  const reportKey = key.reportErrors;
  const validateValue = value.validate;
  const parseValue = value.parse;
  const reportValue = value.reportErrors;
  return node({
    tag: TAG_NONE,
    validate: (ctx, input) => {
      if (!(input instanceof Map)) {
        return false;
      }
      for (const [entryKey, entryValue] of input) {
        if (!validateKey(ctx, entryKey) || !validateValue(ctx, entryValue)) {
          return false;
        }
      }
      return true;
    },
    parse: (ctx, input) => {
      const res = new Map();
      for (const [entryKey, entryValue] of input as Map<any, any>) {
        res.set(parseKey(ctx, entryKey), parseValue(ctx, entryValue));
      }
      return res;
    },
    reportErrors: (ctx, input) => {
      if (!(input instanceof Map)) {
        return buildError(ctx, "expected Map", input);
      }
      const acc: DecodeError[] = [];
      for (const [entryKey, entryValue] of input) {
        reportAtPath(ctx, acc, `key(${stringifyWithBigInt(entryKey)})`, validateKey, reportKey, entryKey);
        reportAtPath(
          ctx,
          acc,
          `value(${stringifyWithBigInt(entryKey)})`,
          validateValue,
          reportValue,
          entryValue,
        );
      }
      return acc;
    },
    describe: (ctx) => ({ typeExpr: `Map<${describeTypeExpr(ctx, key)}, ${describeTypeExpr(ctx, value)}>` }),
    schema: noSchema("Map"),
    hash: (ctx) => generateHashFromNumbers([mapHash, key.hash(ctx), value.hash(ctx)]),
    hash256: (ctx) => {
      ctx.writer.updateTag("map");
      key.hash256(ctx);
      value.hash256(ctx);
    },
    children: () => [key, value],
  });
}

export function set(item: Runtype): Runtype {
  const validateItem = item.validate;
  const parseItem = item.parse;
  const reportItem = item.reportErrors;
  return node({
    tag: TAG_NONE,
    validate: (ctx, input) => {
      if (!(input instanceof Set)) {
        return false;
      }
      for (const entry of input) {
        if (!validateItem(ctx, entry)) {
          return false;
        }
      }
      return true;
    },
    parse: (ctx, input) => {
      const res = new Set();
      for (const entry of input as Set<any>) {
        res.add(parseItem(ctx, entry));
      }
      return res;
    },
    reportErrors: (ctx, input) => {
      if (!(input instanceof Set)) {
        return buildError(ctx, "expected Set", input);
      }
      const acc: DecodeError[] = [];
      for (const entry of input) {
        reportAtPath(ctx, acc, `item(${stringifyWithBigInt(entry)})`, validateItem, reportItem, entry);
      }
      return acc;
    },
    describe: (ctx) => ({ typeExpr: `Set<${describeTypeExpr(ctx, item)}>` }),
    schema: noSchema("Set"),
    hash: (ctx) => generateHashFromNumbers([setHash, item.hash(ctx)]),
    hash256: (ctx) => {
      ctx.writer.updateTag("set");
      item.hash256(ctx);
    },
    children: () => [item],
  });
}

function sanitizeComponentNamePart(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9]+/g, " ").trim();
  if (cleaned.length === 0) {
    return "Variant";
  }
  return cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function ensureContextualDefinition(
  printingContext: SchemaPrintingContext,
  name: string,
  target: Runtype,
  ctx: SchemaContext,
): void {
  if (printingContext.hasDefinition(name) || printingContext.isDefinitionInProgress(name)) {
    return;
  }
  printingContext.markDefinitionInProgress(name);
  const body = target.schema(ctx);
  printingContext.storeDefinition(name, body);
}

// A union of object types. `mapping` has the type of each value of the `discriminator` property, and
// `members` has the types of the union as they are described.
export function discriminatedUnion(
  discriminator: string,
  mapping: Record<string, Runtype>,
  members: Runtype[],
): Runtype {
  const variants = new Map(Object.entries(mapping));
  const hash: Runtype["hash"] = (ctx) =>
    generateHashFromNumbers([anyOfHash, ...members.map((it) => it.hash(ctx))]);
  return node({
    tag: TAG_NONE,
    validate: (ctx, input) => {
      if (typeof input !== "object" || input == null) {
        return false;
      }
      const discriminatorValue = input[discriminator];
      if (discriminatorValue == null) {
        return false;
      }
      const variant = variants.get(String(discriminatorValue));
      return variant !== undefined && variant.validate(ctx, input);
    },
    parse: (ctx, input) => {
      const variant = variants.get(String(input[discriminator]));
      if (variant === undefined) {
        throw new Error(
          "INTERNAL ERROR: Missing parser for discriminator " + JSON.stringify(input[discriminator]),
        );
      }
      return {
        ...(variant.parse(ctx, input) as object),
        [discriminator]: input[discriminator],
      };
    },
    reportErrors: (ctx, input) => {
      if (input == null || typeof input !== "object") {
        return buildError(ctx, "expected object", input);
      }

      const discriminatorValue = input[discriminator];
      if (discriminatorValue == null) {
        return buildError(ctx, "expected discriminator key " + JSON.stringify(discriminator), input);
      }
      const variant = variants.get(String(discriminatorValue));
      if (variant === undefined) {
        pushPath(ctx, discriminator);
        const errors = buildError(
          ctx,
          "expected one of " +
            Object.keys(mapping)
              .map((it) => JSON.stringify(it))
              .join(", "),
          discriminatorValue,
        );
        popPath(ctx);
        return errors;
      }
      return variant.reportErrors(ctx, input);
    },
    describe: (ctx) => ({ typeExpr: `(${members.map((it) => describeTypeExpr(ctx, it)).join(" | ")})` }),
    schema: (ctx) => {
      const printingContext = ctx.printingContext;
      if (ctx.mode === "contextual" && printingContext != null) {
        const unionHash = hash({ seen: {} });
        const variantRefs = Object.entries(mapping).map(([key, variant]) => {
          // A variant that is a named type keeps its name. Other variants get a name made from the union.
          const name =
            variant.tag === TAG_REFERENCE
              ? variant.name!
              : `Discriminated${sanitizeComponentNamePart(discriminator)}${sanitizeComponentNamePart(key)}${Math.abs(unionHash)}`;
          const target = variant.tag === TAG_REFERENCE ? variant.children()[0] : variant;
          ensureContextualDefinition(printingContext, name, target, ctx);
          return { key, ref: printingContext.getRef(name) };
        });

        return {
          type: "object",
          discriminator: {
            propertyName: discriminator,
            mapping: Object.fromEntries(variantRefs.map(({ key, ref }) => [key, ref])),
          },
          oneOf: variantRefs.map(({ ref }) => ({ $ref: ref })),
        };
      }

      return {
        type: "object",
        discriminator: {
          propertyName: discriminator,
        },
        anyOf: members.map((it) => it.schema(ctx)),
      };
    },
    hash,
    hash256: (ctx) => {
      ctx.writer.updateTag("anyOfDiscriminated");
      ctx.writer.updateString(discriminator);
      ctx.writer.updateNumber(members.length);
      for (const s of members) {
        s.hash256(ctx);
      }
      const mappingKeys = Object.keys(mapping).sort();
      ctx.writer.updateNumber(mappingKeys.length);
      for (const key of mappingKeys) {
        ctx.writer.updateString(key);
        mapping[key].hash256(ctx);
      }
    },
    children: () => members,
  });
}

// An optional property of an object.
export function optional(inner: Runtype): Runtype {
  const validateInner = inner.validate;
  const parseInner = inner.parse;
  return node({
    tag: TAG_OPTIONAL,
    validate: (ctx, input) => input == null || validateInner(ctx, input),
    parse: (ctx, input) => (input == null ? input : parseInner(ctx, input)),
    // `validate` accepts null and undefined, so the input here is neither of them. Only the errors of the inner
    // type are relevant.
    reportErrors: inner.reportErrors,
    describe: (ctx) => inner.describe(ctx),
    schema: (ctx) => ({
      anyOf: [inner.schema(ctx), { type: "null" }],
    }),
    hash: (ctx) => generateHashFromNumbers([optionalFieldHash, inner.hash(ctx)]),
    hash256: (ctx) => {
      ctx.writer.updateTag("optionalField");
      inner.hash256(ctx);
    },
    children: () => [inner],
  });
}

const hasOwn = Object.prototype.hasOwnProperty;

// Assigning to "__proto__" sets the prototype instead of creating a property.
function setOwnProperty(target: Record<string, unknown>, key: string, value: unknown): void {
  if (key === "__proto__") {
    Object.defineProperty(target, key, { value, enumerable: true, writable: true, configurable: true });
    return;
  }
  target[key] = value;
}

type Indexed = Array<{ key: Runtype; value: Runtype }>;

// `object` keeps its properties in one flat array, a PropertyList. Each property uses PropertyOffset.Size items
// of the array, at these offsets. It is a const enum, so the compiler writes the numbers into the code: the hot
// loops do not read a variable for them.
const enum PropertyOffset {
  Key = 0,
  Optional = 1,
  Validate = 2,
  Parse = 3,
  Size = 4,
}
type PropertyList = Array<string | boolean | Validate | Parse>;
// The position of each property in a PropertyList.
type PropertyPositions = Record<string, number | undefined>;

// In an intersection, an index signature only constrains the keys it matches: another member may know the rest.
function leavesKeyToIntersection(indexed: Indexed, ctx: Ctx, input: object, key: string): boolean {
  return ctx.intersectionInput === input && !indexed.some((signature) => signature.key.validate(ctx, key));
}

function parseIndexed(
  indexed: Indexed,
  ctx: Ctx,
  acc: Record<string, unknown>,
  key: string,
  value: unknown,
): void {
  for (const signature of indexed) {
    if (signature.key.validate(ctx, key) && signature.value.validate(ctx, value)) {
      const parsedValue = signature.value.parse(ctx, value);
      setOwnProperty(acc, signature.key.parse(ctx, key), parsedValue);
    }
  }
}

// Parse with `objectKeyOrder: "sorted"`.
function parseSorted(
  propertyList: PropertyList,
  positions: PropertyPositions,
  indexed: Indexed,
  ctx: Ctx,
  input: any,
): unknown {
  const acc: any = {};
  for (const key of Object.keys(positions).sort()) {
    if (!hasOwn.call(input, key)) {
      continue;
    }
    const value = input[key];
    const position = positions[key]!;
    setOwnProperty(
      acc,
      key,
      value == null && propertyList[position + PropertyOffset.Optional]
        ? value
        : (propertyList[position + PropertyOffset.Parse] as Parse)(ctx, value),
    );
  }

  if (indexed.length > 0) {
    for (const key of Object.keys(input)
      .filter((key) => positions[key] === undefined)
      .sort()) {
      parseIndexed(indexed, ctx, acc, key, input[key]);
    }
  }
  return acc;
}

function hasExtraKeys(positions: PropertyPositions, input: object): boolean {
  for (const key of Object.keys(input)) {
    if (positions[key] === undefined) {
      return true;
    }
  }
  return false;
}

export function object(properties: Record<string, Runtype>, indexed: Indexed = []): Runtype {
  const keys = Object.keys(properties);
  // The property list has the key, the optional flag, and the validate and parse functions of each property.
  // An optional property has the functions of its inner type, so it does not add a call.
  // The validate and parse functions below read only this array, and they do not call helper functions for
  // the properties. Then each level of a deep input puts fewer values and calls on the stack, and validation
  // can go deeper before the stack overflows.
  const propertyList: PropertyList = [];
  // It has no prototype, so only the keys of `properties` are in it.
  const positions: PropertyPositions = Object.create(null);
  for (const key of keys) {
    const optional = properties[key].tag === TAG_OPTIONAL;
    const inner = optional ? properties[key].children()[0] : properties[key];
    positions[key] = propertyList.length;
    propertyList.push(key, optional, inner.validate, inner.parse);
  }
  const hasIndexed = indexed.length > 0;
  // There is one validate function for objects with an index signature and one for objects without.
  const validateObject: Validate = hasIndexed
    ? (ctx, input) => {
        if (typeof input !== "object" || input === null || Array.isArray(input)) {
          return false;
        }
        for (let position = 0; position < propertyList.length; position += PropertyOffset.Size) {
          const value = input[propertyList[position + PropertyOffset.Key] as string];
          if (
            !(value == null && propertyList[position + PropertyOffset.Optional]) &&
            !(propertyList[position + PropertyOffset.Validate] as Validate)(ctx, value)
          ) {
            return false;
          }
        }
        for (const key of Object.keys(input)) {
          if (positions[key] !== undefined) {
            continue;
          }
          let isValid = false;
          for (const signature of indexed) {
            if (signature.key.validate(ctx, key) && signature.value.validate(ctx, input[key])) {
              isValid = true;
              break;
            }
          }
          if (!isValid && !leavesKeyToIntersection(indexed, ctx, input, key)) {
            return false;
          }
        }
        return true;
      }
    : (ctx, input) => {
        if (typeof input !== "object" || input === null || Array.isArray(input)) {
          return false;
        }
        for (let position = 0; position < propertyList.length; position += PropertyOffset.Size) {
          const value = input[propertyList[position + PropertyOffset.Key] as string];
          if (
            !(value == null && propertyList[position + PropertyOffset.Optional]) &&
            !(propertyList[position + PropertyOffset.Validate] as Validate)(ctx, value)
          ) {
            return false;
          }
        }
        return !(
          ctx.disallowExtraProperties &&
          ctx.intersectionInput !== input &&
          hasExtraKeys(positions, input)
        );
      };
  return node({
    tag: TAG_NONE,
    validate: validateObject,
    parse: (ctx, input) => {
      if (ctx.objectKeyOrder !== "input") {
        return parseSorted(propertyList, positions, indexed, ctx, input);
      }
      const acc: any = {};
      const inputKeys = Object.keys(input);
      for (let keyIndex = 0; keyIndex < inputKeys.length; keyIndex++) {
        const key = inputKeys[keyIndex];
        const value = input[key];
        const position = positions[key];
        if (position !== undefined) {
          setOwnProperty(
            acc,
            key,
            value == null && propertyList[position + PropertyOffset.Optional]
              ? value
              : (propertyList[position + PropertyOffset.Parse] as Parse)(ctx, value),
          );
        } else if (hasIndexed) {
          parseIndexed(indexed, ctx, acc, key, value);
        }
      }
      return acc;
    },
    reportErrors: (ctx, input) => {
      if (typeof input !== "object" || Array.isArray(input) || input === null) {
        return buildError(ctx, "expected object", input);
      }

      const acc: DecodeError[] = [];

      for (let position = 0; position < propertyList.length; position += PropertyOffset.Size) {
        const key = propertyList[position + PropertyOffset.Key] as string;
        const value = input[key];
        if (!(value == null && propertyList[position + PropertyOffset.Optional])) {
          reportAtPath(
            ctx,
            acc,
            key,
            propertyList[position + PropertyOffset.Validate] as Validate,
            properties[key].reportErrors,
            value,
          );
        }
      }

      if (hasIndexed) {
        for (const key of Object.keys(input)) {
          if (positions[key] !== undefined || leavesKeyToIntersection(indexed, ctx, input, key)) {
            continue;
          }
          for (const signature of indexed) {
            const keyOk = signature.key.validate(ctx, key);
            const valueOk = signature.value.validate(ctx, input[key]);
            if (!keyOk || !valueOk) {
              pushPath(ctx, key);
              if (!keyOk) {
                acc.push(...signature.key.reportErrors(ctx, key));
              }
              if (!valueOk) {
                acc.push(...signature.value.reportErrors(ctx, input[key]));
              }
              popPath(ctx);
            }
          }
        }
      } else if (ctx.disallowExtraProperties && ctx.intersectionInput !== input) {
        const extraKeys = Object.keys(input).filter((key) => positions[key] === undefined);
        if (extraKeys.length > 0) {
          return extraKeys.flatMap((key) => {
            pushPath(ctx, key);
            const errors = buildError(ctx, `extra property`, input[key]);
            popPath(ctx);
            return errors;
          });
        }
      }

      return acc;
    },
    describe: (ctx) => {
      const props = [...keys]
        .sort()
        .map((key) => describeObjectMember(ctx, describePropertyKey(key), properties[key]));

      const indexProps = indexed.map(({ key, value }) => describeIndexObjectMember(ctx, key, value));

      const members = [...props, ...indexProps];
      const hasMemberDescriptions = members.some((it) => it.docText != null);
      if (hasMemberDescriptions) {
        if (members.length === 0) {
          return { typeExpr: "{}" };
        }
        const content = members.map(renderObjectMember).join("\n");
        return { typeExpr: `{\n${content}\n}` };
      }

      const content = members.map((it) => it.member).join(", ");
      return { typeExpr: `{ ${content} }` };
    },
    schema: (ctx) => {
      const schemaProperties: Record<string, JSONSchema7Definition> = {};
      const optionalized = new Set<string>();
      for (const key of keys) {
        pushPath(ctx, key);
        const raw = properties[key].schema(ctx);
        const rewrite = removeNullUnionBranch(raw);
        if (rewrite != null) {
          schemaProperties[key] = rewrite;
          optionalized.add(key);
        } else {
          schemaProperties[key] = raw;
        }
        popPath(ctx);
      }

      const required = keys.filter((key) => !optionalized.has(key));
      const base: JSONSchema7 = {
        type: "object",
        properties: schemaProperties,
        ...(required.length > 0 ? { required } : {}),
      };

      const indexSchemas = indexed.map(({ key, value }): JSONSchema7 => {
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

      // special case for Record<string, T> with no named properties
      if (keys.length === 0 && indexSchemas.length === 1) {
        const valueRuntype = indexed[0].value;

        // Record<string, never> -> empty closed object (keys don't matter)
        if (valueRuntype.tag === TAG_NEVER) {
          return { type: "object", additionalProperties: false };
        }

        // Record<string, unknown> -> simplify additionalProperties to true
        if (valueRuntype.tag === TAG_ANY) {
          return { ...indexSchemas[0], additionalProperties: true };
        }

        return indexSchemas[0];
      }

      return {
        allOf: [base, ...indexSchemas],
      };
    },
    hash: (ctx) => {
      let acc: number[] = [objectHash];
      for (const key of [...keys].sort()) {
        acc.push(generateHashFromString(key));
        acc.push(properties[key].hash(ctx));
      }
      for (const signature of indexed) {
        acc.push(signature.key.hash(ctx));
        acc.push(signature.value.hash(ctx));
      }
      return generateHashFromNumbers(acc);
    },
    hash256: (ctx) => {
      ctx.writer.updateTag("object");
      ctx.writer.updateNumber(keys.length);
      for (const key of [...keys].sort()) {
        const parser = properties[key];
        ctx.writer.updateString(key);
        ctx.writer.updateBoolean(parser.tag === TAG_OPTIONAL);
        parser.hash256(ctx);
      }
      ctx.writer.updateNumber(indexed.length);
      for (const signature of indexed) {
        signature.key.hash256(ctx);
        signature.value.hash256(ctx);
      }
    },
    children: () => [...Object.values(properties), ...indexed.flatMap(({ key, value }) => [key, value])],
  });
}

// The named types of one module. A reference reads the cell of its name on every call, so it always uses the
// type that the cell has now.
export type Registry = Map<string, { runtype: Runtype | undefined }>;

function cellOf(registry: Registry, name: string): { runtype: Runtype | undefined } {
  let cell = registry.get(name);
  if (cell === undefined) {
    cell = { runtype: undefined };
    registry.set(name, cell);
  }
  return cell;
}

export function reference(registry: Registry, name: string): Runtype {
  const cell = cellOf(registry, name);
  const referenceNode = node({
    tag: TAG_REFERENCE,
    validate: (ctx, input) => cell.runtype!.validate(ctx, input),
    parse: (ctx, input) => cell.runtype!.parse(ctx, input),
    reportErrors: (ctx, input) => cell.runtype!.reportErrors(ctx, input),
    describe: (ctx) => {
      const to = cell.runtype!;
      if (ctx.refCounts[name] > 1) {
        if (!ctx.activeRefs.has(name) && ctx.definitions[name] == null) {
          ctx.activeRefs.add(name);
          ctx.definitions[name] = to.describe(ctx);
          ctx.activeRefs.delete(name);
        }
        return { typeExpr: name };
      }
      return to.describe(ctx);
    },
    schema: (ctx) => {
      const to = cell.runtype!;
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
        return { $ref: printingContext.getRef(name) };
      }
      if (ctx.seen[name]) {
        return {};
      }
      ctx.seen[name] = true;
      var tmp = to.schema(ctx);
      delete ctx.seen[name];
      return tmp;
    },
    hash: (ctx) => {
      if (ctx.seen[name]) {
        return generateHashFromString(name);
      }
      ctx.seen[name] = true;
      var tmp = cell.runtype!.hash(ctx);
      delete ctx.seen[name];
      return tmp;
    },
    hash256: (ctx) => {
      const to = cell.runtype!;
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
    },
    children: () => [cell.runtype!],
  });
  referenceNode.name = name;
  return referenceNode;
}

// Sets the named types of a module.
export function define(registry: Registry, types: Record<string, Runtype>): void {
  for (const name of Object.keys(types)) {
    cellOf(registry, name).runtype = types[name];
  }
}

const namedRuntypes: Registry = new Map();

export const createNamedType = <T>(name: string, p: BeffParser<T>): BeffParser<T> => {
  const cell = cellOf(namedRuntypes, name);
  if (cell.runtype !== undefined) {
    throw new Error(`Named type ${name} already exists`);
  }
  cell.runtype = (p as ParserFromRuntype)._runtype;
  return buildParserFromRuntype(reference(namedRuntypes, name), name, false);
};
export const overrideNamedType = (name: string, runtype: BeffParser<any>): void => {
  const cell = namedRuntypes.get(name);
  if (cell === undefined) {
    throw new Error(`Named type ${name} does not exist`);
  }
  cell.runtype = (runtype as ParserFromRuntype)._runtype;
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
    const ctx = newCtx(options);
    if (this._runtype.validate(ctx, input)) {
      return { success: true, data: this._runtype.parse(ctx, input) };
    }
    return {
      success: false,
      errors: this._runtype.reportErrors(ctx, input).slice(0, 10),
    };
  }
  zod(): z.ZodType<any, z.ZodTypeDef, any> {
    //@ts-ignore
    return z.custom(
      (data: any) => this.validate(data),
      //@ts-ignore
      (val: any) => {
        const errors = this._runtype.reportErrors(newCtx(undefined), val);
        return printErrors(errors, []);
      },
    );
  }
  validate(input: any, options?: ParseOptions): input is any {
    return this._runtype.validate(newCtx(options), input);
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
    return this._runtype.hash({ seen: {} });
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
