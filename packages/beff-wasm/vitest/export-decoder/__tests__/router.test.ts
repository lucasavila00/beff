import { Hono } from "hono";
import { it, expect } from "vitest";
import { buildHonoTestClient, registerRouter } from "@beff/hono";
import router from "../router";
import { meta, schema } from "../bff-generated/router";

const app = new Hono();
registerRouter({ app, router, meta, schema });
const bff = buildHonoTestClient<typeof router>(meta, app);

it("get", async () => {
  expect(await bff["/{name}"].get("name")).toMatchInlineSnapshot(`
    {
      "age": 123,
      "name": "name",
    }
  `);
});
