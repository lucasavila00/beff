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
  NonNegativeNumberCodec,
  T3,
  AvatarSize,
  AccessLevelTpl,
  AccessLevelTpl2,
  Version,
  Version2,
  AObject,
  BObject,
  AllTs,
  TransportedValue,
  ImportEnumTypeofCodec,
  BigIntCodec,
  TupleCodec,
  TupleCodecRest,
  StringArrCodec,
  OnlyAKeyCodec,
  ObjectWithArrCodec,
  PartialReproCodec,
} from "../src/parser";
import { Arr2 } from "../src/types";

it("PartialRepro bug", () => {
  expect(PartialReproCodec.parse({})).toMatchInlineSnapshot("{}");
  expect(PartialReproCodec.parse({ a: "a" })).toMatchInlineSnapshot(`
    {
      "a": "a",
    }
  `);
});
it("TransportedValue bug", () => {
  expect(TransportedValue.parse(null)).toEqual(null);
  expect(TransportedValue.parse(undefined)).toEqual(undefined);
  expect(TransportedValue.parse("")).toEqual("");
  expect(TransportedValue.parse(["abc"])).toStrictEqual(["abc"]);
  expect(TransportedValue.parse([123])).toStrictEqual([123]);
  expect(TransportedValue.parse(["123"])).toStrictEqual(["123"]);
  expect(TransportedValue.parse(["undefined"])).toStrictEqual(["undefined"]);
});

it("import enum typeof", () => {
  expect(ImportEnumTypeofCodec.safeParse("ADMIN")).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected object",
          "path": [],
          "received": "ADMIN",
        },
      ],
      "success": false,
    }
  `);
});

it("BigIntCodec", () => {
  expect(BigIntCodec.parse(123n)).toMatchInlineSnapshot("123n");
});
it("TupleCodec", () => {
  expect(TupleCodec.safeParse([1])).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected number",
          "path": [
            "[1]",
          ],
          "received": undefined,
        },
        {
          "message": "expected number",
          "path": [
            "[2]",
          ],
          "received": undefined,
        },
      ],
      "success": false,
    }
  `);
});
it("TupleCodecRest", () => {
  expect(TupleCodecRest.safeParse([1, 2, 3])).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string",
          "path": [
            "[2]",
          ],
          "received": 3,
        },
      ],
      "success": false,
    }
  `);
});
it("StringArrCodec", () => {
  expect(StringArrCodec.safeParse([1, 2, 3])).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string",
          "path": [
            "[0]",
          ],
          "received": 1,
        },
        {
          "message": "expected string",
          "path": [
            "[1]",
          ],
          "received": 2,
        },
        {
          "message": "expected string",
          "path": [
            "[2]",
          ],
          "received": 3,
        },
      ],
      "success": false,
    }
  `);
});
it("OnlyAKeyCodec", () => {
  expect(JSON.stringify(OnlyAKeyCodec.parse({ A: "show", B: "hide" }))).toBe(`{"A":"show"}`);
});

it("ObjectWithArrCodec", () => {
  expect(ObjectWithArrCodec.safeParse({})).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected array",
          "path": [
            "a",
          ],
          "received": undefined,
        },
      ],
      "success": false,
    }
  `);
});

it("tpl", () => {
  expect(Version2.parse("v1.2.3")).toMatchInlineSnapshot('"v1.2.3"');
  expect(Version2.safeParse("UNKNOWN")).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string matching v\${number}.\${number}.\${number}",
          "path": [],
          "received": "UNKNOWN",
        },
      ],
      "success": false,
    }
  `);
  expect(Version.parse("1.2.3")).toMatchInlineSnapshot('"1.2.3"');
  expect(Version.safeParse("UNKNOWN")).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string matching \${number}.\${number}.\${number}",
          "path": [],
          "received": "UNKNOWN",
        },
      ],
      "success": false,
    }
  `);
  expect(AccessLevelTpl2.parse("ADMIN Admin")).toMatchInlineSnapshot('"ADMIN Admin"');
  expect(AccessLevelTpl2.safeParse("UNKNOWN")).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string matching (\\"ADMIN Admin\\" | \\"USER User\\")",
          "path": [],
          "received": "UNKNOWN",
        },
      ],
      "success": false,
    }
  `);
  expect(AccessLevelTpl.parse("ADMIN")).toMatchInlineSnapshot('"ADMIN"');
  expect(AccessLevelTpl.safeParse("UNKNOWN")).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string matching (\\"ADMIN\\" | \\"USER\\")",
          "path": [],
          "received": "UNKNOWN",
        },
      ],
      "success": false,
    }
  `);

  expect(AvatarSize.parse("1x1")).toMatchInlineSnapshot('"1x1"');
  expect(AvatarSize.parse("1.0x1.0")).toMatchInlineSnapshot('"1.0x1.0"');
  expect(AvatarSize.safeParse("abc")).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string matching \${number}x\${number}",
          "path": [],
          "received": "abc",
        },
      ],
      "success": false,
    }
  `);
  expect(AvatarSize.safeParse("1xa")).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string matching \${number}x\${number}",
          "path": [],
          "received": "1xa",
        },
      ],
      "success": false,
    }
  `);
});
it("exclude object", () => {
  expect(
    T3.parse({
      kind: "square",
      x: 1,
    }),
  ).toMatchInlineSnapshot(`
    {
      "kind": "square",
      "x": 1,
    }
  `);
});
it("import * ", () => {
  const x: AObject = {
    tag: "a",
  };

  expect(AObject.parse(x)).toMatchInlineSnapshot(`
    {
      "tag": "a",
    }
  `);
  const x2: BObject = {
    tag: "b",
  };

  expect(BObject.parse(x2)).toMatchInlineSnapshot(`
    {
      "tag": "b",
    }
  `);

  expect(AllTs.parse("b")).toMatchInlineSnapshot('"b"');
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
      },
    ),
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
      },
    ),
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
    }),
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

it("custom number format", () => {
  expect(NonNegativeNumberCodec.parse(123)).toBe(123);
  expect(NonNegativeNumberCodec.safeParse(-123)).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected number with format \\"NonNegativeNumber\\"",
          "path": [],
          "received": -123,
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
          "errors": [
            {
              "message": "expected nullish value",
              "path": [],
              "received": 123,
            },
            {
              "message": "expected string",
              "path": [],
              "received": 123,
            },
          ],
          "isUnionError": true,
          "message": "expected one of",
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
    }),
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
    }),
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
  expect(Repro1.parse({})).toMatchInlineSnapshot("{}");
});
it("PartialObject", () => {
  expect(PartialObject.parse({})).toMatchInlineSnapshot("{}");
});
it("PartialSettings", () => {
  expect(PartialSettings.parse({})).toMatchInlineSnapshot("{}");
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
  expect(RequiredPartialObject.name).toMatchInlineSnapshot('"RequiredPartialObject"');

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
        "message": "#0 (accessLevel) expected one of \\"ADMIN\\", \\"USER\\", received: undefined | #1 (avatarSize) expected string matching \${number}x\${number}, received: undefined | #2 (extra) expected object, received: undefined | #3 (friends[0].accessLevel) expected one of \\"ADMIN\\", \\"USER\\", received: undefined | #4 (friends[0].avatarSize) expected string matching \${number}x\${number}, received: undefined | #5 (friends[0].extra) expected object, received: undefined | #6 (friends[0].friends) expected array, received: undefined",
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
  expect(User.name).toMatchInlineSnapshot('"User"');
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
          "message": "expected string matching \${number}x\${number}",
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
          "message": "expected string matching \${number}x\${number}",
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
