import { it, expect } from "vitest";
import { buildHonoTestClient, buildHonoApp } from "@beff/hono";
import router from "../router";
import generated from "../bff-generated/router";
import clientGenerated from "../bff-generated/client";

const app = buildHonoApp({ router, generated });
const beff = buildHonoTestClient<typeof router>({
  generated: clientGenerated,
  app,
});

it("get", async () => {
  expect(await beff["/{name}"].get("name")).toMatchInlineSnapshot(`
    [
      {
        "error_kind": "NotTypeof",
        "expected_type": "number",
        "path": [
          "responseBody",
          "User",
          "age",
        ],
      },
      {
        "error_kind": "CodecFailed",
        "expected_type": "Codec::ISO8061",
        "path": [
          "responseBody",
          "User",
          "createdAt",
        ],
      },
      {
        "error_kind": "NotTypeof",
        "expected_type": "string",
        "path": [
          "responseBody",
          "User",
          "name",
        ],
      },
    ]
  `);
});
