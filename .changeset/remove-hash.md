---
"@beff/cli": major
"@beff/client": major
---

Remove the `hash()` and `hash256()` methods from parsers. Also remove the exports `generateHashFromString` and `generateHashFromNumbers` from `@beff/client/codegen-v2`.

Migration: `hash()` and `hash256()` are removed. If a test keeps a hash of a type to find changes, keep the output of `describe()` or `schema()` in the snapshot instead. Run `beff` again to make new generated files: the old generated files import `generateHashFromString`, and this export is removed.

In OpenAPI and JSON Schema output, the number at the end of the names of inline discriminated union variants (for example `DiscriminatedTypeCRON1906106737`) changes. Beff now calculates this number from the flat JSON Schema of the union.
