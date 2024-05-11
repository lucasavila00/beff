import { it, expect } from "vitest";
import {
  PartialObject,
  AccessLevel,
  Extra,
  User,
  Repro1,
  SettingsUpdate,
  PartialSettings,
  LevelAndDSettings,
  OmitSettings,
  RequiredPartialObject,
  DiscriminatedUnion,
  DiscriminatedUnion2,
  DiscriminatedUnion3,
  DiscriminatedUnion4,
  Arr2C,
  ValidCurrencyCodec,
  T3,
} from "../src/parser";
import { Arr2 } from "../src/types";

it("print schema", () => {
  expect(T3.jsonSchema).toMatchInlineSnapshot(`
    {
      "anyOf": [
        {
          "additionalProperties": false,
          "properties": {
            "kind": {
              "const": "square",
            },
            "x": {
              "type": "number",
            },
          },
          "required": [
            "kind",
            "x",
          ],
          "type": "object",
        },
        {
          "additionalProperties": false,
          "properties": {
            "kind": {
              "const": "triangle",
            },
            "x": {
              "type": "number",
            },
            "y": {
              "type": "number",
            },
          },
          "required": [
            "kind",
            "x",
            "y",
          ],
          "type": "object",
        },
      ],
    }
  `);
});

it("exclude object", () => {
  expect(
    T3.parse({
      kind: "square",
      x: 1,
    })
  ).toMatchInlineSnapshot(`
    {
      "kind": "square",
      "x": 1,
    }
  `);
});
it("disallow extra properties", () => {
  expect(
    T3.parse(
      {
        kind: "square",
        x: 1,
      },
      {
        disallowExtraProperties: true,
      }
    )
  ).toMatchInlineSnapshot(`
  {
    "kind": "square",
    "x": 1,
  }
`);
  expect(
    T3.safeParse(
      {
        kind: "square",
        x: 1,
        y: 1,
      },
      {
        disallowExtraProperties: true,
      }
    )
  ).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "extra property",
          "path": [
            "y",
          ],
          "received": 1,
        },
      ],
      "success": false,
    }
  `);
});
it("exclude object", () => {
  expect(
    T3.safeParse({
      kind: "circle",
      radius: 1,
    })
  ).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected one of \\"square\\", \\"triangle\\"",
          "path": [
            "kind",
          ],
          "received": "circle",
        },
      ],
      "success": false,
    }
  `);
});
it("Custom Format", () => {
  expect(ValidCurrencyCodec.parse("USD")).toMatchInlineSnapshot('"USD"');
});
it("Custom Format", () => {
  expect(ValidCurrencyCodec.safeParse("asdasdadasd")).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string with format \\"ValidCurrency\\"",
          "path": [],
          "received": "asdasdadasd",
        },
      ],
      "success": false,
    }
  `);
});
it("Arr spread", () => {
  expect(Arr2C.parse("C" satisfies Arr2)).toMatchInlineSnapshot('"C"');
});
it("DiscriminatedUnion3", () => {
  const validD3: DiscriminatedUnion4 = {
    type: "a",
    a: {
      subType: "a1",
      a1: "a",
    },
  };
  expect(DiscriminatedUnion4.parse(validD3)).toMatchInlineSnapshot(`
    {
      "a": {
        "a1": "a",
        "subType": "a1",
      },
      "type": "a",
    }
  `);
});
it("DiscriminatedUnion3", () => {
  const validD3: DiscriminatedUnion3 = {
    type: "a",
    a1: "a",
  };
  expect(DiscriminatedUnion3.parse(validD3)).toMatchInlineSnapshot(`
    {
      "a1": "a",
      "type": "a",
    }
  `);
});
it("DiscriminatedUnion", () => {
  const validD: DiscriminatedUnion2 = {
    type: "d",
    valueD: 1,
  };
  expect(DiscriminatedUnion2.parse(validD)).toMatchInlineSnapshot(`
    {
      "type": "d",
      "valueD": 1,
    }
  `);

  const validD2: DiscriminatedUnion2 = {
    valueD: 1,
  };
  expect(DiscriminatedUnion2.parse(validD2)).toMatchInlineSnapshot(`
    {
      "type": undefined,
      "valueD": 1,
    }
  `);
  const valid: DiscriminatedUnion = {
    type: "a",
    subType: "a1",
    a1: "a",
  };
  expect(DiscriminatedUnion.parse(valid)).toMatchInlineSnapshot(`
    {
      "a1": "a",
      "a11": undefined,
      "subType": "a1",
      "type": "a",
    }
  `);
  const valid3: DiscriminatedUnion = {
    type: "a",
    subType: "a1",
    a1: "a",
    a11: "a",
  };
  expect(DiscriminatedUnion.parse(valid3)).toMatchInlineSnapshot(`
    {
      "a1": "a",
      "a11": "a",
      "subType": "a1",
      "type": "a",
    }
  `);
  const invalid4 = {
    type: "a",
    subType: "a1",
    a1: "a",
    a11: 123,
  };
  expect(DiscriminatedUnion.safeParse(invalid4)).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string",
          "path": [
            "a11",
          ],
          "received": 123,
        },
      ],
      "success": false,
    }
  `);
  const valid2: DiscriminatedUnion = {
    type: "b",
    value: 1,
  };
  expect(DiscriminatedUnion.parse(valid2)).toMatchInlineSnapshot(`
    {
      "type": "b",
      "value": 1,
    }
  `);

  expect(
    DiscriminatedUnion.safeParse({
      type: "a",
    })
  ).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected discriminator key \\"subType\\"",
          "path": [],
          "received": {
            "type": "a",
          },
        },
      ],
      "success": false,
    }
  `);
  expect(
    DiscriminatedUnion.safeParse({
      type: "c",
    })
  ).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected one of \\"a\\", \\"b\\"",
          "path": [
            "type",
          ],
          "received": "c",
        },
      ],
      "success": false,
    }
  `);
  expect(DiscriminatedUnion.safeParse({})).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected discriminator key \\"type\\"",
          "path": [],
          "received": {},
        },
      ],
      "success": false,
    }
  `);
});
it("repro1", () => {
  expect(Repro1.parse({})).toMatchInlineSnapshot(`
    {
      "sizes": undefined,
    }
  `);
});
it("PartialObject", () => {
  expect(PartialObject.parse({})).toMatchInlineSnapshot(`
    {
      "a": undefined,
      "b": undefined,
    }
  `);
});
it("PartialSettings", () => {
  expect(PartialSettings.parse({})).toMatchInlineSnapshot(`
    {
      "a": undefined,
      "d": undefined,
      "level": undefined,
    }
  `);
});
it("LevelAndDSettings", () => {
  const valid: LevelAndDSettings = {
    level: "a",
    d: {
      tag: "d",
    },
  };
  expect(LevelAndDSettings.parse(valid)).toMatchInlineSnapshot(`
    {
      "d": {
        "tag": "d",
      },
      "level": "a",
    }
  `);
});
it("OmitSettings", () => {
  const valid: OmitSettings = {
    level: "a",
    d: {
      tag: "d",
    },
  };
  expect(OmitSettings.parse(valid)).toMatchInlineSnapshot(`
    {
      "d": {
        "tag": "d",
      },
      "level": "a",
    }
  `);
});
it("RequiredPartialObject", () => {
  const valid: RequiredPartialObject = {
    a: "a",
    b: 1,
  };
  expect(RequiredPartialObject.parse(valid)).toMatchInlineSnapshot(`
    {
      "a": "a",
      "b": 1,
    }
  `);
});
it("OneOfSettingsUpdate", () => {
  const valid: SettingsUpdate = {
    tag: "d",
  };
  expect(SettingsUpdate.parse(valid)).toMatchInlineSnapshot(`
    {
      "tag": "d",
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
it("to zod works", () => {
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
  expect(User.zod().parse(valid)).toMatchInlineSnapshot(`
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
  expect(User.zod().safeParse(invalid)).toMatchInlineSnapshot(`
    {
      "error": [ZodError: [
      {
        "code": "custom",
        "message": "#0 (accessLevel) expected one of \\"ADMIN\\", \\"USER\\", received: undefined | #1 (avatarSize) expected string, received: undefined | #2 (extra) expected object, received: undefined | #3 (friends[0].accessLevel) expected one of \\"ADMIN\\", \\"USER\\", received: undefined | #4 (friends[0].avatarSize) expected string, received: undefined | #5 (friends[0].extra) expected object, received: undefined | #6 (friends[0].friends) expected array, received: undefined",
        "fatal": true,
        "path": []
      }
    ]],
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
          "message": "expected one of \\"ADMIN\\", \\"USER\\"",
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
          "message": "expected one of \\"ADMIN\\", \\"USER\\"",
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
