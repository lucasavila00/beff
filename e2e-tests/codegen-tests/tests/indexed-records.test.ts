import { it, expect } from "vitest";
import { Codecs } from "../src/parser";

it("R: regular syntax with infinite indexed key", () => {
  expect(Codecs.R.describe()).toMatchInlineSnapshot('"type CodecR = { a: number, b: number, [K in `x_${string}`]: number };"');
  expect(Codecs.R.schema()).toMatchInlineSnapshot(`
    {
      "allOf": [
        {
          "properties": {
            "a": {
              "type": "number",
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
        {
          "additionalProperties": {
            "type": "number",
          },
          "propertyNames": {
            "pattern": "\`x_\${string}\`",
            "type": "string",
          },
          "type": "object",
        },
      ],
    }
  `);

  expect(Codecs.R.safeParse({ a: 1, b: 2 })).toMatchInlineSnapshot(`
    {
      "data": {
        "a": 1,
        "b": 2,
      },
      "success": true,
    }
  `);
  expect(Codecs.R.safeParse({ a: 1, b: 2, x_foo: 3 })).toMatchInlineSnapshot(`
    {
      "data": {
        "a": 1,
        "b": 2,
        "x_foo": 3,
      },
      "success": true,
    }
  `);
  expect(Codecs.R.safeParse({ a: 1 })).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected number",
          "path": [
            "b",
          ],
          "received": undefined,
        },
      ],
      "success": false,
    }
  `);
  expect(Codecs.R.safeParse({ a: 1, b: 2, c: 3 })).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string matching \`x_\${string}\`",
          "path": [
            "c",
          ],
          "received": "c",
        },
      ],
      "success": false,
    }
  `);
  expect(Codecs.R.safeParse({ a: 1, b: 2, x_foo: "no" })).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected number",
          "path": [
            "x_foo",
          ],
          "received": "no",
        },
      ],
      "success": false,
    }
  `);
});

it("R2: mapped finite required", () => {
  expect(Codecs.R2.describe()).toMatchInlineSnapshot('"type CodecR2 = { a: number, b: number };"');
  expect(Codecs.R2.schema()).toMatchInlineSnapshot(`
    {
      "additionalProperties": false,
      "properties": {
        "a": {
          "type": "number",
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

  expect(Codecs.R2.safeParse({ a: 1, b: 2 })).toMatchInlineSnapshot(`
    {
      "data": {
        "a": 1,
        "b": 2,
      },
      "success": true,
    }
  `);
  expect(Codecs.R2.safeParse({ a: 1 })).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected number",
          "path": [
            "b",
          ],
          "received": undefined,
        },
      ],
      "success": false,
    }
  `);
});

it("R3: mapped finite optional", () => {
  expect(Codecs.R3.describe()).toMatchInlineSnapshot('"type CodecR3 = { a?: number, b?: number };"');
  expect(Codecs.R3.schema()).toMatchInlineSnapshot(`
    {
      "additionalProperties": false,
      "properties": {
        "a": {
          "type": "number",
        },
        "b": {
          "type": "number",
        },
      },
      "type": "object",
    }
  `);

  expect(Codecs.R3.safeParse({})).toMatchInlineSnapshot(`
    {
      "data": {},
      "success": true,
    }
  `);
  expect(Codecs.R3.safeParse({ a: 1 })).toMatchInlineSnapshot(`
    {
      "data": {
        "a": 1,
      },
      "success": true,
    }
  `);
  expect(Codecs.R3.safeParse({ a: 1, b: 2 })).toMatchInlineSnapshot(`
    {
      "data": {
        "a": 1,
        "b": 2,
      },
      "success": true,
    }
  `);
  expect(Codecs.R3.safeParse({ a: "no" })).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected number",
          "path": [
            "a",
          ],
          "received": "no",
        },
      ],
      "success": false,
    }
  `);
});

it("R4: mapped infinite required value", () => {
  expect(Codecs.R4.describe()).toMatchInlineSnapshot('"type CodecR4 = { [K in `x_${string}`]: number };"');
  expect(Codecs.R4.schema()).toMatchInlineSnapshot(`
    {
      "additionalProperties": {
        "type": "number",
      },
      "propertyNames": {
        "pattern": "\`x_\${string}\`",
        "type": "string",
      },
      "type": "object",
    }
  `);

  expect(Codecs.R4.safeParse({})).toMatchInlineSnapshot(`
    {
      "data": {},
      "success": true,
    }
  `);
  expect(Codecs.R4.safeParse({ x_a: 1, x_b: 2 })).toMatchInlineSnapshot(`
    {
      "data": {
        "x_a": 1,
        "x_b": 2,
      },
      "success": true,
    }
  `);
  expect(Codecs.R4.safeParse({ y_a: 1 })).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string matching \`x_\${string}\`",
          "path": [
            "y_a",
          ],
          "received": "y_a",
        },
      ],
      "success": false,
    }
  `);
  expect(Codecs.R4.safeParse({ x_a: "no" })).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected number",
          "path": [
            "x_a",
          ],
          "received": "no",
        },
      ],
      "success": false,
    }
  `);
  expect(Codecs.R4.safeParse({ x_a: undefined })).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected number",
          "path": [
            "x_a",
          ],
          "received": undefined,
        },
      ],
      "success": false,
    }
  `);
});

it("R5: mapped infinite optional value", () => {
  expect(Codecs.R5.describe()).toMatchInlineSnapshot('"type CodecR5 = { [K in `x_${string}`]?: number };"');
  expect(Codecs.R5.schema()).toMatchInlineSnapshot(`
    {
      "additionalProperties": {
        "anyOf": [
          {
            "type": "number",
          },
          {
            "type": "null",
          },
        ],
      },
      "propertyNames": {
        "pattern": "\`x_\${string}\`",
        "type": "string",
      },
      "type": "object",
    }
  `);

  expect(Codecs.R5.safeParse({})).toMatchInlineSnapshot(`
    {
      "data": {},
      "success": true,
    }
  `);
  expect(Codecs.R5.safeParse({ x_a: 1 })).toMatchInlineSnapshot(`
    {
      "data": {
        "x_a": 1,
      },
      "success": true,
    }
  `);
  expect(Codecs.R5.safeParse({ x_a: undefined })).toMatchInlineSnapshot(`
    {
      "data": {
        "x_a": undefined,
      },
      "success": true,
    }
  `);
  expect(Codecs.R5.safeParse({ y_a: 1 })).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string matching \`x_\${string}\`",
          "path": [
            "y_a",
          ],
          "received": "y_a",
        },
      ],
      "success": false,
    }
  `);
  expect(Codecs.R5.safeParse({ x_a: "no" })).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected number",
          "path": [
            "x_a",
          ],
          "received": "no",
        },
      ],
      "success": false,
    }
  `);
});

it("Meta: Partial<Record<MixedUnion, V>>", () => {
  expect(Codecs.Meta.describe()).toMatchInlineSnapshot('"type CodecMeta = { alpha?: string, beta?: string, [K in (`alpha_entity_${string}` | `beta-entity-${string}`)]?: string };"');
  expect(Codecs.Meta.schema()).toMatchInlineSnapshot(`
    {
      "allOf": [
        {
          "properties": {
            "alpha": {
              "type": "string",
            },
            "beta": {
              "type": "string",
            },
          },
          "type": "object",
        },
        {
          "additionalProperties": {
            "anyOf": [
              {
                "type": "string",
              },
              {
                "type": "null",
              },
            ],
          },
          "propertyNames": {
            "anyOf": [
              {
                "pattern": "\`alpha_entity_\${string}\`",
                "type": "string",
              },
              {
                "pattern": "\`beta-entity-\${string}\`",
                "type": "string",
              },
            ],
          },
          "type": "object",
        },
      ],
    }
  `);

  expect(Codecs.Meta.safeParse({})).toMatchInlineSnapshot(`
    {
      "data": {},
      "success": true,
    }
  `);
  expect(Codecs.Meta.safeParse({ alpha: "a" })).toMatchInlineSnapshot(`
    {
      "data": {
        "alpha": "a",
      },
      "success": true,
    }
  `);
  expect(Codecs.Meta.safeParse({ alpha: "a", beta: "b" })).toMatchInlineSnapshot(`
    {
      "data": {
        "alpha": "a",
        "beta": "b",
      },
      "success": true,
    }
  `);
  expect(Codecs.Meta.safeParse({ alpha_entity_xyz: "x" })).toMatchInlineSnapshot(`
    {
      "data": {
        "alpha_entity_xyz": "x",
      },
      "success": true,
    }
  `);
  expect(Codecs.Meta.safeParse({ "beta-entity-foo": "f" })).toMatchInlineSnapshot(`
    {
      "data": {
        "beta-entity-foo": "f",
      },
      "success": true,
    }
  `);
  expect(Codecs.Meta.safeParse({ alpha: "a", alpha_entity_xyz: "x" })).toMatchInlineSnapshot(`
    {
      "data": {
        "alpha": "a",
        "alpha_entity_xyz": "x",
      },
      "success": true,
    }
  `);
  expect(Codecs.Meta.safeParse({ alpha: 1 })).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string",
          "path": [
            "alpha",
          ],
          "received": 1,
        },
      ],
      "success": false,
    }
  `);
  expect(Codecs.Meta.safeParse({ alpha_entity_xyz: 1 })).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string",
          "path": [
            "alpha_entity_xyz",
          ],
          "received": 1,
        },
      ],
      "success": false,
    }
  `);
  expect(Codecs.Meta.safeParse({ random: "x" })).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "errors": [
            {
              "message": "expected string matching \`alpha_entity_\${string}\`",
              "path": [],
              "received": "random",
            },
            {
              "message": "expected string matching \`beta-entity-\${string}\`",
              "path": [],
              "received": "random",
            },
          ],
          "isUnionError": true,
          "path": [
            "random",
          ],
          "received": "random",
        },
      ],
      "success": false,
    }
  `);
  expect(Codecs.Meta.safeParse({ alpha_entity_xyz: undefined })).toMatchInlineSnapshot(`
    {
      "data": {
        "alpha_entity_xyz": undefined,
      },
      "success": true,
    }
  `);
});

it("Meta2: Record<MixedUnion, V>", () => {
  expect(Codecs.Meta2.describe()).toMatchInlineSnapshot('"type CodecMeta2 = { alpha: string, beta: string, [K in (`alpha_entity_${string}` | `beta-entity-${string}`)]: string };"');
  expect(Codecs.Meta2.schema()).toMatchInlineSnapshot(`
    {
      "allOf": [
        {
          "properties": {
            "alpha": {
              "type": "string",
            },
            "beta": {
              "type": "string",
            },
          },
          "required": [
            "alpha",
            "beta",
          ],
          "type": "object",
        },
        {
          "additionalProperties": {
            "type": "string",
          },
          "propertyNames": {
            "anyOf": [
              {
                "pattern": "\`alpha_entity_\${string}\`",
                "type": "string",
              },
              {
                "pattern": "\`beta-entity-\${string}\`",
                "type": "string",
              },
            ],
          },
          "type": "object",
        },
      ],
    }
  `);

  expect(Codecs.Meta2.safeParse({ alpha: "a", beta: "b" })).toMatchInlineSnapshot(`
    {
      "data": {
        "alpha": "a",
        "beta": "b",
      },
      "success": true,
    }
  `);
  expect(
    Codecs.Meta2.safeParse({ alpha: "a", beta: "b", alpha_entity_xyz: "x" }),
  ).toMatchInlineSnapshot(`
    {
      "data": {
        "alpha": "a",
        "alpha_entity_xyz": "x",
        "beta": "b",
      },
      "success": true,
    }
  `);
  expect(Codecs.Meta2.safeParse({})).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string",
          "path": [
            "alpha",
          ],
          "received": undefined,
        },
        {
          "message": "expected string",
          "path": [
            "beta",
          ],
          "received": undefined,
        },
      ],
      "success": false,
    }
  `);
  expect(Codecs.Meta2.safeParse({ alpha: "a" })).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string",
          "path": [
            "beta",
          ],
          "received": undefined,
        },
      ],
      "success": false,
    }
  `);
  expect(Codecs.Meta2.safeParse({ alpha: "a", beta: "b", random: "r" })).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "errors": [
            {
              "message": "expected string matching \`alpha_entity_\${string}\`",
              "path": [],
              "received": "random",
            },
            {
              "message": "expected string matching \`beta-entity-\${string}\`",
              "path": [],
              "received": "random",
            },
          ],
          "isUnionError": true,
          "path": [
            "random",
          ],
          "received": "random",
        },
      ],
      "success": false,
    }
  `);
  expect(
    Codecs.Meta2.safeParse({ alpha: "a", beta: "b", alpha_entity_xyz: undefined }),
  ).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string",
          "path": [
            "alpha_entity_xyz",
          ],
          "received": undefined,
        },
      ],
      "success": false,
    }
  `);
});
