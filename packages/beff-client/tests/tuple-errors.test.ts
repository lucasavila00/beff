import { describe, expect, it } from "vitest";
import { buildParserFromRuntype, TupleRuntype, TypeofRuntype } from "../src/runtime.js";

const Pair = buildParserFromRuntype(
  new TupleRuntype(
    undefined,
    [new TypeofRuntype(undefined, "string"), new TypeofRuntype(undefined, "number")],
    null,
  ),
  "Pair",
  false,
);

describe("tuple errors", () => {
  it("reports an error when the tuple has too many items", () => {
    expect(Pair.safeParse(["a", 1, 2])).toEqual({
      success: false,
      errors: [{ message: "expected tuple with 2 items, got 3", path: [], received: ["a", 1, 2] }],
    });
    expect(() => Pair.parse(["a", 1, 2])).toThrowError(
      "Failed to parse Pair - expected tuple with 2 items, got 3, received: Array",
    );
  });

  it("still reports item errors", () => {
    expect(Pair.safeParse(["a", "b"])).toEqual({
      success: false,
      errors: [{ message: "expected number", path: ["[1]"], received: "b" }],
    });
  });
});
