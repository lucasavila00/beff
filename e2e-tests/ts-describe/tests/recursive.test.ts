import { it, expect } from "vitest";
import { Codecs } from "../src/parser";
it("works", () => {
  expect(Codecs.RecursiveTree.describe()).toMatchInlineSnapshot(`
    "type RecursiveTree = { children: Array<RecursiveTree>, value: number };

    type CodecRecursiveTree = RecursiveTree;"
  `);
});
