import parse from "./generated/parser";

type AliasToString = string;
type AliasToNumber = number;
type AliasToBoolean = boolean;
type AliasToNull = null;
type AliasToAny = any;
type AliasToConst = "constant value";

type TestHoist = {
  a: string[];
  b: string[];
};

export type BeforeRequired = {
  a: string;
  b: string | undefined;
  c: string | void;
  d: string | null;
  e?: string;
};

export type AfterRequired = Required<BeforeRequired>;

export type R = { a: number; b: number; [key: `x_${string}`]: number };
export type R2 = { [K in "a" | "b"]: number };
export type R3 = { [K in "a" | "b"]?: number };
export type R4 = { [K in `x_${string}`]: number };
export type R5 = { [K in `x_${string}`]?: number };

export type MetaKey = "alpha" | "beta" | `alpha_entity_${string}` | `beta-entity-${string}`;
export type Meta = Partial<Record<MetaKey, string>>;
export type Meta2 = Record<MetaKey, string>;

export const Codecs = parse.buildParsers<{
  Dec: string;
  AliasToString: AliasToString;
  AliasToNumber: AliasToNumber;
  AliasToBoolean: AliasToBoolean;
  AliasToNull: AliasToNull;
  AliasToAny: AliasToAny;
  AliasToConst: AliasToConst;
  TestHoist: TestHoist;
  BeforeRequired: BeforeRequired;
  AfterRequired: AfterRequired;
  R: R;
  R2: R2;
  R3: R3;
  R4: R4;
  R5: R5;
  Meta: Meta;
  Meta2: Meta2;
}>();
