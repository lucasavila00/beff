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
  expect(await bff["GET/hello1"]()).toMatchInlineSnapshot('"Hello!"');
  expect(await bff["GET/hello2"]()).toMatchInlineSnapshot('"Hello!"');
  expect(await bff["GET/hello3"]()).toMatchInlineSnapshot('"Hello!"');
  expect(await bff["GET/hello4"]()).toMatchInlineSnapshot('"Hello!"');
  expect(await bff["GET/hello5"]()).toMatchInlineSnapshot('"Hello!"');
});
