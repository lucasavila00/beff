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

// The positions of the kinds in the table of a union.
const NULLISH = 0;
const STRING = 3;
const OBJECT = 6;

const runtypeOf = (parser: unknown): Runtype => (parser as { _runtype: Runtype })._runtype;

// Counts the validate() calls of a runtype.
const counted = (inner: Runtype): { runtype: Runtype; calls: () => number } => {
  let calls = 0;
  const runtype: Runtype = Object.create(inner);
  runtype.validate = (ctx, input) => {
    calls++;
    return inner.validate(ctx, input);
  };
  return { runtype, calls: () => calls };
};

// `type Node = { value: number; next: <union of Node and `other`, in the given order> }`,
// as the compiler prints it: the union has the runtype of each kind.
let listId = 0;
const makeList = (other: Runtype, otherKind: number, nodeFirst: boolean, withKinds: boolean) => {
  const name = `UnionKindsNode${listId++}`;
  const node = counted(runtypeOf(createNamedType(name, b.Unknown())));
  const members = nodeFirst ? [node.runtype, other] : [other, node.runtype];
  // The index of the member that checks each kind: `other` for its kind, the node for an object.
  const kinds = Array.from({ length: 7 }, () => "");
  kinds[otherKind] = String(members.indexOf(other));
  kinds[OBJECT] = String(members.indexOf(node.runtype));
  const next = new AnyOfRuntype(undefined, members, withKinds ? kinds.join(",") : undefined);
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
  const shapes: [string, Runtype, number, unknown][] = [
    ["Node | null", nul, NULLISH, null],
    ["Node | string", str, STRING, "end"],
  ];
  for (const [name, other, otherKind, end] of shapes) {
    for (const nodeFirst of [true, false]) {
      it(`parses ${name} without validating again, recursive member ${nodeFirst ? "first" : "last"}`, () => {
        const list = makeList(other, otherKind, nodeFirst, true);
        expect(list.parser.parse(chain(DEPTH, end, true))).toEqual(chain(DEPTH, end, false));
        // One call per node, all from the validate pass, and at most one more for the end of the list.
        expect(list.calls()).toBeLessThanOrEqual(DEPTH + 1);

        const without = makeList(other, otherKind, nodeFirst, false);
        expect(without.parser.parse(chain(DEPTH, end, true))).toEqual(chain(DEPTH, end, false));
        expect(without.calls()).toBeGreaterThan((DEPTH * DEPTH) / 2);
      });
    }
  }

  it("rejects invalid inputs the same way", () => {
    const list = makeList(nul, NULLISH, true, true);
    const without = makeList(nul, NULLISH, true, false);
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

  it("uses the literals after the members for a kind", () => {
    const a = new ConstRuntype(undefined, "a");
    const c = new ConstRuntype(undefined, "c");
    // number is member 2, a string is the runtype after the members
    const U = buildParserFromRuntype(
      new AnyOfRuntype(undefined, [a, c, num], ",,2,3", [new AnyOfConstsRuntype(undefined, ["a", "c"])]),
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
    // string is member 1; array, object and function are member 0
    const U = buildParserFromRuntype(new AnyOfRuntype(undefined, [d, str], ",,,1,,0,0,0"), "U", false);
    const value = new Date(0);
    expect(U.parse(value)).toBe(value);
    expect(U.parse("x")).toBe("x");
    // `instanceof` is also true for an array that has the prototype of a Date
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
    // The override changes the kind of value the member accepts.
    overrideNamedType("UnionKindsId", b.Number());
    expect(U.validate(1)).toBe(true);
    expect(U.parse(1)).toBe(1);
    expect(U.validate("a")).toBe(false);
    expect(U.parse(null)).toBe(null);
  });
});
