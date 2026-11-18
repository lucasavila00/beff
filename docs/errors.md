# Errors

This page describes the runtime errors. When the input is not valid:

- `safeParse` returns a list of `DecodeError` objects.
- `parse` throws an `Error`. The message contains the same errors as text.

## The `DecodeError` type

A `DecodeError` is a `RegularDecodeError` or a `UnionDecodeError`.

```ts
type RegularDecodeError = {
  message: string; // What Beff expected.
  path: string[]; // Where the error is in the input.
  received: unknown; // The value at that path.
};

type UnionDecodeError = {
  path: string[];
  received: unknown;
  isUnionError: true;
  errors: DecodeError[]; // One list item for each union member.
};

type DecodeError = RegularDecodeError | UnionDecodeError;
```

The `path` has one item for each level in the input:

- An object property is the property name, for example `"age"`.
- An array item is the index in square brackets, for example `"[0]"`.

`safeParse` returns a maximum of 10 errors.

### Example: regular errors

```ts
type User = {
  name: string;
  age: number;
};

Parsers.User.safeParse({ name: 1, age: "x" });
```

Result:

```json
{
  "success": false,
  "errors": [
    { "message": "expected number", "path": ["age"], "received": "x" },
    { "message": "expected string", "path": ["name"], "received": 1 }
  ]
}
```

### Example: nested errors

```ts
type Team = {
  lead: User;
  members: User[];
};

Parsers.Team.safeParse({
  lead: { name: "Ana", age: 30 },
  members: [{ name: "Bo", age: "25" }],
});
```

Result:

```json
{
  "success": false,
  "errors": [{ "message": "expected number", "path": ["members", "[0]", "age"], "received": "25" }]
}
```

### Example: union errors

If no member of a union matches, Beff returns a `UnionDecodeError`. The `errors` list has the error of each member.

```ts
type IdOrCount = string | number;

Parsers.IdOrCount.safeParse(true);
```

Result:

```json
{
  "success": false,
  "errors": [
    {
      "path": [],
      "received": true,
      "isUnionError": true,
      "errors": [
        { "message": "expected string", "path": [], "received": true },
        { "message": "expected number", "path": [], "received": true }
      ]
    }
  ]
}
```

For a discriminated union, Beff uses the discriminator property to find the union member. Thus, the error is a regular error:

```ts
type Shape = { kind: "circle"; radius: number } | { kind: "square"; size: number };

Parsers.Shape.safeParse({ kind: "triangle" });
// errors: [{ message: 'expected one of "circle", "square"', path: ["kind"], received: "triangle" }]

Parsers.Shape.safeParse({ kind: "circle", radius: "x" });
// errors: [{ message: "expected number", path: ["radius"], received: "x" }]
```

## `printErrors`

`printErrors` changes a list of `DecodeError` objects into one line of text.

```ts
import { printErrors } from "@beff/client";

const result = Parsers.User.safeParse({ name: 1, age: "x" });
if (!result.success) {
  console.log(printErrors(result.errors));
}
```

The text has this format:

- The path is in parentheses. Beff puts a dot between property names. An array index has no dot before it.
- After the path, the text has the message and the received value.
- If there is more than one error, each error starts with `#` and its index. A `|` character separates the errors.

| Errors            | Text                                                                                |
| ----------------- | ----------------------------------------------------------------------------------- |
| Two errors        | `#0 (age) expected number, received: "x" \| #1 (name) expected string, received: 1` |
| One error         | `(name) expected string, received: 1`                                               |
| Nested path       | `(members[0].age) expected number, received: "25"`                                  |
| Error at the root | `expected object, received: null`                                                   |
| Union error       | `Failed to decode one of (expected string \| expected number), received: true`      |

`printErrors` shows a received object as `Object` and a received array as `Array`.

### Add a parent path

`printErrors` has an optional second argument, `parentPath`. Beff adds `parentPath` before the path of each error. Use it to show where the value is in a larger document:

```ts
printErrors(result.errors, ["body"]);
// (body.members[0].age) expected number, received: "25"
```

## Create your own error format

You can use the `DecodeError` list directly. For example, show the errors next to the fields of a form:

```ts
const result = Parsers.User.safeParse(formData);
if (!result.success) {
  const fieldErrors = result.errors.map((err) => ({
    field: err.path.join("."),
    message: "message" in err ? err.message : "not valid",
  }));
}
```

## Error messages for custom formats

You can set the error message for a custom format. Refer to [Custom formats](./custom-formats.md#error-messages).
