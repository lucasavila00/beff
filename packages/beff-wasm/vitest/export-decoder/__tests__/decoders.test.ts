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
          "kind": "notCustomFormat:StartsWithA",
          "path": [],
          "received": "BB",
        },
      ],
      "success": false,
    }
  `);
});

it("regular types", () => {
  expect((generatedRouter.schema.components as any).schemas)
    .toMatchInlineSnapshot(`
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
          "kind": "notNumber",
          "path": [],
          "received": undefined,
        },
        {
          "kind": "notISO8061",
          "path": [],
          "received": undefined,
        },
        {
          "kind": "notString",
          "path": [],
          "received": 123,
        },
      ],
    }
  `);

  expect(User.safeParse({ name: 123 })).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "kind": "notNumber",
          "path": [],
          "received": undefined,
        },
        {
          "kind": "notISO8061",
          "path": [],
          "received": undefined,
        },
        {
          "kind": "notString",
          "path": [],
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
          "kind": "notString",
          "path": [],
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
            "kind": "notNumber",
            "path": [],
            "received": undefined,
          },
          {
            "kind": "notISO8061",
            "path": [],
            "received": undefined,
          },
          {
            "kind": "notString",
            "path": [],
            "received": 123,
          },
          {
            "kind": "notNumber",
            "path": [],
            "received": "def",
          },
          {
            "kind": "notISO8061",
            "path": [],
            "received": undefined,
          },
          {
            "kind": "notString",
            "path": [],
            "received": undefined,
          },
        ],
        "success": false,
      }
    `);
});
