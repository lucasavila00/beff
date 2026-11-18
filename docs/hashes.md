# Hashes

`hash()` and `hash256()` calculate a value from the structure of a validator. Two validators with the same structure have the same hash.

Use a hash to find out if a type changed. For example:

- Keep the hash of an API type in a test. The test fails when a person changes the type.
- Add the hash to a cache key. When the type changes, the cache key changes too.
- Compare the type of a client and a server.

## `hash256`

`hash256()` returns a SHA-256 hash as a hex string with 64 characters. Use `hash256()` for most tasks.

```ts
type User = { name: string; age: number };

Parsers.User.hash256();
// "061bef74fc42f13b4925c544083fcd9a768186f7692c05e01a0b5242fcdb6b7e"
```

## `hash`

`hash()` returns a 32-bit integer. The value is short, but two different types can have the same `hash()`. Do not use `hash()` to make sure that two types are equal.

```ts
Parsers.User.hash();
// 1265549903
```

## What changes the hash

The hash changes when the structure of the type changes. For example, when you:

- Add or remove a property.
- Change the type of a property.
- Make a property optional or required.
- Add or remove a custom format.

The hash does not change when you:

- Change the order of the properties.
- Change the name of the type.
- Add or change a JSDoc comment.

```ts
type User = { name: string; age: number };
type Person = { age: number; name: string };

Parsers.User.hash256() === Parsers.Person.hash256();
// true
```

A compiled validator and a runtime validator with the same structure have the same hash:

```ts
import { b } from "@beff/client";

const AdHocUser = b.Object({ name: b.String(), age: b.Number() });

AdHocUser.hash256() === Parsers.User.hash256();
// true
```

NOTE: For recursive types, `hash()` uses the type name. Two recursive types with different names have different `hash()` values. `hash256()` does not use the type name.

## Example: detect changes to an API type

Keep the hash in a test. When the type changes, the test fails. Then, update the API version and the hash.

```ts
import { expect, it } from "vitest";
import { Parsers } from "./parser";

it("the User API type did not change", () => {
  expect(Parsers.User.hash256()).toBe("061bef74fc42f13b4925c544083fcd9a768186f7692c05e01a0b5242fcdb6b7e");
});
```
