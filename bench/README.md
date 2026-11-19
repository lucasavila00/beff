# bench

Manual stress tests and benchmarks for the compiler and the generated validators.

The benchmarks are manual. They are not part of `pnpm test`, and they do not run automatically in CI. Do not add them to the Tests workflow, and do not add push or pull request triggers to the Bench workflow. Start them on purpose when you need numbers. Run them in CI, as described in [Running in CI](#running-in-ci), so that results come from the same kind of machine. Run them on your own machine only to debug a script.

Build first. Use a release build for numbers, because `DEBUG=true` builds are much slower:

```sh
pnpm build
pnpm bench                 # compile, runtime, stress and load below, with default options
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

# Size of the generated parser.js (raw, gzip, minified), and the time and heap that loading it takes.
# "heap after first use" is the heap after each parser was also used one time (validate, safeParse, describe,
# schema). It shows the memory of data that a parser makes on its first call.
# Also prints the size of the @beff/client/runtime runtime.
node load.mjs [--shape objects] [--scale 800]

# Compare two versions on the same machine: runtime, load time, heap (after load, after first use) and minified sizes.
# The baseline is another built checkout of beff (a clone or a worktree, after `pnpm install && pnpm build`).
# The versions take turns, each in a new process, for --rounds rounds.
node compare.mjs --baseline <checkout> [--shape union] [--rounds 5] [--scale 16] [--load-scale 800]
```

`compare.mjs` prints the ratio candidate / baseline of each cell: the median of the rounds, and the lowest and the highest round in parentheses. Use it to compare two versions. Do not compare the tables of two different runs: the runners are different machines, and the same version can take 1.5 times the time on one runner.

## Running in CI

`.github/workflows/bench.yml` runs only when you start it. It does a release build, runs `compile.mjs`, `runtime.mjs`, `stress.mjs` and `load.mjs`, writes the tables to the job summary, and uploads the raw output as the `bench-results` artifact. The job fails if `stress.mjs` finds failures.

Then it builds `baseline_ref` (default `main`) in a worktree on the same runner and runs `compare.mjs` with it as the baseline. Set `baseline_ref` to an empty string to skip the comparison. The baseline does not need the bench scripts: `compare.mjs` of the branch uses only the CLI and the client of the baseline.

1. Push the branch with the change to measure.
2. Start the workflow on that branch. With no inputs it runs all shapes with default options:

   ```sh
   gh workflow run bench.yml --ref <branch>
   gh workflow run bench.yml --ref <branch> -f shape=recursive -f runtime_args="--scale 32" -f stress_args="--runs 2000"
   gh workflow run bench.yml --ref <branch> -f baseline_ref=<other-branch> -f compare_args="--rounds 9"
   ```

3. Read the results:

   ```sh
   gh run list --workflow bench.yml --branch <branch> --limit 1
   gh run download <id> -n bench-results
   ```

CI runners differ by 1.1x to 1.5x between runs, also when the runs start at the same time. To compare two versions, use the comparison in the same job (`baseline_ref`). To see the noise of the comparison, compare a branch with itself, for example `--ref main -f baseline_ref=main`.

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
