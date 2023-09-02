import { buildParsers, registerStringFormat } from "./bff-generated";
import { StringFormat } from "bff-types";

type NotPublic = {
  a: string;
};
type User = {
  name: string;
  age: number;
};

type UuidV4 = StringFormat<"UuidV4">;
registerStringFormat<UuidV4>("UuidV4", (it) => true);

export const { UuidV4, User, Users, NotPublicRenamed } = buildParsers<{
  User: User;
  Users: User[];
  NotPublicRenamed: NotPublic;
  // UuidV4: UuidV4;
}>();

type Ctx = any;
export default {
  [`/{name}`]: {
    get: async (c: Ctx, name: string): Promise<User> => {
      return User.parse({ name, age: 123 });
    },
  },
  // ["/check-uuid/{uuid}"]: {
  //   get: async (c: Ctx, uuid: string): Promise<UuidV4> => {
  //     return UuidV4.parse(uuid);
  //   },
  // },
};
