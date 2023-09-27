import { Ctx } from "@beff/hono";
import { either } from "fp-ts";
export default {
  "/either2": {
    post: async (
      _c: Ctx,
      b: {
        a: either.Either<string, number>;
      }
    ): Promise<either.Either<string, number>> => {
      return b.a;
    },
  },
};
