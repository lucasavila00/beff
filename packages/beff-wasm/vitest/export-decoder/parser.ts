import parser from "./bff-generated/parser";
import { StringFormat } from "@beff/cli";
export type NotPublic = {
  a: string;
};
export type User = {
  name: string;
  age: number;
  createdAt: Date;
};

export type StartsWithA = StringFormat<"StartsWithA">;

export type Password = StringFormat<"Password">;

export const { User, Users, NotPublicRenamed, StartsWithA, Password } = parser.buildParsers<{
  User: User;
  Users: User[];
  NotPublicRenamed: NotPublic;
  StartsWithA: StartsWithA;
  Password: Password;
}>();
