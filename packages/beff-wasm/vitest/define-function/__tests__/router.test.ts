import { Hono } from "hono";
import { it, expect } from "vitest";
import { buildHonoTestClient, buildHonoApp } from "@beff/hono";
import router from "../router";
import * as generated from "../bff-generated/router";
import * as clientGenerated from "../bff-generated/client";

const app = buildHonoApp({ router, generated });
const bff = buildHonoTestClient<typeof router>(clientGenerated, app);

it("get", async () => {
  expect(await bff["/hello1"].get()).toMatchInlineSnapshot('"Hello!"');
  expect(await bff["/hello2"].get()).toMatchInlineSnapshot('"Hello!"');
  expect(await bff["/hello3"].get()).toMatchInlineSnapshot('"Hello!"');
  expect(await bff["/hello4"].get()).toMatchInlineSnapshot('"Hello!"');
  expect(await bff["/hello5"].get()).toMatchInlineSnapshot('"Hello!"');

  expect(await router["/hello1"].get()).toMatchInlineSnapshot('"Hello!"');
  expect(await router["/hello2"].get()).toMatchInlineSnapshot('"Hello!"');
  expect(await router["/hello3"].get()).toMatchInlineSnapshot('"Hello!"');
  expect(await router["/hello4"].get()).toMatchInlineSnapshot('"Hello!"');
  expect(await router["/hello5"].get()).toMatchInlineSnapshot('"Hello!"');
});
