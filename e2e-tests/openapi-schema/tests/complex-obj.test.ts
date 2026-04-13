import { expect, it } from "vitest";
import { SchemaPrintingContext } from "@beff/client";
import { Codecs } from "../src/parser";

const createOpenApiContext = () =>
  new SchemaPrintingContext({
    refPathTemplate: "#/components/schemas/{name}",
    definitionContainerKey: null,
  });

it("prints discriminated unions as OpenAPI discriminators", () => {
  expect(Codecs.WorkflowSource.schema()).toMatchInlineSnapshot(`
    {
      "anyOf": [
        {
          "allOf": [
            {
              "additionalProperties": false,
              "properties": {
                "cronExpression": {
                  "type": "string",
                },
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
                "createdAt": {
                  "type": "string",
                },
                "id": {
                  "type": "string",
                },
                "metadata": {
                  "additionalProperties": true,
                  "propertyNames": {
                    "type": "string",
                  },
                  "type": "object",
                },
                "type": {
                  "enum": [
                    "CRON",
                    "EVENT",
                  ],
                  "type": "string",
                },
                "updatedAt": {
                  "type": "string",
                },
                "workflowID": {
                  "type": "string",
                },
              },
              "required": [
                "createdAt",
                "id",
                "metadata",
                "type",
                "updatedAt",
                "workflowID",
              ],
              "type": "object",
            },
          ],
        },
        {
          "allOf": [
            {
              "additionalProperties": false,
              "properties": {
                "cronExpression": {
                  "type": "string",
                },
                "eventName": {
                  "type": "string",
                },
                "type": {
                  "const": "CRON",
                },
              },
              "required": [
                "cronExpression",
                "type",
              ],
              "type": "object",
            },
            {
              "additionalProperties": false,
              "properties": {
                "createdAt": {
                  "type": "string",
                },
                "id": {
                  "type": "string",
                },
                "metadata": {
                  "additionalProperties": true,
                  "propertyNames": {
                    "type": "string",
                  },
                  "type": "object",
                },
                "type": {
                  "enum": [
                    "CRON",
                    "EVENT",
                  ],
                  "type": "string",
                },
                "updatedAt": {
                  "type": "string",
                },
                "workflowID": {
                  "type": "string",
                },
              },
              "required": [
                "createdAt",
                "id",
                "metadata",
                "type",
                "updatedAt",
                "workflowID",
              ],
              "type": "object",
            },
          ],
        },
      ],
      "discriminator": {
        "propertyName": "type",
      },
      "type": "object",
    }
  `);

  const ctx = createOpenApiContext();
  expect(Codecs.WorkflowSource.schemaWithContext(ctx)).toMatchInlineSnapshot(`
    {
      "$ref": "#/components/schemas/WorkflowSource",
    }
  `);

  expect(ctx.exportDefinitions()).toMatchInlineSnapshot(`
    {
      "DiscriminatedTypeCRON1906106737": {
        "additionalProperties": false,
        "properties": {
          "createdAt": {
            "type": "string",
          },
          "cronExpression": {
            "type": "string",
          },
          "eventName": {
            "type": "string",
          },
          "id": {
            "type": "string",
          },
          "metadata": {
            "additionalProperties": true,
            "propertyNames": {
              "type": "string",
            },
            "type": "object",
          },
          "type": {
            "enum": [
              "CRON",
            ],
            "type": "string",
          },
          "updatedAt": {
            "type": "string",
          },
          "workflowID": {
            "type": "string",
          },
        },
        "required": [
          "createdAt",
          "cronExpression",
          "id",
          "metadata",
          "type",
          "updatedAt",
          "workflowID",
        ],
        "type": "object",
      },
      "DiscriminatedTypeEVENT1906106737": {
        "additionalProperties": false,
        "properties": {
          "createdAt": {
            "type": "string",
          },
          "cronExpression": {
            "type": "string",
          },
          "eventName": {
            "type": "string",
          },
          "id": {
            "type": "string",
          },
          "metadata": {
            "additionalProperties": true,
            "propertyNames": {
              "type": "string",
            },
            "type": "object",
          },
          "type": {
            "enum": [
              "EVENT",
            ],
            "type": "string",
          },
          "updatedAt": {
            "type": "string",
          },
          "workflowID": {
            "type": "string",
          },
        },
        "required": [
          "createdAt",
          "eventName",
          "id",
          "metadata",
          "type",
          "updatedAt",
          "workflowID",
        ],
        "type": "object",
      },
      "WorkflowSource": {
        "discriminator": {
          "mapping": {
            "CRON": "#/components/schemas/DiscriminatedTypeCRON1906106737",
            "EVENT": "#/components/schemas/DiscriminatedTypeEVENT1906106737",
          },
          "propertyName": "type",
        },
        "oneOf": [
          {
            "$ref": "#/components/schemas/DiscriminatedTypeCRON1906106737",
          },
          {
            "$ref": "#/components/schemas/DiscriminatedTypeEVENT1906106737",
          },
        ],
        "type": "object",
      },
    }
  `);
});
