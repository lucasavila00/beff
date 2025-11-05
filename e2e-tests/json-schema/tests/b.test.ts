import { b } from "@beff/client";
import { it, expect } from "vitest";

it("works", () => {
  expect(
    b
      .Object({
        a: b.String(),
        b: b.Number(),
      })
      .schema(),
  ).toMatchInlineSnapshot(`
    {
      "properties": {
        "a": {
          "type": "string",
        },
        "b": {
          "type": "number",
        },
      },
      "type": "object",
    }
  `);
  expect(b.String().schema()).toMatchInlineSnapshot(`
    {
      "type": "string",
    }
  `);
  expect(b.Number().schema()).toMatchInlineSnapshot(`
    {
      "type": "number",
    }
  `);
  expect(b.Boolean().schema()).toMatchInlineSnapshot(`
    {
      "type": "boolean",
    }
  `);
  expect(b.Array(b.String()).schema()).toMatchInlineSnapshot(`
    {
      "items": {
        "type": "string",
      },
      "type": "array",
    }
  `);
  expect(b.ReadOnlyArray(b.String()).schema()).toMatchInlineSnapshot(`
    {
      "items": {
        "type": "string",
      },
      "type": "array",
    }
  `);
  expect(b.Undefined().schema()).toMatchInlineSnapshot(`
    {
      "type": "null",
    }
  `);
  expect(b.Null().schema()).toMatchInlineSnapshot(`
    {
      "type": "null",
    }
  `);
  expect(b.Any().schema()).toMatchInlineSnapshot("{}");
  expect(b.Unknown().schema()).toMatchInlineSnapshot("{}");
  expect(b.Void().schema()).toMatchInlineSnapshot(`
    {
      "type": "null",
    }
  `);
});
