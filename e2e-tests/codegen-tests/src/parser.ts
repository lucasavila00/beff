import parse from "./generated/parser";

type AliasToString = string;

export const Codecs = parse.buildParsers<{
  Dec: string;
  AliasToString: AliasToString;
}>();
