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
  "/bigint": {
    post: async (
      _c: Ctx,
      b: {
        a: bigint;
      }
    ): Promise<bigint> => {
      return b.a;
    },
    get: async (_c: Ctx, a: 1n): Promise<1n> => {
      return a;
    },
  },
};
