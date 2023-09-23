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
      "data": {
        "friends": [
          {
            "friends": [],
            "name": "User2",
          },
        ],
        "name": "User1",
      },
      "success": true,
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
