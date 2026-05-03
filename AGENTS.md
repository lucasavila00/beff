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
