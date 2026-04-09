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
