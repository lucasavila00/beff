# AGENTS.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

# Repository Guidelines

## Project Structure & Module Organization

This repository is a `pnpm` workspace plus a Cargo workspace. Main packages live in `packages/`:

- `packages/beff-core`: Rust compiler and core validation logic.
- `packages/beff-wasm`: WebAssembly wrapper, build scripts, and Vitest-based integration checks.
- `packages/beff-client`: TypeScript runtime client built to `dist/`.
- `packages/beff-cli`: published CLI entrypoint.

End-to-end fixtures live in `e2e-tests/*`, each with its own `src/`, `tests/`, and `beff.json`. Shared repo docs and release metadata live in `README.md`, `CONTRIBUTING.md`, and `.changeset/`.

## Build, Test, and Development Commands

- `pnpm install`: install workspace dependencies.
- `pnpm build`: run package build scripts across the workspace.
- `pnpm test`: run package test scripts (`cargo test`, `vitest`, and package-local tests).
- `pnpm beff`: run `beff` generation scripts in workspace packages that define them.
- `DEBUG=true pnpm all`: full build, codegen, and test pass. `DEBUG=true` keeps WASM builds in dev mode for faster iteration and better stack traces.
- `pnpm prettier:check` or `pnpm prettier:write`: verify or apply formatting.

## Coding Style & Naming Conventions

Use Prettier for JS/TS/JSON/Markdown formatting; the repo enforces `printWidth: 110` and semicolons. Follow existing style in each package rather than introducing a new one. Keep TypeScript source under `src/`, prefer descriptive file names, and use `*.test.ts` for Vitest cases. Rust code should follow standard `cargo fmt` conventions and idiomatic snake_case naming.

## Testing Guidelines

Run `pnpm run all` or to debug `DEBUG=true pnpm run all` where it will not optimize the Rust code but makes it easier to debug it.

## Bugs and Edge Cases

- Fix only problems that real code or real data can cause. Before you write a fix, find the real input or the real type that causes the problem.
- Real input is data that comes from outside the program (for example `JSON.parse` output) and normal values of the supported JavaScript types.
- Do not fix problems that need values that only JavaScript code can make, for example an object with a changed prototype, a `Proxy`, or a cyclic value.
- Do not fix problems that need types that nobody writes, for example `Date & { foo: string }`. If such a type gives wrong results, make the compiler reject it with a short error.
- If a reported problem does not occur with real code or real data, close the issue and say why.

## Errors

- Do not hide an error. If something fails, stop with an error that tells what failed. This rule applies to the library, the CLI, tests, scripts and benchmarks.
- Do not catch an error to continue, to skip an item, or to show it as a value in a table or a log.
- Do not add a fallback for an old version, an old path or an old option. Change all the code that uses it.
- Catch an error only when the code handles that error completely, for example to make a validation error for the user. Catch only the error type that you expect.

## Benchmarks

- The benchmarks in `bench/` are manual. Do not run them as part of `pnpm test`, and do not add them to the Tests workflow or to any automatic trigger (push or pull request).
- To measure, start the Bench workflow by hand on your branch: `gh workflow run bench.yml --ref <branch>`. Read the results with `gh run download <id> -n bench-results`. See `bench/README.md`.
- Do not run benchmarks or stress tests on a development machine, except to debug a benchmark script.
- Compare versions in the same run or in runs started at the same time. CI runners vary between runs.
- Every performance change needs before and after numbers from the Bench workflow in its PR.

## Pull Requests

- Put one change in each PR. Do not put unrelated changes in one PR.
- Make each PR from `main`. Do not make a PR from the branch of a different PR, unless the code cannot exist without that PR. Do not expect that an open PR will merge.
- Mark a breaking change with a `major` changeset for each affected package. Write the migration steps in the changeset.
- Write PR bodies, issues, comments and docs in ASD-STE100 Simplified Technical English.
- Keep the PR body short: the result in 1 or 2 sentences, what the change does in 2 or 3 sentences, and the issue references. Put all other details (tables, design notes, CI links, test lists) in a collapsed `<details><summary>For agents</summary>` section at the end.
- Do not write a status line (for example "Status: draft") in a PR body. The draft flag on GitHub is the status.
- Do not write long text in PR comments. Put it in the PR body.

### Draft and ready

- A draft PR has a merge conflict, or work on it is not complete. Work includes new commits, a merge of `main`, a CI run on new commits, and a review.
- A ready PR is ready for the owner to review: CI passes, the review is complete, there is no merge conflict, and nobody is working on it.
- When work starts on a PR, or a merge conflict occurs, mark the PR as a draft. When the work is complete, mark it as ready.
- Make sure that a different reviewer reads the diff of each code change before the PR is ready. A small change that does not change code (for example `.gitignore` or a CI order) needs only a CI pass.

## Generated Code

- Generated code must be easy to read: use full names and normal formatting. Do not make code shorter to save bytes. Users run a minifier.
- To compare code size, minify the code first (for example `esbuild --minify`), then use gzip. Do not compare the size of code that is not minified.

## Where To Run Tests

- Run the full test suite (`pnpm all`) in GitHub CI. Push the branch and read the results with `gh pr checks` and `gh run view --log-failed`.
- On a development machine, run only small checks to find a problem, for example one test file or one `cargo test`.
