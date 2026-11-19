import { describe, expect, it } from "vitest";
import {
  AllOfRuntype,
  AnyOfRuntype,
  ArrayRuntype,
  BaseRefRuntype,
  buildParserFromRuntype,
  ConstRuntype,
  NullishRuntype,
  ObjectRuntype,
  RegexRuntype,
  Runtype,
  TypeofRuntype,
} from "../src/codegen-v2.js";

const named: Record<string, Runtype> = {};
class Ref extends BaseRefRuntype {
  getNamedRuntypes(): Record<string, Runtype> {
    return named;
  }
}

const str = new TypeofRuntype(undefined, "string");
const num = new TypeofRuntype(undefined, "number");
const nul = new NullishRuntype(undefined, "null");

// type List = { name: string; tags: string[]; next: List | null }
named.List = new ObjectRuntype(
  undefined,
  {
    name: str,
    tags: new ArrayRuntype(undefined, str),
    next: new AnyOfRuntype(undefined, [nul, new Ref(undefined, "List")]),
  },
  [],
);
const List = buildParserFromRuntype(new Ref(undefined, "List"), "List", false);

// type Tree = { v: number; a: Tree | null; b: Tree | null }
named.Tree = new ObjectRuntype(
  undefined,
  {
    v: num,
    a: new AnyOfRuntype(undefined, [nul, new Ref(undefined, "Tree")]),
    b: new AnyOfRuntype(undefined, [nul, new Ref(undefined, "Tree")]),
  },
  [],
);
const Tree = buildParserFromRuntype(new Ref(undefined, "Tree"), "Tree", false);

// type Node = { kind: "a"; child: Node | null } | { kind: "b"; child: Node | null; n: number }
const nodeChild = new AnyOfRuntype(undefined, [nul, new Ref(undefined, "Node")]);
named.Node = new AnyOfRuntype(undefined, [
  new ObjectRuntype(undefined, { kind: new ConstRuntype(undefined, "a"), child: nodeChild }, []),
  new ObjectRuntype(undefined, { kind: new ConstRuntype(undefined, "b"), child: nodeChild, n: num }, []),
]);
const Node = buildParserFromRuntype(new Ref(undefined, "Node"), "Node", false);

// type Dict = { [k: string]: Dict | number }
named.Dict = new ObjectRuntype(undefined, {}, [
  { key: str, value: new AnyOfRuntype(undefined, [num, new Ref(undefined, "Dict")]) },
]);
const Dict = buildParserFromRuntype(new Ref(undefined, "Dict"), "Dict", false);

// type Inter = { a: string } & { [k: `x${string}`]: number } & { next: Inter | null }
named.Inter = new AllOfRuntype(undefined, [
  new ObjectRuntype(undefined, { a: str }, []),
  new ObjectRuntype(undefined, {}, [
    { key: new RegexRuntype(undefined, /^(x.*)$/, "`x${string}`"), value: num },
  ]),
  new ObjectRuntype(undefined, { next: new AnyOfRuntype(undefined, [nul, new Ref(undefined, "Inter")]) }, []),
]);
const Inter = buildParserFromRuntype(new Ref(undefined, "Inter"), "Inter", false);

// type Dup = { x: string } | { x: string; y: string }
const Dup = buildParserFromRuntype(
  new AnyOfRuntype(undefined, [
    new ObjectRuntype(undefined, { x: str }, []),
    new ObjectRuntype(undefined, { x: str, y: str }, []),
  ]),
  "Dup",
  false,
);

const list = (depth: number, last: unknown): unknown => {
  let acc = last;
  for (let i = depth - 1; i >= 0; i--) {
    acc = { name: `n${i}`, tags: ["t"], next: acc };
  }
  return acc;
};

describe("error reporting on recursive types", () => {
  it("reports an invalid value deep in a list", () => {
    const input = list(4, 12345);
    expect(List.safeParse(input)).toEqual({
      success: false,
      errors: [
        {
          path: ["next", "next", "next", "next"],
          received: 12345,
          errors: [
            { message: "expected nullish value", path: [], received: 12345 },
            { message: "expected object", path: [], received: 12345 },
          ],
          isUnionError: true,
        },
      ],
    });
    expect(() => List.parse(input)).toThrowError(
      "Failed to parse List - (next.next.next.next) Failed to decode one of (expected nullish value | expected object), received: 12345",
    );
  });

  it("reports many errors in one list item", () => {
    const input = list(2, { name: 1, tags: ["a", 2], next: { name: "x", tags: [], next: "bad" } });
    expect(List.safeParse(input)).toEqual({
      success: false,
      errors: [
        {
          path: ["next", "next"],
          received: { name: 1, tags: ["a", 2], next: { name: "x", tags: [], next: "bad" } },
          errors: [
            { message: "expected string", path: ["name"], received: 1 },
            { message: "expected string", path: ["tags", "[1]"], received: 2 },
            {
              path: ["next", "next"],
              received: "bad",
              errors: [
                { message: "expected nullish value", path: [], received: "bad" },
                { message: "expected object", path: [], received: "bad" },
              ],
              isUnionError: true,
            },
          ],
          isUnionError: true,
        },
      ],
    });
    expect(() => List.parse(input)).toThrowError(
      'Failed to parse List - (next.next) Failed to decode one of ((name) expected string | (tags[1]) expected string | (next.next) Failed to decode one of (expected nullish value | expected object), received: "bad"), received: Object',
    );
  });

  it("keeps the first 10 errors", () => {
    const input = list(3, { name: "x", tags: Array.from({ length: 15 }, (_, i) => i), next: null });
    expect(List.safeParse(input)).toEqual({
      success: false,
      errors: [
        {
          path: ["next", "next", "next"],
          received: { name: "x", tags: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], next: null },
          errors: [
            { message: "expected string", path: ["tags", "[0]"], received: 0 },
            { message: "expected string", path: ["tags", "[1]"], received: 1 },
            { message: "expected string", path: ["tags", "[2]"], received: 2 },
            { message: "expected string", path: ["tags", "[3]"], received: 3 },
            { message: "expected string", path: ["tags", "[4]"], received: 4 },
            { message: "expected string", path: ["tags", "[5]"], received: 5 },
            { message: "expected string", path: ["tags", "[6]"], received: 6 },
            { message: "expected string", path: ["tags", "[7]"], received: 7 },
            { message: "expected string", path: ["tags", "[8]"], received: 8 },
            { message: "expected string", path: ["tags", "[9]"], received: 9 },
            { message: "expected string", path: ["tags", "[10]"], received: 10 },
            { message: "expected string", path: ["tags", "[11]"], received: 11 },
            { message: "expected string", path: ["tags", "[12]"], received: 12 },
            { message: "expected string", path: ["tags", "[13]"], received: 13 },
            { message: "expected string", path: ["tags", "[14]"], received: 14 },
          ],
          isUnionError: true,
        },
      ],
    });
  });

  it("reports extra properties deep in a list", () => {
    const input = list(3, { name: "x", tags: [], next: null, extra: 1 });
    expect(List.safeParse(input, { disallowExtraProperties: true })).toEqual({
      success: false,
      errors: [{ message: "extra property", path: ["next", "next", "next", "extra"], received: 1 }],
    });
    expect(List.safeParse(input).success).toBe(true);
  });

  it("reports errors in both branches of a tree", () => {
    const input = {
      v: 1,
      a: { v: 2, a: null, b: { v: "x", a: null, b: 7 } },
      b: { v: 3, a: { v: 4, a: [], b: null }, b: null },
    };
    expect(Tree.safeParse(input)).toEqual({
      success: false,
      errors: [
        {
          path: ["a", "b"],
          received: { v: "x", a: null, b: 7 },
          errors: [
            { message: "expected number", path: ["v"], received: "x" },
            {
              path: ["b"],
              received: 7,
              errors: [
                { message: "expected nullish value", path: [], received: 7 },
                { message: "expected object", path: [], received: 7 },
              ],
              isUnionError: true,
            },
          ],
          isUnionError: true,
        },
        {
          path: ["b", "a", "a"],
          received: [],
          errors: [
            { message: "expected nullish value", path: [], received: [] },
            { message: "expected object", path: [], received: [] },
          ],
          isUnionError: true,
        },
      ],
    });
    expect(() => Tree.parse(input)).toThrowError(
      "Failed to parse Tree - #0 (a.b) Failed to decode one of ((v) expected number | (b) Failed to decode one of (expected nullish value | expected object), received: 7), received: Object | #1 (b.a.a) Failed to decode one of (expected nullish value | expected object), received: Array",
    );
  });

  it("reports unions of objects that share a recursive child", () => {
    const input = {
      kind: "a",
      child: { kind: "b", n: 1, child: { kind: "c", child: { kind: "a", child: 5 } } },
    };
    expect(Node.safeParse(input)).toEqual({
      success: false,
      errors: [
        {
          path: [],
          received: {
            kind: "a",
            child: { kind: "b", n: 1, child: { kind: "c", child: { kind: "a", child: 5 } } },
          },
          errors: [
            {
              path: ["child"],
              received: { kind: "b", n: 1, child: { kind: "c", child: { kind: "a", child: 5 } } },
              errors: [
                { message: 'expected "a"', path: ["kind"], received: "b" },
                {
                  path: ["child"],
                  received: { kind: "c", child: { kind: "a", child: 5 } },
                  errors: [
                    { message: 'expected "a"', path: ["kind"], received: "c" },
                    {
                      path: ["child"],
                      received: { kind: "a", child: 5 },
                      errors: [
                        {
                          path: ["child"],
                          received: 5,
                          errors: [
                            { message: "expected nullish value", path: [], received: 5 },
                            { message: "expected object", path: [], received: 5 },
                          ],
                          isUnionError: true,
                        },
                        { message: 'expected "b"', path: ["kind"], received: "a" },
                        { message: "expected number", path: ["n"] },
                      ],
                      isUnionError: true,
                    },
                    { message: 'expected "b"', path: ["kind"], received: "c" },
                    { message: "expected number", path: ["n"] },
                  ],
                  isUnionError: true,
                },
              ],
              isUnionError: true,
            },
            { message: 'expected "b"', path: ["kind"], received: "a" },
            { message: "expected number", path: ["n"] },
          ],
          isUnionError: true,
        },
      ],
    });
    expect(() => Node.parse(input)).toThrowError(
      'Failed to parse Node - Failed to decode one of ((child) Failed to decode one of ((kind) expected "a" | (child) Failed to decode one of ((kind) expected "a" | (child) Failed to decode one of ((child) Failed to decode one of (expected nullish value | expected object), received: 5 | (kind) expected "b" | (n) expected number), received: Object | (kind) expected "b" | (n) expected number), received: Object), received: Object | (kind) expected "b" | (n) expected number), received: Object',
    );
  });

  it("reports errors in a recursive record", () => {
    const input = { a: 1, b: { c: { d: "x", e: 2 } }, f: { g: null } };
    expect(Dict.safeParse(input)).toEqual({
      success: false,
      errors: [
        {
          path: ["b", "c", "d"],
          received: "x",
          errors: [
            { message: "expected number", path: [], received: "x" },
            { message: "expected object", path: [], received: "x" },
          ],
          isUnionError: true,
        },
        {
          path: ["f", "g"],
          received: null,
          errors: [
            { message: "expected number", path: [], received: null },
            { message: "expected object", path: [], received: null },
          ],
          isUnionError: true,
        },
      ],
    });
    expect(() => Dict.parse(input)).toThrowError(
      'Failed to parse Dict - #0 (b.c.d) Failed to decode one of (expected number | expected object), received: "x" | #1 (f.g) Failed to decode one of (expected number | expected object), received: null',
    );
  });

  it("deduplicates equal errors of union branches", () => {
    expect(Dup.safeParse({ x: 1 })).toEqual({
      success: false,
      errors: [
        {
          path: [],
          received: { x: 1 },
          errors: [
            { message: "expected string", path: ["x"], received: 1 },
            { message: "expected string", path: ["y"] },
          ],
          isUnionError: true,
        },
      ],
    });
    expect(() => Dup.parse({ x: 1 })).toThrowError(
      "Failed to parse Dup - Failed to decode one of ((x) expected string | (y) expected string), received: Object",
    );
  });

  it("reports errors in a recursive intersection", () => {
    const input = { a: "x", next: { a: "y", x1: 1, next: { a: 2, x2: "s", extra: true, next: null } } };
    expect(Inter.safeParse(input)).toEqual({
      success: false,
      errors: [
        {
          path: ["next", "next"],
          received: { a: 2, x2: "s", extra: true, next: null },
          errors: [
            { message: "expected string", path: ["a"], received: 2 },
            { message: "expected number", path: ["x2"], received: "s" },
          ],
          isUnionError: true,
        },
      ],
    });
    expect(Inter.safeParse(input, { disallowExtraProperties: true })).toEqual({
      success: false,
      errors: [
        {
          path: ["next", "next"],
          received: { a: 2, x2: "s", extra: true, next: null },
          errors: [
            { message: "expected string", path: ["a"], received: 2 },
            { message: "expected number", path: ["x2"], received: "s" },
          ],
          isUnionError: true,
        },
      ],
    });
    expect(() => Inter.parse(input, { disallowExtraProperties: true })).toThrowError(
      "Failed to parse Inter - (next.next) Failed to decode one of ((a) expected string | (x2) expected number), received: Object",
    );
  });
});
