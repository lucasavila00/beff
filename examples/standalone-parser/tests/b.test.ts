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
