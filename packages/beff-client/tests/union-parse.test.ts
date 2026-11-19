import { describe, expect, it } from "vitest";
import {
  buildParserFromRuntype,
  map,
  nullType,
  number,
  object,
  set,
  string,
  union,
} from "../src/codegen-v2.js";

describe("parse of a union", () => {
  it("keeps Map and Set values when one member matches", () => {
    const Cache = buildParserFromRuntype(
      union([object({ tags: set(string()), byId: map(string(), number()) }), nullType()]),
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
      union([
        object({ m: map(string(), number()) }),
        object({ m: map(string(), number()), s: set(string()) }),
      ]),
      "Both",
      false,
    );
    const out: any = Both.parse({ m: new Map([["a", 1]]), s: new Set(["x"]) });
    expect(out.m).toBeInstanceOf(Map);
    expect([...out.m]).toEqual([["a", 1]]);
    expect(out.s).toBeInstanceOf(Set);
  });

  it("keeps keys named like Object.prototype members", () => {
    const record = object({}, [{ key: string(), value: number() }]);
    const MaybeCounts = buildParserFromRuntype(union([record, nullType()]), "MaybeCounts", false);
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
