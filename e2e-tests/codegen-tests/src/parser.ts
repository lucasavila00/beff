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
}>();
