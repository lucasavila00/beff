import { buildDecoders } from "./bff-generated";

type User = {
  name: string;
};

export const { User } = buildDecoders<{ User: User }>();

export default {
  [`GET/{name}`]: async (name: string): Promise<User> => {
    return User.parse({ name });
  },
};
