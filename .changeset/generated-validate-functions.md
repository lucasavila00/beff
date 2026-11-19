---
"@beff/cli": minor
"@beff/client": minor
---

`validate` of compiled parsers is faster: Beff now writes a small JavaScript validate function for each type whose generated code has at most `codegen.maxValidateFunctionSize` characters (default 2000), and larger types keep using the runtime validator. This makes the generated `parser.js` larger: in the e2e projects, 8–35% larger raw, 14–72% minified and 11–39% gzipped. Set `"codegen": { "maxValidateFunctionSize": 0 }` in beff.json to generate no functions and keep `parser.js` at its previous size.
