import { it, expect } from "vitest";
import { ProtoDiscriminatedCodec, ProtoKeyObjectCodec } from "../src/parser";

const strict = { disallowExtraProperties: true };

it("discriminated union accepts a __proto__ variant", () => {
  const value = JSON.parse('{"kind": "__proto__", "c": true}');
  expect(ProtoDiscriminatedCodec.safeParse(value)).toEqual({ success: true, data: value });
  expect(ProtoDiscriminatedCodec.validate(JSON.parse('{"kind": "__proto__", "c": 1}'))).toBe(false);
  expect(ProtoDiscriminatedCodec.validate({ kind: "toString", a: "x" })).toBe(true);
});

it("__proto__ property is required and checked", () => {
  expect(ProtoKeyObjectCodec.validate({ toString: 1 })).toBe(false);
  expect(ProtoKeyObjectCodec.validate(JSON.parse('{"__proto__": 1, "toString": 1}'))).toBe(false);
  expect(ProtoKeyObjectCodec.validate(JSON.parse('{"__proto__": "x", "toString": 1}'))).toBe(true);
});

it("__proto__ property is kept by parse and is not extra in strict mode", () => {
  const value = JSON.parse('{"__proto__": "x", "toString": 1}');
  const parsed = ProtoKeyObjectCodec.parse(value);
  expect(Object.prototype.hasOwnProperty.call(parsed, "__proto__")).toBe(true);
  expect(parsed).toEqual(value);
  expect(ProtoKeyObjectCodec.safeParse(value, strict)).toEqual({ success: true, data: value });
});
