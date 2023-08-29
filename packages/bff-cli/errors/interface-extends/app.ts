import { GET, todo } from "bff";

interface A {
  a: string;
}

interface B extends A {
  b: string;
}

export default {
  [`/hello/{id}`]: { get: async (id: string): Promise<B> => todo() },
};
