import parser from "./bff-generated/parser";
import { StringFormat } from "@beff/cli";

export type NotPublic = {
  a: string;
};
export type User = {
  name: string;
  age: number;
};

export type StartsWithA = StringFormat<"StartsWithA">;

type A = 1 | 2;
type B = 2 | 3;
type D = 4 | 5;
type E = 5 | 6;
export type UnionNested = A | (B | (D | E));
export type Password = StringFormat<"password">;

export const { StartsWithA, User, Users, NotPublicRenamed } =
  parser.buildParsers<{
    User: User;
    Users: User[];
    NotPublicRenamed: NotPublic;
    StartsWithA: StartsWithA;
    Password: Password;
    float: 123.456;
    int: 123;
    union: UnionNested;
  }>();

// type T1 = [string];
// type T2 = string[];

// type X = T1 extends T2 ? true : false;
// type X2 = "abc" extends string ? true : false;

// const a = (): T2 => {
//   const b: T1 = null as any;
//   return b;
// };
