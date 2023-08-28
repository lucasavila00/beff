import { GET } from "bff";

type B = { c: string };
type A = {
  a: B;
};

export default {
  [GET`/hello/{id}`]: async (id: A): Promise<string> => `Hello ${id}!`,
};
