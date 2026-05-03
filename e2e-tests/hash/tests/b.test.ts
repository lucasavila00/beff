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
export type RecursiveA = {
  value: string;
  next?: RecursiveA;
};
export type RecursiveB = {
  value: string;
  next?: RecursiveB;
};
export type MutualA1 = {
  value: string;
  next?: MutualB1;
};
export type MutualB1 = {
  value: string;
  next?: MutualA1;
};
export type MutualA2 = {
  value: string;
  next?: MutualB2;
};
export type MutualB2 = {
  value: string;
  next?: MutualA2;
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

it("hash256 is structural and root-name independent", () => {
  const objectHash = b
    .Object({
      a: b.String(),
      b: b.Number(),
    })
    .hash256();

  expect(objectHash).toMatch(/^[0-9a-f]{64}$/);
  expect(objectHash).toBe(
    b
      .Object({
        b: b.Number(),
        a: b.String(),
      })
      .hash256(),
  );
  expect(
    b
      .Object({
        z: b.Object({
          b: b.Number(),
          a: b.String(),
        }),
        a: b.Boolean(),
      })
      .hash256(),
  ).toBe(
    b
      .Object({
        a: b.Boolean(),
        z: b.Object({
          a: b.String(),
          b: b.Number(),
        }),
      })
      .hash256(),
  );
  expect(objectHash).toBe(Codecs.ObjCodec.hash256());
  expect(Codecs.ObjCodec.hash256()).toBe(Codecs.ObjCodec2.hash256());
  expect(b.String().hash256()).not.toBe(b.Number().hash256());
  expect(Codecs.RecursiveA.hash256()).toBe(Codecs.RecursiveB.hash256());
  expect(Codecs.MutualA1.hash256()).toBe(Codecs.MutualA2.hash256());
  expect(Codecs.MutualB1.hash256()).toBe(Codecs.MutualB2.hash256());
  expect(Codecs.MutualA1.hash256()).not.toBe(Codecs.RecursiveA.hash256());
});
