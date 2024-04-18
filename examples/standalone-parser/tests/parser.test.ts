import { it, expect } from "vitest";
import { User } from "../src/parser";

it("works on recursive type", () => {
  const valid = {
    name: "User1",
    friends: [
      {
        name: "User2",
        friends: [],
      },
    ],
  };
  expect(User.safeParse(valid)).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "errors": [
            {
              "message": "expected \\"ADMIN\\"",
              "path": [],
              "received": undefined,
            },
            {
              "message": "expected \\"USER\\"",
              "path": [],
              "received": undefined,
            },
          ],
          "isUnionError": true,
          "message": "expected one of",
          "path": [
            "accessLevel",
          ],
          "received": undefined,
        },
        {
          "message": "expected string",
          "path": [
            "avatarSize",
          ],
          "received": undefined,
        },
        {
          "message": "expected object",
          "path": [
            "extra",
          ],
          "received": undefined,
        },
        {
          "errors": [
            {
              "message": "expected \\"ADMIN\\"",
              "path": [],
              "received": undefined,
            },
            {
              "message": "expected \\"USER\\"",
              "path": [],
              "received": undefined,
            },
          ],
          "isUnionError": true,
          "message": "expected one of",
          "path": [
            "friends",
            "[0]",
            "accessLevel",
          ],
          "received": undefined,
        },
        {
          "message": "expected string",
          "path": [
            "friends",
            "[0]",
            "avatarSize",
          ],
          "received": undefined,
        },
        {
          "message": "expected object",
          "path": [
            "friends",
            "[0]",
            "extra",
          ],
          "received": undefined,
        },
      ],
      "success": false,
    }
  `);
  const invalid = {
    name: "User1",
    friends: [
      {
        name: "User2",
      },
    ],
  };
  expect(User.safeParse(invalid)).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "errors": [
            {
              "message": "expected \\"ADMIN\\"",
              "path": [],
              "received": undefined,
            },
            {
              "message": "expected \\"USER\\"",
              "path": [],
              "received": undefined,
            },
          ],
          "isUnionError": true,
          "message": "expected one of",
          "path": [
            "accessLevel",
          ],
          "received": undefined,
        },
        {
          "message": "expected string",
          "path": [
            "avatarSize",
          ],
          "received": undefined,
        },
        {
          "message": "expected object",
          "path": [
            "extra",
          ],
          "received": undefined,
        },
        {
          "errors": [
            {
              "message": "expected \\"ADMIN\\"",
              "path": [],
              "received": undefined,
            },
            {
              "message": "expected \\"USER\\"",
              "path": [],
              "received": undefined,
            },
          ],
          "isUnionError": true,
          "message": "expected one of",
          "path": [
            "friends",
            "[0]",
            "accessLevel",
          ],
          "received": undefined,
        },
        {
          "message": "expected string",
          "path": [
            "friends",
            "[0]",
            "avatarSize",
          ],
          "received": undefined,
        },
        {
          "message": "expected object",
          "path": [
            "friends",
            "[0]",
            "extra",
          ],
          "received": undefined,
        },
        {
          "message": "expected array",
          "path": [
            "friends",
            "[0]",
            "friends",
          ],
          "received": undefined,
        },
      ],
      "success": false,
    }
  `);
});
