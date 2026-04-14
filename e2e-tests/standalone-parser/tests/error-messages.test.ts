import { expect, it } from "vitest";
import { QueryCodec } from "../src/parser";

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
