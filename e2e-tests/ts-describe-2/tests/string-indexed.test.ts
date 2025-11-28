import { it, expect } from "vitest";
import { Codecs } from "../src/parser";

export type SomeString = string;
export type SomeChar = SomeString[number];
it("works", () => {
  expect(Codecs.SomeString.describe()).toMatchInlineSnapshot('"type CodecSomeString = string;"');
  expect(Codecs.SomeChar.describe()).toMatchInlineSnapshot('"type CodecSomeChar = string;"');
});
