import parse from "./generated/parser";

export type User = {
  name: string;
  friends: User[];
};

export const { User } = parse.buildParsers<{ User: User }>();
