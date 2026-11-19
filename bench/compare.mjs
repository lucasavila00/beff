// Compares two versions of beff on the same machine: the runtime of the generated `Root` parser, the time,
// heap and size of loading `parser.js`, and the heap after the first use of the parsers.
//
//   node compare.mjs --baseline <checkout> [--candidate <checkout>] [--shape union] [--rounds 5]
//                    [--scale 16] [--load-scale 800]
//
// A checkout is the root of a built clone or worktree of beff (`pnpm install && pnpm build`). The candidate
// is this checkout by default. Each version compiles the projects of gen.mjs with its own CLI and loads them
// with its own @beff/client.
//
// The versions take turns: in each round, each version runs in a new process. The first version changes
// from round to round. The tables show the ratio candidate / baseline of each round: the median, and the
// lowest and the highest round in parentheses.
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import { createRequire } from "node:module";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { gzipSync } from "node:zlib";
import { buildSync, transformSync } from "esbuild";
import { shapes, generate, compile, formatArgs, corrupt } from "./gen.mjs";
import { measure, operations } from "./measure.mjs";

const self = fileURLToPath(import.meta.url);
const benchDir = path.dirname(self);

// The input size of the runtime benchmark. A recursive input is slower for each item, so it is smaller.
const inputSize = (shape) => (shape === "recursive" ? 1000 : 8000);

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
const time = (ms) => (ms >= 1 ? `${ms.toFixed(1)} ms` : `${(ms * 1000).toFixed(0)} µs`);
const ratio = (x) => `${x.toFixed(2)}x`;

// "0.62x (0.60x to 0.65x)": the median ratio of the rounds, then the lowest and the highest.
function ratioCell(baselineRounds, candidateRounds) {
  const ratios = baselineRounds.map((baseline, round) => candidateRounds[round] / baseline);
  return `${ratio(median(ratios))} (${ratio(Math.min(...ratios))} to ${ratio(Math.max(...ratios))})`;
}

// Minified size and minified + gzip size.
function minifiedSizes(code) {
  const minified = transformSync(code, { minify: true }).code;
  return { minified: minified.length, minifiedGzip: gzipSync(minified).length };
}

function sizeCell(baseline, candidate) {
  return `${kb(baseline)} → ${kb(candidate)} (${ratio(candidate / baseline)})`;
}

if (process.argv[2] === "--child") {
  // One round of the runtime benchmark for one version: node compare.mjs --child <parser.js> <shape> <scale>
  const [file, shape, scaleText] = process.argv.slice(3);
  const scale = Number(scaleText);
  const mod = await import(pathToFileURL(file).href);
  const Root = mod.default.buildParsers(formatArgs(shape, scale)).Root;
  const valid = shapes[shape].value(scale, inputSize(shape));
  const invalid = corrupt(shapes[shape].value(scale, inputSize(shape)));
  const result = {};
  for (const [name, operation] of Object.entries(operations(Root))) {
    result[name] = measure(() => operation(valid, invalid));
  }
  console.log(JSON.stringify(result));
} else {
  const { values } = parseArgs({
    options: {
      baseline: { type: "string" },
      candidate: { type: "string" },
      shape: { type: "string" },
      rounds: { type: "string" },
      scale: { type: "string" },
      "load-scale": { type: "string" },
    },
  });
  if (values.baseline == null) {
    throw new Error("--baseline <checkout> is necessary");
  }
  const rounds = Number(values.rounds ?? 5);
  const scale = Number(values.scale ?? 16);
  const loadScale = Number(values["load-scale"] ?? 800);
  const selectedShapes = values.shape ? [values.shape] : Object.keys(shapes);
  const versions = [
    { label: "baseline", checkout: path.resolve(values.baseline) },
    { label: "candidate", checkout: path.resolve(values.candidate ?? path.join(benchDir, "..")) },
  ];

  // The projects of a version are in out/compare-<label>. Its node_modules has a link to the @beff/client
  // of the version, so that the generated parser.js imports that client.
  for (const version of versions) {
    version.outDir = path.join(benchDir, "out", `compare-${version.label}`);
    const clientLink = path.join(version.outDir, "node_modules", "@beff", "client");
    fs.rmSync(version.outDir, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(clientLink), { recursive: true });
    fs.symlinkSync(path.join(version.checkout, "packages", "beff-client"), clientLink, "dir");
    version.cli = path.join(version.checkout, "packages", "beff-cli", "bin", "index.js");
  }

  // Generates and compiles the project of a shape for a version. Returns the path of its parser.js.
  const compileProject = (version, shape, projectScale) => {
    const dir = path.join(version.outDir, `${shape}-${projectScale}`);
    generate(shape, projectScale, dir);
    compile(dir, version.cli);
    return path.join(dir, "src", "generated", "parser.js");
  };

  // Runs `run(version)` for each round and version, with the versions in turns.
  // Returns the results of each version, in the order of the rounds.
  const inTurns = (run) => {
    const results = { baseline: [], candidate: [] };
    for (let round = 0; round < rounds; round++) {
      const order = round % 2 === 0 ? versions : [...versions].reverse();
      for (const version of order) {
        results[version.label].push(run(version));
      }
    }
    return results;
  };

  console.log(`Baseline: ${versions[0].checkout}\nCandidate: ${versions[1].checkout}`);
  const header = `${rounds} rounds`;
  console.log(`\n### Runtime: candidate / baseline (scale ${scale}; ${header})\n`);
  const operationNames = Object.keys(operations({}));
  console.log(`| shape | n | ${operationNames.join(" | ")} |`);
  console.log(`|${" --- |".repeat(operationNames.length + 2)}`);
  const timeRows = [];
  for (const shape of selectedShapes) {
    const files = Object.fromEntries(versions.map((it) => [it.label, compileProject(it, shape, scale)]));
    const results = inTurns((version) =>
      JSON.parse(execFileSync(process.execPath, [self, "--child", files[version.label], shape, scale])),
    );
    const roundsOf = (label, name) => results[label].map((it) => it[name]);
    const cells = operationNames.map((name) =>
      ratioCell(roundsOf("baseline", name), roundsOf("candidate", name)),
    );
    console.log(`| ${shape} | ${inputSize(shape)} | ${cells.join(" | ")} |`);
    const timeCells = operationNames.map((name) => {
      const [baseline, candidate] = [roundsOf("baseline", name), roundsOf("candidate", name)];
      return `${time(median(baseline))} → ${time(median(candidate))}`;
    });
    timeRows.push(`| ${shape} | ${inputSize(shape)} | ${timeCells.join(" | ")} |`);
  }

  console.log(`\n### Runtime: median time for each call, baseline → candidate\n`);
  console.log(`| shape | n | ${operationNames.join(" | ")} |`);
  console.log(`|${" --- |".repeat(operationNames.length + 2)}`);
  for (const row of timeRows) console.log(row);

  console.log(`\n### @beff/client/codegen-v2 (bundled), baseline → candidate\n`);
  console.log("| minified | minified + gzip |");
  console.log("| --- | --- |");
  const clientSizes = versions.map((version) => {
    const client = createRequire(path.join(version.outDir, "index.js")).resolve("@beff/client/codegen-v2");
    const bundle = buildSync({
      entryPoints: [client],
      bundle: true,
      format: "esm",
      write: false,
    });
    return minifiedSizes(bundle.outputFiles[0].text);
  });
  console.log(
    `| ${sizeCell(clientSizes[0].minified, clientSizes[1].minified)} | ${sizeCell(clientSizes[0].minifiedGzip, clientSizes[1].minifiedGzip)} |`,
  );

  console.log(`\n### Load: candidate / baseline (scale ${loadScale}; ${header})\n`);
  console.log(
    "| shape | minified | minified + gzip | load time | heap after load (median) | heap after first use (median) |",
  );
  console.log("| --- | --- | --- | --- | --- | --- |");
  const loadScript = path.join(benchDir, "load.mjs");
  for (const shape of selectedShapes) {
    const files = Object.fromEntries(versions.map((it) => [it.label, compileProject(it, shape, loadScale)]));
    const sizes = Object.fromEntries(
      versions.map((it) => [it.label, minifiedSizes(fs.readFileSync(files[it.label], "utf-8"))]),
    );
    const results = inTurns((version) =>
      JSON.parse(
        execFileSync(process.execPath, [
          "--expose-gc",
          loadScript,
          "--child",
          files[version.label],
          shape,
          loadScale,
        ]),
      ),
    );
    const loadTime = ratioCell(
      results.baseline.map((it) => it.ms),
      results.candidate.map((it) => it.ms),
    );
    const heapCell = (field) =>
      sizeCell(
        median(results.baseline.map((it) => it[field])),
        median(results.candidate.map((it) => it[field])),
      );
    console.log(
      `| ${shape} | ${sizeCell(sizes.baseline.minified, sizes.candidate.minified)} | ${sizeCell(sizes.baseline.minifiedGzip, sizes.candidate.minifiedGzip)} | ${loadTime} | ${heapCell("heap")} | ${heapCell("heapAfterFirstUse")} |`,
    );
  }
}
