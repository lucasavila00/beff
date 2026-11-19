// Stress checks: the generated validators must agree with each other on random inputs.
//
//   node stress.mjs [--shape union] [--scale 8] [--runs 500] [--seed 1]
//
// For every input, with and without disallowExtraProperties: safeParse and validate do not throw, validate(x) === safeParse(x).success,
// a failed safeParse has errors, and parse throws only the "Failed to parse" error.
// For generated valid inputs: parse(x) deep-equals x.
// Then it checks how deep a recursive input can be before a stack overflow.
import { parseArgs, isDeepStrictEqual } from "node:util";
import { shapes, build, corrupt } from "./gen.mjs";

const { values } = parseArgs({
  options: {
    shape: { type: "string" },
    scale: { type: "string" },
    runs: { type: "string" },
    seed: { type: "string" },
  },
});
const N = Number(values.scale ?? 8);
const runs = Number(values.runs ?? 500);

// mulberry32: a small seeded PRNG, so failures can be reproduced.
let seed = Number(values.seed ?? 1);
const random = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (arr) => arr[Math.floor(random() * arr.length)];

const pool = () =>
  pick([
    null,
    undefined,
    0,
    -1,
    1.5,
    NaN,
    Infinity,
    "",
    "s",
    "k0",
    "l0",
    "id0_1",
    "10x20",
    true,
    [],
    {},
    [1],
    { kind: "k0" },
    10n,
    new Date(0),
    new Map(),
    JSON.parse('{"__proto__": 1}'),
    { constructor: 1 },
  ]);

// All [parent, key] pairs in a value.
function slots(v, acc = []) {
  if (v !== null && typeof v === "object" && !(v instanceof Date) && !(v instanceof Map)) {
    for (const k of Object.keys(v)) {
      acc.push([v, k]);
      slots(v[k], acc);
    }
  }
  return acc;
}

// Applies 1 to 3 random edits: replace a value, delete a key, or add a key.
function mutate(v) {
  const edits = 1 + Math.floor(random() * 3);
  for (let i = 0; i < edits; i++) {
    const all = slots(v);
    if (all.length === 0) return pool();
    const [parent, key] = pick(all);
    const op = random();
    if (op < 0.6) parent[key] = pool();
    else if (op < 0.8) delete parent[key];
    else if (parent[key] !== null && typeof parent[key] === "object")
      parent[key][pick(["extra", "x_c", "k0"])] = pool();
  }
  return v;
}

const show = (x) => {
  try {
    return JSON.stringify(x, (_k, it) => (typeof it === "bigint" ? `${it}n` : it)).slice(0, 200);
  } catch {
    return String(x);
  }
};

function check(Root, x, mustBeValid, opts) {
  let res;
  try {
    res = Root.safeParse(x, opts);
  } catch (e) {
    return `safeParse threw ${e}`;
  }
  let ok;
  try {
    ok = Root.validate(x, opts);
  } catch (e) {
    return `validate threw ${e}`;
  }
  if (ok !== res.success) return `validate returned ${ok}, safeParse.success is ${res.success}`;
  if (!res.success && res.errors.length === 0) return `safeParse failed with no errors`;
  if (mustBeValid && !ok) return `valid input rejected: ${show(res.errors)}`;
  try {
    const parsed = Root.parse(x, opts);
    if (!ok) return `parse accepted an invalid input`;
    if (mustBeValid && !isDeepStrictEqual(parsed, x)) return `parse changed the value: ${show(parsed)}`;
  } catch (e) {
    if (ok || !e.message.startsWith("Failed to parse")) return `parse threw ${e}`;
  }
  return null;
}

let failed = 0;
for (const shape of values.shape ? [values.shape] : Object.keys(shapes)) {
  const Root = (await build(shape, N)).Root;
  const value = (n) => shapes[shape].value(N, n);
  const failures = [];
  const run = (x, mustBeValid) => {
    for (const opts of [{}, { disallowExtraProperties: true }]) {
      const err = check(Root, x, mustBeValid, opts);
      if (err) failures.push(`${err}\n    input: ${show(x)}, options: ${show(opts)}`);
    }
  };
  for (const n of [1, 5, 20]) {
    run(value(n), true);
    run(corrupt(value(n)), false);
  }
  for (let i = 0; i < runs; i++) {
    run(mutate(value(1 + Math.floor(random() * 4))), false);
    run(pool(), false);
  }
  console.log(`${shape}: ${2 * runs + 6} inputs x 2 option sets, ${failures.length} failures`);
  for (const f of new Set(failures.slice(0, 5))) console.log(`  - ${f}`);
  failed += failures.length;
}

// The deepest recursive input that each call handles without a stack overflow, to within 2%.
const Rec = (await build("recursive", 4)).Root;
const calls = {
  validate: (valid) => Rec.validate(valid),
  "safeParse (valid)": (valid) => Rec.safeParse(valid),
  "safeParse (invalid)": (_, invalid) => Rec.safeParse(invalid),
};
const overflows = (f, depth) => {
  const valid = shapes.recursive.value(4, depth);
  const invalid = corrupt(shapes.recursive.value(4, depth));
  try {
    f(valid, invalid);
    return false;
  } catch (e) {
    if (!(e instanceof RangeError)) throw e;
    return true;
  }
};
console.log(`\nDeepest recursive input without a stack overflow (tried 250 to 64000):`);
for (const [name, f] of Object.entries(calls)) {
  let ok = 0;
  let bad = 250;
  while (bad <= 64000 && !overflows(f, bad)) {
    ok = bad;
    bad *= 2;
  }
  // No depth up to the limit overflows. Do not try deeper inputs.
  if (bad > 64000) {
    console.log(`  ${name}: 64000 or more`);
    continue;
  }
  while (bad - ok > Math.max(1, ok / 50)) {
    const mid = Math.floor((ok + bad) / 2);
    if (overflows(f, mid)) bad = mid;
    else ok = mid;
  }
  console.log(`  ${name}: ${ok}`);
}

process.exitCode = failed > 0 ? 1 : 0;
