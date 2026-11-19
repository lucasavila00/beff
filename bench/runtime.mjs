// Runtime benchmark: time per call of the generated `Root` validator on inputs that double in size.
//
//   node runtime.mjs [--shape union] [--scale 16] [--from 1000] [--rows 6]
//
// `--scale` is the size of the types (as in gen.mjs). The input size n doubles each row.
// "invalid" inputs are the same values with the last leaf replaced by a value of the wrong type.
import { parseArgs } from "node:util";
import { shapes, build, corrupt } from "./gen.mjs";
import { measure, operations } from "./measure.mjs";

const { values } = parseArgs({
  options: {
    shape: { type: "string" },
    scale: { type: "string" },
    from: { type: "string" },
    rows: { type: "string" },
  },
});
const N = Number(values.scale ?? 16);
const from = Number(values.from ?? 1000);
const rows = Number(values.rows ?? 6);

const fmt = (ms, prev) => {
  const t = ms >= 1 ? `${ms.toFixed(1)} ms` : `${(ms * 1000).toFixed(0)} µs`;
  return typeof prev === "number" ? `${t} (${(ms / prev).toFixed(1)}x)` : t;
};

for (const shape of values.shape ? [values.shape] : Object.keys(shapes)) {
  const Root = (await build(shape, N)).Root;
  const ops = operations(Root);
  console.log(`\n### ${shape} (scale ${N}; time per call, growth per 2x in parentheses)\n`);
  console.log(`| n | ${Object.keys(ops).join(" | ")} |`);
  console.log(`|${" --- |".repeat(Object.keys(ops).length + 1)}`);
  let prev = {};
  // A recursive input is n levels deep. Real JSON is not that deep, and a deeper input overflows the stack.
  // Thus the recursive rows stop at 1000 levels.
  for (let i = 0, n = from; i < rows && (shape !== "recursive" || n <= 1000); i++, n *= 2) {
    const valid = shapes[shape].value(N, n);
    const bad = corrupt(shapes[shape].value(N, n));
    const cells = Object.entries(ops).map(([name, op]) => {
      const ms = measure(() => op(valid, bad));
      const cell = fmt(ms, prev[name]);
      prev[name] = ms;
      return cell;
    });
    console.log(`| ${n} | ${cells.join(" | ")} |`);
  }
}
