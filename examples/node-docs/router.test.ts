import { test, expect } from "vitest";
import { buildHonoTestClient, buildHonoApp } from "@beff/hono";
import router from "./router";
import generated from "./generated/router";

const app = buildHonoApp({
  router,
  generated,
});

const client = buildHonoTestClient<typeof router>({ app, generated });

test("get /", async () => {
  const result = await client["/"].get();
  expect(result).toMatchInlineSnapshot(`
    {
      "Hello": "World",
    }
  `);
});
test("get /items/{item_id}", async () => {
  const result = await client["/items/{item_id}"].get(
    "the item id",
    "query param"
  );
  expect(result).toMatchInlineSnapshot(`
    {
      "item_id": "the item id",
      "q": "query param",
    }
  `);
});
