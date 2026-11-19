import { describe, expect, it } from "vitest";
import { buildParserFromRuntype, ObjectRuntype, TypeofRuntype } from "../src/codegen-v2.js";

const Counts = buildParserFromRuntype(
  new ObjectRuntype(undefined, {}, [
    { key: new TypeofRuntype(undefined, "string"), value: new TypeofRuntype(undefined, "number") },
  ]),
  "Counts",
  false,
);

describe('objectKeyOrder: "sorted"', () => {
  it("keeps keys named like Object.prototype members", () => {
    const input = { constructor: 1, toString: 2, hasOwnProperty: 3, valueOf: 4, a: 5 };
    const out = Counts.parse(input, { objectKeyOrder: "sorted" });
    expect(out).toEqual(input);
    expect(Object.keys(out)).toEqual(["a", "constructor", "hasOwnProperty", "toString", "valueOf"]);
  });

  it("keeps a __proto__ key as an own property", () => {
    const out: any = Counts.parse(JSON.parse('{"__proto__": 1, "a": 2}'), { objectKeyOrder: "sorted" });
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
    expect(Object.keys(out)).toEqual(["__proto__", "a"]);
  });
});
