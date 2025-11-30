import parse from "./generated/parser";
import { UserList } from "./types";
type User = {
  a: string;
};

type UserObj = {
  x: User;
};

export const Codecs = parse.buildParsers<{ UserObj: UserObj; UserList: UserList }>();
