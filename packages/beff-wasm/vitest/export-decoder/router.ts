// import { StartsWithA, User } from "./parser";

type User = {
  name: string;
  age: number;
};
type Ctx = any;
export default {
  [`/{name}`]: {
    get: async (c: Ctx, name: string): Promise<User> => {
      return {
        name,
        age: 123,
      };
      // return User.parse({ name, age: 123 });
    },
  },
  ["/check-uuid/{uuid}"]: {
    get: async (c: Ctx, uuid: string): Promise<string> => {
      return "";
      // return StartsWithA.parse(uuid);
    },
  },
};
