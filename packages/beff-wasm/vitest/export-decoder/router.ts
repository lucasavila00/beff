import { StartsWithA, User } from "./parser";

type Ctx = any;
export default {
  "/{name}": {
    get: async (c: Ctx, name: string): Promise<User> => {
      return User.parse({
        name,
        age: 123,
        createdAt: new Date("2023-09-22T22:29:39.488Z"),
      });
    },
  },
  "/check-uuid/{uuid}": {
    get: async (c: Ctx, uuid: string): Promise<StartsWithA> => {
      return StartsWithA.parse(uuid);
    },
  },
  "/now": {
    get: (): Date => new Date("2023-09-22T22:29:39.488Z"),
  },
};
