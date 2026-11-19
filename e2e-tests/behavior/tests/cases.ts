// Behavioral test suite for generated validators.
//
// Everything here goes through the public parser API (validate, parse, safeParse) and asserts results,
// never generated code or exact error messages. `defineBehaviorSuite` takes the codecs as an argument,
// so the same cases can run against any beff.json configuration: see behavior.test.ts.
import { describe, expect, it } from "vitest";
import {
  b,
  buntyped,
  createNamedType,
  overrideNamedType,
  type BeffParser,
  type DecodeError,
} from "@beff/client";
import { Color, type Codecs } from "../src/parser";

const strict = { disallowExtraProperties: true } as const;

// An invalid input, optionally with the path its first error must point at.
type Invalid = unknown | { value: unknown; path: string[] };
const at = (path: string[], value: unknown) => ({ value, path, __at: true });
const isAt = (x: unknown): x is { value: unknown; path: string[] } =>
  typeof x === "object" && x != null && "__at" in x;

type Case = {
  valid?: unknown[];
  invalid?: Invalid[];
  // [input, expected output of parse]
  parsed?: [unknown, unknown][];
  // Same, with disallowExtraProperties
  strictValid?: unknown[];
  strictInvalid?: Invalid[];
  // Known bugs, run with it.fails: what the input should do once the issue is fixed.
  bugs?: { issue: number; expect: "valid" | "invalid" | "strictValid"; value: unknown }[];
  bugParsed?: { issue: number; input: unknown; output: unknown }[];
};

const hasMessage = (e: DecodeError): boolean =>
  "isUnionError" in e
    ? e.errors.length > 0 && e.errors.every(hasMessage)
    : typeof e.message === "string" && e.message.length > 0;

const expectValid = (codec: BeffParser<any>, value: unknown, options?: typeof strict) => {
  expect(codec.validate(value, options)).toBe(true);
  const res = codec.safeParse(value, options);
  expect(res.success).toBe(true);
  expect(() => codec.parse(value, options)).not.toThrow();
};

const expectInvalid = (codec: BeffParser<any>, invalid: Invalid, options?: typeof strict) => {
  const value = isAt(invalid) ? invalid.value : invalid;
  expect(codec.validate(value, options)).toBe(false);
  const res = codec.safeParse(value, options);
  expect(res.success).toBe(false);
  if (res.success) return;
  expect(res.errors.length).toBeGreaterThanOrEqual(1);
  for (const e of res.errors) {
    expect(Array.isArray(e.path)).toBe(true);
    expect(hasMessage(e)).toBe(true);
  }
  if (isAt(invalid)) {
    expect(res.errors[0]!.path).toEqual(invalid.path);
  }
  let thrown: unknown = undefined;
  try {
    codec.parse(value, options);
  } catch (e) {
    thrown = e;
  }
  expect(thrown).toBeInstanceOf(Error);
  expect(thrown).not.toBeInstanceOf(TypeError);
  expect((thrown as Error).message.length).toBeGreaterThan(0);
};

const label = (x: unknown): string => {
  if (isAt(x)) return label(x.value);
  if (typeof x === "bigint") return `${x}n`;
  if (x instanceof Map || x instanceof Set) return `${x.constructor.name}(${x.size})`;
  if (ArrayBuffer.isView(x)) return x.constructor.name;
  if (x instanceof Date) return `Date(${x.getTime()})`;
  try {
    const s = JSON.stringify(x);
    if (s === undefined) return String(x);
    return s.length > 60 ? s.slice(0, 57) + "..." : s;
  } catch {
    return String(x);
  }
};

// Deep inputs for recursive types

const DEPTH = 1000;
const deepList = (depth: number, last: unknown = null): unknown => {
  let acc: unknown = last;
  for (let i = 0; i < depth; i++) acc = { value: i, next: acc };
  return acc;
};
const deepTree = (depth: number, leafName: unknown = "leaf"): unknown => {
  let acc: unknown = { name: leafName, children: [] };
  for (let i = 0; i < depth; i++) acc = { name: `n${i}`, children: [acc] };
  return acc;
};
const deepArray = (depth: number, leaf: unknown): unknown => {
  let acc = leaf;
  for (let i = 0; i < depth; i++) acc = [acc];
  return acc;
};

const f20 = {
  f01: "a",
  f02: 1,
  f03: true,
  f04: "b",
  f05: 2,
  f06: false,
  f07: "c",
  f08: 3,
  f09: true,
  f10: "d",
  f11: 4,
  f12: false,
  f13: "e",
  f14: 5,
  f15: true,
  f16: "f",
  f17: 6,
  f18: false,
  f19: "g",
  f20: 7,
};

const shapes = {
  circle: { kind: "circle", radius: 1 },
  square: { kind: "square", size: 2 },
  rect: { kind: "rect", w: 1, h: 2 },
};

// Proto-like JSON objects: JSON.parse creates own "__proto__" properties.
const protoKeys = JSON.parse('{"__proto__": 1, "toString": 2, "constructor": 3, "hasOwnProperty": 4}');

const cases: { [K in keyof Codecs]?: Case } = {
  // Primitives (#388: parse of a bigint input must not throw a TypeError)
  String: {
    valid: ["", "a", "with\nnewline"],
    invalid: [1, null, undefined, true, {}, [], 1n, new String("a")],
  },
  Number: {
    valid: [0, -1, 1.5, Number.MAX_SAFE_INTEGER, NaN, Infinity],
    invalid: ["1", null, undefined, 1n, {}, [1], new Number(1)],
  },
  Boolean: { valid: [true, false], invalid: [0, 1, "true", null, undefined] },
  // null, undefined and void are all "nullish": each accepts both null and undefined.
  Null: { valid: [null, undefined], invalid: [0, "", false, {}] },
  Undefined: { valid: [undefined, null], invalid: [0, "", false] },
  Void: { valid: [undefined, null], invalid: [0, ""] },
  Any: { valid: [undefined, null, 0, "a", {}, [], 1n, new Date()] },
  Unknown: { valid: [undefined, null, 0, "a", {}, [], 1n] },
  BigInt: { valid: [0n, -1n, 10n ** 30n], invalid: [0, "1", null, undefined] },
  DateT: {
    valid: [new Date(0), new Date("2024-01-01T00:00:00Z")],
    invalid: ["2024-01-01", 0, null, {}],
    parsed: [[new Date(5), new Date(5)]],
  },

  // Literals
  LitString: { valid: ["hello"], invalid: ["Hello", "hello ", "", 1, null] },
  LitNumber: { valid: [42], invalid: [41, "42", 42n, null] },
  LitTrue: { valid: [true], invalid: [false, "true", 1] },
  LitUnion: { valid: ["a", "b", "c"], invalid: ["d", "A", "", 0, null] },
  LitMixedUnion: { valid: ["a", 1, true, null, undefined], invalid: ["1", 2, false, "b"] },
  ProtoLitUnion: {
    valid: ["__proto__", "toString", "constructor"],
    invalid: ["valueOf", "hasOwnProperty", ""],
  },
  Enum: { valid: ["red", "green"], invalid: ["Red", "blue", 0, null] },
  EnumMember: { valid: [Color.Red], invalid: [Color.Green, "Red"] },

  // Arrays and tuples
  StringArray: {
    valid: [[], ["a"], ["a", "b", "c"]],
    invalid: [
      at([], "a"),
      at(["[1]"], ["a", 1]),
      at([], { 0: "a", length: 1 }),
      at([], null),
      at(["[0]"], [undefined]),
    ],
    parsed: [
      [
        ["a", "b"],
        ["a", "b"],
      ],
    ],
  },
  ReadonlyNumberArray: { valid: [[], [1, 2]], invalid: [at(["[0]"], ["1"]), at(["[2]"], [1, 2, null])] },
  NestedArray: { valid: [[], [[]], [[1], [2, 3]]], invalid: [[1], at(["[1]", "[0]"], [[1], ["x"]])] },
  // #387: too long tuples must fail with errors
  Tuple: {
    valid: [["a", 1]],
    invalid: [[], ["a"], at(["[1]"], ["a", "1"]), [1, "a"], ["a", 1, 2], ["a", 1, "extra"], { 0: "a", 1: 1 }],
    parsed: [
      [
        ["a", 1],
        ["a", 1],
      ],
    ],
  },
  TupleRest: {
    valid: [["a"], ["a", 1], ["a", 1, 2, 3]],
    invalid: [[], [1], at(["[3]"], ["a", 1, 2, "x"]), at(["[1]"], ["a", "b"])],
    parsed: [
      [
        ["a", 1, 2],
        ["a", 1, 2],
      ],
    ],
  },
  ReadonlyTuple: { valid: [[true, "a"]], invalid: [[true], [true, "a", 1], ["a", true]] },

  // Objects
  Empty: {
    valid: [{}, { a: 1 }],
    parsed: [[{ a: 1 }, {}]],
    strictValid: [{}],
    strictInvalid: [at(["a"], { a: 1 })],
  },
  Nested: {
    valid: [
      { inner: { deep: { value: 1 } }, list: [] },
      { inner: { deep: { value: 1 } }, list: [{ id: "a" }, { id: "b" }] },
    ],
    invalid: [
      at(["inner", "deep", "value"], { inner: { deep: { value: "1" } }, list: [] }),
      at(["inner", "deep"], { inner: { deep: null }, list: [] }),
      at(["list", "[1]", "id"], { inner: { deep: { value: 1 } }, list: [{ id: "a" }, { id: 2 }] }),
      at(["list"], { inner: { deep: { value: 1 } } }),
      null,
      [],
      "x",
    ],
    parsed: [
      [
        { inner: { deep: { value: 1, x: 1 }, y: 2 }, list: [{ id: "a", z: 3 }], w: 4 },
        { inner: { deep: { value: 1 } }, list: [{ id: "a" }] },
      ],
    ],
    strictValid: [{ inner: { deep: { value: 1 } }, list: [{ id: "a" }] }],
    strictInvalid: [
      at(["inner", "deep", "x"], { inner: { deep: { value: 1, x: 1 } }, list: [] }),
      at(["list", "[0]", "z"], { inner: { deep: { value: 1 } }, list: [{ id: "a", z: 1 }] }),
      at(["w"], { inner: { deep: { value: 1 } }, list: [], w: 1 }),
    ],
  },
  ManyFields: {
    valid: [f20],
    invalid: [
      at(["f20"], { ...f20, f20: "7" }),
      at(["f01"], { ...f20, f01: undefined }),
      { ...f20, f10: null },
    ],
    parsed: [[{ ...f20, extra: 1 }, f20]],
    strictValid: [f20],
    strictInvalid: [at(["extra"], { ...f20, extra: 1 })],
  },
  Optionals: {
    valid: [
      { req: "a", undef: "b", voided: "c", nul: "d" },
      { req: "a", opt: "x", undef: undefined, voided: undefined, nul: null },
      { req: "a", opt: undefined, nul: null },
      // nullish members accept both null and undefined, and a missing key is undefined
      { req: "a", opt: null, undef: null, voided: null, nul: undefined },
      { req: "a" },
    ],
    invalid: [
      at(["req"], { nul: null }),
      at(["req"], { req: null }),
      at(["opt"], { req: "a", opt: 1 }),
      at(["undef"], { req: "a", undef: 1 }),
      at(["nul"], { req: "a", nul: 1 }),
    ],
    parsed: [
      [
        { req: "a", nul: null, other: 1 },
        { req: "a", nul: null },
      ],
    ],
  },
  ProtoKeyObject: {
    invalid: [at(["toString"], JSON.parse('{"__proto__": "x", "toString": "1"}'))],
    bugs: [
      { issue: 438, expect: "invalid", value: { toString: 1 } },
      { issue: 438, expect: "invalid", value: JSON.parse('{"__proto__": 1, "toString": 1}') },
      { issue: 438, expect: "strictValid", value: JSON.parse('{"__proto__": "x", "toString": 1}') },
    ],
    bugParsed: [
      {
        issue: 438,
        input: JSON.parse('{"__proto__": "x", "toString": 1}'),
        output: JSON.parse('{"__proto__": "x", "toString": 1}'),
      },
    ],
  },

  // Records and index signatures
  StringRecord: {
    valid: [{}, { a: 1, b: 2 }, protoKeys],
    invalid: [at(["b"], { a: 1, b: "2" }), null, []],
    parsed: [[{ a: 1 }, { a: 1 }]],
    strictValid: [{ a: 1, b: 2 }],
  },
  // #378
  NumberRecord: {
    valid: [{}, { 1: "a" }, { 0: "a", 1.5: "b", "-1": "c" }],
    invalid: [{ a: "x" }, { 1: 1 }, { "1a": "x" }],
    parsed: [[{ 1: "a" }, { 1: "a" }]],
  },
  NumberKeyedObj: { valid: [{}, { 1: true, 2: false }], invalid: [{ a: true }, { 1: "true" }] },
  LiteralKeyRecord: {
    valid: [{ x: 1, y: 2 }],
    invalid: [{}, at(["y"], { x: 1 }), at(["y"], { x: 1, y: "2" })],
    parsed: [
      [
        { x: 1, y: 2, z: 3 },
        { x: 1, y: 2 },
      ],
    ],
    strictInvalid: [at(["z"], { x: 1, y: 2, z: 3 })],
  },
  // #399
  NumberLiteralKeyRecord: {
    valid: [{ 1: "a", 2: "b" }],
    invalid: [{}, { 1: "a" }, { 1: "a", 2: 2 }],
    parsed: [
      [
        { 1: "a", 2: "b", 3: "c" },
        { 1: "a", 2: "b" },
      ],
    ],
  },
  PartialRecord: {
    valid: [{}, { x: 1 }, { x: 1, y: 2 }],
    invalid: [at(["x"], { x: "1" })],
    parsed: [[{ x: 1, z: 1 }, { x: 1 }]],
  },
  TplRecord: {
    valid: [{}, { x_1: 1, x_: 2, "x_a b": 3 }],
    invalid: [at(["x_1"], { x_1: "1" })],
    // keys outside the template are not part of the record
    strictInvalid: [{ x_1: 1, y: 1 }],
  },
  TplIndexWithProps: {
    valid: [{ a: 1 }, { a: 1, x_1: 2 }],
    invalid: [{}, at(["a"], { a: "1" }), at(["x_1"], { a: 1, x_1: "2" })],
    parsed: [
      [
        { a: 1, x_1: 2 },
        { a: 1, x_1: 2 },
      ],
    ],
    strictValid: [{ a: 1, x_1: 2 }],
  },
  MetaRecord: {
    valid: [{}, { alpha: "a" }, { beta_1: "b", beta_: "c" }],
    invalid: [at(["alpha"], { alpha: 1 }), at(["beta_x"], { beta_x: 1 })],
    strictInvalid: [{ gamma: "x" }],
  },
  MappedType: {
    valid: [{ a: { value: "a" }, b: { value: "b" } }],
    invalid: [at(["a", "value"], { a: { value: "b" }, b: { value: "b" } }), { a: { value: "a" } }],
  },

  // Unions
  PrimitiveUnion: { valid: ["a", 1, ""], invalid: [true, null, undefined, {}, []] },
  ObjectUnion: {
    valid: [{ a: "x" }, { b: 1 }, { a: "x", b: 1 }],
    invalid: [{}, { a: 1 }, { b: "x" }, null, "a"],
    parsed: [
      [{ a: "x", c: 1 }, { a: "x" }],
      [{ b: 1, c: 1 }, { b: 1 }],
    ],
  },
  MixedUnion: {
    valid: ["a", { a: "x" }, [], [1, 2], null, undefined],
    invalid: [1, { a: 1 }, ["x"], true],
    parsed: [
      [{ a: "x", b: 1 }, { a: "x" }],
      [[1], [1]],
    ],
  },
  Shape: {
    valid: Object.values(shapes),
    invalid: [
      { kind: "triangle", radius: 1 },
      { kind: "circle", size: 1 },
      { radius: 1 },
      at(["radius"], { kind: "circle", radius: "1" }),
      at(["h"], { kind: "rect", w: 1 }),
      null,
      "circle",
    ],
    parsed: [
      [
        { kind: "circle", radius: 1, size: 2 },
        { kind: "circle", radius: 1 },
      ],
    ],
    strictInvalid: [at(["size"], { kind: "circle", radius: 1, size: 2 })],
  },
  NestedDiscriminated: {
    valid: [
      { type: "a", subType: "a1", a1: "x" },
      { type: "a", subType: "a2", a2: "x" },
      { type: "b", value: 1 },
    ],
    invalid: [
      { type: "a", subType: "a1", a2: "x" },
      { type: "a", subType: "a3", a1: "x" },
      { type: "a", a1: "x" },
      { type: "b", value: "1" },
      { type: "c", value: 1 },
    ],
  },
  // #376
  ProtoDiscriminated: {
    valid: [
      { kind: "toString", a: "x" },
      { kind: "constructor", b: 1 },
    ],
    invalid: [
      { kind: "toString", b: 1 },
      { kind: "constructor", a: "x" },
      { kind: "valueOf", a: "x" },
      { kind: "hasOwnProperty", a: "x" },
      {},
    ],
    bugs: [{ issue: 438, expect: "valid", value: JSON.parse('{"kind": "__proto__", "c": true}') }],
  },
  MultiValueDiscriminated: {
    valid: [
      { type: "a", a: "x" },
      { type: "c", a: "x" },
      { type: "b", b: 1 },
    ],
    invalid: [{ type: "c", b: 1 }, { type: "d", a: "x" }, { a: "x" }],
  },
  OptionalDiscriminated: {
    valid: [{ type: "a", a: "x" }, { type: "d", d: 1 }, { d: 1 }],
    invalid: [{ type: "a", d: 1 }, { a: "x" }, { type: "e", d: 1 }],
  },
  // #375
  MapOrSetUnion: {
    valid: [null, new Map(), new Map([["a", 1]]), new Set(["a"])],
    invalid: [{}, [], new Map([["a", "1"]]), new Set([1])],
    parsed: [
      [new Map([["a", 1]]), new Map([["a", 1]])],
      [new Set(["a", "b"]), new Set(["a", "b"])],
    ],
  },

  // Intersections
  // #428
  Intersection: {
    valid: [{ a: "x" }, { a: "x", b: 1 }],
    invalid: [{}, at(["a"], { a: 1 }), at(["b"], { a: "x", b: "1" })],
    parsed: [
      [
        { a: "x", b: 1, c: 2 },
        { a: "x", b: 1 },
      ],
    ],
    strictValid: [{ a: "x" }, { a: "x", b: 1 }],
    strictInvalid: [at(["c"], { a: "x", b: 1, c: 2 })],
  },
  IntersectionNested: {
    valid: [
      { a: "x", n: { x: "y" } },
      { a: "x", b: 1, n: { x: "y" } },
    ],
    invalid: [{ a: "x" }, at(["n", "x"], { a: "x", n: { x: 1 } })],
    parsed: [
      [
        { a: "x", n: { x: "y", z: 1 }, z: 1 },
        { a: "x", n: { x: "y" } },
      ],
    ],
    strictValid: [{ a: "x", b: 1, n: { x: "y" } }],
    strictInvalid: [
      { a: "x", n: { x: "y", z: 1 } },
      { a: "x", n: { x: "y" }, z: 1 },
    ],
  },
  IntersectionIndex: {
    valid: [
      { a: "x", n: 1 },
      { a: "x", n: 1, other: "y", more: 2 },
    ],
    invalid: [{ a: "x" }, { a: "x", n: 1, other: true }, { a: 1, n: 1 }],
    parsed: [
      [
        { a: "x", n: 1, o: "y" },
        { a: "x", n: 1, o: "y" },
      ],
    ],
    strictValid: [{ a: "x", n: 1, o: "y" }],
  },
  // #435
  IntersectionTplIndex: {
    valid: [{ a: "x" }, { a: "x", x_1: 1 }],
    invalid: [at(["x_1"], { a: "x", x_1: "s" }), at(["a"], { a: 1, x_1: 1 })],
    parsed: [
      [
        { a: "x", x_1: 1, zz: true },
        { a: "x", x_1: 1 },
      ],
    ],
    strictValid: [{ a: "x", x_1: 1 }],
    strictInvalid: [at(["zz"], { a: "x", x_1: 1, zz: true })],
  },
  IntersectionUnion: {
    valid: [
      { a: "x", kind: "u", u: "y" },
      { a: "x", kind: "v" },
      { a: "x", kind: "v", v: 1 },
    ],
    invalid: [
      { a: "x", kind: "u" },
      { kind: "u", u: "y" },
      { a: "x", kind: "w" },
    ],
    parsed: [
      [
        { a: "x", kind: "u", u: "y", v: 1 },
        { a: "x", kind: "u", u: "y" },
      ],
    ],
    strictValid: [{ a: "x", kind: "v", v: 1 }],
    strictInvalid: [{ a: "x", kind: "u", u: "y", v: 1 }],
  },

  // Utility types
  OmitT: {
    valid: [{ a: "x" }, { a: "x", c: true }],
    invalid: [{}, { a: "x", c: "true" }],
    parsed: [[{ a: "x", b: 1 }, { a: "x" }]],
    strictInvalid: [at(["b"], { a: "x", b: 1 })],
  },
  PickT: {
    valid: [{ a: "x" }, { a: "x", c: false }],
    invalid: [{ c: true }],
    parsed: [[{ a: "x", b: 1 }, { a: "x" }]],
  },
  PartialT: { valid: [{}, { a: "x" }, { a: "x", b: 1, c: true }], invalid: [{ a: 1 }, { b: "1" }, null] },
  RequiredT: {
    valid: [{ a: "x", b: 1, c: true }],
    invalid: [
      { a: "x", b: 1 },
      { a: "x", b: 1, c: undefined },
    ],
  },
  ExcludeT: {
    valid: [shapes.square, shapes.rect],
    invalid: [shapes.circle, { kind: "square" }],
  },
  ExcludeLit: { valid: ["a", "c"], invalid: ["b", "d"] },
  KeyofT: { valid: ["a", "b", "c"], invalid: ["d", "toString", 0] },
  IndexedAccess: { valid: ["circle", "square", "rect"], invalid: ["triangle"] },

  // Generics
  BoxString: { valid: [{ value: "x" }], invalid: [{ value: 1 }, {}] },
  BoxBox: { valid: [{ value: { value: 1 } }], invalid: [at(["value", "value"], { value: { value: "1" } })] },
  // #391
  PairDefault: { valid: [{ first: 1, second: "x" }], invalid: [at(["second"], { first: 1, second: 2 })] },
  PairExplicit: { valid: [{ first: 1, second: true }], invalid: [at(["second"], { first: 1, second: "x" })] },
  ListOfDefault: {
    valid: [
      { item: 1, items: [] },
      { item: 1, items: [2, 3] },
    ],
    invalid: [at(["items", "[0]"], { item: 1, items: ["x"] }), { item: 1, items: 1 }],
  },
  WithDefault: { valid: [{ a: true, b: [false] }], invalid: [at(["b", "[0]"], { a: true, b: [1] })] },
  GenericRecursive: {
    valid: [{ value: "x", children: [{ value: "y", children: [] }] }],
    invalid: [at(["children", "[0]", "value"], { value: "x", children: [{ value: 1, children: [] }] })],
  },

  // Recursion
  LinkedList: {
    // a missing `next` is undefined, which `null` accepts
    valid: [{ value: 1, next: null }, { value: 1 }, deepList(3), deepList(DEPTH)],
    invalid: [
      { next: null },
      at(["next", "next", "value"], { value: 1, next: { value: 2, next: { value: "3", next: null } } }),
    ],
    parsed: [[deepList(DEPTH), deepList(DEPTH)]],
  },
  Tree: {
    valid: [{ name: "a", children: [] }, deepTree(DEPTH)],
    invalid: [{ name: "a" }, at(["children", "[0]", "children", "[0]", "name"], deepTree(2, 1))],
    parsed: [
      [
        { name: "a", x: 1, children: [{ name: "b", children: [], y: 2 }] },
        { name: "a", children: [{ name: "b", children: [] }] },
      ],
    ],
  },
  Json: {
    valid: [null, undefined, 1, "a", true, [], {}, { a: [1, { b: null }] }, deepArray(DEPTH, 1)],
    invalid: [1n, [1n], { a: [1n] }, at(["a", "[0]", "b"], { a: [{ b: 1n }] })],
    parsed: [[{ a: [1, { b: null }] }, { a: [1, { b: null }] }]],
  },
  Expr: {
    valid: [
      { op: "num", value: 1 },
      { op: "add", left: { op: "num", value: 1 }, right: { op: "neg", arg: { op: "num", value: 2 } } },
    ],
    invalid: [
      { op: "add", left: { op: "num", value: 1 } },
      { op: "neg", arg: { op: "num", value: "2" } },
      { op: "mul", value: 1 },
    ],
  },
  MutualA: {
    valid: [{ tag: "a" }, { tag: "a", b: { tag: "b", a: { tag: "a" } } }],
    invalid: [
      { tag: "b" },
      at(["b", "tag"], { tag: "a", b: { tag: "a" } }),
      { tag: "a", b: { tag: "b", a: { tag: "b" } } },
    ],
  },
  RecursiveFirst: {
    valid: ["a", [], ["a", ["b", []]], deepArray(100, "x")],
    invalid: [1, [1], ["a", [1]], deepArray(50, 1)],
  },
  RecursiveMiddle: {
    valid: [1, null, { child: 1 }, { child: { child: null } }, {}],
    invalid: ["a", { child: "a" }, { child: { child: "a" } }],
    parsed: [[{ child: { child: 1, x: 1 } }, { child: { child: 1 } }]],
  },
  RecursiveLast: {
    valid: ["a", 1, [], ["a", [1, ["b"]]], deepArray(DEPTH, 1)],
    invalid: [null, true, [null], ["a", [true]]],
  },
  RecursiveInTuple: {
    // a missing last item is undefined, which `null` accepts
    valid: [[1, null], [1, [2, null]], [1], [1, [2]]],
    invalid: [[], [1, ["2", null]], [1, null, 3], ["1", null]],
  },

  // Template literals
  // #384 (anchoring), #400 (number forms, line breaks)
  TplPrefix: { valid: ["a", "abc", "a\nb"], invalid: ["", "ba", "A", 1] },
  TplNumber: {
    valid: ["0", "1", "-1", "1.5", "1e3", "-1.5e-3", ".5"],
    invalid: ["", "a", "1a", "a1", " 1x", "1 2", 1],
  },
  TplVersion: {
    valid: ["1.2.3", "10.0.0", "-1.2.3"],
    invalid: ["1.2", "1.2.3x", "x1.2.3", "a.b.c", "1.2.3.4.x"],
  },
  TplSize: { valid: ["1x2", "10x20", "1.5x2"], invalid: ["1x", "x2", "1x2x", "1y2", "1x2 "] },
  TplLitUnion: { valid: ["a-1", "b-2", "a--1"], invalid: ["c-1", "a-", "a-x", "xa-1", "a-1x"] },
  TplBoolean: { valid: ["true", "false"], invalid: ["True", "1", "truex", "xtrue", true] },
  TplString: { valid: ["", "a", "a\nb", "\r\n"], invalid: [1, null] },
  TplEnum: { valid: ["red", "green"], invalid: ["blue", "Red", "redx"] },

  // Formats
  UserId: { valid: ["user_1"], invalid: ["usr_1", "", 1, null] },
  AdminId: { valid: ["user_admin_1"], invalid: ["user_1", "admin_user_admin_", 1] },
  NonNegative: { valid: [0, 1, 2.5], invalid: [-1, "1", null] },
  Rate: { valid: [0, 0.5, 1], invalid: [-0.5, 1.5, "0.5"] },
  FormatsInObject: {
    valid: [{ id: "user_1", rate: 0.5 }],
    invalid: [at(["id"], { id: "x", rate: 0.5 }), at(["rate"], { id: "user_1", rate: 2 })],
  },

  // Built-in classes
  MapT: {
    valid: [new Map(), new Map([["a", 1]])],
    invalid: [{}, { a: 1 }, new Map([[1, 1]]), new Map([["a", "1"]]), new Set()],
    parsed: [[new Map([["a", 1]]), new Map([["a", 1]])]],
  },
  SetT: {
    valid: [new Set(), new Set(["a", "b"])],
    invalid: [[], ["a"], new Set([1]), new Map()],
    parsed: [[new Set(["a"]), new Set(["a"])]],
  },
  MapInObject: {
    valid: [{ m: new Map([["a", new Date(0)]]) }],
    invalid: [{ m: new Map([["a", "2024"]]) }, { m: {} }],
    parsed: [[{ m: new Map([["a", new Date(0)]]), x: 1 }, { m: new Map([["a", new Date(0)]]) }]],
  },
  Uint8ArrayT: {
    valid: [new Uint8Array([1, 2])],
    invalid: [[1, 2], new Int8Array(1), new Uint16Array(1), null],
  },
  Int32ArrayT: { valid: [new Int32Array(2)], invalid: [new Uint32Array(2), [1]] },
  Float64ArrayT: { valid: [new Float64Array(2)], invalid: [new Float32Array(2), [1.5]] },
  BigInt64ArrayT: { valid: [new BigInt64Array(2)], invalid: [new BigUint64Array(2), [1n]] },
  DateInObject: {
    valid: [{ at: new Date(0), big: 1n }],
    invalid: [at(["at"], { at: "2024", big: 1n }), at(["big"], { at: new Date(0), big: 1 })],
    parsed: [
      [
        { at: new Date(0), big: 1n, x: 1 },
        { at: new Date(0), big: 1n },
      ],
    ],
  },
};

// Deterministic PRNG (mulberry32) so randomized checks are reproducible.
const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const SCALARS: unknown[] = [
  null,
  undefined,
  0,
  -1,
  1.5,
  NaN,
  "",
  "a",
  "x_1",
  "1",
  "true",
  true,
  false,
  1n,
  [],
  {},
  new Date(0),
  new Map(),
  new Set(),
];

// Returns a randomly mutated copy of `value`: some node replaced, removed or given an extra key.
const mutate = (value: unknown, rand: () => number, depth = 0): unknown => {
  const pick = <T>(xs: T[]): T => xs[Math.floor(rand() * xs.length)]!;
  if (depth > 8 || rand() < 0.25) {
    return pick(SCALARS);
  }
  if (Array.isArray(value)) {
    const copy = [...value];
    const r = rand();
    if (copy.length > 0 && r < 0.6) {
      const i = Math.floor(rand() * copy.length);
      copy[i] = mutate(copy[i], rand, depth + 1);
    } else if (r < 0.8) {
      copy.push(pick(SCALARS));
    } else {
      copy.pop();
    }
    return copy;
  }
  if (typeof value === "object" && value != null && Object.getPrototypeOf(value) === Object.prototype) {
    const copy: Record<string, unknown> = { ...value };
    const keys = Object.keys(copy);
    const r = rand();
    if (keys.length > 0 && r < 0.6) {
      const k = pick(keys);
      copy[k] = mutate(copy[k], rand, depth + 1);
    } else if (keys.length > 0 && r < 0.8) {
      delete copy[pick(keys)];
    } else {
      copy[pick(["extra", "x_9", "1", "kind", "a"])] = pick(SCALARS);
    }
    return copy;
  }
  return pick(SCALARS);
};

const isPlainSample = (x: unknown): boolean => !isAt(x);

export const defineBehaviorSuite = (Codecs: Codecs, namePrefix: string) => {
  const codecOf = (name: string) => (Codecs as Record<string, BeffParser<any>>)[name]!;

  describe("valid and invalid inputs", () => {
    for (const [name, c] of Object.entries(cases) as [string, Case][]) {
      describe(name, () => {
        const codec = codecOf(name);
        for (const v of c.valid ?? []) {
          it(`accepts ${label(v)}`, () => expectValid(codec, v));
        }
        for (const v of c.invalid ?? []) {
          it(`rejects ${label(v)}`, () => expectInvalid(codec, v));
        }
        for (const [input, output] of c.parsed ?? []) {
          it(`parses ${label(input)}`, () => {
            expect(codec.parse(input)).toEqual(output);
            const res = codec.safeParse(input);
            expect(res.success && res.data).toEqual(output);
          });
        }
        for (const v of c.strictValid ?? []) {
          it(`accepts ${label(v)} with disallowExtraProperties`, () => expectValid(codec, v, strict));
        }
        for (const v of c.strictInvalid ?? []) {
          it(`rejects ${label(v)} with disallowExtraProperties`, () => expectInvalid(codec, v, strict));
        }
        for (const bug of c.bugs ?? []) {
          it.fails(`#${bug.issue}: ${bug.expect} ${label(bug.value)}`, () => {
            if (bug.expect === "invalid") expectInvalid(codec, bug.value);
            else expectValid(codec, bug.value, bug.expect === "strictValid" ? strict : undefined);
          });
        }
        for (const bug of c.bugParsed ?? []) {
          it.fails(`#${bug.issue}: parses ${label(bug.input)}`, () => {
            expect(codec.parse(bug.input)).toEqual(bug.output);
          });
        }
      });
    }
  });

  describe("parse output", () => {
    it("keeps input key order by default and sorts with objectKeyOrder: sorted", () => {
      const input = { list: [{ id: "a", z: 1 }], inner: { deep: { value: 1 } } };
      expect(Object.keys(Codecs.Nested.parse(input))).toEqual(["list", "inner"]);
      expect(Object.keys(Codecs.Nested.parse(input, { objectKeyOrder: "input" }))).toEqual(["list", "inner"]);
      const sorted = Codecs.Nested.parse(input, { objectKeyOrder: "sorted" });
      expect(Object.keys(sorted)).toEqual(["inner", "list"]);

      const reversed = Object.fromEntries(Object.entries(f20).reverse());
      expect(Object.keys(Codecs.ManyFields.parse(reversed))).toEqual(Object.keys(reversed));
      expect(Object.keys(Codecs.ManyFields.parse(reversed, { objectKeyOrder: "sorted" }))).toEqual(
        Object.keys(f20),
      );
    });

    it("sorts nested objects, records and union members", () => {
      const rec = Codecs.StringRecord.parse(
        { b: 1, a: 2, toString: 3, constructor: 4 },
        { objectKeyOrder: "sorted" },
      );
      expect(Object.keys(rec)).toEqual(["a", "b", "constructor", "toString"]);
      const nested = Codecs.Nested.parse(
        { inner: { deep: { value: 1 } }, list: [] },
        { objectKeyOrder: "sorted" },
      );
      expect(nested).toEqual({ inner: { deep: { value: 1 } }, list: [] });
      const shape = Codecs.Shape.parse({ w: 1, kind: "rect", h: 2 }, { objectKeyOrder: "sorted" });
      expect(Object.keys(shape)).toEqual(["h", "kind", "w"]);
      const inter = Codecs.Intersection.parse({ b: 1, a: "x" }, { objectKeyOrder: "sorted" });
      expect(Object.keys(inter)).toEqual(["a", "b"]);
    });

    // #377, #380
    it("keeps Object.prototype-named keys of records as own data", () => {
      const out = Codecs.StringRecord.parse(protoKeys);
      expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
      expect(Object.keys(out).sort()).toEqual(["__proto__", "constructor", "hasOwnProperty", "toString"]);
      expect(Object.getOwnPropertyDescriptor(out, "__proto__")?.value).toBe(1);
      const sorted = Codecs.StringRecord.parse(protoKeys, { objectKeyOrder: "sorted" });
      expect(Object.getPrototypeOf(sorted)).toBe(Object.prototype);
      expect(Object.keys(sorted)).toEqual(["__proto__", "constructor", "hasOwnProperty", "toString"]);
    });

    it("returns a new object and does not mutate the input", () => {
      const input = { a: "x", b: 1, c: 2 };
      const out = Codecs.Intersection.parse(input);
      expect(out).not.toBe(input);
      expect(input).toEqual({ a: "x", b: 1, c: 2 });
    });

    it("keeps typed arrays, Dates and bigints", () => {
      const arr = new Uint8Array([1, 2, 3]);
      expect(Codecs.Uint8ArrayT.parse(arr)).toEqual(arr);
      expect(Codecs.Uint8ArrayT.parse(arr)).toBeInstanceOf(Uint8Array);
      expect(Codecs.DateT.parse(new Date(7))).toBeInstanceOf(Date);
      expect(Codecs.BigInt.parse(10n ** 30n)).toBe(10n ** 30n);
      const map: any = Codecs.MapOrSetUnion.parse(new Map([["a", 1]]));
      expect(map).toBeInstanceOf(Map);
      const set: any = Codecs.MapOrSetUnion.parse(new Set(["a"]));
      expect(set).toBeInstanceOf(Set);
    });
  });

  describe("errors", () => {
    it("reports an error for every invalid property", () => {
      const res = Codecs.ManyFields.safeParse({ ...f20, f01: 1, f02: "x" });
      expect(res.success).toBe(false);
      if (res.success) return;
      expect(res.errors.map((e) => e.path)).toEqual([["f01"], ["f02"]]);
    });

    it("points into deep recursive inputs", () => {
      const res = Codecs.LinkedList.safeParse(deepList(1000, "end"));
      expect(res.success).toBe(false);
      if (res.success) return;
      expect(res.errors.length).toBeGreaterThanOrEqual(1);
      expect(res.errors[0]!.path.length).toBeGreaterThanOrEqual(1000);
      expect(res.errors[0]!.path.slice(0, 4)).toEqual(["next", "next", "next", "next"]);
    });

    it("rejects a deep invalid leaf of a recursive tree", () => {
      expectInvalid(Codecs.Tree, deepTree(1000, 1));
      expectInvalid(Codecs.Json, deepArray(100, 1n));
    });
  });

  describe("b runtime API", () => {
    const Person = createNamedType(
      `${namePrefix}Person`,
      b.Object({ name: b.String(), age: b.Number(), tags: b.Array(b.String()) }),
    );
    const Node = createNamedType(`${namePrefix}Node`, b.Unknown());
    overrideNamedType(
      `${namePrefix}Node`,
      b.Object({ value: b.Number(), next: buntyped.Union(Node, b.Null()) }),
    );

    const runtimeCases: [string, BeffParser<any>, unknown[], unknown[]][] = [
      ["b.String", b.String(), ["", "a"], [1, null]],
      ["b.Number", b.Number(), [0, 1.5], ["1", null]],
      ["b.Boolean", b.Boolean(), [true, false], [0, "true"]],
      ["b.Null", b.Null(), [null, undefined], [0, ""]],
      ["b.Undefined", b.Undefined(), [undefined, null], [0, ""]],
      ["b.Void", b.Void(), [undefined, null], [0, ""]],
      ["b.Any", b.Any(), [undefined, 1, {}], []],
      ["b.Unknown", b.Unknown(), [undefined, 1, {}], []],
      ["b.Const string", b.Const("x"), ["x"], ["y", 1]],
      ["b.Const number", b.Const(1), [1], [2, "1"]],
      ["b.Const boolean", b.Const(true), [true], [false]],
      ["b.Date", b.Date(), [new Date(0)], ["2024", 0]],
      ["b.Array", b.Array(b.Number()), [[], [1, 2]], [["1"], {}, null]],
      ["b.ReadOnlyArray", b.ReadOnlyArray(b.String()), [["a"]], [[1]]],
      ["b.Uint8Array", b.Uint8Array(), [new Uint8Array(1)], [new Int8Array(1), [1]]],
      ["b.Uint8ClampedArray", b.Uint8ClampedArray(), [new Uint8ClampedArray(1)], [new Uint8Array(1)]],
      ["b.Uint16Array", b.Uint16Array(), [new Uint16Array(1)], [new Int16Array(1)]],
      ["b.Uint32Array", b.Uint32Array(), [new Uint32Array(1)], [new Int32Array(1)]],
      ["b.Int8Array", b.Int8Array(), [new Int8Array(1)], [new Uint8Array(1)]],
      ["b.Int16Array", b.Int16Array(), [new Int16Array(1)], [new Uint16Array(1)]],
      ["b.Int32Array", b.Int32Array(), [new Int32Array(1)], [new Uint32Array(1)]],
      ["b.Float32Array", b.Float32Array(), [new Float32Array(1)], [new Float64Array(1)]],
      ["b.Float64Array", b.Float64Array(), [new Float64Array(1)], [new Float32Array(1)]],
      ["b.BigInt64Array", b.BigInt64Array(), [new BigInt64Array(1)], [new BigUint64Array(1)]],
      ["b.BigUint64Array", b.BigUint64Array(), [new BigUint64Array(1)], [new BigInt64Array(1)]],
      ["buntyped.Union", buntyped.Union(b.String(), b.Number()), ["a", 1], [true, null]],
      [
        "b.Object",
        b.Object({ a: b.String(), n: b.Object({ x: b.Number() }) }),
        [{ a: "x", n: { x: 1 } }],
        [{ a: "x" }, { a: "x", n: { x: "1" } }],
      ],
      [
        "createNamedType",
        Person,
        [{ name: "a", age: 1, tags: [] }],
        [
          { name: "a", age: "1", tags: [] },
          { name: "a", age: 1 },
        ],
      ],
      [
        "overrideNamedType (recursive)",
        Node,
        [{ value: 1, next: null }, { value: 1 }, deepList(DEPTH)],
        [{ next: null }, { value: 1, next: { value: "2", next: null } }],
      ],
    ];
    for (const [name, codec, valid, invalid] of runtimeCases) {
      describe(name, () => {
        for (const v of valid) it(`accepts ${label(v)}`, () => expectValid(codec, v));
        for (const v of invalid) it(`rejects ${label(v)}`, () => expectInvalid(codec, v));
      });
    }

    it("parse strips extra keys and respects disallowExtraProperties", () => {
      expect(Person.parse({ name: "a", age: 1, tags: ["t"], extra: 1 })).toEqual({
        name: "a",
        age: 1,
        tags: ["t"],
      });
      expectInvalid(Person, at(["extra"], { name: "a", age: 1, tags: [], extra: 1 }), strict);
      expect(Node.parse({ value: 1, next: { value: 2, next: null, x: 1 } })).toEqual({
        value: 1,
        next: { value: 2, next: null },
      });
    });

    it("createNamedType rejects duplicate names and overrideNamedType rejects unknown names", () => {
      expect(() => createNamedType(`${namePrefix}Person`, b.String())).toThrow();
      expect(() => overrideNamedType(`${namePrefix}DoesNotExist`, b.String())).toThrow();
    });
  });

  describe("randomized consistency", () => {
    it("validate agrees with safeParse, and parse is stable, on mutated inputs", () => {
      const rand = rng(433);
      let accepted = 0;
      let rejected = 0;
      for (const [name, c] of Object.entries(cases) as [string, Case][]) {
        const codec = codecOf(name);
        const seeds = [...(c.valid ?? []), ...(c.invalid ?? []).filter(isPlainSample)].filter(
          // deep inputs are covered elsewhere and make mutation slow
          (x) => label(x).length < 60,
        );
        for (let i = 0; i < 40; i++) {
          const input =
            seeds.length > 0 && rand() < 0.85
              ? mutate(seeds[Math.floor(rand() * seeds.length)], rand)
              : mutate(undefined, rand);
          for (const options of [undefined, strict]) {
            const ok = codec.validate(input, options);
            const res = codec.safeParse(input, options);
            if (res.success !== ok) {
              throw new Error(
                `${name}: validate=${ok} but safeParse.success=${res.success} for ${label(input)}`,
              );
            }
            if (res.success) {
              const again = codec.safeParse(res.data, options);
              expect(again.success).toBe(true);
              expect(again.success && again.data).toEqual(res.data);
              expect(codec.parse(input, options)).toEqual(res.data);
              accepted++;
            } else {
              expect(res.errors.length).toBeGreaterThanOrEqual(1);
              rejected++;
            }
          }
        }
      }
      // the mutations must exercise both outcomes
      expect(accepted).toBeGreaterThan(500);
      expect(rejected).toBeGreaterThan(500);
    });
  });
};
