import { describe, expect, it } from "vitest";
import { removeNullUnionBranch } from "../src/openapi-pp.js";
import {
  AnyOfDiscriminatedRuntype,
  BaseRefRuntype,
  ConstRuntype,
  ObjectRuntype,
  SchemaPrintingContext,
  TypeofRuntype,
} from "../src/codegen-v2.js";

describe("removeNullUnionBranch", () => {
  it("removes the null branch from a two-variant anyOf", () => {
    expect(
      removeNullUnionBranch({
        anyOf: [{ type: "null" }, { type: "string" }],
      }),
    ).toEqual({ type: "string" });
  });

  it("removes the null branch from a two-variant oneOf", () => {
    expect(
      removeNullUnionBranch({
        oneOf: [{ type: "string" }, { type: "null" }],
      }),
    ).toEqual({ type: "string" });
  });

  it("keeps remaining variants when more than one non-null branch", () => {
    expect(
      removeNullUnionBranch({
        anyOf: [{ type: "null" }, { type: "string" }, { type: "number" }],
      }),
    ).toEqual({
      anyOf: [{ type: "string" }, { type: "number" }],
    });
  });

  it("returns null for a non-union schema", () => {
    expect(removeNullUnionBranch({ type: "null" })).toBeNull();
  });

  it("returns null when no null branch is present", () => {
    expect(
      removeNullUnionBranch({
        anyOf: [{ type: "string" }, { type: "number" }],
      }),
    ).toBeNull();
  });

  it("returns null for boolean definitions", () => {
    expect(removeNullUnionBranch(true)).toBeNull();
    expect(removeNullUnionBranch(false)).toBeNull();
  });

  it("returns null when all branches are null", () => {
    expect(
      removeNullUnionBranch({
        anyOf: [{ type: "null" }, { type: "null" }],
      }),
    ).toBeNull();
  });
});

describe("discriminated union schemas", () => {
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

    const schema = new AnyOfDiscriminatedRuntype(
      [cron, event],
      "type",
      {
        EVENT: event,
        CRON: cron,
      },
      {
        EVENT: event,
        CRON: cron,
      },
    ).schema({
      path: [],
      seen: {},
      mode: "contextual",
      printingContext,
    });

    expect(schema).toMatchInlineSnapshot(`
      {
        "discriminator": {
          "mapping": {
            "CRON": "#/components/schemas/CronSource",
            "EVENT": "#/components/schemas/EventSource",
          },
          "propertyName": "type",
        },
        "oneOf": [
          {
            "$ref": "#/components/schemas/EventSource",
          },
          {
            "$ref": "#/components/schemas/CronSource",
          },
        ],
        "type": "object",
      }
    `);
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

    const schema = new AnyOfDiscriminatedRuntype(
      [cron, event],
      "type",
      {
        EVENT: event,
        CRON: cron,
      },
      {
        EVENT: event,
        CRON: cron,
      },
    ).schema({
      path: [],
      seen: {},
      mode: "contextual",
      printingContext,
    });

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
            "$ref": "#/components/schemas/DiscriminatedTypeEVENT1000470817",
          },
          {
            "$ref": "#/components/schemas/DiscriminatedTypeCRON1000470817",
          },
        ],
        "type": "object",
      }
    `);

    expect(Object.keys(printingContext.exportDefinitions())).toMatchInlineSnapshot(`
      [
        "DiscriminatedTypeEVENT1000470817",
        "DiscriminatedTypeCRON1000470817",
      ]
    `);
  });
});
