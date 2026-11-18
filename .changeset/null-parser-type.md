---
"@beff/client": patch
---

Fix the return type of `b.Null()`. It is now `BeffParser<null>` instead of `BeffParser<undefined>`.
