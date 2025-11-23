import parse from "./generated/parser";

type X = Record<string, string>;
type Y = { a: string };

export type User = {
  data1: X extends Y ? string : number;
  data2: Y extends X ? string : number;
};

export const { User } = parse.buildParsers<{ User: User }>();
