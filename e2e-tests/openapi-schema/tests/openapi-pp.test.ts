import { expect, it } from "vitest";
import { SchemaPrintingContext } from "@beff/client";
import { Codecs } from "../src/parser";

const createOpenApiContext = () =>
  new SchemaPrintingContext({
    refPathTemplate: "#/components/schemas/{name}",
    definitionContainerKey: null,
  });

it("flattens record-like objects compared to the raw schema output", () => {
  expect(Codecs.OpenApiCompatRecordPayload.schema()).toMatchInlineSnapshot(`
    {
      "additionalProperties": false,
      "properties": {
        "payload": {
          "allOf": [
            {
              "properties": {},
              "required": [],
              "type": "object",
            },
            {
              "additionalProperties": {},
              "propertyNames": {
                "type": "string",
              },
              "type": "object",
            },
          ],
        },
      },
      "required": [
        "payload",
      ],
      "type": "object",
    }
  `);

  const ctx = createOpenApiContext();
  expect(Codecs.OpenApiCompatRecordPayload.schemaWithContext(ctx)).toMatchInlineSnapshot(`
    {
      "$ref": "#/components/schemas/OpenApiCompatRecordPayload",
    }
  `);

  expect(ctx.exportDefinitions()).toMatchInlineSnapshot(`
    {
      "$defs": {
        "OpenApiCompatRecordPayload": {
          "additionalProperties": false,
          "properties": {
            "payload": {
              "allOf": [
                {
                  "properties": {},
                  "type": "object",
                },
                {
                  "additionalProperties": {},
                  "type": "object",
                },
              ],
            },
          },
          "required": [
            "payload",
          ],
          "type": "object",
        },
      },
    }
  `);
});

it("rewrites null unions into optional properties only in the OpenAPI post-processed output", () => {
  expect(Codecs.OpenApiCompatOptionalizedPayload.schema()).toMatchInlineSnapshot(`
    {
      "additionalProperties": false,
      "properties": {
        "maybeEnum": {
          "anyOf": [
            {
              "type": "null",
            },
            {
              "const": "fallback",
            },
            {
              "const": "primary",
            },
          ],
        },
        "maybeText": {
          "anyOf": [
            {
              "type": "null",
            },
            {
              "type": "string",
            },
          ],
        },
        "onlyNull": {
          "type": "null",
        },
      },
      "required": [
        "maybeEnum",
        "maybeText",
        "onlyNull",
      ],
      "type": "object",
    }
  `);

  const ctx = createOpenApiContext();
  expect(Codecs.OpenApiCompatOptionalizedPayload.schemaWithContext(ctx)).toMatchInlineSnapshot(`
    {
      "$ref": "#/components/schemas/OpenApiCompatOptionalizedPayload",
    }
  `);

  expect(ctx.exportDefinitions()).toMatchInlineSnapshot(`
    {
      "$defs": {
        "OpenApiCompatOptionalizedPayload": {
          "additionalProperties": false,
          "properties": {
            "maybeEnum": {
              "anyOf": [
                {
                  "enum": [
                    "fallback",
                  ],
                  "type": "string",
                },
                {
                  "enum": [
                    "primary",
                  ],
                  "type": "string",
                },
              ],
            },
            "maybeText": {
              "type": "string",
            },
            "onlyNull": {
              "type": "null",
            },
          },
          "required": [
            "onlyNull",
          ],
          "type": "object",
        },
      },
    }
  `);
});

it("normalizes recursive optional refs compared to the raw schema output", () => {
  expect(Codecs.RecursiveEnvelope.schema()).toMatchInlineSnapshot(`
    {
      "additionalProperties": false,
      "properties": {
        "previous": {
          "anyOf": [
            {},
            {
              "type": "null",
            },
          ],
        },
        "root": {
          "additionalProperties": false,
          "properties": {
            "children": {
              "items": {},
              "type": "array",
            },
            "value": {
              "type": "string",
            },
          },
          "required": [
            "children",
            "value",
          ],
          "type": "object",
        },
      },
      "required": [
        "previous",
        "root",
      ],
      "type": "object",
    }
  `);

  const ctx = createOpenApiContext();
  expect(Codecs.RecursiveEnvelope.schemaWithContext(ctx)).toMatchInlineSnapshot(`
    {
      "$ref": "#/components/schemas/RecursiveEnvelope",
    }
  `);

  expect(ctx.exportDefinitions()).toMatchInlineSnapshot(`
    {
      "$defs": {
        "RecursiveEnvelope": {
          "additionalProperties": false,
          "properties": {
            "previous": {
              "$ref": "#/components/schemas/RecursiveEnvelope",
            },
            "root": {
              "$ref": "#/components/schemas/RecursiveTree",
            },
          },
          "required": [
            "root",
          ],
          "type": "object",
        },
        "RecursiveTree": {
          "additionalProperties": false,
          "properties": {
            "children": {
              "items": {
                "$ref": "#/components/schemas/RecursiveTree",
              },
              "type": "array",
            },
            "value": {
              "type": "string",
            },
          },
          "required": [
            "children",
            "value",
          ],
          "type": "object",
        },
      },
    }
  `);
});
