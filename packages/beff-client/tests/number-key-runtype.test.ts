import { describe, expect, it } from "vitest";
import { buildParserFromRuntype, NumberKeyRuntype } from "../src/runtime.js";

const NumberKey = buildParserFromRuntype(new NumberKeyRuntype(undefined), "NumberKey", true);

describe("NumberKeyRuntype", () => {
  it("accepts numeric strings", () => {
    for (const key of ["0", "1", "-1", "1.5", "1e+21", "1e-7"]) {
      expect(NumberKey.validate(key)).toBe(true);
    }
  });

  it("rejects other values", () => {
    for (const key of ["", "a", "01", "1.", " 1", "NaN", "Infinity", 1]) {
      expect(NumberKey.validate(key)).toBe(false);
    }
  });

  it("describes as number", () => {
    expect(NumberKey.describe()).toBe("number");
  });
});
