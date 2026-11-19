import { describe, expect, it } from "vitest";
import { buildParserFromRuntype, disc, lit, num, obj } from "../src/codegen-v2.js";

const circle = obj({ kind: lit("circle"), radius: num() });
const square = obj({ kind: lit("square"), size: num() });
const Shape = buildParserFromRuntype(disc("kind", { circle, square }, [circle, square]), "Shape", false);

describe("discriminated union", () => {
  it("rejects discriminator values that are Object.prototype member names", () => {
    for (const kind of ["toString", "constructor", "__proto__", "hasOwnProperty", "valueOf"]) {
      expect(Shape.validate({ kind })).toBe(false);
      expect(Shape.safeParse({ kind })).toEqual({
        success: false,
        errors: [{ message: 'expected one of "circle", "square"', path: ["kind"], received: kind }],
      });
    }
  });

  it("still accepts valid variants", () => {
    expect(Shape.parse({ kind: "circle", radius: 1 })).toEqual({ kind: "circle", radius: 1 });
    expect(Shape.parse({ kind: "square", size: 2 })).toEqual({ kind: "square", size: 2 });
  });
});
