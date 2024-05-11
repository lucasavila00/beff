import parse from "./generated/parser";

export type IX = string | IX[];
type IX2 = IX[0];
parse.buildParsers<{ IX2: IX2 }>();
