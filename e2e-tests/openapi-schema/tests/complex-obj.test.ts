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
                  "anyOf": [
                    {
                      "type": "null",
                    },
                    {
                      "type": "string",
                    },
                  ],
                },
                "eventName": {
                  "type": "string",
                },
                "type": {
                  "const": "EVENT",
                },
              },
              "required": [
                "cronExpression",
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
                  "anyOf": [
                    {
                      "type": "null",
                    },
                    {
                      "type": "string",
                    },
                  ],
                },
                "type": {
                  "const": "CRON",
                },
              },
              "required": [
                "cronExpression",
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
      "CronWorkflowSource": {
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
                "enum": [
                  "CRON",
                ],
                "type": "string",
              },
            },
            "required": [
              "cronExpression",
              "type",
            ],
            "type": "object",
          },
          {
            "$ref": "#/components/schemas/WorkflowSourceBase",
          },
        ],
      },
      "EventWorkflowSource": {
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
          {
            "$ref": "#/components/schemas/WorkflowSourceBase",
          },
        ],
      },
      "WorkflowSource": {
        "discriminator": {
          "mapping": {
            "CRON": "#/components/schemas/CronWorkflowSource",
            "EVENT": "#/components/schemas/EventWorkflowSource",
          },
          "propertyName": "type",
        },
        "oneOf": [
          {
            "$ref": "#/components/schemas/EventWorkflowSource",
          },
          {
            "$ref": "#/components/schemas/CronWorkflowSource",
          },
        ],
        "type": "object",
      },
      "WorkflowSourceBase": {
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
    }
  `);
});