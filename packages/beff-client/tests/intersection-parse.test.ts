import { describe, expect, it } from "vitest";
import {
  AllOfRuntype,
  AnyOfRuntype,
  buildParserFromRuntype,
  DateRuntype,
  NullishRuntype,
  ObjectRuntype,
  TypeofRuntype,
} from "../src/codegen-v2.js";

const str = new TypeofRuntype(undefined, "string");
const num = new TypeofRuntype(undefined, "number");
const nul = new NullishRuntype(undefined, "null");
const undef = new NullishRuntype(undefined, "undefined");

describe("parse of an intersection", () => {
  it("keeps a Date", () => {
    const T = buildParserFromRuntype(
      new AllOfRuntype(undefined, [
        new DateRuntype(undefined),
        new ObjectRuntype(undefined, { foo: str }, []),
      ]),
      "T",
      false,
    );
    const input = Object.assign(new Date(0), { foo: "x" });
    const out = T.parse(input);
    expect(out).toBe(input);
    expect(T.validate(out)).toBe(true);
  });

  it("keeps null", () => {
    const T = buildParserFromRuntype(
      new AllOfRuntype(undefined, [
        new AnyOfRuntype(undefined, [new ObjectRuntype(undefined, { a: str }, []), nul]),
        new AnyOfRuntype(undefined, [new ObjectRuntype(undefined, { b: num }, []), undef]),
      ]),
      "T",
      false,
    );
    expect(T.parse(null)).toBe(null);
    expect(T.parse({ a: "x", b: 1, c: 2 })).toEqual({ a: "x", b: 1 });
  });
});
