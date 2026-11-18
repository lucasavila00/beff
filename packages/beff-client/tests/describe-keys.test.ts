import { describe, expect, it } from "vitest";
import { b } from "../src/b.js";

describe("describe() property keys", () => {
  it("quotes keys that are not identifiers", () => {
    expect(
      b
        .Object({
          plain: b.String(),
          $ok_1: b.String(),
          "a-b": b.String(),
          "1x": b.String(),
          "": b.String(),
          "with space": b.String(),
          '"quoted"': b.String(),
          "1": b.String(),
        })
        .describe(),
    ).toBe(
      '{ "": string, "\\"quoted\\"": string, $ok_1: string, 1: string, "1x": string, "a-b": string, plain: string, "with space": string }',
    );
  });
});
