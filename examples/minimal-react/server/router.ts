import { Ctx } from "@beff/hono";
import { cors } from "hono/cors";

type A = {
  a: string;
};

export default {
  "/*": {
    use: [cors()],
  },
  "/greeting": {
    get: (c: Ctx, name?: string): { text: string } => ({
      text: `Hello ${name ?? "world"}!`,
    }),
  },
  "/sum": {
    get: (c: Ctx, a: number, b: number): { result: number } => ({
      result: a + b,
    }),
  },
};
