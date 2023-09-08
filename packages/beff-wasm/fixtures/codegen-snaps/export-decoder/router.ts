import {
  registerStringFormat,
  StartsWithA,
  UnionNested as UnionNestedNamed,
  User,
  StringFormat,
} from "./parser";

export type Password = StringFormat<"password">;
registerStringFormat("password", () => true);
type Ctx = any;
export default {
  [`/{name}`]: {
    get: async (c: Ctx, name: string): Promise<User> => {
      return User.parse({ name, age: 123 });
    },
  },
  ["/check-uuid/{uuid}"]: {
    get: async (c: Ctx, uuid: string, p: Password): Promise<StartsWithA> => {
      return StartsWithA.parse(uuid);
    },
  },
  [`/UnionNested`]: {
    get: async (c: Ctx): Promise<UnionNestedNamed> => {
      throw new Error();
    },
  },
  [`/UnionNestedInline`]: {
    get: async (c: Ctx): Promise<(1 | 2) | ((2 | 3) | (4 | 5) | (5 | 6))> => {
      throw new Error();
    },
  },
};
