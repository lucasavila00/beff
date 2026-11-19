---
"@beff/cli": patch
---

Faster code generation for unions of many object types: each candidate discriminator key is checked once, and the variants are grouped by discriminator value once.
