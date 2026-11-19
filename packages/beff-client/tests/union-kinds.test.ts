import { describe, expect, it } from "vitest";
import { b, buntyped, createNamedType, overrideNamedType } from "../src/index.js";
import {
  AnyOfConstsRuntype,
  AnyOfRuntype,
  buildParserFromRuntype,
  ConstRuntype,
  DateRuntype,
  NullishRuntype,
  ObjectRuntype,
  TypeofRuntype,
  type Runtype,
} from "../src/codegen-v2.js";

const str = new TypeofRuntype(undefined, "string");
const num = new TypeofRuntype(undefined, "number");
const nul = new NullishRuntype(undefined, "null");

const runtypeOf = (parser: unknown): Runtype => (parser as { _runtype: Runtype })._runtype;

// Makes a copy of a runtype that counts the calls to its validate().
const counted = (inner: Runtype): { runtype: Runtype; calls: () => number } => {
  let calls = 0;
  const runtype: Runtype = Object.create(inner);
  runtype.validate = (ctx, input) => {
    calls++;
    return inner.validate(ctx, input);
  };
  return { runtype, calls: () => calls };
};

// Builds a linked list type: `type Node = { value: number; next: Node | other }`.
// `otherKind` is the kind of value that `other` accepts (see `VALUE_KINDS` in codegen-v2.ts).
// `nodeFirst` sets the order of the two members of the union.
// `withKinds: true` gives the union a kind table, as the compiler does. `false` gives no table.
// Returns the parser of Node and the number of validate() calls on Node.
let listId = 0;
const makeList = (other: Runtype, otherKind: "nullish" | "string", nodeFirst: boolean, withKinds: boolean) => {
  const name = `UnionKindsNode${listId++}`;
  const node = counted(runtypeOf(createNamedType(name, b.Unknown())));
  const members = nodeFirst ? [node.runtype, other] : [other, node.runtype];
  // The kind table: `other` checks its kind, and the node checks objects. The union accepts no other kind.
  const kindTable = { [otherKind]: members.indexOf(other), object: members.indexOf(node.runtype) };
  const next = new AnyOfRuntype(undefined, members, withKinds ? kindTable : undefined);
  overrideNamedType(
    name,
    buildParserFromRuntype(new ObjectRuntype(undefined, { value: num, next }, []), name, false),
  );
  return { parser: buildParserFromRuntype(node.runtype, name, false), calls: node.calls };
};

const chain = (depth: number, end: unknown, extra: boolean) => {
  let node: unknown = end;
  for (let i = 0; i < depth; i++) node = extra ? { value: i, next: node, extra } : { value: i, next: node };
  return node;
};

describe("union with the runtype of each kind", () => {
  const DEPTH = 40;
  const shapes: [string, Runtype, "nullish" | "string", unknown][] = [
    ["Node | null", nul, "nullish", null],
    ["Node | string", str, "string", "end"],
  ];
  for (const [name, other, otherKind, end] of shapes) {
    for (const nodeFirst of [true, false]) {
      it(`parses ${name} without validating again, recursive member ${nodeFirst ? "first" : "last"}`, () => {
        const list = makeList(other, otherKind, nodeFirst, true);
        expect(list.parser.parse(chain(DEPTH, end, true))).toEqual(chain(DEPTH, end, false));
        // With the table, validate() runs one time for each node. It can run one more time for the end of the list.
        // Parse does not call validate() again.
        expect(list.calls()).toBeLessThanOrEqual(DEPTH + 1);

        // Without the table, parse validates each level again.
        // The number of calls then grows with the square of the depth.
        const without = makeList(other, otherKind, nodeFirst, false);
        expect(without.parser.parse(chain(DEPTH, end, true))).toEqual(chain(DEPTH, end, false));
        expect(without.calls()).toBeGreaterThan((DEPTH * DEPTH) / 2);
      });
    }
  }

  it("rejects invalid inputs the same way", () => {
    const list = makeList(nul, "nullish", true, true);
    const without = makeList(nul, "nullish", true, false);
    for (const bad of [chain(3, "end", false), chain(3, 1, false), chain(3, {}, false), Symbol("s"), []]) {
      expect(list.parser.validate(bad)).toBe(false);
      expect(list.parser.safeParse(bad)).toEqual(without.parser.safeParse(bad));
      expect(() => list.parser.parse(bad)).toThrow();
    }
  });

  it("merges the members that match when the union has no table", () => {
    const a = new ObjectRuntype(undefined, { a: str }, []);
    const c = new ObjectRuntype(undefined, { c: num }, []);
    const U = buildParserFromRuntype(new AnyOfRuntype(undefined, [a, c, nul]), "U", false);
    expect(U.parse({ a: "x", z: 1 })).toEqual({ a: "x" });
    expect(U.parse({ a: "x", c: 1, z: 1 })).toEqual({ a: "x", c: 1 });
    expect(U.parse(null)).toBe(null);
    expect(U.validate([])).toBe(false);
  });

  it("uses one runtype for all the literals of a kind", () => {
    const a = new ConstRuntype(undefined, "a");
    const c = new ConstRuntype(undefined, "c");
    // Member 2 checks numbers. One `AnyOfConstsRuntype`, which is not a member, checks the two string literals.
    const U = buildParserFromRuntype(
      new AnyOfRuntype(undefined, [a, c, num], {
        number: 2,
        string: new AnyOfConstsRuntype(undefined, ["a", "c"]),
      }),
      "U",
      false,
    );
    expect(U.parse("a")).toBe("a");
    expect(U.parse(1)).toBe(1);
    expect(U.validate("b")).toBe(false);
    expect(U.validate(null)).toBe(false);
  });

  it("sends an array or a function with the prototype of a Date to the Date member", () => {
    const d = new DateRuntype(undefined);
    // Member 1 checks strings. Member 0 (the Date) checks arrays, objects and functions.
    const U = buildParserFromRuntype(new AnyOfRuntype(undefined, [d, str], { string: 1, array: 0, object: 0, function: 0 }), "U", false);
    const value = new Date(0);
    expect(U.parse(value)).toBe(value);
    expect(U.parse("x")).toBe("x");
    // The Date runtype uses `instanceof`, which is also true for an array whose prototype is `Date.prototype`.
    // The table must thus send arrays to the Date member.
    const spoofed = Object.setPrototypeOf([], Date.prototype);
    expect(U.validate(spoofed)).toBe(true);
    expect(U.validate([])).toBe(false);
    expect(U.validate({})).toBe(false);
    expect(U.validate(Symbol("s"))).toBe(false);
  });

  it("does not classify the members of a union of the b API", () => {
    const Id = createNamedType("UnionKindsId", b.String());
    const U = buntyped.Union(Id, b.Null());
    expect(U.validate("a")).toBe(true);
    // The override changes the member from a string type to a number type.
    // A union of the `b` API has no kind table, so it uses the new type.
    overrideNamedType("UnionKindsId", b.Number());
    expect(U.validate(1)).toBe(true);
    expect(U.parse(1)).toBe(1);
    expect(U.validate("a")).toBe(false);
    expect(U.parse(null)).toBe(null);
  });
});
