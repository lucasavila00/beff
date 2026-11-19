import { describe, expect, it } from "vitest";
import { buildParserFromRuntype, number, numberKey } from "../src/codegen-v2.js";

const NumberKey = buildParserFromRuntype(numberKey(), "NumberKey", true);
const NumberType = buildParserFromRuntype(number(), "Number", true);

describe("numKey", () => {
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

  it("describes and hashes as number", () => {
    expect(NumberKey.describe()).toBe("number");
    expect(NumberKey.hash()).toBe(NumberType.hash());
    expect(NumberKey.hash256()).toBe(NumberType.hash256());
  });
});
