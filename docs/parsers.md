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

## Class instances

Beff does not examine the class of an object. Where the type is an object type, an instance of a class is valid if its properties are valid.

- `validate` returns `true`.
- `parse` and `safeParse` return a new plain object. The result is not an instance of the class and does not have its methods.

```ts
class Person {
  name = "John Doe";
  age = 42;
  greet() {}
}

const person = new Person();
Parsers.User.validate(person);
// true
const user = Parsers.User.parse(person);
// { name: "John Doe", age: 42 }
user instanceof Person;
// false
```

The same rule applies to other objects that are not plain objects, for example a `Date` object or a `Map` object. Arrays are the exception: an array is not valid for an object type.

CAUTION: `validate` also reads the properties that an object gets from its prototype, for example a getter of a class. `parse` copies only the own enumerable properties. Thus, the result of `parse` does not have a property that comes from the prototype, although the type shows that property.

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
