---
"@beff/client": patch
---

Faster `parse` and `safeParse` of unions: branches that cannot accept the kind of the input (for example `null` against an object type) are skipped, and when one branch is left it is parsed without being validated again. Parsing a recursive type such as `next: Node | null` is now linear in the depth instead of quadratic.
