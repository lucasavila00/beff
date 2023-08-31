import { Hono } from "hono";
import { it, expect } from "vitest";
import { registerRouter } from "../bff-generated";
import router from "../router";

const app = new Hono();
registerRouter({ app, router });

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

it("gets hello", async () => {
  const req = new Request("http://localhost/hello", {
    method: "GET",
  });
  const res = await app.request(req);
  expect(res.status).toMatchInlineSnapshot("200");
  expect(Object.fromEntries(res.headers.entries())).toMatchInlineSnapshot(`
    {
      "content-type": "application/json; charset=UTF-8",
    }
  `);
  expect(await res.json()).toMatchInlineSnapshot('"Hello!"');
});

it("post hello", async () => {
  const req = new Request("http://localhost/hello", {
    method: "POST",
  });
  const res = await app.request(req);
  expect(res.status).toMatchInlineSnapshot("200");
  expect(Object.fromEntries(res.headers.entries())).toMatchInlineSnapshot(`
    {
      "content-type": "application/json; charset=UTF-8",
    }
  `);
  expect(await res.json()).toMatchInlineSnapshot('"Hello!"');
});

it("PUT hello", async () => {
  const req = new Request("http://localhost/hello", {
    method: "PUT",
  });
  const res = await app.request(req);
  expect(res.status).toMatchInlineSnapshot("200");
  expect(Object.fromEntries(res.headers.entries())).toMatchInlineSnapshot(`
    {
      "content-type": "application/json; charset=UTF-8",
    }
  `);
  expect(await res.json()).toMatchInlineSnapshot('"Hello!"');
});

it("DELETE hello", async () => {
  const req = new Request("http://localhost/hello", {
    method: "DELETE",
  });
  const res = await app.request(req);
  expect(res.status).toMatchInlineSnapshot("200");
  expect(Object.fromEntries(res.headers.entries())).toMatchInlineSnapshot(`
    {
      "content-type": "application/json; charset=UTF-8",
    }
  `);
  expect(await res.json()).toMatchInlineSnapshot('"Hello!"');
});

it("PATCH hello", async () => {
  const req = new Request("http://localhost/hello", {
    method: "PATCH",
  });
  const res = await app.request(req);
  expect(res.status).toMatchInlineSnapshot("200");
  expect(Object.fromEntries(res.headers.entries())).toMatchInlineSnapshot(`
    {
      "content-type": "application/json; charset=UTF-8",
    }
  `);
  expect(await res.json()).toMatchInlineSnapshot('"Hello!"');
});

it("OPTIONS hello", async () => {
  const req = new Request("http://localhost/hello", {
    method: "OPTIONS",
  });
  const res = await app.request(req);
  expect(res.status).toMatchInlineSnapshot("200");
  expect(Object.fromEntries(res.headers.entries())).toMatchInlineSnapshot(`
    {
      "content-type": "application/json; charset=UTF-8",
    }
  `);
  expect(await res.json()).toMatchInlineSnapshot('"Hello!"');
});
