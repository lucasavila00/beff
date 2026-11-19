---
"@beff/client": patch
---

Faster `parse` and `safeParse` of unions: the last branch is not validated again when no earlier branch matched. Recursive types such as `next: Node | null` now parse in linear time instead of quadratic.
