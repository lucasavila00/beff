import { it, expect } from "vitest";
import { User } from "../router";

it("works", () => {
  expect(User.parse({ name: "name", age: 123 })).toMatchInlineSnapshot(`
    {
      "age": 123,
      "name": "name",
    }
  `);

  expect(User.safeParse({ name: 123 })).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "error_kind": "NotTypeof",
          "expected_type": "string",
          "path": [
            "User",
            "name",
          ],
        },
        {
          "error_kind": "NotTypeof",
          "expected_type": "number",
          "path": [
            "User",
            "age",
          ],
        },
      ],
      "success": false,
    }
  `);
});
