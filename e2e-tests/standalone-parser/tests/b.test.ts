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
    })
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
    })
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
      }
    )
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
      }
    )
  ).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "Extra property",
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
    })
  ).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "Expected number",
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
    })
  ).toMatchInlineSnapshot(`
    {
      "y": "ADMIN",
    }
  `);
});
