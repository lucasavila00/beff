---
"@beff/client": patch
---

Faster validation of objects with an index signature or with `disallowExtraProperties`: extra keys are found with a property lookup instead of a scan of the declared properties.
