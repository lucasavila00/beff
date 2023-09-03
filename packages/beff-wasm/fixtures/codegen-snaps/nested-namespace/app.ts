import { Ctx } from "@beff/hono";
const todo = () => {
  throw new Error("TODO");
};
namespace X {
  export namespace Y {
    export namespace W {
      export type A = {};
    }
  }
}

export default {
  [`/hello2`]: { get: async (c: Ctx): Promise<X.Y.W.A> => todo() },
};
