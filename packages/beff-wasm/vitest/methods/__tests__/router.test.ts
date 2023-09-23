import { it, expect } from "vitest";
import { buildHonoApp } from "@beff/hono";
import router from "../router";
import generated from "../bff-generated/router";

const app = buildHonoApp({ router, generated });

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
  expect(await res.json()).toMatchInlineSnapshot(`
    {
      "components": {
        "responses": {
          "DecodeError": {
            "content": {
              "application/json": {
                "schema": {
                  "properties": {
                    "message": {
                      "type": "string",
                    },
                  },
                  "required": [
                    "message",
                  ],
                  "type": "object",
                },
              },
            },
            "description": "Invalid parameters or request body",
          },
          "UnexpectedError": {
            "content": {
              "application/json": {
                "schema": {
                  "properties": {
                    "message": {
                      "type": "string",
                    },
                  },
                  "required": [
                    "message",
                  ],
                  "type": "object",
                },
              },
            },
            "description": "Unexpected Error",
          },
        },
        "schemas": {},
      },
      "info": {
        "title": "No title",
        "version": "0.0.0",
      },
      "openapi": "3.1.0",
      "paths": {
        "/hello": {
          "delete": {
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
                "description": "Successful Operation",
              },
              "422": {
                "$ref": "#/components/responses/DecodeError",
              },
              "500": {
                "$ref": "#/components/responses/UnexpectedError",
              },
            },
          },
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
                "description": "Successful Operation",
              },
              "422": {
                "$ref": "#/components/responses/DecodeError",
              },
              "500": {
                "$ref": "#/components/responses/UnexpectedError",
              },
            },
          },
          "options": {
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
                "description": "Successful Operation",
              },
              "422": {
                "$ref": "#/components/responses/DecodeError",
              },
              "500": {
                "$ref": "#/components/responses/UnexpectedError",
              },
            },
          },
          "patch": {
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
                "description": "Successful Operation",
              },
              "422": {
                "$ref": "#/components/responses/DecodeError",
              },
              "500": {
                "$ref": "#/components/responses/UnexpectedError",
              },
            },
          },
          "post": {
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
                "description": "Successful Operation",
              },
              "422": {
                "$ref": "#/components/responses/DecodeError",
              },
              "500": {
                "$ref": "#/components/responses/UnexpectedError",
              },
            },
          },
          "put": {
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
                "description": "Successful Operation",
              },
              "422": {
                "$ref": "#/components/responses/DecodeError",
              },
              "500": {
                "$ref": "#/components/responses/UnexpectedError",
              },
            },
          },
        },
      },
      "servers": [],
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
  expect(res.status).toMatchInlineSnapshot('200');
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
  expect(res.status).toMatchInlineSnapshot('200');
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
  expect(res.status).toMatchInlineSnapshot('200');
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
  expect(res.status).toMatchInlineSnapshot('200');
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
  expect(res.status).toMatchInlineSnapshot('200');
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
  expect(res.status).toMatchInlineSnapshot('200');
  expect(Object.fromEntries(res.headers.entries())).toMatchInlineSnapshot(`
    {
      "content-type": "application/json; charset=UTF-8",
    }
  `);
  expect(await res.json()).toMatchInlineSnapshot('"Hello!"');
});
