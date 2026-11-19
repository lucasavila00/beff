// A union that the compiler prints with a table (the runtype that checks each kind of value) must do
// exactly what the same union does without the table. This file builds every codec of the suite both
// ways and compares validate, parse and the errors.
import { isDeepStrictEqual } from "node:util";
import { describe, expect, it, vi } from "vitest";
import { AllOfRuntype, buildParserFromRuntype, ObjectRuntype, type Runtype } from "@beff/client/codegen-v2";
import type { BeffParser } from "@beff/client";
import { buildCodecs } from "../src/parser";
import { cases, mutate, rng } from "./cases";

// Each import of the generated module builds its unions with or without the tables.
const state = vi.hoisted(() => ({ tables: true, withTable: 0, withoutTable: 0 }));
vi.mock("@beff/client/codegen-v2", async (importOriginal) => {
  const original = await importOriginal<typeof import("@beff/client/codegen-v2")>();
  class AnyOfRuntype extends original.AnyOfRuntype {
    constructor(...args: ConstructorParameters<typeof original.AnyOfRuntype>) {
      const [metadata, schemas, byKind] = args;
      if (byKind !== undefined) {
        if (state.tables) state.withTable++;
        else state.withoutTable++;
      }
      super(metadata, schemas, state.tables ? byKind : undefined);
    }
  }
  return { ...original, AnyOfRuntype };
});

type AnyCodecs = Record<string, BeffParser<any>>;
const load = async (tables: boolean): Promise<AnyCodecs> => {
  state.tables = tables;
  // The query makes this import a separate instance of the module.
  const path = tables ? "../src/generated/parser.js?tables" : "../src/generated/parser.js?no-tables";
  return buildCodecs((await import(/* @vite-ignore */ path)).default);
};
const runtypeOf = (codec: BeffParser<any>): Runtype => (codec as unknown as { _runtype: Runtype })._runtype;
// `Codec & {}`: the members of an intersection run with `intersectionInput` set.
const intersected = (codec: BeffParser<any>, name: string) =>
  buildParserFromRuntype(
    new AllOfRuntype(undefined, [runtypeOf(codec), new ObjectRuntype(undefined, {}, [])]),
    name,
    false,
  );

// The values of the pool of bench/stress.mjs that `mutate` does not use.
const STRESS_POOL: unknown[] = [
  Infinity,
  "s",
  "k0",
  [1],
  { kind: "k0" },
  10n,
  JSON.parse('{"__proto__": 1}'),
  { constructor: 1 },
  () => 1,
  Symbol("s"),
];
const isAt = (x: unknown): x is { value: unknown } => typeof x === "object" && x != null && "__at" in x;

const inputsOf = (name: string, rand: () => number): unknown[] => {
  const c = (cases as Record<string, any>)[name] ?? {};
  const suite: unknown[] = [
    ...(c.valid ?? []),
    ...(c.invalid ?? []),
    ...(c.parsed ?? []).map((it: [unknown, unknown]) => it[0]),
    ...(c.strictValid ?? []),
    ...(c.strictInvalid ?? []),
  ].map((it) => (isAt(it) ? it.value : it));
  const random = [];
  for (let i = 0; i < 60; i++) {
    random.push(mutate(suite.length > 0 ? suite[Math.floor(rand() * suite.length)] : undefined, rand));
  }
  return [...suite, ...STRESS_POOL, ...random];
};

describe("unions with and without the table of kinds", async () => {
  const withTables = await load(true);
  const withoutTables = await load(false);

  it("the generated module has unions with a table, and the second instance drops them", () => {
    expect(state.withTable).toBeGreaterThan(10);
    expect(state.withoutTable).toBe(state.withTable);
  });

  for (const name of Object.keys(withTables)) {
    it(`${name} validates, parses and reports errors the same way`, () => {
      const rand = rng(425);
      const pairs: [BeffParser<any>, BeffParser<any>][] = [
        [withTables[name]!, withoutTables[name]!],
        [intersected(withTables[name]!, name), intersected(withoutTables[name]!, name)],
      ];
      for (const input of inputsOf(name, rand)) {
        for (const [a, b] of pairs) {
          for (const options of [undefined, { disallowExtraProperties: true }]) {
            expect(a.validate(input, options)).toBe(b.validate(input, options));
            // not toEqual: it throws on an input whose prototype is a Map, which `mutate` can make
            expect(isDeepStrictEqual(a.safeParse(input, options), b.safeParse(input, options))).toBe(true);
          }
        }
      }
    });
  }
});
