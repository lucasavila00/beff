import { describe, expect, it } from "vitest";
import { b, buntyped, createNamedType, overrideNamedType } from "../src/index.js";
import {
  AnyOfDiscriminatedRuntype,
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
const makeList = (other: Runtype, otherKind: string, nodeFirst: boolean, withKinds: boolean) => {
  const name = `UnionKindsNode${listId++}`;
  const node = counted(runtypeOf(createNamedType(name, b.Unknown())));
  const members = nodeFirst ? [node.runtype, other] : [other, node.runtype];
  const byKind = withKinds ? { [otherKind]: other, object: node.runtype } : undefined;
  const next = new AnyOfRuntype(undefined, members, byKind);
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
  const shapes: [string, Runtype, string, unknown][] = [
    ["Node | null", nul, "nullish", null],
    ["Node | string", str, "string", "end"],
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
    const list = makeList(nul, "nullish", true, true);
    const without = makeList(nul, "nullish", true, false);
    for (const bad of [chain(3, "end", false), chain(3, 1, false), chain(3, {}, false), Symbol("s"), []]) {
      expect(list.parser.validate(bad)).toBe(false);
      expect(list.parser.safeParse(bad)).toEqual(without.parser.safeParse(bad));
      expect(() => list.parser.parse(bad)).toThrow();
    }
  });

  it("merges the members of one kind that match", () => {
    const a = new ObjectRuntype(undefined, { a: str }, []);
    const c = new ObjectRuntype(undefined, { c: num }, []);
    const U = buildParserFromRuntype(
      new AnyOfRuntype(undefined, [a, c, nul], {
        nullish: nul,
        object: new AnyOfRuntype(undefined, [a, c]),
      }),
      "U",
      false,
    );
    expect(U.parse({ a: "x", z: 1 })).toEqual({ a: "x" });
    expect(U.parse({ c: 1, z: 1 })).toEqual({ c: 1 });
    expect(U.parse({ a: "x", c: 1, z: 1 })).toEqual({ a: "x", c: 1 });
    expect(U.parse(null)).toBe(null);
    expect(U.validate([])).toBe(false);
  });

  it("uses a discriminated union for the object kind", () => {
    const a = new ObjectRuntype(undefined, { t: new ConstRuntype(undefined, "a"), a: str }, []);
    const c = new ObjectRuntype(undefined, { t: new ConstRuntype(undefined, "c"), c: num }, []);
    const U = buildParserFromRuntype(
      new AnyOfRuntype(undefined, [a, c, nul], {
        nullish: nul,
        object: new AnyOfDiscriminatedRuntype(undefined, [a, c], "t", { a, c }),
      }),
      "U",
      false,
    );
    expect(U.parse({ t: "a", a: "x", z: 1 })).toEqual({ t: "a", a: "x" });
    expect(U.parse(null)).toBe(null);
    expect(U.validate({ t: "c", a: "x" })).toBe(false);
  });

  it("keeps a Date when an object member could also accept it", () => {
    const d = new DateRuntype(undefined);
    const o = new ObjectRuntype(undefined, { a: num }, []);
    const U = buildParserFromRuntype(
      new AnyOfRuntype(undefined, [d, o, str], {
        string: str,
        array: d,
        function: d,
        object: new AnyOfRuntype(undefined, [d, o]),
      }),
      "U",
      false,
    );
    const value = new Date(0);
    expect(U.parse(value)).toBe(value);
    expect(U.parse({ a: 1, z: 1 })).toEqual({ a: 1 });
    expect(U.parse("x")).toBe("x");
    // `instanceof` is also true for an array that has the prototype of a Date
    const spoofed = Object.setPrototypeOf([], Date.prototype);
    expect(U.validate(spoofed)).toBe(true);
    expect(U.validate([])).toBe(false);
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
