---
"@beff/cli": patch
---

`Record<1 | 2, T>` and mapped types over number literal keys now produce required named properties `"1"` and `"2"`, as in TypeScript, instead of an index signature that never matched.
