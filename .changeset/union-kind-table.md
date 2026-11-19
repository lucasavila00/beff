---
"@beff/cli": patch
"@beff/client": patch
---

Parse recursive types through a union in linear time. The compiler prints, for a union whose members accept different kinds of value, the node that checks each kind. The runtime then calls only the node of the input's kind (#425).
