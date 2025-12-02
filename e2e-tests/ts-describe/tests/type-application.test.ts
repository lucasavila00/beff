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
    "type DataWrapper_type_application_instance_2 = { value: boolean };

    type NumberWrapped = { value: number };

    type StringWrapped = { value: string };

    type CodecUsesWrappeds = { x1: StringWrapped, x2: NumberWrapped, x3: DataWrapper_type_application_instance_2, x4: StringWrapped, x5: NumberWrapped, x6: DataWrapper_type_application_instance_2 };"
  `,
  );
});
