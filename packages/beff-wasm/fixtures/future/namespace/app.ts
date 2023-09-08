import { Ctx } from "@beff/hono";
import { Y } from "./t2";
const todo = () => {
  throw new Error("TODO");
};
namespace X {
  export type A = {};
}

export default {
  "/hello/{id}": { get: async (c: Ctx, id: string): Promise<X.A> => todo() },
  "/hello2": { get: async (c: Ctx): Promise<Y.B> => todo() },
};
