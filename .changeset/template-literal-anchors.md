---
"@beff/cli": patch
---

Fix template literal types accepting strings that match only in part. The generated regular expression now has `^` and `$` anchors, so the full string must match.
