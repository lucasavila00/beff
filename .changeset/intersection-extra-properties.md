---
"@beff/client": patch
---

Fix `disallowExtraProperties` rejecting valid values of intersection types: extra properties are now checked against the keys of all members of the intersection.
