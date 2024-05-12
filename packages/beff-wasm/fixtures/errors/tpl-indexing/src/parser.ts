import parse from "./generated/parser";
export type IX = `a${string}b${number}c`;
type IX2 = { a: string };
//@ts-ignore
type IX3 = IX2[IX];
parse.buildParsers<{ IX3: IX3 }>();
