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
  expect(await res.json()).toMatchInlineSnapshot(
    `
    {
      "components": {
        "schemas": {},
      },
      "info": {},
      "openapi": "3.1.0",
      "paths": {
        "/cookie-param": {
          "get": {
            "parameters": [
              {
                "in": "cookie",
                "name": "ads_ids",
                "required": true,
                "schema": {
                  "type": "string",
                },
              },
            ],
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "string",
                    },
                  },
                },
                "description": "successful operation",
              },
            },
          },
        },
        "/header-param": {
          "get": {
            "parameters": [
              {
                "in": "header",
                "name": "user_agent",
                "required": true,
                "schema": {
                  "type": "string",
                },
              },
            ],
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "string",
                    },
                  },
                },
                "description": "successful operation",
              },
            },
          },
        },
        "/hello": {
          "get": {
            "parameters": [],
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "string",
                    },
                  },
                },
                "description": "successful operation",
              },
            },
          },
        },
        "/path-param/{name}": {
          "get": {
            "parameters": [
              {
                "in": "path",
                "name": "name",
                "required": true,
                "schema": {
                  "type": "string",
                },
              },
            ],
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "string",
                    },
                  },
                },
                "description": "successful operation",
              },
            },
          },
        },
        "/query-param": {
          "get": {
            "parameters": [
              {
                "in": "query",
                "name": "limit",
                "required": true,
                "schema": {
                  "type": "number",
                },
              },
            ],
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "number",
                    },
                  },
                },
                "description": "successful operation",
              },
            },
          },
        },
      },
      "servers": [],
    }
  `
  );
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

it("gets with path param", async () => {
  const req = new Request("http://localhost/path-param/the-param", {
    method: "GET",
  });
  const res = await app.request(req);
  expect(res.status).toMatchInlineSnapshot("200");
  expect(await res.json()).toMatchInlineSnapshot('"the-param"');
});

it("gets with query param", async () => {
  const req = new Request("http://localhost/query-param?limit=123", {
    method: "GET",
  });
  const res = await app.request(req);
  expect(res.status).toMatchInlineSnapshot("200");
  expect(await res.json()).toMatchInlineSnapshot("123");
});

it("gets with header param", async () => {
  const req = new Request("http://localhost/header-param", {
    method: "GET",
    headers: {
      user_agent: "the-user-agent",
    },
  });
  const res = await app.request(req);
  expect(res.status).toMatchInlineSnapshot("200");
  expect(await res.json()).toMatchInlineSnapshot('"the-user-agent"');
});

it("gets with cookie param", async () => {
  const req = new Request("http://localhost/cookie-param", {
    method: "GET",
    headers: {
      Cookie: "ads_ids=asd",
    },
  });
  const res = await app.request(req);
  expect(res.status).toMatchInlineSnapshot("200");
  expect(await res.json()).toMatchInlineSnapshot('"asd"');
});
