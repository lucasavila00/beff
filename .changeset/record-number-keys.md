---
"@beff/cli": patch
"@beff/client": patch
---

Fix `Record<number, T>` and number index signatures rejecting all keys. Object keys are strings, so the compiler now emits a `NumberKeyRuntype` key that accepts numeric strings such as `"1"`. The JSON Schema `propertyNames` for a number key is now a string with a numeric pattern.
