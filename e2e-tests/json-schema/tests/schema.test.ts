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
  expect(Codecs.object.schema()).toMatchInlineSnapshot(`
    {
      "additionalProperties": {},
      "properties": {},
      "required": [],
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
              "anyOf": [
                {
                  "type": "null",
                },
                {
                  "type": "string",
                },
              ],
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
            "a11",
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

  // expect(Codecs.UsesGenericWrapper.schema()).toMatchInlineSnapshot(`
  //   {
  //     "format": "ValidCurrency",
  //     "type": "string",
  //   }
  // `);
});
