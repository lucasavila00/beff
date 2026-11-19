---
"@beff/cli": patch
"@beff/client": patch
---

Faster `parse` and `safeParse` of unions. The compiler now prints, for each branch of a union, the kinds of value the branch can accept (null, boolean, number, string, bigint, array, object), computed from its semantic type. The runtime skips the branches that cannot accept the input, and when one branch is left it is parsed without being validated again. Parsing a recursive type such as `next: Node | null` or `Node | string` is now linear in the depth instead of quadratic, in any branch order.
