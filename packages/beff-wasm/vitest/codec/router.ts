import { Ctx } from "@beff/hono";

export default {
  ["/hello"]: {
    post: async (
      _c: Ctx,
      b: {
        a: Date;
      }
    ): Promise<Date> => {
      return b.a;
    },
    get: async (_c: Ctx, a: Date): Promise<Date> => {
      return a;
    },
  },
};
