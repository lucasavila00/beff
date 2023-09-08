import { Ctx } from "@beff/hono";
import { cors } from "hono/cors";

export default {
  "/*": {
    use: [cors()],
  },
  "/greeting": {
    get: (_c: Ctx, name?: string): { text: string } => ({
      text: `Hello ${name ?? "world"}!`,
    }),
  },
  "/sum": {
    get: (_c: Ctx, a: number, b: number): { result: number } => ({
      result: a + b,
    }),
  },
};
