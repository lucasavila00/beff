import { GET, todo } from "bff";
type ChildUser = {
  id: string;
  user: User;
};
type Ctx = any;
type User = {
  a: string;
  b: number;
  c: boolean;
  c2: boolean[];
  d: User[];
  childUser?: ChildUser;
  thisUser?: User;
  thisUser2?: { user: User };
  union: string | number;
  unionWithNull: ChildUser[] | number | null;
  e: any;
  f?: any;
  g: "a";
  h: "a" | "b" | "c";
  i: { a: 1 } & { b: 2 };
};
export default {
  [`/{id}`]: { get: async (ctx: Ctx, id: string): Promise<User> => todo() },
};
