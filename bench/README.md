# bench

Manual stress tests and benchmarks for the compiler and the generated validators. They are not part of `pnpm test` or CI.

Build first. Use a release build for numbers, because `DEBUG=true` builds are much slower:

```sh
pnpm build
pnpm bench                 # all three scripts below, with default options
```

Each script writes synthetic projects to `bench/out/<shape>-<scale>/` (ignored by git).

## Shapes

`gen.mjs` writes `beff.json` and `src/parser.ts` for one shape. `--scale N` sets the number of types, variants or levels:

| shape           | types                                                                                |
| --------------- | ------------------------------------------------------------------------------------ |
| `objects`       | N independent object types                                                           |
| `deep`          | one inline object type nested N levels deep                                          |
| `union`         | a union of N object types without a discriminator, and a union of N string literals  |
| `discriminated` | a discriminated union with N variants                                                |
| `recursive`     | N mutually recursive types (`R0 -> R1 -> ... -> R0`)                                 |
| `generics`      | `Box<Pair<A, B>>` instantiated with N different arguments                            |
| `records`       | `Record<string, Inner>`, where `Inner` has N fields and a template literal index key |
| `formats`       | template literals and N `StringFormat` / `NumberFormat` types                        |
| `intersections` | `Omit<A & B, "c"> & Partial<Pick<C, "a" \| "b">>` for N type triples                 |

Every shape declares a `Root` type, used by the runtime benchmark and the stress checks.

```sh
node gen.mjs --shape union --scale 400       # writes out/union-400
cd out/union-400 && node ../../node_modules/@beff/cli/bin/index.js -p beff.json -v
```

## Scripts

```sh
# Time and peak RSS of `beff -p beff.json`, doubling the scale each row.
node compile.mjs [--shape union] [--from 25] [--rows 6]

# Time per validate / safeParse / parse call on valid and invalid inputs that double in size.
# --scale is the type size, the input size starts at --from and doubles each row.
node runtime.mjs [--shape recursive] [--scale 16] [--from 1000] [--rows 6]

# Random inputs: validate, safeParse and parse must agree and must not throw.
# Also prints the deepest recursive input that does not overflow the stack.
node stress.mjs [--shape records] [--scale 8] [--runs 500] [--seed 1]
```

## Profiling

Runtime: `node --cpu-prof` on a script that imports `build` from `gen.mjs` and calls the validator in a loop.

Compiler: the release WASM has no function names. To profile it, build the WASM without `wasm-opt` and copy it to the CLI, then run `node --cpu-prof` on the CLI:

```sh
cd packages/beff-wasm
wasm-pack build --release --no-opt --target nodejs
cp pkg/beff_wasm_bg.wasm pkg/beff_wasm.js ../beff-cli/pkg/
cd ../../bench/out/union-3200 && node --cpu-prof ../../node_modules/@beff/cli/bin/index.js -p beff.json
```

Run `pnpm build` again afterwards to restore the release build.
