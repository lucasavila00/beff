import { expect, it } from "vitest";
import { SchemaPrintingContext } from "@beff/client";
import { Codecs } from "../src/parser";

const createOpenApiContext = () =>
  new SchemaPrintingContext({
    refPathTemplate: "#/components/schemas/{name}",
    definitionContainerKey: null,
  });

it("prints discriminated unions as OpenAPI discriminators", () => {
  expect(Codecs.OpenApiCompatDiscUnion.schema()).toMatchInlineSnapshot(`
    {
      "anyOf": [
        {
          "additionalProperties": false,
          "properties": {
            "eventName": {
              "type": "string",
            },
            "type": {
              "const": "EVENT",
            },
          },
          "required": [
            "eventName",
            "type",
          ],
          "type": "object",
        },
        {
          "additionalProperties": false,
          "properties": {
            "schedule": {
              "type": "string",
            },
            "type": {
              "const": "CRON",
            },
          },
          "required": [
            "schedule",
            "type",
          ],
          "type": "object",
        },
      ],
      "discriminator": {
        "propertyName": "type",
      },
      "type": "object",
    }
  `);

  const ctx = createOpenApiContext();
  expect(Codecs.OpenApiCompatDiscUnion.schemaWithContext(ctx)).toMatchInlineSnapshot(`
    {
      "$ref": "#/components/schemas/OpenApiCompatDiscUnion",
    }
  `);

  expect(ctx.exportDefinitions()).toMatchInlineSnapshot(`
    {
      "OpenApiCompatDiscUnion": {
        "discriminator": {
          "mapping": {
            "CRON": "#/components/schemas/OpenApiCompatDiscUnionCron",
            "EVENT": "#/components/schemas/OpenApiCompatDiscUnionEvent",
          },
          "propertyName": "type",
        },
        "oneOf": [
          {
            "$ref": "#/components/schemas/OpenApiCompatDiscUnionCron",
          },
          {
            "$ref": "#/components/schemas/OpenApiCompatDiscUnionEvent",
          },
        ],
        "type": "object",
      },
      "OpenApiCompatDiscUnionCron": {
        "additionalProperties": false,
        "properties": {
          "schedule": {
            "type": "string",
          },
          "type": {
            "enum": [
              "CRON",
            ],
            "type": "string",
          },
        },
        "required": [
          "schedule",
          "type",
        ],
        "type": "object",
      },
      "OpenApiCompatDiscUnionEvent": {
        "additionalProperties": false,
        "properties": {
          "eventName": {
            "type": "string",
          },
          "type": {
            "enum": [
              "EVENT",
            ],
            "type": "string",
          },
        },
        "required": [
          "eventName",
          "type",
        ],
        "type": "object",
      },
    }
  `);
});

it("prints named discriminated union variants with stable component names", () => {
  expect(Codecs.OpenApiCompatDiscUnionAndNamedTypes.schema()).toMatchInlineSnapshot(`
    {
      "anyOf": [
        {
          "additionalProperties": false,
          "properties": {
            "eventName": {
              "type": "string",
            },
            "type": {
              "const": "EVENT",
            },
          },
          "required": [
            "eventName",
            "type",
          ],
          "type": "object",
        },
        {
          "additionalProperties": false,
          "properties": {
            "schedule": {
              "type": "string",
            },
            "type": {
              "const": "CRON",
            },
          },
          "required": [
            "schedule",
            "type",
          ],
          "type": "object",
        },
      ],
      "discriminator": {
        "propertyName": "type",
      },
      "type": "object",
    }
  `);

  const ctx = createOpenApiContext();
  expect(Codecs.OpenApiCompatDiscUnionAndNamedTypes.schemaWithContext(ctx)).toMatchInlineSnapshot(`
    {
      "$ref": "#/components/schemas/OpenApiCompatDiscUnionAndNamedTypes",
    }
  `);

  expect(ctx.exportDefinitions()).toMatchInlineSnapshot(`
    {
      "OpenApiCompatDiscUnionAndNamedTypes": {
        "discriminator": {
          "mapping": {
            "CRON": "#/components/schemas/OpenApiCompatDiscUnionCron",
            "EVENT": "#/components/schemas/OpenApiCompatDiscUnionEvent",
          },
          "propertyName": "type",
        },
        "oneOf": [
          {
            "$ref": "#/components/schemas/OpenApiCompatDiscUnionCron",
          },
          {
            "$ref": "#/components/schemas/OpenApiCompatDiscUnionEvent",
          },
        ],
        "type": "object",
      },
      "OpenApiCompatDiscUnionCron": {
        "additionalProperties": false,
        "properties": {
          "schedule": {
            "type": "string",
          },
          "type": {
            "enum": [
              "CRON",
            ],
            "type": "string",
          },
        },
        "required": [
          "schedule",
          "type",
        ],
        "type": "object",
      },
      "OpenApiCompatDiscUnionEvent": {
        "additionalProperties": false,
        "properties": {
          "eventName": {
            "type": "string",
          },
          "type": {
            "enum": [
              "EVENT",
            ],
            "type": "string",
          },
        },
        "required": [
          "eventName",
          "type",
        ],
        "type": "object",
      },
    }
  `);
});
