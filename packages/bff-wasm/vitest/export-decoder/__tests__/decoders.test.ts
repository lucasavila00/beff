import { it, expect } from "vitest";
import { User, Users } from "../router";

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
          "received": 123,
        },
        {
          "error_kind": "NotTypeof",
          "expected_type": "number",
          "path": [
            "User",
            "age",
          ],
          "received": undefined,
        },
      ],
      "success": false,
    }
  `);

  expect(Users.safeParse([{ name: 123 }, { age: "def" }]))
    .toMatchInlineSnapshot(`
      {
        "errors": [
          {
            "error_kind": "NotTypeof",
            "expected_type": "string",
            "path": [
              "[0]",
              "User",
              "name",
            ],
            "received": 123,
          },
          {
            "error_kind": "NotTypeof",
            "expected_type": "number",
            "path": [
              "[0]",
              "User",
              "age",
            ],
            "received": undefined,
          },
          {
            "error_kind": "NotTypeof",
            "expected_type": "string",
            "path": [
              "[1]",
              "User",
              "name",
            ],
            "received": undefined,
          },
          {
            "error_kind": "NotTypeof",
            "expected_type": "number",
            "path": [
              "[1]",
              "User",
              "age",
            ],
            "received": "def",
          },
        ],
        "success": false,
      }
    `);
});
