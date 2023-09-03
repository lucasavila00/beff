import { it, expect } from "vitest";
import { NotPublicRenamed, User, Users, StartsWithA } from "../parser";
import generatedRouter from "../bff-generated/router";

it("custom types", () => {
  expect(StartsWithA.safeParse("AA")).toMatchInlineSnapshot(`
    {
      "data": "AA",
      "success": true,
    }
  `);
  expect(StartsWithA.safeParse("BB")).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "error_kind": "StringFormatCheckFailed",
          "expected_type": "StartsWithA",
          "path": [
            "StartsWithA",
          ],
          "received": "BB",
        },
      ],
      "success": false,
    }
  `);
});

it("regular types", () => {
  expect(generatedRouter.schema.components.schemas).toMatchInlineSnapshot(`
    {
      "StartsWithA": {
        "format": "StartsWithA",
        "type": "string",
      },
      "User": {
        "properties": {
          "age": {
            "type": "number",
          },
          "name": {
            "type": "string",
          },
        },
        "required": [
          "name",
          "age",
        ],
        "type": "object",
      },
    }
  `);
  expect(User.parse({ name: "name", age: 123 })).toMatchInlineSnapshot(`
    {
      "age": 123,
      "name": "name",
    }
  `);
  expect(() => User.parse({ name: 123 })).toThrowErrorMatchingInlineSnapshot(`
    BffParseError {
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
  expect(NotPublicRenamed.safeParse({ name: 123 })).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "error_kind": "NotTypeof",
          "expected_type": "string",
          "path": [
            "NotPublic",
            "a",
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
