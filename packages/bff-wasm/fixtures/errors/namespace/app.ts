import { GET, todo } from "bff";

namespace X {
  export type A = {};
}

export default {
  [`/hello/{id}`]: { get: async (id: string): Promise<X.A> => todo() },
};
