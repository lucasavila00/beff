# Contributing

## Requirements

- Rust 1.72.0
- Node 18

### Setup

- `pnpm install`

To build and test everything:

- `DEBUG=true pnpm all`

DEBUG environment variable controls whether WASM is compiled in release or dev mode. It takes a minute to compile in release mode and a second on dev mode.

### Setup (web)

The website is made of 2 projects. The playground (web-demo/demo) should be built before building the website (web/docs).

You must build the rust/wasm code before starting the playground (pnpm build).

#### Test the playground:

`cd web-demo/demo && npm run dev`

#### Test the website:

`cd web/docs && npm run start`

### Build

To build:

`(cd web-demo/demo && npm run build3) && (cd web/docs && npm run build4)`
