import { GET, todo } from "bff";

interface A<T> {
  a: T;
}

export default {
  [`/hello/{id}`]: { get: async (id: string): Promise<A<"string">> => todo() },
};
