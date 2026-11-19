// Load benchmark: the size of the generated `parser.js`, and the time and heap that loading it takes.
//
//   node load.mjs [--shape union] [--scale 800]
//
// "load" is the import of `parser.js` plus the `buildParsers` call, in a new process. "heap" is the heap
// that is still in use after that, measured after a garbage collection. Both are the median of 5 processes.
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import { createRequire } from "node:module";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { gzipSync } from "node:zlib";
import { buildSync, transformSync } from "esbuild";
import { shapes, generate, compile, outDir, formatArgs } from "./gen.mjs";

const self = fileURLToPath(import.meta.url);
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
const sizes = (code) => {
  const min = transformSync(code, { minify: true }).code;
  return [code.length, gzipSync(code).length, min.length, gzipSync(min).length].map(kb);
};
const median = (xs) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)];

if (process.argv[2] === "--child") {
  // One measurement, in its own process: node --expose-gc load.mjs --child <parser.js> <shape> <scale>
  const [file, shape, N] = process.argv.slice(3);
  globalThis.gc();
  const heapBefore = process.memoryUsage().heapUsed;
  const start = performance.now();
  const mod = await import(pathToFileURL(file).href);
  const parsers = mod.default.buildParsers(formatArgs(shape, Number(N)));
  const ms = performance.now() - start;
  globalThis.gc();
  const heap = process.memoryUsage().heapUsed - heapBefore;
  console.log(JSON.stringify({ ms, heap, parsers: Object.keys(parsers).length }));
} else {
  const { values } = parseArgs({ options: { shape: { type: "string" }, scale: { type: "string" } } });
  const N = Number(values.scale ?? 800);

  const client = createRequire(import.meta.url).resolve("@beff/client/runtime");
  const bundle = buildSync({
    entryPoints: [client],
    bundle: true,
    format: "esm",
    external: ["zod"],
    write: false,
  });
  console.log(`\n### @beff/client/runtime (bundled, without zod)\n`);
  console.log("| raw | gzip | minified | minified + gzip |");
  console.log("| --- | --- | --- | --- |");
  console.log(`| ${sizes(bundle.outputFiles[0].text).join(" | ")} |`);

  console.log(`\n### parser.js (scale ${N})\n`);
  console.log("| shape | raw | gzip | minified | minified + gzip | load | heap |");
  console.log("| --- | --- | --- | --- | --- | --- | --- |");
  for (const shape of values.shape ? [values.shape] : Object.keys(shapes)) {
    const dir = outDir(shape, N);
    generate(shape, N, dir);
    try {
      compile(dir);
    } catch (e) {
      console.log(
        `| ${shape} | failed: ${e.message.split("\n").slice(1).join(" ").slice(0, 120)} | | | | | |`,
      );
      continue;
    }
    const file = path.join(dir, "src/generated/parser.js");
    const runs = [];
    for (let i = 0; i < 5; i++) {
      runs.push(JSON.parse(execFileSync(process.execPath, ["--expose-gc", self, "--child", file, shape, N])));
    }
    const ms = median(runs.map((r) => r.ms));
    const heap = median(runs.map((r) => r.heap));
    console.log(
      `| ${shape} | ${sizes(fs.readFileSync(file, "utf-8")).join(" | ")} | ${ms.toFixed(1)} ms | ${kb(heap)} |`,
    );
  }
}
