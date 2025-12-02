import { it, expect } from "vitest";
import { Codecs } from "../src/parser";
it("works", () => {
  expect(Codecs.UsesGenericWrapper.describe()).toMatchInlineSnapshot(
    `
    "type GenericWrapper_number = { other: GenericWrapper_number, value: number, value2: (boolean | number) };

    type GenericWrapper_string = { other: GenericWrapper_string, value: string, value2: (boolean | string) };

    type CodecUsesGenericWrapper = { wrappedNumber: GenericWrapper_number, wrappedString: GenericWrapper_string };"
  `,
  );
});
