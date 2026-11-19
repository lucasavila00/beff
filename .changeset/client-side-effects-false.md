---
"@beff/client": patch
---

Mark `@beff/client` as free of import-time side effects (`"sideEffects": false`), so bundlers can drop modules that are not used, such as the `b` helpers.
