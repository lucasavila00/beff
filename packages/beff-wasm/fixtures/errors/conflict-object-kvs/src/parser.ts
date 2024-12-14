import parse from "./generated/parser";
type A = { a: string };
type A2 = { a: number; b: number };
type IX3 = A & A2;

parse.buildParsers<{ IX3: Omit<IX3, "a"> }>();
