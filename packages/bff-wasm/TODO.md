## BFF Lib

## BFF Core

- [ ] fix skipped tests

- [ ] 422 in schema

  - [ ] Reusing Responses

- [ ] export decoders
- [ ] string formats (uuid, email)

- [ ] remove hono runtime from export, build it as separate package

- [ ] clap descriptions of params
- [ ] snapshots of both esm and cjs generation

- [ ] todo!, unwrap, panic

## BFF CLI

- [ ] watch mode

## BFF EXT

- [ ] diags

## BFF Core

- [ ] if it uses \*, then it can just use use
- [ ] do not allow patterns that hono does not support
- [ ] do not allow patterns styles that code generator/runtime coercer does not support
- [ ] require backend=hono config, or version

- [ ] assert header etc is imported from lib

- [ ] future tuple args

```
const x = ["a", "b", "c"] as const;
type X = (typeof x)[number]
```
