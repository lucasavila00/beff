import { test, expect } from "vitest";
import { buildHonoLocalClient, buildHonoApp } from "@beff/hono";
import router from "../router";
import generated from "../bff-generated/router";
import clientGenerated from "../bff-generated/router";

const app = buildHonoApp({ router, generated });
const beff = buildHonoLocalClient<typeof router>({
  generated: clientGenerated,
  app,
});

test("get", async () => {
  await expect(beff["/{name}"].get("name")).resolves.toMatchInlineSnapshot(`
    {
      "age": 123,
      "createdAt": 2023-09-22T22:29:39.488Z,
      "name": "name",
    }
  `);
});
