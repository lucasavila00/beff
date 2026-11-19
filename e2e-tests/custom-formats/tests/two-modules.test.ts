import { expect, it } from "vitest";
import { Codecs } from "../src/parser";
import { OtherCodecs } from "../src/other-parser";

it("each parser module uses its own implementation of a format with the same name", () => {
  expect(Codecs.ValidCurrency.safeParse("USD").success).toBe(true);
  expect(Codecs.ValidCurrency.safeParse("BRL").success).toBe(false);
  expect(OtherCodecs.ValidCurrency.safeParse("BRL").success).toBe(true);
  expect(OtherCodecs.ValidCurrency.safeParse("USD").success).toBe(false);
});
