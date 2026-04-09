import { describe, expect, it } from "vitest";
import { JSONSchema7Definition } from "../src/json-schema.js";
import { normalizeOpenApiSchema } from "../src/openapi-pp.js";
import {
  AnyOfDiscriminatedRuntype,
  ConstRuntype,
  ObjectRuntype,
  TypeofRuntype,
} from "../src/codegen-v2.js";

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

  it("preserves explicit discriminators on discriminated unions", () => {
    const cron = new ObjectRuntype(
      {
        type: new ConstRuntype("CRON"),
        schedule: new TypeofRuntype("string"),
      },
      [],
    );
    const event = new ObjectRuntype(
      {
        type: new ConstRuntype("EVENT"),
        eventName: new TypeofRuntype("string"),
      },
      [],
    );

    const schema = normalize(
      new AnyOfDiscriminatedRuntype([cron, event], "type", {
        CRON: cron,
        EVENT: event,
      }).schema({
        path: [],
        seen: {},
        mode: "contextual",
        printingContext: {
          refTemplate: "#/components/schemas/{name}",
        },
      }),
    );

    expect(schema).toEqual({
      anyOf: [
        {
          type: "object",
          properties: {
            type: { type: "string", enum: ["CRON"] },
            schedule: { type: "string" },
          },
          required: ["type", "schedule"],
          additionalProperties: false,
        },
        {
          type: "object",
          properties: {
            type: { type: "string", enum: ["EVENT"] },
            eventName: { type: "string" },
          },
          required: ["type", "eventName"],
          additionalProperties: false,
        },
      ],
      discriminator: {
        propertyName: "type",
      },
    });
  });
});
