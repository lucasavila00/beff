import { it, expect } from "vitest";
import { buildHonoApp, buildHonoTestClient } from "@beff/hono";
import router from "../router";
import generated from "../bff-generated/router";
import generatedClient from "../bff-generated/client";

const app = buildHonoApp({ router, generated });
const beff = buildHonoTestClient<typeof router>(generatedClient, app);

it("docs json", async () => {
  const req = new Request("http://localhost/v3/openapi.json", {
    method: "GET",
  });
  const res = await app.request(req);
  expect(res.status).toMatchInlineSnapshot("200");
  expect(Object.fromEntries(res.headers.entries())).toMatchInlineSnapshot(`
    {
      "content-type": "application/json; charset=UTF-8",
    }
  `);
});
it("docs html", async () => {
  const req = new Request("http://localhost/docs", {
    method: "GET",
  });
  const res = await app.request(req);
  expect(res.status).toMatchInlineSnapshot("200");
  expect(Object.fromEntries(res.headers.entries())).toMatchInlineSnapshot(`
    {
      "content-type": "text/html; charset=UTF-8",
    }
  `);
});

it("get", async () => {
  expect(await beff["/hello"].get()).toMatchInlineSnapshot('"Hello!"');
  const n = await beff["/query-param"].get(123);
  expect(n).toMatchInlineSnapshot("123");
  expect(
    await beff["/path-param/{name}"].get("the-param")
  ).toMatchInlineSnapshot('"the-param"');
  expect(
    await beff["/header-param"].get("the-user-agent")
  ).toMatchInlineSnapshot('"the-user-agent"');
  expect(await beff["/cookie-param"].get("the-cookie")).toMatchInlineSnapshot(
    '"the-cookie"'
  );
});

it("post", async () => {
  expect(await beff["/hello"].post()).toMatchInlineSnapshot('"Hello!"');
  expect(
    await beff["/path-param/{name}"].post("the-param")
  ).toMatchInlineSnapshot('"the-param"');
  expect(
    await beff["/req-body"].post({ a: "the-param" })
  ).toMatchInlineSnapshot('"the-param"');
});

it("post with body and error", async () => {
  const req = new Request("http://localhost/req-body", {
    method: "POST",
    body: JSON.stringify({ a: 123 }),
  });
  const res = await app.request(req);
  expect(res.status).toMatchInlineSnapshot("422");
  expect(await res.json()).toMatchInlineSnapshot(
    `
    {
      "message": "Error #1: Expected string ~ Path: requestBody.a ~ Received: 123",
    }
  `
  );
});

it("post with body and error, client", async () => {
  try {
    await beff["/req-body"].post({ a: 123 as any });
  } catch (e) {
    expect(e).toMatchInlineSnapshot(
      "[HTTPException: Error #1: Expected string ~ Path: requestBody.a ~ Received: 123]"
    );
  }
});

it("coerce", async () => {
  expect(
    await beff["/path-param-string/{name}"].get("the-param")
  ).toMatchInlineSnapshot('"the-param"');
  expect(await beff["/path-param-number/{id}"].get(123)).toMatchInlineSnapshot(
    "123"
  );
  expect(
    await beff["/path-param-boolean/{flag}"].get(true)
  ).toMatchInlineSnapshot("true");
  expect(await beff["/path-param-union/{id}"].get(456)).toMatchInlineSnapshot(
    '"456"'
  );
});
