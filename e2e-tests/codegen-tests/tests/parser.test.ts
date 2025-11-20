import { it, expect } from "vitest";
import { Codecs } from "../src/parser";

it("works", () => {
  expect(Codecs.Dec.describe()).toMatchInlineSnapshot('"type CodecDec = string;"');
  expect(Codecs.Dec.schema()).toMatchInlineSnapshot(`
    {
      "type": "string",
    }
  `);
  expect(Codecs.Dec.parse("any string to test it")).toMatchInlineSnapshot('"any string to test it"');

  expect(Codecs.AliasToString.describe()).toMatchInlineSnapshot('"type CodecDec = string;"');
});
