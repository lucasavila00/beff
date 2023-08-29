import { Hono } from "hono";
import { it, expect } from "vitest";
import {
  ClientFromRouter,
  buildFetchClient,
  registerRouter,
} from "../bff-generated";
import router from "../router";

const app = new Hono();
registerRouter({ app, router });

const bff: ClientFromRouter<typeof router> = buildFetchClient(
  (url, info) => app.fetch(new Request(url, info)),
  {
    baseUrl: "http://localhost",
  }
);
it("get", async () => {
  expect(await bff["/hello1"].get()).toMatchInlineSnapshot('"Hello!"');
  expect(await bff["/hello2"].get()).toMatchInlineSnapshot('"Hello!"');
  expect(await bff["/hello3"].get()).toMatchInlineSnapshot('"Hello!"');
  expect(await bff["/hello4"].get()).toMatchInlineSnapshot('"Hello!"');
  expect(await bff["/hello5"].get()).toMatchInlineSnapshot('"Hello!"');
});
