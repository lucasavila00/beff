import { buildParsers } from "./bff-generated";

type OnlyInDecoders = {
  a: string;
};

type User = {
  name: string;
  age: number;
};

export const { User, Users, OnlyInDecodersRenamed } = buildParsers<{
  User: User;
  Users: User[];
  OnlyInDecodersRenamed: OnlyInDecoders;
}>();

type Ctx = any;
export default {
  [`/{name}`]: {
    get: async (c: Ctx, name: string): Promise<User> => {
      return User.parse({ name, age: 123 });
    },
  },
};
