import { buildParsers, registerStringFormat } from "./bff-generated";
import { StringFormat, Formats } from "../../../beff-cli";

type NotPublic = {
  a: string;
};
type User = {
  name: string;
  age: number;
};

type StartsWithA = StringFormat<"StartsWithA">;
registerStringFormat<StartsWithA>("StartsWithA", (it) => it.startsWith("A"));

export const { StartsWithA, User, Users, NotPublicRenamed } = buildParsers<{
  User: User;
  Users: User[];
  NotPublicRenamed: NotPublic;
  StartsWithA: StartsWithA;
  Password: Formats.Password;
}>();

type Ctx = any;
export default {
  [`/{name}`]: {
    get: async (c: Ctx, name: string): Promise<User> => {
      return User.parse({ name, age: 123 });
    },
  },
  ["/check-uuid/{uuid}"]: {
    get: async (c: Ctx, uuid: string): Promise<StartsWithA> => {
      return StartsWithA.parse(uuid);
    },
  },
};
