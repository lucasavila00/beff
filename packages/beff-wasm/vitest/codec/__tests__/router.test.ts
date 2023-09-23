import { it, expect } from "vitest";
import { buildHonoApp, buildHonoTestClient } from "@beff/hono";
import router from "../router";
import generated from "../bff-generated/router";
import generatedClient from "../bff-generated/router";

const app = buildHonoApp({ router, generated });
const beff = buildHonoTestClient<typeof router>({
  generated: generatedClient,
  app,
});

it("works", async () => {
  expect(
    (
      await beff["/hello"].post({ a: new Date("2023-09-23T02:49:43.980Z") })
    ).toISOString()
  ).toMatchInlineSnapshot('"2023-09-23T02:49:43.980Z"');
  expect(
    (
      await beff["/hello"].get(new Date("2023-09-23T02:49:43.980Z"))
    ).toISOString()
  ).toMatchInlineSnapshot('"2023-09-23T02:49:43.000Z"');
});
