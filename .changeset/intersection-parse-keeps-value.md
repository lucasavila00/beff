---
"@beff/client": patch
---

Fix `parse` of an intersection that gets a value that is not a plain object, for example a `Date` or `null`. `parse` now gives that value. Before, it gave a plain object that the same type does not accept.
