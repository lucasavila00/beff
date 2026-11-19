import { describe, expect, it } from "vitest";
import { b, createNamedType, overrideNamedType } from "../src/index.js";
import {
  AnyOfRuntype,
  buildParserFromRuntype,
  DateRuntype,
  NullishRuntype,
  ObjectRuntype,
  TypeofRuntype,
  type Runtype,
} from "../src/codegen-v2.js";

// The kinds the compiler prints for each branch of a union.
const NULLISH = 1;
const STRING = 8;
const ARRAY = 32;
const OBJECT = 64;
const OTHER = 128;

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

// `type Node = { value: number; next: <union of Node and `other`, in the given order> }`
let listId = 0;
const makeList = (other: Runtype, otherKinds: number, nodeFirst: boolean, withKinds: boolean) => {
  const name = `UnionKindsNode${listId++}`;
  const node = counted(runtypeOf(createNamedType(name, b.Unknown())));
  const schemas = nodeFirst ? [node.runtype, other] : [other, node.runtype];
  const kinds = nodeFirst ? [OBJECT, otherKinds] : [otherKinds, OBJECT];
  const next = new AnyOfRuntype(undefined, schemas, withKinds ? kinds : undefined);
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

describe("union with the kinds of its branches", () => {
  const DEPTH = 40;
  const shapes: [string, Runtype, number, unknown][] = [
    ["Node | null", nul, NULLISH, null],
    ["Node | string", str, STRING, "end"],
  ];
  for (const [name, other, otherKinds, end] of shapes) {
    for (const nodeFirst of [true, false]) {
      it(`parses ${name} without validating again, recursive branch ${nodeFirst ? "first" : "last"}`, () => {
        const list = makeList(other, otherKinds, nodeFirst, true);
        expect(list.parser.parse(chain(DEPTH, end, true))).toEqual(chain(DEPTH, end, false));
        // One call per node, all from the validate pass, and at most one more
        // for the end of the list.
        expect(list.calls()).toBeLessThanOrEqual(DEPTH + 1);

        const without = makeList(other, otherKinds, nodeFirst, false);
        expect(without.parser.parse(chain(DEPTH, end, true))).toEqual(chain(DEPTH, end, false));
        expect(without.calls()).toBeGreaterThan((DEPTH * DEPTH) / 2);
      });
    }
  }

  it("rejects invalid inputs the same way", () => {
    const list = makeList(nul, NULLISH, true, true);
    expect(list.parser.validate(chain(3, "end", false))).toBe(false);
    expect(list.parser.safeParse(chain(3, 1, false)).success).toBe(false);
    expect(() => list.parser.parse(chain(3, {}, false))).toThrow();
  });

  it("validates the candidates when more than one branch accepts the kind", () => {
    const a = new ObjectRuntype(undefined, { a: str }, []);
    const c = new ObjectRuntype(undefined, { c: num }, []);
    const U = buildParserFromRuntype(
      new AnyOfRuntype(undefined, [a, c, nul], [OBJECT, OBJECT, NULLISH]),
      "U",
      false,
    );
    expect(U.parse({ a: "x", z: 1 })).toEqual({ a: "x" });
    expect(U.parse({ c: 1, z: 1 })).toEqual({ c: 1 });
    expect(U.parse({ a: "x", c: 1, z: 1 })).toEqual({ a: "x", c: 1 });
    expect(U.parse(null)).toBe(null);
  });

  it("keeps a Date when an object branch could also accept it", () => {
    const U = buildParserFromRuntype(
      new AnyOfRuntype(
        undefined,
        [new DateRuntype(undefined), new ObjectRuntype(undefined, { a: num }, []), str],
        [OBJECT | ARRAY | OTHER, OBJECT, STRING],
      ),
      "U",
      false,
    );
    const d = new Date(0);
    expect(U.parse(d)).toBe(d);
    expect(U.parse({ a: 1, z: 1 })).toEqual({ a: 1 });
    expect(U.parse("x")).toBe("x");
  });
});
