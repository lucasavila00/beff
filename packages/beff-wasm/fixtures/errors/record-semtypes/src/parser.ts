import parse from "./generated/parser";

enum AccessLevel {
  ADMIN = "ADMIN",
  USER = "USER",
}

type AvatarSize = `${number}x${number}`;
type Extra = Record<string, string>;

export type User = {
  accessLevel: AccessLevel;
  name: string;
  friends: User[];
  avatarSize: AvatarSize;
  extra: Extra[string];
};

export const { User } = parse.buildParsers<{ User: User }>();
