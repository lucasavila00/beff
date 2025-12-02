import { it, expect } from "vitest";
import { Codecs } from "../src/parser";
it("works", () => {
  expect(Codecs.UsesGenericWrapper.describe()).toMatchInlineSnapshot(
    `
    "type GenericWrapper_type_application_instance_0 = { other: GenericWrapper_type_application_instance_0, value: string, value2: (boolean | string) };

    type GenericWrapper_type_application_instance_1 = { other: GenericWrapper_type_application_instance_1, value: number, value2: (boolean | number) };

    type CodecUsesGenericWrapper = { wrappedNumber: GenericWrapper_type_application_instance_1, wrappedString: GenericWrapper_type_application_instance_0 };"
  `,
  );
});
