import { it, expect } from "vitest";
import { Codecs } from "../src/parser";
it("works", () => {
  expect(Codecs.ReusesRef.describe()).toMatchInlineSnapshot(`
    "type T3 = { t2Array: Array<{ t1: { a: string, b: number } }> };

    type CodecReusesRef = { a: T3, b: T3 };"
  `);
});
