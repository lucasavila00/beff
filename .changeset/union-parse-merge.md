---
"@beff/client": patch
---

Fix `parse` of a union type changing `Map` and `Set` values to `{}` and removing keys such as `constructor` and `prototype`.
