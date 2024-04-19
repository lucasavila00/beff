import parse from "./generated/parser";

export enum AccessLevel {
  ADMIN = "ADMIN",
  USER = "USER",
}

type AvatarSize = `${number}x${number}`;
export type Extra = Record<string, string>;

export type User = {
  accessLevel: AccessLevel;
  name: string;
  friends: User[];
  avatarSize: AvatarSize;
  extra: Extra;
};

export type PublicUser = Omit<User, "friends">;

type WithOptionals = {
  optional?: string;
};

type Req = Required<WithOptionals>;

export interface Repro2 {
  useSmallerSizes: boolean;
}

export interface Repro1 {
  sizes?: Repro2;
}

export const { Extra, User, PublicUser, Repro1 } = parse.buildParsers<{
  Extra: Extra;
  User: User;
  PublicUser: PublicUser;
  Req: Req;
  Repro1: Repro1;
}>();
