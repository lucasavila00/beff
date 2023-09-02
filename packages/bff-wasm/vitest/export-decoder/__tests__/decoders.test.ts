import { it, expect } from "vitest";
import { User } from "../router";

it("works", () => {
  expect(User.parse({ name: "name" })).toMatchInlineSnapshot(`
    {
      "name": "name",
    }
  `);

  expect(User.safeParse({ name: 123 })).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "kind": [
            "NotTypeof",
            "string",
          ],
          "path": [
            "User",
            "User",
            "name",
          ],
        },
      ],
      "success": false,
    }
  `);
});
