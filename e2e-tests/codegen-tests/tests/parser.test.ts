import { it, expect } from "vitest";
import { Codecs } from "../src/parser";

it("works", () => {
  expect(Codecs.T1.describe()).toMatchInlineSnapshot('"type CodecT1 = string;"');
  expect(Codecs.T1.schema()).toMatchInlineSnapshot(`
    {
      "type": "string",
    }
  `);
});
