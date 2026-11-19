import { it, expect } from "vitest";
import {
  IntersectionCodec,
  IntersectionPartialCodec,
  IntersectionOmitPickCodec,
  IntersectionNestedCodec,
  IntersectionIndexCodec,
  IntersectionUnionCodec,
} from "../src/parser";

const strict = { disallowExtraProperties: true };

it("intersection accepts keys of all members", () => {
  expect(IntersectionCodec.validate({ a: "x", b: "y" }, strict)).toBe(true);
  expect(IntersectionCodec.parse({ a: "x", b: "y" }, strict)).toEqual({ a: "x", b: "y" });
  expect(IntersectionPartialCodec.parse({ a: "x" }, strict)).toEqual({ a: "x" });
  expect(IntersectionPartialCodec.parse({ a: "x", c: "z" }, strict)).toEqual({ a: "x", c: "z" });
});

it("intersection reports real extra properties", () => {
  expect(IntersectionCodec.validate({ a: "x", b: "y", z: 1 }, strict)).toBe(false);
  expect(IntersectionCodec.safeParse({ a: "x", b: "y", z: 1 }, strict)).toEqual({
    success: false,
    errors: [{ message: "extra property", path: ["z"], received: 1 }],
  });
  expect(IntersectionCodec.parse({ a: "x", b: "y", z: 1 })).toEqual({ a: "x", b: "y" });
});

it("intersection reports member errors", () => {
  expect(IntersectionCodec.safeParse({ b: "y" }, strict)).toEqual({
    success: false,
    errors: [{ message: "expected string", path: ["a"], received: undefined }],
  });
});

it("Omit/Pick/Partial on intersections", () => {
  const value = { a: "s", b: 0, d0: "s", e: 0 };
  expect(IntersectionOmitPickCodec.parse(value, strict)).toEqual(value);
  expect(IntersectionOmitPickCodec.safeParse({ ...value, c: "s" }, strict)).toEqual({
    success: false,
    errors: [{ message: "extra property", path: ["c"], received: "s" }],
  });
});

it("nested intersections", () => {
  const value = { a: "x", b: "y", n: { x: "s" } };
  expect(IntersectionNestedCodec.parse(value, strict)).toEqual(value);
  expect(IntersectionNestedCodec.parse({ a: "x", n: { x: "s" } }, strict)).toEqual({ a: "x", n: { x: "s" } });
  expect(IntersectionNestedCodec.safeParse({ a: "x", n: { x: "s", y: 1 } }, strict)).toEqual({
    success: false,
    errors: [{ message: "extra property", path: ["n", "y"], received: 1 }],
  });
  expect(IntersectionNestedCodec.parse({ a: "x", n: { x: "s", y: 1 }, q: 1 })).toEqual({
    a: "x",
    n: { x: "s" },
  });
});

it("intersections with index signatures", () => {
  const value = { a: "x", n: 1, x_1: 1, x_2: "s" };
  expect(IntersectionIndexCodec.parse(value, strict)).toEqual(value);
  expect(IntersectionIndexCodec.safeParse({ a: "x", n: 1, x_1: true }, strict)).toMatchObject({
    success: false,
  });
});

it("intersections with unions", () => {
  expect(IntersectionUnionCodec.parse({ a: "x", kind: "u", u: "s" }, strict)).toEqual({
    a: "x",
    kind: "u",
    u: "s",
  });
  expect(IntersectionUnionCodec.parse({ a: "x", kind: "v" }, strict)).toEqual({ a: "x", kind: "v" });
  expect(IntersectionUnionCodec.safeParse({ a: "x", kind: "v", u: "s" }, strict)).toEqual({
    success: false,
    errors: [{ message: "extra property", path: ["u"], received: "s" }],
  });
});
