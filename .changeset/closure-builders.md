---
"@beff/client": major
"@beff/cli": major
---

Faster `validate`, `parse` and `safeParse`, and a smaller generated `parser.js` after minification. The runtime is now a set of builder functions (`string`, `object`, `union`, `reference`, ...) that return closures, and the generated code calls these builders instead of creating class instances.

Migration: update `@beff/cli` and `@beff/client` together, then regenerate the parsers with the matching CLI (run `beff` again). A `parser.js` from an older `@beff/cli` does not work with this `@beff/client`, and the new `parser.js` does not work with an older `@beff/client`.

Visible changes:

- The format of `parser.js` changed: it calls the builders.
- The runtype classes (`ObjectRuntype`, `AnyOfRuntype`, ...) are no longer exported from `@beff/client/codegen-v2`.
- Loaded parsers use more memory (1.3 to 2.2 times the heap in the benchmarks). The deepest recursive input that does not overflow the stack is up to 11% smaller (`validate`: 3437 levels instead of 3687; `safeParse` of a valid input: 2656 instead of 3000).
- `createNamedType` now accepts names that are also properties of `Object.prototype`, such as `"constructor"` and `"toString"`. Before, it threw "Named type ... already exists" for these names.

The accepted inputs, the parsed values, the error messages and the output of `describe`, `schema`, `hash` and `hash256` did not change.
