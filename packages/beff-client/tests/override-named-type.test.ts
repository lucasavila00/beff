import { expect, it } from "vitest";
import { b, createNamedType, overrideNamedType } from "../src/index.js";

it("compiled refs see a named type replaced after they were used", () => {
  const T = createNamedType("OverrideAfterUseT", b.String());
  const Wrapper = b.Object({ t: T });
  expect(Wrapper.validate({ t: "a" })).toBe(true);
  expect(Wrapper.parse({ t: "a" })).toEqual({ t: "a" });

  overrideNamedType("OverrideAfterUseT", b.Number());
  expect(Wrapper.validate({ t: "a" })).toBe(false);
  expect(Wrapper.validate({ t: 1 })).toBe(true);
  expect(T.parse(1)).toBe(1);
  expect(Wrapper.safeParse({ t: "a" }).success).toBe(false);
});
