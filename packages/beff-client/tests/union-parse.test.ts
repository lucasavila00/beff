import { describe, expect, it } from "vitest";
import {
  AnyOfRuntype,
  buildParserFromRuntype,
  MapRuntype,
  NullishRuntype,
  ObjectRuntype,
  SetRuntype,
  TypeofRuntype,
} from "../src/codegen-v2.js";

const str = new TypeofRuntype(undefined, "string");
const num = new TypeofRuntype(undefined, "number");
const nul = new NullishRuntype(undefined, "null");

describe("parse of a union", () => {
  it("keeps Map and Set values when one member matches", () => {
    const Cache = buildParserFromRuntype(
      new AnyOfRuntype(undefined, [
        new ObjectRuntype(
          undefined,
          { tags: new SetRuntype(undefined, str), byId: new MapRuntype(undefined, str, num) },
          [],
        ),
        nul,
      ]),
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
      new AnyOfRuntype(undefined, [
        new ObjectRuntype(undefined, { m: new MapRuntype(undefined, str, num) }, []),
        new ObjectRuntype(
          undefined,
          { m: new MapRuntype(undefined, str, num), s: new SetRuntype(undefined, str) },
          [],
        ),
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
    const record = new ObjectRuntype(undefined, {}, [{ key: str, value: num }]);
    const MaybeCounts = buildParserFromRuntype(
      new AnyOfRuntype(undefined, [record, nul]),
      "MaybeCounts",
      false,
    );
    expect(MaybeCounts.parse({ constructor: 1, prototype: 2, a: 3 })).toEqual({
      constructor: 1,
      prototype: 2,
      a: 3,
    });

    const TwoRecords = buildParserFromRuntype(
      new AnyOfRuntype(undefined, [record, record]),
      "TwoRecords",
      false,
    );
    const out: any = TwoRecords.parse({ constructor: 1, prototype: 2, a: 3 });
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
    expect(out).toEqual({ constructor: 1, prototype: 2, a: 3 });
  });
});
