// TEMPORARY profiling script (scratch branch only). Where do the load time and the heap of parser.js go?
//
//   node profile-load.mjs [--checkout <built checkout>] [--label candidate] [--shapes objects,generics]
//                         [--scale 800] [--runs 15]
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { generate, compile, formatArgs } from "./gen.mjs";

const self = fileURLToPath(import.meta.url);
const benchDir = path.dirname(self);
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

async function snapshotTotals() {
  const v8 = await import("node:v8");
  globalThis.gc();
  const chunks = [];
  for await (const chunk of v8.getHeapSnapshot()) chunks.push(chunk);
  const snap = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
  const fields = snap.snapshot.meta.node_fields;
  const types = snap.snapshot.meta.node_types[0];
  const [iType, iName, iSize] = ["type", "name", "self_size"].map((f) => fields.indexOf(f));
  const totals = {};
  for (let i = 0; i < snap.nodes.length; i += fields.length) {
    const type = types[snap.nodes[i + iType]];
    let name = snap.strings[snap.nodes[i + iName]];
    // Strings and code have many different names. Group them by type.
    if (type === "string" || type === "concatenated string" || type === "sliced string" || type === "number")
      name = "*";
    if (type === "code") name = name.replace(/^\((.*?)( for | code).*$/, "($1)").slice(0, 40);
    if (name.length > 60) name = name.slice(0, 60);
    const key = `${type}: ${name}`;
    const t = (totals[key] ??= { size: 0, count: 0 });
    t.size += snap.nodes[i + iSize];
    t.count++;
  }
  return totals;
}

if (process.argv[2] === "--child-cpu") {
  const [file, shape, N] = process.argv.slice(3);
  const inspector = await import("node:inspector/promises");
  const session = new inspector.Session();
  session.connect();
  await session.post("Profiler.enable");
  await session.post("Profiler.setSamplingInterval", { interval: 20 });
  await session.post("Profiler.start");
  const t0 = performance.now();
  const mod = await import(pathToFileURL(file).href);
  const t1 = performance.now();
  mod.default.buildParsers(formatArgs(shape, Number(N)));
  const t2 = performance.now();
  const { profile } = await session.post("Profiler.stop");
  const self = {};
  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  profile.samples.forEach((id, i) => {
    const n = byId.get(id);
    const f = n.callFrame;
    const key = `${f.functionName || "(anonymous)"} ${path.basename(f.url)}:${f.lineNumber + 1}`;
    if (key.startsWith("post node:inspector")) return;
    self[key] = (self[key] ?? 0) + profile.timeDeltas[i] / 1000;
  });
  console.log(JSON.stringify({ importMs: t1 - t0, buildMs: t2 - t1, self }));
} else if (process.argv[2] === "--child-heap") {
  const [file, shape, N, client] = process.argv.slice(3);
  // Load the client (and zod) first, so that the difference is only parser.js and its nodes.
  await import(pathToFileURL(fs.realpathSync(client)).href);
  // Keep the first table as bytes outside the heap, so that it is not in the difference.
  await snapshotTotals();
  const beforeBytes = Buffer.from(JSON.stringify(await snapshotTotals()));
  const mod = await import(pathToFileURL(file).href);
  const parsers = mod.default.buildParsers(formatArgs(shape, Number(N)));
  const after = await snapshotTotals();
  const before = JSON.parse(beforeBytes.toString());
  const diff = {};
  for (const key of Object.keys(after)) {
    const size = after[key].size - (before[key]?.size ?? 0);
    const count = after[key].count - (before[key]?.count ?? 0);
    if (size !== 0 && !key.includes("JSArrayBufferData")) diff[key] = { size, count };
  }
  console.log(JSON.stringify({ diff, parsers: Object.keys(parsers).length }));
} else {
  const { values } = parseArgs({
    options: {
      checkout: { type: "string" },
      label: { type: "string" },
      shapes: { type: "string" },
      scale: { type: "string" },
      runs: { type: "string" },
    },
  });
  const checkout = path.resolve(values.checkout ?? path.join(benchDir, ".."));
  const label = values.label ?? "candidate";
  const N = Number(values.scale ?? 800);
  const runs = Number(values.runs ?? 15);
  const out = path.join(benchDir, "out", `profile-${label}`);
  const clientLink = path.join(out, "node_modules", "@beff", "client");
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(clientLink), { recursive: true });
  fs.symlinkSync(path.join(checkout, "packages", "beff-client"), clientLink, "dir");
  const cli = path.join(checkout, "packages", "beff-cli", "bin", "index.js");
  const clientFile = path.join(clientLink, "dist", "esm", "codegen-v2.js");

  for (const shape of (values.shapes ?? "objects,generics,intersections").split(",")) {
    const dir = path.join(out, `${shape}-${N}`);
    generate(shape, N, dir);
    compile(dir, cli);
    const file = path.join(dir, "src", "generated", "parser.js");
    console.log(`\n## ${label}: ${shape} (scale ${N})\n`);

    const cpu = [];
    for (let i = 0; i < runs; i++) {
      cpu.push(JSON.parse(execFileSync(process.execPath, [self, "--child-cpu", file, shape, N])));
    }
    console.log(
      `import ${median(cpu.map((r) => r.importMs)).toFixed(1)} ms, buildParsers ${median(cpu.map((r) => r.buildMs)).toFixed(2)} ms (median of ${runs}, with the profiler on)\n`,
    );
    const self_ = {};
    for (const r of cpu) for (const [k, v] of Object.entries(r.self)) self_[k] = (self_[k] ?? 0) + v / runs;
    const total = Object.values(self_).reduce((a, b) => a + b, 0);
    console.log(`### CPU self time, mean of ${runs} processes (total ${total.toFixed(1)} ms)\n`);
    console.log("| function | ms | % |\n| --- | --- | --- |");
    for (const [k, v] of Object.entries(self_)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 45)) {
      console.log(`| ${k} | ${v.toFixed(2)} | ${((100 * v) / total).toFixed(1)} |`);
    }

    const heap = JSON.parse(
      execFileSync(process.execPath, ["--expose-gc", self, "--child-heap", file, shape, N, clientFile], {
        maxBuffer: 1 << 28,
      }),
    );
    const heapTotal = Object.values(heap.diff).reduce((a, b) => a + b.size, 0);
    console.log(`\n### Heap added by the load, by node type (total ${(heapTotal / 1024).toFixed(0)} KB)\n`);
    console.log("| type: name | KB | count |\n| --- | --- | --- |");
    for (const [k, v] of Object.entries(heap.diff)
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, 40)) {
      console.log(`| ${k.replace(/\|/g, "\\|")} | ${(v.size / 1024).toFixed(1)} | ${v.count} |`);
    }
  }
}
