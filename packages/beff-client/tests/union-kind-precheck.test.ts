import { describe, expect, it } from "vitest";
import { b, buntyped, createNamedType, overrideNamedType } from "../src/index.js";

// A linked list `{ value: number; next: Node | <other> }` in different union orders.
const makeList = (name: string, branches: (node: any) => any[]) => {
  const Node = createNamedType(name, b.Unknown());
  overrideNamedType(name, b.Object({ value: b.Number(), next: buntyped.Union(...branches(Node)) }));
  return Node;
};

const chain = (depth: number, end: unknown) => {
  let node: any = { value: 0, next: end };
  for (let i = 1; i < depth; i++) node = { value: i, next: node };
  return node;
};

describe("union parse with kind pre-check", () => {
  const lists = [
    makeList("NodeNullLast", (n) => [n, b.Null()]),
    makeList("NodeNullFirst", (n) => [b.Null(), n]),
    makeList("NodeStringFirst", (n) => [b.String(), n]),
  ];

  it("parses recursive unions in any branch order", () => {
    for (const List of lists) {
      const end = List.name === "NodeStringFirst" ? "end" : null;
      const input = chain(50, end);
      expect(List.validate(input)).toBe(true);
      expect(List.parse(input)).toEqual(input);
    }
  });

  it("still merges and strips when several object branches match", () => {
    const U = buntyped.Union(b.Object({ a: b.String() }), b.Object({ b: b.Number() }));
    expect(U.parse({ a: "x", b: 1, c: true })).toEqual({ a: "x", b: 1 });
  });

  it("keeps the single matching primitive branch", () => {
    const U = buntyped.Union(b.String(), b.Number(), b.Null());
    expect(U.parse("x")).toBe("x");
    expect(U.parse(1)).toBe(1);
    expect(U.parse(null)).toBe(null);
  });

  it("follows a named type that is overridden after the first parse", () => {
    const T = createNamedType("KindPrecheckOverridden", b.String());
    const U = buntyped.Union(T, b.Null());
    expect(U.parse("x")).toBe("x");
    overrideNamedType("KindPrecheckOverridden", b.Object({ a: b.Number() }));
    expect(U.parse({ a: 1, b: 2 })).toEqual({ a: 1 });
  });

  it("keeps Date branches for objects", () => {
    const U = buntyped.Union(b.Date(), b.Object({ a: b.Number() }), b.Null());
    const d = new Date(0);
    expect(U.parse(d)).toBe(d);
    expect(U.parse({ a: 1 })).toEqual({ a: 1 });
  });
});
