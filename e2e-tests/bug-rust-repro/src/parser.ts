import parse from "./generated/parser";
import type { T } from "./barrel";

// ‘

type A = string;

export const { T: CT, A: CA } = parse.buildParsers<{
  T: T;
  A: A;
}>();
