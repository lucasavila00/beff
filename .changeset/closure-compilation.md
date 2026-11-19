---
"@beff/client": patch
---

Faster `validate`, `safeParse` and `parse`: each runtype is compiled once into closures that call the closures of their children directly, instead of walking the runtype classes on every call. Results and error messages do not change.
