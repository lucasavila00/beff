import { describe, expect, it } from "vitest";
import { buildParserFromRuntype, map, nul, num, obj, set, str, union } from "../src/codegen-v2.js";

describe("parse of a union", () => {
  it("keeps Map and Set values when one member matches", () => {
    const Cache = buildParserFromRuntype(
      union([obj({ tags: set(str()), byId: map(str(), num()) }), nul()]),
      "Cache",
      false,
    );
    const out: any = Cache.parse({ tags: new Set(["a"]), byId: new Map([["a", 1]]) });
    expect(out.tags).toBeInstanceOf(Set);
    expect([...out.tags]).toEqual(["a"]);
    expect(out.byId).toBeInstanceOf(Map);
    expect([...out.byId]).toEqual([["a", 1]]);
    expect(Cache.parse(null)).toBe(null);
  });

  it("keeps Map and Set values when many members match", () => {
    const Both = buildParserFromRuntype(
      union([obj({ m: map(str(), num()) }), obj({ m: map(str(), num()), s: set(str()) })]),
      "Both",
      false,
    );
    const out: any = Both.parse({ m: new Map([["a", 1]]), s: new Set(["x"]) });
    expect(out.m).toBeInstanceOf(Map);
    expect([...out.m]).toEqual([["a", 1]]);
    expect(out.s).toBeInstanceOf(Set);
  });

  it("keeps keys named like Object.prototype members", () => {
    const record = obj({}, [{ key: str(), value: num() }]);
    const MaybeCounts = buildParserFromRuntype(union([record, nul()]), "MaybeCounts", false);
    expect(MaybeCounts.parse({ constructor: 1, prototype: 2, a: 3 })).toEqual({
      constructor: 1,
      prototype: 2,
      a: 3,
    });

    const TwoRecords = buildParserFromRuntype(union([record, record]), "TwoRecords", false);
    const out: any = TwoRecords.parse({ constructor: 1, prototype: 2, a: 3 });
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
    expect(out).toEqual({ constructor: 1, prototype: 2, a: 3 });
  });
});
