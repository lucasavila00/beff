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
    {
      "age": 123,
      "name": "name",
    }
  `);
});
