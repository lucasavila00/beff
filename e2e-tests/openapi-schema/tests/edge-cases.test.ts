import { expect, it } from "vitest";
import { SchemaPrintingContext } from "@beff/client";
import { Codecs } from "../src/parser";

it("prints self-recursive named types as refs instead of empty objects", () => {
  const ctx = new SchemaPrintingContext();

  expect(Codecs.RecursiveTree.schemaWithContext(ctx)).toMatchInlineSnapshot(`
    {
      "$ref": "#/$defs/RecursiveTree",
    }
  `);

  expect(ctx.exportDefinitions()).toMatchInlineSnapshot(`
    {
      "$defs": {
        "RecursiveTree": {
          "additionalProperties": false,
          "properties": {
            "children": {
              "items": {
                "$ref": "#/$defs/RecursiveTree",
              },
              "type": "array",
            },
            "value": {
              "type": "string",
            },
          },
          "required": [
            "children",
            "value",
          ],
          "type": "object",
        },
      },
    }
  `);
});

it("supports nested recursive reuse with openapi-style component refs", () => {
  const ctx = new SchemaPrintingContext({
    refPathTemplate: "#/components/schemas/{name}",
    definitionContainerKey: null,
  });

  expect(Codecs.RecursiveEnvelope.schemaWithContext(ctx)).toMatchInlineSnapshot(`
    {
      "$ref": "#/components/schemas/RecursiveEnvelope",
    }
  `);

  expect(ctx.exportDefinitions()).toMatchInlineSnapshot(`
    {
      "$defs": {
        "RecursiveEnvelope": {
          "additionalProperties": false,
          "properties": {
            "previous": {
              "anyOf": [
                {
                  "$ref": "#/components/schemas/RecursiveEnvelope",
                },
                {
                  "type": "null",
                },
              ],
            },
            "root": {
              "$ref": "#/components/schemas/RecursiveTree",
            },
          },
          "required": [
            "previous",
            "root",
          ],
          "type": "object",
        },
        "RecursiveTree": {
          "additionalProperties": false,
          "properties": {
            "children": {
              "items": {
                "$ref": "#/components/schemas/RecursiveTree",
              },
              "type": "array",
            },
            "value": {
              "type": "string",
            },
          },
          "required": [
            "children",
            "value",
          ],
          "type": "object",
        },
      },
    }
  `);
});
