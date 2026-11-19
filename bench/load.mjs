// Load benchmark: the size of the generated `parser.js`, and the time and heap that loading it takes.
//
//   node load.mjs [--shape union] [--scale 800]
//
// "load" is the import of `parser.js` plus the `buildParsers` call, in a new process. "heap after load" is the
// heap that is still in use after that, measured after a garbage collection. "heap after first use" is the heap
// after each parser was also used one time: it has the data that a parser makes on its first call.
// All are the median of 5 processes.
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import { createRequire } from "node:module";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { gzipSync } from "node:zlib";
import { buildSync, transformSync } from "esbuild";
import { shapes, generate, compile, outDir, formatArgs, corrupt } from "./gen.mjs";
import { operations } from "./measure.mjs";

const self = fileURLToPath(import.meta.url);
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
const sizes = (code) => {
  const min = transformSync(code, { minify: true }).code;
  return [code.length, gzipSync(code).length, min.length, gzipSync(min).length].map(kb);
};
const median = (xs) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)];

// Calls each method of each parser one time, and each operation of measure.mjs on `Root`.
function firstUse(parsers, shape, N) {
  for (const parser of Object.values(parsers)) {
    parser.validate(undefined);
    parser.safeParse(undefined);
    // `describe` and `schema` can throw: some types have no JSON Schema, and a long chain of recursive types
    // overflows the stack.
    try {
      parser.describe();
    } catch {}
    try {
      parser.schema();
    } catch {}
  }
  const valid = shapes[shape].value(N, 4);
  const invalid = corrupt(shapes[shape].value(N, 4));
  for (const operation of Object.values(operations(parsers.Root))) {
    operation(valid, invalid);
  }
}

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
  firstUse(parsers, shape, Number(N));
  globalThis.gc();
  const heapAfterFirstUse = process.memoryUsage().heapUsed - heapBefore;
  console.log(JSON.stringify({ ms, heap, heapAfterFirstUse, parsers: Object.keys(parsers).length }));
} else {
  const { values } = parseArgs({ options: { shape: { type: "string" }, scale: { type: "string" } } });
  const N = Number(values.scale ?? 800);

  const client = createRequire(import.meta.url).resolve("@beff/client/codegen-v2");
  const bundle = buildSync({
    entryPoints: [client],
    bundle: true,
    format: "esm",
    external: ["zod"],
    write: false,
  });
  console.log(`\n### @beff/client/codegen-v2 (bundled, without zod)\n`);
  console.log("| raw | gzip | minified | minified + gzip |");
  console.log("| --- | --- | --- | --- |");
  console.log(`| ${sizes(bundle.outputFiles[0].text).join(" | ")} |`);

  console.log(`\n### parser.js (scale ${N})\n`);
  console.log(
    "| shape | raw | gzip | minified | minified + gzip | load | heap after load | heap after first use |",
  );
  console.log("| --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const shape of values.shape ? [values.shape] : Object.keys(shapes)) {
    const dir = outDir(shape, N);
    generate(shape, N, dir);
    try {
      compile(dir);
    } catch (e) {
      console.log(
        `| ${shape} | failed: ${e.message.split("\n").slice(1).join(" ").slice(0, 120)} | | | | | | |`,
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
    const heapAfterFirstUse = median(runs.map((r) => r.heapAfterFirstUse));
    console.log(
      `| ${shape} | ${sizes(fs.readFileSync(file, "utf-8")).join(" | ")} | ${ms.toFixed(1)} ms | ${kb(heap)} | ${kb(heapAfterFirstUse)} |`,
    );
  }
}
