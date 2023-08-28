import { GET, todo } from "bff";

interface A<T> {
  a: T;
}

export default {
  [GET`/hello/{id}`]: async (id: string): Promise<A<"string">> => todo(),
};
