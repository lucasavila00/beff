---
"@beff/client": patch
---

Faster error reporting on recursive types: `safeParse` and `parse` of an invalid value no longer validate everything below each level again, copy the error path at every level, or stringify every union error to deduplicate it. Reporting an error at depth d now takes time linear in d instead of quadratic. The reported errors (messages, paths, order, union grouping) do not change.
