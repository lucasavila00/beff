---
"@beff/client": patch
"@beff/cli": patch
---

Faster `validate`, `parse` and `safeParse`, and a smaller generated `parser.js`. The runtime is now a set of builder functions (`str`, `obj`, `union`, `ref`, ...) that return closures, and the generated code calls these builders instead of creating class instances.

Run `beff` again after the update: a `parser.js` from an older `@beff/cli` does not work with this `@beff/client`, and the new `parser.js` does not work with an older `@beff/client`. Update the two packages together.

Visible changes:

- The format of `parser.js` changed (one statement for each line, without whitespace).
- The runtype classes (`ObjectRuntype`, `AnyOfRuntype`, ...) are no longer exported from `@beff/client/codegen-v2`.
- The items of a sparse array that are not set are `undefined` in the parsed array.

The accepted inputs, the parsed values, the error messages and the output of `describe`, `schema`, `hash` and `hash256` did not change.
