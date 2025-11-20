import { it, expect } from "vitest";
import { Codecs } from "../src/parser";
it("works", () => {
  expect(Codecs.UsesGenericWrapper.describe()).toMatchInlineSnapshot(
    '"type CodecUsesGenericWrapper = { wrappedNumber: { value: number, value2: (boolean | number) }, wrappedString: { value: string, value2: (boolean | string) } };"',
  );
});
