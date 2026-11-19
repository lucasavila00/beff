---
"@beff/client": major
"@beff/cli": major
---

Faster `validate`, `parse` and `safeParse`, and a smaller generated `parser.js`. The runtime is now a set of builder functions (`str`, `obj`, `union`, `ref`, ...) that return closures, and the generated code calls these builders instead of creating class instances.

Migration: update `@beff/cli` and `@beff/client` together, then regenerate the parsers with the matching CLI (run `beff` again). A `parser.js` from an older `@beff/cli` does not work with this `@beff/client`, and the new `parser.js` does not work with an older `@beff/client`.

Visible changes:

- The format of `parser.js` changed (one statement for each line, without whitespace).
- The runtype classes (`ObjectRuntype`, `AnyOfRuntype`, ...) are no longer exported from `@beff/client/codegen-v2`.
- Loaded parsers use more memory, and the deepest recursive input that does not overflow the stack is a little smaller.

The accepted inputs, the parsed values, the error messages and the output of `describe`, `schema`, `hash` and `hash256` did not change.
