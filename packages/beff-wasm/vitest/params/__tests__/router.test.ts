import { test, expect } from "vitest";
import { buildHonoApp, buildHonoLocalClient } from "@beff/hono";
import router from "../router";
import generated from "../bff-generated/router";
import generatedClient from "../bff-generated/router";

const app = buildHonoApp({ router, generated });
const beff = buildHonoLocalClient<typeof router>({
  generated: generatedClient,
  app,
});

test("docs json", async () => {
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
test("docs html", async () => {
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

test("get", async () => {
  await expect(beff["/hello"].get()).resolves.toMatchInlineSnapshot('"Hello!"');
  const n = await beff["/query-param"].get(123);
  expect(n).toMatchInlineSnapshot("123");
  await expect(beff["/path-param/{name}"].get("the-param")).resolves.toMatchInlineSnapshot('"the-param"');
  await expect(beff["/header-param"].get("the-user-agent")).resolves.toMatchInlineSnapshot(
    '"the-user-agent"'
  );
});

test("post", async () => {
  await expect(beff["/hello"].post()).resolves.toMatchInlineSnapshot('"Hello!"');
  await expect(beff["/path-param/{name}"].post("the-param")).resolves.toMatchInlineSnapshot('"the-param"');
  await expect(beff["/req-body"].post({ a: "the-param" })).resolves.toMatchInlineSnapshot('"the-param"');
});

test("post with body and error", async () => {
  const req = new Request("http://localhost/req-body", {
    method: "POST",
    body: JSON.stringify({ a: 123 }),
  });
  const res = await app.request(req);
  expect(res.status).toMatchInlineSnapshot("422");
  await expect(res.json()).resolves.toMatchInlineSnapshot(
    `
    {
      "message": "#0 (data.a) expected string, received: 123",
    }
  `
  );
});

test("post with body and error, client", async () => {
  await expect(beff["/req-body"].post({ a: 123 as any })).rejects.toMatchInlineSnapshot(
    "[HTTPException: #0 (data.a) expected string, received: 123]"
  );
});

test("coerce", async () => {
  await expect(beff["/path-param-string/{name}"].get("the-param")).resolves.toMatchInlineSnapshot(
    '"the-param"'
  );
  await expect(beff["/path-param-number/{id}"].get(123)).resolves.toMatchInlineSnapshot("123");
  await expect(beff["/path-param-boolean/{flag}"].get(true)).resolves.toMatchInlineSnapshot("true");
  await expect(beff["/path-param-union/{id}"].get(456)).resolves.toMatchInlineSnapshot("456");
});

test("default param", async () => {
  await expect(beff["/with-default"].get()).resolves.toMatchInlineSnapshot("1");
  await expect(beff["/with-default"].post()).resolves.toMatchInlineSnapshot("1");

  await expect(beff["/with-default"].get(5)).resolves.toMatchInlineSnapshot("5");
  await expect(beff["/with-default"].post(5)).resolves.toMatchInlineSnapshot("5");
});
