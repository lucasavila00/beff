import parse from "./generated/parser";

type AliasToString = string;
type AliasToNumber = number;
type AliasToBoolean = boolean;
type AliasToNull = null;
type AliasToAny = any;
type AliasToConst = "constant value";

export const Codecs = parse.buildParsers<{
  Dec: string;
  AliasToString: AliasToString;
  AliasToNumber: AliasToNumber;
  AliasToBoolean: AliasToBoolean;
  AliasToNull: AliasToNull;
  AliasToAny: AliasToAny;
  AliasToConst: AliasToConst;
}>();
