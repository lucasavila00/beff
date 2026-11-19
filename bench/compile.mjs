// Compiler benchmark: time and peak RSS of `beff -p beff.json`, doubling the scale each row.
//
//   node compile.mjs [--shape union] [--from 25] [--rows 6]
import * as fs from "node:fs";
import * as path from "node:path";
import { parseArgs } from "node:util";
import { shapes, generate, compile, outDir } from "./gen.mjs";

const { values } = parseArgs({
  options: { shape: { type: "string" }, from: { type: "string" }, rows: { type: "string" } },
});
const from = Number(values.from ?? 25);
const rows = Number(values.rows ?? 6);

for (const shape of values.shape ? [values.shape] : Object.keys(shapes)) {
  console.log(`\n### ${shape}\n`);
  console.log("| scale | lines | `beff` | peak RSS | parser.js | growth per 2x |");
  console.log("| --- | --- | --- | --- | --- | --- |");
  let prev = null;
  for (let i = 0, N = from; i < rows; i++, N *= 2) {
    const dir = outDir(shape, N);
    const { lines } = generate(shape, N, dir);
    let r;
    try {
      r = compile(dir);
    } catch (e) {
      console.log(
        `| ${N} | ${lines} | failed: ${e.message.split("\n").slice(1).join(" ").slice(0, 120)} | | | |`,
      );
      break;
    }
    const kb = fs.statSync(path.join(dir, "src/generated/parser.js")).size / 1024;
    const growth = prev ? `${(r.ms / prev).toFixed(1)}x` : "";
    console.log(
      `| ${N} | ${lines} | ${(r.ms / 1000).toFixed(2)} s | ${r.rssMb.toFixed(0)} MB | ${kb.toFixed(0)} KB | ${growth} |`,
    );
    prev = r.ms;
  }
}
