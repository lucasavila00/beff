---
"@beff/client": patch
---

Fix `parse` changing the prototype of the result when an object input has an own `"__proto__"` key, for example from `JSON.parse`. The key is now kept as an own property.
