# Contributing

## Requirements

- Rust
- Node

### Setup

- `pnpm install`

To build and test everything:

- `DEBUG=true pnpm all`

DEBUG environment variable controls whether WASM is compiled in release or dev mode.

It takes a minute to compile in release mode and a second on dev mode.

Dev mode contains function names in stack traces.

## Publishing to npm

Creating a GitHub release runs `.github/workflows/publish.yml` to build and publish `@beff/cli` and
`@beff/client`. Both package versions must be unpublished on npm before creating the release.

The workflow uses [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/) with GitHub Actions
OIDC. Node 24 supplies a compatible npm CLI (11.5.1 or later). pnpm packs the packages to resolve
`workspace:` dependencies, then npm publishes the tarballs without an npm token. npm automatically adds
provenance for public packages published from this public repository.

Before the first release with this workflow, configure a GitHub Actions trusted publisher in the npm
Settings page for **each** package (`@beff/cli` and `@beff/client`):

| Field                | Value               |
| -------------------- | ------------------- |
| Organization or user | `lucasavila00`      |
| Repository           | `beff`              |
| Workflow filename    | `publish.yml`       |
| Environment name     | Leave blank         |
| Allowed actions      | Allow `npm publish` |

These values are case-sensitive. Complete the first successful publish within two days of creating the
trusted publisher, or recreate the expired configuration before releasing.

After a successful release confirms OIDC works for both packages, select **Require two-factor
authentication and disallow tokens** under each package's npm Publishing access settings. Revoke the old
npm automation token and delete the repository's `NPM_TOKEN` Actions secret if nothing else uses it.
