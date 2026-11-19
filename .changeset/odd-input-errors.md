---
"@beff/client": patch
---

`safeParse` does not throw for odd inputs. It returns validation errors for them. Examples: an array with `Date.prototype`, `Map.prototype` or `Set.prototype`, and cyclic values in a union or in Map keys and Set items. `Date`, `Map` and `Set` types do not accept a value that only has the prototype of that class.
