import parse from "./generated/parser";

type T1 = string;
type T2 = any;
type T3 = null;
export const Codecs = parse.buildParsers<{
  T1: T1;
  T2: T2;
  T3: T3;
}>();
