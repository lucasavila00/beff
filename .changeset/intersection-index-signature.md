---
"@beff/client": patch
---

Fix intersections with an index signature rejecting the keys of the other members: in an intersection, an index signature now only constrains the keys it matches.
