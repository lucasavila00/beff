import parser from "./bff-generated/parser";
import { StringFormat, Formats } from "@beff/cli";

export type NotPublic = {
  a: string;
};
export type User = {
  name: string;
  age: number;
};

export type StartsWithA = StringFormat<"StartsWithA">;
parser.registerStringFormat<StartsWithA>("StartsWithA", (it) =>
  it.startsWith("A")
);
type A = 1 | 2;
type B = 2 | 3;
type D = 4 | 5;
type E = 5 | 6;
export type UnionNested = A | (B | (D | E));

export const { StartsWithA, User, Users, NotPublicRenamed } =
  parser.buildParsers<{
    User: User;
    Users: User[];
    NotPublicRenamed: NotPublic;
    StartsWithA: StartsWithA;
    Password: Formats.Password;
    float: 123.456;
    int: 123;
    union: UnionNested;
  }>();
