import { Hono } from "hono";
import { it, expect } from "vitest";
import { registerRouter } from "../bff-generated";
import router from "../router";

const app = new Hono();
registerRouter({ app, router });
it("works", async () => {
  const req = new Request("http://localhost/hello", {
    method: "GET",
  });
  const res = await app.request(req);
  expect(res.status).toMatchInlineSnapshot("200");
  expect(await res.json()).toMatchInlineSnapshot('"hello"');
});

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
        "/{name}": {
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
});
