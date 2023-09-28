import { test, expect } from "vitest";
import { buildHonoLocalClient, buildHonoApp } from "@beff/hono";
import router from "../router";
import generated from "../bff-generated/router";
import clientGenerated from "../bff-generated/router";

const app = buildHonoApp({ router, generated });
const bff = buildHonoLocalClient<typeof router>({
  generated: clientGenerated,
  app,
});

test("get", async () => {
  await expect(bff["/hello1"].get()).resolves.toMatchInlineSnapshot('"Hello!"');
  await expect(bff["/hello2"].get()).resolves.toMatchInlineSnapshot('"Hello!"');
  await expect(bff["/hello3"].get()).resolves.toMatchInlineSnapshot('"Hello!"');
  await expect(bff["/hello4"].get()).resolves.toMatchInlineSnapshot('"Hello!"');
  await expect(bff["/hello5"].get()).resolves.toMatchInlineSnapshot('"Hello!"');
  await expect(bff["/hello100"].get()).resolves.toMatchInlineSnapshot('"Hello!"');

  await expect(router["/hello1"].get()).resolves.toMatchInlineSnapshot('"Hello!"');
  await expect(router["/hello2"].get()).resolves.toMatchInlineSnapshot('"Hello!"');
  await expect(router["/hello3"].get()).resolves.toMatchInlineSnapshot('"Hello!"');
  expect(router["/hello4"].get()).toMatchInlineSnapshot('"Hello!"');
  expect(router["/hello5"].get()).toMatchInlineSnapshot('"Hello!"');
});
