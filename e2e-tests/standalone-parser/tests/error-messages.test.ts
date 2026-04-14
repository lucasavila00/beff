import { expect, it } from "vitest";
import { QueryCodec, TransportedValue } from "../src/parser";

it("PartialRepro bug", () => {
  expect(
    QueryCodec.safeParse({
      orderBy: {
        direction: "ASC",
        field: "name",
      },
    }),
  ).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected one of \\"asc\\", \\"desc\\"",
          "path": [
            "orderBy",
            "direction",
          ],
          "received": "ASC",
        },
      ],
      "success": false,
    }
  `);
});

it("deduplicates null/undefined in union errors", () => {
  // TransportedValue = string | null | undefined | Array<string | number | null | undefined>
  // null and undefined both produce "expected nullish value" — should be deduplicated
  expect(TransportedValue.safeParse(123)).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "errors": [
            {
              "message": "expected nullish value",
              "path": [],
              "received": 123,
            },
            {
              "message": "expected string",
              "path": [],
              "received": 123,
            },
            {
              "message": "expected array",
              "path": [],
              "received": 123,
            },
          ],
          "isUnionError": true,
          "path": [],
          "received": 123,
        },
      ],
      "success": false,
    }
  `);
});
