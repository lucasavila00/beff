---
"@beff/cli": major
---

Breaking change: Beff now reports a compile error for an intersection of `Date`, `Map`, `Set` or a typed array (for example `Uint8Array`) with a different type, for example `Date & { foo: string }`. Before, these types compiled.
