import parse from "./generated/parser";

enum AccessLevel {
  ADMIN = "ADMIN",
  USER = "USER",
}

export type User = {
  accessLevel: AccessLevel;
  name: string;
  friends: User[];
};

export const { User } = parse.buildParsers<{ User: User }>();
