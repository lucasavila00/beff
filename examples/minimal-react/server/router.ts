import { Ctx } from "@beff/hono";
import { cors } from "hono/cors";
export default {
  "/greeting": {
    use: [cors()],
    get: (c: Ctx, name?: string): { text: string } => ({
      text: `Hello ${name ?? "world"}!`,
    }),
  },
};
