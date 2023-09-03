import { buildParsers, registerStringFormat } from "./bff-generated/parser";
import { StringFormat, Formats } from "@beff/cli";

export type NotPublic = {
  a: string;
};
export type User = {
  name: string;
  age: number;
};

export type StartsWithA = StringFormat<"StartsWithA">;
registerStringFormat<StartsWithA>("StartsWithA", (it) => it.startsWith("A"));

export const { StartsWithA, User, Users, NotPublicRenamed } = buildParsers<{
  User: User;
  Users: User[];
  NotPublicRenamed: NotPublic;
  StartsWithA: StartsWithA;
  Password: Formats.Password;
}>();
