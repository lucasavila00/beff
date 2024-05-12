import parse from "./generated/parser";

// ‘

type A = string;
export const { A } = parse.buildParsers<{
  A: A;
}>();
