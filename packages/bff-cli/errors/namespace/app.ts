import { GET, todo } from "bff";

namespace X {
  export type A = {};
}

export default {
  [GET`/hello/{id}`]: async (id: string): Promise<X.A> => todo(),
};
