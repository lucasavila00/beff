---
"@beff/client": patch
---

Faster `validate`, `safeParse` and `parse`: each runtype is compiled once into closures that call the closures of its children directly. Union parsing only tries the branches that accept the kind of the input (string, number, object, ...), and error reporting no longer validates every value below each level again. Error messages do not change, with two exceptions: an object key that one index signature accepts no longer gets errors from the other index signatures, and an intersection of non-object members now reports `expected object` for a non-object input instead of no errors.
