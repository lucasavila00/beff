import { GET, todo } from "bff";

type A = {
  a: `Hello ${string}!`;
};

export default {
  [`/hello/{id}`]: { get: async (c: Ctx, id: string): Promise<A> => todo() },
};
