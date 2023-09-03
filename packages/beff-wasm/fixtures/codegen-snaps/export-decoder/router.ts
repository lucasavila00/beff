import { Formats } from "@beff/cli";
import { StartsWithA, User } from "./parser";

type Ctx = any;
export default {
  [`/{name}`]: {
    get: async (c: Ctx, name: string): Promise<User> => {
      return User.parse({ name, age: 123 });
    },
  },
  ["/check-uuid/{uuid}"]: {
    get: async (
      c: Ctx,
      uuid: string,
      p: Formats.Password
    ): Promise<StartsWithA> => {
      return StartsWithA.parse(uuid);
    },
  },
};
