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