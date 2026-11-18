# Runtime validators

The `b` API creates validators in code, without the compiler. It is similar to zod and io-ts. Validators from the `b` API have the same methods as generated validators. Refer to [Parsers](./parsers.md).

```ts
import { b } from "@beff/client";

const Item = b.Object({
  name: b.String(),
  price: b.Number(),
  tags: b.Array(b.String()),
});

const items = b.Array(Item).parse(input);
```

To get the TypeScript type of a validator, use `TypeOf`:

```ts
import { TypeOf } from "@beff/client";

type Item = TypeOf<typeof Item>;
```

NOTE: The `b` API supports only simple types. This keeps the TypeScript compiler fast. The `b` API has no optional properties and no typed unions. For these types, write a TypeScript type and let Beff compile it.

## Functions

| Function                                    | TypeScript type                                                         |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `b.String()`                                | `string`                                                                |
| `b.Number()`                                | `number`                                                                |
| `b.Boolean()`                               | `boolean`                                                               |
| `b.Null()`                                  | `null`                                                                  |
| `b.Undefined()`                             | `undefined`                                                             |
| `b.Void()`                                  | `void`                                                                  |
| `b.Any()`                                   | `any`                                                                   |
| `b.Unknown()`                               | `unknown`                                                               |
| `b.Date()`                                  | `Date`                                                                  |
| `b.Const(value)`                            | The literal type of `value`. `value` is a string, number, or boolean.   |
| `b.Object({ ... })`                         | An object type.                                                         |
| `b.Array(item)`                             | `T[]`                                                                   |
| `b.ReadOnlyArray(item)`                     | `readonly T[]`                                                          |
| `b.Uint8Array()` and the other typed arrays | `Uint8Array`, `Int32Array`, `Float64Array`, and the other typed arrays. |
| `buntyped.Union(...items)`                  | `any`. The validator accepts a value if one of the items accepts it.    |

`buntyped.Union` has its own import: `import { buntyped } from "@beff/client";`.

## Named types

`createNamedType` gives a name to a validator. The name shows in `describe()` and in `$ref` values in [JSON Schema](./json-schema.md#schemawithcontext).

```ts
import { b, createNamedType } from "@beff/client";

const Point = createNamedType("Point", b.Object({ x: b.Number(), y: b.Number() }));

Point.describe();
// type CodecPoint = { x: number, y: number };
```

Each name must be unique. `createNamedType` throws an error if the name already exists.

### Recursive types

To make a recursive type, do these steps:

1. Create the named type with a temporary validator, for example `b.Unknown()`.
2. Call `overrideNamedType` to set the real validator. The real validator can refer to the named type.

```ts
import { b, createNamedType, overrideNamedType } from "@beff/client";

const Category = createNamedType("Category", b.Unknown());

overrideNamedType(
  "Category",
  b.Object({
    name: b.String(),
    children: b.Array(Category),
  }),
);

Category.parse({ name: "Books", children: [{ name: "Science", children: [] }] });
```
