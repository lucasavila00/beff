import { expect, it } from "vitest";
import {
  AllOfRuntype,
  buildParserFromRuntype,
  ObjectRuntype,
  RegexRuntype,
  TypeofRuntype,
} from "../src/codegen-v2.js";

const str = new TypeofRuntype(undefined, "string");
const num = new TypeofRuntype(undefined, "number");

it("reports an error for a non-object input of an intersection of non-object members", () => {
  const P = buildParserFromRuntype(new AllOfRuntype(undefined, [str, str]), "P", false);
  expect(P.validate("x")).toBe(false);
  expect(P.safeParse("x")).toEqual({
    success: false,
    errors: [{ message: "expected object", path: [], received: "x" }],
  });
});

it("does not report the other index signatures for a key that one index signature accepts", () => {
  const P = buildParserFromRuntype(
    new ObjectRuntype(undefined, { a: str }, [
      { key: new RegexRuntype(undefined, /^(x.*)$/, "`x${string}`"), value: num },
      { key: new RegexRuntype(undefined, /^(y.*)$/, "`y${string}`"), value: str },
    ]),
    "P",
    false,
  );
  expect(P.safeParse({ a: 1, x1: 1, y1: "s" })).toEqual({
    success: false,
    errors: [{ message: "expected string", path: ["a"], received: 1 }],
  });
  expect(P.safeParse({ a: "s", z: 1 })).toEqual({
    success: false,
    errors: [
      { message: "expected string matching `x${string}`", path: ["z"], received: "z" },
      { message: "expected string matching `y${string}`", path: ["z"], received: "z" },
      { message: "expected string", path: ["z"], received: 1 },
    ],
  });
});
