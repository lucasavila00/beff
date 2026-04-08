import { it, expect } from "vitest";
import { Codecs } from "../src/parser";
it("works", () => {
  expect(Codecs.ReusesRef.describe()).toMatchInlineSnapshot(`
    "type T3 = { t2Array: Array<{ t1: { a: string, b: number } }> };

    type CodecReusesRef = { a: T3, b: T3 };"
  `);
  expect(Codecs.ReusesRef.schema()).toMatchInlineSnapshot(`
    {
      "additionalProperties": false,
      "properties": {
        "a": {
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
        },
        "b": {
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
        },
      },
      "required": [
        "a",
        "b",
      ],
      "type": "object",
    }
  `);
  expect(Codecs.ReusesRef.hash()).toMatchInlineSnapshot("-869413918");
});
