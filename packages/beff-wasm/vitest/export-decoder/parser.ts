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

export const { User, Users, NotPublicRenamed, StartsWithA, Password } =
  parser.buildParsers<{
    User: User;
    Users: User[];
    NotPublicRenamed: NotPublic;
    StartsWithA: StartsWithA;
    Password: Formats.Password;
  }>();
