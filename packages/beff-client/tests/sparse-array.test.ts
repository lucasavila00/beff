import { describe, expect, it } from "vitest";
import { b, buntyped } from "../src/index.js";

describe("parse of a sparse array", () => {
  it("keeps the items that are not set as not set", () => {
    const Items = b.Array(buntyped.Union(b.Number(), b.Undefined()));
    const input = [1, , 3];
    const out = Items.parse(input);

    expect(out).toHaveLength(3);
    expect(0 in out).toBe(true);
    expect(1 in out).toBe(false);
    expect(out[2]).toBe(3);
    expect(out).not.toBe(input);
  });
});
