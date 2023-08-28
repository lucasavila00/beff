import { GET, todo } from "bff";

type A = {
  a: `Hello ${string}!`;
};

export default {
  [GET`/hello/{id}`]: async (id: string): Promise<A> => todo(),
};
