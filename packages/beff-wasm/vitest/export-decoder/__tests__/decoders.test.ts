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
      "data": "BB",
      "success": true,
    }
  `);
});

it("regular types", () => {
  expect((generatedRouter.schema.components as any).schemas).toMatchInlineSnapshot(`
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
            "createdAt": {
              "format": "Codec::ISO8061",
              "type": "string",
            },
            "name": {
              "type": "string",
            },
          },
          "required": [
            "age",
            "createdAt",
            "name",
          ],
          "type": "object",
        },
      }
    `);
  const u = User.parse({
    name: "name",
    age: 123,
    createdAt: "2023-09-22T22:52:24.855Z",
  });
  expect(u).toMatchInlineSnapshot(`
    {
      "age": 123,
      "createdAt": 2023-09-22T22:52:24.855Z,
      "name": "name",
    }
  `);
  expect(u.createdAt.toISOString()).toMatchInlineSnapshot('"2023-09-22T22:52:24.855Z"');
  expect(() => User.parse({ name: 123 })).toThrowErrorMatchingInlineSnapshot(`
    BffParseError {
      "errors": [
        {
          "message": "expected number",
          "path": [
            "age",
          ],
          "received": undefined,
        },
        {
          "message": "expected ISO8061 date",
          "path": [
            "createdAt",
          ],
          "received": undefined,
        },
        {
          "message": "expected string",
          "path": [
            "name",
          ],
          "received": 123,
        },
      ],
    }
  `);

  expect(User.safeParse({ name: 123 })).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected number",
          "path": [
            "age",
          ],
          "received": undefined,
        },
        {
          "message": "expected ISO8061 date",
          "path": [
            "createdAt",
          ],
          "received": undefined,
        },
        {
          "message": "expected string",
          "path": [
            "name",
          ],
          "received": 123,
        },
      ],
      "success": false,
    }
  `);
  expect(NotPublicRenamed.safeParse({ name: 123 })).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string",
          "path": [
            "a",
          ],
          "received": undefined,
        },
      ],
      "success": false,
    }
  `);

  expect(Users.safeParse([{ name: 123 }, { age: "def" }])).toMatchInlineSnapshot(`
      {
        "errors": [
          {
            "message": "expected number",
            "path": [
              "[0]",
              "age",
            ],
            "received": undefined,
          },
          {
            "message": "expected ISO8061 date",
            "path": [
              "[0]",
              "createdAt",
            ],
            "received": undefined,
          },
          {
            "message": "expected string",
            "path": [
              "[0]",
              "name",
            ],
            "received": 123,
          },
          {
            "message": "expected number",
            "path": [
              "[1]",
              "age",
            ],
            "received": "def",
          },
          {
            "message": "expected ISO8061 date",
            "path": [
              "[1]",
              "createdAt",
            ],
            "received": undefined,
          },
          {
            "message": "expected string",
            "path": [
              "[1]",
              "name",
            ],
            "received": undefined,
          },
        ],
        "success": false,
      }
    `);
});
