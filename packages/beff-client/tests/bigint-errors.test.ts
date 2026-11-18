import { describe, expect, it } from "vitest";
import {
  AnyOfRuntype,
  buildParserFromRuntype,
  MapRuntype,
  ObjectRuntype,
  SetRuntype,
  TypeofRuntype,
  BigIntRuntype,
} from "../src/codegen-v2.js";
import { printErrors } from "../src/err.js";

const num = new TypeofRuntype(undefined, "number");
const str = new TypeofRuntype(undefined, "string");

describe("bigint values in errors", () => {
  it("parse throws the validation error", () => {
    const Num = buildParserFromRuntype(new ObjectRuntype(undefined, { n: num }, []), "Num", false);
    expect(() => Num.parse({ n: 10n })).toThrowError(
      "Failed to parse Num - (n) expected number, received: 10n",
    );
    const r = Num.safeParse({ n: 10n });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(printErrors(r.errors)).toBe("(n) expected number, received: 10n");
    }
  });

  it("safeParse does not throw for Set and Map with bigint values", () => {
    const SetBig = buildParserFromRuntype(
      new SetRuntype(undefined, new BigIntRuntype(undefined)),
      "SetBig",
      false,
    );
    expect(SetBig.safeParse(new Set([1n, "x"]))).toMatchObject({ success: false });

    const MapBig = buildParserFromRuntype(
      new MapRuntype(undefined, new BigIntRuntype(undefined), str),
      "MapBig",
      false,
    );
    expect(MapBig.safeParse(new Map([[1n, 2]]))).toMatchObject({ success: false });
  });

  it("union errors with bigint values do not throw", () => {
    const U = buildParserFromRuntype(new AnyOfRuntype(undefined, [num, str]), "U", false);
    expect(() => U.parse(5n)).toThrowError("Failed to parse U");
  });
});
