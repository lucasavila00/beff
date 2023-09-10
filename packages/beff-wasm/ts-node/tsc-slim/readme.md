# how to re-build

clone typescript repo and create a file with

```
// src/compiler/mod2.ts
export { parseJsonConfigFileContent } from "./commandLineParser";
export { readConfigFile } from "./commandLineParser";
export { resolveModuleName } from "./moduleNameResolver";
export { findConfigFile } from "./program";
export { sys } from "./sys";
```

then

```
npx esbuild src/compiler/mod2.ts --bundle --outfile=out.js --platform=node --target=node14
```
