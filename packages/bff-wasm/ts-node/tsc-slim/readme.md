# how to re-build

clone typescript repo and create a file with

```
// src/compiler/mod2.ts
export { resolveModuleName } from "./moduleNameResolver";
```

then

```
npx esbuild src/compiler/mod2.ts --bundle --outfile=out.js --platform=node --target=node14
```
