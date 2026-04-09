import { describe, expect, it } from "vitest";
import { JSONSchema7Definition } from "../src/json-schema.js";
import { normalizeOpenApiSchema } from "../src/openapi-pp.js";
import {
  AnyOfDiscriminatedRuntype,
  BaseRefRuntype,
  ConstRuntype,
  ObjectRuntype,
  SchemaPrintingContext,
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
    const named = {
      CronSource: new ObjectRuntype(
        {
          type: new ConstRuntype("CRON"),
          schedule: new TypeofRuntype("string"),
        },
        [],
      ),
      EventSource: new ObjectRuntype(
        {
          type: new ConstRuntype("EVENT"),
          eventName: new TypeofRuntype("string"),
        },
        [],
      ),
    };

    class TestRefRuntype extends BaseRefRuntype {
      getNamedRuntypes() {
        return named;
      }
    }

    const cron = new TestRefRuntype("CronSource");
    const event = new TestRefRuntype("EventSource");
    const printingContext = new SchemaPrintingContext({
      refPathTemplate: "#/components/schemas/{name}",
      definitionContainerKey: null,
    });

    const schema = normalize(
      new AnyOfDiscriminatedRuntype([cron, event], "type", {
        EVENT: event,
        CRON: cron,
      }).schema({
        path: [],
        seen: {},
        mode: "contextual",
        printingContext,
      }),
    );

    expect(schema).toEqual({
      type: "object",
      discriminator: {
        propertyName: "type",
        mapping: {
          EVENT: "#/components/schemas/EventSource",
          CRON: "#/components/schemas/CronSource",
        },
      },
      oneOf: [{ $ref: "#/components/schemas/CronSource" }, { $ref: "#/components/schemas/EventSource" }],
    });
  });

  it("creates synthetic refs for inline discriminated union variants", () => {
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
    const printingContext = new SchemaPrintingContext({
      refPathTemplate: "#/components/schemas/{name}",
      definitionContainerKey: null,
    });

    const schema = normalize(
      new AnyOfDiscriminatedRuntype([cron, event], "type", {
        EVENT: event,
        CRON: cron,
      }).schema({
        path: [],
        seen: {},
        mode: "contextual",
        printingContext,
      }),
    );

    expect(schema).toMatchInlineSnapshot(`
      {
        "discriminator": {
          "mapping": {
            "CRON": "#/components/schemas/DiscriminatedTypeCRON1000470817",
            "EVENT": "#/components/schemas/DiscriminatedTypeEVENT1000470817",
          },
          "propertyName": "type",
        },
        "oneOf": [
          {
            "$ref": "#/components/schemas/DiscriminatedTypeCRON1000470817",
          },
          {
            "$ref": "#/components/schemas/DiscriminatedTypeEVENT1000470817",
          },
        ],
        "type": "object",
      }
    `);

    expect(Object.keys(printingContext.exportDefinitions())).toMatchInlineSnapshot(`
      [
        "DiscriminatedTypeCRON1000470817",
        "DiscriminatedTypeEVENT1000470817",
      ]
    `);
  });
});
