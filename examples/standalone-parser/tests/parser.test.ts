import { it, expect } from "vitest";
import { AccessLevel, Extra, User, Repro1 } from "../src/parser";

it("repro1", () => {
  expect(Repro1.parse({})).toMatchInlineSnapshot(`
    {
      "sizes": undefined,
    }
  `);
});

it("checks records", () => {
  expect(Extra.safeParse({ key: 123 })).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string",
          "path": [
            "key",
          ],
          "received": 123,
        },
      ],
      "success": false,
    }
  `);
});

it("works on recursive type", () => {
  const valid: User = {
    name: "User1",
    friends: [
      {
        name: "User2",
        friends: [],
        accessLevel: AccessLevel.USER,
        avatarSize: "100x100",
        extra: {},
      },
    ],
    accessLevel: AccessLevel.ADMIN,
    avatarSize: "100x100",
    extra: {
      key: "value",
    },
  };
  expect(User.parse(valid)).toMatchInlineSnapshot(`
    {
      "accessLevel": "ADMIN",
      "avatarSize": "100x100",
      "extra": {
        "key": "value",
      },
      "friends": [
        {
          "accessLevel": "USER",
          "avatarSize": "100x100",
          "extra": {},
          "friends": [],
          "name": "User2",
        },
      ],
      "name": "User1",
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
