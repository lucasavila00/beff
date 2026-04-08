import { expect, it } from "vitest";
import { SchemaPrintingContext } from "@beff/client";
import { Codecs } from "../src/parser";

it("builds an openapi document with shared component refs", () => {
  const ctx = new SchemaPrintingContext({
    refPathTemplate: "#/components/schemas/{name}",
    definitionContainerKey: null,
  });

  const openapi = {
    openapi: "3.1.0",
    info: {
      title: "Ref Aware Test API",
      version: "1.0.0",
    },
    paths: {
      "/users": {
        post: {
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: Codecs.CreateUserRequest.schemaWithContext(ctx),
              },
            },
          },
          responses: {
            "200": {
              description: "created",
              content: {
                "application/json": {
                  schema: Codecs.CreateUserResponse.schemaWithContext(ctx),
                },
              },
            },
          },
        },
      },
      "/users/{id}": {
        patch: {
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: Codecs.UpdateUserRequest.schemaWithContext(ctx),
              },
            },
          },
          responses: {
            "200": {
              description: "updated",
              content: {
                "application/json": {
                  schema: Codecs.User.schemaWithContext(ctx),
                },
              },
            },
          },
        },
      },
      "/users/search": {
        get: {
          responses: {
            "200": {
              description: "search results",
              content: {
                "application/json": {
                  schema: Codecs.SearchUsersResponse.schemaWithContext(ctx),
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: ctx.exportDefinitions(),
    },
  };

  expect(openapi).toMatchInlineSnapshot(`
    {
      "components": {
        "schemas": {
          "$defs": {
            "Address": {
              "additionalProperties": false,
              "properties": {
                "city": {
                  "type": "string",
                },
                "street": {
                  "type": "string",
                },
              },
              "required": [
                "city",
                "street",
              ],
              "type": "object",
            },
            "CreateUserRequest": {
              "additionalProperties": false,
              "properties": {
                "metadata": {
                  "additionalProperties": false,
                  "properties": {
                    "source": {
                      "type": "string",
                    },
                  },
                  "required": [
                    "source",
                  ],
                  "type": "object",
                },
                "user": {
                  "$ref": "#/components/schemas/User",
                },
              },
              "required": [
                "metadata",
                "user",
              ],
              "type": "object",
            },
            "CreateUserResponse": {
              "additionalProperties": false,
              "properties": {
                "user": {
                  "$ref": "#/components/schemas/User",
                },
              },
              "required": [
                "user",
              ],
              "type": "object",
            },
            "SearchUsersResponse": {
              "additionalProperties": false,
              "properties": {
                "items": {
                  "items": {
                    "$ref": "#/components/schemas/User",
                  },
                  "type": "array",
                },
                "primaryAddress": {
                  "$ref": "#/components/schemas/Address",
                },
              },
              "required": [
                "items",
                "primaryAddress",
              ],
              "type": "object",
            },
            "UpdateUserRequest": {
              "additionalProperties": false,
              "properties": {
                "address": {
                  "$ref": "#/components/schemas/Address",
                },
                "id": {
                  "type": "string",
                },
              },
              "required": [
                "address",
                "id",
              ],
              "type": "object",
            },
            "User": {
              "additionalProperties": false,
              "properties": {
                "address": {
                  "$ref": "#/components/schemas/Address",
                },
                "id": {
                  "type": "string",
                },
                "profile": {
                  "additionalProperties": false,
                  "properties": {
                    "displayName": {
                      "type": "string",
                    },
                  },
                  "required": [
                    "displayName",
                  ],
                  "type": "object",
                },
              },
              "required": [
                "address",
                "id",
                "profile",
              ],
              "type": "object",
            },
          },
        },
      },
      "info": {
        "title": "Ref Aware Test API",
        "version": "1.0.0",
      },
      "openapi": "3.1.0",
      "paths": {
        "/users": {
          "post": {
            "requestBody": {
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/CreateUserRequest",
                  },
                },
              },
              "required": true,
            },
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/CreateUserResponse",
                    },
                  },
                },
                "description": "created",
              },
            },
          },
        },
        "/users/search": {
          "get": {
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/SearchUsersResponse",
                    },
                  },
                },
                "description": "search results",
              },
            },
          },
        },
        "/users/{id}": {
          "patch": {
            "requestBody": {
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/UpdateUserRequest",
                  },
                },
              },
              "required": true,
            },
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/User",
                    },
                  },
                },
                "description": "updated",
              },
            },
          },
        },
      },
    }
  `);
});

it("uses generic json schema refs by default", () => {
  const ctx = new SchemaPrintingContext();

  expect(Codecs.User.schemaWithContext(ctx)).toMatchInlineSnapshot(`
    {
      "$ref": "#/$defs/User",
    }
  `);
  expect(ctx.exportDefinitions()).toMatchInlineSnapshot(`
    {
      "$defs": {
        "Address": {
          "additionalProperties": false,
          "properties": {
            "city": {
              "type": "string",
            },
            "street": {
              "type": "string",
            },
          },
          "required": [
            "city",
            "street",
          ],
          "type": "object",
        },
        "User": {
          "additionalProperties": false,
          "properties": {
            "address": {
              "$ref": "#/$defs/Address",
            },
            "id": {
              "type": "string",
            },
            "profile": {
              "additionalProperties": false,
              "properties": {
                "displayName": {
                  "type": "string",
                },
              },
              "required": [
                "displayName",
              ],
              "type": "object",
            },
          },
          "required": [
            "address",
            "id",
            "profile",
          ],
          "type": "object",
        },
      },
    }
  `);
});
