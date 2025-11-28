import parser from "./bff-generated/parser";

type X = Record<string, string>;
type Y = { a: string };

export type User = {
  data1: X extends Y ? string : number;
  data2: Y extends X ? string : number;
};

export const { User } = parser.buildParsers<{ User: User }>();
