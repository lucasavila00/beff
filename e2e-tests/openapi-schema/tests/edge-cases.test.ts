import { expect, it } from "vitest";
import { SchemaPrintingContext } from "@beff/client";
import { Codecs } from "../src/parser";

it("prints self-recursive named types as refs instead of empty objects", () => {
  const ctx = new SchemaPrintingContext({
    refPathTemplate: "#/$defs/{name}",
    definitionContainerKey: "$defs",
  });

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
