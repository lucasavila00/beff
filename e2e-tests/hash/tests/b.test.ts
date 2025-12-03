import { b } from "@beff/client";
import { it, expect } from "vitest";
import { Codecs } from "../src/parser";

export type StringCodec = string;
export type NumberCodec = number;
export type BooleanCodec = boolean;
export type StringArrayCodec = string[];
export type UndefinedCodec = undefined;
export type NullCodec = null;
export type AnyCodec = any;
export type UnknownCodec = unknown;
export type VoidCodec = void;
export type ObjCodec = {
  a: string;
  b: number;
};
export type ObjCodec2 = {
  b: number;
  a: string;
};
it("works", () => {
  expect(b.String().hash()).toMatchInlineSnapshot("-891985903");
  expect(b.String().hash()).toBe(Codecs.StringCodec.hash());

  expect(b.Number().hash()).toMatchInlineSnapshot("-1034364087");
  expect(b.Number().hash()).toBe(Codecs.NumberCodec.hash());

  expect(b.Boolean().hash()).toMatchInlineSnapshot("64711720");
  expect(b.Boolean().hash()).toBe(Codecs.BooleanCodec.hash());

  expect(b.Array(b.String()).hash()).toMatchInlineSnapshot("1993816280");
  expect(b.Array(b.String()).hash()).toBe(Codecs.StringArrayCodec.hash());

  expect(b.ReadOnlyArray(b.String()).hash()).toMatchInlineSnapshot("1993816280");
  expect(b.ReadOnlyArray(b.String()).hash()).toBe(Codecs.StringArrayCodec.hash());

  expect(b.Undefined().hash()).toMatchInlineSnapshot("3392903");
  expect(b.Undefined().hash()).toBe(Codecs.UndefinedCodec.hash());

  expect(b.Null().hash()).toMatchInlineSnapshot("3392903");
  expect(b.Null().hash()).toBe(Codecs.NullCodec.hash());

  expect(b.Any().hash()).toMatchInlineSnapshot("-284840886");
  expect(b.Any().hash()).toBe(Codecs.AnyCodec.hash());

  expect(b.Unknown().hash()).toMatchInlineSnapshot("-284840886");
  expect(b.Unknown().hash()).toBe(Codecs.UnknownCodec.hash());

  expect(b.Void().hash()).toMatchInlineSnapshot("3392903");
  expect(b.Void().hash()).toBe(Codecs.VoidCodec.hash());

  expect(
    b
      .Object({
        a: b.String(),
        b: b.Number(),
      })
      .hash(),
  ).toMatchInlineSnapshot("1827769014");
  expect(
    b
      .Object({
        a: b.String(),
        b: b.Number(),
      })
      .hash(),
  ).toBe(Codecs.ObjCodec.hash());
  expect(
    b
      .Object({
        b: b.Number(),
        a: b.String(),
      })
      .hash(),
  ).toBe(Codecs.ObjCodec.hash());

  expect(Codecs.ObjCodec.hash()).toBe(Codecs.ObjCodec2.hash());
});
