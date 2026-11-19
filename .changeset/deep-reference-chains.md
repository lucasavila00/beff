---
"@beff/cli": patch
---

Compile long chains of type references (`type R0 = { next: R1 }; type R1 = { next: R2 }; ...`) without a stack overflow, and report an error instead of crashing when inline types are nested too deeply.
