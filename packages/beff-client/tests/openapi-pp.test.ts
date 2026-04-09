import { describe, expect, it } from "vitest";
import { JSONSchema7Definition } from "../src/json-schema.js";
import { normalizeOpenApiSchema } from "../src/openapi-pp.js";

const normalize = (schema: JSONSchema7Definition): JSONSchema7Definition => {
  return normalizeOpenApiSchema(schema, {}, { refPathTemplate: "#/components/schemas/{name}" });
};

describe("normalizeOpenApiSchema", () => {
  it("rewrites nullable object properties into optional properties", () => {
    expect(
      normalize({
        type: "object",
        properties: {
          workerType: { type: "string" },
          hostname: {
            anyOf: [{ type: "null" }, { type: "string" }],
          },
          modelBackend: {
            anyOf: [{ type: "string" }, { type: "null" }],
          },
        },
        required: ["workerType", "hostname", "modelBackend"],
        additionalProperties: false,
      }),
    ).toEqual({
      type: "object",
      properties: {
        workerType: { type: "string" },
        hostname: { type: "string" },
        modelBackend: { type: "string" },
      },
      required: ["workerType"],
      additionalProperties: false,
    });
  });

  it("preserves explicit null-only properties", () => {
    expect(
      normalize({
        type: "object",
        properties: {
          onlyNull: { type: "null" },
        },
        required: ["onlyNull"],
        additionalProperties: false,
      }),
    ).toEqual({
      type: "object",
      properties: {
        onlyNull: { type: "null" },
      },
      required: ["onlyNull"],
      additionalProperties: false,
    });
  });

  it("flattens record-like allOf object intersections for Record<string, unknown>", () => {
    expect(
      normalize({
        allOf: [
          {
            type: "object",
            properties: {},
            required: [],
          },
          {
            type: "object",
            additionalProperties: {},
            propertyNames: {
              type: "string",
            },
          },
        ],
      }),
    ).toEqual({
      type: "object",
      additionalProperties: true,
    });
  });

  it("flattens mixed fixed-property and index-signature object intersections", () => {
    expect(
      normalize({
        allOf: [
          {
            type: "object",
            properties: {
              id: { type: "string" },
            },
            required: ["id"],
          },
          {
            type: "object",
            additionalProperties: {
              type: "string",
            },
            propertyNames: {
              type: "string",
            },
          },
        ],
      }),
    ).toEqual({
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
      additionalProperties: {
        type: "string",
      },
    });
  });

  it("preserves allOf intersections that include refs", () => {
    expect(
      normalize({
        allOf: [
          {
            type: "object",
            properties: {
              receipts: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/ExecutionReceipt",
                },
              },
            },
            required: ["receipts"],
            additionalProperties: false,
          },
          {
            $ref: "#/components/schemas/ActionRequestListItem",
          },
        ],
      }),
    ).toEqual({
      allOf: [
        {
          type: "object",
          properties: {
            receipts: {
              type: "array",
              items: {
                $ref: "#/components/schemas/ExecutionReceipt",
              },
            },
          },
          required: ["receipts"],
          additionalProperties: false,
        },
        {
          $ref: "#/components/schemas/ActionRequestListItem",
        },
      ],
    });
  });

  it("does not rewrite standalone nullable unions outside object properties", () => {
    expect(
      normalize({
        anyOf: [{ type: "null" }, { type: "string" }],
      }),
    ).toEqual({
      anyOf: [{ type: "null" }, { type: "string" }],
    });
  });
});
