## BFF Lib

## BFF Core

- [ ] decoder error message must be available in the generated code => how to avoid duplicating it in the runtime?

- [ ] string formats (uuid, email)

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

- [ ] fix skipped tests => eslint to catch these?
