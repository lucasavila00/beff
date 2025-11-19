import { b } from "@beff/client";
import { it, expect } from "vitest";

it("works", () => {
  expect(
    b
      .Object({
        a: b.String(),
        b: b.Number(),
      })
      .describe(),
  ).toMatchInlineSnapshot('"{ \\"a\\": string, \\"b\\": number }"');
  expect(b.String().describe()).toMatchInlineSnapshot('"string"');
  expect(b.Number().describe()).toMatchInlineSnapshot('"number"');
  expect(b.Boolean().describe()).toMatchInlineSnapshot('"boolean"');
  expect(b.Array(b.String()).describe()).toMatchInlineSnapshot('"Array<string>"');
  expect(b.ReadOnlyArray(b.String()).describe()).toMatchInlineSnapshot('"Array<string>"');
  expect(b.Undefined().describe()).toMatchInlineSnapshot('"null"');
  expect(b.Null().describe()).toMatchInlineSnapshot('"null"');
  expect(b.Any().describe()).toMatchInlineSnapshot('"any"');
  expect(b.Unknown().describe()).toMatchInlineSnapshot('"unknown"');
  expect(b.Void().describe()).toMatchInlineSnapshot('"null"');
});
