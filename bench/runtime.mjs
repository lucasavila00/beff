// Runtime benchmark: time per call of the generated `Root` validator on inputs that double in size.
//
//   node runtime.mjs [--shape union] [--scale 16] [--from 1000] [--rows 6]
//
// `--scale` is the size of the types (as in gen.mjs). The input size n doubles each row.
// "invalid" inputs are the same values with the last leaf replaced by a value of the wrong type.
import { parseArgs } from "node:util";
import { shapes, build, corrupt } from "./gen.mjs";

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

// Milliseconds per call, measured for at least 200 ms after one warm-up call.
function measure(f) {
  try {
    f();
  } catch (e) {
    return `${e.constructor.name}`;
  }
  let calls = 0;
  const start = performance.now();
  let elapsed = 0;
  while (elapsed < 200) {
    f();
    calls++;
    elapsed = performance.now() - start;
  }
  return elapsed / calls;
}

const fmt = (ms, prev) => {
  if (typeof ms === "string") return ms;
  const t = ms >= 1 ? `${ms.toFixed(1)} ms` : `${(ms * 1000).toFixed(0)} µs`;
  return typeof prev === "number" ? `${t} (${(ms / prev).toFixed(1)}x)` : t;
};

for (const shape of values.shape ? [values.shape] : Object.keys(shapes)) {
  const Root = (await build(shape, N)).Root;
  const ops = {
    validate: (v) => Root.validate(v),
    safeParse: (v) => Root.safeParse(v),
    parse: (v) => Root.parse(v),
    "validate (invalid)": (_, bad) => Root.validate(bad),
    "safeParse (invalid)": (_, bad) => Root.safeParse(bad),
    "parse (invalid)": (_, bad) => {
      try {
        Root.parse(bad);
      } catch (e) {
        if (e.message.startsWith("Failed to parse")) return;
        throw e;
      }
      throw new Error("parse accepted an invalid value");
    },
  };
  console.log(`\n### ${shape} (scale ${N}; time per call, growth per 2x in parentheses)\n`);
  console.log(`| n | ${Object.keys(ops).join(" | ")} |`);
  console.log(`|${" --- |".repeat(Object.keys(ops).length + 1)}`);
  let prev = {};
  for (let i = 0, n = from; i < rows; i++, n *= 2) {
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
