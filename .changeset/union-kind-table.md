---
"@beff/cli": patch
"@beff/client": patch
---

Parse recursive types through a union in linear time. The compiler prints, for a union whose members accept different kinds of value, a table of the runtype that checks each kind. The runtime then calls only the runtype of the kind of the input (#425).
