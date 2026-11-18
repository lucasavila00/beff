---
"@beff/cli": patch
---

Fix the CLI crashing with `ENOENT` when the parent folders of `outputDir` do not exist. The CLI now creates all missing folders.
