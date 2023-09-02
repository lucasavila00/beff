import { buildParsers } from "./bff-generated";

type User = {
  name: string;
};

export const { User } = buildParsers<{ User: User }>();
type Ctx = any;
export default {
  [`/{name}`]: {
    get: async (c: Ctx, name: string): Promise<User> => {
      return User.parse({ name });
    },
  },
};
