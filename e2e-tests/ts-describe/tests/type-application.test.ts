import { it, expect } from "vitest";
import { Codecs } from "../src/parser";
it("works", () => {
  expect(Codecs.NumberWrapped.describe()).toMatchInlineSnapshot(
    '"type CodecNumberWrapped = { value: number };"',
  );
  expect(Codecs.StringWrapped.describe()).toMatchInlineSnapshot(
    '"type CodecStringWrapped = { value: string };"',
  );
  expect(Codecs.UsesWrappeds.describe()).toMatchInlineSnapshot(
    `
    "type NumberWrapped = { value: number };

    type StringWrapped = { value: string };

    type CodecUsesWrappeds = { x1: StringWrapped, x2: NumberWrapped, x3: DataWrapper<boolean>, x4: StringWrapped, x5: NumberWrapped, x6: DataWrapper<boolean> };"
  `,
  );
});
