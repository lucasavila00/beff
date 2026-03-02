import { it, expect } from "vitest";
import { b } from "@beff/client";
import { AccessLevelCodec } from "../src/parser";


it("parse", () => {
  const T3 = b.Object({
    kind: b.String(),
    x: b.Number(),
  });
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
  expect(T3.name).toMatchInlineSnapshot('"b.Object"');
  expect(
    T3.zod().parse({
      kind: "square",
      x: 1,
    }),
  ).toMatchInlineSnapshot(`
    {
      "kind": "square",
      "x": 1,
    }
  `);
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
});
it("disallow extra properties", () => {
  const T3 = b.Object({
    kind: b.String(),
    x: b.Number(),
  });
  expect(
    T3.safeParse(
      {
        kind: "square",
        x: 1,
        d: 1,
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
            "d",
          ],
          "received": 1,
        },
      ],
      "success": false,
    }
  `);
});
it("safe parse", () => {
  const T3 = b.Object({
    kind: b.String(),
    x: b.Number(),
  });
  expect(
    T3.safeParse({
      kind: "square",
    }),
  ).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected number",
          "path": [
            "x",
          ],
          "received": undefined,
        },
      ],
      "success": false,
    }
  `);
});
it("mix", () => {
  const T3 = b.Object({
    y: AccessLevelCodec,
  });
  expect(
    T3.parse({
      y: "ADMIN",
    }),
  ).toMatchInlineSnapshot(`
    {
      "y": "ADMIN",
    }
  `);
});
it("b.Uint8Array parse", () => {
  const codec = b.Uint8Array();
  const arr = new Uint8Array([1, 2, 3]);
  expect(codec.parse(arr)).toBe(arr);
  expect(codec.name).toMatchInlineSnapshot('"Uint8Array"');
});
it("b.Uint8Array safeParse invalid", () => {
  const codec = b.Uint8Array();
  expect(codec.safeParse([1, 2, 3])).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected Uint8Array",
          "path": [],
          "received": [
            1,
            2,
            3,
          ],
        },
      ],
      "success": false,
    }
  `);
  expect(codec.safeParse("not a typed array")).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected Uint8Array",
          "path": [],
          "received": "not a typed array",
        },
      ],
      "success": false,
    }
  `);
});
it("b.Float64Array parse", () => {
  const codec = b.Float64Array();
  const arr = new Float64Array([1.5, 2.5]);
  expect(codec.parse(arr)).toBe(arr);
});
it("b.Float64Array rejects wrong typed array", () => {
  const codec = b.Float64Array();
  const arr = new Uint8Array([1, 2]);
  expect(codec.safeParse(arr)).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected Float64Array",
          "path": [],
          "received": Uint8Array [
            1,
            2,
          ],
        },
      ],
      "success": false,
    }
  `);
});
it("b.BigInt64Array parse", () => {
  const codec = b.BigInt64Array();
  const arr = new BigInt64Array([1n, 2n]);
  expect(codec.parse(arr)).toBe(arr);
});
it("typed array in object", () => {
  const codec = b.Object({
    data: b.Uint8Array(),
    label: b.String(),
  });
  const data = new Uint8Array([10, 20]);
  expect(
    codec.parse({
      data,
      label: "test",
    }),
  ).toStrictEqual({
    data,
    label: "test",
  });
});
