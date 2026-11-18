---
"@beff/client": patch
---

Fix `parse`, `safeParse` and `printErrors` throwing `TypeError: Do not know how to serialize a BigInt` when the input has a `bigint` value. Errors now show the value as `10n`.
