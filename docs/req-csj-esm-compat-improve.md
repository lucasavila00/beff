# Feature Request: Improve CJS/ESM Compatibility for `@beff/client` and Generated Parsers

## Problem

`@beff/client` currently publishes separate `require` and `import` entrypoints:

- `require` -> `dist/cjs/*.js`
- `import` -> `dist/esm/*.js`

But the package does not declare `"type": "module"` and the ESM build uses `.js` extensions. Some runtimes and loaders handle that package shape inconsistently.

Observed failure in a real consumer:

- Runtime: `Node.js v24.14.1`
- Loader: `tsx v4.21.0`
- Consumer imports generated BEFF parser from an ESM TypeScript CLI
- Error:

```text
SyntaxError: The requested module '@beff/client/codegen-v2' does not provide an export named 'AllOfRuntype'
```

The generated parser contains named imports like:

```js
import {
  AllOfRuntype,
  AnyOfRuntype,
  ObjectRuntype,
  ...
} from "@beff/client/codegen-v2";
```

Under plain native Node ESM, `import("@beff/client/codegen-v2")` exposes the expected named exports.

Under `tsx`, the same import resolves to a CommonJS-shaped namespace:

```js
["default", "module.exports"]
```

with the actual exports nested under `default`. That makes BEFF-generated named imports fail at module instantiation time.

The same problem also affects `@beff/client` root imports such as:

```ts
import { b } from "@beff/client";
```

Under `tsx`, `b` is only available at `default.b`.

## Why This Matters

This makes BEFF-generated output fragile across common modern toolchains:

- `tsx`
- some ESM/CJS interop paths
- any loader that treats the package as CommonJS-shaped even when the `exports.import` condition points at the ESM build

The consumer should not need to patch generated files or hand-roll import normalization.

## Likely Root Cause

`packages/beff-client/package.json` currently exports ESM files at:

- `./dist/esm/index.js`
- `./dist/esm/codegen-v2.js`

but the package is not marked as ESM with `"type": "module"`, and the ESM artifacts do not use `.mjs`.

That leaves room for loader-specific interpretation and interop wrapping.

## Requested Improvements

Implement at least one robust fix at the package level, and preferably also harden generated output.

### Option A: Fix package publishing

Apply the package-boundary fix to `@beff/client`, which is the only published npm package in this repo that currently exposes both `require` and `import` entrypoints.

Preferred implementation:

- add `"type": "module"` to `packages/beff-client/package.json`
- keep `exports.import` pointing at `./dist/esm/*.js`
- preserve `exports.require` by making `./dist/cjs` explicitly CommonJS, for example by emitting a `dist/cjs/package.json` with `{ "type": "commonjs" }`

Important nuance: adding `"type": "module"` at the package root is not enough on its own. Today `dist/cjs/*.js` contains CommonJS output, so those files must either live under an explicitly CommonJS subpackage or be renamed to `.cjs`. Otherwise the `require` condition will break as soon as the package root becomes ESM.

Alternative implementation:

- emit the ESM build as `.mjs`
- point `exports.import` at the `.mjs` files

That alternative should work, but it is a worse fit for the current repo because the TypeScript build already emits `.js` files with internal relative `.js` imports. Switching to `.mjs` would require a post-build rename step plus rewriting those internal import specifiers across the ESM output.

This is the cleaner long-term fix because it addresses the package boundary directly instead of pushing interop work onto generated consumers.

### Option B: Harden generated parser imports

Change generated ESM parser output to avoid assuming named exports survive every loader path. For example:

```js
import * as beffCodegenV2Import from "@beff/client/codegen-v2";

const beffCodegenV2 =
  "default" in beffCodegenV2Import
    ? beffCodegenV2Import.default
    : beffCodegenV2Import;

const {
  AllOfRuntype,
  AnyOfRuntype,
  ObjectRuntype,
  ...
} = beffCodegenV2;
```

Likewise for `@beff/client` root imports:

```ts
import * as beffClientImport from "@beff/client";

const beffClient =
  "default" in beffClientImport ? beffClientImport.default : beffClientImport;

const { b } = beffClient;
```

This is less elegant than fixing the package itself, but it makes generated output more resilient in mixed-loader environments.

## Recommendation

Do both:

1. Fix `@beff/client` package publishing so the package root is unambiguously ESM and the `require` path remains explicitly CommonJS.
2. Make generated parser code tolerant of `default`-wrapped interop namespaces.

Reasoning:

- packaging fixes the root issue for future consumers
- generator hardening protects against loader quirks and old published versions
- `@beff/cli` does not need this export-condition work because it is a bin package
- `beff-wasm` is a downstream consumer to validate, not a package whose npm exports need to change

## Acceptance Criteria

- `import("@beff/client")` exposes `b` as a named export under native Node ESM
- `import("@beff/client/codegen-v2")` exposes `AllOfRuntype` as a named export under native Node ESM
- the same two imports work under `tsx`
- `require("@beff/client")` continues to load the CommonJS build after the package root is marked as ESM
- `require("@beff/client/codegen-v2")` continues to load the CommonJS build after the package root is marked as ESM
- a generated parser using the default ESM codegen output runs successfully under `tsx`
- no consumer-side patching is required

## Tests To Add

Add an e2e fixture that executes generated ESM code through `tsx`, not only through Vitest or direct Node execution.

Suggested checks:

- `tsx` script importing `@beff/client` and reading `b`
- `tsx` script importing `@beff/client/codegen-v2` and reading `AllOfRuntype`
- Node CommonJS script requiring `@beff/client` and reading `b`
- Node CommonJS script requiring `@beff/client/codegen-v2` and reading `AllOfRuntype`
- `tsx` script importing a generated parser and calling `buildParsers()`

This should fail on the current package shape and pass once compatibility is fixed.

## Notes

Existing BEFF e2e generated fixtures already show the fragile pattern:

- `e2e-tests/codegen-tests/src/generated/parser.js`
- similar generated parsers in other `e2e-tests/*`

So this is not just a downstream consumer mistake; the current generated import shape is part of the problem surface.

Package scope note:

- `@beff/client` is the package whose root and subpath exports need to be fixed
- `@beff/cli` is a bin-only package and does not need ESM/CJS export-condition changes
- `beff-wasm` publishes through `vsce`; it should be used to validate downstream behavior, not treated as part of the npm package-boundary fix
