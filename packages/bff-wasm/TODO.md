## BFF Lib

## BFF Core

- [ ] qualified import type

```ts
export { import1 as name1 } from "module-name";

// import 2, everything with 2
// export { variable1 as name1, variable2 as name2 };
// export { import1 as name1, import2 as name2 } from "module-name";
// export { name1, name2 } from "module-name";
```

- [ ] namespace

- [ ] 422 in schema

- [ ] export decoders
- [ ] string formats (uuid, email)

- [ ] clap descriptions of params
- [ ] snapshots of both esm and cjs generation

- [ ] future tuple args

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
