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
    "type DataWrapper_boolean = { value: boolean };

    type NumberWrapped = { value: number };

    type StringWrapped = { value: string };

    type CodecUsesWrappeds = { x1: StringWrapped, x2: NumberWrapped, x3: DataWrapper_boolean, x4: StringWrapped, x5: NumberWrapped, x6: DataWrapper_boolean };"
  `,
  );
  expect(Codecs.UsesWrappedsComplex.describe()).toMatchInlineSnapshot(
    `
    "type DataWrapper_instance_3 = { value: { a: boolean } };

    type CodecUsesWrappedsComplex = { x3: DataWrapper_instance_3, x6: DataWrapper_instance_3 };"
  `,
  );
  expect(Codecs.UsesWrappedsComplexRef.describe()).toMatchInlineSnapshot(
    `
    "type DataWrapper_ABool = { value: { a: boolean } };

    type CodecUsesWrappedsComplexRef = { x3: DataWrapper_ABool, x6: DataWrapper_ABool };"
  `,
  );
});
