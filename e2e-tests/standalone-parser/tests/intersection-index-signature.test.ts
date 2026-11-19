import { it, expect } from "vitest";
import { IntersectionTplIndexCodec, IntersectionTwoTplIndexesCodec, TplRecordCodec } from "../src/parser";

const strict = { disallowExtraProperties: true };

it("index signature in an intersection does not reject the other members' keys", () => {
  const value = { a: "x", x_1: 1 };
  expect(IntersectionTplIndexCodec.validate(value)).toBe(true);
  expect(IntersectionTplIndexCodec.parse(value)).toEqual(value);
  expect(IntersectionTplIndexCodec.validate(value, strict)).toBe(true);
  expect(IntersectionTplIndexCodec.parse(value, strict)).toEqual(value);
});

it("index signature in an intersection still constrains the keys it matches", () => {
  expect(IntersectionTplIndexCodec.safeParse({ a: "x", x_1: "s" })).toEqual({
    success: false,
    errors: [{ message: "expected number", path: ["x_1"], received: "s" }],
  });
  expect(IntersectionTplIndexCodec.safeParse({ a: "x", x_1: "s" }, strict)).toEqual({
    success: false,
    errors: [{ message: "expected number", path: ["x_1"], received: "s" }],
  });
  expect(IntersectionTplIndexCodec.safeParse({ a: 1, x_1: 1 })).toEqual({
    success: false,
    errors: [{ message: "expected string", path: ["a"], received: 1 }],
  });
});

it("keys no member knows: stripped by default, rejected with disallowExtraProperties", () => {
  const value = { a: "x", x_1: 1, zz: true };
  expect(IntersectionTplIndexCodec.parse(value)).toEqual({ a: "x", x_1: 1 });
  expect(IntersectionTplIndexCodec.safeParse(value, strict)).toEqual({
    success: false,
    errors: [{ message: "extra property", path: ["zz"], received: true }],
  });
});

it("intersection of several index signatures", () => {
  const value = { a: "x", x_1: 1, y_1: "s" };
  expect(IntersectionTwoTplIndexesCodec.parse(value)).toEqual(value);
  expect(IntersectionTwoTplIndexesCodec.parse(value, strict)).toEqual(value);
  expect(IntersectionTwoTplIndexesCodec.safeParse({ a: "x", y_1: 1 })).toEqual({
    success: false,
    errors: [{ message: "expected string", path: ["y_1"], received: 1 }],
  });
});

it("a record on its own still rejects keys its index signature does not match", () => {
  expect(TplRecordCodec.validate({ x_1: 1 })).toBe(true);
  expect(TplRecordCodec.validate({ x_1: 1, a: 1 })).toBe(false);
});
