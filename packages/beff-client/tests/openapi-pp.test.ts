import { describe, expect, it } from "vitest";
import { b, createNamedType, overrideNamedType } from "../src/index.js";
import { removeNullUnionBranch } from "../src/openapi-pp.js";
import {
  AllOfRuntype,
  AnyOfDiscriminatedRuntype,
  BaseRefRuntype,
  ConstRuntype,
  ObjectRuntype,
  OptionalFieldRuntype,
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

  it("removes nested null branches from optional union wrappers", () => {
    expect(
      removeNullUnionBranch({
        anyOf: [{ anyOf: [{ type: "null" }, { type: "null" }, { type: "string" }] }, { type: "null" }],
      }),
    ).toEqual({ type: "string" });
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
  it("prints runtype metadata descriptions in both schema modes", () => {
    const schema = new ObjectRuntype(
      { description: "User payload." },
      {
        id: new TypeofRuntype({ description: "Stable user id." }, "string"),
      },
      [],
    );
    const printingContext = new SchemaPrintingContext({
      refPathTemplate: "#/components/schemas/{name}",
      definitionContainerKey: null,
    });

    const expected = {
      additionalProperties: false,
      description: "User payload.",
      properties: {
        id: {
          description: "Stable user id.",
          type: "string",
        },
      },
      required: ["id"],
      type: "object",
    };

    expect(schema.schema({ path: [], seen: {}, mode: "flat" })).toEqual(expected);
    expect(schema.schema({ path: [], seen: {}, mode: "contextual", printingContext })).toEqual(expected);
  });

  it("prints runtype metadata descriptions in TypeScript descriptions", () => {
    const schema = new ObjectRuntype(
      { description: "User payload." },
      {
        id: new TypeofRuntype({ description: "Stable user id." }, "string"),
      },
      [],
    );

    expect(schema.describe({ measure: false, deps: {}, deps_counter: {} })).toMatchInlineSnapshot(`
      "/** User payload. */
      { /** Stable user id. */
      id: string }"
    `);
  });

  it("preserves explicit discriminators on discriminated unions", () => {
    const named = {
      CronSource: new ObjectRuntype(
        undefined,
        {
          type: new ConstRuntype(undefined, "CRON"),
          schedule: new TypeofRuntype(undefined, "string"),
        },
        [],
      ),
      EventSource: new ObjectRuntype(
        undefined,
        {
          type: new ConstRuntype(undefined, "EVENT"),
          eventName: new TypeofRuntype(undefined, "string"),
        },
        [],
      ),
    };

    class TestRefRuntype extends BaseRefRuntype {
      getNamedRuntypes() {
        return named;
      }
    }

    const cron = new TestRefRuntype(undefined, "CronSource");
    const event = new TestRefRuntype(undefined, "EventSource");
    const printingContext = new SchemaPrintingContext({
      refPathTemplate: "#/components/schemas/{name}",
      definitionContainerKey: null,
    });

    const schema = new AnyOfDiscriminatedRuntype(
      undefined,
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
      undefined,
      {
        type: new ConstRuntype(undefined, "CRON"),
        schedule: new TypeofRuntype(undefined, "string"),
      },
      [],
    );
    const event = new ObjectRuntype(
      undefined,
      {
        type: new ConstRuntype(undefined, "EVENT"),
        eventName: new TypeofRuntype(undefined, "string"),
      },
      [],
    );
    const printingContext = new SchemaPrintingContext({
      refPathTemplate: "#/components/schemas/{name}",
      definitionContainerKey: null,
    });

    const schema = new AnyOfDiscriminatedRuntype(
      undefined,
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

describe("allOf object schema merging", () => {
  it("prints closed object intersections as one object schema", () => {
    const schema = new AllOfRuntype(undefined, [
      new ObjectRuntype(undefined, { key: new ConstRuntype(undefined, "stock_picker") }, []),
      new ObjectRuntype(
        undefined,
        {
          trainingEndDate: new TypeofRuntype(undefined, "string"),
          evaluationStartDate: new TypeofRuntype(undefined, "string"),
          evaluationEndDate: new TypeofRuntype(undefined, "string"),
          optionalNote: new OptionalFieldRuntype(new TypeofRuntype(undefined, "string")),
        },
        [],
      ),
    ]).schema({
      path: [],
      seen: {},
      mode: "flat",
    });

    expect(schema).toMatchInlineSnapshot(`
      {
        "additionalProperties": false,
        "properties": {
          "evaluationEndDate": {
            "type": "string",
          },
          "evaluationStartDate": {
            "type": "string",
          },
          "key": {
            "const": "stock_picker",
          },
          "optionalNote": {
            "type": "string",
          },
          "trainingEndDate": {
            "type": "string",
          },
        },
        "required": [
          "key",
          "trainingEndDate",
          "evaluationStartDate",
          "evaluationEndDate",
        ],
        "type": "object",
      }
    `);
  });

  it("merges duplicate properties with identical schemas", () => {
    const schema = new AllOfRuntype(undefined, [
      new ObjectRuntype(undefined, { key: new TypeofRuntype(undefined, "string") }, []),
      new ObjectRuntype(undefined, { key: new TypeofRuntype(undefined, "string") }, []),
    ]).schema({
      path: [],
      seen: {},
      mode: "flat",
    });

    expect(schema).toEqual({
      type: "object",
      properties: {
        key: {
          type: "string",
        },
      },
      required: ["key"],
      additionalProperties: false,
    });
  });

  it("falls back to allOf for duplicate properties with incompatible schemas", () => {
    const schema = new AllOfRuntype(undefined, [
      new ObjectRuntype(undefined, { key: new TypeofRuntype(undefined, "string") }, []),
      new ObjectRuntype(undefined, { key: new TypeofRuntype(undefined, "number") }, []),
    ]).schema({
      path: [],
      seen: {},
      mode: "flat",
    });

    expect(schema).toEqual({
      allOf: [
        {
          type: "object",
          properties: {
            key: {
              type: "string",
            },
          },
          required: ["key"],
          additionalProperties: false,
        },
        {
          type: "object",
          properties: {
            key: {
              type: "number",
            },
          },
          required: ["key"],
          additionalProperties: false,
        },
      ],
    });
  });

  it("falls back to allOf for non-object intersections", () => {
    const schema = new AllOfRuntype(undefined, [
      new ObjectRuntype(undefined, { key: new TypeofRuntype(undefined, "string") }, []),
      new TypeofRuntype(undefined, "string"),
    ]).schema({
      path: [],
      seen: {},
      mode: "flat",
    });

    expect(schema).toEqual({
      allOf: [
        {
          type: "object",
          properties: {
            key: {
              type: "string",
            },
          },
          required: ["key"],
          additionalProperties: false,
        },
        {
          type: "string",
        },
      ],
    });
  });

  it("falls back to allOf for indexed object schemas", () => {
    const schema = new AllOfRuntype(undefined, [
      new ObjectRuntype(undefined, { key: new TypeofRuntype(undefined, "string") }, []),
      new ObjectRuntype(undefined, {}, [
        { key: new TypeofRuntype(undefined, "string"), value: new TypeofRuntype(undefined, "number") },
      ]),
    ]).schema({
      path: [],
      seen: {},
      mode: "flat",
    });

    expect(schema).toEqual({
      allOf: [
        {
          type: "object",
          properties: {
            key: {
              type: "string",
            },
          },
          required: ["key"],
          additionalProperties: false,
        },
        {
          type: "object",
          additionalProperties: {
            type: "number",
          },
          propertyNames: {
            type: "string",
          },
        },
      ],
    });
  });
});

describe("named type schema overrides", () => {
  const RecursiveTree = createNamedType("OpenApiCompatRecursiveTree", b.Unknown());
  overrideNamedType(
    "OpenApiCompatRecursiveTree",
    b.Object({
      value: b.String(),
      children: b.Array(RecursiveTree),
    }),
  );

  it("overrides named types only during contextual schema printing", () => {
    const withoutOverride = new SchemaPrintingContext({
      refPathTemplate: "#/components/schemas/{name}",
      definitionContainerKey: null,
    });

    expect(RecursiveTree.schemaWithContext(withoutOverride)).toEqual({
      $ref: "#/components/schemas/OpenApiCompatRecursiveTree",
    });
    expect(withoutOverride.exportDefinitions()).toEqual({
      OpenApiCompatRecursiveTree: {
        type: "object",
        properties: {
          children: {
            type: "array",
            items: {
              $ref: "#/components/schemas/OpenApiCompatRecursiveTree",
            },
          },
          value: {
            type: "string",
          },
        },
        required: ["value", "children"],
        additionalProperties: false,
      },
    });

    const withOverride = new SchemaPrintingContext({
      refPathTemplate: "#/components/schemas/{name}",
      definitionContainerKey: null,
      namedTypeSchemaOverrides: {
        OpenApiCompatRecursiveTree: b.Unknown(),
      },
    });

    expect(RecursiveTree.schemaWithContext(withOverride)).toEqual({
      $ref: "#/components/schemas/OpenApiCompatRecursiveTree",
    });
    expect(withOverride.exportDefinitions()).toEqual({
      OpenApiCompatRecursiveTree: {},
    });

    expect(
      RecursiveTree.validate({
        value: "root",
        children: [{ value: "leaf", children: [] }],
      }),
    ).toBe(true);
    expect(
      RecursiveTree.validate({
        value: 1,
        children: [],
      }),
    ).toBe(false);
  });
});
