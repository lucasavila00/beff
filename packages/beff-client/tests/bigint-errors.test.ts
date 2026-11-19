import { describe, expect, it } from "vitest";
import { bigint, buildParserFromRuntype, map, num, obj, set, str, union } from "../src/codegen-v2.js";
import { printErrors } from "../src/err.js";

describe("bigint values in errors", () => {
  it("parse throws the validation error", () => {
    const Num = buildParserFromRuntype(obj({ n: num() }), "Num", false);
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
    const SetBig = buildParserFromRuntype(set(bigint()), "SetBig", false);
    expect(SetBig.safeParse(new Set([1n, "x"]))).toMatchObject({ success: false });

    const MapBig = buildParserFromRuntype(map(bigint(), str()), "MapBig", false);
    expect(MapBig.safeParse(new Map([[1n, 2]]))).toMatchObject({ success: false });
  });

  it("union errors with bigint values do not throw", () => {
    const U = buildParserFromRuntype(union([num(), str()]), "U", false);
    expect(() => U.parse(5n)).toThrowError("Failed to parse U");
  });
});
