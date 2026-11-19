import { describe, expect, it } from "vitest";
import { any, buildParserFromRuntype, obj, str } from "../src/codegen-v2.js";

const Rec = buildParserFromRuntype(obj({}, [{ key: str(), value: any() }]), "Rec", false);

describe("object with a __proto__ key", () => {
  it("keeps __proto__ as an own property and does not change the prototype", () => {
    const input = JSON.parse('{"__proto__": {"isAdmin": true}, "x": 1}');
    const out: any = Rec.parse(input);

    expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
    expect(out.isAdmin).toBeUndefined();
    expect(Object.keys(out)).toEqual(["__proto__", "x"]);
    expect(Object.getOwnPropertyDescriptor(out, "__proto__")?.value).toEqual({ isAdmin: true });
  });

  it("does not change the prototype with sorted key order", () => {
    const input = JSON.parse('{"__proto__": {"isAdmin": true}, "x": 1}');
    const out: any = Rec.parse(input, { objectKeyOrder: "sorted" });

    expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
    expect(out.isAdmin).toBeUndefined();
  });
});
