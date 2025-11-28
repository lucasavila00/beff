import { it, expect } from "vitest";
import { AfterRequired, BeforeRequired, Codecs } from "../src/parser";

it("optionality", () => {
  const before0: BeforeRequired = {
    a: "a",
    b: undefined,
    c: undefined,
    d: null,
    e: undefined,
  };
  expect(Codecs.BeforeRequired.parse(before0)).toMatchInlineSnapshot(`
    {
      "a": "a",
      "b": undefined,
      "c": undefined,
      "d": null,
      "e": undefined,
    }
  `);
  const before1: BeforeRequired = {
    a: "a",
    b: undefined,
    c: undefined,
    d: null,
  };
  expect(Codecs.BeforeRequired.parse(before1)).toMatchInlineSnapshot(`
    {
      "a": "a",
      "b": undefined,
      "c": undefined,
      "d": null,
    }
  `);
  expect(Codecs.BeforeRequired.describe()).toMatchInlineSnapshot(
    '"type CodecBeforeRequired = { a: string, b: (undefined | string), c: (undefined | string), d: (null | string), e?: (null | string) };"',
  );
  expect(
    Codecs.BeforeRequired.safeParse({
      a: "a",
    }),
  ).toMatchInlineSnapshot(`
    {
      "data": {
        "a": "a",
      },
      "success": true,
    }
  `);

  const after: AfterRequired = {
    a: "a",
    b: undefined,
    c: undefined,
    d: null,
    e: "e",
  };
  expect(Codecs.AfterRequired.parse(after)).toMatchInlineSnapshot(`
    {
      "a": "a",
      "b": undefined,
      "c": undefined,
      "d": null,
      "e": "e",
    }
  `);
  expect(Codecs.AfterRequired.describe()).toMatchInlineSnapshot(
    '"type CodecAfterRequired = { a: string, b: (undefined | string), c: (undefined | string), d: (null | string), e: string };"',
  );

  expect(
    Codecs.AfterRequired.safeParse({
      a: "a",
    }),
  ).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string",
          "path": [
            "e",
          ],
          "received": undefined,
        },
      ],
      "success": false,
    }
  `);
});
