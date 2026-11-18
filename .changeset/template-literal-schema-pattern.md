---
"@beff/client": patch
---

Fix the JSON Schema `pattern` of template literal types. It is now the regular expression that the validator uses, not the TypeScript text of the type.
