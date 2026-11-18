---
"@beff/client": patch
---

Fix `describe()` printing property names such as `my-key` without quotes. Names that are not identifiers or plain numbers are now quoted, so the output is valid TypeScript.
