# JSON Schema

Each validator can create a JSON Schema for its type.

## `schema`

`schema()` returns one JSON Schema with all definitions inline. It does not use `$ref`.

```ts
/** A registered user. */
type User = {
  name: string;
  age: number;
};

Parsers.User.schema();
// {
//   type: "object",
//   properties: {
//     age: { type: "number" },
//     name: { type: "string" },
//   },
//   required: ["age", "name"],
//   additionalProperties: false,
//   description: "A registered user.",
// }
```

Beff copies JSDoc comments to the `description` field of the schema.

## `schemaWithContext`

Use `schemaWithContext` to create schemas with `$ref` values. Many schemas can then use one definition. This is useful for OpenAPI documents.

1. Create a `SchemaPrintingContext`.
2. Call `schemaWithContext(ctx)` for each validator. Each call returns a schema with `$ref` values.
3. Call `ctx.exportDefinitions()`. It returns all the definitions that the calls used.

```ts
import { SchemaPrintingContext } from "@beff/client";

const ctx = new SchemaPrintingContext({
  refPathTemplate: "#/components/schemas/{name}",
  definitionContainerKey: null,
});

const requestSchema = Parsers.User.schemaWithContext(ctx);
// { $ref: "#/components/schemas/User" }

const openapi = {
  openapi: "3.1.0",
  paths: {
    "/users": {
      post: {
        requestBody: {
          content: {
            "application/json": {
              schema: requestSchema,
            },
          },
        },
      },
    },
  },
  components: {
    schemas: ctx.exportDefinitions(),
  },
};
```

### `SchemaPrintingContext` options

| Option                     | Type                         | Description                                                                                                                                                        |
| -------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `refPathTemplate`          | `string`                     | The `$ref` value. Beff replaces `{name}` with the name of the type.                                                                                                |
| `definitionContainerKey`   | `string` or `null`           | If it is a string, `exportDefinitions()` puts the definitions in an object with this key. If it is `null`, `exportDefinitions()` returns the definitions directly. |
| `namedTypeSchemaOverrides` | `Record<string, BeffParser>` | Optional. Replaces the schema of a named type. Refer to [Override the schema of a named type](#override-the-schema-of-a-named-type).                               |

Example with `$defs`:

```ts
import { SchemaPrintingContext } from "@beff/client";

const ctx = new SchemaPrintingContext({
  refPathTemplate: "#/$defs/{name}",
  definitionContainerKey: "$defs",
});

const schema = Parsers.User.schemaWithContext(ctx);
const definitions = ctx.exportDefinitions();
// { $defs: { User: { ... } } }
```

## Custom formats

For the schema of custom formats, refer to [Custom formats](./custom-formats.md#json-schema-format).

## Recursive types

`schema()` cannot show a recursive type inline. Where a type refers to itself, `schema()` writes `{}`. This schema accepts all values. For recursive types, use `schemaWithContext`.

```ts
type Tree = { value: number; children: Tree[] };

Parsers.Tree.schema();
// {
//   type: "object",
//   properties: {
//     children: { type: "array", items: {} },
//     value: { type: "number" },
//   },
//   required: ["children", "value"],
//   additionalProperties: false,
// }
```

## Override the schema of a named type

Use `namedTypeSchemaOverrides` to change the schema of a named type for one export only. For example, use it to hide the details of a type in a public document. This option does not change validation.

```ts
import { b, createNamedType, overrideNamedType, SchemaPrintingContext } from "@beff/client";

const RecursiveTree = createNamedType("RecursiveTree", b.Unknown());

overrideNamedType(
  "RecursiveTree",
  b.Object({
    value: b.String(),
    children: b.Array(RecursiveTree),
  }),
);

const ctx = new SchemaPrintingContext({
  refPathTemplate: "#/components/schemas/{name}",
  definitionContainerKey: null,
  namedTypeSchemaOverrides: {
    RecursiveTree: b.Unknown(),
  },
});

RecursiveTree.schemaWithContext(ctx);
ctx.exportDefinitions();
// { RecursiveTree: {} }
```

- To change a named type everywhere, including validation, use `overrideNamedType`. Refer to [Runtime validators](./runtime-validators.md#named-types).
- To change only the schema in one JSON Schema or OpenAPI export, use `namedTypeSchemaOverrides`.
