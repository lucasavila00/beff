import { expect, it } from "vitest";
import { Codecs } from "../src/parser";

it("preserves exported const annotations through namespace typeof", () => {
  expect(
    Codecs.KnownConstants.parse({
      FOO_VALUE: "example",
      BAR_OPTION: "blue",
      BAZ_VALUES: ["one", "two"],
    }),
  ).toEqual({
    FOO_VALUE: "example",
    BAR_OPTION: "blue",
    BAZ_VALUES: ["one", "two"],
  });

  expect(
    Codecs.KnownConstants.safeParse({
      FOO_VALUE: "example",
      BAR_OPTION: "green",
      BAZ_VALUES: [],
    }),
  ).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected one of \\"blue\\", \\"red\\"",
          "path": [
            "BAR_OPTION",
          ],
          "received": "green",
        },
      ],
      "success": false,
    }
  `);

  expect(
    Codecs.KnownConstants.safeParse({
      FOO_VALUE: "example",
      BAR_OPTION: "red",
      BAZ_VALUES: [1],
    }),
  ).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string",
          "path": [
            "BAZ_VALUES",
            "[0]",
          ],
          "received": 1,
        },
      ],
      "success": false,
    }
  `);
});
