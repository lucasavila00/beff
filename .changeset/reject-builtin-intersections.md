---
"@beff/cli": major
---

Report a compile error for an intersection of `Date`, `Map`, `Set` or a typed array (for example `Uint8Array`) with a different type, for example `Date & { foo: string }`. A value of such a class cannot also be a value of a different type, so Beff cannot validate or parse it. Before, these types compiled and the runtime tried to parse them.

Migration: remove the intersection. If you need the extra data, put the `Date` (or other class value) in a property of an object type, for example `{ date: Date; foo: string }`.
