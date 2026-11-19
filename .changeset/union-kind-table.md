---
"@beff/cli": patch
"@beff/client": patch
---

Make `parse` and `safeParse` fast for a recursive type that refers to itself through a union, for example `type Node = { next: Node | null }` (issue #425). Before, the time grew with the square of the depth of the input. Now the time grows in proportion to the depth.

The compiler puts each JavaScript value in one of eight kinds: null or undefined, boolean, number, string, bigint, array, object, function. When the members of a union accept different kinds, the compiler adds a table to the generated union. The table gives the member that checks each kind. The runtime finds the kind of the input and calls only that member. It does not try each member.
