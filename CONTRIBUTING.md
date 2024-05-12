# Contributing

## Requirements

- Rust 1.80.0
- Node 20

### Setup

- `pnpm install`

To build and test everything:

- `DEBUG=true pnpm all`

DEBUG environment variable controls whether WASM is compiled in release or dev mode.

It takes a minute to compile in release mode and a second on dev mode.

Dev mode contains function names in stack traces.
