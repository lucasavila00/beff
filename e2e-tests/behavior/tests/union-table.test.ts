// The compiler prints some unions with a kind table.
// A kind is a group of JavaScript values: null or undefined, boolean, number, string, bigint, array,
// object, function. The table tells the union which runtype checks each kind.
// With a table, the union calls only that runtype. Without a table, it tries each member.
//
// A union with a table must give the same results as the same union without the table.
// This file builds each codec of the behavior suite with the tables and without them.
// It then compares the results of validate and safeParse. The safeParse result includes the errors.
import { isDeepStrictEqual } from "node:util";
import { describe, expect, it, vi } from "vitest";
import { AllOfRuntype, buildParserFromRuntype, ObjectRuntype, type Runtype } from "@beff/client/codegen-v2";
import type { BeffParser } from "@beff/client";
import { buildCodecs } from "../src/parser";
import { cases, mutate, rng } from "./cases";

// This mock replaces `AnyOfRuntype`. When `state.tables` is false, the mock removes the kind table argument.
// The mock also counts the unions that have a table. A test below makes sure that the tables exist.
const state = vi.hoisted(() => ({ tables: true, withTable: 0, withoutTable: 0 }));
vi.mock("@beff/client/codegen-v2", async (importOriginal) => {
  const original = await importOriginal<typeof import("@beff/client/codegen-v2")>();
  class AnyOfRuntype extends original.AnyOfRuntype {
    constructor(...args: ConstructorParameters<typeof original.AnyOfRuntype>) {
      const [metadata, schemas, kindTable] = args;
      if (kindTable !== undefined) {
        if (state.tables) state.withTable++;
        else state.withoutTable++;
      }
      super(metadata, schemas, state.tables ? kindTable : undefined);
    }
  }
  return { ...original, AnyOfRuntype };
});

type AnyCodecs = Record<string, BeffParser<any>>;
const load = async (tables: boolean): Promise<AnyCodecs> => {
  state.tables = tables;
  // The two paths have different query strings, so the module loads two times.
  // Each load reads `state.tables` when it builds its unions.
  const path = tables ? "../src/generated/parser.js?tables" : "../src/generated/parser.js?no-tables";
  return buildCodecs((await import(/* @vite-ignore */ path)).default);
};
const runtypeOf = (codec: BeffParser<any>): Runtype => (codec as unknown as { _runtype: Runtype })._runtype;
// Puts the codec in an intersection with an empty object type (`Codec & {}`).
// The runtime sets `intersectionInput` for the members of an intersection, which changes how they
// handle extra properties. The comparison must also pass in that mode.
const intersected = (codec: BeffParser<any>, name: string) =>
  buildParserFromRuntype(
    new AllOfRuntype(undefined, [runtypeOf(codec), new ObjectRuntype(undefined, {}, [])]),
    name,
    false,
  );

// More inputs for each codec. bench/stress.mjs uses these values, and `mutate` does not make them.
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
            // Do not use `toEqual` here. `mutate` can make an input whose prototype is a Map,
            // and `toEqual` throws on such an input.
            expect(isDeepStrictEqual(a.safeParse(input, options), b.safeParse(input, options))).toBe(true);
          }
        }
      }
    });
  }
});
