---
"@beff/client": patch
---

Faster `validate`, `safeParse` and `parse`: each runtype is compiled once into closures that call the closures of their children directly, instead of walking the runtype classes on every call. Union parsing only tries the branches that accept the kind of the input (string, number, object, ...). Results and error messages do not change.
