import { afterEach, describe, expect, it } from "vitest";
import { buildParserFromRuntype, GeneratedRuntype, TypeofRuntype } from "../src/codegen-v2.js";

const tree = new TypeofRuntype(undefined, "string");
const acceptAll = () => true;

describe("GeneratedRuntype", () => {
  afterEach(() => {
    delete process.env.BEFF_CHECK_GENERATED_VALIDATE;
  });

  it("validates with the generated function and uses the tree for the rest", () => {
    delete process.env.BEFF_CHECK_GENERATED_VALIDATE;
    const parser = buildParserFromRuntype(new GeneratedRuntype(tree, acceptAll), "T", true);
    expect(parser.validate(1)).toBe(true);
    expect(parser.describe()).toBe("string");
    expect(parser.schema()).toEqual({ type: "string" });
  });

  it("checks the generated function against the tree with BEFF_CHECK_GENERATED_VALIDATE=1", () => {
    process.env.BEFF_CHECK_GENERATED_VALIDATE = "1";
    const parser = buildParserFromRuntype(new GeneratedRuntype(tree, acceptAll), "T", true);
    expect(parser.validate("a")).toBe(true);
    expect(() => parser.validate(1)).toThrow("INTERNAL ERROR: generated validate");
  });
});
