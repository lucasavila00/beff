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
  extra: Extra;
};

export type PublicUser = Omit<User, "friends">;

export const { User, PublicUser } = parse.buildParsers<{ User: User; PublicUser: PublicUser }>();
