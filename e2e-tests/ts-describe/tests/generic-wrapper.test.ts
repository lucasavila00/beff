import { it, expect } from "vitest";
import { Codecs } from "../src/parser";
it("works", () => {
  expect(Codecs.UsesGenericWrapper.describe()).toMatchInlineSnapshot(
    '"type CodecUsesGenericWrapper = { wrappedNumber: GenericWrapper<number>, wrappedString: GenericWrapper<string> };"',
  );
});
