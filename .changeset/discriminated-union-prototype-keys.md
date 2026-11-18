---
"@beff/client": patch
---

Fix discriminated unions throwing a `TypeError` when the discriminator value is an `Object.prototype` member name, such as `"toString"` or `"constructor"`. The validator now rejects these values with the usual error.
