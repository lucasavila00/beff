import { describe, expect, it } from "vitest";
import {
  AnyOfRuntype,
  ArrayRuntype,
  buildParserFromRuntype,
  DateRuntype,
  MapRuntype,
  ObjectRuntype,
  Runtype,
  SetRuntype,
  TypeofRuntype,
} from "../src/codegen-v2.js";
import { printErrors } from "../src/err.js";

const num = new TypeofRuntype(undefined, "number");
const str = new TypeofRuntype(undefined, "string");

const withProto = (value: object, proto: object | null): any => {
  Object.setPrototypeOf(value, proto);
  return value;
};
const cyclic: any = {};
cyclic.self = cyclic;

const expectErrors = (runtype: Runtype, input: unknown) => {
  const parser = buildParserFromRuntype(runtype, "T", false);
  const result = parser.safeParse(input);
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.errors.length).toBeGreaterThan(0);
    expect(typeof printErrors(result.errors)).toBe("string");
  }
};

describe("safeParse returns errors for odd inputs and does not throw", () => {
  const types: [string, Runtype][] = [
    ["Date | string", new AnyOfRuntype(undefined, [new DateRuntype(undefined), str])],
    ["number[] | string", new AnyOfRuntype(undefined, [new ArrayRuntype(undefined, num), str])],
    ["Map<string, number>", new MapRuntype(undefined, str, num)],
    ["Set<number>", new SetRuntype(undefined, num)],
  ];
  const inputs: [string, () => unknown][] = [
    ["array with Date.prototype", () => withProto([1, "a"], Date.prototype)],
    ["object with Date.prototype", () => withProto({ a: 1 }, Date.prototype)],
    ["array with Map.prototype", () => withProto([1, "a"], Map.prototype)],
    ["array with Set.prototype", () => withProto([1, "a"], Set.prototype)],
    ["array with RegExp.prototype", () => withProto([1, "a"], RegExp.prototype)],
    ["object with Array.prototype", () => withProto({ a: 1 }, Array.prototype)],
    ["object with null prototype", () => withProto({ a: 1 }, null)],
    ["cyclic object", () => cyclic],
  ];
  for (const [typeName, runtype] of types) {
    for (const [inputName, input] of inputs) {
      it(`${typeName}: ${inputName}`, () => expectErrors(runtype, input()));
    }
  }

  it("union with a cyclic value in a field", () => {
    const objOrStr = new AnyOfRuntype(undefined, [new ObjectRuntype(undefined, { a: num }, []), str]);
    expectErrors(objOrStr, { a: cyclic });
  });

  it("Map and Set with odd keys and items", () => {
    const fakeDate = withProto({}, Date.prototype);
    expectErrors(new MapRuntype(undefined, str, num), new Map([[cyclic, 1]]));
    expectErrors(new MapRuntype(undefined, str, num), new Map([[fakeDate, 1]]));
    expectErrors(new SetRuntype(undefined, num), new Set([cyclic]));
    expectErrors(new SetRuntype(undefined, num), new Set([fakeDate]));
  });

  it("real Date, Map and Set values are still valid", () => {
    const DateOrStr = buildParserFromRuntype(
      new AnyOfRuntype(undefined, [new DateRuntype(undefined), str]),
      "T",
      false,
    );
    expect(DateOrStr.safeParse(new Date(0)).success).toBe(true);
    const MapT = buildParserFromRuntype(new MapRuntype(undefined, str, num), "T", false);
    expect(MapT.safeParse(new Map([["a", 1]])).success).toBe(true);
    const SetT = buildParserFromRuntype(new SetRuntype(undefined, num), "T", false);
    expect(SetT.safeParse(new Set([1])).success).toBe(true);
  });
});
