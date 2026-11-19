# Parsers

`buildParsers` returns an object of validators. Each validator has the type `BeffParser<T>`. This page describes the methods of `BeffParser<T>`.

| Method                                       | Return value                                                 |
| -------------------------------------------- | ------------------------------------------------------------ |
| [`parse(input, options?)`](#parse)           | The parsed value. Throws an error if the input is not valid. |
| [`safeParse(input, options?)`](#safeparse)   | A result object. Does not throw an error.                    |
| [`validate(input, options?)`](#validate)     | `true` or `false`.                                           |
| [`zod()`](#zod)                              | A zod schema.                                                |
| [`name`](#name)                              | The name of the validator.                                   |
| [`schema()`](./json-schema.md)               | A JSON Schema.                                               |
| [`schemaWithContext(ctx)`](./json-schema.md) | A JSON Schema with `$ref` values.                            |
| [`describe()`](./describe.md)                | A TypeScript type, as a string.                              |

Use `parse` when the input must be valid. Use `safeParse` when your code must handle the errors. Use `validate` when you need only a type guard.

## `parse`

`parse` returns the parsed value. If the input is not valid, `parse` throws an `Error`.

```ts
const user = Parsers.User.parse({ name: "John Doe", age: 42 });
```

The error message contains the name of the validator and the text from [`printErrors`](./errors.md#printerrors):

```ts
Parsers.User.parse({ name: "John Doe" });
// Error: Failed to parse User - (age) expected number, received: undefined
```

`parse` removes properties that are not in the type:

```ts
Parsers.User.parse({ name: "John Doe", age: 42, extra: true });
// { name: "John Doe", age: 42 }
```

## `safeParse`

`safeParse` does not throw an error. It returns one of these two objects:

- `{ success: true, data: T }`
- `{ success: false, errors: DecodeError[] }`

```ts
const result = Parsers.User.safeParse(input);
if (result.success) {
  console.log(result.data.name);
} else {
  console.log(printErrors(result.errors));
}
```

For the format of `DecodeError`, refer to [Errors](./errors.md).

## `validate`

`validate` returns `true` or `false`. It is a TypeScript type guard.

```ts
if (Parsers.User.validate(input)) {
  // Here, the type of input is User.
}
```

`validate` does not create a new value. Thus, `validate` does not remove extra properties from the input.

## Parse options

`parse`, `safeParse`, and `validate` accept an optional `options` object.

| Option                    | Type                    | Default   | Description                                                                |
| ------------------------- | ----------------------- | --------- | -------------------------------------------------------------------------- |
| `disallowExtraProperties` | `boolean`               | `false`   | If `true`, an object with a property that is not in the type is not valid. |
| `objectKeyOrder`          | `"input"` or `"sorted"` | `"input"` | The key order of the objects that `parse` and `safeParse` return.          |

```ts
Parsers.User.safeParse({ name: "John Doe", age: 42, extra: 1 }, { disallowExtraProperties: true });
// { success: false, errors: [{ message: "extra property", path: ["extra"], received: 1 }] }

// Use "sorted" for stable output, for example in snapshot tests.
Parsers.User.parse({ name: "John Doe", age: 42 }, { objectKeyOrder: "sorted" });
// { age: 42, name: "John Doe" }
```

## `zod`

`zod` returns a zod version 3 schema that uses the Beff validator. Use it to add Beff validators to a project that uses zod.

```ts
import { z } from "zod";

const Users = z.array(Parsers.User.zod());
Users.parse([{ name: "John Doe", age: 42 }]);
```

## `name`

`name` is the name of the validator. For a generated validator, it is the property name in the `buildParsers` type argument.

```ts
Parsers.User.name;
// "User"
```

## `TypeOf`

`TypeOf` gives the TypeScript type of a validator.

```ts
import { TypeOf } from "@beff/client";

type User = TypeOf<typeof Parsers.User>;
```
