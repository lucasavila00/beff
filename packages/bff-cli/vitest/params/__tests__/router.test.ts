import { Hono } from "hono";
import { it, expect } from "vitest";
import {
  registerRouter,
  buildFetchClient,
  ClientFromRouter,
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
  expect(await bff["/hello"].get()).toMatchInlineSnapshot('"Hello!"');
  const n = await bff["/query-param"].get(123);
  expect(n).toMatchInlineSnapshot("123");
  expect(
    await bff["/path-param/{name}"].get("the-param")
  ).toMatchInlineSnapshot('"the-param"');
  expect(
    await bff["/header-param"].get("the-user-agent")
  ).toMatchInlineSnapshot('"the-user-agent"');
  expect(await bff["/cookie-param"].get("the-cookie")).toMatchInlineSnapshot(
    '"the-cookie"'
  );
});

it("post", async () => {
  expect(await bff["/hello"].post()).toMatchInlineSnapshot('"Hello!"');
  expect(
    await bff["/path-param/{name}"].post("the-param")
  ).toMatchInlineSnapshot('"the-param"');
  expect(await bff["/req-body"].post({ a: "the-param" })).toMatchInlineSnapshot(
    '"the-param"'
  );
});

it("post with body and error", async () => {
  const req = new Request("http://localhost/req-body", {
    method: "POST",
    body: JSON.stringify({ a: 123 }),
  });
  const res = await app.request(req);
  expect(res.status).toMatchInlineSnapshot("422");
  expect(await res.text()).toMatchInlineSnapshot(
    '"Decoder error at Request Body.a: expected string."'
  );
});

it("post with body and error, client", async () => {
  try {
    await bff["/req-body"].post({ a: 123 as any });
  } catch (e) {
    expect(e.message).toMatchInlineSnapshot(
      '"Decoder error at Request Body.a: expected string."'
    );
  }
});

it("coerce", async () => {
  expect(
    await bff["/path-param-string/{name}"].get("the-param")
  ).toMatchInlineSnapshot('"the-param"');
  expect(await bff["/path-param-number/{id}"].get(123)).toMatchInlineSnapshot(
    "123"
  );
  expect(
    await bff["/path-param-boolean/{flag}"].get(true)
  ).toMatchInlineSnapshot("true");
  expect(await bff["/path-param-union/{id}"].get(456)).toMatchInlineSnapshot(
    '"456"'
  );
});
