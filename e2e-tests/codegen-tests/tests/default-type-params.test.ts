import { expect, it } from "vitest";
import { Codecs } from "../src/parser";

it("uses type parameter defaults for missing type arguments", () => {
  const valid = {
    g: { v: "a" },
    gn: { v: 1 },
    h: { a: 1, b: "b" },
    p: { a: 1, b: [2, 3] },
    i: { a: true, b: [false] },
  };
  expect(Codecs.DefaultTypeParams.parse(valid)).toEqual(valid);

  expect(Codecs.DefaultTypeParams.safeParse({ ...valid, g: { v: 1 } }).success).toBe(false);
  expect(Codecs.DefaultTypeParams.safeParse({ ...valid, h: { a: 1, b: 2 } }).success).toBe(false);
  expect(Codecs.DefaultTypeParams.safeParse({ ...valid, p: { a: 1, b: ["x"] } }).success).toBe(false);
  expect(Codecs.DefaultTypeParams.safeParse({ ...valid, i: { a: true, b: [1] } }).success).toBe(false);
});
