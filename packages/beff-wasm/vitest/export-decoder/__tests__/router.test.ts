import { it, expect } from "vitest";
import { buildHonoTestClient, buildHonoApp } from "@beff/hono";
import router from "../router";
import * as generated from "../bff-generated/router";
import * as clientGenerated from "../bff-generated/client";

const app = buildHonoApp({ router, generated });
const beff = buildHonoTestClient<typeof router>(clientGenerated, app);

it("get", async () => {
  expect(await beff["/{name}"].get("name")).toMatchInlineSnapshot(`
    {
      "age": 123,
      "name": "name",
    }
  `);
});
