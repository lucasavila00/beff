import { GET, todo } from "bff";

type A = {
  a: `Hello ${string}!`;
};

export default {
  [`/hello/{id}`]: { get: async (id: string): Promise<A> => todo() },
};
