import { buildParsers } from "./bff-generated";

type NotPublic = {
  a: string;
};
type User = {
  name: string;
  age: number;
};

export const { User, Users, NotPublicRenamed } = buildParsers<{
  User: User;
  Users: User[];
  NotPublicRenamed: NotPublic;
}>();

type Ctx = any;
export default {
  [`/{name}`]: {
    get: async (c: Ctx, name: string): Promise<User> => {
      return User.parse({ name, age: 123 });
    },
  },
};
