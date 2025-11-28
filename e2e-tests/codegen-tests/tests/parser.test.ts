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

  expect(Codecs.AliasToString.describe()).toMatchInlineSnapshot('"type CodecAliasToString = string;"');

  expect(Codecs.AliasToNumber.describe()).toMatchInlineSnapshot('"type CodecAliasToNumber = number;"');

  expect(Codecs.AliasToBoolean.describe()).toMatchInlineSnapshot('"type CodecAliasToBoolean = boolean;"');
  expect(Codecs.AliasToNull.describe()).toMatchInlineSnapshot('"type CodecAliasToNull = (null | undefined);"');
  expect(Codecs.AliasToAny.describe()).toMatchInlineSnapshot('"type CodecAliasToAny = any;"');
  expect(Codecs.AliasToConst.describe()).toMatchInlineSnapshot(
    '"type CodecAliasToConst = \\"constant value\\";"',
  );
  expect(Codecs.TestHoist.describe()).toMatchInlineSnapshot(
    '"type CodecTestHoist = { a: Array<string>, b: Array<string> };"',
  );
});
