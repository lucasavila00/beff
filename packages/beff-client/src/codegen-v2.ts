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
  v: Validate,
  r: Report,
  input: unknown,
): void {
  if (!v(ctx, input)) {
    pushPath(ctx, key);
    acc.push(...r(ctx, input));
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

// Every call creates the context with all its fields, so that its shape never changes.
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

type Validate = (c: Ctx, i: any) => boolean;
type Parse = (c: Ctx, i: any) => any;
type Report = (c: Ctx, i: any) => DecodeError[];

// What `t` says about a node, where other nodes need to know it.
const T_OPT = 1;
const T_NEVER = 2;
const T_ANY = 3;
const T_REF = 4;

// A node of a parser. Every builder below returns one, and all nodes have the same fields.
export type Runtype = {
  t: number;
  // Is the input valid?
  v: Validate;
  // Parse an input that `v` accepted.
  p: Parse;
  // The errors of an input that `v` rejected.
  r: Report;
  describe: (ctx: DescribeContext) => TypeDescription;
  schema: (ctx: SchemaContext) => JSONSchema7;
  hash: (ctx: HashContext) => number;
  hash256: (ctx: Hash256Context) => void;
  // The name of the type a ref points to.
  name: string | undefined;
  // The child nodes. A ref has one child, the type it points to now.
  kids: () => Runtype[];
};

const noKids = (): Runtype[] => [];
const same: Parse = (_c, i) => i;

function node(
  t: number,
  v: Validate,
  p: Parse,
  r: Report,
  describe: Runtype["describe"],
  schema: Runtype["schema"],
  hash: Runtype["hash"],
  hash256: Runtype["hash256"],
  kids: () => Runtype[],
): Runtype {
  return {
    t,
    v,
    p,
    r,
    describe,
    schema,
    hash,
    hash256,
    name: undefined,
    kids,
  };
}

// A node without children. Parsing returns the input.
function leaf(
  t: number,
  v: Validate,
  message: string,
  typeExpr: string,
  schema: Runtype["schema"],
  hash: Runtype["hash"],
  hash256: Runtype["hash256"],
): Runtype {
  return node(
    t,
    v,
    same,
    (c, i) => buildError(c, message, i),
    () => ({ typeExpr }),
    schema,
    hash,
    hash256,
    noKids,
  );
}

// Adds a description to a node. It replaces the node's own doc text, and it is added to its schema.
export function doc(n: Runtype, description: string): Runtype {
  const { describe, schema } = n;
  n.describe = (ctx) => ({ typeExpr: describe(ctx).typeExpr, docText: description });
  n.schema = (ctx) => ({ ...schema(ctx), description });
  return n;
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
  const optionalMark = value.t === T_OPT ? "?" : "";
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
  if (runtype.t === T_REF) {
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
    collectDescribeRefs(runtype.kids()[0], ctx);
    ctx.activeRefs.delete(name);
    return;
  }

  for (const child of runtype.kids()) {
    collectDescribeRefs(child, ctx);
  }
}

const hash256Tag =
  (tag: string): Runtype["hash256"] =>
  (ctx) =>
    ctx.writer.updateTag(tag);

function typeOf(typeName: string, v: Validate, hash: number): Runtype {
  return leaf(
    0,
    v,
    "expected " + typeName,
    typeName,
    () => ({ type: typeName as JSONSchema7TypeName }),
    () => hash,
    (ctx) => {
      ctx.writer.updateTag("typeof");
      ctx.writer.updateString(typeName);
    },
  );
}
export const str = (): Runtype => typeOf("string", (_c, i) => typeof i === "string", stringHash);
export const num = (): Runtype => typeOf("number", (_c, i) => typeof i === "number", numberHash);
export const bool = (): Runtype => typeOf("boolean", (_c, i) => typeof i === "boolean", booleanHash);
// A function type has never had a hash of its own.
export const fn = (): Runtype => typeOf("function", (_c, i) => typeof i === "function", undefined as any);

// The key of a number index signature, such as Record<number, T>.
// Object keys are always strings, so the key must be a numeric string.
const NUMBER_KEY_PATTERN = "^-?(0|[1-9][0-9]*)(\\.[0-9]+)?([eE][+-]?[0-9]+)?$";
const NUMBER_KEY_REGEX = new RegExp(NUMBER_KEY_PATTERN);
export const numKey = (): Runtype =>
  leaf(
    0,
    (_c, i) => typeof i === "string" && NUMBER_KEY_REGEX.test(i),
    "expected number key",
    "number",
    () => ({ type: "string", pattern: NUMBER_KEY_PATTERN }),
    // Hash as `number`, so the hash of Record<number, T> does not change.
    () => numberHash,
    (ctx) => {
      ctx.writer.updateTag("typeof");
      ctx.writer.updateString("number");
    },
  );

export const any = (): Runtype =>
  leaf(
    T_ANY,
    () => true,
    "expected any",
    "any",
    () => ({}),
    () => unknownHash,
    hash256Tag("any"),
  );

const nullish = (description: "undefined" | "null" | "void"): Runtype =>
  leaf(
    0,
    (_c, i) => i == null,
    "expected nullish value",
    description,
    () => ({ type: "null" }),
    () => nullishHash,
    hash256Tag("nullish"),
  );
export const nul = (): Runtype => nullish("null");
export const undef = (): Runtype => nullish("undefined");
export const voidType = (): Runtype => nullish("void");

export const never = (): Runtype =>
  node(
    T_NEVER,
    () => false,
    () => {
      throw new Error("unreachable");
    },
    (c, i) => buildError(c, "expected never", i),
    () => ({ typeExpr: "never" }),
    () => ({ anyOf: [] }),
    () => undefinedHash,
    hash256Tag("never"),
    noKids,
  );

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

export function lit(constValue: Const): Runtype {
  const value = constValue ?? null;
  return leaf(
    0,
    value == null ? (_c, i) => i == null : (_c, i) => i === value,
    `expected ${JSON.stringify(value)}`,
    JSON.stringify(value),
    (ctx) => {
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
    () => hashConst(value),
    (ctx) => {
      ctx.writer.updateTag("const");
      hash256Const(ctx, value);
    },
  );
}

export const regex = (re: RegExp, description: string): Runtype =>
  leaf(
    0,
    (_c, i) => typeof i === "string" && re.test(i),
    `expected string matching ${description}`,
    description,
    () => ({ type: "string", pattern: re.source }),
    () => generateHashFromString(description),
    (ctx) => {
      ctx.writer.updateTag("regex");
      ctx.writer.updateString(description);
    },
  );

const noSchema =
  (typeName: string): Runtype["schema"] =>
  (ctx) => {
    throw new Error(buildSchemaErrorMessage(ctx, `Cannot generate JSON Schema for ${typeName}`));
  };

export const date = (): Runtype =>
  leaf(
    0,
    (_c, i) => i instanceof Date,
    "expected Date",
    "Date",
    noSchema("Date"),
    () => dateHash,
    hash256Tag("date"),
  );

export const bigint = (): Runtype =>
  leaf(
    0,
    (_c, i) => typeof i === "bigint",
    "expected BigInt",
    "BigInt",
    noSchema("BigInt"),
    () => bigintHash,
    hash256Tag("bigint"),
  );

export const typedArray = (ctorName: string): Runtype =>
  leaf(
    0,
    (_c, i) => {
      const ctor = (globalThis as any)[ctorName];
      if (ctor == null) return false;
      return i instanceof ctor;
    },
    `expected ${ctorName}`,
    ctorName,
    noSchema(ctorName),
    () => generateHashFromString(ctorName.toLowerCase()),
    (ctx) => {
      ctx.writer.updateTag("typedArray");
      ctx.writer.updateString(ctorName);
    },
  );

function withFormat(
  typeName: "string" | "number",
  formatters: Record<
    string,
    { validator: (input: any) => boolean; errorMessage?: (input: any) => string; jsonSchemaFormat?: string }
  >,
  formats: string[],
): Runtype {
  const expected = `expected ${typeName} with format "${formats.join(" and ")}"`;
  return node(
    0,
    (_c, i) => {
      if (typeof i !== typeName) {
        return false;
      }

      for (const f of formats) {
        const validator = formatters[f]?.validator;

        if (validator == null) {
          return false;
        }

        if (!validator(i)) {
          return false;
        }
      }

      return true;
    },
    same,
    (c, i) =>
      buildError(
        c,
        typeof i === typeName ? (resolveFormatErrorMessage(formatters, formats, i) ?? expected) : expected,
        i,
      ),
    () => ({ typeExpr: describeFormats(typeName === "string" ? "String" : "Number", formats) }),
    () => ({
      type: typeName,
      format: formatters[formats[formats.length - 1]]?.jsonSchemaFormat ?? formats.join(" and "),
    }),
    () => hashFormats(typeName === "string" ? stringWithFormatHash : numberWithFormatHash, formats),
    (ctx) => hash256Formats(ctx, `${typeName}WithFormat`, formats),
    noKids,
  );
}
export const strFormat = (formats: string[]): Runtype => withFormat("string", stringFormatters, formats);
export const numFormat = (formats: string[]): Runtype => withFormat("number", numberFormatters, formats);

export function lits(values: Const[]): Runtype {
  const known = new Set<unknown>(values);
  const hasNull = known.has(null);
  return leaf(
    0,
    (_c, i) => (i == null && hasNull) || known.has(i),
    `expected one of ${limitedCommaJoinJson(values)}`,
    `(${values.map((it) => JSON.stringify(it)).join(" | ")})`,
    () => {
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
    () => generateHashFromNumbers([anyOfConstsHash, ...[...values].sort().map(hashConst)]),
    (ctx) => {
      ctx.writer.updateTag("anyOfConsts");
      const sorted = [...values].sort((a, b) => compareConst(a, b));
      ctx.writer.updateNumber(sorted.length);
      for (const v of sorted) {
        hash256Const(ctx, v);
      }
    },
  );
}

export function tuple(prefix: Runtype[], rest: Runtype | null = null): Runtype {
  const count = prefix.length;
  const vs = prefix.map((it) => it.v);
  const ps = prefix.map((it) => it.p);
  const rs = prefix.map((it) => it.r);
  const restV = rest?.v;
  const restP = rest?.p;
  const restR = rest?.r;
  return node(
    0,
    (c, i) => {
      if (!Array.isArray(i)) {
        return false;
      }
      for (let k = 0; k < count; k++) {
        if (!vs[k](c, i[k])) {
          return false;
        }
      }
      if (restV === undefined) {
        return i.length <= count;
      }
      for (let k = count; k < i.length; k++) {
        if (!restV(c, i[k])) {
          return false;
        }
      }
      return true;
    },
    (c, i) => {
      const acc = [];
      for (let k = 0; k < count; k++) {
        acc.push(ps[k](c, i[k]));
      }
      if (restP !== undefined) {
        for (let k = count; k < i.length; k++) {
          acc.push(restP(c, i[k]));
        }
      }
      return acc;
    },
    (c, i) => {
      if (!Array.isArray(i)) {
        return buildError(c, "expected tuple", i);
      }

      const acc: DecodeError[] = [];
      for (let k = 0; k < count; k++) {
        reportAtPath(c, acc, `[${k}]`, vs[k], rs[k], i[k]);
      }
      if (restV !== undefined) {
        for (let k = count; k < i.length; k++) {
          reportAtPath(c, acc, `[${k}]`, restV, restR!, i[k]);
        }
      } else if (i.length > count) {
        acc.push(...buildError(c, `expected tuple with ${count} items, got ${i.length}`, i));
      }

      return acc;
    },
    (ctx) => {
      const prefixExpr = prefix.map((it) => describeTypeExpr(ctx, it)).join(", ");
      const restExpr = rest != null ? `...Array<${describeTypeExpr(ctx, rest)}>` : null;

      const inner = [prefixExpr, restExpr].filter((it) => it != null && it.length > 0).join(", ");
      return { typeExpr: `[${inner}]` };
    },
    (ctx) => {
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
    (ctx) => {
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
    (ctx) => {
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
    () => [...prefix, ...(rest == null ? [] : [rest])],
  );
}

export function allOf(members: Runtype[]): Runtype {
  const count = members.length;
  const vs = members.map((it) => it.v);
  const ps = members.map((it) => it.p);
  const rs = members.map((it) => it.r);
  const parseMembers = (c: Ctx, i: any): object => {
    let acc = {};
    for (let k = 0; k < count; k++) {
      const parsed = ps[k](c, i);
      if (typeof parsed !== "object") {
        throw new Error("INTERNAL ERROR: AllOfParser: Expected object");
      }
      acc = { ...acc, ...parsed };
    }
    return acc;
  };
  // Keys of a valid input that no member of the intersection knows about.
  const extraKeys = (i: object): string[] => {
    const known = parseMembers(
      { disallowExtraProperties: true, objectKeyOrder: "input", intersectionInput: i, path: [] },
      i,
    );
    return Object.keys(i).filter((k) => !hasOwn.call(known, k));
  };
  return node(
    0,
    (c, i) => {
      const checksExtraProperties = intersectionChecksExtraProperties(c, i);
      // The members run on the input of the intersection.
      const old = c.intersectionInput;
      c.intersectionInput = i;
      let ok = true;
      for (let k = 0; k < count; k++) {
        if (typeof i !== "object" || !vs[k](c, i)) {
          ok = false;
          break;
        }
      }
      c.intersectionInput = old;
      return ok && !(checksExtraProperties && extraKeys(i).length > 0);
    },
    (c, i) => {
      const old = c.intersectionInput;
      c.intersectionInput = i;
      const parsed = parseMembers(c, i);
      c.intersectionInput = old;
      return parsed;
    },
    (c, i) => {
      const checksExtraProperties = intersectionChecksExtraProperties(c, i);
      const old = c.intersectionInput;
      c.intersectionInput = i;
      const errors: DecodeError[] = [];
      for (let k = 0; k < count; k++) {
        errors.push(...rs[k](c, i));
      }
      c.intersectionInput = old;
      if (errors.length > 0 || !checksExtraProperties) {
        return errors;
      }
      const acc: DecodeError[] = [];
      for (const k of extraKeys(i)) {
        pushPath(c, k);
        acc.push(...buildError(c, `extra property`, i[k]));
        popPath(c);
      }
      return acc;
    },
    (ctx) => ({ typeExpr: `(${members.map((it) => describeTypeExpr(ctx, it)).join(" & ")})` }),
    (ctx) => {
      const schemas = members.map((it) => it.schema(ctx));
      const merged = tryMergeAllOfObjectSchemas(schemas);
      if (merged != null) {
        return merged;
      }

      return {
        allOf: schemas,
      };
    },
    (ctx) => generateHashFromNumbers([allOfHash, ...members.map((it) => it.hash(ctx))]),
    (ctx) => {
      ctx.writer.updateTag("allOf");
      ctx.writer.updateNumber(members.length);
      for (const s of members) {
        s.hash256(ctx);
      }
    },
    () => members,
  );
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
  const count = members.length;
  const vs = members.map((it) => it.v);
  const ps = members.map((it) => it.p);
  const rs = members.map((it) => it.r);
  return node(
    0,
    (c, i) => {
      for (let k = 0; k < count; k++) {
        if (vs[k](c, i)) {
          return true;
        }
      }
      return false;
    },
    (c, i) => {
      const items = [];
      for (let k = 0; k < count; k++) {
        if (vs[k](c, i)) {
          items.push(ps[k](c, i));
        }
      }
      if (items.length === 1) {
        return items[0];
      }
      return deepmerge(...items);
    },
    (c, i) => {
      const branchErrors: DecodeError[][] = [];
      const oldPaths = c.path;
      c.path = [];
      for (let k = 0; k < count; k++) {
        branchErrors.push(rs[k](c, i));
      }
      c.path = oldPaths;

      // Filter to closest-matching branches by max error depth
      const depths = branchErrors.map((errors) => maxErrorDepth(errors));
      const bestDepth = Math.max(...depths);
      const filtered =
        bestDepth > 0 ? branchErrors.filter((_, k) => depths[k] === bestDepth).flat() : branchErrors.flat();

      return buildUnionError(c, filtered, i);
    },
    (ctx) => ({ typeExpr: `(${members.map((it) => describeTypeExpr(ctx, it)).join(" | ")})` }),
    (ctx) => ({
      anyOf: members.map((it) => it.schema(ctx)),
    }),
    (ctx) => generateHashFromNumbers([anyOfHash, ...members.map((it) => it.hash(ctx))]),
    (ctx) => {
      ctx.writer.updateTag("anyOf");
      ctx.writer.updateNumber(members.length);
      for (const s of members) {
        s.hash256(ctx);
      }
    },
    () => members,
  );
}

export function arr(item: Runtype): Runtype {
  const itemV = item.v;
  const itemP = item.p;
  const itemR = item.r;
  return node(
    0,
    (c, i) => {
      if (!Array.isArray(i)) {
        return false;
      }
      for (let k = 0; k < i.length; k++) {
        if (!itemV(c, i[k])) {
          return false;
        }
      }
      return true;
    },
    (c, i) => {
      const acc = new Array(i.length);
      for (let k = 0; k < i.length; k++) {
        acc[k] = itemP(c, i[k]);
      }
      return acc;
    },
    (c, i) => {
      if (!Array.isArray(i)) {
        return buildError(c, "expected array", i);
      }

      const acc: DecodeError[] = [];
      for (let k = 0; k < i.length; k++) {
        reportAtPath(c, acc, `[${k}]`, itemV, itemR, i[k]);
      }

      return acc;
    },
    (ctx) => ({ typeExpr: `Array<${describeTypeExpr(ctx, item)}>` }),
    (ctx) => {
      pushPath(ctx, "[]");
      const items = item.schema(ctx);
      popPath(ctx);
      return {
        type: "array",
        items,
      };
    },
    (ctx) => generateHashFromNumbers([arrayHash, item.hash(ctx)]),
    (ctx) => {
      ctx.writer.updateTag("array");
      item.hash256(ctx);
    },
    () => [item],
  );
}

export function map(key: Runtype, value: Runtype): Runtype {
  const keyV = key.v;
  const keyP = key.p;
  const keyR = key.r;
  const valueV = value.v;
  const valueP = value.p;
  const valueR = value.r;
  return node(
    0,
    (c, i) => {
      if (!(i instanceof Map)) {
        return false;
      }
      for (const [k, v] of i) {
        if (!keyV(c, k) || !valueV(c, v)) {
          return false;
        }
      }
      return true;
    },
    (c, i) => {
      const res = new Map();
      for (const [k, v] of i as Map<any, any>) {
        res.set(keyP(c, k), valueP(c, v));
      }
      return res;
    },
    (c, i) => {
      if (!(i instanceof Map)) {
        return buildError(c, "expected Map", i);
      }
      const acc: DecodeError[] = [];
      for (const [k, v] of i) {
        reportAtPath(c, acc, `key(${stringifyWithBigInt(k)})`, keyV, keyR, k);
        reportAtPath(c, acc, `value(${stringifyWithBigInt(k)})`, valueV, valueR, v);
      }
      return acc;
    },
    (ctx) => ({ typeExpr: `Map<${describeTypeExpr(ctx, key)}, ${describeTypeExpr(ctx, value)}>` }),
    noSchema("Map"),
    (ctx) => generateHashFromNumbers([mapHash, key.hash(ctx), value.hash(ctx)]),
    (ctx) => {
      ctx.writer.updateTag("map");
      key.hash256(ctx);
      value.hash256(ctx);
    },
    () => [key, value],
  );
}

export function set(item: Runtype): Runtype {
  const itemV = item.v;
  const itemP = item.p;
  const itemR = item.r;
  return node(
    0,
    (c, i) => {
      if (!(i instanceof Set)) {
        return false;
      }
      for (const v of i) {
        if (!itemV(c, v)) {
          return false;
        }
      }
      return true;
    },
    (c, i) => {
      const res = new Set();
      for (const v of i as Set<any>) {
        res.add(itemP(c, v));
      }
      return res;
    },
    (c, i) => {
      if (!(i instanceof Set)) {
        return buildError(c, "expected Set", i);
      }
      const acc: DecodeError[] = [];
      for (const v of i) {
        reportAtPath(c, acc, `item(${stringifyWithBigInt(v)})`, itemV, itemR, v);
      }
      return acc;
    },
    (ctx) => ({ typeExpr: `Set<${describeTypeExpr(ctx, item)}>` }),
    noSchema("Set"),
    (ctx) => generateHashFromNumbers([setHash, item.hash(ctx)]),
    (ctx) => {
      ctx.writer.updateTag("set");
      item.hash256(ctx);
    },
    () => [item],
  );
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
export function disc(discriminator: string, mapping: Record<string, Runtype>, members: Runtype[]): Runtype {
  const variants = new Map(Object.entries(mapping));
  const hash: Runtype["hash"] = (ctx) =>
    generateHashFromNumbers([anyOfHash, ...members.map((it) => it.hash(ctx))]);
  return node(
    0,
    (c, i) => {
      if (typeof i !== "object" || i == null) {
        return false;
      }
      const d = i[discriminator];
      if (d == null) {
        return false;
      }
      const variant = variants.get(String(d));
      return variant !== undefined && variant.v(c, i);
    },
    (c, i) => {
      const variant = variants.get(String(i[discriminator]));
      if (variant === undefined) {
        throw new Error(
          "INTERNAL ERROR: Missing parser for discriminator " + JSON.stringify(i[discriminator]),
        );
      }
      return {
        ...(variant.p(c, i) as object),
        [discriminator]: i[discriminator],
      };
    },
    (c, i) => {
      if (i == null || typeof i !== "object") {
        return buildError(c, "expected object", i);
      }

      const d = i[discriminator];
      if (d == null) {
        return buildError(c, "expected discriminator key " + JSON.stringify(discriminator), i);
      }
      const variant = variants.get(String(d));
      if (variant === undefined) {
        pushPath(c, discriminator);
        const errs = buildError(
          c,
          "expected one of " +
            Object.keys(mapping)
              .map((it) => JSON.stringify(it))
              .join(", "),
          d,
        );
        popPath(c);
        return errs;
      }
      return variant.r(c, i);
    },
    (ctx) => ({ typeExpr: `(${members.map((it) => describeTypeExpr(ctx, it)).join(" | ")})` }),
    (ctx) => {
      const printingContext = ctx.printingContext;
      if (ctx.mode === "contextual" && printingContext != null) {
        const unionHash = hash({ seen: {} });
        const variantRefs = Object.entries(mapping).map(([key, variant]) => {
          // A variant that is a named type keeps its name. Other variants get a name made from the union.
          const name =
            variant.t === T_REF
              ? variant.name!
              : `Discriminated${sanitizeComponentNamePart(discriminator)}${sanitizeComponentNamePart(key)}${Math.abs(unionHash)}`;
          const target = variant.t === T_REF ? variant.kids()[0] : variant;
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
    (ctx) => {
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
    () => members,
  );
}

// An optional property of an object.
export function opt(inner: Runtype): Runtype {
  const innerV = inner.v;
  const innerP = inner.p;
  return node(
    T_OPT,
    (c, i) => i == null || innerV(c, i),
    (c, i) => (i == null ? i : innerP(c, i)),
    // `v` accepts null and undefined, so the input here is neither of them. Only the errors of the inner
    // type are relevant.
    inner.r,
    (ctx) => inner.describe(ctx),
    (ctx) => ({
      anyOf: [inner.schema(ctx), { type: "null" }],
    }),
    (ctx) => generateHashFromNumbers([optionalFieldHash, inner.hash(ctx)]),
    (ctx) => {
      ctx.writer.updateTag("optionalField");
      inner.hash256(ctx);
    },
    () => [inner],
  );
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

// In an intersection, an index signature only constrains the keys it matches: another member may know the rest.
function leavesKeyToIntersection(indexed: Indexed, c: Ctx, i: object, k: string): boolean {
  return c.intersectionInput === i && !indexed.some((p) => p.key.v(c, k));
}

function parseIndexed(indexed: Indexed, c: Ctx, acc: Record<string, unknown>, k: string, v: unknown): void {
  for (const p of indexed) {
    if (p.key.v(c, k) && p.value.v(c, v)) {
      const itemParsed = p.value.p(c, v);
      setOwnProperty(acc, p.key.p(c, k), itemParsed);
    }
  }
}

function hasExtraKeys(index: Record<string, number | undefined>, i: object): boolean {
  for (const k of Object.keys(i)) {
    if (index[k] === undefined) {
      return true;
    }
  }
  return false;
}

export function obj(properties: Record<string, Runtype>, indexed: Indexed = []): Runtype {
  // The properties as parallel arrays. An optional property keeps the functions of its inner type, and
  // `optional` says that it also accepts null and undefined.
  const keys = Object.keys(properties);
  const count = keys.length;
  const optional = keys.map((k) => properties[k].t === T_OPT);
  const inner = keys.map((k, j) => (optional[j] ? properties[k].kids()[0] : properties[k]));
  const vs = inner.map((it) => it.v);
  const ps = inner.map((it) => it.p);
  // The position of each property. It has no prototype, so only the keys of `properties` are in it.
  const index: Record<string, number | undefined> = Object.create(null);
  keys.forEach((k, j) => {
    index[k] = j;
  });
  const hasIndexed = indexed.length > 0;
  // There is one validate function for objects with an index signature and one for objects without. Each is
  // small, so that it needs little stack: validation of deep inputs must not overflow the stack.
  const v: Validate = hasIndexed
    ? (c, i) => {
        if (typeof i !== "object" || i === null || Array.isArray(i)) {
          return false;
        }
        for (let j = 0; j < count; j++) {
          const x = i[keys[j]];
          if (!(x == null && optional[j]) && !vs[j](c, x)) {
            return false;
          }
        }
        for (const k of Object.keys(i)) {
          if (index[k] !== undefined) {
            continue;
          }
          let isValid = false;
          for (const p of indexed) {
            if (p.key.v(c, k) && p.value.v(c, i[k])) {
              isValid = true;
              break;
            }
          }
          if (!isValid && !leavesKeyToIntersection(indexed, c, i, k)) {
            return false;
          }
        }
        return true;
      }
    : (c, i) => {
        if (typeof i !== "object" || i === null || Array.isArray(i)) {
          return false;
        }
        for (let j = 0; j < count; j++) {
          const x = i[keys[j]];
          if (!(x == null && optional[j]) && !vs[j](c, x)) {
            return false;
          }
        }
        return !(c.disallowExtraProperties && c.intersectionInput !== i && hasExtraKeys(index, i));
      };
  return node(
    0,
    v,
    (c, i) => {
      const acc: any = {};
      const inputKeys = Object.keys(i);

      if (c.objectKeyOrder === "input") {
        for (const k of inputKeys) {
          const x = i[k];
          const j = index[k];
          if (j !== undefined) {
            setOwnProperty(acc, k, x == null && optional[j] ? x : ps[j](c, x));
          } else if (hasIndexed) {
            parseIndexed(indexed, c, acc, k, x);
          }
        }
      } else {
        for (const k of [...keys].sort()) {
          if (!hasOwn.call(i, k)) {
            continue;
          }
          const x = i[k];
          const j = index[k]!;
          setOwnProperty(acc, k, x == null && optional[j] ? x : ps[j](c, x));
        }

        if (hasIndexed) {
          for (const k of inputKeys.filter((k) => index[k] === undefined).sort()) {
            parseIndexed(indexed, c, acc, k, i[k]);
          }
        }
      }

      return acc;
    },
    (c, i) => {
      if (typeof i !== "object" || Array.isArray(i) || i === null) {
        return buildError(c, "expected object", i);
      }

      const acc: DecodeError[] = [];

      for (let j = 0; j < count; j++) {
        const x = i[keys[j]];
        if (!(x == null && optional[j])) {
          reportAtPath(c, acc, keys[j], vs[j], properties[keys[j]].r, x);
        }
      }

      if (hasIndexed) {
        for (const k of Object.keys(i)) {
          if (index[k] !== undefined || leavesKeyToIntersection(indexed, c, i, k)) {
            continue;
          }
          for (const p of indexed) {
            const keyOk = p.key.v(c, k);
            const valueOk = p.value.v(c, i[k]);
            if (!keyOk || !valueOk) {
              pushPath(c, k);
              if (!keyOk) {
                acc.push(...p.key.r(c, k));
              }
              if (!valueOk) {
                acc.push(...p.value.r(c, i[k]));
              }
              popPath(c);
            }
          }
        }
      } else if (c.disallowExtraProperties && c.intersectionInput !== i) {
        const extraKeys = Object.keys(i).filter((k) => index[k] === undefined);
        if (extraKeys.length > 0) {
          return extraKeys.flatMap((k) => {
            pushPath(c, k);
            const err = buildError(c, `extra property`, i[k]);
            popPath(c);
            return err;
          });
        }
      }

      return acc;
    },
    (ctx) => {
      const props = [...keys]
        .sort()
        .map((k) => describeObjectMember(ctx, describePropertyKey(k), properties[k]));

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
    (ctx) => {
      const schemaProperties: Record<string, JSONSchema7Definition> = {};
      const optionalized = new Set<string>();
      for (const k of keys) {
        pushPath(ctx, k);
        const raw = properties[k].schema(ctx);
        const rewrite = removeNullUnionBranch(raw);
        if (rewrite != null) {
          schemaProperties[k] = rewrite;
          optionalized.add(k);
        } else {
          schemaProperties[k] = raw;
        }
        popPath(ctx);
      }

      const required = keys.filter((k) => !optionalized.has(k));
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
      if (count === 0 && indexSchemas.length === 1) {
        const valueRuntype = indexed[0].value;

        // Record<string, never> -> empty closed object (keys don't matter)
        if (valueRuntype.t === T_NEVER) {
          return { type: "object", additionalProperties: false };
        }

        // Record<string, unknown> -> simplify additionalProperties to true
        if (valueRuntype.t === T_ANY) {
          return { ...indexSchemas[0], additionalProperties: true };
        }

        return indexSchemas[0];
      }

      return {
        allOf: [base, ...indexSchemas],
      };
    },
    (ctx) => {
      let acc: number[] = [objectHash];
      for (const key of [...keys].sort()) {
        acc.push(generateHashFromString(key));
        acc.push(properties[key].hash(ctx));
      }
      for (const p of indexed) {
        acc.push(p.key.hash(ctx));
        acc.push(p.value.hash(ctx));
      }
      return generateHashFromNumbers(acc);
    },
    (ctx) => {
      ctx.writer.updateTag("object");
      ctx.writer.updateNumber(count);
      for (const key of [...keys].sort()) {
        const parser = properties[key];
        ctx.writer.updateString(key);
        ctx.writer.updateBoolean(parser.t === T_OPT);
        parser.hash256(ctx);
      }
      ctx.writer.updateNumber(indexed.length);
      for (const p of indexed) {
        p.key.hash256(ctx);
        p.value.hash256(ctx);
      }
    },
    () => [...Object.values(properties), ...indexed.flatMap(({ key, value }) => [key, value])],
  );
}

// The named types of one module. A ref reads the cell of its name on every call, so it always uses the
// type that the cell has now.
export type Registry = Map<string, { n: Runtype | undefined }>;

function cellOf(registry: Registry, name: string): { n: Runtype | undefined } {
  let cell = registry.get(name);
  if (cell === undefined) {
    cell = { n: undefined };
    registry.set(name, cell);
  }
  return cell;
}

export function ref(registry: Registry, name: string): Runtype {
  const cell = cellOf(registry, name);
  const n = node(
    T_REF,
    (c, i) => cell.n!.v(c, i),
    (c, i) => cell.n!.p(c, i),
    (c, i) => cell.n!.r(c, i),
    (ctx) => {
      const to = cell.n!;
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
    (ctx) => {
      const to = cell.n!;
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
    (ctx) => {
      if (ctx.seen[name]) {
        return generateHashFromString(name);
      }
      ctx.seen[name] = true;
      var tmp = cell.n!.hash(ctx);
      delete ctx.seen[name];
      return tmp;
    },
    (ctx) => {
      const to = cell.n!;
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
    () => [cell.n!],
  );
  n.name = name;
  return n;
}

// Sets the named types of a module.
export function define(registry: Registry, types: Record<string, Runtype>): void {
  for (const name of Object.keys(types)) {
    cellOf(registry, name).n = types[name];
  }
}

const namedRuntypes: Registry = new Map();

export const createNamedType = <T>(name: string, p: BeffParser<T>): BeffParser<T> => {
  const cell = cellOf(namedRuntypes, name);
  if (cell.n !== undefined) {
    throw new Error(`Named type ${name} already exists`);
  }
  cell.n = (p as ParserFromRuntype)._runtype;
  return buildParserFromRuntype(ref(namedRuntypes, name), name, false);
};
export const overrideNamedType = (name: string, runtype: BeffParser<any>): void => {
  const cell = namedRuntypes.get(name);
  if (cell === undefined) {
    throw new Error(`Named type ${name} does not exist`);
  }
  cell.n = (runtype as ParserFromRuntype)._runtype;
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
    if (this._runtype.v(ctx, input)) {
      return { success: true, data: this._runtype.p(ctx, input) };
    }
    return {
      success: false,
      errors: this._runtype.r(ctx, input).slice(0, 10),
    };
  }
  zod(): z.ZodType<any, z.ZodTypeDef, any> {
    //@ts-ignore
    return z.custom(
      (data: any) => this.validate(data),
      //@ts-ignore
      (val: any) => {
        const errors = this._runtype.r(newCtx(undefined), val);
        return printErrors(errors, []);
      },
    );
  }
  validate(input: any, options?: ParseOptions): input is any {
    return this._runtype.v(newCtx(options), input);
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
