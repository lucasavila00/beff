// Writes a synthetic Beff project: beff.json and src/parser.ts.
//
//   node gen.mjs --shape objects --scale 100 [--out out/objects-100]
//
// Every shape declares N = scale types (or variants, or depth) and a `Root` type.
// `value(N, n)` builds a valid `Root` value whose size grows with n. The last
// leaf of every value is a primitive, so `corrupt` can make it invalid.
import * as fs from "node:fs";
import * as path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const range = (n) => Array.from({ length: n }, (_, i) => i);
const repeat = (n, f) => range(n).map(f);

export const shapes = {
  // N independent object types. Root is an array of the first one.
  objects: {
    types: (N) =>
      repeat(
        N,
        (i) =>
          `type O${i} = { id: string; n${i}: number; flag: boolean; tags: string[]; opt?: string; pos: { x: number; y: number } };`,
      ).join("\n") + `\ntype Root = O0[];`,
    value: (_N, n) =>
      repeat(n, (i) => ({ id: `id${i}`, n0: i, flag: true, tags: ["a"], pos: { x: i, y: i } })),
  },
  // One inline object type nested N levels deep.
  deep: {
    types: (N) =>
      `type Deep = ${range(N).reduce((acc) => `{ v: number; c: ${acc} }`, "{ v: number }")};\ntype Root = Deep[];`,
    value: (N, n) => repeat(n, () => range(N).reduce((acc) => ({ v: 1, c: acc }), { v: 1 })),
  },
  // A union of N object types that share no discriminator, and a union of N string literals.
  union: {
    types: (N) =>
      [
        `type Lit = ${repeat(N, (i) => `"l${i}"`).join(" | ")};`,
        ...repeat(N, (i) => `type U${i} = { a${i}: string; tag: Lit; v: number };`),
        `type Union = ${repeat(N, (i) => `U${i}`).join(" | ")};`,
        `type Root = Union[];`,
      ].join("\n"),
    value: (N, n) => repeat(n, (i) => ({ [`a${i % N}`]: "s", tag: `l${i % N}`, v: i })),
  },
  // A discriminated union with N variants.
  discriminated: {
    types: (N) =>
      [
        ...repeat(N, (i) => `type V${i} = { kind: "k${i}"; x${i}: string; v: number };`),
        `type Disc = ${repeat(N, (i) => `V${i}`).join(" | ")};`,
        `type Root = Disc[];`,
      ].join("\n"),
    value: (N, n) => repeat(n, (i) => ({ kind: `k${i % N}`, [`x${i % N}`]: "s", v: i })),
  },
  // N mutually recursive types. Root is a linked list n items deep.
  recursive: {
    types: (N) =>
      repeat(N, (i) => `type R${i} = { name: string; tags: string[]; next: R${(i + 1) % N} | null };`).join(
        "\n",
      ) + `\ntype Root = R0;`,
    value: (_N, n) => range(n).reduce((next) => ({ name: "r", tags: ["a"], next }), null),
  },
  // Two generic types instantiated with N different arguments.
  generics: {
    types: (N) =>
      [
        `type Box<T> = { value: T; items: T[] };`,
        `type Pair<A, B> = { a: A; b: B };`,
        ...repeat(N, (i) => `type Leaf${i} = { id${i}: string; v: number };`),
        ...repeat(N, (i) => `type G${i} = Box<Pair<Leaf${i}, Leaf${(i + 1) % N}>>;`),
        `type Root = G0[];`,
      ].join("\n"),
    value: (N, n) => {
      const pair = () => ({ a: { id0: "s", v: 1 }, b: { [`id${1 % N}`]: "s", v: 1 } });
      return repeat(n, () => ({ value: pair(), items: [pair()] }));
    },
  },
  // Records and index signatures. Each Inner type has N named fields and a template literal index signature.
  records: {
    types: (N) =>
      [
        `type Inner = { ${repeat(N, (i) => `p${i}: number;`).join(" ")} [k: \`x_\${string}\`]: number };`,
        ...repeat(N, (i) => `type Rec${i} = Record<string, Record<string, number>>;`),
        `type Root = Record<string, Inner>;`,
      ].join("\n"),
    value: (N, n) => {
      const inner = () => ({ ...Object.fromEntries(repeat(N, (i) => [`p${i}`, i])), x_a: 1, x_b: 2 });
      return Object.fromEntries(repeat(n, (i) => [`k${i}`, inner()]));
    },
  },
  // Template literals and N string and number formats.
  formats: {
    types: (N) =>
      [
        `import { StringFormat, NumberFormat } from "@beff/client";`,
        ...repeat(N, (i) => `type Sf${i} = StringFormat<"Sf${i}">;`),
        ...repeat(N, (i) => `type Nf${i} = NumberFormat<"Nf${i}">;`),
        ...repeat(
          N,
          (i) =>
            `type F${i} = { tpl: \`id${i}_\${number}\`; size: \`\${number}x\${number}\`; s: Sf${i}; n: Nf${i} };`,
        ),
        `type Root = F0[];`,
      ].join("\n"),
    value: (_N, n) => repeat(n, (i) => ({ tpl: `id0_${i}`, size: "10x20", s: "s", n: i })),
    formats: (N) => ({
      stringFormats: repeat(N, (i) => `Sf${i}`),
      numberFormats: repeat(N, (i) => `Nf${i}`),
    }),
  },
  // Intersections combined with Omit, Pick and Partial.
  intersections: {
    types: (N) =>
      [
        ...repeat(N, (i) => `type Base${i} = { a: string; b: number; c: boolean; d${i}: string };`),
        ...repeat(N, (i) => `type Extra${i} = { e: number; f?: string };`),
        ...repeat(
          N,
          (i) =>
            `type I${i} = Omit<Base${i} & Extra${i}, "c"> & Partial<Pick<Base${(i + 1) % N}, "a" | "b">>;`,
        ),
        `type Root = I0[];`,
      ].join("\n"),
    value: (_N, n) => repeat(n, (i) => ({ a: "s", b: i, d0: "s", e: i })),
  },
};

// Replaces the last leaf of a value with a value of the wrong type.
export function corrupt(value) {
  let parent = null;
  let key = null;
  let cur = value;
  while (cur !== null && typeof cur === "object" && Object.keys(cur).length > 0) {
    const keys = Object.keys(cur);
    parent = cur;
    key = keys[keys.length - 1];
    cur = cur[key];
  }
  parent[key] = typeof cur === "number" ? "not a number" : 12345;
  return value;
}

// Format validators passed to buildParsers.
function formatArgs(shape, N) {
  const f = shapes[shape].formats?.(N) ?? { stringFormats: [], numberFormats: [] };
  return {
    stringFormats: Object.fromEntries(f.stringFormats.map((k) => [k, (s) => s.length > 0])),
    numberFormats: Object.fromEntries(f.numberFormats.map((k) => [k, (n) => n >= 0])),
  };
}

export function generate(shape, N, out) {
  const types = shapes[shape].types(N);
  const names = [...types.matchAll(/^type (\w+) =/gm)].map((m) => m[1]);
  const parser = [
    `import parse from "./generated/parser";`,
    types,
    ``,
    `export const Codecs = parse.buildParsers<{`,
    ...names.map((n) => `  ${n}: ${n};`),
    `}>();`,
    ``,
  ].join("\n");
  const f = shapes[shape].formats?.(N) ?? { stringFormats: [], numberFormats: [] };
  const beffJson = {
    parser: "./src/parser.ts",
    outputDir: "./src/generated",
    stringFormats: f.stringFormats.map((name) => ({ name })),
    numberFormats: f.numberFormats.map((name) => ({ name })),
  };
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.join(out, "src"), { recursive: true });
  fs.writeFileSync(path.join(out, "beff.json"), JSON.stringify(beffJson, null, 2));
  fs.writeFileSync(path.join(out, "src/parser.ts"), parser);
  return { lines: parser.split("\n").length };
}

export const outDir = (shape, N) => path.join(import.meta.dirname, "out", `${shape}-${N}`);

const require = createRequire(import.meta.url);
const cli = require.resolve("@beff/cli/bin/index.js");
// Prints the peak RSS of the CLI process when it exits.
const printRss = `data:text/javascript,process.on("exit",()=>process.stderr.write("MAXRSS "+process.resourceUsage().maxRSS+"\\n"))`;

// Runs `beff -p beff.json` in `dir`. Returns wall time in ms and peak RSS in MB.
export function compile(dir) {
  const start = performance.now();
  const res = spawnSync(process.execPath, ["--import", printRss, cli, "-p", "beff.json"], {
    cwd: dir,
    encoding: "utf-8",
  });
  const ms = performance.now() - start;
  if (res.status !== 0) {
    throw new Error(`beff failed in ${dir}:\n${res.stdout}\n${res.stderr}`);
  }
  const rssKb = Number(/MAXRSS (\d+)/.exec(res.stderr)[1]);
  return { ms, rssMb: rssKb / 1024 };
}

// Generates and compiles a project, then returns its parsers.
export async function build(shape, N) {
  const dir = outDir(shape, N);
  generate(shape, N, dir);
  compile(dir);
  const mod = await import(pathToFileURL(path.join(dir, "src/generated/parser.js")).href);
  return mod.default.buildParsers(formatArgs(shape, N));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({
    options: { shape: { type: "string" }, scale: { type: "string" }, out: { type: "string" } },
  });
  if (!(values.shape in shapes)) {
    throw new Error(`--shape must be one of: ${Object.keys(shapes).join(", ")}`);
  }
  const N = Number(values.scale ?? 10);
  const out = values.out ?? outDir(values.shape, N);
  generate(values.shape, N, out);
  console.log(`wrote ${out}`);
}
