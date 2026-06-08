import { it, expect } from "vitest";
import { Codecs } from "../src/parser";

it("throws errors", () => {
  expect(() => Codecs.InvalidSchemaWithDate.schema()).toThrowErrorMatchingInlineSnapshot(
    '"Failed to print schema. At x: Cannot generate JSON Schema for Date"',
  );
  expect(() => Codecs.InvalidSchemaWithBigInt.schema()).toThrowErrorMatchingInlineSnapshot(
    '"Failed to print schema. At x: Cannot generate JSON Schema for BigInt"',
  );
});

it("works", () => {
  expect(Codecs.string.schema()).toMatchInlineSnapshot(`
    {
      "type": "string",
    }
  `);
  expect(Codecs.number.schema()).toMatchInlineSnapshot(`
    {
      "type": "number",
    }
  `);
  expect(Codecs.boolean.schema()).toMatchInlineSnapshot(`
    {
      "type": "boolean",
    }
  `);
  expect(Codecs.null.schema()).toMatchInlineSnapshot(`
    {
      "type": "null",
    }
  `);
  expect(Codecs.undefined.schema()).toMatchInlineSnapshot(`
    {
      "type": "null",
    }
  `);
});
it("works2", () => {
  expect(Codecs.object.schema()).toMatchInlineSnapshot(`
    {
      "additionalProperties": true,
      "propertyNames": {
        "anyOf": [
          {
            "type": "string",
          },
          {
            "type": "number",
          },
        ],
      },
      "type": "object",
    }
  `);
  expect(Codecs.anyArray.schema()).toMatchInlineSnapshot(`
    {
      "items": {},
      "type": "array",
    }
  `);
  expect(Codecs.any.schema()).toMatchInlineSnapshot("{}");
});
it("works3", () => {
  expect(Codecs.T1.schema()).toMatchInlineSnapshot(`
    {
      "additionalProperties": false,
      "properties": {
        "a": {
          "type": "string",
        },
        "b": {
          "type": "number",
        },
      },
      "required": [
        "a",
        "b",
      ],
      "type": "object",
    }
  `);
  expect(Codecs.DocumentedPayload.schema()).toMatchInlineSnapshot(`
    {
      "additionalProperties": false,
      "description": "Documented payload for flat JSON Schema.",
      "properties": {
        "id": {
          "description": "Stable payload id.",
          "type": "string",
        },
        "retries": {
          "description": "Optional retry count.",
          "type": "number",
        },
      },
      "required": [
        "id",
      ],
      "type": "object",
    }
  `);
  expect(Codecs.T2.schema()).toMatchInlineSnapshot(`
    {
      "additionalProperties": false,
      "properties": {
        "t1": {
          "additionalProperties": false,
          "properties": {
            "a": {
              "type": "string",
            },
            "b": {
              "type": "number",
            },
          },
          "required": [
            "a",
            "b",
          ],
          "type": "object",
        },
      },
      "required": [
        "t1",
      ],
      "type": "object",
    }
  `);
  expect(Codecs.T3.schema()).toMatchInlineSnapshot(`
    {
      "additionalProperties": false,
      "properties": {
        "t2Array": {
          "items": {
            "additionalProperties": false,
            "properties": {
              "t1": {
                "additionalProperties": false,
                "properties": {
                  "a": {
                    "type": "string",
                  },
                  "b": {
                    "type": "number",
                  },
                },
                "required": [
                  "a",
                  "b",
                ],
                "type": "object",
              },
            },
            "required": [
              "t1",
            ],
            "type": "object",
          },
          "type": "array",
        },
      },
      "required": [
        "t2Array",
      ],
      "type": "object",
    }
  `);
  expect(Codecs.SemVer.schema()).toMatchInlineSnapshot(`
    {
      "pattern": "\`\${number}.\${number}.\${number}\`",
      "type": "string",
    }
  `);
  expect(Codecs.NonEmptyString.schema()).toMatchInlineSnapshot(`
    {
      "items": {
        "type": "string",
      },
      "prefixItems": [
        {
          "type": "string",
        },
      ],
      "type": "array",
    }
  `);
  expect(Codecs.DiscriminatedUnion.schema()).toMatchInlineSnapshot(`
    {
      "anyOf": [
        {
          "additionalProperties": false,
          "properties": {
            "a1": {
              "type": "string",
            },
            "a11": {
              "type": "string",
            },
            "subType": {
              "const": "a1",
            },
            "type": {
              "const": "a",
            },
          },
          "required": [
            "a1",
            "subType",
            "type",
          ],
          "type": "object",
        },
        {
          "additionalProperties": false,
          "properties": {
            "a2": {
              "type": "string",
            },
            "subType": {
              "const": "a2",
            },
            "type": {
              "const": "a",
            },
          },
          "required": [
            "a2",
            "subType",
            "type",
          ],
          "type": "object",
        },
        {
          "additionalProperties": false,
          "properties": {
            "type": {
              "const": "b",
            },
            "value": {
              "type": "number",
            },
          },
          "required": [
            "type",
            "value",
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

  expect(Codecs.ValidCurrency.schema()).toMatchInlineSnapshot(`
    {
      "format": "ValidCurrency",
      "type": "string",
    }
  `);

  expect(Codecs.RecursiveTree.schema()).toMatchInlineSnapshot(`
    {
      "additionalProperties": false,
      "properties": {
        "children": {
          "items": {},
          "type": "array",
        },
        "value": {
          "type": "number",
        },
      },
      "required": [
        "children",
        "value",
      ],
      "type": "object",
    }
  `);

  expect(Codecs.EmptyClosedRecord.schema()).toMatchInlineSnapshot(`
    {
      "additionalProperties": false,
      "type": "object",
    }
  `);

  expect(Codecs.OptionalNullishInput.schema()).toMatchInlineSnapshot(`
    {
      "additionalProperties": false,
      "properties": {
        "limit": {
          "type": "number",
        },
        "value": {
          "type": "string",
        },
      },
      "type": "object",
    }
  `);

  const toolInputSchema = Codecs.ToolInput.schema();
  expect(toolInputSchema.type).toBe("object");
  expect(toolInputSchema).toMatchInlineSnapshot(`
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
        "evaluationEndDate",
        "evaluationStartDate",
        "trainingEndDate",
      ],
      "type": "object",
    }
  `);

  expect(
    Codecs.ToolInput.parse({
      key: "stock_picker",
      trainingEndDate: "2026-01-01",
      evaluationStartDate: "2026-02-01",
      evaluationEndDate: "2026-03-01",
    }),
  ).toEqual({
    key: "stock_picker",
    trainingEndDate: "2026-01-01",
    evaluationStartDate: "2026-02-01",
    evaluationEndDate: "2026-03-01",
  });
  expect(
    Codecs.ToolInput.safeParse({
      key: "stock_picker",
      trainingEndDate: "2026-01-01",
      evaluationStartDate: "2026-02-01",
    }).success,
  ).toBe(false);

  // expect(Codecs.UsesGenericWrapper.schema()).toMatchInlineSnapshot(`
  //   {
  //     "format": "ValidCurrency",
  //     "type": "string",
  //   }
  // `);
});
